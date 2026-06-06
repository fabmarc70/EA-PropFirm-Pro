import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from "recharts";

// ══════════════════════════════════════════════════════════════════
// I18N — Traductions FR / EN
// ══════════════════════════════════════════════════════════════════
const I18N = {
  fr: {
    // Onboarding
    ob1_title: "Simule ton challenge",
    ob1_desc: "Teste ta strategie sur les regles reelles de ta prop firm avant de risquer ta mise.",
    ob2_title: "6 prop firms incluses",
    ob2_desc: "FundedNext, FTMO, E8, Alpha Capital, The 5%ers, FundingPips. Regles 2026 a jour.",
    ob3_title: "Analyse tes performances",
    ob3_desc: "Monte Carlo, calendrier PnL, import de tes trades reels MT4/MT5.",
    ob_skip: "Passer",
    ob_next: "Suivant",
    ob_start: "Commencer",
    // Login
    login_title: "Connexion",
    login_subtitle: "Accede a ton simulateur",
    login_email: "Email",
    login_password: "Mot de passe",
    login_btn: "Se connecter",
    login_signup: "Creer un compte",
    login_guest: "Continuer sans compte",
    login_or: "ou",
    login_name: "Nom",
    signup_title: "Creer un compte",
    signup_btn: "Creer mon compte",
    signup_have: "J'ai deja un compte",
    login_err_email: "Email invalide",
    login_err_pwd: "Mot de passe trop court (min 4)",
    // Profile setup
    setup_title: "Configuration",
    setup_lang_title: "Choisis ta langue",
    setup_lang_desc: "Tu pourras la changer plus tard",
    setup_firm_title: "Choisis ta prop firm",
    setup_firm_desc: "Les regles s'adapteront automatiquement",
    setup_capital_title: "Choisis ton capital",
    setup_capital_desc: "Taille du compte challenge",
    setup_back: "Retour",
    setup_next: "Continuer",
    setup_finish: "Terminer",
    setup_step: "Etape",
    // Navbar
    nav_dashboard: "Accueil",
    nav_simulator: "Simulateur",
    nav_trades: "Mes Trades",
    nav_montecarlo: "Monte Carlo",
    nav_profile: "Profil",
    // Dashboard
    dash_welcome: "Bienvenue",
    dash_your_firm: "Ta prop firm",
    dash_capital: "Capital",
    dash_model: "Modele",
    dash_target_p1: "Objectif Phase 1",
    dash_dd_daily: "DD journalier",
    dash_dd_total: "DD total",
    dash_split: "Profit split",
    dash_quick: "Acces rapide",
    dash_open_sim: "Ouvrir le simulateur",
    dash_open_trades: "Voir mes trades",
    dash_open_mc: "Lancer Monte Carlo",
    dash_change_firm: "Changer de prop firm",
    dash_last_sim: "Derniere simulation",
    dash_no_sim: "Aucune simulation. Lance le simulateur pour commencer.",
    dash_net: "Resultat net",
    dash_saved_configs: "Mes configurations",
    dash_no_configs: "Aucune config sauvegardee. Cree-en une depuis le simulateur.",
    dash_load: "Charger",
    dash_new_config: "Nouvelle config",
    sim_save_config: "Sauvegarder cette config",
    sim_config_saved: "Config sauvegardee",
    // Profile screen
    prof_title: "Profil",
    prof_account: "Compte",
    prof_prefs: "Preferences",
    prof_lang: "Langue",
    prof_firm: "Prop firm",
    prof_capital: "Capital",
    prof_logout: "Se deconnecter",
    prof_reset: "Reinitialiser l'app",
    prof_reset_confirm: "Tout effacer et recommencer ?",
    prof_guest: "Invite",
    // Commun
    yes: "Oui",
    no: "Non",
    cancel: "Annuler",
  },
  es: {
    ob1_title: "Simula tu reto",
    ob1_desc: "Prueba tu estrategia con las reglas reales de tu prop firm antes de arriesgar tu cuota.",
    ob2_title: "6 prop firms incluidas",
    ob2_desc: "FundedNext, FTMO, E8, Alpha Capital, The 5%ers, FundingPips. Reglas 2026 actualizadas.",
    ob3_title: "Analiza tu rendimiento",
    ob3_desc: "Monte Carlo, calendario PnL, importa tus operaciones reales MT4/MT5.",
    ob_skip: "Omitir",
    ob_next: "Siguiente",
    ob_start: "Empezar",
    login_title: "Iniciar sesion",
    login_subtitle: "Accede a tu simulador",
    login_email: "Correo",
    login_password: "Contrasena",
    login_btn: "Iniciar sesion",
    login_signup: "Crear cuenta",
    login_guest: "Continuar sin cuenta",
    login_or: "o",
    login_name: "Nombre",
    signup_title: "Crear cuenta",
    signup_btn: "Crear mi cuenta",
    signup_have: "Ya tengo una cuenta",
    login_err_email: "Correo invalido",
    login_err_pwd: "Contrasena demasiado corta (min 4)",
    setup_title: "Configuracion",
    setup_lang_title: "Elige tu idioma",
    setup_lang_desc: "Podras cambiarlo mas tarde",
    setup_firm_title: "Elige tu prop firm",
    setup_firm_desc: "Las reglas se adaptaran automaticamente",
    setup_capital_title: "Elige tu capital",
    setup_capital_desc: "Tamano de la cuenta de evaluacion",
    setup_back: "Atras",
    setup_next: "Continuar",
    setup_finish: "Finalizar",
    setup_step: "Paso",
    nav_dashboard: "Inicio",
    nav_simulator: "Simulador",
    nav_trades: "Mis Trades",
    nav_montecarlo: "Monte Carlo",
    nav_profile: "Perfil",
    dash_welcome: "Bienvenido",
    dash_your_firm: "Tu prop firm",
    dash_capital: "Capital",
    dash_model: "Modelo",
    dash_target_p1: "Objetivo Fase 1",
    dash_dd_daily: "DD diario",
    dash_dd_total: "DD total",
    dash_split: "Reparto beneficios",
    dash_quick: "Acceso rapido",
    dash_open_sim: "Abrir simulador",
    dash_open_trades: "Ver mis trades",
    dash_open_mc: "Iniciar Monte Carlo",
    dash_change_firm: "Cambiar prop firm",
    dash_last_sim: "Ultima simulacion",
    dash_no_sim: "Sin simulacion. Abre el simulador para empezar.",
    dash_net: "Resultado neto",
    dash_saved_configs: "Mis configuraciones",
    dash_no_configs: "Sin config guardada. Crea una desde el simulador.",
    dash_load: "Cargar",
    dash_new_config: "Nueva config",
    sim_save_config: "Guardar esta config",
    sim_config_saved: "Config guardada",
    prof_title: "Perfil",
    prof_account: "Cuenta",
    prof_prefs: "Preferencias",
    prof_lang: "Idioma",
    prof_firm: "Prop firm",
    prof_capital: "Capital",
    prof_logout: "Cerrar sesion",
    prof_reset: "Reiniciar la app",
    prof_reset_confirm: "Borrar todo y empezar de nuevo?",
    prof_guest: "Invitado",
    yes: "Si",
    no: "No",
    cancel: "Cancelar",
  },
  en: {
    ob1_title: "Simulate your challenge",
    ob1_desc: "Test your strategy on your prop firm's real rules before risking your fee.",
    ob2_title: "6 prop firms included",
    ob2_desc: "FundedNext, FTMO, E8, Alpha Capital, The 5%ers, FundingPips. Up-to-date 2026 rules.",
    ob3_title: "Analyze your performance",
    ob3_desc: "Monte Carlo, PnL calendar, import your real MT4/MT5 trades.",
    ob_skip: "Skip",
    ob_next: "Next",
    ob_start: "Get started",
    login_title: "Sign in",
    login_subtitle: "Access your simulator",
    login_email: "Email",
    login_password: "Password",
    login_btn: "Sign in",
    login_signup: "Create account",
    login_guest: "Continue as guest",
    login_or: "or",
    login_name: "Name",
    signup_title: "Create account",
    signup_btn: "Create my account",
    signup_have: "I already have an account",
    login_err_email: "Invalid email",
    login_err_pwd: "Password too short (min 4)",
    setup_title: "Setup",
    setup_lang_title: "Choose your language",
    setup_lang_desc: "You can change it later",
    setup_firm_title: "Choose your prop firm",
    setup_firm_desc: "Rules will adapt automatically",
    setup_capital_title: "Choose your capital",
    setup_capital_desc: "Challenge account size",
    setup_back: "Back",
    setup_next: "Continue",
    setup_finish: "Finish",
    setup_step: "Step",
    nav_dashboard: "Home",
    nav_simulator: "Simulator",
    nav_trades: "My Trades",
    nav_montecarlo: "Monte Carlo",
    nav_profile: "Profile",
    dash_welcome: "Welcome",
    dash_your_firm: "Your prop firm",
    dash_capital: "Capital",
    dash_model: "Model",
    dash_target_p1: "Phase 1 target",
    dash_dd_daily: "Daily DD",
    dash_dd_total: "Total DD",
    dash_split: "Profit split",
    dash_quick: "Quick access",
    dash_open_sim: "Open simulator",
    dash_open_trades: "View my trades",
    dash_open_mc: "Run Monte Carlo",
    dash_change_firm: "Change prop firm",
    dash_last_sim: "Last simulation",
    dash_no_sim: "No simulation yet. Open the simulator to start.",
    dash_net: "Net result",
    dash_saved_configs: "My configurations",
    dash_no_configs: "No saved config. Create one from the simulator.",
    dash_load: "Load",
    dash_new_config: "New config",
    sim_save_config: "Save this config",
    sim_config_saved: "Config saved",
    prof_title: "Profile",
    prof_account: "Account",
    prof_prefs: "Preferences",
    prof_lang: "Language",
    prof_firm: "Prop firm",
    prof_capital: "Capital",
    prof_logout: "Log out",
    prof_reset: "Reset app",
    prof_reset_confirm: "Erase everything and start over?",
    prof_guest: "Guest",
    yes: "Yes",
    no: "No",
    cancel: "Cancel",
  },
};

function makeT(lang) {
  const dict = I18N[lang] || I18N.fr;
  return (key) => dict[key] ?? key;
}

// MODELES FUNDEDNEXT - REGLES OFFICIELLES 2026 (Stellar)
// ══════════════════════════════════════════════════════════════════
// PROP FIRMS — Règles officielles 2026 (vérifiées via sources publiques)
// Chaque firm contient ses modèles d'évaluation
// ══════════════════════════════════════════════════════════════════
const PROP_FIRMS = {
  fundednext: {
    name: "FundedNext",
    color: "#6ee7b7",
    note: "Stellar 2026 - DD depuis solde initial - Reward 15% challenge",
    models: {
      "2step": {
        name: "Stellar 2-Step",
        phases: [
          { label: "Phase 1", target: 0.08, minDays: 5 },
          { label: "Phase 2", target: 0.05, minDays: 5 },
        ],
        dailyDD: 0.05, totalDD: 0.10, ddType: "static", challengeReward: 0.15,
        firstPayoutDays: 21, payoutCycle: 14, splitStart: 80, splitMax: 90,
      },
      "1step": {
        name: "Stellar 1-Step",
        phases: [{ label: "Phase unique", target: 0.10, minDays: 2 }],
        dailyDD: 0.03, totalDD: 0.06, ddType: "static", challengeReward: 0.15,
        firstPayoutDays: 5, payoutCycle: 14, splitStart: 80, splitMax: 90,
      },
      "lite": {
        name: "Stellar Lite",
        phases: [
          { label: "Phase 1", target: 0.08, minDays: 5 },
          { label: "Phase 2", target: 0.04, minDays: 5 },
        ],
        dailyDD: 0.04, totalDD: 0.08, ddType: "static", challengeReward: 0.15,
        firstPayoutDays: 21, payoutCycle: 14, splitStart: 80, splitMax: 90,
        eaForbidden: true,
      },
    },
  },
  ftmo: {
    name: "FTMO",
    color: "#60a5fa",
    note: "DD total STATIC 10% - Payout 14j - Scaling +25%/4mois",
    models: {
      "2step": {
        name: "FTMO 2-Step",
        phases: [
          { label: "Challenge", target: 0.10, minDays: 4 },
          { label: "Verification", target: 0.05, minDays: 4 },
        ],
        dailyDD: 0.05, totalDD: 0.10, ddType: "static", challengeReward: 0,
        firstPayoutDays: 14, payoutCycle: 14, splitStart: 80, splitMax: 90,
      },
      "1step": {
        name: "FTMO 1-Step",
        phases: [{ label: "Challenge", target: 0.10, minDays: 4 }],
        dailyDD: 0.03, totalDD: 0.10, ddType: "trailing", challengeReward: 0,
        firstPayoutDays: 14, payoutCycle: 14, splitStart: 80, splitMax: 90,
      },
    },
  },
  e8: {
    name: "E8 Markets",
    color: "#a78bfa",
    note: "Classic 2-Step - DD total 8% - Best Day Rule 40% (funded)",
    models: {
      "2step": {
        name: "E8 Classic 2-Step",
        phases: [
          { label: "Phase 1", target: 0.08, minDays: 0 },
          { label: "Phase 2", target: 0.04, minDays: 0 },
        ],
        dailyDD: 0.05, totalDD: 0.08, ddType: "static", challengeReward: 0,
        firstPayoutDays: 14, payoutCycle: 14, splitStart: 80, splitMax: 100,
      },
      "1step": {
        name: "E8 One 1-Step",
        phases: [{ label: "Evaluation", target: 0.10, minDays: 0 }],
        dailyDD: 0.03, totalDD: 0.06, ddType: "trailing", challengeReward: 0,
        firstPayoutDays: 8, payoutCycle: 14, splitStart: 80, splitMax: 100,
      },
    },
  },
  alpha: {
    name: "Alpha Capital",
    color: "#6ee7b7",
    note: "Pro 8% - DD total 8% STATIC - News interdit +/-5min",
    models: {
      "2step": {
        name: "Alpha Pro 8%",
        phases: [
          { label: "Phase 1", target: 0.08, minDays: 3 },
          { label: "Phase 2", target: 0.04, minDays: 3 },
        ],
        dailyDD: 0.04, totalDD: 0.08, ddType: "static", challengeReward: 0,
        firstPayoutDays: 14, payoutCycle: 14, splitStart: 80, splitMax: 90,
      },
      "1step": {
        name: "Alpha One",
        phases: [{ label: "Evaluation", target: 0.10, minDays: 3 }],
        dailyDD: 0.04, totalDD: 0.06, ddType: "trailing", challengeReward: 0,
        firstPayoutDays: 14, payoutCycle: 14, splitStart: 80, splitMax: 90,
      },
    },
  },
  the5ers: {
    name: "The 5%ers",
    color: "#f87171",
    note: "High Stakes - DD total 10% absolute - NEWS & HFT INTERDIT",
    models: {
      "2step": {
        name: "High Stakes 2-Step",
        phases: [
          { label: "Phase 1", target: 0.08, minDays: 3 },
          { label: "Phase 2", target: 0.05, minDays: 3 },
        ],
        dailyDD: 0.05, totalDD: 0.10, ddType: "static", challengeReward: 0,
        firstPayoutDays: 14, payoutCycle: 14, splitStart: 80, splitMax: 100,
        newsForbidden: true,
      },
    },
  },
  fundingpips: {
    name: "FundingPips",
    color: "#6ee7b7",
    note: "2-Step Standard - DD total 10% STATIC - News non comptee +/-5min",
    models: {
      "2step": {
        name: "FP 2-Step Standard",
        phases: [
          { label: "Phase 1", target: 0.08, minDays: 3 },
          { label: "Phase 2", target: 0.05, minDays: 3 },
        ],
        dailyDD: 0.05, totalDD: 0.10, ddType: "static", challengeReward: 0,
        firstPayoutDays: 14, payoutCycle: 14, splitStart: 80, splitMax: 90,
      },
      "2steppro": {
        name: "FP 2-Step Pro",
        phases: [
          { label: "Phase 1", target: 0.06, minDays: 3 },
          { label: "Phase 2", target: 0.06, minDays: 3 },
        ],
        dailyDD: 0.03, totalDD: 0.06, ddType: "static", challengeReward: 0,
        firstPayoutDays: 14, payoutCycle: 14, splitStart: 80, splitMax: 90,
      },
    },
  },
};

// Compat : MODELS pointe vers les modèles de la firm sélectionnée (défaut FundedNext)
const MODELS = PROP_FIRMS.fundednext.models;

const FEES = { 6000: 59, 15000: 119, 25000: 199, 50000: 299, 100000: 549, 200000: 999 };
function challengeFee(capital) {
  const sizes = Object.keys(FEES).map(Number).sort((a, b) => a - b);
  let closest = sizes[0];
  for (const s of sizes) if (Math.abs(s - capital) < Math.abs(closest - capital)) closest = s;
  return FEES[closest];
}

const SIM_DAYS = 90;

const fmt = (v) => "$" + Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmt2 = (v) => "$" + Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 });
const fmtPn = (v) => (v >= 0 ? "+" : "") + (v * 100).toFixed(2) + "%";

function makeTradeStream(winrate, clustering, maxConsecLosses) {
  const w = winrate / 100;
  let lastWin = Math.random() < w;
  let consecLosses = 0;
  const cap = (maxConsecLosses > 0 && maxConsecLosses < 100) ? maxConsecLosses : Infinity;

  return function nextTrade() {
    if (consecLosses >= cap) {
      lastWin = true;
      consecLosses = 0;
      return true;
    }
    if (clustering <= 0) {
      lastWin = Math.random() < w;
    } else {
      const pull = clustering * 0.5;
      const adjW = lastWin
        ? w + (1 - w) * pull
        : w - w * pull;
      lastWin = Math.random() < Math.max(0.02, Math.min(0.98, adjW));
    }
    if (!lastWin) consecLosses++;
    else consecLosses = 0;
    return lastWin;
  };
}

function simulateDay(equity, tradesPerDay, riskAmount, rr, nextTrade, dailyDDLimit) {
  let dayEquity = equity;
  let dayLowPnl = 0;
  let wins = 0, losses = 0;
  // Support fractionnel : 0.33 trade/jour = 1 trade avec P=0.33
  const nTrades = tradesPerDay < 1
    ? (Math.random() < tradesPerDay ? 1 : 0)
    : Math.round(tradesPerDay);
  for (let t = 0; t < nTrades; t++) {
    const win = nextTrade();
    if (win) { dayEquity += riskAmount * rr; wins++; }
    else { dayEquity -= riskAmount; losses++; }
    const cumPnl = dayEquity - equity;
    if (cumPnl < dayLowPnl) dayLowPnl = cumPnl;
    if (-dayLowPnl > dailyDDLimit) {
      return { dayEquity, dayPnl: dayEquity - equity, wins, losses, breached: true };
    }
  }
  return { dayEquity, dayPnl: dayEquity - equity, wins, losses, breached: false };
}

function simulatePhase(capital, cfg, model, p) {
  const { target, minDays } = cfg;
  const dailyDDLimit = capital * model.dailyDD;
  const floorEquity = capital * (1 - model.totalDD);
  const riskAmount = capital * p.riskPct;
  const nextTrade = makeTradeStream(p.winrate, p.clustering, p.maxConsecLosses);
  let equity = capital;
  const days = [];
  let status = "running";
  let tradingDays = 0, totalWins = 0, totalLosses = 0, winDayCount = 0;
  let peak = capital;
  let maxDD = 0; // en % du capital initial

  for (let d = 1; d <= SIM_DAYS; d++) {
    const res = simulateDay(equity, p.tradesPerDay, riskAmount, p.rr, nextTrade, dailyDDLimit);
    totalWins += res.wins;
    totalLosses += res.losses;
    equity = res.dayEquity;
    if (equity > peak) peak = equity;
    const dd = (capital - equity) / capital; // DD depuis capital initial (regle FundedNext)
    if (dd > maxDD) maxDD = dd;

    if (res.breached) {
      status = "failed_daily_dd";
      days.push({ day: d, equity: +equity.toFixed(2), status: "fail" });
      break;
    }
    if (res.dayPnl >= 0) winDayCount++;

    if (equity < floorEquity) {
      status = "failed_total_dd";
      days.push({ day: d, equity: +equity.toFixed(2), status: "fail" });
      break;
    }

    tradingDays++;
    days.push({ day: d, equity: +equity.toFixed(2), status: "ok" });

    const profit = (equity - capital) / capital;
    if (profit >= target && tradingDays >= minDays) { status = "passed"; break; }
  }

  if (status === "running") status = "running_ok";
  const totalTrades = totalWins + totalLosses;
  return {
    days, finalEquity: equity, status, tradingDays,
    profit: (equity - capital) / capital,
    tradeWinrate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
    dayWinrate: tradingDays > 0 ? (winDayCount / tradingDays) * 100 : 0,
    totalWins, totalLosses,
    maxDD: maxDD * 100, // en %
    maxDDAmount: maxDD * capital, // en $
  };
}

function simulateFunded(capital, months, model, p, split) {
  const dailyDDLimit = capital * model.dailyDD;
  const floorEquity = capital * (1 - model.totalDD);
  const riskAmount = capital * p.riskPct;
  const nextTrade = makeTradeStream(p.winrate, p.clustering, p.maxConsecLosses);
  let equity = capital;
  let currentCapital = capital; // capital de reference (augmente apres scaling)
  let cumulPayout = 0, pendingPayout = 0;
  const data = [];
  let status = "active", scalingCount = 0;
  let winMonths = 0, lossMonths = 0;
  const TD_MONTH = 21;
  let maxDD = 0;

  const PAYOUT_MIN = 50; // seuil reel FundedNext ($50 hors USDT)
  const firstPayoutDone = false;
  let payoutCycleCount = 0; // nombre de cycles de payout effectues

  let consecutiveProfitMonths = 0;
  let payoutsInStreak = 0;
  let currentSplit = split; // split evolue apres scaling (80% -> 90%)

  const dailyLog = []; // P&L jour par jour pour le calendrier
  let globalDay = 0;

  for (let m = 1; m <= months; m++) {
    const monthStart = equity;
    let monthFailed = null;

    for (let d = 0; d < TD_MONTH; d++) {
      const dayStart = equity;
      const res = simulateDay(equity, p.tradesPerDay, riskAmount, p.rr, nextTrade, dailyDDLimit);
      equity = res.dayEquity;
      globalDay++;
      dailyLog.push({
        globalDay,
        month: m,
        dayOfMonth: d + 1,
        pnl: +(equity - dayStart).toFixed(2),
        equity: +equity.toFixed(2),
        wins: res.wins,
        losses: res.losses,
        breached: res.breached,
      });
      const dd = (currentCapital - equity) / currentCapital;
      if (dd > maxDD) maxDD = dd;
      if (res.breached) { monthFailed = "failed_daily_dd"; break; }
      if (equity < currentCapital * (1 - model.totalDD)) { monthFailed = "failed_total_dd"; break; }
    }

    const pnl = equity - monthStart;
    const profitable = pnl >= 0;
    if (profitable) winMonths++; else lossMonths++;

    if (profitable) {
      consecutiveProfitMonths++;
    } else {
      consecutiveProfitMonths = 0;
      payoutsInStreak = 0;
    }

    let payout = 0;
    if (pnl > 0) {
      pendingPayout += pnl * currentSplit;
      for (let cycle = 0; cycle < 2; cycle++) {
        if (pendingPayout >= PAYOUT_MIN) {
          payout += pendingPayout;
          cumulPayout += pendingPayout;
          payoutCycleCount++;
          if (profitable) payoutsInStreak++;
          pendingPayout = 0;
        }
      }
      payout = +payout.toFixed(2);
    }

    let scalingNote = null;
    if (consecutiveProfitMonths >= 4 && payoutsInStreak >= 2) {
      scalingCount++;
      const addedCapital = capital * 0.40; // +40% du capital INITIAL
      currentCapital = equity + addedCapital;
      equity = currentCapital; // le nouveau solde inclut le scaling
      currentSplit = Math.min(0.90, split + (0.10 * scalingCount)); // passe a 90% apres scale
      consecutiveProfitMonths = 0; // reset le compteur
      payoutsInStreak = 0;
      scalingNote = "Scale +" + fmt(addedCapital) + " -> Split " + Math.round(currentSplit * 100) + "%";
    }

    data.push({
      month: m,
      equity: +equity.toFixed(2),
      payout,
      cumul: +cumulPayout.toFixed(2),
      status: monthFailed ? "fail" : "active",
      profitPct: +((pnl / monthStart) * 100).toFixed(2),
      ddPct: +(Math.max(0, (currentCapital - equity) / currentCapital * 100)).toFixed(2),
      scalingNote,
      currentSplit: Math.round(currentSplit * 100),
      streakMonths: consecutiveProfitMonths,
    });

    if (monthFailed) { status = monthFailed; break; }
  }

  const totalM = winMonths + lossMonths;
  return {
    data, finalEquity: equity, cumulPayout,
    pendingPayout: +pendingPayout.toFixed(2),
    status, scalingCount,
    winrateMonth: totalM > 0 ? (winMonths / totalM) * 100 : 0,
    winMonths, lossMonths,
    maxDD: maxDD * 100,
    maxDDAmount: maxDD * currentCapital,
    finalSplit: Math.round(currentSplit * 100),
    dailyLog,
  };
}

