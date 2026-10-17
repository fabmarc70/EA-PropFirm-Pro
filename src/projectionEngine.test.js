// ══════════════════════════════════════════════════════════════════════════
// Tests unitaires du moteur de projection financiere — Node natif.
// Execution : node src/projectionEngine.test.js
// ══════════════════════════════════════════════════════════════════════════
import assert from "node:assert/strict";
import {
  runPropFirmProjection, aggregateProjectionByYear,
  truthFromSimulator, truthFromJournal, buildScenarios,
} from "./projectionEngine.js";

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { failed++; console.log("  ✗ " + name); console.log("    " + e.message); }
}
const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `attendu ~${b}, obtenu ${a}`);

// Plan de base : 1 compte $25k, 4%/mois brut, split 80%, pas de reinvestissement,
// pas de cout, pas d'impot, pas d'attrition. Le cas le plus simple a verifier.
const BASE = {
  accountCapital: 25000, monthlyReturnPct: 4, profitSplitPct: 80,
  challengeFee: 300, passRatePct: 100, challengeMonths: 2, blowUpRatePct: 0,
  startAccounts: 1, startPendingFee: 0, reinvestPct: 0, maxAccounts: 0,
  monthlyCostPerAccount: 0, monthlyCostFixed: 0, taxRatePct: 0,
  horizonMonths: 12, targetMonthlyIncome: 0, targetCapital: 0,
};

console.log("\n── Revenu de base ──");

test("1 compte, 4%/mois, split 80% → $800/mois net", () => {
  const r = runPropFirmProjection(BASE);
  near(r.months[0].netIncome, 25000 * 0.04 * 0.8); // 800
  near(r.months[11].netIncome, 800);
});

test("sans reinvestissement, le nombre de comptes ne bouge pas", () => {
  const r = runPropFirmProjection(BASE);
  assert.equal(r.summary.finalAccounts, 1);
  assert.equal(r.summary.cumulReinvested, 0);
});

test("cumul sur 12 mois = 12 x le mensuel", () => {
  const r = runPropFirmProjection(BASE);
  near(r.summary.cumulTakeHome, 800 * 12); // 9600
});

test("rendement 0% → aucun revenu, aucun impot", () => {
  const r = runPropFirmProjection({ ...BASE, monthlyReturnPct: 0 });
  assert.equal(r.summary.cumulTakeHome, 0);
  assert.equal(r.summary.cumulTax, 0);
});

test("3 comptes = exactement 3x le revenu d'un compte", () => {
  const un = runPropFirmProjection(BASE);
  const trois = runPropFirmProjection({ ...BASE, startAccounts: 3 });
  near(trois.summary.cumulTakeHome, un.summary.cumulTakeHome * 3, 0.05);
});

console.log("\n── Couts, split et fiscalite ──");

test("le split s'applique bien au brut", () => {
  const r90 = runPropFirmProjection({ ...BASE, profitSplitPct: 90 });
  near(r90.months[0].netIncome, 25000 * 0.04 * 0.9); // 900
});

test("couts recurrents par compte et fixes", () => {
  const r = runPropFirmProjection({ ...BASE, startAccounts: 2, monthlyCostPerAccount: 30, monthlyCostFixed: 25 });
  // brut = 2 x 25000 x 4% x 80% = 1600 ; couts = 2x30 + 25 = 85
  near(r.months[0].grossPayout, 1600);
  near(r.months[0].runningCosts, 85);
  near(r.months[0].netIncome, 1515);
});

test("impot preleve sur le resultat APRES couts", () => {
  const r = runPropFirmProjection({ ...BASE, monthlyCostFixed: 100, taxRatePct: 22 });
  // brut 800 - couts 100 = 700 ; impot 22% = 154 ; net 546
  near(r.months[0].tax, 154);
  near(r.months[0].netIncome, 546);
});

test("aucun impot sur un mois deficitaire", () => {
  const r = runPropFirmProjection({ ...BASE, monthlyReturnPct: 0, monthlyCostFixed: 100, taxRatePct: 30 });
  assert.equal(r.months[0].tax, 0);
  near(r.months[0].netIncome, -100);
});

