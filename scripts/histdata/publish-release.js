#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════
// Publie un ou plusieurs fichiers JSON (générés par parse-csv-to-json.js)
// sur une Release GitHub du repo fabmarc70/HISTDATA- .
//
// - Si la release (tag) n'existe pas encore, elle est créée.
// - Si un asset du même nom existe déjà sur cette release, il est
//   remplacé (supprimé puis re-uploadé) — permet de mettre à jour
//   une période déjà publiée sans dupliquer.
//
// Prérequis : variable d'environnement GITHUB_TOKEN (un Personal
// Access Token avec le scope "repo", car le repo est privé).
//
// Usage :
//   GITHUB_TOKEN=xxx node publish-release.js <tag> <fichier1.json> [fichier2.json ...]
//
// Exemple (mise à jour bimensuelle) :
//   GITHUB_TOKEN=xxx node publish-release.js data-2026-07 \
//     EURUSD_2026-06.json XAUUSD_2026-06.json GBPUSD_2026-06.json
//
// Convention de tag recommandée : "data-YYYY-MM" = mois de publication.
// Tous les fichiers de paires/périodes disponibles peuvent être attachés
// à la MÊME release au fil des mises à jour (une release "vivante"),
// ou tu peux créer une nouvelle release à chaque fois — au choix.
// L'app lit toujours la DERNIÈRE release publiée (releases/latest).
// ══════════════════════════════════════════════════════════════════
const fs = require("fs");
const path = require("path");
const https = require("https");

const REPO = "fabmarc70/HISTDATA-";
const TOKEN = process.env.GITHUB_TOKEN;

const [, , tag, ...files] = process.argv;

if (!TOKEN) {
  console.error("Erreur: variable d'environnement GITHUB_TOKEN manquante.");
  console.error("Usage: GITHUB_TOKEN=xxx node publish-release.js <tag> <fichier1.json> [...]");
  process.exit(1);
}
if (!tag || files.length === 0) {
  console.error("Usage: GITHUB_TOKEN=xxx node publish-release.js <tag> <fichier1.json> [fichier2.json ...]");
  process.exit(1);
}
for (const f of files) {
  if (!fs.existsSync(f)) { console.error("Fichier introuvable:", f); process.exit(1); }
}

function apiRequest(method, urlPath, body, host = "api.github.com") {
  return new Promise((resolve, reject) => {
    const data = body ? (typeof body === "string" ? body : JSON.stringify(body)) : null;
    const req = https.request({
      hostname: host,
      path: urlPath,
      method,
      headers: {
        "Authorization": `token ${TOKEN}`,
        "Accept": "application/vnd.github+json",
        "User-Agent": "histdata-publish-script",
        ...(data ? { "Content-Type": typeof body === "string" ? "application/octet-stream" : "application/json", "Content-Length": Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf-8");
        let parsed = null;
        try { parsed = raw ? JSON.parse(raw) : null; } catch (e) { parsed = raw; }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
        else reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getOrCreateRelease(tagName) {
  try {
    const rel = await apiRequest("GET", `/repos/${REPO}/releases/tags/${encodeURIComponent(tagName)}`);
    console.log(`Release existante trouvée: ${tagName} (id ${rel.id})`);
    return rel;
  } catch (e) {
    console.log(`Aucune release "${tagName}" existante — création...`);
    const rel = await apiRequest("POST", `/repos/${REPO}/releases`, {
      tag_name: tagName,
      name: `Données historiques — ${tagName}`,
      body: "Historique de bougies M1 (HistData.com), converti et publié pour le module Backtest de EA-PropFirm-Pro.",
      draft: false,
      prerelease: false,
    });
    console.log(`Release créée (id ${rel.id})`);
    return rel;
  }
}

async function removeExistingAsset(releaseId, assetName) {
  const assets = await apiRequest("GET", `/repos/${REPO}/releases/${releaseId}/assets`);
  const existing = assets.find(a => a.name === assetName);
  if (existing) {
    console.log(`  Asset "${assetName}" déjà présent — suppression avant remplacement...`);
    await apiRequest("DELETE", `/repos/${REPO}/releases/assets/${existing.id}`);
  }
}

function uploadAsset(releaseId, filePath) {
  return new Promise((resolve, reject) => {
    const name = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    const req = https.request({
      hostname: "uploads.github.com",
      path: `/repos/${REPO}/releases/${releaseId}/assets?name=${encodeURIComponent(name)}`,
      method: "POST",
      headers: {
        "Authorization": `token ${TOKEN}`,
        "Content-Type": "application/json",
        "Content-Length": fileData.length,
        "User-Agent": "histdata-publish-script",
      },
    }, (res) => {
      let chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf-8");
        const parsed = JSON.parse(raw);
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
        else reject(new Error(`Upload échoué (${res.statusCode}): ${raw}`));
      });
    });
    req.on("error", reject);
    req.write(fileData);
    req.end();
  });
}

(async () => {
  try {
    const release = await getOrCreateRelease(tag);
    for (const file of files) {
      const name = path.basename(file);
      console.log(`Publication de ${name}...`);
      await removeExistingAsset(release.id, name);
      const asset = await uploadAsset(release.id, file);
      console.log(`  ✓ Publié: ${asset.browser_download_url}`);
    }
    console.log("\n✓ Terminé. L'app ira chercher ces fichiers automatiquement via releases/latest.");
  } catch (e) {
    console.error("Erreur:", e.message);
    process.exit(1);
  }
})();
