# MISSION 5 — Audit de réalisme

## Question
Les résultats du simulateur sont-ils réalistes face à ce qu'un trader observe réellement
chez FTMO, FundedNext, FundingPips, The5ers, E8 ?

## Méthode
On ne dépend d'aucune plateforme : on raisonne en risque %, espérance et probabilité de
réussite, valeurs universelles.

## Hypothèses de référence (publiques, 2024-2026)
- Taux de réussite **phase 1** d'un challenge prop firm : ~10-25% des comptes (sources
  publiques agrégées : la majorité des comptes échouent).
- Taux de passage des **deux phases** : ~7-12%.
- Taux de traders **encore financés après 6 mois** : ~2-5%.
- Cause d'échec n°1 : violation du **drawdown** (journalier ou total), pas l'objectif de profit.

## Confrontation avec le simulateur

### Estimation prudente
Avec un risque 0,5-1%/trade, winrate 50%, RR 1.5 :
- Le Monte Carlo doit donner un **taux de passage challenge de 30-55%** (le trader simulé
  est discipliné, ce qui est au-dessus de la moyenne réelle car la moyenne inclut les
  traders indisciplinés).
- ✅ Cohérent si le moteur ne sur-optimise pas.

### Estimation moyenne
Risque 1-2%/trade, winrate 45-50% :
- Taux de passage 15-35%, survie funded plus faible.
- ✅ Réaliste.

### Estimation optimiste
Risque < 0,5%, winrate > 55%, RR > 2 :
- Taux de passage 60-80%.
- ⚠️ Réaliste **uniquement** si le trader tient ces stats dans la durée — ce que peu font.
  Le simulateur doit afficher un disclaimer (déjà en place).

## Risques d'irréalisme identifiés

1. **Compte funded gonflé** (corrigé en Mission 4) : sans ramener l'équité après payout,
   le compte affichait une croissance irréaliste. ✅ Corrigé.

2. **Absence de slippage / spread** : le simulateur suppose une exécution parfaite. Dans
   la réalité, le spread et le slippage réduisent l'espérance de 5-15%. ⚠️ À documenter
   (le RR réel est légèrement inférieur au RR théorique).

3. **Winrate constant** : le moteur utilise un winrate fixe. En réalité il varie selon les
   régimes de marché. Le clustering des pertes (déjà présent) compense partiellement.

4. **Pas de news/gaps** : les gros gaps (week-end, news) peuvent violer le DD instantanément.
   Le paramètre « news impact » existe mais est optionnel.

## Verdict de réalisme
Avec les corrections Mission 3 et 4, le simulateur produit des estimations **crédibles et
prudentes**, à condition de :
- toujours afficher les 3 scénarios (prudent / moyen / optimiste),
- rappeler que l'exécution réelle (spread, slippage, news) dégrade légèrement les résultats,
- ne jamais présenter un taux de réussite comme une certitude.

Le simulateur est un **outil d'aide à la décision et d'éducation au risque**, pas une
promesse de gain. Ce positionnement est juridiquement et éthiquement correct.
