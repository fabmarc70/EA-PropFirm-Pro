import { useState, useEffect } from "react";
import { fbSignInGoogle, fbSignInApple, fbSignUpEmail, fbSignInEmail, fbOnAuthChange, fbSignOut, fbUserToAppUser } from "./firebase.js";
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
    login_subtitle: "Connecte-toi pour commencer",
    login_tagline: "Valide ta stratégie avant de risquer un challenge.",
    login_google: "Continuer avec Google",
    login_apple: "Continuer avec Apple",
    login_privacy: "Connexion sécurisée. Aucune donnée partagée sans ton accord.",
    login_trial_badge: "7 jours d'essai gratuit · sans engagement",
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
    // ── Simulateur : config ──
    sim_objective: "Objectif",
    sim_risk_per_trade: "Risque par trade",
    sim_how_much_risk: "Combien risques-tu par trade ?",
    sim_weekend_included: "Weekend inclus",
    sim_recurrence: "Récurrence EA",
    sim_days_traded: "jours tradés",
    sim_days_avoided: "évités",
    sim_per_week: "semaine",
    sim_days: "Jours",
    sim_months: "Mois",
    sim_statistics: "Statistiques",
    sim_monthly_detail: "Détail Mensuel",
    sim_view_funded: "Voir mon compte Funded",
    sim_launch: "Lance une simulation",
    sim_days_ea_trades: "Jours où ton EA trade",
    sim_news_avoided_week: "Jours d'annonces évités/semaine",
    sim_recurrence_estimate: "jour tradé/mois estimé",
    // ── Calendrier / Journal ──
    cal_title: "Calendrier PnL",
    cal_journal_title: "Journal de trading",
    cal_journal_mode: "Mode journal",
    cal_day: "Jour",
    cal_results_day: "Saisis tes résultats de la journée",
    cal_wins: "Trades gagnants",
    cal_losses: "Trades perdants",
    cal_gain_loss: "Gain / Perte",
    cal_screenshots: "Captures MT4/MT5",
    cal_save: "Enregistrer",
    cal_delete: "Effacer",
    cal_results: "Résultats",
    cal_month: "Mois",
    cal_pnl_month: "P&L mois",
    cal_best: "Meilleur",
    cal_worst: "Pire",
    cal_big_gain: "Gros gain",
    cal_small_gain: "Petit gain",
    cal_big_loss: "Grosse perte",
    cal_small_loss: "Petite perte",
    cal_days_entered: "jour(s) saisi(s)",
    cal_click_day: "Clique un jour pour saisir tes trades",
    // ── Dashboard ──
    dash_overview_equity: "Aperçu Équité Funded",
    dash_launch_funded: "Lance une simulation pour voir la courbe Funded",
    dash_sim_legend: "Simulation",
    dash_journal_legend: "Journal réel",
    dash_continue: "Continuer",
    // ── Commun ──
    common_continue: "Continuer",
    common_config: "Configuration",
    coach_title: "IA Coach",
    coach_subtitle: "Ton analyste stratégie personnel",
    coach_prob_label: "Probabilité de réussite",
    coach_diagnosis: "Diagnostic",
    coach_main_issue: "Ton point faible principal",
    coach_action_plan: "Plan d'action",
    coach_no_data: "Lance une simulation ou importe ton backtest pour obtenir ton analyse personnalisée.",
    coach_source_sim: "Basé sur ta simulation",
    coach_source_real: "Basé sur tes trades réels",
    coach_metric_pf: "Profit Factor",
    coach_metric_exp: "Espérance/trade",
    coach_lever_risk: "Réduis ton risque par trade",
    coach_lever_rr: "Améliore ton ratio risque/récompense",
    coach_lever_wr: "Améliore ton winrate",
    coach_lever_from: "de",
    coach_lever_to: "à",
    coach_verdict_excellent: "Stratégie très solide",
    coach_verdict_good: "Bonne base, optimisable",
    coach_verdict_risky: "Stratégie risquée",
    coach_verdict_critical: "Stratégie non viable en l'état",
    coach_issue_dd_day: "Ton drawdown journalier te rapproche dangereusement de la limite. Une seule mauvaise série peut te disqualifier.",
    coach_issue_dd_total: "Ton drawdown total consomme trop de ta marge. Tu manques de coussin pour encaisser une série de pertes.",
    coach_issue_pf: "Ton profit factor est trop faible : tu gagnes à peine plus que tu ne perds. La marge d'erreur est minime.",
    coach_issue_sample: "Trop peu de trades pour valider statistiquement ta stratégie. Les résultats peuvent être dus au hasard.",
    coach_issue_risk: "Ton risque par trade est trop élevé. Quelques pertes consécutives suffisent à briser ton compte.",
    coach_issue_edge: "Ton edge est insuffisant : winrate et ratio R/R trop bas pour être durablement rentable.",
    coach_issue_none: "Aucune faiblesse majeure détectée. Ta stratégie est bien équilibrée.",
    coach_cta_apply: "Appliquer dans le simulateur",
    sim_clustering_losses: "Clustering des pertes",
    sim_calc_stats: "Statistiques calculées",
    sim_lot_suggested: "Lot suggéré pour ce risque",
    sim_beginner_active: "Mode débutant actif",
    mt_coherence_sim: "Cohérence avec ta simulation",
    mt_real: "Réel",
    mt_simulation: "Simulation",
    mt_my_journal: "Mon journal réel",
    dash_selected: "Sélectionné",
    dash_first_sim: "Lance ta première simulation",
    dash_start_now: "Démarrer maintenant",
    dash_stats: "Statistiques",
    dash_configs: "Configs",
    dash_no_config: "Aucune config sauvegardée",
    dash_stay_focused: "Reste focus et discipliné",
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
    login_subtitle: "Inicia sesión para empezar",
    login_tagline: "Valida tu estrategia antes de arriesgar un challenge.",
    login_google: "Continuar con Google",
    login_apple: "Continuar con Apple",
    login_privacy: "Conexión segura. Ningún dato compartido sin tu permiso.",
    login_trial_badge: "7 días de prueba gratis · sin compromiso",
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
    // ── Simulateur : config ──
    sim_objective: "Objetivo",
    sim_risk_per_trade: "Riesgo por trade",
    sim_how_much_risk: "¿Cuánto arriesgas por trade?",
    sim_weekend_included: "Fin de semana incluido",
    sim_recurrence: "Recurrencia EA",
    sim_days_traded: "días operados",
    sim_days_avoided: "evitados",
    sim_per_week: "semana",
    sim_days: "Días",
    sim_months: "Meses",
    sim_statistics: "Estadísticas",
    sim_monthly_detail: "Detalle Mensual",
    sim_view_funded: "Ver mi cuenta Funded",
    sim_launch: "Lanza una simulación",
    sim_days_ea_trades: "Días en que tu EA opera",
    sim_news_avoided_week: "Días de noticias evitados/semana",
    sim_recurrence_estimate: "día operado/mes estimado",
    // ── Calendrier / Journal ──
    cal_title: "Calendario PnL",
    cal_journal_title: "Diario de trading",
    cal_journal_mode: "Modo diario",
    cal_day: "Día",
    cal_results_day: "Introduce tus resultados del día",
    cal_wins: "Trades ganadores",
    cal_losses: "Trades perdedores",
    cal_gain_loss: "Ganancia / Pérdida",
    cal_screenshots: "Capturas MT4/MT5",
    cal_save: "Guardar",
    cal_delete: "Borrar",
    cal_results: "Resultados",
    cal_month: "Mes",
    cal_pnl_month: "P&L mes",
    cal_best: "Mejor",
    cal_worst: "Peor",
    cal_big_gain: "Gran ganancia",
    cal_small_gain: "Pequeña ganancia",
    cal_big_loss: "Gran pérdida",
    cal_small_loss: "Pequeña pérdida",
    cal_days_entered: "día(s) introducido(s)",
    cal_click_day: "Haz clic en un día para introducir tus trades",
    // ── Dashboard ──
    dash_overview_equity: "Resumen Equity Funded",
    dash_launch_funded: "Lanza una simulación para ver la curva Funded",
    dash_sim_legend: "Simulación",
    dash_journal_legend: "Diario real",
    dash_continue: "Continuar",
    // ── Común ──
    common_continue: "Continuar",
    common_config: "Configuración",
    coach_title: "IA Coach",
    coach_subtitle: "Tu analista de estrategia personal",
    coach_prob_label: "Probabilidad de éxito",
    coach_diagnosis: "Diagnóstico",
    coach_main_issue: "Tu principal punto débil",
    coach_action_plan: "Plan de acción",
    coach_no_data: "Lanza una simulación o importa tu backtest para obtener tu análisis personalizado.",
    coach_source_sim: "Basado en tu simulación",
    coach_source_real: "Basado en tus trades reales",
    coach_metric_pf: "Profit Factor",
    coach_metric_exp: "Esperanza/trade",
    coach_lever_risk: "Reduce tu riesgo por trade",
    coach_lever_rr: "Mejora tu ratio riesgo/recompensa",
    coach_lever_wr: "Mejora tu winrate",
    coach_lever_from: "de",
    coach_lever_to: "a",
    coach_verdict_excellent: "Estrategia muy sólida",
    coach_verdict_good: "Buena base, optimizable",
    coach_verdict_risky: "Estrategia arriesgada",
    coach_verdict_critical: "Estrategia no viable así",
    coach_issue_dd_day: "Tu drawdown diario te acerca peligrosamente al límite. Una sola mala racha puede descalificarte.",
    coach_issue_dd_total: "Tu drawdown total consume demasiado margen. Te falta colchón para aguantar una serie de pérdidas.",
    coach_issue_pf: "Tu profit factor es muy bajo: ganas apenas más de lo que pierdes. El margen de error es mínimo.",
    coach_issue_sample: "Muy pocos trades para validar estadísticamente tu estrategia. Los resultados pueden ser por azar.",
    coach_issue_risk: "Tu riesgo por trade es demasiado alto. Unas pocas pérdidas seguidas bastan para romper tu cuenta.",
    coach_issue_edge: "Tu edge es insuficiente: winrate y ratio R/R demasiado bajos para ser rentable a largo plazo.",
    coach_issue_none: "No se detectó ninguna debilidad importante. Tu estrategia está bien equilibrada.",
    coach_cta_apply: "Aplicar en el simulador",
    sim_clustering_losses: "Clustering de pérdidas",
    sim_calc_stats: "Estadísticas calculadas",
    sim_lot_suggested: "Lote sugerido para este riesgo",
    sim_beginner_active: "Modo principiante activo",
    mt_coherence_sim: "Coherencia con tu simulación",
    mt_real: "Real",
    mt_simulation: "Simulación",
    mt_my_journal: "Mi diario real",
    dash_selected: "Seleccionado",
    dash_first_sim: "Lanza tu primera simulación",
    dash_start_now: "Empezar ahora",
    dash_stats: "Estadísticas",
    dash_configs: "Configs",
    dash_no_config: "Ninguna config guardada",
    dash_stay_focused: "Mantente enfocado y disciplinado",
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
    login_subtitle: "Sign in to get started",
    login_tagline: "Validate your strategy before risking a challenge.",
    login_google: "Continue with Google",
    login_apple: "Continue with Apple",
    login_privacy: "Secure sign-in. No data shared without your consent.",
    login_trial_badge: "7-day free trial · no commitment",
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
    // ── Simulator: config ──
    sim_objective: "Target",
    sim_risk_per_trade: "Risk per trade",
    sim_how_much_risk: "How much do you risk per trade?",
    sim_weekend_included: "Weekend included",
    sim_recurrence: "EA Recurrence",
    sim_days_traded: "days traded",
    sim_days_avoided: "avoided",
    sim_per_week: "week",
    sim_days: "Days",
    sim_months: "Months",
    sim_statistics: "Statistics",
    sim_monthly_detail: "Monthly Detail",
    sim_view_funded: "View my Funded account",
    sim_launch: "Run a simulation",
    sim_days_ea_trades: "Days your EA trades",
    sim_news_avoided_week: "News days avoided/week",
    sim_recurrence_estimate: "day traded/month estimated",
    // ── Calendar / Journal ──
    cal_title: "PnL Calendar",
    cal_journal_title: "Trading journal",
    cal_journal_mode: "Journal mode",
    cal_day: "Day",
    cal_results_day: "Enter your daily results",
    cal_wins: "Winning trades",
    cal_losses: "Losing trades",
    cal_gain_loss: "Gain / Loss",
    cal_screenshots: "MT4/MT5 screenshots",
    cal_save: "Save",
    cal_delete: "Delete",
    cal_results: "Results",
    cal_month: "Month",
    cal_pnl_month: "P&L month",
    cal_best: "Best",
    cal_worst: "Worst",
    cal_big_gain: "Big gain",
    cal_small_gain: "Small gain",
    cal_big_loss: "Big loss",
    cal_small_loss: "Small loss",
    cal_days_entered: "day(s) entered",
    cal_click_day: "Tap a day to enter your trades",
    // ── Dashboard ──
    dash_overview_equity: "Funded Equity Overview",
    dash_launch_funded: "Run a simulation to see the Funded curve",
    dash_sim_legend: "Simulation",
    dash_journal_legend: "Real journal",
    dash_continue: "Continue",
    // ── Common ──
    common_continue: "Continue",
    common_config: "Configuration",
    coach_title: "AI Coach",
    coach_subtitle: "Your personal strategy analyst",
    coach_prob_label: "Success probability",
    coach_diagnosis: "Diagnosis",
    coach_main_issue: "Your main weakness",
    coach_action_plan: "Action plan",
    coach_no_data: "Run a simulation or import your backtest to get your personalized analysis.",
    coach_source_sim: "Based on your simulation",
    coach_source_real: "Based on your real trades",
    coach_metric_pf: "Profit Factor",
    coach_metric_exp: "Expectancy/trade",
    coach_lever_risk: "Reduce your risk per trade",
    coach_lever_rr: "Improve your risk/reward ratio",
    coach_lever_wr: "Improve your winrate",
    coach_lever_from: "from",
    coach_lever_to: "to",
    coach_verdict_excellent: "Very solid strategy",
    coach_verdict_good: "Good base, can be optimized",
    coach_verdict_risky: "Risky strategy",
    coach_verdict_critical: "Strategy not viable as is",
    coach_issue_dd_day: "Your daily drawdown brings you dangerously close to the limit. A single bad streak can disqualify you.",
    coach_issue_dd_total: "Your total drawdown eats too much of your margin. You lack cushion to absorb a losing streak.",
    coach_issue_pf: "Your profit factor is too low: you barely win more than you lose. The margin for error is minimal.",
    coach_issue_sample: "Too few trades to statistically validate your strategy. Results may be down to luck.",
    coach_issue_risk: "Your risk per trade is too high. A few consecutive losses are enough to break your account.",
    coach_issue_edge: "Your edge is insufficient: winrate and R/R ratio too low to be sustainably profitable.",
    coach_issue_none: "No major weakness detected. Your strategy is well balanced.",
    coach_cta_apply: "Apply in simulator",
    sim_clustering_losses: "Loss clustering",
    sim_calc_stats: "Calculated statistics",
    sim_lot_suggested: "Suggested lot for this risk",
    sim_beginner_active: "Beginner mode active",
    mt_coherence_sim: "Consistency with your simulation",
    mt_real: "Real",
    mt_simulation: "Simulation",
    mt_my_journal: "My real journal",
    dash_selected: "Selected",
    dash_first_sim: "Run your first simulation",
    dash_start_now: "Start now",
    dash_stats: "Statistics",
    dash_configs: "Configs",
    dash_no_config: "No saved config",
    dash_stay_focused: "Stay focused and disciplined",
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

