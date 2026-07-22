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

// Correspondance des symboles vers la nomenclature Twelve Data (qui utilise
// un slash pour les paires). Les indices/matières premières ne sont pas
// forcément inclus dans l'offre gratuite : en cas d'échec, le mois est
// simplement ignoré et signalé, jamais remplacé par une donnée inventée.
// Correspondance minutes -> intervalle Twelve Data
const TD_INTERVAL = { 15: "15min", 30: "30min", 60: "1h", 240: "4h", 1440: "1day" };

const TD_SYMBOL = {
  EURUSD: "EUR/USD", GBPUSD: "GBP/USD", AUDUSD: "AUD/USD", NZDUSD: "NZD/USD",
  USDJPY: "USD/JPY", USDCAD: "USD/CAD", USDCHF: "USD/CHF",
  EURJPY: "EUR/JPY", GBPJPY: "GBP/JPY", AUDJPY: "AUD/JPY", CHFJPY: "CHF/JPY",
  EURGBP: "EUR/GBP", EURCHF: "EUR/CHF",
  XAUUSD: "XAU/USD", XAGUSD: "XAG/USD",
};

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

// ══════════════════════════════════════════════════════════════════
// TÉLÉCHARGEMENT PAR PLAGE DE DATES (multi-mois)
// L'utilisateur choisit une date de début et une date de fin ; on
// détermine les fichiers mensuels nécessaires, on télécharge ceux qui
// ne sont pas déjà en cache, puis on concatène et on coupe aux dates
// exactes demandées.
// ══════════════════════════════════════════════════════════════════

// Liste des clés "YYYY-MM" couvrant la plage (bornes incluses)
export function monthsInRange(startISO, endISO) {
  const out = [];
  const s = new Date(startISO + "T00:00:00Z"), e = new Date(endISO + "T23:59:59Z");
  let y = s.getUTCFullYear(), m = s.getUTCMonth();
  while (y < e.getUTCFullYear() || (y === e.getUTCFullYear() && m <= e.getUTCMonth())) {
    out.push(`${y}-${String(m + 1).padStart(2, "0")}`);
    m++; if (m > 11) { m = 0; y++; }
  }
  return out;
}

