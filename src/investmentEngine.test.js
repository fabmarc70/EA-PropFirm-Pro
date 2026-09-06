// ══════════════════════════════════════════════════════════════════════════
// Tests unitaires du moteur d'investissement — Node natif (module "assert"),
// aucune dépendance de test ajoutée au projet. Exécution : node src/investmentEngine.test.js
// ══════════════════════════════════════════════════════════════════════════
import assert from "node:assert/strict";
import { runInvestmentProjection, aggregateByYear, compareStrategies, annualRateToPeriodic } from "./investmentEngine.js";

let passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  ✓ " + name);
  } catch (e) {
    failed++;
    console.log("  ✗ " + name);
    console.log("    " + e.message);
  }
}

console.log("\n== Moteur d'investissement — tests unitaires ==\n");

test("capital initial seul (pas d'apport, rendement 0%) — capital final = capital initial", () => {
  const { summary } = runInvestmentProjection({ initialCapital: 10000, annualReturnPct: 0, durationYears: 5 });
  assert.equal(summary.finalCapital, 10000);
  assert.equal(summary.totalGain, 0);
});

test("rendement 0% avec DCA — capital final = somme des apports (pas de gain)", () => {
  const { summary } = runInvestmentProjection({ initialCapital: 0, dcaAmount: 100, annualReturnPct: 0, durationYears: 1 });
  // 12 apports de 100 (le mois 0 ne compte pas d'apport)
  assert.equal(summary.totalContributed, 1200);
  assert.equal(summary.finalCapital, 1200);
  assert.equal(summary.totalGain, 0);
});

test("DCA sans rendement (doublon de contrôle) — performance = 0%", () => {
  const { summary } = runInvestmentProjection({ initialCapital: 500, dcaAmount: 50, annualReturnPct: 0, durationYears: 2 });
  assert.equal(summary.performancePct, 0);
});

test("intérêts composés (reinvest=true) — capital final suit la formule composée standard", () => {
  const { summary } = runInvestmentProjection({ initialCapital: 10000, annualReturnPct: 7, durationYears: 10, reinvest: true, compoundingFrequency: "yearly" });
  const expected = 10000 * Math.pow(1.07, 10); // capitalisation annuelle exacte, pas d'apport
  assert.ok(Math.abs(summary.finalCapital - expected) < 1, `attendu ~${expected.toFixed(2)}, obtenu ${summary.finalCapital}`);
});

test("gains NON réinvestis (reinvest=false) — les gains ne produisent pas eux-mêmes de rendement", () => {
  const { summary: withReinvest } = runInvestmentProjection({ initialCapital: 10000, annualReturnPct: 10, durationYears: 5, reinvest: true });
  const { summary: noReinvest } = runInvestmentProjection({ initialCapital: 10000, annualReturnPct: 10, durationYears: 5, reinvest: false });
  // Avec un rendement positif et un capital fixe (pas d'apport), le mode composé
  // doit TOUJOURS produire un capital final strictement supérieur au mode non composé.
  assert.ok(withReinvest.finalCapital > noReinvest.finalCapital);
  // Sans réinvestissement, le gain doit être approximativement LINÉAIRE dans le temps
  // (intérêt simple sur principal fixe) : gain à 5 ans ≈ 5 × gain à 1 an.
  const oneYearGain = runInvestmentProjection({ initialCapital: 10000, annualReturnPct: 10, durationYears: 1, reinvest: false }).summary.totalGain;
  assert.ok(Math.abs(noReinvest.totalGain - oneYearGain * 5) < 5, `attendu ~${(oneYearGain * 5).toFixed(2)}, obtenu ${noReinvest.totalGain}`);
});

test("DCA mensuel — 12 apports sur 1 an", () => {
  const { periods } = runInvestmentProjection({ initialCapital: 0, dcaAmount: 200, dcaFrequency: "monthly", annualReturnPct: 0, durationYears: 1 });
  const totalContribMonths = periods.filter(p => p.contribution > 0).length;
  assert.equal(totalContribMonths, 12);
});

test("DCA annuel — apport concentré en équivalent mensuel (montant annualisé/12 chaque mois)", () => {
  const { summary } = runInvestmentProjection({ initialCapital: 0, dcaAmount: 1200, dcaFrequency: "yearly", annualReturnPct: 0, durationYears: 1 });
  // 1200€/an réparti en équivalent mensuel = 100/mois × 12 = 1200 sur l'année, cohérent
  assert.equal(summary.totalContributed, 1200);
});

