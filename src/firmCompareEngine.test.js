// ══════════════════════════════════════════════════════════════════════════
// Tests du moteur de comparaison des prop firms — Node natif.
// Execution : node src/firmCompareEngine.test.js
// ══════════════════════════════════════════════════════════════════════════
import assert from "node:assert/strict";
import {
  evaluateModel, compareAllModels, bestPerFirm, feeForCapital,
  DEFAULT_PREFS, FIRM_FACTS, CRITERIA,
} from "./firmCompareEngine.js";

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { failed++; console.log("  ✗ " + name); console.log("    " + e.message); }
}

// ── Jeu de donnees minimal, independant de l'app ────────────────────────
const PROP_FIRMS = {
  souple: {
    name: "Souple", color: "#6ee7b7",
    models: {
      "2step": {
        name: "Souple 2-Step",
        phases: [{ target: 0.08, minDays: 5 }, { target: 0.05, minDays: 5 }],
        dailyDD: 0.05, totalDD: 0.10, ddType: "static", challengeReward: 0.15,
        firstPayoutDays: 14, payoutCycle: 14, splitStart: 80, splitMax: 90,
      },
    },
  },
  severe: {
    name: "Severe", color: "#ef4444",
    models: {
      "2step": {
        name: "Severe 2-Step",
        phases: [{ target: 0.10, minDays: 10 }, { target: 0.06, minDays: 10 }],
        dailyDD: 0.03, totalDD: 0.06, ddType: "trailing", challengeReward: 0,
        firstPayoutDays: 30, payoutCycle: 30, splitStart: 70, splitMax: 75,
        newsForbidden: true,
      },
      "1step": {
        name: "Severe 1-Step",
        phases: [{ target: 0.10, minDays: 3 }],
        dailyDD: 0.04, totalDD: 0.08, ddType: "static", challengeReward: 0,
        firstPayoutDays: 14, payoutCycle: 14, splitStart: 80, splitMax: 90,
      },
    },
  },
  sansea: {
    name: "SansEA", color: "#fbbf24",
    models: {
      "2step": {
        name: "SansEA 2-Step",
        phases: [{ target: 0.08, minDays: 5 }, { target: 0.05, minDays: 5 }],
        dailyDD: 0.05, totalDD: 0.10, ddType: "static", challengeReward: 0,
        firstPayoutDays: 14, payoutCycle: 14, splitStart: 80, splitMax: 90,
        eaForbidden: true,
      },
    },
  },
};
const FIRM_FEES = {
  souple: { 25000: 199, 50000: 299 },
  severe: { 25000: 400, 50000: 700 },
  sansea: { 25000: 150 },
};
const FIRM_RULES = {
  souple: { ea: true, weekend: "Autorise" },
  severe: { ea: true, weekend: "Interdit sur le funded" },
  sansea: { ea: true, weekend: "Autorise" },
};
const FIRM_ADDONS = {
  souple: { eaFee: 0, vpsMonthly: 25 },
  severe: { eaFee: 100, vpsMonthly: 25 },
  sansea: { eaFee: 0, vpsMonthly: 25 },
};
const TABLES = { PROP_FIRMS, FIRM_FEES, FIRM_RULES, FIRM_ADDONS };

const ctxSouple = {
  firmKey: "souple", firm: PROP_FIRMS.souple, modelKey: "2step",
  model: PROP_FIRMS.souple.models["2step"],
  facts: { feeRefundLikely: true, timeLimitUnlimited: true },
  fees: FIRM_FEES.souple, rules: FIRM_RULES.souple, addons: FIRM_ADDONS.souple,
};
const TRUTH = { monthlyReturnPct: 4, maxDDPct: 3, source: "journal", months: 6 };

console.log("\n── Le comparateur separe reellement les firms ──");

test("deux firms differentes n'obtiennent pas le meme score", () => {
  const r = compareAllModels(TABLES, DEFAULT_PREFS, TRUTH);
  const scores = r.map(x => x.score);
  const uniques = new Set(scores);
  assert.ok(uniques.size > 1, "tous les scores sont identiques : " + scores.join(", "));
});

test("la firm souple passe devant la severe", () => {
  const r = compareAllModels(TABLES, DEFAULT_PREFS, TRUTH);
  const souple = r.find(x => x.firmKey === "souple");
  const severe = r.find(x => x.firmKey === "severe" && x.modelKey === "2step");
  assert.ok(souple.score > severe.score, `${souple.score} <= ${severe.score}`);
});

