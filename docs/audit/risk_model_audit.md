# MISSION 1 — Audit du modèle de risque

## Objectif
Identifier la variable fondamentale la plus universelle pour un simulateur destiné à
tout broker / toute plateforme / toute prop firm.

## Le problème avec le modèle actuel
Le moteur actuel calcule :

```
risque_$ = lot × pipValuePerLot × SL_pips
```

`pipValuePerLot` est une **valeur codée en dur** (ex : XAUUSD = 10 $/pip pour 1 lot).
Or cette valeur dépend :
- du **prix courant** de l'instrument (la valeur du pip d'une paire en JPY varie avec le taux),
- de la **taille de contrat** du broker (certains brokers cotent l'or en lots de 100 oz, d'autres 10 oz),
- de la **définition du pip** (5 chiffres vs 4 chiffres, points vs pips).

**Conséquence** : deux utilisateurs saisissant `lot 0.10 / SL 150 pips` peuvent avoir un
risque réel différent. Le modèle n'est pas portable.

## Comparaison des 4 modèles

| Option | Variables | Robuste ? | Compréhensible ? | Indépendant broker ? |
|--------|-----------|-----------|------------------|----------------------|
| **A** | Lot + SL (pips) | ❌ Non | Moyen | ❌ Non — dépend pip/contrat |
| **B** | Lot + Distance prix réelle | ⚠️ Partiel | Faible | ⚠️ Dépend encore de la valeur du point |
| **C** | Risque $ + Distance prix | ✅ Oui | Élevé | ✅ Oui |
| **D** | Risque % + Distance prix | ✅ Oui | Élevé | ✅ Oui |

### Analyse détaillée

**Option A — Lot + SL pips** *(modèle actuel)*
La conversion pip → dollars exige une table de valeurs par instrument qui n'est jamais
exacte pour tous les brokers. Rejeté.

**Option B — Lot + Distance prix réelle**
`risque = lot × contractSize × distancePrix`. Mieux, mais `contractSize` varie encore
selon le broker (100 oz vs 10 oz pour l'or, 100 000 vs 10 000 pour le forex mini/micro).
Toujours dépendant.

**Option C — Risque $ + Distance prix réelle**
Le trader saisit directement combien il risque en dollars. C'est **exact par définition** :
si je dis « je risque 150 $ sur ce trade », le résultat est 150 $ quel que soit le broker.
La distance prix sert uniquement à **déduire le lot** pour information, pas au calcul du risque.

**Option D — Risque % + Distance prix réelle**
Identique à C mais le risque est exprimé en % du capital (`risque_$ = capital × risk%`).
C'est la méthode des prop firms (« ne risque jamais plus de 1% par trade »).
Le % est **invariant** : 0,6% de 25 000 $ = 150 $ partout dans le monde.

## Conclusion

### La variable fondamentale universelle = le RISQUE (en $ ou en %)

Le risque en dollars (ou en % du capital) est :
- **la plus robuste** : c'est une donnée d'entrée exacte, pas une conversion approximée,
- **la plus compréhensible** : « je risque 150 $ » ou « je risque 0,6% » parle à tout trader,
- **totalement indépendante du broker** : aucun pip, aucun contractSize, aucune cotation.

### Recommandation retenue : Option D en primaire, C en secondaire

```
ENTRÉE PRINCIPALE   : Risque % du capital   (ou Risque $ — équivalents, bascule libre)
ENTRÉE OPTIONNELLE  : Distance SL (en prix ou en %)  → sert UNIQUEMENT à estimer le lot
SORTIE INFORMATIVE  : Lot suggéré, pips équivalents (si l'instrument est connu)
```

Le **cœur du moteur de simulation ne doit JAMAIS utiliser les pips**. Il doit travailler
exclusivement avec `risque_$ = capital × risk%`. Les pips/lots deviennent une couche
d'affichage optionnelle pour les traders qui veulent traduire en lot sur leur plateforme.

### Impact sur le code
- `lotRiskAmount = lot × pipValuePerLot × slPips` → **déclassé** en simple estimateur d'aide.
- `effectiveRiskAmount = capital × riskPct` devient la **seule source de vérité** du risque.
- La table `INSTRUMENTS` (pipValuePerLot) reste pour l'aide au calcul du lot, mais n'entre
  jamais dans la simulation de DD / verdict.
