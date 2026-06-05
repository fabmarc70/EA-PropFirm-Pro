# 🚦 RELEASE_PROTOCOL.md
> **Protocole officiel de validation avant toute release**
> EA PropFirm Pro — PWA React / Vercel
> Aucune release ne doit être effectuée sans valider l'intégralité de ce document.

---

## ⚠️ RÈGLE ABSOLUE

> **"Si 10 000 traders utilisent cette mise à jour aujourd'hui, suis-je certain qu'ils ne rencontreront aucun problème critique ?"**
> Si la réponse n'est pas **OUI catégorique** → **RELEASE BLOQUÉE.**

---

## PHASE 1 — VALIDATION TECHNIQUE

### Compilation & Build

```bash
# Depuis la racine du projet
npm install          # Zéro erreur d'installation
npm audit            # Zéro vulnérabilité critique
npm run build        # Doit afficher "✓ built in Xs" — zéro erreur
```

```bash
# Validation Babel (JSX)
./node_modules/.bin/babel --presets @babel/preset-react src/App.jsx -o /tmp/compiled_check.js
# → Zéro SyntaxError
```

```bash
# Test renderToString composants critiques
node -e "
global.React=require('react');
global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
// ... renderToString sur DashboardScreen, SimulatorScreen, MesTradesTab
"
```

### Checklist technique

```
□ npm run build → ✓ built in Xs (pas "exited with 1")
□ Zéro SyntaxError Babel
□ Zéro console.log de débogage oublié dans App.jsx
□ Zéro TODO critique non résolu
□ Zéro secret/token dans le code (grep "ghp_\|sk-\|SUPABASE_SERVICE")
□ Zéro mock de production actif
□ IDs SVG tous uniques (zéro doublon)
□ Clés React sur tous les .map()
□ try/catch sur tous les accès localStorage
□ export default App unique dans App.jsx
□ Palette couleurs conforme PROJECT_COMPASS.md (audit palette)
```

### Audit palette automatique (obligatoire)

```bash
python3 << 'EOF'
# Script d'audit palette — exécuter avant chaque release
import re
with open('src/App.jsx') as f:
    code = f.read()
lines = code.split('\n')
forbidden = {'#f59e0b': 'Alpha orange', '#60a5fa': 'FTMO blue', '#a78bfa': 'E8 purple'}
for color, name in forbidden.items():
    occ = [(i+1, l.strip()[:60]) for i, l in enumerate(lines)
           if color in l and 'PROP_FIRMS' not in l and 'FIRM_' not in l and 'FirmLogo' not in l]
    status = "✅ OK" if not occ else f"⚠️  {len(occ)} occurrences hors branding"
    print(f"{color} ({name}): {status}")
    for o in occ[:3]: print(f"   L{o[0]}: {o[1]}")
EOF
# Résultat attendu : ✅ OK pour toutes les couleurs
```

**Résultat attendu Phase 1 : 0 erreur bloquante**

---

## PHASE 2 — VALIDATION DONNÉES & RÈGLES PROP FIRMS

### Vérification des règles officielles 2026

```
□ FundedNext Stellar : P1=8% P2=5% DD/j=5% DD/tot=10% split=80→90%
□ FTMO              : P1=10% P2=5% DD/j=5% DD/tot=10% split=80→90%
□ E8 Markets        : P1=8%  P2=4% DD/j=5% DD/tot=8%  split=80→100%
□ Alpha Capital     : P1=8%  P2=4% DD/j=4% DD/tot=8%  split=80→90%
□ The 5%ers         : P1=8%  P2=5% DD/j=5% DD/tot=10% split=80→100%
□ FundingPips       : P1=8%  P2=5% DD/j=5% DD/tot=10% split=80→90%
□ Vérifier que dailyDD < totalDD pour chaque firm (CRITIQUE)
```

### Formules critiques — NE JAMAIS MODIFIER SANS REVALIDATION

