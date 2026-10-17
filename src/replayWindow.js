// ══════════════════════════════════════════════════════════════════════════
// FENETRE DE REJEU — choix et continuite
// --------------------------------------------------------------------------
// Module PUR, teste. Il repond a deux questions :
//   1. quels mois du depot former en une serie assez longue pour exercer
//      une unite de temps donnee ;
//   2. comment RETROUVER le meme instant quand on change d'unite de temps.
//
// La deuxieme question est celle qui manquait. Jusqu'ici chaque changement
// d'unite tirait une fenetre au sort : passer de M5 a H1 ne montrait pas le
// meme marche une heure plus tard, mais un autre marche, une autre annee.
// Un entrainement ou le decor change a chaque geste n'apprend rien.
// ══════════════════════════════════════════════════════════════════════════

/** Combien de bougies de l'unite demandee un mois peut fournir. */
export function rendementMois(a, tf) {
  const base = (a && a.baseMinutes) || 1;
  if (base > tf) return 0;                 // on ne fabrique pas du detail
  return Math.floor(((a && a.count) || 0) / Math.max(1, Math.round(tf / base)));
}

/** Mois calendaire suivant ("2020-12" -> "2021-01"). */
export function moisSuivant(p) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(p || ""));
  if (!m) return null;
  const an = +m[1], mo = +m[2];
  return mo === 12 ? (an + 1) + "-01" : an + "-" + String(mo + 1).padStart(2, "0");
}

/** Mois "YYYY-MM" d'un horodatage en millisecondes. */
export function moisDeTs(ts) {
  const d = new Date(Number(ts));
  if (!isFinite(d.getTime())) return null;
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
}

/**
 * Toutes les fenetres utilisables : suites de mois CONTIGUS, de meme
 * granularite, totalisant assez de bougies. Coller deux mois separes par un
 * trou fabriquerait une bougie qui n'a jamais existe.
 */
export function fenetresPossibles(catalogue, paire, tf, besoin) {
  const mois = (catalogue || [])
    .filter(a => a.pair === paire && rendementMois(a, tf) > 0)
    .sort((a, b) => String(a.period).localeCompare(String(b.period)));

  const out = [];
  for (let i = 0; i < mois.length; i++) {
    const base = mois[i].baseMinutes || 1;
    let total = 0, j = i;
    while (j < mois.length && total < besoin && j - i < 10) {
      if ((mois[j].baseMinutes || 1) !== base) break;
      if (j > i && mois[j].period !== moisSuivant(mois[j - 1].period)) break;
      total += rendementMois(mois[j], tf);
      j++;
    }
    if (total >= besoin) out.push(mois.slice(i, j));
  }
  return out;
}

/**
 * Fenetre a charger.
 * - sans cible : une fenetre au hasard, pour decouvrir un marche inconnu ;
 * - avec une cible (horodatage) : la fenetre qui CONTIENT ce moment, afin
 *   que changer d'unite de temps garde le meme instant sous les yeux.
 * Renvoie null quand aucune fenetre n'est assez longue.
 */
export function choisirFenetre(catalogue, paire, tf, besoin, rng = Math.random, cibleTs = null) {
  const fenetres = fenetresPossibles(catalogue, paire, tf, besoin);
  if (!fenetres.length) return null;

  if (cibleTs != null) {
    const cible = moisDeTs(cibleTs);
    if (cible) {
      // On prefere la fenetre qui couvre le mois vise, et parmi elles celle
      // qui le place le plus au centre : il faut du passe AVANT le moment
      // choisi pour avoir du contexte, et du futur APRES pour trader.
      const couvrantes = fenetres.filter(f =>
        String(f[0].period) <= cible && cible <= String(f[f.length - 1].period));
      if (couvrantes.length) {
        couvrantes.sort((a, b) => positionRelative(a, cible) - positionRelative(b, cible));
        return couvrantes[Math.floor(couvrantes.length / 2)];
      }
    }
  }
  return fenetres[Math.floor(rng() * fenetres.length)];
}

// Distance du mois vise au centre de la fenetre, en nombre de mois.
function positionRelative(fenetre, cible) {
  const i = fenetre.findIndex(a => String(a.period) === cible);
  const centre = (fenetre.length - 1) / 2;
  return Math.abs((i < 0 ? 0 : i) - centre);
}

/**
 * Index de la bougie dont l'horodatage est le plus proche d'une cible.
 * C'est la piece qui rend le changement d'unite de temps continu : on ne
 * cherche pas le meme INDEX — il ne veut rien dire d'une unite a l'autre —
 * mais le meme MOMENT.
 */
export function indexAuTemps(candles, cibleTs) {
  const n = Array.isArray(candles) ? candles.length : 0;
  if (!n || cibleTs == null) return -1;
  // Recherche dichotomique : les horodatages sont croissants.
  let lo = 0, hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (candles[mid][0] < cibleTs) lo = mid + 1; else hi = mid;
  }
  // Entre la bougie trouvee et la precedente, on garde la plus proche.
  if (lo > 0 && Math.abs(candles[lo - 1][0] - cibleTs) <= Math.abs(candles[lo][0] - cibleTs)) {
    return lo - 1;
  }
  return lo;
}

/**
 * Ramene un index dans la zone jouable : assez de passe visible avant, et
 * assez de futur cache apres pour resoudre un trade. Renvoie -1 quand la
 * serie est trop courte pour les deux.
 */
export function indexJouable(candles, i, visible, reserve) {
  const n = Array.isArray(candles) ? candles.length : 0;
  if (n < visible + reserve + 1) return -1;
  return Math.max(visible, Math.min(n - reserve - 1, Math.round(i)));
}
