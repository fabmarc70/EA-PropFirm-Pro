#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// Publie un ou plusieurs fichiers JSON (générés par parse-csv-to-json.js)
// dans le repo public fabmarc70/HISTDATA-, servi ensuite via
// raw.githubusercontent.com (aucune clé, aucune authentification côté
// app — le repo est public, données de marché non sensibles).
//
// Met à jour data/index.json automatiquement (ajoute ou remplace
// l'entrée correspondant à la même paire+période).
//
// Prérequis : Git installé, variable d'environnement GITHUB_TOKEN
// (Personal Access Token, scope "repo" suffisant même si le repo est
// public — nécessaire pour le push en écriture).
//
// Usage :
//   GITHUB_TOKEN=xxx node publish-git.js <fichier1.json> [fichier2.json ...]
//
// Exemple (mise à jour bimensuelle) :
//   GITHUB_TOKEN=xxx node publish-git.js EURUSD_2026-06.json XAUUSD_2026-06.json
// ══════════════════════════════════════════════════════════════════
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const REPO_URL = "https://github.com/fabmarc70/HISTDATA-.git";
const TOKEN = process.env.GITHUB_TOKEN;
const files = process.argv.slice(2);

if (!TOKEN) {
  console.error("Erreur: variable d'environnement GITHUB_TOKEN manquante.");
  process.exit(1);
}
if (files.length === 0) {
  console.error("Usage: GITHUB_TOKEN=xxx node publish-git.js <fichier1.json> [fichier2.json ...]");
  process.exit(1);
}
for (const f of files) {
  if (!fs.existsSync(f)) { console.error("Fichier introuvable:", f); process.exit(1); }
}

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "histdata-publish-"));
const authedUrl = REPO_URL.replace("https://", `https://${TOKEN}@`);

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: "inherit" });
}

console.log("Clonage du repo HISTDATA-...");
run(`git clone ${authedUrl} repo`, workDir);
const repoDir = path.join(workDir, "repo");
run(`git config user.email "publish-script@eapropfirmpro.app"`, repoDir);
run(`git config user.name "Publish Script"`, repoDir);

const dataDir = path.join(repoDir, "data");
fs.mkdirSync(dataDir, { recursive: true });

// Charger (ou initialiser) le manifeste existant
const indexPath = path.join(dataDir, "index.json");
let index = { generatedAt: new Date().toISOString(), datasets: [] };
if (fs.existsSync(indexPath)) {
  try { index = JSON.parse(fs.readFileSync(indexPath, "utf-8")); } catch (e) {}
}
if (!Array.isArray(index.datasets)) index.datasets = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf-8");
  const parsed = JSON.parse(content);
  const { pair, period, count } = parsed;
  const destName = `${pair}_${period}.json`;
  fs.copyFileSync(file, path.join(dataDir, destName));

  // Remplace l'entrée existante (même pair+period) ou en ajoute une nouvelle
  index.datasets = index.datasets.filter(d => !(d.pair === pair && d.period === period));
  index.datasets.push({ pair, period, file: destName, count });
  console.log(`  ✓ ${destName} (${count} bougies)`);
}

index.generatedAt = new Date().toISOString();
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

run(`git add data/`, repoDir);
try {
  run(`git commit -m "data: mise a jour ${files.map(f => path.basename(f)).join(", ")}"`, repoDir);
  run(`git push origin main`, repoDir);
  console.log("\n✓ Publié. L'app relira automatiquement data/index.json (cache CDN ~5 min).");
} catch (e) {
  console.error("Rien à publier (fichiers identiques) ou erreur de push:", e.message);
}

fs.rmSync(workDir, { recursive: true, force: true });
