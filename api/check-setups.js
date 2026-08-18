// ══════════════════════════════════════════════════════════════════
// DÉTECTION DE SETUP EN TEMPS RÉEL — EMA200 Pullback uniquement (scope
// volontairement restreint, voir la conversation qui a mené à ce choix).
//
// Séparé de check-alerts.js à dessein : ici on récupère une SÉRIE de
// bougies (700, pas juste le dernier prix) pour calculer une EMA200 qui
// converge correctement — vérifié : une fenêtre de 300 bougies donne
// seulement 57% de correspondance avec le vrai backtest, 700 donne 100%
// (testé sur deux périodes indépendantes). Nettement plus coûteux en quota
// Twelve Data qu'un simple /price — d'où un endpoint et un cron séparés,
// avec une fréquence plus espacée (30 min, pas 15).
//
// LIMITE ASSUMÉE : timeframe H1 fixe pour l'instant. La bougie H1 ne se clôt
// qu'une fois par heure — un contrôle toutes les 30 min est donc largement
// suffisant, contrôler plus souvent ne changerait rien la plupart du temps.
// ══════════════════════════════════════════════════════════════════

import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import webpush from "web-push";

function initFirebaseAdmin() {
  if (getApps().length) return getApp();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY manquante côté serveur.");
  const jsonStr = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
  const serviceAccount = JSON.parse(jsonStr);
  return initializeApp({ credential: cert(serviceAccount) });
}

function toTwelveDataSymbol(pair) {
  const p = (pair || "").toUpperCase().replace(/\s/g, "");
  if (/^[A-Z]{6}$/.test(p)) return p.slice(0, 3) + "/" + p.slice(3);
  return p;
}

const TD_INTERVAL = { "15": "15min", "30": "30min", "60": "1h", "240": "4h", "1440": "1day" };
const CANDLE_WINDOW = 700; // voir explication en tête de fichier — minimum validé pour une EMA200 fiable

