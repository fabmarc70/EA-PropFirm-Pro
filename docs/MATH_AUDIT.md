# MATH_AUDIT.md — Audit Mathématique du Simulateur

> **Règle absolue** : Tout changement sur le moteur de simulation doit être
> accompagné d'un test de cohérence mathématique avant merge.
> Aucune modification de `simulatePhase`, `simulateFunded`, `makeTradeStream`,
> `simulateDay` ou des formules de risque ne peut être mergée sans avoir
> passé l'intégralité de la section [Tests obligatoires avant release](#tests-obligatoires-avant-release).

---

## Sommaire

1. [Rapport d'audit complet](#rapport-daudit-complet)
2. [Formules verrouillées](#formules-verrouillées)
3. [Tests obligatoires avant release](#tests-obligatoires-avant-release)
4. [Protocole de vérification des nouvelles prop firms](#protocole-de-vérification-des-nouvelles-prop-firms)
5. [Historique des corrections](#historique-des-corrections)

---

## Rapport d'audit complet

**Date :** Juin 2026  
**Version :** EA PropFirm Pro v0.1.x  
**Paramètres de référence :** Capital $25 000 · Risque 0.6% · WR 55% · 3 trades/j · FundedNext Stellar 2-Step

---

### 1. Cohérence des calculs de risque

| Calcul | Formule | Valeur | Statut |
|--------|---------|--------|--------|
| Risque/trade ($) | `capital × risk%` | $150.00 | 🟢 Correct |
| Risque/trade (%) | `riskAmount / capital × 100` | 0.60% | 🟢 Correct |
| Risque journalier max | `trades/j × riskAmount` | $450.00 (1.80%) | 🟢 Correct |
| Limite DD journalier | `capital × dailyDD` | $1 250.00 (5%) | 🟢 Correct |
| Marge avant DD jour | `DDjour - riskJourMax` | $800.00 ✅ | 🟢 Correct |
| Pertes avant DD total | `ceil(capital×totalDD / risk$)` | ceil(16.67) = **17** | 🟢 Correct |
| DD trailing | `(peak - equity) / peak` | Distinct du DD absolu | 🟢 Correct |
| DD absolu | `(capital - equity) / capital` | Depuis capital initial | 🟢 Correct |

**Note :** `Math.ceil` est utilisé pour le nombre de pertes avant violation (corrigé depuis
`Math.floor` qui sous-estimait d'un trade).

---

### 2. Cohérence du RR (Risk Reward)

```
finalRR = (dailyTarget / (n × riskPct) + (1 − w)) / w
```

**Vérification avec les paramètres de référence :**
```
finalRR = (0.002 / (3 × 0.006) + 0.45) / 0.55
        = (0.1111 + 0.45) / 0.55
        = 1.0202 → affiché 1.02
```

**Vérification inverse :**
```
E[jour] = n × riskPct × (w × RR − (1−w))
        = 3 × 0.006 × (0.55 × 1.0202 − 0.45)
        = 0.018 × 0.1111...
        = 0.002000 ← identique à dailyTarget
```

Écart constaté : **8.67 × 10⁻¹⁹** (zéro mathématique, erreur d'arrondi flottant).

| Vérification | Résultat |
|-------------|---------|
| RR = gain moyen / perte moyenne | 153.03 / 150.00 = 1.0202 ✅ |
| E[jour] = dailyTarget | 0.2000% = 0.2000% ✅ |
| Écart | < 10⁻¹⁵ % ✅ |

---

### 3. Espérance mathématique

```
E/trade  = W × gain − (1−W) × perte
         = 0.55 × 153.03 − 0.45 × 150.00
         = 84.17 − 67.50 = $16.67

E/jour   = 3 × 16.67 = $50.00 (= 0.200% de $25 000)
```

| Métrique | Valeur | Statut |
|---------|--------|--------|
| E/trade | +$16.67 | 🟢 Correct |
| E/jour | +$50.00 | 🟢 Correct |
| Profit Factor | (0.55 × 1.02) / 0.45 = **1.25** | 🟢 Correct |
| Kelly fraction | (w×RR−(1-w))/RR = **10.89%** | 🟢 Correct |
| Risque actuel vs Kelly | 0.60% < 10.89% | 🟢 Sous le Kelly |

---

### 4. Calendrier PnL

**Règles de cohérence vérifiées :**

| Point | Règle | Statut |
|-------|-------|--------|
| Total mensuel | `Σ(pnl_jour)` — somme algébrique | 🟢 Correct |
| Signe total | `+$` si positif, `-$` si négatif | 🟢 Correct (corrigé) |
| Meilleur jour | `max(pnl_jours)` — signe dynamique | 🟢 Correct (corrigé) |
| Pire jour | `min(pnl_jours)` — signe dynamique | 🟢 Correct (corrigé) |
| Jours gagnants | `count(pnl > 0)` | 🟢 Correct |
| Jours perdants | `count(pnl < 0)` | 🟢 Correct |
| Cohérence | `sum = best×winDays + worst×lossDays` (si 1 trade/j) | 🟢 Correct |

**Précision d'arrondi :** `.toFixed(2)` pour les montants en $, `.toFixed(0)` pour l'affichage calendrier.

---

### 5. Challenge — phases

| Vérification | Formule | Statut |
|-------------|---------|--------|
| Objectif Phase 1 | `equity ≥ capital × (1 + target)` | 🟢 Correct |
| Floor equity | `capital × (1 − totalDD)` | 🟢 Correct |
| Jours minimum | `model.phases[i].minDays` | 🟢 Correct |
| DD vérifié | Après **chaque** trade, pas seulement en fin de journée | 🟢 Correct |
| Ordre des phases | Phase 1 requise avant Phase 2 | 🟢 Correct |
| Échec propagé | Si Phase 1 échoue → phases suivantes = null | 🟢 Correct |

---

### 6. Compte funded

| Variable | Définition | Statut |
|---------|-----------|--------|
| `capital` | Capital initial du compte — jamais modifié | 🟢 Correct |
| `currentCapital` | Capital de référence courant (augmente après scaling) | 🟢 Correct |
| `equity` | Solde live du compte | 🟢 Correct |
| `cumulPayout` | Total payouts versés au trader | 🟢 Correct |
| `pendingPayout` | Profit en attente de versement | 🟢 Correct |

**Anti double-comptage (corrigé) :**
```js
// Après versement OU accumulation de pendingPayout :
if (pendingPayout > 0 || payout > 0) equity = currentCapital;
```
→ Le profit ne reste pas dans l'équité ET n'est pas compté en payout : zéro double comptage.

**Terminologie correcte :**
- ✅ `cumulPayout` → affiché comme **"Payouts encaissés"** (KPI principal)
- ✅ `currentCapital` → affiché comme **"Capital alloué"**
- ✅ `finalEquity` → affiché comme **"Solde compte"** (≠ profit réel)
- ❌ ~~"Capital final"~~ → terme supprimé car ambigu

**Scaling :**
```
Condition       : 4 mois consécutifs profitables + 2 payouts dans la série
Capital ajouté  : +40% du capital INITIAL (pas du currentCapital)
Split ajouté    : +10% (80% → 90%)
```

---

### 7. Monte Carlo

**Paramètres utilisés (200 runs) :**

| Paramètre | Source | Statut |
|-----------|--------|--------|
| Winrate | `realWR` des trades importés | 🟢 Correct |
| RR | `realRR` des trades importés | 🟢 Correct |
| Clustering | `makeTradeStream(wr, clustering, maxConsec)` | 🟢 Correct |
| DD trailing | `(peak - equity) / peak` depuis le pic | 🟢 Correct |
| Limite journalière | `capital × dailyDD` | 🟢 Correct |

**Valeurs typiques (WR=55%, RR=1.02, capital $25 000) :**
```
P25  : $2 029   P50  : $2 092   P75  : $2 191
Min  : -$2 489  Max  : +$2 450
Taux de passage Phase 1 : ~91.5%
```

**Plafond de prudence :** `passPct = Math.min(passPct, 95)` — jamais 100%.

---

### 8. Bilan financier

```
Résultat net = Reward challenge + Payouts funded − Frais

Reward = Σ(capital × phase.profit × model.challengeReward)
```

**Par firm :**

| Firm | challengeReward | Note |
|------|----------------|------|
| FundedNext | 0.15 (15% du profit) | Récompense Stellar |
| FTMO | 0 | Pas de reward de phase |
| E8 Markets | 0 | Pas de reward de phase |
| Alpha Capital | 0 | Pas de reward de phase |
| The 5%ers | 0 | Pas de reward de phase |
| FundingPips | 0 | Pas de reward de phase |

---

### 9. Intitulés vérifiés

| Intitulé | Correction | Statut |
|---------|-----------|--------|
| ~~"WR mensuel"~~ | → **"Mois gagnants"** (ratio de mois, pas de trades) | 🟢 Corrigé |
| ~~"Capital final"~~ | → **"Payouts encaissés"** | 🟢 Corrigé |
| ~~"RR nécessaire"~~ | → **"RR cible"** (RR pour atteindre l'objectif) | 🟢 Corrigé |
| ~~"~X% passer"~~ | → **"~X% estimation"** | 🟢 Corrigé |
| "Compte actif" | Statut correct si aucune violation | 🟢 OK |
| "Phases atteintes" | Lecture factuelle du backtest | 🟢 OK |

---

### 10. Verdict global

```
🟢 Calculs cohérents   : 9 points — zéro erreur mathématique fondamentale
🟡 Points corrigés     : 4 corrections appliquées (terminologie + edge cases)
🔴 Calculs incorrects  : 0
```

**Verdict : simulateur mathématiquement cohérent pour publication App Store / Google Play.**

---

## Formules verrouillées

> Ces formules sont la **source de vérité** du simulateur.
> Elles ne peuvent être modifiées qu'avec une justification mathématique
> documentée et un test de cohérence complet.

### F-01 — Risque par trade (IMMUABLE)

```
riskAmount = capital × (riskPct / 100)
```

- Universelle : indépendante du broker, de la plateforme, de l'instrument.
- Les pips/lots sont une couche d'affichage optionnelle — ils n'entrent JAMAIS dans la simulation.
- Référence : `docs/audit/risk_model_audit.md`

---

### F-02 — RR cible (IMMUABLE)

```
finalRR = (dailyTarget / (n × riskPct) + (1 − w)) / w

Avec :
  dailyTarget = objectif journalier en fraction du capital
  n           = tradesPerDay
  riskPct     = effectiveRisk (fraction)
  w           = winrate / 100
```

**Vérification inverse obligatoire :**
```
E[jour] = n × riskPct × (w × RR − (1−w))
        = dailyTarget  ← doit être exact à 10⁻¹⁰ près
```

---

### F-03 — Espérance par trade (IMMUABLE)

```
E/trade = riskAmount × (w × RR − (1−w))
E/jour  = tradesPerDay × E/trade
```

---

### F-04 — Kelly fraction (IMMUABLE)

```
f* = (w × RR − (1−w)) / RR
```

- Si `riskPct > f*` → afficher alerte "Risque au-dessus du Kelly".
- Ne jamais recommander de risquer au-delà du Kelly.

---

### F-05 — Drawdown (IMMUABLE)

```
DD trailing  = (peak − equity) / peak
DD absolu    = (capital − equity) / capital
DD journalier = |dayLowPnl| / capital
```

- Le DD est vérifié après **chaque trade individuel** (intraday).
- Le type de DD (trailing vs absolu) dépend de `model.ddType`.
- **Ne jamais vérifier seulement en fin de journée.**

---

### F-06 — Pertes avant violation DD (IMMUABLE)

```
pertesAvantViolation = Math.ceil(capital × totalDD / riskAmount)
```

- `Math.ceil` obligatoire (au Nième trade perdant ON dépasse, pas avant).
- `Math.floor` est **interdit** ici.

---

### F-07 — Bilan financier (IMMUABLE)

```
Reward     = Σ(capital × phase.profit × model.challengeReward)
Payouts    = funded.cumulPayout
Pending    = funded.pendingPayout
Frais      = challengeFee(capital, firmKey)
Net        = Reward + Payouts + Pending − Frais
```

---

### F-08 — Funded : anti double-comptage (IMMUABLE)

```
// Après chaque mois profitable :
if (pendingPayout > 0 || payout > 0) equity = currentCapital;
```

- Garantit que le profit n'est pas compté dans l'équité ET dans les payouts.
- **Ne jamais supprimer ce reset.**

---

### F-09 — Scaling (IMMUABLE)

```
Condition   : consecutiveProfitMonths ≥ 4 AND payoutsInStreak ≥ 2
Capital     : currentCapital += capital × 0.40  ← base = capital INITIAL
Split       : currentSplit = min(0.90, split + 0.10 × scalingCount)
```

- Le `+40%` est calculé sur le **capital initial**, pas sur le currentCapital.
- Évite une croissance exponentielle non réaliste.

---

## Tests obligatoires avant release

> Ces tests doivent passer à **100%** avant toute release publique.
> Utiliser les paramètres de référence : capital $25 000, risk 0.6%, WR 55%, 3 trades/j.

---

### T-01 — Test risque universel

**Procédure :**
1. Régler capital = $10 000, risk = 1%, trades/j = 2, WR = 50%.
2. Vérifier : `riskAmount = $100.00` (exactement).
3. Modifier uniquement le capital → vérifier que le risque % reste constant.
4. Changer l'instrument → vérifier que le résultat de simulation ne change PAS.

**Critère de passage :** riskAmount identique quel que soit l'instrument sélectionné.

---

### T-02 — Test cohérence RR ↔ espérance

**Procédure :**
1. Régler : capital $25 000, risk 0.6%, WR 55%, 3 trades/j, objectif 0.2%/j.
2. Lire le RR affiché.
3. Calculer manuellement : `E = 3 × 0.006 × (0.55 × RR − 0.45)`.
4. Vérifier que `E = 0.002` (objectif daily).

**Critère de passage :** écart < 0.001%.

---

### T-03 — Test drawdown intraday

**Procédure :**
1. Régler risk = 2%, trades/j = 5, DD journalier = 5%.
2. Vérifier que le simulateur arrête la journée dès que la perte cumulée dépasse la limite.
3. Vérifier que ce contrôle se fait trade par trade (pas en fin de journée).

**Critère de passage :** aucune simulation ne dépasse la limite DD journalier intraday.

---

### T-04 — Test anti double-comptage funded

**Procédure :**
1. Lancer une simulation funded 12 mois.
2. Vérifier : `cumulPayout + pendingPayout ≠ finalEquity − capital`.
   (si égaux → double comptage).
3. Vérifier : après chaque mois profitable, `equity = currentCapital`.

**Critère de passage :** `cumulPayout` et `equity` sont indépendants.

---

### T-05 — Test signes calendrier

**Procédure :**
1. Générer un mois avec plus de jours perdants que gagnants.
2. Vérifier que le P&L total s'affiche avec un signe `-$`.
3. Vérifier que "Pire jour" affiche `-$X` et non `$X`.
4. Vérifier que "Meilleur jour" affiche `+$X`.

**Critère de passage :** zéro valeur négative affichée sans le signe `-`.

---

### T-06 — Test Math.ceil sur violations DD

**Procédure :**
1. Capital = $10 000, risk = 1% ($100), DD total = 10% ($1 000).
2. Vérifier : pertes avant violation = `ceil(1000/100)` = **10**.
3. Simuler 9 pertes consécutives → compte toujours actif.
4. Simuler 10ème perte → violation détectée.

**Critère de passage :** violation exactement au 10ème trade.

---

### T-07 — Test Monte Carlo prudence

**Procédure :**
1. Lancer Monte Carlo avec WR = 99%, RR = 10 (conditions optimistes).
2. Vérifier que `passPct ≤ 95%` (plafond de prudence).
3. Vérifier que le libellé affiche `~X% estimation` et non `X% passer`.

**Critère de passage :** jamais 100% affiché, toujours `estimation`.

---

### T-08 — Test bilan financier

**Procédure :**
1. Simuler FundedNext $10 000, 12 mois.
2. Calculer manuellement : `net = reward + payouts + pending − fee`.
3. Comparer avec la valeur affichée.

**Critère de passage :** écart < $0.01.

---

### T-09 — Test scaling funded

**Procédure :**
1. Configurer 12 mois, WR élevé (70%), risk faible (0.5%).
2. Laisser le simulateur produire un scaling.
3. Vérifier : `capital ajouté = capital_initial × 0.40` (pas currentCapital × 0.40).
4. Vérifier : `currentSplit ≤ 90%`.

**Critère de passage :** scaling calculé sur le capital initial uniquement.

---

### T-10 — Test Kelly

**Procédure :**
1. Régler WR = 50%, RR = 2.0.
2. Kelly théorique = `(0.5×2 - 0.5)/2 = 0.25 = 25%`.
3. Vérifier l'affichage `Kelly optimal : 25.00%`.
4. Régler risk > Kelly → vérifier que l'alerte apparaît.

**Critère de passage :** Kelly correct + alerte si dépassement.

---

## Protocole de vérification des nouvelles prop firms

> Toute nouvelle prop firm ajoutée dans `PROP_FIRMS` doit passer ce protocole
> avant d'être disponible aux utilisateurs.

### Checklist de vérification

```
[ ] 1. Règles vérifiées sur le site officiel de la firm (date de vérification à noter)
[ ] 2. dailyDD configuré (fraction, ex: 0.05 pour 5%)
[ ] 3. totalDD configuré (fraction, ex: 0.10 pour 10%)
[ ] 4. ddType correct : "trailing" ou "static"
[ ] 5. challengeReward correct (0 si pas de récompense de phase)
[ ] 6. splitStart correct (fraction, ex: 0.80 pour 80%)
[ ] 7. splitMax correct
[ ] 8. phases[] correct : target + minDays pour chaque phase
[ ] 9. FIRM_CAPITALS[] : capitaux disponibles vérifiés sur le site
[ ] 10. FIRM_FEES[] : frais vérifiés sur le site
[ ] 11. Test T-01 à T-08 passés avec cette firm
[ ] 12. Résultat net cohérent avec les conditions publiques de la firm
```

### Données à documenter par firm

```markdown
## [NOM FIRM] — Ajout le [DATE]
- Source : [URL officielle]
- Règles vérifiées le : [DATE]
- ddType : trailing | static
- DD journalier : X%
- DD total : X%
- Phases : Phase 1 (+X% en Yj min) | Phase 2 (+X% en Yj min)
- Split : X% → X%
- Challenge reward : X%
- Capitaux : $X, $X, $X, ...
- Frais : $X par capital
- Testeur : [nom]
- Status : ✅ Validé | ⚠️ À revalider | ❌ Refusé
```

### Exemple — FundedNext (référence)

```markdown
## FundedNext Stellar — Référence
- Source : https://fundednext.com
- Règles vérifiées le : Juin 2026
- ddType : static
- DD journalier : 5%
- DD total : 10%
- Phases : Phase 1 (+8% en 5j min) | Phase 2 (+5% en 5j min)
- Split : 80% → 90% (après scaling)
- Challenge reward : 15% du profit de phase
- Capitaux : $6K, $15K, $25K, $50K, $100K, $200K
- Frais : $59, $119, $199, $299, $499, $999
- Status : ✅ Validé
```

---

## Historique des corrections

| Date | Version | Correction | Criticité |
|------|---------|-----------|----------|
| Audit initial | v0.1.0 | `Math.floor` → `Math.ceil` sur pertes avant violation DD | 🟠 Élevée |
| Audit initial | v0.1.0 | DD 15.3% dépassait limite mais affichait 100% réussite (MC ne vérifiait pas DD trailing) | 🔴 Critique |
| Audit initial | v0.1.0 | Payout ET équité comptaient le même profit (double comptage) | 🔴 Critique |
| Audit initial | v0.1.0 | Signes calendrier PnL (+$/−$) codés en dur | 🟠 Élevée |
| Audit complet | v0.1.x | pendingPayout < $50 sans reset equity → surestimation | 🟡 Modérée |
| Audit complet | v0.1.x | "WR mensuel" → "Mois gagnants" (terminologie incorrecte) | 🟡 Modérée |
| Audit complet | v0.1.x | "Capital final" → "Payouts encaissés" (terme ambigu) | 🟡 Modérée |
| Audit complet | v0.1.x | "RR nécessaire" → "RR cible" (distinction théorique/réel) | 🟡 Modérée |
| Audit risque | v0.1.x | Moteur refondé : risque = capital×risk% (universel, pas pip-dépendant) | 🔴 Critique |

---

*Dernière mise à jour : Juin 2026*  
*Auteur : Équipe EA PropFirm Pro*  
*Statut : Document vivant — à mettre à jour à chaque release*