test("les deux modeles d'une meme firm sont notes separement", () => {
  const r = compareAllModels(TABLES, DEFAULT_PREFS, TRUTH);
  const deux = r.filter(x => x.firmKey === "severe");
  assert.equal(deux.length, 2);
  assert.notEqual(deux[0].score, deux[1].score);
});

console.log("\n── Les priorites de l'utilisateur changent le classement ──");

test("donner tout le poids au cout fait gagner le moins cher", () => {
  const prefs = { ...DEFAULT_PREFS, weights: { drawdown:0, objective:0, cost:3, speed:0, split:0, rules:0 } };
  const r = compareAllModels(TABLES, prefs, TRUTH).filter(x => !x.blockers.length);
  const moinsCher = r.reduce((a, b) => a.economics.netCost <= b.economics.netCost ? a : b);
  assert.equal(r[0].firmKey, moinsCher.firmKey, `1er = ${r[0].firmName}, moins cher = ${moinsCher.firmName}`);
});

test("donner tout le poids au split fait gagner le meilleur split", () => {
  const prefs = { ...DEFAULT_PREFS, usesEA: false, weights: { drawdown:0, objective:0, cost:0, speed:0, split:3, rules:0 } };
  const r = compareAllModels(TABLES, prefs, TRUTH);
  assert.ok(r[0].economics.splitStart >= 80, `1er a un split de ${r[0].economics.splitStart}`);
});

test("changer les priorites change effectivement l'ordre", () => {
  const pCout = { ...DEFAULT_PREFS, weights: { drawdown:0, objective:0, cost:3, speed:0, split:0, rules:0 } };
  const pVitesse = { ...DEFAULT_PREFS, weights: { drawdown:0, objective:0, cost:0, speed:3, split:0, rules:0 } };
  const a = compareAllModels(TABLES, pCout, TRUTH).map(x => x.firmKey + "/" + x.modelKey).join(",");
  const b = compareAllModels(TABLES, pVitesse, TRUTH).map(x => x.firmKey + "/" + x.modelKey).join(",");
  assert.notEqual(a, b, "le classement est identique malgre des priorites opposees");
});

test("un poids a zero retire totalement le critere", () => {
  const prefs = { ...DEFAULT_PREFS, weights: { drawdown:0, objective:0, cost:0, speed:0, split:3, rules:0 } };
  const r = evaluateModel(ctxSouple, prefs, TRUTH);
  const utilises = r.breakdown.filter(b => b.weight > 0).map(b => b.key);
  assert.deepEqual(utilises, ["split"]);
});

test("tous les poids a zero ne fait pas planter", () => {
  const prefs = { ...DEFAULT_PREFS, weights: { drawdown:0, objective:0, cost:0, speed:0, split:0, rules:0 } };
  const r = evaluateModel(ctxSouple, prefs, TRUTH);
  assert.equal(r.score, 0);
  assert.ok(isFinite(r.score));
});

console.log("\n── Bloquants : des incompatibilites, pas des points en moins ──");

test("EA interdit + trader qui utilise un EA = bloquant", () => {
  const r = compareAllModels(TABLES, { ...DEFAULT_PREFS, usesEA: true }, TRUTH);
  const sansEA = r.find(x => x.firmKey === "sansea");
  assert.ok(sansEA.blockers.length > 0, "aucun bloquant releve");
  assert.ok(sansEA.score <= 25, `score ${sansEA.score} trop haut pour un modele incompatible`);
  assert.equal(sansEA.tier, "incompatible");
});

test("le meme modele redevient eligible sans EA", () => {
  const r = compareAllModels(TABLES, { ...DEFAULT_PREFS, usesEA: false }, TRUTH);
  const sansEA = r.find(x => x.firmKey === "sansea");
  assert.equal(sansEA.blockers.length, 0);
  assert.ok(sansEA.score > 25);
});

test("news interdites bloquent un trader de news", () => {
  const r = compareAllModels(TABLES, { ...DEFAULT_PREFS, usesEA: false, tradesNews: true }, TRUTH);
  const sev = r.find(x => x.firmKey === "severe" && x.modelKey === "2step");
  assert.ok(sev.blockers.some(b => /news/i.test(b)), sev.blockers.join(" | "));
});

test("weekend interdit bloque un trader qui garde ses positions", () => {
  const r = compareAllModels(TABLES, { ...DEFAULT_PREFS, usesEA: false, holdsWeekend: true }, TRUTH);
  const sev = r.find(x => x.firmKey === "severe" && x.modelKey === "2step");
  assert.ok(sev.blockers.some(b => /weekend/i.test(b)), sev.blockers.join(" | "));
});

