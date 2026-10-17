// ══════════════════════════════════════════════════════════════════════════
// MOTEUR DE PROJECTION FINANCIERE — prop firm
// --------------------------------------------------------------------------
// Module PUR : aucune dependance React, aucun acces au DOM ou au localStorage.
// Tout passe par les arguments, tout ressort dans la valeur de retour. C'est ce
// qui le rend testable (voir projectionEngine.test.js) et reutilisable.
//
// PRINCIPE : le simulateur (ou le journal de trading) fournit la VERITE —
// rendement mensuel reel d'un compte, taux de reussite des challenges, cout
// d'un challenge. Ce moteur ne fait que projeter cette verite dans le temps
// selon un plan personnel : combien de comptes au depart, quelle part des
// payouts est reinvestie en nouveaux challenges, quel objectif de revenu.
//
// GRANULARITE : le mois. C'est l'unite de paiement des prop firms (payout
// mensuel) et celle du simulateur funded — projeter plus fin serait du faux
// detail.
//
// ESPERANCE, PAS TIRAGE : le nombre de comptes funded est un reel, pas un
// entier. Acheter 3 challenges avec 60% de reussite donne 1,8 compte funded
// attendu — pas 1 ou 2 selon un tirage. Une projection sur 5 ans doit montrer
// la trajectoire moyenne, pas un scenario tire au hasard parmi des milliers.
// Les ACHATS, eux, restent entiers : on ne paie pas 2,4 challenges.
// ══════════════════════════════════════════════════════════════════════════

