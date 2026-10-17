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
  const blowUp = clamp(num(plan.blowUpRatePct, 0), 0, 100) / 100;

  // ══════════════════════════════════════════════════════════════════════
  // DUREE REELLE D'UN CHALLENGE
  // ----------------------------------------------------------------------
  // Un challenge n'est pas "2 mois" par convention : c'est le temps qu'IL TE
  // FAUT pour faire l'objectif de chaque phase a TON rythme, sans pouvoir
  // descendre sous le nombre de jours de trading minimum impose par la firm.
  // Avec 1,7 %/mois, une phase 1 a 8 % demande pres de 5 mois : l'ignorer
  // revient a se mentir sur la date a laquelle on touchera le premier euro.
  // Le mode manuel reste disponible pour qui veut forcer une duree.
  // ══════════════════════════════════════════════════════════════════════
  const TRADING_DAYS_MONTH = 21;
  const phaseMonths = (targetPct, minDays) => {
    const t = Math.max(0, num(targetPct, 0));
    const d = Math.max(0, num(minDays, 0)) / TRADING_DAYS_MONTH;
    if (t <= 0) return d;
    if (!(monthlyReturnPct > 0)) return Infinity;   // objectif hors de portee
    return Math.max(t / monthlyReturnPct, d);
  };
  const p1Months = phaseMonths(plan.phase1TargetPct, plan.phase1MinDays);
  const p2Months = num(plan.phase2TargetPct, 0) > 0 || num(plan.phase2MinDays, 0) > 0
    ? phaseMonths(plan.phase2TargetPct, plan.phase2MinDays) : 0;
  const activationMonths = Math.max(0, num(plan.fundingDelayMonths, 0.5));
  const autoDurationRaw = p1Months + p2Months + activationMonths;
  const autoDuration = isFinite(autoDurationRaw) ? autoDurationRaw : null;

  const useAuto = plan.autoChallengeDuration === true && autoDuration != null;
  const challengeMonths = Math.max(1, Math.round(
    useAuto ? autoDuration : num(plan.challengeMonths, 2)
  ));

  // ══════════════════════════════════════════════════════════════════════
  // RYTHME D'ACHAT — la logique humaine
  // ----------------------------------------------------------------------
  // Un trader qui cherche a reussir n'achete pas six challenges le meme jour
  // avec zero historique. Il en lance un, voit ce que ca donne, puis ouvre le
  // robinet. Ces trois reglages decrivent cette prudence : combien de
  // challenges il accepte de mener EN MEME TEMPS, le delai minimum qu'il
  // s'impose entre deux achats, et la pause qu'il prend apres un echec.
  // ══════════════════════════════════════════════════════════════════════
  const maxParallel = Math.max(1, Math.round(num(plan.maxParallelChallenges, 99)));
  const minMonthsBetweenBuys = Math.max(0, Math.round(num(plan.minMonthsBetweenBuys, 0)));
  const pauseAfterFail = Math.max(0, Math.round(num(plan.pauseAfterFailMonths, 0)));

  const reinvest = clamp(num(plan.reinvestPct, 0), 0, 100) / 100;
  const maxAccounts = Math.max(0, num(plan.maxAccounts, 0)); // 0 = illimite
  const costPerAccount = Math.max(0, num(plan.monthlyCostPerAccount, 0));
  const costFixed = Math.max(0, num(plan.monthlyCostFixed, 0));
  const taxRate = clamp(num(plan.taxRatePct, 0), 0, 100) / 100;
  // Racheter un compte perdu : actif par defaut. Le desactiver revient a dire
  // "si je grille un compte, je n'en reprends pas" — un choix possible, mais
  // qui doit etre explicite, jamais le comportement par defaut.
  const rebuyLost = plan.rebuyLostAccounts !== false;
  const horizon = clamp(Math.round(num(plan.horizonMonths, 36)), 1, 600);

  const targetIncome = Math.max(0, num(plan.targetMonthlyIncome, 0));
  const targetCapital = Math.max(0, num(plan.targetCapital, 0));

  // ══════════════════════════════════════════════════════════════════════
  // POINT DE DEPART — ou en es-tu aujourd'hui ?
  // ----------------------------------------------------------------------
  //   "saving"      : rien encore, tu mets de cote pour ton premier challenge
  //   "buying"      : tu achetes ton tout premier challenge ce mois-ci
  //   "inChallenge" : tu as deja un challenge en cours (phase 1 ou 2)
  //   "funded"      : tu pilotes deja un ou plusieurs comptes funded
  // Ces quatre situations ne donnent pas du tout la meme date de premier
  // euro : les confondre fausse toute la projection.
  // ══════════════════════════════════════════════════════════════════════
  const stage = ["saving", "buying", "inChallenge", "funded"].includes(plan.startStage)
    ? plan.startStage : (num(plan.startAccounts, 0) > 0 ? "funded" : "buying");

  let accounts = stage === "funded" ? Math.max(0, num(plan.startAccounts, 0)) : 0;
  let cash = Math.max(0, num(plan.startPendingFee, 0));

  // File des challenges en cours : index = mois restant avant resultat.
  // pipeline[i] = nombre de challenges achetes qui aboutiront dans i mois.
  const pipeline = [];
  const enFile = () => pipeline.reduce((acc, x) => acc + x, 0);

  if (stage === "inChallenge") {
    // Challenge deja engage : on ne compte que le temps QUI RESTE.
    const phaseEnCours = num(plan.startChallengePhase, 1) >= 2 ? 2 : 1;
    const ecoule = Math.max(0, num(plan.startChallengeMonthsElapsed, 0));
    const restantBrut = phaseEnCours >= 2
      ? Math.max(0, p2Months - ecoule) + activationMonths
      : Math.max(0, (useAuto ? autoDuration : challengeMonths) - ecoule);
    const restant = Math.max(1, Math.round(isFinite(restantBrut) ? restantBrut : challengeMonths));
    // Index `restant` et non `restant - 1` : un challenge auquel il reste un
    // mois se termine A LA FIN du mois 1, donc le compte ne produit qu'a
    // partir du mois 2. Place a l'index restant - 1, il etait deja funded des
    // le mois 1 — un mois de revenu offert qui n'existe pas.
    while (pipeline.length <= restant) pipeline.push(0);
    pipeline[restant] += 1;
  }

  // Mois du prochain achat autorise (cadence et pause apres echec).
  let prochainAchatPossible = 1;
  let dernierAchat = -Infinity;

  let cumulTakeHome = 0;   // revenu net garde par le trader (apres reinvestissement)
  let cumulGross = 0;      // payouts bruts cumules
  let cumulCosts = 0;      // frais de challenges + couts recurrents
  let cumulTax = 0;
  let cumulReinvested = 0;

  if (stage === "buying") {
    // "Je demarre" veut dire que le challenge est paye MAINTENANT. L'achat est
    // donc engage d'office, meme sans tresorerie preexistante — sinon cette
    // situation ne declenchait jamais rien et la projection restait plate a
    // vie, ce qui n'a aucun sens pour quelqu'un qui declare se lancer.
    if (fee > 0) { cumulCosts += fee; cumulReinvested += fee; }
    while (pipeline.length <= challengeMonths) pipeline.push(0);
    pipeline[challengeMonths] += 1;
    dernierAchat = 0;
  }

  const months = [];
  let targetIncomeMonth = null;
  let targetCapitalMonth = null;
  let breakEvenMonth = null;  // mois ou le cumul net repasse positif

  // Capacite maximale deja atteinte : sert de repere au rachat. Un trader qui
  // perd un compte ne reduit pas la voilure, il en rachete un.
  let peakAccounts = accounts;

  for (let m = 1; m <= horizon; m++) {
    // ── 1. Les challenges arrives a echeance deviennent funded (en esperance)
    const matured = pipeline.shift() || 0;
    if (matured > 0) {
      accounts += matured * passRate;
      // Un challenge arrive a echeance qui ne passe pas, c'est un echec : le
      // trader souffle avant de remettre au pot. Modelise simplement par un
      // report de la prochaine date d'achat.
      if (pauseAfterFail > 0 && passRate < 1) {
        prochainAchatPossible = Math.max(prochainAchatPossible, m + pauseAfterFail);
      }
    }

    // ── 2. Plafond de comptes
    if (maxAccounts > 0 && accounts > maxAccounts) accounts = maxAccounts;
    if (accounts > peakAccounts) peakAccounts = accounts;

    // ── 3. Revenus du mois
    //    L'attrition est appliquee a la FIN du mois, pas au debut : on trade
    //    le mois avant de risquer de perdre le compte. Auparavant, le mois 1
    //    rapportait deja sur 0,96 compte alors qu'on en avait bien 1 entier.
    //    La ligne du mois rapporte le nombre de comptes qui ont REELLEMENT
    //    produit ce revenu, pas celui qui reste une fois l'attrition passee —
    //    sinon la ligne affiche 0,9 compte a cote d'un revenu gagne sur 1.
    const accountsActive = accounts;
    const grossPayout = accounts * accountCapital * (monthlyReturnPct / 100) * split;
    const runningCosts = accounts * costPerAccount + costFixed;
    const beforeTax = grossPayout - runningCosts;
    // Pas d'impot sur un mois deficitaire.
    const tax = beforeTax > 0 ? beforeTax * taxRate : 0;
    const netIncome = beforeTax - tax;

    cumulGross += grossPayout;
    cumulCosts += runningCosts;
    cumulTax += tax;

    // ── 4. RACHAT DES COMPTES PERDUS (prioritaire sur le reste)
    //    BUG CORRIGE : sans ce mecanisme, un parc de comptes soumis a
    //    l'attrition s'eteignait lentement et le revenu tombait a zero sur
    //    l'horizon, meme avec un excellent taux de reussite — lequel n'avait
    //    alors AUCUN effet, puisque plus aucun challenge n'etait jamais
    //    achete. Cas reellement rencontre : 1 compte, 80 % de reussite,
    //    1 % de reinvestissement -> 0,09 compte au bout de 5 ans.
    //    Un trader qui perd un compte en rachete un : c'est le coeur meme du
    //    metier, pas une option exotique. Finance en priorite sur le revenu du
    //    mois, puis sur la tresorerie, avant le partage reinvesti / encaisse.
    const expectedIncomingNow = pipeline.reduce((s, x) => s + x, 0) * passRate;
    let rebought = 0;
    let rebuyCost = 0;
    if (rebuyLost && fee > 0) {
      const targetCapacity = maxAccounts > 0 ? Math.min(peakAccounts, maxAccounts) : peakAccounts;
      const missing = targetCapacity - accounts - expectedIncomingNow;
      if (missing > 0.01) {
        const needed = Math.ceil(missing / Math.max(passRate, 0.01));
        const affordable = Math.floor((cash + Math.max(0, netIncome)) / fee);
        // Le rachat obeit aux memes limites humaines que les autres achats :
        // on ne mene pas plus de challenges en parallele que ce qu'on s'est
        // fixe, et on respecte le delai qu'on s'impose entre deux achats.
        const placesLibres = Math.max(0, maxParallel - enFile());
        const cadenceOk = m >= prochainAchatPossible && (m - dernierAchat) >= minMonthsBetweenBuys;
        rebought = cadenceOk ? Math.min(needed, affordable, placesLibres) : 0;
        rebuyCost = rebought * fee;
      }
    }
    // Le rachat se sert d'abord dans la tresorerie, le reste sur le revenu.
    const fromCash = Math.min(cash, rebuyCost);
    cash -= fromCash;
    const fromIncome = rebuyCost - fromCash;
    const incomeAfterRebuy = netIncome - fromIncome;

    // ── 5. Reinvestissement : une part de ce qui reste achete des challenges
    //
    //    BUG CORRIGE : la part reinvestie etait prelevee TOUS les mois, meme
    //    quand le plafond de comptes ne laissait plus rien acheter. L'argent
    //    s'empilait alors en tresorerie dormante — 5 338 $ au mois 24 sur un
    //    plan plafonne a 6 comptes — sans jamais etre ni investi ni encaisse,
    //    ce qui minorait d'autant le cumul encaisse affiche. On ne prelevee
    //    desormais que ce qui peut REELLEMENT servir : s'il n'y a pas de place
    //    pour un challenge de plus, le revenu part entierement dans ta poche.
    const incoming = expectedIncomingNow + rebought * passRate;
    const room = (fee > 0 && maxAccounts > 0)
      ? Math.max(0, Math.floor((maxAccounts - accounts - incoming) / Math.max(passRate, 0.01)))
      : (fee > 0 ? Infinity : 0);
    // Budget plafonne au cout des challenges encore achetables, tresorerie
    // deja disponible deduite.
    const budgetUtile = room === Infinity ? Infinity : Math.max(0, room * fee - cash);
    let reinvestBudget = incomeAfterRebuy > 0 ? incomeAfterRebuy * reinvest : 0;
    if (budgetUtile !== Infinity) reinvestBudget = Math.min(reinvestBudget, budgetUtile);
    const takeHome = incomeAfterRebuy - reinvestBudget;
    cumulTakeHome += takeHome;

    cash += reinvestBudget;
    let bought = 0;
    const placesApresRachat = Math.max(0, maxParallel - enFile() - rebought);
    const cadenceOk = m >= prochainAchatPossible && (m - dernierAchat) >= minMonthsBetweenBuys;
    if (fee > 0 && room > 0 && placesApresRachat > 0 && cadenceOk) {
      bought = Math.min(Math.floor(cash / fee), room, placesApresRachat);
      if (bought > 0) {
        cash -= bought * fee;
        cumulReinvested += bought * fee;
      }
    }
    if (bought + rebought > 0) dernierAchat = m;
    cumulCosts += rebuyCost + bought * fee;
    // Les challenges achetes ce mois-ci aboutiront dans challengeMonths mois.
    while (pipeline.length < challengeMonths) pipeline.push(0);
    pipeline[challengeMonths - 1] += bought + rebought;

    // ── 6. Attrition, en fin de mois : le compte a travaille avant de sauter.
    if (blowUp > 0) accounts = accounts * (1 - blowUp);

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
      accounts: +accountsActive.toFixed(2),
      capitalUnderManagement: +(accountsActive * accountCapital).toFixed(0),
      grossPayout: +grossPayout.toFixed(2),
      runningCosts: +runningCosts.toFixed(2),
      tax: +tax.toFixed(2),
      netIncome: +netIncome.toFixed(2),
      reinvested: +(bought * fee).toFixed(2),
      challengesBought: bought,
      challengesRebought: rebought,
      rebuyCost: +rebuyCost.toFixed(2),
      takeHome: +takeHome.toFixed(2),
      cumulTakeHome: +cumulTakeHome.toFixed(2),
      cumulNet: +cumulNet.toFixed(2),
      cash: +cash.toFixed(2),
      targetReached: targetIncome > 0 && netIncome >= targetIncome,
    });
  }

  const last = months[months.length - 1] || null;

  // Premiers jalons du parcours : quand un compte funded apparait, et quand
  // le premier euro tombe reellement.
  let firstFundedMonth = null, firstPaidMonth = null;
  for (const mo of months) {
    if (firstFundedMonth === null && mo.accounts > 0.001) firstFundedMonth = mo.month;
    if (firstPaidMonth === null && mo.takeHome > 0) firstPaidMonth = mo.month;
  }

  return {
    months,
    timeline: {
      startStage: stage,
      phase1Months: isFinite(p1Months) ? +p1Months.toFixed(2) : null,
      phase2Months: isFinite(p2Months) ? +p2Months.toFixed(2) : null,
      activationMonths: +activationMonths.toFixed(2),
      autoChallengeMonths: autoDuration != null ? +autoDuration.toFixed(2) : null,
      challengeMonths,
      usedAuto: useAuto,
      maxParallel,
      minMonthsBetweenBuys,
      pauseAfterFail,
      firstFundedMonth,
      firstPaidMonth,
    },
    summary: {
      horizonMonths: horizon,
      firstFundedMonth,
      firstPaidMonth,
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

  // Drawdown total de la simulation, deja calcule et remonte par le
  // simulateur (chaine formatee -> nombre). Sert au comparateur de firms :
  // comparer une limite de drawdown sans savoir ou on en est n'a aucun sens.
  const maxDDPct = num(parseFloat(lastSim.ddTotPct), 0);

  return {
    source: "simulator",
    available: true,
    accountCapital: capital,
    monthlyReturnPct: +monthlyReturnPct.toFixed(3),
    maxDDPct: maxDDPct > 0 ? +maxDDPct.toFixed(2) : null,
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

  // ── Pire drawdown REEL, jour par jour ──────────────────────────────────
  // Reconstruit la courbe d'equite depuis le premier jour saisi, suit le pic
  // atteint et retient le plus grand creux sous ce pic, en % du capital.
  // C'est la seule grandeur qui permette de dire si une limite de 6 % ou de
  // 10 % est tenable POUR CE TRADER — un comparateur qui l'ignore ne compare
  // que des brochures.
  let equity = 0, peak = 0, maxDrop = 0;
  monthKeys.forEach(mk => {
    const days = journalFlat[mk] || {};
    Object.keys(days).map(Number).sort((a, b) => a - b).forEach(d => {
      equity += num(days[String(d)] && days[String(d)].pnl, 0);
      if (equity > peak) peak = equity;
      const drop = peak - equity;
      if (drop > maxDrop) maxDrop = drop;
    });
  });
  const maxDDPct = cap > 0 ? (maxDrop / cap) * 100 : 0;

  return {
    source: "journal",
    available: true,
    accountCapital: cap,
    monthlyReturnPct: +monthlyReturnPct.toFixed(3),
    maxDDPct: maxDDPct > 0 ? +maxDDPct.toFixed(2) : null,
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