```
□ PIP_VALUES["XAUUSD"] = 10.0 (pas 1.0)
□ finalRR = (dailyTarget / (tradesPerDay × effectiveRisk) + (1−w)) / w
□ effectiveRiskAmount = useFixedLot ? lotRiskAmount : capital × (riskPct/100)
□ Simulation intraday : DD vérifié après CHAQUE trade (pas en fin de journée)
□ Trades fractionnaires : Bernoulli(P=tradesPerDay) si tradesPerDay < 1
```

### Vérification localStorage keys

```
□ "eapropfirm_app"             → profil, auth, setup, lastSim
□ "eapropfirm_config"          → config simulateur
□ "eapropfirm_saved_configs"   → configs EA (max 12)
□ "eapropfirm_trades"          → trades importés
□ Aucune donnée sensible stockée en clair
```

**Résultat attendu Phase 2 : Zéro incohérence dans les règles**

---

## PHASE 3 — SÉCURITÉ

### Contrôles obligatoires

```bash
# Vérifier qu'aucun secret n'est dans le code
grep -r "ghp_\|sk-\|SUPABASE_SERVICE_ROLE\|password.*=.*['\"][a-z]" src/

# Vérifier .gitignore
cat .gitignore | grep ".env"

# Vérifier l'historique git (derniers commits)
git log --oneline -10
git diff HEAD~1 --name-only
```

### Checklist sécurité

```
□ Zéro token GitHub (ghp_...) dans le code
□ Zéro clé API dans App.jsx
□ Zéro credential Supabase hardcodé
□ Zéro donnée utilisateur de test en dur
□ Auth locale (mock) clairement identifiée dans le code
□ Mention "mock local — prêt Supabase OAuth" visible dans LoginScreen
□ localStorage ne contient aucun mot de passe
□ .env non pushé (vérifier .gitignore)
```

### Quand Supabase sera actif (futur)

```
□ VITE_SUPABASE_URL dans .env (jamais hardcodé)
□ VITE_SUPABASE_ANON_KEY dans .env (jamais hardcodé)
□ SERVICE_ROLE_KEY JAMAIS côté client
□ RLS activé sur toutes les tables
□ Règle : user ne peut lire/écrire que ses propres données
□ .env.example créé avec des valeurs factices
```

**Résultat attendu Phase 3 : Zéro secret exposé**

---

## PHASE 4 — TESTS UTILISATEUR (PARCOURS COMPLET)

Tester comme un **utilisateur vierge** (vider le localStorage avant) :

```javascript
// Dans la console du navigateur
localStorage.clear()
// Recharger la page → doit afficher LanguagePickerScreen
```

### Flow d'entrée

```
□ LanguagePickerScreen : globe SVG visible, 3 langues (FR/EN/ES), bouton Continuer
□ OnboardingScreen Slide 1 : titre rouge, comparaison 2 colonnes, 4 cartes, CTA
□ OnboardingScreen Slide 2 : titre vert, gauge 74%, cartes stats, badges check
□ OnboardingScreen Slide 3 : balance SVG, pricing, bouton CTA fonctionnel
□ Dots navigation fonctionnels (clic + swipe)
□ Bouton "Passer →" fonctionne sur slides 1 et 2
□ LoginScreen : boutons Google + Apple visibles, toggle "Se connecter"
□ LoginScreen "Continuer avec Google" → auth mock → accès ProfileSetup
□ ProfileSetupScreen Étape 2/3 : 6 firms avec logos SVG, tap → Étape 3/3
□ ProfileSetupScreen Étape 3/3 : capitaux spécifiques firm, frais affichés, Continuer
□ Dashboard affiché après setup complet
```

### Navigation principale

