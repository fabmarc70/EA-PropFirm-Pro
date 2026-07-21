# Publication des données historiques (HISTDATA-)

Pipeline pour mettre à jour les données de backtest de l'app, à volonté, sans
jamais alourdir le bundle ou le service worker de la PWA.

## Principe

```
HistData.com (téléchargement manuel, navigateur)
        ↓
parse-csv-to-json.js  (convertit en JSON compact)
        ↓
publish-release.js    (publie sur GitHub Releases, repo fabmarc70/HISTDATA-)
        ↓
L'app va chercher automatiquement la DERNIÈRE release publiée
```

## Étape 1 — Télécharger les données (manuel, navigateur)

Va sur https://www.histdata.com/download-free-forex-historical-data/
→ choisis "1 Minute Bar Quotes (Generic ASCII)"
→ choisis la paire (EUR/USD, XAU/USD, GBP/USD, USD/JPY...) et le mois
→ télécharge le ZIP, extrais le fichier `DAT_ASCII_xxx_M1_YYYYMM.csv`

**Pourquoi manuel ?** HistData.com protège son formulaire de téléchargement
contre l'automatisation. Un script qui tente de le contourner serait fragile
et casserait à la moindre mise à jour de leur site. 2 minutes par paire/mois
en navigateur est fiable à 100 %.

## Étape 2 — Convertir en JSON compact

```bash
cd scripts/histdata
node parse-csv-to-json.js DAT_ASCII_EURUSD_M1_202406.csv EURUSD 2024-06
```

Génère `EURUSD_2024-06.json` (quelques Mo, format compact `[ts, o, h, l, c]`).

Répète pour chaque paire/mois que tu veux publier.

## Étape 3 — Publier sur GitHub Releases

```bash
GITHUB_TOKEN=ton_token_github node publish-release.js data-2026-07 \
  EURUSD_2024-06.json XAUUSD_2024-06.json GBPUSD_2024-06.json
```

- `data-2026-07` = tag de la release (convention : mois de publication)
- Si la release existe déjà, les fichiers sont ajoutés/remplacés dedans
- Le token doit avoir le scope `repo` (le repo HISTDATA- est privé)

## Fréquence

Aucune limite technique — republie aussi souvent que tu veux (tous les
2 mois comme prévu, ou plus fréquemment). L'app relit toujours la dernière
release automatiquement, aucune action côté utilisateur ni redéploiement
de l'app n'est nécessaire.

## Format du JSON produit

```json
{
  "pair": "EURUSD",
  "period": "2024-06",
  "interval": "1min",
  "count": 43200,
  "generatedAt": "2026-07-21T12:00:00.000Z",
  "candles": [
    [1719792000000, 1.08496, 1.08501, 1.08490, 1.08498],
    ...
  ]
}
```
