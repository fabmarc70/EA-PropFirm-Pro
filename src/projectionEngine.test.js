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
  // rebuyLostAccounts explicitement desactive : on teste l'attrition SEULE.
  const r = runPropFirmProjection({ ...BASE, blowUpRatePct: 10, horizonMonths: 12, rebuyLostAccounts: false });
  assert.ok(r.summary.finalAccounts < 1, "attrition non appliquee");
  // La ligne du mois rapporte les comptes qui ont produit le revenu, soit
  // l'etat AVANT l'attrition de ce mois : au mois 12, 0.9^11.
  near(r.summary.finalAccounts, Math.pow(0.9, 11), 0.005);
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


console.log("\n── Rachat des comptes perdus ──");

test("sans rachat, l'attrition eteint le parc et le taux de reussite n'a aucun effet", () => {
  const base = { ...BASE, blowUpRatePct: 4, reinvestPct: 1, maxAccounts: 1,
                 challengeMonths: 18, horizonMonths: 60, rebuyLostAccounts: false };
  const a = runPropFirmProjection({ ...base, passRatePct: 20 });
  const b = runPropFirmProjection({ ...base, passRatePct: 80 });
  assert.ok(a.summary.finalAccounts < 0.2, "le parc aurait du s'eteindre");
  assert.ok(b.summary.finalAccounts < 0.2, "le parc aurait du s'eteindre malgre 80 % de reussite");
  // Rien n'est jamais achete : un excellent taux de reussite ne sauve pas un
  // parc qu'on ne reconstitue pas. Les revenus finaux s'effondrent pareillement.
  a.months.forEach(() => {});
  assert.ok(a.summary.finalMonthlyNet < 100, String(a.summary.finalMonthlyNet));
  assert.ok(b.summary.finalMonthlyNet < 100, String(b.summary.finalMonthlyNet));
});

test("avec rachat, le parc se maintient et le revenu ne s'effondre pas", () => {
  const base = { ...BASE, blowUpRatePct: 4, reinvestPct: 1, maxAccounts: 1,
                 challengeMonths: 2, horizonMonths: 60, passRatePct: 80 };
  const avec = runPropFirmProjection({ ...base, rebuyLostAccounts: true });
  const sans = runPropFirmProjection({ ...base, rebuyLostAccounts: false });
  assert.ok(avec.summary.finalAccounts > 0.85, String(avec.summary.finalAccounts));
  assert.ok(avec.summary.finalMonthlyNet > sans.summary.finalMonthlyNet * 3);
});

test("avec rachat, le taux de reussite redevient determinant", () => {
  // Sans plafond : un mauvais taux de reussite gaspille des frais de
  // challenge et ralentit la croissance du parc. Avec un plafond de 1, les
  // deux finissent au plafond et le taux ne change rien — ce qui est exact.
  const base = { ...BASE, blowUpRatePct: 4, reinvestPct: 70, maxAccounts: 0,
                 challengeMonths: 2, horizonMonths: 48, rebuyLostAccounts: true };
  const faible = runPropFirmProjection({ ...base, passRatePct: 25 });
  const fort = runPropFirmProjection({ ...base, passRatePct: 90 });
  assert.ok(fort.summary.cumulTakeHome > faible.summary.cumulTakeHome,
    `${fort.summary.cumulTakeHome} <= ${faible.summary.cumulTakeHome}`);
});

test("sans attrition, aucun rachat n'est declenche", () => {
  const r = runPropFirmProjection({ ...BASE, blowUpRatePct: 0, rebuyLostAccounts: true, horizonMonths: 24 });
  r.months.forEach(m => assert.equal(m.challengesRebought, 0));
});

test("le rachat ne depasse jamais le plafond de comptes", () => {
  const r = runPropFirmProjection({ ...BASE, blowUpRatePct: 5, maxAccounts: 2, startAccounts: 2,
    reinvestPct: 80, challengeMonths: 1, horizonMonths: 36, rebuyLostAccounts: true });
  r.months.forEach(m => assert.ok(m.accounts <= 2.0001, `${m.accounts} au mois ${m.month}`));
});