```
□ Navbar 5 onglets visibles et fonctionnels
□ Accueil (🏠) → Dashboard
□ Simulateur (📊) → SimulatorScreen avec toggle Challenge/Funded
□ Mes Trades (📋) → Import zone + (si trades) verdict + stats
□ Monte Carlo (🎲) → Résumé stats + Monte Carlo
□ Profil (👤) → Langue / Firm / Capital / Logout / Reset
□ Indicateur vert (ligne) sur l'onglet actif
□ safe-area-inset respecté sur iPhone (pas de contenu coupé)
```

### Retour arrière

```
□ Bouton < dans LoginScreen fonctionne (retour onboarding si nécessaire)
□ "Changer" dans ProfileSetup Étape 3/3 revient à l'Étape 2/3
□ Profil → "Changer firm" ne casse pas le simulateur
□ Reset app → revient au LanguagePickerScreen
```

**Résultat attendu Phase 4 : Zéro blocage utilisateur**

---

## PHASE 5 — TESTS DES FONCTIONNALITÉS

### Simulateur — Configuration EA

```
Fonction : Sélection prop firm + modèle
□ Ouverture : cartes firm visibles, modèles dynamiques selon firm
□ Utilisation : changer firm → modèle se réinitialise au premier disponible
□ Extrême : FTMO 1-Step → règles différentes de 2-Step
□ Erreur : finalRR négatif → message d'erreur visible (pas de crash)
□ Sauvegarde : config persistée en localStorage après changement
Validé : ___

Fonction : Module LOT AUTO (XAUUSD)
□ Ouverture : toggle vert visible, inputs instrument/lot/SL
□ Utilisation : 0.1 lot × SL 150 pips XAUUSD = 150$ risque (CRITIQUE)
□ Extrême : SL 0 pips → risque = 0$, RR invalide
□ Erreur : avertissement si risque > 2% capital
□ Sauvegarde : persisté dans eapropfirm_config
Validé : ___

Fonction : Presets EA (v4 Goldstrom, GoldPulse V20)
□ Ouverture : boutons preset visibles
□ Utilisation : click v4 → paramètres chargés, click GoldPulse V20 → autres params
□ Extrême : preset puis modification manuelle → mode "Manuel" actif
□ Erreur : aucun crash si preset incomplet
□ Sauvegarde : activePreset conservé
Validé : ___
```

### Simulateur — Résultats

```
Fonction : Simulation Challenge (phases)
□ Ouverture : tab Challenge visible
□ Utilisation : courbe equity affichée, KPIs (profit, DD, jours)
□ Extrême : WR 1% → message "combinaison impossible" (pas de crash)
□ Extrême : 0 trades/jour → gestion correcte
□ Erreur : simulation fail → état "Échoué" avec raison
□ Sauvegarde : résultats en mémoire React (pas persisté entre sessions)
Validé : ___

Fonction : Simulation Funded (revenus)
□ Ouverture : tab Funded visible, courbe payout
□ Utilisation : payout cumulé, tableau mensuel, calendrier PnL
□ Extrême : 24 mois simulation → performance correcte (< 2 secondes)
□ Erreur : si phases échouées → tab Funded vide avec message
Validé : ___

Fonction : Monte Carlo (200 runs)
□ Ouverture : résumé stats + bouton lancer
□ Utilisation : 200 simulations → taux de passage, distribution DD
□ Extrême : 200 runs sur config risquée → résultats < 2 secondes
□ Erreur : winrate invalide → bloqué avant lancement
Validé : ___
```

### Import Trades (Mes Trades)

