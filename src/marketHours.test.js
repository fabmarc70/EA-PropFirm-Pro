// ══════════════════════════════════════════════════════════════════════════
// Tests de l'etat des marches — Node natif.
// Execution : node src/marketHours.test.js
//
// Toutes les dates sont ecrites en TEMPS UNIVERSEL, et les attentes raisonnees
// en heure de New York. C'est volontaire : si le code se trompait de fuseau
// ou ignorait l'heure d'ete, ces tests le verraient.
// ══════════════════════════════════════════════════════════════════════════
import assert from "node:assert/strict";
import { marketState, assetClass, anyOpen, marketSummary, CLASSES } from "./marketHours.js";

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { failed++; console.log("  ✗ " + name); console.log("    " + e.message); }
}
const d = (iso) => new Date(iso);

console.log("\n── Classes d'actifs ──");

test("chaque actif est range dans sa classe", () => {
  assert.equal(assetClass("BTCUSD"), CLASSES.CRYPTO);
  assert.equal(assetClass("SOLUSD"), CLASSES.CRYPTO);
  assert.equal(assetClass("XAUUSD"), CLASSES.METAL);
  assert.equal(assetClass("NAS100"), CLASSES.INDICE);
  assert.equal(assetClass("USOIL"), CLASSES.ENERGIE);
  assert.equal(assetClass("EURUSD"), CLASSES.FOREX);
});

test("un actif inconnu est traite comme du Forex, pas comme ouvert en permanence", () => {
  // Le repli prudent : en cas de doute, on suppose un marche qui FERME.
  assert.equal(assetClass("INCONNU"), CLASSES.FOREX);
});

console.log("\n── Week-end : le cas qui a motive ce module ──");

test("samedi, le Forex et les metaux sont fermes", () => {
  // Samedi 17 octobre 2026, 20:07 a Paris = 14:07 a New York.
  const samedi = d("2026-10-17T18:07:00Z");
  assert.equal(marketState("XAUUSD", samedi).ouvert, false);
  assert.equal(marketState("EURUSD", samedi).ouvert, false);
  assert.equal(marketState("NAS100", samedi).ouvert, false);
  assert.match(marketState("XAUUSD", samedi).texte, /week-end/i);
});

test("samedi, le Bitcoin se traite quand meme", () => {
  const samedi = d("2026-10-17T18:07:00Z");
  assert.equal(marketState("BTCUSD", samedi).ouvert, true);
  assert.equal(marketState("SOLUSD", samedi).ouvert, true);
  assert.equal(marketState("XRPUSD", samedi).ouvert, true);
});

test("vendredi avant 17:00 New York : encore ouvert", () => {
  // 20:00 UTC = 16:00 New York en heure d'ete.
  assert.equal(marketState("EURUSD", d("2026-10-16T20:00:00Z")).ouvert, true);
});

test("vendredi apres 17:00 New York : ferme pour le week-end", () => {
  // 22:00 UTC = 18:00 New York.
  const e = marketState("EURUSD", d("2026-10-16T22:00:00Z"));
  assert.equal(e.ouvert, false);
  assert.equal(e.raison, "weekend");
});

test("dimanche avant 17:00 New York : encore ferme", () => {
  // 18:00 UTC = 14:00 New York.
  assert.equal(marketState("EURUSD", d("2026-10-18T18:00:00Z")).ouvert, false);
});

test("dimanche apres 17:00 New York : la semaine reprend", () => {
  // 22:00 UTC = 18:00 New York.
  assert.equal(marketState("EURUSD", d("2026-10-18T22:00:00Z")).ouvert, true);
});

console.log("\n── Heure d'ete : la meme heure UTC ne dit pas la meme chose ──");

test("janvier, 22:00 UTC vendredi est encore 17:00 a New York", () => {
  // En hiver New York est a UTC-5 : 22:00 UTC = 17:00 -> fermeture atteinte.
  const e = marketState("EURUSD", d("2027-01-15T22:00:00Z"));
  assert.equal(e.ouvert, false, "la fermeture doit suivre l'heure locale de New York");
});

test("juillet, 22:00 UTC vendredi est 18:00 a New York : ferme aussi", () => {
  assert.equal(marketState("EURUSD", d("2027-07-16T22:00:00Z")).ouvert, false);
});

test("juillet, 20:00 UTC vendredi est 16:00 a New York : encore ouvert", () => {
  assert.equal(marketState("EURUSD", d("2027-07-16T20:00:00Z")).ouvert, true);
});

test("janvier, 21:00 UTC vendredi est 16:00 a New York : encore ouvert", () => {
  assert.equal(marketState("EURUSD", d("2027-01-15T21:00:00Z")).ouvert, true);
});

console.log("\n── Pause quotidienne ──");

test("mardi 17:30 New York : pause, pas week-end", () => {
  // 21:30 UTC = 17:30 New York en heure d'ete.
  const e = marketState("EURUSD", d("2026-10-13T21:30:00Z"));
  assert.equal(e.ouvert, false);
  assert.equal(e.raison, "pause");
});

test("mardi 18:30 New York : la seance a repris", () => {
  assert.equal(marketState("EURUSD", d("2026-10-13T22:30:00Z")).ouvert, true);
});

test("la crypto ignore la pause quotidienne", () => {
  assert.equal(marketState("BTCUSD", d("2026-10-13T21:30:00Z")).ouvert, true);
});

console.log("\n── Resume d'une liste ──");

const SAMEDI = d("2026-10-17T18:07:00Z");
const MARDI = d("2026-10-13T15:00:00Z");

test("samedi, une liste sans crypto est entierement fermee", () => {
  const r = marketSummary(["XAUUSD", "NAS100", "US30", "EURUSD"], SAMEDI);
  assert.equal(r.ouverts, 0);
  assert.match(r.texte, /week-end/i);
});

test("samedi, une liste avec du Bitcoin n'est pas entierement fermee", () => {
  // Annoncer "tout est ferme" alors que le Bitcoin se traite serait aussi
  // faux que l'inverse.
  const r = marketSummary(["XAUUSD", "NAS100", "BTCUSD"], SAMEDI);
  assert.equal(r.ouverts, 1);
  assert.match(r.texte, /1 marché ouvert sur 3/);
  assert.equal(anyOpen(["XAUUSD", "BTCUSD"], SAMEDI), true);
  assert.equal(anyOpen(["XAUUSD", "NAS100"], SAMEDI), false);
});

test("en semaine, tout est ouvert", () => {
  const r = marketSummary(["XAUUSD", "NAS100", "BTCUSD"], MARDI);
  assert.equal(r.ouverts, 3);
  assert.match(r.texte, /ouverts/i);
});

test("liste vide : aucune exception", () => {
  assert.equal(marketSummary([], SAMEDI).total, 0);
  assert.equal(anyOpen(null, SAMEDI), false);
});

console.log(`\n${passed} test(s) OK, ${failed} echec(s)\n`);
process.exit(failed > 0 ? 1 : 0);
