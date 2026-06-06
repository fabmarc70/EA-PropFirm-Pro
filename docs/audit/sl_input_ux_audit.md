# MISSION 2 — Audit UX du champ de saisie SL

## Question
Le champ `SL (pips)` est-il pertinent pour le grand public ?

## Réponse courte
**Non, pas comme champ principal.** Le pip est une notion de plateforme, pas une notion
de risque. Pour un simulateur de prop firm, le public raisonne en **risque** (% ou $),
pas en pips. Le pip doit être relégué à un affichage secondaire optionnel.

## Comparaison des interfaces

### Interface actuelle — `Lot + SL (pips)`
- **Niveau** : Trader MT4/MT5 habitué.
- **Problème** : exige de connaître la valeur du pip de son instrument chez son broker.
  Un débutant ne sait pas que 150 pips sur l'or ≠ 150 pips sur l'EURUSD en risque.
- **Verdict** : à conserver uniquement en mode avancé.

### Alternative — `Lot + Distance SL ($)`
- **Niveau** : Intermédiaire.
- **Avantage** : « mon SL est à 200 $ de mouvement » est plus concret que « 150 pips ».
- **Limite** : exige encore de connaître la taille de contrat pour relier lot ↔ $.

### Alternative avancée — `Lot + Distance SL ($) + pips équivalents auto`
- **Niveau** : Trader prop firm.
- **Avantage** : on saisit en dollars, on voit les pips se calculer automatiquement
  pour reporter l'ordre sur la plateforme. Pont entre les deux mondes.

### Alternative professionnelle — `Risque % + Distance SL ($) → Lot calculé auto`
- **Niveau** : Trader algorithmique / gestion de risque rigoureuse.
- **Avantage** : on fixe le risque (la seule chose qui compte pour une prop firm),
  on donne la distance SL, le lot est calculé. C'est le workflow d'un gérant de risque.
- **C'est le modèle recommandé par défaut.**

## Classement par profil

| Profil | Interface recommandée | Champ principal |
|--------|----------------------|-----------------|
| **Débutant** | Risque % (slider) seul, SL masqué | `Risque %` |
| **Intermédiaire** | Risque % + Distance SL ($) optionnelle | `Risque %` + `SL $` |
| **Trader prop firm** | Risque % + Distance SL ($) + lot auto + pips affichés | `Risque %` |
| **Trader algorithmique** | Risque % ou $ + Distance SL + lot + pips, tout visible | `Risque $/%` |

## Recommandation d'implémentation

1. **Champ principal partout** : `Risque %` (slider + saisie), avec bascule `Risque $`.
2. **Champ secondaire optionnel** : `Distance SL` — l'utilisateur choisit l'unité
   (% du prix / prix absolu / pips). Sert uniquement à estimer le lot.
3. **Sorties informatives** : Lot suggéré + pips équivalents, affichés en gris, jamais
   utilisés dans le calcul du risque.
4. **Mode débutant** : un seul slider « Combien risques-tu par trade ? » en %.

L'objectif : un trader peut utiliser le simulateur **sans jamais toucher au pip**, tout en
laissant les traders avancés convertir vers leur plateforme s'ils le souhaitent.