```
Fonction : Import CSV MT4/MT5
□ Ouverture : zone upload visible, instructions CSV + HTML
□ Utilisation : fichier CSV valide → trades chargés, verdict affiché
□ Extrême : CSV 500 lignes → chargement < 2 secondes
□ Extrême : CSV mal formé → message d'erreur clair (pas de crash)
□ Erreur : colonne Profit manquante → erreur explicite
□ Sauvegarde : trades persistés dans "eapropfirm_trades"
Validé : ___

Fonction : Import HTML Backtest MT4/MT5
□ Ouverture : même zone, accepte .html
□ Utilisation : fichier HTML MT4 → trades parsés via DOMParser
□ Extrême : HTML sans table de trades → erreur "Aucune table trouvée"
□ Extrême : séparateurs FR (virgule) → correctement parsés
Validé : ___

Fonction : Verdict Challenge
□ Verdict VIABLE / RISQUE ÉLEVÉ / INCOMPATIBLE → affiché
□ Pourcentage de réussite (Mini MC 200 runs) → visible
□ Gauge cohérence (0-100%) → visible avec valeur correcte
□ 4 KPIs réels vs simulation → tous affichés
□ 3 facteurs clés → listés avec couleurs sémantiques
Validé : ___
```

### Dashboard

```
Fonction : Affichage après simulation
□ Simulation en cours → progression bar correcte
□ 4 stat boxes (Phase 1, DD/j, DD/tot, Split) → valeurs réelles
□ Chart performance → courbe equity de la simulation
□ Filtre période (7J/30J/90J/Tout) → courbe filtrée
□ Règles du challenge → 4 règles avec statuts (✓ ou ⚠️)
□ Statistiques → gauge winrate, trades gagnants/perdants
□ Configs sauvegardées → liste chargeable
Validé : ___

Fonction : Sauvegarde config EA depuis simulateur
□ Bouton "★ Sauvegarder cette config" visible sur tab Challenge/Funded
□ Clic → config apparaît sur Dashboard
□ Dashboard → "Charger" → simulateur chargé avec cette config
□ Suppression config (×) → retirée de la liste
Validé : ___
```

**Résultat attendu Phase 5 : Toutes fonctionnalités Validé = Oui**

---

## PHASE 6 — MONÉTISATION (À ACTIVER)

> ⚠️ Cette phase est **en attente** — monétisation non encore implémentée.
> Activer et compléter quand Stripe/RevenueCat sera intégré.

```
□ Paywall visible pour utilisateurs non premium
□ Abonnement mensuel 9,99€ fonctionnel
□ Abonnement annuel 79,99€ fonctionnel
□ Restauration achat fonctionnelle
□ Annulation abonnement → downgrade correct
□ Utilisateur premium → accès complet
□ Utilisateur gratuit → limites appliquées
□ RevenueCat entitlements corrects
□ Prix affichés en devise locale
```

**Status Phase 6 : 🔒 En attente d'implémentation**

---

## PHASE 7 — TESTS DE PERFORMANCE

### Objectifs

```
□ Démarrage app (cold start) : < 3 secondes
□ Changement d'onglet navbar : < 200ms
□ Lancement simulation 2-Step : < 1 seconde
□ Monte Carlo 200 runs : < 2 secondes
□ Import CSV 200 trades : < 1 seconde
□ Import HTML backtest : < 2 secondes
□ Rendu dashboard complet : < 500ms
□ Build Vite production : < 15 secondes
```

### Test performance réel

```bash
# Lighthouse CLI (score cible > 90)
npx lighthouse https://ea-prop-firm-pro.vercel.app --output=json

# Vérifier dans DevTools → Performance
# TTI (Time to Interactive) < 3s
# LCP (Largest Contentful Paint) < 2.5s
# CLS (Cumulative Layout Shift) < 0.1
```

### Si supérieur aux objectifs

```
□ Créer une tâche d'optimisation dans PROJECT_COMPASS.md Section 9
□ Identifier le composant lent (React DevTools Profiler)
□ Appliquer lazy loading / memoization
□ Revalider après correction
```

**Résultat attendu Phase 7 : Aucune page > 2 secondes**

---

## PHASE 8 — TESTS OFFLINE (PWA)

```bash
# DevTools → Network → Offline
# Recharger la page
```

```
□ App se charge depuis le service worker (cache)
□ Simulateur fonctionne sans réseau (localStorage)
□ Import CSV/HTML fonctionne sans réseau
□ Message d'erreur clair si action nécessite réseau
□ Retour réseau → app reprend sans crash
□ localStorage non perdu au passage offline/online
□ Manifest PWA correct (icônes 192px + 512px présentes)
□ App installable depuis browser (bouton "Ajouter à l'écran d'accueil")
```

