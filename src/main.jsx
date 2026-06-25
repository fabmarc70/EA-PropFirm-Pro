import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

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