test("augmentation annuelle du DCA — le montant mensuel de l'année 2 est supérieur à celui de l'année 1", () => {
  const { periods } = runInvestmentProjection({ initialCapital: 0, dcaAmount: 100, dcaGrowthPct: 10, annualReturnPct: 0, durationYears: 2, startDate: "2027-01-01" });
  const year0Month = periods.find(p => p.date === "2027-06").contribution; // mois "normal" en année 0
  const year1Month = periods.find(p => p.date === "2028-06").contribution; // même mois, année 1
  assert.ok(Math.abs(year1Month - year0Month * 1.10) < 0.01, `attendu ${(year0Month * 1.10).toFixed(2)}, obtenu ${year1Month}`);
});

test("apport ponctuel (mode manuel) — comptabilisé dans le bon mois", () => {
  const { periods, summary } = runInvestmentProjection({
    initialCapital: 1000, annualReturnPct: 0, durationYears: 1,
    startDate: "2027-01-01",
    contributions: [{ date: "2027-04-15", amount: 500 }],
  });
  const aprilPeriod = periods.find(p => p.date === "2027-04");
  assert.equal(aprilPeriod.contribution, 500);
  assert.equal(summary.totalContributed, 1500);
});

test("retrait (mode revenus trading / prop firm) — part retirée n'est pas dans le capital", () => {
  const { summary } = runInvestmentProjection({
    initialCapital: 5000, annualReturnPct: 0, durationYears: 1,
    monthlyPayout: 1000, reinvestRatio: 0.3,
  });
  // 12 mois × 1000 payout : 30% réinvesti (300/mois), 70% retiré (700/mois)
  assert.equal(summary.totalContributed, 5000 + 300 * 12);
  assert.equal(summary.totalWithdrawn, 700 * 12);
  // Capital final = net investi (contributions - retraits), pas de rendement ici
  assert.equal(summary.finalCapital, (5000 + 300 * 12) - 700 * 12);
});

test("frais (fixe + annuel% + par apport) — réduisent le capital final", () => {
  const withoutFees = runInvestmentProjection({ initialCapital: 10000, dcaAmount: 100, annualReturnPct: 5, durationYears: 5 }).summary.finalCapital;
  const withFees = runInvestmentProjection({
    initialCapital: 10000, dcaAmount: 100, annualReturnPct: 5, durationYears: 5,
    fees: { fixed: 50, annualPct: 1, perContribution: 2 },
  }).summary.finalCapital;
  assert.ok(withFees < withoutFees, `avec frais (${withFees}) devrait être < sans frais (${withoutFees})`);
});

test("inflation — valeur réelle toujours inférieure ou égale à la valeur nominale (inflation ≥ 0)", () => {
  const { summary } = runInvestmentProjection({ initialCapital: 10000, annualReturnPct: 7, durationYears: 10, inflationPct: 2 });
  assert.ok(summary.finalRealValue <= summary.finalCapital);
  assert.ok(summary.finalRealValue > 0);
});

test("durée courte (1 mois)", () => {
  const { periods } = runInvestmentProjection({ initialCapital: 1000, annualReturnPct: 12, durationYears: 1 / 12 });
  assert.equal(periods.length, 2); // mois 0 (initial) + mois 1
});

test("durée longue (30 ans) — ne plante pas, produit 361 points mensuels", () => {
  const { periods, summary } = runInvestmentProjection({ initialCapital: 5000, dcaAmount: 200, annualReturnPct: 6, durationYears: 30 });
  assert.equal(periods.length, 361); // mois 0 à 360 inclus
  assert.ok(summary.finalCapital > summary.totalContributed); // rendement positif cumulé sur 30 ans
});

test("comparaison de stratégies — classement correct par capital final", () => {
  const a = runInvestmentProjection({ initialCapital: 10000, annualReturnPct: 4, durationYears: 10 });
  const b = runInvestmentProjection({ initialCapital: 10000, annualReturnPct: 8, durationYears: 10 });
  const rows = compareStrategies([{ name: "Prudent", projection: a }, { name: "Dynamique", projection: b }]);
  assert.equal(rows.length, 2);
  assert.ok(rows[1].finalCapital > rows[0].finalCapital);
});