// ══════════════════════════════════════════════════════════════════
// IA COACH — Moteur d'analyse de la stratégie
// Analyse les données de simulation + journal réel et produit :
//   - une probabilité de réussite globale (0-100%)
//   - un diagnostic du problème principal
//   - un plan d'action chiffré (leviers What-If)
// Logique 100% locale basée sur les formules de simulation existantes.
// ══════════════════════════════════════════════════════════════════

// Estime la probabilité de réussite d'un challenge selon les métriques clés.
// Modèle heuristique calibré sur la réalité prop firm.
// ══════════════════════════════════════════════════════════════════
// IA COACH V2 — Moteur étendu + Gemini 2.5 Flash
// ══════════════════════════════════════════════════════════════════

// Probabilité de réussite (modèle heuristique calibré prop firm)
function coachEstimateProbability({ winrate, rr, ddUsedPct, ddLimitPct, profitFactor, totalTrades, riskPct }) {
  const wr = Math.max(0, Math.min(1, winrate / 100));
  const expectancyR = wr * rr - (1 - wr);
  let prob = 50 + expectancyR * 45;
  const ddRatio = ddLimitPct > 0 ? ddUsedPct / ddLimitPct : 0;
  if      (ddRatio > 0.9)  prob -= 30;
  else if (ddRatio > 0.75) prob -= 18;
  else if (ddRatio > 0.6)  prob -= 10;
  else if (ddRatio > 0.4)  prob -= 3;
  else                      prob += 5;
  if      (profitFactor >= 1.5) prob += 8;
  else if (profitFactor >= 1.2) prob += 3;
  else if (profitFactor < 1.0)  prob -= 25;
  else if (profitFactor < 1.1)  prob -= 10;
  if      (totalTrades < 20)   prob -= 15;
  else if (totalTrades < 50)   prob -= 5;
  else if (totalTrades >= 100) prob += 3;
  if      (riskPct > 2)   prob -= 12;
  else if (riskPct > 1.5) prob -= 5;
  return Math.max(2, Math.min(96, Math.round(prob)));
}

// ── Forces / Risques / Projection ──
function coachBuildForces({ winrate, rr, pf, expectancyR, ddUsed, ddLimit, totalTrades, riskPct }) {
  const wr = winrate / 100;
  const ddRatio = ddLimit > 0 ? ddUsed / ddLimit : 0;
  const forces = [];

  if      (pf >= 2.5)  forces.push({ id:'pf_exc',  icon:'💎', title:'Profit Factor exceptionnel',  detail:`PF ${pf.toFixed(2)} — stratégie très performante sur la période`, strength:100 });
  else if (pf >= 1.8)  forces.push({ id:'pf_sol',  icon:'✅', title:'Profit Factor excellent',    detail:`PF ${pf.toFixed(2)} — gains nettement supérieurs aux pertes`, strength:88 });
  else if (pf >= 1.4)  forces.push({ id:'pf_ok',   icon:'✅', title:'Profit Factor solide',       detail:`PF ${pf.toFixed(2)} — stratégie structurellement rentable`, strength:72 });

  if      (expectancyR >= 0.8)  forces.push({ id:'exp_exc', icon:'✅', title:'Espérance élevée',   detail:`+${expectancyR.toFixed(2)}R / trade — edge statistique fort`, strength:95 });
  else if (expectancyR >= 0.4)  forces.push({ id:'exp_sol', icon:'✅', title:'Espérance positive', detail:`+${expectancyR.toFixed(2)}R / trade — stratégie rentable en moyenne`, strength:78 });
  else if (expectancyR >= 0.15) forces.push({ id:'exp_ok',  icon:'✅', title:'Espérance correcte', detail:`+${expectancyR.toFixed(2)}R / trade — rentabilité limitée mais présente`, strength:58 });

  if      (ddRatio <= 0.25) forces.push({ id:'dd_exc', icon:'✅', title:'Drawdown très maîtrisé',  detail:`DD max ${ddUsed.toFixed(1)}% — seulement ${Math.round(ddRatio*100)}% de la limite utilisée`, strength:90 });
  else if (ddRatio <= 0.5)  forces.push({ id:'dd_sol', icon:'✅', title:'Drawdown bien maîtrisé',  detail:`DD max ${ddUsed.toFixed(1)}% — bonne marge de sécurité disponible`, strength:74 });

  if      (winrate >= 60)  forces.push({ id:'wr_exc', icon:'✅', title:'Winrate robuste',         detail:`${winrate.toFixed(0)}% de trades gagnants — fiabilité élevée`, strength:80 });
  else if (winrate >= 52)  forces.push({ id:'wr_ok',  icon:'✅', title:'Winrate favorable',       detail:`${winrate.toFixed(0)}% — supérieur au seuil optimal`, strength:65 });

  if      (rr >= 2.5)  forces.push({ id:'rr_exc', icon:'✅', title:'Ratio R/R excellent',      detail:`1:${rr.toFixed(1)} — gains unitaires bien supérieurs aux pertes`, strength:85 });
  else if (rr >= 2.0)  forces.push({ id:'rr_sol', icon:'✅', title:'Bon ratio R/R',            detail:`1:${rr.toFixed(1)} — rapport gain/risque favorable`, strength:70 });

  if      (totalTrades >= 150) forces.push({ id:'n_exc', icon:'✅', title:'Échantillon très solide', detail:`${totalTrades} trades — statistiquement très fiable`, strength:88 });
  else if (totalTrades >= 80)  forces.push({ id:'n_sol', icon:'✅', title:'Bon échantillon',         detail:`${totalTrades} trades — base statistique exploitable`, strength:70 });

  return forces.sort((a,b) => b.strength - a.strength).slice(0,3);
}

