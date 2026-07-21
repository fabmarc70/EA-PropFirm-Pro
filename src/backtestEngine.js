// ══════════════════════════════════════════════════════════════════
// Moteur de backtest 100% déterministe sur données réelles (candles M1
// téléchargées via historicalData.js). AUCUNE IA ici — détection de
// signaux par règles géométriques/mathématiques classiques, comme
// convenu dans l'analyse de faisabilité (les styles fiables à coder :
// breakout, indicateurs, momentum — pullback/SMC-ICT volontairement
// exclus de cette v1, trop subjectifs pour un algo fiable).
// ══════════════════════════════════════════════════════════════════

const PIP_SIZE = { EURUSD: 0.0001, GBPUSD: 0.0001, USDJPY: 0.01, XAUUSD: 0.1 };

// ── Indicateurs ──
function computeRSI(closes, period = 14) {
  const rsi = new Array(closes.length).fill(null);
  let gainSum = 0, lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gainSum += diff; else lossSum -= diff;
  }
  let avgGain = gainSum / period, avgLoss = lossSum / period;
  rsi[period] = 100 - 100 / (1 + (avgLoss === 0 ? Infinity : avgGain / avgLoss));
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0, loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi[i] = 100 - 100 / (1 + (avgLoss === 0 ? Infinity : avgGain / avgLoss));
  }
  return rsi;
}

function computeEMA(values, period) {
  const k = 2 / (period + 1);
  const ema = new Array(values.length).fill(null);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    ema[i] = prev;
  }
  return ema;
}

function computeMACD(closes, fast = 12, slow = 26, signalP = 9) {
  const emaFast = computeEMA(closes, fast);
  const emaSlow = computeEMA(closes, slow);
  const macdLine = closes.map((_, i) => (emaFast[i] != null && emaSlow[i] != null) ? emaFast[i] - emaSlow[i] : null);
  const validMacd = macdLine.filter(v => v != null);
  const signalRaw = computeEMA(validMacd, signalP);
  // Réaligner la ligne signal sur les indices d'origine
  const signalLine = new Array(closes.length).fill(null);
  let vi = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] != null) { signalLine[i] = signalRaw[vi] ?? null; vi++; }
  }
  return { macdLine, signalLine };
}

// ── Générateurs de signaux (chacun renvoie un tableau de même longueur que candles : null | "long" | "short") ──
function signalsBreakout(candles, period = 20) {
  const closes = candles.map(c => c[4]);
  const highs = candles.map(c => c[2]);
  const lows = candles.map(c => c[3]);
  const signals = new Array(candles.length).fill(null);
  for (let i = period; i < candles.length; i++) {
    const hh = Math.max(...highs.slice(i - period, i));
    const ll = Math.min(...lows.slice(i - period, i));
    if (closes[i] > hh) signals[i] = "long";
    else if (closes[i] < ll) signals[i] = "short";
  }
  return signals;
}

function signalsRSI(candles, period = 14, oversold = 30, overbought = 70) {
  const closes = candles.map(c => c[4]);
  const rsi = computeRSI(closes, period);
  const signals = new Array(candles.length).fill(null);
  for (let i = 1; i < candles.length; i++) {
    if (rsi[i - 1] == null || rsi[i] == null) continue;
    if (rsi[i - 1] <= oversold && rsi[i] > oversold) signals[i] = "long";
    else if (rsi[i - 1] >= overbought && rsi[i] < overbought) signals[i] = "short";
  }
  return signals;
}

function signalsMACD(candles) {
  const closes = candles.map(c => c[4]);
  const { macdLine, signalLine } = computeMACD(closes);
  const signals = new Array(candles.length).fill(null);
  for (let i = 1; i < candles.length; i++) {
    if (macdLine[i - 1] == null || signalLine[i - 1] == null || macdLine[i] == null || signalLine[i] == null) continue;
    const prevDiff = macdLine[i - 1] - signalLine[i - 1];
    const currDiff = macdLine[i] - signalLine[i];
    if (prevDiff <= 0 && currDiff > 0) signals[i] = "long";
    else if (prevDiff >= 0 && currDiff < 0) signals[i] = "short";
  }
  return signals;
}

