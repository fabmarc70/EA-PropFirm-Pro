// ══════════════════════════════════════════════════════════════════════════
// ETAT DES MARCHES
// --------------------------------------------------------------------------
// Module PUR, teste. Il repond a une question simple et souvent mal posee :
// CE marche est-il ouvert MAINTENANT ?
//
// Pourquoi ce module existe : l'ecran annoncait "Marche en direct" un samedi,
// alors que le Forex, les metaux et les indices sont fermes du vendredi soir
// au dimanche soir. Les cours affiches etaient ceux de la cloture de
// vendredi — exacts, mais presentes comme vivants. C'est le genre de detail
// qui decredibilise tout le reste.
//
// REFERENCE HORAIRE : New York (America/New_York). C'est la reference de la
// semaine de marche, et elle gere seule le passage a l'heure d'ete, qui
// decale la fermeture d'une heure en temps universel deux fois par an.
//
// Semaine Forex / metaux / indices CFD :
//   ouverture  dimanche 17:00 New York
//   fermeture  vendredi 17:00 New York
//   pause quotidienne 17:00 -> 18:00 New York (roulement des contrats)
//
// Crypto : ouvert en permanence, y compris le week-end. C'est la difference
// que l'ecran doit montrer, et non masquer.
// ══════════════════════════════════════════════════════════════════════════

export const CLASSES = {
  CRYPTO: "crypto",
  FOREX: "forex",
  METAL: "metal",
  INDICE: "indice",
  ENERGIE: "energie",
};

const PAR_ACTIF = {
  BTCUSD: CLASSES.CRYPTO, ETHUSD: CLASSES.CRYPTO, SOLUSD: CLASSES.CRYPTO,
  XRPUSD: CLASSES.CRYPTO, ADAUSD: CLASSES.CRYPTO, DOGEUSD: CLASSES.CRYPTO,
  XAUUSD: CLASSES.METAL, XAGUSD: CLASSES.METAL, COPPER: CLASSES.METAL,
  NAS100: CLASSES.INDICE, US30: CLASSES.INDICE, SPX500: CLASSES.INDICE,
  GER30: CLASSES.INDICE, UK100: CLASSES.INDICE, JPN225: CLASSES.INDICE,
  USOIL: CLASSES.ENERGIE, UKOIL: CLASSES.ENERGIE,
};

/** Classe d'un actif. Tout ce qui n'est pas liste est traite comme du Forex. */
export function assetClass(symbole) {
  const s = String(symbole || "").toUpperCase();
  return PAR_ACTIF[s] || CLASSES.FOREX;
}

/**
 * Heure de New York correspondant a une date, sans dependance externe.
 * Intl connait les regles de passage a l'heure d'ete ; les recoder
 * manuellement serait faux deux semaines par an.
 */
function heureNewYork(date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = {};
  fmt.formatToParts(date).forEach(p => { parts[p.type] = p.value; });
  const jours = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    jour: jours[parts.weekday] ?? 0,
    heure: parseInt(parts.hour, 10) % 24,
    minute: parseInt(parts.minute, 10),
  };
}

/**
 * Etat d'un marche a un instant donne.
 * @returns {{ouvert:boolean, classe:string, texte:string, raison:string|null}}
 */
export function marketState(symbole, date = new Date()) {
  const classe = assetClass(symbole);

  if (classe === CLASSES.CRYPTO) {
    // Pas d'exception a chercher : la crypto se traite 24 h sur 24, 7 jours
    // sur 7, y compris le jour de Noel.
    return { ouvert: true, classe, texte: "Marché ouvert · 24 h/24, 7 j/7", raison: null };
  }

  const { jour, heure, minute } = heureNewYork(date);
  const mn = heure * 60 + minute;
  const OUVERTURE = 17 * 60;        // dimanche 17:00 New York
  const FERMETURE = 17 * 60;        // vendredi 17:00 New York
  const REPRISE = 18 * 60;          // fin de la pause quotidienne

  // Week-end
  if (jour === 6) return fermé(classe, "Week-end");
  if (jour === 0 && mn < OUVERTURE) return fermé(classe, "Week-end");
  if (jour === 5 && mn >= FERMETURE) return fermé(classe, "Week-end");

  // Pause quotidienne entre 17:00 et 18:00 a New York, du dimanche au jeudi.
  if (mn >= 17 * 60 && mn < REPRISE && jour !== 5) {
    return { ouvert: false, classe, texte: "Pause quotidienne", raison: "pause" };
  }

  return { ouvert: true, classe, texte: "Marché ouvert", raison: null };
}

function fermé(classe, texte) {
  return { ouvert: false, classe, texte: "Marché fermé · " + texte, raison: "weekend" };
}

/**
 * Vrai quand AU MOINS un actif de la liste est ouvert. Sert au bandeau
 * general : annoncer "tout est ferme" alors que le Bitcoin se traite serait
 * aussi faux que l'inverse.
 */
export function anyOpen(symboles, date = new Date()) {
  return (symboles || []).some(s => marketState(s, date).ouvert);
}

/**
 * Resume court pour une liste d'actifs : "3 ouverts sur 5", ou le motif de
 * fermeture quand tout est ferme.
 */
export function marketSummary(symboles, date = new Date()) {
  const liste = symboles || [];
  if (!liste.length) return { ouverts: 0, total: 0, texte: "" };
  const etats = liste.map(s => marketState(s, date));
  const ouverts = etats.filter(e => e.ouvert).length;
  if (ouverts === 0) {
    const w = etats.find(e => e.raison === "weekend");
    return { ouverts: 0, total: liste.length, texte: w ? "Marchés fermés · week-end" : "Marchés fermés" };
  }
  if (ouverts === liste.length) return { ouverts, total: liste.length, texte: "Marchés ouverts" };
  return { ouverts, total: liste.length, texte: ouverts + " marché" + (ouverts > 1 ? "s" : "") + " ouvert" + (ouverts > 1 ? "s" : "") + " sur " + liste.length };
}