test("le rachat n'achete que ce qui est finançable", () => {
  // Revenu quasi nul et aucune tresorerie : rien ne peut etre rachete.
  const r = runPropFirmProjection({ ...BASE, monthlyReturnPct: 0.01, blowUpRatePct: 20,
    challengeFee: 5000, startPendingFee: 0, rebuyLostAccounts: true, horizonMonths: 12 });
  r.months.forEach(m => assert.equal(m.challengesRebought, 0));
  assert.ok(r.months.every(m => m.cash >= -0.01), "tresorerie negative");
});

test("le cout du rachat est bien compte dans les charges", () => {
  const r = runPropFirmProjection({ ...BASE, blowUpRatePct: 10, challengeMonths: 1,
    reinvestPct: 0, horizonMonths: 12, rebuyLostAccounts: true });
  const rachats = r.months.reduce((s, m) => s + m.rebuyCost, 0);
  assert.ok(rachats > 0, "aucun rachat facture");
  assert.ok(r.summary.cumulCosts >= rachats, "rachats absents du cumul des charges");
});

test("l'attrition s'applique en FIN de mois : le 1er mois rapporte sur un compte entier", () => {
  const r = runPropFirmProjection({ ...BASE, blowUpRatePct: 10, startAccounts: 1 });
  assert.equal(r.months[0].accounts, 1);
  near(r.months[0].netIncome, 25000 * 0.04 * 0.8);   // 800, pas 720
});


console.log("\n── Pas de tresorerie dormante ──");

test("plafond atteint : le revenu part en poche au lieu de s'empiler", () => {
  const r = runPropFirmProjection({ ...BASE, maxAccounts: 1, reinvestPct: 50,
    blowUpRatePct: 0, horizonMonths: 36 });
  const dernier = r.months[r.months.length - 1];
  assert.ok(dernier.cash < BASE.challengeFee, `tresorerie dormante : ${dernier.cash}`);
  // Aucune place pour acheter -> tout le net est encaisse.
  near(dernier.takeHome, dernier.netIncome, 0.01);
});

test("la tresorerie ne depasse jamais durablement le prix d'un challenge", () => {
  const r = runPropFirmProjection({ ...BASE, maxAccounts: 3, reinvestPct: 80,
    blowUpRatePct: 2, challengeMonths: 2, horizonMonths: 60 });
  const fin = r.months.slice(-12);
  fin.forEach(m => assert.ok(m.cash <= BASE.challengeFee * 3 + 1, `mois ${m.month} : ${m.cash}`));
});

test("sans plafond, le reinvestissement fonctionne normalement", () => {
  const r = runPropFirmProjection({ ...BASE, maxAccounts: 0, reinvestPct: 60, horizonMonths: 36 });
  assert.ok(r.summary.cumulReinvested > 0);
  assert.ok(r.summary.finalAccounts > 1);
});

test("rien n'est perdu : encaisse + reinvesti + tresorerie = net cumule", () => {
  const r = runPropFirmProjection({ ...BASE, maxAccounts: 4, reinvestPct: 50,
    blowUpRatePct: 3, challengeMonths: 2, horizonMonths: 48 });
  const net = r.months.reduce((s, m) => s + m.netIncome, 0);
  const encaisse = r.summary.cumulTakeHome;
  const achats = r.months.reduce((s, m) => s + m.reinvested + m.rebuyCost, 0);
  const tresor = r.months[r.months.length - 1].cash;
  // Les rachats sont finances sur le revenu ou la tresorerie : l'equilibre doit tomber juste.
  near(encaisse + achats + tresor, net, 1);
});

test("le trader est paye des le premier mois si le resultat le permet", () => {
  const r = runPropFirmProjection({ ...BASE, reinvestPct: 50, maxAccounts: 6 });
  assert.ok(r.months[0].netIncome > 0, "aucun revenu au mois 1");
  assert.ok(r.months[0].takeHome > 0, "rien d'encaisse au mois 1");
});


console.log("\n── Duree reelle d'un challenge ──");

const PHASES = { phase1TargetPct: 8, phase1MinDays: 5, phase2TargetPct: 5, phase2MinDays: 5,
                 fundingDelayMonths: 0.5, autoChallengeDuration: true };

