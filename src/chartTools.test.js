// ══════════════════════════════════════════════════════════════════════════
// Tests de la geometrie du graphique — Node natif.
// Execution : node src/chartTools.test.js
// ══════════════════════════════════════════════════════════════════════════
import assert from "node:assert/strict";
import {
  clampView, zoomView, priceRange, makeScales, hitTest, distanceSegment,
  measureInfo, decimales, MIN_BOUGIES,
} from "./chartTools.js";

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { failed++; console.log("  ✗ " + name); console.log("    " + e.message); }
}
const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `attendu ~${b}, obtenu ${a}`);

// Serie de 200 bougies, prix de 100 a 300
const serie = Array.from({ length: 200 }, (_, i) => [i * 60000, 100 + i, 102 + i, 98 + i, 101 + i]);

console.log("\n── Fenetre visible ──");

test("une fenetre valide est laissee telle quelle", () => {
  assert.deepEqual(clampView({ debut: 50, nb: 60 }, 200), { debut: 50, nb: 60 });
});

test("un defilement au-dela de la fin est ramene dans les donnees", () => {
  const v = clampView({ debut: 9999, nb: 60 }, 200);
  assert.equal(v.debut, 140);
  assert.equal(v.debut + v.nb, 200);
});

test("un defilement negatif revient a zero", () => {
  assert.equal(clampView({ debut: -80, nb: 60 }, 200).debut, 0);
});

test("on ne peut pas zoomer en dessous du minimum lisible", () => {
  assert.equal(clampView({ debut: 0, nb: 2 }, 200).nb, MIN_BOUGIES);
});

test("une fenetre plus large que la serie est bornee a la serie", () => {
  const v = clampView({ debut: 0, nb: 500 }, 200);
  assert.equal(v.nb, 200);
  assert.equal(v.debut, 0);
});

test("serie vide : aucune exception, fenetre nulle", () => {
  assert.deepEqual(clampView({ debut: 3, nb: 40 }, 0), { debut: 0, nb: 0 });
});

console.log("\n── Zoom ──");

test("le zoom resserre la fenetre", () => {
  const v = zoomView({ debut: 50, nb: 100 }, 0.5, 0.5, 200);
  assert.equal(v.nb, 50);
});

test("l'index sous le doigt ne bouge pas", () => {
  // C'est ce qui rend le zoom previsible : on zoome SUR quelque chose.
  const avant = { debut: 40, nb: 80 };
  const ancrage = 0.25;
  const indexVise = avant.debut + ancrage * avant.nb;    // 60
  const apres = zoomView(avant, 0.5, ancrage, 200);
  near(apres.debut + ancrage * apres.nb, indexVise, 1);
});

test("dezoomer au-dela de la serie reste borne", () => {
  const v = zoomView({ debut: 0, nb: 100 }, 10, 0.5, 200);
  assert.equal(v.nb, 200);
  assert.ok(v.debut >= 0);
});

console.log("\n── Echelle des prix ──");

test("l'etendue couvre les hauts et les bas de la fenetre", () => {
  const { lo, hi } = priceRange(serie, { debut: 0, nb: 10 }, []);
  assert.ok(lo < 98, "le plus bas doit etre a l'interieur");
  assert.ok(hi > 111, "le plus haut doit etre a l'interieur");
});

test("un niveau hors des bougies elargit l'etendue", () => {
  // Un stop pose loin du prix doit rester visible, sinon on le croit perdu.
  const sans = priceRange(serie, { debut: 0, nb: 10 }, []);
  const avec = priceRange(serie, { debut: 0, nb: 10 }, [500]);
  assert.ok(avec.hi > sans.hi);
  assert.ok(avec.hi >= 500);
});

test("bougies plates : etendue non nulle, pas de division par zero", () => {
  const plat = [[0, 50, 50, 50, 50], [1, 50, 50, 50, 50]];
  const { lo, hi } = priceRange(plat, { debut: 0, nb: 2 }, []);
  assert.ok(hi > lo, "une etendue nulle ferait diviser par zero");
});

console.log("\n── Passage entre les reperes ──");

const sc = makeScales(serie, { debut: 50, nb: 100 }, 400, 300, []);

