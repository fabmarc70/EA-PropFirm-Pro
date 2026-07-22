// ══════════════════════════════════════════════════════════════════
// Proxy serverless vers l'API Twelve Data (historique OHLC).
//
// Rôle : combler les mois ABSENTS du dépôt HISTDATA- (notamment la tranche
// 2022-04 → 2024-06, introuvable sur les sources GitHub gratuites).
// Le dépôt reste la source primaire (gratuite, sans quota) ; Twelve Data
// n'est appelé qu'en secours, pour les mois manquants uniquement.
//
// La clé API reste STRICTEMENT côté serveur (process.env.TWELVE_DATA_API_KEY,
// configurée dans Vercel > Settings > Environment Variables). Elle n'est
// JAMAIS présente dans le bundle client ni dans le dépôt Git.
//
// Ex : /api/twelvedata?symbol=EUR/USD&interval=15min&start=2023-05-01&end=2023-05-31
// ══════════════════════════════════════════════════════════════════

const ALLOWED_INTERVALS = ["1min", "5min", "15min", "30min", "45min", "1h", "2h", "4h", "1day", "1week", "1month"];

export default async function handler(req, res) {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "TWELVE_DATA_API_KEY manquante côté serveur.",
      fix: "Vercel Dashboard > Project > Settings > Environment Variables > ajouter TWELVE_DATA_API_KEY, puis redéployer.",
    });
  }

  const { symbol = "EUR/USD", interval = "1day", start, end, outputsize } = req.query;

  if (!ALLOWED_INTERVALS.includes(interval)) {
    return res.status(400).json({ error: "Intervalle invalide.", allowed: ALLOWED_INTERVALS });
  }

  let url = "https://api.twelvedata.com/time_series"
    + "?symbol=" + encodeURIComponent(symbol)
    + "&interval=" + encodeURIComponent(interval)
    + "&timezone=UTC"
    + "&order=ASC"
    + "&apikey=" + apiKey;

  if (start && end) {
    url += "&start_date=" + encodeURIComponent(start) + "&end_date=" + encodeURIComponent(end);
    url += "&outputsize=5000"; // plafond Twelve Data par appel
  } else {
    url += "&outputsize=" + Math.min(parseInt(outputsize, 10) || 30, 5000);
  }

  try {
    const r = await fetch(url);
    const data = await r.json();

    if (data.status === "error" || (data.code && data.code >= 400)) {
      return res.status(502).json({ error: "Twelve Data a renvoyé une erreur.", detail: data });
    }
    if (!data.values || !data.values.length) {
      return res.status(404).json({ error: "Aucune donnée pour cette période/symbole." });
    }

    // Conversion au format compact de l'app : [timestamp_ms, o, h, l, c]
    const candles = data.values.map(v => {
      const ts = Date.parse(v.datetime.includes(" ") ? v.datetime.replace(" ", "T") + "Z" : v.datetime + "T00:00:00Z");
      return [ts, +v.open, +v.high, +v.low, +v.close];
    }).filter(c => Number.isFinite(c[0]) && c.slice(1).every(x => Number.isFinite(x) && x > 0))
      .sort((a, b) => a[0] - b[0]);

    // Cache edge Vercel 24h : les données historiques ne changent jamais,
    // inutile de reconsommer le quota pour une requête identique.
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    return res.status(200).json({ symbol, interval, count: candles.length, candles });
  } catch (e) {
    return res.status(502).json({ error: "Échec de connexion à Twelve Data.", detail: String(e) });
  }
}
