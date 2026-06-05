# 🧭 PROJECT_COMPASS.md
> **Source de vérité absolue du projet EA PropFirm Pro**
> Toute IA, développeur ou contributeur doit lire ce fichier avant toute modification.
> Ce fichier est un document vivant — il s'enrichit après chaque session.

---

## SECTION 1 — VISION PRODUIT

### Mission
Permettre à tout trader de **simuler, analyser et optimiser** sa stratégie avant de payer un challenge prop firm — et ainsi maximiser ses chances de succès tout en protégeant son capital.

### Problème résolu
La plupart des traders échouent leur challenge prop firm non pas à cause d'une mauvaise stratégie, mais par **manque de préparation** : ils ne connaissent pas leurs vraies statistiques, ne testent pas leurs limites de drawdown, et ne comprennent pas les règles spécifiques de chaque firm.

Un challenge coûte entre 99$ et 1 080$. Un seul échec évité rembourse plusieurs mois d'abonnement.

### Utilisateur cible
- Trader manuel ou semi-automatique (EA/bot) avec 6 mois à 5 ans d'expérience
- Souhaite passer un challenge prop firm (FTMO, FundedNext, E8, Alpha Capital, The 5%ers, FundingPips)
- Utilise MT4 ou MT5 (export CSV/HTML de l'historique)
- Mobile-first (iPhone principalement)
- Langues : Français (primaire), Anglais, Espagnol

### Proposition de valeur
1. **Simulateur moteur trade-par-trade** avec règles officielles 2026 de 6 prop firms
2. **Import backtest réel** CSV (MT4/MT5) + HTML (rapport backtest MT4/MT5)
3. **Verdict challenge** avec probabilité de réussite via Monte Carlo (200 simulations)
4. **Score de cohérence** entre performances réelles et simulation (WR / RR / DD / PF)
5. **Multi-firm** : règles exactes et capitaux/frais spécifiques par firm
6. **Dashboard intelligent** : progression, règles, performance, statistiques

### Différences concurrentielles
| Concurrent | Limite | Notre avantage |
|---|---|---|
| Spreadsheets manuels | Pas de Monte Carlo | Simulations statistiques |
| Sites firm (simulateurs internes) | 1 seule firm | 6 firms comparables |
| Apps génériques | Pas d'import réel | Import CSV + HTML MT4/MT5 |
| Outils backtesting MT | Complexes | Interface mobile simple |

### Objectifs court terme (0-3 mois)
- [ ] Authentification Supabase OAuth (Google + Apple)
- [ ] Compte utilisateur réel avec persistance cloud
- [ ] Monétisation : abonnement mensuel 9,99€ / annuel 79,99€
- [ ] PWA installable (iOS + Android)

### Objectifs moyen terme (3-12 mois)
- [ ] Connexion directe MT4/MT5 via bridge ou webhook
- [ ] Alertes push (violation DD, objectif atteint)
- [ ] Partage de configs entre utilisateurs
- [ ] Leaderboard anonyme

### Vision long terme
Devenir la référence mondiale de la préparation aux prop firm challenges — SaaS B2C scalable, multilingue, multi-plateforme.

---

## SECTION 2 — IDENTITÉ VISUELLE

### Couleurs officielles
```
Accent principal  : #6ee7b7  (Mint Green — CTA, sélections, valeurs positives)
Accent secondaire : #059669  (Green Dark — gradients, hover)
Fond principal    : #000000  (Pure Black — écrans d'auth/onboarding)
Fond app          : #06090f  (Near Black — app principale)
Fond cartes       : rgba(255,255,255,0.03-0.07)  (Glass effect)
Texte principal   : #ffffff / #e2e8f0
Texte secondaire  : rgba(255,255,255,0.4-0.5)
Texte muted       : rgba(255,255,255,0.25-0.35)
Danger/Erreur     : #ef4444
Warning           : #fbbf24  (SEULEMENT pour indicateurs de risque sémantiques)
Info              : #60a5fa  (SEULEMENT pour données neutres)
```

### Couleurs des prop firms (branding contextuel uniquement)
```
FundedNext  : #6ee7b7
FTMO        : #60a5fa
E8 Markets  : #a78bfa
Alpha Capital: #f59e0b
The 5%ers   : #f87171
FundingPips : #34d399
```

### Dégradés officiels
```
CTA gradient    : linear-gradient(90deg, #059669, #6ee7b7)
Globe glow      : radial-gradient(circle, rgba(110,231,183,0.35), transparent)
Gauge           : linearGradient stop #059669 → #6ee7b7
Performance fill: rgba(110,231,183,0.3) → rgba(110,231,183,0)
```

### Couleurs INTERDITES dans l'UI générale
```
❌ #fbbf24 pour textes ou labels généraux (réservé warnings risque)
❌ #60a5fa comme accent principal (réservé FTMO branding)
❌ #a78bfa comme accent principal (réservé E8 branding)
❌ Fond blanc ou clair
❌ Fond gris moyen (#808080 etc.)
```

### Typographie
```
Police principale : -apple-system, system-ui, sans-serif (natif iOS/Android)
Titres h1        : 26-30px, fontWeight 800-900
Titres h2        : 20-24px, fontWeight 700-800
Sous-titres      : 14-16px, fontWeight 600-700
Corps texte      : 13-15px, fontWeight 400-500
Labels/caps      : 10-12px, fontWeight 600-700, letterSpacing 0.5-1px, uppercase
Micro labels     : 8-10px, fontWeight 500-600
```

### Règles UI fondamentales
```
✅ borderRadius cartes      : 16-24px
✅ borderRadius boutons CTA : 100px (pill parfaite)
✅ borderRadius boutons sec : 10-16px
✅ border cartes            : 1px solid rgba(255,255,255,0.07-0.12)
✅ boxShadow CTA            : 0 4px 24px rgba(110,231,183,0.25)
✅ backdropFilter navbar    : blur(20px)
✅ padding cartes           : 14-20px
✅ gap grilles              : 6-12px
✅ safe-area-inset-*        : TOUJOURS sur les éléments top/bottom fixes
```

---

## SECTION 3 — RÈGLES UX

### Principes absolus
- **3 secondes max** pour comprendre la valeur d'un écran
- **1 action principale** par écran (CTA unique et évident)
- **Progression visible** à chaque étape (barres, steps, %)
- **Feedback immédiat** sur toute interaction (couleur, animation)
- **Mobile-first** toujours — maxWidth: 480px sur tous les conteneurs

### Parcours utilisateur (flow complet)
```
1. LanguagePickerScreen  — Globe SVG + 3 langues + "Étape 1/3"
2. OnboardingScreen      — 3 slides immersifs (swipe + dots)
3. LoginScreen           — Google + Apple uniquement
4. ProfileSetupScreen    — Étape 2/3 (firm) + Étape 3/3 (capital)
5. DashboardScreen       — Accueil app + navbar
6. SimulatorScreen       — Challenge + Funded (via toggle interne)
7. MesTradesScreen       — Import CSV/HTML + Verdict
8. MonteCarloScreen      — Stats résumé + MC
9. ProfileScreen         — Préférences + compte
```

### Règles de navigation
- Navbar fixe en bas (5 onglets) avec safe-area-inset-bottom
- Indicateur actif : ligne verte au-dessus de l'icône + label vert
- Jamais de breadcrumbs — navigation plate
- Bouton retour uniquement si flow multi-étapes (login, setup)

### Règles de liste/sélection
```
✅ Liste verticale centrée (jamais de grid 2 col pour sélections)
✅ Checkmark ✓ visible sur l'élément sélectionné
✅ Border verte sur l'élément sélectionné
✅ Fond légèrement teinté sur la sélection
✅ Chevron → sur les items navigables
```

### Interdictions UX
```
❌ Modales/popups non sollicitées
❌ Animations de plus de 300ms
❌ Scroll horizontal sauf carrousels explicites
❌ Texte non tronqué dans des cellules fixes
❌ Boutons trop petits (<44px touch target)
❌ Répéter les accès rapides si déjà dans la navbar
```

---

## SECTION 4 — RÈGLES DE DÉVELOPPEMENT

### Architecture
```
Fichier unique : src/App.jsx (~3800 lignes)
Build tool     : Vite 5 + React 18
Charts         : Recharts
PWA            : vite-plugin-pwa (service worker + manifest)
Deploy         : Vercel (rebuild auto sur push main)
Persistance    : localStorage uniquement (pas de backend actuel)
```

### Structure du fichier App.jsx
```
1. Imports (React, Recharts)
2. I18N — dictionnaires FR/EN/ES
3. Fonctions utilitaires (makeT, challengeFee)
4. PROP_FIRMS — données officielles 2026 des 6 firms
5. FIRM_CAPITALS + FIRM_FEES — par firm
6. Moteur simulation (makeTradeStream, simulateDay, simulatePhase, simulateFunded)
7. SimulatorScreen — composant principal simulateur
8. CalendrierPnL — sous-composant
9. MonteCarloTab — sous-composant
10. MesTradesTab — sous-composant avec verdict + import
11. FirmLogo — logos SVG inline des 6 firms
12. Écrans d'onboarding (OnboardingScreen, LanguagePickerScreen)
13. LoginScreen
14. ProfileSetupScreen
15. DashboardScreen
16. ProfileScreen
17. NavBar
18. Root (App) — routeur principal
```

### Variables centralisées — SOURCES DE VÉRITÉ
```javascript
PROP_FIRMS         // Toutes les règles officielles par firm
FIRM_CAPITALS      // Capitaux disponibles par firm
FIRM_FEES          // Frais par firm et par capital
I18N               // Toutes les traductions (FR/EN/ES)
PIP_VALUES         // Valeur pip par instrument
APP_KEY            // "eapropfirm_app" — clé localStorage profil
"eapropfirm_config" // Clé localStorage config simulateur
"eapropfirm_saved_configs" // Clé localStorage configs sauvegardées
"eapropfirm_trades"         // Clé localStorage trades importés
```

### Règle de calcul critique — NE JAMAIS MODIFIER SANS VALIDATION
```javascript
// Risque effectif (source unique)
lotRiskAmount     = lotSize × pipVal × slPips
effectiveRiskAmt  = useFixedLot ? lotRiskAmount : capital × (riskPct/100)
effectiveRiskPct  = effectiveRiskAmt / capital × 100

// RR nécessaire (formule validée mathématiquement)
finalRR = (dailyTarget / (tradesPerDay × effectiveRisk) + (1-w)) / w

// Espérance journalière
E[jour] = tradesPerDay × effectiveRiskAmount × (w × finalRR − (1−w))
```

### Règles de code
```
✅ Gradient IDs SVG : toujours uniques (ex: "ftmo-g", "perf-fill", "gauge-g")
✅ Clés React : toujours fournies sur les listes (.map)
✅ CSS inline uniquement (pas de classes CSS globales)
✅ Pas de localStorage dans le rendu SSR (toujours try/catch)
✅ Composants définis avec function (pas arrow functions au niveau module)
✅ États de chargement pour toute opération async
```

### Test avant commit (méthode validée)
```bash
# Compilation Babel
./node_modules/.bin/babel --presets @babel/preset-react App.jsx -o compiled.js

# Rendu React server-side
node -e "global.React=require('react'); ... renderToString(...)"

# Build Vite production
npm run build  # Doit afficher "✓ built in Xs", jamais "exited with 1"
```

---

## SECTION 5 — LEÇONS APPRISES

### 2025-05 — Bug critique : variables hors scope dans JSX
**Contexte** : lotDiagJSX (IIFE) dupliqué dans MesTradesTab et CalendrierPnL  
**Erreur** : `risk is not defined` au runtime  
**Cause** : Script Python d'extraction avait inséré le bloc dans des composants sans accès aux variables d'App()  
**Correction** : Suppression des blocs orphelins, vérification scope via `re.sub`  
**Prévention** : Toujours tester `renderToString()` composant par composant avant build

### 2025-05 — Bug PIP_VALUES XAUUSD
**Contexte** : Calcul du risque par trade  
**Erreur** : `PIP_VALUES["XAUUSD"] = 1.0` → risque calculé 10× trop faible  
**Correction** : `PIP_VALUES["XAUUSD"] = 10.0` (0.1 lot × 150 pips = $150, pas $15)  
**Prévention** : Toujours valider : lot × pipVal × SL = risque$ attendu

### 2025-05 — Bug accolades non fermées après suppression de code
**Contexte** : Suppression de l'ancien corps de MesTradesTab  
**Erreur** : `'export' may only appear at the top level` à la compilation  
**Cause** : La suppression a laissé une accolade ouvrante orpheline → tout le code suivant était "inside" une fonction  
**Correction** : Analyse depth tracking (compter `{` vs `}` ligne par ligne)  
**Prévention** : Après toute suppression de bloc, recompiler immédiatement


### 2025-06 — Audit palette : couleurs de branding firm infiltrées dans l'UI
**Contexte** : Audit automatique App.jsx vs PROJECT_COMPASS.md  
**Erreur** : `#60a5fa` (bleu FTMO) et `#f59e0b` (orange Alpha Capital) utilisés dans des composants génériques (Dashboard Profit split, LOT AUTO badge, Login gradient)  
**Cause** : Ces couleurs ont été copiées/réutilisées lors de développements rapides sans vérifier la palette  
**Correction** : 4 corrections appliquées → `#6ee7b7` (accent unique) ou `#e2e8f0` (neutre) selon le contexte  
**Prévention** : Audit automatique à chaque session via script Python (compter occurrences hors PROP_FIRMS/FIRM_)  
**Règle ajoutée** : Un script d'audit est disponible — exécuter avant chaque push important

### 2025-05 — Bug verdict dashboard non visible en SSR
**Contexte** : Verdict challenge calculé dans useEffect → invisible au rendu initial  
**Erreur** : `verdict` = null au premier rendu SSR  
**Correction** : Calcul synchrone inline avant le return : `const verdict = trades.length > 0 && stats ? computeVerdictSync(trades, ...) : null`  
**Prévention** : Tout calcul dérivé de state existant → computé inline, pas en useEffect

### 2025-05 — Duplicate gradient IDs SVG
**Contexte** : Plusieurs composants avec `id="gauge-g"` rendus en même temps  
**Erreur** : Gradients incorrects (le dernier écrase les précédents dans le DOM)  
**Correction** : IDs uniques par composant (`"ftmo-g"`, `"fn-g"`, `"al-g"`, etc.)  
**Prévention** : Convention : préfixe unique par composant + couleur dans l'ID

### 2025-05 — useEffect + localStorage dans useState initializer
**Contexte** : Configs dashboard lues en useEffect → absentes au premier rendu  
**Erreur** : Liste configs vide au mount  
**Correction** : `useState(() => { try { const r=localStorage.getItem(...); return r?JSON.parse(r):[]; } catch(e){return [];} })`  
**Prévention** : localStorage → toujours dans lazy initializer useState, pas useEffect

---

## SECTION 6 — CHECKLIST AVANT COMMIT

```
□ Babel compile sans erreur (0 SyntaxError)
□ Vite build ✓ (pas de "exited with 1")
□ renderToString() passe sur les composants modifiés
□ Mobile responsive (max-width: 480px)
□ safe-area-inset-top/bottom sur éléments fixes
□ Pas de token/secret dans le code
□ Gradient IDs SVG uniques
□ Clés React sur tous les .map()
□ try/catch sur tous les accès localStorage
□ finalRR positif et réaliste avant simulation
□ PROP_FIRMS rules cohérentes (dailyDD < totalDD)
□ i18n : toutes les nouvelles clés ajoutées en FR + EN + ES
□ onSimResult : données complètes transmises au Dashboard
□ Message de commit descriptif (feat/fix/refactor + description)
```

---

## SECTION 7 — SÉCURITÉ

### Règles actuelles
```
✅ Pas de backend — données 100% localStorage (aucune fuite serveur)
✅ Auth sociale uniquement (Google/Apple — pas de mot de passe stocké)
✅ Token GitHub : ne jamais committer dans le code
✅ Pas de clés API dans App.jsx
✅ localStorage : données non sensibles uniquement (config, trades)
```

### Quand Supabase sera intégré
```
⚠️ Variables d'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env
⚠️ Ne jamais exposer la SERVICE_ROLE_KEY côté client
⚠️ RLS (Row Level Security) sur toutes les tables
⚠️ Règle : un user ne peut lire/écrire que ses propres données
⚠️ Ajouter .env au .gitignore (vérifier avant chaque commit)
```

### Données sensibles à ne jamais committer
```
❌ Tokens GitHub (ghp_...)
❌ Clés Supabase
❌ Clés Stripe / RevenueCat
❌ Données personnelles utilisateurs de test
```

---

## SECTION 8 — DÉCISIONS PRODUIT

### 2025-05-31 | Login : Google + Apple uniquement
**Décision** : Supprimer le login email/mot de passe  
**Pourquoi** : Friction trop élevée, SSO est le standard mobile premium, intégration Supabase simple  
**Impact** : Onboarding plus rapide, moins d'erreurs mot de passe, branding moderne

### 2025-06-01 | Langue : écran séparé avant l'onboarding
**Décision** : LanguagePickerScreen indépendant (pas dans le setup)  
**Pourquoi** : L'onboarding DOIT être dans la bonne langue dès la 1ère slide  
**Impact** : Meilleure expérience FR/EN/ES, cohérence du flow

### 2025-06-01 | 6 prop firms avec règles officielles 2026
**Décision** : FundedNext, FTMO, E8, Alpha Capital, The 5%ers, FundingPips  
**Pourquoi** : Ces 6 représentent >80% du marché francophone  
**Impact** : Capitaux et frais spécifiques par firm (pas de valeurs génériques)

### 2025-06-02 | Configs sauvegardées sur le Dashboard (pas accès rapides)
**Décision** : Remplacer les 4 boutons d'accès rapide par les configs EA sauvegardées  
**Pourquoi** : Les accès rapides dupliquaient la navbar → inutile  
**Impact** : Dashboard plus utile, chargement rapide d'une config EA

### 2025-06-02 | Import HTML backtest MT4/MT5
**Décision** : Accepter les fichiers .html du rapport backtest MT4/MT5 en plus du CSV  
**Pourquoi** : Le rapport HTML est le format natif MT4/MT5 pour le backtest Strategy Tester  
**Impact** : Parser DOMParser côté browser, gestion des séparateurs FR (virgule)

### 2025-06-03 | Verdict challenge avec Mini Monte Carlo (200 runs)
**Décision** : Calculer la probabilité de réussite du challenge avec les stats réelles du trader  
**Pourquoi** : C'est la valeur ajoutée principale — pas juste des stats, mais une prédiction  
**Impact** : Verdict VIABLE / RISQUE ÉLEVÉ / INCOMPATIBLE basé sur WR réel + RR réel

### 2025-06-04 | onSimResult étendu avec données complètes
### 2025-06 | Audit automatique palette colors avant chaque session
**Décision** : Créer un script Python d'audit qui détecte les couleurs hors-palette dans App.jsx  
**Pourquoi** : Les couleurs de branding des prop firms (#60a5fa, #f59e0b, etc.) s'infiltrent dans les composants génériques lors des développements rapides  
**Impact** : Palette cohérente, accent unique `#6ee7b7`, identité visuelle respectée

**Décision** : Passer 20+ métriques depuis SimulatorScreen vers Root/Dashboard  
**Pourquoi** : Dashboard doit afficher des données réelles de simulation, pas des valeurs mockées  
**Impact** : Progression, équity curve, stats trades, PnL log → tous alimentés par le vrai moteur

---

## SECTION 9 — ROADMAP

### ✅ Terminé

#### Moteur de simulation
- [x] Chaîne de Markov (clustering des pertes)
- [x] Simulation trade-par-trade (intraday)
- [x] Drawdown intraday vérifié après chaque trade
- [x] Support trades fractionnaires (0.1 trade/jour)
- [x] Contrainte max pertes consécutives
- [x] Phases multiples (1-Step, 2-Step, Lite)
- [x] Simulation funded avec payout bi-weekly
- [x] Scaling après 4 mois + 2 payouts

#### Multi-prop-firms
- [x] 6 prop firms avec règles 2026 vérifiées
- [x] Capitaux spécifiques par firm (FTMO: $10K-$200K)
- [x] Frais réels par firm et par capital
- [x] Logos SVG inline (6 firms)

#### Module EA / Instruments
- [x] Toggle mode LOT fixe vs risque %
- [x] Calcul pip value par instrument
- [x] Diagnostic FundedNext (4 checks)
- [x] Presets EA (v4 Goldstrom, GoldPulse V20)
- [x] Sauvegarde config EA sur Dashboard
- [x] Chargement config EA depuis Dashboard

#### Import et analyse trades
- [x] Import CSV MT4/MT5 (formats auto-détectés)
- [x] Import HTML backtest MT4/MT5 (DOMParser)
- [x] Verdict challenge (Mini Monte Carlo sur stats réelles)
- [x] Score de cohérence réel vs simulation (0-100%)
- [x] Courbe equity Réel vs Simulation (recharts)
- [x] Alertes intelligentes (DD, winrate, consec losses)

#### Monte Carlo
- [x] 200 simulations simultanées
- [x] Taux de passage Phase 1
- [x] Distribution DD max
- [x] Stats résumé compact au-dessus

#### UI/UX — App complète
- [x] LanguagePickerScreen (globe SVG, FR/EN/ES)
- [x] OnboardingScreen (3 slides immersifs, traduits)
- [x] LoginScreen (Google + Apple, design maquette)
- [x] ProfileSetupScreen (étapes 2/3 + 3/3, logos firms)
- [x] DashboardScreen (simulation en cours, chart, règles, stats)
- [x] NavBar (icônes SVG custom, blur, indicateur actif)
- [x] ProfileScreen (langue, firm, capital, logout)
- [x] CalendrierPnL (mois par mois, couleurs gains/pertes)
- [x] Palette unifiée (1 accent vert, couleurs sémantiques uniquement)
- [x] Traductions complètes FR/EN/ES

#### Infrastructure
- [x] PWA (service worker, manifest, icônes)
- [x] Déploiement Vercel (rebuild auto sur push main)
- [x] GitHub repo (fabmarc70/EA-PropFirm-Pro)
- [x] Build Vite production validé (829 modules)

### 🔄 En cours / Priorité haute
- [ ] Authentification Supabase OAuth (Google + Apple réels)
- [ ] Persistance cloud des configs et trades
- [ ] Tests utilisateurs (beta privée)

### 🗓 Planifié — Court terme (1-3 mois)
- [ ] Monétisation (Stripe ou RevenueCat)
- [ ] Compte utilisateur avec historique
- [ ] Partage de lien simulation
- [ ] Amélioration dashboard : calendrier PnL depuis sim
- [ ] Amélioration MesTradesTab : graphique par session

### 🔮 Long terme (3-12 mois)
- [ ] Connexion MT4/MT5 en temps réel (bridge WebSocket)
- [ ] Alertes push PWA (violation DD, objectif atteint)
- [ ] Leaderboard anonyme (taux de passage par EA)
- [ ] Mode comparaison multi-strategies
- [ ] Version desktop (Electron ou web étendu)
- [ ] Support d'autres langues (Portugais, Arabe)

---

## SECTION 10 — DIRECTIVE IA

### Avant toute intervention
1. Lire `PROJECT_COMPASS.md` en entier
2. Vérifier quelle section est concernée
3. Respecter la palette (#6ee7b7 accent unique)
4. Respecter l'architecture (fichier unique App.jsx)
5. Vérifier les sources de vérité (PROP_FIRMS, I18N, PIP_VALUES)

### Pendant le développement
1. Compiler avec Babel après chaque modification importante
2. Tester `renderToString()` sur les composants modifiés
3. Vérifier les IDs SVG (unicité)
4. Vérifier les clés React sur les listes
5. Vérifier les try/catch sur localStorage
6. Valider le build Vite complet avant push

### Après chaque session
1. Mettre à jour `PROJECT_COMPASS.md` (leçons, décisions, roadmap)
2. Committer avec message descriptif (feat/fix/refactor)
3. Push sur GitHub (rebuild Vercel automatique)

### Avant chaque décision importante
1. Consulter `docs/PRODUCT_DECISIONS.md` pour éviter de réinventer
2. Créer une entrée PD-XXX avant d'implémenter

### Avant chaque release
1. Lire et exécuter `RELEASE_PROTOCOL.md` phase par phase
2. Signer la Phase 13 (validation finale)
3. Logger la release dans le tableau Phase 14

### Style de code à produire
```javascript
// ✅ BON — source unique, documenté
const effectiveRiskAmount = useFixedLot ? lotRiskAmount : capital * (riskPct / 100);

// ❌ MAUVAIS — hardcodé, non tracé
const risk = 150;
```

```jsx
// ✅ BON — palette respectée
<div style={{ color: "#6ee7b7", background: "rgba(110,231,183,0.1)" }}>

// ❌ MAUVAIS — couleur non officielle
<div style={{ color: "#00ff00", background: "#001100" }}>
```

### Règles de commit
```
feat: nouvelle fonctionnalité
fix: correction de bug
refactor: restructuration sans changement de comportement
style: modifications UI/UX uniquement
docs: mise à jour documentation
perf: optimisation de performance
```

---

## ANNEXE — CONFIGURATION TECHNIQUE

### Stack
```
React       : 18.x
Vite        : 5.x
Recharts    : dernière version stable
vite-plugin-pwa : 0.20.x
Node        : 20+ (Vercel)
```

### LocalStorage Keys
```
eapropfirm_app            → profil utilisateur, auth, setup, lastSim
eapropfirm_config         → configuration simulateur (firm, capital, EA params)
eapropfirm_saved_configs  → configs EA sauvegardées (max 12)
eapropfirm_trades         → trades importés CSV/HTML
```

### Règles officielles Prop Firms 2026 (résumé)
| Firm | P1 | P2 | DD/jour | DD/total | Min jours | Split |
|---|---|---|---|---|---|---|
| FundedNext Stellar | 8% | 5% | 5% | 10% | 5j | 80→90% |
| FTMO | 10% | 5% | 5% | 10% | 4j | 80→90% |
| E8 Classic | 8% | 4% | 5% | 8% | 0j | 80→100% |
| Alpha Capital | 8% | 4% | 4% | 8% | 3j | 80→90% |
| The 5%ers | 8% | 5% | 5% | 10% | 3j | 80→100% |
| FundingPips | 8% | 5% | 5% | 10% | 3j | 80→90% |

---

### Fichiers de référence du projet
```
PROJECT_COMPASS.md          → Vision, règles UI/UX, architecture, décisions, roadmap
RELEASE_PROTOCOL.md         → Checklist validation complète avant toute release
docs/PRODUCT_DECISIONS.md   → Registre officiel de toutes les décisions produit (20 décisions)
README.md                   → Présentation, installation, stack technique
```

*Dernière mise à jour : Juin 2025*
*Mis à jour par : Claude (session développement complète)*
*Prochain update requis : après intégration Supabase OAuth*