// Renvoie { candles, baseMinutes, monthsUsed, monthsMissing, downloadedCount, fromCacheCount }
// targetMinutes = timeframe demandé par l'utilisateur. Pour chaque mois :
//  - si le dépôt a une granularité AU MOINS aussi fine -> on l'utilise (gratuit, sans quota)
//  - sinon -> on demande ce timeframe précis à Twelve Data via le proxy
// Résultat : la finesse demandée est respectée sur toute la plage quand c'est possible,
// au lieu d'être rabaissée au plus grossier disponible.
export async function loadRange(pair, startISO, endISO, { onProgress, targetMinutes = 15 } = {}) {
  const list = await listAvailableDatasets();
  const wanted = monthsInRange(startISO, endISO);
  const available = list.assets.filter(a => a.pair === pair);
  const byPeriod = new Map(available.map(a => [a.period, a]));

  // Le dépôt ne convient que si sa granularité est au moins aussi fine que demandé
  const toLoad = wanted.filter(p => byPeriod.has(p) && (byPeriod.get(p).baseMinutes || 1) <= targetMinutes);
  const missing = wanted.filter(p => !toLoad.includes(p));

  const startTs = new Date(startISO + "T00:00:00Z").getTime();
  const endTs = new Date(endISO + "T23:59:59Z").getTime();

  // GRANULARITÉ MIXTE : selon la période, la source disponible n'a pas la même
  // finesse (M15 sur 2020-2022 et 2026, M30 fin 2025, D1 sur 2024-2025). Mélanger
  // des bougies de granularités différentes dans une même série fausserait tous
  // les indicateurs. On aligne donc TOUT sur la granularité la plus GROSSIÈRE de
  // la plage sélectionnée : les tranches plus fines sont agrégées vers elle.
  const loaded = [];
  let downloaded = 0, cached = 0;

  for (let i = 0; i < toLoad.length; i++) {
    const period = toLoad[i];
    const cacheKey = `${pair}_${period}`;
    const hit = await idbGet(cacheKey);
    let ds;
    if (hit) { ds = hit; cached++; }
    else {
      const asset = byPeriod.get(period);
      const r = await fetch(asset.url);
      if (!r.ok) throw new Error(`Téléchargement échoué pour ${period} (${r.status})`);
      ds = await r.json();
      await idbSet(cacheKey, ds);
      downloaded++;
    }
    loaded.push({ period, base: ds.baseMinutes || 1, candles: ds.candles || [] });
    if (onProgress) onProgress({
      done: i + 1, total: toLoad.length, period,
      pct: Math.round(((i + 1) / toLoad.length) * 100),
      fromCache: !!hit,
    });
  }

  // ── REPLI TWELVE DATA pour les mois absents du dépôt ──
  // Le dépôt GitHub reste la source primaire (gratuite, sans quota). Twelve Data
  // n'est sollicité que pour les mois réellement manquants, via le proxy
  // serverless (la clé API ne transite jamais côté client). Un échec ici n'est
  // pas bloquant : on continue avec ce qu'on a, et on le signale.
  let fromApi = 0;
  const apiFailed = [];
  if (missing.length) {
    for (let i = 0; i < missing.length; i++) {
      const period = missing[i];
      const cacheKey = `${pair}_${period}_tf${targetMinutes}`;
      const hit = await idbGet(cacheKey);
      if (hit) { loaded.push({ period, base: hit.baseMinutes || 1, candles: hit.candles || [] }); cached++; continue; }
      try {
        const tdSymbol = TD_SYMBOL[pair];
        const interval = TD_INTERVAL[targetMinutes] || "15min";
        if (!tdSymbol) { apiFailed.push(period); continue; } // instrument non couvert par l'API
        const [yy, mm] = period.split("-").map(Number);
        const lastDay = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
        const url = `/api/twelvedata?symbol=${encodeURIComponent(tdSymbol)}&interval=${interval}`
          + `&start=${period}-01&end=${period}-${String(lastDay).padStart(2, "0")}`;
        const r = await fetch(url);
        if (!r.ok) { apiFailed.push(period); continue; }
        const j = await r.json();
        const minNeeded = targetMinutes >= 1440 ? 15 : 50;
        if (!j.candles || j.candles.length < minNeeded) { apiFailed.push(period); continue; }
        const ds = { pair, period, interval, baseMinutes: targetMinutes, count: j.candles.length, source: "twelvedata", candles: j.candles };
        await idbSet(cacheKey, ds);
        loaded.push({ period, base: targetMinutes, candles: j.candles });
        fromApi++;
      } catch (e) { apiFailed.push(period); }
      if (onProgress) onProgress({
        done: toLoad.length + i + 1, total: toLoad.length + missing.length, period,
        pct: Math.round(((toLoad.length + i + 1) / (toLoad.length + missing.length)) * 100),
        fromCache: false, fromApi: true,
      });
    }
  }

  if (!loaded.length) throw new Error(`Aucune donnée disponible pour ${pair} sur cette plage.`);

  const baseMinutes = loaded.reduce((mx, d) => Math.max(mx, d.base), 1);
  const mixed = loaded.some(d => d.base !== baseMinutes);

  // Agrégation locale (même logique que backtestEngine.aggregateCandles, dupliquée
  // ici pour garder ce module autonome et sans dépendance croisée)
  const aggTo = (candles, from, to) => {
    const factor = Math.max(1, Math.round(to / from));
    if (factor <= 1) return candles;
    const out = [];
    for (let i = 0; i < candles.length; i += factor) {
      const ch = candles.slice(i, i + factor);
      if (!ch.length) continue;
      out.push([ch[0][0], ch[0][1], Math.max(...ch.map(x => x[2])), Math.min(...ch.map(x => x[3])), ch[ch.length - 1][4]]);
    }
    return out;
  };

  let all = [];
  loaded.sort((a, b) => a.period.localeCompare(b.period));
  loaded.forEach(d => { all = all.concat(d.base === baseMinutes ? d.candles : aggTo(d.candles, d.base, baseMinutes)); });
  all.sort((a, b) => a[0] - b[0]);
  const candles = all.filter(c => c[0] >= startTs && c[0] <= endTs);

  return {
    candles, baseMinutes, mixedGranularity: mixed,
    monthsUsed: loaded.map(d => d.period), monthsMissing: apiFailed,
    downloadedCount: downloaded, fromCacheCount: cached, fromApiCount: fromApi,
  };
}

// Bornes réelles de couverture publiées (pour borner les sélecteurs de date)
export async function getCoverage() {
  const list = await listAvailableDatasets();
  const periods = [...new Set(list.assets.map(a => a.period))].sort();
  if (!periods.length) return null;
  const first = periods[0], last = periods[periods.length - 1];
  const [ly, lm] = last.split("-").map(Number);
  const lastDay = new Date(Date.UTC(ly, lm, 0)).getUTCDate();
  return { min: `${first}-01`, max: `${last}-${String(lastDay).padStart(2, "0")}`, periods };
}
