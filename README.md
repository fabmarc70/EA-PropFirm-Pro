# 🚀 EA PropFirm Pro — Prop Firm Challenge Simulator

> Simule, analyse et optimise ta stratégie avant de payer un challenge prop firm.

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://ea-prop-firm-pro.vercel.app)
[![PWA](https://img.shields.io/badge/PWA-Ready-6ee7b7)](https://ea-prop-firm-pro.vercel.app)

---

## 📖 Source de vérité absolue

> **⚠️ Lire obligatoirement avant toute modification :**
> [`PROJECT_COMPASS.md`](./PROJECT_COMPASS.md) — Boussole stratégique, règles UI/UX, architecture, décisions produit, roadmap.

---

## 🎯 Proposition de valeur

Un challenge prop firm coûte entre **99$ et 1 080$**. Un seul échec évité rembourse plusieurs mois d'abonnement.

**EA PropFirm Pro** permet de :
- Simuler son EA ou sa stratégie manuelle avec les **règles officielles 2026** de 6 prop firms
- Importer son **historique réel MT4/MT5** (CSV + HTML backtest) pour analyser ses vraies stats
- Obtenir un **verdict de réussite** basé sur 200 simulations Monte Carlo
- Visualiser sa **progression** vers le challenge sur un dashboard complet

---

## 🏦 Prop Firms supportées

| Firm | Phase 1 | Phase 2 | DD/jour | DD/total | Split |
|---|---|---|---|---|---|
| **FundedNext** Stellar | 8% | 5% | 5% | 10% | 80→90% |
| **FTMO** | 10% | 5% | 5% | 10% | 80→90% |
| **E8 Markets** Classic | 8% | 4% | 5% | 8% | 80→100% |
| **Alpha Capital** Pro | 8% | 4% | 4% | 8% | 80→90% |
| **The 5%ers** High Stakes | 8% | 5% | 5% | 10% | 80→100% |
| **FundingPips** Standard | 8% | 5% | 5% | 10% | 80→90% |

---

## ⚡ Tech Stack

```
React 18        — UI
Vite 5          — Build tool
Recharts        — Graphiques
vite-plugin-pwa — Service Worker + Manifest
Vercel          — Déploiement (rebuild auto sur push main)
localStorage    — Persistance (pas de backend actuel)
```

---

## 🚀 Installation locale

```bash
git clone https://github.com/fabmarc70/EA-PropFirm-Pro.git
cd EA-PropFirm-Pro
npm install
npm run dev       # http://localhost:5173
npm run build     # Build production
```

---

## 🗂 Structure du projet

```
EA-PropFirm-Pro/
├── PROJECT_COMPASS.md    ← ⭐ SOURCE DE VÉRITÉ ABSOLUE
├── README.md
├── index.html
├── vite.config.js
├── package.json
├── public/
│   ├── favicon.svg
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
└── src/
    ├── main.jsx
    └── App.jsx           ← Application complète (~4000 lignes)
```

---

## 🌍 Langues

- 🇫🇷 Français (primaire)
- 🇬🇧 English
- 🇪🇸 Español

---

## 📋 Checklist développeur

Avant tout commit, consulter la **Section 6** de [`PROJECT_COMPASS.md`](./PROJECT_COMPASS.md).

---

*Projet de Fabrice — Auto-entrepreneur, trader depuis 2014*
