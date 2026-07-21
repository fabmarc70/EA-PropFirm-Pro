// ══════════════════════════════════════════════════════════════════
// Moteur de backtest 100% déterministe sur données réelles (candles M1
// téléchargées via historicalData.js). AUCUNE IA ici — détection de
// signaux par règles géométriques/mathématiques classiques, comme
// convenu dans l'analyse de faisabilité (les styles fiables à coder :
// breakout, indicateurs, momentum — pullback/SMC-ICT volontairement
// exclus de cette v1, trop subjectifs pour un algo fiable).
// ══════════════════════════════════════════════════════════════════

// Taille de pip/point par instrument. Couvre déjà les majors forex + or (données
// publiées) ET les indices/crypto/matières premières/ETF majeurs (architecture
// prête dès que Fab publie ces données — aucune donnée réelle inventée ici,
// juste la convention de calcul du point pour que le moteur soit correct
// le jour où le dataset existe).
const PIP_SIZE = {
  // Forex majors
  EURUSD: 0.0001, GBPUSD: 0.0001, USDJPY: 0.01, USDCHF: 0.0001, AUDUSD: 0.0001, USDCAD: 0.0001, NZDUSD: 0.0001,
  // Métaux / matières premières
  XAUUSD: 0.1, XAGUSD: 0.01, USOIL: 0.01, UKOIL: 0.01, NATGAS: 0.001,
  // Indices majeurs
  US30: 1, NAS100: 1, SPX500: 0.1, GER40: 1, UK100: 1, JPN225: 1,
  // Crypto majeures
  BTCUSD: 1, ETHUSD: 0.1, SOLUSD: 0.01, XRPUSD: 0.0001,
  // ETF majeurs
  SPY: 0.01, QQQ: 0.01, GLD: 0.01,
};

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

function computeSMA(values, period) {
  const sma = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    sma[i] = sum / period;
  }
  return sma;
}

function computeStdDev(values, period, sma) {
  const std = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    if (sma[i] == null) continue;
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) sumSq += Math.pow(values[j] - sma[i], 2);
    std[i] = Math.sqrt(sumSq / period);
  }
  return std;
}

// Bollinger Bands (MT4/MT5 standard : SMA + N écarts-types)
function computeBollinger(closes, period = 20, mult = 2) {
  const mid = computeSMA(closes, period);
  const std = computeStdDev(closes, period, mid);
  const upper = closes.map((_, i) => (mid[i] != null && std[i] != null) ? mid[i] + mult * std[i] : null);
  const lower = closes.map((_, i) => (mid[i] != null && std[i] != null) ? mid[i] - mult * std[i] : null);
  return { mid, upper, lower };
}

// Stochastic Oscillator (%K lissé + %D)
function computeStochastic(candles, kPeriod = 14, dPeriod = 3) {
  const highs = candles.map(c => c[2]), lows = candles.map(c => c[3]), closes = candles.map(c => c[4]);
  const rawK = new Array(candles.length).fill(null);
  for (let i = kPeriod - 1; i < candles.length; i++) {
    const hh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
    const ll = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
    rawK[i] = hh === ll ? 50 : ((closes[i] - ll) / (hh - ll)) * 100;
  }
  const validK = rawK.filter(v => v != null);
  const dRaw = computeSMA(validK, dPeriod);
  const percentD = new Array(candles.length).fill(null);
  let vi = 0;
  for (let i = 0; i < candles.length; i++) { if (rawK[i] != null) { percentD[i] = dRaw[vi] ?? null; vi++; } }
  return { percentK: rawK, percentD };
}

