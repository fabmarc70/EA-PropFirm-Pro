// ══════════════════════════════════════════════════════════════════════════
// MOTEUR DE COMPARAISON DES PROP FIRMS
// --------------------------------------------------------------------------
// Module PUR : ni React, ni DOM, ni localStorage. Tout entre par les
// arguments, tout sort dans la valeur de retour — donc testable
// (firmCompareEngine.test.js).
//
// POURQUOI UNE REECRITURE. L'ancien comparateur notait surtout des criteres
// INDEPENDANTS de la firm (taille d'echantillon, coherence du winrate) et
// saturait les criteres qui, eux, en dependaient. Resultat constate a
// l'ecran : FundedNext, FTMO, E8 et Alpha affichaient tous 78 %, avec les
// memes trois phrases. Un comparateur qui ne separe pas ne compare pas.
//
// CE QUI CHANGE. Chaque critere est normalise entre 0 et 1, puis pondere par
// une priorite choisie par l'utilisateur. Deux traders aux priorites
// differentes obtiennent des classements differents — c'est tout l'interet.
// Les criteres retenus sont ceux qui modifient reellement les chances de
// passer ou le resultat final : marge de drawdown, difficulte de l'objectif,
// cout reel, delai avant le premier euro, part du profit, souplesse des
// regles.
//
// Les modeles sont compares INDIVIDUELLEMENT (1-step contre 2-step, et non
// une firm entiere) : chez une meme firm, le 1-step et le 2-step n'ont ni le
// meme drawdown, ni le meme objectif, ni le meme risque.
// ══════════════════════════════════════════════════════════════════════════

function num(v, d = 0) { const n = Number(v); return isFinite(n) ? n : d; }
function clamp01(x) { return Math.min(1, Math.max(0, x)); }

// ══════════════════════════════════════════════════════════════════════════
// FAITS COMMERCIAUX PAR FIRM
// --------------------------------------------------------------------------
// Ce que PROP_FIRMS ne contient pas et qui change pourtant le resultat :
// duree limite du challenge, remboursement des frais, regle de consistance,
// options de payout, contraintes sur les EA.
//
// `null` signifie EXPLICITEMENT "non verifie" et s'affiche comme tel dans
// l'app. Inventer une valeur plausible sur un sujet ou l'utilisateur engage
// des centaines d'euros serait pire que de ne rien dire.
//
// Releve le 17/10/2026 a partir des pages publiques des firms et de
// comparatifs a jour. Ces conditions changent souvent : l'ecran invite a les
// revalider sur le site de la firm avant tout achat.
// ══════════════════════════════════════════════════════════════════════════
export const FIRM_FACTS = {
  fundednext: {
    timeLimitDays: null,              // null = illimite (verifie)
    timeLimitUnlimited: true,
    feeRefund: "Remboursés avec le premier retrait du compte funded",
    feeRefundLikely: true,
    consistencyRule: null,            // aucune sur le Stellar 2-Step
    consistencyPct: null,
    eaApprovalRequired: false,
    payoutOptions: "Cycle 14 jours",
    splitAddon: "Option payante : 95 % de split dès le premier payout",
    verified: "2026-10-17",
  },
  ftmo: {
    timeLimitDays: null,
    timeLimitUnlimited: true,
    feeRefund: "Remboursés avec le premier payout",
    feeRefundLikely: true,
    consistencyRule: "Aucune sur le 2-Step. Le 1-Step plafonne un jour à 50 % du profit",
    consistencyPct: 50,               // ne s'applique qu'au 1-step
    consistencyAppliesTo: ["1step"],
    eaApprovalRequired: false,
    payoutOptions: "Cycle 14 jours",
    splitAddon: null,
    verified: "2026-10-17",
  },
  e8: {
    timeLimitDays: null,
    timeLimitUnlimited: true,
    feeRefund: null,                  // non verifie
    feeRefundLikely: null,
    consistencyRule: "Best Day Rule 40 % sur le compte funded",
    consistencyPct: 40,
    eaApprovalRequired: false,
    payoutOptions: null,
    splitAddon: null,
    verified: "2026-10-17",
  },
  alpha: {
    timeLimitDays: null,
    timeLimitUnlimited: true,
    feeRefund: "Bonus discrétionnaire de 0,25 % de la taille du compte à la 4e demande",
    feeRefundLikely: false,           // bonus, pas un remboursement des frais
    consistencyRule: "Best Day Rule 40 % sur les payouts à la demande",
    consistencyPct: 40,
    eaApprovalRequired: true,         // code source a faire valider, MetaTrader uniquement
    payoutOptions: "À la demande (min. 2 % de profit) ou bi-mensuel (min. 100 $)",
    splitAddon: null,
    verified: "2026-10-17",
  },
  the5ers: {
    timeLimitDays: null,
    timeLimitUnlimited: true,
    feeRefund: null,
    feeRefundLikely: null,
    consistencyRule: null,
    consistencyPct: null,
    eaApprovalRequired: false,
    payoutOptions: null,
    splitAddon: null,
    verified: "2026-10-17",
  },
  fundingtraders: {
    timeLimitDays: null,
    timeLimitUnlimited: true,
    feeRefund: null,
    feeRefundLikely: null,
    consistencyRule: null,
    consistencyPct: null,
    eaApprovalRequired: false,
    payoutOptions: null,
    splitAddon: null,
    verified: "2026-10-17",
  },
  fundingpips: {
    timeLimitDays: null,
    timeLimitUnlimited: true,
    feeRefund: "Remboursés après le 4e payout (1-Step et 2-Step Standard uniquement)",
    feeRefundLikely: true,
    consistencyRule: "35 % uniquement sur les payouts à la demande",
    consistencyPct: 35,
    eaApprovalRequired: false,
    payoutOptions: "Hebdomadaire 60 %, bi-mensuel 80 %, à la demande 90 %, mensuel 100 %",
    splitAddon: "Le split dépend du rythme de retrait choisi",
    verified: "2026-10-17",
  },
};

