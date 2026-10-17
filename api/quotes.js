// ══════════════════════════════════════════════════════════════════
// COURS EN DIRECT — proxy serverless
// ------------------------------------------------------------------
// Pourquoi une route serveur plutôt qu'un appel direct depuis l'app :
//   1. CORS — aucune source de cotation publique n'autorise un appel
//      depuis un navigateur. Côté serveur, la question ne se pose pas.
//   2. Quota — la réponse est mise en cache sur le CDN Vercel
//      (s-maxage). Mille utilisateurs qui regardent la même paire ne
//      déclenchent qu'UN seul appel vers la source par fenêtre de cache.
//   3. Clé — si Twelve Data est appelé en secours, la clé reste
//      strictement côté serveur, jamais dans le bundle client.
//
// Ex : /api/quotes?symbols=XAUUSD,NAS100,EURUSD
//
// Réponse : { quotes: { XAUUSD: { price, changePct, spark[], source } } }
// Une paire introuvable est renvoyée à null — JAMAIS un cours inventé.
// L'app retombe alors sur sa vignette historique, et le dit.
// ══════════════════════════════════════════════════════════════════

// Correspondance vers la nomenclature Yahoo Finance. Plusieurs candidats
// par actif : le premier qui répond gagne (les symboles de matières
// premières au comptant ne sont pas toujours servis, les contrats à terme
// le sont toujours).
const YAHOO = {
  EURUSD: ["EURUSD=X"], GBPUSD: ["GBPUSD=X"], AUDUSD: ["AUDUSD=X"], NZDUSD: ["NZDUSD=X"],
  USDJPY: ["USDJPY=X"], USDCAD: ["USDCAD=X"], USDCHF: ["USDCHF=X"],
  EURJPY: ["EURJPY=X"], GBPJPY: ["GBPJPY=X"], AUDJPY: ["AUDJPY=X"], CHFJPY: ["CHFJPY=X"],
  EURGBP: ["EURGBP=X"], EURCHF: ["EURCHF=X"],
  XAUUSD: ["XAUUSD=X", "GC=F"], XAGUSD: ["XAGUSD=X", "SI=F"],
  NAS100: ["^NDX", "NQ=F"], US30: ["^DJI", "YM=F"], SPX500: ["^GSPC", "ES=F"],
  GER30: ["^GDAXI"], UK100: ["^FTSE"], JPN225: ["^N225"],
  USOIL: ["CL=F"], UKOIL: ["BZ=F"], COPPER: ["HG=F"],
};

const MAX_SYMBOLS = 8;          // garde-fou : une bande de veille, pas un scan du marché
const SPARK_POINTS = 48;        // points de la courbe miniature

async function yahoo(ticker) {
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/"
    + encodeURIComponent(ticker) + "?range=1d&interval=5m";
  const r = await fetch(url, {
    headers: {
      // Yahoo refuse les requêtes sans en-tête de navigateur.
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
      "Accept": "application/json",
    },
  });
  if (!r.ok) throw new Error("http " + r.status);
  const d = await r.json();
  const res = d && d.chart && d.chart.result && d.chart.result[0];
  if (!res || !res.meta) throw new Error("réponse vide");

  const meta = res.meta;
  const closes = (((res.indicators || {}).quote || [])[0] || {}).close || [];
  const propres = closes.filter(v => typeof v === "number" && isFinite(v) && v > 0);

  const price = isFinite(meta.regularMarketPrice) ? meta.regularMarketPrice
    : (propres.length ? propres[propres.length - 1] : null);
  // Référence de variation : la clôture de la veille. C'est la variation
  // que tout le monde lit, et elle reste juste même hors séance.
  const ref = isFinite(meta.chartPreviousClose) ? meta.chartPreviousClose
    : (isFinite(meta.previousClose) ? meta.previousClose : (propres.length ? propres[0] : null));
  if (!isFinite(price) || !(price > 0)) throw new Error("cours absent");

  // Échantillonnage régulier : une vignette de 94 px n'a pas besoin de 288 points.
  const spark = [];
  if (propres.length > 1) {
    const pas = Math.max(1, Math.floor(propres.length / SPARK_POINTS));
    for (let i = 0; i < propres.length; i += pas) spark.push(+propres[i].toFixed(6));
    const dernier = +propres[propres.length - 1].toFixed(6);
    if (spark[spark.length - 1] !== dernier) spark.push(dernier);
  }

  return {
    price: +price.toFixed(6),
    changePct: isFinite(ref) && ref > 0 ? +(((price - ref) / ref) * 100).toFixed(3) : null,
    spark,
    ticker,
    asOf: (meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now()),
    marketState: meta.marketState || null,
    source: "yahoo",
  };
}

export default async function handler(req, res) {
  const brut = String(req.query.symbols || "").toUpperCase();
  const demandes = brut.split(",").map(s => s.trim()).filter(Boolean).slice(0, MAX_SYMBOLS);

  if (!demandes.length) {
    return res.status(400).json({ error: "Paramètre 'symbols' requis.", exemple: "/api/quotes?symbols=XAUUSD,EURUSD" });
  }

  const quotes = {};
  await Promise.all(demandes.map(async (sym) => {
    const candidats = YAHOO[sym];
    if (!candidats) { quotes[sym] = null; return; }
    for (const t of candidats) {
      try { quotes[sym] = await yahoo(t); return; } catch (e) { /* candidat suivant */ }
    }
    quotes[sym] = null;   // aucune source : on l'assume, on n'invente pas
  }));

  // 45 s de cache CDN, puis service de la version périmée pendant la
  // revalidation : l'écran n'attend jamais le réseau.
  res.setHeader("Cache-Control", "s-maxage=45, stale-while-revalidate=300");
  return res.status(200).json({ quotes, serverTime: Date.now() });
}