// ADX + DI (force et direction de tendance — Wilder, standard MT4/MT5)
function computeADX(candles, period = 14) {
  const n = candles.length;
  const plusDM = new Array(n).fill(0), minusDM = new Array(n).fill(0), tr = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const upMove = candles[i][2] - candles[i - 1][2];
    const downMove = candles[i - 1][3] - candles[i][3];
    plusDM[i] = (upMove > downMove && upMove > 0) ? upMove : 0;
    minusDM[i] = (downMove > upMove && downMove > 0) ? downMove : 0;
    tr[i] = Math.max(candles[i][2] - candles[i][3], Math.abs(candles[i][2] - candles[i - 1][4]), Math.abs(candles[i][3] - candles[i - 1][4]));
  }
  const smooth = (arr) => {
    const out = new Array(n).fill(null);
    let sum = arr.slice(1, period + 1).reduce((a, b) => a + b, 0);
    out[period] = sum;
    for (let i = period + 1; i < n; i++) { sum = sum - sum / period + arr[i]; out[i] = sum; }
    return out;
  };
  const trS = smooth(tr), plusS = smooth(plusDM), minusS = smooth(minusDM);
  const plusDI = new Array(n).fill(null), minusDI = new Array(n).fill(null), dx = new Array(n).fill(null);
  for (let i = period; i < n; i++) {
    if (!trS[i]) continue;
    plusDI[i] = (plusS[i] / trS[i]) * 100;
    minusDI[i] = (minusS[i] / trS[i]) * 100;
    const sum = plusDI[i] + minusDI[i];
    dx[i] = sum > 0 ? (Math.abs(plusDI[i] - minusDI[i]) / sum) * 100 : 0;
  }
  const validDx = dx.filter(v => v != null);
  const adxRaw = computeSMA(validDx, period);
  const adx = new Array(n).fill(null);
  let vi = 0;
  for (let i = 0; i < n; i++) { if (dx[i] != null) { adx[i] = adxRaw[vi] ?? null; vi++; } }
  return { adx, plusDI, minusDI };
}