test("un drawdown reel superieur a la limite est bloquant", () => {
  const r = evaluateModel(ctxSouple, DEFAULT_PREFS, { monthlyReturnPct: 4, maxDDPct: 14 });
  assert.ok(r.blockers.some(b => /drawdown/i.test(b)), r.blockers.join(" | "));
});

console.log("\n── Economie du challenge ──");

test("cout net = frais + add-ons - reward - remboursement", () => {
  const r = evaluateModel(ctxSouple, { ...DEFAULT_PREFS, capital: 25000, usesEA: true, vpsMonthly: 25 }, TRUTH);
  const e = r.economics;
  // objectif 13 %, rythme 4 %/mois -> 3.25 mois -> 4 mois de VPS = 100
  assert.equal(e.fee, 199);
  assert.equal(e.vpsTotal, 100);
  assert.equal(e.grossCost, 299);
  // reward : 15 % de 13 % de 25 000 = 487.5
  assert.equal(e.rewardBack, 488);
  assert.equal(e.refundBack, 199);            // feeRefundLikely = true
  assert.equal(e.netCost, 299 - 488 - 199);
});

test("sans EA, aucun VPS ni frais d'activation compte", () => {
  const r = evaluateModel(ctxSouple, { ...DEFAULT_PREFS, usesEA: false }, TRUTH);
  assert.equal(r.economics.vpsTotal, 0);
  assert.equal(r.economics.eaFee, 0);
  assert.equal(r.economics.grossCost, 199);
});

test("un remboursement non verifie n'est jamais compte comme acquis", () => {
  const ctx = { ...ctxSouple, facts: { feeRefundLikely: null } };
  const r = evaluateModel(ctx, DEFAULT_PREFS, TRUTH);
  assert.equal(r.economics.refundBack, 0);
});

test("delai avant le 1er euro = challenge + attente du payout", () => {
  const r = evaluateModel(ctxSouple, DEFAULT_PREFS, TRUTH);
  // 13 % / 4 %mois = 3.25 mois = 97.5 j, + 14 j
  assert.ok(Math.abs(r.economics.daysToFirstEuro - 112) <= 1, String(r.economics.daysToFirstEuro));
});

test("les jours minimum imposent leur propre duree", () => {
  // Rendement enorme : l'objectif tomberait en quelques jours, mais 10 jours
  // minimum sont imposes — c'est ce plancher qui doit s'appliquer.
  const r = evaluateModel(ctxSouple, DEFAULT_PREFS, { monthlyReturnPct: 100, maxDDPct: 2 });
  assert.ok(r.economics.monthsToPass >= 10 / 21 - 1e-9, String(r.economics.monthsToPass));
});

test("palier de capital inexistant : prix du palier voisin + avertissement", () => {
  const r = evaluateModel(ctxSouple, { ...DEFAULT_PREFS, capital: 30000 }, TRUTH);
  assert.equal(r.economics.feeTier, 25000);
  assert.equal(r.economics.feeExact, false);
  assert.ok(r.warnings.some(w => /palier/i.test(w)), r.warnings.join(" | "));
});

console.log("\n── Sans donnees reelles, le moteur reste utilisable ──");

test("aucune mesure : classement toujours possible et differencie", () => {
  const r = compareAllModels(TABLES, { ...DEFAULT_PREFS, usesEA: false }, null);
  assert.ok(r.length >= 4);
  assert.ok(new Set(r.map(x => x.score)).size > 1, "scores tous identiques sans mesure");
  r.forEach(x => assert.ok(isFinite(x.score), "score non fini"));
});

test("aucune mesure : la difficulte compare les objectifs entre eux", () => {
  const r = compareAllModels(TABLES, { ...DEFAULT_PREFS, usesEA: false }, null);
  const souple = r.find(x => x.firmKey === "souple");            // 13 %
  const severe = r.find(x => x.firmKey === "severe" && x.modelKey === "2step"); // 16 %
  const so = souple.breakdown.find(b => b.key === "objective").score;
  const se = severe.breakdown.find(b => b.key === "objective").score;
  assert.ok(so > se, `${so} <= ${se}`);
});

console.log("\n── Details et coherence ──");

test("chaque critere est note et porte une explication", () => {
  const r = evaluateModel(ctxSouple, DEFAULT_PREFS, TRUTH);
  assert.equal(r.breakdown.length, CRITERIA.length);
  r.breakdown.forEach(b => {
    assert.ok(b.score >= 0 && b.score <= 1, `${b.key} hors bornes : ${b.score}`);
    assert.ok(typeof b.reason === "string" && b.reason.length > 5, `${b.key} sans explication`);
  });
});

