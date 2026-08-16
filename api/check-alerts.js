// ══════════════════════════════════════════════════════════════════
// CRON DE SURVEILLANCE DES PRIX — déclenché périodiquement par Vercel
// Cron (voir vercel.json). Tourne côté serveur, donc fonctionne même
// si l'app est complètement fermée sur le téléphone.
//
// LIMITE IMPORTANTE À CONNAÎTRE : ceci compare un PRIX INSTANTANÉ
// (dernière cotation) au moment de chaque exécution du cron, PAS un
// flux tick par tick comme un vrai broker. Entre deux exécutions
// (voir CRON_INTERVAL_MINUTES dans vercel.json), un mouvement bref qui
// traverse puis revient pourrait ne pas être détecté. Ce n'est PAS
// l'exécution d'un vrai stop/take profit — c'est une surveillance
// périodique, à fréquence limitée par le quota de l'API de prix.
// ══════════════════════════════════════════════════════════════════

import admin from "firebase-admin";
import webpush from "web-push";

function initFirebaseAdmin() {
  if (admin.apps.length) return admin.app();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY manquante côté serveur.");
  // Accepte deux formats : JSON brut (commence par "{") OU la même chose encodée
  // en base64 — recommandé, car un JSON multi-lignes (le champ private_key
  // contient des retours à la ligne internes) se corrompt facilement au copier-
  // coller sur certaines interfaces mobiles (guillemets réécrits, sauts de
  // ligne mal interprétés). Le base64 est une seule ligne de caractères sûrs,
  // impossible à casser au collage.
  const jsonStr = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
  let serviceAccount;
  try { serviceAccount = JSON.parse(jsonStr); }
  catch (e) { throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY illisible (ni JSON valide, ni base64 valide) : " + e.message); }
  return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

// Convertit un code de paire interne ("EURUSD", "XAUUSD") vers le format
// Twelve Data ("EUR/USD"). Passe telle quelle si le format n'est pas reconnu
// (couvre indices/crypto/actions dont le ticker Twelve Data est direct).
function toTwelveDataSymbol(pair) {
  const p = (pair || "").toUpperCase().replace(/\s/g, "");
  if (/^[A-Z]{6}$/.test(p)) return p.slice(0, 3) + "/" + p.slice(3);
  return p;
}

async function fetchPrices(pairs, apiKey) {
  if (!pairs.length) return {};
  const symbols = [...new Set(pairs.map(toTwelveDataSymbol))];
  const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbols.join(","))}&apikey=${apiKey}`;
  const r = await fetch(url);
  const data = await r.json();
  // Twelve Data renvoie parfois un objet d'ERREUR ({code, message, status})
  // au lieu d'un objet de prix, notamment pour un symbole non reconnu (ex:
  // un ticker crypto mal formé). Sans cette garde, Object.entries() itérait
  // sur les champs de l'erreur comme s'ils étaient des prix.
  if (data && data.status === "error") {
    throw new Error(`Twelve Data a refusé la requête : ${data.message || data.code || "raison inconnue"}`);
  }
  const out = {};
  if (symbols.length === 1) {
    const s = symbols[0];
    if (data && data.price) out[s] = parseFloat(data.price);
  } else if (data && typeof data === "object") {
    Object.entries(data).forEach(([sym, v]) => { if (v && v.price) out[sym] = parseFloat(v.price); });
  }
  // Ré-indexe par pair d'origine (sans le slash) pour un accès simple
  const byPair = {};
  pairs.forEach(p => { byPair[p] = out[toTwelveDataSymbol(p)] ?? null; });
  return byPair;
}

async function sendPush(db, uid, payload) {
  const subsSnap = await db.collection("users").doc(uid).collection("pushSubscriptions").get();
  const results = [];
  for (const doc of subsSnap.docs) {
    const sub = doc.data().subscription;
    // Garde contre un abonnement mal formé (sauvegarde partielle côté client,
    // ex: sub.toJSON() qui aurait échoué à mi-chemin) — la librairie web-push
    // lève une erreur bas niveau peu explicite si endpoint/keys manquent.
    if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
      results.push({ ok: false, error: "Abonnement push incomplet, ignoré." });
      await doc.ref.delete().catch(() => {});
      continue;
    }
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
      results.push({ ok: true });
    } catch (e) {
      // Abonnement expiré/révoqué (410 Gone ou 404) -> on le supprime, sinon on le garde
      if (e.statusCode === 410 || e.statusCode === 404) {
        await doc.ref.delete();
      }
      results.push({ ok: false, error: e.message });
    }
  }
  return results;
}

export default async function handler(req, res) {
  // ── Protection par secret partagé ──
  // Cet endpoint est maintenant appelé depuis DEUX sources : le cron interne
  // Vercel (1x/jour, limite du plan Hobby) ET un workflow GitHub Actions
  // programmé plus fréquemment (gratuit, hors de cette limite). Sans cette
  // vérification, n'importe qui connaissant l'URL pourrait déclencher des
  // contrôles à volonté (épuisement du quota Twelve Data, spam de notifications).
  // Vercel Cron envoie automatiquement ce header quand la variable s'appelle
  // exactement CRON_SECRET (mécanisme documenté, rien à coder côté cron
  // interne) ; le workflow GitHub Actions l'envoie manuellement de la même façon.
  const expectedAuth = "Bearer " + process.env.CRON_SECRET;
  if (!process.env.CRON_SECRET || req.headers.authorization !== expectedAuth) {
    return res.status(401).json({ error: "Non autorisé." });
  }

  const vapidPublic = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const vapidPrivate = (process.env.VAPID_PRIVATE_KEY || "").trim();
  const twelveDataKey = (process.env.TWELVE_DATA_API_KEY || "").trim();
  if (!vapidPublic || !vapidPrivate) {
    return res.status(500).json({ error: "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY manquantes côté serveur." });
  }
  if (!twelveDataKey) {
    return res.status(500).json({ error: "TWELVE_DATA_API_KEY manquante côté serveur." });
  }
  // Étape isolée avec son propre try/catch : si une clé VAPID est malformée
  // (espace/retour à la ligne collé par erreur), l'erreur précédente était
  // trop générique pour savoir OÙ ça cassait. Désormais identifiée nommément.
  try {
    webpush.setVapidDetails("mailto:contact@eapropfirmpro.app", vapidPublic, vapidPrivate);
  } catch (e) {
    return res.status(500).json({ error: "Échec de configuration VAPID (clé publique ou privée malformée).", detail: e.message });
  }

  let app;
  try { app = initFirebaseAdmin(); }
  catch (e) { return res.status(500).json({ error: "Échec d'initialisation Firebase Admin (FIREBASE_SERVICE_ACCOUNT_KEY).", detail: e.message, stack: e.stack }); }
  const db = admin.firestore();

  let alertsSnap, positionsSnap;
  try {
    // ── Collecte des alertes actives et positions ouvertes, TOUS UTILISATEURS ──
    [alertsSnap, positionsSnap] = await Promise.all([
      db.collectionGroup("priceAlerts").where("active", "==", true).get(),
      db.collectionGroup("openPositions").where("status", "==", "open").get(),
    ]);
  } catch (e) {
    return res.status(500).json({ error: "Échec de la lecture Firestore (index composite manquant probable — voir le lien dans detail).", detail: e.message });
  }

  try {
    const allPairs = new Set();
    alertsSnap.docs.forEach(d => allPairs.add(d.data().pair));
    positionsSnap.docs.forEach(d => allPairs.add(d.data().pair));

    if (allPairs.size === 0) {
      return res.status(200).json({ checked: 0, message: "Aucune alerte ni position à surveiller." });
    }

    let prices;
    try {
      prices = await fetchPrices([...allPairs], twelveDataKey);
    } catch (e) {
      return res.status(500).json({ error: "Échec de récupération des prix Twelve Data.", detail: e.message, pairs: [...allPairs] });
    }

    let alertsTriggered = 0, positionsClosed = 0;

    // ── Alertes de prix ──
    for (const docSnap of alertsSnap.docs) {
      const alert = docSnap.data();
      const price = prices[alert.pair];
      if (price == null) continue;
      const uid = docSnap.ref.parent.parent.id;

      let target = alert.value;
      if (alert.mode === "pct" && alert.refPrice) {
        target = alert.refPrice * (1 + (alert.direction === "above" ? alert.value / 100 : -alert.value / 100));
      }
      const crossed = alert.direction === "above" ? price >= target : price <= target;
      if (!crossed) continue;

      await docSnap.ref.update({ active: false, triggeredAt: admin.firestore.FieldValue.serverTimestamp() });
      await sendPush(db, uid, {
        title: `Alerte ${alert.pair}`,
        body: `${alert.pair} a ${alert.direction === "above" ? "dépassé" : "atteint"} ${target.toFixed(5)} (actuellement ${price.toFixed(5)})`,
        tag: "price-alert-" + docSnap.id,
        url: "/",
      });
      alertsTriggered++;
    }

    // ── Positions surveillées : détection TP/SL sur cotation instantanée ──
    for (const docSnap of positionsSnap.docs) {
      const pos = docSnap.data();
      const price = prices[pos.pair];
      if (price == null) continue;
      const uid = docSnap.ref.parent.parent.id;

      const isLong = pos.direction === "buy";
      // SL vérifié en premier par prudence (voir note en tête de fichier :
      // avec un simple instantané, on ne peut pas savoir lequel a été touché
      // en premier si les deux semblent franchis au même contrôle).
      const slHit = pos.sl != null && (isLong ? price <= pos.sl : price >= pos.sl);
      const tpHit = !slHit && pos.tp != null && (isLong ? price >= pos.tp : price <= pos.tp);
      if (!slHit && !tpHit) continue;

      const resultPct = +(((price - pos.entryPrice) / pos.entryPrice) * (isLong ? 1 : -1) * 100).toFixed(3);
      const outcome = slHit ? "sl" : "tp";

      await docSnap.ref.update({
        status: slHit ? "closed_sl" : "closed_tp",
        closedAt: admin.firestore.FieldValue.serverTimestamp(),
        resultPct, exitPriceObserved: price,
      });

      // Entrée en attente de fusion dans le journal local au prochain
      // chargement de l'app (voir fbListPendingJournalEntries côté client)
      await db.collection("users").doc(uid).collection("pendingJournalEntries").add({
        pair: pos.pair, direction: pos.direction, entryPrice: pos.entryPrice,
        exitPrice: price, outcome, resultPct, positionId: docSnap.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await sendPush(db, uid, {
        title: `${pos.pair} clôturé (${outcome === "tp" ? "Take Profit" : "Stop Loss"})`,
        body: `${resultPct >= 0 ? "+" : ""}${resultPct}% — ajouté automatiquement à ton journal.`,
        tag: "position-closed-" + docSnap.id,
        url: "/",
      });
      positionsClosed++;
    }

    return res.status(200).json({
      checked: allPairs.size, alertsTriggered, positionsClosed,
      pairsChecked: [...allPairs],
    });
  } catch (e) {
    return res.status(500).json({ error: "Échec du contrôle des alertes.", detail: e.message || String(e), stack: e.stack });
  }
}
