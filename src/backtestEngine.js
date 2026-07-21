// ══════════════════════════════════════════════════════════════════
// Moteur de backtest 100% déterministe sur données réelles (candles M1
// téléchargées via historicalData.js). AUCUNE IA ici — détection de
// signaux par règles géométriques/mathématiques classiques, comme
// convenu dans l'analyse de faisabilité (les styles fiables à coder :
// breakout, indicateurs, momentum — pullback/SMC-ICT volontairement
// exclus de cette v1, trop subjectifs pour un algo fiable).
// ══════════════════════════════════════════════════════════════════

const PIP_SIZE = { EURUSD: 0.0001, GBPUSD: 0.0001, USDJPY: 0.01, XAUUSD: 0.1 };

// ══════════════════════════════════════════════════════════════════
// PRÉPARATION DES DONNÉES — agrégation timeframe, filtres date/session/news.
// Tout est calculé à partir des VRAIS timestamps des bougies M1, aucune
// donnée inventée.
// ══════════════════════════════════════════════════════════════════

// Agrège des bougies M1 en un timeframe plus large (M5, M15, H1, H4, D1)
export function aggregateCandles(candles, minutesPerCandle) {
  if (minutesPerCandle <= 1) return candles;
  const out = [];
  for (let i = 0; i < candles.length; i += minutesPerCandle) {
    const chunk = candles.slice(i, i + minutesPerCandle);
    if (!chunk.length) continue;
    const ts = chunk[0][0];
    const open = chunk[0][1];
    const close = chunk[chunk.length - 1][4];
    const high = Math.max(...chunk.map(c => c[2]));
    const low = Math.min(...chunk.map(c => c[3]));
    out.push([ts, open, high, low, close]);
  }
  return out;
}

export const TIMEFRAMES = [
  { key: "1", label: "M1", minutes: 1 },
  { key: "5", label: "M5", minutes: 5 },
  { key: "15", label: "M15", minutes: 15 },
  { key: "60", label: "H1", minutes: 60 },
  { key: "240", label: "H4", minutes: 240 },
  { key: "1440", label: "D1", minutes: 1440 },
];

// Filtre par plage de dates (timestamps ms inclusifs)
export function filterByDateRange(candles, startTs, endTs) {
  if (!startTs && !endTs) return candles;
  return candles.filter(c => (!startTs || c[0] >= startTs) && (!endTs || c[0] <= endTs));
}

export const SESSIONS = [
  { key: "24h", label: "24h/24h", hours: null },
  { key: "asia", label: "Session Asie", hours: [0, 8] },
  { key: "london", label: "Session Londres", hours: [8, 16] },
  { key: "ny", label: "Session New York", hours: [13, 21] },
  { key: "london_ny", label: "Londres + New York", hours: [8, 21] },
];

// Une bougie est "tradable" si son heure UTC tombe dans la fenêtre de session
function isInSession(ts, sessionKey) {
  const s = SESSIONS.find(x => x.key === sessionKey);
  if (!s || !s.hours) return true;
  const h = new Date(ts).getUTCHours();
  return h >= s.hours[0] && h < s.hours[1];
}

// Filtre "news" — HEURISTIQUE, pas un calendrier économique réel (l'app n'a
// pas encore de source de dates exactes d'annonces passées). Évite les
// horaires récurrents où NFP/FOMC/CPI tombent historiquement le plus souvent
// (1er vendredi du mois ~12:30 UTC, mercredis FOMC ~18:00 UTC). Clairement
// affiché comme estimation dans l'UI — pas présenté comme une donnée fiable.
function isLikelyNewsWindow(ts) {
  const d = new Date(ts);
  const day = d.getUTCDay(); // 0=Dim..6=Sam
  const hour = d.getUTCHours();
  const dateOfMonth = d.getUTCDate();
  const isFirstFriday = day === 5 && dateOfMonth <= 7;
  const isNFPWindow = isFirstFriday && hour === 12;
  const isFOMCWindow = day === 3 && hour === 18 && dateOfMonth >= 8 && dateOfMonth <= 21; // 2e/3e mercredi, approx
  const isCPIWindow = (day === 2 || day === 3) && hour === 12 && dateOfMonth >= 8 && dateOfMonth <= 15;
  return isNFPWindow || isFOMCWindow || isCPIWindow;
}

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