/** Borne une valeur dans un intervalle. */
function clamp(v, lo, hi) {
  const n = Number(v);
  if (!isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

function num(v, fallback = 0) {
  const n = Number(v);
  return isFinite(n) ? n : fallback;
}

/**
 * Projette un plan prop firm mois par mois.
 *
 * @param {object} plan
 *   --- SOURCE DE VERITE (simulateur ou journal) ---
 *   accountCapital       Taille d'un compte funded ($).
 *   monthlyReturnPct     Rendement mensuel BRUT du compte, avant split (%).
 *   profitSplitPct       Part du trader sur les profits (%).
 *   challengeFee         Prix d'un challenge ($).
 *   passRatePct          Probabilite de passer le challenge (%).
 *   challengeMonths      Duree moyenne pour passer le challenge (mois).
 *   blowUpRatePct        Probabilite mensuelle de perdre un compte funded (%).
 *   --- PLAN PERSONNEL ---
 *   startAccounts        Comptes funded deja actifs au depart.
 *   startPendingFee      Tresorerie disponible au depart pour acheter ($).
 *   reinvestPct          Part du revenu net reinjectee en challenges (%).
 *   maxAccounts          Plafond de comptes funded simultanes (0 = illimite).
 *   monthlyCostPerAccount Cout mensuel par compte : EA, VPS... ($).
 *   monthlyCostFixed     Cout mensuel fixe, independant du nombre de comptes ($).
 *   taxRatePct           Imposition sur le revenu percu (%).
 *   horizonMonths        Duree de la projection (mois).
 *   --- OBJECTIFS ---
 *   targetMonthlyIncome  Revenu mensuel net vise ($/mois) = liberte financiere.
 *   targetCapital        Patrimoine cumule vise ($), optionnel.
 *
 * @returns {{months: Array, summary: object}}
 */
export function runPropFirmProjection(plan) {
  const accountCapital = Math.max(0, num(plan.accountCapital, 25000));
  const monthlyReturnPct = num(plan.monthlyReturnPct, 0);
  const split = clamp(num(plan.profitSplitPct, 80), 0, 100) / 100;
  const fee = Math.max(0, num(plan.challengeFee, 0));
  const passRate = clamp(num(plan.passRatePct, 100), 0, 100) / 100;
  const challengeMonths = Math.max(1, Math.round(num(plan.challengeMonths, 2)));
  const blowUp = clamp(num(plan.blowUpRatePct, 0), 0, 100) / 100;

  const reinvest = clamp(num(plan.reinvestPct, 0), 0, 100) / 100;
  const maxAccounts = Math.max(0, num(plan.maxAccounts, 0)); // 0 = illimite
  const costPerAccount = Math.max(0, num(plan.monthlyCostPerAccount, 0));
  const costFixed = Math.max(0, num(plan.monthlyCostFixed, 0));
  const taxRate = clamp(num(plan.taxRatePct, 0), 0, 100) / 100;
  const horizon = clamp(Math.round(num(plan.horizonMonths, 36)), 1, 600);

  const targetIncome = Math.max(0, num(plan.targetMonthlyIncome, 0));
  const targetCapital = Math.max(0, num(plan.targetCapital, 0));

  let accounts = Math.max(0, num(plan.startAccounts, 0));
  let cash = Math.max(0, num(plan.startPendingFee, 0));

  // File des challenges en cours : index = mois restant avant resultat.
  // pipeline[i] = nombre de challenges achetes qui aboutiront dans i mois.
  const pipeline = [];

  let cumulTakeHome = 0;   // revenu net garde par le trader (apres reinvestissement)
  let cumulGross = 0;      // payouts bruts cumules
  let cumulCosts = 0;      // frais de challenges + couts recurrents
  let cumulTax = 0;
  let cumulReinvested = 0;

  const months = [];
  let targetIncomeMonth = null;
  let targetCapitalMonth = null;
  let breakEvenMonth = null;  // mois ou le cumul net repasse positif

  for (let m = 1; m <= horizon; m++) {
    // ── 1. Les challenges arrives a echeance deviennent funded (en esperance)
    const matured = pipeline.shift() || 0;
    if (matured > 0) accounts += matured * passRate;

    // ── 2. Attrition : un compte funded peut sauter (breach de DD)
    if (blowUp > 0) accounts = accounts * (1 - blowUp);

    // ── 3. Plafond de comptes
    if (maxAccounts > 0 && accounts > maxAccounts) accounts = maxAccounts;

    // ── 4. Revenus du mois
    const grossPayout = accounts * accountCapital * (monthlyReturnPct / 100) * split;
    const runningCosts = accounts * costPerAccount + costFixed;
    const beforeTax = grossPayout - runningCosts;
    // Pas d'impot sur un mois deficitaire.
    const tax = beforeTax > 0 ? beforeTax * taxRate : 0;
    const netIncome = beforeTax - tax;

    cumulGross += grossPayout;
    cumulCosts += runningCosts;
    cumulTax += tax;

    // ── 5. Reinvestissement : une part du revenu net achete des challenges
    let reinvestBudget = netIncome > 0 ? netIncome * reinvest : 0;
    const takeHome = netIncome - reinvestBudget;
    cumulTakeHome += takeHome;

    cash += reinvestBudget;
    let bought = 0;
    if (fee > 0) {
      // Ne pas acheter au-dela du plafond : comptes actifs + comptes attendus
      // des challenges deja en cours. Sans ce garde-fou, un plafond de 3
      // comptes continuerait d'acheter indefiniment des challenges.
      const expectedIncoming = pipeline.reduce((s, x) => s + x, 0) * passRate;
      const room = maxAccounts > 0
        ? Math.max(0, Math.floor((maxAccounts - accounts - expectedIncoming) / Math.max(passRate, 0.01)))
        : Infinity;
      bought = Math.min(Math.floor(cash / fee), room);
      if (bought > 0) {
        cash -= bought * fee;
        cumulCosts += bought * fee;
        cumulReinvested += bought * fee;
      }
    }
    // Les challenges achetes ce mois-ci aboutiront dans challengeMonths mois.
    while (pipeline.length < challengeMonths) pipeline.push(0);
    pipeline[challengeMonths - 1] += bought;

    const cumulNet = cumulTakeHome + cash - Math.max(0, num(plan.startPendingFee, 0));

    // ── 6. Objectifs
    if (targetIncomeMonth === null && targetIncome > 0 && netIncome >= targetIncome) {
      targetIncomeMonth = m;
    }
    if (targetCapitalMonth === null && targetCapital > 0 && cumulTakeHome >= targetCapital) {
      targetCapitalMonth = m;
    }
    if (breakEvenMonth === null && cumulNet > 0) breakEvenMonth = m;

    months.push({
      month: m,
      accounts: +accounts.toFixed(2),
      capitalUnderManagement: +(accounts * accountCapital).toFixed(0),
      grossPayout: +grossPayout.toFixed(2),
      runningCosts: +runningCosts.toFixed(2),
      tax: +tax.toFixed(2),
      netIncome: +netIncome.toFixed(2),
      reinvested: +(bought * fee).toFixed(2),
      challengesBought: bought,
      takeHome: +takeHome.toFixed(2),
      cumulTakeHome: +cumulTakeHome.toFixed(2),
      cumulNet: +cumulNet.toFixed(2),
      cash: +cash.toFixed(2),
      targetReached: targetIncome > 0 && netIncome >= targetIncome,
    });
  }

  const last = months[months.length - 1] || null;

  return {
    months,
    summary: {
      horizonMonths: horizon,
      finalAccounts: last ? last.accounts : 0,
      finalCapitalUnderManagement: last ? last.capitalUnderManagement : 0,
      finalMonthlyNet: last ? last.netIncome : 0,
      finalMonthlyTakeHome: last ? last.takeHome : 0,
      cumulTakeHome: +cumulTakeHome.toFixed(2),
      cumulGross: +cumulGross.toFixed(2),
      cumulCosts: +cumulCosts.toFixed(2),
      cumulTax: +cumulTax.toFixed(2),
      cumulReinvested: +cumulReinvested.toFixed(2),
      targetMonthlyIncome: targetIncome,
      targetIncomeMonth,          // null si jamais atteint sur l'horizon
      targetCapital,
      targetCapitalMonth,
      breakEvenMonth,
      // Revenu moyen sur toute la periode — utile pour "combien je touche par mois"
      avgMonthlyNet: horizon > 0 ? +((months.reduce((s, x) => s + x.netIncome, 0)) / horizon).toFixed(2) : 0,
    },
  };
}

/**
 * Agrege la projection par annee civile de projection (12 mois glissants).
 */
export function aggregateProjectionByYear(months) {
  const years = [];
  (months || []).forEach(m => {
    const y = Math.ceil(m.month / 12);
    let row = years.find(x => x.year === y);
    if (!row) {
      row = {
        year: y, grossPayout: 0, runningCosts: 0, tax: 0, netIncome: 0,
        takeHome: 0, reinvested: 0, challengesBought: 0,
        endAccounts: 0, endCumulTakeHome: 0,
      };
      years.push(row);
    }
    row.grossPayout += m.grossPayout;
    row.runningCosts += m.runningCosts;
    row.tax += m.tax;
    row.netIncome += m.netIncome;
    row.takeHome += m.takeHome;
    row.reinvested += m.reinvested;
    row.challengesBought += m.challengesBought;
    row.endAccounts = m.accounts;
    row.endCumulTakeHome = m.cumulTakeHome;
  });
  return years.map(r => ({
    ...r,
    grossPayout: +r.grossPayout.toFixed(2),
    runningCosts: +r.runningCosts.toFixed(2),
    tax: +r.tax.toFixed(2),
    netIncome: +r.netIncome.toFixed(2),
    takeHome: +r.takeHome.toFixed(2),
    reinvested: +r.reinvested.toFixed(2),
  }));
}

// ══════════════════════════════════════════════════════════════════════════
// EXTRACTION DE LA VERITE
// --------------------------------------------------------------------------
// Deux sources possibles, dans l'ordre de preference affiche a l'utilisateur :
//   1. LE JOURNAL — des trades reellement executes. La verite la plus forte.
//   2. LE SIMULATEUR — une hypothese calibree, mais une hypothese.
// Les deux renvoient la meme forme, pour que le reste du moteur ne sache pas
// d'ou vient le chiffre.
// ══════════════════════════════════════════════════════════════════════════

/**
 * Deduit le rendement mensuel d'un compte a partir du resultat du simulateur.
 * @param {object} lastSim L'objet remonte par le simulateur (onSimResult).
 * @returns {object|null}
 */
export function truthFromSimulator(lastSim) {
  if (!lastSim || !lastSim.capital) return null;
  const capital = num(lastSim.capital, 0);
  if (capital <= 0) return null;

  const f = lastSim.funded;
  const rows = f && Array.isArray(f.data) ? f.data : [];
  if (!rows.length) {
    return {
      source: "simulator",
      available: false,
      reason: "Le simulateur n'a pas encore produit de phase funded.",
      accountCapital: capital,
    };
  }

  // Rendement mensuel BRUT (avant split) : on repart du profit du mois rapporte
  // a sa base — exactement le champ que simulateFunded expose (profitPct),
  // jamais une moyenne de pourcentages de bases differentes.
  const totalPnl = rows.reduce((s, r) => s + (num(r.monthStart, 0) * num(r.profitPct, 0) / 100), 0);
  const totalBase = rows.reduce((s, r) => s + num(r.monthStart, 0), 0);
  const monthlyReturnPct = totalBase > 0 ? (totalPnl / totalBase) * 100 : 0;

  const winMonths = rows.filter(r => num(r.profitPct, 0) > 0).length;

  return {
    source: "simulator",
    available: true,
    accountCapital: capital,
    monthlyReturnPct: +monthlyReturnPct.toFixed(3),
    months: rows.length,
    winMonthsPct: rows.length ? +((winMonths / rows.length) * 100).toFixed(1) : 0,
    cumulPayout: num(f.cumulPayout, 0),
    label: `Simulateur — ${rows.length} mois funded`,
  };
}

/**
 * Deduit le rendement mensuel reel a partir du journal de trading.
 * @param {object} journalFlat  { "YYYY-MM": { "1": {pnl}, ... } }
 * @param {number} capital      Capital de reference du compte journal.
 */
export function truthFromJournal(journalFlat, capital) {
  const cap = Math.max(0, num(capital, 0));
  const monthKeys = Object.keys(journalFlat || {}).sort();
  if (!monthKeys.length || cap <= 0) {
    return {
      source: "journal",
      available: false,
      reason: "Aucune donnee dans le journal de trading.",
      accountCapital: cap,
    };
  }

  const monthly = monthKeys.map(mk => {
    const days = journalFlat[mk] || {};
    const pnl = Object.values(days).reduce((s, d) => s + num(d && d.pnl, 0), 0);
    return { monthKey: mk, pnl };
  });

  // Un mois en cours fausse la moyenne (il n'est pas termine) : on le signale
  // sans l'exclure d'office — c'est a l'ecran de proposer le filtre.
  const totalPnl = monthly.reduce((s, m) => s + m.pnl, 0);
  const monthlyReturnPct = (totalPnl / monthly.length) / cap * 100;
  const winMonths = monthly.filter(m => m.pnl > 0).length;

  return {
    source: "journal",
    available: true,
    accountCapital: cap,
    monthlyReturnPct: +monthlyReturnPct.toFixed(3),
    months: monthly.length,
    winMonthsPct: +((winMonths / monthly.length) * 100).toFixed(1),
    totalPnl: +totalPnl.toFixed(2),
    monthly,
    label: `Journal — ${monthly.length} mois réels`,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// SCENARIOS
// --------------------------------------------------------------------------
// Un seul chiffre de rendement est une illusion de precision. Trois scenarios
// construits sur le MEME plan, en ne faisant varier que ce qui est incertain
// (rendement, taux de reussite, risque de perdre un compte), montrent la
// fourchette reelle.
// ══════════════════════════════════════════════════════════════════════════

export const SCENARIO_PRESETS = [
  { key: "prudent",  label: "Prudent",  returnMult: 0.6, passMult: 0.75, blowUpMult: 1.6 },
  { key: "realiste", label: "Réaliste", returnMult: 1.0, passMult: 1.0,  blowUpMult: 1.0 },
  { key: "ambitieux", label: "Ambitieux", returnMult: 1.35, passMult: 1.15, blowUpMult: 0.7 },
];

/**
 * Derive les trois scenarios d'un plan de base et les projette.
 */
export function buildScenarios(plan) {
  return SCENARIO_PRESETS.map(sc => {
    const scenarioPlan = {
      ...plan,
      monthlyReturnPct: num(plan.monthlyReturnPct, 0) * sc.returnMult,
      passRatePct: clamp(num(plan.passRatePct, 100) * sc.passMult, 0, 100),
      blowUpRatePct: clamp(num(plan.blowUpRatePct, 0) * sc.blowUpMult, 0, 100),
    };
    const projection = runPropFirmProjection(scenarioPlan);
    return { ...sc, plan: scenarioPlan, projection };
  });
}