test("le drawdown trailing est penalise a limite egale", () => {
  const stat = { ...ctxSouple, model: { ...ctxSouple.model, ddType: "static" } };
  const trail = { ...ctxSouple, model: { ...ctxSouple.model, ddType: "trailing" } };
  const a = evaluateModel(stat, DEFAULT_PREFS, TRUTH).breakdown.find(b => b.key === "drawdown").score;
  const b = evaluateModel(trail, DEFAULT_PREFS, TRUTH).breakdown.find(b => b.key === "drawdown").score;
  assert.ok(b < a, `trailing ${b} >= static ${a}`);
});

test("une regle de consistance degrade la souplesse", () => {
  const sans = { ...ctxSouple, facts: {} };
  const avec = { ...ctxSouple, facts: { consistencyPct: 40 } };
  const a = evaluateModel(sans, DEFAULT_PREFS, TRUTH).breakdown.find(b => b.key === "rules").score;
  const b = evaluateModel(avec, DEFAULT_PREFS, TRUTH).breakdown.find(b => b.key === "rules").score;
  assert.ok(b < a, `${b} >= ${a}`);
});

test("une regle de consistance qui ne vise pas ce modele ne penalise pas", () => {
  const ctx = { ...ctxSouple, facts: { consistencyPct: 50, consistencyAppliesTo: ["1step"] } };
  const sans = { ...ctxSouple, facts: {} };
  const a = evaluateModel(sans, DEFAULT_PREFS, TRUTH).breakdown.find(b => b.key === "rules").score;
  const b = evaluateModel(ctx, DEFAULT_PREFS, TRUTH).breakdown.find(b => b.key === "rules").score;
  assert.equal(a, b);
});

test("bestPerFirm garde le meilleur modele de chaque firm, une seule fois", () => {
  const r = compareAllModels(TABLES, { ...DEFAULT_PREFS, usesEA: false }, TRUTH);
  const best = bestPerFirm(r);
  assert.equal(best.length, 3);
  assert.equal(new Set(best.map(x => x.firmKey)).size, 3);
  const sev = best.find(x => x.firmKey === "severe");
  const tous = r.filter(x => x.firmKey === "severe");
  assert.equal(sev.score, Math.max(...tous.map(x => x.score)));
});

test("a score egal, le moins cher passe devant", () => {
  const prefs = { ...DEFAULT_PREFS, usesEA: false, weights: { drawdown:0, objective:0, cost:0, speed:0, split:0, rules:0 } };
  const r = compareAllModels(TABLES, prefs, TRUTH);
  assert.ok(r.every(x => x.score === 0));
  for (let i = 1; i < r.length; i++) {
    assert.ok(r[i - 1].economics.netCost <= r[i].economics.netCost, "ordre de cout non respecte");
  }
});

console.log("\n── Table de faits ──");

test("feeForCapital prend le palier le plus proche", () => {
  assert.deepEqual(feeForCapital({ 10000: 100, 25000: 200 }, 25000), { fee: 200, tier: 25000, exact: true });
  assert.equal(feeForCapital({ 10000: 100, 25000: 200 }, 20000).tier, 25000);
  assert.equal(feeForCapital({ 10000: 100, 25000: 200 }, 12000).tier, 10000);
  assert.equal(feeForCapital({}, 25000).fee, null);
});

test("chaque firm de la table de faits porte une date de releve", () => {
  Object.entries(FIRM_FACTS).forEach(([k, f]) => {
    assert.ok(f.verified, `${k} sans date de verification`);
  });
});

test("un fait non verifie vaut null, jamais une valeur inventee", () => {
  // e8 : remboursement non verifie -> doit etre null, pas false ni 0
  assert.equal(FIRM_FACTS.e8.feeRefund, null);
  assert.equal(FIRM_FACTS.e8.feeRefundLikely, null);
});

console.log("\n── Robustesse ──");

test("entrees vides : aucune exception", () => {
  assert.deepEqual(compareAllModels(null, null, null), []);
  assert.deepEqual(compareAllModels({}, DEFAULT_PREFS, null), []);
  assert.deepEqual(bestPerFirm(null), []);
});

test("modele sans phases ni frais : score fini, pas de NaN", () => {
  const r = evaluateModel({
    firmKey: "x", firm: { name: "X" }, modelKey: "m", model: { phases: [] },
    facts: {}, fees: {}, rules: {}, addons: {},
  }, DEFAULT_PREFS, null);
  assert.ok(isFinite(r.score));
  r.breakdown.forEach(b => assert.ok(isFinite(b.score), b.key + " = NaN"));
});

console.log(`\n${passed} test(s) OK, ${failed} echec(s)\n`);
process.exit(failed > 0 ? 1 : 0);
