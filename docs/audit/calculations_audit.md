# MISSION 3 — Audit des calculs actuels

## 3.1 Calendrier PnL

### Cas testé : 8 jours gagnants, 13 jours perdants → attendu ≈ -74 $

**Calcul du total mensuel** (ligne 2634) :
```js
const monthPnl = monthDays.reduce((s, d) => s + d.pnl, 0);
```
✅ **Correct** — somme algébrique simple, le signe est respecté.

**Affichage du total** (ligne 2708) :
```js
val: (monthPnl >= 0 ? "+" : "") + "$" + Math.abs(monthPnl).toFixed(0)
```
✅ **Correct** — signe `+` si positif, rien si négatif (le `-` vient de... ❌ ERREUR :
`Math.abs()` retire le signe et aucun `-` n'est ajouté quand négatif !
Pour -74 $, affiche `$74` au lieu de `-$74`.

→ **À CORRIGER** : signe négatif manquant.

**Couleur** (ligne 2708) : `monthPnl >= 0 ? vert : rouge` ✅ Correct.

**Meilleur jour** (ligne 2710) :
```js
val: "+$" + bestDay.toFixed(0)
```
❌ **ERREUR** — `+$` est codé en dur. Si tous les jours sont perdants, `bestDay` est
négatif (ex : -5) mais s'affiche `+$-5`. Le signe doit être dynamique.

**Pire jour** (ligne 2711) :
```js
val: "-$" + Math.abs(worstDay).toFixed(0)
```
❌ **ERREUR** — `-$` codé en dur. Si tous les jours sont gagnants, `worstDay` est
positif mais s'affiche `-$X`. Trompeur.

### Arrondi
`.toFixed(0)` partout → arrondi au dollar. ✅ Acceptable pour l'affichage, mais
peut créer un écart visuel : 8 jours à +12,4 et 13 jours à -7,3 = +99,2 - 94,9 = +4,3
arrondi 4, alors que l'affichage jour par jour arrondi peut sembler incohérent.
→ **Note** : conserver les valeurs exactes en interne, arrondir seulement à l'affichage.

## 3.2 Drawdown

**DD total** (simulatePhase) :
```js
const dd = (capital - equity) / capital;   // depuis capital initial
const ddTrail = (peak - equity) / peak;     // depuis le pic
```
✅ **Correct** depuis le dernier audit (deux mesures distinctes).

**DD journalier** :
```js
const dayDD = Math.abs(res.dayLowPnl) / capital;
```
✅ **Correct** — utilise le creux intraday (`dayLowPnl`), pas la clôture.

**Nombre de pertes avant violation** :
Le calcul du nombre de pertes consécutives nécessaires pour violer le DD doit utiliser
`Math.ceil()` car on ne peut pas avoir une fraction de trade perdant.
```js
pertesAvantViolation = Math.ceil(DD_limit_$ / risque_$_par_trade)
```
❌ **À VÉRIFIER / CORRIGER** — actuellement affiché sans `Math.ceil()` à certains endroits.

## 3.3 Séries de pertes

**Max pertes consécutives** : paramètre `maxConsecLosses`, utilisé dans `makeTradeStream`.
✅ Cohérent.

**Formulation trompeuse** : la phrase « Series pour atteindre DD 10% : X series perdantes »
peut laisser croire qu'il faut X séries distinctes, alors qu'il s'agit de X pertes
consécutives. → **À CLARIFIER** : distinguer « pertes consécutives » de « séries ».

## Corrections à appliquer
1. ❌ `monthPnl` négatif : ajouter le `-` (signe dynamique).
2. ❌ `bestDay` / `worstDay` : signe dynamique selon la valeur réelle.
3. ❌ `Math.ceil()` sur le nombre de pertes avant violation.
4. ⚠️ Clarifier « pertes consécutives » vs « séries ».
