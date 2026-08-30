// ══════════════════════════════════════════════════════════════════
// FIREBASE — Auth + sauvegarde cloud du profil ET du journal de trading
// (voir fbSaveJournalData/fbLoadJournalData plus bas, ajoutés le 30/08/2026
// après une perte de données réelle : avant cette date, SEUL le profil
// était sauvegardé sur Firestore, le journal restait uniquement en
// localStorage). Configs de simulation et fichiers restent en localStorage
// (données reproductibles/non critiques, pas de risque de perte réelle).
// ══════════════════════════════════════════════════════════════════
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  deleteUser,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, addDoc, getDocs, updateDoc, query, where, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCYqMoWp-3BpU_yJZALoioSbTf1zb7HL3g",
  authDomain: "propfirmpro-ffbd0.firebaseapp.com",
  projectId: "propfirmpro-ffbd0",
  storageBucket: "propfirmpro-ffbd0.firebasestorage.app",
  messagingSenderId: "347644770866",
  appId: "1:347644770866:web:7c018710f2ca36f4221a2b",
  measurementId: "G-749EWFBMVB",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics : chargé en différé, sans bloquer si non supporté (iOS standalone etc.)
import("firebase/analytics").then(({ getAnalytics, isSupported }) => {
  isSupported().then((ok) => { if (ok) getAnalytics(app); }).catch(() => {});
}).catch(() => {});

// ── Providers ──
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider("apple.com");

// ── API simple consommée par l'app ──
export async function fbSignInGoogle() {
  const res = await signInWithPopup(auth, googleProvider);
  return res.user;
}
export async function fbSignInApple() {
  const res = await signInWithPopup(auth, appleProvider);
  return res.user;
}
export async function fbSignUpEmail(email, password, name) {
  const res = await createUserWithEmailAndPassword(auth, email, password);
  if (name) { try { await updateProfile(res.user, { displayName: name }); } catch (e) {} }
  return res.user;
}
export async function fbSignInEmail(email, password) {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
}
export function fbOnAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
export function fbSignOut() {
  return signOut(auth);
}
// Convertit un user Firebase vers le format interne de l'app
export function fbUserToAppUser(fbUser) {
  if (!fbUser) return null;
  return {
    name: fbUser.displayName || (fbUser.email ? fbUser.email.split("@")[0] : "Trader"),
    email: fbUser.email || "",
    uid: fbUser.uid,
    photo: fbUser.photoURL || null,
    provider: (fbUser.providerData && fbUser.providerData[0] && fbUser.providerData[0].providerId) || "password",
    guest: false,
  };
}


// ══════════════════════════════════════════════════════════════════
// FIRESTORE — Persistance cloud du profil par utilisateur (synchro multi-appareils)
// Sécurité : chaque user ne peut lire/écrire que son propre document (règles RLS Firestore).
// Document : users/{uid} → { profile, setupDone, updatedAt }
// ══════════════════════════════════════════════════════════════════

// Charge le profil cloud d'un utilisateur. Retourne null si absent ou erreur.
export async function fbLoadUserProfile(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("Firestore load failed (offline?):", e.message);
    return null;
  }
}