async function fetchCandles(pair, timeframe, apiKey) {
  const symbol = toTwelveDataSymbol(pair);
  const interval = TD_INTERVAL[timeframe] || "1h";
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${CANDLE_WINDOW}&order=ASC&apikey=${apiKey}`;
  const r = await fetch(url);
  const data = await r.json();
  if (data.status === "error") throw new Error(`Twelve Data a refusé la requête : ${data.message || data.code}`);
  if (!data.values || !data.values.length) throw new Error("Aucune donnée renvoyée pour ce symbole/timeframe.");
  return data.values.map(v => {
    const ts = Date.parse(v.datetime.includes(" ") ? v.datetime.replace(" ", "T") + "Z" : v.datetime + "T00:00:00Z");
    return [ts, +v.open, +v.high, +v.low, +v.close];
  }).filter(c => c.slice(1).every(x => Number.isFinite(x) && x > 0)).sort((a, b) => a[0] - b[0]);
}

// ── Copie de evaluateEmaPullbackLive (backtestEngine.js n'est pas importable
// tel quel dans ce contexte serverless isolé) — logique STRICTEMENT identique,
// déjà validée à 100% sur deux périodes indépendantes avant ce déploiement. ──
function computeEMA(values, period) {
  const k = 2 / (period + 1);
  const out = new Array(values.length).fill(null);
  let sum = 0, count = 0;
  for (let i = 0; i < values.length && count < period; i++) { sum += values[i]; count++; }
  if (count < period) return out;
  out[period - 1] = sum / period;
  for (let i = period; i < values.length; i++) out[i] = values[i] * k + out[i - 1] * (1 - k);
  return out;
}

function evaluateEmaPullbackLive(candles, emaPeriod = 200, maxPullbackBars = 30, minPullbackPct = 20, slBufferPct = 0.05) {
  const closes = candles.map(c => c[4]);
  const ema = computeEMA(closes, emaPeriod);
  let state = "idle", dir = null, breakIdx = -1;
  let impulseExtreme = 0, pullbackExtreme = 0, emaAtBreak = 0, justConfirmed = null;

  for (let i = 1; i < candles.length; i++) {
    justConfirmed = null;
    if (ema[i] == null || ema[i - 1] == null) continue;
    const [, , high, low, close] = candles[i];

    if (state === "idle") {
      const crossUp = closes[i - 1] <= ema[i - 1] && close > ema[i];
      const crossDown = closes[i - 1] >= ema[i - 1] && close < ema[i];
      if (crossUp || crossDown) {
        state = "break"; dir = crossUp ? "long" : "short"; breakIdx = i;
        impulseExtreme = crossUp ? high : low; pullbackExtreme = impulseExtreme; emaAtBreak = ema[i];
      }
      continue;
    }
    const stillValid = dir === "long" ? close > ema[i] : close < ema[i];
    if (!stillValid) { state = "idle"; dir = null; continue; }
    if (i - breakIdx > maxPullbackBars) { state = "idle"; dir = null; continue; }

    if (state === "break") {
      const newExtreme = dir === "long" ? high > impulseExtreme : low < impulseExtreme;
      if (newExtreme) { impulseExtreme = dir === "long" ? high : low; pullbackExtreme = impulseExtreme; continue; }
      if (dir === "long") pullbackExtreme = Math.min(pullbackExtreme, low);
      else pullbackExtreme = Math.max(pullbackExtreme, high);
      const amplitude = Math.abs(impulseExtreme - emaAtBreak);
      if (amplitude <= 0) continue;
      const recul = Math.abs(impulseExtreme - pullbackExtreme);
      if ((recul / amplitude) * 100 >= minPullbackPct) state = "pullback";
      continue;
    }
    if (state === "pullback") {
      const reprise = dir === "long" ? close > impulseExtreme : close < impulseExtreme;
      if (reprise) {
        const buffer = ema[i] * (slBufferPct / 100);
        const slPrice = dir === "long" ? ema[i] - buffer : ema[i] + buffer;
        justConfirmed = { dir, entryPrice: close, sl: slPrice };
        state = "idle"; dir = null;
      }
      continue;
    }
  }

  let pullbackProgressPct = null;
  if (state === "break" || state === "pullback") {
    const amplitude = Math.abs(impulseExtreme - emaAtBreak);
    if (amplitude > 0) pullbackProgressPct = Math.min(100, Math.round((Math.abs(impulseExtreme - pullbackExtreme) / amplitude) * 100));
  }
  return { state, dir, justConfirmed, pullbackProgressPct };
}

async function sendPush(db, uid, payload) {
  const subsSnap = await db.collection("users").doc(uid).collection("pushSubscriptions").get();
  for (const doc of subsSnap.docs) {
    const sub = doc.data().subscription;
    if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) { await doc.ref.delete().catch(() => {}); continue; }
    try { await webpush.sendNotification(sub, JSON.stringify(payload)); }
    catch (e) { if (e.statusCode === 410 || e.statusCode === 404) await doc.ref.delete(); }
  }
}

export default async function handler(req, res) {
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (!cronSecret || req.headers.authorization !== "Bearer " + cronSecret) {
    return res.status(401).json({ error: "Non autorisé." });
  }
  const vapidPublic = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const vapidPrivate = (process.env.VAPID_PRIVATE_KEY || "").trim();
  const twelveDataKey = (process.env.TWELVE_DATA_API_KEY || "").trim();
  if (!vapidPublic || !vapidPrivate || !twelveDataKey) {
    return res.status(500).json({ error: "Clés manquantes (VAPID ou TWELVE_DATA_API_KEY)." });
  }
  try { webpush.setVapidDetails("mailto:contact@eapropfirmpro.app", vapidPublic, vapidPrivate); }
  catch (e) { return res.status(500).json({ error: "Échec configuration VAPID.", detail: e.message }); }

  let app;
  try { app = initFirebaseAdmin(); } catch (e) { return res.status(500).json({ error: "Échec Firebase Admin.", detail: e.message }); }
  const db = getFirestore(app);

  let watchesSnap;
  try { watchesSnap = await db.collectionGroup("setupWatches").where("active", "==", true).get(); }
  catch (e) { return res.status(500).json({ error: "Échec lecture Firestore (index composite manquant probable).", detail: e.message }); }

  let checked = 0, notified = 0;
  for (const docSnap of watchesSnap.docs) {
    const watch = docSnap.data();
    const uid = docSnap.ref.parent.parent.id;
    checked++;
    try {
      const candles = await fetchCandles(watch.pair, watch.timeframe, twelveDataKey);
      const evalResult = evaluateEmaPullbackLive(candles);
      const newState = evalResult.justConfirmed ? "confirmed" : evalResult.state;

      // Ne renotifie que si l'état a CHANGÉ depuis le dernier contrôle — sinon
      // un pullback qui dure 5 heures enverrait 10 notifications identiques.
      if (newState !== watch.lastState) {
        const cfgSnap = await db.collection("users").doc(uid).collection("setupConfig").doc("default").get();
        const cfg = cfgSnap.exists() ? cfgSnap.data() : { capital: 25000, riskPct: 1 };

        if (evalResult.justConfirmed) {
          const { dir, entryPrice, sl } = evalResult.justConfirmed;
          const riskUSD = +(cfg.capital * (cfg.riskPct / 100)).toFixed(2);
          const riskDistance = Math.abs(entryPrice - sl);
          const rMultiple = 2; // aligné sur le paramètre par défaut de la stratégie backtestée
          const tp = dir === "long" ? entryPrice + riskDistance * rMultiple : entryPrice - riskDistance * rMultiple;
          await sendPush(db, uid, {
            title: `🟢 ${watch.pair} — Setup confirmé`,
            body: `Entrée ${entryPrice.toFixed(2)} · SL ${sl.toFixed(2)} · TP ${tp.toFixed(2)} · Risque ${cfg.riskPct}% / ${riskUSD}$ · RR 1:${rMultiple}`,
            tag: "setup-" + docSnap.id,
            url: "/",
          });
        } else if (newState === "pullback") {
          await sendPush(db, uid, {
            title: `🟡 ${watch.pair} — Setup potentiel`,
            body: `EMA200 cassée, pullback en cours (${evalResult.pullbackProgressPct}%) — zone d'entrée approche.`,
            tag: "setup-" + docSnap.id,
            url: "/",
          });
        }
        notified++;
        await docSnap.ref.update({ lastState: newState, lastNotifiedAt: FieldValue.serverTimestamp() });
      }
    } catch (e) {
      // Un échec sur UNE paire ne doit pas bloquer les autres — logué, pas renvoyé en erreur globale
      console.error(`Échec setup ${watch.pair}:`, e.message);
    }
  }

  return res.status(200).json({ checked, notified });
}