function signalsMACD(candles, fast = 12, slow = 26, signalP = 9) {
  const closes = candles.map(c => c[4]);
  const { macdLine, signalLine } = computeMACD(closes, fast, slow, signalP);
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
  breakout: {
    label: "Breakout",
    defaultParams: { period: 20 },
    paramDefs: [{ key: "period", label: "Périodes de référence", min: 5, max: 60, step: 1 }],
    fn: (c, p) => signalsBreakout(c, p.period),
  },
  rsi: {
    label: "RSI (survente/surachat)",
    defaultParams: { period: 14, oversold: 30, overbought: 70 },
    paramDefs: [
      { key: "period", label: "Période RSI", min: 5, max: 30, step: 1 },
      { key: "oversold", label: "Seuil survente", min: 10, max: 40, step: 1 },
      { key: "overbought", label: "Seuil surachat", min: 60, max: 90, step: 1 },
    ],
    fn: (c, p) => signalsRSI(c, p.period, p.oversold, p.overbought),
  },
  macd: {
    label: "Croisement MACD",
    defaultParams: { fast: 12, slow: 26, signal: 9 },
    paramDefs: [
      { key: "fast", label: "EMA rapide", min: 5, max: 20, step: 1 },
      { key: "slow", label: "EMA lente", min: 15, max: 50, step: 1 },
      { key: "signal", label: "Ligne signal", min: 5, max: 15, step: 1 },
    ],
    fn: (c, p) => signalsMACD(c, p.fast, p.slow, p.signal),
  },
};