function SimulatorScreen({ t = (k) => k, lang = "fr", tab = "challenge", setTab = () => {}, onSimResult = () => {} }) {
  const loadSaved = () => {
    try {
      const raw = localStorage.getItem("eapropfirm_config");
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  };
  const saved = loadSaved();

  const [firmKey, setFirmKey] = useState(saved.firmKey ?? "fundednext");
  const [modelKey, setModelKey] = useState(saved.modelKey ?? "2step");
  const [capital, setCapital] = useState(saved.capital ?? 25000);
  const [riskPct, setRiskPct] = useState(saved.riskPct ?? 0.2);
  const [dailyTargetPct, setDailyTargetPct] = useState(saved.dailyTargetPct ?? 0.25);
  const [winrate, setWinrate] = useState(saved.winrate ?? 55);
  const [tradesPerDay, setTradesPerDay] = useState(saved.tradesPerDay ?? 3);
  const [clusteringPct, setClusteringPct] = useState(saved.clusteringPct ?? 40);
  const [maxConsecLosses, setMaxConsecLosses] = useState(saved.maxConsecLosses ?? 4);
  const [split, setSplit] = useState(saved.split ?? 80);
  const [fundedMonths, setFundedMonths] = useState(saved.fundedMonths ?? 12);
  const [activePreset, setActivePreset] = useState(saved.activePreset ?? "custom");

  // PRESETS EA connus
  const PRESETS = {
    custom: { label: "Manuel", icon: "" },
    goldstrom_v4: {
      label: "v4 - Goldstrom",
      bt: { monthly: 3.30, dd: 5.9, sharpe: 3.97, pf: 1.98, trades: 172 },
      values: {
        winrate: 48, tradesPerDay: 0.33, dailyTargetPct: 0.16,
        riskPct: 0.2, clusteringPct: 35, maxConsecLosses: 4,
        instrument: "XAUUSD", lotSize: 0.1, slPips: 150,
        useFixedLot: true, split: 80,
      }
    },
    goldpulse_v20: {
      label: "GoldPulse V20",
      bt: { monthly: null, dd: 4.25, sharpe: null, pf: 1.55, trades: null,
            wr: 47, rr: 1.75, tpd: 0.28, clustering: 40, maxConsec: 7,
            pnl: 32.80, pireJour: -408, pireSemaine: -614,
            violations: "0 violation DD jour | 0 violation max loss",
            phase1: "10.1%", phase2: "29.8%",
            newsFilter: "Filtre news actif | Risque strict actif" },
      values: {
        winrate: 47, tradesPerDay: 0.28, dailyTargetPct: 0.14,
        riskPct: 0.2, clusteringPct: 40, maxConsecLosses: 7,
        instrument: "XAUUSD", lotSize: 0.1, slPips: 150,
        useFixedLot: true, split: 80,
      }
    },
  };

  const applyPreset = (key) => {
    const p = PRESETS[key];
    if (!p || !p.values) { setActivePreset("custom"); return; }
    const v = p.values;
    setWinrate(v.winrate ?? winrate);
    setTradesPerDay(v.tradesPerDay ?? tradesPerDay);
    setDailyTargetPct(v.dailyTargetPct ?? dailyTargetPct);
    setRiskPct(v.riskPct ?? riskPct);
    setClusteringPct(v.clusteringPct ?? clusteringPct);
    setMaxConsecLosses(v.maxConsecLosses ?? maxConsecLosses);
    if (v.instrument !== undefined) setInstrument(v.instrument);
    if (v.lotSize !== undefined) setLotSize(v.lotSize);
    if (v.slPips !== undefined) setSlPips(v.slPips);
    if (v.useFixedLot !== undefined) setUseFixedLot(v.useFixedLot);
    if (v.split !== undefined) setSplit(v.split);
    if (v.newsImpact !== undefined) setNewsImpact(v.newsImpact);
    setActivePreset(key);
    setSeed(s => s + 1);
  };
  // LOT / INSTRUMENT
  const [instrument, setInstrument] = useState(saved.instrument ?? "XAUUSD");
  const [lotSize, setLotSize] = useState(saved.lotSize ?? 0.1);
  const [slPips, setSlPips] = useState(saved.slPips ?? 150);
  const [useFixedLot, setUseFixedLot] = useState(saved.useFixedLot ?? false);
  const [newsImpact, setNewsImpact] = useState(saved.newsImpact ?? false); // réduit le split pour les trades en fenêtre news
  const [sim, setSim] = useState(null);
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    try {
      const configToSave = {
        firmKey, modelKey, capital, riskPct: useFixedLot ? lotRiskPct : riskPct, dailyTargetPct, winrate,
        tradesPerDay, clusteringPct, maxConsecLosses, split, fundedMonths,
        instrument, lotSize, slPips, useFixedLot, newsImpact, activePreset
      };
      localStorage.setItem("eapropfirm_config", JSON.stringify(configToSave));
      setSaveStatus("Enregistre");
      const t = setTimeout(() => setSaveStatus(""), 1500);
      return () => clearTimeout(t);
    } catch (e) { /* localStorage indisponible (artefact) - ignore */ }
  }, [firmKey, modelKey, capital, riskPct, dailyTargetPct, winrate, tradesPerDay, clusteringPct, maxConsecLosses, split, fundedMonths, instrument, lotSize, slPips, useFixedLot]);

  const firm = PROP_FIRMS[firmKey] || PROP_FIRMS.fundednext;
  const firmModels = firm.models;
  const safeModelKey = firmModels[modelKey] ? modelKey : Object.keys(firmModels)[0];
  const model = firmModels[safeModelKey];
  const dailyTarget = dailyTargetPct / 100;
  const splitRate = split / 100;
  const clustering = clusteringPct / 100;
  const fee = challengeFee(capital);
  const w = winrate / 100;
  const monthlyTarget = dailyTarget * 21;

  const PIP_VALUES = {
    "XAUUSD": 10.0,  // 0.1 lot × 150 pips × $10 = $150 ✓
    "XAGUSD": 50.0,
    "EURUSD": 10.0,
    "GBPUSD": 10.0,
    "AUDUSD": 10.0,
    "NZDUSD": 10.0,
    "USDJPY":  9.1,
    "USDCHF": 10.2,
    "USDCAD":  7.5,
    "GBPJPY":  9.1,
    "EURJPY":  9.1,
    "NAS100":  1.0,
    "US30":    1.0,
    "SP500":   0.1,
  };
  const pipVal = PIP_VALUES[instrument] || 10.0;

  const lotRiskAmount = lotSize * pipVal * slPips;        // $ risque par trade (lot)
  const lotRiskPct    = lotRiskAmount / capital * 100;    // % du capital

  const effectiveRiskAmount = useFixedLot ? lotRiskAmount        : capital * (riskPct / 100);
  const effectiveRiskPct    = useFixedLot ? lotRiskPct           : riskPct;
  const effectiveRisk       = effectiveRiskPct / 100;            // fraction

  // Formule : RR = (dailyTarget/(n×riskPerTrade) + (1-w)) / w
  const finalRR      = w > 0 && effectiveRisk > 0
    ? (dailyTarget / (tradesPerDay * effectiveRisk) + (1 - w)) / w
    : 0;
  const finalRRValid = finalRR > 0 && finalRR < 20;

  // E[P&L/jour] = n × (w × RR × risk - (1-w) × risk) × capital
  //             = n × risk × capital × (w×RR - (1-w))
  // Avec finalRR : E = n × effectiveRisk × capital × (w×finalRR - (1-w))
  //             = tradesPerDay × effectiveRiskAmount × (w×finalRR - (1-w))
  const expectedDailyPnL = tradesPerDay * effectiveRiskAmount * (w * finalRR - (1 - w));

  // Impact news : ~15% des trades touchés par la fenêtre news (estimation)
  // Sur ces trades : gains réduits à 40% → impact effectif sur split
  const newsRatio = 0.15; // ~15% des trades en fenêtre news (FOMC, NFP, CPI...)
  const effectiveSplitRate = newsImpact
    ? splitRate * (1 - newsRatio + newsRatio * 0.4)  // 85% normal + 15% × 40%
    : splitRate;

  const p = {
    tradesPerDay,
    riskPct:        effectiveRisk,
    rr:             finalRR,
    winrate,
    clustering,
    maxConsecLosses,
  };

  useEffect(() => {
    if (!finalRRValid) { setSim(null); return; }
    const phaseResults = [];
    let allPassed = true;
    for (let i = 0; i < model.phases.length; i++) {
      if (!allPassed) { phaseResults.push(null); continue; }
      const r = simulatePhase(capital, model.phases[i], model, p);
      phaseResults.push(r);
      if (r.status !== "passed") allPassed = false;
    }
    const funded = allPassed ? simulateFunded(capital, fundedMonths, model, p, effectiveSplitRate) : null;

    let challengeReward = 0;
    if (allPassed) {
      phaseResults.forEach(ph => {
        if (ph && ph.profit > 0) challengeReward += capital * ph.profit * model.challengeReward;
      });
    }
    setSim({ phaseResults, funded, allPassed, challengeReward });
    // Remonter les données complètes au Dashboard
    try {
      const reward = challengeReward || 0;
      const payout = funded ? funded.cumulPayout : 0;
      const pending = funded ? funded.pendingPayout : 0;
      const net = reward + payout + pending - fee;

      const ph1 = phaseResults[0] || {};
      const progression = Math.max(0, Math.min(100, Math.round((ph1.profit || 0) / model.phases[0].target * 100)));
      const ddDayPct = (ph1.maxDD || 0).toFixed(1);
      const ddTotPct = (ph1.maxDD || 0).toFixed(1);
      const phase1Pct = ((ph1.profit || 0) * 100).toFixed(1);
      const tradingDays = ph1.tradingDays || 0;

      // Courbe equity (funded ou phase 1)
      const rawCurve = funded?.data
        ? funded.data.map((d, i) => ({ i: i + 1, v: +d.equity.toFixed(0) }))
        : (ph1.days || []).map((d, idx) => ({ i: idx + 1, v: d.equity }));
      const equityCurve = rawCurve.slice(0, 90);

      // Statistiques trades
      const totalTrades = (ph1.totalWins || 0) + (ph1.totalLosses || 0);
      const tradeWR = ph1.tradeWinrate ? ph1.tradeWinrate.toFixed(1) : winrate;
      const bestTrade = +(effectiveRiskAmount * finalRR).toFixed(0);
      const worstTrade = -effectiveRiskAmount;

      // PnL calendrier
      const dailyLog = funded?.dailyLog || [];

      onSimResult({
        allPassed, net, firmKey, modelKey, capital, ts: Date.now(),
        progression, phase1Pct, ddDayPct, ddTotPct, tradingDays,
        phase1Target: model.phases[0].target * 100,
        dailyDDLimit: model.dailyDD * 100,
        totalDDLimit: model.totalDD * 100,
        splitStart: model.splitStart, splitMax: model.splitMax,
        equityCurve, dailyLog,
        winrate: tradeWR, rr: +finalRR.toFixed(2),
        totalTrades, wins: ph1.totalWins || 0, losses: ph1.totalLosses || 0,
        bestTrade, worstTrade,
        profitAmount: +((ph1.profit || 0) * capital).toFixed(2),
      });
    } catch (e) {}
  }, [firmKey, modelKey, capital, riskPct, dailyTargetPct, winrate, tradesPerDay, clusteringPct, maxConsecLosses, splitRate, fundedMonths, seed, useFixedLot, lotSize, slPips, instrument, newsImpact]);

  const netResult = () => {
    if (!sim) return null;
    const reward = sim.challengeReward || 0;
    const payout = sim.funded ? sim.funded.cumulPayout : 0;
    const pending = sim.funded ? sim.funded.pendingPayout : 0;
    const gross = reward + payout + pending;
    const net = gross - fee;
    return { reward, payout, pending, gross, fee, net };
  };
  const bilan = netResult();

  const ddAnalysis = () => {
    const maxDayLoss = tradesPerDay * effectiveRiskAmount; // perte max en 1 jour
    const maxDayLossPct = (maxDayLoss / capital) * 100;
    const ddLimit = capital * model.totalDD;
    const dailyDDLimit = capital * model.dailyDD;
    const daysToTotalDD = Math.ceil(ddLimit / maxDayLoss);
    const canBreachDaily = maxDayLoss > dailyDDLimit;
    let simMaxDD = 0, simMaxDDAmount = 0;
    if (sim) {
      sim.phaseResults.forEach(ph => {
        if (ph && ph.maxDD > simMaxDD) { simMaxDD = ph.maxDD; simMaxDDAmount = ph.maxDDAmount; }
      });
      if (sim.funded && sim.funded.maxDD > simMaxDD) {
        simMaxDD = sim.funded.maxDD;
        simMaxDDAmount = sim.funded.maxDDAmount;
      }
    }
    const distancePct = model.totalDD * 100 - simMaxDD;
    const distanceAmt = capital * model.totalDD - simMaxDDAmount;
    return {
      maxDayLoss, maxDayLossPct, ddLimit, dailyDDLimit,
      daysToTotalDD, canBreachDaily,
      simMaxDD, simMaxDDAmount,
      distancePct, distanceAmt,
      safePct: 100 - (simMaxDD / (model.totalDD * 100)) * 100,
    };
  };
  const dda = ddAnalysis();

  const globalStatus = () => {
    if (!sim) return null;
    for (let i = 0; i < sim.phaseResults.length; i++) {
      const ph = sim.phaseResults[i];
      if (ph && ph.status.startsWith("failed"))
        return { label: "ECHEC - " + model.phases[i].label, color: "#ef4444", bg: "#2d0808", emoji: "ROUGE" };
      if (ph && ph.status === "running_ok")
        return { label: "EN COURS - " + model.phases[i].label, color: "#fbbf24", bg: "#2d1f08", emoji: "ORANGE" };
    }
    if (!sim.funded) return null;
    if (sim.funded.status.startsWith("failed"))
      return { label: "COMPTE FERME", color: "#ef4444", bg: "#2d0808", emoji: "ROUGE" };
    return { label: "COMPTE ACTIF", color: "#6ee7b7", bg: "rgba(255,255,255,0.05)", emoji: "VERT" };
  };
  const gs = globalStatus();
  const dot = (e) => e === "VERT" ? "\u{1F7E2}" : e === "ORANGE" ? "\u{1F7E0}" : "\u{1F534}";

  const phaseIcon = (s) => {
    if (s === "passed") return { icon: "\u2713", color: "#6ee7b7", bg: "rgba(255,255,255,0.05)", label: "PASSE" };
    if (s === "running_ok") return { icon: "~", color: "#fbbf24", bg: "#2d1f08", label: "EN COURS" };
    if (s && s.startsWith("failed")) return { icon: "\u2717", color: "#ef4444", bg: "#2d0808", label: "ECHOUE" };
    return { icon: "-", color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.05)", label: "N/A" };
  };
  const failReason = (s) => {
    if (s === "failed_daily_dd") return "DD journalier " + (model.dailyDD * 100) + "% depasse (intraday) - compte ferme";
    if (s === "failed_total_dd") return "DD total " + (model.totalDD * 100) + "% depasse - compte ferme";
    if (s === "running_ok") return "Objectif pas atteint apres 90j (pas de limite de temps - continue)";
    return null;
  };

  const buildReport = () => {
    if (!sim) return "RR invalide - ajuste winrate ou objectif";
    const sep = "─".repeat(48);
    let txt = "RAPPORT SIMULATION FUNDEDNEXT\n" + sep + "\n";
    txt += "Modele  : " + model.name + "\n";
    txt += "Date    : " + new Date().toLocaleDateString("fr-FR") + "\n";
    txt += "Statut  : " + (gs ? gs.label : "En cours") + "\n";
    txt += sep + "\n";
    txt += "PARAMETRES TRADING\n";
    txt += "Capital          : " + fmt(capital) + "\n";
    txt += "Risque/trade     : " + riskPct + "% = " + fmt2(effectiveRiskAmount) + " (fixe)\n";
    txt += "Trades/jour      : " + tradesPerDay + "\n";
    txt += "Winrate          : " + winrate + "%\n";
    txt += "Clustering pertes: " + clusteringPct + "%\n";
    txt += "Objectif/jour    : " + dailyTargetPct + "%\n";
    txt += "RR necessaire    : 1:" + finalRR.toFixed(2) + "\n";
    txt += "Profit/mois cible: " + (monthlyTarget * 100).toFixed(1) + "%\n";
    txt += sep + "\n";
    txt += "CHALLENGE\n";
    sim.phaseResults.forEach((ph, i) => {
      if (!ph) { txt += model.phases[i].label + " : verrouille\n"; return; }
      txt += model.phases[i].label + " (obj +" + (model.phases[i].target * 100) + "%)  : "
        + phaseIcon(ph.status).label
        + "  |  Profit " + fmtPn(ph.profit)
        + "  |  WR " + ph.tradeWinrate.toFixed(0) + "%"
        + "  |  " + ph.tradingDays + " jours\n";
    });
    txt += sep + "\n";
    if (sim.funded) {
      const f = sim.funded;
      txt += "COMPTE FUNDED (" + fundedMonths + " mois) - " + (f.status === "active" ? "ACTIF" : "FERME") + "\n";
      txt += "Capital final    : " + fmt(f.finalEquity) + "\n";
      txt += "Payout verse     : " + fmt2(f.cumulPayout) + "\n";
      txt += "En attente       : " + fmt2(f.pendingPayout) + "\n";
      txt += "WR mensuel       : " + f.winrateMonth.toFixed(0) + "%\n";
      txt += "Mois gagnants    : " + f.winMonths + "/" + (f.winMonths + f.lossMonths) + "\n";
      txt += sep + "\n";
      txt += "DETAIL MENSUEL\n";
      const COL = [6, 12, 10, 10, 8];
      const pad = (s, n) => String(s).padStart(n);
      txt += pad("Mois", COL[0]) + pad("Equity", COL[1]) + pad("Profit%", COL[2]) + pad("Payout", COL[3]) + pad("Statut", COL[4]) + "\n";
      txt += "-".repeat(COL.reduce((a, b) => a + b, 0)) + "\n";
      f.data.forEach(r => {
        txt += pad("M" + r.month, COL[0])
          + pad(fmt(r.equity), COL[1])
          + pad((r.profitPct >= 0 ? "+" : "") + r.profitPct.toFixed(2) + "%", COL[2])
          + pad(r.payout > 0 ? fmt(r.payout) : "-", COL[3])
          + pad(r.status === "active" ? "OK" : "FERME", COL[4]) + "\n";
      });
    } else {
      txt += "COMPTE FUNDED : challenge non passe\n";
    }
    txt += sep + "\n";
    if (bilan) {
      txt += "BILAN FINANCIER NET\n";
      txt += "Reward challenge 15%   : +" + fmt2(bilan.reward) + "\n";
      txt += "Payouts funded verses  : +" + fmt2(bilan.payout) + "\n";
      txt += "En attente (non verse) : +" + fmt2(bilan.pending) + "\n";
      txt += "Frais challenge        : -" + fmt2(bilan.fee) + "\n";
      txt += "─".repeat(32) + "\n";
      txt += "RESULTAT NET           :  " + fmt2(bilan.net) + "\n";
    }
    txt += sep + "\n";
    txt += "Simulation indicative - regles FundedNext 2026 - pas une garantie.\n";
    return txt;
  };

  // buildHtml supprime (taille)

  const copyReport = () => {
    const txt = buildReport();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(
        () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
        () => fallbackCopy(txt));
    } else fallbackCopy(txt);
  };
  const fallbackCopy = (txt) => {
    const ta = document.createElement("textarea");
    ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (e) { alert("Copie impossible"); }
    document.body.removeChild(ta);
  };

  const printReport = () => { const txt = buildReport(); if(txt) { const w=window.open("","_blank"); if(w){w.document.write("<pre>"+txt+"</pre>"); w.print();}} };

  const wrColor = winrate >= 60 ? "#6ee7b7" : winrate >= 50 ? "#fbbf24" : "#ef4444";
  const clColor = clusteringPct <= 25 ? "#6ee7b7" : clusteringPct <= 55 ? "#fbbf24" : "#ef4444";

  const _d = useFixedLot ? (() => {
    const md = lotRiskAmount * tradesPerDay;
    const n10 = Math.floor(capital * model.totalDD / lotRiskAmount);
    const chks = [
      [md <= capital*model.dailyDD, "DD jour", "Perte max " + (md/capital*100).toFixed(2) + "% < " + (model.dailyDD*100) + "%", "DANGER perte " + (md/capital*100).toFixed(2) + "% > limite"],
      [n10 >= 8, "Resistance DD", n10 + " trades pour -" + (model.totalDD*100) + "%", n10 + " trades suffisent - risque"],
      [finalRRValid, "RR atteignable", "1:" + finalRR.toFixed(2) + " objectif OK", "RR trop eleve"],
      [lotRiskPct <= 1.0, "Risque/trade", lotRiskPct.toFixed(2) + "% dans normes", lotRiskPct.toFixed(2) + "% > 1% recommande"],
    ];
    return { chks, resume: lotRiskPct > 1.0 ? "Lot ideal: " + (50/(slPips*pipVal)).toFixed(2) + " lots pour $50 risque." : lotRiskPct > 0.5 ? "Agressif viable. Max serie: $" + (maxConsecLosses*lotRiskAmount).toFixed(0) + "." : "Conservative - simulation adaptee." };
  })() : null;
  const lotDiagJSX = _d ? (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.40)", marginBottom: 6, textTransform: "uppercase" }}>Diagnostic FundedNext</div>
      {_d.chks.map(([ok, l, v, e]) => (
        <div key={l} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6, background: ok ? "rgba(255,255,255,0.05)" : "#2d0808", border: "1px solid " + (ok ? "#6ee7b730" : "#ef444430"), borderRadius: 8, padding: "7px 10px" }}>
          <span style={{ fontSize: 12, color: ok ? "#6ee7b7" : "#ef4444" }}>{ok ? "+" : "x"}</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: ok ? "#6ee7b7" : "#ef4444" }}>{l}</div>
            <div style={{ fontSize: 10, color: ok ? "rgba(255,255,255,0.55)" : "#fca5a5" }}>{ok ? v : e}</div>
          </div>
        </div>
      ))}
      <div style={{ background: lotRiskPct > 0.5 ? "#2d1f08" : "rgba(255,255,255,0.05)", border: "1px solid " + (lotRiskPct > 0.5 ? "#6ee7b740" : "#6ee7b740"), borderRadius: 8, padding: "8px 10px", fontSize: 11 }}>
        <b style={{ color: "rgba(255,255,255,0.55)" }}>Resume: </b><span style={{ color: "#FFFFFF" }}>{_d.resume}</span>
      </div>
    </div>
  ) : null;

  // Sauvegarder la config courante dans la liste des configs (Dashboard)
  const saveCurrentConfig = () => {
    try {
      const cfg = {
        id: Date.now(),
        name: (activePreset !== "custom" && PRESETS[activePreset]?.label) || (firm.name + " " + winrate + "% WR"),
        firmKey, modelKey: safeModelKey, capital,
        winrate, tradesPerDay, dailyTargetPct, riskPct, clusteringPct, maxConsecLosses,
        instrument, lotSize, slPips, useFixedLot, split, newsImpact, activePreset,
      };
      const raw = localStorage.getItem("eapropfirm_saved_configs");
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(cfg);
      localStorage.setItem("eapropfirm_saved_configs", JSON.stringify(list.slice(0, 12)));
      setSaveStatus(t("sim_config_saved"));
      setTimeout(() => setSaveStatus(""), 2500);
    } catch (e) {}
  };


  return (
    <div style={{ fontFamily: "-apple-system, sans-serif", color: "#FFFFFF" }}>
      <style>{`
        * { box-sizing: border-box; }
        .card { background: #110C02; border: 1px solid rgba(110,231,183,0.14); border-radius: 14px; padding: 14px; margin-bottom: 12px; }
        .tab-btn { padding: 7px 12px; border-radius: 8px; border: none; cursor: pointer; font-size: 11px; font-weight: 700; font-family: -apple-system, sans-serif; }
        .tab-btn.on { background: #6ee7b7; color: #000000; font-weight: 600; }
        .tab-btn.off { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.50); border: 1px solid rgba(255,255,255,0.08); }
        .model-btn { flex: 1; padding: 9px 4px; border-radius: 8px; cursor: pointer; font-size: 10px; font-weight: 700; font-family: -apple-system, sans-serif; border: 1px solid rgba(110,231,183,0.14); }
        .model-btn.on { background: #6ee7b7; color: #000000; border-color: #6ee7b7; }
        .model-btn.off { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.07); }
        input[type=range] { width: 100%; accent-color: #6ee7b7; margin-top: 3px; }
        input[type=number] { background: rgba(110,231,183,0.06); border: 1px solid rgba(110,231,183,0.16); border-radius: 8px; color: #F0E4C8; padding: 5px 8px; width: 100%; font-size: 13px; font-family: -apple-system, sans-serif; }
        .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid rgba(110,231,183,0.08); font-size: 12px; }
        .row:last-child { border-bottom: none; }
        .tag { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; font-family: -apple-system, sans-serif; }
        .kpi { background: rgba(110,231,183,0.06); border: 1px solid rgba(110,231,183,0.10); border-radius: 10px; padding: 10px; }
      `}</style>

      <div style={{ height: 14 }}>
        {saveStatus && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", opacity: 1 }}>✓ {saveStatus}</span>}
      </div>

      {/* Toggle Challenge / Funded (vue simulateur uniquement) */}
      {(tab === "challenge" || tab === "funded") && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[{ id: "challenge", label: "Challenge" }, { id: "funded", label: "Funded" }].map(tg => (
            <button key={tg.id} onClick={() => setTab(tg.id)} style={{
              flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
              background: tab === tg.id ? "#6ee7b7" : "rgba(255,255,255,0.07)",
              color: tab === tg.id ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.35)",
              border: "1px solid " + (tab === tg.id ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
            }}>{tg.label}</button>
          ))}
        </div>
      )}

      {/* ══ CARTES CONFIG — vue simulateur uniquement (Challenge/Funded) ══ */}
      {(tab === "challenge" || tab === "funded") && (<>
      {/* PRESETS */}
      <div className="card" style={{ borderLeft: "3px solid #6ee7b7" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.40)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Configuration EA</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.keys(PRESETS).map(key => (
            <button key={key}
              onClick={() => applyPreset(key)}
              style={{
                padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700,
                background: activePreset === key ? "#6ee7b7" : "rgba(255,255,255,0.05)",
                color: activePreset === key ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.55)",
                border: "1px solid " + (activePreset === key ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
                transition: "all .15s",
              }}>
              {PRESETS[key].icon} {PRESETS[key].label}
            </button>
          ))}
        </div>
        {activePreset !== "custom" && PRESETS[activePreset].bt && (() => {
          const bt = PRESETS[activePreset].bt;
          const pr = PRESETS[activePreset];
          return (
            <div style={{ marginTop: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(110,231,183,0.15)", borderRadius: 8, padding: "9px 10px", fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }}>
              <b style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{pr.label}</b>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginTop: 6 }}>
                {[
                  { l: "P&L total", v: (bt.pnl ? "+" + bt.pnl + "%" : bt.monthly ? "+" + bt.monthly + "%/m" : "-"), c: "#6ee7b7" },
                  { l: "DD max BT", v: bt.dd + "%", c: bt.dd > 5 ? "#fbbf24" : "#6ee7b7" },
                  { l: "PF", v: bt.pf, c: bt.pf >= 2 ? "#6ee7b7" : "#fbbf24" },
                  { l: "WR", v: (bt.wr || "-") + "%", c: "#FFFFFF" },
                  { l: "Streak max", v: bt.maxConsec, c: bt.maxConsec >= 7 ? "#fbbf24" : "#6ee7b7" },
                  { l: "Sharpe", v: bt.sharpe || "-", c: "rgba(255,255,255,0.55)" },
                ].map(s => (
                  <div key={s.l} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "4px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>{s.l}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>
              {(bt.pireJour || bt.violations || bt.phase1) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 4 }}>
                  {bt.pireJour && <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "4px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>Pire jour</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444" }}>${bt.pireJour}</div>
                  </div>}
                  {bt.pireSemaine && <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "4px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>Pire semaine</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444" }}>${bt.pireSemaine}</div>
                  </div>}
                  {bt.phase1 && <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "4px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>Phase 1 BT</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7" }}>{bt.phase1}</div>
                  </div>}
                  {bt.phase2 && <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "4px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>Phase 2 BT</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7" }}>{bt.phase2}</div>
                  </div>}
                </div>
              )}
              {bt.violations && (
                <div style={{ marginTop: 4, fontSize: 11, color: "#6ee7b7", background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "3px 6px" }}>
                  {bt.violations}
                </div>
              )}
              {bt.newsFilter && (
                <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  {bt.newsFilter}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* PROP FIRM */}
      <div className="card" style={{ borderLeft: "2px solid rgba(110,231,183,0.25)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.50)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.2 }}>Prop Firm</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {Object.keys(PROP_FIRMS).map(k => (
            <button key={k}
              onClick={() => { setFirmKey(k); const fm = PROP_FIRMS[k].models; if (!fm[modelKey]) setModelKey(Object.keys(fm)[0]); }}
              style={{
                padding: "7px 11px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700,
                background: firmKey === k ? "#6ee7b7" : "rgba(255,255,255,0.07)",
                color: firmKey === k ? "#000000" : "rgba(255,255,255,0.55)",
                border: "1px solid " + (firmKey === k ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
                transition: "all .15s",
              }}>
              {PROP_FIRMS[k].name}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
          {firm.note}
        </div>
      </div>

      {/* MODELE */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.50)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.2 }}>
          Modele {firm.name}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.keys(firmModels).map(k => (
            <button key={k} className={"model-btn " + (safeModelKey === k ? "on" : "off")} onClick={() => setModelKey(k)}
              style={{ flex: "1 1 auto", minWidth: 80,
                background: safeModelKey === k ? "#6ee7b7" : "rgba(255,255,255,0.07)",
                color: safeModelKey === k ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.35)",
                borderColor: safeModelKey === k ? "#6ee7b7" : "rgba(255,255,255,0.08)" }}>
              {firmModels[k].name.replace(firm.name + " ", "").replace("Stellar ", "")}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
          {model.phases.map(ph => ph.label + " " + (ph.target * 100) + "%").join(" / ")}
          {" - DD jour " + (model.dailyDD * 100) + "% - DD total " + (model.totalDD * 100) + "% (" + (model.ddType === "trailing" ? "trailing" : "fixe") + ")"}
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          Split {model.splitStart}% - {model.splitMax}% | Payout {model.payoutCycle}j | Min {model.phases[0].minDays}j/phase | Frais ~{fmt(fee)}
        </div>
        {model.eaForbidden && (
          <div style={{ marginTop: 8, background: "#2d0808", border: "1px solid #ef444440", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: "#fca5a5", lineHeight: 1.5 }}>
            EA INTERDIT sur ce modele. Trading manuel uniquement.
          </div>
        )}
        {model.newsForbidden && (
          <div style={{ marginTop: 8, background: "#2d1f08", border: "1px solid #6ee7b740", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: "#fbbf24", lineHeight: 1.5 }}>
            NEWS TRADING & HFT INTERDITS sur cette firm. Active "Impact news" pour simuler.
          </div>
        )}
      </div>

      {/* STATUT */}
      {gs && (
        <div style={{ background: gs.bg, border: "1px solid " + gs.color + "30", borderRadius: 10, padding: "12px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: gs.color }}>{gs.label}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
              {bilan ? "Resultat net : " + fmt2(bilan.net) : "Resultat challenge"}
            </div>
          </div>
          <div style={{ fontSize: 26 }}>{dot(gs.emoji)}</div>
        </div>
      )}

      {/* CARTE DRAWDOWN ESTIME */}
      {dda && (
        <div className="card" style={{ borderLeft: "3px solid " + (dda.simMaxDD < model.totalDD * 50 ? "#6ee7b7" : dda.simMaxDD < model.totalDD * 75 ? "#fbbf24" : "#ef4444") }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
            Analyse Drawdown - Ta config
          </div>

          {/* Jauge DD */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.35)" }}>DD atteint cette simulation</span>
              <span style={{ fontWeight: 700, color: dda.simMaxDD < model.totalDD * 100 * 0.5 ? "#6ee7b7" : dda.simMaxDD < model.totalDD * 100 * 0.75 ? "#fbbf24" : "#ef4444" }}>
                {dda.simMaxDD.toFixed(2)}% ({fmt2(dda.simMaxDDAmount)})
              </span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, height: 18, overflow: "hidden", position: "relative" }}>
              {/* Zone verte 0-50% de la limite */}
              <div style={{ position: "absolute", left: 0, top: 0, width: "50%", height: "100%", background: "#06231820", borderRight: "1px dashed #6ee7b730" }} />
              {/* Zone orange 50-80% */}
              <div style={{ position: "absolute", left: "50%", top: 0, width: "30%", height: "100%", background: "#2d1f0820", borderRight: "1px dashed #fbbf2430" }} />
              {/* Zone rouge 80-100% */}
              <div style={{ position: "absolute", left: "80%", top: 0, width: "20%", height: "100%", background: "#2d080820" }} />
              {/* Barre DD actuel */}
              <div style={{
                position: "absolute", left: 0, top: 0, height: "100%",
                width: Math.min(100, (dda.simMaxDD / (model.totalDD * 100)) * 100) + "%",
                background: dda.simMaxDD < model.totalDD * 100 * 0.5 ? "#6ee7b7" : dda.simMaxDD < model.totalDD * 100 * 0.75 ? "#fbbf24" : "#ef4444",
                borderRadius: 8, transition: "width 0.5s"
              }} />
              {/* Label limite */}
              <div style={{ position: "absolute", right: 4, top: 1, fontSize: 11, color: "#ef4444", fontWeight: 700 }}>
                {(model.totalDD * 100)}% = LIMITE
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
              <span>0%</span>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>Zone safe</span>
              <span style={{ color: "#fbbf24" }}>Attention</span>
              <span style={{ color: "#ef4444" }}>Danger</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="kpi">
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Perte max 1 jour</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24" }}>{dda.maxDayLossPct.toFixed(2)}%</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{fmt2(dda.maxDayLoss)}</div>
            </div>
            <div className="kpi">
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Jours full-perte DD total</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>{dda.daysToTotalDD}j</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>avant limite {(model.totalDD*100)}%</div>
            </div>
            <div className="kpi">
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>DD journalier franchissable</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: dda.canBreachDaily ? "#ef4444" : "#6ee7b7" }}>
                {dda.canBreachDaily ? "OUI - RISQUE" : "NON - SAFE"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                {dda.canBreachDaily
                  ? "perte max " + dda.maxDayLossPct.toFixed(2) + "% > " + (model.dailyDD*100) + "%"
                  : "perte max " + dda.maxDayLossPct.toFixed(2) + "% < " + (model.dailyDD*100) + "%"}
              </div>
            </div>
            <div className="kpi">
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Marge restante</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: dda.distancePct > 5 ? "#6ee7b7" : "#ef4444" }}>
                {dda.distancePct > 0 ? dda.distancePct.toFixed(2) + "%" : "DEPASSE"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{dda.distancePct > 0 ? fmt2(dda.distanceAmt) + " restants" : "compte ferme"}</div>
            </div>
          </div>

          <div style={{ marginTop: 10, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", fontSize: 11, lineHeight: 1.5 }}>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>Lecture : </span>
            {dda.canBreachDaily
              ? <span style={{ color: "#ef4444" }}>Attention - avec {tradesPerDay} trades a {riskPct}% tu peux declencher le DD journalier en 1 seule journee. Reduis le risque/trade ou le nombre de trades.</span>
              : <span style={{ color: "#6ee7b7" }}>Securise - le DD journalier {(model.dailyDD*100)}% est inatteignable en 1 jour avec ta config ({dda.maxDayLossPct.toFixed(2)}% max). Seule une accumulation sur {dda.daysToTotalDD}+ jours perdants peut te sortir.</span>
            }
          </div>
        </div>
      )}
      <div className="card" style={{ borderLeft: "3px solid " + wrColor }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: wrColor, textTransform: "uppercase", letterSpacing: 1 }}>Winrate global</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: wrColor }}>{winrate}%</span>
        </div>
        <input type="range" min={30} max={90} step={1} value={winrate} onChange={e => setWinrate(parseInt(e.target.value))} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
          <span>30%</span><span>60%</span><span>90%</span>
        </div>
        <div style={{ marginTop: 8, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: finalRRValid ? "#6ee7b7" : "#ef4444" }}>
          {finalRRValid
            ? <>RR necessaire : <b>1:{finalRR.toFixed(2)}</b> (gain {fmt2(effectiveRiskAmount * finalRR)} / perte {fmt2(effectiveRiskAmount)})</>
            : <>RR impossible ou &gt; 20 - winrate trop bas pour cet objectif.</>}
        </div>
      </div>

      {/* JAUGE CLUSTERING + MAX PERTES CONSECUTIVES */}
      <div className="card" style={{ borderLeft: "3px solid " + clColor }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: clColor, textTransform: "uppercase", letterSpacing: 1 }}>Clustering des pertes</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: clColor }}>{clusteringPct}%</span>
        </div>
        <input type="range" min={0} max={100} step={5} value={clusteringPct} onChange={e => setClusteringPct(parseInt(e.target.value))} />
        <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
          0% = trades independants (theorique). Plus c'est haut, plus les pertes arrivent en
          <b style={{ color: clColor }}> series noires</b>. Recommande : 35-50%.
        </div>

        <div style={{ marginTop: 12, borderTop: "1px solid #1e1e2e", paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.50)", textTransform: "uppercase", letterSpacing: 1 }}>
              Max pertes consecutives EA
            </span>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#6ee7b7" }}>{maxConsecLosses}</span>
          </div>
          <input type="range" min={1} max={20} step={1} value={maxConsecLosses} onChange={e => setMaxConsecLosses(parseInt(e.target.value))} style={{ accentColor: "#6ee7b7" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
            <span>1</span><span>5</span><span>10</span><span>20</span>
          </div>
          <div style={{ marginTop: 8, background: "rgba(255,255,255,0.05)", border: "1px solid #6ee7b730", borderRadius: 8, padding: "8px 10px", fontSize: 11, lineHeight: 1.6 }}>
            <div style={{ color: "#6ee7b7", fontWeight: 700, marginBottom: 4 }}>Avec ton EA (max {maxConsecLosses} pertes)</div>
            <div style={{ color: "#FFFFFF" }}>
              Perte max en serie : <b style={{ color: "#fbbf24" }}>{(maxConsecLosses * effectiveRiskPct).toFixed(2)}%</b>
              {" = "}<b style={{ color: "#fbbf24" }}>{(maxConsecLosses * effectiveRiskAmount).toFixed(0)}$</b>
            </div>
            <div style={{ color: "#FFFFFF" }}>
              Series pour atteindre DD 10% : <b style={{ color: "#ef4444" }}>
                {Math.ceil(capital * model.totalDD / (maxConsecLosses * effectiveRiskAmount)).toFixed(0)} series perdantes
              </b> sans aucun gain
            </div>
            <div style={{ color: "#6ee7b7", fontSize: 10, marginTop: 4 }}>
              {(maxConsecLosses * effectiveRiskPct) < model.dailyDD * 100
                ? "DD journalier " + (model.dailyDD * 100) + "% INATTEIGNABLE en 1 jour avec cette config"
                : "Attention : serie max " + (maxConsecLosses * riskPct).toFixed(2) + "% > DD jour " + (model.dailyDD * 100) + "%"}
            </div>
          </div>
        </div>
      </div>

      {/* CARTE LOT / INSTRUMENT */}
      <div className="card" style={{ borderLeft: "3px solid #6ee7b7" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.50)", textTransform: "uppercase", letterSpacing: 1 }}>Lot & Instrument</span>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Activer</span>
            <div onClick={() => setUseFixedLot(v => !v)} style={{
              width: 36, height: 20, borderRadius: 10, background: useFixedLot ? "#6ee7b7" : "rgba(255,255,255,0.12)",
              border: "1px solid " + (useFixedLot ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
              position: "relative", cursor: "pointer", transition: "all .2s"
            }}>
              <div style={{ position: "absolute", top: 2, left: useFixedLot ? 18 : 2, width: 14, height: 14, borderRadius: 7, background: "#fff", transition: "all .2s" }} />
            </div>
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
          {/* Instrument */}
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 3, fontWeight: 700 }}>Instrument</div>
            <select value={instrument} onChange={e => setInstrument(e.target.value)}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1e1e2e", borderRadius: 6, color: "#FFFFFF", padding: "5px 4px", width: "100%", fontSize: 12 }}>
              {["XAUUSD","EURUSD","GBPUSD","USDJPY","GBPJPY","NAS100","US30","SP500"].map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          {/* Lot */}
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 3, fontWeight: 700 }}>Lot size</div>
            <input type="number" value={lotSize} min={0.01} max={10} step={0.01}
              onChange={e => setLotSize(parseFloat(e.target.value) || 0.01)}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1e1e2e", borderRadius: 6, color: "#FFFFFF", padding: "5px 6px", width: "100%", fontSize: 13 }} />
          </div>
          {/* SL pips */}
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 3, fontWeight: 700 }}>SL (pips)</div>
            <input type="number" value={slPips} min={1} max={5000} step={1}
              onChange={e => setSlPips(parseInt(e.target.value) || 1)}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1e1e2e", borderRadius: 6, color: "#FFFFFF", padding: "5px 6px", width: "100%", fontSize: 13 }} />
          </div>
        </div>

        {/* Résultat calculé */}
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 10, marginBottom: useFixedLot ? 10 : 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Risque/trade</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#6ee7b7" }}>{fmt2(lotRiskAmount)}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>% du capital</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: lotRiskPct > 1 ? "#ef4444" : lotRiskPct > 0.5 ? "#fbbf24" : "#6ee7b7" }}>
                {lotRiskPct.toFixed(2)}%
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Perte max/jour</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>{fmt2(lotRiskAmount * tradesPerDay)}</div>
            </div>
          </div>
        </div>

        {/* Diagnostic de compatibilité FundedNext */}
        {lotDiagJSX}

        {/* TOGGLE IMPACT ANNONCES NEWS */}
        <div style={{ marginTop: 10, borderTop: "1px solid #1e1e2e", paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: newsImpact ? "#ef4444" : "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>
                Impact annonces news
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2, lineHeight: 1.4 }}>
                FundedNext: gains reduits a 40% si trade en fenetres news (+/-5min)
              </div>
            </div>
            <div onClick={() => setNewsImpact(v => !v)} style={{
              width: 36, height: 20, borderRadius: 10, background: newsImpact ? "#ef4444" : "rgba(255,255,255,0.08)",
              border: "1px solid " + (newsImpact ? "#ef4444" : "rgba(255,255,255,0.08)"),
              position: "relative", cursor: "pointer", transition: "all .2s", flexShrink: 0
            }}>
              <div style={{ position: "absolute", top: 2, left: newsImpact ? 18 : 2, width: 14, height: 14, borderRadius: 7, background: "#fff", transition: "all .2s" }} />
            </div>
          </div>
          {newsImpact && (
            <div style={{ marginTop: 6, background: "#2d0808", border: "1px solid #ef444430", borderRadius: 8, padding: "7px 10px", fontSize: 10, color: "#fca5a5", lineHeight: 1.5 }}>
              Simulation: ~15% des trades touches par une annonce.<br/>
              Split effectif reduit de {(splitRate * 100).toFixed(0)}% a {(effectiveSplitRate * 100).toFixed(1)}%
              {" "}(85% normal + 15% x 40% = {(effectiveSplitRate * 100).toFixed(1)}%).<br/>
              Pertes en news = 100% comptabilisees (deja inclus dans simulation).
            </div>
          )}
        </div>
      </div>

      {/* PARAMETRES */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Parametres Trading</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* Capital */}
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 3, fontWeight: 700 }}>Capital ($)</div>
            <input type="number" value={capital} min={6000} max={200000} step={1000} onChange={e => setCapital(parseFloat(e.target.value) || 0)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1e1e2e", borderRadius: 6, color: "#FFFFFF", padding: "5px 8px", width: "100%", fontSize: 13 }} />
            <input type="range" min={6000} max={200000} step={1000} value={capital} onChange={e => setCapital(parseFloat(e.target.value))} />
          </div>

          {/* Risque/trade - affichage différent si mode lot actif */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>Risque/trade (%)</span>
              {useFixedLot && <span style={{ fontSize: 11, background: "#6ee7b720", color: "#6ee7b7", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>LOT AUTO</span>}
            </div>
            <input
              type="number"
              value={useFixedLot ? +effectiveRiskPct.toFixed(2) : riskPct}
              min={0.05} max={5} step={0.05}
              readOnly={useFixedLot}
              onChange={e => !useFixedLot && setRiskPct(parseFloat(e.target.value) || 0)}
              style={{
                background: useFixedLot ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.05)",
                border: "1px solid " + (useFixedLot ? "#6ee7b780" : "rgba(255,255,255,0.08)"),
                borderRadius: 6,
                color: useFixedLot ? "#6ee7b7" : "#FFFFFF",
                padding: "5px 8px", width: "100%", fontSize: 13,
                cursor: useFixedLot ? "not-allowed" : "text",
                fontWeight: useFixedLot ? 800 : 400,
              }} />
            {useFixedLot
              ? <div style={{ fontSize: 11, color: "#6ee7b7", marginTop: 3, lineHeight: 1.4 }}>
                  Lot {lotSize} × {slPips} pips × ${pipVal}/pip = <b>{fmt2(effectiveRiskAmount)}</b>
                </div>
              : <input type="range" min={0.05} max={2} step={0.05} value={riskPct} onChange={e => setRiskPct(parseFloat(e.target.value))} />
            }
          </div>

          {[
            { label: "Trades/jour", val: tradesPerDay, set: setTradesPerDay, min: 0.1, max: 15, step: 0.05 },
            { label: "Objectif/jour (%)", val: dailyTargetPct, set: setDailyTargetPct, min: 0.05, max: 1.5, step: 0.05 },
            { label: "Split (%)", val: split, set: setSplit, min: 80, max: 95, step: 5 },
            { label: "Mois Funded", val: fundedMonths, set: setFundedMonths, min: 1, max: 60, step: 1 },
          ].map((f) => (
            <div key={f.label}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 3, fontWeight: 700 }}>{f.label}</div>
              <input type="number" value={f.val} min={f.min} max={f.max} step={f.step} onChange={e => f.set(parseFloat(e.target.value) || 0)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1e1e2e", borderRadius: 6, color: "#FFFFFF", padding: "5px 8px", width: "100%", fontSize: 13 }} />
              <input type="range" min={f.min} max={f.max} step={f.step} value={f.val} onChange={e => f.set(parseFloat(e.target.value))} />
            </div>
          ))}
        </div>

        {/* Résumé paramètres */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <div style={{ background: useFixedLot ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: useFixedLot ? "#6ee7b7" : "#fbbf24", border: useFixedLot ? "1px solid #6ee7b730" : "none" }}>
            Risque : <b>{fmt2(effectiveRiskAmount)}</b>/trade = <b>{effectiveRiskPct.toFixed(2)}%</b>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: "#6ee7b7" }}>
            Objectif : <b>{fmt2(capital * dailyTarget)}</b>/jour
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginLeft: 4 }}>
              (E espéré : {fmt2(Math.max(0, expectedDailyPnL))}/j)
            </span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: "rgba(255,255,255,0.55)", gridColumn: "1 / 3" }}>
            Profit equiv. : <b>{(monthlyTarget * 100).toFixed(1)}% / mois</b> - frais : <b>{fmt(fee)}</b> - RR : <b style={{ color: finalRR < 1.5 ? "#6ee7b7" : finalRR < 2.5 ? "#fbbf24" : "#ef4444" }}>1:{finalRR.toFixed(2)}</b>
          </div>
        </div>
        <button onClick={() => setSeed(s => s + 1)}
          style={{ marginTop: 10, width: "100%", padding: 9, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, color: "#FFFFFF", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Nouvelle simulation
        </button>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={copyReport}
            style={{ flex: 1, padding: 9, background: copied ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.07)", border: copied ? "1px solid #6ee7b7" : "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: copied ? "#6ee7b7" : "#FFFFFF", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {copied ? "✓ Copié !" : "Copier le rapport"}
          </button>
          <button onClick={printReport}
            style={{ flex: 1, padding: 9, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#FFFFFF", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Imprimer / PDF
          </button>
        </div>
      </div>

      {/* BILAN FINANCIER NET */}
      {bilan && (
        <div className="card" style={{ borderLeft: "2px solid rgba(110,231,183,0.3)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.40)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Bilan Financier Net</div>
          {[
            { label: "Reward challenge (15%)", val: "+" + fmt2(bilan.reward), color: "#6ee7b7" },
            { label: "Payouts funded verses", val: "+" + fmt2(bilan.payout), color: "#6ee7b7" },
            { label: "En attente (non verse)", val: "+" + fmt2(bilan.pending), color: "rgba(255,255,255,0.55)" },
            { label: "Frais d'achat challenge", val: "-" + fmt2(bilan.fee), color: "#ef4444" },
          ].map(k => (
            <div key={k.label} className="row">
              <span style={{ color: "rgba(255,255,255,0.35)" }}>{k.label}</span>
              <span style={{ color: k.color, fontWeight: 700 }}>{k.val}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 4, borderTop: "1px solid #2d2d3d" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>RESULTAT NET</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: bilan.net >= 0 ? "#6ee7b7" : "#ef4444" }}>{fmt2(bilan.net)}</span>
          </div>
        </div>
      )}

      {/* REGLES */}
      <div className="card" style={{ borderLeft: "3px solid #6ee7b7" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Regles {model.name}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {[
            ...model.phases.map(ph => [ph.label + " objectif", "+" + (ph.target * 100) + "%"]),
            ["DD Journalier", (model.dailyDD * 100) + "% (intraday)"],
            ["DD Total", (model.totalDD * 100) + "% max"],
            ["Limite de temps", "Aucune"],
            ["Min jours/phase", model.phases[0].minDays + " jours"],
            ["Reward challenge", (model.challengeReward * 100) + "%"],
            ["1er payout", "apres " + model.firstPayoutDays + "j"],
            ["Split Funded", "80-90%"],
            ["EA/Algo", "Autorise"],
          ].map((kv) => (
            <div key={kv[0]} className="row">
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{kv[0]}</span>
              <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 11 }}>{kv[1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bouton sauvegarder la config */}
      <button onClick={saveCurrentConfig} style={{
        width: "100%", padding: "13px", borderRadius: 12, border: "1px dashed rgba(110,231,183,0.35)",
        cursor: "pointer", background: "rgba(255,255,255,0.04)", color: "#6ee7b7", fontSize: 13, fontWeight: 700,
        marginBottom: 12,
      }}>
        ★ {t("sim_save_config")}
      </button>
      </>)}

      {!finalRRValid && (
        <div className="card" style={{ textAlign: "center", padding: 24, color: "#ef4444", fontWeight: 700, fontSize: 13 }}>
          Combinaison impossible : winrate trop bas pour cet objectif.<br />
          <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400, fontSize: 12 }}>Monte le winrate ou baisse l'objectif/jour.</span>
        </div>
      )}

      {/* TAB CHALLENGE */}
      {tab === "challenge" && sim && (
        <div>
          {model.phases.map((ph, i) => {
            const data = sim.phaseResults[i];
            const color = i === 0 ? "#6ee7b7" : "rgba(255,255,255,0.55)";
            return (
              <div className="card" key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{ph.label} - Objectif +{(ph.target * 100)}%</div>
                  {data ? (
                    <span className="tag" style={{ background: phaseIcon(data.status).bg, color: phaseIcon(data.status).color }}>
                      {phaseIcon(data.status).icon} {phaseIcon(data.status).label}
                    </span>
                  ) : (
                    <span className="tag" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)", border: "1px solid #1e1e2e" }}>VERROUILLE</span>
                  )}
                </div>
                {data ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                      <div className="kpi">
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Jours</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color }}>{data.tradingDays}</div>
                      </div>
                      <div className="kpi">
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Profit</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: data.profit >= ph.target ? "#6ee7b7" : data.profit >= 0 ? "#fbbf24" : "#ef4444" }}>
                          {fmtPn(data.profit)}
                        </div>
                      </div>
                      <div className="kpi">
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>WR trades</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>{data.tradeWinrate.toFixed(0)}%</div>
                      </div>
                      <div className="kpi">
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Equity</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>{fmt(data.finalEquity)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>
                      {data.totalWins} gagnants / {data.totalLosses} perdants - WR jours {data.dayWinrate.toFixed(0)}%
                    </div>
                    {failReason(data.status) && (
                      <div style={{ background: data.status === "running_ok" ? "#2d1f08" : "#2d0808", border: "1px solid " + (data.status === "running_ok" ? "#fbbf2440" : "#ef444440"), borderRadius: 8, padding: 10, fontSize: 12, color: data.status === "running_ok" ? "#fbbf24" : "#fca5a5", marginBottom: 10 }}>
                        {failReason(data.status)}
                      </div>
                    )}
                    <ResponsiveContainer width="100%" height={150}>
                      <AreaChart data={data.days}>
                        <defs>
                          <linearGradient id={"gp" + i} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a28" />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "J" + v} />
                        <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "$" + (v / 1000).toFixed(1) + "k"} domain={["auto", "auto"]} />
                        <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 11 }} />
                        <ReferenceLine y={capital * (1 + ph.target)} stroke={color} strokeDasharray="4 2" />
                        <ReferenceLine y={capital * (1 - model.totalDD)} stroke="#ef4444" strokeDasharray="4 2" />
                        <Area type="monotone" dataKey="equity" stroke={color} strokeWidth={2} fill={"url(#gp" + i + ")"} dot={false} name="Equity" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
                    Passe la phase precedente pour debloquer
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB FUNDED */}
      {tab === "funded" && sim && (
        sim.funded ? (
          <>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Compte Funded - {fundedMonths} mois</div>
                <span className="tag" style={{ background: sim.funded.status === "active" ? "rgba(255,255,255,0.05)" : "#2d0808", color: sim.funded.status === "active" ? "#6ee7b7" : "#ef4444" }}>
                  {sim.funded.status === "active" ? "ACTIF" : "FERME"}
                </span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #6ee7b730", borderRadius: 8, padding: 8, marginBottom: 12, fontSize: 11, color: "#6ee7b7" }}>
                Capital funded = {fmt(capital)} (remis a l'initial) - Seuil retrait : $50 - Payout bi-weekly (14j)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Capital final", val: fmt(sim.funded.finalEquity), color: "#6ee7b7" },
                  { label: "Payout verse", val: fmt(sim.funded.cumulPayout), color: "#6ee7b7" },
                  { label: "En attente", val: fmt2(sim.funded.pendingPayout), color: "rgba(255,255,255,0.55)" },
                  { label: "WR mensuel", val: sim.funded.winrateMonth.toFixed(0) + "%", color: sim.funded.winrateMonth >= 60 ? "#6ee7b7" : "#fbbf24" },
                  { label: "Scaling", val: sim.funded.scalingCount + "x (+40%)", color: "rgba(255,255,255,0.55)" },
                  { label: "Split final", val: sim.funded.finalSplit + "%", color: sim.funded.finalSplit >= 90 ? "#6ee7b7" : "#fbbf24" },
                ].map((k) => (
                  <div key={k.label} className="kpi">
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{k.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: k.color, marginTop: 2 }}>{k.val}</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={sim.funded.data}>
                  <defs>
                    <linearGradient id="gfunded" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a28" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "M" + v} />
                  <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} domain={["auto", "auto"]} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 11 }} />
                  <ReferenceLine y={capital} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="equity" stroke="#6ee7b7" strokeWidth={2} fill="url(#gfunded)" dot={false} name="Equity" />
                  <Line type="monotone" dataKey="cumul" stroke="#6ee7b7" strokeWidth={2} dot={false} name="Payout Cumule" strokeDasharray="5 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* CALENDRIER PnL */}
            <CalendrierPnL dailyLog={sim.funded.dailyLog} />

            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#fbbf24" }}>Detail Mensuel</div>
              <div style={{ overflowY: "auto", maxHeight: 300 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
                      {["Mois", "Equity", "Profit%", "Payout", "Split", "Streak", "Statut"].map(h => (
                        <th key={h} style={{ padding: "5px 4px", color: "rgba(255,255,255,0.35)", textAlign: "right", fontWeight: 700, fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sim.funded.data.map(r => (
                      <tr key={r.month} style={{ borderBottom: "1px solid #0f0f18", background: r.scalingNote ? "rgba(255,255,255,0.05)" : "transparent" }}>
                        <td style={{ padding: "5px 4px", color: "rgba(255,255,255,0.55)", textAlign: "right" }}>M{r.month}</td>
                        <td style={{ padding: "5px 4px", color: "#FFFFFF", textAlign: "right" }}>{fmt(r.equity)}</td>
                        <td style={{ padding: "5px 4px", textAlign: "right", color: r.profitPct >= 0 ? "#6ee7b7" : "#ef4444" }}>
                          {(r.profitPct >= 0 ? "+" : "") + r.profitPct.toFixed(2)}%
                        </td>
                        <td style={{ padding: "5px 4px", textAlign: "right", fontWeight: r.payout > 0 ? 700 : 400, color: r.payout > 0 ? "#fbbf24" : "rgba(255,255,255,0.3)" }}>
                          {r.payout > 0 ? fmt(r.payout) : "-"}
                        </td>
                        <td style={{ padding: "5px 4px", textAlign: "right", color: r.currentSplit >= 90 ? "#6ee7b7" : "rgba(255,255,255,0.55)" }}>
                          {r.currentSplit}%
                        </td>
                        <td style={{ padding: "5px 4px", textAlign: "right", color: r.streakMonths >= 4 ? "#6ee7b7" : r.streakMonths >= 2 ? "#fbbf24" : "rgba(255,255,255,0.35)" }}>
                          {r.streakMonths}/4{r.scalingNote ? " \u{1F4C8}" : ""}
                        </td>
                        <td style={{ padding: "5px 4px", textAlign: "right", fontSize: 12, fontWeight: 700, color: r.status === "active" ? "#6ee7b7" : "#ef4444" }}>
                          {r.status === "active" ? "\u2713" : "\u2717"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: 30 }}>
            <div style={{ color: "#ef4444", fontWeight: 700 }}>Challenge non passe</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 8 }}>Monte le winrate ou reduis le clustering</div>
          </div>
        )
      )}

      {/* TAB MONTE CARLO */}
      {tab === "montecarlo" && finalRRValid && (
        <div>
          {/* Résumé stats compact */}
          <div style={{ background: "linear-gradient(135deg, rgba(110,231,183,0.10), rgba(12,8,2,0.95))", border: "1px solid rgba(110,231,183,0.20)", borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>{firm.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{model.name} · {fmt(capital)}</div>
              </div>
              {activePreset !== "custom" && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#6ee7b7", background: "rgba(255,255,255,0.08)", padding: "3px 10px", borderRadius: 20 }}>
                  {PRESETS[activePreset]?.label}
                </span>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
              {[
                { l: "Winrate", v: winrate + "%", c: "#FFFFFF" },
                { l: "RR", v: finalRR.toFixed(2), c: "#6ee7b7" },
                { l: "Trades/j", v: tradesPerDay, c: "#FFFFFF" },
                { l: "Risque", v: effectiveRiskPct.toFixed(2) + "%", c: "#FFFFFF" },
              ].map(s => (
                <div key={s.l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: "8px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>{s.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <MonteCarloTab firmKey={firmKey} modelKey={safeModelKey} capital={capital} p={p} fundedMonths={fundedMonths}
            splitRate={splitRate} winrate={winrate} fee={fee} clusteringPct={clusteringPct} />
        </div>
      )}

      {/* TAB MES TRADES */}
      {tab === "trades" && (
        <MesTradesTab sim={sim} capital={capital} fundedMonths={fundedMonths} winrate={winrate} riskPct={riskPct} dailyTargetPct={dailyTargetPct} model={model} finalRR={finalRR} tradesPerDay={tradesPerDay} firm={firm} effectiveRiskAmount={effectiveRiskAmount} />
      )}

      <div style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.08)", marginTop: 12, paddingBottom: 8 }}>
        {firm.name} {model.name} - Simulation indicative - Pas une garantie
      </div>
    </div>
  );
}

function MonteCarloTab({ firmKey, modelKey, capital, p, fundedMonths, splitRate, winrate, fee, clusteringPct }) {
  const [res, setRes] = useState(null);
  const _firm = PROP_FIRMS[firmKey] || PROP_FIRMS.fundednext;
  const model = _firm.models[modelKey] || Object.values(_firm.models)[0];
  const RUNS = 200;
  useEffect(() => {
    const results = [];
    for (let r = 0; r < RUNS; r++) {
      const phases = model.phases.map(ph => simulatePhase(capital, ph, model, p));
      const passed = phases.every(ph => ph.status === "passed");
      if (!passed) { results.push({ passed: false, net: -fee }); continue; }
      const funded = simulateFunded(capital, fundedMonths, model, p, splitRate);
      const reward = phases.reduce((s, ph) => s + (ph.profit > 0 ? capital * ph.profit * model.challengeReward : 0), 0);
      const net = reward + funded.cumulPayout + funded.pendingPayout - fee;
      results.push({ passed: true, survived: funded.status === "active", net, maxDD: funded.maxDD });
    }
    const passed = results.filter(r => r.passed);
    const survived = results.filter(r => r.survived);
    const profitable = results.filter(r => r.net > 0);
    const nets = results.map(r => r.net).sort((a,b) => a-b);
    const pct = (i) => nets[Math.floor(i/100 * nets.length)];
    setRes({
      passRate: (passed.length/RUNS*100).toFixed(0),
      survRate: (survived.length/RUNS*100).toFixed(0),
      profRate: (profitable.length/RUNS*100).toFixed(0),
      p25: pct(25), p50: pct(50), p75: pct(75),
      min: nets[0], max: nets[nets.length-1],
      avgDD: (results.filter(r=>r.passed).reduce((s,r)=>s+(r.maxDD||0),0)/Math.max(1,passed.length)).toFixed(1),
    });
  }, [modelKey, capital, p.tradesPerDay, p.riskPct, p.rr, p.winrate, p.clustering, fundedMonths, splitRate, fee]);

  if (!res) return <div className="card" style={{ color: "rgba(255,255,255,0.35)", textAlign: "center" }}>Calcul Monte Carlo en cours... ({RUNS} simulations)</div>;
  const fmt = v => "$" + (v >= 0 ? "+" : "") + Math.abs(v).toFixed(0);
  const color = v => v >= 0 ? "#6ee7b7" : "#ef4444";
  const rate_color = v => v >= 70 ? "#6ee7b7" : v >= 50 ? "#fbbf24" : "#ef4444";
  return (
    <div>
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: "#FFFFFF" }}>Monte Carlo - {RUNS} simulations</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { l: "Challenge", v: res.passRate + "%", c: rate_color(+res.passRate) },
            { l: "Survie funded", v: res.survRate + "%", c: rate_color(+res.survRate) },
            { l: "Profitable", v: res.profRate + "%", c: rate_color(+res.profRate) },
          ].map(k => (
            <div key={k.l} className="kpi">
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{k.l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Distribution resultat net</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
            {[["Min", res.min], ["P25", res.p25], ["P50", res.p50], ["P75", res.p75], ["Max", res.max]].map(([l, v]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{l}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: color(v) }}>{fmt(v)}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>DD moyen sur runs passes : <b style={{ color: "#fbbf24" }}>{res.avgDD}%</b></div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Frais challenge : <b style={{ color: "#ef4444" }}>{fmt(-fee)}</b></div>
        </div>
      </div>
    </div>
  );
}

function MesTradesTab({ sim, capital, fundedMonths, winrate, riskPct, dailyTargetPct, model, finalRR, tradesPerDay, firm, effectiveRiskAmount }) {
  const loadTrades = () => {
    try { const r = localStorage.getItem("eapropfirm_trades"); return r ? JSON.parse(r) : { trades: [], filename: null }; } catch (e) { return { trades: [], filename: null }; }
  };
  const saved0 = loadTrades();
  const [trades, setTrades] = useState(saved0.trades || []);
  const [parseError, setParseError] = useState(null);
  const [filename, setFilename] = useState(saved0.filename || null);
  const [alerts, setAlerts] = useState(() => {
    const t0 = saved0.trades || [];
    if (!t0.length) return [];
    return []; // computeAlertsSync appelée après déclaration de la fonction
  });

  useEffect(() => {
    try { localStorage.setItem("eapropfirm_trades", JSON.stringify({ trades, filename })); } catch (e) {}
  }, [trades, filename]);

  // ── CSV parser ────────────────────────────────────────────────
  const parseCSV = (text) => {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (lines.length < 2) return { error: "Fichier vide ou invalide" };
    const header = lines[0].toLowerCase().replace(/"/g, '');
    const cols = header.split(/[,;\t]/);
    let profitIdx = -1, timeIdx = -1, typeIdx = -1, balanceIdx = -1, commIdx = -1, swapIdx = -1;
    let format = null;
    if (cols.some(c => c.includes('ticket')) && cols.some(c => c.includes('profit'))) {
      format = 'mt4'; timeIdx = cols.findIndex(c => c.includes('close time') || c.includes('time'));
      typeIdx = cols.findIndex(c => c.includes('type')); profitIdx = cols.findIndex(c => c.trim() === 'profit' || c.includes('profit'));
      commIdx = cols.findIndex(c => c.includes('commission') || c.includes('comm')); swapIdx = cols.findIndex(c => c.includes('swap')); balanceIdx = cols.findIndex(c => c.includes('balance'));
    } else if (cols.some(c => c.includes('position')) && cols.some(c => c.includes('profit'))) {
      format = 'mt5'; timeIdx = cols.findIndex(c => c.includes('time')); typeIdx = cols.findIndex(c => c.includes('type'));
      profitIdx = cols.findIndex(c => c.trim() === 'profit' || c.includes('profit'));
      commIdx = cols.findIndex(c => c.includes('commission') || c.includes('comm')); swapIdx = cols.findIndex(c => c.includes('swap')); balanceIdx = cols.findIndex(c => c.includes('balance'));
    } else if (cols.some(c => c.includes('date')) && cols.some(c => c.includes('profit'))) {
      format = 'simple'; timeIdx = cols.findIndex(c => c.includes('date') || c.includes('time')); profitIdx = cols.findIndex(c => c.includes('profit')); balanceIdx = cols.findIndex(c => c.includes('balance'));
    } else if (cols.length >= 2) {
      format = 'minimal'; timeIdx = 0; profitIdx = cols.findIndex(c => c.includes('profit') || c.includes('pnl') || c.includes('gain')); if (profitIdx === -1) profitIdx = 1; balanceIdx = cols.findIndex(c => c.includes('balance') || c.includes('equity'));
    }
    if (!format) return { error: "Format non reconnu. Attendu : export MT4/MT5 ou colonnes Date,Profit,Balance" };
    if (profitIdx === -1) return { error: "Colonne Profit introuvable" };
    const parsed = []; let runningBalance = capital; let initBalance = null;
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].replace(/"/g, '').split(/[,;\t]/); if (row.length < 2) continue;
      const profitRaw = parseFloat(row[profitIdx]); if (isNaN(profitRaw)) continue;
      const comm = commIdx >= 0 ? parseFloat(row[commIdx]) || 0 : 0; const swap = swapIdx >= 0 ? parseFloat(row[swapIdx]) || 0 : 0;
      const netProfit = profitRaw + comm + swap;
      let balance = balanceIdx >= 0 ? parseFloat(row[balanceIdx]) : NaN;
      if (isNaN(balance)) { runningBalance += netProfit; balance = runningBalance; }
      if (initBalance === null) initBalance = balance - netProfit;
      parsed.push({ idx: i, time: (timeIdx >= 0 ? row[timeIdx] : '').trim(), type: (typeIdx >= 0 ? row[typeIdx] : '').trim(), profit: netProfit, balance });
    }
    if (parsed.length === 0) return { error: "Aucun trade valide dans le fichier" };
    return { trades: parsed, format, initBalance: initBalance || capital };
  };

  // ── HTML parser (backtest MT4/MT5 .html) ─────────────────────
  const parseHTMLBacktest = (text) => {
    try {
      if (typeof DOMParser === 'undefined') return { error: "DOMParser non disponible (contexte non-navigateur)" };
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const tables = Array.from(doc.querySelectorAll('table'));
      if (!tables.length) return { error: "Aucune table trouvée dans le fichier HTML" };

      let tradeTable = null;
      let headerCells = [];
      for (const table of tables) {
        const rows = table.querySelectorAll('tr');
        if (rows.length < 3) continue;
        const cells = Array.from(rows[0].querySelectorAll('th, td')).map(el => el.textContent.toLowerCase().replace(/\s+/g,' ').trim());
        if ((cells.some(c => c.includes('profit')) && cells.some(c => c.includes('balance'))) ||
            (cells.some(c => c.includes('profit')) && cells.some(c => c.includes('type')))) {
          tradeTable = table; headerCells = cells; break;
        }
      }
      // Essayer la 2e table si la 1ère est un résumé
      if (!tradeTable) {
        for (const table of tables) {
          const cells = Array.from(table.querySelectorAll('th, td')).map(el => el.textContent.toLowerCase().trim());
          if (cells.some(c => c.includes('profit'))) { tradeTable = table; headerCells = Array.from(table.querySelectorAll('tr')[0]?.querySelectorAll('th, td') || []).map(el => el.textContent.toLowerCase().trim()); break; }
        }
      }
      if (!tradeTable) return { error: "Aucune table de trades trouvée dans le HTML MT4/MT5" };

      const pIdx = headerCells.findIndex(h => h === 'profit' || h.includes('profit'));
      const bIdx = headerCells.findIndex(h => h === 'balance' || h.includes('balance'));
      const tIdx = headerCells.findIndex(h => h.includes('time') || h.includes('date'));
      const tyIdx = headerCells.findIndex(h => h === 'type' || h.includes('type'));
      const cIdx = headerCells.findIndex(h => h.includes('commission') || h.includes('comm'));
      const sIdx = headerCells.findIndex(h => h.includes('swap'));
      if (pIdx === -1) return { error: "Colonne Profit introuvable dans le HTML" };

      const rows = Array.from(tradeTable.querySelectorAll('tr'));
      const parsed = []; let runningBalance = capital; let initBalance = null;
      for (let i = 1; i < rows.length; i++) {
        const cells = Array.from(rows[i].querySelectorAll('td, th')).map(el => el.textContent.replace(/\xA0/g,' ').trim());
        if (!cells[pIdx]) continue;
        const p = parseFloat(cells[pIdx].replace(/[\s,]/g, '').replace(',', '.')); if (isNaN(p)) continue;
        const comm = cIdx >= 0 ? parseFloat(cells[cIdx]?.replace(/[\s,]/g,'').replace(',','.')) || 0 : 0;
        const swap = sIdx >= 0 ? parseFloat(cells[sIdx]?.replace(/[\s,]/g,'').replace(',','.')) || 0 : 0;
        const net = p + comm + swap;
        let balance = bIdx >= 0 ? parseFloat(cells[bIdx]?.replace(/[\s,]/g,'').replace(',','.') || '') : NaN;
        if (isNaN(balance)) { runningBalance += net; balance = runningBalance; }
        if (initBalance === null) initBalance = balance - net;
        parsed.push({ idx: i, time: (tIdx >= 0 ? cells[tIdx] : ''), type: (tyIdx >= 0 ? cells[tyIdx] : ''), profit: net, balance });
      }
      if (parsed.length === 0) return { error: "Aucun trade parsé dans le HTML - vérifie le format MT4/MT5" };
      return { trades: parsed, format: 'html_backtest', initBalance: initBalance || capital };
    } catch (e) { return { error: "Erreur lecture HTML: " + e.message }; }
  };

  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setFilename(file.name); setParseError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const isHTML = file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm') || text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html');
      const result = isHTML ? parseHTMLBacktest(text) : parseCSV(text);
      if (result.error) { setParseError(result.error); setTrades([]); return; }
      const newTrades = result.trades;
      setTrades(newTrades);
      const iB = result.initBalance;
      setAlerts(computeAlertsSync(newTrades, iB));
    };
    reader.readAsText(file);
  };

  // ── Verdict challenge (mini MC sur stats réelles) ─────────────
  const computeVerdictSync = (trds, initBal) => {
    if (!trds.length || !model) return;
    const wins = trds.filter(t => t.profit > 0);
    const losses = trds.filter(t => t.profit < 0);
    const realWR = wins.length / trds.length;
    const avgW = wins.length > 0 ? wins.reduce((s, t) => s + t.profit, 0) / wins.length : 0;
    const avgL = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.profit, 0) / losses.length) : 1;
    const realRR = avgL > 0 ? avgW / avgL : 0;
    const realPF = avgL > 0 && losses.length > 0 ? (wins.reduce((s,t)=>s+t.profit,0)) / Math.abs(losses.reduce((s,t)=>s+t.profit,0)) : 0;

    // Calcul du DD max réel
    let peak = initBal, maxDD = 0;
    trds.forEach(t => { if (t.balance > peak) peak = t.balance; const dd = (peak - t.balance) / initBal * 100; if (dd > maxDD) maxDD = dd; });

    // Score de cohérence vs simulation
    const wrScore = Math.max(0, 1 - Math.abs(realWR * 100 - winrate) / Math.max(winrate, 1));
    const rrScore = finalRR > 0 ? Math.max(0, 1 - Math.min(Math.abs(realRR - finalRR) / Math.max(finalRR, 0.5), 1)) : 0.5;
    const ddScore = Math.max(0, 1 - maxDD / (model.totalDD * 100));
    const pfScore = realPF >= 1.8 ? 1 : realPF >= 1.3 ? 0.7 : realPF >= 1.0 ? 0.4 : 0.1;
    const matchScore = Math.round((wrScore * 0.3 + rrScore * 0.25 + ddScore * 0.25 + pfScore * 0.2) * 100);

    // Mini Monte Carlo avec stats réelles (200 runs)
    const riskAmt = effectiveRiskAmount > 0 ? effectiveRiskAmount : capital * 0.006;
    const dailyLim = capital * model.dailyDD;
    const floor = capital * (1 - model.totalDD);
    const target = capital * model.phases[0].target;
    const tpd = tradesPerDay > 0 ? tradesPerDay : 0.3;
    let pass = 0;
    for (let s = 0; s < 200; s++) {
      let eq = capital; let ok = true;
      for (let d = 0; d < 300; d++) {
        const n = tpd < 1 ? (Math.random() < tpd ? 1 : 0) : Math.round(tpd);
        let dayLoss = 0;
        for (let tr = 0; tr < n; tr++) {
          if (Math.random() < realWR) eq += riskAmt * realRR;
          else { eq -= riskAmt; dayLoss += riskAmt; }
          if (dayLoss >= dailyLim || eq <= floor) { ok = false; break; }
        }
        if (!ok) break;
        if (eq - capital >= target) { pass++; break; }
      }
    }
    const passPct = Math.round(pass / 200 * 100);

    // Facteurs clés
    const factors = [];
    if (maxDD > model.totalDD * 100 * 0.6) factors.push({ t: `DD max reel ${maxDD.toFixed(1)}% — proche limite ${model.totalDD*100}%`, c: "#ef4444" });
    else factors.push({ t: `DD max reel ${maxDD.toFixed(1)}% — marge OK`, c: "#6ee7b7" });
    if (realWR < 0.4) factors.push({ t: `Winrate ${(realWR*100).toFixed(0)}% — trop bas`, c: "#ef4444" });
    else factors.push({ t: `Winrate ${(realWR*100).toFixed(0)}% vs ${winrate}% attendu`, c: realWR*100 >= winrate-5 ? "#6ee7b7" : "#fbbf24" });
    if (realPF < 1.0) factors.push({ t: `Profit Factor ${realPF.toFixed(2)} — stratégie perdante`, c: "#ef4444" });
    else factors.push({ t: `Profit Factor ${realPF.toFixed(2)} — ${realPF >= 1.5 ? "excellent" : "acceptable"}`, c: realPF >= 1.5 ? "#6ee7b7" : "#fbbf24" });

    // Verdict global
    let label, color, bg, icon;
    if (passPct >= 70) { label = "VIABLE POUR LE CHALLENGE"; color = "#6ee7b7"; bg = "linear-gradient(135deg, #06231860, #111118)"; icon = "✅"; }
    else if (passPct >= 40) { label = "RISQUE ÉLEVÉ"; color = "#fbbf24"; bg = "linear-gradient(135deg, #2d1f0860, #111118)"; icon = "⚠️"; }
    else { label = "INCOMPATIBLE"; color = "#ef4444"; bg = "linear-gradient(135deg, #2d080860, #111118)"; icon = "🚫"; }

    return { passPct, matchScore, label, color, bg, icon, factors, realWR: (realWR*100).toFixed(0), realRR: realRR.toFixed(2), realPF: realPF.toFixed(2), maxDD: maxDD.toFixed(2) };
  };

  // ── Alertes ───────────────────────────────────────────────────
  const computeAlertsSync = (trds, initBal) => {
    const newAlerts = [];
    if (!trds.length) return;
    const totalPnl = trds.reduce((s, t) => s + t.profit, 0);
    const wins = trds.filter(t => t.profit > 0);
    const realWR = trds.length > 0 ? (wins.length / trds.length) * 100 : 0;
    const lastBalance = trds[trds.length - 1].balance;
    const ddPct = ((initBal - lastBalance) / initBal) * 100;
    const ddDayLimit = initBal * (model ? model.dailyDD : 0.05);
    const maxLoss = Math.min(...trds.map(t => t.profit));
    if (Math.abs(maxLoss) > ddDayLimit * 0.8) newAlerts.push({ level: "danger", msg: "Trade à " + Math.abs(maxLoss).toFixed(0) + "$ de perte - proche du DD journalier (" + ddDayLimit.toFixed(0) + "$)" });
    if (realWR < winrate - 10) newAlerts.push({ level: "warning", msg: "Winrate réel " + realWR.toFixed(0) + "% < simulation " + winrate + "% - performance en dessous des attentes" });
    if (ddPct > (model ? model.totalDD * 100 * 0.7 : 7)) newAlerts.push({ level: "danger", msg: "DD cumulé " + ddPct.toFixed(2) + "% - proche de la limite " + (model ? model.totalDD * 100 : 10) + "%" });
    else if (ddPct > (model ? model.totalDD * 100 * 0.4 : 4)) newAlerts.push({ level: "warning", msg: "DD cumulé " + ddPct.toFixed(2) + "% - surveillance requise" });
    const avgProfit = totalPnl / trds.length;
    const targetPerTrade = (capital * dailyTargetPct / 100) / 3;
    if (avgProfit < targetPerTrade * 0.5) newAlerts.push({ level: "info", msg: "Profit moyen/trade " + avgProfit.toFixed(0) + "$ < objectif " + targetPerTrade.toFixed(0) + "$ - revois le RR ou la config" });
    let maxConsec = 0, cur = 0;
    trds.forEach(t => { if (t.profit < 0) { cur++; if (cur > maxConsec) maxConsec = cur; } else cur = 0; });
    if (maxConsec > 6) newAlerts.push({ level: "warning", msg: "Série de " + maxConsec + " pertes consécutives détectée" });
    if (newAlerts.length === 0) newAlerts.push({ level: "ok", msg: "Aucune anomalie - performances cohérentes avec la simulation" });
    return newAlerts;
  };

  const stats = trades.length > 0 ? (() => {
    const wins = trades.filter(t => t.profit > 0); const losses = trades.filter(t => t.profit < 0);
    const totalPnl = trades.reduce((s, t) => s + t.profit, 0);
    const initBal = trades[0].balance - trades[0].profit;
    const finalBal = trades[trades.length - 1].balance;
    const wr = (wins.length / trades.length) * 100;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.profit, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.profit, 0) / losses.length) : 0;
    const rr = avgLoss > 0 ? avgWin / avgLoss : 0;
    const ddPct = ((initBal - Math.min(...trades.map(t => t.balance))) / initBal) * 100;
    const pf = avgLoss > 0 && losses.length > 0 ? (wins.reduce((s,t)=>s+t.profit,0)) / Math.abs(losses.reduce((s,t)=>s+t.profit,0)) : 0;
    return { wins: wins.length, losses: losses.length, total: trades.length, totalPnl, wr, avgWin, avgLoss, rr, ddPct, initBal, finalBal, pf };
  })() : null;

  const chartData = (() => {
    if (!trades.length || !sim || !sim.funded) return [];
    const simData = sim.funded.data; const step = Math.max(1, Math.floor(trades.length / Math.max(fundedMonths, 12)));
    const result = [];
    for (let i = 0; i < Math.min(trades.length, fundedMonths * step * 2); i += step) {
      const t = trades[Math.min(i, trades.length - 1)]; const simIdx = Math.min(Math.floor(i / step), simData.length - 1);
      result.push({ pt: i + 1, reel: +t.balance.toFixed(2), simulation: simIdx >= 0 ? simData[simIdx].equity : capital });
    }
    return result;
  })();

  const verdict = trades.length > 0 && stats ? computeVerdictSync(trades, trades[0].balance - trades[0].profit) : null;

  const alertColor = (l) => l === "danger" ? "#ef4444" : l === "warning" ? "#fbbf24" : l === "ok" ? "#6ee7b7" : "rgba(255,255,255,0.55)";
  const alertBg = (l) => l === "danger" ? "#2d0808" : l === "warning" ? "#2d1f08" : l === "ok" ? "rgba(255,255,255,0.05)" : "#0c1a3d";
  const alertIcon = (l) => l === "danger" ? "⚠️" : l === "warning" ? "🟡" : l === "ok" ? "✅" : "💡";

  return (
    <div>
      {/* ── UPLOAD : CSV + HTML ── */}
      <div className="card" style={{ borderLeft: "3px solid #6ee7b7" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
          Import historique
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>📊 CSV / Texte</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>MT4 : Historique → clic droit → CSV<br/>MT5 : Historique → Rapport → CSV</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", borderLeft: "2px solid #6ee7b720" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>🌐 Backtest HTML</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>MT4/MT5 : Testeur → Rapport → Ouvrir → Fichier HTML</div>
          </div>
        </div>
        <label style={{ display: "block", background: "rgba(255,255,255,0.04)", border: "2px dashed #2d2d3d", borderRadius: 10, padding: "16px", textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
          <div style={{ fontSize: 13, color: "#6ee7b7", fontWeight: 700 }}>
            {filename ? filename : "CSV, TXT, TSV, ou HTML"}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
            {trades.length > 0 ? trades.length + " trades chargés" : "Aucun fichier"}
          </div>
          <input type="file" accept=".csv,.txt,.tsv,.html,.htm" onChange={handleFile} style={{ display: "none" }} />
        </label>
        {parseError && <div style={{ marginTop: 8, background: "#2d0808", border: "1px solid #ef444440", borderRadius: 8, padding: 10, fontSize: 12, color: "#fca5a5" }}>{parseError}</div>}
        {trades.length > 0 && (
          <button onClick={() => { setTrades([]); setFilename(null); setAlerts([]); setVerdict(null); try { localStorage.removeItem("eapropfirm_trades"); } catch (e) {} }}
            style={{ marginTop: 8, width: "100%", padding: 8, background: "#2d0808", border: "1px solid #ef444440", borderRadius: 8, color: "#fca5a5", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            Effacer les données importées
          </button>
        )}
      </div>

      {trades.length > 0 && stats && verdict && (
        <>
          {/* ── 🎯 VERDICT CHALLENGE (pièce maîtresse) ── */}
          <div style={{ background: verdict.bg, border: "2px solid " + verdict.color + "50", borderRadius: 16, padding: 18, marginBottom: 12 }}>
            {/* Header verdict */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: -0.2, marginBottom: 4 }}>
                  Verdict Challenge · {firm?.name || ""}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: verdict.color, lineHeight: 1 }}>
                  {verdict.icon} {verdict.label}
                </div>
              </div>
              {/* Cercle probabilité */}
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ width: 68, height: 68, borderRadius: 34, background: verdict.color + "20", border: "3px solid " + verdict.color, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: verdict.color, lineHeight: 1 }}>{verdict.passPct}%</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>passer</div>
                </div>
              </div>
            </div>

            {/* Score de cohérence */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Cohérence avec ta simulation</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: verdict.matchScore >= 70 ? "#6ee7b7" : verdict.matchScore >= 50 ? "#fbbf24" : "#ef4444" }}>{verdict.matchScore}%</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4, transition: "width .6s",
                  width: verdict.matchScore + "%",
                  background: verdict.matchScore >= 70 ? "#6ee7b7" : verdict.matchScore >= 50 ? "#fbbf24" : "#ef4444"
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "rgba(255,255,255,0.08)", marginTop: 2 }}>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>0% — données incohérentes</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>100% — parfait alignement</span>
              </div>
            </div>

            {/* KPIs réels rapides */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
              {[
                { l: "WR réel", v: verdict.realWR + "%", expected: winrate + "%", ok: parseFloat(verdict.realWR) >= winrate - 5 },
                { l: "RR réel", v: "1:" + verdict.realRR, expected: "1:" + (finalRR || "-").toString().slice(0,4), ok: parseFloat(verdict.realRR) >= (finalRR || 0) * 0.85 },
                { l: "PF réel", v: verdict.realPF, expected: "≥ 1.5", ok: parseFloat(verdict.realPF) >= 1.5 },
                { l: "DD max", v: verdict.maxDD + "%", expected: "< " + (model ? model.totalDD * 100 : 10) + "%", ok: parseFloat(verdict.maxDD) < (model ? model.totalDD * 100 * 0.7 : 7) },
              ].map(k => (
                <div key={k.l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>{k.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: k.ok ? "#6ee7b7" : "#ef4444" }}>{k.v}</div>
                  <div style={{ fontSize: 7, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>sim: {k.expected}</div>
                </div>
              ))}
            </div>

            {/* Facteurs clés */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {verdict.factors.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "7px 10px", borderLeft: "3px solid " + f.c }}>
                  <span style={{ fontSize: 12 }}>{f.c === "#6ee7b7" ? "✓" : f.c === "#fbbf24" ? "⚡" : "✗"}</span>
                  <span style={{ fontSize: 11, color: "#FFFFFF" }}>{f.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── ALERTES ── */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Alertes & Diagnostics</div>
            {alerts.map((a, i) => (
              <div key={i} style={{ background: alertBg(a.level), border: "1px solid " + alertColor(a.level) + "30", borderRadius: 8, padding: "9px 12px", marginBottom: 8, fontSize: 12, color: alertColor(a.level), lineHeight: 1.5, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span>{alertIcon(a.level)}</span><span>{a.msg}</span>
              </div>
            ))}
          </div>

          {/* ── STATS COMPARATIVES ── */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Réel vs Simulation</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textAlign: "center", paddingBottom: 4 }}>Indicateur</div>
              <div style={{ fontSize: 10, color: "#6ee7b7", textAlign: "center", fontWeight: 700 }}>Réel</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textAlign: "center", fontWeight: 700 }}>Simulation</div>
            </div>
            {[
              { label: "Trades", real: stats.total, sim2: "-" },
              { label: "Winrate", real: stats.wr.toFixed(0) + "%", sim2: winrate + "%", ok: stats.wr >= winrate - 5 },
              { label: "Moy. gain", real: "$" + stats.avgWin.toFixed(0), sim2: "-" },
              { label: "Moy. perte", real: "$" + stats.avgLoss.toFixed(0), sim2: "$" + (capital * riskPct / 100).toFixed(0), ok: stats.avgLoss <= capital * riskPct / 100 * 1.2 },
              { label: "RR réel", real: "1:" + stats.rr.toFixed(2), sim2: finalRR ? "1:" + finalRR.toFixed(2) : "-", ok: stats.rr >= (finalRR || 0) * 0.85 },
              { label: "PF", real: stats.pf.toFixed(2), sim2: "-", ok: stats.pf >= 1.3 },
              { label: "P&L total", real: "$" + stats.totalPnl.toFixed(0), sim2: sim && sim.funded ? "$" + (sim.funded.cumulPayout).toFixed(0) : "-" },
              { label: "DD max", real: stats.ddPct.toFixed(2) + "%", sim2: (model ? model.totalDD * 100 : 10) + "% max", ok: stats.ddPct < (model ? model.totalDD * 100 * 0.7 : 7) },
            ].map(row => (
              <div key={row.label} className="row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{row.label}</span>
                <span style={{ textAlign: "center", fontWeight: 700, fontSize: 11, color: row.ok === false ? "#ef4444" : row.ok === true ? "#6ee7b7" : "#FFFFFF" }}>{row.real}</span>
                <span style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{row.sim2}</span>
              </div>
            ))}
          </div>

          {/* ── GRAPHIQUE EQUITY ── */}
          {chartData.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Courbe Equity — Réel vs Simulation</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>Vert = réel · Gris = simulation</div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="greel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.2} /><stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gsim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(255,255,255,0.55)" stopOpacity={0.1} /><stop offset="100%" stopColor="rgba(255,255,255,0.55)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a28" />
                  <XAxis dataKey="pt" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "#" + v} />
                  <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "$" + (v / 1000).toFixed(1) + "k"} domain={["auto", "auto"]} />
                  <Tooltip formatter={(v, name) => ["$" + Number(v).toFixed(0), name]} contentStyle={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 11 }} />
                  <ReferenceLine y={capital} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="simulation" stroke="rgba(255,255,255,0.3)" strokeWidth={1} fill="url(#gsim)" dot={false} name="Simulation" strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="reel" stroke="#6ee7b7" strokeWidth={2.5} fill="url(#greel)" dot={false} name="Réel" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CalendrierPnL({ dailyLog }) {
  const [selectedMonth, setSelectedMonth] = useState(1);

  if (!dailyLog || dailyLog.length === 0) return null;

  const months = [...new Set(dailyLog.map(d => d.month))];
  const monthDays = dailyLog.filter(d => d.month === selectedMonth);

  const monthPnl = monthDays.reduce((s, d) => s + d.pnl, 0);
  const winDays = monthDays.filter(d => d.pnl > 0).length;
  const lossDays = monthDays.filter(d => d.pnl < 0).length;
  const bestDay = monthDays.length ? Math.max(...monthDays.map(d => d.pnl)) : 0;
  const worstDay = monthDays.length ? Math.min(...monthDays.map(d => d.pnl)) : 0;

  const buildCalendarGrid = () => {
    const grid = [];
    let tradingIdx = 0;
    let dayNum = 1;
    while (tradingIdx < monthDays.length && dayNum <= 31) {
      const dow = (dayNum - 1) % 7; // 0-4 = semaine, 5-6 = weekend
      if (dow < 5 && tradingIdx < monthDays.length) {
        grid.push({ dayNum, trading: true, data: monthDays[tradingIdx] });
        tradingIdx++;
      } else {
        grid.push({ dayNum, trading: false, data: null });
      }
      dayNum++;
    }
    return grid;
  };
  const grid = buildCalendarGrid();

  const maxAbsPnl = monthDays.length ? Math.max(...monthDays.map(d => Math.abs(d.pnl)), 1) : 1;

  const cellColor = (pnl) => {
    if (pnl === undefined || pnl === null)
      return { bg: "#16161f", fg: "rgba(255,255,255,0.2)", border: "1px solid #1e1e2e", numColor: "rgba(255,255,255,0.2)" };

    const ratio = Math.min(1, Math.abs(pnl) / (maxAbsPnl * 0.7));
    const isBig = ratio >= 0.5;

    if (pnl > 0) {
      return isBig
        ? { bg: "#16a34a",  fg: "#ffffff",  border: "1px solid #15803d", numColor: "#bbf7d0" }   // vert vif - gros gain
        : { bg: "#052e16",  fg: "#4ade80",  border: "1px solid #14532d", numColor: "#86efac" };   // vert fonce - petit gain
    }
    if (pnl < 0) {
      return isBig
        ? { bg: "#dc2626",  fg: "#ffffff",  border: "1px solid #b91c1c", numColor: "#fecaca" }   // rouge vif - grosse perte
        : { bg: "#2d0808",  fg: "#f87171",  border: "1px solid #450a0a", numColor: "#fca5a5" };   // rouge fonce - petite perte
    }
    return { bg: "rgba(255,255,255,0.08)", fg: "rgba(255,255,255,0.55)", border: "1px solid #2d2d3d", numColor: "rgba(255,255,255,0.55)" };
  };

  return (
    <div className="card" style={{ padding: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#FFFFFF" }}>Calendrier PnL</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>Mois {selectedMonth} - simulation jour par jour</div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button onClick={() => setSelectedMonth(Math.max(1, selectedMonth - 1))}
            disabled={selectedMonth <= 1}
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid #2d2d3d", borderRadius: 8, color: selectedMonth <= 1 ? "rgba(255,255,255,0.2)" : "#6ee7b7", width: 32, height: 32, fontSize: 18, fontWeight: 700, cursor: "pointer", lineHeight: 1 }}>
            ‹
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7", minWidth: 60, textAlign: "center" }}>
            M{selectedMonth}/{months.length}
          </span>
          <button onClick={() => setSelectedMonth(Math.min(months.length, selectedMonth + 1))}
            disabled={selectedMonth >= months.length}
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid #2d2d3d", borderRadius: 8, color: selectedMonth >= months.length ? "rgba(255,255,255,0.2)" : "#6ee7b7", width: 32, height: 32, fontSize: 18, fontWeight: 700, cursor: "pointer", lineHeight: 1 }}>
            ›
          </button>
        </div>
      </div>

      {/* Stats resume */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14 }}>
        {[
          { label: "P&L mois", val: (monthPnl >= 0 ? "+" : "") + "$" + Math.abs(monthPnl).toFixed(0), color: monthPnl >= 0 ? "#4ade80" : "#f87171" },
          { label: "Jours +/-", val: winDays + "j / " + lossDays + "j", color: "#FFFFFF" },
          { label: "Meilleur", val: "+$" + bestDay.toFixed(0), color: "#4ade80" },
          { label: "Pire", val: "-$" + Math.abs(worstDay).toFixed(0), color: "#f87171" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "7px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* En-tete jours semaine */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 3 }}>
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((j, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 11, color: i >= 5 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.35)", fontWeight: 700, paddingBottom: 4 }}>{j}</div>
        ))}
      </div>

      {/* Grille calendrier */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {grid.map((cell, i) => {
          const c = cell.trading && cell.data ? cellColor(cell.data.pnl) : { bg: "#0d0d15", fg: "rgba(255,255,255,0.05)", border: "1px solid #12121a", numColor: "rgba(255,255,255,0.05)" };
          const isWeekend = !cell.trading;
          return (
            <div key={i} style={{
              background: c.bg,
              border: c.border,
              borderRadius: 8,
              padding: "5px 4px",
              minHeight: 52,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: isWeekend ? 0.35 : 1,
            }}>
              <div style={{ fontSize: 10, color: c.numColor, fontWeight: 700 }}>
                {cell.dayNum}
              </div>
              {cell.trading && cell.data && (
                <>
                  <div style={{ fontSize: 11, color: c.fg, fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
                    {cell.data.pnl >= 0 ? "+" : ""}
                    {Math.abs(cell.data.pnl) >= 1000
                      ? "$" + (cell.data.pnl / 1000).toFixed(1) + "k"
                      : "$" + Math.abs(cell.data.pnl).toFixed(0)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 2 }}>
                    <span style={{ fontSize: 8, color: c.fg, opacity: 0.75 }}>
                      {cell.data.wins}W {cell.data.losses}L
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legende */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        {[
          { bg: "#6ee7b7", label: "Gros gain" },
          { bg: "#052e16", label: "Petit gain", fg: "#4ade80" },
          { bg: "#dc2626", label: "Grosse perte" },
          { bg: "#2d0808", label: "Petite perte", fg: "#f87171" },
        ].map(l => (
          <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: l.fg || "rgba(255,255,255,0.55)" }}>
            <span style={{ display: "inline-block", width: 10, height: 10, background: l.bg, border: "1px solid " + (l.fg || "#fff") + "30", borderRadius: 3 }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HELPERS PERSISTANCE APP (profil, auth, onboarding)
// ══════════════════════════════════════════════════════════════════
const APP_KEY = "eapropfirm_app";
function loadApp() {
  try { const r = localStorage.getItem(APP_KEY); return r ? JSON.parse(r) : {}; } catch (e) { return {}; }
}
function saveApp(patch) {
  try {
    const cur = loadApp();
    const next = { ...cur, ...patch };
    localStorage.setItem(APP_KEY, JSON.stringify(next));
    return next;
  } catch (e) { return patch; }
}
// Le simulateur lit "eapropfirm_config" → on y écrit firm/capital pour synchroniser
function syncSimConfig(patch) {
  try {
    const r = localStorage.getItem("eapropfirm_config");
    const cur = r ? JSON.parse(r) : {};
    localStorage.setItem("eapropfirm_config", JSON.stringify({ ...cur, ...patch }));
  } catch (e) {}
}

const CAPITAL_OPTIONS = [6000, 15000, 25000, 50000, 100000, 200000];

// ══════════════════════════════════════════════════════════════════
// LANGUAGE PICKER — Premier écran (FR / EN / ES)
// ══════════════════════════════════════════════════════════════════
function LanguagePickerScreen({ onPick }) {
  const [selected, setSelected] = useState("fr");

  const LANGS = [
    { k: "en", label: "English", sub: "Continue in English", flag: "🇺🇸" },
    { k: "fr", label: "Français", sub: "Continuer en français", flag: "🇫🇷" },
    { k: "es", label: "Español", sub: "Continuar en español", flag: "🇪🇸" },
  ];

  // Globe SVG — globe pointillé avec glow vert
  const GlobeSVG = () => {
    const dots = [];
    const CX = 175, CY = 195, RX = 155, RY = 110;
    // Grille de points projetés sur la sphère (latitude/longitude)
    const ROWS = 11, COLS = 22;
    for (let r = 0; r < ROWS; r++) {
      const phi = (r / (ROWS - 1)) * Math.PI; // 0 = pôle nord, PI = pôle sud
      const y = CY - RY * Math.cos(phi);
      if (y > CY) continue; // seulement hémisphère supérieur visible
      const radiusAtLat = Math.sin(phi);
      for (let c = 0; c < COLS; c++) {
        const theta = (c / COLS) * Math.PI * 2;
        const x = CX + RX * radiusAtLat * Math.cos(theta);
        // Opacité en fonction de la position (bords = moins visible)
        const edgeFactor = 1 - Math.abs(Math.cos(theta)) * 0.5;
        const topFactor = 0.3 + 0.7 * (1 - r / ROWS);
        const opacity = Math.min(0.7, edgeFactor * topFactor * 0.6);
        dots.push(
          <circle key={`${r}-${c}`} cx={x} cy={y} r={1.8} fill="#6ee7b7" opacity={opacity} />
        );
      }
    }
    // Lignes de longitude légères
    const latLines = [];
    for (let r = 2; r < ROWS - 1; r += 3) {
      const phi = (r / (ROWS - 1)) * Math.PI;
      const y = CY - RY * Math.cos(phi);
      if (y > CY) continue;
      const radiusAtLat = Math.sin(phi);
      const points = Array.from({ length: 33 }).map((_, i) => {
        const th = (i / 32) * Math.PI * 2;
        return `${CX + RX * radiusAtLat * Math.cos(th)},${y}`;
      }).join(' ');
      latLines.push(<polyline key={`lat-${r}`} points={points} fill="none" stroke="#6ee7b7" strokeWidth="0.4" opacity="0.15" />);
    }
    return (
      <svg width="350" height="200" viewBox="0 0 350 200" style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)" }}>
        <defs>
          <radialGradient id="lglow" cx="50%" cy="100%" r="60%">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#6ee7b7" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lglow2" cx="50%" cy="85%" r="40%">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="175" cy="220" rx="160" ry="90" fill="url(#lglow)" />
        <ellipse cx="175" cy="210" rx="90" ry="50" fill="url(#lglow2)" />
        {latLines}
        {dots}
      </svg>
    );
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#06090f",
      display: "flex", flexDirection: "column",
      maxWidth: 480, margin: "0 auto",
      fontFamily: "-apple-system, sans-serif",
      paddingBottom: "calc(28px + env(safe-area-inset-bottom))",
    }}>

      {/* ── Logo + Titre ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "calc(48px + env(safe-area-inset-top))", paddingBottom: 32 }}>
        {/* App Icon */}
        <img
          src="/app-icon.png"
          alt="Prop Firm Simulator"
          style={{ width: 96, height: 96, borderRadius: 22, marginBottom: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
        />
        {/* Titre — style appIcon */}
        <div style={{ textAlign: "center", lineHeight: 1 }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#6ee7b7", letterSpacing: -0.5, textTransform: "uppercase" }}>
            PROP FIRM
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: 3, textTransform: "uppercase", marginTop: 4 }}>
            SIMULATOR
          </div>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div style={{ flex: 1, padding: "0 24px", paddingTop: 0 }}>

        {/* Étape 1/3 */}
        <div style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7", marginBottom: 10 }}>Étape 1/3</div>

        {/* Barres de progression */}
        <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i === 0 ? "#6ee7b7" : "rgba(255,255,255,0.12)",
            }} />
          ))}
        </div>

        {/* Titre */}
        <div style={{ fontSize: 28, fontWeight: 700, color: "#FFFFFF", fontFamily: "-apple-system, sans-serif", marginBottom: 6, lineHeight: 1.2 }}>
          Choisis ta langue
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginBottom: 28, lineHeight: 1.5 }}>
          Tu pourras la changer plus tard dans les paramètres.
        </div>

        {/* Liste des langues */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {LANGS.map(l => {
            const sel = selected === l.k;
            return (
              <button key={l.k} onClick={() => setSelected(l.k)} style={{
                width: "100%", padding: "18px 20px", borderRadius: 18,
                background: sel ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
                border: "1.5px solid " + (sel ? "#FFFFFF" : "rgba(255,255,255,0.08)"),
                display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
                textAlign: "left", transition: "all .15s",
              }}>
                {/* Drapeau circulaire */}
                <div style={{
                  width: 48, height: 48, borderRadius: 24, overflow: "hidden",
                  background: "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: 30,
                }}>
                  {l.flag}
                </div>
                {/* Texte */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: sel ? "#000000" : "#FFFFFF", marginBottom: 2 }}>
                    {l.label}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                    {l.sub}
                  </div>
                </div>
                {/* Checkmark */}
                {sel && (
                  <div style={{ flexShrink: 0, width: 24, height: 24 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L19 7" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Bouton Continuer ── */}
      <div style={{ padding: "24px 24px 0" }}>
        <button onClick={() => onPick(selected)} style={{
          width: "100%", padding: "20px",
          borderRadius: 100,
          background: "#6ee7b7",
          color: "#000000", fontSize: 16, fontWeight: 600,
          border: "none", cursor: "pointer", fontFamily: "-apple-system, sans-serif",
          letterSpacing: -0.2,
          boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
        }}>
          Continuer
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ONBOARDING
// ══════════════════════════════════════════════════════════════════
function OnboardingScreen({ t, lang, setLang, onDone }) {
  const [step, setStep] = useState(0);

  // ── Textes par langue (inline, indépendant du système i18n global) ──
  const TX = {
    fr: {
      skip: "Passer",
      next: "Suivant",
      start: "Commencer",
      // Slide 1
      s1h1:"Combien de challenges", s1h2:"avez-vous ", s1h2r:"déjà perdus ?",
      s1sub:"La plupart des traders découvrent leurs erreurs après avoir payé un challenge. Le problème n'est pas toujours la stratégie. C'est souvent le ",
      s1bold:"manque de préparation.",
      s1nop:"⊗ Sans préparation", s1yep:"✓ Avec préparation",
      s1e1:"Daily Drawdown dépassé", s1e2:"Challenge échoué",
      s1wr:"Winrate", s1dd:"Drawdown max", s1pf:"Profit Factor", s1prob:"Probabilité de réussite",
      s1c1:"Drawdown journalier dépassé", s1c2:"Challenge perdu",
      s1c3:"99$ à 500$ perdus", s1c4:"Erreur évitable",
      s1bot:"Ne découvrez plus vos erreurs avec de l'", s1botr:"argent réel.",
      // Slide 2
      s2h1:"Préparez-vous comme", s2h2:"les traders financés",
      s2sub:"Testez votre stratégie avant de risquer votre argent. Découvrez vos statistiques réelles avant d'acheter un challenge.",
      s2ready:"Challenge Ready", s2prob:"de réussite",
      s2stats:"Statistiques", s2proj:"Projection",
      s2risk:"Gestion du risque", s2val:"Validation du challenge",
      s2k1:"Winrate validé", s2k2:"Drawdown maîtrisé",
      s2k3:"Risque sous contrôle", s2k4:"Challenge prêt à être lancé",
      s2bot1:"Prenez vos décisions avec des ", s2bot2:"données réelles,", s2bot3:" pas avec des émotions.",
      // Slide 3
      s3h1:"Chaque challenge coûte de l'argent.", s3h2:"La préparation coûte moins cher.",
      s3sub1:"Une seule ", s3subr:"erreur évitée", s3sub2:" peut rentabiliser votre abonnement pendant des mois.",
      s3lost:"Challenge perdu", s3sim:"Simulator Prop Firm",
      s3mo:"9,99 € / mois", s3yr:"79,99 € / an",
      s3bt1:"Préparez-vous aujourd'hui,", s3bt2:"réussissez demain.",
      s3cta:"Commencer mon essai gratuit",
    },
    en: {
      skip: "Skip", next: "Next", start: "Get started",
      s1h1:"How many challenges", s1h2:"have you already ", s1h2r:"failed ?",
      s1sub:"Most traders discover their mistakes after paying for a challenge. The problem isn't always the strategy. It's often the ",
      s1bold:"lack of preparation.",
      s1nop:"⊗ Without prep", s1yep:"✓ With preparation",
      s1e1:"Daily Drawdown exceeded", s1e2:"Challenge failed",
      s1wr:"Winrate", s1dd:"Max Drawdown", s1pf:"Profit Factor", s1prob:"Success probability",
      s1c1:"Daily drawdown exceeded", s1c2:"Challenge lost",
      s1c3:"$99 to $500 lost", s1c4:"Avoidable mistake",
      s1bot:"Stop discovering your mistakes with ", s1botr:"real money.",
      s2h1:"Prepare yourself like", s2h2:"funded traders",
      s2sub:"Test your strategy before risking your money. Discover your real statistics before buying a challenge.",
      s2ready:"Challenge Ready", s2prob:"success rate",
      s2stats:"Statistics", s2proj:"Projection",
      s2risk:"Risk management", s2val:"Challenge validation",
      s2k1:"Winrate validated", s2k2:"Drawdown controlled",
      s2k3:"Risk under control", s2k4:"Challenge ready to launch",
      s2bot1:"Make decisions with ", s2bot2:"real data,", s2bot3:" not emotions.",
      s3h1:"Every challenge costs money.", s3h2:"Preparation costs less.",
      s3sub1:"One single ", s3subr:"avoided mistake", s3sub2:" can pay for your subscription for months.",
      s3lost:"Challenge lost", s3sim:"Prop Firm Simulator",
      s3mo:"$9.99 / month", s3yr:"$79.99 / year",
      s3bt1:"Prepare today,", s3bt2:"succeed tomorrow.",
      s3cta:"Start my free trial",
    },
    es: {
      skip: "Omitir", next: "Siguiente", start: "Empezar",
      s1h1:"Cuántos retos", s1h2:"ya has ", s1h2r:"fallado ?",
      s1sub:"La mayoría de los traders descubren sus errores después de pagar un reto. El problema no siempre es la estrategia. A menudo es la ",
      s1bold:"falta de preparación.",
      s1nop:"⊗ Sin preparación", s1yep:"✓ Con preparación",
      s1e1:"Drawdown diario superado", s1e2:"Reto fallido",
      s1wr:"Winrate", s1dd:"Drawdown máx", s1pf:"Factor de beneficio", s1prob:"Prob. de éxito",
      s1c1:"Drawdown diario superado", s1c2:"Reto perdido",
      s1c3:"$99 a $500 perdidos", s1c4:"Error evitable",
      s1bot:"Deja de descubrir tus errores con ", s1botr:"dinero real.",
      s2h1:"Prepárate como", s2h2:"los traders financiados",
      s2sub:"Prueba tu estrategia antes de arriesgar tu dinero. Descubre tus estadísticas reales antes de comprar un reto.",
      s2ready:"Reto Listo", s2prob:"de éxito",
      s2stats:"Estadísticas", s2proj:"Proyección",
      s2risk:"Gestión del riesgo", s2val:"Validación del reto",
      s2k1:"Winrate validado", s2k2:"Drawdown controlado",
      s2k3:"Riesgo bajo control", s2k4:"Reto listo para lanzar",
      s2bot1:"Toma decisiones con ", s2bot2:"datos reales,", s2bot3:" no con emociones.",
      s3h1:"Cada reto cuesta dinero.", s3h2:"La preparación cuesta menos.",
      s3sub1:"Un solo ", s3subr:"error evitado", s3sub2:" puede rentabilizar tu suscripción durante meses.",
      s3lost:"Reto perdido", s3sim:"Simulador Prop Firm",
      s3mo:"9,99 € / mes", s3yr:"79,99 € / año",
      s3bt1:"Prepárate hoy,", s3bt2:"triunfa mañana.",
      s3cta:"Comenzar mi prueba gratuita",
    },
  };
  const tx = TX[lang] || TX.fr;

  // ── Micro-composants réutilisables ──
  const SparkLine = ({ color="#6ee7b7", down=false }) => {
    const pts = down
      ? "0,4 10,6 18,8 26,12 34,16 42,20 50,22"
      : "0,20 8,16 16,14 24,10 32,8 40,6 50,3";
    return (
      <svg width="52" height="26" viewBox="0 0 52 26">
        <defs>
          <linearGradient id={"sg-"+color.replace("#","")} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  const GaugeRing = ({ pct=74, size=180 }) => {
    const r = size/2 - 14, circ = 2*Math.PI*r, dash = (pct/100)*circ;
    const mid = size/2;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{position:"absolute",top:0,left:0}}>
        <defs>
          <linearGradient id="gauge-g" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669"/><stop offset="100%" stopColor="#6ee7b7"/>
          </linearGradient>
          <filter id="gauge-glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <circle cx={mid} cy={mid} r={r} fill="none" stroke="rgba(110,231,183,0.1)" strokeWidth="14"/>
        <circle cx={mid} cy={mid} r={r} fill="none" stroke="url(#gauge-g)" strokeWidth="14"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${mid} ${mid})`} filter="url(#gauge-glow)"/>
        <circle cx={mid} cy={mid} r={r-22} fill="rgba(110,231,183,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      </svg>
    );
  };

  // ── Slide 1 ──────────────────────────────────────────────────────
  const Slide1 = () => (
    <div style={{padding:"60px 20px 100px", overflowY:"auto", minHeight:"100vh"}}>
      <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",textAlign:"right",marginBottom:20,fontWeight:600}}>1/3</div>
      {/* Titre */}
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:28,fontWeight:700,color:"#ffffff",lineHeight:1.2,marginBottom:4}}>{tx.s1h1}</div>
        <div style={{fontSize:28,fontWeight:700,lineHeight:1.2}}>
          <span style={{color:"#ffffff"}}>{tx.s1h2}</span>
          <span style={{color:"#f87171"}}>{tx.s1h2r}</span>
        </div>
      </div>
      <div style={{textAlign:"center",fontSize:14,color:"rgba(255,255,255,0.45)",lineHeight:1.6,marginBottom:24}}>
        {tx.s1sub}<span style={{color:"#ffffff",fontWeight:700}}>{tx.s1bold}</span>
      </div>

      {/* Comparaison */}
      <div style={{display:"flex",gap:10,marginBottom:18}}>
        {/* Gauche — rouge */}
        <div style={{flex:1,borderRadius:16,background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.25)",overflow:"hidden"}}>
          <div style={{padding:"8px 10px",background:"rgba(239,68,68,0.12)",display:"flex",alignItems:"center",gap:6}}>
            <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="7" fill="#ef4444"/><path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span style={{fontSize:11,fontWeight:700,color:"#f87171"}}>{tx.s1nop}</span>
          </div>
          <div style={{padding:"10px 10px 6px"}}>
            {/* Mini chart rouge descendant */}
            <div style={{background:"rgba(239,68,68,0.08)",borderRadius:8,padding:"8px 6px",marginBottom:8}}>
              <svg width="100%" height="50" viewBox="0 0 120 50">
                <polyline points="0,10 20,15 40,22 55,18 70,30 90,38 110,46" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
                <polygon points="0,10 20,15 40,22 55,18 70,30 90,38 110,46 110,50 0,50" fill="url(#rg)" opacity="0.3"/>
                <defs><linearGradient id="rg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ef4444"/><stop offset="100%" stopColor="#ef4444" stopOpacity="0"/></linearGradient></defs>
              </svg>
            </div>
            {[tx.s1e1,tx.s1e2].map((e,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,padding:"5px 6px",background:"rgba(239,68,68,0.1)",borderRadius:6}}>
                <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="7" fill="#ef4444"/><path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span style={{fontSize:11,color:"#fca5a5",fontWeight:600}}>{e}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Droite — vert */}
        <div style={{flex:1,borderRadius:16,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(110,231,183,0.2)",overflow:"hidden"}}>
          <div style={{padding:"8px 10px",background:"rgba(110,231,183,0.1)",display:"flex",alignItems:"center",gap:6}}>
            <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="7" fill="#6ee7b7"/><path d="M4 7l2.5 2.5 4-4" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{fontSize:11,fontWeight:700,color:"#6ee7b7"}}>{tx.s1yep}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,padding:"8px"}}>
            {[[tx.s1wr,"52%"],[tx.s1dd,"4.2%"],[tx.s1pf,"1.87"],[tx.s1prob,"74%"]].map(([l,v],i)=>(
              <div key={i} style={{background:"rgba(110,231,183,0.05)",borderRadius:8,padding:"6px 8px"}}>
                <div style={{fontSize: 11,color:"rgba(255,255,255,0.4)",marginBottom:2}}>{l}</div>
                <div style={{fontSize:15,fontWeight:700,color:"#ffffff"}}>{v}</div>
                <SparkLine color="#6ee7b7"/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4 cartes icônes */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {[
          {icon:"📉",label:tx.s1c1,c:"#ef4444",bg:"rgba(239,68,68,0.08)"},
          {icon:"⊗",label:tx.s1c2,c:"#ef4444",bg:"rgba(239,68,68,0.08)"},
          {icon:"💰",label:tx.s1c3,c:"#6ee7b7",bg:"rgba(245,158,11,0.08)"},
          {icon:"⚠️",label:tx.s1c4,c:"#6ee7b7",bg:"rgba(245,158,11,0.08)"},
        ].map((c,i)=>(
          <div key={i} style={{background:c.bg,border:"1px solid "+c.c+"30",borderRadius:14,padding:"14px 12px",textAlign:"center"}}>
            <div style={{fontSize:26,marginBottom:8}}>{c.icon}</div>
            <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.8)",lineHeight:1.4}}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Carte bas */}
      <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:18,padding:"20px",textAlign:"center"}}>
        <div style={{fontSize:24,marginBottom:10}}>🚨</div>
        <div style={{fontSize:15,fontWeight:700,color:"#ffffff",lineHeight:1.5}}>
          {tx.s1bot}<span style={{color:"#f87171"}}>{tx.s1botr}</span>
        </div>
      </div>
    </div>
  );

  // ── Slide 2 ──────────────────────────────────────────────────────
  const Slide2 = () => (
    <div style={{padding:"60px 20px 100px",overflowY:"auto",minHeight:"100vh"}}>
      <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",textAlign:"right",marginBottom:20,fontWeight:600}}>2/3</div>
      <div style={{textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:27,fontWeight:700,color:"#ffffff",lineHeight:1.2,marginBottom:4}}>{tx.s2h1}</div>
        <div style={{fontSize:27,fontWeight:700,color:"#6ee7b7",lineHeight:1.2}}>{tx.s2h2}</div>
      </div>
      <div style={{textAlign:"center",fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.6,marginBottom:22}}>{tx.s2sub}</div>

      {/* Zone centrale : gauge + cartes gauche/droite */}
      <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18,minHeight:240}}>
        {/* Cartes gauche */}
        <div style={{display:"flex",flexDirection:"column",gap:8,flex:1,marginRight:8}}>
          {[[tx.s1wr,"52%","#6ee7b7",false],[tx.s1pf,"1.87","#6ee7b7",false],
            [tx.s1dd,"4.2%","#ef4444",true],[tx.s1prob,"74%","#6ee7b7",false]].map(([l,v,c,dn],i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(110,231,183,0.12)",borderRadius:12,padding:"8px 10px"}}>
              <div style={{fontSize: 11,color:"rgba(255,255,255,0.4)",marginBottom:2}}>{l}</div>
              <div style={{fontSize:16,fontWeight:700,color:"#ffffff"}}>{v}</div>
              <SparkLine color={c} down={dn}/>
            </div>
          ))}
        </div>

        {/* Gauge centrale */}
        <div style={{position:"relative",width:170,height:170,flexShrink:0}}>
          {/* Halo */}
          <div style={{position:"absolute",inset:-10,borderRadius:"50%",background:"radial-gradient(circle,rgba(110,231,183,0.15) 0%,transparent 70%)"}}/>
          <GaugeRing pct={74} size={170}/>
          {/* Centre texte */}
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>🎯</div>
            <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.7)",marginBottom:2}}>{tx.s2ready}</div>
            <div style={{fontSize:30,fontWeight:700,color:"#6ee7b7",lineHeight:1}}>74%</div>
          </div>
        </div>

        {/* Cartes droite */}
        <div style={{display:"flex",flexDirection:"column",gap:8,flex:1,marginLeft:8}}>
          {[["📊",tx.s2stats],["📈",tx.s2proj],["🛡",tx.s2risk],["🎯",tx.s2val]].map(([ic,l],i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(110,231,183,0.12)",borderRadius:12,padding:"8px 10px",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:4}}>{ic}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.7)",fontWeight:600,lineHeight:1.3}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 badges check */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {[tx.s2k1,tx.s2k2,tx.s2k3,tx.s2k4].map((k,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(110,231,183,0.2)",borderRadius:12,padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
            <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="9" fill="rgba(110,231,183,0.15)"/><circle cx="9" cy="9" r="9" fill="none" stroke="#6ee7b7" strokeWidth="1.2"/><path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.85)",lineHeight:1.3}}>{k}</span>
          </div>
        ))}
      </div>

      {/* Carte bas */}
      <div style={{background:"rgba(110,231,183,0.05)",border:"1px solid rgba(110,231,183,0.15)",borderRadius:18,padding:"20px",textAlign:"center"}}>
        <div style={{fontSize:24,marginBottom:10}}>🛡</div>
        <div style={{fontSize:15,fontWeight:700,color:"#ffffff",lineHeight:1.5}}>
          {tx.s2bot1}<span style={{color:"#6ee7b7"}}>{tx.s2bot2}</span>{tx.s2bot3}
        </div>
      </div>
    </div>
  );

  // ── Slide 3 ──────────────────────────────────────────────────────
  const Slide3 = () => (
    <div style={{padding:"60px 20px 120px",overflowY:"auto",minHeight:"100vh"}}>
      <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",textAlign:"right",marginBottom:20,fontWeight:600}}>3/3</div>
      <div style={{textAlign:"center",marginBottom:12}}>
        <div style={{fontSize:26,fontWeight:700,color:"#ffffff",lineHeight:1.2,marginBottom:4}}>{tx.s3h1}</div>
        <div style={{fontSize:26,fontWeight:700,color:"#6ee7b7",lineHeight:1.2}}>{tx.s3h2}</div>
      </div>
      <div style={{textAlign:"center",fontSize:14,color:"rgba(255,255,255,0.45)",lineHeight:1.6,marginBottom:24}}>
        {tx.s3sub1}<span style={{color:"#f87171",fontWeight:700}}>{tx.s3subr}</span>{tx.s3sub2}
      </div>

      {/* Balance stylisée */}
      <div style={{position:"relative",height:80,marginBottom:8}}>
        {/* Poutre SVG */}
        <svg width="100%" height="80" viewBox="0 0 320 80" style={{position:"absolute",top:0,left:0}}>
          {/* Pilier central */}
          <rect x="155" y="25" width="10" height="50" rx="5" fill="#2a2020"/>
          {/* Boule */}
          <circle cx="160" cy="25" r="8" fill="#3a3030"/>
          {/* Poutre inclinée (gauche plus bas = plus lourd) */}
          <path d="M20 42 Q160 22 300 32" fill="none" stroke="#3a3030" strokeWidth="7" strokeLinecap="round"/>
          {/* Chaînes gauche */}
          <line x1="30" y1="45" x2="30" y2="62" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 2"/>
          <line x1="70" y1="40" x2="70" y2="62" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 2"/>
          {/* Chaînes droite */}
          <line x1="250" y1="35" x2="250" y2="52" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 2"/>
          <line x1="290" y1="32" x2="290" y2="52" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 2"/>
          {/* Plateau gauche (rouge) */}
          <ellipse cx="50" cy="65" rx="44" ry="7" fill="#3a1515"/>
          <ellipse cx="50" cy="63" rx="36" ry="5" fill="#ef4444" opacity="0.25"/>
          {/* Plateau droite (vert) */}
          <ellipse cx="270" cy="55" rx="40" ry="6" fill="#0f2a1a"/>
          <ellipse cx="270" cy="53" rx="32" ry="4" fill="#6ee7b7" opacity="0.2"/>
          {/* Base */}
          <ellipse cx="160" cy="78" rx="36" ry="6" fill="#2a2020"/>
        </svg>
      </div>

      {/* Les deux plateaux contenus */}
      <div style={{display:"flex",gap:10,marginBottom:20}}>
        {/* Plateau gauche — rouge (challenge perdu) */}
        <div style={{flex:1,background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:16,padding:"14px 12px",textAlign:"center"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:10}}>
            <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="9" fill="#ef4444"/><path d="M5.5 5.5l7 7M12.5 5.5l-7 7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <span style={{fontSize:12,fontWeight:700,color:"#f87171"}}>{tx.s3lost}</span>
          </div>
          {/* Mini chart descendant */}
          <div style={{margin:"0 auto 10px",width:"80%"}}>
            <svg width="100%" height="36" viewBox="0 0 80 36">
              <defs><linearGradient id="rch" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.4"/><stop offset="100%" stopColor="#ef4444" stopOpacity="0"/></linearGradient></defs>
              <polygon points="0,4 16,6 32,14 48,20 64,28 80,34 80,36 0,36" fill="url(#rch)"/>
              <polyline points="0,4 16,6 32,14 48,20 64,28 80,34" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{fontSize:22,fontWeight:700,color:"#f87171"}}>99$</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",margin:"2px 0"}}>à</div>
          <div style={{fontSize:24,fontWeight:700,color:"#f87171"}}>500$</div>
        </div>

        {/* Plateau droite — vert (simulator) */}
        <div style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(110,231,183,0.3)",borderRadius:16,padding:"14px 12px",textAlign:"center"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:10}}>
            <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="9" fill="rgba(110,231,183,0.2)"/><path d="M5 9l3 3 5-5" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{fontSize:11,fontWeight:700,color:"#6ee7b7"}}>{tx.s3sim}</span>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:4}}>🛡</div>
          </div>
          <div style={{fontSize:22,fontWeight:700,color:"#6ee7b7",marginBottom:4}}>{tx.s3mo}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.3)",margin:"4px 0"}}>ou</div>
          <div style={{fontSize:20,fontWeight:700,color:"#6ee7b7"}}>{tx.s3yr}</div>
        </div>
      </div>

      {/* Carte bas + CTA */}
      <div style={{background:"rgba(110,231,183,0.05)",border:"1px solid rgba(110,231,183,0.15)",borderRadius:20,padding:"22px 20px",textAlign:"center"}}>
        <div style={{fontSize:26,marginBottom:10}}>🛡</div>
        <div style={{fontSize:17,fontWeight:700,color:"#ffffff",lineHeight:1.4,marginBottom:4}}>{tx.s3bt1}</div>
        <div style={{fontSize:17,fontWeight:700,color:"#6ee7b7",lineHeight:1.4,marginBottom:18}}>{tx.s3bt2}</div>
        <button onClick={onDone} style={{
          width:"100%",padding:"18px",borderRadius:100,
          background:"#6ee7b7",color:"#000000",
          fontSize:16,fontWeight:700,border:"none",cursor:"pointer",
          boxShadow:"0 4px 24px rgba(110,231,183,0.3)",
        }}>{tx.s3cta}</button>
      </div>
    </div>
  );

  const slides = [<Slide1 key="s1"/>, <Slide2 key="s2"/>, <Slide3 key="s3"/>];
  const isLast = step === 2;

  return (
    <div style={{minHeight:"100vh",background:"#06090f",position:"relative",maxWidth:480,margin:"0 auto",fontFamily:"-apple-system, sans-serif",color:"#FFFFFF",overflow:"hidden"}}>

      {/* Halo ambré style Capital.com */}
      <div style={{position:"absolute",top:"20%",left:"50%",transform:"translateX(-50%)",width:350,height:350,borderRadius:"50%",background:"radial-gradient(circle, rgba(52,211,153,0.22) 0%, rgba(100,60,5,0.08) 50%, transparent 70%)",pointerEvents:"none",zIndex:0}} />

      {/* Slide actif */}
      <div style={{paddingTop:"env(safe-area-inset-top)",position:"relative",zIndex:1}}>
        {slides[step]}
      </div>

      {/* Bouton Passer */}
      {!isLast && (
        <button onClick={onDone} style={{position:"fixed",top:"calc(14px + env(safe-area-inset-top))",right:20,background:"none",border:"none",color:"rgba(110,231,183,0.5)",fontSize:13,fontWeight:600,cursor:"pointer",zIndex:20,fontFamily:"-apple-system, sans-serif"}}>
          Passer →
        </button>
      )}

      {/* Navigation bas fixe */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"linear-gradient(transparent,#050300 40%)",padding:"20px 20px calc(24px + env(safe-area-inset-bottom))",display:"flex",alignItems:"center",justifyContent:"space-between",maxWidth:480,margin:"0 auto",zIndex:10}}>
        {/* Dots */}
        <div style={{display:"flex",gap:6,flex:1,justifyContent:"center"}}>
          {[0,1,2].map(i=>(
            <div key={i} onClick={()=>setStep(i)} style={{
              width:i===step?24:8,height:8,borderRadius:4,cursor:"pointer",
              background:i===step?"linear-gradient(90deg,#6ee7b7,#6ee7b7)":"rgba(110,231,183,0.2)",
              transition:"all .3s",
            }}/>
          ))}
        </div>
        {/* Bouton suivant */}
        {!isLast && (
          <button onClick={()=>setStep(s=>s+1)} style={{
            padding:"13px 24px",borderRadius:100,border:"none",cursor:"pointer",
            background:"#6ee7b7",
            color:"#000000",fontSize:14,fontWeight:600,fontFamily:"-apple-system, sans-serif",
            boxShadow:"0 4px 20px rgba(110,231,183,0.25)",
          }}>
            {step===0 ? tx.next : tx.next}
          </button>
        )}
      </div>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════
// LOGIN — Google & Apple uniquement
// ══════════════════════════════════════════════════════════════════
function LoginScreen({ t, lang, setLang, onAuth }) {
  const [mode, setMode] = useState("signup"); // signup | login

  // Auth sociale simulée (mock local — prêt pour intégration Supabase OAuth)
  const handleSocialAuth = (provider) => {
    const names = { google: "Utilisateur Google", apple: "Utilisateur Apple" };
    onAuth({ name: names[provider], email: provider + "@mock.local", guest: false, provider });
  };

  return (
    <div style={{ minHeight:"100vh", background:"#06090f", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", fontFamily:"-apple-system, sans-serif", position:"relative", overflow:"hidden" }}>

      {/* Halo ambré Capital.com style */}
      <div style={{ position:"absolute", top:"15%", left:"50%", transform:"translateX(-50%)", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(52,211,153,0.28) 0%, rgba(16,185,129,0.12) 45%, transparent 70%)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"absolute", bottom:"30%", right:"-10%", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle, rgba(110,231,183,0.08) 0%, transparent 70%)", pointerEvents:"none", zIndex:0 }} />

      {/* Bouton retour */}
      <div style={{ padding:"calc(14px + env(safe-area-inset-top)) 20px 0", position:"relative", zIndex:1 }}>
        <div style={{ width:42, height:42, borderRadius:21, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(110,231,183,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Titre */}
      <div style={{ padding:"28px 24px 24px", textAlign:"center", position:"relative", zIndex:1 }}>
        {/* Logo */}
        <img
          src="/app-icon.png"
          alt="Prop Firm Simulator"
          style={{ width: 72, height: 72, borderRadius: 16, marginBottom: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
        />
        {/* Titre */}
        <div style={{ lineHeight: 1, marginBottom: 8 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#6ee7b7", letterSpacing: -0.3, textTransform: "uppercase" }}>
            PROP FIRM
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: 3, textTransform: "uppercase", marginTop: 3 }}>
            SIMULATOR
          </div>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.40)", lineHeight: 1.5, marginTop: 12 }}>
          {mode === "signup" ? "Crée ton compte en quelques secondes" : "Bon retour parmi les traders préparés."}
        </div>
      </div>

      {/* Carte inscription */}
      <div style={{ margin:"0 20px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(110,231,183,0.15)", borderRadius:24, padding:"26px 20px", position:"relative", zIndex:1, backdropFilter:"blur(20px)" }}>

        {/* Header gradient */}
        <div style={{ textAlign:"center", marginBottom:22 }}>
          <span style={{ fontSize:15, fontWeight:600, color: "rgba(255,255,255,0.5)" }}>
            {mode === "signup" ? "Inscription rapide et sécurisée" : "Connexion rapide et sécurisée"}
          </span>
        </div>

        {/* Bouton Google */}
        <button onClick={() => handleSocialAuth("google")} style={{
          width:"100%", padding:"17px 20px", borderRadius:16, marginBottom:12,
          background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.10)",
          display:"flex", alignItems:"center", cursor:"pointer",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span style={{ flex:1, fontSize:16, fontWeight:700, color:"#ffffff", textAlign:"center" }}>
            Continuer avec Google
          </span>
        </button>

        {/* Bouton Apple */}
        <button onClick={() => handleSocialAuth("apple")} style={{
          width:"100%", padding:"17px 20px", borderRadius:16,
          background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.10)",
          display:"flex", alignItems:"center", cursor:"pointer",
        }}>
          <svg width="20" height="24" viewBox="0 0 20 24" fill="white" style={{ flexShrink:0 }}>
            <path d="M16.125 12.578c-.028-2.65 2.16-3.935 2.26-3.998-1.232-1.8-3.149-2.047-3.831-2.075-1.63-.163-3.18.95-4.007.95-.825 0-2.105-.924-3.456-.9-1.78.025-3.41 1.025-4.328 2.6-1.843 3.195-.473 7.943 1.328 10.543.88 1.275 1.934 2.712 3.314 2.66 1.33-.052 1.835-.858 3.444-.858 1.612 0 2.068.858 3.48.83 1.432-.026 2.342-1.3 3.215-2.578.995-1.453 1.412-2.876 1.44-2.948-.03-.014-2.79-1.075-2.82-4.227z"/>
            <path d="M13.595 4.35c.718-.89 1.208-2.127 1.075-3.35-1.04.042-2.3.69-3.047 1.577-.668.782-1.252 2.03-1.094 3.23 1.163.09 2.35-.59 3.066-1.457z"/>
          </svg>
          <span style={{ flex:1, fontSize:16, fontWeight:700, color:"#ffffff", textAlign:"center" }}>
            Continuer avec Apple
          </span>
        </button>

        {/* Séparateur */}
        <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0" }}>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.09)" }}/>
          <span style={{ fontSize:14, color:"rgba(255,255,255,0.28)", fontWeight:500 }}>ou</span>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.09)" }}/>
        </div>

        {/* Note confidentialité */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
          <div style={{ flexShrink:0, width:42, height:42, borderRadius:21, background:"rgba(110,231,183,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
              <rect x="1" y="9" width="18" height="12" rx="3" stroke="#6ee7b7" strokeWidth="1.5"/>
              <path d="M5 9V6a5 5 0 0110 0v3" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="10" cy="15" r="1.5" fill="#6ee7b7"/>
            </svg>
          </div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.38)", lineHeight:1.6, paddingTop:3 }}>
            Aucune information sensible ne sera partagée sans ton accord.
          </div>
        </div>
      </div>

      {/* Déjà un compte / toggle */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"36px 24px 0", textAlign:"center" }}>
        <div style={{ fontSize:15, color:"rgba(255,255,255,0.38)", marginBottom:10 }}>
          {mode === "signup" ? "Déjà un compte ?" : "Pas encore de compte ?"}
        </div>
        <button onClick={() => setMode(mode === "signup" ? "login" : "signup")} style={{
          background:"none", border:"none", cursor:"pointer",
          fontSize:16, fontWeight:700, color:"#6ee7b7", paddingBottom:0,
        }}>
          {mode === "signup" ? "Se connecter" : "Créer un compte"}
        </button>
      </div>

      {/* CGU + Politique */}
      <div style={{ padding:"28px 24px 0", textAlign:"center", lineHeight:1.6 }}>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.28)" }}>En créant un compte, tu acceptes nos</div>
        <div style={{ fontSize:13 }}>
          <span style={{ color:"#6ee7b7", cursor:"pointer" }}>Conditions d'utilisation</span>
          <span style={{ color:"rgba(255,255,255,0.28)" }}> et notre </span>
          <span style={{ color:"#6ee7b7", cursor:"pointer" }}>Politique de confidentialité.</span>
        </div>
      </div>

      {/* Indicateur home iOS */}
      <div style={{ display:"flex", justifyContent:"center", paddingTop:24, paddingBottom:"calc(8px + env(safe-area-inset-bottom))" }}>
        <div style={{ width:134, height:5, borderRadius:3, background:"rgba(255,255,255,0.28)" }}/>
      </div>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════
// FIRM LOGOS — SVG inline pour le setup
// ══════════════════════════════════════════════════════════════════
function FirmLogo({ firmKey, size = 44 }) {
  const s = size;
  switch (firmKey) {
    case "ftmo": return (
      <svg width={s} height={s} viewBox="0 0 44 44">
        <defs><linearGradient id="ftmo-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1d4ed8"/><stop offset="100%" stopColor="#60a5fa"/></linearGradient></defs>
        <polygon points="22,1 43,22 22,43 1,22" fill="url(#ftmo-g)"/>
        <polygon points="22,11 32,22 22,33 12,22" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5"/>
        <line x1="22" y1="1" x2="22" y2="43" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="1" y1="22" x2="43" y2="22" stroke="white" strokeWidth="0.8" opacity="0.3"/>
      </svg>
    );
    case "fundednext": return (
      <svg width={s} height={s} viewBox="0 0 44 44">
        <defs><linearGradient id="fn-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#4338ca"/><stop offset="100%" stopColor="#818cf8"/></linearGradient></defs>
        <circle cx="22" cy="22" r="20" fill="url(#fn-g)" opacity="0.15"/>
        <path d="M22 4 L30 12 L26 12 L26 20 L18 20 L18 12 L14 12 Z" fill="url(#fn-g)"/>
        <path d="M22 40 L14 32 L18 32 L18 24 L26 24 L26 32 L30 32 Z" fill="url(#fn-g)" opacity="0.7"/>
        <path d="M4 22 L12 14 L12 18 L20 18 L20 26 L12 26 L12 30 Z" fill="url(#fn-g)" opacity="0.5"/>
        <path d="M40 22 L32 30 L32 26 L24 26 L24 18 L32 18 L32 14 Z" fill="url(#fn-g)" opacity="0.85"/>
      </svg>
    );
    case "e8": return (
      <svg width={s} height={s} viewBox="0 0 44 44">
        <defs><linearGradient id="e8-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b4fd8"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs>
        <rect width="44" height="44" rx="10" fill="#0d0d1a"/>
        <text x="4" y="32" fontSize="26" fontWeight="700" fill="url(#e8-g)" fontFamily="Arial Black, sans-serif">E8</text>
      </svg>
    );
    case "alpha": return (
      <svg width={s} height={s} viewBox="0 0 44 44">
        <defs><linearGradient id="al-g" x1="0%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#6ee7b7"/></linearGradient></defs>
        <polygon points="22,3 42,40 2,40" fill="url(#al-g)"/>
        <polygon points="22,14 32,34 12,34" fill="#0d0d0d" opacity="0.6"/>
      </svg>
    );
    case "the5ers": return (
      <svg width={s} height={s} viewBox="0 0 44 44">
        <defs><linearGradient id="f5-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#6ee7b7"/><stop offset="100%" stopColor="#fbbf24"/></linearGradient></defs>
        <text x="1" y="30" fontSize="28" fontWeight="700" fill="url(#f5-g)" fontFamily="Arial Black, sans-serif">5%</text>
        <text x="22" y="40" fontSize="11" fontWeight="700" fill="url(#f5-g)" fontFamily="Arial, sans-serif">ers</text>
      </svg>
    );
    case "fundingpips": return (
      <svg width={s} height={s} viewBox="0 0 44 44">
        <rect width="44" height="44" rx="8" fill="rgba(255,255,255,0.05)"/>
        <circle cx="10" cy="10" r="4" fill="white"/>
        <rect x="6" y="16" width="8" height="20" rx="4" fill="white"/>
        <rect x="20" y="8" width="8" height="28" rx="4" fill="white"/>
        <path d="M28 8 Q38 8 38 18 Q38 28 28 28" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"/>
      </svg>
    );
    default: return <div style={{width:s,height:s,background:"rgba(255,255,255,0.08)",borderRadius:10}}/>;
  }
}

// Capitaux et frais par prop firm
const FIRM_CAPITALS = {
  fundednext: [6000, 15000, 25000, 50000, 100000, 200000],
  ftmo:       [10000, 25000, 50000, 100000, 200000],
  e8:         [25000, 50000, 100000, 200000],
  alpha:      [10000, 25000, 50000, 100000],
  the5ers:    [10000, 25000, 50000, 100000],
  fundingpips:[10000, 25000, 50000, 100000, 200000],
};
const FIRM_FEES = {
  fundednext: { 6000:59, 15000:119, 25000:199, 50000:299, 100000:549, 200000:999 },
  ftmo:       { 10000:155, 25000:250, 50000:345, 100000:540, 200000:1080 },
  e8:         { 25000:148, 50000:228, 100000:388, 200000:698 },
  alpha:      { 10000:79, 25000:179, 50000:299, 100000:499 },
  the5ers:    { 10000:95, 25000:245, 50000:395, 100000:695 },
  fundingpips:{ 10000:49, 25000:99, 50000:164, 100000:299, 200000:529 },
};

// PROFIL SETUP (firm → capital) — Étapes 2/3 et 3/3
// ══════════════════════════════════════════════════════════════════
function ProfileSetupScreen({ t, lang, setLang, onDone }) {
  const [step, setStep] = useState(0); // 0=firm, 1=capital
  const [firmKey, setFirmKey] = useState("fundednext");
  const [capital, setCapital] = useState(25000);

  const totalDisplaySteps = 3; // 1=langue(fait), 2=firm, 3=capital
  const displayStep = step + 2; // commence à 2/3

  const firm = PROP_FIRMS[firmKey] || PROP_FIRMS.fundednext;
  const caps = FIRM_CAPITALS[firmKey] || FIRM_CAPITALS.fundednext;
  const fees = FIRM_FEES[firmKey] || {};

  // Quand on change de firm, reset capital au 1er disponible
  const selectFirm = (k) => {
    setFirmKey(k);
    const firstCap = (FIRM_CAPITALS[k] || FIRM_CAPITALS.fundednext)[0];
    setCapital(firstCap);
  };

  const finish = () => {
    syncSimConfig({ firmKey, modelKey: "2step", capital });
    saveApp({ profile: { lang, firmKey, capital }, setupDone: true });
    onDone({ lang, firmKey, capital });
  };

  const FIRMS_LIST = [
    { k: "ftmo", label: "FTMO" },
    { k: "fundednext", label: "FundedNext" },
    { k: "e8", label: "E8" },
    { k: "alpha", label: "Alpha Capital" },
    { k: "the5ers", label: "5ers" },
    { k: "fundingpips", label: "FundingPips" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#06090f", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", fontFamily:"-apple-system, sans-serif", paddingBottom:"calc(28px + env(safe-area-inset-bottom))" }}>

      {/* Contenu scrollable */}
      <div style={{ flex:1, padding:"0 20px", paddingTop:"calc(40px + env(safe-area-inset-top))", overflowY:"auto" }}>

        {/* Étape X/3 + barres */}
        <div style={{ fontSize:13, fontWeight:700, color:"#6ee7b7", marginBottom:10 }}>
          Étape {displayStep}/3
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:28 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i <= displayStep ? "#6ee7b7" : "rgba(255,255,255,0.12)" }} />
          ))}
        </div>

        {/* ══ STEP 0 : CHOIX PROP FIRM ══ */}
        {step === 0 && (
          <>
            <div style={{ fontSize:28, fontWeight:700, color:"#ffffff", marginBottom:6 }}>Choisis ta prop firm</div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,0.4)", marginBottom:28, lineHeight:1.5 }}>
              Sélectionne la prop firm que tu souhaites utiliser dans le simulateur.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {FIRMS_LIST.map(f => (
                <button key={f.k} onClick={() => { selectFirm(f.k); setStep(1); }} style={{
                  width:"100%", padding:"18px 20px", borderRadius:18,
                  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(110,231,183,0.10)",
                  display:"flex", alignItems:"center", gap:16, cursor:"pointer", textAlign:"left",
                  transition:"all .15s",
                }}>
                  {/* Logo */}
                  <div style={{ width:48, height:48, borderRadius:12, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <FirmLogo firmKey={f.k} size={36} />
                  </div>
                  {/* Nom */}
                  <div style={{ flex:1, fontSize:17, fontWeight:700, color:"#ffffff" }}>{f.label}</div>
                  {/* Flèche */}
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7 5l5 5-5 5" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ══ STEP 1 : CHOIX CAPITAL ══ */}
        {step === 1 && (
          <>
            <div style={{ fontSize:28, fontWeight:700, color:"#ffffff", marginBottom:6 }}>Choisis ton capital</div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,0.4)", marginBottom:22, lineHeight:1.5 }}>
              Sélectionne le capital avec lequel tu souhaites passer le challenge.
            </div>

            {/* Carte firm sélectionnée + Changer */}
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(110,231,183,0.10)", borderRadius:18, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <FirmLogo firmKey={firmKey} size={30} />
              </div>
              <div style={{ flex:1, fontSize:16, fontWeight:700, color:"#ffffff" }}>{firm.name}</div>
              <button onClick={() => setStep(0)} style={{ background:"none", border:"none", color:"#6ee7b7", fontSize:14, fontWeight:700, cursor:"pointer" }}>Changer</button>
            </div>

            {/* Header section capital */}
            <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:16 }}>
              <div style={{ width:40, height:40, borderRadius:20, background:"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:20 }}>🪙</div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:"#ffffff", marginBottom:2 }}>Sélectionne ton capital</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>Chaque option inclut les frais du challenge.</div>
              </div>
            </div>

            {/* Liste capitaux */}
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
              {caps.map(c => {
                const sel = capital === c;
                const fee = fees[c];
                return (
                  <button key={c} onClick={() => setCapital(c)} style={{
                    width:"100%", padding:"18px 20px", borderRadius:18, cursor:"pointer",
                    background: sel ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
                    border: "1.5px solid " + (sel ? "#FFFFFF" : "rgba(255,255,255,0.08)"),
                    display:"flex", alignItems:"center", gap:14, textAlign:"left",
                    transition:"all .15s",
                  }}>
                    {/* Radio button */}
                    <div style={{ width:24, height:24, borderRadius:12, border:"2px solid " + (sel ? "#6ee7b7" : "rgba(255,255,255,0.25)"), display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, background: sel ? "rgba(110,231,183,0.1)" : "transparent" }}>
                      {sel && <div style={{ width:10, height:10, borderRadius:5, background:"#6ee7b7" }} />}
                    </div>
                    {/* Montant */}
                    <div style={{ flex:1, fontSize:18, fontWeight:700, color:"#ffffff" }}>
                      ${c.toLocaleString("en-US")}
                    </div>
                    {/* Badge frais */}
                    {fee && (
                      <div style={{ padding:"5px 12px", borderRadius:20, fontSize:13, fontWeight:600, background: sel ? "rgba(110,231,183,0.15)" : "rgba(255,255,255,0.06)", color: sel ? "#6ee7b7" : "rgba(255,255,255,0.4)" }}>
                        Frais : ${fee.toLocaleString("en-US")}
                      </div>
                    )}
                    {/* Checkmark */}
                    {sel && (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink:0 }}>
                        <path d="M4 10l4 4 8-8" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Carte info paiement unique */}
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(110,231,183,0.12)", borderRadius:18, padding:"16px 20px", display:"flex", alignItems:"flex-start", gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:20, background:"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:20 }}>🛡️</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#6ee7b7", marginBottom:4 }}>Paiement unique</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.5 }}>
                  Les frais sont payés une seule fois.<br/>Bonne chance pour ton challenge !
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Bouton Continuer ── */}
      <div style={{ padding:"20px 20px 0" }}>
        <button onClick={step === 0 ? () => {} : finish} style={{
          width:"100%", padding:"20px",
          borderRadius:100, background:"#6ee7b7",
          color:"#000000", fontSize:17, fontWeight:700,
          border:"none", cursor: step === 0 ? "default" : "pointer",
          opacity: step === 0 ? 0.5 : 1,
          boxShadow:"0 4px 24px rgba(110,231,183,0.2)",
          transition:"opacity .2s",
        }}>
          Continuer
        </button>
      </div>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════
// DASHBOARD (page d'accueil)
// ══════════════════════════════════════════════════════════════════
function DashboardScreen({ t, lang, user, profile, lastSim, goto, loadConfig }) {
  const firm = PROP_FIRMS[profile.firmKey] || PROP_FIRMS.fundednext;
  const fm = firm.models[lastSim?.modelKey] || firm.models["2step"] || Object.values(firm.models)[0];
  const [perfPeriod, setPerfPeriod] = useState("7J");
  const [configs, setConfigs] = useState(() => {
    try { const r=localStorage.getItem("eapropfirm_saved_configs"); return r?JSON.parse(r):[]; } catch(e){return [];}
  });
  const deleteConfig=(id)=>{ const n=configs.filter(c=>c.id!==id); setConfigs(n); try{localStorage.setItem("eapropfirm_saved_configs",JSON.stringify(n));}catch(e){} };
  const fmtMoney=(v,decimals=0)=>"$"+Math.abs(Number(v)).toLocaleString("en-US",{maximumFractionDigits:decimals});
  const ls = lastSim || {};
  const cap = ls.capital || profile.capital || 25000;
  const progression = ls.progression || 0;
  const phase1Target = ls.phase1Target || (fm?.phases?.[0]?.target*100) || 8;
  const phase1Pct = ls.phase1Pct || "0.0";
  const ddDayPct = ls.ddDayPct || "0.0";
  const ddTotPct = ls.ddTotPct || "0.0";
  const dailyDDLimit = ls.dailyDDLimit || (fm?.dailyDD*100) || 5;
  const totalDDLimit = ls.totalDDLimit || (fm?.totalDD*100) || 10;
  const splitStart = ls.splitStart || fm?.splitStart || 80;
  const splitMax = ls.splitMax || fm?.splitMax || 90;
  const wins = ls.wins || 0; const losses = ls.losses || 0;
  const totalTrades = ls.totalTrades || wins+losses;
  const wr = ls.winrate ? parseFloat(ls.winrate) : (totalTrades>0?wins/totalTrades*100:0);
  const rr = ls.rr || 2.0;
  const bestTrade = ls.bestTrade || 0; const worstTrade = ls.worstTrade || 0;
  const profitAmount = ls.profitAmount || 0;
  const tradingDays = ls.tradingDays || 0;
  const hasData = !!lastSim;

  // Courbe equity pour le graphique
  const equityCurve = (ls.equityCurve || []).filter((_,i)=>{
    const total = ls.equityCurve?.length || 1;
    if(perfPeriod==="7J") return i >= total-7;
    if(perfPeriod==="30J") return i >= total-30;
    if(perfPeriod==="90J") return i >= total-90;
    return true;
  });

  // Mini sparkline helper
  const Spark=({data,color,h=36,w=80})=>{
    if(!data||data.length<2) return null;
    const mn=Math.min(...data), mx=Math.max(...data), rng=mx-mn||1;
    const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-(v-mn)/rng*h}`).join(" ");
    return(
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs><linearGradient id={"spk"+color.replace("#","")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient></defs>
        <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#spk${color.replace("#","")})`}/>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  };

  const equityVals = equityCurve.map(d=>d.v);
  const chartMin = equityVals.length ? Math.min(...equityVals)*0.998 : cap*0.99;
  const chartMax = equityVals.length ? Math.max(...equityVals)*1.002 : cap*1.05;

  return (
    <div style={{fontFamily:"-apple-system, sans-serif",color:"#FFFFFF"}}>

      {/* ── HEADER ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button style={{width:38,height:38,borderRadius:10,background:"rgba(255,255,255,0.08)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <rect width="18" height="2" rx="1" fill="white"/><rect y="6" width="14" height="2" rx="1" fill="white"/><rect y="12" width="10" height="2" rx="1" fill="white"/>
            </svg>
          </button>
          <div>
            <div style={{fontSize:16,fontWeight:700}}>Bonjour, <span style={{fontWeight:900}}>{user?.name || "Trader"}</span> 👋</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>Prêt à simuler ton prochain challenge ?</div>
          </div>
        </div>
        <div style={{position:"relative"}}>
          <button style={{width:38,height:38,borderRadius:10,background:"rgba(255,255,255,0.08)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            <svg width="18" height="20" viewBox="0 0 18 20" fill="none"><path d="M9 0C6.8 0 5 1.8 5 4v1.1C3.4 5.9 2 7.8 2 10v4l-2 2v1h18v-1l-2-2v-4c0-2.2-1.4-4.1-3-4.9V4c0-2.2-1.8-4-4-4z" fill="white" opacity="0.8"/><path d="M7 18c0 1.1.9 2 2 2s2-.9 2-2H7z" fill="white" opacity="0.6"/></svg>
          </button>
          <div style={{position:"absolute",top:7,right:7,width:8,height:8,borderRadius:4,background:"#6ee7b7",border:"2px solid #000"}}/>
        </div>
      </div>

      {!hasData && (
        <div style={{margin:"16px",background:"rgba(110,231,183,0.05)",border:"1px solid rgba(110,231,183,0.15)",borderRadius:16,padding:"28px 20px",textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:12}}>🚀</div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>Lance ta première simulation</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:18}}>Tes statistiques apparaîtront ici après la simulation.</div>
          <button onClick={()=>goto("simulator")} style={{padding:"14px 28px",borderRadius:100,background:"#6ee7b7",color:"#000",fontSize:14,fontWeight:700,border:"none",cursor:"pointer"}}>Démarrer maintenant</button>
        </div>
      )}

      {hasData && (<>

      {/* ── SIMULATION EN COURS ── */}
      <div style={{margin:"14px 16px",background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",border:"1px solid rgba(255,255,255,0.09)",borderRadius:20,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing: -0.2,marginBottom:4}}>TA SIMULATION EN COURS</div>
            <div style={{fontSize:22,fontWeight:700,color:"#FFFFFF",fontFamily:"-apple-system, sans-serif",lineHeight:1}}>{firm.name}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:2}}>{fm?.name}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:2}}>Capital</div>
            <div style={{fontSize:22,fontWeight:900}}>{fmtMoney(cap)}</div>
          </div>
        </div>
        {/* Barre progression */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Progression globale</div>
          <div style={{fontSize:13,fontWeight:700,color:"#6ee7b7"}}>{progression}%</div>
        </div>
        <div style={{height:6,background:"rgba(255,255,255,0.08)",borderRadius:3,marginBottom:14,overflow:"hidden"}}>
          <div style={{height:"100%",width:progression+"%",background:"linear-gradient(90deg,#8B6010,#6ee7b7)",borderRadius:3,transition:"width .6s"}}/>
        </div>
        {/* 4 stat boxes */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
          {[
            {l:"Objectif Phase 1",v:phase1Target.toFixed(0)+"%",sub:"+"+phase1Pct+"% atteint",vc:"#6ee7b7"},
            {l:"DD journalier",v:dailyDDLimit+"%",sub:ddDayPct+"% utilisé",vc:"#fbbf24"},
            {l:"DD total",v:totalDDLimit+"%",sub:ddTotPct+"% utilisé",vc:"#f87171"},
            {l:"Profit split",v:splitStart+"-"+splitMax+"%",sub:ls.allPassed?"Atteint":"Non atteint",vc:"#FFFFFF"},
          ].map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"8px 6px",textAlign:"center"}}>
              <div style={{fontSize:8,color:"rgba(255,255,255,0.35)",marginBottom:3,lineHeight:1.2}}>{s.l}</div>
              <div style={{fontSize:15,fontWeight:700,color:s.vc}}>{s.v}</div>
              <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",marginTop:2}}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── APERÇU PERFORMANCE ── */}
      <div style={{margin:"0 16px 14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:1}}>Aperçu Performance</div>
          <div style={{display:"flex",gap:2}}>
            {["7J","30J","90J","Tout"].map(p=>(
              <button key={p} onClick={()=>setPerfPeriod(p)} style={{padding:"4px 8px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,
                background:perfPeriod===p?"#6ee7b7":"transparent",color:perfPeriod===p?"#000":"rgba(255,255,255,0.35)"}}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:12}}>
          {/* Stats gauche */}
          <div style={{display:"flex",flexDirection:"column",gap:10,minWidth:90}}>
            {[
              {l:"Profit",v:(profitAmount>=0?"+":"")+fmtMoney(profitAmount,2),c:profitAmount>=0?"#6ee7b7":"#f87171"},
              {l:"Trades",v:totalTrades},
              {l:"Winrate",v:wr.toFixed(1)+"%",c:"#FFFFFF"},
              {l:"Risque / Récompense",v:"1:"+rr,c:"#FFFFFF"},
            ].map((s,i)=>(
              <div key={i}>
                <div style={{fontSize: 11,color:"rgba(255,255,255,0.35)"}}>{s.l}</div>
                <div style={{fontSize:14,fontWeight:700,color:s.c||"#FFFFFF"}}>{s.v}</div>
              </div>
            ))}
          </div>
          {/* Graphique */}
          <div style={{flex:1,position:"relative",minHeight:120}}>
            {equityVals.length>1 ? (
              <svg width="100%" height="120" viewBox={`0 0 200 100`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="perf-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="perf-line" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#059669"/>
                    <stop offset="100%" stopColor="#6ee7b7"/>
                  </linearGradient>
                </defs>
                {(() => {
                  const n=equityVals.length;
                  const pts=equityVals.map((v,i)=>`${(i/(n-1))*200},${100-(v-chartMin)/(chartMax-chartMin)*95}`).join(" ");
                  const last=`200,${100-(equityVals[n-1]-chartMin)/(chartMax-chartMin)*95}`;
                  return(<>
                    <polygon points={`0,100 ${pts} ${last} 200,100`} fill="url(#perf-fill)"/>
                    <polyline points={pts} fill="none" stroke="url(#perf-line)" strokeWidth="2.5" strokeLinecap="round"/>
                  </>);
                })()}
                {/* Lignes horizontales guides */}
                {[25,50,75].map(y=><line key={y} x1="0" y1={y} x2="200" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
              </svg>
            ) : (
              <div style={{height:120,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.2)",fontSize:12}}>
                Lance une simulation pour voir la courbe
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RÈGLES DU CHALLENGE ── */}
      <div style={{margin:"0 16px 14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:1}}>Règles du Challenge</div>
          <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(110,231,183,0.3)",borderRadius:20,padding:"4px 10px"}}>
            <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill="rgba(110,231,183,0.2)"/><path d="M3 6l2 2 4-4" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span style={{fontSize:11,fontWeight:700,color:"#6ee7b7"}}>Conforme</span>
          </div>
        </div>
        {[
          {icon:"△",label:"Drawdown journalier",current:ddDayPct,limit:dailyDDLimit,warn:parseFloat(ddDayPct)>dailyDDLimit*0.7},
          {icon:"△",label:"Drawdown total",current:ddTotPct,limit:totalDDLimit,warn:parseFloat(ddTotPct)>totalDDLimit*0.7},
          {icon:"↗",label:"Objectif Phase 1",current:phase1Pct,limit:phase1Target.toFixed(0),ok:true},
          {icon:"◷",label:"Jours de trading minimum",current:tradingDays,limit:fm?.phases?.[0]?.minDays||5,unit:"jours",warn:tradingDays<(fm?.phases?.[0]?.minDays||5)},
        ].map((r,i)=>{
          const isOk = r.ok || (!r.warn && parseFloat(r.current)<r.limit);
          const iconColor = r.warn ? "#fbbf24" : isOk ? "#6ee7b7" : "#6ee7b7";
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.05)":"none"}}>
              <span style={{fontSize:16,color:iconColor,width:20,textAlign:"center",flexShrink:0}}>{r.icon}</span>
              <div style={{flex:1,fontSize:12,color:"rgba(255,255,255,0.7)"}}>{r.label}</div>
              <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.9)"}}>{r.current}{r.unit?" ":"% / "}{r.unit?(" / "+r.limit+" "+r.unit):r.limit+"%"}</div>
              <div style={{width:24,height:24,borderRadius:6,background:r.warn?"rgba(251,191,36,0.1)":"rgba(110,231,183,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {r.warn
                  ? <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1L13.5 13H0.5z" fill="none" stroke="#fbbf24" strokeWidth="1.2"/><text x="7" y="11" textAnchor="middle" fill="#fbbf24" fontSize="6" fontWeight="700">!</text></svg>
                  : <svg width="14" height="14" viewBox="0 0 14 14"><rect width="14" height="14" rx="3" fill="rgba(110,231,183,0.15)"/><path d="M3.5 7l2.5 2.5 4.5-4.5" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/></svg>
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 2 COLONNES : STATS + CONFIGS ── */}
      <div style={{margin:"0 16px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {/* STATISTIQUES */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:14}}>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing: -0.2,marginBottom:12}}>Statistiques</div>
          {/* Gauge winrate */}
          <div style={{position:"relative",width:80,height:80,margin:"0 auto 12px"}}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(110,231,183,0.1)" strokeWidth="8"/>
              <circle cx="40" cy="40" r="32" fill="none" stroke="#6ee7b7" strokeWidth="8"
                strokeDasharray={`${(wr/100)*201} 201`} strokeLinecap="round"
                transform="rotate(-90 40 40)"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#6ee7b7"}}>{wr.toFixed(1)}%</div>
              <div style={{fontSize:8,color:"rgba(255,255,255,0.4)"}}>Winrate</div>
            </div>
          </div>
          {[
            {l:"Trades gagnants",v:wins,c:"#6ee7b7"},
            {l:"Trades perdants",v:losses,c:"#f87171"},
            {l:"Winrate",v:wr.toFixed(1)+"%",c:"#6ee7b7"},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{s.l}</span>
              <span style={{fontSize:12,fontWeight:700,color:s.c}}>{s.v}</span>
            </div>
          ))}
          <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",marginTop:8,paddingTop:8}}>
            {[
              {l:"Meilleur trade",v:"+"+fmtMoney(bestTrade),c:"#6ee7b7"},
              {l:"Pire trade",v:"-"+fmtMoney(Math.abs(worstTrade)),c:"#f87171"},
            ].map((s,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{s.l}</span>
                <span style={{fontSize:12,fontWeight:700,color:s.c}}>{s.v}</span>
              </div>
            ))}
          </div>
          <button onClick={()=>goto("trades")} style={{width:"100%",marginTop:8,padding:"8px",borderRadius:10,background:"rgba(255,255,255,0.06)",border:"none",cursor:"pointer",color:"#6ee7b7",fontSize:11,fontWeight:700}}>
            Voir toutes les stats →
          </button>
        </div>

        {/* MES CONFIGS */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:14,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1}}>Configs</div>
            <button onClick={()=>goto("simulator")} style={{background:"none",border:"none",color:"#6ee7b7",fontSize:10,fontWeight:700,cursor:"pointer"}}>+ New</button>
          </div>
          {configs.length===0 ? (
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:8}}>
              <div style={{fontSize:26,opacity:0.3}}>📁</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>Aucune config sauvegardée</div>
            </div>
          ) : (
            <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
              {configs.slice(0,4).map(c=>{
                const cf=PROP_FIRMS[c.firmKey]||PROP_FIRMS.fundednext;
                return(
                  <div key={c.id} style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"8px 10px",borderLeft:"2px solid rgba(110,231,183,0.25)"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#FFFFFF",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
                    <div style={{fontSize: 11,color:"rgba(255,255,255,0.35)",marginTop:2}}>{cf.name} · WR {c.winrate}%</div>
                    <button onClick={()=>loadConfig(c)} style={{marginTop:6,width:"100%",padding:"4px",borderRadius:6,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(110,231,183,0.25)",color:"#6ee7b7",fontSize: 11,fontWeight:700,cursor:"pointer"}}>Charger</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      </>)}

      {/* ── CTA ── */}
      <div style={{margin:"0 16px 16px",background:"rgba(110,231,183,0.05)",border:"1px solid rgba(110,231,183,0.12)",borderRadius:20,padding:"16px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:46,height:46,borderRadius:12,background:"rgba(110,231,183,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:22}}>🎯</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>Reste focus et discipliné</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.4}}>Chaque jour est une étape de plus vers ta prochaine validation.</div>
        </div>
        <button onClick={()=>goto("simulator")} style={{padding:"12px 18px",borderRadius:16,background:"#6ee7b7",color:"#000",fontSize:12,fontWeight:700,border:"none",cursor:"pointer",flexShrink:0,lineHeight:1.3,textAlign:"center",whiteSpace:"nowrap"}}>
          Démarrer<br/>une simulation
        </button>
      </div>
    </div>
  );
}
function ProfileScreen({ t, lang, setLang, user, profile, setProfile, onLogout, onReset }) {
  const firm = PROP_FIRMS[profile.firmKey] || PROP_FIRMS.fundednext;
  const fmtMoney = (v) => "$" + Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 });

  const changeFirm = (k) => {
    const np = { ...profile, firmKey: k };
    setProfile(np); syncSimConfig({ firmKey: k }); saveApp({ profile: np });
  };
  const changeCapital = (c) => {
    const np = { ...profile, capital: c };
    setProfile(np); syncSimConfig({ capital: c }); saveApp({ profile: np });
  };
  const changeLang = (l) => {
    setLang(l);
    const np = { ...profile, lang: l };
    setProfile(np); saveApp({ profile: np });
  };

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "-apple-system, sans-serif", marginBottom: 16 }}>{t("prof_title")}</div>

      {/* Compte */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: -0.2, marginBottom: 10 }}>{t("prof_account")}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 23, background: "#6ee7b7", color: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>
            {(user.name || "?")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{user.email || t("prof_guest")}</div>
          </div>
        </div>
      </div>

      {/* Préférences */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: -0.2, marginBottom: 12 }}>{t("prof_prefs")}</div>

        {/* Langue */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>{t("prof_lang")}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ k: "fr", label: "🇫🇷 Français" }, { k: "en", label: "🇬🇧 English" }].map(o => (
              <button key={o.k} onClick={() => changeLang(o.k)} style={{
                flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
                background: lang === o.k ? "#6ee7b7" : "rgba(255,255,255,0.07)", color: lang === o.k ? "#000000" : "rgba(255,255,255,0.50)",
                border: "1px solid " + (lang === o.k ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
              }}>{o.label}</button>
            ))}
          </div>
        </div>

        {/* Prop firm */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>{t("prof_firm")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {Object.keys(PROP_FIRMS).map(k => {
              const f = PROP_FIRMS[k]; const sel = profile.firmKey === k;
              return (
                <button key={k} onClick={() => changeFirm(k)} style={{
                  padding: "9px 4px", borderRadius: 9, cursor: "pointer", fontSize: 11, fontWeight: 700,
                  background: sel ? "#FFFFFF" : "rgba(255,255,255,0.04)", color: sel ? "#000000" : "rgba(255,255,255,0.50)",
                  border: "1px solid " + (sel ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
                }}>{f.name}</button>
              );
            })}
          </div>
        </div>

        {/* Capital */}
        <div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>{t("prof_capital")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {CAPITAL_OPTIONS.map(c => {
              const sel = profile.capital === c;
              return (
                <button key={c} onClick={() => changeCapital(c)} style={{
                  padding: "10px 4px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700,
                  background: sel ? "#FFFFFF" : "rgba(255,255,255,0.04)", color: sel ? "#000000" : "rgba(255,255,255,0.50)",
                  border: "1px solid " + (sel ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
                }}>${c / 1000}K</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <button onClick={onLogout} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid #1e1e2e", cursor: "pointer", background: "rgba(255,255,255,0.05)", color: "#FFFFFF", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
        {t("prof_logout")}
      </button>
      <button onClick={() => { if (confirm(t("prof_reset_confirm"))) onReset(); }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid #ef444440", cursor: "pointer", background: "#2d0808", color: "#f87171", fontSize: 14, fontWeight: 700 }}>
        {t("prof_reset")}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// NAVBAR (bas d'écran)
// ══════════════════════════════════════════════════════════════════
function NavBar({ t, active, goto }) {
  const items = [
    { k:"dashboard", label:t("nav_dashboard"),
      icon:(on)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M2 9L11 2L20 9v11a1 1 0 01-1 1H14v-6H8v6H3a1 1 0 01-1-1V9z"
          fill={on?"#6ee7b7":"none"} stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.6" strokeLinejoin="round"/>
      </svg>},
    { k:"simulator", label:t("nav_simulator"),
      icon:(on)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="2" width="18" height="18" rx="4" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.6"/>
        <path d="M6 16L9 11l3 3 2-4 2 6" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>},
    { k:"trades", label:t("nav_trades"),
      icon:(on)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="6" width="18" height="12" rx="3" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.6"/>
        <path d="M7 2h8" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M7 11h4M7 14.5h7" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.4" strokeLinecap="round"/>
      </svg>},
    { k:"montecarlo", label:t("nav_montecarlo"),
      icon:(on)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="2" width="18" height="18" rx="4" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.6"/>
        <circle cx="7.5" cy="7.5" r="1.5" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="14.5" cy="7.5" r="1.5" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="7.5" cy="14.5" r="1.5" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="14.5" cy="14.5" r="1.5" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="11" cy="11" r="1.5" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
      </svg>},
    { k:"profile", label:t("nav_profile"),
      icon:(on)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="4" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.6"/>
        <path d="M3 20c0-4 3.6-7 8-7s8 3 8 7" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>},
  ];

  const navGoto=(k)=>{
    if(k==="trades"){goto("trades");}
    else if(k==="montecarlo"){goto("montecarlo");}
    else goto(k);
  };

  return (
    <div style={{
      position:"fixed",bottom:0,left:0,right:0,zIndex:100,maxWidth:480,margin:"0 auto",
      background:"rgba(20,15,5,0.95)",
      borderTop:"1px solid rgba(110,231,183,0.12)",
      backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)",
      paddingTop:10,
      paddingBottom:"calc(10px + env(safe-area-inset-bottom))",
    }}>
      <div style={{display:"flex",justifyContent:"space-around",alignItems:"flex-start"}}>
        {items.map(it=>{
          const on=active===it.k;
          return(
            <button key={it.k} onClick={()=>navGoto(it.k)} style={{
              flex:1,background:"none",border:"none",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"2px 0",
              position:"relative",
            }}>
              {on && <div style={{position:"absolute",top:-10,width:36,height:3,borderRadius:2,background:"#6ee7b7"}}/>}
              {it.icon(on)}
              <span style={{fontSize: 11,fontWeight:on?800:500,color:on?"#6ee7b7":"rgba(255,255,255,0.35)",letterSpacing:0.2}}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════
// ROOT — Routeur principal de l'application
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const app0 = loadApp();
  const [lang, setLangState] = useState(app0.profile?.lang ?? null); // null = pas encore choisi
  const [onboarded, setOnboarded] = useState(app0.onboarded ?? false);
  const [user, setUser] = useState(app0.user ?? null);
  const [setupDone, setSetupDone] = useState(app0.setupDone ?? false);
  const [profile, setProfile] = useState(app0.profile ?? { lang: "fr", firmKey: "fundednext", capital: 25000 });
  const [screen, setScreen] = useState("dashboard"); // écran de la navbar
  const [simTab, setSimTab] = useState("challenge");  // onglet interne du simulateur
  const [lastSim, setLastSim] = useState(app0.lastSim ?? null);
  const [simKey, setSimKey] = useState(0); // force remount du simulateur au chargement d'une config

  const t = makeT(lang);
  const setLang = (l) => { setLangState(l); saveApp({ profile: { ...profile, lang: l } }); };

  // Navigation depuis la navbar/dashboard
  const goto = (target) => {
    if (target === "simulator") { setSimTab("challenge"); setScreen("simulator"); }
    else if (target === "trades") { setSimTab("trades"); setScreen("simulator"); }
    else if (target === "montecarlo") { setSimTab("montecarlo"); setScreen("simulator"); }
    else setScreen(target);
  };
  // Pour la navbar : trades/montecarlo sont des onglets du simulateur
  const navActive = screen === "simulator"
    ? (simTab === "trades" ? "trades" : simTab === "montecarlo" ? "montecarlo" : "simulator")
    : screen;
  const navGoto = (k) => {
    if (k === "trades") { setSimTab("trades"); setScreen("simulator"); }
    else if (k === "montecarlo") { setSimTab("montecarlo"); setScreen("simulator"); }
    else if (k === "simulator") { setSimTab("challenge"); setScreen("simulator"); }
    else setScreen(k);
  };

  const handleSimResult = (r) => {
    setLastSim(r); saveApp({ lastSim: r });
  };

  // Charger une config sauvegardée depuis le Dashboard
  const loadConfig = (c) => {
    try {
      const raw = localStorage.getItem("eapropfirm_config");
      const cur = raw ? JSON.parse(raw) : {};
      const merged = { ...cur,
        firmKey: c.firmKey, modelKey: c.modelKey, capital: c.capital,
        winrate: c.winrate, tradesPerDay: c.tradesPerDay, dailyTargetPct: c.dailyTargetPct,
        riskPct: c.riskPct, clusteringPct: c.clusteringPct, maxConsecLosses: c.maxConsecLosses,
        instrument: c.instrument, lotSize: c.lotSize, slPips: c.slPips,
        useFixedLot: c.useFixedLot, split: c.split, newsImpact: c.newsImpact, activePreset: c.activePreset,
      };
      localStorage.setItem("eapropfirm_config", JSON.stringify(merged));
      // Mettre à jour le profil (firm/capital) pour cohérence Dashboard
      const np = { ...profile, firmKey: c.firmKey, capital: c.capital };
      setProfile(np); saveApp({ profile: np });
    } catch (e) {}
    setSimTab("challenge");
    setSimKey(k => k + 1); // force le simulateur à relire la config
    setScreen("simulator");
  };

  // ── Flow d'entrée ──
  // 0. Choix de la langue (tout premier écran)
  if (!lang) {
    return <LanguagePickerScreen onPick={(l) => { setLangState(l); saveApp({ profile: { ...loadApp().profile, lang: l } }); }} />;
  }
  if (!onboarded) {
    return <OnboardingScreen t={t} lang={lang} setLang={setLang} onDone={() => { setOnboarded(true); saveApp({ onboarded: true }); }} />;
  }
  if (!user) {
    return <LoginScreen t={t} lang={lang} setLang={setLang} onAuth={(u) => { setUser(u); saveApp({ user: u }); }} />;
  }
  if (!setupDone) {
    return <ProfileSetupScreen t={t} lang={lang} setLang={setLang} onDone={(p) => { setProfile(p); setSetupDone(true); }} />;
  }

  // ── App principale avec navbar ──
  const reset = () => {
    try { localStorage.removeItem(APP_KEY); localStorage.removeItem("eapropfirm_config"); } catch (e) {}
    setOnboarded(false); setUser(null); setSetupDone(false);
    setProfile({ lang: "fr", firmKey: "fundednext", capital: 25000 });
    setLastSim(null); setScreen("dashboard");
  };
  const logout = () => { setUser(null); saveApp({ user: null }); };

  return (
    <div style={{ background: "#06090f", minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      {/* Halo ambré subtil en arrière-plan */}
      <div style={{ position:"fixed", top:"-5%", left:"50%", transform:"translateX(-50%)", width:400, height:300, borderRadius:"50%", background:"radial-gradient(ellipse, rgba(16,185,129,0.12) 0%, transparent 70%)", pointerEvents:"none", zIndex:0 }} />
      <div style={{
        padding: "16px",
        paddingTop: "calc(16px + env(safe-area-inset-top))",
        paddingBottom: "calc(80px + env(safe-area-inset-bottom))",
        color: "#FFFFFF", fontFamily: "-apple-system, sans-serif",
        position: "relative", zIndex: 1,
      }}>
        {screen === "dashboard" && (
          <DashboardScreen t={t} lang={lang} user={user} profile={profile} lastSim={lastSim} goto={goto} loadConfig={loadConfig} />
        )}
        {screen === "simulator" && (
          <SimulatorScreen key={simKey} t={t} lang={lang} tab={simTab} setTab={setSimTab} onSimResult={handleSimResult} />
        )}
        {screen === "profile" && (
          <ProfileScreen t={t} lang={lang} setLang={setLang} user={user} profile={profile} setProfile={setProfile} onLogout={logout} onReset={reset} />
        )}
      </div>
      <NavBar t={t} active={navActive} goto={navGoto} />
    </div>
  );
}
