// ══════════════════════════════════════════════════════════════════
// CORS pour l'app native (Capacitor). La page y est servie depuis
// capacitor://localhost (iOS) ou https://localhost (Android) : pour le
// navigateur, nos routes /api/* deviennent cross-origin. On n'ouvre QUE ces
// deux origines — la PWA (même domaine) n'est pas concernée.
// Retourne true si la requête était un préflight OPTIONS déjà répondu.
// ══════════════════════════════════════════════════════════════════
const NATIVE_ORIGINS = ["capacitor://localhost", "https://localhost"];

export function applyNativeCors(req, res) {
  const origin = req.headers.origin;
  if (origin && NATIVE_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
