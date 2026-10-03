// ═══════════════════════════════════════
// TEST DE NOTIFICATIONS — programme 2 notifications espacees de 5 minutes
// pour verifier, APPLICATION FERMEE, que la chaine complete fonctionne
// (abonnement -> serveur -> service worker -> ecran verrouille), sans
// avoir a attendre une vraie annonce economique.
//
// Les notifications ne sont PAS envoyees par cet endpoint : elles sont
// deposees dans Firestore avec une date d'echeance, puis expediees par le
// passage suivant de /api/check-news (declenche toutes les 5 minutes par
// le workflow GitHub Actions .github/workflows/push-runner.yml).
// C'est volontaire : une fonction serverless ne peut pas rester en vie
// 5 minutes pour attendre, et c'est exactement ce chemin-la — celui des
// vraies annonces — que le test doit valider.
// ═══════════════════════════════════════

import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initFirebaseAdmin() {
  if (getApps().length) return getApp();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY manquante côté serveur.");
  const jsonStr = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
  return initializeApp({ credential: cert(JSON.parse(jsonStr)) });
}

export default async function handler(req, res) {
  const uid = (req.query?.uid || req.body?.uid || "").trim();
  if (!uid) return res.status(400).json({ error: "uid manquant." });

  let db;
  try { initFirebaseAdmin(); db = getFirestore(); }
  catch (e) { return res.status(500).json({ error: "Firebase Admin indisponible.", detail: e.message }); }

  // Securite : on ne programme un test que pour un utilisateur qui possede
  // reellement un abonnement push. Evite qu'un uid devine permette de
  // remplir la file.
  const subs = await db.collection("users").doc(uid).collection("pushSubscriptions").limit(1).get();
  if (subs.empty) {
    return res.status(400).json({ error: "Aucun abonnement push pour ce compte. Active d'abord les notifications." });
  }

  const now = Date.now();
  // 2 notifications espacees de 5 min. La 1re est datee dans le passe
  // (now - 1s) pour partir au tout prochain passage du planificateur
  // plutot que d'attendre un cycle complet.
  const planned = [
    { dueAt: now - 1000,         title: "Test 1/2 — notifications actives", body: "Si tu vois ceci application fermée, la chaîne fonctionne. La 2e arrive dans 5 minutes." },
    { dueAt: now + 5 * 60 * 1000, title: "Test 2/2 — 5 minutes plus tard",  body: "Deuxième notification reçue : les annonces économiques t'atteindront de la même façon." },
  ];
  const batch = db.batch();
  planned.forEach(p => {
    const ref = db.collection("scheduledPushes").doc();
    batch.set(ref, { uid, title: p.title, body: p.body, dueAt: p.dueAt, sent: false, createdAt: new Date().toISOString() });
  });
  await batch.commit();

  return res.status(200).json({
    ok: true, scheduled: planned.length,
    message: "2 notifications programmées (immédiate puis +5 min). Ferme l'application.",
  });
}