function coachBuildRisks({ winrate, rr, pf, expectancyR, ddUsed, ddLimit, totalTrades, riskPct }) {
  const ddRatio = ddLimit > 0 ? ddUsed / ddLimit : 0;
  const risks = [];

  if      (totalTrades < 20)  risks.push({ id:'n_crit',  icon:'🚨', title:'Échantillon critique',          detail:`${totalTrades} trades — statistiquement non fiable (min. 50 recommandés)`, severity:100 });
  else if (totalTrades < 50)  risks.push({ id:'n_low',   icon:'⚠️',  title:'Échantillon insuffisant',       detail:`${totalTrades} trades — risque de biais sur les résultats`, severity:80 });
  else if (totalTrades < 80)  risks.push({ id:'n_mid',   icon:'⚠️',  title:'Échantillon limite',            detail:`${totalTrades} trades — résultats à confirmer sur plus de données`, severity:50 });

  if      (ddRatio >= 0.9)  risks.push({ id:'dd_crit',  icon:'🚨', title:'Drawdown critique',              detail:`${ddUsed.toFixed(1)}% / ${ddLimit}% — une seule mauvaise série = élimination`, severity:100 });
  else if (ddRatio >= 0.75) risks.push({ id:'dd_high',  icon:'🚨', title:'Drawdown proche de la limite',   detail:`${ddUsed.toFixed(1)}% utilisé sur ${ddLimit}% max — marge de sécurité faible`, severity:85 });
  else if (ddRatio >= 0.6)  risks.push({ id:'dd_med',   icon:'⚠️',  title:'Drawdown à surveiller',         detail:`${ddUsed.toFixed(1)}% / ${ddLimit}% — encore gérable mais à surveiller`, severity:60 });

  if      (riskPct > 2.5)  risks.push({ id:'risk_crit', icon:'🚨', title:'Risque par trade excessif',     detail:`${riskPct.toFixed(2)}% par trade — 4 pertes consécutives = ${(riskPct*4).toFixed(1)}% de DD`, severity:95 });
  else if (riskPct > 1.5)  risks.push({ id:'risk_high', icon:'⚠️',  title:'Risque par trade élevé',       detail:`${riskPct.toFixed(2)}% — réduire à 0.75-1% pour plus de robustesse`, severity:70 });

  if      (rr < 1.2)  risks.push({ id:'rr_crit', icon:'🚨', title:'Ratio R/R insuffisant',              detail:`1:${rr.toFixed(1)} — trop faible pour compenser un winrate < 50%`, severity:90 });
  else if (rr < 1.5)  risks.push({ id:'rr_low',  icon:'⚠️',  title:'Ratio R/R perfectible',             detail:`1:${rr.toFixed(1)} — à améliorer pour plus de robustesse`, severity:65 });

  if (pf > 3.5 && totalTrades < 60) risks.push({ id:'overfit', icon:'⚠️', title:'Risque de sur-optimisation', detail:`PF ${pf.toFixed(2)} sur seulement ${totalTrades} trades — résultats potentiellement biaisés`, severity:72 });

  if (expectancyR <= 0)  risks.push({ id:'exp_neg', icon:'🚨', title:'Espérance négative',               detail:`${expectancyR.toFixed(2)}R / trade — la stratégie perd en moyenne`, severity:100 });
  else if (expectancyR < 0.1) risks.push({ id:'exp_low', icon:'⚠️', title:'Espérance très faible',       detail:`+${expectancyR.toFixed(2)}R — rentabilité fragile, peu de marge`, severity:68 });

  return risks.sort((a,b) => b.severity - a.severity).slice(0,3);
}

function coachBuildProjection({ probability, rr, winrate, riskPct, capital, ddUsed, ddLimit, phase1Target }) {
  const wr = winrate / 100;
  const riskAmt = capital * (riskPct / 100);
  const expectedPerTrade = riskAmt * (wr * rr - (1 - wr));
  const tpd = 3; // estimation trades/jour
  const expectedDailyPnl = expectedPerTrade * tpd;
  const targetAmt = capital * ((phase1Target || 8) / 100);
  const ddRemaining = Math.max(0, ddLimit - ddUsed);
  const maxConsecLosses = riskPct > 0 ? Math.floor(ddRemaining / riskPct) : 0;

  let daysMin = null, daysMax = null;
  if (expectedDailyPnl > 0) {
    daysMin = Math.ceil(targetAmt / (expectedDailyPnl * 1.3));
    daysMax = Math.ceil(targetAmt / (expectedDailyPnl * 0.7));
  }

  const failureRisk =
    probability >= 75 ? "Faible" :
    probability >= 55 ? "Modéré" :
    probability >= 35 ? "Élevé" : "Critique";

  const failureColor =
    probability >= 75 ? "#6ee7b7" :
    probability >= 55 ? "#fbbf24" :
    probability >= 35 ? "#f97316" : "#ef4444";

  return { daysMin, daysMax, maxConsecLosses, failureRisk, failureColor, ddRemaining: ddRemaining.toFixed(1) };
}

// ── Analyse principale ──
function coachAnalyze(data, firmName) {
  if (!data) return null;
  const winrate  = data.winrate  || 0;
  const rr       = data.rr       || 1;
  const ddDayUsed  = parseFloat(data.ddDayPct  || 0);
  const ddTotUsed  = parseFloat(data.ddTotPct  || 0);
  const ddDayLimit = data.dailyDDLimit || 5;
  const ddTotLimit = data.totalDDLimit || 10;
  const riskPct    = data.riskPctValue || data.riskPct || 1;
  const totalTrades = data.totalTrades || 0;
  const capital     = data.capital || 25000;
  const phase1Target = data.phase1Target || 8;

  const wr = winrate / 100;
  const profitFactor = (1 - wr) > 0 ? (wr * rr) / (1 - wr) : 99;
  const expectancyR  = +(wr * rr - (1 - wr)).toFixed(3);

  const ddDayRatio  = ddDayLimit > 0 ? ddDayUsed / ddDayLimit : 0;
  const ddTotRatio  = ddTotLimit > 0 ? ddTotUsed / ddTotLimit : 0;
  const worstDD     = ddDayRatio > ddTotRatio ? ddDayUsed : ddTotUsed;
  const worstDDLim  = ddDayRatio > ddTotRatio ? ddDayLimit : ddTotLimit;

  const probability = coachEstimateProbability({
    winrate, rr, ddUsedPct: worstDD, ddLimitPct: worstDDLim,
    profitFactor, totalTrades, riskPct,
  });

  const forces = coachBuildForces({ winrate, rr, pf: profitFactor, expectancyR, ddUsed: worstDD, ddLimit: worstDDLim, totalTrades, riskPct });
  const risks  = coachBuildRisks ({  winrate, rr, pf: profitFactor, expectancyR, ddUsed: worstDD, ddLimit: worstDDLim, totalTrades, riskPct });
  const projection = coachBuildProjection({ probability, rr, winrate, riskPct, capital, ddUsed: worstDD, ddLimit: worstDDLim, phase1Target });

  // Leviers What-If
  const levers = [];
  if (riskPct > 0.5) {
    const nr = Math.max(0.25, riskPct - 0.25);
    const np = coachEstimateProbability({ winrate, rr, ddUsedPct: worstDD * (nr/riskPct), ddLimitPct: worstDDLim, profitFactor, totalTrades, riskPct: nr });
    if (np > probability) levers.push({ action:'reduce_risk', from: riskPct.toFixed(2)+'%', to: nr.toFixed(2)+'%', gain: np - probability, newProb: np, label:'Réduire le risque/trade' });
  }
  const nrr = rr + 0.5;
  const nPF = (1-wr)>0 ? (wr*nrr)/(1-wr) : 99;
  const np2 = coachEstimateProbability({ winrate, rr: nrr, ddUsedPct: worstDD, ddLimitPct: worstDDLim, profitFactor: nPF, totalTrades, riskPct });
  if (np2 > probability) levers.push({ action:'improve_rr', from:'1:'+rr.toFixed(1), to:'1:'+nrr.toFixed(1), gain: np2-probability, newProb: np2, label:'Améliorer le ratio R/R' });
  if (winrate < 70) {
    const nwr2 = winrate + 5; const nwr2r = nwr2/100;
    const nPF3 = (1-nwr2r)>0 ? (nwr2r*rr)/(1-nwr2r) : 99;
    const np3 = coachEstimateProbability({ winrate: nwr2, rr, ddUsedPct: worstDD, ddLimitPct: worstDDLim, profitFactor: nPF3, totalTrades, riskPct });
    if (np3 > probability) levers.push({ action:'improve_wr', from: winrate.toFixed(0)+'%', to: nwr2.toFixed(0)+'%', gain: np3-probability, newProb: np3, label:'Améliorer le winrate' });
  }
  levers.sort((a,b) => b.gain - a.gain);

  return {
    probability, profitFactor: +profitFactor.toFixed(2), expectancyR,
    forces, risks, levers: levers.slice(0,3), projection,
    metrics: { winrate, rr, ddDayUsed, ddTotUsed, ddDayLimit, ddTotLimit, riskPct, totalTrades, capital, phase1Target },
    firmName: firmName || 'ton challenge',
  };
}

