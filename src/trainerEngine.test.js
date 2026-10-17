// ══════════════════════════════════════════════════════════════════════════
// Tests du moteur d'entrainement — Node natif.
// Execution : node src/trainerEngine.test.js
// ══════════════════════════════════════════════════════════════════════════
import assert from "node:assert/strict";
import {
  openPosition, resolvePosition, closeManually, trainerStats,
  syntheticCandles, pickStartIndex,
} from "./trainerEngine.js";

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { failed++; console.log("  ✗ " + name); console.log("    " + e.message); }
}
const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `attendu ~${b}, obtenu ${a}`);

// Bougie : [ts, open, high, low, close]
const bougie = (o, h, l, c, ts = 0) => [ts, o, h, l, c];

console.log("\n── Ouverture : le risque commande la taille ──");

test("un stop a 1 % risque exactement 1 % du solde", () => {
  const p = openPosition({ side: "long", entryPrice: 100, balance: 10000, riskPct: 1, stopPct: 1, rr: 2 });
  near(p.stop, 99);
  near(p.target, 102);
  near(p.riskAmount, 100);
  // quantite x distance = risque
  near(p.quantity * (p.entryPrice - p.stop), 100);
});

test("un stop plus large reduit la taille, pas le risque", () => {
  const serre = openPosition({ side: "long", entryPrice: 100, balance: 10000, riskPct: 1, stopPct: 0.5, rr: 2 });
  const large = openPosition({ side: "long", entryPrice: 100, balance: 10000, riskPct: 1, stopPct: 2, rr: 2 });
  assert.ok(large.quantity < serre.quantity, "un stop large devrait donner une taille plus petite");
  near(serre.riskAmount, large.riskAmount);
});

test("vente : stop au-dessus, objectif en dessous", () => {
  const p = openPosition({ side: "short", entryPrice: 100, balance: 10000, riskPct: 1, stopPct: 1, rr: 3 });
  assert.equal(p.side, "short");
  near(p.stop, 101);
  near(p.target, 97);
});

test("entrees invalides : aucune position, pas de NaN", () => {
  assert.equal(openPosition({ side: "long", entryPrice: 0, balance: 10000, riskPct: 1, stopPct: 1 }), null);
  assert.equal(openPosition({ side: "long", entryPrice: 100, balance: 10000, riskPct: 0, stopPct: 1 }), null);
  assert.equal(openPosition({ side: "long", entryPrice: 100, balance: 10000, riskPct: 1, stopPct: 0 }), null);
});

console.log("\n── Resolution sur les bougies suivantes ──");

const P_LONG = openPosition({ side: "long", entryPrice: 100, balance: 10000, riskPct: 1, stopPct: 1, rr: 2 });

test("objectif touche : +2R", () => {
  const c = [bougie(100, 100.5, 99.5, 100), bougie(100, 102.5, 99.8, 102)];
  const r = resolvePosition(P_LONG, c, 0);
  assert.equal(r.reason, "target");
  near(r.rMultiple, 2);
  near(r.pnl, 200);
  assert.equal(r.win, true);
});

test("stop touche : -1R", () => {
  const c = [bougie(100, 100.2, 98.5, 99)];
  const r = resolvePosition(P_LONG, c, 0);
  assert.equal(r.reason, "stop");
  near(r.rMultiple, -1);
  near(r.pnl, -100);
  assert.equal(r.win, false);
});

test("une bougie qui touche LES DEUX compte comme un stop", () => {
  // Choix prudent et explicite : sans donnee intra-bougie, supposer l'objectif
  // flatterait les statistiques de l'utilisateur.
  const c = [bougie(100, 103, 98, 101)];
  const r = resolvePosition(P_LONG, c, 0);
  assert.equal(r.reason, "stop_ambigu");
  near(r.rMultiple, -1);
});

test("ni stop ni objectif : sortie au dernier cours connu", () => {
  const c = [bougie(100, 100.4, 99.6, 100.2), bougie(100.2, 100.8, 99.9, 100.5)];
  const r = resolvePosition(P_LONG, c, 0);
  assert.equal(r.reason, "temps");
  near(r.exitPrice, 100.5);
  near(r.rMultiple, 0.5);   // +0.5 sur une distance de 1
});

test("limite de bougies respectee", () => {
  const c = [bougie(100, 100.4, 99.6, 100.1), bougie(100, 100.4, 99.6, 100.1), bougie(100, 103, 99.6, 102.9)];
  const r = resolvePosition(P_LONG, c, 0, 1);   // 2 bougies au plus
  assert.equal(r.reason, "temps", "l'objectif de la 3e bougie n'aurait pas du compter");
});

test("vente : objectif atteint quand le prix baisse", () => {
  const p = openPosition({ side: "short", entryPrice: 100, balance: 10000, riskPct: 1, stopPct: 1, rr: 2 });
  const c = [bougie(100, 100.3, 97.5, 98)];
  const r = resolvePosition(p, c, 0);
  assert.equal(r.reason, "target");
  near(r.rMultiple, 2);
  near(r.pnl, 200);
});

test("vente : stop atteint quand le prix monte", () => {
  const p = openPosition({ side: "short", entryPrice: 100, balance: 10000, riskPct: 1, stopPct: 1, rr: 2 });
  const c = [bougie(100, 101.5, 99.8, 101.2)];
  const r = resolvePosition(p, c, 0);
  assert.equal(r.reason, "stop");
  near(r.rMultiple, -1);
});

test("cloture manuelle a un cours quelconque", () => {
  const r = closeManually(P_LONG, 100.7, 3);
  assert.equal(r.reason, "manuel");
  near(r.rMultiple, 0.7);
  assert.equal(r.exitIndex, 3);
});

