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

// MODELES FUNDEDNEXT - paramètres indicatifs 2026 (Stellar) — à vérifier sur le site officiel
// ══════════════════════════════════════════════════════════════════
// PROP FIRMS — paramètres indicatifs basés sur les grilles publiques 2026
// Les règles exactes peuvent changer : toujours vérifier sur le site de la firm
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
  let dayPeakPnl = 0;
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
    if (cumPnl > dayPeakPnl) dayPeakPnl = cumPnl;
    // DD journalier vérifié après CHAQUE trade (intraday réaliste)
    if (-dayLowPnl > dailyDDLimit) {
      return { dayEquity, dayPnl: dayEquity - equity, wins, losses, breached: true, dayLowPnl, dayPeakPnl };
    }
  }
  return { dayEquity, dayPnl: dayEquity - equity, wins, losses, breached: false, dayLowPnl, dayPeakPnl };
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
  let maxDD = 0;          // DD total depuis capital initial (en fraction)
  let maxDDTrailing = 0;  // DD trailing depuis le pic (en fraction)
  let maxDailyDD = 0;     // pire DD intraday d'une journée (en fraction)

  for (let d = 1; d <= SIM_DAYS; d++) {
    const res = simulateDay(equity, p.tradesPerDay, riskAmount, p.rr, nextTrade, dailyDDLimit);
    totalWins += res.wins;
    totalLosses += res.losses;
    equity = res.dayEquity;
    if (equity > peak) peak = equity;
    // DD total (depuis capital initial)
    const dd = (capital - equity) / capital;
    if (dd > maxDD) maxDD = dd;
    // DD trailing (depuis le pic atteint)
    const ddTrail = (peak - equity) / peak;
    if (ddTrail > maxDDTrailing) maxDDTrailing = ddTrail;
    // DD journalier (pire creux intraday du jour, en % du capital)
    const dayDD = Math.abs(res.dayLowPnl) / capital;
    if (dayDD > maxDailyDD) maxDailyDD = dayDD;

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
    maxDD: maxDD * 100,                   // DD total %
    maxDDAmount: maxDD * capital,
    maxDDTrailing: maxDDTrailing * 100,   // DD trailing %
    maxDailyDD: maxDailyDD * 100,         // DD journalier max %
  };
}

function simulateFunded(capital, months, model, p, split) {
  // Jours de trading par mois : 30 si weekend inclus, 21 sinon (jours ouvrés)
  const TD_MONTH_DYNAMIC = p.includeWeekend ? 30 : 21;
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
  const TD_MONTH = TD_MONTH_DYNAMIC;
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
      // Après versement du payout, le compte funded repart de sa base.
      // Le profit a été distribué (payout) → il ne reste PAS dans l'équité.
      // Évite le double comptage (profit cumulé ET versé).
      // Reset equity même si payout partiel (pendingPayout > 0 mais < seuil)
      // Évite la surestimation sur les petits comptes
      if (pendingPayout > 0 || payout > 0) equity = currentCapital;
    }

    let scalingNote = null;
    if (consecutiveProfitMonths >= 4 && payoutsInStreak >= 2) {
      scalingCount++;
      const addedCapital = capital * 0.40; // +40% du capital INITIAL
      currentCapital = currentCapital + addedCapital;
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


// ══════════════════════════════════════════════════════════════════
// INFO TIP — petit bouton ⓘ avec tooltip au tap
// ══════════════════════════════════════════════════════════════════
function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: 6 }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          width: 16, height: 16, borderRadius: "50%",
          background: open ? "rgba(110,231,183,0.25)" : "rgba(255,255,255,0.12)",
          border: "1px solid " + (open ? "#6ee7b7" : "rgba(255,255,255,0.25)"),
          color: open ? "#6ee7b7" : "rgba(255,255,255,0.55)",
          fontSize: 10, fontWeight: 700, lineHeight: "14px",
          cursor: "pointer", padding: 0, display: "inline-flex",
          alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "all .15s",
        }}
      >i</button>
      {open && (
        <>
          {/* Overlay transparent pour fermer au clic */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 998 }}
          />
          {/* Tooltip */}
          <div style={{
            position: "absolute", top: 22, left: "50%", transform: "translateX(-50%)",
            background: "#0f1a2e", border: "1px solid rgba(110,231,183,0.3)",
            borderRadius: 10, padding: "10px 12px",
            fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.55,
            width: 230, zIndex: 999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}>
            <div style={{ position: "absolute", top: -5, left: "50%",
              width: 8, height: 8, background: "#0f1a2e",
              border: "1px solid rgba(110,231,183,0.3)", borderBottom: "none", borderRight: "none",
              transform: "translateX(-50%) rotate(45deg)",
            }} />
            {text}
          </div>
        </>
      )}
    </span>
  );
}

