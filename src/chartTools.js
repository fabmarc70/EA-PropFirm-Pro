// ══════════════════════════════════════════════════════════════════════════
// GEOMETRIE ET OUTILS DU GRAPHIQUE PLEIN ECRAN
// --------------------------------------------------------------------------
// Module PUR : ni React, ni DOM, ni canvas. Tout ce qui transforme un geste
// en coordonnees, ou des coordonnees en trace, vit ici — donc testable
// (chartTools.test.js). Le composant ne garde que le dessin et les
// evenements.
//
// DEUX REPERES, a ne jamais confondre :
//   - DONNEES : (index de bougie, prix). C'est dans ce repere que les traces
//     sont enregistres. Un trait pose sur une resistance doit rester sur
//     cette resistance apres un zoom ou un defilement.
//   - ECRAN : (x, y) en pixels. Recalcule a chaque rendu.
// ══════════════════════════════════════════════════════════════════════════

const H = 2, L = 3;

export const MIN_BOUGIES = 12;      // en deca, le graphique n'apprend plus rien
export const MARGE_HAUT = 14;
export const MARGE_BAS = 18;

function nombre(v, d = 0) { const n = Number(v); return isFinite(n) ? n : d; }

// ── Fenetre visible ───────────────────────────────────────────────────────
/**
 * Ramene une fenetre (debut, nb) dans les bornes de la serie. Sans cela, un
 * defilement finit hors des donnees et l'ecran devient blanc sans explication.
 */
export function clampView(view, total) {
  const n = Math.max(0, Math.floor(nombre(total)));
  if (n === 0) return { debut: 0, nb: 0 };
  const nb = Math.max(MIN_BOUGIES, Math.min(n, Math.round(nombre(view.nb, n))));
  const maxDebut = Math.max(0, n - nb);
  const debut = Math.max(0, Math.min(maxDebut, Math.round(nombre(view.debut))));
  return { debut, nb: Math.min(nb, n) };
}

/** Zoom centre sur une position relative (0 = bord gauche, 1 = bord droit). */
export function zoomView(view, facteur, ancrage, total) {
  const v = clampView(view, total);
  const nb = Math.round(v.nb * nombre(facteur, 1));
  const a = Math.max(0, Math.min(1, nombre(ancrage, 0.5)));
  // L'index sous le doigt ne doit pas bouger : c'est ce qui rend le zoom
  // previsible plutot que desorientant.
  const indexAncre = v.debut + a * v.nb;
  return clampView({ nb, debut: Math.round(indexAncre - a * nb) }, total);
}

// ── Echelle des prix ──────────────────────────────────────────────────────
/**
 * Etendue de prix de la fenetre, elargie par les traces qui s'y trouvent :
 * un trait pose hors de l'etendue des bougies doit rester visible, sinon
 * l'utilisateur croit l'avoir perdu.
 */
export function priceRange(candles, view, extras = []) {
  const v = clampView(view, candles.length);
  let hi = -Infinity, lo = Infinity;
  for (let i = v.debut; i < v.debut + v.nb; i++) {
    const c = candles[i];
    if (!c) continue;
    if (c[H] > hi) hi = c[H];
    if (c[L] < lo) lo = c[L];
  }
  extras.forEach(p => {
    const n = Number(p);
    if (!isFinite(n)) return;
    if (n > hi) hi = n;
    if (n < lo) lo = n;
  });
  if (!isFinite(hi) || !isFinite(lo)) return { lo: 0, hi: 1 };
  if (hi === lo) { hi += Math.abs(hi) * 0.001 || 1; lo -= Math.abs(lo) * 0.001 || 1; }
  const marge = (hi - lo) * 0.06;
  return { lo: lo - marge, hi: hi + marge };
}

// ── Passage entre les deux reperes ────────────────────────────────────────
export function makeScales(candles, view, width, height, extras = []) {
  const v = clampView(view, candles.length);
  const { lo, hi } = priceRange(candles, v, extras);
  const w = Math.max(1, nombre(width, 1));
  const h = Math.max(1, nombre(height, 1));
  const utile = Math.max(1, h - MARGE_HAUT - MARGE_BAS);
  const pas = w / Math.max(1, v.nb);

  const xFromIndex = (i) => (i - v.debut + 0.5) * pas;
  const indexFromX = (x) => v.debut + (nombre(x) / pas) - 0.5;
  const yFromPrice = (p) => MARGE_HAUT + (hi - nombre(p)) / (hi - lo) * utile;
  const priceFromY = (y) => hi - ((nombre(y) - MARGE_HAUT) / utile) * (hi - lo);

  return { view: v, lo, hi, pas, xFromIndex, indexFromX, yFromPrice, priceFromY };
}

// ── Traces ────────────────────────────────────────────────────────────────
// Un trace est enregistre en coordonnees DONNEES :
//   { type: "h", prix }                        ligne horizontale
//   { type: "t", i1, p1, i2, p2 }              ligne de tendance
//   { type: "m", i1, p1, i2, p2 }              mesure

/** Distance d'un point a un segment, en pixels ecran. Sert a la gomme. */
export function distanceSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Trace le plus proche du point touche, dans un rayon donne. Renvoie son
 * index, ou -1. Le rayon est genereux : viser un trait de 1 px au doigt est
 * impossible autrement.
 */
export function hitTest(dessins, x, y, scales, rayon = 14) {
  let meilleur = -1, meilleureD = rayon;
  (dessins || []).forEach((d, k) => {
    let dist;
    if (d.type === "h") {
      dist = Math.abs(y - scales.yFromPrice(d.prix));
    } else {
      dist = distanceSegment(
        x, y,
        scales.xFromIndex(d.i1), scales.yFromPrice(d.p1),
        scales.xFromIndex(d.i2), scales.yFromPrice(d.p2));
    }
    if (dist < meilleureD) { meilleureD = dist; meilleur = k; }
  });
  return meilleur;
}

/**
 * Ce que dit une mesure : ecart de prix, en pourcentage, et nombre de
 * bougies franchies. Les trois chiffres qu'on veut lire quand on tire une
 * regle sur un graphique.
 */
export function measureInfo(d) {
  if (!d || d.i1 == null) return null;
  const ecart = d.p2 - d.p1;
  return {
    ecart,
    pct: d.p1 ? (ecart / d.p1) * 100 : 0,
    bougies: Math.abs(Math.round(d.i2 - d.i1)),
    hausse: ecart >= 0,
  };
}

/** Nombre de decimales adapte a l'ordre de grandeur, pour les etiquettes. */
export function decimales(v) {
  const a = Math.abs(nombre(v));
  return a >= 1000 ? 2 : a >= 100 ? 3 : a >= 10 ? 4 : 5;
}
