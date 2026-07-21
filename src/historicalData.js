// ══════════════════════════════════════════════════════════════════
// Récupération des données historiques (bougies M1) publiées sur
// GitHub Releases (repo fabmarc70/HISTDATA-) + cache local IndexedDB.
//
// Aucune clé API, aucun quota par utilisateur : les fichiers sont
// servis directement par le CDN GitHub. Fab republie de nouvelles
// périodes à volonté (script scripts/histdata/publish-release.js) —
// l'app relit toujours automatiquement la DERNIÈRE release.
// ══════════════════════════════════════════════════════════════════

const REPO = "fabmarc70/HISTDATA-";
const DB_NAME = "eapropfirm_histdata";
const DB_VERSION = 1;
const STORE = "candles";

// ── IndexedDB minimal (pas de dépendance externe) ──
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" }); // key = "PAIR_PERIOD"
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ key, ...value, cachedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbListCached() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ── Métadonnées de la dernière release (liste des fichiers dispo) ──
let releaseCache = null; // évite de re-fetch l'API GitHub à chaque appel dans la même session
export async function listAvailableDatasets(forceRefresh = false) {
  if (releaseCache && !forceRefresh) return releaseCache;
  const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!r.ok) {
    throw new Error(
      r.status === 404
        ? "Aucune donnée publiée pour le moment (repo vide ou release non créée)."
        : "Erreur GitHub (" + r.status + ")"
    );
  }
  const data = await r.json();
  const assets = (data.assets || [])
    .filter(a => a.name.endsWith(".json"))
    .map(a => {
      // Nom attendu: "EURUSD_2024-06.json" -> pair="EURUSD", period="2024-06"
      const m = a.name.replace(/\.json$/, "").match(/^([A-Z]+)_(.+)$/);
      return {
        name: a.name,
        pair: m ? m[1] : a.name,
        period: m ? m[2] : "",
        url: a.browser_download_url,
        sizeBytes: a.size,
        updatedAt: a.updated_at,
      };
    });
  releaseCache = { tag: data.tag_name, publishedAt: data.published_at, assets };
  return releaseCache;
}

// ── Téléchargement + cache d'un dataset précis (pair + period) ──
export async function downloadCandles(pair, period, { onProgress } = {}) {
  const cacheKey = `${pair}_${period}`;
  const cached = await idbGet(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const list = await listAvailableDatasets();
  const found = list.assets.find(a => a.pair === pair && a.period === period);
  if (!found) throw new Error(`Aucune donnée trouvée pour ${pair} / ${period}.`);

  const r = await fetch(found.url);
  if (!r.ok) throw new Error("Téléchargement échoué (" + r.status + ")");
  const total = parseInt(r.headers.get("content-length") || "0", 10);

  // Lecture en streaming pour remonter une progression (utile sur mobile/4G)
  let json;
  if (r.body && r.body.getReader && total) {
    const reader = r.body.getReader();
    let received = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (onProgress) onProgress(Math.min(99, Math.round((received / total) * 100)));
    }
    const blob = new Blob(chunks);
    json = JSON.parse(await blob.text());
  } else {
    json = await r.json();
  }
  if (onProgress) onProgress(100);

  await idbSet(cacheKey, json);
  return { ...json, fromCache: false };
}

export async function clearCachedDataset(pair, period) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(`${pair}_${period}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
