// ══════════════════════════════════════════════════════════════════
// Récupération des données historiques (bougies M1) publiées sur le
// repo public fabmarc70/HISTDATA- + cache local IndexedDB.
//
// Architecture : fichiers servis directement via raw.githubusercontent.com
// (repo PUBLIC, aucune clé, aucune authentification, aucun quota par
// utilisateur). Fab republie de nouvelles périodes à volonté par un
// simple commit git — l'app relit toujours automatiquement le manifeste
// data/index.json de la branche main.
//
// (Remplace l'approche initiale par GitHub Releases : même principe de
// lien permanent, mais sans dépendance à l'endpoint uploads.github.com
// et sans gestion de tags — un simple `git push` suffit à tout mettre à jour.)
// ══════════════════════════════════════════════════════════════════

const REPO_RAW_BASE = "https://raw.githubusercontent.com/fabmarc70/HISTDATA-/main/data";
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

// ── Manifeste (liste des jeux de données disponibles) ──
let manifestCache = null; // évite de re-fetch dans la même session
export async function listAvailableDatasets(forceRefresh = false) {
  if (manifestCache && !forceRefresh) return manifestCache;
  // cache-busting léger : raw.githubusercontent.com cache ~5min côté CDN,
  // un paramètre "t" horaire suffit à éviter de rester bloqué sur du très périmé
  const bust = Math.floor(Date.now() / (5 * 60 * 1000));
  const r = await fetch(`${REPO_RAW_BASE}/index.json?t=${bust}`);
  if (!r.ok) {
    throw new Error(
      r.status === 404
        ? "Aucune donnée publiée pour le moment (repo vide ou index.json absent)."
        : "Erreur de connexion (" + r.status + ")"
    );
  }
  const data = await r.json();
  manifestCache = {
    generatedAt: data.generatedAt,
    note: data.note,
    assets: (data.datasets || []).map(d => ({
      pair: d.pair,
      period: d.period,
      file: d.file,
      count: d.count,
      baseMinutes: d.baseMinutes || 1, // granularité native du dataset (M15 pour la source actuelle)
      url: `${REPO_RAW_BASE}/${d.file}`,
    })),
  };
  return manifestCache;
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

// Réinitialisation totale (supprime toute la base IndexedDB des données historiques mises en cache)
export async function clearAllCachedData() {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve(true);
    req.onerror = () => resolve(false);
    req.onblocked = () => resolve(false);
  });
}
