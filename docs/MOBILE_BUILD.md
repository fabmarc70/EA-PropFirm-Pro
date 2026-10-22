# Apps natives iOS / Android (Capacitor)

L'app native embarque **le même build Vite que la PWA** : design, simulations, Monte Carlo et projections sont identiques. Seules trois briques passent par le natif (`src/native.js`) :

| Brique | Web (PWA) | App native |
|---|---|---|
| Connexion Google / Apple | `signInWithPopup` | SDK natif → `signInWithCredential` (même compte Firebase) |
| Notifications push | Web Push (VAPID) | FCM (`api/_lib/nativePush.js`) |
| Partage de la carte perf | `navigator.share` | `@capacitor/share` |
| Appels `/api/*` | même domaine | redirigés vers `https://ea-propfirm-pro.vercel.app` (CORS : `api/_lib/cors.js`) |

Identifiant d'app : `com.eapropfirmpro.app` (définitif après la première publication sur un store).

## Build

GitHub > Actions > **Mobile build** > Run workflow (ou tag `mobile-v1.0.0`).

- Android : APK de test toujours produit ; AAB + APK signés si le keystore est fourni.
- iOS : build simulateur de vérification ; archive signée + envoi TestFlight si les identifiants Apple sont fournis.

En local :

```bash
npm run build && npx cap sync
npx cap open android   # Android Studio
npx cap open ios       # Xcode (Mac)
```

## Secrets GitHub à créer (Settings > Secrets and variables > Actions)

| Secret | Où le trouver |
|---|---|
| `GOOGLE_SERVICES_JSON_BASE64` | Console Firebase > Paramètres du projet > Ajouter une app Android (`com.eapropfirmpro.app`) > `google-services.json`, puis `base64 -i google-services.json` |
| `GOOGLE_SERVICE_INFO_PLIST_BASE64` | Même chose, app iOS (`com.eapropfirmpro.app`) > `GoogleService-Info.plist` |
| `ANDROID_KEYSTORE_BASE64` / `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_ALIAS` / `ANDROID_KEY_PASSWORD` | `keytool -genkey -v -keystore release.keystore -alias eapfp -keyalg RSA -keysize 2048 -validity 10000` — **garder ce fichier à vie**, il signe toutes les mises à jour Play Store |
| `APPLE_TEAM_ID` | developer.apple.com > Membership |
| `ASC_KEY_ID` / `ASC_ISSUER_ID` / `ASC_KEY_P8_BASE64` | App Store Connect > Utilisateurs et accès > Intégrations > Clés API (rôle App Manager), fichier `.p8` en base64 |

## Réglages consoles (une fois)

1. **Firebase > Authentication > Paramètres** : empreinte SHA-1 du keystore Android (`keytool -list -v -keystore release.keystore`) dans l'app Android — sinon Google Sign-In échoue sur Android.
2. **Firebase > Cloud Messaging** : clé APNs (`.p8`, developer.apple.com > Keys) — sinon pas de push iOS.
3. **App Store Connect** : créer la fiche de l'app avec l'identifiant `com.eapropfirmpro.app` avant le premier envoi TestFlight.
4. **Clé API Firebase web** : si elle est restreinte par référent HTTP dans Google Cloud, autoriser aussi `capacitor://localhost` et `https://localhost`.
