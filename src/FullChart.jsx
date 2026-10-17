// ══════════════════════════════════════════════════════════════════════════
// GRAPHIQUE PLEIN ECRAN AVEC OUTILS D'ANALYSE
// --------------------------------------------------------------------------
// Ce composant ne contient AUCUN calcul de coordonnees : toute la geometrie
// vit dans chartTools.js, qui est teste. Ici, uniquement le dessin sur
// canvas et la lecture des gestes.
//
// Canvas plutot que SVG : un graphique de 500 bougies redessine a chaque
// doigt qui bouge fait ramer le DOM sur telephone.
// ══════════════════════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  clampView, zoomView, makeScales, hitTest, measureInfo, decimales, MIN_BOUGIES,
} from "./chartTools.js";

const ACCENT = "#6ee7b7";
const ROUGE = "#ef4444";
const O = 1, H = 2, L = 3, C = 4;

const OUTILS = [
  { k: "main", nom: "Déplacer" },
  { k: "h", nom: "Horizontale" },
  { k: "t", nom: "Tendance" },
  { k: "m", nom: "Mesure" },
  { k: "gomme", nom: "Gomme" },
];

function IconeOutil({ k, couleur }) {
  const p = { stroke: couleur, strokeWidth: 1.9, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  if (k === "main") return <svg width="17" height="17" viewBox="0 0 24 24"><path d="M5 12h14M9 8l-4 4 4 4M15 8l4 4-4 4" {...p} /></svg>;
  if (k === "h") return <svg width="17" height="17" viewBox="0 0 24 24"><path d="M3 12h18" {...p} /><circle cx="7" cy="12" r="1.6" fill={couleur} stroke="none" /></svg>;
  if (k === "t") return <svg width="17" height="17" viewBox="0 0 24 24"><path d="M4 19L20 5" {...p} /><circle cx="4" cy="19" r="1.8" fill={couleur} stroke="none" /><circle cx="20" cy="5" r="1.8" fill={couleur} stroke="none" /></svg>;
  if (k === "m") return <svg width="17" height="17" viewBox="0 0 24 24"><path d="M6 20V4M18 20V4M6 8h12M6 16h12" {...p} /></svg>;
  return <svg width="17" height="17" viewBox="0 0 24 24"><path d="M4 18h16M7 15l9-9 4 4-9 9" {...p} /></svg>;
}

export default function FullChart({
  candles = [], paire, tfLabel, position = null, resultat = null,
  dessins = [], onDessins, onClose, fmtPrix,
  niveaux = null, onNiveaux = null,
  prixAchat = null, prixVente = null, onAcheter = null, onVendre = null,
  marche = null,
}) {
  const boite = useRef(null);
  const canvas = useRef(null);
  const [taille, setTaille] = useState({ w: 360, h: 480 });
  const [outil, setOutil] = useState("main");
  const [vue, setVue] = useState(null);          // null = cadrage initial
  const [brouillon, setBrouillon] = useState(null);  // trace en cours de pose
  const geste = useRef(null);

  const nb = candles.length;

  // Cadrage initial : les dernieres bougies, comme tout terminal a l'ouverture.
  const vueEffective = useMemo(() => {
    if (vue) return clampView(vue, nb);
    return clampView({ debut: Math.max(0, nb - 120), nb: Math.min(120, nb) }, nb);
  }, [vue, nb]);

  // Niveaux a garder visibles meme hors de l'etendue des bougies.
  const bornes = useMemo(() => {
    const p = position || resultat;
    const l = p ? [p.entryPrice, p.stop, p.target] : [];
    if (niveaux) l.push(niveaux.stop, niveaux.target);
    if (isFinite(prixAchat)) l.push(prixAchat);
    return l.filter(v => isFinite(v));
  }, [position, resultat, niveaux, prixAchat]);

  const scales = useMemo(
    () => makeScales(candles, vueEffective, taille.w, taille.h, bornes),
    [candles, vueEffective, taille.w, taille.h, bornes]);

  // ── Taille reelle ───────────────────────────────────────────────────────
  useEffect(() => {
    const mesure = () => {
      if (!boite.current) return;
      const r = boite.current.getBoundingClientRect();
      setTaille({ w: Math.max(1, Math.round(r.width)), h: Math.max(1, Math.round(r.height)) });
    };
    mesure();
    window.addEventListener("resize", mesure);
    window.addEventListener("orientationchange", mesure);
    return () => {
      window.removeEventListener("resize", mesure);
      window.removeEventListener("orientationchange", mesure);
    };
  }, []);

  // ── Dessin ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = taille.w * dpr;
    cv.height = taille.h * dpr;
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, taille.w, taille.h);

    const v = scales.view;
    if (!v.nb) return;
    const dec = decimales(scales.hi);

    // Grille horizontale + echelle de prix
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textBaseline = "middle";
    for (let k = 0; k <= 4; k++) {
      const prix = scales.lo + ((scales.hi - scales.lo) * k) / 4;
      const y = scales.yFromPrice(prix);
      ctx.strokeStyle = "rgba(255,255,255,0.055)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(taille.w - 54, y); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText(prix.toFixed(dec), taille.w - 50, y);
    }

    // Bougies
    const corps = Math.max(1, Math.min(14, scales.pas * 0.68));
    for (let i = v.debut; i < v.debut + v.nb; i++) {
      const c = candles[i];
      if (!c) continue;
      const x = scales.xFromIndex(i);
      const hausse = c[C] >= c[O];
      const col = hausse ? ACCENT : ROUGE;
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, scales.yFromPrice(c[H]));
      ctx.lineTo(x, scales.yFromPrice(c[L]));
      ctx.stroke();
      const yo = scales.yFromPrice(c[O]), yc = scales.yFromPrice(c[C]);
      const haut = Math.max(1, Math.abs(yc - yo));
      ctx.fillRect(x - corps / 2, Math.min(yo, yc), corps, haut);
    }

    // Niveaux de la position
    const ligne = (prix, couleur, texte, tirets) => {
      if (!isFinite(prix)) return;
      const y = scales.yFromPrice(prix);
      ctx.strokeStyle = couleur; ctx.lineWidth = 1.2;
      ctx.setLineDash(tirets || []);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(taille.w - 54, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = couleur;
      ctx.font = "bold 10px -apple-system, sans-serif";
      ctx.fillText(texte, 4, y - 8);
      ctx.font = "10px -apple-system, sans-serif";
    };
    const pos = position || resultat;
    if (pos) {
      ligne(pos.entryPrice, "rgba(255,255,255,0.75)", "Entrée", [4, 3]);
      ligne(pos.stop, ROUGE, "Stop", [4, 3]);
      ligne(pos.target, ACCENT, "Objectif", [4, 3]);
    }

    // Traces de l'utilisateur, brouillon compris
    const tous = brouillon ? [...dessins, brouillon] : dessins;
    tous.forEach((d) => {
      ctx.lineWidth = 1.8;
      if (d.type === "h") {
        const y = scales.yFromPrice(d.prix);
        ctx.strokeStyle = "#facc15";
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(taille.w - 54, y); ctx.stroke();
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 10px -apple-system, sans-serif";
        ctx.fillText(d.prix.toFixed(dec), 4, y - 8);
        ctx.font = "10px -apple-system, sans-serif";
        return;
      }
      const x1 = scales.xFromIndex(d.i1), y1 = scales.yFromPrice(d.p1);
      const x2 = scales.xFromIndex(d.i2), y2 = scales.yFromPrice(d.p2);
      const mesure = d.type === "m" ? measureInfo(d) : null;
      ctx.strokeStyle = d.type === "m" ? (mesure.hausse ? ACCENT : ROUGE) : "#60a5fa";
      if (d.type === "m") ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = ctx.strokeStyle;
      [[x1, y1], [x2, y2]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      });
      if (mesure) {
        // Les trois chiffres qu'on veut lire en tirant une regle.
        const txt = (mesure.hausse ? "+" : "") + mesure.pct.toFixed(2) + " %  ·  "
          + (mesure.hausse ? "+" : "") + mesure.ecart.toFixed(dec) + "  ·  " + mesure.bougies + " bougies";
        ctx.font = "bold 11px -apple-system, sans-serif";
        const larg = ctx.measureText(txt).width + 12;
        const bx = Math.max(2, Math.min(taille.w - larg - 2, (x1 + x2) / 2 - larg / 2));
        const by = Math.min(y1, y2) - 24;
        ctx.fillStyle = "rgba(10,14,20,0.9)";
        ctx.fillRect(bx, by, larg, 20);
        ctx.fillStyle = mesure.hausse ? ACCENT : ROUGE;
        ctx.fillText(txt, bx + 6, by + 10);
        ctx.font = "10px -apple-system, sans-serif";
      }
    });

    // Niveaux d'ordre, deplaçables : poignee a droite pour montrer qu'on
    // peut les attraper, et prix lisible a cote.
    if (niveaux && !position) {
      const poignee = (prix, couleur, etiquette) => {
        if (!isFinite(prix)) return;
        const y = scales.yFromPrice(prix);
        ctx.strokeStyle = couleur; ctx.lineWidth = 1.6;
        ctx.setLineDash([7, 5]);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(taille.w - 54, y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = "bold 10px -apple-system, sans-serif";
        const txt = etiquette + "  " + prix.toFixed(dec);
        const larg = ctx.measureText(txt).width + 22;
        ctx.fillStyle = couleur;
        ctx.beginPath();
        const r = 9, bx = 4, by = y - r;
        ctx.moveTo(bx + r, by); ctx.lineTo(bx + larg - r, by);
        ctx.quadraticCurveTo(bx + larg, by, bx + larg, by + r);
        ctx.quadraticCurveTo(bx + larg, by + 2 * r, bx + larg - r, by + 2 * r);
        ctx.lineTo(bx + r, by + 2 * r);
        ctx.quadraticCurveTo(bx, by + 2 * r, bx, by + r);
        ctx.quadraticCurveTo(bx, by, bx + r, by);
        ctx.fill();
        ctx.fillStyle = "#06120c";
        ctx.fillText(txt, bx + 8, y);
        // Trois barres : le signe universel d'une poignee a saisir.
        ctx.strokeStyle = "rgba(6,18,12,0.55)"; ctx.lineWidth = 1.4;
        for (let k = 0; k < 3; k++) {
          const hx = bx + larg - 13 + k * 3.5;
          ctx.beginPath(); ctx.moveTo(hx, y - 4); ctx.lineTo(hx, y + 4); ctx.stroke();
        }
        ctx.font = "10px -apple-system, sans-serif";
      };
      poignee(niveaux.stop, ROUGE, "SL");
      poignee(niveaux.target, ACCENT, "TP");
    }
  }, [candles, scales, taille, dessins, brouillon, position, resultat, niveaux]);

  // ── Gestes ──────────────────────────────────────────────────────────────
  const pointXY = (e) => {
    const r = canvas.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const enDonnees = (p) => ({ i: scales.indexFromX(p.x), prix: scales.priceFromY(p.y) });

  // Le trace en cours vit dans une REF, pas seulement dans l'etat. Les
  // evenements tactiles arrivent par rafales ; en se fiant a l'etat, les
  // gestes rapides se perdaient parce que React n'avait pas encore
  // re-rendu entre deux "pointermove". Reproduit en test.
  const brouillonRef = useRef(null);
  const poser = (b) => { brouillonRef.current = b; setBrouillon(b); };

  // Niveau (stop ou objectif) sous le doigt, s'il y en a un.
  const niveauSousDoigt = (y) => {
    if (!niveaux) return null;
    const candidats = [];
    if (isFinite(niveaux.stop)) candidats.push(["stop", niveaux.stop]);
    if (isFinite(niveaux.target)) candidats.push(["target", niveaux.target]);
    let meilleur = null, d = 26;    // 26 px : viser un trait de 1 px au doigt
    candidats.forEach(([k, prix]) => {
      const dist = Math.abs(y - scales.yFromPrice(prix));
      if (dist < d) { d = dist; meilleur = k; }
    });
    return meilleur;
  };

  const onDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = pointXY(e);
    const g = geste.current || { pointeurs: new Map() };
    g.pointeurs.set(e.pointerId, p);
    geste.current = g;

    if (g.pointeurs.size === 2) {
      const [a, b] = [...g.pointeurs.values()];
      g.pince = { ecart: Math.hypot(a.x - b.x, a.y - b.y), vue: scales.view, centre: (a.x + b.x) / 2 };
      g.depart = null; g.niveau = null;
      poser(null);
      return;
    }

    // Un niveau se saisit AVANT tout le reste, quel que soit l'outil actif :
    // c'est le geste le plus frequent et le plus attendu.
    const cible = niveauSousDoigt(p.y);
    if (cible && onNiveaux) { g.niveau = cible; return; }

    if (outil === "main") {
      g.depart = { p, vue: scales.view };
    } else if (outil === "gomme") {
      const k = hitTest(dessins, p.x, p.y, scales);
      if (k >= 0) onDessins(dessins.filter((_, j) => j !== k));
    } else if (outil === "h") {
      onDessins([...dessins, { type: "h", prix: scales.priceFromY(p.y) }]);
      setOutil("main");            // un trace, puis on rend la navigation
    } else {
      const d = enDonnees(p);
      poser({ type: outil, i1: d.i, p1: d.prix, i2: d.i, p2: d.prix });
    }
  };

  const onMove = (e) => {
    const g = geste.current;
    if (!g || !g.pointeurs.has(e.pointerId)) return;
    const p = pointXY(e);
    g.pointeurs.set(e.pointerId, p);

    if (g.pointeurs.size === 2 && g.pince) {
      const [a, b] = [...g.pointeurs.values()];
      const ecart = Math.hypot(a.x - b.x, a.y - b.y);
      if (g.pince.ecart > 4) {
        const facteur = g.pince.ecart / Math.max(4, ecart);
        setVue(zoomView(g.pince.vue, facteur, g.pince.centre / Math.max(1, taille.w), nb));
      }
      return;
    }

    if (g.niveau) {
      onNiveaux({ ...niveaux, [g.niveau]: scales.priceFromY(p.y) });
      return;
    }

    if (g.depart) {
      // Defilement : on convertit les pixels parcourus en bougies.
      const dx = p.x - g.depart.p.x;
      const bougies = Math.round(dx / Math.max(0.0001, taille.w / g.depart.vue.nb));
      setVue(clampView({ debut: g.depart.vue.debut - bougies, nb: g.depart.vue.nb }, nb));
      return;
    }

    if (brouillonRef.current) {
      const d = enDonnees(p);
      poser({ ...brouillonRef.current, i2: d.i, p2: d.prix });
    }
  };

  const onUp = (e) => {
    const g = geste.current;
    if (g) {
      g.pointeurs.delete(e.pointerId);
      if (g.pointeurs.size < 2) g.pince = null;
      if (g.pointeurs.size === 0) { g.depart = null; g.niveau = null; geste.current = null; }
    }
    const b = brouillonRef.current;
    if (b) {
      // Un trace reduit a un point est un appui rate, pas une intention.
      const assezLong = Math.abs(scales.xFromIndex(b.i2) - scales.xFromIndex(b.i1)) > 6
        || Math.abs(scales.yFromPrice(b.p2) - scales.yFromPrice(b.p1)) > 6;
      if (assezLong) {
        onDessins([...dessins, b]);
        setOutil("main");          // le trace pose, on revient a la navigation
      }
      poser(null);
    }
  };

  const zoomBouton = (facteur) => setVue(zoomView(scales.view, facteur, 0.5, nb));

  // PORTAIL sur <body>. Le composant est rendu au milieu de l'arbre de
  // l'ecran d'entrainement, dont un parent cree un contexte d'empilement :
  // le z-index du calque y etait relatif a ce parent, et la barre d'onglets
  // de l'app recouvrait les outils quelle que soit la valeur choisie.
  // Constate a l'ecran, corrige a la racine plutot qu'en surenchere.
  return createPortal((
    <div style={{
      // 1200 : au-dessus de la barre d'onglets (100) et des feuilles (1000,
      // 1100), sous l'ecran de demarrage (9999). A 95, la barre d'onglets
      // recouvrait les outils — constate a l'ecran.
      position: "fixed", inset: 0, zIndex: 1200, background: "#070a0f",
      display: "flex", flexDirection: "column",
      paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {/* Barre du haut */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", flexShrink: 0 }}>
        <button onClick={onClose} aria-label="Fermer"
          style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 10, cursor: "pointer",
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>
            {paire} · {tfLabel}
          </div>
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>
            {scales.view.nb} bougies affichées
          </div>
        </div>
        <button onClick={() => zoomBouton(1.4)} style={btnRond}>−</button>
        <button onClick={() => zoomBouton(1 / 1.4)} style={btnRond}>+</button>
        {dessins.length > 0 && (
          <button onClick={() => onDessins([])}
            style={{ ...btnRond, width: "auto", padding: "0 10px", fontSize: 11, color: ROUGE }}>
            Effacer
          </button>
        )}
      </div>

      {/* Zone de dessin */}
      <div ref={boite} style={{ flex: 1, minHeight: 0, position: "relative", touchAction: "none" }}>
        <canvas
          ref={canvas}
          onPointerDown={onDown} onPointerMove={onMove}
          onPointerUp={onUp} onPointerCancel={onUp}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }} />
      </div>

      {/* Ordre : on achete ou on vend sans quitter le plein ecran, avec les
          niveaux qu'on vient de poser au doigt. */}
      {onAcheter && !position && !resultat && (
        <div style={{ padding: "0 10px 6px", flexShrink: 0 }}>
          {marche && !marche.ouvert && (
            <div style={{ fontSize: 9.5, color: "#fbbf24", marginBottom: 5, textAlign: "center" }}>
              {marche.texte} · l'exercice rejoue des bougies passées
            </div>
          )}
          <div style={{ display: "flex", alignItems: "stretch", borderRadius: 24, overflow: "hidden" }}>
            <button onClick={onVendre}
              style={{ flex: 1, border: "none", cursor: "pointer", padding: "10px 12px", textAlign: "left",
                background: "rgba(239,68,68,0.9)", color: "#fff" }}>
              <span style={{ display: "block", fontSize: 10, opacity: 0.85 }}>Vendre</span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 800 }}>{fmtPrix ? fmtPrix(prixVente) : prixVente}</span>
            </button>
            <button onClick={onAcheter}
              style={{ flex: 1, border: "none", cursor: "pointer", padding: "10px 12px", textAlign: "right",
                background: "rgba(16,185,129,0.9)", color: "#fff" }}>
              <span style={{ display: "block", fontSize: 10, opacity: 0.85 }}>Acheter</span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 800 }}>{fmtPrix ? fmtPrix(prixAchat) : prixAchat}</span>
            </button>
          </div>
        </div>
      )}

      {/* Outils */}
      <div style={{ display: "flex", gap: 5, padding: "8px 10px 10px", flexShrink: 0 }}>
        {OUTILS.map(o => {
          const actif = outil === o.k;
          const col = actif ? "#000" : "rgba(255,255,255,0.72)";
          // Un appui sur l'outil deja actif le relache : c'est la facon
          // evidente de revenir a la navigation, et elle manquait.
          return (
            <button key={o.k} onClick={() => { setOutil(actif ? "main" : o.k); poser(null); }}
              style={{
                flex: 1, minWidth: 0, padding: "8px 2px", borderRadius: 11, cursor: "pointer",
                background: actif ? ACCENT : "rgba(255,255,255,0.05)",
                border: actif ? "none" : "1px solid rgba(255,255,255,0.1)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              }}>
              <IconeOutil k={o.k} couleur={col} />
              <span style={{ fontSize: 8.5, fontWeight: 700, color: col, whiteSpace: "nowrap" }}>{o.nom}</span>
            </button>
          );
        })}
      </div>
    </div>
  ), document.body);
}

const btnRond = {
  width: 34, height: 34, flexShrink: 0, borderRadius: 10, cursor: "pointer", padding: 0,
  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
  color: "#fff", fontSize: 17, fontWeight: 800, lineHeight: 1,
};
