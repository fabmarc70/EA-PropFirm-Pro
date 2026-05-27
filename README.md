# EA PropFirm Pro — PWA

Simulateur EA pour challenges FundedNext (règles Stellar 2026).
Application web installable comme app native sur iOS et Android.

## Installation locale

```bash
npm install
npm run dev
```

Ouvre <http://localhost:5173>

## Build production

```bash
npm run build
```

Le dossier `dist/` contient l’app prête à déployer.

## Déploiement Vercel

### Méthode 1 — Via interface web (recommandée)

1. Push ces fichiers sur ton repo GitHub `EA-PropFirm-Pro`
1. Va sur <https://vercel.com> → “Add New Project”
1. Importe ton repo GitHub
1. Vercel détecte automatiquement Vite — ne change rien
1. Clique “Deploy”
1. URL disponible en ~1 minute : `ea-propfirm-pro.vercel.app`

### Méthode 2 — Via CLI

```bash
npm install -g vercel
vercel
```

Suis les instructions, c’est tout.

## Installation sur iPhone

1. Ouvre l’URL Vercel dans Safari (pas Chrome)
1. Bouton Partager (carré + flèche)
1. “Sur l’écran d’accueil”
1. L’icône apparaît, ouvre comme une vraie app

## Installation sur Android

1. Ouvre l’URL dans Chrome
1. Menu (3 points) → “Installer l’application”
1. Confirme

## Mise à jour

Push tes modifications sur GitHub → Vercel rebuilds automatiquement.
L’app se met à jour seule sur le téléphone à la prochaine ouverture.

## Structure

```
.
├── index.html              # Point d'entrée HTML + meta PWA
├── package.json            # Dépendances
├── vite.config.js          # Config Vite + PWA
├── public/
│   ├── favicon.svg         # Icône onglet
│   ├── pwa-192x192.png     # Icône PWA
│   ├── pwa-512x512.png     # Icône PWA HD
│   └── apple-touch-icon.png # Icône iOS
└── src/
    ├── main.jsx            # Bootstrap React
    └── App.jsx             # Le simulateur (code intact)
```

## Tech

- Vite + React 18
- vite-plugin-pwa (service worker auto)
- recharts pour les graphiques

Aucune modification du code App.jsx — l’artefact original est préservé tel quel.
