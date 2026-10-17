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

// Secours : Twelve Data. Yahoo refuse parfois les adresses de centres de
// donnees — sans second recours, la bande entiere tomberait en "indisponible"
// pour une raison qui n'a rien a voir avec l'utilisateur. La cle reste
// strictement cote serveur. Le plan gratuit ne couvre pas les indices :
// ce recours sert surtout les devises et les metaux, et c'est assume.
const TD = {
  EURUSD: "EUR/USD", GBPUSD: "GBP/USD", AUDUSD: "AUD/USD", NZDUSD: "NZD/USD",
  USDJPY: "USD/JPY", USDCAD: "USD/CAD", USDCHF: "USD/CHF",
  EURJPY: "EUR/JPY", GBPJPY: "GBP/JPY", AUDJPY: "AUD/JPY", CHFJPY: "CHF/JPY",
  EURGBP: "EUR/GBP", EURCHF: "EUR/CHF",
  XAUUSD: "XAU/USD", XAGUSD: "XAG/USD",
};

async function twelveData(sym) {
  const cle = process.env.TWELVE_DATA_API_KEY;
  const symbole = TD[sym];
  if (!cle || !symbole) throw new Error("pas de recours");
  const r = await fetch("https://api.twelvedata.com/quote?symbol="
    + encodeURIComponent(symbole) + "&apikey=" + cle);
  if (!r.ok) throw new Error("http " + r.status);
  const d = await r.json();
  const prix = Number(d.close);
  if (!isFinite(prix) || !(prix > 0)) throw new Error("cours absent");
  const veille = Number(d.previous_close);
  return {
    price: +prix.toFixed(6),
    changePct: isFinite(veille) && veille > 0 ? +(((prix - veille) / veille) * 100).toFixed(3) : null,
    spark: [],                    // pas de courbe : elle couterait un appel de plus
    ticker: symbole,
    asOf: Date.now(),
    marketState: d.is_market_open === false ? "CLOSED" : null,
    source: "twelvedata",
  };
}

// ── Stooq : libre, sans clé, sans quota, et surtout il COUVRE LES INDICES,
//    que le plan gratuit de Twelve Data ignore. Deux usages :
//    - /q/l/   : la séance en cours (ouverture + dernier cours) ;
//    - /q/d/l/ : l'historique journalier, d'où vient la courbe miniature.
const STOOQ = {
  EURUSD: "eurusd", GBPUSD: "gbpusd", AUDUSD: "audusd", NZDUSD: "nzdusd",
  USDJPY: "usdjpy", USDCAD: "usdcad", USDCHF: "usdchf",
  EURJPY: "eurjpy", GBPJPY: "gbpjpy", AUDJPY: "audjpy", CHFJPY: "chfjpy",
  EURGBP: "eurgbp", EURCHF: "eurchf",
  XAUUSD: "xauusd", XAGUSD: "xagusd",
  NAS100: "^ndq", US30: "^dji", SPX500: "^spx",
  GER30: "^dax", UK100: "^ukx", JPN225: "^nkx",
  USOIL: "cl.f", UKOIL: "cb.f", COPPER: "hg.f",
};

function csvLignes(txt) {
  return String(txt || "").trim().split("\n").map(l => l.trim()).filter(Boolean);
}

async function stooq(sym) {
  const s = STOOQ[sym];
  if (!s) throw new Error("pas de correspondance");
  const r = await fetch("https://stooq.com/q/l/?s=" + encodeURIComponent(s) + "&f=sd2t2ohlcv&h&e=csv");
  if (!r.ok) throw new Error("http " + r.status);
  const lignes = csvLignes(await r.text());
  if (lignes.length < 2) throw new Error("réponse vide");
  // Symbol,Date,Time,Open,High,Low,Close,Volume
  const col = lignes[1].split(",");
  const open = Number(col[3]), close = Number(col[6]);
  if (!isFinite(close) || !(close > 0)) throw new Error("cours absent");
  return {
    price: +close.toFixed(6),
    // Variation DEPUIS L'OUVERTURE de la séance : c'est ce que Stooq permet
    // de calculer honnêtement ici, et l'app l'affiche comme telle.
    changePct: isFinite(open) && open > 0 ? +(((close - open) / open) * 100).toFixed(3) : null,
    spark: [],
    ticker: s,
    asOf: Date.now(),
    marketState: null,
    source: "stooq",
  };
}

// Courbe miniature : les clôtures journalières des ~3 derniers mois. Un seul
// appel, libre, et surtout COHERENTE avec le cours affiché — l'ancienne
// courbe venait d'un mois d'archive et n'avait aucun rapport avec le prix.
async function stooqCourbe(sym) {
  const s = STOOQ[sym];
  if (!s) return [];
  const fin = new Date();
  const debut = new Date(fin.getTime() - 100 * 86400000);
  const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const r = await fetch("https://stooq.com/q/d/l/?s=" + encodeURIComponent(s)
    + "&d1=" + fmt(debut) + "&d2=" + fmt(fin) + "&i=d");
  if (!r.ok) return [];
  const lignes = csvLignes(await r.text());
  if (lignes.length < 3) return [];
  return lignes.slice(1)
    .map(l => Number(l.split(",")[4]))
    .filter(v => isFinite(v) && v > 0)
    .slice(-SPARK_POINTS);
}

export default async function handler(req, res) {
  const brut = String(req.query.symbols || "").toUpperCase();
  const demandes = brut.split(",").map(s => s.trim()).filter(Boolean).slice(0, MAX_SYMBOLS);

  if (!demandes.length) {
    return res.status(400).json({ error: "Paramètre 'symbols' requis.", exemple: "/api/quotes?symbols=XAUUSD,EURUSD" });
  }

  const quotes = {};
  await Promise.all(demandes.map(async (sym) => {
    for (const t of (YAHOO[sym] || [])) {
      try { quotes[sym] = await yahoo(t); return; } catch (e) { /* candidat suivant */ }
    }
    try { quotes[sym] = await stooq(sym); return; } catch (e) { /* recours suivant */ }
    try { quotes[sym] = await twelveData(sym); return; } catch (e) { /* aucune source */ }
    quotes[sym] = null;   // on l'assume, on n'invente pas un cours
  }));

  // Courbe manquante (Stooq et Twelve Data n'en fournissent pas dans l'appel
  // de cotation) : on la complète, en parallèle, depuis l'historique libre.
  await Promise.all(Object.entries(quotes).map(async ([sym, q]) => {
    if (!q || (q.spark && q.spark.length > 1)) return;
    try { q.spark = await stooqCourbe(sym); } catch (e) { q.spark = []; }
  }));

  // Twelve Data est limité à 800 crédits par jour et sert aussi au
  // rattrapage d'historique : s'il a été le SEUL recours utilisé, on allonge
  // nettement le cache plutôt que d'épuiser le quota en une matinée.
  const sources = Object.values(quotes).filter(Boolean).map(q => q.source);
  const seulementTD = sources.length > 0 && sources.every(s => s === "twelvedata");
  res.setHeader("Cache-Control", seulementTD
    ? "s-maxage=900, stale-while-revalidate=3600"
    : "s-maxage=45, stale-while-revalidate=300");

  return res.status(200).json({ quotes, serverTime: Date.now() });
}