console.log("\n── Reinvestissement et croissance ──");

test("50% reinvesti : des challenges sont achetes", () => {
  const r = runPropFirmProjection({ ...BASE, reinvestPct: 50, horizonMonths: 24 });
  assert.ok(r.summary.cumulReinvested > 0, "aucun challenge achete");
  assert.ok(r.summary.finalAccounts > 1, "le nombre de comptes n'a pas augmente");
});

test("les achats sont ENTIERS (on n'achete pas 2,4 challenges)", () => {
  const r = runPropFirmProjection({ ...BASE, reinvestPct: 60, horizonMonths: 24 });
  r.months.forEach(m => assert.equal(m.challengesBought, Math.round(m.challengesBought)));
});

test("le challenge met challengeMonths mois a devenir funded", () => {
  // 1 compte, 100% reinvesti, fee 300 : le 1er mois rapporte 800 -> 2 challenges.
  // Avec challengeMonths = 3, les comptes n'arrivent qu'au mois 4.
  const r = runPropFirmProjection({ ...BASE, reinvestPct: 100, challengeMonths: 3, horizonMonths: 6 });
  assert.equal(r.months[0].accounts, 1);
  assert.equal(r.months[1].accounts, 1);
  assert.equal(r.months[2].accounts, 1);
  assert.ok(r.months[3].accounts > 1, "les comptes auraient du arriver au mois 4");
});

test("taux de reussite 50% : 2 challenges donnent 1 compte en esperance", () => {
  const r = runPropFirmProjection({
    ...BASE, startAccounts: 1, reinvestPct: 100, passRatePct: 50,
    challengeMonths: 1, challengeFee: 400, horizonMonths: 3,
  });
  // Mois 1 : 800 reinvesti -> 2 challenges. Mois 2 : +2 x 0.5 = +1 compte.
  assert.equal(r.months[0].challengesBought, 2);
  near(r.months[1].accounts, 2, 0.001);
});

test("plafond de comptes respecte, achats stoppes", () => {
  const r = runPropFirmProjection({ ...BASE, reinvestPct: 100, maxAccounts: 3, horizonMonths: 36 });
  r.months.forEach(m => assert.ok(m.accounts <= 3.0001, `${m.accounts} comptes au mois ${m.month}`));
  const dernier = r.months[r.months.length - 1];
  assert.equal(dernier.challengesBought, 0, "achete encore alors que le plafond est atteint");
});

test("plafond atteint → le revenu se stabilise", () => {
  const r = runPropFirmProjection({ ...BASE, reinvestPct: 100, maxAccounts: 2, horizonMonths: 36 });
  near(r.months[34].netIncome, r.months[35].netIncome, 1);
});

test("reinvestir 100% ne laisse rien a prendre", () => {
  const r = runPropFirmProjection({ ...BASE, reinvestPct: 100, horizonMonths: 12 });
  assert.equal(r.summary.cumulTakeHome, 0);
});

console.log("\n── Attrition ──");

test("risque de perte de compte : le capital sous gestion diminue", () => {
  const r = runPropFirmProjection({ ...BASE, blowUpRatePct: 10, horizonMonths: 12 });
  assert.ok(r.summary.finalAccounts < 1, "attrition non appliquee");
  // finalAccounts est arrondi a 2 decimales a la sortie du moteur.
  near(r.summary.finalAccounts, Math.pow(0.9, 12), 0.005);
});

test("attrition 0% → aucun effet", () => {
  const a = runPropFirmProjection({ ...BASE, blowUpRatePct: 0 });
  assert.equal(a.summary.finalAccounts, 1);
});

console.log("\n── Objectifs ──");

test("objectif de revenu jamais atteint → null, pas une fausse date", () => {
  const r = runPropFirmProjection({ ...BASE, targetMonthlyIncome: 100000 });
  assert.equal(r.summary.targetIncomeMonth, null);
});

test("objectif deja atteint au mois 1", () => {
  const r = runPropFirmProjection({ ...BASE, targetMonthlyIncome: 500 });
  assert.equal(r.summary.targetIncomeMonth, 1);
});

