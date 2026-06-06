# RAPPORT FINAL — Audit simulateur de trading public

Date : audit complet du moteur de risque et des calculs.
Objectif : simulateur compréhensible, cohérent et crédible pour tout trader, quel que
soit son broker ou sa plateforme.

---

## Synthèse par calcul

| # | Calcul | Statut | Priorité |
|---|--------|--------|----------|
| 1 | Modèle de risque (pip → universel) | ✅ Corrigé | 🔴 Critique |
| 2 | UX champ SL | ✅ Audité (recommandations) | 🟡 Moyenne |
| 3a | Calendrier PnL — total mensuel signe | ✅ Corrigé | 🔴 Critique |
| 3b | Calendrier PnL — meilleur/pire jour signe | ✅ Corrigé | 🟠 Élevée |
| 3c | Pertes avant violation (Math.ceil) | ✅ Corrigé | 🟠 Élevée |
| 4 | Compte funded — double comptage | ✅ Corrigé | 🔴 Critique |
| 5 | Réalisme global | ✅ Audité | 🟡 Moyenne |

---

## Détail des corrections appliquées

### 1. Modèle de risque universel ✅ 🔴
**Avant** : `risque = lot × pipValuePerLot × SL_pips` — dépendant du broker.
**Après** : `risque = capital × risk%` est la seule source de vérité. Les pips/lots
deviennent une aide d'affichage optionnelle.
**Impact** : deux traders avec les mêmes paramètres obtiennent désormais le même risque,
quel que soit leur broker (MT4, MT5, cTrader, DXTrade, etc.).

### 3a. Calendrier — signe du total mensuel ✅ 🔴
**Avant** : `(monthPnl >= 0 ? "+" : "") + "$" + Math.abs(...)` → -74 $ affiché « $74 ».
**Après** : `(monthPnl >= 0 ? "+$" : "-$") + Math.abs(...)` → affiche bien « -$74 ».
**Impact** : le cas testé (8 gagnants / 13 perdants → -74 $) s'affiche maintenant correctement.

### 3b. Calendrier — meilleur/pire jour ✅ 🟠
**Avant** : « Meilleur » forçait `+$`, « Pire » forçait `-$` (faux si tous gagnants/perdants).
**Après** : signe dynamique selon la valeur réelle.

### 3c. Pertes avant violation ✅ 🟠
**Avant** : `Math.floor(DD / risque)` — sous-estimait d'un trade.
**Après** : `Math.ceil(...)` — au Xème trade perdant on dépasse réellement le DD.

### 4. Compte funded — anti-gonflage ✅ 🔴
**Avant** : le profit était versé en payout **et** restait dans l'équité (double comptage).
**Après** : après chaque payout, `equity = currentCapital` (le compte repart de sa base).
Le scaling part de `currentCapital`, pas de l'équité gonflée.
**Impact** : le KPI réel d'un compte funded est le **cumul des payouts** (ce que le trader
encaisse), pas une équité théorique qui grimpe indéfiniment.

---

## Recommandations UX (Mission 2) — à implémenter progressivement

1. Champ principal = **Risque %** partout (slider + saisie), bascule Risque $.
2. Distance SL = champ secondaire optionnel, sert uniquement à estimer le lot.
3. Lot + pips = sorties informatives en gris, jamais dans le calcul du risque.
4. Mode débutant = un seul slider « Combien risques-tu par trade ? ».

---

## Positionnement (Mission 5)
Le simulateur est un **outil d'éducation au risque et d'aide à la décision**, pas une
promesse de gain. Il affiche systématiquement :
- 3 scénarios (prudent / moyen / optimiste),
- un disclaimer (performances passées ≠ résultats futurs, pas un conseil financier),
- aucun taux de réussite présenté comme certitude.

Ce positionnement est correct juridiquement et éthiquement.

---

## Reste à faire (non bloquant)
- Documenter l'impact spread/slippage (réduction ~5-15% de l'espérance réelle).
- Clarifier partout « pertes consécutives » vs « séries » dans les libellés.
- Implémenter le champ « Distance SL en prix » (en plus des pips) pour les traders
  non-MT4/MT5.
