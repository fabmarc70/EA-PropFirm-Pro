# 📚 LESSONS LEARNED
> Base de connaissances des erreurs rencontrées sur EA PropFirm Pro
> **Directive : après chaque bug important → documenter → corriger → prévenir**
> Ce document rend le projet plus intelligent à chaque erreur.

---

## INDEX

| # | Titre | Date | Niveau | Statut |
|---|---|---|---|---|
| LL-001 | Variables hors scope dans JSX (lotDiagJSX) | 2025-05 | 🔴 Critique | ✅ Résolu |
| LL-002 | PIP_VALUES XAUUSD incorrect (1.0 au lieu de 10.0) | 2025-05 | 🔴 Critique | ✅ Résolu |
| LL-003 | Accolades non fermées après suppression de bloc | 2025-05 | 🔴 Critique | ✅ Résolu |
| LL-004 | Verdict dashboard invisible en SSR (useEffect) | 2025-05 | 🟡 Moyen | ✅ Résolu |
| LL-005 | IDs SVG dupliqués entre composants | 2025-05 | 🟡 Moyen | ✅ Résolu |
| LL-006 | localStorage sans try/catch → crash silencieux | 2025-05 | 🟡 Moyen | ✅ Résolu |
| LL-007 | Couleurs firm branding infiltrées dans UI générique | 2025-06 | 🟢 Faible | ✅ Résolu |
| LL-008 | Données onSimResult insuffisantes pour le Dashboard | 2025-06 | 🟡 Moyen | ✅ Résolu |
| LL-009 | Ancien corps de MesTradesTab laissé en orphelin | 2025-05 | 🔴 Critique | ✅ Résolu |
| LL-010 | Étape langue redondante dans ProfileSetup | 2025-06 | 🟢 Faible | ✅ Résolu |
| LL-011 | useEffect pour lecture localStorage → données absentes au mount | 2025-05 | 🟡 Moyen | ✅ Résolu |
| LL-012 | Em-dashes (—) dans le JSX → erreur esbuild | 2025-05 | 🟡 Moyen | ✅ Résolu |
| LL-013 | str_replace non unique → remplacement multiple indésiré | 2025-05 | 🟡 Moyen | ✅ Résolu |
| LL-014 | Slider trades/jour min=1 → impossible de simuler <1 trade/jour | 2025-05 | 🟡 Moyen | ✅ Résolu |

---

---

## LL-001 — Variables hors scope dans JSX (lotDiagJSX)

**Date :** 2025-05

**Contexte :**
Développement du module LOT AUTO dans SimulatorScreen. Un bloc JSX complexe (`lotDiagJSX`) a été créé comme IIFE (Immediately Invoked Function Expression) dans le composant App(). Un script Python d'extraction a ensuite copié ce bloc dans deux autres composants (`MesTradesTab` et `CalendrierPnL`).

**Problème :**
`risk is not defined` — erreur runtime au chargement de la page blanche.

**Cause racine :**
`lotDiagJSX` référençait des variables (`risk`, `useFixedLot`, `effectiveRiskAmount`, etc.) définies dans le scope de `App()`. En étant copié dans `MesTradesTab` et `CalendrierPnL`, ces variables n'existaient plus dans le scope local.

**Impact :**
🔴 **Critique** — Page blanche complète, application inutilisable. Crash silencieux sans message d'erreur clair dans la console.

**Solution appliquée :**
1. Suppression des deux copies orphelines de `lotDiagJSX` dans les composants enfants
2. `lotDiagJSX` reste uniquement dans `App()` où ses variables de scope existent
3. Ajout d'une vérification systématique : scan de tous les composants ≠ App() pour détecter les variables hors scope

**Comment détecter ce problème plus tôt :**
```bash
# Tester le rendu de CHAQUE composant individuellement
node -e "renderToString(React.createElement(MesTradesTab, {...}))"
node -e "renderToString(React.createElement(CalendrierPnL, {...}))"
# Une erreur "X is not defined" indique un problème de scope
```

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : Toujours tester `renderToString()` composant par composant avant le build
- ✅ RÈGLE : Ne jamais copier un bloc JSX d'un composant parent vers un enfant sans vérifier les dépendances
- ✅ RÈGLE : Les variables calculées (IIFE) dans App() ne peuvent être utilisées QUE dans App()
- ✅ Checklist build : `renderToString(SimulatorScreen)` + `renderToString(MesTradesTab)` + `renderToString(MonteCarloTab)` + `renderToString(CalendrierPnL)`

