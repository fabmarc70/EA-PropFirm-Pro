// ══════════════════════════════════════════════════════════════════════════
// MOTEUR D'ENTRAINEMENT AU TRADING MANUEL
// --------------------------------------------------------------------------
// Module PUR : ni React, ni DOM, ni reseau. Tout entre par les arguments,
// tout ressort dans la valeur de retour — donc testable (trainerEngine.test.js).
//
// PRINCIPE. On rejoue de VRAIES bougies historiques. Le graphique s'arrete a
// un instant donne, la suite est cachee. Le trader prend position (achat,
// vente, ou rien), avec un stop et un objectif exprimes en R. Les bougies
// suivantes sont ensuite revelees une a une et decident du resultat.
//
// Format d'une bougie, identique au reste de l'app : [ts, open, high, low, close].
// ══════════════════════════════════════════════════════════════════════════

const O = 1, H = 2, L = 3, C = 4;

function num(v, d = 0) { const n = Number(v); return isFinite(n) ? n : d; }

// ══════════════════════════════════════════════════════════════════════════
// OUVERTURE D'UNE POSITION
// --------------------------------------------------------------------------
// Le stop est place a une distance exprimee en POURCENTAGE DU PRIX, et la
// taille de position en decoule pour que la perte au stop vaille exactement
// le risque choisi. C'est la discipline que l'entrainement doit faire
// travailler : on ne choisit pas une taille, on choisit un risque.
// ══════════════════════════════════════════════════════════════════════════
// stopPrice / targetPrice : niveaux places directement au PRIX, comme chez un
// courtier. stopPct / rr restent acceptes — c'est la meme position exprimee
// autrement, et les deux chemins aboutissent au meme calcul de taille.
export function openPosition({ side, entryPrice, balance, riskPct, stopPct, rr, stopPrice, targetPrice }) {
  const price = num(entryPrice);
  const bal = num(balance);
  const risque = bal * (num(riskPct) / 100);
  const sens = side === "short" ? -1 : 1;

  let distance, stop, target;
  if (isFinite(stopPrice) && stopPrice > 0) {
    // Un stop du mauvais cote de l'entree n'est pas un stop : il serait touche
    // a la seconde meme. On refuse plutot que d'ouvrir une position absurde.
    distance = (price - num(stopPrice)) * sens;
    if (!(distance > 0)) return null;
    stop = num(stopPrice);
    target = isFinite(targetPrice) && targetPrice > 0
      ? num(targetPrice)
      : price + sens * distance * num(rr, 2);
    if ((target - price) * sens <= 0) return null;   // objectif du mauvais cote
  } else {
    distance = price * (num(stopPct) / 100);
    stop = price - sens * distance;
    target = price + sens * distance * num(rr, 2);
  }
  if (!(price > 0) || !(distance > 0) || !(risque > 0)) return null;

  // Unites : quantite telle que (distance x quantite) = risque.
  const quantity = risque / distance;

  return {
    side: sens > 0 ? "long" : "short",
    entryPrice: price, stop, target,
    riskAmount: +risque.toFixed(2),
    // Le rapport reel, deduit des niveaux : quand l'objectif est pose a la
    // main, il ne vaut plus forcement le rr demande.
    rr: +(((target - price) * sens) / distance).toFixed(3),
    quantity,
    openIndex: null,   // renseigne par l'appelant
  };
}

// ══════════════════════════════════════════════════════════════════════════
// DEUX NIVEAUX, LES DEUX SENS
// --------------------------------------------------------------------------
// Quatre champs (SL/TP achat, SL/TP vente) demandaient a l'utilisateur de
// tenir dans sa tete deux scenarios a la fois. Il n'en pose plus que DEUX
// sur le graphique, et le sens se lit tout seul : un stop sous le prix,
// c'est un achat ; au-dessus, c'est une vente.
//
// Si l'on appuie sur le bouton de l'autre sens, les niveaux sont reflechis
// autour du prix en gardant la MEME distance de stop et le MEME rapport —
// le reglage est conserve, seule la direction change.
// ══════════════════════════════════════════════════════════════════════════
export function levelsForSide({ entryPrice, side, stopPrice, targetPrice, rr = 2 }) {
  const prix = num(entryPrice);
  const sens = side === "short" ? -1 : 1;
  if (!(prix > 0)) return null;

  let d = Math.abs(prix - num(stopPrice));
  if (!(d > 0)) d = prix * 0.006;                       // repli raisonnable
  // Objectif ABSENT et objectif a zero ne sont pas la meme chose : sans ce
  // controle, un objectif manquant valait 0 et donnait un rapport de 100.
  const cible = Number(targetPrice);
  let rapport = (isFinite(cible) && cible > 0) ? Math.abs(cible - prix) / d : 0;
  if (!(rapport > 0) || !isFinite(rapport)) rapport = num(rr, 2);

  return {
    stop: prix - sens * d,
    target: prix + sens * d * rapport,
    rr: +rapport.toFixed(3),
    // Vrai quand les niveaux fournis allaient deja dans ce sens : l'ecran
    // peut alors se taire plutot que d'annoncer une correction inutile.
    dejaBon: (prix - num(stopPrice)) * sens > 0 && (num(targetPrice) - prix) * sens > 0,
  };
}