test("la resolution demarre bien a l'index demande", () => {
  // La 1re bougie toucherait le stop, mais on demarre a la 2e.
  const c = [bougie(100, 100, 98, 98.5), bougie(100, 102.5, 99.9, 102)];
  const r = resolvePosition(P_LONG, c, 1);
  assert.equal(r.reason, "target");
});

console.log("\n── Statistiques de session ──");

const T = (pnl, r) => ({ pnl, rMultiple: r, win: pnl > 0 });

test("aucune donnee : des zeros, jamais de NaN", () => {
  const s = trainerStats([], 10000);
  assert.equal(s.trades, 0);
  assert.equal(s.winrate, null);
  assert.equal(s.profitFactor, null);
  assert.equal(s.balance, 10000);
  assert.deepEqual(s.equity, [10000]);
});

test("winrate, profit factor et esperance", () => {
  const s = trainerStats([T(200, 2), T(-100, -1), T(200, 2), T(-100, -1)], 10000);
  assert.equal(s.trades, 4);
  assert.equal(s.wins, 2);
  near(s.winrate, 50);
  near(s.profitFactor, 2);         // 400 / 200
  near(s.expectancyR, 0.5);        // (2-1+2-1)/4
  near(s.totalPnl, 200);
  near(s.balance, 10200);
});

test("profit factor null quand il n'y a aucune perte, jamais Infinity", () => {
  const s = trainerStats([T(100, 1), T(200, 2)], 10000);
  assert.equal(s.profitFactor, null);
  assert.ok(isFinite(s.expectancyR));
});

test("drawdown maximum mesure sur la courbe d'equite", () => {
  // 10000 -> 10400 -> 9900 : pic 10400, creux 500 -> 4.81 %
  const s = trainerStats([T(400, 4), T(-500, -5)], 10000);
  near(s.maxDDPct, 4.81, 0.02);
});

test("series consecutives", () => {
  const s = trainerStats([T(100, 1), T(100, 1), T(100, 1), T(-100, -1), T(-100, -1)], 10000);
  assert.equal(s.meilleureSerie, 3);
  assert.equal(s.pireSerie, 2);
});

test("meilleur et pire trade en R", () => {
  const s = trainerStats([T(300, 3), T(-100, -1), T(50, 0.5)], 10000);
  near(s.bestR, 3);
  near(s.worstR, -1);
});

test("la courbe d'equite compte un point de plus que les trades", () => {
  const s = trainerStats([T(100, 1), T(-50, -0.5)], 10000);
  assert.equal(s.equity.length, 3);
  assert.equal(s.equity[0], 10000);
  near(s.equity[2], 10050);
});

console.log("\n── Serie de secours et point de depart ──");

test("serie de secours : bougies coherentes", () => {
  const c = syntheticCandles(42, 300);
  assert.equal(c.length, 300);
  c.forEach((x, i) => {
    assert.ok(x[2] >= x[1] && x[2] >= x[4], `haut incoherent a l'index ${i}`);
    assert.ok(x[3] <= x[1] && x[3] <= x[4], `bas incoherent a l'index ${i}`);
    assert.ok(x[1] > 0 && x[4] > 0, "prix negatif");
    if (i > 0) assert.ok(x[0] > c[i - 1][0], "horodatage non croissant");
  });
});

test("serie de secours : deterministe a graine egale", () => {
  assert.deepEqual(syntheticCandles(7, 50), syntheticCandles(7, 50));
  assert.notDeepEqual(syntheticCandles(7, 50), syntheticCandles(8, 50));
});

test("point de depart : assez de passe visible et de futur cache", () => {
  const c = syntheticCandles(1, 400);
  for (let i = 0; i < 200; i++) {
    const idx = pickStartIndex(c, 60, 60);
    assert.ok(idx >= 60, `index ${idx} : pas assez de bougies visibles`);
    assert.ok(idx <= c.length - 61, `index ${idx} : pas assez de bougies cachees`);
  }
});

test("serie trop courte : pas de plantage", () => {
  const idx = pickStartIndex(syntheticCandles(1, 10), 60, 60);
  assert.ok(idx >= 0 && idx < 10);
});

console.log("\n── Bout en bout ──");

test("une session complete produit des statistiques coherentes", () => {
  const c = syntheticCandles(123, 500);
  let solde = 10000;
  const trades = [];
  let rng = 1;
  const next = () => { rng = (rng * 1103515245 + 12345) % 2147483648; return rng / 2147483648; };
  for (let k = 0; k < 30; k++) {
    const i = pickStartIndex(c, 60, 60, next);
    const p = openPosition({
      side: next() > 0.5 ? "long" : "short",
      entryPrice: c[i][4], balance: solde, riskPct: 1, stopPct: 0.6, rr: 2,
    });
    const r = resolvePosition(p, c, i + 1, 40);
    solde += r.pnl;
    trades.push(r);
  }
  const s = trainerStats(trades, 10000);
  assert.equal(s.trades, 30);
  near(s.balance, solde, 0.5);
  assert.ok(s.winrate >= 0 && s.winrate <= 100);
  assert.ok(isFinite(s.expectancyR));
  assert.ok(s.maxDDPct >= 0);
  trades.forEach(t => {
    assert.ok(isFinite(t.pnl) && isFinite(t.rMultiple), "trade avec une valeur non finie");
    assert.ok(t.rMultiple >= -1.001, `perte superieure au risque : ${t.rMultiple}R`);
  });
});

console.log(`\n${passed} test(s) OK, ${failed} echec(s)\n`);
process.exit(failed > 0 ? 1 : 0);