// Priorites par defaut : poids de 0 (ignorer) a 3 (determinant).
export const DEFAULT_PREFS = {
  capital: 25000,
  usesEA: true,
  tradesNews: false,
  holdsWeekend: false,
  modelPreference: "any",      // "any" | "1step" | "2step"
  vpsMonthly: 25,
  eaFeeOverride: null,         // null = valeur par defaut de la firm
  weights: {
    drawdown: 3,   // marge de securite sous la limite
    objective: 3,  // difficulte de l'objectif au vu de ses resultats reels
    cost: 2,       // cout total pour obtenir un compte funded
    speed: 2,      // delai avant le premier euro encaisse
    split: 2,      // part du profit conservee
    rules: 2,      // souplesse des regles (EA, news, weekend, consistance)
  },
};

export const CRITERIA = [
  { key: "drawdown",  label: "Marge de drawdown" },
  { key: "objective", label: "Difficulté de l'objectif" },
  { key: "cost",      label: "Coût total" },
  { key: "speed",     label: "Délai avant le 1er euro" },
  { key: "split",     label: "Part du profit" },
  { key: "rules",     label: "Souplesse des règles" },
];

/** Frais du challenge au palier de capital le plus proche. */
export function feeForCapital(fees, capital) {
  const tiers = Object.keys(fees || {}).map(Number).filter(n => isFinite(n)).sort((a, b) => a - b);
  if (!tiers.length) return { fee: null, tier: null, exact: false };
  let closest = tiers[0];
  for (const t of tiers) if (Math.abs(t - capital) < Math.abs(closest - capital)) closest = t;
  return { fee: fees[closest], tier: closest, exact: closest === capital };
}

/**
 * Evalue UN modele d'UNE firm.
 *
 * @param {object} ctx
 *   firmKey, firm (entree PROP_FIRMS), modelKey, model,
 *   facts (FIRM_FACTS[firmKey]), fees (FIRM_FEES[firmKey]),
 *   rules (FIRM_RULES[firmKey]), addons (FIRM_ADDONS[firmKey])
 * @param {object} prefs    DEFAULT_PREFS fusionne avec les choix de l'utilisateur
 * @param {object} truth    { monthlyReturnPct, maxDDPct, source, months } — mesure
 *                          reelle issue du journal ou du simulateur. null si aucune.
 */
