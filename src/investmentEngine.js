// ══════════════════════════════════════════════════════════════════════════
// MOTEUR DE SIMULATION D'INVESTISSEMENT — séparé de l'UI (cahier des charges
// section 16). Fonctions pures, aucune dépendance React/DOM, testables
// directement via Node (voir investmentEngine.test.js).
//
// Convention de simulation : granularité MENSUELLE fixe en interne, quelle
// que soit la fréquence de DCA choisie (hebdo/mensuel/trimestriel/annuel) —
// approximation volontaire et documentée : ceci est un simulateur de
// PROJECTION visuelle, pas un outil de flux de trésorerie au jour près.
//
// Convention d'ordre par période : le rendement du mois est calculé sur le
// capital de DÉBUT de mois, l'apport du mois est ajouté APRÈS — un nouvel
// apport ne produit donc pas de rendement le mois même de son versement, il
// commence à produire à partir du mois suivant. Évite de surestimer le
// premier mois d'un DCA.
// ══════════════════════════════════════════════════════════════════════════

export const DCA_FREQUENCIES = { weekly: 52, monthly: 12, quarterly: 4, yearly: 1 };
export const COMPOUND_FREQUENCIES = { monthly: 12, quarterly: 4, yearly: 1 };

/**
 * Convertit un taux ANNUEL en taux PÉRIODIQUE équivalent par composition —
 * JAMAIS une simple division (cf. avertissement cahier des charges section 5 :
 * "Ne jamais simplement diviser naïvement un taux annuel").
 * @param {number} annualPct - taux annuel en % (ex. 7 pour 7%)
 * @param {number} periodsPerYear
 * @returns {number} taux périodique en fraction (ex. 0.00565 pour ~7%/an mensualisé)
 */
export function annualRateToPeriodic(annualPct, periodsPerYear) {
  if (!periodsPerYear || periodsPerYear <= 0) return 0;
  return Math.pow(1 + annualPct / 100, 1 / periodsPerYear) - 1;
}

/** Arrondi monétaire à 2 décimales, sans dérive d'arrondi cumulée (les
 * calculs internes gardent la pleine précision flottante ; seul l'arrondi
 * final de CHAQUE période affichée passe par cette fonction — les valeurs
 * réinjectées dans la boucle de simulation restent non arrondies). */