**Niveau :** 🔴 Critique

---

## LL-002 — PIP_VALUES XAUUSD incorrect (1.0 au lieu de 10.0)

**Date :** 2025-05

**Contexte :**
Développement du module LOT AUTO pour le calcul du risque par trade sur XAUUSD. La constante `PIP_VALUES["XAUUSD"]` avait été initialisée à `1.0`.

**Problème :**
Le risque calculé pour 0.1 lot × 150 pips SL XAUUSD était de **$15** au lieu de **$150**. Erreur d'un facteur ×10 sur le risque.

**Cause racine :**
Confusion entre "pip" (1 point = $1/lot) et la vraie valeur pip XAUUSD ($10/pip/lot standard). Sur l'or (XAUUSD), 1 pip = $10 pour 1 lot standard, soit **$1/pip pour 0.1 lot**.

**Formule correcte :**
```
XAUUSD : 0.1 lot × 10$/pip × 150 pips SL = $150 risque
PIP_VALUES["XAUUSD"] = 10.0  ✅ (pas 1.0 ❌)
```

**Impact :**
🔴 **Critique** — Tous les calculs de risque sur XAUUSD étaient 10 fois trop faibles. La simulation sous-estimait massivement le risque réel.

**Solution appliquée :**
```javascript
PIP_VALUES = {
  "XAUUSD": 10.0,  // ✅ corrigé
  "EURUSD": 10.0,
  "GBPUSD": 10.0,
  "USDJPY": 9.1,
  // ...
}
```

**Comment détecter ce problème plus tôt :**
```javascript
// Test de validation après toute modification de PIP_VALUES
const risk = 0.1 * PIP_VALUES["XAUUSD"] * 150; // doit = 150
console.assert(risk === 150, `XAUUSD risk incorrect: ${risk}`);
```

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : Valider manuellement : `lot × pipVal × SL = risque$ attendu` avant toute release
- ✅ RÈGLE : Ajouter un test de cohérence dans RELEASE_PROTOCOL.md Phase 2
- ✅ RÈGLE : Documenter chaque PIP_VALUE avec son instrument et sa source (broker)
- ✅ Note : PIP_VALUES peut varier légèrement selon les brokers — utiliser la valeur standard MT4/MT5

**Niveau :** 🔴 Critique

---

## LL-003 — Accolades non fermées après suppression de bloc de code

**Date :** 2025-05

**Contexte :**
Suppression de l'ancien corps de `MesTradesTab` (code orphelin après réécriture complète du composant). La suppression via script Python avait mal calculé les bornes du bloc à supprimer.

**Problème :**
`'export' may only appear at the top level` — erreur Babel à la compilation. L'application ne se compilait plus du tout.

**Cause racine :**
Le script de suppression avait laissé une accolade ouvrante `{` non fermée entre la fin du nouveau `MesTradesTab` et le début du composant `CalendrierPnL`. Tout le code suivant (CalendrierPnL, NavBar, Root/App) se retrouvait **à l'intérieur** de cette accolade orpheline — donc à profondeur 1 au lieu de 0.

**Impact :**
🔴 **Critique** — Compilation impossible. Application totalement cassée. Vercel rebuild échoué.

**Solution appliquée :**
Analyse par depth tracking ligne par ligne :
```javascript
// Script de diagnostic
let depth = 0;
lines.forEach((line, i) => {
  depth += (line.match(/\{/g)||[]).length;
  depth -= (line.match(/\}/g)||[]).length;
  if (depth === 1 && i > 2000) console.log(`L${i+1} [depth=1]: ${line}`);
});
// → Identifie exactement quelle accolade est orpheline
```