export function evaluateModel(ctx, prefs, truth) {
  const { firmKey, firm, modelKey, model, facts = {}, fees = {}, rules = {}, addons = {} } = ctx;
  const P = { ...DEFAULT_PREFS, ...prefs, weights: { ...DEFAULT_PREFS.weights, ...(prefs && prefs.weights) } };

  const blockers = [];
  const warnings = [];
  const details = [];

  // ── Donnees de base ──────────────────────────────────────────────────
  const ddLimitPct = num(model.totalDD) * 100;
  const dailyDDPct = num(model.dailyDD) * 100;
  const phases = Array.isArray(model.phases) ? model.phases : [];
  const totalTargetPct = phases.reduce((s, p) => s + num(p.target) * 100, 0);
  const minDaysTotal = phases.reduce((s, p) => s + num(p.minDays), 0);
  const splitStart = num(model.splitStart, 80);
  const splitMax = num(model.splitMax, splitStart);
  const firstPayoutDays = num(model.firstPayoutDays, 14);
  const payoutCycle = num(model.payoutCycle, 14);
  const challengeReward = num(model.challengeReward);

  const { fee, tier, exact } = feeForCapital(fees, P.capital);
  if (fee == null) warnings.push("Tarif inconnu pour cette firm.");
  else if (!exact) warnings.push(`Pas de compte à ${Math.round(P.capital / 1000)}k — tarif du palier ${Math.round(tier / 1000)}k.`);

  // ── BLOQUANTS : des faits qui disqualifient, pas des points en moins ──
  const eaAllowed = model.eaForbidden ? false : (rules.ea !== false);
  if (P.usesEA && !eaAllowed) blockers.push("EA interdit sur ce modèle");
  const newsForbidden = !!model.newsForbidden;
  if (P.tradesNews && newsForbidden) blockers.push("Trading des news interdit");
  const weekendForbidden = typeof rules.weekend === "string" && /interdit/i.test(rules.weekend);
  if (P.holdsWeekend && weekendForbidden) blockers.push("Positions weekend interdites");
  if (P.modelPreference !== "any" && modelKey !== P.modelPreference) {
    // Pas un bloquant : on le signale et on laisse le modele concourir.
    warnings.push("Ce n'est pas le type de challenge que tu préfères.");
  }

  // ── 1. MARGE DE DRAWDOWN ──────────────────────────────────────────────
  // Rapport entre la limite de la firm et le pire drawdown reellement
  // observe. 1 point de marge pour 2 fois la limite ou plus.
  const myDD = truth && num(truth.maxDDPct) > 0 ? num(truth.maxDDPct) : null;
  let sDrawdown, ddReason;
  if (myDD == null) {
    // Sans mesure, on ne peut que comparer les limites entre elles :
    // 6 % -> 0, 12 % -> 1. Honnete et toujours discriminant.
    sDrawdown = clamp01((ddLimitPct - 6) / 6);
    ddReason = `Limite ${ddLimitPct.toFixed(0)} % — aucun drawdown mesuré pour comparer`;
  } else {
    const ratio = ddLimitPct / myDD;
    sDrawdown = clamp01((ratio - 1) / 3);     // ratio 1 -> 0, ratio 4 -> 1
    ddReason = `Ton pire DD ${myDD.toFixed(1)} % contre une limite de ${ddLimitPct.toFixed(0)} %`;
    if (ratio < 1) blockers.push(`Ton drawdown (${myDD.toFixed(1)} %) dépasse la limite (${ddLimitPct.toFixed(0)} %)`);
    else if (ratio < 1.5) warnings.push("Marge de drawdown très serrée.");
  }
  // Le drawdown trailing suit le pic : a limite egale, il est plus severe.
  if (model.ddType === "trailing") {
    sDrawdown *= 0.75;
    ddReason += " · drawdown trailing (plus sévère)";
  }
  details.push({ key: "drawdown", score: sDrawdown, reason: ddReason });

  // ── 2. DIFFICULTE DE L'OBJECTIF ───────────────────────────────────────
  // Combien de mois pour atteindre l'objectif total au rythme reellement
  // observe. Le plancher de jours minimum impose sa propre duree.
  const myMonthly = truth && num(truth.monthlyReturnPct) > 0 ? num(truth.monthlyReturnPct) : null;
  let monthsToPass = null, sObjective, objReason;
  if (myMonthly == null) {
    sObjective = clamp01((16 - totalTargetPct) / 10);  // 16 % -> 0, 6 % -> 1
    objReason = `Objectif cumulé ${totalTargetPct.toFixed(0)} % — aucun rendement mesuré pour comparer`;
  } else {
    const byTarget = totalTargetPct / myMonthly;
    const byMinDays = minDaysTotal / 21;               // 21 jours de trading par mois
    monthsToPass = Math.max(byTarget, byMinDays);
    sObjective = clamp01((6 - monthsToPass) / 5);      // 1 mois -> 1, 6 mois -> 0
    objReason = `${totalTargetPct.toFixed(0)} % à faire à ton rythme de ${myMonthly.toFixed(2)} %/mois`;
    if (monthsToPass > 12) warnings.push("À ton rythme actuel, l'objectif dépasse un an.");
  }
  details.push({ key: "objective", score: sObjective, reason: objReason });

  // ── 3. COUT TOTAL ─────────────────────────────────────────────────────
  // Frais du challenge + activation EA + VPS sur toute la duree estimee,
  // moins ce qui revient : recompense de challenge et remboursement des frais.
  const eaFee = P.eaFeeOverride != null ? num(P.eaFeeOverride) : num(addons.eaFee);
  const months = monthsToPass != null ? Math.max(1, Math.ceil(monthsToPass)) : 2;
  const vpsTotal = P.usesEA ? num(P.vpsMonthly) * months : 0;
  const addonsTotal = (P.usesEA ? eaFee : 0) + vpsTotal;
  // Arrondis faits AVANT la soustraction, pas apres : sinon les montants
  // affiches a l'ecran ne s'additionnent pas (299 - 488 - 199 donnait -387
  // au lieu de -388, parce que la recompense etait arrondie a l'affichage
  // mais pas dans le calcul). Un comparateur dont les chiffres ne tombent
  // pas juste perd toute credibilite.
  const grossCost = Math.round((fee != null ? fee : 0) + addonsTotal);
  const rewardBack = Math.round(challengeReward > 0 ? P.capital * (totalTargetPct / 100) * challengeReward : 0);
  const refundBack = Math.round(facts.feeRefundLikely === true && fee != null ? fee : 0);
  const netCost = grossCost - rewardBack - refundBack;
  // Normalise sur le capital : 3 % du capital -> 0, gratuit ou mieux -> 1.
  // Tarif inconnu : note NEUTRE (0,5), surtout pas la note d'un challenge
  // gratuit. Sans ce garde-fou, une firm dont le prix manque en base
  // remontait en tete du classement "moins cher" — exactement l'inverse de
  // ce qu'un comparateur doit faire d'une information manquante.
  let sCost, costReason;
  if (fee == null) {
    sCost = 0.5;
    costReason = "Tarif non renseigné pour cette firm — note neutre, à vérifier";
  } else {
    const costRatio = P.capital > 0 ? netCost / P.capital : 1;
    sCost = clamp01((0.03 - costRatio) / 0.03);
    costReason = `${grossCost} € engagés` +
      (rewardBack > 0 ? `, ${rewardBack} € de reward` : "") +
      (refundBack > 0 ? `, ${refundBack} € remboursés` : "") +
      ` → ${netCost} € net`;
  }
  details.push({ key: "cost", score: sCost, reason: costReason });

  // ── 4. DELAI AVANT LE PREMIER EURO ────────────────────────────────────
  // Passer le challenge, puis attendre le premier payout. C'est ce delai
  // complet qui compte, pas la seule promesse de "payout en 14 jours".
  const daysToPass = monthsToPass != null ? monthsToPass * 30 : minDaysTotal * (30 / 21);
  const daysToFirstEuro = daysToPass + firstPayoutDays;
  const sSpeed = clamp01((210 - daysToFirstEuro) / 180);  // 30 j -> 1, 210 j -> 0
  details.push({
    key: "speed", score: sSpeed,
    reason: `≈ ${Math.round(daysToPass)} j de challenge + ${firstPayoutDays} j avant le 1er payout, puis tous les ${payoutCycle} j`,
  });

  // ── 5. PART DU PROFIT ─────────────────────────────────────────────────
  // Le split de depart pese plus que le maximum theorique : le maximum
  // suppose d'avoir tenu assez longtemps pour y arriver.
  const splitBlend = splitStart * 0.7 + splitMax * 0.3;
  const sSplit = clamp01((splitBlend - 70) / 25);         // 70 % -> 0, 95 % -> 1
  details.push({
    key: "split", score: sSplit,
    reason: `${splitStart} % au départ, jusqu'à ${splitMax} %` + (facts.splitAddon ? ` · ${facts.splitAddon}` : ""),
  });

  // ── 6. SOUPLESSE DES REGLES ───────────────────────────────────────────
  // Chaque contrainte reelle retire une part. Une regle de consistance est
  // la contrainte la plus sous-estimee : elle peut bloquer un payout deja
  // gagne, simplement parce qu'une journee a trop bien marche.
  let sRules = 1;
  const ruleNotes = [];
  if (!eaAllowed) { sRules -= 0.45; ruleNotes.push("EA interdit"); }
  else if (facts.eaApprovalRequired) { sRules -= 0.12; ruleNotes.push("EA à faire valider avant usage"); }
  const consApplies = !facts.consistencyAppliesTo || facts.consistencyAppliesTo.includes(modelKey);
  if (facts.consistencyPct && consApplies) {
    sRules -= facts.consistencyPct <= 40 ? 0.22 : 0.12;
    ruleNotes.push(`Règle de consistance ${facts.consistencyPct} %`);
  }
  if (newsForbidden) { sRules -= 0.15; ruleNotes.push("News interdites"); }
  if (weekendForbidden) { sRules -= 0.1; ruleNotes.push("Weekend interdit"); }
  if (facts.timeLimitUnlimited === false && facts.timeLimitDays) {
    sRules -= 0.2; ruleNotes.push(`Challenge limité à ${facts.timeLimitDays} j`);
  }
  if (minDaysTotal >= 8) { sRules -= 0.08; ruleNotes.push(`${minDaysTotal} jours minimum imposés`); }
  sRules = clamp01(sRules);
  details.push({
    key: "rules", score: sRules,
    reason: ruleNotes.length ? ruleNotes.join(" · ") : "Aucune contrainte particulière relevée",
  });

  // ── SCORE PONDERE ─────────────────────────────────────────────────────
  let weighted = 0, totalWeight = 0;
  const breakdown = details.map(d => {
    const w = num(P.weights[d.key], 0);
    weighted += d.score * w;
    totalWeight += w;
    const crit = CRITERIA.find(c => c.key === d.key);
    return { ...d, label: crit ? crit.label : d.key, weight: w, pct: Math.round(d.score * 100) };
  });
  let score = totalWeight > 0 ? Math.round((weighted / totalWeight) * 100) : 0;
  // Un bloquant n'est pas une penalite : c'est une incompatibilite. On la
  // rend visible en plafonnant le score, sans masquer le reste de l'analyse.
  if (blockers.length) score = Math.min(score, 25);

  return {
    firmKey, firmName: firm.name, color: firm.color,
    modelKey, modelName: model.name, model,
    score,
    tier: blockers.length ? "incompatible" : score >= 75 ? "excellent" : score >= 58 ? "bon" : score >= 40 ? "moyen" : "faible",
    breakdown, blockers, warnings,
    facts,
    economics: {
      fee, feeTier: tier, feeExact: exact,
      eaFee: P.usesEA ? eaFee : 0, vpsTotal, addonsTotal,
      grossCost, rewardBack, refundBack, netCost,
      monthsToPass, daysToFirstEuro: Math.round(daysToFirstEuro),
      totalTargetPct, ddLimitPct, dailyDDPct, minDaysTotal,
      splitStart, splitMax, firstPayoutDays, payoutCycle,
      ddType: model.ddType || "static",
    },
  };
}

