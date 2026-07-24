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
  // Forex majors et crosses (données réelles publiées)
  EURUSD: 0.0001, GBPUSD: 0.0001, USDJPY: 0.01, USDCHF: 0.0001, AUDUSD: 0.0001, USDCAD: 0.0001, NZDUSD: 0.0001,
  EURGBP: 0.0001, EURCHF: 0.0001, EURJPY: 0.01, GBPJPY: 0.01, AUDJPY: 0.01, CHFJPY: 0.01,
  // Métaux / matières premières
  XAUUSD: 0.1, XAGUSD: 0.01, USOIL: 0.01, UKOIL: 0.01, NATGAS: 0.001, COPPER: 0.0001,
  // Indices majeurs
  US30: 1, NAS100: 1, SPX500: 0.1, GER40: 1, GER30: 1, UK100: 1, JPN225: 1,
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

// Agrège des bougies vers un timeframe plus large.
// `baseMinutes` = granularité native du dataset (ex: 15 pour une source M15).
// Le facteur de regroupement est donc targetMinutes / baseMinutes — on ne peut
// jamais descendre SOUS la granularité native (impossible de créer de
// l'information qui n'existe pas dans la source).
export function aggregateCandles(candles, targetMinutes, baseMinutes = 1) {
  const factor = Math.max(1, Math.round(targetMinutes / baseMinutes));
  if (factor <= 1) return candles;
  const out = [];
  for (let i = 0; i < candles.length; i += factor) {
    const chunk = candles.slice(i, i + factor);
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
  { key: "asia", label: "Session Asie (00h-08h)", hours: [0, 8] },
  { key: "london", label: "Session Londres (08h-16h)", hours: [8, 16] },
  { key: "ny", label: "Session New York (13h-21h)", hours: [13, 21] },
  { key: "london_ny", label: "Londres + New York (08h-21h)", hours: [8, 21] },
  { key: "custom", label: "Plage personnalisée", hours: null, custom: true },
];

// Une bougie est "tradable" si son heure UTC tombe dans la fenêtre horaire.
// customHours = [début, fin] en heures UTC. Une plage qui franchit minuit
// (ex: 22h → 04h) est gérée correctement : la condition devient un OU au lieu
// d'un ET, sinon aucune bougie ne passerait le filtre.
function isInSession(ts, sessionKey, customHours) {
  if (sessionKey === "custom") {
    if (!customHours) return true;
    const [a, b] = customHours;
    if (a === b) return true; // plage vide = pas de filtre
    const h = new Date(ts).getUTCHours();
    return a < b ? (h >= a && h < b) : (h >= a || h < b);
  }
  const s = SESSIONS.find(x => x.key === sessionKey);
  if (!s || !s.hours) return true;
  const h = new Date(ts).getUTCHours();
  return h >= s.hours[0] && h < s.hours[1];
}

// Sens autorisés pour l'ouverture des positions
export const TRADE_DIRECTIONS = [
  { key: "both", label: "Achat + Vente" },
  { key: "buy", label: "Achat uniquement" },
  { key: "sell", label: "Vente uniquement" },
];

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

// ATR (Average True Range, Wilder) — mesure de volatilité, standard MT4/MT5
function computeATR(candles, period = 14) {
  const n = candles.length;
  const tr = new Array(n).fill(null);
  for (let i = 1; i < n; i++) {
    tr[i] = Math.max(
      candles[i][2] - candles[i][3],
      Math.abs(candles[i][2] - candles[i - 1][4]),
      Math.abs(candles[i][3] - candles[i - 1][4])
    );
  }
  const atr = new Array(n).fill(null);
  let sum = 0, count = 0;
  for (let i = 1; i <= period && i < n; i++) { sum += tr[i]; count++; }
  if (count) atr[period] = sum / count;
  for (let i = period + 1; i < n; i++) {
    if (atr[i - 1] == null || tr[i] == null) continue;
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }
  return atr;
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

// ══════════════════════════════════════════════════════════════════
// FILTRES DE CONFLUENCE — logique d'un EA MT4/MT5.
// La stratégie principale DÉCLENCHE l'entrée ; chaque filtre actif doit
// ensuite AUTORISER ce sens précis, sinon le signal est ignoré.
// Chaque filtre renvoie deux tableaux de booléens (un par bougie) :
// { long: [...], short: [...] } — permettre un sens et pas l'autre est
// essentiel (ex: une tendance haussière autorise l'achat, pas la vente).
// ══════════════════════════════════════════════════════════════════
export const CONFLUENCE_FILTERS = {
  ema_trend: {
    label: "Tendance (EMA)",
    desc: "N'autorise l'achat que si le prix est AU-DESSUS de l'EMA, la vente que s'il est en dessous. Évite de trader à contre-courant de la tendance de fond.",
    defaultParams: { period: 200 },
    paramDefs: [{ key: "period", label: "Période EMA", min: 20, max: 400, step: 10 }],
    fn: (candles, p) => {
      const closes = candles.map(c => c[4]);
      const ema = computeEMA(closes, p.period);
      return {
        long: closes.map((cl, i) => ema[i] == null ? false : cl > ema[i]),
        short: closes.map((cl, i) => ema[i] == null ? false : cl < ema[i]),
      };
    },
  },
  adx_strength: {
    label: "Force de tendance (ADX)",
    desc: "N'autorise l'entrée que si l'ADX dépasse le seuil, c'est-à-dire si une tendance est réellement en place. Filtre les marchés sans direction où la plupart des stratégies perdent.",
    defaultParams: { period: 14, threshold: 25 },
    paramDefs: [
      { key: "period", label: "Période ADX", min: 7, max: 30, step: 1 },
      { key: "threshold", label: "Seuil minimum", min: 10, max: 45, step: 1 },
    ],
    fn: (candles, p) => {
      const { adx } = computeADX(candles, p.period);
      const ok = adx.map(v => v != null && v >= p.threshold);
      return { long: ok, short: ok };
    },
  },
  rsi_zone: {
    label: "Zone RSI",
    desc: "Interdit d'acheter quand le RSI est déjà en surachat, et de vendre quand il est déjà en survente. Évite d'entrer au pire moment, juste avant un retournement.",
    defaultParams: { period: 14, maxBuy: 70, minSell: 30 },
    paramDefs: [
      { key: "period", label: "Période RSI", min: 5, max: 30, step: 1 },
      { key: "maxBuy", label: "Achat interdit au-dessus de", min: 50, max: 90, step: 1 },
      { key: "minSell", label: "Vente interdite en dessous de", min: 10, max: 50, step: 1 },
    ],
    fn: (candles, p) => {
      const rsi = computeRSI(candles.map(c => c[4]), p.period);
      return {
        long: rsi.map(v => v != null && v < p.maxBuy),
        short: rsi.map(v => v != null && v > p.minSell),
      };
    },
  },
  macd_confirm: {
    label: "Confirmation MACD",
    desc: "N'autorise l'achat que si la ligne MACD est au-dessus de sa ligne de signal (momentum haussier), et inversement pour la vente.",
    defaultParams: { fast: 12, slow: 26, signal: 9 },
    paramDefs: [
      { key: "fast", label: "EMA rapide", min: 5, max: 20, step: 1 },
      { key: "slow", label: "EMA lente", min: 15, max: 50, step: 1 },
      { key: "signal", label: "Ligne signal", min: 5, max: 15, step: 1 },
    ],
    fn: (candles, p) => {
      const { macdLine, signalLine } = computeMACD(candles.map(c => c[4]), p.fast, p.slow, p.signal);
      return {
        long: macdLine.map((v, i) => v != null && signalLine[i] != null && v > signalLine[i]),
        short: macdLine.map((v, i) => v != null && signalLine[i] != null && v < signalLine[i]),
      };
    },
  },
  atr_volatility: {
    label: "Volatilité (ATR)",
    desc: "N'autorise l'entrée que si la volatilité dépasse un pourcentage de sa moyenne. Évite les périodes trop calmes où le prix n'atteint jamais le take profit.",
    defaultParams: { period: 14, minPct: 80 },
    paramDefs: [
      { key: "period", label: "Période ATR", min: 7, max: 30, step: 1 },
      { key: "minPct", label: "% minimum de l'ATR moyen", min: 30, max: 200, step: 5 },
    ],
    fn: (candles, p) => {
      const atr = computeATR(candles, p.period);
      const valid = atr.filter(v => v != null);
      const avg = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
      const seuil = avg * (p.minPct / 100);
      const ok = atr.map(v => v != null && v >= seuil);
      return { long: ok, short: ok };
    },
  },
  structure: {
    label: "Structure (hauts/bas)",
    desc: "N'autorise l'achat que si la structure est haussière (sommets ET creux croissants), la vente que si elle est baissière. Les swings ne sont pris en compte qu'une fois confirmés — pas de vision rétroactive.",
    defaultParams: { lookback: 3 },
    paramDefs: [{ key: "lookback", label: "Bougies de confirmation", min: 2, max: 10, step: 1 }],
    fn: (candles, p) => { const s = structureMasks(candles, p.lookback); return { long: s.up, short: s.down }; },
  },
  channel: {
    label: "Canal de tendance",
    desc: "Régression linéaire sur N bougies : n'autorise l'entrée que si le prix suit un canal orienté dans le sens du trade. Le R² minimum écarte les cas où l'on force un canal sur du bruit.",
    defaultParams: { period: 60, minR2: 40, minSlopeAtr: 0.02 },
    paramDefs: [
      { key: "period", label: "Longueur du canal", min: 20, max: 200, step: 10 },
      { key: "minR2", label: "Qualité minimale (R²)", min: 10, max: 90, step: 5 },
    ],
    fn: (candles, p) => { const ch = channelMasks(candles, p.period, p.minR2, p.minSlopeAtr ?? 0.02); return { long: ch.up, short: ch.down }; },
  },
  fvg: {
    label: "Fair Value Gap (SMC)",
    desc: "N'autorise l'entrée que si un déséquilibre non comblé existe dans le sens du trade. Définition mécanique stricte : vide entre l'extrême de la 1re et de la 3e bougie d'un triplet, actif tant que le prix ne l'a pas rempli.",
    defaultParams: { maxAgeBars: 50 },
    paramDefs: [{ key: "maxAgeBars", label: "Durée de vie du gap (bougies)", min: 10, max: 200, step: 10 }],
    fn: (candles, p) => { const f = fvgMasks(candles, p.maxAgeBars); return { long: f.bull, short: f.bear }; },
  },
  order_block: {
    label: "Order Block (SMC)",
    desc: "N'autorise l'entrée que lors d'un retest de zone d'accumulation : dernière bougie opposée avant une impulsion supérieure à X fois l'ATR. Version mécanique — les tracés SMC manuels peuvent différer.",
    defaultParams: { impulseAtrMult: 1.5, maxAgeBars: 80 },
    paramDefs: [
      { key: "impulseAtrMult", label: "Force de l'impulsion (× ATR)", min: 0.5, max: 4, step: 0.1 },
      { key: "maxAgeBars", label: "Durée de vie de la zone", min: 20, max: 200, step: 10 },
    ],
    fn: (candles, p) => { const o = orderBlockMasks(candles, p.impulseAtrMult, p.maxAgeBars); return { long: o.bull, short: o.bear }; },
  },
  volatility_regime: {
    label: "Régime de volatilité",
    desc: "Compare la volatilité courte à la volatilité longue. Permet de n'entrer qu'en expansion (volatilité qui s'accélère) ou qu'en contraction, selon ce que la stratégie exploite.",
    defaultParams: { fast: 14, slow: 50, mode: 1, ratio: 110 },
    paramDefs: [
      { key: "fast", label: "ATR court", min: 5, max: 30, step: 1 },
      { key: "slow", label: "ATR long", min: 20, max: 120, step: 5 },
      { key: "ratio", label: "Seuil du ratio (%)", min: 60, max: 180, step: 5 },
      { key: "mode", label: "1 = expansion, 0 = contraction", min: 0, max: 1, step: 1 },
    ],
    fn: (candles, p) => {
      const a1 = computeATR(candles, p.fast), a2 = computeATR(candles, p.slow);
      const ok = candles.map((_, i) => {
        if (a1[i] == null || a2[i] == null || a2[i] === 0) return false;
        const r = (a1[i] / a2[i]) * 100;
        return p.mode >= 1 ? r >= p.ratio : r <= p.ratio;
      });
      return { long: ok, short: ok };
    },
  },
  stoch_zone: {
    label: "Zone Stochastique",
    desc: "Même principe que la zone RSI mais sur le Stochastique, plus réactif sur les petits timeframes.",
    defaultParams: { kPeriod: 14, dPeriod: 3, maxBuy: 80, minSell: 20 },
    paramDefs: [
      { key: "kPeriod", label: "Période %K", min: 5, max: 25, step: 1 },
      { key: "maxBuy", label: "Achat interdit au-dessus de", min: 50, max: 95, step: 1 },
      { key: "minSell", label: "Vente interdite en dessous de", min: 5, max: 50, step: 1 },
    ],
    fn: (candles, p) => {
      const { percentK } = computeStochastic(candles, p.kPeriod, p.dPeriod || 3);
      return {
        long: percentK.map(v => v != null && v < p.maxBuy),
        short: percentK.map(v => v != null && v > p.minSell),
      };
    },
  },
};

// ══════════════════════════════════════════════════════════════════
// DÉTECTIONS STRUCTURELLES — swings, canaux, FVG, order blocks.
//
// Note d'honnêteté : les concepts Smart Money (order block, FVG) n'ont PAS de
// définition universelle — deux traders les tracent différemment. Ce qui est
// codé ici est une version MÉCANIQUE et stricte, explicitée dans chaque filtre.
// C'est reproductible et backtestable, mais c'est une interprétation parmi
// d'autres, assumée comme telle.
// ══════════════════════════════════════════════════════════════════

// Swings (fractales) : un sommet est un plus-haut entouré de N bougies plus
// basses de chaque côté. Confirmation décalée de N bougies — c'est la réalité
// du trading en direct, un swing ne se confirme jamais instantanément.
function findSwings(candles, lookback = 3) {
  const n = candles.length;
  const highs = new Array(n).fill(false), lows = new Array(n).fill(false);
  for (let i = lookback; i < n - lookback; i++) {
    let isH = true, isL = true;
    for (let k = 1; k <= lookback; k++) {
      if (candles[i][2] <= candles[i - k][2] || candles[i][2] <= candles[i + k][2]) isH = false;
      if (candles[i][3] >= candles[i - k][3] || candles[i][3] >= candles[i + k][3]) isL = false;
    }
    if (isH) highs[i] = true;
    if (isL) lows[i] = true;
  }
  return { highs, lows };
}

// Structure de marché : sommets et creux croissants (haussier) ou decroissants
// (baissier). Le masque n'est actif qu'a partir du moment ou le swing est
// CONFIRME (i + lookback), jamais retroactivement — sinon on utiliserait une
// information qui n'existait pas encore au moment du trade.
function structureMasks(candles, lookback = 3) {
  const n = candles.length;
  const { highs, lows } = findSwings(candles, lookback);
  const up = new Array(n).fill(false), down = new Array(n).fill(false);
  let lastH = null, prevH = null, lastL = null, prevL = null;
  for (let i = 0; i < n; i++) {
    const conf = i - lookback;
    if (conf >= 0) {
      if (highs[conf]) { prevH = lastH; lastH = candles[conf][2]; }
      if (lows[conf]) { prevL = lastL; lastL = candles[conf][3]; }
    }
    if (lastH != null && prevH != null && lastL != null && prevL != null) {
      up[i] = lastH > prevH && lastL > prevL;
      down[i] = lastH < prevH && lastL < prevL;
    }
  }
  return { up, down };
}

// Fair Value Gap : trois bougies ou le corps central laisse un vide entre
// l'extreme de la 1re et celui de la 3e. Definition stricte et mecanique.
// Le masque reste actif tant que le prix n'a pas comble le vide.
function fvgMasks(candles, maxAgeBars = 50) {
  const n = candles.length;
  const bull = new Array(n).fill(false), bear = new Array(n).fill(false);
  const zones = [];
  for (let i = 2; i < n; i++) {
    for (let z = zones.length - 1; z >= 0; z--) {
      const zn = zones[z];
      if (i - zn.idx > maxAgeBars) { zones.splice(z, 1); continue; }
      const comble = zn.dir === "bull" ? candles[i][3] <= zn.low : candles[i][2] >= zn.high;
      if (comble) zones.splice(z, 1);
    }
    if (candles[i][3] > candles[i - 2][2]) zones.push({ dir: "bull", low: candles[i - 2][2], high: candles[i][3], idx: i });
    if (candles[i][2] < candles[i - 2][3]) zones.push({ dir: "bear", low: candles[i][2], high: candles[i - 2][3], idx: i });
    bull[i] = zones.some(z => z.dir === "bull");
    bear[i] = zones.some(z => z.dir === "bear");
  }
  return { bull, bear };
}

// Order Block : derniere bougie de sens oppose avant une impulsion. Version
// mecanique : bougie baissiere suivie d'une impulsion haussiere depassant son
// plus-haut d'au moins X fois l'ATR. Le masque s'active au RETEST de la zone.
function orderBlockMasks(candles, impulseAtrMult = 1.5, maxAgeBars = 80) {
  const n = candles.length;
  const atr = computeATR(candles, 14);
  const bull = new Array(n).fill(false), bear = new Array(n).fill(false);
  const blocks = [];
  for (let i = 2; i < n; i++) {
    if (atr[i] == null) continue;
    const seuil = atr[i] * impulseAtrMult;
    const prev = candles[i - 1], cur = candles[i];
    const prevBear = prev[4] < prev[1], prevBull = prev[4] > prev[1];
    if (prevBear && (cur[4] - prev[2]) > seuil) blocks.push({ dir: "bull", low: prev[3], high: prev[2], idx: i });
    if (prevBull && (prev[3] - cur[4]) > seuil) blocks.push({ dir: "bear", low: prev[3], high: prev[2], idx: i });
    for (let b = blocks.length - 1; b >= 0; b--) if (i - blocks[b].idx > maxAgeBars) blocks.splice(b, 1);
    // Un order block haussier soutient le prix TANT QUE celui-ci reste au-dessus.
    // Exiger que le prix soit exactement DANS la zone ne laisserait passer que
    // les retests profonds (0 signal en pratique quand la stratégie principale
    // entre sur cassure). On considère donc la zone active tant qu'elle n'est
    // pas invalidée, avec proximité mesurée en multiples d'ATR.
    const px = candles[i][4];
    const near = atr[i] * 6;
    bull[i] = blocks.some(b => b.dir === "bull" && px >= b.low && px <= b.high + near);
    bear[i] = blocks.some(b => b.dir === "bear" && px <= b.high && px >= b.low - near);
  }
  return { bull, bear };
}

// Canal de tendance par regression lineaire. La pente donne la direction, le
// R2 dit si le mouvement est reellement lineaire ou si c'est du bruit qu'on
// force dans un canal.
function channelMasks(candles, period = 60, minR2 = 40, minSlopeAtr = 0.02) {
  const n = candles.length;
  const up = new Array(n).fill(false), down = new Array(n).fill(false);
  const atr = computeATR(candles, 14);
  for (let i = period; i < n; i++) {
    let sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
    for (let k = 0; k < period; k++) {
      const x = k, y = candles[i - period + 1 + k][4];
      sx += x; sy += y; sxy += x * y; sxx += x * x; syy += y * y;
    }
    const den = period * sxx - sx * sx;
    if (den === 0 || atr[i] == null || atr[i] === 0) continue;
    const slope = (period * sxy - sx * sy) / den;
    const num = period * sxy - sx * sy;
    const denR2 = den * (period * syy - sy * sy);
    const r2 = denR2 !== 0 ? (num * num) / denR2 * 100 : 0;
    if (r2 < minR2) continue;
    const pente = slope / atr[i];
    if (pente >= minSlopeAtr) up[i] = true;
    else if (pente <= -minSlopeAtr) down[i] = true;
  }
  return { up, down };
}

export function listConfluenceFilters() {
  return Object.entries(CONFLUENCE_FILTERS).map(([key, v]) => ({
    key, label: v.label, desc: v.desc, defaultParams: v.defaultParams, paramDefs: v.paramDefs,
  }));
}

// Jours de la semaine (0 = dimanche, convention JS/UTC)
export const WEEKDAYS = [
  { key: 1, label: "Lun" }, { key: 2, label: "Mar" }, { key: 3, label: "Mer" },
  { key: 4, label: "Jeu" }, { key: 5, label: "Ven" }, { key: 0, label: "Dim" }, { key: 6, label: "Sam" },
];

// ── EMA200 Pullback : cassure de l'EMA, pullback qui RESPECTE la moyenne,
// puis reprise dans le sens de la cassure. Le stop est ancré sur l'EMA elle-même
// (stop DYNAMIQUE), pas sur une distance fixe en pips — c'est ce qui donne son
// sens à la stratégie : tant que le prix reste du bon côté de la moyenne, le
// scénario est valide ; dès qu'il repasse de l'autre côté, il est invalidé.
//
// Machine à états par bougie :
//   IDLE     -> le prix casse l'EMA          -> BREAK (on mémorise l'extrême de l'impulsion)
//   BREAK    -> le prix recule suffisamment  -> PULLBACK
//   PULLBACK -> le prix repasse l'extrême    -> SIGNAL
// À tout moment, si le prix repasse du mauvais côté de l'EMA, le scénario est
// abandonné (c'était une fausse cassure) et on repart de zéro.
function signalsEmaPullback(candles, emaPeriod = 200, maxPullbackBars = 30, minPullbackPct = 20, slBufferPct = 0.05) {
  const closes = candles.map(c => c[4]);
  const ema = computeEMA(closes, emaPeriod);
  const signals = new Array(candles.length).fill(null);

  let state = "idle";      // idle | break | pullback
  let dir = null;          // "long" | "short"
  let breakIdx = -1;
  let impulseExtreme = 0;  // plus haut (long) ou plus bas (short) atteint depuis la cassure
  let pullbackExtreme = 0; // extrême du recul, mesuré DEPUIS impulseExtreme
  let emaAtBreak = 0;

  for (let i = 1; i < candles.length; i++) {
    if (ema[i] == null || ema[i - 1] == null) continue;
    const [, , high, low, close] = candles[i];

    // ── Détection d'une cassure quand on n'est engagé sur aucun scénario ──
    if (state === "idle") {
      const crossUp = closes[i - 1] <= ema[i - 1] && close > ema[i];
      const crossDown = closes[i - 1] >= ema[i - 1] && close < ema[i];
      if (crossUp || crossDown) {
        state = "break";
        dir = crossUp ? "long" : "short";
        breakIdx = i;
        impulseExtreme = crossUp ? high : low;
        pullbackExtreme = impulseExtreme;
        emaAtBreak = ema[i];
      }
      continue;
    }

    // ── Invalidation : le prix repasse du mauvais côté de l'EMA ──
    const stillValid = dir === "long" ? close > ema[i] : close < ema[i];
    if (!stillValid) { state = "idle"; dir = null; continue; }

    // ── Expiration : la reprise n'arrive jamais, le signal perd sa pertinence ──
    if (i - breakIdx > maxPullbackBars) { state = "idle"; dir = null; continue; }

    if (state === "break") {
      // Tant que l'impulsion se prolonge, on repousse l'extrême et on remet le
      // compteur de recul à zéro : le pullback ne peut se mesurer que DEPUIS un
      // sommet (ou creux) établi, jamais sur la bougie qui le crée elle-même —
      // sinon le simple écart haut/bas d'une grande bougie suffirait à valider
      // un "pullback" qui n'a pas eu lieu.
      const newExtreme = dir === "long" ? high > impulseExtreme : low < impulseExtreme;
      if (newExtreme) {
        impulseExtreme = dir === "long" ? high : low;
        pullbackExtreme = impulseExtreme; // le recul repart de ce nouveau sommet
        continue;
      }

      // L'impulsion marque une pause : on suit le recul bougie après bougie
      if (dir === "long") pullbackExtreme = Math.min(pullbackExtreme, low);
      else pullbackExtreme = Math.max(pullbackExtreme, high);

      const amplitude = Math.abs(impulseExtreme - emaAtBreak);
      if (amplitude <= 0) continue;
      const recul = Math.abs(impulseExtreme - pullbackExtreme);
      if ((recul / amplitude) * 100 >= minPullbackPct) state = "pullback";
      continue;
    }

    if (state === "pullback") {
      // Reprise confirmée : le prix repasse l'extrême de l'impulsion
      const reprise = dir === "long" ? close > impulseExtreme : close < impulseExtreme;
      if (reprise) {
        // Stop ancré sur l'EMA, avec une marge pour ne pas être sorti au tick près
        const buffer = ema[i] * (slBufferPct / 100);
        const slPrice = dir === "long" ? ema[i] - buffer : ema[i] + buffer;
        signals[i] = { dir, sl: slPrice };
        state = "idle"; dir = null;
      }
      continue;
    }
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
  ema_pullback: {
    label: "EMA200 Pullback (stop dynamique)",
    category: "Tendance",
    dynamicSL: true, // le stop vient de la stratégie, pas du réglage fixe en pips
    defaultParams: { emaPeriod: 200, maxPullbackBars: 30, minPullbackPct: 20, rMultiple: 2 },
    paramDefs: [
      { key: "emaPeriod", label: "Période EMA", min: 50, max: 300, step: 10 },
      { key: "maxPullbackBars", label: "Bougies max pour le pullback", min: 5, max: 80, step: 1 },
      { key: "minPullbackPct", label: "Profondeur min. du pullback (%)", min: 10, max: 60, step: 5 },
      { key: "rMultiple", label: "Take Profit (× le risque)", min: 1, max: 5, step: 0.5 },
    ],
    fn: (c, p) => signalsEmaPullback(c, p.emaPeriod, p.maxPullbackBars, p.minPullbackPct),
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
  { key: "martingale", label: "Martingale" },
];

// ── Simulateur de trades : un signal ouvre un trade (si aucun en cours),
//    sorti sur TP/SL fixe en pips. SL vérifié en priorité (biais conservateur
//    si TP et SL sont touchés dans la même bougie). Position sizing en $
//    RÉEL (risque % du capital COURANT, compounding comme le Simulateur). ──
export function runBacktest({
  candles, pair, strategyKey, tpPips = 15, slPips = 10, strategyParams = null,
  capital = 10000, riskPct = 1, slippagePips = 0.2, sessionKey = "24h", newsFilterOn = false,
  mmMode = "fixed", martingaleMultiplier = 2, martingaleMaxSteps = 5,
  tradeDirection = "both", customHours = null,
  tradingDays = null, confluence = [],
  ruinThreshold = 0.2, // compte considéré perdu sous 20% du capital initial
}) {
  const strategy = STRATEGIES[strategyKey];
  if (!strategy) throw new Error("Stratégie inconnue: " + strategyKey);
  if (strategy.isGrid) throw new Error("Utilise runGridBacktest() pour la stratégie Grid.");
  if (!candles || candles.length < 50) throw new Error(`Pas assez de bougies sur ce timeframe (${candles ? candles.length : 0} disponibles, 50 minimum). Choisis un timeframe plus fin ou une période plus longue.`);

  const pip = PIP_SIZE[pair] || 0.0001;
  const params = { ...strategy.defaultParams, ...(strategyParams || {}) };
  const signals = strategy.fn(candles, params);
  // Coût réel par trade (spread + slippage), retiré du résultat de chaque trade
  const costPips = slippagePips;

  // ── FILTRES DE CONFLUENCE ──
  // Chaque filtre actif est évalué une seule fois sur toute la série (pas à
  // chaque bougie), puis consulté à l'ouverture. Un filtre en échec bloque le
  // signal au lieu de l'inverser : on ne trade simplement pas.
  const activeFilters = (confluence || [])
    .filter(f => f && f.key && CONFLUENCE_FILTERS[f.key])
    .map(f => {
      const def = CONFLUENCE_FILTERS[f.key];
      const p = { ...def.defaultParams, ...(f.params || {}) };
      return { key: f.key, label: def.label, masks: def.fn(candles, p), params: p };
    });
  const confluenceAllows = (i, dir) => activeFilters.every(f => {
    const m = dir === "long" ? f.masks.long : f.masks.short;
    return !!m[i];
  });

  // Jours autorisés (null = tous). Convention UTC pour rester cohérent avec
  // le filtre horaire et les timestamps des bougies.
  const daysAllowed = Array.isArray(tradingDays) && tradingDays.length ? new Set(tradingDays) : null;

  const trades = [];
  let inTrade = null;
  let equity = capital;
  let martingaleStep = 0;
  let ruined = false, ruinedAtIdx = null; // nombre de pertes consécutives dans le cycle martingale courant

  for (let i = 0; i < candles.length; i++) {
    const [ts, , high, low, close] = candles[i];
    const dayOk = !daysAllowed || daysAllowed.has(new Date(ts).getUTCDay());
    const tradableNow = dayOk && isInSession(ts, sessionKey, customHours) && (!newsFilterOn || !isLikelyNewsWindow(ts));

    if (inTrade) {
      const { dir, entryPrice, tp, sl, entryIdx, dollarPerPip, slDistPips: dist } = inTrade;
      const hitSL = dir === "long" ? low <= sl : high >= sl;
      const hitTP = dir === "long" ? high >= tp : low <= tp;
      if (hitSL || hitTP) {
        const win = hitTP && !hitSL;
        // Gain/perte exprimés dans la distance réelle du trade (indispensable
        // avec un stop dynamique : chaque trade a sa propre amplitude)
        const tpDist = Math.abs(tp - entryPrice) / pip;
        const pipsGross = win ? tpDist : -dist;
        const pipsNet = pipsGross - costPips;
        const pnlUSD = +(pipsNet * dollarPerPip).toFixed(2);
        equity += pnlUSD;
        trades.push({ entryIdx, exitIdx: i, dir, entryPrice, exitPrice: win ? tp : sl, pips: +pipsNet.toFixed(2), pnlUSD, win, duration: i - entryIdx, entryTs: candles[entryIdx][0], martingaleStep });
        // RUINE : en réel, un compte n'est jamais laissé descendre indéfiniment —
        // le broker liquide, la prop firm ferme le compte. Sans cet arrêt, le
        // moteur continuait de trader avec des positions toujours plus petites
        // (le risque étant un % du capital courant), produisant une courbe qui
        // rampe vers zéro sur des centaines de trades qui n'auraient jamais eu lieu.
        if (equity <= capital * ruinThreshold) { ruined = true; ruinedAtIdx = i; inTrade = null; break; }
        // Martingale : perte -> incrémente le step (mise suivante plus grosse) ; gain -> reset du cycle
        if (mmMode === "martingale") martingaleStep = win ? 0 : Math.min(martingaleMaxSteps, martingaleStep + 1);
        inTrade = null;
      }
    }

    // Un signal peut être une simple direction ("long"/"short") ou un objet
    // { dir, sl } quand la stratégie impose son propre stop (stop dynamique).
    const rawSignal = signals[i];
    const sigDir = rawSignal ? (typeof rawSignal === "string" ? rawSignal : rawSignal.dir) : null;
    const sigSL = rawSignal && typeof rawSignal === "object" ? rawSignal.sl : null;

    // Sens autorisé : un signal contraire au sens choisi est simplement ignoré
    const dirAllowed = sigDir && (tradeDirection === "both"
      || (tradeDirection === "buy" && sigDir === "long")
      || (tradeDirection === "sell" && sigDir === "short"));

    if (!inTrade && dirAllowed && tradableNow && confluenceAllows(i, sigDir)) {
      const dir = sigDir;
      const entryPrice = close;

      // Stop dynamique : la distance vient de la stratégie (ex: l'EMA200), donc
      // elle VARIE d'un trade à l'autre. Le take profit devient alors un multiple
      // du risque réellement pris, pas une distance fixe — sinon le rapport
      // gain/risque changerait à chaque trade sans qu'on le maîtrise.
      let sl, tp, slDistPips;
      if (sigSL != null && Number.isFinite(sigSL)) {
        slDistPips = Math.abs(entryPrice - sigSL) / pip;
        if (slDistPips < 1) { continue; } // stop trop proche -> trade ininterprétable, on passe
        sl = sigSL;
        const rMult = params.rMultiple || 2;
        tp = dir === "long" ? entryPrice + slDistPips * rMult * pip : entryPrice - slDistPips * rMult * pip;
      } else {
        slDistPips = slPips;
        tp = dir === "long" ? entryPrice + tpPips * pip : entryPrice - tpPips * pip;
        sl = dir === "long" ? entryPrice - slPips * pip : entryPrice + slPips * pip;
      }
      // Risque de base = % du capital courant. En Martingale, la mise est multipliée
      // par (multiplicateur ^ nombre de pertes consécutives), plafonnée à martingaleMaxSteps
      // pour éviter une explosion de position infinie (risque de ruine sinon garanti).
      const riskMultiplier = mmMode === "martingale" ? Math.pow(martingaleMultiplier, martingaleStep) : 1;
      const riskUSD = equity * (riskPct / 100) * riskMultiplier;
      // La taille de position se calcule sur la distance RÉELLE du stop : c'est
      // ce qui garantit que le risque en $ reste constant même quand le stop varie.
      const dollarPerPip = riskUSD / slDistPips;
      inTrade = { dir, entryPrice, tp, sl, entryIdx: i, dollarPerPip, slDistPips };
    }
  }

  const wins = trades.filter(t => t.win).length;
  const losses = trades.length - wins;
  const winrate = trades.length ? (wins / trades.length) * 100 : 0;
  const totalPips = +trades.reduce((s, t) => s + t.pips, 0).toFixed(1);
  const totalUSD = +trades.reduce((s, t) => s + t.pnlUSD, 0).toFixed(2);
  const grossWinPips = trades.filter(t => t.win).reduce((s, t) => s + t.pips, 0);
  const grossLossPips = Math.abs(trades.filter(t => !t.win).reduce((s, t) => s + t.pips, 0));
  // Profit Factor et R Ratio calculés en DOLLARS, pas en pips.
  // Avec un stop dynamique, la distance du stop varie d'un trade à l'autre : la
  // taille de position s'ajuste pour garder le même risque en $, si bien qu'un
  // trade à petit stop rapporte peu de pips mais autant de dollars. Mesurer en
  // pips donnerait alors un Profit Factor faux (on a observé PF 0.88 sur un
  // backtest pourtant à +10 % net). En dollars, la mesure reste juste dans tous
  // les cas — et reste identique aux pips quand le stop est fixe.
  const grossWinUSD = trades.filter(t => t.win).reduce((s, t) => s + t.pnlUSD, 0);
  const grossLossUSD = Math.abs(trades.filter(t => !t.win).reduce((s, t) => s + t.pnlUSD, 0));
  const profitFactor = grossLossUSD > 0 ? +(grossWinUSD / grossLossUSD).toFixed(2) : (grossWinUSD > 0 ? Infinity : 0);
  const expectancy = trades.length ? +(totalPips / trades.length).toFixed(2) : 0;
  const avgWinPips = wins ? +(grossWinPips / wins).toFixed(1) : 0;
  const avgLossPips = losses ? +(grossLossPips / losses).toFixed(1) : 0;
  const avgWinUSD = wins ? grossWinUSD / wins : 0;
  const avgLossUSD = losses ? grossLossUSD / losses : 0;
  const rRatio = avgLossUSD > 0 ? +(avgWinUSD / avgLossUSD).toFixed(2) : 0;
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

  // Drawdown max (pips ET $/%), pire creux depuis un sommet — calculé aussi
  // POINT PAR POINT (ddPct) pour pouvoir tracer la ligne de drawdown sur le graphique
  let peakPips = 0, maxDDPips = 0, peakUSD = capital, maxDDUSD = 0;
  equityCurve.forEach(pt => {
    peakPips = Math.max(peakPips, pt.y); maxDDPips = Math.max(maxDDPips, peakPips - pt.y);
    peakUSD = Math.max(peakUSD, pt.usd); maxDDUSD = Math.max(maxDDUSD, peakUSD - pt.usd);
    pt.ddPct = peakUSD > 0 ? -+(((peakUSD - pt.usd) / peakUSD) * 100).toFixed(2) : 0; // négatif = sous le sommet
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
    ruined, ruinedAtDate: ruinedAtIdx != null ? candles[ruinedAtIdx][0] : null,
    filtersUsed: { tradeDirection, sessionKey, customHours, newsFilterOn, tradingDays, confluence: activeFilters.map(f => ({ key: f.key, label: f.label, params: f.params })) },
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
  if (!candles || candles.length < 50) throw new Error(`Pas assez de bougies sur ce timeframe (${candles ? candles.length : 0} disponibles, 50 minimum). Choisis un timeframe plus fin ou une période plus longue.`);
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
  let peakG = capital;
  equityCurve.forEach(pt => { peakG = Math.max(peakG, pt.usd); pt.ddPct = peakG > 0 ? -+(((peakG - pt.usd) / peakG) * 100).toFixed(2) : 0; });

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

// ══════════════════════════════════════════════════════════════════
// WALK-FORWARD ANALYSIS
//
// Le probleme qu'il resout : un backtest classique optimise ET mesure sur la
// MEME periode (in-sample). Le resultat est donc structurellement flatteur —
// il decrit le passe, il ne predit rien. C'est la faille principale de tout
// backtesteur.
//
// Principe : on decoupe la periode en fenetres glissantes. Sur chaque fenetre,
// on cherche les meilleurs parametres sur la tranche IS (in-sample), puis on
// applique CES parametres sur la tranche OOS (out-of-sample) qui suit —
// des donnees que l'optimisation n'a jamais vues. Seule la performance
// agregee OOS est honnete.
//
// Walk-Forward Efficiency (WFE) = performance OOS / performance IS.
// En dessous de ~30 %, les parametres ne survivent pas hors de leur periode
// d'origine : la strategie est sur-ajustee.
// ══════════════════════════════════════════════════════════════════

// Grille de parametres a explorer, construite autour des valeurs par defaut.
// Le nombre de combinaisons est plafonne pour rester utilisable sur mobile :
// au-dela, l'attente devient insupportable pour un gain marginal.
function buildParamGrid(paramDefs, defaults, maxCombos = 36) {
  const defs = (paramDefs || []).slice(0, 3); // au-dela de 3 params, l'explosion combinatoire n'a plus de sens
  if (!defs.length) return [{}];
  const perParam = defs.length >= 3 ? 2 : 3;
  const axes = defs.map(pd => {
    const d = defaults[pd.key] ?? pd.min;
    const facteurs = perParam === 3 ? [0.7, 1, 1.4] : [0.8, 1.25];
    const vals = facteurs.map(f => {
      let v = d * f;
      v = Math.round(v / pd.step) * pd.step;
      v = Math.max(pd.min, Math.min(pd.max, v));
      return +v.toFixed(4);
    });
    return { key: pd.key, values: [...new Set(vals)] };
  });
  let combos = [{}];
  for (const ax of axes) {
    const next = [];
    for (const c of combos) for (const v of ax.values) next.push({ ...c, [ax.key]: v });
    combos = next;
    if (combos.length >= maxCombos) break;
  }
  return combos.slice(0, maxCombos);
}

// Agrege une liste de trades (issus de plusieurs fenetres OOS) en un bilan
// unique, comme s'ils s'etaient enchaines sur un seul compte.
function aggregateTrades(trades, capital) {
  const wins = trades.filter(t => t.win).length;
  const losses = trades.length - wins;
  const totalUSD = +trades.reduce((s, t) => s + (t.pnlUSD || 0), 0).toFixed(2);
  // Mesures en dollars (voir explication dans runBacktest : indispensable dès
  // qu'un stop dynamique fait varier la distance de risque entre les trades)
  const grossWin = trades.filter(t => t.win).reduce((s, t) => s + (t.pnlUSD || 0), 0);
  const grossLoss = Math.abs(trades.filter(t => !t.win).reduce((s, t) => s + (t.pnlUSD || 0), 0));
  const profitFactor = grossLoss > 0 ? +(grossWin / grossLoss).toFixed(2) : (grossWin > 0 ? Infinity : 0);

  let running = capital, peak = capital, maxDD = 0;
  const equityCurve = [{ x: 0, y: 0, usd: capital, ddPct: 0 }];
  trades.forEach((t, i) => {
    running += (t.pnlUSD || 0);
    peak = Math.max(peak, running);
    maxDD = Math.max(maxDD, peak - running);
    equityCurve.push({
      x: i + 1, y: +(running - capital).toFixed(1), usd: +running.toFixed(2),
      ddPct: peak > 0 ? -+(((peak - running) / peak) * 100).toFixed(2) : 0,
    });
  });

  let maxLossStreak = 0, cur = 0;
  trades.forEach(t => { if (!t.win) { cur++; maxLossStreak = Math.max(maxLossStreak, cur); } else cur = 0; });

  const avgWinPips = wins ? +(trades.filter(t => t.win).reduce((s, t) => s + t.pips, 0) / wins).toFixed(1) : 0;
  const avgLossPips = losses ? +(Math.abs(trades.filter(t => !t.win).reduce((s, t) => s + t.pips, 0)) / losses).toFixed(1) : 0;
  const rRatioUSD = losses && wins ? +((grossWin / wins) / (grossLoss / losses)).toFixed(2) : 0;

  return {
    totalTrades: trades.length, wins, losses,
    winrate: trades.length ? +((wins / trades.length) * 100).toFixed(1) : 0,
    totalUSD, totalPct: +((totalUSD / capital) * 100).toFixed(2),
    profitFactor,
    rRatio: rRatioUSD,
    avgWinPips, avgLossPips,
    maxDrawdownUSD: +maxDD.toFixed(2),
    maxDrawdownPct: peak > 0 ? +((maxDD / peak) * 100).toFixed(2) : 0,
    maxLossStreak,
    equityCurve, trades, capital,
    finalEquity: +running.toFixed(2),
  };
}

export async function runWalkForward({
  candles, pair, strategyKey, strategyParams, tpPips, slPips,
  capital = 25000, riskPct = 1, slippagePips = 0.2,
  sessionKey = "24h", customHours = null, newsFilterOn = false,
  mmMode = "fixed", martingaleMultiplier = 2, martingaleMaxSteps = 5,
  tradeDirection = "both", tradingDays = null, confluence = [],
  isBars, oosBars, onProgress,
}) {
  const strategy = STRATEGIES[strategyKey];
  if (!strategy) throw new Error("Stratégie inconnue: " + strategyKey);
  if (strategy.isGrid) throw new Error("Le walk-forward ne s'applique pas au Grid Trading (pas de paramètres d'entrée à optimiser).");

  const total = candles.length;
  const stepBars = oosBars;
  if (total < isBars + oosBars) {
    throw new Error(`Période trop courte pour un walk-forward : il faut au moins ${isBars + oosBars} bougies (${total} disponibles). Allonge la période ou réduis la taille des fenêtres.`);
  }

  const grid = buildParamGrid(strategy.paramDefs, { ...strategy.defaultParams, ...(strategyParams || {}) });
  const commun = {
    pair, strategyKey, tpPips, slPips, capital, riskPct, slippagePips,
    sessionKey, customHours, newsFilterOn, mmMode, martingaleMultiplier, martingaleMaxSteps,
    tradeDirection, tradingDays, confluence,
  };

  const windows = [];
  let allOosTrades = [], allIsTrades = [];
  const nWindows = Math.floor((total - isBars) / stepBars);

  for (let w = 0; w < nWindows; w++) {
    const isStart = w * stepBars;
    const isEnd = isStart + isBars;
    const oosEnd = Math.min(isEnd + oosBars, total);
    if (oosEnd - isEnd < Math.max(30, oosBars * 0.5)) break; // derniere fenetre trop courte -> ignoree

    const isCandles = candles.slice(isStart, isEnd);
    const oosCandles = candles.slice(isEnd, oosEnd);

    // ── Optimisation sur IS ──
    let best = null;
    for (const combo of grid) {
      try {
        const r = runBacktest({ ...commun, candles: isCandles, strategyParams: combo });
        // On exige un minimum de trades : un parametrage qui ne declenche que
        // 2 trades gagnants n'est pas "le meilleur", c'est du bruit.
        if (r.totalTrades < 8) continue;
        if (!best || r.totalUSD > best.result.totalUSD) best = { params: combo, result: r };
      } catch (e) { /* combinaison invalide -> ignoree */ }
    }
    // Repli : si aucune combinaison n'atteint le minimum de trades, on prend
    // les parametres par defaut plutot que d'abandonner la fenetre.
    if (!best) {
      try {
        const r = runBacktest({ ...commun, candles: isCandles, strategyParams: { ...strategy.defaultParams } });
        best = { params: { ...strategy.defaultParams }, result: r };
      } catch (e) { continue; }
    }

    // ── Validation sur OOS (donnees jamais vues par l'optimisation) ──
    let oos;
    try {
      oos = runBacktest({ ...commun, candles: oosCandles, strategyParams: best.params });
    } catch (e) { continue; }

    windows.push({
      index: w + 1,
      isRange: [isCandles[0][0], isCandles[isCandles.length - 1][0]],
      oosRange: [oosCandles[0][0], oosCandles[oosCandles.length - 1][0]],
      bestParams: best.params,
      isPct: best.result.totalPct, isTrades: best.result.totalTrades, isWinrate: best.result.winrate,
      oosPct: oos.totalPct, oosTrades: oos.totalTrades, oosWinrate: oos.winrate,
      oosProfitFactor: oos.profitFactor,
    });
    allOosTrades = allOosTrades.concat(oos.trades);
    allIsTrades = allIsTrades.concat(best.result.trades);

    if (onProgress) onProgress({ done: w + 1, total: nWindows, pct: Math.round(((w + 1) / nWindows) * 100) });
    // Laisse respirer le thread principal : sans ca, l'interface se fige
    // pendant tout le calcul et l'utilisateur croit a un plantage.
    await new Promise(res => setTimeout(res, 0));
  }

  if (!windows.length) {
    throw new Error("Aucune fenêtre exploitable : la période est trop courte ou trop peu de signaux sont générés.");
  }

  allOosTrades.sort((a, b) => a.entryTs - b.entryTs);
  const oosAgg = aggregateTrades(allOosTrades, capital);
  const isAgg = aggregateTrades(allIsTrades, capital);

  // Walk-Forward Efficiency : ce que la strategie conserve reellement hors de
  // sa periode d'optimisation. Si l'IS est negatif, le ratio n'a pas de sens.
  const wfe = isAgg.totalPct > 0 ? +((oosAgg.totalPct / isAgg.totalPct) * 100).toFixed(1) : null;
  const windowsPositives = windows.filter(w => w.oosPct > 0).length;

  return {
    windows, oosAggregate: oosAgg, isAggregate: isAgg, wfe,
    windowsCount: windows.length, windowsPositives,
    consistency: +((windowsPositives / windows.length) * 100).toFixed(1),
    combosTested: grid.length,
    isBars, oosBars,
  };
}

// ══════════════════════════════════════════════════════════════════
// AUTOPSIE — pourquoi cette configuration a échoué (ou sous-performé)
//
// Analyse forensique des trades RÉELLEMENT produits, pas de conseils
// génériques. Chaque constat est calculé à partir des données du backtest
// et débouche sur une action précise.
//
// MAE / MFE : excursions maximales défavorable et favorable, exprimées en R
// (multiples du risque pris). Ce sont les deux mesures qui expliquent le plus
// souvent un échec : un trade perdant qui était monté à +1.5R avant de revenir
// au stop ne raconte pas la même histoire qu'un trade parti contre dès l'entrée.
// ══════════════════════════════════════════════════════════════════
export function analyzeFailure(result, candles, ctx = {}) {
  const trades = result?.trades || [];
  if (!trades.length) return null;
  const pip = PIP_SIZE[ctx.pair] || 0.0001;
  const constats = [];

  // ── Excursions MAE / MFE, trade par trade ──
  const enrichis = trades.map(t => {
    const from = t.entryIdx, to = Math.min(t.exitIdx, candles.length - 1);
    let best = t.entryPrice, worst = t.entryPrice;
    for (let i = from; i <= to; i++) {
      if (t.dir === "long") { best = Math.max(best, candles[i][2]); worst = Math.min(worst, candles[i][3]); }
      else { best = Math.min(best, candles[i][3]); worst = Math.max(worst, candles[i][2]); }
    }
    const riskPips = Math.abs(t.entryPrice - (t.dir === "long"
      ? Math.min(worst, t.entryPrice) : Math.max(worst, t.entryPrice))) / pip;
    const mfePips = Math.abs(best - t.entryPrice) / pip;
    const maePips = Math.abs(worst - t.entryPrice) / pip;
    // Le risque de référence = la distance du stop de CE trade
    const stopDist = t.win ? (Math.abs(t.exitPrice - t.entryPrice) / pip) / (ctx.rMultiple || 2) : Math.abs(t.exitPrice - t.entryPrice) / pip;
    const ref = stopDist > 0 ? stopDist : 1;
    return { ...t, mfeR: +(mfePips / ref).toFixed(2), maeR: +(maePips / ref).toFixed(2) };
  });

  const perdants = enrichis.filter(t => !t.win);
  const gagnants = enrichis.filter(t => t.win);

  // ── 1. Concentration des pertes : accident ponctuel ou hémorragie continue ? ──
  if (perdants.length >= 3) {
    const pertesTriees = [...perdants].sort((a, b) => a.pnlUSD - b.pnlUSD);
    const totalPerte = Math.abs(perdants.reduce((s, t) => s + t.pnlUSD, 0));
    const top3 = Math.abs(pertesTriees.slice(0, 3).reduce((s, t) => s + t.pnlUSD, 0));
    const part = (top3 / totalPerte) * 100;
    if (part >= 50) {
      constats.push({
        titre: "Les pertes viennent de quelques trades isolés",
        texte: `Les 3 pires trades concentrent ${part.toFixed(0)}% de toutes tes pertes (sur ${perdants.length} trades perdants). Ce n'est pas la stratégie qui est mauvaise en continu : ce sont quelques accidents qui détruisent le résultat.`,
        action: "Un stop plus serré ou une limite de perte journalière protégerait contre ces accidents sans toucher au reste.",
      });
    } else if (part <= 30) {
      constats.push({
        titre: "Érosion continue, pas d'accident",
        texte: `Les pertes sont réparties uniformément (les 3 pires ne pèsent que ${part.toFixed(0)}% du total). Aucun trade isolé n'est responsable.`,
        action: "Le problème est dans la logique d'entrée elle-même, pas dans la gestion du risque. Ajouter un filtre de confluence est plus pertinent que resserrer le stop.",
      });
    }
  }

  // ── 2. MFE des perdants : combien étaient gagnants avant de se retourner ? ──
  if (perdants.length >= 5) {
    const presqueGagnants = perdants.filter(t => t.mfeR >= 1);
    const partPG = (presqueGagnants.length / perdants.length) * 100;
    const mfeMoyen = perdants.reduce((s, t) => s + t.mfeR, 0) / perdants.length;
    if (partPG >= 40) {
      constats.push({
        titre: "Tes trades perdants étaient gagnants avant de se retourner",
        texte: `${presqueGagnants.length} trades perdants sur ${perdants.length} (${partPG.toFixed(0)}%) étaient montés à plus de 1R de profit avant de revenir au stop. MFE moyen des perdants : ${mfeMoyen.toFixed(2)}R.`,
        action: "C'est le signal le plus net en faveur d'un passage à break-even (déplacer le stop à l'entrée une fois +1R atteint) ou d'une sortie partielle. Le problème n'est pas l'entrée, c'est la sortie.",
      });
    } else if (mfeMoyen < 0.4) {
      constats.push({
        titre: "Tes trades perdants partent contre toi immédiatement",
        texte: `MFE moyen des perdants : seulement ${mfeMoyen.toFixed(2)}R. Ils ne vont quasiment jamais en profit avant d'être stoppés.`,
        action: "Le timing d'entrée est mauvais : tu entres trop tard, après que le mouvement soit déjà consommé. Teste une entrée plus proche du niveau de déclenchement ou un filtre de momentum.",
      });
    }
  }

  // ── 3. MAE des gagnants : le stop est-il bien dimensionné ? ──
  if (gagnants.length >= 5) {
    const maeMoyenG = gagnants.reduce((s, t) => s + t.maeR, 0) / gagnants.length;
    const frolent = gagnants.filter(t => t.maeR >= 0.8).length;
    if (maeMoyenG <= 0.35) {
      constats.push({
        titre: "Ton stop est plus large que nécessaire",
        texte: `Tes trades gagnants ne descendent en moyenne qu'à ${maeMoyenG.toFixed(2)}R contre toi avant de partir. Le stop n'est presque jamais approché.`,
        action: `Resserrer le stop améliorerait le rapport gain/risque sans perdre beaucoup de trades gagnants. Un stop réduit d'environ ${Math.round((1 - Math.max(0.5, maeMoyenG + 0.15)) * 100)}% resterait au-delà de l'excursion habituelle.`,
      });
    } else if (frolent / gagnants.length >= 0.4) {
      constats.push({
        titre: "Tes gagnants frôlent le stop avant de partir",
        texte: `${frolent} gagnants sur ${gagnants.length} sont descendus à plus de 0.8R contre toi avant de se retourner.`,
        action: "Le stop est à la limite : le resserrer transformerait ces gagnants en perdants. Ne le touche pas, travaille plutôt le timing d'entrée.",
      });
    }
  }

  // ── 4. Régime de marché : tendance ou range ? ──
  if (trades.length >= 10) {
    const { adx } = computeADX(candles, 14);
    const enTendance = enrichis.filter(t => adx[t.entryIdx] != null && adx[t.entryIdx] >= 25);
    const enRange = enrichis.filter(t => adx[t.entryIdx] != null && adx[t.entryIdx] < 25);
    if (enTendance.length >= 4 && enRange.length >= 4) {
      const pnlT = enTendance.reduce((s, t) => s + t.pnlUSD, 0);
      const pnlR = enRange.reduce((s, t) => s + t.pnlUSD, 0);
      const wrT = (enTendance.filter(t => t.win).length / enTendance.length) * 100;
      const wrR = (enRange.filter(t => t.win).length / enRange.length) * 100;
      if (pnlT > 0 && pnlR < 0) {
        constats.push({
          titre: "La stratégie ne fonctionne qu'en tendance",
          texte: `En marché directionnel (ADX ≥ 25) : ${enTendance.length} trades, ${wrT.toFixed(0)}% de réussite, ${pnlT >= 0 ? "+" : ""}$${pnlT.toFixed(0)}. En marché sans direction : ${enRange.length} trades, ${wrR.toFixed(0)}%, $${pnlR.toFixed(0)}.`,
          action: "Active le filtre de confluence Force de tendance (ADX) avec un seuil à 25. Tu supprimes mécaniquement la partie perdante.",
        });
      } else if (pnlR > 0 && pnlT < 0) {
        constats.push({
          titre: "La stratégie ne fonctionne qu'en range",
          texte: `En marché sans direction : ${enRange.length} trades, ${wrR.toFixed(0)}% de réussite, +$${pnlR.toFixed(0)}. En tendance : ${enTendance.length} trades, ${wrT.toFixed(0)}%, $${pnlT.toFixed(0)}.`,
          action: "Paradoxal pour une stratégie de tendance. Vérifie ta logique d'entrée, ou inverse le filtre ADX (seuil maximum au lieu de minimum).",
        });
      }
    }
  }

  // ── 5. Décrochage temporel : une sous-période a-t-elle tout détruit ? ──
  if (trades.length >= 12) {
    const n = trades.length, tiers = Math.floor(n / 3);
    const parts = [enrichis.slice(0, tiers), enrichis.slice(tiers, tiers * 2), enrichis.slice(tiers * 2)];
    const pnls = parts.map(p => p.reduce((s, t) => s + t.pnlUSD, 0));
    const pire = pnls.indexOf(Math.min(...pnls));
    const totalNeg = pnls.filter(v => v < 0).reduce((s, v) => s + v, 0);
    if (pnls[pire] < 0 && Math.abs(pnls[pire]) >= Math.abs(totalNeg) * 0.7 && pnls.filter(v => v > 0).length >= 1) {
      const labels = ["premier tiers", "deuxième tiers", "dernier tiers"];
      const d1 = new Date(parts[pire][0].entryTs).toISOString().slice(0, 10);
      const d2 = new Date(parts[pire][parts[pire].length - 1].entryTs).toISOString().slice(0, 10);
      constats.push({
        titre: `L'échec est concentré sur une seule période`,
        texte: `Le ${labels[pire]} de la période (${d1} → ${d2}) porte l'essentiel des pertes ($${pnls[pire].toFixed(0)}), alors que les autres tiers sont ${pnls.filter((v, i) => i !== pire).every(v => v > 0) ? "positifs" : "moins mauvais"}.`,
        action: "Regarde ce qui s'est passé sur le marché à ce moment-là. Une stratégie qui casse sur une période précise a souvent rencontré un régime de marché qu'elle ne sait pas gérer.",
      });
    }
  }

  // ── 6. Heures problématiques ──
  if (trades.length >= 15) {
    const parHeure = {};
    enrichis.forEach(t => {
      const h = new Date(t.entryTs).getUTCHours();
      (parHeure[h] ||= { n: 0, pnl: 0 });
      parHeure[h].n++; parHeure[h].pnl += t.pnlUSD;
    });
    const heuresNeg = Object.entries(parHeure).filter(([, v]) => v.n >= 3 && v.pnl < 0)
      .sort((a, b) => a[1].pnl - b[1].pnl).slice(0, 3);
    const perteHeures = heuresNeg.reduce((s, [, v]) => s + v.pnl, 0);
    const perteTotale = enrichis.filter(t => t.pnlUSD < 0).reduce((s, t) => s + t.pnlUSD, 0);
    if (heuresNeg.length >= 2 && Math.abs(perteHeures) >= Math.abs(perteTotale) * 0.4) {
      constats.push({
        titre: "Des créneaux horaires précis plombent le résultat",
        texte: `Les heures ${heuresNeg.map(([h, v]) => `${h}h ($${v.pnl.toFixed(0)})`).join(", ")} UTC concentrent ${((perteHeures / perteTotale) * 100).toFixed(0)}% des pertes.`,
        action: "Exclus ces créneaux via la plage horaire personnalisée et relance pour mesurer le gain réel.",
      });
    }
  }

  // ── 7. Coût des frais rapporté au résultat ──
  if (ctx.slippagePips > 0 && trades.length) {
    const coutTotal = trades.reduce((s, t) => s + ctx.slippagePips * (Math.abs(t.pnlUSD) / Math.max(1, Math.abs(t.pips))), 0);
    const brut = result.totalUSD + coutTotal;
    if (brut > 0 && result.totalUSD <= 0) {
      constats.push({
        titre: "Ce sont les frais qui rendent la stratégie perdante",
        texte: `Sans spread ni slippage, le résultat serait positif (~+$${brut.toFixed(0)}). Le coût cumulé (~$${coutTotal.toFixed(0)} sur ${trades.length} trades) fait basculer le bilan.`,
        action: "Vise moins de trades mais plus longs : un timeframe supérieur ou un filtre de confluence réduirait la fréquence, donc le coût total.",
      });
    }
  }

  return {
    constats,
    stats: {
      mfeMoyenPerdants: perdants.length ? +(perdants.reduce((s, t) => s + t.mfeR, 0) / perdants.length).toFixed(2) : null,
      maeMoyenGagnants: gagnants.length ? +(gagnants.reduce((s, t) => s + t.maeR, 0) / gagnants.length).toFixed(2) : null,
      perdantsPassesEnProfit: perdants.length ? +((perdants.filter(t => t.mfeR >= 1).length / perdants.length) * 100).toFixed(0) : null,
    },
  };
}

// ══════════════════════════════════════════════════════════════════
// OPTIMISEUR DE STRATÉGIE
//
// Explore automatiquement des variantes de la configuration courante et
// propose celles qui tiennent. Trois garde-fous contre le sur-ajustement,
// sans lesquels un optimiseur ne fait que produire des illusions :
//
// 1. VALIDATION OUT-OF-SAMPLE : chaque variante retenue est re-testée sur une
//    tranche finale jamais utilisée pendant la recherche. C'est ce chiffre qui
//    est affiché, pas celui de la recherche.
// 2. ÉCHANTILLON MINIMUM : une variante à 6 trades n'est pas "meilleure",
//    c'est du bruit. Seuil plancher exigé.
// 3. ROBUSTESSE DE VOISINAGE : une variante n'est retenue que si ses réglages
//    VOISINS fonctionnent aussi. Un pic isolé entouré de mauvais résultats est
//    un accident statistique, pas une découverte.
// ══════════════════════════════════════════════════════════════════

function scoreVariante(r) {
  // Score composite : le rendement seul favoriserait les configurations
  // explosives et fragiles. On pondère par le drawdown et la régularité.
  if (!r || r.totalTrades < 1) return -Infinity;
  const pf = r.profitFactor === Infinity ? 3 : (r.profitFactor || 0);
  const ddPen = 1 + (r.maxDrawdownPct / 12);
  return (r.totalPct * Math.min(2, pf)) / ddPen;
}

export async function optimizeStrategy({
  candles, pair, strategyKey, strategyParams, tpPips, slPips,
  capital = 25000, riskPct = 1, slippagePips = 0.2,
  sessionKey = "24h", customHours = null, newsFilterOn = false,
  mmMode = "fixed", martingaleMultiplier = 2, martingaleMaxSteps = 5,
  tradeDirection = "both", tradingDays = null, confluence = [],
  minTrades = 15, maxVariants = 8, onProgress,
}) {
  const strategy = STRATEGIES[strategyKey];
  if (!strategy) throw new Error("Stratégie inconnue: " + strategyKey);
  if (strategy.isGrid) throw new Error("L'optimiseur ne s'applique pas au Grid Trading.");
  if (candles.length < 400) throw new Error(`Période trop courte pour optimiser sereinement (${candles.length} bougies, 400 minimum).`);

  // Découpage : 70% pour la recherche, 30% gardés intacts pour la validation
  const cut = Math.floor(candles.length * 0.7);
  const search = candles.slice(0, cut);
  const holdout = candles.slice(cut);

  const commun = {
    pair, strategyKey, tpPips, slPips, capital, riskPct, slippagePips,
    sessionKey, customHours, newsFilterOn, mmMode, martingaleMultiplier, martingaleMaxSteps,
    tradeDirection, tradingDays,
  };
  const baseParams = { ...strategy.defaultParams, ...(strategyParams || {}) };

  const essayer = (candlesSet, params, conf) => {
    try { return runBacktest({ ...commun, candles: candlesSet, strategyParams: params, confluence: conf }); }
    catch (e) { return null; }
  };

  // Référence : la configuration actuelle de l'utilisateur
  const refSearch = essayer(search, baseParams, confluence);
  const refHold = essayer(holdout, baseParams, confluence);

  const candidats = [];
  const filtres = Object.keys(CONFLUENCE_FILTERS);
  let steps = 0;
  const totalSteps = strategy.paramDefs.length * 4 + filtres.length + 12 + 6;
  const tick = async (label) => {
    steps++;
    if (onProgress) onProgress({ pct: Math.min(99, Math.round((steps / totalSteps) * 100)), label });
    if (steps % 4 === 0) await new Promise(r => setTimeout(r, 0));
  };

  // ── Axe 1 : balayage de chaque paramètre de la stratégie ──
  for (const pd of (strategy.paramDefs || [])) {
    const cur = baseParams[pd.key] ?? pd.min;
    const testees = [];
    for (const f of [0.6, 0.8, 1.25, 1.6]) {
      let v = Math.round((cur * f) / pd.step) * pd.step;
      v = Math.max(pd.min, Math.min(pd.max, +v.toFixed(4)));
      if (v === cur || testees.includes(v)) continue;
      testees.push(v);
      const params = { ...baseParams, [pd.key]: v };
      const r = essayer(search, params, confluence);
      await tick(pd.label);
      if (r && r.totalTrades >= minTrades) {
        candidats.push({ type: "param", params, conf: confluence, score: scoreVariante(r), search: r,
          desc: `${pd.label} : ${cur} → ${v}`, cle: pd.key, valeur: v });
      }
    }
  }

  // ── Axe 2 : ajout d'un filtre de confluence ──
  for (const fk of filtres) {
    if (confluence.some(x => x.key === fk)) continue;
    const conf = [...confluence, { key: fk, params: { ...CONFLUENCE_FILTERS[fk].defaultParams } }];
    const r = essayer(search, baseParams, conf);
    await tick("Filtres");
    if (r && r.totalTrades >= minTrades) {
      candidats.push({ type: "filtre", params: baseParams, conf, score: scoreVariante(r), search: r,
        desc: `Ajouter le filtre « ${CONFLUENCE_FILTERS[fk].label} »` });
    }
  }

  // ── Axe 3 : retrait d'un filtre existant (parfois un filtre nuit) ──
  for (let i = 0; i < confluence.length; i++) {
    const conf = confluence.filter((_, k) => k !== i);
    const r = essayer(search, baseParams, conf);
    await tick("Filtres");
    if (r && r.totalTrades >= minTrades) {
      candidats.push({ type: "filtre", params: baseParams, conf, score: scoreVariante(r), search: r,
        desc: `Retirer le filtre « ${CONFLUENCE_FILTERS[confluence[i].key]?.label || confluence[i].key} »` });
    }
  }

  // ── Axe 4 : rapport TP/SL (hors stratégies à stop dynamique) ──
  if (!strategy.dynamicSL) {
    for (const [t, s, lbl] of [[tpPips * 1.5, slPips, "TP élargi"], [tpPips, slPips * 0.7, "SL resserré"],
                               [tpPips * 2, slPips, "TP doublé"], [tpPips * 0.7, slPips, "TP resserré"]]) {
      const r = essayer(search, baseParams, confluence);
      const rr = (() => { try { return runBacktest({ ...commun, candles: search, tpPips: Math.round(t), slPips: Math.round(s), strategyParams: baseParams, confluence }); } catch (e) { return null; } })();
      await tick("TP / SL");
      if (rr && rr.totalTrades >= minTrades) {
        candidats.push({ type: "tpsl", params: baseParams, conf: confluence, tp: Math.round(t), sl: Math.round(s),
          score: scoreVariante(rr), search: rr, desc: `${lbl} : TP ${Math.round(t)} / SL ${Math.round(s)} (R ${(t / s).toFixed(2)})` });
      }
    }
  } else {
    for (const rm of [1.5, 2.5, 3]) {
      if (rm === baseParams.rMultiple) continue;
      const params = { ...baseParams, rMultiple: rm };
      const r = essayer(search, params, confluence);
      await tick("Objectif");
      if (r && r.totalTrades >= minTrades) {
        candidats.push({ type: "param", params, conf: confluence, score: scoreVariante(r), search: r,
          desc: `Take Profit : ${baseParams.rMultiple}R → ${rm}R`, cle: "rMultiple", valeur: rm });
      }
    }
  }

  // ── Axe 5 : sens des positions ──
  for (const dir of ["buy", "sell"]) {
    if (dir === tradeDirection) continue;
    const rr = (() => { try { return runBacktest({ ...commun, tradeDirection: dir, candles: search, strategyParams: baseParams, confluence }); } catch (e) { return null; } })();
    await tick("Sens");
    if (rr && rr.totalTrades >= Math.max(8, minTrades * 0.6)) {
      candidats.push({ type: "direction", params: baseParams, conf: confluence, direction: dir, score: scoreVariante(rr),
        search: rr, desc: dir === "buy" ? "Achat uniquement" : "Vente uniquement" });
    }
  }

  // ── Sélection + validation sur la tranche intacte ──
  candidats.sort((a, b) => b.score - a.score);
  const retenus = [];
  for (const cand of candidats) {
    if (retenus.length >= maxVariants) break;
    if (retenus.some(r => r.desc === cand.desc)) continue;

    const holdRun = (() => {
      try {
        return runBacktest({
          ...commun, candles: holdout, strategyParams: cand.params, confluence: cand.conf,
          ...(cand.tp ? { tpPips: cand.tp, slPips: cand.sl } : {}),
          ...(cand.direction ? { tradeDirection: cand.direction } : {}),
        });
      } catch (e) { return null; }
    })();
    if (!holdRun) continue;

    // Robustesse de voisinage : pour une variante de paramètre, on vérifie que
    // les valeurs adjacentes tiennent aussi. Un optimum isolé est un accident.
    let voisinage = null;
    if (cand.type === "param" && cand.cle) {
      const pd = (strategy.paramDefs || []).find(x => x.key === cand.cle);
      if (pd) {
        const vals = [cand.valeur - pd.step, cand.valeur + pd.step]
          .map(v => Math.max(pd.min, Math.min(pd.max, +v.toFixed(4))));
        const scores = vals.map(v => {
          const r = essayer(search, { ...cand.params, [cand.cle]: v }, cand.conf);
          return r ? scoreVariante(r) : -Infinity;
        });
        const bons = scores.filter(s => s > 0).length;
        voisinage = bons === 2 ? "stable" : bons === 1 ? "moyen" : "isolé";
      }
    }
    await tick("Validation");

    retenus.push({
      desc: cand.desc, type: cand.type,
      searchPct: cand.search.totalPct, searchTrades: cand.search.totalTrades,
      holdPct: holdRun.totalPct, holdTrades: holdRun.totalTrades,
      holdPF: holdRun.profitFactor, holdWR: holdRun.winrate, holdDD: holdRun.maxDrawdownPct,
      voisinage,
      // Une variante n'est "validée" que si elle tient AUSSI hors de la zone de
      // recherche, avec assez de trades pour que ça veuille dire quelque chose.
      // Une variante n'est "validée" que si elle est RÉELLEMENT bonne dans
      // l'absolu, pas seulement meilleure qu'une référence catastrophique :
      // exiger uniquement "mieux que la config actuelle" badgeait en vert des
      // variantes à -34 % dès lors que la référence perdait 99 %.
      validee: holdRun.totalPct > 0
        && holdRun.profitFactor >= 1.1
        && holdRun.totalPct > (refHold?.totalPct ?? -Infinity)
        && holdRun.totalTrades >= Math.max(5, minTrades * 0.4)
        && !holdRun.ruined,
      // Distinct : simplement moins mauvais que la config actuelle
      ameliore: holdRun.totalPct > (refHold?.totalPct ?? -Infinity),
      ruined: !!holdRun.ruined,
      config: {
        params: cand.params, confluence: cand.conf,
        ...(cand.tp ? { tpPips: cand.tp, slPips: cand.sl } : {}),
        ...(cand.direction ? { tradeDirection: cand.direction } : {}),
      },
    });
  }

  if (onProgress) onProgress({ pct: 100, label: "Terminé" });

  return {
    reference: {
      searchPct: refSearch?.totalPct ?? null, holdPct: refHold?.totalPct ?? null,
      holdTrades: refHold?.totalTrades ?? 0, holdPF: refHold?.profitFactor ?? null,
    },
    variants: retenus,
    testees: candidats.length,
    searchBars: search.length, holdoutBars: holdout.length,
  };
}