const STRATEGIES = {
  breakout: { label: "Breakout (20 périodes)", fn: (c) => signalsBreakout(c, 20) },
  rsi: { label: "RSI (survente/surachat 30/70)", fn: (c) => signalsRSI(c, 14, 30, 70) },
  macd: { label: "Croisement MACD", fn: (c) => signalsMACD(c) },
};

// ── Simulateur de trades : un signal ouvre un trade (si aucun en cours),
//    sorti sur TP/SL fixe en pips. SL vérifié en priorité (biais conservateur
//    si TP et SL sont touchés dans la même bougie). ──
export function runBacktest({ candles, pair, strategyKey, tpPips = 15, slPips = 10 }) {
  const strategy = STRATEGIES[strategyKey];
  if (!strategy) throw new Error("Stratégie inconnue: " + strategyKey);
  if (!candles || candles.length < 50) throw new Error("Pas assez de données (minimum 50 bougies).");

  const pip = PIP_SIZE[pair] || 0.0001;
  const signals = strategy.fn(candles);

  const trades = [];
  let inTrade = null;
  let equity = 0; // en pips cumulés

  for (let i = 0; i < candles.length; i++) {
    const [, , high, low, close] = candles[i];

    if (inTrade) {
      const { dir, entryPrice, tp, sl, entryIdx } = inTrade;
      const hitSL = dir === "long" ? low <= sl : high >= sl;
      const hitTP = dir === "long" ? high >= tp : low <= tp;
      if (hitSL || hitTP) {
        const win = hitTP && !hitSL;
        const pips = win ? tpPips : -slPips;
        equity += pips;
        trades.push({ entryIdx, exitIdx: i, dir, entryPrice, exitPrice: win ? tp : sl, pips, win });
        inTrade = null;
      }
    }

    if (!inTrade && signals[i]) {
      const dir = signals[i];
      const entryPrice = close;
      const tp = dir === "long" ? entryPrice + tpPips * pip : entryPrice - tpPips * pip;
      const sl = dir === "long" ? entryPrice - slPips * pip : entryPrice + slPips * pip;
      inTrade = { dir, entryPrice, tp, sl, entryIdx: i };
    }
  }

  const wins = trades.filter(t => t.win).length;
  const losses = trades.length - wins;
  const winrate = trades.length ? (wins / trades.length) * 100 : 0;
  const totalPips = trades.reduce((s, t) => s + t.pips, 0);
  const grossWin = trades.filter(t => t.win).reduce((s, t) => s + t.pips, 0);
  const grossLoss = Math.abs(trades.filter(t => !t.win).reduce((s, t) => s + t.pips, 0));
  const profitFactor = grossLoss > 0 ? +(grossWin / grossLoss).toFixed(2) : (grossWin > 0 ? Infinity : 0);

  // Courbe d'équité (cumul en pips, un point par trade clôturé)
  let running = 0;
  const equityCurve = [{ x: 0, y: 0 }, ...trades.map((t, i) => { running += t.pips; return { x: i + 1, y: +running.toFixed(1) }; })];

  // Plus longue série de pertes consécutives (réalisme, pas d'angle mort)
  let maxLossStreak = 0, curStreak = 0;
  trades.forEach(t => { if (!t.win) { curStreak++; maxLossStreak = Math.max(maxLossStreak, curStreak); } else curStreak = 0; });

  return {
    strategyLabel: strategy.label,
    totalTrades: trades.length,
    wins, losses, winrate: +winrate.toFixed(1),
    totalPips: +totalPips.toFixed(1),
    profitFactor,
    maxLossStreak,
    equityCurve,
    trades,
    candleCount: candles.length,
    dateRange: candles.length ? [candles[0][0], candles[candles.length - 1][0]] : null,
  };
}

export function listStrategies() {
  return Object.entries(STRATEGIES).map(([key, v]) => ({ key, label: v.label }));
}
