// ══════════════════════════════════════════════════════════════════
// FIREBASE — Auth uniquement pour le moment.
// Les données (journal, configs, simulations) et fichiers restent en
// localStorage. Firestore/Storage seront branchés dans une phase future.
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
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

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