/** Sens deduit de la position du stop par rapport au prix. */
export function sideFromLevels(entryPrice, stopPrice) {
  const p = num(entryPrice), s = num(stopPrice);
  if (!(p > 0) || !(s > 0) || p === s) return null;
  return s < p ? "long" : "short";
}

// Resultat COURANT d'une position encore ouverte, au cours affiche. C'est ce
// qui manquait pour qu'un trade se deroule au lieu de se resoudre d'un bloc.
export function floatingResult(position, price) {
  if (!position) return null;
  const sens = position.side === "long" ? 1 : -1;
  const pnl = (num(price) - position.entryPrice) * sens * position.quantity;
  return {
    price: num(price),
    pnl: +pnl.toFixed(2),
    rMultiple: position.riskAmount > 0 ? +(pnl / position.riskAmount).toFixed(3) : 0,
  };
}

// Une SEULE bougie : stop, objectif, ou rien. Permet de derouler le trade
// bougie par bougie en gardant exactement la regle de resolvePosition —
// notamment le cas ambigu, ou le stop l'emporte.
export function stepCandle(position, candle) {
  if (!position || !Array.isArray(candle)) return null;
  const long = position.side === "long";
  const toucheStop = long ? candle[L] <= position.stop : candle[H] >= position.stop;
  const toucheTarget = long ? candle[H] >= position.target : candle[L] <= position.target;
  if (toucheStop && toucheTarget) return { hit: "stop_ambigu", price: position.stop };
  if (toucheStop) return { hit: "stop", price: position.stop };
  if (toucheTarget) return { hit: "target", price: position.target };
  return null;
}

// ══════════════════════════════════════════════════════════════════════════
// RESOLUTION SUR LES BOUGIES SUIVANTES
// --------------------------------------------------------------------------
// Pour chaque bougie, on regarde si le stop ou l'objectif a ete touche.
//
// CAS AMBIGU, traite explicitement : quand une meme bougie touche le stop ET
// l'objectif, on ne peut pas savoir lequel est arrive en premier sans donnee
// plus fine. On retient alors LE STOP. C'est le choix prudent, et le seul
// honnete pour un outil d'entrainement : supposer l'objectif flatterait les
// statistiques de l'utilisateur et lui donnerait une fausse confiance.
// ══════════════════════════════════════════════════════════════════════════
export function resolvePosition(position, candles, fromIndex, maxCandles = Infinity) {
  if (!position || !Array.isArray(candles)) return null;
  const { side, stop, target, entryPrice, quantity } = position;
  const long = side === "long";
  const fin = Math.min(candles.length - 1, fromIndex + (isFinite(maxCandles) ? maxCandles : candles.length));

  for (let i = fromIndex; i <= fin; i++) {
    const c = candles[i];
    if (!c) break;
    const toucheStop = long ? c[L] <= stop : c[H] >= stop;
    const toucheTarget = long ? c[H] >= target : c[L] <= target;

    if (toucheStop && toucheTarget) {
      return finir(position, stop, i, "stop_ambigu");
    }
    if (toucheStop) return finir(position, stop, i, "stop");
    if (toucheTarget) return finir(position, target, i, "target");
  }

  // Ni l'un ni l'autre : on sort au dernier cours connu.
  const dernier = candles[fin];
  return finir(position, dernier ? dernier[C] : entryPrice, fin, "temps");
}

function finir(position, exitPrice, exitIndex, reason) {
  const sens = position.side === "long" ? 1 : -1;
  const pnl = (exitPrice - position.entryPrice) * sens * position.quantity;
  return {
    ...position,
    exitPrice, exitIndex, reason,
    pnl: +pnl.toFixed(2),
    // Resultat en R : la seule unite comparable d'un trade a l'autre.
    rMultiple: position.riskAmount > 0 ? +(pnl / position.riskAmount).toFixed(3) : 0,
    win: pnl > 0,
  };
}

/** Cloture manuelle au cours courant, avant que stop ou objectif soient touches. */
export function closeManually(position, exitPrice, exitIndex) {
  if (!position) return null;
  return finir(position, num(exitPrice), exitIndex, "manuel");
}

