// ══════════════════════════════════════════════════════════════════
// Analyse une capture d'écran de plateforme de trading (MT4/MT5/TradingView...)
// pour en extraire : paire, sens, prix d'entrée, SL, TP, taille de lot.
//
// Utilise Gemini (déjà intégré ailleurs dans l'app pour d'autres analyses,
// même modèle gemini-2.5-flash) plutôt qu'un nouveau service — pas de
// nouvelle clé à gérer. Contrairement au VITE_GEMINI_KEY utilisé côté
// client pour les autres fonctions Gemini de l'app, ici la clé (GEMINI_KEY,
// sans préfixe VITE_) reste STRICTEMENT côté serveur : une capture d'écran
// de compte de trading est plus sensible qu'une simple validation de texte,
// mieux vaut qu'elle ne transite jamais par un appel visible côté client.
//
// PRINCIPE IMPORTANT : si la capture est ambiguë, floue, ou ne contient pas
// clairement l'information demandée, le modèle DOIT renvoyer confidence:"low"
// et laisser les champs incertains à null plutôt que d'inventer une valeur
// plausible — l'utilisateur valide/corrige ensuite dans l'app, mais une
// fausse confiance serait pire qu'une absence de valeur.
// ══════════════════════════════════════════════════════════════════

const EXTRACTION_PROMPT = `Tu analyses une capture d'écran d'une plateforme de trading (MT4, MT5, TradingView, ou similaire) montrant un ordre ouvert ou en cours de placement.

Extrait UNIQUEMENT ce qui est visible avec certitude dans l'image. Réponds STRICTEMENT en JSON valide, sans markdown ni texte autour, avec ce format exact :
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

  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_KEY manquante côté serveur.",
      fix: "Vercel Dashboard > Project > Settings > Environment Variables > ajouter GEMINI_KEY (sans préfixe VITE_), puis redéployer.",
    });
  }

  const { imageBase64, mediaType } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: "Aucune image fournie." });
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  const type = allowedTypes.includes(mediaType) ? mediaType : "image/jpeg";

  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const r = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: EXTRACTION_PROMPT },
            { inline_data: { mime_type: type, data: imageBase64 } },
          ],
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: "Échec de l'analyse par Gemini.", detail });
    }

    const data = await r.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(502).json({ error: "Réponse du modèle non exploitable.", raw });
    }
    let extracted;
    try { extracted = JSON.parse(match[0]); }
    catch (e) { return res.status(502).json({ error: "JSON invalide renvoyé par le modèle.", raw }); }

    return res.status(200).json({ extracted });
  } catch (e) {
    return res.status(502).json({ error: "Échec de connexion à Gemini.", detail: String(e) });
  }
}