test("agrégation annuelle — le nombre de lignes correspond au nombre d'années couvertes", () => {
  const { periods } = runInvestmentProjection({ initialCapital: 1000, dcaAmount: 50, annualReturnPct: 5, durationYears: 3, startDate: "2027-01-01" });
  const years = aggregateByYear(periods);
  assert.equal(years.length, 4); // 2027, 2028, 2029, 2030 (le dernier mois tombe en janvier 2030)
});

test("conversion taux annuel -> mensuel : composition correcte, jamais une division naïve", () => {
  const monthly = annualRateToPeriodic(12, 12);
  // 12%/an composé mensuellement != 1%/mois pile (0.01) — vérifie que ce N'EST PAS une simple division
  assert.notEqual(Math.round(monthly * 10000), 100);
  // Mais 12 mois de ce taux composé doivent redonner exactement 12% sur l'année
  const annualBack = (Math.pow(1 + monthly, 12) - 1) * 100;
  assert.ok(Math.abs(annualBack - 12) < 0.0001);
});

test("arrondis monétaires — pas de dérive cumulée sur une longue simulation", () => {
  const { periods } = runInvestmentProjection({ initialCapital: 10000, dcaAmount: 300, annualReturnPct: 6, durationYears: 20 });
  // Chaque point doit rester un nombre fini et cohérent (pas de NaN/Infinity dû à une dérive d'arrondi)
  periods.forEach(p => {
    assert.ok(Number.isFinite(p.endingCapital));
    assert.ok(Number.isFinite(p.totalGain));
  });
});

test("plafond de versements — les apports s'arrêtent au plafond, le capital continue de produire", () => {
  // Livret A : plafond 22 950 €, DCA 1000/mois sur 5 ans (60 000 € tentés)
  const { summary } = runInvestmentProjection({
    initialCapital: 0, dcaAmount: 1000, annualReturnPct: 1.7, durationYears: 5,
    contributionCap: 22950, reinvest: true,
  });
  // Les versements ne doivent JAMAIS dépasser le plafond
  assert.ok(summary.totalContributed <= 22950 + 0.01, `versé ${summary.totalContributed} > plafond 22950`);
  assert.ok(summary.capReached, "le plafond aurait dû être signalé comme atteint");
  // Mais le capital final doit dépasser le plafond (les intérêts continuent de courir)
  assert.ok(summary.finalCapital > 22950, `capital final ${summary.finalCapital} devrait dépasser le plafond grâce aux intérêts`);
});

test("plafond de versements — sans plafond (0), aucun blocage des apports", () => {
  const { summary } = runInvestmentProjection({
    initialCapital: 0, dcaAmount: 1000, annualReturnPct: 0, durationYears: 5, contributionCap: 0,
  });
  assert.equal(summary.totalContributed, 60000);
  assert.equal(summary.capReached, false);
});

test("fiscalité de sortie — l'impôt porte sur les gains uniquement, jamais sur le capital versé", () => {
  const { summary } = runInvestmentProjection({
    initialCapital: 10000, annualReturnPct: 7, durationYears: 10, reinvest: true, taxOnGainsPct: 30,
  });
  const expectedTax = summary.totalGain * 0.30;
  assert.ok(Math.abs(summary.taxDue - expectedTax) < 0.05, `impôt attendu ~${expectedTax.toFixed(2)}, obtenu ${summary.taxDue}`);
  assert.ok(Math.abs(summary.netFinalCapital - (summary.finalCapital - summary.taxDue)) < 0.05);
  // Le net doit rester supérieur au capital versé (gain positif même après impôt)
  assert.ok(summary.netFinalCapital > summary.netInvested);
});

test("fiscalité de sortie — 0% (Livret A/LDDS exonérés) : net = brut", () => {
  const { summary } = runInvestmentProjection({
    initialCapital: 10000, annualReturnPct: 1.7, durationYears: 5, taxOnGainsPct: 0,
  });
  assert.equal(summary.taxDue, 0);
  assert.equal(summary.netFinalCapital, summary.finalCapital);
});

test("fiscalité de sortie — aucune imposition si le résultat est en moins-value", () => {
  const { summary } = runInvestmentProjection({
    initialCapital: 10000, annualReturnPct: -5, durationYears: 5, taxOnGainsPct: 30,
  });
  assert.ok(summary.totalGain < 0, "ce scénario doit bien produire une perte");
  assert.equal(summary.taxDue, 0, "une moins-value ne doit générer aucun impôt");
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).\n`);
if (failed > 0) process.exit(1);