// ══════════════════════════════════════════════════════════════════════════
// STATISTIQUES DE LA SESSION
// --------------------------------------------------------------------------
// Les memes indicateurs que le reste de l'app, pour que l'entrainement se
// compare au journal et au simulateur sans conversion mentale.
// ══════════════════════════════════════════════════════════════════════════
export function trainerStats(trades, startBalance = 10000) {
  const list = Array.isArray(trades) ? trades : [];
  const n = list.length;
  if (!n) {
    return {
      trades: 0, wins: 0, losses: 0, winrate: null, profitFactor: null,
      expectancyR: null, totalPnl: 0, balance: num(startBalance), maxDDPct: 0,
      bestR: null, worstR: null, pireSerie: 0, meilleureSerie: 0, equity: [num(startBalance)],
    };
  }

  const gains = list.filter(t => t.pnl > 0);
  const pertes = list.filter(t => t.pnl < 0);
  const sommeGains = gains.reduce((s, t) => s + t.pnl, 0);
  const sommePertes = Math.abs(pertes.reduce((s, t) => s + t.pnl, 0));
  const totalPnl = list.reduce((s, t) => s + t.pnl, 0);

  // Courbe d'equite et pire drawdown, en % du solde de depart.
  const equity = [num(startBalance)];
  let solde = num(startBalance), pic = solde, pireCreux = 0;
  list.forEach(t => {
    solde += t.pnl;
    equity.push(+solde.toFixed(2));
    if (solde > pic) pic = solde;
    const creux = pic > 0 ? (pic - solde) / pic : 0;
    if (creux > pireCreux) pireCreux = creux;
  });

  // Series consecutives.
  let serieG = 0, serieP = 0, maxG = 0, maxP = 0;
  list.forEach(t => {
    if (t.pnl > 0) { serieG++; serieP = 0; if (serieG > maxG) maxG = serieG; }
    else if (t.pnl < 0) { serieP++; serieG = 0; if (serieP > maxP) maxP = serieP; }
  });

  const rs = list.map(t => num(t.rMultiple));

  return {
    trades: n,
    wins: gains.length,
    losses: pertes.length,
    winrate: +((gains.length / n) * 100).toFixed(1),
    // Profit factor : null (et non Infinity) quand aucune perte — une division
    // par zero affichee "Infinity" n'apprend rien a l'utilisateur.
    profitFactor: sommePertes > 0 ? +(sommeGains / sommePertes).toFixed(2) : null,
    expectancyR: +(rs.reduce((s, r) => s + r, 0) / n).toFixed(3),
    totalPnl: +totalPnl.toFixed(2),
    balance: +solde.toFixed(2),
    maxDDPct: +(pireCreux * 100).toFixed(2),
    bestR: +Math.max(...rs).toFixed(2),
    worstR: +Math.min(...rs).toFixed(2),
    meilleureSerie: maxG,
    pireSerie: maxP,
    equity,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// SERIE DE SECOURS
// --------------------------------------------------------------------------
// Quand les donnees historiques ne peuvent pas etre telechargees (hors ligne,
// depot indisponible), l'entrainement doit rester utilisable plutot que
// d'afficher un ecran vide. Serie deterministe a partir d'une graine : elle
// n'est PAS presentee comme du marche reel, l'ecran le dit.
// ══════════════════════════════════════════════════════════════════════════
export function syntheticCandles(seed = 1, count = 400, startPrice = 2000) {
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const out = [];
  let prix = startPrice;
  let tendance = 0;
  const t0 = Date.UTC(2024, 0, 1) / 1000;
  for (let i = 0; i < count; i++) {
    // Marche aleatoire avec une tendance qui persiste puis se retourne :
    // sans persistance, aucune structure a lire, et l'exercice perd son sens.
    if (i % 40 === 0) tendance = (rnd() - 0.5) * 0.0016;
    const derive = tendance + (rnd() - 0.5) * 0.004;
    const open = prix;
    const close = Math.max(0.01, open * (1 + derive));
    const amplitude = Math.abs(close - open) + open * 0.0012 * rnd();
    const high = Math.max(open, close) + amplitude * rnd();
    const low = Math.min(open, close) - amplitude * rnd();
    out.push([t0 + i * 3600, +open.toFixed(2), +high.toFixed(2), +low.toFixed(2), +close.toFixed(2)]);
    prix = close;
  }
  return out;
}

/**
 * Choisit un point de depart aleatoire laissant assez de bougies visibles
 * avant, et assez de bougies cachees apres pour resoudre un trade.
 */
export function pickStartIndex(candles, visible = 60, reserve = 60, rng = Math.random) {
  const n = Array.isArray(candles) ? candles.length : 0;
  if (n < visible + reserve + 1) return Math.max(0, Math.min(n - 1, visible));
  const min = visible;
  const max = n - reserve - 1;
  return min + Math.floor(rng() * (max - min + 1));
}
