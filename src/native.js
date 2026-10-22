// ══════════════════════════════════════════════════════════════════
// APP NATIVE (Capacitor iOS / Android) — couche d'adaptation unique
// ------------------------------------------------------------------
// L'app native embarque EXACTEMENT le même build Vite que la PWA (même
// design, mêmes algorithmes). Seules trois briques web n'existent pas dans
// une WebView native et sont remplacées ici par leur équivalent natif :
//   1. Connexion Google / Apple  → src/firebase.js (plugin Firebase Auth)
//   2. Notifications push        → FCM via @capacitor-firebase/messaging
//   3. Partage de fichier        → @capacitor/share
// Côté web (Vercel), isNative est faux : rien ne change, aucun import natif
// n'est exécuté (imports dynamiques uniquement).
// ══════════════════════════════════════════════════════════════════
import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();
export const nativePlatform = Capacitor.getPlatform(); // "ios" | "android" | "web"

// Les routes serverless /api/* vivent sur Vercel. Dans l'app native, la page
// est servie localement (capacitor://localhost, https://localhost) : un
// fetch("/api/...") relatif n'atteindrait jamais le serveur. On préfixe donc
// ces appels vers le domaine de production, sans toucher aux appels dans
// App.jsx. Les en-têtes CORS correspondants sont déclarés dans vercel.json.
export const API_ORIGIN = "https://ea-propfirm-pro.vercel.app";

export function installNativeApiFetch() {
  if (!isNative || typeof window === "undefined" || window.__eapfpFetchPatched) return;
  const origFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === "string" && input.startsWith("/api/")) {
      return origFetch(API_ORIGIN + input, init);
    }
    return origFetch(input, init);
  };
  window.__eapfpFetchPatched = true;
}

// Barre d'état sombre + masquage du splash une fois l'app montée
export async function initNativeShell() {
  if (!isNative) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    if (nativePlatform === "android") await StatusBar.setBackgroundColor({ color: "#080810" });
  } catch (e) {}
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch (e) {}
}

// ── Partage natif d'un fichier (Blob) via la feuille de partage iOS/Android ──
export async function nativeShareBlob(blob, fileName, title) {
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");
  const base64 = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  const written = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
  await Share.share({ title, files: [written.uri] });
}

// ── Notifications locales (rappel quotidien du journal, app ouverte) ──
export async function nativeRequestLocalNotifPermission() {
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const res = await LocalNotifications.requestPermissions();
    return res.display === "granted" ? "granted" : "denied";
  } catch (e) { return "unsupported"; }
}
export async function nativeFireLocalNotification(title, body) {
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.schedule({
      notifications: [{ id: Math.floor(Date.now() % 2147483647), title, body }],
    });
  } catch (e) {}
}

// ── Push natif (FCM) : demande la permission et renvoie le jeton de
// l'appareil. Le serveur (api/_lib/nativePush.js) l'utilise via
// firebase-admin à la place de Web Push. ──
export async function nativeGetPushToken() {
  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
  const perm = await FirebaseMessaging.requestPermissions();
  if (perm.receive !== "granted") return { status: "denied" };
  const { token } = await FirebaseMessaging.getToken();
  if (!token) return { status: "error" };
  return { status: "granted", token };
}