test("index -> x -> index redonne le meme index", () => {
  [50, 75, 120, 149].forEach(i => near(sc.indexFromX(sc.xFromIndex(i)), i, 0.001));
});

test("prix -> y -> prix redonne le meme prix", () => {
  [120, 180, 240].forEach(p => near(sc.priceFromY(sc.yFromPrice(p)), p, 0.001));
});

test("un prix haut est plus haut a l'ecran", () => {
  // y croit vers le bas : le prix le plus eleve doit avoir le y le plus petit.
  assert.ok(sc.yFromPrice(240) < sc.yFromPrice(120));
});

test("la fenetre occupe toute la largeur", () => {
  const v = sc.view;
  assert.ok(sc.xFromIndex(v.debut) >= 0 && sc.xFromIndex(v.debut) < 400);
  assert.ok(sc.xFromIndex(v.debut + v.nb - 1) <= 400);
});

test("largeur ou hauteur nulle : aucune exception", () => {
  const s0 = makeScales(serie, { debut: 0, nb: 50 }, 0, 0, []);
  assert.ok(isFinite(s0.xFromIndex(10)));
  assert.ok(isFinite(s0.yFromPrice(150)));
});

console.log("\n── Gomme et selection ──");

test("distance a un segment : perpendiculaire et extremites", () => {
  near(distanceSegment(5, 10, 0, 0, 10, 0), 10);
  near(distanceSegment(-5, 0, 0, 0, 10, 0), 5);   // au-dela de l'extremite
  near(distanceSegment(5, 0, 0, 0, 10, 0), 0);
});

test("un appui pres d'une horizontale la selectionne", () => {
  const dessins = [{ type: "h", prix: 200 }];
  const y = sc.yFromPrice(200);
  assert.equal(hitTest(dessins, 120, y + 4, sc), 0);
});

test("un appui loin ne selectionne rien", () => {
  const dessins = [{ type: "h", prix: 200 }];
  assert.equal(hitTest(dessins, 120, sc.yFromPrice(200) + 60, sc), -1);
});

test("entre deux traces, le plus proche gagne", () => {
  const dessins = [{ type: "h", prix: 200 }, { type: "h", prix: 201 }];
  const y = sc.yFromPrice(201);
  assert.equal(hitTest(dessins, 100, y, sc), 1);
});

test("une ligne de tendance se selectionne aussi", () => {
  const d = [{ type: "t", i1: 60, p1: 160, i2: 120, p2: 220 }];
  const xm = (sc.xFromIndex(60) + sc.xFromIndex(120)) / 2;
  const ym = (sc.yFromPrice(160) + sc.yFromPrice(220)) / 2;
  assert.equal(hitTest(d, xm, ym, sc), 0);
});

test("aucun trace : rien a selectionner", () => {
  assert.equal(hitTest([], 10, 10, sc), -1);
  assert.equal(hitTest(null, 10, 10, sc), -1);
});

console.log("\n── Mesure ──");

test("une mesure a la hausse donne ecart, pourcentage et duree", () => {
  const m = measureInfo({ type: "m", i1: 10, p1: 100, i2: 25, p2: 110 });
  near(m.ecart, 10);
  near(m.pct, 10);
  assert.equal(m.bougies, 15);
  assert.equal(m.hausse, true);
});

test("une mesure a la baisse est signalee comme telle", () => {
  const m = measureInfo({ type: "m", i1: 10, p1: 100, i2: 4, p2: 90 });
  near(m.pct, -10);
  assert.equal(m.bougies, 6);
  assert.equal(m.hausse, false);
});

test("mesure absente : null, pas d'exception", () => {
  assert.equal(measureInfo(null), null);
});

console.log("\n── Etiquettes ──");

test("les decimales suivent l'ordre de grandeur", () => {
  assert.equal(decimales(4321), 2);
  assert.equal(decimales(250), 3);
  assert.equal(decimales(48), 4);
  assert.equal(decimales(1.17), 5);
});

console.log(`\n${passed} test(s) OK, ${failed} echec(s)\n`);
process.exit(failed > 0 ? 1 : 0);
