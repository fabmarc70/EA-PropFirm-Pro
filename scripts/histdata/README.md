# Publication des données historiques (HISTDATA-)

Pipeline pour mettre à jour les données de backtest de l'app, à volonté,
sans jamais alourdir le bundle ou le service worker de la PWA.

## Principe (repo PUBLIC, servi via raw.githubusercontent.com)

```
HistData.com (téléchargement manuel, navigateur)
        ↓
parse-csv-to-json.js  (convertit en JSON compact)
        ↓
publish-git.js         (commit + push direct dans fabmarc70/HISTDATA-)
        ↓
L'app lit data/index.json (manifeste) à chaque ouverture du Backtest,
puis télécharge le fichier de la paire/période choisie.
```

Aucune clé API côté app, aucun quota, aucune authentification — le repo
est public et les fichiers sont de simples cours de marché (OHLC),
non sensibles.

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

## Étape 3 — Publier (commit direct, repo public)

```bash
GITHUB_TOKEN=ton_token_github node publish-git.js EURUSD_2024-06.json XAUUSD_2024-06.json
```

- Clone temporairement le repo, copie les fichiers dans `data/`, met à
  jour `data/index.json` (remplace l'entrée si la même paire/période
  existe déjà), commit et push. Nettoie le dossier temporaire ensuite.
- Le token doit avoir le droit d'écriture sur le repo (scope `repo`).

## Fréquence

Aucune limite technique — republie aussi souvent que tu veux (tous les
2 mois comme prévu, ou plus fréquemment). L'app relit toujours le
manifeste à jour automatiquement (cache CDN GitHub ~5 min), aucune
action côté utilisateur ni redéploiement de l'app n'est nécessaire.

## Format des fichiers

`data/index.json` :
```json
{
  "generatedAt": "2026-07-21T12:00:00.000Z",
  "datasets": [
    { "pair": "EURUSD", "period": "2024-06", "file": "EURUSD_2024-06.json", "count": 43200 }
  ]
}
```

`data/{PAIR}_{PERIOD}.json` :
```json
{
  "pair": "EURUSD",
  "period": "2024-06",
  "interval": "1min",
  "count": 43200,
  "candles": [
    [1719792000000, 1.08496, 1.08501, 1.08490, 1.08498],
    ...
  ]
}
```
