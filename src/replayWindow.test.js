// ══════════════════════════════════════════════════════════════════════════
// Tests de la fenetre de rejeu — Node natif.
// Execution : node src/replayWindow.test.js
// ══════════════════════════════════════════════════════════════════════════
import assert from "node:assert/strict";
import {
  rendementMois, moisSuivant, moisDeTs, fenetresPossibles, choisirFenetre,
  indexAuTemps, indexJouable,
} from "./replayWindow.js";

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { failed++; console.log("  ✗ " + name); console.log("    " + e.message); }
}

// Catalogue : 2023-01 a 2023-06 en M15 (2000 bougies/mois), plus un mois
// journalier isole et un trou en 2023-04 pour une autre paire.
const cat = [
  { pair: "XAUUSD", period: "2023-01", count: 2000, baseMinutes: 15 },
  { pair: "XAUUSD", period: "2023-02", count: 2000, baseMinutes: 15 },
  { pair: "XAUUSD", period: "2023-03", count: 2000, baseMinutes: 15 },
  { pair: "XAUUSD", period: "2023-04", count: 2000, baseMinutes: 15 },
  { pair: "XAUUSD", period: "2023-05", count: 2000, baseMinutes: 15 },
  { pair: "XAUUSD", period: "2023-06", count: 2000, baseMinutes: 15 },
  { pair: "XAUUSD", period: "2024-01", count: 21, baseMinutes: 1440 },
  { pair: "EURUSD", period: "2023-01", count: 2000, baseMinutes: 15 },
  { pair: "EURUSD", period: "2023-03", count: 2000, baseMinutes: 15 },
];
const BESOIN = 140;

console.log("\n── Rendement et contiguite ──");

test("une source plus grossiere que l'unite ne rend rien", () => {
  assert.equal(rendementMois({ count: 2000, baseMinutes: 15 }, 5), 0);
  assert.equal(rendementMois({ count: 2000, baseMinutes: 15 }, 15), 2000);
  assert.equal(rendementMois({ count: 2000, baseMinutes: 15 }, 60), 500);
});

test("mois suivant, y compris au passage d'annee", () => {
  assert.equal(moisSuivant("2023-01"), "2023-02");
  assert.equal(moisSuivant("2023-12"), "2024-01");
  assert.equal(moisSuivant("n'importe quoi"), null);
});

test("un trou dans le calendrier coupe la fenetre", () => {
  // EURUSD n'a que 2023-01 et 2023-03 : en H4, il faudrait les deux, et
  // elles ne se touchent pas.
  const f = fenetresPossibles(cat, "EURUSD", 240, BESOIN);
  assert.equal(f.length, 0, "deux mois non contigus ne doivent pas etre colles");
});

test("un seul mois suffit quand l'unite est fine", () => {
  const f = fenetresPossibles(cat, "EURUSD", 15, BESOIN);
  assert.equal(f.length, 2);
  f.forEach(x => assert.equal(x.length, 1));
});

test("les unites longues enchainent plusieurs mois contigus", () => {
  // En H4, un mois rend 125 bougies : il en faut deux.
  const f = fenetresPossibles(cat, "XAUUSD", 240, BESOIN);
  assert.ok(f.length > 0);
  f.forEach(x => assert.ok(x.length >= 2, "une seule ne suffit pas en H4"));
});

test("le mois journalier isole ne fournit aucune fenetre", () => {
  const f = fenetresPossibles(cat, "XAUUSD", 1440, BESOIN);
  assert.equal(f.length, 0, "21 bougies ne font pas un exercice");
});

console.log("\n── Continuite : le meme instant d'une unite a l'autre ──");

const tsAvril = Date.UTC(2023, 3, 12);   // 12 avril 2023

test("le mois d'un horodatage", () => {
  assert.equal(moisDeTs(tsAvril), "2023-04");
  assert.equal(moisDeTs(Date.UTC(2023, 11, 31)), "2023-12");
  assert.equal(moisDeTs("pas une date"), null);
});

