// ══════════════════════════════════════════════════════════════════
// Conversion d'un code interne ("EURUSD", "BTCUSDT", "SPX500") vers le
// symbole attendu par Twelve Data — PARTAGÉ entre check-alerts.js et
// check-setups.js pour éviter que le même bug existe en deux endroits.
//
// L'ancienne version (dupliquée dans les deux fichiers) n'insérait un slash
// que pour les codes de EXACTEMENT 6 LETTRES — ratait donc silencieusement :
// - BTCUSDT (7 caractères) -> transmis tel quel, non reconnu par Twelve Data
// - SPX500 (contient des chiffres) -> transmis tel quel, correct par hasard
//   pour un indice mais aurait cassé sur d'autres codes similaires
//
// Table explicite pour tout ce qui n'est pas une paire forex/métal standard,
// avec repli sur l'heuristique 6-lettres uniquement pour les codes non listés.
// ══════════════════════════════════════════════════════════════════
const TD_EXPLICIT_MAP = {
  // Crypto — Twelve Data utilise le format XXX/USD, pas de suffixe "T"
  BTCUSDT: "BTC/USD", BTCUSD: "BTC/USD", ETHUSD: "ETH/USD", ETHUSDT: "ETH/USD",
  SOLUSD: "SOL/USD", XRPUSD: "XRP/USD",
  // Indices — tickers Twelve Data (pas de slash)
  SPX500: "SPX", US30: "DJI", NAS100: "NDX", UK100: "UKX", GER30: "DAX", GER40: "DAX", JPN225: "NKY",
};

export function toTwelveDataSymbol(pair) {
  const p = (pair || "").toUpperCase().replace(/\s/g, "");
  if (TD_EXPLICIT_MAP[p]) return TD_EXPLICIT_MAP[p];
  if (/^[A-Z]{6}$/.test(p)) return p.slice(0, 3) + "/" + p.slice(3); // forex/métaux standard
  return p; // repli : transmis tel quel (peut échouer, l'appelant doit gérer l'erreur Twelve Data)
}