// Sauvegarde le profil cloud d'un utilisateur (merge).
export async function fbSaveUserProfile(uid, data) {
  if (!uid) return false;
  try {
    await setDoc(doc(db, "users", uid), { ...data, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch (e) {
    console.warn("Firestore save failed (offline?):", e.message);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════
// SAUVEGARDE CLOUD DU JOURNAL DE TRADING — ajouté suite à une perte de
// données réelle (30/08/2026) : jusqu'ici, Firebase ne gérait QUE
// l'authentification — le journal (entrées quotidiennes) et la liste des
// comptes journal restaient uniquement en localStorage, sans aucune copie
// cloud. Un simple nettoyage des données de site (fait pour corriger un
// souci de cache PWA) a effacé des mois d'historique sans aucun moyen de
// les restaurer. Ces deux fonctions comblent ce trou : mêmes documents
// users/{uid} que le profil (merge:true, donc n'écrase jamais profile/
// setupDone), champs "journal" et "journalAccounts" séparés.
//
// LIMITE CONNUE : un seul document Firestore (limite Firestore : 1 Mio).
// Largement suffisant pour plusieurs années de journal quotidien
// multi-comptes, mais si ça devient un jour un problème réel, la vraie
// solution est une sous-collection users/{uid}/journalMonths/{YYYY-MM}
// (un document par mois) plutôt qu'un seul gros document. Pas fait ici
// pour rester au plus proche du pattern déjà existant (profil) et livrer
// vite un vrai filet de sécurité — voir TODO si le volume grossit.
// ══════════════════════════════════════════════════════════════════
export async function fbSaveJournalData(uid, journal) {
  if (!uid) return false;
  try {
    await setDoc(doc(db, "users", uid), { journal, journalUpdatedAt: Date.now() }, { merge: true });
    return true;
  } catch (e) {
    console.warn("Firestore journal save failed (offline?):", e.message);
    return false;
  }
}
export async function fbLoadJournalData(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return data && data.journal ? data.journal : null;
  } catch (e) {
    console.warn("Firestore journal load failed (offline?):", e.message);
    return null;
  }
}
export async function fbSaveJournalAccounts(uid, accounts) {
  if (!uid) return false;
  try {
    await setDoc(doc(db, "users", uid), { journalAccounts: accounts, journalAccountsUpdatedAt: Date.now() }, { merge: true });
    return true;
  } catch (e) {
    console.warn("Firestore journal accounts save failed (offline?):", e.message);
    return false;
  }
}
export async function fbLoadJournalAccounts(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return data && data.journalAccounts ? data.journalAccounts : null;
  } catch (e) {
    console.warn("Firestore journal accounts load failed (offline?):", e.message);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// SAUVEGARDE CLOUD GÉNÉRIQUE — étend le même filet de sécurité à toutes
// les autres données jusqu'ici uniquement locales (progression et
// préférences) : Mes Trades importés, configs sauvegardées, historique de
// backtest, plans de trading par compte, jours actifs/news, dernière
// config simulateur… Un seul couple lire/écrire réutilisable au lieu de
// dupliquer fbSaveXxx/fbLoadXxx pour chacun. Même document users/{uid}
// (merge:true), un champ Firestore par "cloudField" fourni par l'appelant.
// ══════════════════════════════════════════════════════════════════
export async function fbSaveField(uid, cloudField, value) {
  if (!uid || !cloudField) return false;
  try {
    await setDoc(doc(db, "users", uid), { [cloudField]: value, [cloudField + "UpdatedAt"]: Date.now() }, { merge: true });
    return true;
  } catch (e) {
    console.warn(`Firestore save failed for ${cloudField} (offline?):`, e.message);
    return false;
  }
}
export async function fbLoadField(uid, cloudField) {
  if (!uid || !cloudField) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return data && data[cloudField] !== undefined ? data[cloudField] : null;
  } catch (e) {
    console.warn(`Firestore load failed for ${cloudField} (offline?):`, e.message);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// SUPPRESSION DE COMPTE (RGPD) — efface le document Firestore PUIS le
// compte Auth. Ordre important : une fois le compte Auth supprimé,
// les règles RLS empêcheraient d'effacer le document.
// Retourne { ok } ou { ok:false, needsReauth:true } si Firebase exige
// une reconnexion récente (auth/requires-recent-login).
// ══════════════════════════════════════════════════════════════════
export async function fbDeleteAccount() {
  const user = auth.currentUser;
  if (!user) return { ok: false, error: "not-signed-in" };
  try {
    try { await deleteDoc(doc(db, "users", user.uid)); } catch (e) { /* doc absent = OK */ }
    await deleteUser(user);
    return { ok: true };
  } catch (e) {
    if (e && e.code === "auth/requires-recent-login") return { ok: false, needsReauth: true };
    return { ok: false, error: e?.message || "unknown" };
  }
}

// ══════════════════════════════════════════════════════════════════
// WATCHLIST + ALERTES DE PRIX + POSITIONS SURVEILLÉES
//
// Ces données DOIVENT vivre dans Firestore (pas localStorage) car le
// contrôle des prix et l'envoi des notifications se font côté SERVEUR
// (api/check-alerts.js, déclenché par un cron Vercel) — un cron ne peut
// pas lire le localStorage d'un téléphone. Sous-collections de
// users/{uid} pour rester cohérent avec le modèle existant.
// ══════════════════════════════════════════════════════════════════

function requireUid() {
  const u = auth.currentUser;
  if (!u) throw new Error("Utilisateur non connecté.");
  return u.uid;
}

// ── Watchlist : paires/indices suivis + stratégie associée ──
export async function fbAddWatchlistItem({ pair, category, strategy }) {
  const uid = requireUid();
  const ref = await addDoc(collection(db, "users", uid, "watchlist"), {
    pair, category: category || null, strategy: strategy || "", createdAt: serverTimestamp(),
  });
  return ref.id;
}
export async function fbListWatchlist() {
  const uid = requireUid();
  const snap = await getDocs(collection(db, "users", uid, "watchlist"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function fbDeleteWatchlistItem(id) {
  const uid = requireUid();
  await deleteDoc(doc(db, "users", uid, "watchlist", id));
}
export async function fbUpdateWatchlistItem(id, patch) {
  const uid = requireUid();
  await updateDoc(doc(db, "users", uid, "watchlist", id), patch);
}

// ── Alertes de prix : seuil en prix absolu ou en %, contrôlé côté serveur ──
export async function fbAddPriceAlert({ pair, mode, direction, value, refPrice }) {
  const uid = requireUid();
  const ref = await addDoc(collection(db, "users", uid, "priceAlerts"), {
    pair, mode, direction, value, refPrice: refPrice ?? null,
    active: true, triggeredAt: null, createdAt: serverTimestamp(),
  });
  return ref.id;
}
export async function fbListPriceAlerts() {
  const uid = requireUid();
  const snap = await getDocs(collection(db, "users", uid, "priceAlerts"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function fbDeletePriceAlert(id) {
  const uid = requireUid();
  await deleteDoc(doc(db, "users", uid, "priceAlerts", id));
}
export async function fbSetPriceAlertActive(id, active) {
  const uid = requireUid();
  await updateDoc(doc(db, "users", uid, "priceAlerts", id), { active });
}

// ── Positions surveillées : créées après validation d'une capture d'écran,
// surveillées en continu côté serveur jusqu'à TP/SL touché ──
export async function fbAddOpenPosition({ pair, direction, entryPrice, sl, tp, lotSize, source }) {
  const uid = requireUid();
  const ref = await addDoc(collection(db, "users", uid, "openPositions"), {
    pair, direction, entryPrice, sl: sl ?? null, tp: tp ?? null, lotSize: lotSize ?? null,
    source: source || "manual", status: "open",
    openedAt: serverTimestamp(), closedAt: null, resultPct: null,
  });
  return ref.id;
}
export async function fbListOpenPositions() {
  const uid = requireUid();
  const q = query(collection(db, "users", uid, "openPositions"), where("status", "==", "open"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function fbCloseOpenPositionManually(id, resultPct) {
  const uid = requireUid();
  await updateDoc(doc(db, "users", uid, "openPositions", id), {
    status: "closed_manual", closedAt: serverTimestamp(), resultPct,
  });
}
export async function fbDeleteOpenPosition(id) {
  const uid = requireUid();
  await deleteDoc(doc(db, "users", uid, "openPositions", id));
}

// ── Abonnement Web Push : nécessaire pour que le serveur puisse notifier
// CET appareil précis même quand l'app est fermée ──
export async function fbSavePushSubscription(subscription) {
  const uid = requireUid();
  // Un seul abonnement par endpoint — l'endpoint identifie l'appareil/navigateur
  const id = btoa(subscription.endpoint).replace(/[^a-zA-Z0-9]/g, "").slice(0, 120);
  await setDoc(doc(db, "users", uid, "pushSubscriptions", id), {
    subscription, createdAt: serverTimestamp(),
  });
}
export async function fbRemovePushSubscription(endpoint) {
  const uid = requireUid();
  const id = btoa(endpoint).replace(/[^a-zA-Z0-9]/g, "").slice(0, 120);
  await deleteDoc(doc(db, "users", uid, "pushSubscriptions", id));
}

// ── Entrées journal générées automatiquement par le serveur (position
// clôturée pendant que l'app était fermée) — le client les récupère et les
// fusionne dans le journal local (localStorage) à la prochaine ouverture,
// puis les efface de Firestore. Pont minimal entre le cron serveur et un
// journal qui reste, pour le reste, en localStorage. ──
export async function fbListPendingJournalEntries() {
  const uid = requireUid();
  const snap = await getDocs(collection(db, "users", uid, "pendingJournalEntries"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function fbDeletePendingJournalEntry(id) {
  const uid = requireUid();
  await deleteDoc(doc(db, "users", uid, "pendingJournalEntries", id));
}

// ══════════════════════════════════════════════════════════════════
// DÉTECTION DE SETUP EN TEMPS RÉEL (EMA200 Pullback)
//
// setupWatches : les paires surveillées pour ce schéma précis (cassure EMA200
// → pullback → reprise). Chacune garde son dernier état notifié (lastState)
// pour ne jamais renvoyer deux fois la même alerte tant que l'état ne change
// pas — sans ça, chaque contrôle (toutes les ~30 min) spammerait la même
// notification en boucle.
//
// setupConfig : capital et risque DÉDIÉS à ce système, volontairement
// séparés du plan de trading général (demande explicite) — sert uniquement
// à calculer le risque en $ affiché dans la notification "Setup confirmé".
// ══════════════════════════════════════════════════════════════════
export async function fbAddSetupWatch({ pair, timeframe = "60" }) {
  const uid = requireUid();
  const ref = await addDoc(collection(db, "users", uid, "setupWatches"), {
    pair, timeframe, strategy: "ema_pullback", active: true,
    lastState: "idle", lastNotifiedAt: null, createdAt: serverTimestamp(),
  });
  return ref.id;
}
export async function fbListSetupWatches() {
  const uid = requireUid();
  const snap = await getDocs(collection(db, "users", uid, "setupWatches"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function fbDeleteSetupWatch(id) {
  const uid = requireUid();
  await deleteDoc(doc(db, "users", uid, "setupWatches", id));
}

export async function fbGetSetupConfig() {
  const uid = requireUid();
  const snap = await getDoc(doc(db, "users", uid, "setupConfig", "default"));
  return snap.exists() ? snap.data() : { capital: 25000, riskPct: 1 };
}
export async function fbSaveSetupConfig(cfg) {
  const uid = requireUid();
  await setDoc(doc(db, "users", uid, "setupConfig", "default"), cfg, { merge: true });
}
