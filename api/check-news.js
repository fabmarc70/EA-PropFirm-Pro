// ═══════════════════════════════════════
// CRON ANNONCES ÉCONOMIQUES — envoie une notification push 30 minutes
// AVANT une annonce à fort impact, puis une seconde 30 minutes APRÈS
// pour signaler la fin de la fenêtre de volatilité.
//
// Tourne côté serveur : fonctionne app complètement fermée, contrairement
// à une minuterie côté client qui s'arrête dès que l'onglet se ferme.
//
// LIMITE À CONNAÎTRE : les dates des annonces sont CALCULÉES selon les
// règles habituelles (NFP = 1er vendredi, CPI ≈ le 13, etc.), exactement
// comme le bandeau affiché dans l'app. Ce n'est PAS un calendrier
// économique officiel : une publication décalée par l'institut ne sera
// pas reflétée. C'est un rappel de prudence, pas une source de vérité.
// ═══════════════════════════════════════

import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import webpush from "web-push";

function initFirebaseAdmin() {
  if (getApps().length) return getApp();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY manquante côté serveur.");
  const jsonStr = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
  let serviceAccount;
  try { serviceAccount = JSON.parse(jsonStr); }
  catch (e) { throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY illisible : " + e.message); }
  return initializeApp({ credential: cert(serviceAccount) });
}

// Libellés alignés sur ceux du bandeau de l'app
const LABELS = {
  NFP: "NFP (Non-Farm Payrolls)", CPI: "CPI (Inflation)", FOMC: "FOMC (Fed)",
  RATE: "Taux directeurs", PMI: "PMI", GDP: "PIB",
};

// MÊMES RÈGLES que generateUpcomingEconEvents côté client (App.jsx) : si
// l'une change là-bas, elle doit changer ici — sinon l'app annoncerait une
// date et la notification une autre. Toutes les heures sont en UTC.
export function generateEconEvents(fromDate, monthsAhead = 2) {
  const events = [];
  const d0 = new Date(fromDate);
  const U = (y, m, d, h, mi) => new Date(Date.UTC(y, m, d, h, mi));
  for (let m = 0; m <= monthsAhead; m++) {
    const y = d0.getUTCFullYear(), mo = d0.getUTCMonth() + m;
    // NFP : 1er vendredi, 13:30 UTC
    const ref = new Date(Date.UTC(y, mo, 1));
    while (ref.getUTCDay() !== 5) ref.setUTCDate(ref.getUTCDate() + 1);
    events.push({ type: "NFP", date: U(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate(), 13, 30) });
    // CPI : ~13 du mois, 13:30 UTC
    events.push({ type: "CPI", date: U(y, mo, 13, 13, 30) });
    // FOMC : mois pairs, ~19, 19:00 UTC
    if (((mo % 12) + 12) % 12 % 2 === 0) events.push({ type: "FOMC", date: U(y, mo, 19, 19, 0) });
    // Taux directeurs : mois impairs, ~14, 13:00 UTC
    if (((mo % 12) + 12) % 12 % 2 === 1) events.push({ type: "RATE", date: U(y, mo, 14, 13, 0) });
    // PMI : 1er jour ouvré, 9:00 UTC
    const p = new Date(Date.UTC(y, mo, 1));
    while (p.getUTCDay() === 0 || p.getUTCDay() === 6) p.setUTCDate(p.getUTCDate() + 1);
    events.push({ type: "PMI", date: U(p.getUTCFullYear(), p.getUTCMonth(), p.getUTCDate(), 9, 0) });
    // PIB : trimestriel, ~28, 13:30 UTC
    if ((mo + 1) % 3 === 0) events.push({ type: "GDP", date: U(y, mo, 28, 13, 30) });
  }
  return events.sort((a, b) => a.date - b.date);
}

// Sélectionne les notifications à envoyer MAINTENANT.
// windowMin = demi-largeur de la fenêtre de déclenchement : le cron ne tourne
// pas à la seconde près, on accepte donc un écart. Elle doit être au moins
// égale à la moitié de l'intervalle du cron, sinon une annonce peut passer
// entre deux exécutions et n'être jamais notifiée.
export function dueNotifications(now, events, windowMin = 8) {
  const out = [];
  const W = windowMin * 60000;
  events.forEach(ev => {
    const before = ev.date.getTime() - 30 * 60000;   // 30 min avant
    const after = ev.date.getTime() + 30 * 60000;    // 30 min après
    const label = LABELS[ev.type] || ev.type;
    const hhmm = ev.date.toISOString().slice(11, 16);
    const key = ev.type + "_" + ev.date.toISOString().slice(0, 16);
    if (Math.abs(now - before) <= W) {
      out.push({ key: key + "_pre", title: label + " dans 30 min",
        body: `Annonce à ${hhmm} UTC. Volatilité attendue — prudence sur les positions ouvertes.`, tag: "econ-news" });
    }
    if (Math.abs(now - after) <= W) {
      out.push({ key: key + "_post", title: label + " — fenêtre terminée",
        body: "30 min écoulées depuis l'annonce. Conditions de marché qui se normalisent.", tag: "econ-news" });
    }
  });
  return out;
}

async function sendPush(db, uid, payload) {
  const subsSnap = await db.collection("users").doc(uid).collection("pushSubscriptions").get();
  let sent = 0;
  for (const doc of subsSnap.docs) {
    const sub = doc.data().subscription;
    if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
      await doc.ref.delete().catch(() => {}); continue;
    }
    try { await webpush.sendNotification(sub, JSON.stringify(payload)); sent++; }
    catch (e) { if (e.statusCode === 410 || e.statusCode === 404) await doc.ref.delete().catch(() => {}); }
  }
  return sent;
}