function SimulatorScreen({ t = (k) => k, lang = "fr", tab = "challenge", setTab = () => {}, onSimResult = () => {}, displayMode = "advanced", usageType = "propfirm" }) {
  const isSimple = displayMode === "simple";
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
        instrument: "XAUUSD", lotSize: 0.1, slPips: 70,
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
        instrument: "XAUUSD", lotSize: 0.1, slPips: 70,
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
  const [slPips, setSlPips] = useState(saved.slPips ?? 70);
  const [useFixedLot, setUseFixedLot] = useState(saved.useFixedLot ?? false);
  const [newsImpact, setNewsImpact] = useState(saved.newsImpact ?? false);
  // Weekend inclus : par défaut désactivé pour prop firm (forex 24/5), libre pour classique
  const [includeWeekend, setIncludeWeekend] = useState(saved.includeWeekend ?? false);
  // payoutMonths = Set des mois DÉCOCHÉS (payout désactivé). Vide par défaut = TOUT COCHÉ.
  const [payoutMonths, setPayoutMonths] = useState(() => new Set());
  const togglePayoutMonth = (month) => setPayoutMonths(prev => {
    const next = new Set(prev);
    next.has(month) ? next.delete(month) : next.add(month);
    return next;
  });
  // Recalcule l'equity ET le payout ligne par ligne selon les coches.
  // Logique : mois coché (défaut) = payout sorti, equity repart de la base.
  //           mois décoché = profit reste dans l'equity du mois suivant.
  const computeEffectivePayouts = (data) => {
    if (!data) return {};
    const result = {};
    let accumulated = 0;

    data.forEach((r, i) => {
      // isChecked = VRAI si le mois N'EST PAS dans payoutMonths (= coché par défaut)
      const isChecked = !payoutMonths.has(r.month);
      // L'equity réelle de ce mois = equity simulée + ce qui s'est accumulé des mois précédents
      const baseEquity = r.equity; // equity originale de la simulation
      const effectiveEquity = +(baseEquity + accumulated).toFixed(2);
      const profitThisMonth = +(r.profitPct / 100 * (i === 0 ? baseEquity : data[i-1].equity)).toFixed(2);

      if (r.payout > 0) {
        if (isChecked) {
          // Payout coché : on sort le profit → equity repart de la base
          // Le payout effectif = payout simulé + accumulated (gains reportés)
          const effectivePayout = +(r.payout + accumulated * r.currentSplit / 100).toFixed(2);
          result[r.month] = {
            checked: true,
            effectiveEquity: baseEquity, // equity repart de la base après payout
            effectivePayout,
            profitPct: r.profitPct, // inchangé
          };
          accumulated = 0; // reset car on a versé
        } else {
          // Payout décoché : le profit reste dans l'equity
          const retainedProfit = r.payout / (r.currentSplit / 100); // profit brut = payout / split
          accumulated = +(accumulated + retainedProfit).toFixed(2);
          result[r.month] = {
            checked: false,
            effectiveEquity: +(baseEquity + accumulated).toFixed(2),
            effectivePayout: 0,
            profitPct: r.profitPct,
          };
        }
      } else {
        // Mois sans payout (perte ou profit < seuil)
        result[r.month] = {
          checked: false,
          effectiveEquity: +(baseEquity + accumulated).toFixed(2),
          effectivePayout: 0,
          profitPct: r.profitPct,
        };
      }
    });
    return result;
  }; // réduit le split pour les trades en fenêtre news
  const [sim, setSim] = useState(null);
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    try {
      const configToSave = {
        firmKey, modelKey, capital, riskPct: useFixedLot ? lotRiskPct : riskPct, dailyTargetPct, winrate,
        tradesPerDay, clusteringPct, maxConsecLosses, split, fundedMonths, includeWeekend,
        instrument, lotSize, slPips, useFixedLot, newsImpact, activePreset
      };
      localStorage.setItem("eapropfirm_config", JSON.stringify(configToSave));
      setSaveStatus("Enregistre");
      const t = setTimeout(() => setSaveStatus(""), 1500);
      return () => clearTimeout(t);
    } catch (e) { /* localStorage indisponible (artefact) - ignore */ }
  }, [firmKey, modelKey, capital, riskPct, dailyTargetPct, winrate, tradesPerDay, clusteringPct, maxConsecLosses, split, fundedMonths, instrument, lotSize, slPips, useFixedLot, includeWeekend]);

  const firm = PROP_FIRMS[firmKey] || PROP_FIRMS.fundednext;
  const firmModels = firm.models;
  const safeModelKey = firmModels[modelKey] ? modelKey : Object.keys(firmModels)[0];
  const model = firmModels[safeModelKey];
  const dailyTarget = dailyTargetPct / 100;
  const splitRate = split / 100;
  const clustering = clusteringPct / 100;
  const fee = challengeFee(capital);
  const w = winrate / 100;
  const monthlyTarget = dailyTarget * (includeWeekend ? 30 : 21);

  // ══════════════════════════════════════════════════════════════
  // MOTEUR DE RISQUE UNIVERSEL — indépendant du broker / plateforme
  // ──────────────────────────────────────────────────────────────
  // PRINCIPE : la SEULE source de vérité du risque est le montant en $
  // (ou en % du capital). Aucun pip n'entre dans la simulation.
  //
  //   risque_$ = capital × risk%          ← invariant, universel
  //
  // Les pips / lots ne servent QUE d'aide optionnelle pour reporter
  // l'ordre sur la plateforme du trader (couche d'affichage).
  // Voir docs/audit/risk_model_audit.md
  // ══════════════════════════════════════════════════════════════

  // Table d'AIDE à la conversion lot (NON utilisée dans la simulation)
  // pipValuePerLot = $ par pip pour 1.0 lot standard (valeurs indicatives 2026)
  const INSTRUMENTS = {
    // XAUUSD : 1 pip = 0.1, valeur = $10/pip/lot (ICMarkets, FTMO, FundedNext confirmé)
    "XAUUSD": { pipValuePerLot: 10.0,  pipSize: 0.10,   label: "Or / USD",        decimals: 2 },
    // XAGUSD : 1 pip = 0.001, valeur = $1/pip/lot (vérifié sur trades réels)
    "XAGUSD": { pipValuePerLot: 1.0,   pipSize: 0.001,  label: "Argent / USD",    decimals: 3 },
    "EURUSD": { pipValuePerLot: 10.0,  pipSize: 0.0001, label: "EUR / USD",       decimals: 5 },
    "GBPUSD": { pipValuePerLot: 10.0,  pipSize: 0.0001, label: "GBP / USD",       decimals: 5 },
    "AUDUSD": { pipValuePerLot: 10.0,  pipSize: 0.0001, label: "AUD / USD",       decimals: 5 },
    "NZDUSD": { pipValuePerLot: 10.0,  pipSize: 0.0001, label: "NZD / USD",       decimals: 5 },
    "USDJPY": { pipValuePerLot: 9.1,   pipSize: 0.01,   label: "USD / JPY",       decimals: 3 },
    "USDCHF": { pipValuePerLot: 10.2,  pipSize: 0.0001, label: "USD / CHF",       decimals: 5 },
    "USDCAD": { pipValuePerLot: 7.5,   pipSize: 0.0001, label: "USD / CAD",       decimals: 5 },
    "GBPJPY": { pipValuePerLot: 9.1,   pipSize: 0.01,   label: "GBP / JPY",       decimals: 3 },
    "EURJPY": { pipValuePerLot: 9.1,   pipSize: 0.01,   label: "EUR / JPY",       decimals: 3 },
    "NAS100": { pipValuePerLot: 1.0,   pipSize: 1.0,    label: "Nasdaq 100",      decimals: 1 },
    "US30":   { pipValuePerLot: 1.0,   pipSize: 1.0,    label: "Dow Jones 30",    decimals: 1 },
    "SP500":  { pipValuePerLot: 1.0,   pipSize: 0.1,    label: "S&P 500",         decimals: 1 },
    "BTCUSD": { pipValuePerLot: 1.0,   pipSize: 1.0,    label: "Bitcoin / USD",   decimals: 1 },
  };
  const instInfo = INSTRUMENTS[instrument] || INSTRUMENTS["XAUUSD"];
  const pipVal = instInfo.pipValuePerLot;

  // ── SOURCE DE VÉRITÉ DU RISQUE (universelle) ──
  // Mode % : risque = capital × risk%   |   Mode $ : risque saisi directement
  // En mode lot manuel : on convertit lot+SL en $ UNE fois pour obtenir le risque $,
  // puis on raisonne en $ partout ensuite (le pip ne sert qu'à cette conversion d'entrée).
  const lotRiskAmount = +(lotSize * pipVal * slPips).toFixed(2);   // aide à l'estimation
  const lotRiskPct    = capital > 0 ? +(lotRiskAmount / capital * 100).toFixed(3) : 0;

  // Le risque effectif : en mode %, c'est capital×risk% (universel, aucun pip).
  // En mode lot, on a converti une fois lot+SL → $.
  const effectiveRiskAmount = useFixedLot ? lotRiskAmount        : +(capital * (riskPct / 100)).toFixed(2);
  const effectiveRiskPct    = useFixedLot ? lotRiskPct           : riskPct;
  const effectiveRisk       = effectiveRiskPct / 100;            // fraction

  // ── AIDE À L'AFFICHAGE : lot suggéré pour un risque donné (optionnel) ──
  // lots = risque_$ / (valeur_pip × distance_SL_pips)
  const suggestedLot = (pipVal > 0 && slPips > 0)
    ? +(effectiveRiskAmount / (pipVal * slPips)).toFixed(2)
    : 0;
  const effectiveLot = useFixedLot ? lotSize : suggestedLot;

  // ══════════════════════════════════════════════════════════════
  // CALCUL DU RR REQUIS — formule d'espérance
  // Pour atteindre dailyTarget avec n trades/jour à winrate w :
  // E[jour] = n × risk × (w × RR − (1−w)) = dailyTarget
  // → RR = (dailyTarget/(n×risk) + (1−w)) / w
  // ══════════════════════════════════════════════════════════════
  const finalRR = (w > 0 && effectiveRisk > 0 && tradesPerDay > 0)
    ? +((dailyTarget / (tradesPerDay * effectiveRisk) + (1 - w)) / w).toFixed(2)
    : 0;
  const finalRRValid = finalRR > 0 && finalRR < 20;

  // ══════════════════════════════════════════════════════════════
  // ESPÉRANCE & MÉTRIQUES STATISTIQUES
  // ══════════════════════════════════════════════════════════════
  // Espérance par trade (en $) : E = risk × (w×RR − (1−w))
  const expectedPerTrade = effectiveRiskAmount * (w * finalRR - (1 - w));
  // Espérance journalière
  const expectedDailyPnL = tradesPerDay * expectedPerTrade;
  // Profit Factor théorique : (w × RR) / (1−w)
  const theoreticalPF = (1 - w) > 0 ? +((w * finalRR) / (1 - w)).toFixed(2) : 99;
  // Espérance mathématique normalisée (% du risque) : edge par trade
  const expectancyR = +(w * finalRR - (1 - w)).toFixed(3);
  // Ratio de Kelly (fraction optimale du capital à risquer) : f* = (w×RR − (1−w)) / RR
  const kellyFraction = finalRR > 0 ? +((w * finalRR - (1 - w)) / finalRR).toFixed(3) : 0;
  // Drawdown théorique attendu sur une série (basé sur maxConsecLosses)
  const expectedMaxDDAmount = maxConsecLosses * effectiveRiskAmount;
  const expectedMaxDDPct = capital > 0 ? +(expectedMaxDDAmount / capital * 100).toFixed(2) : 0;

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
    includeWeekend,
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
      const ddDayPct = (ph1.maxDailyDD || 0).toFixed(1);
      const ddTotPct = (model.ddType === "trailing" ? (ph1.maxDDTrailing || 0) : (ph1.maxDD || 0)).toFixed(1);
      const phase1Pct = ((ph1.profit || 0) * 100).toFixed(1);
      const tradingDays = ph1.tradingDays || 0;

      // Courbe equity (funded ou phase 1)
      const rawCurve = funded?.data
        ? funded.data.map((d, i) => ({ i: i + 1, v: +d.equity.toFixed(0) }))
        : (ph1.days || []).map((d, idx) => ({ i: idx + 1, v: d.equity }));
      const equityCurve = rawCurve.slice(0, 90);

      // ── Stats réelles de la simulation (toutes phases + funded) ──
      const allWins    = phaseResults.reduce((s, ph) => s + (ph?.totalWins  || 0), 0)
                       + (funded?.winMonths || 0);  // mois gagnants funded
      const allLosses  = phaseResults.reduce((s, ph) => s + (ph?.totalLosses || 0), 0)
                       + (funded?.lossMonths || 0);
      const totalTrades = (ph1.totalWins || 0) + (ph1.totalLosses || 0); // Phase 1 uniquement pour WR
      const tradeWR = ph1.tradeWinrate ? +ph1.tradeWinrate.toFixed(1) : winrate;

      // Meilleur et pire trade — lus depuis le dailyLog réel (pas théoriques)
      const allDailyLog = funded?.dailyLog || ph1?.days || [];
      let bestTrade = 0, worstTrade = 0;
      if (funded?.dailyLog?.length) {
        // Lire depuis le log journalier funded
        funded.dailyLog.forEach(d => {
          if (d.pnl > bestTrade)  bestTrade  = d.pnl;
          if (d.pnl < worstTrade) worstTrade = d.pnl;
        });
      }
      // Si pas de funded, utiliser les jours de phase 1
      if (bestTrade === 0 && worstTrade === 0 && ph1?.days?.length) {
        let prevEq = capital;
        ph1.days.forEach(d => {
          const dayPnl = d.equity - prevEq;
          if (dayPnl > bestTrade)  bestTrade  = +dayPnl.toFixed(2);
          if (dayPnl < worstTrade) worstTrade = +dayPnl.toFixed(2);
          prevEq = d.equity;
        });
      }
      bestTrade  = +bestTrade.toFixed(2);
      worstTrade = +worstTrade.toFixed(2);

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
        totalTrades,
        wins:  ph1.totalWins  || 0,
        losses: ph1.totalLosses || 0,
        tradeWinsAllPhases: allWins,
        tradeLossesAllPhases: allLosses,
        bestTrade, worstTrade,
        profitAmount: +((ph1.profit || 0) * capital).toFixed(2),
        // ── Funded complet pour Dashboard ──
        funded: funded ? {
          data: funded.data || [],
          dailyLog: funded.dailyLog || [],
          finalEquity: funded.finalEquity || capital,
          cumulPayout: funded.cumulPayout || 0,
          pendingPayout: funded.pendingPayout || 0,
          status: funded.status || "active",
        } : null,
      });
    } catch (e) {}
  }, [firmKey, modelKey, capital, riskPct, dailyTargetPct, winrate, tradesPerDay, clusteringPct, maxConsecLosses, splitRate, fundedMonths, seed, useFixedLot, lotSize, slPips, instrument, newsImpact, includeWeekend]);

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
        return { label: "ECHEC - " + model.phases[i].label, color: "#ef4444", bg: "rgba(239,68,68,0.08)", emoji: "ROUGE" };
      if (ph && ph.status === "running_ok")
        return { label: "EN COURS - " + model.phases[i].label, color: "#fbbf24", bg: "rgba(251,191,36,0.08)", emoji: "ORANGE" };
    }
    if (!sim.funded) return null;
    if (sim.funded.status.startsWith("failed"))
      return { label: "COMPTE FERME", color: "#ef4444", bg: "rgba(239,68,68,0.08)", emoji: "ROUGE" };
    return { label: "COMPTE ACTIF", color: "#6ee7b7", bg: "rgba(255,255,255,0.05)", emoji: "VERT" };
  };
  const gs = globalStatus();
  const dot = (e) => e === "VERT" ? "\u{1F7E2}" : e === "ORANGE" ? "\u{1F7E0}" : "\u{1F534}";

  const phaseIcon = (s) => {
    if (s === "passed") return { icon: "\u2713", color: "#6ee7b7", bg: "rgba(255,255,255,0.05)", label: "PASSE" };
    if (s === "running_ok") return { icon: "~", color: "#fbbf24", bg: "rgba(251,191,36,0.08)", label: "EN COURS" };
    if (s && s.startsWith("failed")) return { icon: "\u2717", color: "#ef4444", bg: "rgba(239,68,68,0.08)", label: "ECHOUE" };
    return { icon: "-", color: "rgba(255,255,255,0.65)", bg: "rgba(255,255,255,0.05)", label: "N/A" };
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
    txt += "RR cible    : 1:" + finalRR.toFixed(2) + "\n";
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
      txt += "Payouts encaissés    : " + fmt(f.finalEquity) + "\n";
      txt += "Payout verse     : " + fmt2(f.cumulPayout) + "\n";
      txt += "En attente       : " + fmt2(f.pendingPayout) + "\n";
      txt += "Mois gagnants       : " + f.winrateMonth.toFixed(0) + "%\n";
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
    const n10 = Math.ceil(capital * model.totalDD / lotRiskAmount);
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
      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 6, textTransform: "uppercase" }}>Diagnostic FundedNext</div>
      {_d.chks.map(([ok, l, v, e]) => (
        <div key={l} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6, background: ok ? "rgba(255,255,255,0.05)" : "rgba(239,68,68,0.08)", border: "1px solid " + (ok ? "#6ee7b730" : "#ef444430"), borderRadius: 8, padding: "7px 10px" }}>
          <span style={{ fontSize: 12, color: ok ? "#6ee7b7" : "#ef4444" }}>{ok ? "+" : "x"}</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: ok ? "#6ee7b7" : "#ef4444" }}>{l}</div>
            <div style={{ fontSize: 10, color: ok ? "rgba(255,255,255,0.55)" : "#fca5a5" }}>{ok ? v : e}</div>
          </div>
        </div>
      ))}
      <div style={{ background: lotRiskPct > 0.5 ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.05)", border: "1px solid " + (lotRiskPct > 0.5 ? "#6ee7b740" : "#6ee7b740"), borderRadius: 8, padding: "8px 10px", fontSize: 11 }}>
        <b style={{ color: "rgba(255,255,255,0.55)" }}>Resume: </b><span style={{ color: "#FFFFFF" }}>{_d.resume}</span>
      </div>
    </div>
  ) : null;

  // Sauvegarder la config courante dans la liste des configs (Dashboard)
  const [lastSavedCfgKey, setLastSavedCfgKey] = useState(null);
  const currentCfgKey = [firmKey, safeModelKey, capital, winrate, tradesPerDay, dailyTargetPct, riskPct, clusteringPct, maxConsecLosses, instrument, lotSize, slPips, useFixedLot, split, newsImpact].join("|");
  const configChanged = currentCfgKey !== lastSavedCfgKey;

  const saveCurrentConfig = () => {
    if (!configChanged) return;
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
      localStorage.setItem("eapropfirm_saved_configs", JSON.stringify(list.slice(0, 3)));
      setSaveStatus(t("sim_config_saved"));
      setLastSavedCfgKey(currentCfgKey);
      setTimeout(() => setSaveStatus(""), 2500);
    } catch (e) {}
  };


  return (
    <div style={{ fontFamily: "-apple-system, sans-serif", color: "#FFFFFF" }}>
      <style>{`
        * { box-sizing: border-box; }
        .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(110,231,183,0.10); border-radius: 16px; padding: 16px; margin-bottom: 12px; }
        .tab-btn { padding: 7px 12px; border-radius: 8px; border: none; cursor: pointer; font-size: 11px; font-weight: 700; font-family: -apple-system, sans-serif; }
        .tab-btn.on { background: #6ee7b7; color: #000000; font-weight: 600; }
        .tab-btn.off { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.75); border: 1px solid rgba(255,255,255,0.10); }
        .model-btn { flex: 1; padding: 10px 6px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 600; font-family: -apple-system, sans-serif; border: 1px solid rgba(255,255,255,0.10); transition: all .15s; }
        .model-btn.on { background: #6ee7b7; color: #000000; border-color: #6ee7b7; }
        .model-btn.off { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.65); border: 1px solid rgba(255,255,255,0.10); }
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

      {/* Toggle Challenge / Funded — segmented control élégant */}
      {(tab === "challenge" || tab === "funded") && (
        <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, border: "1px solid rgba(255,255,255,0.08)" }}>
          {[{ id: "challenge", label: "Challenge" }, { id: "funded", label: "Funded" }].map(tg => (
            <button key={tg.id} onClick={() => setTab(tg.id)} style={{
              flex: 1, padding: "11px", borderRadius: 9, cursor: "pointer", fontSize: 14, fontWeight: 600,
              background: tab === tg.id ? "#6ee7b7" : "transparent",
              color: tab === tg.id ? "#000000" : "rgba(255,255,255,0.6)",
              border: "none", transition: "all .2s",
            }}>{tg.label}</button>
          ))}
        </div>
      )}

      {/* ══ CARTES CONFIG — vue simulateur uniquement (Challenge/Funded) ══ */}
      {(tab === "challenge" || tab === "funded") && (<>

      {/* MODELE */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.2 }}>
          Modele {firm.name}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.keys(firmModels).map(k => (
            <button key={k} className={"model-btn " + (safeModelKey === k ? "on" : "off")} onClick={() => setModelKey(k)}
              style={{ flex: "1 1 auto", minWidth: 80,
                background: safeModelKey === k ? "#6ee7b7" : "rgba(255,255,255,0.07)",
                color: safeModelKey === k ? "#000000" : "rgba(255,255,255,0.65)",
                borderColor: safeModelKey === k ? "#6ee7b7" : "rgba(255,255,255,0.08)" }}>
              {firmModels[k].name.replace(firm.name + " ", "").replace("Stellar ", "")}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
          {model.phases.map(ph => ph.label + " " + (ph.target * 100) + "%").join(" / ")}
          {" - DD jour " + (model.dailyDD * 100) + "% - DD total " + (model.totalDD * 100) + "% (" + (model.ddType === "trailing" ? "trailing" : "fixe") + ")"}
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          Split {model.splitStart}% - {model.splitMax}% | Payout {model.payoutCycle}j | Min {model.phases[0].minDays}j/phase | Frais ~{fmt(fee)}
        </div>
        {model.eaForbidden && (
          <div style={{ marginTop: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "8px 10px", fontSize: 11, color: "#fca5a5", lineHeight: 1.5 }}>
            EA INTERDIT sur ce modele. Trading manuel uniquement.
          </div>
        )}
        {model.newsForbidden && (
          <div style={{ marginTop: 8, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(110,231,183,0.20)", borderRadius: 12, padding: "8px 10px", fontSize: 11, color: "#fbbf24", lineHeight: 1.5 }}>
            NEWS TRADING & HFT INTERDITS sur cette firm. Active "Impact news" pour simuler.
          </div>
        )}
      </div>

      {/* STATUT */}
      {gs && (
        <div style={{ background: gs.bg, border: "1px solid " + gs.color + "30", borderRadius: 16, padding: "14px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: gs.color }}>{gs.label}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
              {bilan ? "Resultat net : " + fmt2(bilan.net) : "Resultat challenge"}
            </div>
          </div>
          <div style={{ fontSize: 26 }}>{dot(gs.emoji)}</div>
        </div>
      )}

      {/* CARTE DRAWDOWN ESTIME — mode avancé uniquement */}
      {!isSimple && dda && (
        <div className="card" >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
            Analyse Drawdown - Ta config
          </div>

          {/* Jauge DD */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.65)" }}>DD atteint cette simulation</span>
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
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Perte max 1 jour</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24" }}>{dda.maxDayLossPct.toFixed(2)}%</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{fmt2(dda.maxDayLoss)}</div>
            </div>
            <div className="kpi">
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Jours full-perte DD total</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>{dda.daysToTotalDD}j</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>avant limite {(model.totalDD*100)}%</div>
            </div>
            <div className="kpi">
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>DD journalier franchissable</div>
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
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Marge restante</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: dda.distancePct > 5 ? "#6ee7b7" : "#ef4444" }}>
                {dda.distancePct > 0 ? dda.distancePct.toFixed(2) + "%" : "DEPASSE"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{dda.distancePct > 0 ? fmt2(dda.distanceAmt) + " restants" : "compte ferme"}</div>
            </div>
          </div>

          <div style={{ marginTop: 10, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "8px 10px", fontSize: 11, lineHeight: 1.5 }}>
            <span style={{ color: "rgba(255,255,255,0.65)" }}>Lecture : </span>
            {dda.canBreachDaily
              ? <span style={{ color: "#ef4444" }}>Attention - avec {tradesPerDay} trades a {riskPct}% tu peux declencher le DD journalier en 1 seule journee. Reduis le risque/trade ou le nombre de trades.</span>
              : <span style={{ color: "#6ee7b7" }}>Securise - le DD journalier {(model.dailyDD*100)}% est inatteignable en 1 jour avec ta config ({dda.maxDayLossPct.toFixed(2)}% max). Seule une accumulation sur {dda.daysToTotalDD}+ jours perdants peut te sortir.</span>
            }
          </div>
        </div>
      )}
      <div className="card" style={{ border: "1px solid rgba(110,231,183,0.10)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: wrColor, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center" }}>Winrate global<InfoTip text="Pourcentage de trades gagnants. Ex : 55% = sur 100 trades, 55 sont gagnants. Plus c'est élevé, mieux c'est — mais un bon RR peut compenser un winrate bas." /></span>
          <span style={{ fontSize: 24, fontWeight: 700, color: wrColor }}>{winrate}%</span>
        </div>
        <input type="range" min={30} max={90} step={1} value={winrate} onChange={e => setWinrate(parseInt(e.target.value))} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
          <span>30%</span><span>60%</span><span>90%</span>
        </div>
        <div style={{ marginTop: 8, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "8px 10px", fontSize: 11, color: finalRRValid ? "#6ee7b7" : "#ef4444" }}>
          {finalRRValid
            ? <>RR cible : <b>1:{finalRR.toFixed(2)}</b> (gain {fmt2(effectiveRiskAmount * finalRR)} / perte {fmt2(effectiveRiskAmount)})</>
            : <>RR impossible ou &gt; 20 - winrate trop bas pour cet objectif.</>}
        </div>
      </div>

      {/* JAUGE CLUSTERING + MAX PERTES CONSECUTIVES — mode avancé uniquement */}
      {!isSimple && <div className="card" style={{ border: "1px solid rgba(110,231,183,0.10)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: clColor, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center" }}>Clustering des pertes<InfoTip text="Simule le réalisme psychologique : les pertes arrivent-elles en séries ? 0% = trades indépendants (théorique). 40-60% = réaliste. Plus c'est élevé, plus tu vivras de longues séries noires." /></span>
          <span style={{ fontSize: 24, fontWeight: 700, color: clColor }}>{clusteringPct}%</span>
        </div>
        <input type="range" min={0} max={100} step={5} value={clusteringPct} onChange={e => setClusteringPct(parseInt(e.target.value))} />
        <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
          0% = trades independants (theorique). Plus c'est haut, plus les pertes arrivent en
          <b style={{ color: clColor }}> series noires</b>. Recommande : 35-50%.
        </div>

        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center" }}>
              Max pertes consecutives EA<InfoTip text="Le pire enchaînement de pertes connu de ton EA ou ta stratégie. Si ton EA a déjà perdu 6 fois de suite, mets 6. Cela calcule le risque max réel sur une journée." />
            </span>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#6ee7b7" }}>{maxConsecLosses}</span>
          </div>
          <input type="range" min={1} max={20} step={1} value={maxConsecLosses} onChange={e => setMaxConsecLosses(parseInt(e.target.value))} style={{ accentColor: "#6ee7b7" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
            <span>1</span><span>5</span><span>10</span><span>20</span>
          </div>
          <div style={{ marginTop: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(110,231,183,0.15)", borderRadius: 12, padding: "8px 10px", fontSize: 11, lineHeight: 1.6 }}>
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
      </div>}

      {/* CARTE LOT / INSTRUMENT — mode avancé uniquement */}
      {!isSimple && <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 1 }}>Lot & Instrument</span>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>Activer</span>
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
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginBottom: 3, fontWeight: 700 }}>Instrument</div>
            <select value={instrument} onChange={e => setInstrument(e.target.value)}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, color: "#FFFFFF", padding: "8px 6px", width: "100%", fontSize: 12 }}>
              {Object.keys(INSTRUMENTS).map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          {/* Lot */}
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginBottom: 3, fontWeight: 700 }}>Lot size</div>
            <input type="number" value={lotSize} min={0.01} max={10} step={0.01}
              onChange={e => setLotSize(parseFloat(e.target.value) || 0.01)}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#FFFFFF", padding: "5px 6px", width: "100%", fontSize: 13 }} />
          </div>
          {/* SL pips */}
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginBottom: 3, fontWeight: 700 }}>SL (pips)</div>
            <input type="number" value={slPips} min={1} max={5000} step={1}
              onChange={e => setSlPips(parseInt(e.target.value) || 1)}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#FFFFFF", padding: "5px 6px", width: "100%", fontSize: 13 }} />
          </div>
        </div>

        {/* Résultat calculé */}
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Risque/trade</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#6ee7b7" }}>{fmt2(effectiveRiskAmount)}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>% du capital</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: effectiveRiskPct > 1 ? "#ef4444" : effectiveRiskPct > 0.5 ? "#fbbf24" : "#6ee7b7" }}>
                {effectiveRiskPct.toFixed(2)}%
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Perte max/jour</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>{fmt2(effectiveRiskAmount * tradesPerDay)}</div>
            </div>
          </div>
        </div>

        {/* Lot suggéré (mode % risque) */}
        {!useFixedLot && suggestedLot > 0 && (
          <div style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.2)", borderRadius: 12, padding: "10px 12px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>Lot suggéré pour ce risque</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{instInfo.label} · SL {slPips} pips</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#6ee7b7" }}>{suggestedLot}</div>
          </div>
        )}

        {/* Métriques statistiques avancées — mode avancé uniquement */}
        {!isSimple && <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Statistiques calculées</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { l: "Espérance / trade", v: (expectedPerTrade >= 0 ? "+" : "") + fmt2(expectedPerTrade), c: expectedPerTrade >= 0 ? "#6ee7b7" : "#f87171" },
              { l: "Espérance / jour", v: (expectedDailyPnL >= 0 ? "+" : "") + fmt2(expectedDailyPnL), c: expectedDailyPnL >= 0 ? "#6ee7b7" : "#f87171" },
              { l: "Profit Factor théo.", v: theoreticalPF >= 99 ? "∞" : theoreticalPF, c: theoreticalPF >= 1.5 ? "#6ee7b7" : theoreticalPF >= 1 ? "#fbbf24" : "#ef4444" },
              { l: "Edge (R)", v: (expectancyR >= 0 ? "+" : "") + expectancyR + "R", c: expectancyR > 0 ? "#6ee7b7" : "#ef4444" },
              { l: "Kelly optimal", v: (kellyFraction * 100).toFixed(1) + "%", c: "rgba(255,255,255,0.85)" },
              { l: "DD attendu (série)", v: expectedMaxDDPct.toFixed(1) + "%", c: expectedMaxDDPct > (model.totalDD * 100 * 0.7) ? "#ef4444" : expectedMaxDDPct > (model.totalDD * 100 * 0.4) ? "#fbbf24" : "#6ee7b7" },
            ].map(s => (
              <div key={s.l} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 7, padding: "7px 9px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>{s.l}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.c }}>{s.v}</span>
              </div>
            ))}
          </div>
          {kellyFraction > 0 && effectiveRisk > kellyFraction && (
            <div style={{ marginTop: 8, fontSize: 10, color: "#fbbf24", lineHeight: 1.4 }}>
              ⚠ Ton risque ({effectiveRiskPct.toFixed(2)}%) dépasse le Kelly optimal ({(kellyFraction * 100).toFixed(1)}%). Risque de ruine accru.
            </div>
          )}
        </div>}

        {/* Diagnostic de compatibilité FundedNext */}
        {!isSimple && lotDiagJSX}

        {/* TOGGLE IMPACT ANNONCES NEWS */}
        <div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10 }}>
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
            <div style={{ marginTop: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", borderRadius: 12, padding: "7px 10px", fontSize: 10, color: "#fca5a5", lineHeight: 1.5 }}>
              Simulation: ~15% des trades touches par une annonce.<br/>
              Split effectif reduit de {(splitRate * 100).toFixed(0)}% a {(effectiveSplitRate * 100).toFixed(1)}%
              {" "}(85% normal + 15% x 40% = {(effectiveSplitRate * 100).toFixed(1)}%).<br/>
              Pertes en news = 100% comptabilisees (deja inclus dans simulation).
            </div>
          )}
        </div>

        {/* TOGGLE WEEKEND INCLUS */}
        <div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: includeWeekend ? "#6ee7b7" : "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center" }}>
                Weekend inclus
                <InfoTip text={usageType === "classic"
                  ? "Trading classique : active le weekend pour trader 7j/7 (crypto, indices 24/7). Désactivé = lundi à vendredi uniquement."
                  : "La plupart des prop firms ferment le forex le weekend (marché fermé). Active uniquement si tu trades du crypto le weekend (FTMO, FundingPips l'autorisent). Désactivé = lundi à vendredi (21 jours/mois)."} />
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2, lineHeight: 1.4 }}>
                {includeWeekend
                  ? "Trading 7j/7 — 30 jours/mois simulés (crypto, indices 24/7)"
                  : "Lundi → Vendredi — 21 jours ouvrés/mois (forex 24/5)"}
              </div>
            </div>
            <div onClick={() => setIncludeWeekend(v => !v)} style={{
              width: 36, height: 20, borderRadius: 10, background: includeWeekend ? "#6ee7b7" : "rgba(255,255,255,0.08)",
              border: "1px solid " + (includeWeekend ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
              position: "relative", cursor: "pointer", transition: "all .2s", flexShrink: 0, marginLeft: 10
            }}>
              <div style={{ position: "absolute", top: 2, left: includeWeekend ? 18 : 2, width: 14, height: 14, borderRadius: 7, background: "#fff", transition: "all .2s" }} />
            </div>
          </div>
          {includeWeekend && usageType !== "classic" && (
            <div style={{ marginTop: 6, background: "rgba(110,231,183,0.06)", border: "1px solid rgba(110,231,183,0.18)", borderRadius: 12, padding: "7px 10px", fontSize: 10, color: "#6ee7b7", lineHeight: 1.5 }}>
              ⚠️ Vérifie les règles de ta prop firm : le forex est fermé le weekend. Le weekend ne s'applique qu'au crypto/indices 24/7 selon les firms.
            </div>
          )}
        </div>
      </div>}

      {/* Bandeau mode débutant — affiché uniquement en mode simple */}
      {isSimple && (
        <div style={{ background:"rgba(110,231,183,0.06)", border:"1px solid rgba(110,231,183,0.15)", borderRadius:14, padding:"12px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 16V9" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 9C9 5 5 4 4 5c0 3 3 4 5 4" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 12c0-3 4-4 5-3 0 3-3 4-5 4" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#6ee7b7" }}>Mode débutant actif</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:1 }}>
              Affichage simplifié. Modifiable dans Profil.
            </div>
          </div>
        </div>
      )}

      {/* PARAMETRES */}
      <div className="card">
        {/* C7 — Question principale (raisonnement gestionnaire de risque) */}
        <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginBottom: 3 }}>
            Combien risquez-vous par trade ?
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
            Définissez votre risque en % du capital. Tout le reste en découle automatiquement.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* Capital */}
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginBottom: 3, fontWeight: 700 }}>Capital ($)</div>
            <input type="number" value={capital} min={6000} max={200000} step={1000} onChange={e => setCapital(parseFloat(e.target.value) || 0)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#FFFFFF", padding: "5px 8px", width: "100%", fontSize: 13 }} />
            <input type="range" min={6000} max={200000} step={1000} value={capital} onChange={e => setCapital(parseFloat(e.target.value))} />
          </div>

          {/* Risque/trade - C7 débutant + C2 hiérarchie */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", fontWeight: 700, display: "flex", alignItems: "center" }}>Risque par trade (%)<InfoTip text="% de ton capital perdu si le trade touche ton stop-loss. Règle d'or : ne jamais dépasser 1-2%. Ex : 0.5% sur 10 000$ = 50$ max perdu par trade." /></span>

            </div>
            <input
              type="number"
              value={useFixedLot ? +effectiveRiskPct.toFixed(2) : riskPct}
              min={0.05} max={5} step={0.05}
              readOnly={useFixedLot}
              onChange={e => !useFixedLot && setRiskPct(parseFloat(e.target.value) || 0)}
              style={{
                background: useFixedLot ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.05)",
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
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>
                    ({(slPips * instInfo.pipSize).toFixed(instInfo.decimals > 2 ? 4 : 1)} pts)
                  </span>
                </div>
              : <input type="range" min={0.05} max={2} step={0.05} value={riskPct} onChange={e => setRiskPct(parseFloat(e.target.value))} />
            }
          </div>

          {[
            { label: "Trades/jour", tip: "Nombre de trades que tu passes par jour. 1 trade/jour = scalping tranquille. 5+ = actif. Influe sur la fréquence des gains ET des pertes.", val: tradesPerDay, set: (v) => setTradesPerDay(Math.round(v)), min: 1, max: 15, step: 1 },
            { label: "Objectif/jour (%)", tip: "Gain quotidien visé en % du capital. Ex : 0.3% sur 10 000$ = objectif 30$/jour. Les prop firms demandent souvent 8-10% sur 30 jours. Ne pas viser trop haut — le risque monte avec l'objectif.", val: dailyTargetPct, set: setDailyTargetPct, min: 0.05, max: 1.5, step: 0.05 },
            { label: "Split (%)", tip: "% des profits que tu gardes sur le compte financé. Ex : 80% = pour 1000$ de profit, tu reçois 800$ et la firm garde 200$.", val: split, set: setSplit, min: 80, max: 95, step: 5 },
            { label: "Mois Funded", tip: "Durée simulée sur le compte financé après avoir réussi le challenge. Ex : 12 mois = projection de tes gains sur 1 an en tant que trader financé.", val: fundedMonths, set: setFundedMonths, min: 1, max: 60, step: 1 },
          ].map((f) => (
            <div key={f.label}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginBottom: 3, fontWeight: 700, display: "flex", alignItems: "center" }}>{f.label}{f.tip && <InfoTip text={f.tip} />}</div>
              <input type="number" value={f.val} min={f.min} max={f.max} step={f.step} onChange={e => f.set(parseFloat(e.target.value) || 0)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#FFFFFF", padding: "5px 8px", width: "100%", fontSize: 13 }} />
              <input type="range" min={f.min} max={f.max} step={f.step} value={f.val} onChange={e => f.set(parseFloat(e.target.value))} />
            </div>
          ))}
        </div>

        {/* Résumé paramètres */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <div style={{ background: useFixedLot ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.05)", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: useFixedLot ? "#6ee7b7" : "#fbbf24", border: useFixedLot ? "1px solid rgba(110,231,183,0.15)" : "none" }}>
            Risque : <b>{fmt2(effectiveRiskAmount)}</b>/trade = <b>{effectiveRiskPct.toFixed(2)}%</b>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "8px 10px", fontSize: 11, color: "#6ee7b7" }}>
            Objectif : <b>{fmt2(capital * dailyTarget)}</b>/jour
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginLeft: 4 }}>
              (E espéré : {fmt2(Math.max(0, expectedDailyPnL))}/j)
            </span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "8px 10px", fontSize: 11, color: "rgba(255,255,255,0.55)", gridColumn: "1 / 3" }}>
            Profit equiv. : <b>{(monthlyTarget * 100).toFixed(1)}% / mois</b> - frais : <b>{fmt(fee)}</b> - RR : <b style={{ color: finalRR < 1.5 ? "#6ee7b7" : finalRR < 2.5 ? "#fbbf24" : "#ef4444" }}>1:{finalRR.toFixed(2)}</b>
          </div>
        </div>
        <button onClick={() => setSeed(s => s + 1)}
          style={{ marginTop: 10, width: "100%", padding: 9, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, color: "#FFFFFF", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Nouvelle simulation
        </button>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={copyReport}
            style={{ flex: 1, padding: 9, background: copied ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.07)", border: copied ? "1px solid #6ee7b7" : "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: copied ? "#6ee7b7" : "#FFFFFF", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {copied ? "✓ Copié !" : "Copier le rapport"}
          </button>
          <button onClick={printReport}
            style={{ flex: 1, padding: 9, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#FFFFFF", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Imprimer / PDF
          </button>
        </div>
        {/* C4 — Estimation de réalisme */}
        <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 10, fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, textAlign: "center" }}>
          Les résultats réels peuvent être inférieurs de 5 à 15 % à cause du spread, du slippage et des conditions de marché.
        </div>
      </div>

      {/* BILAN FINANCIER NET */}
      {bilan && (
        <div className="card" style={{ border: "1px solid rgba(110,231,183,0.10)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Bilan Financier Net</div>
          {[
            { label: "Reward challenge (15%)", val: "+" + fmt2(bilan.reward), color: "#6ee7b7" },
            { label: "Payouts funded verses", val: "+" + fmt2(bilan.payout), color: "#6ee7b7" },
            { label: "En attente (non verse)", val: "+" + fmt2(bilan.pending), color: "rgba(255,255,255,0.55)" },
            { label: "Frais d'achat challenge", val: "-" + fmt2(bilan.fee), color: "#ef4444" },
          ].map(k => (
            <div key={k.label} className="row">
              <span style={{ color: "rgba(255,255,255,0.65)" }}>{k.label}</span>
              <span style={{ color: k.color, fontWeight: 700 }}>{k.val}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 4, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>RESULTAT NET</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: bilan.net >= 0 ? "#6ee7b7" : "#ef4444" }}>{fmt2(bilan.net)}</span>
          </div>
        </div>
      )}

      {/* REGLES */}
      <div className="card">
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
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{kv[0]}</span>
              <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 11 }}>{kv[1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bouton sauvegarder la config */}
      <button onClick={saveCurrentConfig} disabled={!configChanged} style={{
        width: "100%", padding: "13px", borderRadius: 12,
        border: saveStatus ? "1px solid #6ee7b7" : configChanged ? "1px dashed rgba(110,231,183,0.35)" : "1px dashed rgba(255,255,255,0.08)",
        cursor: configChanged ? "pointer" : "default",
        background: saveStatus ? "rgba(110,231,183,0.10)" : configChanged ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        color: saveStatus ? "#6ee7b7" : configChanged ? "#6ee7b7" : "rgba(255,255,255,0.25)",
        fontSize: 13, fontWeight: 700, marginBottom: 12, transition: "all .2s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        {saveStatus ? (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l3.5 3.5L12 3" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {saveStatus}
          </>
        ) : configChanged ? (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V4L10 1z" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M9 1v3H4V1M4 8h6M4 10.5h4" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            {t("sim_save_config")}
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l3.5 3.5L12 3" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Config déjà sauvegardée
          </>
        )}
      </button>
      </>)}

      {!finalRRValid && (
        <div className="card" style={{ textAlign: "center", padding: 24, color: "#ef4444", fontWeight: 700, fontSize: 13 }}>
          Combinaison impossible : winrate trop bas pour cet objectif.<br />
          <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 400, fontSize: 12 }}>Monte le winrate ou baisse l'objectif/jour.</span>
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
                    <span className="tag" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.08)" }}>VERROUILLE</span>
                  )}
                </div>
                {data ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                      <div className="kpi">
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Jours</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color }}>{data.tradingDays}</div>
                      </div>
                      <div className="kpi">
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Profit</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: data.profit >= ph.target ? "#6ee7b7" : data.profit >= 0 ? "#fbbf24" : "#ef4444" }}>
                          {fmtPn(data.profit)}
                        </div>
                      </div>
                      <div className="kpi">
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>WR trades</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>{data.tradeWinrate.toFixed(0)}%</div>
                      </div>
                      <div className="kpi">
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Equity</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>{fmt(data.finalEquity)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginBottom: 8 }}>
                      {data.totalWins} gagnants / {data.totalLosses} perdants - WR jours {data.dayWinrate.toFixed(0)}%
                    </div>
                    {failReason(data.status) && (
                      <div style={{ background: data.status === "running_ok" ? "rgba(251,191,36,0.08)" : "rgba(239,68,68,0.08)", border: "1px solid " + (data.status === "running_ok" ? "#fbbf2440" : "#ef444440"), borderRadius: 8, padding: 10, fontSize: 12, color: data.status === "running_ok" ? "#fbbf24" : "#fca5a5", marginBottom: 10 }}>
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
                        <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }} />
                        <ReferenceLine y={capital * (1 + ph.target)} stroke={color} strokeDasharray="4 2" />
                        <ReferenceLine y={capital * (1 - model.totalDD)} stroke="#ef4444" strokeDasharray="4 2" />
                        <Area type="monotone" dataKey="equity" stroke={color} strokeWidth={2} fill={"url(#gp" + i + ")"} dot={false} name="Equity" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                    Passe la phase precedente pour debloquer
                  </div>
                )}
              </div>
            );
          })}
          {/* Bouton accès direct au Funded — uniquement si challenge réussi */}
          {sim?.allPassed && sim?.funded ? (
            <button onClick={() => setTab("funded")} style={{
              width: "100%", padding: 15, marginTop: 4, borderRadius: 12, cursor: "pointer",
              background: "#6ee7b7", color: "#000000", fontSize: 15, fontWeight: 600,
              border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(110,231,183,0.25)",
            }}>
              Voir mon compte Funded
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M7 4l5 5-5 5" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : sim && !sim.allPassed ? (
            <div style={{ marginTop: 4, padding: "12px 14px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.20)", borderRadius: 12, fontSize: 12, color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
              Passe toutes les phases du challenge pour accéder au compte Funded
            </div>
          ) : null}
        </div>
      )}

      {/* TAB FUNDED */}
      {(tab === "funded" || tab === "montecarlo") && (
        // En montecarlo : on n'affiche le Funded QUE s'il existe (sinon rien, le MC s'affiche seul)
        !sim ? (
          tab === "montecarlo" ? null : (
          <div className="card" style={{ textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
              Lance une simulation Challenge d'abord pour accéder au compte Funded.
            </div>
            <button onClick={() => setTab("challenge")} style={{ marginTop: 14, padding: "11px 20px", borderRadius: 10, background: "#6ee7b7", color: "#000", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
              Aller au Challenge
            </button>
          </div>
          )
        ) : !sim.funded || !sim.allPassed ? (
          tab === "montecarlo" ? null : (
          <div className="card" style={{ textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 14 }}>
              {!sim.allPassed
                ? "Le challenge n'a pas été validé. Modifie tes paramètres et relance la simulation."
                : "Le compte Funded n'a pas pu être généré. Relance la simulation."}
            </div>
            <button onClick={() => setTab("challenge")} style={{ padding: "11px 20px", borderRadius: 10, background: "rgba(255,255,255,0.07)", color: "#6ee7b7", fontSize: 13, fontWeight: 700, border: "1px solid rgba(110,231,183,0.25)", cursor: "pointer" }}>
              Retour au Challenge
            </button>
          </div>
          )
        ) : (
          <>
            {/* Bouton retour Challenge — masqué en Monte Carlo */}
            {tab === "funded" && (
              <button onClick={() => setTab("challenge")} style={{
                display: "flex", alignItems: "center", gap: 6, marginBottom: 12,
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 10, padding: "9px 14px", cursor: "pointer",
                color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600,
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 4L6 8l4 4" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Retour au Challenge
              </button>
            )}
            {/* Titre section quand affiché dans Monte Carlo */}
            {tab === "montecarlo" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(110,231,183,0.15)" }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", textTransform: "uppercase", letterSpacing: 1.5 }}>
                  Compte Funded
                </div>
                <div style={{ flex: 1, height: 1, background: "rgba(110,231,183,0.15)" }} />
              </div>
            )}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Compte Funded - {fundedMonths} mois</div>
                <span className="tag" style={{ background: sim.funded.status === "active" ? "rgba(255,255,255,0.05)" : "rgba(239,68,68,0.08)", color: sim.funded.status === "active" ? "#6ee7b7" : "#ef4444" }}>
                  {sim.funded.status === "active" ? "ACTIF" : "FERME"}
                </span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(110,231,183,0.15)", borderRadius: 12, padding: 8, marginBottom: 12, fontSize: 11, color: "#6ee7b7" }}>
                Capital funded = {fmt(capital)} (remis a l'initial) - Seuil retrait : $50 - Payout bi-weekly (14j)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Payouts encaissés", val: fmt(sim.funded.cumulPayout), color: "#6ee7b7" },
                  { label: "En attente", val: fmt2(sim.funded.pendingPayout), color: "rgba(255,255,255,0.55)" },
                  { label: "Solde compte", val: fmt(sim.funded.finalEquity), color: "rgba(255,255,255,0.85)" },
                  { label: "Mois gagnants", val: sim.funded.winMonths + "/" + (sim.funded.winMonths + sim.funded.lossMonths), color: sim.funded.winrateMonth >= 60 ? "#6ee7b7" : "#fbbf24" },
                  { label: "Scaling", val: sim.funded.scalingCount + "x (+40%)", color: "rgba(255,255,255,0.55)" },
                  { label: "Split final", val: sim.funded.finalSplit + "%", color: sim.funded.finalSplit >= 90 ? "#6ee7b7" : "#fbbf24" },
                ].map((k) => (
                  <div key={k.label} className="kpi">
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{k.label}</div>
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
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }} />
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
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {["Mois", "Equity", "Profit%", "Payout", "Split", "Streak", "Statut"].map(h => (
                        <th key={h} style={{ padding: "5px 4px", color: "rgba(255,255,255,0.65)", textAlign: "right", fontWeight: 700, fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const epMap = computeEffectivePayouts(sim.funded.data);
                      return sim.funded.data.map(r => {
                      const ep = epMap[r.month] || { checked: false, effectiveEquity: r.equity, effectivePayout: 0 };
                      const checked = ep.checked;
                      const hasPayout = r.payout > 0;
                      return (
                      <tr key={r.month} style={{ borderBottom: "1px solid #0f0f18", background: r.scalingNote ? "rgba(255,255,255,0.05)" : "transparent" }}>
                        <td style={{ padding: "5px 4px", color: "rgba(255,255,255,0.55)", textAlign: "right" }}>M{r.month}</td>
                        {/* Equity dynamique : augmente si payout non versé les mois précédents */}
                        <td style={{ padding: "5px 4px", color: "#FFFFFF", textAlign: "right" }}>
                          {fmt(ep.effectiveEquity)}
                        </td>
                        <td style={{ padding: "5px 4px", textAlign: "right", color: r.profitPct >= 0 ? "#6ee7b7" : "#ef4444" }}>
                          {(r.profitPct >= 0 ? "+" : "") + r.profitPct.toFixed(2)}%
                        </td>
                        {/* Payout — cliquable, checkbox + montant alignés */}
                        <td
                          style={{ padding: "5px 4px", cursor: hasPayout ? "pointer" : "default", userSelect: "none" }}
                          onClick={() => hasPayout && togglePayoutMonth(r.month)}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5 }}>
                            {hasPayout ? (
                              <span style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                                border: "1.5px solid " + (checked ? "#6ee7b7" : "rgba(255,255,255,0.25)"),
                                background: checked ? "rgba(110,231,183,0.12)" : "transparent",
                                fontSize: 9, fontWeight: 700,
                                color: checked ? "#6ee7b7" : "transparent",
                                transition: "all .15s",
                              }}>{checked ? "✓" : ""}</span>
                            ) : (
                              <span style={{ width: 15, height: 15, flexShrink: 0, display: "inline-block" }} />
                            )}
                            <span style={{
                              fontWeight: checked ? 700 : 400,
                              color: checked ? "#fbbf24" : "rgba(255,255,255,0.25)",
                              textDecoration: checked ? "none" : "line-through",
                              minWidth: 48, textAlign: "right", fontSize: 11,
                            }}>
                              {hasPayout ? fmt(checked ? ep.effectivePayout : r.payout) : "—"}
                            </span>
                          </div>
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
                      );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}

      {/* TAB MONTE CARLO — affiché sous le Funded */}
      {tab === "montecarlo" && finalRRValid && (
        <div>
          {/* Séparateur titre Monte Carlo (visible si Funded affiché au-dessus) */}
          {sim && sim.funded && sim.allPassed && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 14px" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(110,231,183,0.15)" }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", textTransform: "uppercase", letterSpacing: 1.5 }}>
                Analyse Monte Carlo
              </div>
              <div style={{ flex: 1, height: 1, background: "rgba(110,231,183,0.15)" }} />
            </div>
          )}
          {/* Résumé stats compact */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(110,231,183,0.20)", borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>{firm.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{model.name} · {fmt(capital)}</div>
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
                <div key={s.l} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 9, padding: "8px 4px", textAlign: "center" }}>
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

  if (!res) return <div className="card" style={{ color: "rgba(255,255,255,0.65)", textAlign: "center" }}>Calcul Monte Carlo en cours... ({RUNS} simulations)</div>;
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
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{k.l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 8 }}>Distribution resultat net</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
            {[["Min", res.min], ["P25", res.p25], ["P50", res.p50], ["P75", res.p75], ["Max", res.max]].map(([l, v]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{l}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: color(v) }}>{fmt(v)}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 10 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>DD moyen sur runs passes : <b style={{ color: "#fbbf24" }}>{res.avgDD}%</b></div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>Frais challenge : <b style={{ color: "#ef4444" }}>{fmt(-fee)}</b></div>
        </div>
        <div style={{ marginTop: 8, padding: "7px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 10, fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5, textAlign: "center" }}>
          Les résultats réels peuvent être inférieurs de 5 à 15 % (spread, slippage, conditions de marché).
        </div>
      </div>
    </div>
  );
}

function MesTradesTab({ sim, capital, fundedMonths, winrate, riskPct, dailyTargetPct, model, finalRR, tradesPerDay, firm, effectiveRiskAmount }) {
  // ── Journal de trading (partagé avec l'accueil via useJournal) ──
  const { journalMonth: jMonth, setJournalMonth: setJMonth, saveJournalEntry: saveJEntry, monthData: jMonthData } = useJournal();
  const [showJournal, setShowJournal] = useState(false);
  const loadTrades = () => {
    try { const r = localStorage.getItem("eapropfirm_trades"); return r ? JSON.parse(r) : { trades: [], filename: null, initBalance: null, balanceReconstructed: false }; } catch (e) { return { trades: [], filename: null, initBalance: null, balanceReconstructed: false }; }
  };
  const saved0 = loadTrades();
  const [trades, setTrades] = useState(saved0.trades || []);
  const [parseError, setParseError] = useState(null);
  const [filename, setFilename] = useState(saved0.filename || null);
  // ── État balance initiale ──────────────────────────────────────
  // initBalance : solde réel au début du backtest (peut être inconnu)
  // balanceReconstructed : true si le fichier n'avait pas de colonne balance
  //   → le DD calculé est approximatif et une saisie manuelle est demandée
  const [initBalance, setInitBalance] = useState(saved0.initBalance || null);
  const [balanceReconstructed, setBalanceReconstructed] = useState(saved0.balanceReconstructed || false);
  const [manualBalanceInput, setManualBalanceInput] = useState("");
  const [showBalanceInput, setShowBalanceInput] = useState(false);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    try { localStorage.setItem("eapropfirm_trades", JSON.stringify({ trades, filename, initBalance, balanceReconstructed })); } catch (e) {}
  }, [trades, filename, initBalance, balanceReconstructed]);

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
    let hasRealBalance = false; // true si au moins une ligne a une vraie balance
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].replace(/"/g, '').split(/[,;\t]/); if (row.length < 2) continue;
      const profitRaw = parseFloat(row[profitIdx]); if (isNaN(profitRaw)) continue;
      const comm = commIdx >= 0 ? parseFloat(row[commIdx]) || 0 : 0; const swap = swapIdx >= 0 ? parseFloat(row[swapIdx]) || 0 : 0;
      const netProfit = profitRaw + comm + swap;
      let balance = balanceIdx >= 0 ? parseFloat(row[balanceIdx]) : NaN;
      if (!isNaN(balance) && balance > 0) { hasRealBalance = true; }
      if (isNaN(balance)) { runningBalance += netProfit; balance = runningBalance; }
      if (initBalance === null) initBalance = balance - netProfit;
      parsed.push({ idx: i, time: (timeIdx >= 0 ? row[timeIdx] : '').trim(), type: (typeIdx >= 0 ? row[typeIdx] : '').trim(), profit: netProfit, balance });
    }
    if (parsed.length === 0) return { error: "Aucun trade valide dans le fichier" };
    return { trades: parsed, format, initBalance: initBalance || null, balanceReconstructed: !hasRealBalance };
  };

  // ── HTML parser (backtest MT4/MT5 .html) ─────────────────────
  const parseHTMLBacktest = (text) => {
    try {
      if (typeof DOMParser === 'undefined') return { error: "DOMParser non disponible" };
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const tables = Array.from(doc.querySelectorAll('table'));
      if (!tables.length) return { error: "Aucune table trouvée dans le fichier HTML" };

      // ── Détection du format MT4 Strategy Tester ──────────────────────────
      // Ce format n'a PAS de header. Structure fixe :
      // Col0=#  Col1=DateTime  Col2=Type  Col3=OrderID  Col4=Lots
      // Col5=Price  Col6=SL  Col7=TP  Col8=Profit  Col9=Balance
      // Types avec profit/balance : s/l, t/p, close, close at stop, balance
      // Types à ignorer : buy, sell, modify
      const CLOSED_TYPES = ['s/l','t/p','close','close at stop','balance','profit','stop loss','take profit'];
      const isMT4StratTester = (table) => {
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length < 5) return false;
        // Vérifier que les premières lignes ont bien ~10 colonnes numériques
        let score = 0;
        for (let i = 0; i < Math.min(10, rows.length); i++) {
          const cells = Array.from(rows[i].querySelectorAll('td')).map(el => el.textContent.replace(/ /g,' ').trim());
          if (cells.length >= 8 && !isNaN(parseInt(cells[0]))) score++;
        }
        return score >= 3;
      };

      // ── Chercher la table trades (celle avec beaucoup de lignes) ─────────
      let tradeTable = null;
      // Priorité : table avec header contenant profit+balance (format MT5 export)
      for (const table of tables) {
        const rows = table.querySelectorAll('tr');
        if (rows.length < 3) continue;
        const hdr = Array.from(rows[0].querySelectorAll('th,td')).map(el => el.textContent.toLowerCase().trim());
        if (hdr.some(c => c.includes('profit')) && hdr.some(c => c.includes('balance'))) {
          tradeTable = table; break;
        }
      }
      // Sinon : format MT4 Strategy Tester (pas de header)
      if (!tradeTable) {
        for (const table of tables) {
          if (isMT4StratTester(table)) { tradeTable = table; break; }
        }
      }
      if (!tradeTable) return { error: "Format HTML non reconnu. Attendu : Strategy Tester MT4/MT5 ou export historique." };

      // ── Détecter si la table a un header ou pas ──────────────────────────
      const allRows = Array.from(tradeTable.querySelectorAll('tr'));
      const firstRowCells = Array.from(allRows[0].querySelectorAll('th,td')).map(el => el.textContent.toLowerCase().trim());
      const hasHeader = firstRowCells.some(c => c.includes('profit') || c.includes('balance') || c.includes('type'));

      const parsed = [];
      let runningBalance = capital;
      let initBalance = null;
      let hasRealBalance = false;

      if (hasHeader) {
        // ── FORMAT AVEC HEADER (MT5 export standard) ──────────────────────
        const hdr = firstRowCells;
        const pIdx = hdr.findIndex(h => h === 'profit' || h.includes('profit'));
        const bIdx = hdr.findIndex(h => h === 'balance' || h.includes('balance'));
        const tIdx = hdr.findIndex(h => h.includes('time') || h.includes('date'));
        const tyIdx = hdr.findIndex(h => h === 'type' || h.includes('type'));
        const cIdx = hdr.findIndex(h => h.includes('commission'));
        const sIdx = hdr.findIndex(h => h.includes('swap'));
        if (pIdx === -1) return { error: "Colonne Profit introuvable dans le header HTML" };

        for (let i = 1; i < allRows.length; i++) {
          const cells = Array.from(allRows[i].querySelectorAll('td,th')).map(el => el.textContent.replace(/ /g,' ').trim());
          if (cells.length < 3) continue;
          const pRaw = cells[pIdx] || '';
          if (!pRaw) continue;
          const p = parseFloat(pRaw.replace(/[\s,]/g,'').replace(',','.')); if (isNaN(p)) continue;
          const comm = cIdx >= 0 ? parseFloat((cells[cIdx] || '').replace(/[\s,]/g,'')) || 0 : 0;
          const swap = sIdx >= 0 ? parseFloat((cells[sIdx] || '').replace(/[\s,]/g,'')) || 0 : 0;
          const net = p + comm + swap;
          let balance = bIdx >= 0 ? parseFloat((cells[bIdx] || '').replace(/[\s,]/g,'')) : NaN;
          if (!isNaN(balance) && balance > 0) hasRealBalance = true;
          if (isNaN(balance)) { runningBalance += net; balance = runningBalance; }
          if (initBalance === null) initBalance = balance - net;
          parsed.push({ idx: i, time: tIdx >= 0 ? cells[tIdx] : '', type: tyIdx >= 0 ? cells[tyIdx] : '', profit: net, balance: +balance.toFixed(2) });
        }
      } else {
        // ── FORMAT MT4 STRATEGY TESTER (sans header, colonnes fixes) ─────
        // Col0=# Col1=DateTime Col2=Type Col3=Order Col4=Lots
        // Col5=Price Col6=SL Col7=TP Col8=Profit Col9=Balance
        for (let i = 0; i < allRows.length; i++) {
          const cells = Array.from(allRows[i].querySelectorAll('td')).map(el => el.textContent.replace(/ /g,' ').trim());
          if (cells.length < 8) continue;
          const rowNum = parseInt(cells[0]);
          if (isNaN(rowNum)) continue; // sauter lignes non-data
          const type = (cells[2] || '').toLowerCase().trim();
          // Garder uniquement les lignes de clôture (ont profit + balance renseignés)
          const profitRaw = cells[8] || '';
          const balanceRaw = cells[9] || '';
          if (!profitRaw || !balanceRaw) continue;
          const profit = parseFloat(profitRaw.replace(/[\s,]/g,'').replace(',','.'));
          const balance = parseFloat(balanceRaw.replace(/[\s,]/g,'').replace(',','.'));
          if (isNaN(profit) || isNaN(balance) || balance <= 0) continue;
          hasRealBalance = true;
          if (initBalance === null) initBalance = balance - profit;
          parsed.push({
            idx: rowNum,
            time: cells[1] || '',
            type: type,
            profit: +profit.toFixed(2),
            balance: +balance.toFixed(2),
          });
        }
      }

      if (parsed.length === 0) return { error: "Aucune transaction clôturée trouvée. Vérifiez que le fichier contient des lignes s/l, t/p, close ou close at stop." };
      return { trades: parsed, format: 'html_backtest', initBalance: initBalance || null, balanceReconstructed: !hasRealBalance };
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
      const iB = result.initBalance;
      const reconstructed = result.balanceReconstructed || false;
      setTrades(newTrades);
      setInitBalance(iB);
      setBalanceReconstructed(reconstructed);
      setManualBalanceInput(iB ? String(Math.round(iB)) : "");
      setShowBalanceInput(reconstructed || !iB); // montrer l'input si balance inconnue
      setAlerts(computeAlertsSync(newTrades, iB || capital));
    };
    reader.readAsText(file);
  };

  // Appliquer une balance saisie manuellement
  const applyManualBalance = () => {
    const val = parseFloat(manualBalanceInput);
    if (!val || val <= 0) return;
    // Reconstruire les balances depuis le solde initial saisi
    let running = val;
    const rebuilt = trades.map(t => {
      running += t.profit;
      return { ...t, balance: +running.toFixed(2) };
    });
    setTrades(rebuilt);
    setInitBalance(val);
    setBalanceReconstructed(false);
    setShowBalanceInput(false);
    setAlerts(computeAlertsSync(rebuilt, val));
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

    // ── DD max réel : DEUX mesures distinctes ──
    // 1. DD trailing (chute depuis le pic d'équité) = règle réelle des prop firms
    // 2. DD absolu (chute depuis capital initial) = règle "static" certaines firms
    let peak = initBal, maxDDTrailing = 0, minEquity = initBal;
    trds.forEach(t => {
      if (t.balance > peak) peak = t.balance;
      if (t.balance < minEquity) minEquity = t.balance;
      const ddFromPeak = (peak - t.balance) / peak * 100;       // % depuis le pic
      if (ddFromPeak > maxDDTrailing) maxDDTrailing = ddFromPeak;
    });
    const maxDDAbsolute = (initBal - minEquity) / initBal * 100; // % depuis capital initial
    // On retient la mesure pertinente selon le type de DD du modèle
    const isTrailing = model.ddType === "trailing";
    const maxDD = isTrailing ? maxDDTrailing : Math.max(0, maxDDAbsolute);
    const ddLimitPct = model.totalDD * 100;

    // ── Phases déjà franchies dans le backtest (lecture factuelle) ──
    const finalProfit = (trds[trds.length - 1].balance - initBal) / initBal * 100;
    const phasesTargets = model.phases.map(ph => ph.target * 100);
    const phasesPassed = phasesTargets.filter(tgt => finalProfit >= tgt).length;
    const totalPhases = phasesTargets.length;

    // ── Violation de règle DÉTECTÉE dans le backtest réel ──
    const ddViolated = maxDD >= ddLimitPct;
    // Détection violation DD journalier réel (pire jour vs limite)
    const dailyLimAmt = initBal * model.dailyDD;
    // Reconstruire les pertes journalières par regroupement de date si dispo
    let worstSingleLoss = 0;
    trds.forEach(t => { if (-t.profit > worstSingleLoss) worstSingleLoss = -t.profit; });

    // Score de cohérence vs simulation
    const wrScore = Math.max(0, 1 - Math.abs(realWR * 100 - winrate) / Math.max(winrate, 1));
    const rrScore = finalRR > 0 ? Math.max(0, 1 - Math.min(Math.abs(realRR - finalRR) / Math.max(finalRR, 0.5), 1)) : 0.5;
    const ddScore = Math.max(0, 1 - maxDD / ddLimitPct);
    const pfScore = realPF >= 1.8 ? 1 : realPF >= 1.3 ? 0.7 : realPF >= 1.0 ? 0.4 : 0.1;
    const matchScore = Math.round((wrScore * 0.3 + rrScore * 0.25 + ddScore * 0.25 + pfScore * 0.2) * 100);

    // ── Mini Monte Carlo (200 runs) — vérifie DD TRAILING (depuis le pic) ──
    const riskAmt = effectiveRiskAmount > 0 ? effectiveRiskAmount : capital * 0.006;
    const dailyLim = capital * model.dailyDD;
    const totalDDLim = capital * model.totalDD;
    const target = capital * model.phases[0].target;
    const tpd = tradesPerDay > 0 ? tradesPerDay : 0.3;
    let pass = 0;
    for (let s = 0; s < 200; s++) {
      let eq = capital; let mcPeak = capital; let ok = true;
      for (let d = 0; d < 300; d++) {
        const n = tpd < 1 ? (Math.random() < tpd ? 1 : 0) : Math.round(tpd);
        let dayLoss = 0;
        for (let tr = 0; tr < n; tr++) {
          if (Math.random() < realWR) eq += riskAmt * realRR;
          else { eq -= riskAmt; dayLoss += riskAmt; }
          if (eq > mcPeak) mcPeak = eq;
          // DD trailing (depuis le pic) OU DD absolu selon le modèle
          const ddNow = isTrailing ? (mcPeak - eq) : (capital - eq);
          const ddCap = isTrailing ? totalDDLim : totalDDLim;
          if (dayLoss >= dailyLim || ddNow >= ddCap) { ok = false; break; }
        }
        if (!ok) break;
        if (eq - capital >= target) { pass++; break; }
      }
    }
    const passPct = Math.round(pass / 200 * 100);

    // ── Facteurs clés (lecture factuelle, sans certitude absolue) ──
    const factors = [];
    if (ddViolated) factors.push({ t: `DD réel ${maxDD.toFixed(1)}% DÉPASSE la limite ${ddLimitPct}% — échec sur ces données`, c: "#ef4444" });
    else if (maxDD > ddLimitPct * 0.7) factors.push({ t: `DD réel ${maxDD.toFixed(1)}% — proche de la limite ${ddLimitPct}%`, c: "#fbbf24" });
    else factors.push({ t: `DD réel ${maxDD.toFixed(1)}% — sous la limite ${ddLimitPct}%`, c: "#6ee7b7" });
    if (realWR < 0.4) factors.push({ t: `Winrate ${(realWR*100).toFixed(0)}% — bas`, c: "#fbbf24" });
    else factors.push({ t: `Winrate ${(realWR*100).toFixed(0)}% vs ${winrate}% attendu`, c: realWR*100 >= winrate-5 ? "#6ee7b7" : "#fbbf24" });
    if (realPF < 1.0) factors.push({ t: `Profit Factor ${realPF.toFixed(2)} — stratégie perdante sur la période`, c: "#ef4444" });
    else factors.push({ t: `Profit Factor ${realPF.toFixed(2)} — ${realPF >= 1.5 ? "solide" : "acceptable"}`, c: realPF >= 1.5 ? "#6ee7b7" : "#fbbf24" });

    // ══════════════════════════════════════════════════════════════
    // VERDICT — Les FAITS du backtest priment sur la projection Monte Carlo.
    // Hiérarchie de décision :
    //  1. Le backtest réel a-t-il VIOLÉ une règle ? (DD dépassé) → ÉCHEC
    //  2. Le backtest réel est-il PERDANT ? (profit final < 0) → ÉCHEC
    //  3. Le backtest atteint-il la cible de la 1ère phase ? → sinon INSUFFISANT
    //  4. La stratégie est-elle rentable ? (PF >= 1) → sinon ÉCHEC
    //  Seulement SI tous les faits sont OK → on regarde la projection Monte Carlo
    // ══════════════════════════════════════════════════════════════
    const firstPhaseTarget = phasesTargets[0] || 8; // cible 1ère phase en %
    const isLosing = finalProfit < 0;                 // backtest perdant
    const isUnprofitable = realPF < 1.0;              // stratégie non rentable
    const reachedFirstTarget = finalProfit >= firstPhaseTarget; // atteint cible P1
    // Données insuffisantes : trop peu de trades pour être fiable
    const tooFewTrades = trds.length < 20;

    let label, color, bg, icon;
    let displayPct = passPct;
    let verdictReason = "";

    if (ddViolated) {
      // FAIT 1 : violation DD observée → échec factuel
      label = "RÈGLE DD DÉPASSÉE";
      color = "#ef4444";
      bg = "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(6,9,15,0.98))";
      icon = "XRED";
      displayPct = Math.min(passPct, 5);
      verdictReason = `Le backtest a atteint ${maxDD.toFixed(1)}% de drawdown, dépassant la limite ${ddLimitPct}%. Sur ces données, le challenge est échoué.`;
    } else if (isLosing) {
      // FAIT 2 : backtest perdant → échec factuel
      label = "BACKTEST PERDANT";
      color = "#ef4444";
      bg = "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(6,9,15,0.98))";
      icon = "XRED";
      displayPct = 0;
      verdictReason = `Le backtest finit à ${finalProfit.toFixed(1)}% (perte). Une stratégie perdante ne peut pas passer un challenge prop firm.`;
    } else if (isUnprofitable) {
      // FAIT 3 : Profit Factor < 1 → stratégie structurellement perdante
      label = "STRATÉGIE NON RENTABLE";
      color = "#ef4444";
      bg = "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(6,9,15,0.98))";
      icon = "XRED";
      displayPct = Math.min(passPct, 8);
      verdictReason = `Profit Factor de ${realPF.toFixed(2)} (< 1.0) : la stratégie perd plus qu'elle ne gagne sur la période. Échec probable.`;
    } else if (tooFewTrades) {
      // FAIT 4 : données insuffisantes
      label = "DONNÉES INSUFFISANTES";
      color = "#fbbf24";
      bg = "linear-gradient(135deg, rgba(251,191,36,0.10), rgba(6,9,15,0.98))";
      icon = "WARN";
      displayPct = Math.min(passPct, 40);
      verdictReason = `Seulement ${trds.length} trades : échantillon trop faible pour conclure. Importe un backtest plus long (100+ trades) pour un verdict fiable.`;
    } else if (!reachedFirstTarget) {
      // FAIT 5 : profitable mais n'atteint pas la cible de la 1ère phase
      label = "OBJECTIF NON ATTEINT";
      color = "#fbbf24";
      bg = "linear-gradient(135deg, rgba(251,191,36,0.10), rgba(6,9,15,0.98))";
      icon = "WARN";
      displayPct = Math.min(passPct, 45);
      verdictReason = `Profit final ${finalProfit.toFixed(1)}% < cible Phase 1 (${firstPhaseTarget}%). La stratégie est rentable mais pas assez performante pour valider le challenge sur cette période.`;
    } else if (passPct >= 65 && matchScore >= 50) {
      // Tous les faits sont bons ET la projection est favorable
      label = "PROBABILITÉ FAVORABLE";
      color = "#6ee7b7";
      bg = "linear-gradient(135deg, rgba(110,231,183,0.10), rgba(6,9,15,0.98))";
      icon = "CHK";
      verdictReason = `Backtest rentable (PF ${realPF.toFixed(2)}), cible Phase 1 atteinte (${finalProfit.toFixed(1)}%), DD maîtrisé (${maxDD.toFixed(1)}%). Projection Monte Carlo favorable.`;
    } else if (passPct >= 40) {
      label = "RISQUE ÉLEVÉ";
      color = "#fbbf24";
      bg = "linear-gradient(135deg, rgba(251,191,36,0.10), rgba(6,9,15,0.98))";
      icon = "WARN";
      verdictReason = `Backtest correct mais projection Monte Carlo incertaine (${passPct}%). La marge est faible — surveille ton risque par trade.`;
    } else {
      label = "PEU PROBABLE";
      color = "#ef4444";
      bg = "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(6,9,15,0.98))";
      icon = "XRED";
      verdictReason = `Projection Monte Carlo défavorable (${passPct}%) malgré un backtest non perdant. Risque de violation DD avant d'atteindre la cible.`;
    }
    // Plafond de prudence : jamais 100%
    displayPct = Math.min(displayPct, 95);

    return {
      passPct: displayPct, matchScore, label, color, bg, icon, factors, verdictReason,
      realWR: (realWR*100).toFixed(0), realRR: realRR.toFixed(2), realPF: realPF.toFixed(2),
      maxDD: maxDD.toFixed(2), maxDDTrailing: maxDDTrailing.toFixed(2), maxDDAbsolute: Math.max(0, maxDDAbsolute).toFixed(2),
      ddViolated, ddLimitPct, finalProfit: finalProfit.toFixed(2),
      phasesPassed, totalPhases, isTrailing,
      isLosing, isUnprofitable, reachedFirstTarget, firstPhaseTarget, tooFewTrades,
    };
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
    // Utiliser le solde initial réel stocké (pas recalculé à la volée)
    const iB = initBalance || (trades[0].balance - trades[0].profit);
    const finalBal = trades[trades.length - 1].balance;
    const wr = (wins.length / trades.length) * 100;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.profit, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.profit, 0) / losses.length) : 0;
    const rr = avgLoss > 0 ? avgWin / avgLoss : 0;
    // DD trailing depuis le pic (méthode correcte)
    let peak = iB, maxDDTrailing = 0;
    trades.forEach(t => {
      if (t.balance > peak) peak = t.balance;
      const dd = (peak - t.balance) / peak * 100;
      if (dd > maxDDTrailing) maxDDTrailing = dd;
    });
    const ddPct = maxDDTrailing;
    const pf = avgLoss > 0 && losses.length > 0 ? (wins.reduce((s,t)=>s+t.profit,0)) / Math.abs(losses.reduce((s,t)=>s+t.profit,0)) : 0;
    return { wins: wins.length, losses: losses.length, total: trades.length, totalPnl, wr, avgWin, avgLoss, rr, ddPct, initBal: iB, finalBal, pf };
  })() : null;

  const chartData = (() => {
    if (!trades.length) return [];
    const step = Math.max(1, Math.floor(trades.length / 60));
    const result = [];
    for (let i = 0; i < trades.length; i += step) {
      const t = trades[Math.min(i, trades.length - 1)];
      const simIdx = sim?.funded?.data ? Math.min(Math.floor(i / step), sim.funded.data.length - 1) : -1;
      result.push({
        pt: i + 1,
        reel: +t.balance.toFixed(2),
        simulation: simIdx >= 0 ? sim.funded.data[simIdx].equity : null,
      });
    }
    return result;
  })();

  // ── Données journalières réelles (depuis trades importés) ──────
  // Regroupe les trades par date (champ time) ou par index si pas de date
  const dailyLogReel = (() => {
    if (!trades.length) return [];
    const iB = initBalance || (trades[0].balance - trades[0].profit);
    const byDay = {};
    let dayIdx = 1;
    trades.forEach(t => {
      const dateKey = t.time ? t.time.split(' ')[0] : 'day_' + dayIdx;
      if (!byDay[dateKey]) { byDay[dateKey] = { date: dateKey, dayIdx: dayIdx++, profits: [], balances: [] }; }
      byDay[dateKey].profits.push(t.profit);
      byDay[dateKey].balances.push(t.balance);
    });
    const days = Object.values(byDay);
    return days.map((d, i) => {
      const pnl = d.profits.reduce((s, v) => s + v, 0);
      const equity = d.balances[d.balances.length - 1];
      const wins = d.profits.filter(v => v > 0).length;
      const losses = d.profits.filter(v => v <= 0).length;
      // Déterminer le mois à partir de la date si possible
      let month = 1;
      if (d.date.includes('-') || d.date.includes('/')) {
        const parts = d.date.replace(/\//g, '-').split('-');
        // Format YYYY-MM-DD ou DD-MM-YYYY ou MM-DD-YYYY
        if (parts.length >= 2) {
          const candidate = parseInt(parts[1]);
          month = candidate >= 1 && candidate <= 12 ? candidate : Math.ceil(d.dayIdx / 22);
        }
      } else {
        month = Math.ceil(d.dayIdx / 22); // ~22 jours de trading par mois
      }
      return { globalDay: d.dayIdx, month, dayOfMonth: d.dayIdx, pnl: +pnl.toFixed(2), equity: +equity.toFixed(2), wins, losses, breached: false };
    });
  })();

  // ── Tableau mensuel réel (depuis trades importés) ──────────────
  const monthlyReel = (() => {
    if (!dailyLogReel.length) return [];
    const iB = initBalance || (trades[0].balance - trades[0].profit);
    const byMonth = {};
    dailyLogReel.forEach(d => {
      if (!byMonth[d.month]) byMonth[d.month] = { month: d.month, days: [] };
      byMonth[d.month].days.push(d);
    });
    let runningEquity = iB;
    return Object.values(byMonth).map(m => {
      const monthStart = runningEquity;
      const pnl = m.days.reduce((s, d) => s + d.pnl, 0);
      const finalEq = m.days[m.days.length - 1].equity;
      runningEquity = finalEq;
      const profitPct = monthStart > 0 ? ((pnl / monthStart) * 100) : 0;
      // DD max du mois (trailing depuis le pic du mois)
      let peak = monthStart, maxDD = 0;
      m.days.forEach(d => {
        if (d.equity > peak) peak = d.equity;
        const dd = peak > 0 ? (peak - d.equity) / peak * 100 : 0;
        if (dd > maxDD) maxDD = dd;
      });
      const wins = m.days.filter(d => d.pnl > 0).length;
      return {
        month: m.month,
        equity: +finalEq.toFixed(2),
        pnl: +pnl.toFixed(2),
        profitPct: +profitPct.toFixed(2),
        maxDD: +maxDD.toFixed(2),
        tradingDays: m.days.length,
        winDays: wins,
        lossDays: m.days.length - wins,
      };
    });
  })();

  const effectiveInitBalance = initBalance || (trades.length > 0 ? trades[0].balance - trades[0].profit : capital);
  const verdict = trades.length > 0 && stats && !balanceReconstructed
    ? computeVerdictSync(trades, effectiveInitBalance)
    : (trades.length > 0 && stats && balanceReconstructed ? null : null);

  const alertColor = (l) => l === "danger" ? "#ef4444" : l === "warning" ? "#fbbf24" : l === "ok" ? "#6ee7b7" : "rgba(255,255,255,0.55)";
  const alertBg = (l) => l === "danger" ? "rgba(239,68,68,0.08)" : l === "warning" ? "rgba(251,191,36,0.08)" : l === "ok" ? "rgba(255,255,255,0.05)" : "#0c1a3d";
  const alertIcon = (l) => null; // icônes gérées par border-left couleur

  return (
    <div>
      {/* ── UPLOAD : CSV + HTML ── */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
          Import historique
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>📊 CSV / Texte</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>MT4 : Historique → clic droit → CSV<br/>MT5 : Historique → Rapport → CSV</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>🌐 Backtest HTML</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>MT4/MT5 : Testeur → Rapport → Ouvrir → Fichier HTML</div>
          </div>
        </div>
        <label style={{ display: "block", background: "rgba(255,255,255,0.05)", border: "2px dashed #2d2d3d", borderRadius: 10, padding: "16px", textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
          <div style={{ fontSize: 13, color: "#6ee7b7", fontWeight: 700 }}>
            {filename ? filename : "CSV, TXT, TSV, ou HTML"}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
            {trades.length > 0 ? trades.length + " trades chargés" : "Aucun fichier"}
          </div>
          <input type="file" accept=".csv,.txt,.tsv,.html,.htm" onChange={handleFile} style={{ display: "none" }} />
        </label>
        {parseError && <div style={{ marginTop: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: 10, fontSize: 12, color: "#fca5a5" }}>{parseError}</div>}
        {trades.length > 0 && (
          <button onClick={() => { setTrades([]); setFilename(null); setAlerts([]); setVerdict(null); try { localStorage.removeItem("eapropfirm_trades"); } catch (e) {} }}
            style={{ marginTop: 8, width: "100%", padding: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, color: "#fca5a5", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            Effacer les données importées
          </button>
        )}
      </div>

      {/* ── BANDEAU BALANCE INITIALE — toujours affiché après import ── */}
      {trades.length > 0 && (
        <div style={{
          background: balanceReconstructed
            ? "rgba(251,191,36,0.08)"
            : "rgba(110,231,183,0.06)",
          border: "1.5px solid " + (balanceReconstructed ? "rgba(251,191,36,0.4)" : "rgba(110,231,183,0.2)"),
          borderRadius: 14, padding: 14, marginBottom: 12
        }}>
          {/* Ligne de statut + solde détecté */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{balanceReconstructed ? "⚠️" : "✅"}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: balanceReconstructed ? "#fbbf24" : "#6ee7b7" }}>
                  {balanceReconstructed ? "Solde initial non détecté" : "Solde initial détecté"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                  {balanceReconstructed
                    ? "Aucune colonne balance dans le fichier — DD incalculable"
                    : effectiveInitBalance
                      ? `Capital de départ : $${Math.round(effectiveInitBalance).toLocaleString()}`
                      : "Capital non déterminé"}
                </div>
              </div>
            </div>
            {/* Bouton modifier */}
            <button
              onClick={() => setShowBalanceInput(v => !v)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              {showBalanceInput ? "Annuler" : "Modifier"}
            </button>
          </div>

          {/* Message si balance reconstruite */}
          {balanceReconstructed && !showBalanceInput && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 10 }}>
              Sans solde de départ réel, le <b>drawdown ne peut pas être calculé</b> — il est donc <b>impossible de confirmer si le challenge est passé ou non</b>.
            </div>
          )}

          {/* Input saisie manuelle — visible si balance inconnue OU si l'utilisateur clique Modifier */}
          {(balanceReconstructed || showBalanceInput) && (
            <>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                {balanceReconstructed
                  ? "Connais-tu le capital de départ de ce backtest ?"
                  : "Corriger le solde initial :"}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  placeholder="Ex : 25000"
                  value={manualBalanceInput}
                  onChange={e => setManualBalanceInput(e.target.value)}
                  style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#FFFFFF", padding: "10px 12px", fontSize: 14, fontWeight: 600 }}
                />
                <button
                  onClick={applyManualBalance}
                  disabled={!manualBalanceInput || parseFloat(manualBalanceInput) <= 0}
                  style={{
                    padding: "10px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: manualBalanceInput && parseFloat(manualBalanceInput) > 0 ? "#6ee7b7" : "rgba(255,255,255,0.1)",
                    color: manualBalanceInput && parseFloat(manualBalanceInput) > 0 ? "#000000" : "rgba(255,255,255,0.35)",
                    fontSize: 13, fontWeight: 700
                  }}>
                  Appliquer
                </button>
              </div>
              {balanceReconstructed && (
                <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                  Sans cette information, seuls WR, RR et PF sont disponibles. Le verdict challenge reste bloqué.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Stats partielles disponibles même sans balance initiale */}
      {trades.length > 0 && stats && balanceReconstructed && (
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            Statistiques disponibles (sans DD)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
            {[
              { l: "Trades", v: stats.total, c: "#FFFFFF" },
              { l: "Winrate", v: stats.wr.toFixed(0) + "%", c: stats.wr >= winrate - 5 ? "#6ee7b7" : "#fbbf24" },
              { l: "Profit Factor", v: stats.pf.toFixed(2), c: stats.pf >= 1.5 ? "#6ee7b7" : stats.pf >= 1 ? "#fbbf24" : "#ef4444" },
              { l: "RR réel", v: "1:" + stats.rr.toFixed(2), c: "#FFFFFF" },
              { l: "P&L total", v: "$" + stats.totalPnl.toFixed(0), c: stats.totalPnl >= 0 ? "#6ee7b7" : "#ef4444" },
              { l: "DD max", v: "⚠ inconnu", c: "#fbbf24" },
            ].map(s => (
              <div key={s.l} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 9, padding: "9px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>{s.l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#fbbf24", padding: "8px 10px", background: "rgba(251,191,36,0.06)", borderRadius: 12 }}>
            Le DD max est inconnu → impossible de confirmer si le challenge est passé ou non. Saisis le solde initial ci-dessus pour débloquer l'analyse complète.
          </div>
        </div>
      )}

      {trades.length > 0 && stats && verdict && (
        <>
          {/* ── 🎯 VERDICT CHALLENGE (pièce maîtresse) ── */}
          <div style={{ background: verdict.bg, border: "2px solid " + verdict.color + "50", borderRadius: 16, padding: 18, marginBottom: 12 }}>
            {/* Header verdict */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: -0.2, marginBottom: 4 }}>
                  Analyse Backtest · {firm?.name || ""}
                </div>
                <div style={{ fontSize: 19, fontWeight: 700, color: verdict.color, lineHeight: 1.1 }}>
                  <VerdictIcon icon={verdict.icon} /> {verdict.label}
                </div>
              </div>
              {/* Cercle probabilité */}
              <div style={{ textAlign: "center", flexShrink: 0, marginLeft: 12 }}>
                <div style={{ width: 68, height: 68, borderRadius: 34, background: verdict.color + "20", border: "3px solid " + verdict.color, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 19, fontWeight: 700, color: verdict.color, lineHeight: 1 }}>~{verdict.passPct}%</div>
                  <div style={{ fontSize: 7, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>estimation</div>
                </div>
              </div>
            </div>

            {/* Raison du verdict — explication claire pour l'utilisateur */}
            {verdict.verdictReason && (
              <div style={{
                background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "11px 13px",
                marginBottom: 14, borderLeft: "3px solid " + verdict.color,
              }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.55 }}>
                  {verdict.verdictReason}
                </div>
              </div>
            )}

            {/* Lecture factuelle du backtest */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>Phases atteintes (backtest)</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: verdict.phasesPassed >= verdict.totalPhases ? "#6ee7b7" : "rgba(255,255,255,0.85)" }}>
                  {verdict.phasesPassed} / {verdict.totalPhases}
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>profit final {verdict.finalProfit >= 0 ? "+" : ""}{verdict.finalProfit}%</div>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>DD max observé ({verdict.isTrailing ? "trailing" : "absolu"})</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: verdict.ddViolated ? "#ef4444" : parseFloat(verdict.maxDD) > verdict.ddLimitPct * 0.7 ? "#fbbf24" : "#6ee7b7" }}>
                  {verdict.maxDD}%
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>limite {verdict.ddLimitPct}%</div>
              </div>
            </div>

            {/* Score de cohérence */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Cohérence avec ta simulation</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: verdict.matchScore >= 70 ? "#6ee7b7" : verdict.matchScore >= 50 ? "#fbbf24" : "#ef4444" }}>{verdict.matchScore}%</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4, transition: "width .6s",
                  width: verdict.matchScore + "%",
                  background: verdict.matchScore >= 70 ? "#6ee7b7" : verdict.matchScore >= 50 ? "#fbbf24" : "#ef4444"
                }} />
              </div>
            </div>

            {/* KPIs réels rapides */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
              {[
                { l: "WR réel", v: verdict.realWR + "%", expected: winrate + "%", ok: parseFloat(verdict.realWR) >= winrate - 5 },
                { l: "RR réel", v: "1:" + verdict.realRR, expected: "1:" + (finalRR || "-").toString().slice(0,4), ok: parseFloat(verdict.realRR) >= (finalRR || 0) * 0.85 },
                { l: "PF réel", v: verdict.realPF, expected: "≥ 1.5", ok: parseFloat(verdict.realPF) >= 1.5 },
                { l: "DD max", v: verdict.maxDD + "%", expected: "< " + verdict.ddLimitPct + "%", ok: !verdict.ddViolated },
              ].map(k => (
                <div key={k.l} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{k.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: k.ok ? "#6ee7b7" : "#ef4444" }}>{k.v}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>cible: {k.expected}</div>
                </div>
              ))}
            </div>

            {/* Facteurs clés */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {verdict.factors.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "7px 10px", borderLeft: "3px solid " + f.c + "60" }}>
                  <span style={{ fontSize: 12 }}>{f.c === "#6ee7b7" ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round"/></svg> : f.c === "#fbbf24" ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.5 3.5L12 5l-3.5 3 1 4.5L6 10l-3.5 2.5 1-4.5L0 5l4.5-.5L6 1z" stroke="#fbbf24" strokeWidth="1.2" fill="none"/></svg> : <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/></svg>}</span>
                  <span style={{ fontSize: 11, color: "#FFFFFF" }}>{f.t}</span>
                </div>
              ))}
            </div>

            {/* Disclaimer prudent */}
            <div style={{ marginTop: 12, padding: "9px 11px", background: "rgba(255,255,255,0.03)", borderRadius: 12, fontSize: 9, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
              Estimation statistique basée sur tes données de backtest et une projection Monte Carlo (200 simulations). Les performances passées ne garantissent pas les résultats futurs. Ceci n'est pas un conseil financier.
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
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", textAlign: "center", paddingBottom: 4 }}>Indicateur</div>
              <div style={{ fontSize: 10, color: "#6ee7b7", textAlign: "center", fontWeight: 700 }}>Réel</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textAlign: "center", fontWeight: 700 }}>Simulation</div>
            </div>
            {[
              { label: "Trades", real: stats.total, sim2: "-" },
              (() => {
                // Calcul trades/jour réels : à partir des dates si disponibles
                const uniqueDays = new Set(trades.map(t => t.time ? t.time.split(' ')[0] : null).filter(Boolean));
                const dayCount = uniqueDays.size > 1 ? uniqueDays.size : null;
                const realTPD = dayCount ? (stats.total / dayCount).toFixed(2) : null;
                const simTPD = tradesPerDay;
                const ok = realTPD ? Math.abs(parseFloat(realTPD) - simTPD) / Math.max(simTPD, 0.1) < 0.4 : undefined;
                return {
                  label: "Trades / jour",
                  real: realTPD ? realTPD : (stats.total > 0 ? "~" + (stats.total / 20).toFixed(2) : "-"),
                  sim2: simTPD + "/j",
                  ok,
                  sub: dayCount ? dayCount + " jours détectés" : "dates non lisibles",
                };
              })(),
              { label: "Winrate", real: stats.wr.toFixed(0) + "%", sim2: winrate + "%", ok: stats.wr >= winrate - 5 },
              { label: "Moy. gain", real: "$" + stats.avgWin.toFixed(0), sim2: "-" },
              { label: "Moy. perte", real: "$" + stats.avgLoss.toFixed(0), sim2: "$" + (capital * riskPct / 100).toFixed(0), ok: stats.avgLoss <= capital * riskPct / 100 * 1.2 },
              { label: "RR réel", real: "1:" + stats.rr.toFixed(2), sim2: finalRR ? "1:" + finalRR.toFixed(2) : "-", ok: stats.rr >= (finalRR || 0) * 0.85 },
              { label: "PF", real: stats.pf.toFixed(2), sim2: "-", ok: stats.pf >= 1.3 },
              { label: "P&L total", real: "$" + stats.totalPnl.toFixed(0), sim2: sim && sim.funded ? "$" + (sim.funded.cumulPayout).toFixed(0) : "-" },
              {
                label: "DD max",
                real: balanceReconstructed ? "⚠ inconnu" : stats.ddPct.toFixed(2) + "%",
                sim2: balanceReconstructed ? "solde requis" : (model ? model.totalDD * 100 : 10) + "% max",
                ok: balanceReconstructed ? undefined : stats.ddPct < (model ? model.totalDD * 100 * 0.7 : 7),
                note: balanceReconstructed,
              },
            ].map(row => (
              <div key={row.label} className="row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
                  <div>{row.label}</div>
                  {row.sub && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{row.sub}</div>}
                </div>
                <span style={{ textAlign: "center", fontWeight: 700, fontSize: 11, color: row.ok === false ? "#ef4444" : row.ok === true ? "#6ee7b7" : "#FFFFFF" }}>{row.real}</span>
                <span style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{row.sim2}</span>
              </div>
            ))}
          </div>

        </>
      )}

      {/* ══════════════════════════════════════════════════════
          BLOCS VISUELS — uniquement si trades importés
          Jamais de données sim ici, tout vient de trades[]
      ══════════════════════════════════════════════════════ */}
      {trades.length > 0 && (
        <>
          {/* ── COURBE EQUITY : réel (trades) vs simulation (optionnel) ── */}
          {chartData.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                Courbe Equity — Réel vs Simulation
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginBottom: 12 }}>
                🟢 Réel (backtest importé){sim && sim.funded && sim.funded.data && sim.funded.data.length ? " · ⬜ Simulation" : ""}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="greel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.2} /><stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gsim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(255,255,255,0.55)" stopOpacity={0.1} /><stop offset="100%" stopColor="rgba(255,255,255,0.55)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a28" />
                  <XAxis dataKey="pt" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "#" + v} />
                  <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "$" + (v / 1000).toFixed(1) + "k"} domain={["auto", "auto"]} />
                  <Tooltip formatter={(v, name) => ["$" + Number(v).toFixed(0), name]} contentStyle={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }} />
                  <ReferenceLine y={capital} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 2" />
                  {sim && sim.funded && sim.funded.data && sim.funded.data.length > 0 && (
                    <Area type="monotone" dataKey="simulation" stroke="rgba(255,255,255,0.3)" strokeWidth={1} fill="url(#gsim)" dot={false} name="Simulation" strokeDasharray="4 2" />
                  )}
                  <Area type="monotone" dataKey="reel" stroke="#6ee7b7" strokeWidth={2.5} fill="url(#greel)" dot={false} name="Réel (backtest)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── CALENDRIER PnL — AU-DESSUS du tableau mensuel (100% trades importés) ── */}
          {dailyLogReel.length > 0 && (
            <CalendrierPnL dailyLog={dailyLogReel} />
          )}

          {/* ── TABLEAU MENSUEL — 100% calculé depuis trades importés ── */}
          {monthlyReel.length > 0 && (
            <div className="card" style={{ border: "1px solid rgba(110,231,183,0.12)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                Détail Mensuel — Backtest réel
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 52px 52px 42px 42px", gap: 4, marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Mois", "Equity", "Profit%", "P&L $", "DD max", "W/L"].map(h => (
                  <div key={h} style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>{h}</div>
                ))}
              </div>
              {monthlyReel.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "30px 1fr 52px 52px 42px 42px", gap: 4, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>M{r.month}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>${(r.equity / 1000).toFixed(1)}k</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: r.profitPct >= 0 ? "#6ee7b7" : "#ef4444" }}>
                    {r.profitPct >= 0 ? "+" : ""}{r.profitPct.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: r.pnl >= 0 ? "#6ee7b7" : "#ef4444" }}>
                    {r.pnl >= 0 ? "+" : ""}{r.pnl.toFixed(0)}$
                  </div>
                  <div style={{ fontSize: 11, color: r.maxDD > (model ? model.totalDD * 100 * 0.7 : 7) ? "#f87171" : "rgba(255,255,255,0.5)" }}>
                    {r.maxDD.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                    {r.winDays}W/{r.lossDays}L
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          JOURNAL DE TRADING — saisie manuelle + captures MT4/MT5
          Données partagées avec le journal de la page d'accueil
      ══════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 12px" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(110,231,183,0.15)" }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", textTransform: "uppercase", letterSpacing: 1.5 }}>
          📓 Journal de trading
        </div>
        <div style={{ flex: 1, height: 1, background: "rgba(110,231,183,0.15)" }} />
      </div>

      {/* Toggle affichage journal */}
      <div className="card" style={{ border: "1px solid rgba(110,231,183,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>Mon journal réel</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
              Saisis tes journées de trading et ajoute tes captures MT4/MT5. Synchronisé avec l'accueil.
            </div>
          </div>
          <div onClick={() => setShowJournal(v => !v)} style={{
            width: 38, height: 22, borderRadius: 11, background: showJournal ? "#6ee7b7" : "rgba(255,255,255,0.1)",
            border: "1px solid " + (showJournal ? "#6ee7b7" : "rgba(255,255,255,0.1)"),
            position: "relative", cursor: "pointer", transition: "all .2s", flexShrink: 0, marginLeft: 10,
          }}>
            <div style={{ position: "absolute", top: 2, left: showJournal ? 18 : 2, width: 16, height: 16, borderRadius: 8, background: "#fff", transition: "all .2s" }} />
          </div>
        </div>

        {showJournal && (
          <div style={{ marginTop: 12 }}>
            {/* Sélecteur de mois */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <input
                type="month"
                value={jMonth}
                onChange={e => setJMonth(e.target.value)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(110,231,183,0.2)", borderRadius: 10, padding: "8px 12px", color: "#FFFFFF", fontSize: 13, fontWeight: 600, outline: "none", colorScheme: "dark" }}
              />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                {Object.keys(jMonthData).length} jour(s) saisi(s)
              </span>
            </div>
            <CalendrierPnL
              dailyLog={[]}
              journalMode={true}
              journalData={jMonthData}
              onJournalSave={saveJEntry}
              journalMonthLabel={"Clique un jour pour saisir tes trades · " + jMonth}
            />
          </div>
        )}
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HOOK JOURNAL DE TRADING — partagé Dashboard + Mes Trades
// Données dans localStorage "eapropfirm_journal", clé par mois YYYY-MM
// Entrée jour : { wins, losses, pnl, images?: [base64...] }
// ══════════════════════════════════════════════════════════════════
function useJournal() {
  const [journalMonth, setJournalMonth] = useState(() => {
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  });
  const [journal, setJournal] = useState(() => {
    try { const r = localStorage.getItem("eapropfirm_journal"); return r ? JSON.parse(r) : {}; }
    catch (e) { return {}; }
  });
  const saveJournalEntry = (day, entry) => {
    setJournal(prev => {
      const next = { ...prev };
      if (!next[journalMonth]) next[journalMonth] = {};
      else next[journalMonth] = { ...next[journalMonth] };
      if (entry === null) {
        delete next[journalMonth][String(day)];
      } else {
        next[journalMonth][String(day)] = entry;
      }
      try {
        localStorage.setItem("eapropfirm_journal", JSON.stringify(next));
      } catch (e) {
        // Quota localStorage dépassé (souvent à cause des images)
        alert("Stockage plein. Supprime quelques images du journal pour libérer de l'espace.");
        return prev;
      }
      return next;
    });
  };
  return { journal, journalMonth, setJournalMonth, saveJournalEntry, monthData: journal[journalMonth] || {} };
}

// Compresse une image (capture MT4/MT5) en JPEG base64 — max 900px, qualité 0.72
function compressImage(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function CalendrierPnL({ dailyLog, journalMode = false, journalData = {}, onJournalSave = null, journalMonthLabel = null }) {
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [editingDay, setEditingDay] = useState(null); // jour en cours d'édition (mode journal)
  const [formWins, setFormWins] = useState("");
  const [formLosses, setFormLosses] = useState("");
  const [formGain, setFormGain] = useState("");
  const [formImages, setFormImages] = useState([]); // captures MT4/MT5 (base64)
  const [viewerImg, setViewerImg] = useState(null); // visionneuse plein écran
  const [imgLoading, setImgLoading] = useState(false);

  if (!dailyLog || dailyLog.length === 0) {
    // En mode journal, on affiche quand même un calendrier vide à remplir
    if (!journalMode) return null;
  }

  const safeLog = dailyLog || [];
  const months = journalMode ? [selectedMonth] : [...new Set(safeLog.map(d => d.month))];
  const monthDays = safeLog.filter(d => d.month === selectedMonth);

  // En mode journal : les données viennent de journalData (clé = numéro de jour)
  // Format journalData : { "1": {wins, losses, pnl}, "2": {...}, ... }
  const journalDays = journalMode
    ? Object.keys(journalData).map(k => ({ dayNum: parseInt(k), ...journalData[k] }))
    : [];

  // P&L et stats : en mode journal, basé sur journalData ; sinon sur monthDays
  const statsSource = journalMode
    ? journalDays.map(d => ({ pnl: d.pnl, wins: d.wins, losses: d.losses }))
    : monthDays;
  const monthPnl = statsSource.reduce((s, d) => s + (d.pnl || 0), 0);
  const winDays = statsSource.filter(d => (d.pnl || 0) > 0).length;
  const lossDays = statsSource.filter(d => (d.pnl || 0) < 0).length;
  const bestDay = statsSource.length ? Math.max(...statsSource.map(d => d.pnl || 0)) : 0;
  const worstDay = statsSource.length ? Math.min(...statsSource.map(d => d.pnl || 0)) : 0;

  const buildCalendarGrid = () => {
    const grid = [];
    if (journalMode) {
      // Mode journal : grille complète du mois (30 jours), TOUS les jours cliquables
      // (y compris weekend — l'utilisateur décide de saisir ou non)
      for (let dayNum = 1; dayNum <= 30; dayNum++) {
        const dow = (dayNum - 1) % 7;
        const isWeekend = dow >= 5;
        const entry = journalData[String(dayNum)];
        grid.push({
          dayNum,
          trading: true, // tous les jours saisissables en mode journal
          isWeekendDay: isWeekend, // pour le style visuel
          journalEntry: entry || null,
          data: entry ? { pnl: entry.pnl, wins: entry.wins, losses: entry.losses } : null,
        });
      }
      return grid;
    }
    // Mode normal (simulation) : inchangé
    let tradingIdx = 0;
    let dayNum = 1;
    while (tradingIdx < monthDays.length && dayNum <= 31) {
      const dow = (dayNum - 1) % 7;
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

  const maxAbsPnl = journalMode
    ? (journalDays.length ? Math.max(...journalDays.map(d => Math.abs(d.pnl || 0)), 1) : 1)
    : (monthDays.length ? Math.max(...monthDays.map(d => Math.abs(d.pnl)), 1) : 1);

  const cellColor = (pnl) => {
    if (pnl === undefined || pnl === null)
      return { bg: "#16161f", fg: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.08)", numColor: "rgba(255,255,255,0.2)" };

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
        : { bg: "rgba(239,68,68,0.08)",  fg: "#f87171",  border: "1px solid #450a0a", numColor: "#fca5a5" };   // rouge fonce - petite perte
    }
    return { bg: "rgba(255,255,255,0.08)", fg: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)", numColor: "rgba(255,255,255,0.55)" };
  };

  return (
    <div className="card" style={{ padding: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#FFFFFF" }}>
            {journalMode ? "Journal de trading" : "Calendrier PnL"}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>
            {journalMode
              ? (journalMonthLabel || "Clique un jour pour saisir tes trades")
              : "Mois " + selectedMonth + " - simulation jour par jour"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button onClick={() => setSelectedMonth(Math.max(1, selectedMonth - 1))}
            disabled={selectedMonth <= 1}
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: selectedMonth <= 1 ? "rgba(255,255,255,0.2)" : "#6ee7b7", width: 32, height: 32, fontSize: 18, fontWeight: 700, cursor: "pointer", lineHeight: 1 }}>
            ‹
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7", minWidth: 60, textAlign: "center" }}>
            M{selectedMonth}/{months.length}
          </span>
          <button onClick={() => setSelectedMonth(Math.min(months.length, selectedMonth + 1))}
            disabled={selectedMonth >= months.length}
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: selectedMonth >= months.length ? "rgba(255,255,255,0.2)" : "#6ee7b7", width: 32, height: 32, fontSize: 18, fontWeight: 700, cursor: "pointer", lineHeight: 1 }}>
            ›
          </button>
        </div>
      </div>

      {/* Stats resume */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14 }}>
        {[
          { label: "P&L mois", val: (monthPnl >= 0 ? "+$" : "-$") + Math.abs(monthPnl).toFixed(0), color: monthPnl >= 0 ? "#4ade80" : "#f87171" },
          { label: "Jours +/-", val: winDays + "j / " + lossDays + "j", color: "#FFFFFF" },
          { label: "Meilleur", val: (bestDay >= 0 ? "+$" : "-$") + Math.abs(bestDay).toFixed(0), color: bestDay >= 0 ? "#4ade80" : "#f87171" },
          { label: "Pire", val: (worstDay >= 0 ? "+$" : "-$") + Math.abs(worstDay).toFixed(0), color: worstDay >= 0 ? "#4ade80" : "#f87171" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "7px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* En-tete jours semaine */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 3 }}>
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((j, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 11, color: (i >= 5 && !journalMode) ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.35)", fontWeight: 700, paddingBottom: 4 }}>{j}</div>
        ))}
      </div>

      {/* Grille calendrier */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {grid.map((cell, i) => {
          const hasData = cell.data && (cell.data.pnl !== undefined && cell.data.pnl !== null);
          const c = (cell.trading && hasData) ? cellColor(cell.data.pnl) : { bg: "#0d0d15", fg: "rgba(255,255,255,0.05)", border: "1px solid #12121a", numColor: "rgba(255,255,255,0.05)" };
          const isWeekend = journalMode ? cell.isWeekendDay : !cell.trading;
          // En mode journal : TOUTES les cases sont cliquables (weekend inclus)
          const clickable = journalMode && cell.trading;
          const emptyJournalCell = journalMode && cell.trading && !hasData;
          return (
            <div key={i}
              onClick={() => {
                if (!clickable) return;
                const existing = journalData[String(cell.dayNum)];
                setEditingDay(cell.dayNum);
                setFormWins(existing ? String(existing.wins) : "");
                setFormLosses(existing ? String(existing.losses) : "");
                setFormGain(existing ? String(existing.pnl) : "");
                setFormImages(existing && existing.images ? existing.images : []);
              }}
              style={{
                background: emptyJournalCell ? "rgba(255,255,255,0.03)" : c.bg,
                border: emptyJournalCell ? "1px dashed rgba(255,255,255,0.15)" : c.border,
                borderRadius: 8,
                padding: "5px 4px",
                minHeight: 52,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: (isWeekend && !journalMode) ? 0.35 : (isWeekend && journalMode ? 0.6 : 1),
                cursor: clickable ? "pointer" : "default",
                transition: "all .15s",
              }}>
              <div style={{ fontSize: 10, color: emptyJournalCell ? "rgba(255,255,255,0.4)" : c.numColor, fontWeight: 700 }}>
                {cell.dayNum}
              </div>
              {/* Case vide en mode journal : croix grise + */}
              {emptyJournalCell && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                  <span style={{ fontSize: 18, color: "rgba(255,255,255,0.25)", fontWeight: 300, lineHeight: 1 }}>+</span>
                </div>
              )}
              {/* Case avec données (simulation OU journal rempli) */}
              {cell.trading && hasData && (
                <>
                  <div style={{ fontSize: 11, color: c.fg, fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
                    {cell.data.pnl >= 0 ? "+" : ""}
                    {Math.abs(cell.data.pnl) >= 1000
                      ? "$" + (cell.data.pnl / 1000).toFixed(1) + "k"
                      : "$" + Math.abs(cell.data.pnl).toFixed(0)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 3 }}>
                    <span style={{ fontSize: 8, color: c.fg, opacity: 0.75 }}>
                      {cell.data.wins}W {cell.data.losses}L
                    </span>
                    {journalMode && cell.journalEntry && cell.journalEntry.images && cell.journalEntry.images.length > 0 && (
                      <span style={{ fontSize: 7 }}>📷</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ── MODAL SAISIE JOURNAL ── */}
      {journalMode && editingDay !== null && (
        <div
          onClick={() => setEditingDay(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 20,
          }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#12121a", border: "1px solid rgba(110,231,183,0.25)",
              borderRadius: 18, padding: 20, width: "100%", maxWidth: 340,
            }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 4 }}>
              Jour {editingDay}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>
              Saisis tes résultats de la journée
            </div>

            {/* Trades gagnants */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 5 }}>Trades gagnants</label>
              <input type="number" inputMode="numeric" value={formWins} onChange={e => setFormWins(e.target.value)}
                placeholder="0"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(110,231,183,0.2)", borderRadius: 10, padding: "10px 12px", color: "#FFFFFF", fontSize: 15, fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Trades perdants */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 5 }}>Trades perdants</label>
              <input type="number" inputMode="numeric" value={formLosses} onChange={e => setFormLosses(e.target.value)}
                placeholder="0"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 12px", color: "#FFFFFF", fontSize: 15, fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Gain du jour */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 5 }}>Gain / Perte du jour ($)</label>
              <input type="number" inputMode="decimal" value={formGain} onChange={e => setFormGain(e.target.value)}
                placeholder="ex: 250 ou -120"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 12px", color: "#FFFFFF", fontSize: 15, fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Upload captures MT4/MT5 */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 6 }}>
                Captures d'écran MT4/MT5 ({formImages.length}/3)
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {formImages.map((img, idx) => (
                  <div key={idx} style={{ position: "relative", width: 64, height: 64 }}>
                    <img
                      src={img}
                      alt={"capture " + (idx+1)}
                      onClick={() => setViewerImg(img)}
                      style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(110,231,183,0.25)", cursor: "pointer" }}
                    />
                    <button
                      onClick={() => setFormImages(prev => prev.filter((_, i) => i !== idx))}
                      style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 9, background: "#ef4444", color: "#fff", border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                      ✕
                    </button>
                  </div>
                ))}
                {formImages.length < 3 && (
                  <label style={{
                    width: 64, height: 64, borderRadius: 8, border: "1px dashed rgba(255,255,255,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    background: "rgba(255,255,255,0.03)", flexDirection: "column", gap: 2,
                  }}>
                    <span style={{ fontSize: 18, color: "rgba(255,255,255,0.4)", lineHeight: 1 }}>{imgLoading ? "…" : "+"}</span>
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>{imgLoading ? "" : "photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files && e.target.files[0];
                        e.target.value = "";
                        if (!file) return;
                        setImgLoading(true);
                        try {
                          const compressed = await compressImage(file);
                          setFormImages(prev => prev.length < 3 ? [...prev, compressed] : prev);
                        } catch (err) {
                          alert("Impossible de lire cette image.");
                        }
                        setImgLoading(false);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Boutons */}
            <div style={{ display: "flex", gap: 8 }}>
              {journalData[String(editingDay)] && (
                <button
                  onClick={() => { if (onJournalSave) onJournalSave(editingDay, null); setEditingDay(null); }}
                  style={{ padding: "11px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", color: "#f87171", fontSize: 13, fontWeight: 700, border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer" }}>
                  Effacer
                </button>
              )}
              <button
                onClick={() => setEditingDay(null)}
                style={{ flex: 1, padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }}>
                Annuler
              </button>
              <button
                onClick={() => {
                  const wins = parseInt(formWins) || 0;
                  const losses = parseInt(formLosses) || 0;
                  const pnl = parseFloat(formGain) || 0;
                  const entry = { wins, losses, pnl };
                  if (formImages.length > 0) entry.images = formImages;
                  if (onJournalSave) onJournalSave(editingDay, entry);
                  setEditingDay(null);
                }}
                style={{ flex: 1, padding: "11px 14px", borderRadius: 10, background: "#6ee7b7", color: "#000", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VISIONNEUSE IMAGE PLEIN ÉCRAN ── */}
      {viewerImg && (
        <div
          onClick={() => setViewerImg(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1100, padding: 16, cursor: "pointer",
          }}>
          <img src={viewerImg} alt="capture" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }} />
          <button
            onClick={() => setViewerImg(null)}
            style={{ position: "absolute", top: 18, right: 18, width: 36, height: 36, borderRadius: 18, background: "rgba(255,255,255,0.12)", color: "#fff", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            ✕
          </button>
        </div>
      )}

      {/* Legende */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        {[
          { bg: "#6ee7b7", label: "Gros gain" },
          { bg: "#052e16", label: "Petit gain", fg: "#4ade80" },
          { bg: "#dc2626", label: "Grosse perte" },
          { bg: "rgba(239,68,68,0.08)", label: "Petite perte", fg: "#f87171" },
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

// ══════════════════════════════════════════════════════════════════
// FLAG ICON — drapeaux SVG (pas d'emoji)
// ══════════════════════════════════════════════════════════════════
function FlagIcon({ lang, size = 28 }) {
  const s = size;
  if (lang === "fr") return (
    <svg width={s} height={Math.round(s*0.75)} viewBox="0 0 24 18" rx="3">
      <rect width="24" height="18" fill="#002395" rx="3"/>
      <rect x="8" width="8" height="18" fill="#fff"/>
      <rect x="16" width="8" height="18" fill="#ED2939" rx="3"/>
      <rect width="8" height="18" fill="#002395" rx="3"/>
    </svg>
  );
  if (lang === "en") return (
    <svg width={s} height={Math.round(s*0.75)} viewBox="0 0 24 18">
      <rect width="24" height="18" fill="#012169" rx="3"/>
      <path d="M0 0l24 18M24 0L0 18" stroke="#fff" strokeWidth="3.5"/>
      <path d="M0 0l24 18M24 0L0 18" stroke="#C8102E" strokeWidth="2"/>
      <path d="M12 0v18M0 9h24" stroke="#fff" strokeWidth="5"/>
      <path d="M12 0v18M0 9h24" stroke="#C8102E" strokeWidth="3"/>
    </svg>
  );
  if (lang === "es") return (
    <svg width={s} height={Math.round(s*0.75)} viewBox="0 0 24 18">
      <rect width="24" height="18" fill="#AA151B" rx="3"/>
      <rect x="0" y="4.5" width="24" height="9" fill="#F1BF00"/>
    </svg>
  );
  return <div style={{ width: s, height: Math.round(s*0.75), background: "rgba(255,255,255,0.1)", borderRadius: 3 }}/>;
}

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
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginBottom: 28, lineHeight: 1.5 }}>
          Tu pourras la changer plus tard dans les paramètres.
        </div>

        {/* Liste des langues */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {LANGS.map(l => {
            const sel = selected === l.k;
            return (
              <button key={l.k} onClick={() => setSelected(l.k)} style={{
                width: "100%", padding: "18px 20px", borderRadius: 18,
                background: sel ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.05)",
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
                  <div style={{ fontSize: 17, fontWeight: 700, color: sel ? "#6ee7b7" : "#FFFFFF", marginBottom: 2 }}>
                    {l.label}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
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

  // ── Slide 1 ──────────────────
  const Slide1 = () => (
    <div style={{ height: "100%", position: "relative", overflow: "hidden" }}>
      {/* Image cover pleine largeur, poussée vers le bas pour ne pas superposer le texte */}
      <img
        src="/9C04F5A9-504B-41BA-BB77-DB5B82902B46_opt.jpg"
        alt="Prop Firm Simulator"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center 3%",
          display: "block",
        }}
      />
      {/* Gradient haut : couvre la zone texte uniquement */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "45%",
        background: "linear-gradient(180deg, #06090f 0%, #06090f 25%, rgba(6,9,15,0.7) 55%, transparent 100%)",
        pointerEvents: "none",
      }} />
      {/* Gradient bas nav */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 90,
        background: "linear-gradient(transparent 0%, rgba(6,9,15,0.85) 100%)",
        pointerEvents: "none",
      }} />
      {/* Texte en haut */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "calc(12px + env(safe-area-inset-top)) 22px 0",
        zIndex: 2,
      }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 10 }}>1 / 3</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", lineHeight: 1.15, letterSpacing: -0.3, marginBottom: 2 }}>
          {tx.s1h1}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.3, marginBottom: 12 }}>
          <span style={{ color: "#ffffff" }}>{tx.s1h2}</span><span style={{ color: "#f87171" }}>{tx.s1h2r}</span>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
          {tx.s1sub}<span style={{ color: "#ffffff", fontWeight: 700 }}>{tx.s1bold}</span>
        </div>
      </div>
    </div>
  );

  // ── Slide 2 ──────────────────
  const Slide2 = () => (
    <div style={{ height: "100%", position: "relative", overflow: "hidden" }}>
      <img
        src="/6851BC14-AB5F-4662-813E-A5E7486744B7_opt.jpg"
        alt="Prop Firm Simulator"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center 40%",
          display: "block",
        }}
      />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "38%",
        background: "linear-gradient(180deg, rgba(6,9,15,0.88) 0%, rgba(6,9,15,0.6) 50%, transparent 100%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 90,
        background: "linear-gradient(transparent 0%, rgba(6,9,15,0.85) 100%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "calc(12px + env(safe-area-inset-top)) 22px 0",
        zIndex: 2,
      }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 10 }}>2 / 3</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", lineHeight: 1.15, letterSpacing: -0.3, marginBottom: 2 }}>
          {tx.s2h1}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#6ee7b7", lineHeight: 1.15, letterSpacing: -0.3, marginBottom: 12 }}>
          {tx.s2h2}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
          {tx.s2sub}
        </div>
      </div>
    </div>
  );

  // ── Slide 3 ──────────────────
  const Slide3 = () => (
    <div style={{ height: "100%", position: "relative", overflow: "hidden" }}>
      <img
        src="/CBA95772-B4CE-481F-9780-A3197BBEE825_opt.jpg"
        alt="Prop Firm Simulator"
        style={{
          position: "absolute",
          bottom: 80, left: 0, right: 0,
          width: "100%", height: "auto",
          objectFit: "contain",
          display: "block",
        }}
      />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "38%",
        background: "linear-gradient(180deg, rgba(6,9,15,0.88) 0%, rgba(6,9,15,0.6) 50%, transparent 100%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 90,
        background: "linear-gradient(transparent 0%, rgba(6,9,15,0.85) 100%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "calc(12px + env(safe-area-inset-top)) 22px 0",
        zIndex: 2,
      }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 10 }}>3 / 3</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", lineHeight: 1.15, letterSpacing: -0.3, marginBottom: 2 }}>
          {tx.s3h1}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#6ee7b7", lineHeight: 1.15, letterSpacing: -0.3, marginBottom: 12 }}>
          {tx.s3h2}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
          {tx.s3sub1}<span style={{ color: "#f87171", fontWeight: 700 }}>{tx.s3subr}</span>{tx.s3sub2}
        </div>
      </div>
    </div>
  );

  const slides = [<Slide1 key="s1"/>, <Slide2 key="s2"/>, <Slide3 key="s3"/>];
  const isLast = step === 2;

  return (
    <div style={{
      height: "100dvh",
      background: "#06090f", position: "relative",
      maxWidth: 480, margin: "0 auto",
      fontFamily: "-apple-system, sans-serif", color: "#FFFFFF",
      overflow: "hidden", display: "flex", flexDirection: "column",
    }}>

      {/* Bouton Passer */}
      {!isLast && (
        <button onClick={onDone} style={{
          position: "absolute", top: "calc(16px + env(safe-area-inset-top))", right: 20,
          background: "none", border: "none", color: "rgba(255,255,255,0.45)",
          fontSize: 13, fontWeight: 600, cursor: "pointer", zIndex: 20,
        }}>
          Passer
        </button>
      )}

      {/* Slide actif — prend tout l'espace disponible */}
      <div style={{ flex: 1, overflow: "hidden", paddingBottom: 80 }}>
        {slides[step]}
      </div>

      {/* Navigation bas fixe */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(transparent, #06090f 50%)",
        padding: "16px 24px calc(24px + env(safe-area-inset-bottom))",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 10,
      }}>
        {/* Dots */}
        <div style={{ display: "flex", gap: 6, flex: 1, justifyContent: "center" }}>
          {[0,1,2].map(i => (
            <div key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4, cursor: "pointer",
              background: i === step ? "#6ee7b7" : "rgba(110,231,183,0.2)",
              transition: "all .3s",
            }} />
          ))}
        </div>
        {/* Bouton suivant / Commencer */}
        <button onClick={isLast ? onDone : () => setStep(s => s + 1)} style={{
          padding: "13px 24px", borderRadius: 100, border: "none", cursor: "pointer",
          background: "#6ee7b7",
          color: "#000000", fontSize: 14, fontWeight: 600,
          boxShadow: "0 4px 20px rgba(110,231,183,0.25)",
        }}>
          {isLast ? (lang === "en" ? "Start" : lang === "es" ? "Comenzar" : "Commencer") : tx.next}
        </button>
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
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.70)", letterSpacing: 3, textTransform: "uppercase", marginTop: 3 }}>
            SIMULATOR
          </div>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, marginTop: 12 }}>
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
  // Logos SVG fidèles aux vraies identités visuelles des prop firms
  switch (firmKey) {
    case "ftmo": return (
      // FTMO : losange bleu royal + texte FTMO blanc — identité officielle 2024
      <svg width={s} height={s} viewBox="0 0 44 44">
        <defs>
          <linearGradient id="ftmo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a2744"/>
            <stop offset="100%" stopColor="#0f1a35"/>
          </linearGradient>
          <linearGradient id="ftmo-diamond" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb"/>
            <stop offset="100%" stopColor="#1d4ed8"/>
          </linearGradient>
        </defs>
        <rect width="44" height="44" rx="10" fill="url(#ftmo-bg)"/>
        {/* Losange caractéristique FTMO */}
        <polygon points="22,4 38,22 22,40 6,22" fill="url(#ftmo-diamond)"/>
        <polygon points="22,11 30,22 22,33 14,22" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
        {/* Lignes croisées */}
        <line x1="6" y1="22" x2="38" y2="22" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"/>
        <line x1="22" y1="4" x2="22" y2="40" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"/>
      </svg>
    );
    case "fundednext": return (
      // FundedNext : "FN" stylisé, couleurs violet→bleu électrique + fond sombre
      <svg width={s} height={s} viewBox="0 0 44 44">
        <defs>
          <linearGradient id="fn-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a0a2e"/>
            <stop offset="100%" stopColor="#0d1230"/>
          </linearGradient>
          <linearGradient id="fn-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6"/>
            <stop offset="50%" stopColor="#6366f1"/>
            <stop offset="100%" stopColor="#3b82f6"/>
          </linearGradient>
        </defs>
        <rect width="44" height="44" rx="10" fill="url(#fn-bg)"/>
        {/* Symbole FN — flèche montante stylisée */}
        <path d="M8 34 L8 14 L18 14 L18 20 L14 20 L14 34 Z" fill="url(#fn-accent)"/>
        <path d="M22 34 L22 10 L36 26 L30 26 L30 34 Z" fill="url(#fn-accent)"/>
        <path d="M22 10 L36 10 L36 26" fill="none" stroke="url(#fn-accent)" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    );
    case "e8": return (
      // E8 Markets : "E8" typographié, fond bleu nuit profond, accents bleu électrique
      <svg width={s} height={s} viewBox="0 0 44 44">
        <defs>
          <linearGradient id="e8-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06050f"/>
            <stop offset="100%" stopColor="#0a0820"/>
          </linearGradient>
          <linearGradient id="e8-txt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa"/>
            <stop offset="100%" stopColor="#3b82f6"/>
          </linearGradient>
        </defs>
        <rect width="44" height="44" rx="10" fill="url(#e8-bg)"/>
        {/* Bordure fine bleu */}
        <rect width="44" height="44" rx="10" fill="none" stroke="#1e3a8a" strokeWidth="1"/>
        {/* E */}
        <rect x="6" y="10" width="14" height="3" rx="1" fill="url(#e8-txt)"/>
        <rect x="6" y="10" width="3" height="24" rx="1" fill="url(#e8-txt)"/>
        <rect x="6" y="20.5" width="11" height="3" rx="1" fill="url(#e8-txt)"/>
        <rect x="6" y="31" width="14" height="3" rx="1" fill="url(#e8-txt)"/>
        {/* 8 */}
        <rect x="24" y="10" width="14" height="3" rx="1" fill="url(#e8-txt)"/>
        <rect x="24" y="10" width="3" height="13" rx="1" fill="url(#e8-txt)"/>
        <rect x="35" y="10" width="3" height="13" rx="1" fill="url(#e8-txt)"/>
        <rect x="24" y="20.5" width="14" height="3" rx="1" fill="url(#e8-txt)"/>
        <rect x="24" y="23.5" width="3" height="11" rx="1" fill="url(#e8-txt)"/>
        <rect x="35" y="23.5" width="3" height="11" rx="1" fill="url(#e8-txt)"/>
        <rect x="24" y="31" width="14" height="3" rx="1" fill="url(#e8-txt)"/>
      </svg>
    );
    case "alpha": return (
      // Alpha Capital Group : triangle doré pointant vers le haut, fond sombre premium
      <svg width={s} height={s} viewBox="0 0 44 44">
        <defs>
          <linearGradient id="alpha-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f0f0f"/>
            <stop offset="100%" stopColor="#1a1200"/>
          </linearGradient>
          <linearGradient id="alpha-gold" x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fde68a"/>
            <stop offset="50%" stopColor="#f59e0b"/>
            <stop offset="100%" stopColor="#d97706"/>
          </linearGradient>
        </defs>
        <rect width="44" height="44" rx="10" fill="url(#alpha-bg)"/>
        {/* Triangle Alpha — grand */}
        <polygon points="22,5 40,38 4,38" fill="url(#alpha-gold)"/>
        {/* Triangle intérieur creux */}
        <polygon points="22,15 33,36 11,36" fill="url(#alpha-bg)"/>
        {/* Ligne dorée centrale */}
        <line x1="22" y1="15" x2="22" y2="36" stroke="url(#alpha-gold)" strokeWidth="1.5" opacity="0.6"/>
      </svg>
    );
    case "the5ers": return (
      // The 5%ers : "5" stylisé + vert caractéristique, fond sombre
      <svg width={s} height={s} viewBox="0 0 44 44">
        <defs>
          <linearGradient id="t5-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#071a0f"/>
            <stop offset="100%" stopColor="#030d07"/>
          </linearGradient>
          <linearGradient id="t5-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80"/>
            <stop offset="100%" stopColor="#16a34a"/>
          </linearGradient>
        </defs>
        <rect width="44" height="44" rx="10" fill="url(#t5-bg)"/>
        {/* Chiffre 5 stylisé */}
        {/* Barre top */}
        <rect x="9" y="8" width="22" height="4" rx="2" fill="url(#t5-green)"/>
        {/* Barre gauche haut */}
        <rect x="9" y="8" width="4" height="12" rx="2" fill="url(#t5-green)"/>
        {/* Barre milieu */}
        <rect x="9" y="18" width="22" height="4" rx="2" fill="url(#t5-green)"/>
        {/* Arc bas droit */}
        <path d="M13 22 Q13 36 22 36 Q31 36 31 28 Q31 22 22 22" fill="none" stroke="url(#t5-green)" strokeWidth="4" strokeLinecap="round"/>
        {/* Cercle interne */}
        <circle cx="22" cy="29" r="4" fill="url(#t5-green)" opacity="0.3"/>
      </svg>
    );
    case "fundingpips": return (
      // FundingPips : "FP" + bâtonnets haussiers, couleur orange/rouge → rouge caractéristique
      <svg width={s} height={s} viewBox="0 0 44 44">
        <defs>
          <linearGradient id="fp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a0a00"/>
            <stop offset="100%" stopColor="#0f0500"/>
          </linearGradient>
          <linearGradient id="fp-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316"/>
            <stop offset="100%" stopColor="#dc2626"/>
          </linearGradient>
        </defs>
        <rect width="44" height="44" rx="10" fill="url(#fp-bg)"/>
        <rect width="44" height="44" rx="10" fill="none" stroke="rgba(249,115,22,0.3)" strokeWidth="1"/>
        {/* Lettre F */}
        <rect x="6" y="8" width="3.5" height="28" rx="1.5" fill="url(#fp-red)"/>
        <rect x="6" y="8" width="14" height="3.5" rx="1.5" fill="url(#fp-red)"/>
        <rect x="6" y="20" width="11" height="3.5" rx="1.5" fill="url(#fp-red)"/>
        {/* Lettre P */}
        <rect x="24" y="8" width="3.5" height="28" rx="1.5" fill="url(#fp-red)"/>
        <rect x="24" y="8" width="12" height="3.5" rx="1.5" fill="url(#fp-red)"/>
        <rect x="24" y="20" width="12" height="3.5" rx="1.5" fill="url(#fp-red)"/>
        <rect x="33" y="8" width="3.5" height="15" rx="1.5" fill="url(#fp-red)"/>
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

// PROFIL SETUP — 4 étapes : usage → firm/capital → niveau → capital (prop)
// ══════════════════════════════════════════════════════════════════
function ProfileSetupScreen({ t, lang, setLang, onDone }) {
  const [step, setStep]           = useState(0); // 0=usage 1=firm 2=capital 3=niveau
  const [usageType, setUsageType] = useState(null); // "propfirm" | "classic"
  const [firmKey, setFirmKey]     = useState("fundednext");
  const [capital, setCapital]     = useState(25000);
  const [classicCapital, setClassicCapital] = useState(10000);
  const [level, setLevel]         = useState(null); // "beginner"|"experienced"|"professional"

  const firm = PROP_FIRMS[firmKey] || PROP_FIRMS.fundednext;
  const caps = FIRM_CAPITALS[firmKey] || FIRM_CAPITALS.fundednext;
  const fees = FIRM_FEES[firmKey] || {};

  const selectFirm = (k) => {
    setFirmKey(k);
    setCapital((FIRM_CAPITALS[k] || FIRM_CAPITALS.fundednext)[0]);
  };

  const totalSteps = usageType === "propfirm" ? 4 : 3;
  const displayStep = step + 2; // commence à 2/3

  const finish = () => {
    const displayMode = level === "beginner" ? "simple" : "advanced";
    const finalCapital = usageType === "propfirm" ? capital : classicCapital;
    const finalFirm = usageType === "propfirm" ? firmKey : "fundednext";
    syncSimConfig({ firmKey: finalFirm, modelKey: "2step", capital: finalCapital });
    saveApp({
      profile: { lang, firmKey: finalFirm, capital: finalCapital, usageType, level, displayMode },
      setupDone: true
    });
    onDone({ lang, firmKey: finalFirm, capital: finalCapital, usageType, level, displayMode });
  };

  const FIRMS_LIST = [
    { k:"ftmo", label:"FTMO" },{ k:"fundednext", label:"FundedNext" },
    { k:"e8", label:"E8 Markets" },{ k:"alpha", label:"Alpha Capital" },
    { k:"the5ers", label:"The 5%ers" },{ k:"fundingpips", label:"FundingPips" },
  ];

  const LEVELS = [
    { k:"beginner", label:"Débutant",
      desc:"Je débute dans le trading ou les prop firms. Je veux l'essentiel, sans complexité." },
    { k:"experienced", label:"Expérimenté",
      desc:"Je connais les bases. Je veux voir les métriques importantes de mon setup." },
    { k:"professional", label:"Professionnel",
      desc:"Trader confirmé. Je veux accès à toutes les données, métriques avancées et statistiques." },
  ];

  const canContinue = () => {
    if (step === 0) return usageType !== null;
    if (step === 1) {
      if (usageType === "propfirm") return true; // firm sélectionnée
      return classicCapital >= 100;
    }
    if (step === 2) {
      if (usageType === "propfirm") return true; // capital sélectionné
      return level !== null;
    }
    if (step === 3) return level !== null;
    return false;
  };

  const nextStep = () => {
    if (step === 0) { setStep(1); return; }
    if (step === 1 && usageType === "classic") { setStep(2); return; }
    if (step === 1 && usageType === "propfirm") { setStep(2); return; }
    if (step === 2 && usageType === "classic" && level !== null) { finish(); return; }
    if (step === 2 && usageType === "propfirm") { setStep(3); return; }
    if (step === 3) { finish(); return; }
  };

  const progress = usageType === "propfirm"
    ? [0,1,2,3].map(i => i <= step)
    : [0,1,2].map(i => i <= step);

  return (
    <div style={{ minHeight:"100vh", background:"#06090f", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", fontFamily:"-apple-system, sans-serif", paddingBottom:"calc(28px + env(safe-area-inset-bottom))" }}>

      {/* Halo */}
      <div style={{ position:"fixed", top:"10%", left:"50%", transform:"translateX(-50%)", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)", pointerEvents:"none", zIndex:0 }} />

      <div style={{ flex:1, padding:"0 20px", paddingTop:"calc(40px + env(safe-area-inset-top))", overflowY:"auto", position:"relative", zIndex:1 }}>

        {/* Progress bar */}
        <div style={{ fontSize:13, fontWeight:700, color:"#6ee7b7", marginBottom:10 }}>
          Étape {step + 2}/{progress.length + 1}
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:28 }}>
          {progress.map((done, i) => (
            <div key={i} style={{ flex:1, height:4, borderRadius:2, background: done ? "#6ee7b7" : "rgba(255,255,255,0.12)", transition:"background .3s" }} />
          ))}
        </div>

        {/* ══ STEP 0 : USAGE ══ */}
        {step === 0 && (
          <>
            <div style={{ fontSize:26, fontWeight:700, color:"#ffffff", marginBottom:6 }}>
              Comment vas-tu utiliser ce simulateur ?
            </div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,0.45)", marginBottom:28, lineHeight:1.5 }}>
              Cela nous permet de personnaliser l'expérience pour toi.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { k:"propfirm", label:"Challenge Prop Firm",
                  desc:"Je veux passer un challenge FTMO, FundedNext, E8, etc. pour obtenir un capital financé." },
                { k:"classic", label:"Trading Classique",
                  desc:"Je trade avec mon propre capital et je veux simuler / optimiser ma gestion du risque." },
              ].map(opt => (
                <button key={opt.k} onClick={() => setUsageType(opt.k)} style={{
                  width:"100%", padding:"20px", borderRadius:18, cursor:"pointer",
                  background: usageType === opt.k ? "rgba(110,231,183,0.08)" : "rgba(255,255,255,0.04)",
                  border: "1.5px solid " + (usageType === opt.k ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
                  textAlign:"left", transition:"all .15s",
                }}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><TradingAvatar id={opt.k==="propfirm"?6:7} size={28} color={usageType===opt.k?"#6ee7b7":"rgba(255,255,255,0.5)"}/></div>
                  <div style={{ fontSize:17, fontWeight:700, color:"#ffffff", marginBottom:4 }}>{opt.label}</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", lineHeight:1.5 }}>{opt.desc}</div>
                  {usageType === opt.k && (
                    <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:6 }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3 3 7-7" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span style={{ fontSize:12, color:"#6ee7b7", fontWeight:600 }}>Sélectionné</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ══ STEP 1 : PROP FIRM ou CAPITAL CLASSIQUE ══ */}
        {step === 1 && usageType === "propfirm" && (
          <>
            <div style={{ fontSize:26, fontWeight:700, color:"#ffffff", marginBottom:6 }}>Choisis ta prop firm</div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,0.45)", marginBottom:28, lineHeight:1.5 }}>
              Le simulateur utilisera les règles officielles de cette firm.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {FIRMS_LIST.map(f => (
                <button key={f.k} onClick={() => { selectFirm(f.k); nextStep(); }} style={{
                  width:"100%", padding:"18px 20px", borderRadius:18,
                  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(110,231,183,0.10)",
                  display:"flex", alignItems:"center", gap:16, cursor:"pointer", textAlign:"left", transition:"all .15s",
                }}>
                  <div style={{ flex:1, fontSize:17, fontWeight:700, color:"#ffffff" }}>{f.label}</div>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7 5l5 5-5 5" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && usageType === "classic" && (
          <>
            <div style={{ fontSize:26, fontWeight:700, color:"#ffffff", marginBottom:6 }}>Quel est ton capital ?</div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,0.45)", marginBottom:28, lineHeight:1.5 }}>
              Saisit le capital avec lequel tu trades habituellement.
            </div>
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(110,231,183,0.12)", borderRadius:18, padding:"24px 20px" }}>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>Capital de trading ($)</div>
              <input type="number" value={classicCapital} min={100} max={1000000} step={100}
                onChange={e => setClassicCapital(Math.max(100, parseFloat(e.target.value) || 0))}
                style={{ width:"100%", fontSize:28, fontWeight:700, color:"#6ee7b7", background:"transparent", border:"none", outline:"none", padding:"4px 0" }}
              />
              <input type="range" min={100} max={500000} step={100} value={classicCapital}
                onChange={e => setClassicCapital(parseInt(e.target.value))}
                style={{ width:"100%", accentColor:"#6ee7b7", marginTop:8 }}
              />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>
                <span>$100</span><span>$500K</span>
              </div>
              <div style={{ marginTop:16, padding:"10px 14px", background:"rgba(110,231,183,0.06)", border:"1px solid rgba(110,231,183,0.15)", borderRadius:12, fontSize:13, color:"rgba(255,255,255,0.6)" }}>
                Risque 1% / trade = <b style={{color:"#6ee7b7"}}>${(classicCapital * 0.01).toFixed(0)}</b> par position
              </div>
            </div>
          </>
        )}

        {/* ══ STEP 2 : CAPITAL PROP FIRM ══ */}
        {step === 2 && usageType === "propfirm" && (
          <>
            <div style={{ fontSize:26, fontWeight:700, color:"#ffffff", marginBottom:6 }}>Choisis ton capital</div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,0.45)", marginBottom:22, lineHeight:1.5 }}>
              Pour le challenge {firm.name}.
            </div>
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(110,231,183,0.10)", borderRadius:18, padding:"14px 20px", display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
              <div style={{ flex:1, fontSize:16, fontWeight:700, color:"#ffffff" }}>{firm.name}</div>
              <button onClick={() => setStep(1)} style={{ background:"none", border:"none", color:"#6ee7b7", fontSize:14, fontWeight:700, cursor:"pointer" }}>Changer</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
              {caps.map(c => {
                const sel = capital === c;
                const fee = fees[c];
                return (
                  <button key={c} onClick={() => setCapital(c)} style={{
                    width:"100%", padding:"18px 20px", borderRadius:18, cursor:"pointer",
                    background: sel ? "rgba(110,231,183,0.06)" : "rgba(255,255,255,0.03)",
                    border: "1.5px solid " + (sel ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
                    display:"flex", alignItems:"center", gap:14, textAlign:"left", transition:"all .15s",
                  }}>
                    <div style={{ width:22, height:22, borderRadius:11, border:"2px solid " + (sel ? "#6ee7b7" : "rgba(255,255,255,0.25)"), display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, background: sel ? "rgba(110,231,183,0.1)" : "transparent" }}>
                      {sel && <div style={{ width:9, height:9, borderRadius:5, background:"#6ee7b7" }} />}
                    </div>
                    <div style={{ flex:1, fontSize:18, fontWeight:700, color:"#ffffff" }}>
                      ${c.toLocaleString("en-US")}
                    </div>
                    {fee && (
                      <div style={{ padding:"5px 12px", borderRadius:20, fontSize:13, fontWeight:600, background: sel ? "rgba(110,231,183,0.15)" : "rgba(255,255,255,0.06)", color: sel ? "#6ee7b7" : "rgba(255,255,255,0.4)" }}>
                        Frais : ${fee.toLocaleString("en-US")}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ══ STEP 3 (propfirm) ou STEP 2 (classic) : NIVEAU ══ */}
        {((step === 3 && usageType === "propfirm") || (step === 2 && usageType === "classic")) && (
          <>
            <div style={{ fontSize:26, fontWeight:700, color:"#ffffff", marginBottom:6 }}>
              Quel est ton niveau en trading ?
            </div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,0.45)", marginBottom:28, lineHeight:1.5 }}>
              Cela définit l'affichage du simulateur : simplifié ou avancé.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {LEVELS.map(lv => (
                <button key={lv.k} onClick={() => setLevel(lv.k)} style={{
                  width:"100%", padding:"20px", borderRadius:18, cursor:"pointer",
                  background: level === lv.k ? "rgba(110,231,183,0.08)" : "rgba(255,255,255,0.04)",
                  border: "1.5px solid " + (level === lv.k ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
                  textAlign:"left", transition:"all .15s",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
                    <TradingAvatar id={lv.k==="beginner"?0:lv.k==="experienced"?1:9} size={22} color={level===lv.k?"#6ee7b7":"rgba(255,255,255,0.5)"}/>
                    <span style={{ fontSize:17, fontWeight:700, color:"#ffffff" }}>{lv.label}</span>
                    {level === lv.k && (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginLeft:"auto" }}>
                        <path d="M3 9l4 4 8-8" stroke="#6ee7b7" strokeWidth="2.2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", lineHeight:1.5 }}>{lv.desc}</div>
                  {level === lv.k && (
                    <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(110,231,183,0.06)", borderRadius:10, fontSize:12, color:"#6ee7b7" }}>
                      {lv.k === "beginner" ? "Affichage simplifié — l'essentiel uniquement" :
                       lv.k === "experienced" ? "Affichage standard — métriques clés" :
                       "Affichage complet — toutes les données disponibles"}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bouton Continuer / Terminer — masqué seulement si step 1 et propfirm (auto-avance au clic firm) */}
      {!(step === 1 && usageType === "propfirm") && (
        <div style={{ padding:"20px 20px 0", position:"relative", zIndex:1 }}>
          <button
            onClick={canContinue() ? nextStep : undefined}
            style={{
              width:"100%", padding:"20px", borderRadius:100,
              background: canContinue() ? "#6ee7b7" : "rgba(255,255,255,0.08)",
              color: canContinue() ? "#000000" : "rgba(255,255,255,0.25)",
              fontSize:17, fontWeight:700, border:"none",
              cursor: canContinue() ? "pointer" : "default",
              boxShadow: canContinue() ? "0 4px 24px rgba(110,231,183,0.2)" : "none",
              transition:"all .2s",
            }}>
            {((step === 3 && usageType === "propfirm") || (step === 2 && usageType === "classic")) ? "Commencer" : "Continuer"}
          </button>
        </div>
      )}
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════
// NOTIFICATIONS LOCALES — rappel quotidien 21h
// Contrainte iOS : notif locale fonctionne app ouverte/arrière-plan.
// (vrai push app fermée nécessiterait un serveur + Web Push)
// ══════════════════════════════════════════════════════════════════
const NOTIF_KEY = "eapropfirm_notif";
function loadNotifPref() {
  try { const r = localStorage.getItem(NOTIF_KEY); return r ? JSON.parse(r) : { enabled: false, hour: 21 }; }
  catch (e) { return { enabled: false, hour: 21 }; }
}
function saveNotifPref(pref) {
  try { localStorage.setItem(NOTIF_KEY, JSON.stringify(pref)); } catch (e) {}
}
// Demande la permission de notification
async function requestNotifPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try { return await Notification.requestPermission(); }
  catch (e) { return "denied"; }
}
// Envoie une notification (via service worker si dispo, sinon directe)
async function fireNotification(title, body) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const options = {
    body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: "daily-reminder",
    renotify: true,
  };
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) { reg.showNotification(title, options); return; }
    }
    new Notification(title, options);
  } catch (e) {
    try { new Notification(title, options); } catch (e2) {}
  }
}
// Vérifie s'il faut déclencher le rappel (appelé au montage + à intervalle)
function checkDailyReminder() {
  const pref = loadNotifPref();
  if (!pref.enabled) return;
  const now = new Date();
  const hour = pref.hour ?? 21;
  // On vérifie qu'on est après l'heure cible ET qu'on n'a pas déjà notifié aujourd'hui
  const todayKey = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate();
  if (now.getHours() >= hour && pref.lastFired !== todayKey) {
    fireNotification(
      "EA PropFirm Pro",
      "N'oublie pas de remplir ton journal de trading du jour 📓"
    );
    saveNotifPref({ ...pref, lastFired: todayKey });
  }
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
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  // ── Journal de trading (hook partagé avec Mes Trades) ──
  const [journalMode, setJournalMode] = useState(false);
  const { journalMonth, setJournalMonth, saveJournalEntry, monthData: journalMonthData } = useJournal();

  // ── Notifications cloche ──
  const [notifPref, setNotifPref] = useState(() => loadNotifPref());
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  // Vérifie le rappel au montage + toutes les minutes tant que l'app est ouverte
  useEffect(() => {
    checkDailyReminder();
    const id = setInterval(checkDailyReminder, 60000);
    return () => clearInterval(id);
  }, []);
  // Active/désactive les notifications
  const toggleNotif = async () => {
    if (!notifPref.enabled) {
      const perm = await requestNotifPermission();
      if (perm === "granted") {
        const next = { ...notifPref, enabled: true, hour: notifPref.hour ?? 21 };
        setNotifPref(next); saveNotifPref(next);
        // Notif de confirmation immédiate
        fireNotification("Notifications activées ✅", "Tu recevras un rappel chaque jour après " + (next.hour) + "h pour ton journal.");
      } else if (perm === "denied") {
        alert("Les notifications sont bloquées. Active-les dans les réglages de ton navigateur/téléphone pour cette app.");
      } else if (perm === "unsupported") {
        alert("Ton navigateur ne supporte pas les notifications. Sur iPhone, ajoute l'app à l'écran d'accueil d'abord.");
      }
    } else {
      const next = { ...notifPref, enabled: false };
      setNotifPref(next); saveNotifPref(next);
    }
  };
  const setNotifHour = (h) => {
    const next = { ...notifPref, hour: h };
    setNotifPref(next); saveNotifPref(next);
  };

  const deleteConfig=(id)=>{ const n=configs.filter(c=>c.id!==id); setConfigs(n); try{localStorage.setItem("eapropfirm_saved_configs",JSON.stringify(n));}catch(e){} };
  const startRename=(cfg)=>{ setRenamingId(cfg.id); setRenameVal(cfg.name); };
  const applyRename=(id)=>{
    const n=configs.map(c=>c.id===id?{...c,name:renameVal.trim()||c.name}:c);
    setConfigs(n); setRenamingId(null);
    try{localStorage.setItem("eapropfirm_saved_configs",JSON.stringify(n));}catch(e){}
  };
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
            <div style={{fontSize:16,fontWeight:700}}>Hello <span style={{color:"#6ee7b7",fontWeight:700}}>trader</span></div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>Prêt à simuler ton prochain challenge ?</div>
          </div>
        </div>
        <div style={{position:"relative"}}>
          <button onClick={() => setShowNotifPanel(v => !v)} style={{width:38,height:38,borderRadius:10,background:"rgba(255,255,255,0.08)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            <svg width="18" height="20" viewBox="0 0 18 20" fill="none"><path d="M9 0C6.8 0 5 1.8 5 4v1.1C3.4 5.9 2 7.8 2 10v4l-2 2v1h18v-1l-2-2v-4c0-2.2-1.4-4.1-3-4.9V4c0-2.2-1.8-4-4-4z" fill={notifPref.enabled ? "#6ee7b7" : "white"} opacity={notifPref.enabled ? "1" : "0.8"}/><path d="M7 18c0 1.1.9 2 2 2s2-.9 2-2H7z" fill={notifPref.enabled ? "#6ee7b7" : "white"} opacity="0.6"/></svg>
          </button>
          {notifPref.enabled && <div style={{position:"absolute",top:7,right:7,width:8,height:8,borderRadius:4,background:"#6ee7b7",border:"2px solid #000"}}/>}

          {/* Panneau notifications */}
          {showNotifPanel && (
            <>
              <div onClick={() => setShowNotifPanel(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
              <div style={{
                position: "absolute", top: 46, right: 0, zIndex: 999,
                width: 270, background: "#12121a", border: "1px solid rgba(110,231,183,0.2)",
                borderRadius: 16, padding: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginBottom: 4 }}>Rappel quotidien</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: 14 }}>
                  Reçois un rappel chaque jour pour remplir ton journal de trading.
                </div>

                {/* Toggle activation */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                    {notifPref.enabled ? "Activé" : "Désactivé"}
                  </span>
                  <div onClick={toggleNotif} style={{
                    width: 44, height: 24, borderRadius: 12, background: notifPref.enabled ? "#6ee7b7" : "rgba(255,255,255,0.1)",
                    border: "1px solid " + (notifPref.enabled ? "#6ee7b7" : "rgba(255,255,255,0.1)"),
                    position: "relative", cursor: "pointer", transition: "all .2s",
                  }}>
                    <div style={{ position: "absolute", top: 2, left: notifPref.enabled ? 22 : 2, width: 18, height: 18, borderRadius: 9, background: "#fff", transition: "all .2s" }} />
                  </div>
                </div>

                {/* Choix de l'heure */}
                {notifPref.enabled && (
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Heure du rappel</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[18, 19, 20, 21, 22].map(h => (
                        <button key={h} onClick={() => setNotifHour(h)} style={{
                          flex: 1, minWidth: 40, padding: "8px 0", borderRadius: 8,
                          background: (notifPref.hour ?? 21) === h ? "#6ee7b7" : "rgba(255,255,255,0.06)",
                          color: (notifPref.hour ?? 21) === h ? "#000" : "rgba(255,255,255,0.6)",
                          fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                        }}>{h}h</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note iOS */}
                <div style={{ marginTop: 12, fontSize: 9, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>
                  Sur iPhone : ajoute l'app à l'écran d'accueil pour activer les notifications.
                </div>
              </div>
            </>
          )}
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
      <div style={{marginBottom:"14px",background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",border:"1px solid rgba(255,255,255,0.09)",borderRadius:20,padding:16}}>
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
            <div key={i} style={{background:"rgba(255,255,255,0.05)",borderRadius:12,padding:"8px 6px",textAlign:"center"}}>
              <div style={{fontSize:8,color:"rgba(255,255,255,0.35)",marginBottom:3,lineHeight:1.2}}>{s.l}</div>
              <div style={{fontSize:15,fontWeight:700,color:s.vc}}>{s.v}</div>
              <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",marginTop:2}}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── APERÇU PERFORMANCE (= graphique Funded) ── */}
      {ls.funded ? (
        <div style={{marginBottom:"14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:16}}>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Aperçu Équité Funded</div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={ls.funded.data}>
              <defs>
                <linearGradient id="perf-funded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "M" + v} />
              <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} domain={["auto", "auto"]} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(110,231,183,0.15)", borderRadius: 12, fontSize: 11 }} />
              <ReferenceLine y={cap} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="equity" stroke="#6ee7b7" strokeWidth={2} fill="url(#perf-funded)" dot={false} name="Equity" />
              <Line type="monotone" dataKey="cumul" stroke="rgba(110,231,183,0.6)" strokeWidth={1.5} dot={false} name="Payout Cumule" strokeDasharray="5 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{marginBottom:"14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:16,textAlign:"center",color:"rgba(255,255,255,0.35)",fontSize:13}}>
          Lance une simulation pour voir la courbe Funded
        </div>
      )}

      {/* ── CALENDRIER PNL / JOURNAL DE TRADING ── */}
      <div style={{marginBottom:"14px"}}>
        {/* Toggle mode journal */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 2px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
            {journalMode ? "📓 Journal de trading" : "📊 Calendrier PnL"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: journalMode ? "#6ee7b7" : "rgba(255,255,255,0.4)", fontWeight: 600 }}>
              Mode journal
            </span>
            <div onClick={() => setJournalMode(v => !v)} style={{
              width: 38, height: 22, borderRadius: 11, background: journalMode ? "#6ee7b7" : "rgba(255,255,255,0.1)",
              border: "1px solid " + (journalMode ? "#6ee7b7" : "rgba(255,255,255,0.1)"),
              position: "relative", cursor: "pointer", transition: "all .2s", flexShrink: 0,
            }}>
              <div style={{ position: "absolute", top: 2, left: journalMode ? 18 : 2, width: 16, height: 16, borderRadius: 8, background: "#fff", transition: "all .2s" }} />
            </div>
          </div>
        </div>

        {/* Sélecteur de mois en mode journal */}
        {journalMode && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <input
              type="month"
              value={journalMonth}
              onChange={e => setJournalMonth(e.target.value)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(110,231,183,0.2)", borderRadius: 10, padding: "8px 12px", color: "#FFFFFF", fontSize: 13, fontWeight: 600, outline: "none", colorScheme: "dark" }}
            />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              {Object.keys(journalMonthData).length} jour(s) saisi(s)
            </span>
          </div>
        )}

        {/* Le calendrier : mode journal OU mode simulation */}
        {journalMode ? (
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,overflow:"hidden"}}>
            <CalendrierPnL
              dailyLog={[]}
              journalMode={true}
              journalData={journalMonthData}
              onJournalSave={saveJournalEntry}
              journalMonthLabel={"Clique un jour pour saisir tes trades · " + journalMonth}
            />
          </div>
        ) : ls.funded ? (
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,overflow:"hidden"}}>
            <CalendrierPnL dailyLog={ls.funded.dailyLog} />
          </div>
        ) : (
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:16,textAlign:"center",color:"rgba(255,255,255,0.35)",fontSize:13}}>
            Lance une simulation pour voir le tableau PnL, ou active le mode journal pour saisir tes trades réels.
          </div>
        )}
      </div>
      {/* ── 2 COLONNES : STATS + CONFIGS ── */}
      <div style={{marginBottom:"14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
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
              <div style={{fontSize:8,color:"rgba(255,255,255,0.4)"}}>WR réel</div>
            </div>
          </div>
          {[
            {l:"Trades gagnants", v: wins,   c:"#6ee7b7"},
            {l:"Trades perdants", v: losses, c:"#f87171"},
            {l:"Total trades",    v: totalTrades, c:"#FFFFFF"},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{s.l}</span>
              <span style={{fontSize:12,fontWeight:700,color:s.c}}>{s.v}</span>
            </div>
          ))}
          <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",marginTop:8,paddingTop:8}}>
            {[
              {l:"Meilleur jour",
               v: bestTrade > 0 ? "+$"+fmtMoney(bestTrade) : bestTrade < 0 ? "-$"+fmtMoney(Math.abs(bestTrade)) : "$0",
               c: bestTrade >= 0 ? "#6ee7b7" : "#f87171"},
              {l:"Pire jour",
               v: worstTrade < 0 ? "-$"+fmtMoney(Math.abs(worstTrade)) : worstTrade > 0 ? "+$"+fmtMoney(worstTrade) : "$0",
               c: worstTrade <= 0 ? "#f87171" : "#6ee7b7"},
              {l:"Profit Phase 1",
               v: profitAmount >= 0 ? "+$"+fmtMoney(profitAmount) : "-$"+fmtMoney(Math.abs(profitAmount)),
               c: profitAmount >= 0 ? "#6ee7b7" : "#f87171"},
              {l:"RR cible",
               v: rr > 0 ? "1:" + rr : "—",
               c: "rgba(255,255,255,0.85)"},
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

        {/* MES CONFIGS — max 3, renommage inline */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:14,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1}}>Configs</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.25)",marginTop:1}}>{configs.length}/3 slots</div>
            </div>
            <button onClick={()=>goto("simulator")} style={{background:"none",border:"none",color:"#6ee7b7",fontSize:10,fontWeight:700,cursor:"pointer"}}>+ New</button>
          </div>
          {configs.length===0 ? (
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:8}}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="8" width="20" height="16" rx="3" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/><path d="M9 8V6a5 5 0 0110 0v2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>Aucune config sauvegardée</div>
            </div>
          ) : (
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
              {configs.slice(0,3).map(c=>{
                const cf=PROP_FIRMS[c.firmKey]||PROP_FIRMS.fundednext;
                const isRenaming = renamingId === c.id;
                return(
                  <div key={c.id} style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"8px 10px"}}>
                    {/* Nom — éditable au clic */}
                    {isRenaming ? (
                      <div style={{display:"flex",gap:4,marginBottom:4}}>
                        <input
                          autoFocus
                          value={renameVal}
                          onChange={e=>setRenameVal(e.target.value)}
                          onKeyDown={e=>{if(e.key==="Enter")applyRename(c.id);if(e.key==="Escape")setRenamingId(null);}}
                          style={{flex:1,fontSize:11,fontWeight:700,background:"rgba(255,255,255,0.08)",border:"1px solid #6ee7b7",borderRadius:6,color:"#FFFFFF",padding:"3px 6px",outline:"none"}}
                        />
                        <button onClick={()=>applyRename(c.id)} style={{padding:"3px 8px",borderRadius:6,background:"#6ee7b7",border:"none",color:"#000",fontSize:10,fontWeight:700,cursor:"pointer"}}>OK</button>
                        <button onClick={()=>setRenamingId(null)} style={{padding:"3px 6px",borderRadius:6,background:"rgba(255,255,255,0.08)",border:"none",color:"rgba(255,255,255,0.5)",fontSize:10,cursor:"pointer"}}>✕</button>
                      </div>
                    ) : (
                      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
                        <div style={{flex:1,fontSize:11,fontWeight:700,color:"#FFFFFF",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
                        <button onClick={()=>startRename(c)} style={{flexShrink:0,background:"none",border:"none",cursor:"pointer",padding:2,opacity:0.45,color:"#6ee7b7"}}>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M7.5 1.5L10.5 4.5l-6 6H1.5V8l6-6.5z" stroke="#6ee7b7" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button onClick={()=>deleteConfig(c.id)} style={{flexShrink:0,background:"none",border:"none",cursor:"pointer",padding:2,opacity:0.35,color:"#ef4444"}}>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    )}
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{cf.name} · WR {c.winrate}%</div>
                    <button onClick={()=>loadConfig(c)} style={{marginTop:5,width:"100%",padding:"4px",borderRadius:6,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(110,231,183,0.25)",color:"#6ee7b7",fontSize:10,fontWeight:700,cursor:"pointer"}}>Charger</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      </>)}

      {/* ── CTA ── */}
      <div style={{marginBottom:"16px",background:"rgba(110,231,183,0.05)",border:"1px solid rgba(110,231,183,0.12)",borderRadius:20,padding:"16px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:46,height:46,borderRadius:12,background:"rgba(110,231,183,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke="#6ee7b7" strokeWidth="1.8"/><circle cx="11" cy="11" r="4" stroke="#6ee7b7" strokeWidth="1.5"/><circle cx="11" cy="11" r="1.5" fill="#6ee7b7"/></svg></div>
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
// ══════════════════════════════════════════════════════════════════
// TRADING AVATAR — 12 icônes géométriques financières
// ══════════════════════════════════════════════════════════════════
function TradingAvatar({ id = 0, size = 32, color = "#6ee7b7" }) {
  const s = size;
  const avatars = [
    // 0 — Chandelier haussier
    <svg key={0} width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="6" width="6" height="10" rx="1" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.2"/>
      <line x1="12" y1="2" x2="12" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="16" x2="12" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
    // 1 — Graphique ligne montante
    <svg key={1} width={s} height={s} viewBox="0 0 24 24" fill="none">
      <polyline points="3,18 8,12 13,15 21,6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="21" cy="6" r="2" fill={color}/>
    </svg>,
    // 2 — Bouclier (protection)
    <svg key={2} width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3L4 7v5c0 4.5 3.5 8.7 8 10 4.5-1.3 8-5.5 8-10V7L12 3z" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.15"/>
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>,
    // 3 — Diamant
    <svg key={3} width={s} height={s} viewBox="0 0 24 24" fill="none">
      <polygon points="12,3 21,9 17,21 7,21 3,9" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.15"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.2"/>
      <line x1="7" y1="9" x2="12" y2="3" stroke={color} strokeWidth="1.2"/>
      <line x1="17" y1="9" x2="12" y2="3" stroke={color} strokeWidth="1.2"/>
    </svg>,
    // 4 — Rocket
    <svg key={4} width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 2c0 0-4 4-4 10h8c0-6-4-10-4-10z" stroke={color} strokeWidth="1.6" fill={color} fillOpacity="0.15"/>
      <rect x="9" y="12" width="6" height="5" rx="1" stroke={color} strokeWidth="1.4" fill={color} fillOpacity="0.1"/>
      <path d="M9 16l-2 3h10l-2-3" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="12" cy="9" r="1.5" fill={color}/>
    </svg>,
    // 5 — Taureau (Bull)
    <svg key={5} width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 8c-1-1-1-3 0-4l3 2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M19 8c1-1 1-3 0-4l-3 2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <ellipse cx="12" cy="13" rx="6" ry="5" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.12"/>
      <circle cx="9" cy="12" r="1" fill={color}/>
      <circle cx="15" cy="12" r="1" fill={color}/>
    </svg>,
    // 6 — Couronne
    <svg key={6} width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3 18h18M5 18L3 8l5 4 4-6 4 6 5-4-2 10H5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={color} fillOpacity="0.12"/>
      <circle cx="3" cy="8" r="1.5" fill={color}/>
      <circle cx="12" cy="2" r="1.5" fill={color}/>
      <circle cx="21" cy="8" r="1.5" fill={color}/>
    </svg>,
    // 7 — Hexagone (algo/tech)
    <svg key={7} width={s} height={s} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 20.7,7 20.7,17 12,22 3.3,17 3.3,7" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.12"/>
      <text x="12" y="16" textAnchor="middle" fill={color} fontSize="9" fontWeight="700" fontFamily="-apple-system">Σ</text>
    </svg>,
    // 8 — Cible
    <svg key={8} width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="2" fill={color}/>
    </svg>,
    // 9 — Éclair (vitesse)
    <svg key={9} width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M13 2L5 14h7l-1 8 8-12h-7l1-8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={color} fillOpacity="0.2"/>
    </svg>,
    // 10 — Médaille
    <svg key={10} width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="15" r="7" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.12"/>
      <path d="M9 3h6l2 5-5 3-5-3 2-5z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill={color} fillOpacity="0.2"/>
      <path d="M10 15l1.5 1.5L15 12" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>,
    // 11 — Delta (triangle / changement)
    <svg key={11} width={s} height={s} viewBox="0 0 24 24" fill="none">
      <polygon points="12,3 22,21 2,21" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.12" strokeLinejoin="round"/>
      <line x1="12" y1="10" x2="12" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="18" r="1" fill={color}/>
    </svg>,
  ];
  return avatars[id % avatars.length] || avatars[0];
}


function VerdictIcon({ icon }) {
  if (icon === "CHK") return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#6ee7b7" strokeWidth="1.8" fill="rgba(110,231,183,0.15)"/><path d="M6 10l2.5 2.5L14 7" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round"/></svg>;
  if (icon === "WARN") return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L1 17h18L10 2z" stroke="#fbbf24" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(251,191,36,0.15)"/><line x1="10" y1="8" x2="10" y2="13" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round"/><circle cx="10" cy="15.5" r="1" fill="#fbbf24"/></svg>;
  if (icon === "XRED") return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#ef4444" strokeWidth="1.8" fill="rgba(239,68,68,0.15)"/><path d="M6.5 6.5l7 7M13.5 6.5l-7 7" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>;
  return null;
}

function ProfileScreen({ t, lang, setLang, user, profile, setProfile, onLogout, onReset }) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
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

      {/* Compte + Avatar */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: -0.2, marginBottom: 12 }}>{t("prof_account")}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: showAvatarPicker ? 16 : 0 }}>
          {/* Avatar cliquable */}
          <button onClick={() => setShowAvatarPicker(v => !v)} style={{
            width: 56, height: 56, borderRadius: 28, flexShrink: 0, cursor: "pointer",
            background: "rgba(110,231,183,0.10)",
            border: "2px solid " + (showAvatarPicker ? "#6ee7b7" : "rgba(110,231,183,0.25)"),
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", transition: "all .2s",
          }}>
            <TradingAvatar id={profile.avatarId || 0} size={32} color="#6ee7b7" />
            {/* Petit badge crayon */}
            <div style={{
              position: "absolute", bottom: -2, right: -2, width: 18, height: 18,
              borderRadius: 9, background: "#6ee7b7", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M6.5 1.5L8.5 3.5l-5 5H1.5V7l5-5.5z" stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{user.email || t("prof_guest")}</div>
            <div style={{ fontSize: 11, color: "rgba(110,231,183,0.7)", marginTop: 3 }}>
              {showAvatarPicker ? "Fermer" : "Modifier l'avatar"}
            </div>
          </div>
        </div>

        {/* Grille avatar — visible uniquement au clic */}
        {showAvatarPicker && (
          <div style={{ animation: "fadeIn .15s ease" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", marginBottom: 10 }}>Choisir un avatar</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
              {[0,1,2,3,4,5,6,7,8,9,10,11].map(id => {
                const sel = (profile.avatarId ?? 0) === id;
                return (
                  <button key={id} onClick={() => {
                    const np = { ...profile, avatarId: id };
                    setProfile(np); saveApp({ profile: np });
                    setShowAvatarPicker(false);
                  }} style={{
                    width: "100%", aspectRatio: "1", borderRadius: 14, cursor: "pointer",
                    background: sel ? "rgba(110,231,183,0.12)" : "rgba(255,255,255,0.04)",
                    border: "1.5px solid " + (sel ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all .15s",
                  }}>
                    <TradingAvatar id={id} size={24} color={sel ? "#6ee7b7" : "rgba(255,255,255,0.5)"} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Préférences */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: -0.2, marginBottom: 12 }}>{t("prof_prefs")}</div>

        {/* Langue */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>{t("prof_lang")}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ k: "fr", label: "Français" }, { k: "en", label: "English" }].map(o => (
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
                  background: sel ? "#6ee7b7" : "rgba(255,255,255,0.06)", color: sel ? "#000000" : "rgba(255,255,255,0.65)",
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
                  background: sel ? "#6ee7b7" : "rgba(255,255,255,0.06)", color: sel ? "#000000" : "rgba(255,255,255,0.65)",
                  border: "1px solid " + (sel ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
                }}>${c / 1000}K</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mode d'affichage */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: -0.2, marginBottom: 12 }}>Mode d'affichage</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { k: "simple", label: "Simplifié" },
            { k: "advanced", label: "Avancé" },
          ].map(m => {
            const sel = (profile.displayMode || "advanced") === m.k;
            return (
              <button key={m.k} onClick={() => {
                const np = { ...profile, displayMode: m.k };
                setProfile(np); saveApp({ profile: np });
              }} style={{
                flex: 1, padding: "12px 8px", borderRadius: 12, cursor: "pointer",
                background: sel ? "rgba(110,231,183,0.08)" : "rgba(255,255,255,0.04)",
                border: "1.5px solid " + (sel ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
                textAlign: "center",
              }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4 }}><TradingAvatar id={m.k==="simple"?0:9} size={20} color={sel?"#6ee7b7":"rgba(255,255,255,0.5)"}/></div>
                <div style={{ fontSize: 13, fontWeight: 700, color: sel ? "#6ee7b7" : "rgba(255,255,255,0.65)" }}>{m.label}</div>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>
          {(profile.displayMode || "advanced") === "simple"
            ? "Affichage simplifié : l'essentiel uniquement (DD, risque, projections)."
            : "Affichage avancé : toutes les métriques, clustering, Kelly, statistiques."}
        </div>
      </div>

      {/* Actions */}
      <button onClick={onLogout} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", background: "rgba(255,255,255,0.05)", color: "#FFFFFF", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
        {t("prof_logout")}
      </button>
      <button onClick={() => { if (confirm(t("prof_reset_confirm"))) onReset(); }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 14, fontWeight: 700 }}>
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
    { k:"montecarlo", label:t("nav_montecarlo"),
      icon:(on)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="2" width="18" height="18" rx="4" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.6"/>
        <circle cx="7.5" cy="7.5" r="1.5" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="14.5" cy="7.5" r="1.5" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="7.5" cy="14.5" r="1.5" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="14.5" cy="14.5" r="1.5" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="11" cy="11" r="1.5" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
      </svg>},
    { k:"trades", label:t("nav_trades"),
      icon:(on)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="6" width="18" height="12" rx="3" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.6"/>
        <path d="M7 2h8" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M7 11h4M7 14.5h7" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.4" strokeLinecap="round"/>
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
// ══════════════════════════════════════════════════════════════════
// WELCOME SCREEN — premier lancement, juste le nom de l'app
// ══════════════════════════════════════════════════════════════════
function WelcomeScreen({ onDone }) {
  const [phase, setPhase] = useState(0);
  // phase 0 = fade-in logo, phase 1 = texte, phase 2 = fade-out
  // Preload onboarding images dès le WelcomeScreen pour éviter le délai
  useEffect(() => {
    const imgs = [
      "/9C04F5A9-504B-41BA-BB77-DB5B82902B46_opt.jpg",
      "/6851BC14-AB5F-4662-813E-A5E7486744B7_opt.jpg",
      "/CBA95772-B4CE-481F-9780-A3197BBEE825_opt.jpg",
    ];
    imgs.forEach(src => { const img = new Image(); img.src = src; });
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => onDone(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#06090f",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      opacity: phase === 2 ? 0 : 1,
      transition: "opacity 0.6s ease",
    }}>
      {/* Halo radial */}
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 28,
      }}>
        <img
          src="/app-icon.png"
          alt="Prop Firm Simulator"
          style={{ width: 100, height: 100, borderRadius: 24, boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 0 60px rgba(52,211,153,0.12)" }}
        />
        <div style={{ textAlign: "center", lineHeight: 1 }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#6ee7b7", letterSpacing: -0.5, textTransform: "uppercase" }}>
            PROP FIRM
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: 4, textTransform: "uppercase", marginTop: 6 }}>
            SIMULATOR
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SPLASH SCREEN — après login, chargement des données
// ══════════════════════════════════════════════════════════════════
function SplashScreen({ user, onReady }) {
  const [step, setStep]       = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    { label: "Profil chargé",         duration: 350 },
    { label: "Configuration restaurée", duration: 400 },
    { label: "Historique des simulations", duration: 350 },
    { label: "Prêt",                  duration: 300 },
  ];

  useEffect(() => {
    let current = 0;
    const run = () => {
      if (current >= steps.length) {
        // Petite pause finale avant de lancer l'app
        setTimeout(() => onReady(), 300);
        return;
      }
      setStep(current);
      setProgress(Math.round(((current + 1) / steps.length) * 100));
      setTimeout(() => {
        current++;
        run();
      }, steps[current].duration);
    };
    const init = setTimeout(run, 200);
    return () => clearTimeout(init);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998,
      background: "#06090f",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system, sans-serif",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {/* Halo */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo + nom */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginBottom: 60 }}>
        <img
          src="/app-icon.png"
          alt="Prop Firm Simulator"
          style={{ width: 80, height: 80, borderRadius: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
        />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#6ee7b7", textTransform: "uppercase", letterSpacing: -0.3 }}>
            PROP FIRM
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 4, textTransform: "uppercase", marginTop: 3 }}>
            SIMULATOR
          </div>
        </div>
        {user && (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: -8 }}>
            Hello <span style={{ color: "#6ee7b7", fontWeight: 600 }}>trader</span>
          </div>
        )}
      </div>

      {/* Barre de progression */}
      <div style={{ width: 240, marginBottom: 16 }}>
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: "linear-gradient(90deg, #059669, #6ee7b7)",
            width: progress + "%",
            transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
      </div>

      {/* Label étape en cours */}
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", height: 16, textAlign: "center" }}>
        {steps[step]?.label}
      </div>

      {/* Points animés */}
      <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: 3,
            background: i <= step ? "#6ee7b7" : "rgba(255,255,255,0.12)",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const app0 = loadApp();
  const [lang, setLangState] = useState(app0.profile?.lang ?? null);
  const [onboarded, setOnboarded] = useState(app0.onboarded ?? false);
  const [user, setUser] = useState(app0.user ?? null);
  const [setupDone, setSetupDone] = useState(app0.setupDone ?? false);
  const [profile, setProfile] = useState(app0.profile ?? { lang: "fr", firmKey: "fundednext", capital: 25000 });
  const [screen, setScreen] = useState("dashboard");
  const [simTab, setSimTab] = useState("challenge");
  const [lastSim, setLastSim] = useState(app0.lastSim ?? null);
  const [simKey, setSimKey] = useState(0);

  // Welcome : affiché une seule fois au tout premier lancement
  const [showWelcome, setShowWelcome] = useState(!app0.welcomeSeen);
  // Splash : affiché après chaque login (chargement données)
  const [showSplash, setShowSplash] = useState(false);

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
  // Welcome — premier lancement uniquement
  if (showWelcome) {
    return <WelcomeScreen onDone={() => {
      setShowWelcome(false);
      saveApp({ welcomeSeen: true });
    }} />;
  }

  // Splash — après login
  if (showSplash) {
    return <SplashScreen user={user} onReady={() => setShowSplash(false)} />;
  }

  if (!lang) {
    return <LanguagePickerScreen onPick={(l) => { setLangState(l); saveApp({ profile: { ...loadApp().profile, lang: l } }); }} />;
  }
  if (!onboarded) {
    return <OnboardingScreen t={t} lang={lang} setLang={setLang} onDone={() => { setOnboarded(true); saveApp({ onboarded: true }); }} />;
  }
  if (!user) {
    return <LoginScreen t={t} lang={lang} setLang={setLang} onAuth={(u) => {
      setUser(u);
      saveApp({ user: u });
      setShowSplash(true); // splash après login
    }} />;
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
          <SimulatorScreen key={simKey} t={t} lang={lang} tab={simTab} setTab={setSimTab} onSimResult={handleSimResult} displayMode={profile.displayMode || "advanced"} usageType={profile.usageType || "propfirm"} />
        )}
        {screen === "profile" && (
          <ProfileScreen t={t} lang={lang} setLang={setLang} user={user} profile={profile} setProfile={setProfile} onLogout={logout} onReset={reset} />
        )}
      </div>
      <NavBar t={t} active={navActive} goto={navGoto} />
    </div>
  );
}