// ── Appel Gemini 2.5 Flash — génère la recommandation personnalisée ──
async function callGeminiCoach(analysis, lang) {
  // ⚠️ Clé API client-side — acceptable pour MVP PWA
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || '';
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const langLabel = { fr: 'français', en: 'English', es: 'español' }[lang] || 'français';
  const { probability, profitFactor, expectancyR, metrics, forces, risks, firmName } = analysis;
  const m = metrics;

  const forcesStr = forces.map(f => f.title).join(', ');
  const risksStr  = risks.map(r => r.title).join(', ');

  const prompt = `Tu es un analyste expert en Prop Trading, direct et précis. Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.

Stratégie analysée pour un challenge prop firm "${firmName}" (capital $${m.capital}) :
- Winrate : ${m.winrate.toFixed(0)}%
- Ratio RR : 1:${m.rr.toFixed(1)}
- Profit Factor : ${profitFactor}
- Espérance : ${expectancyR > 0 ? '+' : ''}${expectancyR}R par trade
- Drawdown max utilisé : ${Math.max(m.ddDayUsed, m.ddTotUsed).toFixed(1)}% sur ${Math.max(m.ddDayLimit, m.ddTotLimit)}% autorisé
- Trades analysés : ${m.totalTrades}
- Score de réussite calculé : ${probability}%
- Points forts détectés : ${forcesStr}
- Risques détectés : ${risksStr}

Génère ce JSON exact en ${langLabel}. Chaque champ doit citer des chiffres réels de cette stratégie :
{
  "recommendation": "2 à 3 phrases directes et personnalisées. Commence par évaluer le score ${probability}% en mentionnant la cause principale. Cite ${m.winrate.toFixed(0)}% ou ${profitFactor} ou le DD. Donne une recommandation actionnable. Sois franc comme un mentor, pas un commercial.",
  "readyForChallenge": ${probability >= 55 ? 'true' : 'false'},
  "expertQuote": "1 phrase courte et percutante comme un trader senior expérimenté dirait à son disciple."
}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.65, maxOutputTokens: 400 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Extraire le JSON même si Gemini ajoute des backticks
    const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    return null; // fallback local si API échoue
  }
}

// ── Génération locale de recommandation (fallback si Gemini indisponible) ──
function coachLocalRecommendation(analysis, lang) {
  const { probability, profitFactor, expectancyR, risks, metrics, forces } = analysis;
  const { winrate, rr, totalTrades, riskPct } = metrics;
  const mainRisk  = risks[0];
  const mainForce = forces[0];
  const fr = {
    score: probability >= 75
      ? `Avec un score de ${probability}% et un Profit Factor de ${profitFactor}, ta stratégie présente les caractéristiques d'une approche solide pour un challenge prop firm.`
      : probability >= 55
      ? `Ton score de ${probability}% indique une stratégie viable mais perfectible — le Profit Factor de ${profitFactor} est encourageant, mais des ajustements s'imposent.`
      : `Ton score de ${probability}% révèle des fragilités importantes. Avec un PF de ${profitFactor} et un winrate de ${winrate.toFixed(0)}%, le risque d'échec reste significatif.`,
    risk: mainRisk ? `Le point critique est : ${mainRisk.detail}.` : '',
    action: probability >= 75
      ? `Ta stratégie semble prête pour un challenge. Concentre-toi sur la gestion du risque par trade.`
      : probability >= 55
      ? `Avant de lancer un challenge, augmente ton échantillon et réduis le risque par trade à ${Math.min(riskPct, 1).toFixed(2)}%.`
      : `Ne lance pas de challenge avec ces métriques. Optimise d'abord ton RR (cible : 1:${(rr + 0.5).toFixed(1)}).`,
  };
  const en = {
    score: probability >= 75
      ? `With a score of ${probability}% and a Profit Factor of ${profitFactor}, your strategy shows the characteristics of a solid prop firm challenge approach.`
      : `Your ${probability}% score indicates a viable but improvable strategy — the Profit Factor of ${profitFactor} is encouraging, but adjustments are needed.`,
    risk: mainRisk ? `Critical point: ${mainRisk.detail}.` : '',
    action: probability >= 55
      ? `Your strategy looks ready for a challenge. Focus on risk per trade management.`
      : `Don't launch a challenge with these metrics. First optimize your RR (target: 1:${(rr + 0.5).toFixed(1)}).`,
  };
  const texts = lang === 'en' ? en : fr;
  return {
    recommendation: [texts.score, texts.risk, texts.action].filter(Boolean).join(' '),
    readyForChallenge: probability >= 55,
    expertQuote: lang === 'en'
      ? `A ${probability}% score is a number — your discipline on challenge day is what matters.`
      : `Un score de ${probability}% est un chiffre — ta discipline le jour J fera la différence.`,
  };
}