**Comment détecter ce problème plus tôt :**
```bash
# TOUJOURS compiler avec Babel après toute suppression de bloc
./node_modules/.bin/babel --presets @babel/preset-react src/App.jsx -o /tmp/test.js
# Si "SyntaxError" → problème d'accolade
```

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : Après toute suppression de code, recompiler immédiatement avec Babel
- ✅ RÈGLE : Utiliser le script depth-tracking pour vérifier l'équilibre `{/}` si erreur mystérieuse
- ✅ RÈGLE : Les scripts de suppression Python doivent vérifier `content.count('{') == content.count('}')` après modification
- ✅ RÈGLE : Ne jamais supprimer un gros bloc en une seule opération — procéder par petites suppressions vérifiées

**Niveau :** 🔴 Critique

---

## LL-004 — Verdict dashboard invisible en SSR (useEffect)

**Date :** 2025-05

**Contexte :**
Le verdict challenge (VIABLE / RISQUE ÉLEVÉ / INCOMPATIBLE) dans `MesTradesTab` était calculé dans un `useEffect(() => {...}, [])`. En test SSR avec `renderToString()`, l'effet ne s'exécute pas.

**Problème :**
Le verdict était `null` au premier rendu. Dans le browser, il apparaissait après le mount — mais lentement et avec un flash de contenu manquant (UI vide puis verdict).

**Cause racine :**
`useState(null)` + `useEffect(() => setVerdict(compute()))` = le verdict n'existe pas au rendu initial. React SSR ne joue pas les effets. Le browser montre brièvement un état vide.

**Impact :**
🟡 **Moyen** — UX dégradée (flash), tests SSR impossibles, potentiel bug si l'utilisateur a des trades chargés et que le verdict n'apparaît pas.

**Solution appliquée :**
Calcul synchrone inline avant le `return` :
```javascript
// ❌ Avant (useEffect)
const [verdict, setVerdict] = useState(null);
useEffect(() => { setVerdict(computeVerdictSync(trades, initBal)); }, []);

// ✅ Après (calcul inline synchrone)
const verdict = trades.length > 0 && stats
  ? computeVerdictSync(trades, trades[0].balance - trades[0].profit)
  : null;
```

**Comment détecter ce problème plus tôt :**
```javascript
// Test SSR explicite
const html = renderToString(React.createElement(MesTradesTab, propsWithTrades));
if (!html.includes("VIABLE") && !html.includes("RISQUE") && !html.includes("INCOMPATIBLE")) {
  console.error("Verdict manquant au rendu initial !");
}
```

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : Tout calcul **dérivé de props ou state existants** → calculer inline, pas dans useEffect
- ✅ RÈGLE : useEffect = uniquement pour les effets de bord (API calls, abonnements, timers)
- ✅ RÈGLE : Préférer `useMemo()` pour les calculs coûteux dérivés de state
- ✅ RÈGLE : Tester `renderToString()` sur chaque composant avec données chargées

**Niveau :** 🟡 Moyen

---

## LL-005 — IDs SVG dupliqués entre composants

**Date :** 2025-05

**Contexte :**
Plusieurs composants utilisaient des gradients SVG avec `id="gauge-g"`, `id="perf-fill"`, etc. Quand plusieurs composants étaient rendus simultanément dans le DOM, les IDs se dupliquaient.

**Problème :**
Le gradient du second composant "écrasait" celui du premier dans le DOM SVG. Certains graphiques affichaient des couleurs incorrectes ou des dégradés qui "sautaient" entre composants.

**Cause racine :**
Les IDs SVG sont **globaux dans le DOM HTML**. Si deux `<linearGradient id="gauge-g">` existent, le navigateur utilise le dernier rencontré, ignorant les précédents.