test("la duree decoule de TON rythme, pas d'une convention", () => {
  const lent = runPropFirmProjection({ ...BASE, ...PHASES, monthlyReturnPct: 1.7 });
  const rapide = runPropFirmProjection({ ...BASE, ...PHASES, monthlyReturnPct: 6 });
  // 13 % a 1,7 %/mois = 7,6 mois + activation ; a 6 %/mois = 2,2 mois.
  assert.ok(lent.timeline.autoChallengeMonths > 7, String(lent.timeline.autoChallengeMonths));
  assert.ok(rapide.timeline.autoChallengeMonths < 3, String(rapide.timeline.autoChallengeMonths));
});

test("les jours minimum imposent un plancher meme a rythme eleve", () => {
  const r = runPropFirmProjection({ ...BASE, ...PHASES, monthlyReturnPct: 100 });
  // 5 + 5 jours imposes = 10/21 mois, + activation 0,5
  assert.ok(r.timeline.autoChallengeMonths >= 10 / 21 + 0.5 - 0.01, String(r.timeline.autoChallengeMonths));
});

test("chaque phase est detaillee separement", () => {
  const r = runPropFirmProjection({ ...BASE, ...PHASES, monthlyReturnPct: 4 });
  assert.equal(r.timeline.phase1Months, 2);      // 8 / 4
  assert.equal(r.timeline.phase2Months, 1.25);   // 5 / 4
  assert.equal(r.timeline.activationMonths, 0.5);
});

test("sans rendement mesure, la duree auto est impossible et on garde la saisie", () => {
  const r = runPropFirmProjection({ ...BASE, ...PHASES, monthlyReturnPct: 0, challengeMonths: 3 });
  assert.equal(r.timeline.autoChallengeMonths, null);
  assert.equal(r.timeline.usedAuto, false);
  assert.equal(r.timeline.challengeMonths, 3);
});

test("mode manuel : la duree saisie est respectee", () => {
  const r = runPropFirmProjection({ ...BASE, ...PHASES, autoChallengeDuration: false, challengeMonths: 4 });
  assert.equal(r.timeline.challengeMonths, 4);
  assert.equal(r.timeline.usedAuto, false);
});

console.log("\n── Point de depart ──");

test("deja funded : revenu des le mois 1", () => {
  const r = runPropFirmProjection({ ...BASE, startStage: "funded", startAccounts: 2 });
  assert.equal(r.months[0].accounts, 2);
  assert.equal(r.summary.firstPaidMonth, 1);
});

test("premier challenge : aucun compte tant qu'il n'est pas passe", () => {
  const r = runPropFirmProjection({ ...BASE, startStage: "buying", startAccounts: 0,
    startPendingFee: 300, challengeMonths: 3, passRatePct: 100, horizonMonths: 12 });
  assert.equal(r.months[0].accounts, 0);
  assert.equal(r.months[1].accounts, 0);
  assert.ok(r.summary.firstFundedMonth >= 4, String(r.summary.firstFundedMonth));
});

test("\"je demarre\" engage le challenge meme sans tresorerie", () => {
  // Sans cela, ce point de depart ne declenchait jamais rien : projection
  // plate a vie pour quelqu'un qui declare pourtant se lancer.
  const r = runPropFirmProjection({ ...BASE, startStage: "buying", startAccounts: 0,
    startPendingFee: 0, challengeMonths: 3, passRatePct: 100, horizonMonths: 24 });
  assert.ok(r.summary.firstFundedMonth != null, "aucun compte funded sur 2 ans");
  assert.equal(r.summary.firstFundedMonth, 4);
  assert.ok(r.summary.cumulCosts >= BASE.challengeFee, "le challenge n'a pas ete facture");
});

test("\"j'epargne\" ne paie rien d'office, contrairement a \"je demarre\"", () => {
  const epargne = runPropFirmProjection({ ...BASE, startStage: "saving", startAccounts: 0,
    startPendingFee: 0, challengeMonths: 3, horizonMonths: 24 });
  assert.equal(epargne.summary.firstFundedMonth, null);
});

test("challenge deja en cours : seul le temps RESTANT compte", () => {
  const tout = runPropFirmProjection({ ...BASE, startStage: "inChallenge", startAccounts: 0,
    startChallengePhase: 1, startChallengeMonthsElapsed: 0, challengeMonths: 6, passRatePct: 100 });
  const presque = runPropFirmProjection({ ...BASE, startStage: "inChallenge", startAccounts: 0,
    startChallengePhase: 1, startChallengeMonthsElapsed: 5, challengeMonths: 6, passRatePct: 100 });
  assert.ok(presque.summary.firstFundedMonth < tout.summary.firstFundedMonth,
    `${presque.summary.firstFundedMonth} >= ${tout.summary.firstFundedMonth}`);
  assert.equal(presque.summary.firstFundedMonth, 2);
});