test("objectif atteint en cours de route grace au reinvestissement", () => {
  const r = runPropFirmProjection({ ...BASE, reinvestPct: 70, targetMonthlyIncome: 2000, horizonMonths: 60 });
  assert.ok(r.summary.targetIncomeMonth > 1, "atteint trop tot");
  assert.ok(r.summary.targetIncomeMonth !== null, "jamais atteint");
  // Le mois annonce doit vraiment franchir le seuil.
  const m = r.months[r.summary.targetIncomeMonth - 1];
  assert.ok(m.netIncome >= 2000, `mois ${m.month} : ${m.netIncome} < 2000`);
  // Et le mois precedent ne doit PAS l'avoir franchi.
  if (r.summary.targetIncomeMonth > 1) {
    assert.ok(r.months[r.summary.targetIncomeMonth - 2].netIncome < 2000, "franchi plus tot que annonce");
  }
});

test("objectif de patrimoine cumule", () => {
  const r = runPropFirmProjection({ ...BASE, targetCapital: 4000, horizonMonths: 24 });
  // 800/mois -> 4000 atteint au mois 5
  assert.equal(r.summary.targetCapitalMonth, 5);
});

console.log("\n── Agregation annuelle ──");

test("les totaux annuels egalent la somme des mois", () => {
  const r = runPropFirmProjection({ ...BASE, reinvestPct: 40, horizonMonths: 36 });
  const years = aggregateProjectionByYear(r.months);
  assert.equal(years.length, 3);
  const sumNet = years.reduce((s, y) => s + y.netIncome, 0);
  const sumMonths = r.months.reduce((s, m) => s + m.netIncome, 0);
  near(sumNet, sumMonths, 0.5);
});

test("l'annee se termine sur le nombre de comptes du 12e mois", () => {
  const r = runPropFirmProjection({ ...BASE, reinvestPct: 50, horizonMonths: 24 });
  const years = aggregateProjectionByYear(r.months);
  assert.equal(years[0].endAccounts, r.months[11].accounts);
  assert.equal(years[1].endAccounts, r.months[23].accounts);
});

console.log("\n── Source de verite : simulateur ──");

test("rendement mensuel pondere, jamais une moyenne de pourcentages", () => {
  const lastSim = {
    capital: 25000,
    funded: {
      cumulPayout: 2000,
      data: [
        { monthStart: 25000, profitPct: 4 },   // +1000
        { monthStart: 50000, profitPct: 2 },   // +1000
      ],
    },
  };
  const t = truthFromSimulator(lastSim);
  // Moyenne NAIVE des % = 3%. Vraie valeur = 2000 / 75000 = 2.667%.
  near(t.monthlyReturnPct, 2.667, 0.01);
  assert.ok(t.available);
});

test("pas de phase funded → indisponible, pas un zero silencieux", () => {
  const t = truthFromSimulator({ capital: 25000, funded: null });
  assert.equal(t.available, false);
  assert.ok(t.reason);
});

test("aucune simulation → null", () => {
  assert.equal(truthFromSimulator(null), null);
});

console.log("\n── Source de verite : journal ──");

test("rendement moyen mensuel reel du journal", () => {
  const journal = {
    "2026-01": { "3": { pnl: 200 }, "4": { pnl: -50 } },  // +150
    "2026-02": { "2": { pnl: 350 } },                      // +350
  };
  const t = truthFromJournal(journal, 25000);
  // moyenne (150 + 350) / 2 = 250 -> 250/25000 = 1%
  near(t.monthlyReturnPct, 1, 0.001);
  assert.equal(t.months, 2);
  assert.equal(t.winMonthsPct, 100);
  near(t.totalPnl, 500);
});

test("mois perdant compte dans le taux de mois gagnants", () => {
  const journal = { "2026-01": { "3": { pnl: -200 } }, "2026-02": { "2": { pnl: 400 } } };
  const t = truthFromJournal(journal, 10000);
  assert.equal(t.winMonthsPct, 50);
  near(t.monthlyReturnPct, 1, 0.001); // (−200+400)/2 = 100 -> 1%
});