**Impact :**
🟡 **Moyen** — Visuels incorrects, gradients interchangés entre composants, difficile à diagnostiquer car intermittent (dépend de l'ordre de rendu).

**Solution appliquée :**
Convention de nommage : **préfixe unique par composant + couleur dans l'ID**
```javascript
// ❌ Avant
id="gauge-g"    // dans MonteCarloTab ET DashboardScreen
id="perf-fill"  // partout

// ✅ Après
id="gauge-mc-g"      // MonteCarloTab uniquement
id="gauge-dash-g"    // DashboardScreen uniquement
id="perf-fill"       // unique dans App.jsx
id="ftmo-g"          // unique par firm dans FirmLogo
id="fn-g"            // FundedNext
id="e8-g"            // E8 Markets
```

**Comment détecter ce problème plus tôt :**
```python
# Script de détection automatique (intégré dans audit palette)
import re
from collections import Counter
ids = re.findall('id="([^"]+)"', open('src/App.jsx').read())
dups = {k:v for k,v in Counter(ids).items() if v > 1}
print("IDs dupliqués:", dups if dups else "✅ Aucun")
```

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : Convention `{composant}-{type}-{couleur}` pour tous les IDs SVG
- ✅ RÈGLE : Audit IDs automatique dans RELEASE_PROTOCOL.md Phase 1
- ✅ RÈGLE : Ne jamais copier-coller un SVG avec gradient sans renommer l'ID

**Niveau :** 🟡 Moyen

---

## LL-006 — localStorage sans try/catch → crash silencieux en mode privé

**Date :** 2025-05

**Contexte :**
De nombreux accès `localStorage.getItem()` et `localStorage.setItem()` étaient faits directement sans protection.

**Problème :**
En mode navigation privée Safari iOS, `localStorage` lève une exception `SecurityError: DOM Exception 18` à chaque accès. L'application crashait silencieusement (page blanche) pour tous les utilisateurs iOS en mode privé.

**Cause racine :**
Safari en mode privé (Private Browsing) désactive localStorage et lève une exception plutôt que de retourner null. Firefox et Chrome retournent null ou fonctionnent normalement.

**Impact :**
🟡 **Moyen** — Crash complet pour les utilisateurs Safari iOS en mode privé. Sur mobile, le mode privé est très utilisé.

**Solution appliquée :**
Wrapper systématique de tous les accès localStorage :
```javascript
// ❌ Avant
const raw = localStorage.getItem("eapropfirm_config");

// ✅ Après
const raw = (() => {
  try { return localStorage.getItem("eapropfirm_config"); }
  catch (e) { return null; }
})();
```

Pour les écritures :
```javascript
// ✅ Pattern standard
try {
  localStorage.setItem("eapropfirm_config", JSON.stringify(data));
} catch (e) {
  // Silencieux — l'utilisateur perd juste la persistance
}
```

**Comment détecter ce problème plus tôt :**
```bash
# Chercher les accès localStorage sans try/catch
grep -n "localStorage\." src/App.jsx | grep -v "try\|catch\|}//"
# Toute ligne sans protection est potentiellement dangereuse
```

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : TOUT accès `localStorage` → dans un `try/catch`
- ✅ RÈGLE : Les lazy initializers `useState(() => { try {...} })` sont la meilleure pratique
- ✅ RÈGLE : Tester sur Safari iOS en mode privé avant chaque release
- ✅ CHECKLIST RELEASE : "localStorage fonctionne en mode navigation privée ?"

**Niveau :** 🟡 Moyen

---

## LL-007 — Couleurs firm branding infiltrées dans UI générique

**Date :** 2025-06

**Contexte :**
Après plusieurs sessions de développement, un audit automatique de la palette a révélé que des couleurs de branding des prop firms (`#60a5fa` pour FTMO, `#f59e0b` pour Alpha Capital) s'étaient infiltrées dans des composants génériques.

**Problème :**
- `#60a5fa` (bleu FTMO) utilisé pour le gradient du header LoginScreen
- `#60a5fa` utilisé pour "Profit split" dans le Dashboard
- `#f59e0b` (orange Alpha) utilisé pour le badge "LOT AUTO" (17 occurrences)
- `#fbbf24` utilisé pour "Payout versé" (information positive, pas un warning)

**Cause racine :**
Lors de développements rapides, des couleurs copiées d'un contexte (branding firm) ont été réutilisées dans un autre contexte (UI générique) sans vérification. L'absence d'un audit automatique permettait à ces dérives d'accumuler.

**Impact :**
🟢 **Faible** — Incohérence visuelle, palette non respectée. Pas de crash. Mais nuit à la qualité premium perçue.

**Solution appliquée :**
1. Audit automatique Python intégré dans le workflow
2. 4 corrections appliquées (→ voir PD-014 dans PRODUCT_DECISIONS.md)
3. Script d'audit ajouté dans RELEASE_PROTOCOL.md Phase 1

**Comment détecter ce problème plus tôt :**
```python
# Script d'audit palette — à exécuter avant chaque release
forbidden = {'#f59e0b': 'Alpha orange', '#60a5fa': 'FTMO blue', '#a78bfa': 'E8 purple'}
for color, name in forbidden.items():
    occ = [(i+1, l.strip()[:60]) for i, l in enumerate(lines)
           if color in l and 'PROP_FIRMS' not in l and 'FirmLogo' not in l]
    print(f"{color} ({name}): {'✅ OK' if not occ else f'⚠️ {len(occ)} occurrences hors branding'}")
```

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : Audit palette automatique avant chaque push important
- ✅ RÈGLE : Les couleurs de branding firm ne quittent JAMAIS `PROP_FIRMS` et `FirmLogo`
- ✅ RÈGLE : Tout nouveau élément UI → palette officielle PROJECT_COMPASS.md Section 2
- ✅ RÈGLE : Code review mentale : "Cette couleur est-elle dans la palette officielle ?"

**Niveau :** 🟢 Faible

---

## LL-008 — Données onSimResult insuffisantes pour le Dashboard

**Date :** 2025-06

**Contexte :**
Le Dashboard complet (progression, courbe equity, règles challenge, statistiques) nécessitait 20+ métriques issues du moteur de simulation. Or `onSimResult` ne transmettait que 6 champs : `{allPassed, net, firmKey, modelKey, capital, ts}`.

**Problème :**
Dashboard vide ou affichant des valeurs par défaut (0%, courbe vide, stats à zéro) même après une simulation réussie.

**Cause racine :**
La conception initiale de `onSimResult` était minimale (juste le résultat financier). Le Dashboard a été conçu bien après, avec des besoins de données beaucoup plus riches. Pas de rétrocompatibilité planifiée.

**Impact :**
🟡 **Moyen** — Dashboard inutilisable sans données réelles. UX cassée pour la fonctionnalité la plus visible.

**Solution appliquée :**
Extension complète de `onSimResult` pour transmettre toutes les métriques calculées par le moteur :
```javascript
onSimResult({
  allPassed, net, firmKey, modelKey, capital, ts,
  // Ajouts
  progression,           // % vers objectif Phase 1
  phase1Pct,             // profit Phase 1 en %
  ddDayPct, ddTotPct,    // DD atteint
  tradingDays,           // jours tradés
  phase1Target, dailyDDLimit, totalDDLimit,
  splitStart, splitMax,
  equityCurve,           // [{i, v}] pour le graphique
  dailyLog,              // [{day, pnl}] pour le calendrier
  winrate, rr,           // stats de config
  totalTrades, wins, losses,
  bestTrade, worstTrade,
  profitAmount,          // profit en $ absolu
});
```

**Comment détecter ce problème plus tôt :**
- Dès la conception d'un composant qui consomme des données d'un autre → définir le contrat de données avant d'implémenter
- Test Dashboard avec données réelles simulées en SSR

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : Définir le contrat de données (type, shape) avant de coder le composant consommateur
- ✅ RÈGLE : `onSimResult` est une interface — toute modification doit être rétrocompatible
- ✅ RÈGLE : Documenter dans PROJECT_COMPASS.md les données attendues par chaque composant majeur
- ✅ RÈGLE : Dashboard = test prioritaire après chaque modification du moteur de simulation

**Niveau :** 🟡 Moyen

---

## LL-009 — Ancien corps de MesTradesTab laissé en orphelin

**Date :** 2025-05

**Contexte :**
Réécriture complète de `MesTradesTab`. La méthode utilisée : `str_replace` pour remplacer le début du composant avec le nouveau code complet. L'ancien corps du composant (après la première ligne matchée) est resté dans le fichier.

**Problème :**
`'import' and 'export' may only appear at the top level` — erreur Babel. Impossible de compiler.

**Cause racine :**
`str_replace` a remplacé uniquement la portion matchée (la signature de la fonction). Le reste de l'ancien code (états, handlers, JSX) est resté orphelin — du code JavaScript valide mais hors de toute fonction, au niveau module.

**Impact :**
🔴 **Critique** — Build impossible. Vercel rebuild échoué.

**Solution appliquée :**
1. Analyse de la profondeur d'accolades ligne par ligne pour trouver la fermeture du nouveau composant
2. Suppression précise des lignes orphelines (2316 → 2526) avec Python
3. Vérification : `function CalendrierPnL` est bien la ligne suivante

**Comment détecter ce problème plus tôt :**
```bash
# Après toute réécriture de composant
./node_modules/.bin/babel --presets @babel/preset-react src/App.jsx -o /tmp/check.js
# Doit compiler sans erreur
```

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : Pour réécrire un composant → utiliser les bornes exactes (ligne start à ligne end)
- ✅ RÈGLE : Après `str_replace`, vérifier que le prochain `function` attendu est bien au bon endroit
- ✅ RÈGLE : Méthode préférée : `content[:start] + new_code + content[end:]` (bornes explicites)
- ✅ RÈGLE : Compiler IMMÉDIATEMENT après toute réécriture majeure
- ✅ RÈGLE : Ne jamais utiliser `str_replace` pour remplacer qu'une partie d'un composant — remplacer le tout

**Niveau :** 🔴 Critique

---

## LL-010 — Étape langue redondante dans ProfileSetup

**Date :** 2025-06

**Contexte :**
`ProfileSetupScreen` avait 3 étapes : Langue (1/3), Firm (2/3), Capital (3/3). Un `LanguagePickerScreen` séparé avait été créé pour afficher l'onboarding dans la bonne langue.

**Problème :**
L'utilisateur choisissait sa langue **deux fois** : une fois dans le LanguagePicker, une fois dans le ProfileSetup. Friction inutile, expérience dégradée.

**Cause racine :**
Les deux fonctionnalités ont été développées à des moments différents sans coordination. Le LanguagePicker a été ajouté après le ProfileSetup qui contenait déjà l'étape langue.

**Impact :**
🟢 **Faible** — UX dégradée (redondance), mais pas de crash. Setup 33% plus long que nécessaire.

**Solution appliquée :**
Suppression de l'étape langue du ProfileSetup (totalSteps : 3 → 2)
La numérotation "Étape 2/3" et "Étape 3/3" indique que la langue était l'étape 1/3 (LanguagePicker).

**Comment détecter ce problème plus tôt :**
- Tester le parcours complet bout-en-bout comme un utilisateur vierge (localStorage.clear())
- Question UX : "Est-ce que l'utilisateur fait la même chose deux fois ?"

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : Avant d'ajouter un écran au flow, vérifier si une fonctionnalité similaire existe ailleurs
- ✅ RÈGLE : Tester le parcours complet (LanguagePicker → Onboarding → Login → Setup → Dashboard) après chaque ajout d'écran
- ✅ RÈGLE : Documenter le flow dans PRODUCT_DECISIONS.md avant d'implémenter

**Niveau :** 🟢 Faible

---

## LL-011 — useEffect pour lecture localStorage → données absentes au mount

**Date :** 2025-05

**Contexte :**
Dans `DashboardScreen`, la liste des configs sauvegardées était lue depuis `localStorage` dans un `useEffect(() => {}, [])`.

**Problème :**
La liste apparaissait vide au premier rendu, puis se peuplait après le mount. En SSR (`renderToString`), les configs n'apparaissaient jamais. Flash de contenu vide visible sur mobile.

**Cause racine :**
`useState([])` + `useEffect(() => setConfigs(JSON.parse(...)))` = les données n'existent pas au premier rendu React. Le `useEffect` s'exécute **après** le paint initial.

**Impact :**
🟡 **Moyen** — Flash de contenu vide (mauvaise UX), tests SSR impossibles.

**Solution appliquée :**
Lazy initializer dans `useState` :
```javascript
// ❌ Avant
const [configs, setConfigs] = useState([]);
useEffect(() => {
  const raw = localStorage.getItem("eapropfirm_saved_configs");
  setConfigs(raw ? JSON.parse(raw) : []);
}, []);

// ✅ Après
const [configs, setConfigs] = useState(() => {
  try {
    const raw = localStorage.getItem("eapropfirm_saved_configs");
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
});
```

**Comment détecter ce problème plus tôt :**
```javascript
// Test SSR avec données présentes dans localStorage mock
global.localStorage = { getItem: (k) => JSON.stringify([{id:1, name:"Test"}]) };
const html = renderToString(<DashboardScreen .../>);
// Si html n'inclut pas "Test" → problème de timing
```

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : Lecture localStorage → **toujours** dans le lazy initializer `useState(() => {...})`
- ✅ RÈGLE : `useEffect` pour localStorage = uniquement pour les mises à jour après interaction utilisateur
- ✅ RÈGLE MNÉMOTECHNIQUE : "Lecture initiale = useState, Écriture réactive = useEffect"

**Niveau :** 🟡 Moyen

---

## LL-012 — Em-dashes (—) dans le JSX → erreur esbuild

**Date :** 2025-05

**Contexte :**
Des tirets longs (em-dashes `—`) avaient été utilisés dans des strings JSX (labels de graphiques, textes de cartes).

**Problème :**
Erreur esbuild au build Vite : `Unexpected character '—'`. Le build s'arrêtait avec code d'erreur 1.

**Cause racine :**
Le caractère Unicode `—` (U+2014 EM DASH) n'est pas toujours bien géré par certaines versions d'esbuild dans un contexte JSX. Il peut être mal interprété selon l'encodage du fichier ou la version de l'outil.

**Impact :**
🟡 **Moyen** — Build impossible, Vercel rebuild échoué, app inaccessible.

**Solution appliquée :**
Remplacement systématique de `—` par `-` (tiret simple ASCII) dans tout le JSX.
```javascript
// ❌ Avant
{ label: "Perte max — série", val: ... }

// ✅ Après
{ label: "Perte max - serie", val: ... }
```

**Comment détecter ce problème plus tôt :**
```bash
# Détecter les caractères non-ASCII dans le JSX
grep -Pn '[^\x00-\x7F]' src/App.jsx | head -20
# Tout caractère non-ASCII dans du code (pas dans des strings JSON) est suspect
```

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : Utiliser uniquement des caractères ASCII dans le code JSX
- ✅ RÈGLE : Les caractères spéciaux (€, —, →, ×) → uniquement dans des valeurs de données ou du JSX texte entre balises, jamais dans des clés ou des identifiants
- ✅ RÈGLE : Si un em-dash est nécessaire visuellement → utiliser `&mdash;` en HTML ou la string `" — "` dans JSX

**Niveau :** 🟡 Moyen

---

## LL-013 — str_replace non unique → remplacement multiple indésiré

**Date :** 2025-05

**Contexte :**
Utilisation de `str_replace` pour modifier une ligne de code présente à plusieurs endroits dans App.jsx (par exemple `const model = MODELS[modelKey];`).

**Problème :**
`str_replace` a remplacé TOUTES les occurrences de la chaîne, pas seulement celle ciblée. Cela a introduit des modifications non désirées dans des composants qui ne devaient pas être touchés.

**Cause racine :**
`str_replace` (outil Claude) requiert que la chaîne à remplacer soit **unique** dans le fichier. Une string identique à deux endroits = comportement imprévisible.

**Impact :**
🟡 **Moyen** — Code corrompu dans des composants non ciblés, nécessitant un rollback ou une correction manuelle.

**Solution appliquée :**
1. Toujours vérifier l'unicité avant str_replace : `grep -c "texte_à_remplacer" src/App.jsx`
2. Si non unique → ajouter du contexte pour rendre la chaîne unique (lignes avant/après)
3. Ou utiliser Python avec `content.replace(old, new, 1)` (remplace uniquement la première occurrence)

**Comment détecter ce problème plus tôt :**
```bash
# Avant tout str_replace, vérifier le nombre d'occurrences
grep -c "const model = MODELS\[modelKey\]" src/App.jsx
# Si > 1 → ajouter du contexte ou utiliser Python
```

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : Avant tout `str_replace`, vérifier que la chaîne est unique avec `grep -c`
- ✅ RÈGLE : Si la chaîne n'est pas unique → ajouter 2-3 lignes de contexte pour la rendre unique
- ✅ RÈGLE : Pour les remplacements en masse → utiliser Python `re.sub()` avec contexte explicite
- ✅ RÈGLE : Après tout `str_replace`, vérifier le résultat avec `grep -n` pour confirmer le bon emplacement

**Niveau :** 🟡 Moyen

---

## LL-014 — Slider trades/jour min=1 → impossible de simuler <1 trade/jour

**Date :** 2025-05

**Contexte :**
Le slider "Trades par jour" avait `min=1`. Or des EAs comme GoldPulse V20 font 0.28 trades/jour en moyenne (ils ne tradent pas tous les jours).

**Problème :**
Impossible de configurer une fréquence de trading inférieure à 1 trade/jour. La simulation était forcée à 1 trade/jour minimum, surévaluant significativement la performance des EAs à faible fréquence.

**Cause racine :**
L'hypothèse initiale de conception était "au moins 1 trade par jour". Les EAs basse fréquence (scalpers sélectifs, swing traders) ont des fréquences < 1.

**Impact :**
🟡 **Moyen** — Simulation incorrecte pour tous les EAs à faible fréquence (GoldPulse V20, swing traders). Performance surévaluée de 2 à 4×.

**Solution appliquée :**
```javascript
// ❌ Avant
<input type="range" min={1} max={10} step={1} />

// ✅ Après
<input type="range" min={0.1} max={10} step={0.05} />
```

Côté moteur : support Bernoulli pour les fréquences < 1 :
```javascript
const nTrades = tradesPerDay < 1
  ? (Math.random() < tradesPerDay ? 1 : 0)  // Bernoulli(P=tradesPerDay)
  : Math.round(tradesPerDay);
```

**Comment détecter ce problème plus tôt :**
- Tester le preset GoldPulse V20 immédiatement après création — il a `tradesPerDay: 0.28`
- Question UX : "Un utilisateur qui trade 1 fois tous les 3 jours peut-il configurer ça ?"

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : Les paramètres numériques → toujours vérifier les cas extrêmes (0, 0.1, très grand)
- ✅ RÈGLE : Tester tous les presets EA après chaque modification du simulateur
- ✅ RÈGLE : "Trades par jour" est une fréquence statistique, pas un entier — accepter les décimales

**Niveau :** 🟡 Moyen

---

## TEMPLATE — Nouvel incident

```markdown
## LL-XXX — [Titre court descriptif]

**Date :** YYYY-MM

**Contexte :**
[Situation lors de laquelle le problème est apparu]

**Problème :**
[Description précise du bug ou de l'erreur]

**Cause racine :**
[Pourquoi cela s'est produit — pas les symptômes, la vraie cause]

**Impact :**
🔴/🟡/🟢 **Critique/Moyen/Faible** — [Description de l'impact utilisateur et technique]

**Solution appliquée :**
[Code ou étapes exactes de la correction]

**Comment détecter ce problème plus tôt :**
[Tests, scripts, vérifications à ajouter]

**Comment éviter qu'il se reproduise :**
- ✅ RÈGLE : [règle 1]
- ✅ RÈGLE : [règle 2]
- ✅ RÈGLE : [règle 3]

**Niveau :** 🔴 Critique | 🟡 Moyen | 🟢 Faible
```

---

## STATISTIQUES

```
Total incidents documentés : 14
  🔴 Critique : 3  (LL-001, LL-003, LL-009)
  🟡 Moyen    : 8  (LL-002*, LL-004, LL-005, LL-006, LL-008, LL-011, LL-012, LL-013, LL-014)
  🟢 Faible   : 2  (LL-007, LL-010)
  * LL-002 reclassé Critique pour l'impact métier

Tous résolus : ✅ 14/14
Règles préventives générées : 42
```

---

*Document créé : Juin 2025*
*Référence : PROJECT_COMPASS.md Section 5 — Leçons Apprises*
*Ce fichier doit être mis à jour après chaque bug important rencontré*