### Vérifier le service worker

```bash
# Dans le build dist/
ls dist/sw.js       # doit exister
ls dist/workbox-*   # doit exister
# DevTools → Application → Service Workers → Activé
```

**Résultat attendu Phase 8 : App stable offline**

---

## PHASE 9 — TESTS MOBILE (PWA installée)

### iOS (iPhone — priorité)

```
□ Safari → Partager → Ajouter à l'écran d'accueil → icône apparaît
□ Lancement depuis icône → plein écran (pas de barre Safari)
□ safe-area-inset-top respecté (pas de contenu sous l'encoche)
□ safe-area-inset-bottom respecté (pas de contenu sous la home bar)
□ Navbar fixe en bas → ne chevauche pas le contenu
□ Boutons CTA (borderRadius 100) → correctement rendus
□ Fonts système iOS natifs
□ Scroll fluide (pas de saccades)
□ Toutes les fonctionnalités accessibles
□ Login Google mock → fonctionne en PWA installée
```

### Android

```
□ Chrome → Installer → icône apparaît
□ Lancement depuis icône → plein écran
□ Navigation gesture (swipe) ne conflicte pas avec l'app
□ Scrolls fluides
□ Toutes fonctionnalités accessibles
```

### Écrans testés

```
□ iPhone SE (375px — petit écran)
□ iPhone 14 Pro (393px — standard)
□ iPad (768px — tablette)
□ Desktop (1440px — vérification)
```

**Résultat attendu Phase 9 : Zéro anomalie sur iPhone**

---

## PHASE 10 — TESTS IOS SPÉCIFIQUES

```
□ Globe SVG onboarding — rendu correct (pas de distorsion)
□ SVG logos prop firms — tous visibles
□ Gradient "Inscription rapide et sécurisée" — rendu iOS (WebkitBackgroundClip)
□ Backdrop blur navbar — rendu correct sur Safari
□ Charts Recharts — AreaChart visible et fluide
□ Gauge SVG Monte Carlo/Stats — strokeDasharray correct
□ Calendrier PnL — cells colorées visibles
□ Input file (import CSV/HTML) — accessible sur iOS Safari
□ localStorage — persistance entre sessions iOS
```

### Compatibilité CSS critique iOS

```
□ backdrop-filter: blur(20px) → actif (avec -webkit-backdrop-filter)
□ WebkitBackgroundClip: text → actif (gradient text)
□ env(safe-area-inset-*) → fonctionnel
□ position: fixed → pas de bug scroll iOS
```

**Résultat attendu Phase 10 : Zéro anomalie Safari iOS**

---

## PHASE 11 — CHECKLIST VERCEL (AVANT PUSH PROD)

```
□ Branch main à jour (git status clean)
□ PROJECT_COMPASS.md mis à jour
□ RELEASE_PROTOCOL.md complété pour cette release
□ Commit message descriptif (feat/fix/refactor...)
□ Build local validé (npm run build → ✓)
□ Audit palette validé (zéro couleur hors-palette)
□ Aucun secret dans le diff (git diff HEAD~1)
□ Version notée dans le log de release ci-dessous
```

### Variables d'environnement Vercel (actuelles)

```
Aucune variable ENV requise actuellement (localStorage uniquement).
À ajouter quand Supabase sera actif :
□ VITE_SUPABASE_URL
□ VITE_SUPABASE_ANON_KEY
```

**Résultat attendu Phase 11 : Push clean et tracé**

---

## PHASE 12 — BETA OBLIGATOIRE (AVANT PUBLICATION STORE)

> Applicable uniquement pour les **versions majeures** ou publications App Store / Google Play.

