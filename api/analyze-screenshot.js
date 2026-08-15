// ══════════════════════════════════════════════════════════════════
// Analyse une capture d'écran de plateforme de trading (MT4/MT5/TradingView...)
// pour en extraire : paire, sens, prix d'entrée, SL, TP, taille de lot.
//
// Utilise l'API Anthropic (vision) — clé strictement côté serveur
// (process.env.ANTHROPIC_API_KEY, Vercel > Settings > Environment Variables).
//
// PRINCIPE IMPORTANT : si la capture est ambiguë, floue, ou ne contient pas
// clairement l'information demandée, le modèle DOIT renvoyer confidence:"low"
// et laisser les champs incertains à null plutôt que d'inventer une valeur
// plausible — l'utilisateur valide/corrige ensuite dans l'app, mais une
// fausse confiance serait pire qu'une absence de valeur.
// ══════════════════════════════════════════════════════════════════

const EXTRACTION_PROMPT = `Tu analyses une capture d'écran d'une plateforme de trading (MT4, MT5, TradingView, ou similaire) montrant un ordre ouvert ou en cours de placement.

Extrait UNIQUEMENT ce qui est visible avec certitude dans l'image. Réponds STRICTEMENT en JSON, sans texte autour, avec ce format exact :
{
  "pair": "EURUSD" ou null,
  "direction": "buy" ou "sell" ou null,
  "entryPrice": nombre ou null,
  "sl": nombre ou null,
  "tp": nombre ou null,
  "lotSize": nombre ou null,
  "confidence": "high" ou "medium" ou "low",
  "notes": "brève explication si confidence n'est pas high, ou si quelque chose est ambigu"
}

Règles strictes :
- Si tu n'es pas sûr d'une valeur précise, mets null pour ce champ plutôt que d'estimer.
- Si l'image ne ressemble pas à une plateforme de trading ou ne montre aucun ordre, mets tous les champs à null et confidence:"low" avec une explication dans notes.
- N'invente jamais un prix qui n'est pas lisible dans l'image.
- direction "buy" si achat/long, "sell" si vente/short.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée." });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY manquante côté serveur.",
      fix: "Vercel Dashboard > Project > Settings > Environment Variables > ajouter ANTHROPIC_API_KEY, puis redéployer.",
    });
  }

  const { imageBase64, mediaType } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: "Aucune image fournie." });
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const type = allowedTypes.includes(mediaType) ? mediaType : "image/jpeg";

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: type, data: imageBase64 } },
            { type: "text", text: EXTRACTION_PROMPT },
          ],
        }],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: "Échec de l'analyse par le modèle de vision.", detail });
    }

    const data = await r.json();
    const raw = data.content?.[0]?.text || "";
    // Extraction robuste : le modèle répond en JSON, mais on tolère un éventuel texte autour
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(502).json({ error: "Réponse du modèle non exploitable.", raw });
    }
    let extracted;
    try { extracted = JSON.parse(match[0]); }
    catch (e) { return res.status(502).json({ error: "JSON invalide renvoyé par le modèle.", raw }); }

    return res.status(200).json({ extracted });
  } catch (e) {
    return res.status(502).json({ error: "Échec de connexion à l'API de vision.", detail: String(e) });
  }
}