function round2(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

// Montant mensuel équivalent d'un apport périodique (DCA) — répartit le
// montant annualisé sur 12 mois, quelle que soit la fréquence choisie.
function dcaMonthlyEquivalent(amount, frequency) {
  const perYear = DCA_FREQUENCIES[frequency] ?? 12;
  return (amount * perYear) / 12;
}

// Somme des apports ponctuels (mode manuel/hybride) tombant dans un mois
// calendaire donné ("YYYY-MM").
function contributionsForMonth(contributions, monthKey) {
  if (!Array.isArray(contributions)) return 0;
  return contributions
    .filter(c => c && c.date && c.date.slice(0, 7) === monthKey)
    .reduce((s, c) => s + (Number(c.amount) || 0), 0);
}

/**
 * Calcule la projection période par période (granularité mensuelle) d'une
 * stratégie d'investissement.
 *
 * @param {Object} strategy
 * @param {number} strategy.initialCapital
 * @param {number} [strategy.dcaAmount=0]
 * @param {"weekly"|"monthly"|"quarterly"|"yearly"} [strategy.dcaFrequency="monthly"]
 * @param {number} [strategy.dcaGrowthPct=0] - augmentation annuelle du DCA (%)
 * @param {Array<{date:string, amount:number}>} [strategy.contributions=[]] - apports ponctuels (mode manuel/hybride)
 * @param {number} strategy.annualReturnPct
 * @param {number} strategy.durationYears
 * @param {boolean} [strategy.reinvest=true] - intérêts composés ON/OFF
 * @param {"monthly"|"quarterly"|"yearly"} [strategy.compoundingFrequency="monthly"]
 * @param {{fixed?:number, annualPct?:number, perContribution?:number}} [strategy.fees]
 * @param {number} [strategy.inflationPct=0]
 * @param {number} [strategy.monthlyPayout=0] - revenus trading / prop firm (section 14)
 * @param {number} [strategy.reinvestRatio=1] - part du payout réinvestie (0-1), reste = retrait
 * @param {string} [strategy.startDate] - ISO "YYYY-MM-DD", défaut = aujourd'hui
 * @returns {{ periods: Array<Object>, summary: Object }}
 */
export function runInvestmentProjection(strategy) {
  const s = strategy || {};
  const initialCapital = Number(s.initialCapital) || 0;
  const dcaAmount = Number(s.dcaAmount) || 0;
  const dcaFrequency = s.dcaFrequency || "monthly";
  const dcaGrowthPct = Number(s.dcaGrowthPct) || 0;
  const contributions = s.contributions || [];
  const annualReturnPct = Number(s.annualReturnPct) || 0;
  const durationYears = Math.max(0, Number(s.durationYears) || 0);
  const reinvest = s.reinvest !== false;
  const compoundingFrequency = s.compoundingFrequency || "monthly";
  const fees = { fixed: 0, annualPct: 0, perContribution: 0, ...(s.fees || {}) };
  const inflationPct = Number(s.inflationPct) || 0;
  const monthlyPayout = Number(s.monthlyPayout) || 0;
  const reinvestRatio = s.reinvestRatio != null ? Math.max(0, Math.min(1, Number(s.reinvestRatio))) : 1;
  const startDate = s.startDate ? new Date(s.startDate) : new Date();

  const periodsPerYear = COMPOUND_FREQUENCIES[compoundingFrequency] ?? 12;
  const periodicRate = annualRateToPeriodic(annualReturnPct, periodsPerYear);
  // Ramené en taux MENSUEL équivalent pour un pas de simulation mensuel fixe,
  // quelle que soit la fréquence de capitalisation choisie — une seule
  // conversion de taux dans tout le moteur, jamais deux formules qui
  // pourraient diverger (leçon tirée d'un bug réel du simulateur PropFirm).
  const monthlyRate = Math.pow(1 + periodicRate, periodsPerYear / 12) - 1;
  const inflationMonthlyRate = annualRateToPeriodic(inflationPct, 12);
  const feeMonthlyRate = fees.annualPct ? fees.annualPct / 100 / 12 : 0;

  const totalMonths = Math.round(durationYears * 12);

  let capital = initialCapital;   // reinvest=true : capital total (principal + gains réinvestis)
  let principal = initialCapital; // reinvest=false : principal seul, n'intègre jamais les gains
  let gainsBucket = 0;            // reinvest=false : gains cumulés à part, ne produisent pas de rendement
  let totalContributed = initialCapital;
  let totalWithdrawn = 0;
  let totalFees = fees.fixed || 0;

  const periods = [];
  let cursor = new Date(startDate);

  for (let m = 0; m <= totalMonths; m++) {
    const monthKey = cursor.getFullYear() + "-" + String(cursor.getMonth() + 1).padStart(2, "0");
    const yearIndex = Math.floor(m / 12);
    const startingCapital = reinvest ? capital : principal + gainsBucket;

    let contribution = 0;
    let withdrawal = 0;
    let investmentReturn = 0;
    let feeThisPeriod = 0;

    if (m > 0) {
      // DCA (avec augmentation annuelle optionnelle)
      if (dcaAmount > 0) {
        const growthFactor = Math.pow(1 + dcaGrowthPct / 100, yearIndex);
        contribution += dcaMonthlyEquivalent(dcaAmount, dcaFrequency) * growthFactor;
      }
      // Apports ponctuels (mode manuel/hybride)
      contribution += contributionsForMonth(contributions, monthKey);
      // Revenus trading / prop firm (section 14) : part réinvestie = apport, reste = retrait
      if (monthlyPayout > 0) {
        contribution += monthlyPayout * reinvestRatio;
        withdrawal += monthlyPayout * (1 - reinvestRatio);
      }
      // Frais fixes par apport
      if (contribution > 0 && fees.perContribution) {
        const feeAmt = Math.min(contribution, fees.perContribution);
        contribution -= feeAmt;
        totalFees += feeAmt;
      }

      if (reinvest) {
        investmentReturn = capital * monthlyRate;
        feeThisPeriod = capital * feeMonthlyRate;
        capital = capital + contribution - withdrawal + investmentReturn - feeThisPeriod;
        principal += contribution - withdrawal; // suivi informatif du principal même en mode composé
      } else {
        investmentReturn = principal * monthlyRate;
        feeThisPeriod = principal * feeMonthlyRate;
        gainsBucket += investmentReturn - feeThisPeriod;
        principal += contribution - withdrawal;
      }
      totalFees += feeThisPeriod;
      totalContributed += contribution;
      totalWithdrawn += withdrawal;
    }

    const endingCapital = reinvest ? capital : principal + gainsBucket;
    const netInvested = totalContributed - totalWithdrawn;
    const totalGain = endingCapital - netInvested;
    const realValueAdjustedForInflation = inflationMonthlyRate > 0
      ? endingCapital / Math.pow(1 + inflationMonthlyRate, m)
      : endingCapital;

    periods.push({
      date: monthKey,
      monthIndex: m,
      yearIndex,
      startingCapital: round2(startingCapital),
      contribution: round2(contribution),
      withdrawal: round2(withdrawal),
      fees: round2(feeThisPeriod),
      investmentReturn: round2(investmentReturn),
      endingCapital: round2(endingCapital),
      totalContributed: round2(totalContributed),
      totalWithdrawn: round2(totalWithdrawn),
      totalGain: round2(totalGain),
      realValueAdjustedForInflation: round2(realValueAdjustedForInflation),
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  const last = periods[periods.length - 1] || {};
  const netInvestedFinal = (last.totalContributed || 0) - (last.totalWithdrawn || 0);
  const performancePct = netInvestedFinal > 0 ? ((last.endingCapital - netInvestedFinal) / netInvestedFinal) * 100 : 0;

  const summary = {
    finalCapital: last.endingCapital || 0,
    totalContributed: last.totalContributed || 0,
    totalWithdrawn: last.totalWithdrawn || 0,
    netInvested: round2(netInvestedFinal),
    totalGain: last.totalGain || 0,
    totalFees: round2(totalFees),
    performancePct: round2(performancePct),
    durationYears,
    finalRealValue: last.realValueAdjustedForInflation || 0,
  };

  return { periods, summary };
}

/**
 * Agrège les périodes mensuelles en lignes ANNUELLES (histogramme +
 * tableau d'évolution annuel, sections 8/9 du cahier des charges).
 */
export function aggregateByYear(periods) {
  const byYear = new Map();
  (periods || []).forEach(p => {
    const y = p.date.slice(0, 4);
    if (!byYear.has(y)) {
      byYear.set(y, { year: y, contributions: 0, gains: 0, withdrawals: 0, fees: 0, endingCapital: 0, totalContributed: 0, totalGain: 0 });
    }
    const row = byYear.get(y);
    row.contributions += p.contribution;
    row.gains += p.investmentReturn;
    row.withdrawals += p.withdrawal;
    row.fees += p.fees;
    row.endingCapital = p.endingCapital; // dernière valeur de l'année = capital fin d'année
    row.totalContributed = p.totalContributed;
    row.totalGain = p.totalGain;
  });
  return Array.from(byYear.values()).map(r => ({
    ...r,
    contributions: round2(r.contributions),
    gains: round2(r.gains),
    withdrawals: round2(r.withdrawals),
    fees: round2(r.fees),
  }));
}

/**
 * Résumé comparatif de plusieurs stratégies déjà projetées (section 10).
 * @param {Array<{name:string, projection:{summary:Object}}>} projectionsWithNames
 */
export function compareStrategies(projectionsWithNames) {
  return (projectionsWithNames || []).map(({ name, projection }) => ({
    name,
    invested: projection.summary.netInvested,
    gains: projection.summary.totalGain,
    finalCapital: projection.summary.finalCapital,
    performancePct: projection.summary.performancePct,
  }));
}
