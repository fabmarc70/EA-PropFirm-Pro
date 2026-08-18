import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { registerSW } from 'virtual:pwa-register';

// ══════════════════════════════════════════════════════════════════
// MISE À JOUR PWA — CAUSE DU DÉLAI CONSTATÉ : l'enregistrement par défaut
// (auto-injecté par vite-plugin-pwa) ne fait qu'UN SEUL enregistrement au
// premier chargement, sans jamais revérifier ensuite. Résultat : une
// nouvelle version n'était détectée qu'au hasard du cycle de revérification
// du navigateur (parfois très espacé, surtout sur PWA iOS), d'où l'obligation
// de fermer complètement l'app pour espérer voir la mise à jour.
//
// Ici : vérification ACTIVE toutes les 60s pendant que l'app est ouverte
// (registration.update()), et un bandeau discret propose de recharger dès
// qu'une nouvelle version est prête — PAS de rechargement automatique
// silencieux, pour ne jamais faire perdre une saisie en cours (formulaire de
// journal, configuration de backtest…). skipWaiting/clientsClaim restent
// actifs côté Workbox : dès que l'utilisateur tape sur le bandeau, la
// nouvelle version prend le contrôle immédiatement.
// ══════════════════════════════════════════════════════════════════
function showUpdateBanner(onReload) {
  if (document.getElementById("eapfp-update-banner")) return; // déjà affiché
  const banner = document.createElement("div");
  banner.id = "eapfp-update-banner";
  banner.style.cssText = `
    position: fixed; left: 12px; right: 12px;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
    z-index: 99999; background: #12121a; border: 1px solid rgba(110,231,183,0.35);
    border-radius: 14px; padding: 12px 14px; display: flex; align-items: center;
    gap: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    font-family: -apple-system, sans-serif;
  `;
  banner.innerHTML = `
    <span style="flex:1; font-size:12.5px; color:#fff; font-weight:600;">Nouvelle version disponible</span>
    <button id="eapfp-update-btn" style="padding:8px 14px; border-radius:9px; border:none; cursor:pointer;
      background:linear-gradient(135deg,#6ee7b7,#34d399); color:#000; font-size:12px; font-weight:800;">Mettre à jour</button>
  `;
  document.body.appendChild(banner);
  document.getElementById("eapfp-update-btn").addEventListener("click", onReload);
}

const updateSW = registerSW({
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      setInterval(() => { registration.update(); }, 60 * 1000);
    }
  },
  onNeedRefresh() { showUpdateBanner(() => updateSW(true)); },
  onOfflineReady() {},
});

// ══════════════════════════════════════════════════════════════════
// Garde-fou global : sans cela, une exception JS sur N'IMPORTE QUEL
// écran fait disparaître TOUTE l'app (écran blanc total, comme observé
// le 25/06). Avec cet Error Boundary, seul l'écran fautif affiche un
// message + l'erreur réelle (au lieu d'un blanc silencieux), et un
// bouton permet de revenir à l'accueil sans recharger toute l'app.
// ══════════════════════════════════════════════════════════════════
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Crash intercepté par ErrorBoundary:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", background: "#0a0e14", color: "#fff",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 24, fontFamily: "-apple-system, sans-serif", textAlign: "center",
        }}>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>Une erreur est survenue</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 18, maxWidth: 380 }}>
            L'application a rencontré un problème inattendu. Le détail ci-dessous aide à le corriger rapidement.
          </div>
          <div style={{
            width: "100%", maxWidth: 420, maxHeight: 200, overflow: "auto",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 12, padding: 14, fontSize: 11, color: "#f87171",
            fontFamily: "monospace", textAlign: "left", marginBottom: 20, whiteSpace: "pre-wrap",
          }}>
            {String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{
              padding: "12px 24px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#6ee7b7,#34d399)", color: "#000", fontSize: 13, fontWeight: 700,
            }}>
            Revenir à l'accueil
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