// ── Simulateur de trades : un signal ouvre un trade (si aucun en cours),
//    sorti sur TP/SL fixe en pips. SL vérifié en priorité (biais conservateur
//    si TP et SL sont touchés dans la même bougie). Position sizing en $
//    RÉEL (risque % du capital COURANT, compounding comme le Simulateur). ──
export function runBacktest({
  candles, pair, strategyKey, tpPips = 15, slPips = 10, strategyParams = null,
  capital = 10000, riskPct = 1, slippagePips = 0.2, sessionKey = "24h", newsFilterOn = false,
}) {
  const strategy = STRATEGIES[strategyKey];
  if (!strategy) throw new Error("Stratégie inconnue: " + strategyKey);
  if (!candles || candles.length < 50) throw new Error("Pas assez de données (minimum 50 bougies).");

  const pip = PIP_SIZE[pair] || 0.0001;
  const params = { ...strategy.defaultParams, ...(strategyParams || {}) };
  const signals = strategy.fn(candles, params);
  // Coût réel par trade (spread + slippage), retiré du résultat de chaque trade
  const costPips = slippagePips;

  const trades = [];
  let inTrade = null;
  let equity = capital;

  for (let i = 0; i < candles.length; i++) {
    const [ts, , high, low, close] = candles[i];
    const tradableNow = isInSession(ts, sessionKey) && (!newsFilterOn || !isLikelyNewsWindow(ts));

    if (inTrade) {
      const { dir, entryPrice, tp, sl, entryIdx, riskUSD, dollarPerPip } = inTrade;
      const hitSL = dir === "long" ? low <= sl : high >= sl;
      const hitTP = dir === "long" ? high >= tp : low <= tp;
      if (hitSL || hitTP) {
        const win = hitTP && !hitSL;
        const pipsGross = win ? tpPips : -slPips;
        const pipsNet = pipsGross - costPips; // coût appliqué à chaque trade, gagnant ou perdant
        const pnlUSD = +(pipsNet * dollarPerPip).toFixed(2);
        equity += pnlUSD;
        trades.push({ entryIdx, exitIdx: i, dir, entryPrice, exitPrice: win ? tp : sl, pips: +pipsNet.toFixed(2), pnlUSD, win, duration: i - entryIdx, entryTs: candles[entryIdx][0] });
        inTrade = null;
      }
    }

    if (!inTrade && signals[i] && tradableNow) {
      const dir = signals[i];
      const entryPrice = close;
      const tp = dir === "long" ? entryPrice + tpPips * pip : entryPrice - tpPips * pip;
      const sl = dir === "long" ? entryPrice - slPips * pip : entryPrice + slPips * pip;
      const riskUSD = equity * (riskPct / 100);
      const dollarPerPip = riskUSD / slPips; // taille de position dérivée du risque courant (compounding)
      inTrade = { dir, entryPrice, tp, sl, entryIdx: i, riskUSD, dollarPerPip };
    }
  }

  const wins = trades.filter(t => t.win).length;
  const losses = trades.length - wins;
  const winrate = trades.length ? (wins / trades.length) * 100 : 0;
  const totalPips = +trades.reduce((s, t) => s + t.pips, 0).toFixed(1);
  const totalUSD = +trades.reduce((s, t) => s + t.pnlUSD, 0).toFixed(2);
  const grossWinPips = trades.filter(t => t.win).reduce((s, t) => s + t.pips, 0);
  const grossLossPips = Math.abs(trades.filter(t => !t.win).reduce((s, t) => s + t.pips, 0));
  const profitFactor = grossLossPips > 0 ? +(grossWinPips / grossLossPips).toFixed(2) : (grossWinPips > 0 ? Infinity : 0);
  const expectancy = trades.length ? +(totalPips / trades.length).toFixed(2) : 0;
  const avgWinPips = wins ? +(grossWinPips / wins).toFixed(1) : 0;
  const avgLossPips = losses ? +(grossLossPips / losses).toFixed(1) : 0;
  const rRatio = avgLossPips > 0 ? +(avgWinPips / avgLossPips).toFixed(2) : 0;
  const avgDuration = trades.length ? Math.round(trades.reduce((s, t) => s + t.duration, 0) / trades.length) : 0;

  // Courbes d'équité (pips ET $, un point par trade clôturé)
  let runningPips = 0, runningUSD = capital;
  const equityCurve = [{ x: 0, y: 0, usd: capital }];
  trades.forEach((t, i) => {
    runningPips += t.pips; runningUSD += t.pnlUSD;
    equityCurve.push({ x: i + 1, y: +runningPips.toFixed(1), usd: +runningUSD.toFixed(2) });
  });

  // Séries consécutives
  let maxLossStreak = 0, curLossStreak = 0, maxWinStreak = 0, curWinStreak = 0;
  trades.forEach(t => {
    if (t.win) { curWinStreak++; curLossStreak = 0; maxWinStreak = Math.max(maxWinStreak, curWinStreak); }
    else { curLossStreak++; curWinStreak = 0; maxLossStreak = Math.max(maxLossStreak, curLossStreak); }
  });

  // Drawdown max (pips ET $/%), pire creux depuis un sommet
  let peakPips = 0, maxDDPips = 0, peakUSD = capital, maxDDUSD = 0;
  equityCurve.forEach(pt => {
    peakPips = Math.max(peakPips, pt.y); maxDDPips = Math.max(maxDDPips, peakPips - pt.y);
    peakUSD = Math.max(peakUSD, pt.usd); maxDDUSD = Math.max(maxDDUSD, peakUSD - pt.usd);
  });
  const maxDDPct = peakUSD > 0 ? +((maxDDUSD / peakUSD) * 100).toFixed(2) : 0;

  // Répartition long/short
  const longs = trades.filter(t => t.dir === "long");
  const shorts = trades.filter(t => t.dir === "short");
  const longWinrate = longs.length ? +((longs.filter(t => t.win).length / longs.length) * 100).toFixed(1) : null;
  const shortWinrate = shorts.length ? +((shorts.filter(t => t.win).length / shorts.length) * 100).toFixed(1) : null;

  // Répartition par jour de semaine (calculée sur les VRAIS timestamps des trades — sert au diagnostic)
  const DOW_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const byDow = DOW_LABELS.map((label, dow) => {
    const dowTrades = trades.filter(t => new Date(t.entryTs).getUTCDay() === dow);
    const dowWins = dowTrades.filter(t => t.win).length;
    return { label, count: dowTrades.length, winrate: dowTrades.length ? +((dowWins / dowTrades.length) * 100).toFixed(1) : null };
  });

  return {
    strategyLabel: strategy.label,
    paramsUsed: params,
    totalTrades: trades.length,
    wins, losses, winrate: +winrate.toFixed(1),
    totalPips, totalUSD, capital, finalEquity: +(capital + totalUSD).toFixed(2),
    totalPct: +((totalUSD / capital) * 100).toFixed(2),
    profitFactor, rRatio,
    expectancy, avgWinPips, avgLossPips, avgDuration,
    maxLossStreak, maxWinStreak,
    maxDrawdownPips: +maxDDPips.toFixed(1), maxDrawdownUSD: +maxDDUSD.toFixed(2), maxDrawdownPct: maxDDPct,
    longCount: longs.length, shortCount: shorts.length, longWinrate, shortWinrate,
    byDow,
    equityCurve,
    trades,
    candleCount: candles.length,
    dateRange: candles.length ? [candles[0][0], candles[candles.length - 1][0]] : null,
  };
}