test("avec une cible, la fenetre choisie CONTIENT ce mois", () => {
  // C'est l'exigence qui manquait : changer d'unite ne doit pas changer
  // d'epoque.
  [15, 60, 240].forEach(tf => {
    const f = choisirFenetre(cat, "XAUUSD", tf, BESOIN, () => 0.99, tsAvril);
    assert.ok(f, "aucune fenetre pour " + tf);
    const debut = f[0].period, fin = f[f.length - 1].period;
    assert.ok(debut <= "2023-04" && "2023-04" <= fin,
      "la fenetre " + debut + ".." + fin + " ne couvre pas avril en " + tf);
  });
});

test("le choix avec cible est DETERMINISTE, quel que soit le hasard", () => {
  const a = choisirFenetre(cat, "XAUUSD", 240, BESOIN, () => 0.01, tsAvril);
  const b = choisirFenetre(cat, "XAUUSD", 240, BESOIN, () => 0.99, tsAvril);
  assert.deepEqual(a.map(x => x.period), b.map(x => x.period));
});

test("cible hors du catalogue : on retombe sur un choix au hasard, sans planter", () => {
  const f = choisirFenetre(cat, "XAUUSD", 60, BESOIN, () => 0, Date.UTC(1990, 0, 1));
  assert.ok(f && f.length);
});

test("sans cible, le hasard decide", () => {
  const f0 = choisirFenetre(cat, "XAUUSD", 15, BESOIN, () => 0);
  const f1 = choisirFenetre(cat, "XAUUSD", 15, BESOIN, () => 0.99);
  assert.notDeepEqual(f0.map(x => x.period), f1.map(x => x.period));
});

test("aucune fenetre possible : null, pas d'exception", () => {
  assert.equal(choisirFenetre(cat, "INCONNU", 60, BESOIN), null);
  assert.equal(choisirFenetre([], "XAUUSD", 60, BESOIN), null);
});

console.log("\n── Retrouver le meme MOMENT dans une serie ──");

// Serie horaire : 2023-04-01 00:00 + i heures
const serie = Array.from({ length: 500 }, (_, i) => [Date.UTC(2023, 3, 1) + i * 3600000, 10, 11, 9, 10]);

test("l'index du moment exact", () => {
  const cible = Date.UTC(2023, 3, 1) + 100 * 3600000;
  assert.equal(indexAuTemps(serie, cible), 100);
});

test("entre deux bougies, la plus proche gagne", () => {
  const base = Date.UTC(2023, 3, 1);
  assert.equal(indexAuTemps(serie, base + 100 * 3600000 + 600000), 100);   // +10 min
  assert.equal(indexAuTemps(serie, base + 100 * 3600000 + 3000000), 101);  // +50 min
});

test("avant le debut et apres la fin : on se cale sur les extremites", () => {
  assert.equal(indexAuTemps(serie, 0), 0);
  assert.equal(indexAuTemps(serie, Date.UTC(2030, 0, 1)), serie.length - 1);
});

test("serie vide ou cible absente : -1, pas d'exception", () => {
  assert.equal(indexAuTemps([], 123), -1);
  assert.equal(indexAuTemps(serie, null), -1);
});

console.log("\n── Zone jouable ──");

test("un index trop pres du debut est repousse", () => {
  assert.equal(indexJouable(serie, 3, 70, 60), 70);
});

test("un index trop pres de la fin est ramene", () => {
  assert.equal(indexJouable(serie, 499, 70, 60), 439);   // 500 - 60 - 1
});

test("un index deja jouable n'est pas touche", () => {
  assert.equal(indexJouable(serie, 200, 70, 60), 200);
});

test("serie trop courte pour les deux : -1", () => {
  assert.equal(indexJouable(serie.slice(0, 100), 50, 70, 60), -1);
});

console.log(`\n${passed} test(s) OK, ${failed} echec(s)\n`);
process.exit(failed > 0 ? 1 : 0);
