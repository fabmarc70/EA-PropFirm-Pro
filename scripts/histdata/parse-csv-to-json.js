#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// Convertit un CSV HistData.com (format ASCII M1) en JSON compact,
// prêt à être publié sur GitHub Releases via publish-release.js.
//
// Format d'entrée attendu (HistData.com, "1-minute bar quotes", ASCII) :
//   YYYYMMDD HHMMSS;OPEN;HIGH;LOW;CLOSE;VOLUME
//   20240701 000000;1.08496;1.08501;1.08490;1.08498;0
//
// Usage :
//   node parse-csv-to-json.js <fichier.csv> <PAIR> <PERIOD> [sortie.json]
//   node parse-csv-to-json.js DAT_ASCII_EURUSD_M1_202406.csv EURUSD 2024-06
//
// PAIR   : ex. EURUSD, XAUUSD, GBPUSD, USDJPY (majuscules, sans slash)
// PERIOD : ex. 2024-06 (année-mois)
// ══════════════════════════════════════════════════════════════════
const fs = require("fs");
const path = require("path");

const [, , inputFile, pair, period, outputArg] = process.argv;

if (!inputFile || !pair || !period) {
  console.error("Usage: node parse-csv-to-json.js <fichier.csv> <PAIR> <PERIOD> [sortie.json]");
  console.error("Exemple: node parse-csv-to-json.js DAT_ASCII_EURUSD_M1_202406.csv EURUSD 2024-06");
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error("Fichier introuvable:", inputFile);
  process.exit(1);
}

const outputFile = outputArg || `${pair.toUpperCase()}_${period}.json`;

console.log("Lecture de", inputFile, "...");
const raw = fs.readFileSync(inputFile, "utf-8");
const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);

const candles = [];
let skipped = 0;

for (const line of lines) {
  // Certains exports HistData utilisent ";" comme séparateur, d'autres "," — on gère les deux
  const sep = line.includes(";") ? ";" : ",";
  const parts = line.split(sep);
  if (parts.length < 5) { skipped++; continue; }

  const [dt, o, h, l, c] = parts;
  // dt attendu: "YYYYMMDD HHMMSS" — certains formats utilisent "YYYYMMDD HHMMSS" avec espace,
  // d'autres "YYYYMMDDHHMMSS" collé. On gère les deux.
  let y, mo, d, hh, mi, ss;
  if (dt.includes(" ")) {
    const [datePart, timePart] = dt.split(" ");
    y = datePart.slice(0, 4); mo = datePart.slice(4, 6); d = datePart.slice(6, 8);
    hh = timePart.slice(0, 2); mi = timePart.slice(2, 4); ss = timePart.slice(4, 6) || "00";
  } else {
    y = dt.slice(0, 4); mo = dt.slice(4, 6); d = dt.slice(6, 8);
    hh = dt.slice(8, 10); mi = dt.slice(10, 12); ss = dt.slice(12, 14) || "00";
  }
  const ts = Date.UTC(+y, +mo - 1, +d, +hh, +mi, +ss);
  if (isNaN(ts)) { skipped++; continue; }

  const open = parseFloat(o), high = parseFloat(h), low = parseFloat(l), close = parseFloat(c);
  if ([open, high, low, close].some(v => isNaN(v))) { skipped++; continue; }

  candles.push([ts, open, high, low, close]);
}

candles.sort((a, b) => a[0] - b[0]); // ordre chronologique garanti

const out = {
  pair: pair.toUpperCase(),
  period,
  interval: "1min",
  count: candles.length,
  generatedAt: new Date().toISOString(),
  candles,
};

fs.writeFileSync(outputFile, JSON.stringify(out));
const sizeMB = (fs.statSync(outputFile).size / (1024 * 1024)).toFixed(2);

console.log(`✓ ${candles.length} bougies converties (${skipped} lignes ignorées/invalides)`);
console.log(`✓ Fichier écrit: ${outputFile} (${sizeMB} Mo)`);
console.log(`  Période couverte: ${new Date(candles[0]?.[0]).toISOString()} → ${new Date(candles[candles.length - 1]?.[0]).toISOString()}`);
