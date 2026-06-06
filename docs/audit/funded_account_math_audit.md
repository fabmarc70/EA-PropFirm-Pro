# MISSION 4 — Audit mathématique des comptes Funded

## Objectif
Vérifier que ces quatre grandeurs sont **séparées** et qu'aucun résultat n'est gonflé :
- Capital initial
- Capital courant (équité)
- Payouts retirés (cumul versé au trader)
- Profits cumulés

## Lecture du code `simulateFunded`

### Variables présentes
| Variable | Rôle | Statut |
|----------|------|--------|
| `capital` | capital initial du compte | ✅ figé, jamais modifié |
| `currentCapital` | capital de référence (évolue avec le scaling) | ✅ distinct de `equity` |
| `equity` | équité courante (solde live) | ✅ distinct |
| `cumulPayout` | total des payouts versés au trader | ✅ accumulé séparément |
| `pendingPayout` | profit en attente de versement | ✅ distinct du cumul |

### Points corrects ✅
1. **Capital initial vs courant** : `capital` reste figé, `currentCapital` n'évolue que
   lors du scaling (+40%). Bonne séparation.
2. **Payouts vs équité** : quand un payout est versé, il est ajouté à `cumulPayout` et
   retiré de `pendingPayout` — il ne reste pas dans l'équité affichée comme profit.
3. **Split appliqué** : `pendingPayout += pnl × currentSplit` — le trader ne touche que
   sa part (80-90%), le reste va à la firm. Réaliste.

### Points à vérifier ⚠️

**Problème 1 — l'équité après payout**
```js
pendingPayout += pnl * currentSplit;   // part trader mise de côté
// ... mais equity n'est PAS réduite du montant retiré
```
❌ **INCOHÉRENCE** : sur un vrai compte funded, quand un payout est versé, le solde du
compte est **remis au niveau du capital initial** (profit retiré). Ici `equity` continue
de croître mois après mois sans être « ramenée » après chaque payout. Cela **gonfle**
l'équité affichée et le DD calculé devient optimiste.

→ Sur la plupart des firms (FTMO, FundedNext), après un payout le compte repart du
capital de base. Le profit n'est pas cumulé dans l'équité **et** versé en payout :
ce serait du double comptage.

**Problème 2 — scaling basé sur l'équité gonflée**
```js
currentCapital = equity + addedCapital;
```
Comme `equity` est gonflée (problème 1), le scaling part d'une base trop haute.

**Problème 3 — double cycle de payout**
```js
for (let cycle = 0; cycle < 2; cycle++) { if (pendingPayout >= PAYOUT_MIN) {...} }
```
Permet 2 versements par mois. Réaliste pour certaines firms (payout bimensuel), mais à
documenter clairement.

## Corrections recommandées

1. **Après chaque payout, ramener l'équité** : `equity = currentCapital` (le profit a été
   distribué, le compte repart de sa base). Évite le gonflage.
2. **Séparer dans l'affichage** :
   - Capital initial (figé)
   - Équité courante (≈ capital de base entre deux payouts)
   - **Total versé au trader = `cumulPayout`** (la vraie « performance » du trader)
   - Profits cumulés bruts (avant split) = info séparée
3. **Le KPI principal d'un compte funded n'est PAS l'équité, c'est le cumul des payouts.**
   C'est ce que le trader gagne réellement.

## Impact utilisateur
Sans correction, le simulateur affiche une équité qui grimpe indéfiniment, ce qui laisse
croire à une performance irréaliste. La correction rend le compte funded crédible :
le trader voit ce qu'il **encaisse** (payouts), pas un solde théorique gonflé.