function CoachScreen({ t, lang, lastSim, profile, goto, premiumAccess = true, requirePremium = () => {} }) {
  const [gemini, setGemini]     = useState(null);     // résultat Gemini
  const [gemLoading, setGemLoading] = useState(false);
  const [gemError, setGemError] = useState(false);

  const fm = lastSim || {};
  const firmName = fm.firmKey ? fm.firmKey.toUpperCase() : (t ? t('coach_title') : 'PROP FIRM');
  const hasData  = lastSim && (lastSim.winrate || lastSim.totalTrades);
  const analysis = hasData ? coachAnalyze({
    winrate: lastSim.winrate, rr: lastSim.rr,
    ddDayPct: lastSim.ddDayPct, ddTotPct: lastSim.ddTotPct,
    dailyDDLimit: lastSim.dailyDDLimit, totalDDLimit: lastSim.totalDDLimit,
    riskPctValue: lastSim.riskPctValue, riskPct: lastSim.riskPct,
    totalTrades: lastSim.totalTrades, wins: lastSim.wins, losses: lastSim.losses,
    capital: lastSim.capital, phase1Target: lastSim.phase1Target,
  }, firmName) : null;

  // Appel Gemini dès que les données sont disponibles et premium
  useEffect(() => {
    if (!analysis || !premiumAccess || gemini || gemLoading) return;
    setGemLoading(true);
    callGeminiCoach(analysis, lang).then(result => {
      setGemLoading(false);
      if (result) { setGemini(result); }
      else { setGemError(true); }
    });
  }, [hasData, premiumAccess, lang]);

  const narrative = gemini || (analysis ? coachLocalRecommendation(analysis, lang) : null);

  // Couleurs selon probabilité
  const pColor = !analysis ? '#6ee7b7' : analysis.probability >= 75 ? '#4ade80' : analysis.probability >= 55 ? '#6ee7b7' : analysis.probability >= 35 ? '#fbbf24' : '#ef4444';
  const pLevel = !analysis ? '' :
    analysis.probability >= 75 ? (lang === 'en' ? 'Excellent' : lang === 'es' ? 'Excelente' : 'Excellent') :
    analysis.probability >= 55 ? (lang === 'en' ? 'Solid' : lang === 'es' ? 'Sólido' : 'Solide') :
    analysis.probability >= 35 ? (lang === 'en' ? 'Risky' : lang === 'es' ? 'Arriesgado' : 'Risqué') :
                                  (lang === 'en' ? 'Critical' : lang === 'es' ? 'Crítico' : 'Critique');

  const sectionTitle = (color, label, icon) => (
    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
      <div style={{ width:3, height:16, borderRadius:2, background:color, flexShrink:0 }} />
      <span style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:1.2 }}>
        {icon && <span style={{marginRight:5}}>{icon}</span>}{label}
      </span>
    </div>
  );

  return (
    <div style={{ padding:'14px 16px 100px', maxWidth:480, margin:'0 auto' }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <div style={{ width:46, height:46, borderRadius:14, background:'linear-gradient(135deg,rgba(110,231,183,0.2),rgba(52,211,153,0.06))', border:'1px solid rgba(110,231,183,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="8" r="4" stroke="#6ee7b7" strokeWidth="1.5"/>
            <path d="M5 19c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M15 4l1.5 1.5M17 8h2M15 12l1.5-1.5" stroke="#6ee7b7" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:19, fontWeight:800, color:'#fff', letterSpacing:-0.3 }}>{t ? t('coach_title') : 'IA Coach'}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{firmName} · Audit personnalisé</div>
        </div>
      </div>

      {!premiumAccess ? (
        <div onClick={requirePremium} style={{ position:'relative', borderRadius:20, overflow:'hidden', cursor:'pointer', minHeight:300, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(110,231,183,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <LockOverlay onUnlock={requirePremium} label={(t ? t('coach_title') : 'IA Coach') + ' — Premium'} />
        </div>
      ) : !analysis ? (
        /* État vide */
        <div style={{ textAlign:'center', padding:'50px 20px', background:'rgba(255,255,255,0.03)', borderRadius:20, border:'1px solid rgba(110,231,183,0.1)' }}>
          <div style={{ fontSize:42, marginBottom:14 }}>🤖</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.6, marginBottom:22 }}>{t ? t('coach_no_data') : 'Lance une simulation pour obtenir ton analyse.'}</div>
          <button onClick={() => goto('simulator')} style={{ padding:'14px 28px', borderRadius:100, background:'#6ee7b7', color:'#000', fontSize:14, fontWeight:700, border:'none', cursor:'pointer' }}>
            {t ? t('sim_launch') : 'Lancer une simulation'}
          </button>
        </div>
      ) : (
        <>

          {/* ══ 1. SCORE GLOBAL ══ */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(110,231,183,0.12)', borderRadius:20, padding:'20px 18px', marginBottom:12, textAlign:'center' }}>
            {/* Cercle animé */}
            <div style={{ position:'relative', width:130, height:130, margin:'0 auto 14px' }}>
              <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform:'rotate(-90deg)' }}>
                <circle cx="65" cy="65" r="57" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
                <circle cx="65" cy="65" r="57" fill="none" stroke={pColor} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={String(2 * Math.PI * 57)}
                  strokeDashoffset={String(2 * Math.PI * 57 * (1 - analysis.probability / 100))} />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontSize:34, fontWeight:900, color:pColor, lineHeight:1 }}>{analysis.probability}<span style={{fontSize:16}}>%</span></div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:3 }}>Score</div>
              </div>
            </div>
            <div style={{ fontSize:17, fontWeight:800, color:pColor }}>{pLevel}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4 }}>Stratégie analysée · {analysis.metrics.totalTrades} trades</div>

            {/* Métriques clés condensées */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:16 }}>
              {[
                { l: lang==='en'?'Profit Factor':'Profit Factor', v: analysis.profitFactor, good: analysis.profitFactor >= 1.5 },
                { l: lang==='en'?'Expectancy':'Espérance', v: (analysis.expectancyR>0?'+':'')+analysis.expectancyR+'R', good: analysis.expectancyR > 0 },
                { l: 'DD max', v: Math.max(analysis.metrics.ddDayUsed, analysis.metrics.ddTotUsed).toFixed(1)+'%', good: Math.max(analysis.metrics.ddDayUsed/analysis.metrics.ddDayLimit, analysis.metrics.ddTotUsed/analysis.metrics.ddTotLimit) < 0.6 },
              ].map((m,i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.05)', borderRadius:12, padding:'10px 8px' }}>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', marginBottom:3 }}>{m.l}</div>
                  <div style={{ fontSize:15, fontWeight:800, color: m.good ? '#4ade80' : '#fbbf24' }}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ 2. FORCES ══ */}
          {analysis.forces.length > 0 && (
            <div style={{ background:'rgba(110,231,183,0.04)', border:'1px solid rgba(110,231,183,0.15)', borderRadius:16, padding:'16px 16px', marginBottom:12 }}>
              {sectionTitle('#4ade80', lang==='en'?'Key Strengths':'Vos forces principales', '💪')}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {analysis.forces.map((f,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{f.title}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:1, lineHeight:1.4 }}>{f.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ 3. RISQUES ══ */}
          {analysis.risks.length > 0 && (
            <div style={{ background:'rgba(251,191,36,0.04)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:16, padding:'16px 16px', marginBottom:12 }}>
              {sectionTitle('#fbbf24', lang==='en'?'Main Risks':'Risques principaux', '🔍')}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {analysis.risks.map((r,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{r.icon}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{r.title}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:1, lineHeight:1.4 }}>{r.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ 4. RECOMMANDATION IA ══ */}
          <div style={{ background:'linear-gradient(135deg,rgba(110,231,183,0.07),rgba(6,9,15,0.8))', border:'1px solid rgba(110,231,183,0.2)', borderRadius:16, padding:'16px 16px', marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              {sectionTitle('#6ee7b7', lang==='en'?'AI Recommendation':'Recommandation IA', null)}
              <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:10, background: gemLoading ? 'rgba(251,191,36,0.12)' : gemini ? 'rgba(110,231,183,0.12)' : 'rgba(255,255,255,0.07)', border:`1px solid ${gemLoading ? 'rgba(251,191,36,0.3)' : gemini ? 'rgba(110,231,183,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                {gemLoading ? (
                  <><div style={{ width:6, height:6, borderRadius:3, background:'#fbbf24', animation:'pulse 1s infinite' }} /><span style={{ fontSize:9, fontWeight:700, color:'#fbbf24' }}>IA...</span></>
                ) : gemini ? (
                  <><span style={{ fontSize:9 }}>✨</span><span style={{ fontSize:9, fontWeight:700, color:'#6ee7b7' }}>Gemini</span></>
                ) : (
                  <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)' }}>Analyse locale</span>
                )}
              </div>
            </div>

            {gemLoading ? (
              /* Skeleton loading */
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {[90,75,60].map((w,i) => (
                  <div key={i} style={{ height:11, borderRadius:6, background:'rgba(255,255,255,0.07)', width:w+'%' }} />
                ))}
                <div style={{ marginTop:8, padding:'10px 12px', borderRadius:10, background:'rgba(110,231,183,0.05)', border:'1px solid rgba(110,231,183,0.1)' }}>
                  <div style={{ height:10, borderRadius:5, background:'rgba(110,231,183,0.12)', width:'80%' }} />
                </div>
              </div>
            ) : narrative ? (
              <>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.85)', lineHeight:1.65, marginBottom:12 }}>
                  {narrative.recommendation}
                </div>
                {narrative.expertQuote && (
                  <div style={{ padding:'10px 13px', borderRadius:10, background:'rgba(255,255,255,0.05)', borderLeft:'3px solid rgba(110,231,183,0.5)' }}>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:3, textTransform:'uppercase', letterSpacing:0.8 }}>Expert</div>
                    <div style={{ fontSize:12, fontStyle:'italic', color:'rgba(255,255,255,0.7)', lineHeight:1.5 }}>"{narrative.expertQuote}"</div>
                  </div>
                )}
                {narrative.readyForChallenge !== undefined && (
                  <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:7 }}>
                    <span style={{ fontSize:13 }}>{narrative.readyForChallenge ? '✅' : '⚠️'}</span>
                    <span style={{ fontSize:11, color: narrative.readyForChallenge ? '#6ee7b7' : '#fbbf24', fontWeight:600 }}>
                      {narrative.readyForChallenge
                        ? (lang==='en' ? 'Strategy ready for a challenge' : 'Stratégie prête pour un challenge')
                        : (lang==='en' ? 'Optimization recommended before launching' : 'Optimisation recommandée avant de lancer')}
                    </span>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* ══ 5. PROJECTION CHALLENGE ══ */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'16px 16px', marginBottom:12 }}>
            {sectionTitle('#a78bfa', lang==='en'?'Challenge Projection':'Projection Challenge', '🎯')}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { l: lang==='en'?'Success probability':'Probabilité de réussite', v: analysis.probability+'%', c: pColor },
                { l: lang==='en'?'Estimated time':'Temps estimé (phase 1)',
                  v: analysis.projection.daysMin
                    ? `${analysis.projection.daysMin}–${analysis.projection.daysMax}j`
                    : (lang==='en' ? 'N/A' : 'N/A'),
                  c: '#fff' },
                { l: lang==='en'?'Failure risk':'Risque d\'échec', v: analysis.projection.failureRisk, c: analysis.projection.failureColor },
                { l: lang==='en'?'Max consec. losses':'Pertes consécutives max',
                  v: analysis.projection.maxConsecLosses > 0
                    ? `${analysis.projection.maxConsecLosses} trades`
                    : (lang==='en' ? 'Unknown' : 'Inconnu'),
                  c: analysis.projection.maxConsecLosses > 5 ? '#4ade80' : analysis.projection.maxConsecLosses > 2 ? '#fbbf24' : '#ef4444' },
              ].map((m,i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.05)', borderRadius:12, padding:'12px 12px' }}>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', marginBottom:4, lineHeight:1.3 }}>{m.l}</div>
                  <div style={{ fontSize:16, fontWeight:800, color:m.c }}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ 6. OPTIMISATION IA ══ */}
          {analysis.levers.length > 0 && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'16px 16px', marginBottom:12 }}>
              {sectionTitle('#fbbf24', lang==='en'?'AI Optimization':'Optimisation IA', '⚡')}
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:12, lineHeight:1.4 }}>
                {lang==='en' ? 'Impact of each improvement on your success probability :' : 'Impact de chaque amélioration sur ta probabilité de réussite :'}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {analysis.levers.map((l,i) => (
                  <div key={i} style={{ background:'rgba(110,231,183,0.05)', border:'1px solid rgba(110,231,183,0.15)', borderRadius:12, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:42, height:42, borderRadius:11, background:'rgba(110,231,183,0.12)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:900, color:'#6ee7b7', lineHeight:1 }}>+{l.gain}</div>
                      <div style={{ fontSize:7, color:'rgba(110,231,183,0.6)', letterSpacing:0.3 }}>POINTS</div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:3 }}>{l.label}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>
                        <span style={{ color:'#f87171', fontWeight:600 }}>{l.from}</span>
                        {' → '}
                        <span style={{ color:'#4ade80', fontWeight:600 }}>{l.to}</span>
                        {' → '}
                        <span style={{ color:'#6ee7b7', fontWeight:700 }}>{l.newProb}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ 7. FOOTER AUDIT PREMIUM ══ */}
          <div style={{ borderRadius:14, padding:'14px 16px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', textAlign:'center' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>
              {lang==='en' ? 'Certified AI Audit' : 'Audit IA certifié'}
            </div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', lineHeight:1.5 }}>
              {lang==='en'
                ? `Analysis based on ${analysis.metrics.totalTrades} real trades · Monte Carlo 200 simulations · Gemini 2.5 Flash`
                : `Analyse basée sur ${analysis.metrics.totalTrades} trades réels · Monte Carlo 200 simulations · Gemini 2.5 Flash`}
            </div>
            <div style={{ marginTop:8, fontSize:9, color:'rgba(255,255,255,0.2)' }}>
              {lang==='en'
                ? 'For educational purposes only · Not financial advice'
                : 'À titre éducatif uniquement · Pas un conseil financier'}
            </div>
          </div>

        </>
      )}
    </div>
  );
}

function DashboardScreen({ t, lang, user, profile, lastSim, goto, loadConfig, premiumAccess = true, daysLeft = 0, requirePremium = () => {} }) {
  const firm = PROP_FIRMS[profile.firmKey] || PROP_FIRMS.fundednext;
  const fm = firm.models[lastSim?.modelKey] || firm.models["2step"] || Object.values(firm.models)[0];
  const [perfPeriod, setPerfPeriod] = useState("7J");
  const [configs, setConfigs] = useState(() => {
    try { const r=localStorage.getItem("eapropfirm_saved_configs"); return r?JSON.parse(r):[]; } catch(e){return [];}
  });
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  // ── Journal de trading (hook partagé avec Mes Trades) ──
  const [journalMode, setJournalMode] = useState(() => {
    try { return localStorage.getItem("eapropfirm_journalmode") === "1"; }
    catch (e) { return false; }
  });
  const { journal: journalAll, journalMonth, setJournalMonth, saveJournalEntry, monthData: journalMonthData } = useJournal();


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

  // ── Courbe equity journal : cumul mensuel depuis le capital de référence ──
  // DOIT être après cap — utilise cap comme point de départ
  const journalEquityCurve = (() => {
    if (!journalAll || Object.keys(journalAll).length === 0) return null;
    const sortedMonths = Object.keys(journalAll).sort();
    if (sortedMonths.length === 0) return null;
    let equity = cap; // départ = même capital que la simulation
    return sortedMonths.map((monthKey, idx) => {
      const days = journalAll[monthKey] || {};
      const monthPnl = Object.values(days).reduce((sum, d) => sum + (d.pnl || 0), 0);
      equity += monthPnl;
      return { journalMonthIdx: idx + 1, journalEquity: Math.round(equity) };
    });
  })();
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
          <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>{t("dash_first_sim")}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:18}}>Tes statistiques apparaîtront ici après la simulation.</div>
          <button onClick={()=>goto("simulator")} style={{padding:"14px 28px",borderRadius:100,background:"#6ee7b7",color:"#000",fontSize:14,fontWeight:700,border:"none",cursor:"pointer"}}>{t("dash_start_now")}</button>
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

      {/* ── CALENDRIER PNL / JOURNAL DE TRADING ── */}
      <div style={{marginBottom:"14px"}}>
        {/* Toggle mode journal */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 2px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
            {journalMode ? ("📓 " + t("cal_journal_title")) : ("📊 " + t("cal_title"))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: journalMode ? "#6ee7b7" : "rgba(255,255,255,0.4)", fontWeight: 600 }}>
              {t("cal_journal_mode")}
              {!premiumAccess && <span style={{ marginLeft: 5, fontSize: 10 }}>🔒</span>}
            </span>
            <div onClick={() => {
              if (!premiumAccess) { requirePremium(); return; }
              setJournalMode(v => {
                const next = !v;
                try { localStorage.setItem("eapropfirm_journalmode", next ? "1" : "0"); } catch(e) {}
                return next;
              });
            }} style={{
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
              {Object.keys(journalMonthData).length} {t("cal_days_entered")}
            </span>
          </div>
        )}

        {/* Le calendrier : mode journal OU mode simulation */}
        {journalMode ? (
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,overflow:"hidden"}}>
            <CalendrierPnL t={t} lang={lang}
              dailyLog={[]}
              journalMode={true}
              journalData={journalMonthData}
              onJournalSave={saveJournalEntry}
              journalMonthLabel={t("cal_click_day") + " · " + journalMonth}
            />
          </div>
        ) : ls.funded ? (
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,overflow:"hidden"}}>
            <CalendrierPnL t={t} lang={lang} dailyLog={ls.funded.dailyLog} />
          </div>
        ) : (
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:16,textAlign:"center",color:"rgba(255,255,255,0.35)",fontSize:13}}>
            Lance une simulation pour voir le tableau PnL, ou active le mode journal pour saisir tes trades réels.
          </div>
        )}
      </div>
      {/* ── APERÇU PERFORMANCE : simulation funded + courbe journal réel ── */}
      {ls.funded ? (
        <div style={{marginBottom:"14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:16}}>
          {/* Titre + légende */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:1}}>{t("dash_overview_equity")}</div>
            {journalEquityCurve && journalEquityCurve.length > 0 && (
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:12,height:2,background:"#6ee7b7",borderRadius:1}}/>
                  <span style={{fontSize:9,color:"rgba(255,255,255,0.4)"}}>{t("dash_sim_legend")}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:12,height:2,background:"#fbbf24",borderRadius:1}}/>
                  <span style={{fontSize:9,color:"rgba(255,255,255,0.4)"}}>{t("dash_journal_legend")}</span>
                </div>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={ls.funded.data.map((row, i) => ({
              ...row,
              // Merger le journal : aligner par index de mois (M1=mois 1 du journal, etc.)
              journalEquity: journalEquityCurve && journalEquityCurve[i]
                ? journalEquityCurve[i].journalEquity
                : undefined,
            }))}>
              <defs>
                <linearGradient id="perf-funded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "M" + v} />
              <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} domain={["auto", "auto"]} />
              <Tooltip
                formatter={(v, name) => [fmt(v), name === "journalEquity" ? "Journal réel" : name === "equity" ? "Simulation" : name]}
                contentStyle={{ background: "rgba(10,12,22,0.97)", border: "1px solid rgba(110,231,183,0.15)", borderRadius: 12, fontSize: 11 }}
              />
              <ReferenceLine y={cap} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 2" />
              {/* Courbe simulation (verte) */}
              <Area type="monotone" dataKey="equity" stroke="#6ee7b7" strokeWidth={2} fill="url(#perf-funded)" dot={false} name="Simulation" />
              <Line type="monotone" dataKey="cumul" stroke="rgba(110,231,183,0.6)" strokeWidth={1.5} dot={false} name="Payout Cumulé" strokeDasharray="5 3" />
              {/* Courbe journal réel (amber) — affichée seulement si données */}
              {journalEquityCurve && journalEquityCurve.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="journalEquity"
                  stroke="#fbbf24"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#fbbf24", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#fbbf24" }}
                  name="journalEquity"
                  connectNulls={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{marginBottom:"14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:16,textAlign:"center",color:"rgba(255,255,255,0.35)",fontSize:13}}>
          {t("dash_launch_funded")}
        </div>
      )}

      {/* ── 2 COLONNES : STATS + CONFIGS ── */}
      <div style={{marginBottom:"14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {/* STATISTIQUES */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:14}}>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing: -0.2,marginBottom:12}}>{t("dash_stats")}</div>
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
              <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1}}>{t("dash_configs")}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.25)",marginTop:1}}>{configs.length}/3 slots</div>
            </div>
            <button onClick={()=>goto("simulator")} style={{background:"none",border:"none",color:"#6ee7b7",fontSize:10,fontWeight:700,cursor:"pointer"}}>+ New</button>
          </div>
          {configs.length===0 ? (
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:8}}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="8" width="20" height="16" rx="3" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/><path d="M9 8V6a5 5 0 0110 0v2" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>{t("dash_no_config")}</div>
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
          <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{t("dash_stay_focused")}</div>
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

function ProfileScreen({ t, lang, setLang, user, profile, setProfile, onLogout, onReset, premium = {}, daysLeft = 0, onUpgrade = () => {} }) {
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

      {/* Carte abonnement / trial */}
      <div onClick={() => { if (!premium.subscribed) onUpgrade(); }} style={{
        marginBottom: 16, borderRadius: 18, padding: "16px 18px", cursor: premium.subscribed ? "default" : "pointer",
        background: premium.subscribed
          ? "linear-gradient(135deg, rgba(110,231,183,0.14), rgba(52,211,153,0.06))"
          : "linear-gradient(135deg, rgba(251,191,36,0.10), rgba(255,255,255,0.03))",
        border: "1px solid " + (premium.subscribed ? "rgba(110,231,183,0.3)" : "rgba(251,191,36,0.25)"),
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
              {premium.subscribed
                ? (lang === "en" ? "Premium active" : lang === "es" ? "Premium activo" : "Premium actif")
                : (lang === "en" ? "Free trial" : lang === "es" ? "Prueba gratis" : "Essai gratuit")}
              {premium.subscribed && <span style={{ fontSize: 13 }}>✓</span>}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>
              {premium.subscribed
                ? (premium.plan === "year" ? "79,99 €/an" : "9,99 €/mois")
                : (daysLeft > 0
                    ? (lang === "en" ? daysLeft + " days left" : lang === "es" ? daysLeft + " días restantes" : daysLeft + " jours restants")
                    : (lang === "en" ? "Trial ended" : lang === "es" ? "Prueba terminada" : "Essai terminé"))}
            </div>
          </div>
          {!premium.subscribed && (
            <div style={{ fontSize: 12, fontWeight: 700, color: "#000", background: "#6ee7b7", padding: "8px 16px", borderRadius: 12 }}>
              {lang === "en" ? "Upgrade" : lang === "es" ? "Mejorar" : "Passer Premium"}
            </div>
          )}
        </div>
      </div>

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
    { k:"coach", label:t("coach_title"),
      icon:(on)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2a4.5 4.5 0 014.5 4.5c0 1.4-.6 2.6-1.5 3.5.7.5 1.5 1.4 1.5 2.9 0 2-1.8 3.6-4.5 3.6S6.5 14.9 6.5 12.9c0-1.5.8-2.4 1.5-2.9C7.1 9.1 6.5 7.9 6.5 6.5A4.5 4.5 0 0111 2z"
          fill={on?"rgba(110,231,183,0.15)":"none"} stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx="9" cy="6.5" r="0.9" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="13" cy="6.5" r="0.9" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <path d="M9 19v1M13 19v1" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.5" strokeLinecap="round"/>
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

// ══════════════════════════════════════════════════════════════════
// LOCK OVERLAY — floute le contenu premium + cadenas élégant cliquable
// ══════════════════════════════════════════════════════════════════
function LockOverlay({ onUnlock, label, compact = false }) {
  return (
    <div
      onClick={onUnlock}
      style={{
        position: "absolute", inset: 0, zIndex: 5,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "rgba(6,9,15,0.55)", backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)",
        borderRadius: "inherit", cursor: "pointer", gap: compact ? 6 : 10, padding: 16, textAlign: "center",
      }}>
      <div style={{
        width: compact ? 38 : 52, height: compact ? 38 : 52, borderRadius: compact ? 19 : 26,
        background: "linear-gradient(135deg, rgba(110,231,183,0.2), rgba(52,211,153,0.1))",
        border: "1.5px solid rgba(110,231,183,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 20px rgba(110,231,183,0.2)",
      }}>
        <svg width={compact ? 17 : 23} height={compact ? 17 : 23} viewBox="0 0 24 24" fill="none">
          <rect x="4" y="11" width="16" height="10" rx="2.5" stroke="#6ee7b7" strokeWidth="1.8"/>
          <path d="M8 11V7a4 4 0 018 0v4" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="12" cy="16" r="1.4" fill="#6ee7b7"/>
        </svg>
      </div>
      {label && (
        <div style={{ fontSize: compact ? 11 : 13, fontWeight: 700, color: "#fff", maxWidth: 220, lineHeight: 1.35 }}>
          {label}
        </div>
      )}
      {!compact && (
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", padding: "6px 14px", borderRadius: 14, background: "rgba(110,231,183,0.12)", border: "1px solid rgba(110,231,183,0.3)" }}>
          Premium
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// PAYWALL — premium, axé valeur + aversion à la perte.
// Prêt pour RevenueCat (les boutons appelleront purchasePackage plus tard).
// ══════════════════════════════════════════════════════════════════
function PaywallScreen({ t, lang, daysLeft, onSubscribe, onClose, canClose = true }) {
  const [plan, setPlan] = useState("month"); // mensuel populaire par défaut
  const expired = daysLeft <= 0;

  const L = {
    fr: {
      badge: expired ? "Essai terminé" : daysLeft + " jours d'essai restants",
      title1: "Débloque ton",
      title2: "plein potentiel",
      sub: "Les traders qui valident leur stratégie AVANT le challenge évitent de perdre leurs frais d'inscription.",
      riskTitle: "CE QUE TU RISQUES\nSANS PRÉPARATION",
      r1: "150 à 600 € de frais de challenge perdus à chaque échec",
      r2: "Des semaines de trading réel gâchées sur une stratégie non viable",
      r3: "Repasser à la caisse encore et encore",
      proTitle: "CE QUE PREMIUM\nT'APPORTE",
      p1: "Simulateur avancé complet (drawdown, clustering, Kelly, lot auto)",
      p2: "Analyse Monte Carlo : ta probabilité réelle de passer",
      p3: "Page Funded : payouts, scaling, equity mois par mois",
      p4: "Mes Trades : importe ton backtest, verdict de réussite",
      p5: "Journal de trading + captures MT4/MT5 illimitées",
      p6: "Sauvegarde de toutes tes configurations",
      toolBanner: "UN OUTIL CONÇU PAR ET POUR LES TRADERS",
      f1a: "Plus de données.", f1b: "Meilleures décisions.",
      f2: "Valide ta stratégie avant de risquer.",
      f3: "Évite les erreurs coûteuses.",
      f4: "Maximise tes chances de succès.",
      popular: "POPULAIRE",
      bestValue: "MEILLEUR PRIX",
      monthLabel: "Mensuel", monthPrice: "9,99 €", monthPer: "/mois",
      yearLabel: "Annuel", yearPrice: "79,99 €", yearPer: "/an",
      yearSave: "ÉCONOMISE 33 %", yearSub: "soit 6,67 €/mois",
      trust1: "Paiement 100 % sécurisé", trust2: "Annulation à tout moment", trust3: "Satisfait ou remboursé",
      cta: expired ? "S'abonner maintenant" : "Continuer mon essai",
      stars: "Rejoint par des milliers de traders prop firm",
      restore: "Restaurer mes achats",
    },
    en: {
      badge: expired ? "Trial ended" : daysLeft + " trial days left",
      title1: "Unlock your", title2: "full potential",
      sub: "Traders who validate their strategy BEFORE the challenge avoid losing their entry fees.",
      riskTitle: "WHAT YOU RISK\nWITHOUT PREP",
      r1: "$150 to $600 in challenge fees lost on every failure",
      r2: "Weeks of real trading wasted on a non-viable strategy",
      r3: "Paying again and again",
      proTitle: "WHAT PREMIUM\nGIVES YOU",
      p1: "Full advanced simulator (drawdown, clustering, Kelly, auto lot)",
      p2: "Monte Carlo: your real probability of passing",
      p3: "Funded page: payouts, scaling, month-by-month equity",
      p4: "My Trades: import your backtest, pass/fail verdict",
      p5: "Trading journal + unlimited MT4/MT5 screenshots",
      p6: "Save all your configurations",
      toolBanner: "A TOOL BUILT BY AND FOR TRADERS",
      f1a: "More data.", f1b: "Better decisions.",
      f2: "Validate before risking.", f3: "Avoid costly mistakes.", f4: "Maximize your success.",
      popular: "POPULAR", bestValue: "BEST VALUE",
      monthLabel: "Monthly", monthPrice: "$9.99", monthPer: "/mo",
      yearLabel: "Annual", yearPrice: "$79.99", yearPer: "/yr",
      yearSave: "SAVE 33%", yearSub: "$6.67/month",
      trust1: "100% secure payment", trust2: "Cancel anytime", trust3: "Satisfied or refunded",
      cta: expired ? "Subscribe now" : "Continue my trial",
      stars: "Joined by thousands of prop firm traders",
      restore: "Restore purchases",
    },
    es: {
      badge: expired ? "Prueba terminada" : daysLeft + " días de prueba restantes",
      title1: "Desbloquea tu", title2: "pleno potencial",
      sub: "Los traders que validan su estrategia ANTES del challenge evitan perder sus cuotas.",
      riskTitle: "LO QUE ARRIESGAS\nSIN PREPARACIÓN",
      r1: "150 a 600€ en cuotas de challenge en cada fallo",
      r2: "Semanas de trading real desperdiciadas en una estrategia no viable",
      r3: "Pagar una y otra vez",
      proTitle: "LO QUE PREMIUM\nTE APORTA",
      p1: "Simulador avanzado completo (drawdown, clustering, Kelly, lote auto)",
      p2: "Monte Carlo: tu probabilidad real de pasar",
      p3: "Página Funded: payouts, scaling, equity mes a mes",
      p4: "Mis Trades: importa tu backtest, veredicto de éxito",
      p5: "Diario de trading + capturas MT4/MT5 ilimitadas",
      p6: "Guarda todas tus configuraciones",
      toolBanner: "UNA HERRAMIENTA CREADA POR Y PARA TRADERS",
      f1a: "Más datos.", f1b: "Mejores decisiones.",
      f2: "Valida antes de arriesgar.", f3: "Evita errores costosos.", f4: "Maximiza tus opciones.",
      popular: "POPULAR", bestValue: "MEJOR PRECIO",
      monthLabel: "Mensual", monthPrice: "9,99 €", monthPer: "/mes",
      yearLabel: "Anual", yearPrice: "79,99 €", yearPer: "/año",
      yearSave: "AHORRA 33%", yearSub: "6,67 €/mes",
      trust1: "Pago 100% seguro", trust2: "Cancela cuando quieras", trust3: "Satisfecho o reembolsado",
      cta: expired ? "Suscribirse ahora" : "Continuar mi prueba",
      stars: "Miles de traders prop firm",
      restore: "Restaurar compras",
    },
  };
  const x = L[lang] || L.en;

  // SVGs inline réutilisables
  const IconShieldAlert = () => (
    <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
      <path d="M14 1L2 6v9c0 7.18 5.14 13.9 12 15.5C20.86 28.9 26 22.18 26 15V6L14 1z" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="1.5"/>
      <path d="M14 10v6M14 19.5v.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  const IconShieldCheck = () => (
    <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
      <path d="M14 1L2 6v9c0 7.18 5.14 13.9 12 15.5C20.86 28.9 26 22.18 26 15V6L14 1z" fill="rgba(110,231,183,0.15)" stroke="#6ee7b7" strokeWidth="1.5"/>
      <path d="M9 16l3.5 3.5L19 12" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div style={{
      height: "100dvh", minHeight: "100vh",
      background: "#06090f",
      maxWidth: 480, margin: "0 auto",
      position: "relative", overflow: "hidden",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      {/* Halo ambiant */}
      <div style={{ position:"absolute", top:-60, left:"50%", transform:"translateX(-50%)", width:380, height:260, borderRadius:"50%", background:"radial-gradient(ellipse, rgba(110,231,183,0.13) 0%, transparent 70%)", pointerEvents:"none", zIndex:0 }} />

      <div style={{
        position: "relative", zIndex: 1,
        padding: "calc(env(safe-area-inset-top,14px) + 10px) 18px 0",
        flex: 1, display: "flex", flexDirection: "column",
        gap: 0,
      }}>

        {/* ── HEADER : badge + fermeture ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 10 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, background: expired?"rgba(239,68,68,0.12)":"rgba(251,191,36,0.12)", border:"1px solid "+(expired?"rgba(239,68,68,0.3)":"rgba(251,191,36,0.3)") }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke={expired?"#f87171":"#fbbf24"} strokeWidth="1.2"/>
              <path d="M6 3.5v3M6 8v.5" stroke={expired?"#f87171":"#fbbf24"} strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize:11, fontWeight:700, color:expired?"#f87171":"#fbbf24" }}>{x.badge}</span>
          </div>
          {canClose && (
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:15, background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.7)", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          )}
        </div>

        {/* ── TITRE ── */}
        <div style={{ fontSize:26, fontWeight:800, color:"#fff", lineHeight:1.15, letterSpacing:-0.5, marginBottom:5 }}>
          {x.title1}{" "}<span style={{ color:"#6ee7b7" }}>{x.title2}</span>
        </div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", lineHeight:1.45, marginBottom:10 }}>{x.sub}</div>

        {/* ── DEUX CARTES CÔTE À CÔTE ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10, flex:"0 0 auto" }}>

          {/* Carte risques */}
          <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.22)", borderRadius:14, padding:"10px 10px" }}>
            <div style={{ marginBottom:7, display:"flex", justifyContent:"center" }}><IconShieldAlert /></div>
            <div style={{ fontSize:9, fontWeight:800, color:"#ef4444", textTransform:"uppercase", letterSpacing:0.6, lineHeight:1.3, textAlign:"center", marginBottom:8, whiteSpace:"pre-line" }}>{x.riskTitle}</div>
            {[x.r1, x.r2, x.r3].map((r, i) => (
              <div key={i} style={{ display:"flex", gap:5, marginBottom:i<2?5:0, alignItems:"flex-start" }}>
                <span style={{ color:"#ef4444", fontSize:10, fontWeight:700, flexShrink:0, marginTop:1 }}>×</span>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.7)", lineHeight:1.4 }}>{r}</span>
              </div>
            ))}
          </div>

          {/* Carte premium */}
          <div style={{ background:"rgba(110,231,183,0.05)", border:"1px solid rgba(110,231,183,0.22)", borderRadius:14, padding:"10px 10px" }}>
            <div style={{ marginBottom:7, display:"flex", justifyContent:"center" }}><IconShieldCheck /></div>
            <div style={{ fontSize:9, fontWeight:800, color:"#6ee7b7", textTransform:"uppercase", letterSpacing:0.6, lineHeight:1.3, textAlign:"center", marginBottom:8, whiteSpace:"pre-line" }}>{x.proTitle}</div>
            {[x.p1, x.p2, x.p3, x.p4, x.p5, x.p6].map((p, i) => (
              <div key={i} style={{ display:"flex", gap:5, marginBottom:i<5?4:0, alignItems:"flex-start" }}>
                <span style={{ color:"#6ee7b7", fontSize:10, fontWeight:700, flexShrink:0, marginTop:1 }}>✓</span>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.8)", lineHeight:1.4 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── BANDEAU SOCIAL PROOF ── */}
        <div style={{ marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ flex:1, height:1, background:"rgba(110,231,183,0.15)" }} />
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:9, fontWeight:800, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:0.8 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.2 3.6H11L8.1 6.9l1.1 3.6L6 8.3l-3.2 2.2L3.9 6.9 1 4.6h3.8L6 1z" fill="#fbbf24"/></svg>
              {x.toolBanner}
            </div>
            <div style={{ flex:1, height:1, background:"rgba(110,231,183,0.15)" }} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
            {[
              { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="10" width="3" height="7" rx="1" fill="#6ee7b7"/><rect x="6" y="7" width="3" height="10" rx="1" fill="#6ee7b7"/><rect x="11" y="3" width="3" height="14" rx="1" fill="#6ee7b7"/><rect x="16" y="1" width="1" height="16" rx="0.5" fill="rgba(110,231,183,0.2)"/></svg>, a: x.f1a, b: x.f1b },
              { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="#6ee7b7" strokeWidth="1.3"/><circle cx="9" cy="9" r="4.5" stroke="#6ee7b7" strokeWidth="1.3"/><circle cx="9" cy="9" r="1.5" fill="#6ee7b7"/><path d="M14 4.5l1-1" stroke="#6ee7b7" strokeWidth="1.3" strokeLinecap="round"/></svg>, a: x.f2 },
              { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1L2 5v5c0 4.42 3.08 8.54 7 9.5 3.92-.96 7-5.08 7-9.5V5L9 1z" stroke="#6ee7b7" strokeWidth="1.3"/><path d="M6 9l2 2 4-4" stroke="#6ee7b7" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, a: x.f3 },
              { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 14l4-4 3 3 5-6 3 3" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, a: x.f4 },
            ].map((item, i) => (
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:3 }}>{item.icon}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.6)", lineHeight:1.3 }}>
                  {item.a}{item.b ? <><br/><span style={{ fontWeight:700, color:"rgba(255,255,255,0.85)" }}>{item.b}</span></> : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PLANS : Annuel + Mensuel ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:8 }}>

          {/* Annuel */}
          <div onClick={() => setPlan("year")} style={{
            position:"relative", borderRadius:14, padding:"10px 14px", cursor:"pointer",
            background: plan==="year" ? "rgba(110,231,183,0.08)" : "rgba(255,255,255,0.03)",
            border:"1.5px solid "+(plan==="year" ? "#6ee7b7" : "rgba(255,255,255,0.10)"),
          }}>
            <div style={{ position:"absolute", top:-9, right:12, background:"rgba(110,231,183,0.15)", color:"#6ee7b7", fontSize:8, fontWeight:800, padding:"2px 8px", borderRadius:6, border:"1px solid rgba(110,231,183,0.3)", letterSpacing:0.5 }}>{x.bestValue}</div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"rgba(110,231,183,0.12)", border:"1px solid rgba(110,231,183,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2l2 4h5l-4 3 1.5 4.5L9 11l-4.5 2.5L6 9 2 6h5L9 2z" fill="#6ee7b7" opacity="0.9"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:6 }}>
                  {x.yearLabel}
                  <span style={{ fontSize:8, fontWeight:800, background:"rgba(110,231,183,0.18)", color:"#6ee7b7", padding:"2px 6px", borderRadius:4 }}>{x.yearSave}</span>
                </div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", marginTop:1 }}>{x.yearSub}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>{x.yearPrice}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>{x.yearPer}</div>
                </div>
                <div style={{ width:26, height:26, borderRadius:13, background: plan==="year"?"#6ee7b7":"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2l3.5 3-3.5 3" stroke={plan==="year"?"#000":"rgba(255,255,255,0.5)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Mensuel — POPULAIRE */}
          <div onClick={() => setPlan("month")} style={{
            position:"relative", borderRadius:14, padding:"10px 14px", cursor:"pointer",
            background: plan==="month" ? "rgba(110,231,183,0.08)" : "rgba(255,255,255,0.03)",
            border:"1.5px solid "+(plan==="month" ? "#6ee7b7" : "rgba(255,255,255,0.10)"),
          }}>
            <div style={{ position:"absolute", top:-9, right:12, background:"#6ee7b7", color:"#000", fontSize:8, fontWeight:800, padding:"2px 8px", borderRadius:6, letterSpacing:0.5 }}>{x.popular}</div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="2" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3"/><path d="M2 7h14" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3"/><circle cx="5.5" cy="11" r="1" fill="rgba(255,255,255,0.5)"/><circle cx="9" cy="11" r="1" fill="rgba(255,255,255,0.5)"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{x.monthLabel}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>{x.monthPrice}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>{x.monthPer}</div>
                </div>
                <div style={{ width:26, height:26, borderRadius:13, background: plan==="month"?"#6ee7b7":"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2l3.5 3-3.5 3" stroke={plan==="month"?"#000":"rgba(255,255,255,0.5)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TRUST BADGES ── */}
        <div style={{ display:"flex", justifyContent:"center", gap:16, marginBottom:10 }}>
          {[
            { icon:<svg width="11" height="13" viewBox="0 0 11 13" fill="none"><rect x="1" y="5" width="9" height="7" rx="1.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.1"/><path d="M3 5V3.5a2.5 2.5 0 015 0V5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.1" strokeLinecap="round"/><circle cx="5.5" cy="8.5" r="1" fill="rgba(255,255,255,0.4)"/></svg>, label:x.trust1 },
            { icon:<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M11 6.5A4.5 4.5 0 112 4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.1" strokeLinecap="round"/><path d="M2 1.5V4H4.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>, label:x.trust2 },
            { icon:<svg width="12" height="13" viewBox="0 0 12 13" fill="none"><path d="M6 1L1 3.5v4c0 3 2 5.5 5 6 3-.5 5-3 5-6v-4L6 1z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.1"/><path d="M3.5 6.5l1.5 1.5 3-3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>, label:x.trust3 },
          ].map((b, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
              {b.icon}
              <span style={{ fontSize:9, color:"rgba(255,255,255,0.45)", whiteSpace:"nowrap" }}>{b.label}</span>
            </div>
          ))}
        </div>

        {/* ── CTA BUTTON ── */}
        <button
          onClick={() => onSubscribe(plan)}
          style={{
            width:"100%", padding:"16px", borderRadius:16, border:"none",
            background:"linear-gradient(135deg, #6ee7b7, #34d399)",
            color:"#000", fontSize:16, fontWeight:800, cursor:"pointer",
            boxShadow:"0 6px 24px rgba(110,231,183,0.35)", marginBottom:8,
            letterSpacing:-0.2,
          }}>
          {x.cta}
        </button>

        {/* ── STARS + RESTORE ── */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, paddingBottom:"calc(env(safe-area-inset-bottom,12px) + 8px)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ color:"#fbbf24", fontSize:12, letterSpacing:1.5 }}>★★★★★</span>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>{x.stars}</span>
          </div>
          <button onClick={() => onSubscribe("restore")} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:10, cursor:"pointer", padding:"2px 0" }}>{x.restore}</button>
        </div>

      </div>
    </div>
  );
}

export default function App() {
  const app0 = loadApp();
  const [lang, setLangState] = useState(app0.profile?.lang ?? null);

  const [onboarded, setOnboarded] = useState(app0.onboarded ?? false);
  const [user, setUser] = useState(app0.user ?? null);
  // ── Premium / trial ──
  const [premium, setPremium] = useState(() => loadPremium());
  const [showPaywall, setShowPaywall] = useState(false);
  // Paywall d'onboarding : affiché une seule fois après le ProfileSetup
  const [onboardingPaywallDone, setOnboardingPaywallDone] = useState(() => {
    return localStorage.getItem("eapropfirm_ob_paywall") === "1";
  });
  const dismissOnboardingPaywall = () => {
    setOnboardingPaywallDone(true);
    try { localStorage.setItem("eapropfirm_ob_paywall", "1"); } catch(e) {}
  };
  // Recalcule l'accès premium (abonné ou trial actif)
  const premiumAccess = premium.subscribed || (() => {
    if (!premium.trialStart) return true; // trial pas encore démarré = accès le temps du setup
    const elapsed = (Date.now() - premium.trialStart) / (1000*60*60*24);
    return elapsed < TRIAL_DAYS;
  })();
  const daysLeft = premium.subscribed ? Infinity : (premium.trialStart
    ? Math.max(0, Math.ceil(TRIAL_DAYS - (Date.now() - premium.trialStart)/(1000*60*60*24)))
    : TRIAL_DAYS);
  // Session Firebase : restaure/synchronise l'utilisateur connecté au démarrage.
  // Si Firebase a une session active → priorité à Firebase.
  // Si Firebase est déconnecté mais qu'un user local "guest" existe → on le garde.
  useEffect(() => {
    const unsub = fbOnAuthChange((fbUser) => {
      if (fbUser) {
        const u = fbUserToAppUser(fbUser);
        setUser(u);
        saveApp({ user: u });
      } else {
        // Pas de session Firebase : on ne déconnecte que les comptes Firebase (uid présent)
        const cur = loadApp().user;
        if (cur && cur.uid) { setUser(null); saveApp({ user: null }); }
      }
    });
    return unsub;
  }, []);
  const [setupDone, setSetupDone] = useState(app0.setupDone ?? false);
  const [profile, setProfile] = useState(app0.profile ?? { lang: "fr", firmKey: "fundednext", capital: 25000 });
  const [screen, setScreen] = useState("dashboard");
  const [simTab, setSimTab] = useState("challenge");
  const [lastSim, setLastSim] = useState(app0.lastSim ?? null);

  // Scroll to top à chaque changement de page ou d'onglet
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen, simTab]);
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
    // Coach, Monte Carlo et Mes Trades sont premium → paywall si pas d'accès
    if ((k === "trades" || k === "montecarlo" || k === "coach") && !premiumAccess) {
      setShowPaywall(true);
      return;
    }
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
      const p = startTrialIfNeeded(); // démarre les 7 jours à la 1ère connexion
      setPremium(p);
      setShowSplash(true);
    }} />;
  }
  if (!setupDone) {
    return <ProfileSetupScreen t={t} lang={lang} setLang={setLang} onDone={(p) => { setProfile(p); setSetupDone(true); }} />;
  }

  // ── Paywall d'onboarding — affiché une seule fois après le ProfileSetup ──
  // L'utilisateur peut continuer son essai en appuyant sur "Continuer mon essai"
  if (!onboardingPaywallDone) {
    return (
      <PaywallScreen
        t={t} lang={lang} daysLeft={daysLeft}
        onSubscribe={(plan) => {
          if (plan !== "restore") {
            const p = savePremium({ subscribed: true, plan, subscribedAt: Date.now() });
            setPremium(p);
          }
          dismissOnboardingPaywall();
        }}
        onClose={dismissOnboardingPaywall}
        canClose={true}
      />
    );
  }

  // Handler d'abonnement — pour l'instant simule l'achat, plus tard RevenueCat
  const handleSubscribe = (plan) => {
    if (plan === "restore") {
      // RevenueCat.restorePurchases() plus tard
      const p = loadPremium();
      if (p.subscribed) { setPremium(p); setShowPaywall(false); }
      else alert(lang === "en" ? "No active subscription found." : lang === "es" ? "No se encontró suscripción activa." : "Aucun abonnement actif trouvé.");
      return;
    }
    // TODO RevenueCat.purchasePackage(plan)
    const p = savePremium({ subscribed: true, plan, subscribedAt: Date.now() });
    setPremium(p);
    setShowPaywall(false);
  };

  // Paywall FORCÉ si le trial est expiré et pas abonné
  if (!premium.subscribed && premium.trialStart && daysLeft <= 0) {
    return <PaywallScreen t={t} lang={lang} daysLeft={0} onSubscribe={handleSubscribe} onClose={() => {}} canClose={false} />;
  }

  // Paywall ouvert manuellement (clic sur feature verrouillée)
  if (showPaywall) {
    return <PaywallScreen t={t} lang={lang} daysLeft={daysLeft} onSubscribe={handleSubscribe} onClose={() => setShowPaywall(false)} canClose={true} />;
  }

  // ── App principale avec navbar ──
  const reset = () => {
    try { localStorage.removeItem(APP_KEY); localStorage.removeItem("eapropfirm_config"); } catch (e) {}
    setOnboarded(false); setUser(null); setSetupDone(false);
    setProfile({ lang: "fr", firmKey: "fundednext", capital: 25000 });
    setLastSim(null); setScreen("dashboard");
  };
  const logout = () => {
    fbSignOut().catch(() => {});
    setUser(null); saveApp({ user: null });
    // Reset paywall onboarding pour le prochain login
    setOnboardingPaywallDone(false);
    try { localStorage.removeItem("eapropfirm_ob_paywall"); } catch(e) {}
  };

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
          <DashboardScreen t={t} lang={lang} user={user} profile={profile} lastSim={lastSim} goto={goto} loadConfig={loadConfig} premiumAccess={premiumAccess} daysLeft={daysLeft} requirePremium={() => setShowPaywall(true)} />
        )}
        {screen === "simulator" && (
          <SimulatorScreen key={simKey} t={t} lang={lang} tab={simTab} setTab={setSimTab} onSimResult={handleSimResult} displayMode={profile.displayMode || "advanced"} usageType={profile.usageType || "propfirm"} premiumAccess={premiumAccess} requirePremium={() => setShowPaywall(true)} />
        )}
        {screen === "coach" && (
          <CoachScreen t={t} lang={lang} lastSim={lastSim} profile={profile} goto={navGoto} premiumAccess={premiumAccess} requirePremium={() => setShowPaywall(true)} />
        )}
        {screen === "profile" && (
          <ProfileScreen t={t} lang={lang} setLang={setLang} user={user} profile={profile} setProfile={setProfile} onLogout={logout} onReset={reset} premium={premium} daysLeft={daysLeft} onUpgrade={() => setShowPaywall(true)} />
        )}
      </div>
      <NavBar t={t} active={navActive} goto={navGoto} />
    </div>
  );
}