// ── Score PropFirm + Probabilité de réussite — réutilise le VRAI moteur de
// simulation du Simulateur (simulatePhase/simulateFunded via Monte Carlo),
// alimenté par le winrate/RR EMPIRIQUES du backtest. Zéro donnée inventée :
// soit le calcul tourne sur les vraies stats du backtest, soit il est absent. ──
export function computePropFirmScore(backtestResult, capital, firmKey, modelKey, monteCarloFn) {
  if (!backtestResult || backtestResult.totalTrades < 10) return null; // échantillon trop faible pour être honnête
  const spanMs = backtestResult.dateRange[1] - backtestResult.dateRange[0];
  const spanDays = Math.max(1, spanMs / 86400000);
  const tradesPerDay = Math.max(0.2, +(backtestResult.totalTrades / spanDays).toFixed(2));
  const mcParams = {
    tradesPerDay,
    riskPct: 1, // le risque du CHALLENGE est indépendant du risque utilisé pendant le backtest lui-même
    rr: Math.max(0.3, backtestResult.rRatio || 1),
    winrate: backtestResult.winrate,
    clustering: backtestResult.maxLossStreak >= 6 ? 40 : backtestResult.maxLossStreak >= 4 ? 20 : 5,
  };
  const mc = monteCarloFn(mcParams, capital, firmKey, modelKey, 80);
  // Score composite 0-100 : passage MC (poids fort) + PF + maîtrise du drawdown
  const pfScore = Math.min(100, (backtestResult.profitFactor === Infinity ? 100 : backtestResult.profitFactor / 2) * 50);
  const ddScore = Math.max(0, 100 - backtestResult.maxDrawdownPct * 4);
  const score = Math.round(mc.passRate * 0.55 + pfScore * 0.25 + ddScore * 0.20);
  return { score: Math.max(0, Math.min(100, score)), passRate: mc.passRate, ruinRate: mc.ruinRate, mcParams };
}



export function listStrategies() {
  return Object.entries(STRATEGIES).map(([key, v]) => ({ key, label: v.label, defaultParams: v.defaultParams, paramDefs: v.paramDefs }));
}
