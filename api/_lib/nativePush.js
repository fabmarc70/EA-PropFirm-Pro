// ══════════════════════════════════════════════════════════════════
// PUSH NATIF (app iOS / Android) — envoi via Firebase Cloud Messaging.
// Les jetons FCM sont rangés dans users/{uid}/pushSubscriptions comme les
// abonnements Web Push, avec un champ fcmToken (voir
// fbSaveNativePushToken dans src/firebase.js). Les boucles sendPush des
// crons appellent cette fonction pour ces documents, Web Push sinon.
// Retourne true si envoyé ; supprime le document si le jeton est périmé.
// ══════════════════════════════════════════════════════════════════
import { getMessaging } from "firebase-admin/messaging";

const DEAD_TOKEN_CODES = [
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
];

export async function sendNativePush(doc, payload) {
  const token = doc.data().fcmToken;
  try {
    await getMessaging().send({
      token,
      notification: { title: payload.title || "EA PropFirm Pro", body: payload.body || "" },
      data: { url: String(payload.url || "/"), tag: String(payload.tag || "") },
      android: { notification: { tag: payload.tag || undefined, color: "#6ee7b7" } },
      apns: { payload: { aps: { sound: "default" } } },
    });
    return true;
  } catch (e) {
    if (DEAD_TOKEN_CODES.includes(e && e.code)) await doc.ref.delete().catch(() => {});
    return false;
  }
}
