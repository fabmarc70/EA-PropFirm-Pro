// ══════════════════════════════════════════════════════════════════════════
// BOUGIES EN DIRECT — proxy serverless
// --------------------------------------------------------------------------
// Le rejeu historique est un exercice ; le direct en est un autre. Cette
// route sert les bougies RECENTES, celles qui finissent maintenant.
//
// Elle ne couvre que la CRYPTO, et c'est volontaire : ce sont les seuls
// actifs pour lesquels il existe une source publique, gratuite, sans clé et
// a jour a la seconde — et les seuls qui se traitent le week-end. Pour le
// Forex, les metaux et les indices, aucune source gratuite ne donne du
// temps reel : l'app le dit plutot que de faire semblant.
//
// Deux sources, dans cet ordre : Binance puis Coinbase. L'une refuse
// parfois les adresses de centres de donnees ; les deux ensemble tiennent.
//
// Ex : /api/klines?symbol=BTCUSD&interval=1m&limit=200
// ══════════════════════════════════════════════════════════════════════════

const UA = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
  "Accept": "application/json",
};

const BINANCE = { BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT", SOLUSD: "SOLUSDT", XRPUSD: "XRPUSDT" };
const COINBASE = { BTCUSD: "BTC-USD", ETHUSD: "ETH-USD", SOLUSD: "SOL-USD", XRPUSD: "XRP-USD" };

// Intervalle demande -> code de chaque source, et duree en secondes.
const INTERVALLES = {
  "1m":  { binance: "1m",  coinbase: 60,    sec: 60 },
  "5m":  { binance: "5m",  coinbase: 300,   sec: 300 },
  "15m": { binance: "15m", coinbase: 900,   sec: 900 },
  "1h":  { binance: "1h",  coinbase: 3600,  sec: 3600 },
  "4h":  { binance: "4h",  coinbase: 21600, sec: 14400 },   // Coinbase n'a pas 4 h
  "1d":  { binance: "1d",  coinbase: 86400, sec: 86400 },
};

const MAX_LIMIT = 500;

function valide(c) {
  return Array.isArray(c) && c.length >= 5
    && c.every(v => Number.isFinite(v))
    && c[1] > 0 && c[2] > 0 && c[3] > 0 && c[4] > 0
    && c[2] >= c[1] && c[2] >= c[4] && c[3] <= c[1] && c[3] <= c[4];
}

async function binance(sym, interval, limit) {
  const s = BINANCE[sym];
  if (!s) throw new Error("paire non couverte");
  const url = "https://api.binance.com/api/v3/klines?symbol=" + s
    + "&interval=" + INTERVALLES[interval].binance + "&limit=" + limit;
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error("http " + r.status);
  const d = await r.json();
  if (!Array.isArray(d) || !d.length) throw new Error("réponse vide");
  return d.map(k => [Number(k[0]), +k[1], +k[2], +k[3], +k[4]]).filter(valide);
}

async function coinbase(sym, interval, limit) {
  const s = COINBASE[sym];
  if (!s) throw new Error("paire non couverte");
  const gran = INTERVALLES[interval].coinbase;
  const fin = new Date();
  const debut = new Date(fin.getTime() - gran * limit * 1000);
  const url = "https://api.exchange.coinbase.com/products/" + s + "/candles"
    + "?granularity=" + gran
    + "&start=" + debut.toISOString() + "&end=" + fin.toISOString();
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error("http " + r.status);
  const d = await r.json();
  if (!Array.isArray(d) || !d.length) throw new Error("réponse vide");
  // Coinbase renvoie [time, low, high, open, close, volume], du plus recent
  // au plus ancien. On remet dans l'ordre et dans NOTRE format.
  return d
    .map(k => [Number(k[0]) * 1000, +k[3], +k[2], +k[1], +k[4]])
    .filter(valide)
    .sort((a, b) => a[0] - b[0]);
}

export default async function handler(req, res) {
  const symbol = String(req.query.symbol || "").toUpperCase();
  const interval = String(req.query.interval || "1m");
  const limit = Math.max(50, Math.min(MAX_LIMIT, parseInt(req.query.limit, 10) || 300));
  const debug = req.query.debug === "1";

  if (!INTERVALLES[interval]) {
    return res.status(400).json({ error: "Intervalle invalide.", valides: Object.keys(INTERVALLES) });
  }
  if (!BINANCE[symbol]) {
    // Refus explicite et utile : l'app sait alors qu'il ne s'agit pas d'une
    // panne mais d'une limite assumee de la source.
    return res.status(404).json({
      error: "Aucune source en direct pour " + symbol + ".",
      couvert: Object.keys(BINANCE),
      raison: "Seule la crypto dispose d'une source publique en temps réel.",
    });
  }

  const journal = [];
  for (const [nom, fn] of [["binance", binance], ["coinbase", coinbase]]) {
    try {
      const candles = await fn(symbol, interval, limit);
      if (candles.length < 20) throw new Error("trop peu de bougies (" + candles.length + ")");
      // Cache tres court : c'est du direct. Assez long pour qu'une rafale
      // d'utilisateurs ne frappe pas la source a chaque seconde.
      res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=60");
      return res.status(200).json({
        symbol, interval, source: nom, count: candles.length,
        candles, serverTime: Date.now(), ...(debug ? { journal } : {}),
      });
    } catch (e) {
      journal.push(nom + " -> " + String(e.message || e).slice(0, 90));
    }
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(502).json({ error: "Sources en direct injoignables.", journal });
}