```
□ Déploiement Vercel preview (branch staging)
□ Test par le développeur (Fabrice)
□ Test par 2-3 utilisateurs bêta minimum
□ Durée minimale : 72 heures en beta
□ Zéro crash critique remonté
□ Zéro bug bloquant remonté
□ Retours utilisateurs documentés
```

### Critères de blocage release

```
❌ Crash au lancement
❌ Simulation donnant des résultats incohérents (ex: DD négatif)
❌ Import CSV/HTML ne fonctionnant pas
❌ Navbar bloquée ou invisible
❌ localStorage corrompu
❌ Build Vite en erreur
❌ Zéro secret dans le code
```

**Si un critère de blocage est présent → RELEASE INTERDITE.**

---

## PHASE 13 — VALIDATION FINALE

### Question de validation

> **"Si 10 000 traders ouvrent cette version aujourd'hui pour simuler leur challenge :**
> - Peuvent-ils sélectionner leur prop firm et simuler ? ✓/✗
> - Les règles officielles 2026 sont-elles exactes ? ✓/✗
> - Peuvent-ils importer leur historique MT4/MT5 ? ✓/✗
> - Le verdict challenge est-il fiable ? ✓/✗
> - L'app est-elle stable offline ? ✓/✗
> - Aucun trader ne verra un bug bloquant ? ✓/✗"**

### Autorisation release

```
□ TOUTES les phases complétées
□ TOUS les critères de blocage absents
□ Développeur (Fabrice) a signé la validation ci-dessous
```

**Validé par :** _______________________
**Date :** _______________________
**Version :** _______________________

---

## PHASE 14 — POST RELEASE (SURVEILLANCE 48H)

### Monitoring à surveiller

```
□ Vercel Analytics → Traffic, erreurs 4xx/5xx
□ Console.log navigateur (si Sentry intégré)
□ Retours utilisateurs (email, feedback in-app)
□ GitHub Issues (si ouvert au public)
```

### À surveiller spécifiquement

```
□ Simulation donnant des résultats absurdes
□ Import CSV/HTML cassé
□ Dashboard vide après simulation
□ Navbar disparue ou bloquée
□ App blanche (white screen of death)
```

---

## LOG DES RELEASES

| Date | Version | Phases validées | Problèmes post-release | Correctifs |
|---|---|---|---|---|
| 2025-06 | v0.1.0 | 1-5, 7-9 | — | — |

### Détail v0.1.0 (Juin 2025)
**Périmètre :**
- 6 prop firms (règles 2026)
- Simulateur moteur trade-par-trade
- Import CSV + HTML MT4/MT5
- Verdict challenge Monte Carlo
- Dashboard complet
- Onboarding 3 slides FR/EN/ES
- Login Google + Apple (mock local)
- PWA Vercel

**Phase 6 (Monétisation) :** Non applicable — en attente  
**Phase 12 (Beta store) :** Non applicable — pas encore sur les stores  
**Prochaine version :** v0.2.0 — Supabase OAuth + persistance cloud

---

## ANNEXE — COMMANDES RAPIDES

```bash
# Audit complet avant release
npm run build && echo "✅ Build OK" || echo "❌ Build FAILED"

# Vérifier secrets
grep -r "ghp_\|sk-\|password.*=.*'" src/ && echo "⚠️ SECRET DÉTECTÉ" || echo "✅ Aucun secret"

# Vérifier IDs SVG uniques
python3 -c "
import re
code = open('src/App.jsx').read()
ids = re.findall('id=\"([^\"]+)\"', code)
from collections import Counter
dups = {k:v for k,v in Counter(ids).items() if v>1}
print('IDs dupliqués:', dups if dups else '✅ Aucun')
"

# Build Vite
npm run build 2>&1 | grep -E "built in|error|Error"

# Git status propre
git status && git log --oneline -5
```

---

*Protocole créé : Juin 2025*
*Référence : PROJECT_COMPASS.md*
*Ce fichier doit être complété et signé avant chaque release*