// FREQUENCE D'APPEL — point important.
// Le plan Hobby de Vercel n'autorise qu'UNE execution de cron par jour
// (erreur cron_jobs_limits_reached au deploiement si on demande plus).
// Le cron declare dans vercel.json ne sert donc que de filet quotidien :
// avec une seule execution par jour, SEULES les annonces qui tombent dans
// la fenetre de cette execution sont notifiees.
// Pour une couverture reelle, cet endpoint doit etre appele toutes les
// ~15 minutes par un planificateur externe (cron-job.org, UptimeRobot...)
// OU le projet doit passer en plan Pro et le cron repasser a "*/15 * * * *".
//
// PROTECTION : l'endpoint envoie des notifications a TOUS les utilisateurs
// abonnes. Des lors qu'il est appelable depuis l'exterieur, il doit etre
// protege. Si CRON_SECRET est definie cote serveur, l'appel doit porter
// ?key=<secret> (ou l'en-tete x-cron-key). Les crons Vercel internes
// passent sans cle grace a leur en-tete d'authentification dedie.
export default async function handler(req, res) {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (secret) {
    const provided = (req.query && req.query.key) || req.headers["x-cron-key"] || "";
    const isVercelCron = !!req.headers["x-vercel-cron"];
    if (!isVercelCron && provided !== secret) {
      return res.status(401).json({ error: "Non autorise." });
    }
  }

  const vapidPublic = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const vapidPrivate = (process.env.VAPID_PRIVATE_KEY || "").trim();
  if (!vapidPublic || !vapidPrivate) return res.status(500).json({ error: "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY manquantes." });
  try { webpush.setVapidDetails("mailto:fab@eapropfirmpro.app", vapidPublic, vapidPrivate); }
  catch (e) { return res.status(500).json({ error: "Échec de configuration VAPID.", detail: e.message }); }

  let db;
  try { initFirebaseAdmin(); db = getFirestore(); }
  catch (e) { return res.status(500).json({ error: "Firebase Admin indisponible.", detail: e.message }); }

  const now = Date.now();
  const due = dueNotifications(now, generateEconEvents(new Date(now), 1));
  if (!due.length) return res.status(200).json({ sent: 0, message: "Aucune annonce dans la fenêtre." });

  // Déduplication GLOBALE : la même annonce concerne tous les utilisateurs, et
  // le cron peut repasser dans la fenêtre. Un document marqueur par
  // (événement + phase) garantit un envoi unique, même si le cron tourne deux
  // fois pendant la fenêtre.
  let sentTotal = 0, skipped = 0;
  for (const n of due) {
    const marker = db.collection("systemNotifications").doc(n.key);
    const snap = await marker.get();
    if (snap.exists) { skipped++; continue; }
    await marker.set({ sentAt: new Date().toISOString(), title: n.title });

    const subsSnap = await db.collectionGroup("pushSubscriptions").get();
    const uids = new Set();
    subsSnap.docs.forEach(d => { const u = d.ref.parent.parent; if (u) uids.add(u.id); });
    for (const uid of uids) {
      sentTotal += await sendPush(db, uid, { title: n.title, body: n.body, tag: n.tag, url: "/" });
    }
  }
  return res.status(200).json({ sent: sentTotal, notifications: due.length, skipped });
}