test("journal vide → indisponible", () => {
  assert.equal(truthFromJournal({}, 25000).available, false);
  assert.equal(truthFromJournal({ "2026-01": {} }, 0).available, false);
});

console.log("\n── Scenarios ──");

test("trois scenarios, ordonnes du plus prudent au plus ambitieux", () => {
  const sc = buildScenarios({ ...BASE, reinvestPct: 50, horizonMonths: 36, passRatePct: 70, blowUpRatePct: 5 });
  assert.equal(sc.length, 3);
  const [prudent, realiste, ambitieux] = sc.map(s => s.projection.summary.cumulTakeHome);
  assert.ok(prudent < realiste, `prudent ${prudent} >= realiste ${realiste}`);
  assert.ok(realiste < ambitieux, `realiste ${realiste} >= ambitieux ${ambitieux}`);
});

test("le scenario realiste reproduit exactement le plan de base", () => {
  const plan = { ...BASE, reinvestPct: 50, horizonMonths: 24 };
  const sc = buildScenarios(plan);
  const direct = runPropFirmProjection(plan);
  const realiste = sc.find(s => s.key === "realiste");
  assert.equal(realiste.projection.summary.cumulTakeHome, direct.summary.cumulTakeHome);
});

test("le taux de reussite d'un scenario reste dans [0, 100]", () => {
  const sc = buildScenarios({ ...BASE, passRatePct: 95 });
  sc.forEach(s => {
    assert.ok(s.plan.passRatePct >= 0 && s.plan.passRatePct <= 100, `${s.key}: ${s.plan.passRatePct}`);
  });
});

console.log("\n── Robustesse des entrees ──");

test("valeurs absurdes ou manquantes ne cassent rien", () => {
  const r = runPropFirmProjection({});
  assert.ok(Array.isArray(r.months));
  assert.ok(r.months.length > 0);
  r.months.forEach(m => assert.ok(isFinite(m.netIncome), "NaN dans la projection"));
});

test("horizon borne (pas de boucle de 10 000 mois)", () => {
  assert.equal(runPropFirmProjection({ ...BASE, horizonMonths: 99999 }).months.length, 600);
  assert.equal(runPropFirmProjection({ ...BASE, horizonMonths: -5 }).months.length, 1);
});

test("fee a 0 n'achete pas une infinite de challenges", () => {
  const r = runPropFirmProjection({ ...BASE, challengeFee: 0, reinvestPct: 100, horizonMonths: 12 });
  r.months.forEach(m => assert.equal(m.challengesBought, 0));
  assert.ok(isFinite(r.summary.finalAccounts));
});


console.log("\n── Drawdown reel (pour le comparateur de firms) ──");

test("pire drawdown reconstruit jour par jour depuis la courbe d'equite", () => {
  // +300, -500, +100 -> pic 300, creux a -200 -> drawdown max 500
  const journal = { "2026-01": { "1": { pnl: 300 }, "2": { pnl: -500 }, "3": { pnl: 100 } } };
  const t = truthFromJournal(journal, 10000);
  near(t.maxDDPct, 5, 0.01);   // 500 / 10000
});

test("drawdown mesure a travers plusieurs mois, pas mois par mois", () => {
  const journal = { "2026-01": { "1": { pnl: 200 } }, "2026-02": { "1": { pnl: -600 } } };
  const t = truthFromJournal(journal, 10000);
  near(t.maxDDPct, 6, 0.01);   // pic 200 -> -400, creux 600
});

test("courbe uniquement montante : aucun drawdown", () => {
  const journal = { "2026-01": { "1": { pnl: 100 }, "2": { pnl: 200 } } };
  assert.equal(truthFromJournal(journal, 10000).maxDDPct, null);
});

test("le simulateur fournit son propre drawdown total", () => {
  const t = truthFromSimulator({ capital: 25000, ddTotPct: "3.4",
    funded: { data: [{ monthStart: 25000, profitPct: 4 }], cumulPayout: 0 } });
  near(t.maxDDPct, 3.4, 0.001);
});

console.log(`\n${passed} test(s) OK, ${failed} echec(s)\n`);
process.exit(failed > 0 ? 1 : 0);