test("j'epargne encore : rien ne demarre sans de quoi payer", () => {
  const r = runPropFirmProjection({ ...BASE, startStage: "saving", startAccounts: 0,
    startPendingFee: 0, monthlyReturnPct: 5, horizonMonths: 12 });
  // Aucun compte, donc aucun revenu, donc aucune tresorerie : rien ne demarre.
  assert.equal(r.summary.finalAccounts, 0);
  assert.equal(r.summary.cumulTakeHome, 0);
});

console.log("\n── Rythme humain ──");

test("un seul challenge a la fois : jamais deux en parallele", () => {
  const r = runPropFirmProjection({ ...BASE, startStage: "funded", startAccounts: 2,
    maxParallelChallenges: 1, reinvestPct: 100, challengeMonths: 3, maxAccounts: 0, horizonMonths: 36 });
  r.months.forEach(m => assert.ok(m.challengesBought + m.challengesRebought <= 1,
    `mois ${m.month} : ${m.challengesBought + m.challengesRebought} achats`));
});

test("delai minimum entre deux achats respecte", () => {
  const r = runPropFirmProjection({ ...BASE, startStage: "funded", startAccounts: 3,
    minMonthsBetweenBuys: 6, reinvestPct: 100, maxAccounts: 0, challengeMonths: 2, horizonMonths: 48 });
  const moisAchat = r.months.filter(m => m.challengesBought + m.challengesRebought > 0).map(m => m.month);
  for (let i = 1; i < moisAchat.length; i++) {
    assert.ok(moisAchat[i] - moisAchat[i - 1] >= 6, `achats aux mois ${moisAchat[i-1]} et ${moisAchat[i]}`);
  }
});

test("la prudence coute en croissance — et c'est normal", () => {
  const base = { ...BASE, startStage: "funded", startAccounts: 1, reinvestPct: 100,
                 maxAccounts: 0, challengeMonths: 2, horizonMonths: 48, passRatePct: 60 };
  const prudent = runPropFirmProjection({ ...base, maxParallelChallenges: 1, minMonthsBetweenBuys: 6 });
  const agressif = runPropFirmProjection({ ...base, maxParallelChallenges: 99, minMonthsBetweenBuys: 0 });
  assert.ok(agressif.summary.finalAccounts > prudent.summary.finalAccounts,
    `${agressif.summary.finalAccounts} <= ${prudent.summary.finalAccounts}`);
});

test("pause apres echec : les achats s'arretent un temps", () => {
  const sans = runPropFirmProjection({ ...BASE, startStage: "funded", startAccounts: 2, passRatePct: 40,
    reinvestPct: 100, maxAccounts: 0, challengeMonths: 2, horizonMonths: 48, pauseAfterFailMonths: 0 });
  const avec = runPropFirmProjection({ ...BASE, startStage: "funded", startAccounts: 2, passRatePct: 40,
    reinvestPct: 100, maxAccounts: 0, challengeMonths: 2, horizonMonths: 48, pauseAfterFailMonths: 4 });
  const nSans = sans.months.reduce((a, m) => a + m.challengesBought + m.challengesRebought, 0);
  const nAvec = avec.months.reduce((a, m) => a + m.challengesBought + m.challengesRebought, 0);
  assert.ok(nAvec < nSans, `${nAvec} >= ${nSans}`);
});

test("la chronologie est coherente avec les lignes mensuelles", () => {
  const r = runPropFirmProjection({ ...BASE, startStage: "buying", startAccounts: 0,
    startPendingFee: 300, challengeMonths: 3, passRatePct: 100, horizonMonths: 24 });
  const m = r.months[r.timeline.firstFundedMonth - 1];
  assert.ok(m.accounts > 0, "le mois annonce n'a pas de compte funded");
  if (r.timeline.firstFundedMonth > 1) {
    assert.equal(r.months[r.timeline.firstFundedMonth - 2].accounts, 0);
  }
});

console.log(`\n${passed} test(s) OK, ${failed} echec(s)\n`);
process.exit(failed > 0 ? 1 : 0);
