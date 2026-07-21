// ══════════════════════════════════════════════════════════════════
// Proxy serverless vers l'API Twelve Data (historique OHLC).
// La clé API reste STRICTEMENT côté serveur (jamais exposée au client) :
// process.env.TWELVE_DATA_API_KEY doit être ajoutée dans Vercel >
// Project Settings > Environment Variables, PAS commitée dans le repo.
//
// Test : GET /api/twelvedata?symbol=EUR/USD&interval=1day&outputsize=30
// ══════════════════════════════════════════════════════════════════
export default async function handler(req, res) {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "TWELVE_DATA_API_KEY manquante côté serveur.",
      fix: "Vercel Dashboard > Project > Settings > Environment Variables > ajouter TWELVE_DATA_API_KEY, puis redéployer.",
    });
  }

  const {
    symbol = "EUR/USD",
    interval = "1day",
    outputsize = "30",
  } = req.query;

  // Whitelist stricte des intervalles pour éviter tout abus du proxy
  const ALLOWED_INTERVALS = ["1min", "5min", "15min", "30min", "1h", "4h", "1day", "1week", "1month"];
  if (!ALLOWED_INTERVALS.includes(interval)) {
    return res.status(400).json({ error: "Intervalle invalide.", allowed: ALLOWED_INTERVALS });
  }
  const size = Math.min(parseInt(outputsize, 10) || 30, 5000); // cap Twelve Data = 5000 points/appel

  const url = "https://api.twelvedata.com/time_series"
    + "?symbol=" + encodeURIComponent(symbol)
    + "&interval=" + encodeURIComponent(interval)
    + "&outputsize=" + size
    + "&apikey=" + apiKey;

  try {
    const r = await fetch(url);
    const data = await r.json();

    if (data.status === "error" || data.code >= 400) {
      return res.status(502).json({ error: "Twelve Data a renvoyé une erreur.", detail: data });
    }

    // Cache 1h côté edge Vercel : évite de re-consommer le quota gratuit
    // (~800 req/jour) pour des requêtes identiques répétées.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: "Échec de connexion à Twelve Data.", detail: String(e) });
  }
}