/**
 * Compare TOUS les modeles de TOUTES les firms et les classe.
 *
 * @param {object} tables { PROP_FIRMS, FIRM_FEES, FIRM_RULES, FIRM_ADDONS }
 */
export function compareAllModels(tables, prefs, truth) {
  const { PROP_FIRMS = {}, FIRM_FEES = {}, FIRM_RULES = {}, FIRM_ADDONS = {} } = tables || {};
  const out = [];
  Object.keys(PROP_FIRMS).forEach(firmKey => {
    const firm = PROP_FIRMS[firmKey];
    if (!firm || !firm.models) return;
    Object.keys(firm.models).forEach(modelKey => {
      out.push(evaluateModel({
        firmKey, firm, modelKey, model: firm.models[modelKey],
        facts: FIRM_FACTS[firmKey] || {},
        fees: FIRM_FEES[firmKey] || {},
        rules: FIRM_RULES[firmKey] || {},
        addons: FIRM_ADDONS[firmKey] || {},
      }, prefs, truth));
    });
  });
  // Classement : score decroissant, puis cout net croissant a score egal —
  // sans ce second critere, deux modeles ex aequo se classeraient au hasard.
  out.sort((a, b) => (b.score - a.score) || (a.economics.netCost - b.economics.netCost));
  return out;
}

/** Meilleur modele par firm, pour une vue condensee. */
export function bestPerFirm(list) {
  const seen = new Map();
  (list || []).forEach(r => { if (!seen.has(r.firmKey)) seen.set(r.firmKey, r); });
  return Array.from(seen.values());
}