// Ichimoku (Tenkan/Kijun/Senkou standard 9/26/52)
function computeIchimoku(candles, tenkanP = 9, kijunP = 26, senkouP = 52) {
  const highs = candles.map(c => c[2]), lows = candles.map(c => c[3]);
  const mid = (period) => {
    const out = new Array(candles.length).fill(null);
    for (let i = period - 1; i < candles.length; i++) {
      const hh = Math.max(...highs.slice(i - period + 1, i + 1));
      const ll = Math.min(...lows.slice(i - period + 1, i + 1));
      out[i] = (hh + ll) / 2;
    }
    return out;
  };
  const tenkan = mid(tenkanP), kijun = mid(kijunP), senkouB = mid(senkouP);
  const senkouA = tenkan.map((v, i) => (v != null && kijun[i] != null) ? (v + kijun[i]) / 2 : null);
  return { tenkan, kijun, senkouA, senkouB };
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

// Bollinger — mode CONTRE-TENDANCE (rebond sur les bandes, mean reversion classique)
function signalsBollingerReversion(candles, period = 20, mult = 2) {
  const closes = candles.map(c => c[4]);
  const { upper, lower } = computeBollinger(closes, period, mult);
  const signals = new Array(candles.length).fill(null);
  for (let i = 1; i < candles.length; i++) {
    if (upper[i] == null || lower[i] == null) continue;
    if (closes[i - 1] <= lower[i - 1] && closes[i] > lower[i]) signals[i] = "long";   // rebond sur bande basse
    else if (closes[i - 1] >= upper[i - 1] && closes[i] < upper[i]) signals[i] = "short"; // rebond sur bande haute
  }
  return signals;
}

// Bollinger — mode TENDANCE (cassure des bandes = continuation, style breakout classique MT4)
function signalsBollingerBreakout(candles, period = 20, mult = 2) {
  const closes = candles.map(c => c[4]);
  const { upper, lower } = computeBollinger(closes, period, mult);
  const signals = new Array(candles.length).fill(null);
  for (let i = 0; i < candles.length; i++) {
    if (upper[i] == null || lower[i] == null) continue;
    if (closes[i] > upper[i]) signals[i] = "long";
    else if (closes[i] < lower[i]) signals[i] = "short";
  }
  return signals;
}

// Stochastic — croisement %K/%D en zone survente/surachat (standard MT4)
function signalsStochastic(candles, kPeriod = 14, dPeriod = 3, oversold = 20, overbought = 80) {
  const { percentK, percentD } = computeStochastic(candles, kPeriod, dPeriod);
  const signals = new Array(candles.length).fill(null);
  for (let i = 1; i < candles.length; i++) {
    if (percentK[i - 1] == null || percentD[i - 1] == null || percentK[i] == null || percentD[i] == null) continue;
    const prevDiff = percentK[i - 1] - percentD[i - 1];
    const currDiff = percentK[i] - percentD[i];
    if (prevDiff <= 0 && currDiff > 0 && percentK[i] < oversold + 15) signals[i] = "long";
    else if (prevDiff >= 0 && currDiff < 0 && percentK[i] > overbought - 15) signals[i] = "short";
  }
  return signals;
}

// ADX — TENDANCE : n'entre QUE si l'ADX confirme une tendance forte, direction donnée par +DI/-DI
function signalsAdxTrend(candles, period = 14, threshold = 25) {
  const { adx, plusDI, minusDI } = computeADX(candles, period);
  const signals = new Array(candles.length).fill(null);
  for (let i = 1; i < candles.length; i++) {
    if (adx[i] == null || plusDI[i] == null || minusDI[i] == null) continue;
    if (adx[i] < threshold) continue; // pas de tendance suffisante -> pas de trade
    const prevBull = plusDI[i - 1] > minusDI[i - 1], currBull = plusDI[i] > minusDI[i];
    if (!prevBull && currBull) signals[i] = "long";
    else if (prevBull && !currBull) signals[i] = "short";
  }
  return signals;
}

// Croisement de moyennes mobiles — l'EA MT4/MT5 le plus répandu
function signalsMaCross(candles, fastP = 10, slowP = 30) {
  const closes = candles.map(c => c[4]);
  const fastMA = computeSMA(closes, fastP), slowMA = computeSMA(closes, slowP);
  const signals = new Array(candles.length).fill(null);
  for (let i = 1; i < candles.length; i++) {
    if (fastMA[i - 1] == null || slowMA[i - 1] == null || fastMA[i] == null || slowMA[i] == null) continue;
    const prevDiff = fastMA[i - 1] - slowMA[i - 1];
    const currDiff = fastMA[i] - slowMA[i];
    if (prevDiff <= 0 && currDiff > 0) signals[i] = "long";
    else if (prevDiff >= 0 && currDiff < 0) signals[i] = "short";
  }
  return signals;
}

// Ichimoku — cassure du nuage + confirmation Tenkan/Kijun (méthode standard)
function signalsIchimoku(candles) {
  const { tenkan, kijun, senkouA, senkouB } = computeIchimoku(candles);
  const closes = candles.map(c => c[4]);
  const signals = new Array(candles.length).fill(null);
  for (let i = 1; i < candles.length; i++) {
    if ([tenkan[i], kijun[i], senkouA[i], senkouB[i]].some(v => v == null)) continue;
    const cloudTop = Math.max(senkouA[i], senkouB[i]), cloudBottom = Math.min(senkouA[i], senkouB[i]);
    const bullTK = tenkan[i] > kijun[i];
    if (closes[i] > cloudTop && bullTK && !(tenkan[i - 1] > kijun[i - 1])) signals[i] = "long";
    else if (closes[i] < cloudBottom && !bullTK && (tenkan[i - 1] > kijun[i - 1])) signals[i] = "short";
  }
  return signals;
}

// Mean Reversion / Contre-tendance pure — écart à la moyenne au-delà de N écarts-types (sans Bollinger nommé)
function signalsMeanReversion(candles, period = 20, deviations = 2.5) {
  const closes = candles.map(c => c[4]);
  const sma = computeSMA(closes, period);
  const std = computeStdDev(closes, period, sma);
  const signals = new Array(candles.length).fill(null);
  for (let i = 0; i < candles.length; i++) {
    if (sma[i] == null || std[i] == null || std[i] === 0) continue;
    const z = (closes[i] - sma[i]) / std[i];
    if (z <= -deviations) signals[i] = "long";
    else if (z >= deviations) signals[i] = "short";
  }
  return signals;
}

const STRATEGIES = {
  breakout: {
    label: "Breakout",
    category: "Tendance",
    defaultParams: { period: 20 },
    paramDefs: [{ key: "period", label: "Périodes de référence", min: 5, max: 60, step: 1 }],
    fn: (c, p) => signalsBreakout(c, p.period),
  },
  ma_cross: {
    label: "Croisement MM",
    category: "Tendance",
    defaultParams: { fastP: 10, slowP: 30 },
    paramDefs: [
      { key: "fastP", label: "MM rapide", min: 3, max: 30, step: 1 },
      { key: "slowP", label: "MM lente", min: 15, max: 100, step: 1 },
    ],
    fn: (c, p) => signalsMaCross(c, p.fastP, p.slowP),
  },
  macd: {
    label: "Croisement MACD",
    category: "Tendance",
    defaultParams: { fast: 12, slow: 26, signal: 9 },
    paramDefs: [
      { key: "fast", label: "EMA rapide", min: 5, max: 20, step: 1 },
      { key: "slow", label: "EMA lente", min: 15, max: 50, step: 1 },
      { key: "signal", label: "Ligne signal", min: 5, max: 15, step: 1 },
    ],
    fn: (c, p) => signalsMACD(c, p.fast, p.slow, p.signal),
  },
  adx_trend: {
    label: "ADX Tendance",
    category: "Tendance",
    defaultParams: { period: 14, threshold: 25 },
    paramDefs: [
      { key: "period", label: "Période ADX", min: 7, max: 25, step: 1 },
      { key: "threshold", label: "Seuil de tendance", min: 15, max: 40, step: 1 },
    ],
    fn: (c, p) => signalsAdxTrend(c, p.period, p.threshold),
  },
  ichimoku: {
    label: "Ichimoku",
    category: "Tendance",
    defaultParams: {},
    paramDefs: [],
    fn: (c) => signalsIchimoku(c),
  },
  bollinger_breakout: {
    label: "Bollinger Breakout",
    category: "Tendance",
    defaultParams: { period: 20, mult: 2 },
    paramDefs: [
      { key: "period", label: "Période", min: 10, max: 40, step: 1 },
      { key: "mult", label: "Écarts-types", min: 1, max: 3, step: 0.1 },
    ],
    fn: (c, p) => signalsBollingerBreakout(c, p.period, p.mult),
  },
  rsi: {
    label: "RSI (survente/surachat)",
    category: "Contre-tendance",
    defaultParams: { period: 14, oversold: 30, overbought: 70 },
    paramDefs: [
      { key: "period", label: "Période RSI", min: 5, max: 30, step: 1 },
      { key: "oversold", label: "Seuil survente", min: 10, max: 40, step: 1 },
      { key: "overbought", label: "Seuil surachat", min: 60, max: 90, step: 1 },
    ],
    fn: (c, p) => signalsRSI(c, p.period, p.oversold, p.overbought),
  },
  stochastic: {
    label: "Stochastic",
    category: "Contre-tendance",
    defaultParams: { kPeriod: 14, dPeriod: 3, oversold: 20, overbought: 80 },
    paramDefs: [
      { key: "kPeriod", label: "Période %K", min: 5, max: 25, step: 1 },
      { key: "dPeriod", label: "Lissage %D", min: 1, max: 9, step: 1 },
      { key: "oversold", label: "Seuil survente", min: 5, max: 30, step: 1 },
      { key: "overbought", label: "Seuil surachat", min: 70, max: 95, step: 1 },
    ],
    fn: (c, p) => signalsStochastic(c, p.kPeriod, p.dPeriod, p.oversold, p.overbought),
  },
  bollinger_reversion: {
    label: "Bollinger Reversion",
    category: "Contre-tendance",
    defaultParams: { period: 20, mult: 2 },
    paramDefs: [
      { key: "period", label: "Période", min: 10, max: 40, step: 1 },
      { key: "mult", label: "Écarts-types", min: 1, max: 3, step: 0.1 },
    ],
    fn: (c, p) => signalsBollingerReversion(c, p.period, p.mult),
  },
  mean_reversion: {
    label: "Mean Reversion",
    category: "Contre-tendance",
    defaultParams: { period: 20, deviations: 2.5 },
    paramDefs: [
      { key: "period", label: "Période moyenne", min: 10, max: 50, step: 1 },
      { key: "deviations", label: "Écart déclencheur (σ)", min: 1.5, max: 4, step: 0.1 },
    ],
    fn: (c, p) => signalsMeanReversion(c, p.period, p.deviations),
  },
  grid: {
    label: "Grid Trading",
    category: "Grille / Récupération",
    isGrid: true, // simulation dédiée, pas un simple générateur de signaux TP/SL
    defaultParams: { spacingPips: 20, levels: 5, direction: "both" },
    paramDefs: [
      { key: "spacingPips", label: "Écart entre niveaux (pips)", min: 5, max: 100, step: 1 },
      { key: "levels", label: "Nombre de niveaux", min: 2, max: 15, step: 1 },
    ],
    fn: () => [], // non utilisé — la grille a sa propre boucle de simulation
  },
};

// ── MARTINGALE — mode de gestion du risque applicable à N'IMPORTE QUELLE
// stratégie de signaux ci-dessus (le doublement de mise est une méthode de
// MONEY MANAGEMENT, pas un signal d'entrée — modélisé comme un overlay). ──
export const MONEY_MANAGEMENT_MODES = [
  { key: "fixed", label: "Risque fixe %" },
  { key: "martingale", label: "Martingale (doublement après perte)" },
];

// ── Simulateur de trades : un signal ouvre un trade (si aucun en cours),
//    sorti sur TP/SL fixe en pips. SL vérifié en priorité (biais conservateur
//    si TP et SL sont touchés dans la même bougie). Position sizing en $
//    RÉEL (risque % du capital COURANT, compounding comme le Simulateur). ──
export function runBacktest({
  candles, pair, strategyKey, tpPips = 15, slPips = 10, strategyParams = null,
  capital = 10000, riskPct = 1, slippagePips = 0.2, sessionKey = "24h", newsFilterOn = false,
  mmMode = "fixed", martingaleMultiplier = 2, martingaleMaxSteps = 5,
}) {
  const strategy = STRATEGIES[strategyKey];
  if (!strategy) throw new Error("Stratégie inconnue: " + strategyKey);
  if (strategy.isGrid) throw new Error("Utilise runGridBacktest() pour la stratégie Grid.");
  if (!candles || candles.length < 50) throw new Error("Pas assez de données (minimum 50 bougies).");

  const pip = PIP_SIZE[pair] || 0.0001;
  const params = { ...strategy.defaultParams, ...(strategyParams || {}) };
  const signals = strategy.fn(candles, params);
  // Coût réel par trade (spread + slippage), retiré du résultat de chaque trade
  const costPips = slippagePips;

  const trades = [];
  let inTrade = null;
  let equity = capital;
  let martingaleStep = 0; // nombre de pertes consécutives dans le cycle martingale courant

  for (let i = 0; i < candles.length; i++) {
    const [ts, , high, low, close] = candles[i];
    const tradableNow = isInSession(ts, sessionKey) && (!newsFilterOn || !isLikelyNewsWindow(ts));

    if (inTrade) {
      const { dir, entryPrice, tp, sl, entryIdx, dollarPerPip } = inTrade;
      const hitSL = dir === "long" ? low <= sl : high >= sl;
      const hitTP = dir === "long" ? high >= tp : low <= tp;
      if (hitSL || hitTP) {
        const win = hitTP && !hitSL;
        const pipsGross = win ? tpPips : -slPips;
        const pipsNet = pipsGross - costPips;
        const pnlUSD = +(pipsNet * dollarPerPip).toFixed(2);
        equity += pnlUSD;
        trades.push({ entryIdx, exitIdx: i, dir, entryPrice, exitPrice: win ? tp : sl, pips: +pipsNet.toFixed(2), pnlUSD, win, duration: i - entryIdx, entryTs: candles[entryIdx][0], martingaleStep });
        // Martingale : perte -> incrémente le step (mise suivante plus grosse) ; gain -> reset du cycle
        if (mmMode === "martingale") martingaleStep = win ? 0 : Math.min(martingaleMaxSteps, martingaleStep + 1);
        inTrade = null;
      }
    }

    if (!inTrade && signals[i] && tradableNow) {
      const dir = signals[i];
      const entryPrice = close;
      const tp = dir === "long" ? entryPrice + tpPips * pip : entryPrice - tpPips * pip;
      const sl = dir === "long" ? entryPrice - slPips * pip : entryPrice + slPips * pip;
      // Risque de base = % du capital courant. En Martingale, la mise est multipliée
      // par (multiplicateur ^ nombre de pertes consécutives), plafonnée à martingaleMaxSteps
      // pour éviter une explosion de position infinie (risque de ruine sinon garanti).
      const riskMultiplier = mmMode === "martingale" ? Math.pow(martingaleMultiplier, martingaleStep) : 1;
      const riskUSD = equity * (riskPct / 100) * riskMultiplier;
      const dollarPerPip = riskUSD / slPips;
      inTrade = { dir, entryPrice, tp, sl, entryIdx: i, dollarPerPip };
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
// ── GRID TRADING — simulation dédiée (positions MULTIPLES simultanées,
// contrairement aux autres stratégies qui n'ouvrent qu'un trade à la fois).
// Comportement fidèle à un EA grille réel : niveaux d'achat/vente espacés
// autour d'un prix d'ancrage, chaque niveau se referme sur son propre TP
// (= un écart de grille) et se réarme ensuite. PAS de stop loss par niveau
// (caractéristique réelle des grilles — c'est justement leur risque inhérent),
// mais le drawdown FLOTTANT de l'ensemble de la grille est suivi honnêtement. ──
export function runGridBacktest({ candles, pair, capital = 10000, riskPct = 1, spacingPips = 20, levels = 5, direction = "both", slippagePips = 0.2 }) {
  if (!candles || candles.length < 50) throw new Error("Pas assez de données (minimum 50 bougies).");
  const pip = PIP_SIZE[pair] || 0.0001;
  const anchor = candles[0][1];
  const riskPerLevelUSD = (capital * (riskPct / 100)) / levels;
  const dollarPerPip = riskPerLevelUSD / spacingPips;
  const costPips = slippagePips;

  const buyLevels = direction !== "sell" ? Array.from({ length: levels }, (_, k) => anchor - (k + 1) * spacingPips * pip) : [];
  const sellLevels = direction !== "buy" ? Array.from({ length: levels }, (_, k) => anchor + (k + 1) * spacingPips * pip) : [];
  const gridState = [
    ...buyLevels.map(lvl => ({ dir: "long", level: lvl, open: false, entryPrice: null, entryIdx: null })),
    ...sellLevels.map(lvl => ({ dir: "short", level: lvl, open: false, entryPrice: null, entryIdx: null })),
  ];

  const trades = [];
  let realizedUSD = 0;
  let peakFloating = 0, maxFloatingDD = 0;

  for (let i = 0; i < candles.length; i++) {
    const [ts, , high, low, close] = candles[i];

    gridState.forEach(g => {
      if (!g.open) return;
      const tp = g.dir === "long" ? g.entryPrice + spacingPips * pip : g.entryPrice - spacingPips * pip;
      const hit = g.dir === "long" ? high >= tp : low <= tp;
      if (hit) {
        const pipsNet = spacingPips - costPips;
        const pnlUSD = +(pipsNet * dollarPerPip).toFixed(2);
        realizedUSD += pnlUSD;
        trades.push({ entryIdx: g.entryIdx, exitIdx: i, dir: g.dir, entryPrice: g.entryPrice, exitPrice: tp, pips: pipsNet, pnlUSD, win: true, duration: i - g.entryIdx, entryTs: candles[g.entryIdx][0] });
        g.open = false; g.entryPrice = null; g.entryIdx = null;
      }
    });

    gridState.forEach(g => {
      if (g.open) return;
      const crossed = low <= g.level && high >= g.level;
      if (crossed) { g.open = true; g.entryPrice = g.level; g.entryIdx = i; }
    });

    const floatingUSD = gridState.reduce((s, g) => {
      if (!g.open) return s;
      const pipsFloat = g.dir === "long" ? (close - g.entryPrice) / pip : (g.entryPrice - close) / pip;
      return s + pipsFloat * dollarPerPip;
    }, 0);
    const totalEquityNow = capital + realizedUSD + floatingUSD;
    peakFloating = Math.max(peakFloating, totalEquityNow);
    maxFloatingDD = Math.max(maxFloatingDD, peakFloating - totalEquityNow);
  }

  const lastClose = candles[candles.length - 1][4];
  const openFloatingUSD = gridState.reduce((s, g) => {
    if (!g.open) return s;
    const pipsFloat = g.dir === "long" ? (lastClose - g.entryPrice) / pip : (g.entryPrice - lastClose) / pip;
    return s + pipsFloat * dollarPerPip;
  }, 0);

  const totalUSD = +(realizedUSD + openFloatingUSD).toFixed(2);
  const maxDrawdownUSD = +maxFloatingDD.toFixed(2);
  const maxDrawdownPct = capital > 0 ? +((maxDrawdownUSD / capital) * 100).toFixed(2) : 0;
  const openLevelsCount = gridState.filter(g => g.open).length;

  let running = capital;
  const equityCurve = [{ x: 0, y: 0, usd: capital }];
  trades.forEach((t, i) => { running += t.pnlUSD; equityCurve.push({ x: i + 1, y: +(running - capital).toFixed(1), usd: +running.toFixed(2) }); });

  return {
    strategyLabel: "Grid Trading",
    isGridResult: true,
    totalTrades: trades.length,
    wins: trades.length, losses: 0, winrate: trades.length ? 100 : 0,
    totalPips: null,
    totalUSD, capital, finalEquity: +(capital + totalUSD).toFixed(2), totalPct: +((totalUSD / capital) * 100).toFixed(2),
    profitFactor: null, rRatio: null,
    expectancy: trades.length ? +(realizedUSD / trades.length).toFixed(2) : 0,
    avgWinPips: spacingPips, avgLossPips: 0, avgDuration: trades.length ? Math.round(trades.reduce((s, t) => s + t.duration, 0) / trades.length) : 0,
    maxLossStreak: 0, maxWinStreak: trades.length,
    maxDrawdownPips: null, maxDrawdownUSD, maxDrawdownPct,
    longCount: trades.filter(t => t.dir === "long").length, shortCount: trades.filter(t => t.dir === "short").length,
    longWinrate: 100, shortWinrate: 100,
    openLevelsCount, gridLevelsTotal: levels * (direction === "both" ? 2 : 1),
    byDow: ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"].map((label, dow) => {
      const dt = trades.filter(t => new Date(t.entryTs).getUTCDay() === dow);
      return { label, count: dt.length, winrate: dt.length ? 100 : null };
    }),
    equityCurve, trades,
    candleCount: candles.length,
    dateRange: candles.length ? [candles[0][0], candles[candles.length - 1][0]] : null,
  };
}

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
  return Object.entries(STRATEGIES).map(([key, v]) => ({ key, label: v.label, category: v.category, isGrid: !!v.isGrid, defaultParams: v.defaultParams, paramDefs: v.paramDefs }));
}
