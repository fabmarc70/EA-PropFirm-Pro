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

// ══════════════════════════════════════════════════════════════════
// CALENDRIER RÉEL — flux hebdomadaire public de ForexFactory, sans clé
// API : https://nfs.faireconomy.media/ff_calendar_thisweek.json
// Champs utilises : title, country (devise), date (ISO-8601 avec offset
// US/Eastern), impact (High/Medium/Low/Holiday).
//
// REMPLACE les dates CALCULÉES de la version precedente (NFP = 1er
// vendredi, CPI ~ le 13...), qui etaient des approximations : une
// publication decalee par l'institut n'etait pas reflettee. Ici ce sont
// les dates reellement publiees.
//
// LIMITE DE LA SOURCE : le flux ne couvre que la SEMAINE EN COURS. Une
// annonce de la semaine suivante n'apparait qu'une fois la semaine
// entamee — sans consequence ici, puisqu'on ne notifie qu'a 30 minutes
// de l'evenement.
// ══════════════════════════════════════════════════════════════════
const FF_FEED = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

export async function fetchEconEvents(impactMin = "High") {
  const r = await fetch(FF_FEED, { headers: { "User-Agent": "EA-PropFirm-Pro/1.0" } });
  if (!r.ok) throw new Error("Flux calendrier indisponible (HTTP " + r.status + ")");
  const text = await r.text();
  // Le flux renvoie parfois une page HTML (limitation de debit) au lieu du
  // JSON : on le detecte explicitement plutot que de laisser JSON.parse
  // lever une erreur illisible.
  if (!text.trim().startsWith("[")) throw new Error("Flux calendrier : reponse inattendue (HTML ou limitation de debit)");
  const raw = JSON.parse(text);
  const keep = impactMin === "High" ? ["High"] : ["High", "Medium"];
  return raw
    .filter(e => e && e.date && keep.includes(e.impact))
    .map(e => ({ type: e.title, currency: e.country, impact: e.impact, date: new Date(e.date) }))
    .filter(e => !isNaN(e.date.getTime()))
    .sort((a, b) => a.date - b.date);
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
    const label = (ev.currency ? ev.currency + " — " : "") + ev.type;
    const hhmm = ev.date.toISOString().slice(11, 16);
    const key = (ev.currency || "") + "_" + ev.type.replace(/[^A-Za-z0-9]/g, "").slice(0, 40) + "_" + ev.date.toISOString().slice(0, 16);
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
  const report = { testsSent: 0, newsSent: 0, skipped: 0 };

  // ── A) FILE DE NOTIFICATIONS PROGRAMMÉES (test de bout en bout) ──
  // Permet de vérifier que les notifications arrivent application FERMÉE,
  // sans attendre une vraie annonce économique.
  try {
    const dueTests = await db.collection("scheduledPushes")
      .where("sent", "==", false).where("dueAt", "<=", now).limit(50).get();
    for (const doc of dueTests.docs) {
      const d = doc.data();
      report.testsSent += await sendPush(db, d.uid, { title: d.title, body: d.body, tag: "test-push", url: "/" });
      await doc.ref.update({ sent: true, sentAt: new Date().toISOString() });
    }
  } catch (e) { report.testError = e.message; }

  // ── B) ANNONCES ÉCONOMIQUES (calendrier réel) ──
  let due = [];
  try { due = dueNotifications(now, await fetchEconEvents("High")); }
  catch (e) { return res.status(200).json({ ...report, newsError: e.message }); }
  if (!due.length) return res.status(200).json({ ...report, message: "Aucune annonce dans la fenêtre." });

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
  report.newsSent = sentTotal; report.skipped = skipped;
  return res.status(200).json({ ...report, notifications: due.length });
}
