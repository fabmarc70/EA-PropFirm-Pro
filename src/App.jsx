import { useState, useEffect, useRef } from "react";
import { fbSignInGoogle, fbSignInApple, fbSignUpEmail, fbSignInEmail, fbOnAuthChange, fbSignOut, fbUserToAppUser, fbLoadUserProfile, fbSaveUserProfile } from "./firebase.js";
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
    dec_pf_strong: "Profit Factor solide", dec_pf_ok: "Profit Factor correct", dec_pf_weak: "PF trop faible", dec_pf_negative: "PF négatif — stratégie perdante",
    dec_wr_rr_balanced: "Winrate et RR équilibrés", dec_wr_low: "Winrate trop bas pour ce RR",
    dec_dd_unknown: "DD inconnu — impossible de valider", dec_dd_excellent: "Drawdown très maîtrisé", dec_dd_good: "Drawdown maîtrisé",
    dec_dd_borderline: "DD proche de la limite", dec_dd_too_high: "DD trop élevé",
    dec_sample_insufficient: "Échantillon insuffisant", dec_sample_ok: "Échantillon correct", dec_sample_strong: "Échantillon solide",
    dec_mc_unavailable: "Monte Carlo non disponible", dec_mc_favorable: "Monte Carlo favorable", dec_mc_moderate: "Monte Carlo modéré",
    dec_mc_unfavorable: "Monte Carlo défavorable",
    dec_launch: "Lancer le challenge", dec_wait: "Attendre", dec_dont_launch: "Ne lancez pas ce challenge",

    day_sun: "Dimanche", day_mon: "Lundi", day_tue: "Mardi", day_wed: "Mercredi", day_thu: "Jeudi", day_fri: "Vendredi", day_sat: "Samedi",
    mt5_pf_strong: "Profit Factor solide", mt5_wr_strong: "Winrate solide", mt5_dd_controlled: "Drawdown maîtrisé",
    mt5_rr_strong: "Ratio R/R favorable", mt5_symbol_strong: "Instrument moteur de performance", mt5_of_gains: "de tes gains",
    mt5_pf_weak: "Profit Factor faible", mt5_dd_high: "Drawdown élevé", mt5_revenge: "Revenge trading détecté",
    mt5_after_streak: "après série de pertes", mt5_overtrading: "Overtrading détecté", mt5_days_over8: "jours à 8+ trades",
    mt5_underrisk: "Sous-utilisation du risque", mt5_underrisk_detail: "risque moyen < 0.3% du capital",
    mt5_bad_day: "Jour à risque", mt5_of_losses: "de tes pertes", mt5_bad_hour: "Horaire à risque", mt5_bad_symbol: "Instrument à risque",
    mt5_reco_revenge: "Arrête de trader après 3 pertes consécutives — fais une pause d'au moins 1h.",
    mt5_reco_overtrading: "Limite-toi à un nombre de trades fixe par jour pour éviter l'overtrading.",
    mt5_reco_avoid_day: "Évite ou réduis ton exposition le", mt5_reco_avoid_hour: "Évite de trader autour de",
    mt5_reco_avoid_symbol: "Réévalue ta stratégie sur", mt5_reco_underrisk: "Augmente légèrement ton risque/trade pour exploiter ton edge statistique.",
    mt5_reco_streak: "Ta pire série perdante est de", mt5_reco_streak2: "trades — prévois une règle d'arrêt avant ce seuil.",
    mt5_reco_keep_going: "Aucun pattern à risque détecté — continue sur cette voie.",

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
    dec_title: "Puis-je lancer ce challenge ?",
    dec_subtitle: "Décision basée sur ton historique importé",
    dec_score_label: "Score de décision",
    dec_why: "Pourquoi ce verdict",
    dec_metrics: "Métriques clés",
    dec_import_first: "Importe un CSV MT5 ou un backtest pour obtenir ta décision.",
    dec_pf_metric: "Profit Factor",
    dec_wr_metric: "Winrate",
    dec_rr_metric: "RR",
    dec_dd_metric: "Drawdown",
    dec_sample_metric: "Échantillon",
    dec_mc_metric: "Monte Carlo",
    dec_trades_unit: "trades",
    mt5_title: "Analyse Comportementale MT5",
    mt5_subtitle: "Analyse automatique de ton historique",
    mt5_score_title: "Score Qualité Trader",
    mt5_score_excellent: "Excellent",
    mt5_score_good: "Bon",
    mt5_score_average: "Moyen",
    mt5_score_weak: "Faible",
    mt5_global_stats: "Statistiques globales",
    mt5_winrate: "Winrate",
    mt5_pf: "Profit Factor",
    mt5_avg_rr: "RR moyen",
    mt5_max_dd: "Drawdown max",
    mt5_win_streak: "Série gagnante max",
    mt5_loss_streak: "Série perdante max",
    mt5_time_analysis: "Horaires & jours rentables",
    mt5_best_day: "Meilleur jour",
    mt5_worst_day: "Pire jour",
    mt5_best_hour: "Meilleure heure",
    mt5_worst_hour: "Pire heure",
    mt5_instrument_analysis: "Instruments rentables",
    mt5_best_instrument: "Meilleur instrument",
    mt5_worst_instrument: "Pire instrument",
    mt5_forces: "Forces",
    mt5_weaknesses: "Points faibles",
    mt5_recommendations: "Recommandations",
    mt5_no_time_data: "Données horaires insuffisantes dans le fichier importé",
    mt5_no_symbol_data: "Données d'instrument non disponibles dans le fichier importé",
    mt5_trades_analyzed: "trades analysés",
    guard_title: "Daily Loss Guardian",
    guard_subtitle: "Garde-fou en temps réel",
    guard_zone_safe: "Zone sécurité",
    guard_zone_warning: "Zone attention",
    guard_zone_danger: "Zone danger",
    guard_losses_left_daily: "pertes possibles avant Daily DD",
    guard_losses_left_max: "pertes possibles avant Max DD",
    guard_daily_consumed: "de ton Daily DD consommé",
    guard_max_consumed: "de ton Max DD consommé",
    guard_margin_left: "Marge restante",
    guard_min_capital: "Capital minimum à protéger",
    guard_stop_recommended: "🛑 Stop trading recommandé",
    guard_stay_alert: "⚠️ Reste vigilant",
    guard_all_clear: "✅ Tout va bien, continue",
    guard_one_loss_left: "Encore 1 perte possible aujourd'hui.",
    guard_n_losses_left: "pertes possibles aujourd'hui.",
    guard_zero_left: "0 perte restante — limite atteinte.",
    guard_based_on: "Basé sur ton risque/trade actuel et",
    guard_trades_day: "trades/jour",
    guard_daily_limit: "Limite Daily DD",
    guard_total_limit: "Limite Max DD",
    guard_consumed: "Consommé",
    guard_capital_floor: "Plancher de capital",
    guard_below_floor: "Ne descends pas sous ce seuil aujourd'hui",
    sim_funded_need_challenge: "Lance une simulation Challenge d'abord pour accéder au compte Funded.",
    sim_go_challenge: "Aller au Challenge",
    sim_challenge_not_validated: "Le challenge n'a pas été validé. Modifie tes paramètres et relance la simulation.",
    sim_funded_not_generated: "Le compte Funded n'a pas pu être généré. Relance la simulation.",
    sim_back_challenge2: "Retour au Challenge",
    an_projection_challenge: "Projection Challenge",
    mt_csv_instr: "MT4 : Historique → clic droit → CSV",
    mt_csv_instr2: "MT5 : Historique → Rapport → CSV",
    mt_html_instr: "MT4/MT5 : Testeur → Rapport → Ouvrir → Fichier HTML",
    mt_trades_loaded: "trades chargés",
    mt_clear_data: "Effacer les données importées",
    sim_winrate_global2: "Winrate global",
    sim_loss_clustering: "Loss Clustering",
    sim_clustering_help: "0% = trades indépendants (théorique). Plus c'est haut, plus les pertes arrivent en",
    sim_black_series: "séries noires",
    sim_recommended: "Recommandé : 35-50%.",
    sim_max_consec: "Max pertes consécutives EA",
    sim_lot_instrument: "Lot & Instrument",
    sim_enable: "Activer",
    sim_instrument: "Instrument",
    sim_of_capital: "% du capital",
    sim_how_much_risk: "Combien risquez-vous par trade ?",
    sim_define_risk: "Définissez votre risque en % du capital. Tout le reste en découle automatiquement.",
    sim_capital_label: "Capital ($)",
    sim_risk_per_trade: "Risque par trade (%)",
    sim_target_obj: "Objectif",
    sim_expected: "espéré",
    sim_new_sim: "Nouvelle simulation",
    sim_copy_report2: "Copy report",
    sim_print_pdf: "Imprimer / PDF",
    sim_real_results: "Les résultats réels peuvent être inférieurs de 5 à 15 % à cause du spread, du slippage et des conditions de marché.",
    sim_balance_net: "Bilan Financier Net",
    sim_reward_challenge: "Reward challenge",
    sim_payouts_paid: "Payouts funded versés",
    sim_pending_unpaid: "En attente (non versé)",
    sim_challenge_fees: "Frais d'achat challenge",
    sim_net_result_label: "RESULTAT NET",
    sim_rules: "REGLES",
    sim_phase1_obj: "Phase 1 objectif",
    sim_phase2_obj: "Phase 2 objectif",
    sim_daily_dd2: "DD Journalier",
    sim_total_dd2: "DD Total",
    sim_time_limit: "Limite de temps",
    sim_none: "Aucune",
    sim_min_days_phase: "Min jours/phase",
    sim_days_unit: "jours",
    sim_first_payout: "1er payout",
    sim_after: "après",
    sim_split_funded: "Split Funded",
    sim_ea_algo: "EA/Algo",
    sim_authorized: "Autorisé",
    sim_save_config: "Save this config",
    sim_calendar_pnl: "Calendrier PnL",
    sim_month_dayday: "Mois {n} - simulation jour par jour",
    sim_pl_month: "P&L month",
    sim_days_pm: "Jours +/-",
    sim_best: "Best",
    sim_worst: "Worst",
    sim_detail_monthly: "Detail Mensuel",
    sim_month_col: "Mois",
    sim_status_col: "Statut",
    sim_mc_analysis: "ANALYSE MONTE CARLO",
    sim_mc_sims: "Monte Carlo - 200 simulations",
    sim_mc_survive: "Survie funded",
    sim_mc_profitable: "Profitable",
    sim_mc_distribution: "Distribution resultat net",
    sim_mc_dd_avg: "DD moyen sur runs passés :",
    sim_mc_fees: "Frais challenge :",
    sim_indicative: "Simulation indicative - Pas une garantie",
    sim_rr_impossible: "RR impossible ou > 20 - winrate trop bas pour ce ratio",
    sim_raise_wr: "Monte le winrate ou baisse l'objectif/jour.",
    mt_import_history: "IMPORT HISTORIQUE",
    mt_csv_text: "CSV / Texte",
    mt_backtest_html: "Backtest HTML",
    mt_csv_formats: "CSV, TXT, TSV, ou HTML",
    mt_no_file: "Aucun fichier",
    mt_trading_journal: "TRADING JOURNAL",
    mt_my_real_journal: "My real journal",
    mt_journal_desc: "Saisis tes journées de trading et ajoute tes captures MT4/MT5. Synchronisé avec l'accueil.",
    an_lever_reduce_risk: "Réduire le risque/trade",
    an_lever_improve_rr: "Améliorer le ratio R/R",
    an_lever_improve_wr: "Améliorer le winrate",
    an_probability: "Probabilité",
    an_time_estimated: "Temps estimé (ph.1)",
    an_max_losses: "Pertes max supportables",
    an_levers: "Leviers d'optimisation",
    an_positive_points: "Points positifs",
    an_wr_days: "WR jours",
    an_best_day: "Meilleur jour",
    an_worst_day: "Pire jour",
    an_win_streak: "Série gagnante max",
    an_loss_streak: "Série perdante max",
    an_run_or_enter: "Lance une simulation ou saisis des trades",
    prof_choose_avatar: "Choisir un avatar",
    prof_edit_avatar: "Modifier l'avatar",
    prof_display_mode: "MODE D'AFFICHAGE",
    prof_simple: "Simplifié",
    prof_advanced: "Avancé",
    prof_advanced_desc: "Affichage avancé : toutes les métriques, clustering, Kelly, statistiques.",
    prof_simple_desc: "Affichage simplifié : l'essentiel uniquement (DD, risque, projections).",
    prof_lang_fr: "Français",
    mt_rr_real: "RR réel",
    mt_pf_real: "PF réel",
    mt_avg_gain: "Moy. gain",
    mt_profit_phase1: "Profit Phase 1",
    mt_obj_phase1: "Objectif Phase 1",
    mt_profile_loaded: "Profil chargé",
    mt_config_restored: "Configuration restaurée",
    mt_sim_history: "Historique des simulations",
    mt_ready: "Prêt",
    mt_monthly: "Mensuel",
    mt_no_balance_dd: "Sans solde de départ réel, le drawdown ne peut pas être calculé — il est donc impossible de confirmer si le challenge est passé ou non.",
    login_cgu: "Conditions d'utilisation",
    login_and_our: " et notre ",
    sim_phase_passed: "PASSE",
    sim_phase_running: "EN COURS",
    sim_phase_failed: "ECHOUE",
    sim_phase_inprogress: "EN COURS",
    sim_exceeded: "DEPASSE",
    sim_account_closed: "compte ferme",
    sim_my_simulation: "TA SIMULATION EN COURS",
    sim_copy_report: "Copier le rapport",
    sim_dd_safe_pre: "Securise - le DD journalier",
    sim_dd_safe_mid: "est inatteignable en 1 jour avec ta config",
    sim_dd_safe_end: "max). Seule une accumulation sur",
    sim_dd_safe_end2: "+ jours perdants peut te sortir.",
    sim_dd_warn_pre: "Attention - avec",
    sim_dd_warn_mid: "trades à",
    sim_dd_warn_end: "tu peux déclencher le DD journalier en 1 seule journée. Réduis le risque/trade ou le nombre de trades.",
    sim_pending: "En attente",
    sim_balance: "Solde compte",
    sim_scaling: "Scaling",
    sim_final_split: "Split final",
    sim_funded_account: "Compte Funded",
    sim_funded_title: "Compte Funded",
    sim_active: "ACTIF",
    sim_closed: "FERME",
    sim_payouts_cashed: "Payouts encaissés",
    sim_winning_months: "Mois gagnants",
    sim_exp_trade: "Espérance / trade",
    sim_exp_day: "Espérance / jour",
    sim_pf_theo: "Profit Factor théo.",
    sim_dd_expected: "DD attendu (série)",
    sim_trades_day: "Trades/jour",
    sim_target_day: "Objectif/jour (%)",
    sim_split: "Split (%)",
    sim_funded_months: "Mois Funded",
    sim_weekend_7d: "Trading 7j/7 — 30 jours/mois simulés (crypto, indices 24/7)",
    sim_weekend_5d: "Lundi → Vendredi — 21 jours ouvrés/mois (forex 24/5)",
    tip_clustering: "Simule le réalisme psychologique : les pertes arrivent-elles en séries ?",
    tip_maxconsec: "Le pire enchaînement de pertes connu de ton EA ou ta stratégie.",
    tip_weekend: "La plupart des prop firms ferment le forex le weekend (marché fermé).",
    tip_tradingdays: "Configure les jours où ton EA trade réellement et les journées d'annonces.",
    tip_newsdays: "Nombre de jours/semaine où ton EA ne trade pas à cause des grosses annonces.",
    tip_tradesday: "Nombre de trades que tu passes par jour. 1 trade/jour = scalping tranquille. 5+ = actif.",
    tip_targetday: "Gain quotidien visé en % du capital. Ex : 0.3% sur 10 000$ = objectif 30$/jour.",
    tip_split: "% des profits que tu gardes sur le compte financé. Ex : 80% = pour 1000$ de profit, tu reçois 800$.",
    tip_fundedmonths: "Durée simulée sur le compte financé après avoir réussi le challenge.",
    ps_which_firm: "Quelle Prop Firm ?",
    ps_which_capital: "Quel capital ?",
    ps_your_profile: "Ton profil trader",
    ps_firm_desc: "Sélectionne la prop firm sur laquelle tu veux passer ton challenge.",
    ps_capital_desc: "Choisis le capital du challenge que tu veux simuler.",
    ps_profile_desc: "Dis-nous ton niveau pour adapter l'interface.",
    ps_beginner: "Débutant",
    ps_beginner_desc: "Je découvre les Prop Firms et les challenges",
    ps_experienced: "Expérimenté",
    ps_experienced_desc: "J'ai déjà tenté un ou plusieurs challenges",
    ps_professional: "Professionnel",
    ps_professional_desc: "Je trade activement et j'optimise mes performances",
    ps_start: "Commencer",
    ps_continue: "Continuer",
    ps_back: "Retour",
    ps_step_firm: "Prop Firm",
    ps_step_capital: "Capital",
    ps_step_profile: "Profil",
    sim_dd_reached: "DD atteint cette simulation",
    sim_zone_safe: "Zone safe",
    sim_max_loss_day: "Perte max 1 jour",
    sim_days_full_dd: "Jours full-perte DD total",
    sim_dd_breachable: "DD journalier franchissable",
    sim_margin_left: "Marge restante",
    sim_reading: "Lecture :",
    sim_account_active: "COMPTE ACTIF",
    sim_net_result: "Resultat net :",
    sim_dd_analysis: "ANALYSE DRAWDOWN - TA CONFIG",
    sim_limit: "LIMITE",
    sim_attention: "Attention",
    sim_danger: "Danger",
    sim_before_limit: "avant limite",
    sim_remaining: "restants",
    sim_max_loss_short: "perte max",
    sim_winrate_global: "WINRATE GLOBAL",
    sim_risk_trade: "Risque/trade",
    sim_max_loss_per_day: "Perte max/jour",
    sim_profit: "Profit",
    sim_wr_trades: "WR trades",
    sim_copied: "✓ Copié !",
    dash_hello: "Salut",
    dash_subtitle: "Prêt à simuler ton prochain challenge ?",
    dash_stats_appear: "Tes statistiques apparaîtront ici après la simulation.",
    dash_each_day: "Chaque jour est une étape de plus vers ta prochaine validation.",
    dash_start_sim: "Démarrer une simulation",
    an_quant_engine: "Moteur d'évaluation quantitative",
    an_local_optional: "Analyse locale + rapport expert optionnel · Données 100% confidentielles",
    an_score_success: "Score de réussite",
    an_score_coherence: "Score de cohérence",
    an_behavioral: "Métriques comportementales",
    an_improve_axes: "Axes d'amélioration",
    mt_real_vs_sim: "Réel vs Simulation",
    mt_equity_real_sim: "Courbe Equity — Réel vs Simulation",
    mt_wr_real: "WR réel",
    mt_firm_selected: "Prop Firm sélectionnée",
    login_terms: "En créant un compte, tu acceptes nos",
    login_privacy: "Politique de confidentialité.",
    an_center: "Centre d'Analyse",
    an_select: "Sélectionnez",
    an_your_analysis: "votre analyse",
    an_intro: "Chaque rapport est construit à partir de vos données réelles et fournit des recommandations spécifiques.",
    an_ready: "Prêt",
    an_sim_title: "Simulation Challenge",
    an_sim_sub: "Évaluation pré-challenge",
    an_sim_desc: "Évaluez vos paramètres de stratégie avant d'acheter un challenge prop firm.",
    an_sim_cta: "Analyser la simulation",
    an_journal_title: "Journal de Trading",
    an_journal_sub: "Analyse comportementale",
    an_journal_desc: "Analysez vos habitudes de trading réelles pour identifier vos patterns d'erreur et votre niveau de discipline.",
    an_journal_cta: "Analyser mon journal",
    an_bt_title: "Résultats Backtest",
    an_bt_sub: "Audit statistique",
    an_bt_desc: "Validez la robustesse statistique de votre stratégie à partir d'un historique de trades importé.",
    an_bt_cta: "Auditer le backtest",
    an_get_data: "Obtenir les données →",
    an_forces: "Points forts",
    an_risks: "Risques identifiés",
    an_expert: "Rapport Expert",
    an_advanced: "Analyse avancée",
    an_local: "Analyse locale",
    an_analyzing: "Analyse...",
    an_trades_analyzed: "Trades analysés",
    an_avg_gain: "Gain moyen",
    an_avg_loss: "Perte moyenne",
    an_real_rr: "Ratio R/R réel",
    an_robustness: "Score de robustesse",
    an_robust: "Robuste",
    an_acceptable: "Acceptable",
    an_fragile: "Fragile",
    an_unreliable: "Non fiable",
    an_incomplete: "Audit incomplet",
    an_stat_metrics: "Métriques statistiques",
    an_validity: "Analyse de validité",
    an_dd_missing: "DONNÉES DD MANQUANTES",
    mt_back_challenge: "Retour au Challenge",
    mt_validate: "Valider",
    mt_indep_validation: "Validation indépendante",
    mt_confidence: "Confiance",
    an_no_sim: "Aucune simulation trouvée.",
    an_run_sim: "Lancer une simulation",
    an_no_journal: "Aucun trade saisi dans le journal.",
    an_open_journal: "Ouvrir le journal",
    an_no_bt: "Aucun backtest importé.",
    an_import_bt: "Importer dans Mes Trades",
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
    coach_title: "Analyse",
    coach_subtitle: "Centre d'Évaluation Quantitative",
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
    dec_pf_strong: "Factor de beneficio sólido", dec_pf_ok: "Factor de beneficio correcto", dec_pf_weak: "PF demasiado débil", dec_pf_negative: "PF negativo — estrategia perdedora",
    dec_wr_rr_balanced: "Win rate y RR equilibrados", dec_wr_low: "Win rate demasiado bajo para este RR",
    dec_dd_unknown: "DD desconocido — no se puede validar", dec_dd_excellent: "Drawdown muy controlado", dec_dd_good: "Drawdown controlado",
    dec_dd_borderline: "DD cerca del límite", dec_dd_too_high: "DD demasiado alto",
    dec_sample_insufficient: "Muestra insuficiente", dec_sample_ok: "Muestra correcta", dec_sample_strong: "Muestra sólida",
    dec_mc_unavailable: "Monte Carlo no disponible", dec_mc_favorable: "Monte Carlo favorable", dec_mc_moderate: "Monte Carlo moderado",
    dec_mc_unfavorable: "Monte Carlo desfavorable",
    dec_launch: "Lanzar el desafío", dec_wait: "Esperar", dec_dont_launch: "No lances este desafío",

    day_sun: "Domingo", day_mon: "Lunes", day_tue: "Martes", day_wed: "Miércoles", day_thu: "Jueves", day_fri: "Viernes", day_sat: "Sábado",
    mt5_pf_strong: "Factor de beneficio sólido", mt5_wr_strong: "Win rate sólido", mt5_dd_controlled: "Drawdown controlado",
    mt5_rr_strong: "Ratio R/R favorable", mt5_symbol_strong: "Instrumento motor de rendimiento", mt5_of_gains: "de tus ganancias",
    mt5_pf_weak: "Factor de beneficio débil", mt5_dd_high: "Drawdown alto", mt5_revenge: "Revenge trading detectado",
    mt5_after_streak: "tras racha de pérdidas", mt5_overtrading: "Overtrading detectado", mt5_days_over8: "días con 8+ operaciones",
    mt5_underrisk: "Subutilización del riesgo", mt5_underrisk_detail: "riesgo medio < 0.3% del capital",
    mt5_bad_day: "Día de riesgo", mt5_of_losses: "de tus pérdidas", mt5_bad_hour: "Horario de riesgo", mt5_bad_symbol: "Instrumento de riesgo",
    mt5_reco_revenge: "Deja de operar tras 3 pérdidas consecutivas — toma un descanso de al menos 1h.",
    mt5_reco_overtrading: "Límitate a un número fijo de operaciones por día para evitar el overtrading.",
    mt5_reco_avoid_day: "Evita o reduce tu exposición el", mt5_reco_avoid_hour: "Evita operar alrededor de",
    mt5_reco_avoid_symbol: "Reevalúa tu estrategia en", mt5_reco_underrisk: "Aumenta ligeramente tu riesgo/operación para explotar tu ventaja estadística.",
    mt5_reco_streak: "Tu peor racha perdedora es de", mt5_reco_streak2: "operaciones — prevé una regla de parada antes de este umbral.",
    mt5_reco_keep_going: "No se detectó ningún patrón de riesgo — continúa así.",

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
    dec_title: "¿Puedo lanzar este desafío?",
    dec_subtitle: "Decisión basada en tu historial importado",
    dec_score_label: "Puntuación de decisión",
    dec_why: "Por qué este veredicto",
    dec_metrics: "Métricas clave",
    dec_import_first: "Importa un CSV de MT5 o un backtest para obtener tu decisión.",
    dec_pf_metric: "Factor de beneficio",
    dec_wr_metric: "Win rate",
    dec_rr_metric: "RR",
    dec_dd_metric: "Drawdown",
    dec_sample_metric: "Muestra",
    dec_mc_metric: "Monte Carlo",
    dec_trades_unit: "operaciones",
    mt5_title: "Análisis Conductual MT5",
    mt5_subtitle: "Análisis automático de tu historial",
    mt5_score_title: "Puntuación de Calidad del Trader",
    mt5_score_excellent: "Excelente",
    mt5_score_good: "Bueno",
    mt5_score_average: "Promedio",
    mt5_score_weak: "Débil",
    mt5_global_stats: "Estadísticas globales",
    mt5_winrate: "Win rate",
    mt5_pf: "Factor de beneficio",
    mt5_avg_rr: "RR medio",
    mt5_max_dd: "Drawdown máx",
    mt5_win_streak: "Racha ganadora máx",
    mt5_loss_streak: "Racha perdedora máx",
    mt5_time_analysis: "Horarios y días rentables",
    mt5_best_day: "Mejor día",
    mt5_worst_day: "Peor día",
    mt5_best_hour: "Mejor hora",
    mt5_worst_hour: "Peor hora",
    mt5_instrument_analysis: "Instrumentos rentables",
    mt5_best_instrument: "Mejor instrumento",
    mt5_worst_instrument: "Peor instrumento",
    mt5_forces: "Fortalezas",
    mt5_weaknesses: "Puntos débiles",
    mt5_recommendations: "Recomendaciones",
    mt5_no_time_data: "Datos horarios insuficientes en el archivo importado",
    mt5_no_symbol_data: "Datos de instrumento no disponibles en el archivo importado",
    mt5_trades_analyzed: "operaciones analizadas",
    guard_title: "Daily Loss Guardian",
    guard_subtitle: "Guardián en tiempo real",
    guard_zone_safe: "Zona segura",
    guard_zone_warning: "Zona de atención",
    guard_zone_danger: "Zona de peligro",
    guard_losses_left_daily: "pérdidas posibles antes del Daily DD",
    guard_losses_left_max: "pérdidas posibles antes del Max DD",
    guard_daily_consumed: "de tu Daily DD consumido",
    guard_max_consumed: "de tu Max DD consumido",
    guard_margin_left: "Margen restante",
    guard_min_capital: "Capital mínimo a proteger",
    guard_stop_recommended: "🛑 Se recomienda detener el trading",
    guard_stay_alert: "⚠️ Mantente alerta",
    guard_all_clear: "✅ Todo bien, continúa",
    guard_one_loss_left: "Queda 1 pérdida posible hoy.",
    guard_n_losses_left: "pérdidas posibles hoy.",
    guard_zero_left: "0 pérdidas restantes — límite alcanzado.",
    guard_based_on: "Basado en tu riesgo/operación actual y",
    guard_trades_day: "operaciones/día",
    guard_daily_limit: "Límite Daily DD",
    guard_total_limit: "Límite Max DD",
    guard_consumed: "Consumido",
    guard_capital_floor: "Piso de capital",
    guard_below_floor: "No bajes de este umbral hoy",
    sim_funded_need_challenge: "Lanza primero una simulación Challenge para acceder a la cuenta Funded.",
    sim_go_challenge: "Ir al Desafío",
    sim_challenge_not_validated: "El desafío no fue validado. Ajusta tus parámetros y relanza la simulación.",
    sim_funded_not_generated: "La cuenta Funded no pudo generarse. Relanza la simulación.",
    sim_back_challenge2: "Volver al Desafío",
    an_projection_challenge: "Proyección del Desafío",
    mt_csv_instr: "MT4: Historial → clic derecho → CSV",
    mt_csv_instr2: "MT5: Historial → Informe → CSV",
    mt_html_instr: "MT4/MT5: Probador → Informe → Abrir → Archivo HTML",
    mt_trades_loaded: "operaciones cargadas",
    mt_clear_data: "Borrar datos importados",
    sim_winrate_global2: "Win rate global",
    sim_loss_clustering: "Agrupación de pérdidas",
    sim_clustering_help: "0% = operaciones independientes (teórico). Cuanto más alto, más pérdidas llegan en",
    sim_black_series: "rachas negativas",
    sim_recommended: "Recomendado: 35-50%.",
    sim_max_consec: "Máx pérdidas consecutivas EA",
    sim_lot_instrument: "Lote e Instrumento",
    sim_enable: "Activar",
    sim_instrument: "Instrumento",
    sim_of_capital: "% del capital",
    sim_how_much_risk: "¿Cuánto arriesgas por operación?",
    sim_define_risk: "Define tu riesgo en % del capital. Todo lo demás se calcula automáticamente.",
    sim_capital_label: "Capital ($)",
    sim_risk_per_trade: "Riesgo por operación (%)",
    sim_target_obj: "Objetivo",
    sim_expected: "esperado",
    sim_new_sim: "Nueva simulación",
    sim_copy_report2: "Copiar informe",
    sim_print_pdf: "Imprimir / PDF",
    sim_real_results: "Los resultados reales pueden ser 5 a 15% inferiores debido al spread, slippage y condiciones del mercado.",
    sim_balance_net: "Balance Financiero Neto",
    sim_reward_challenge: "Recompensa desafío",
    sim_payouts_paid: "Payouts financiados pagados",
    sim_pending_unpaid: "Pendiente (no pagado)",
    sim_challenge_fees: "Costo de compra del desafío",
    sim_net_result_label: "RESULTADO NETO",
    sim_rules: "REGLAS",
    sim_phase1_obj: "Objetivo Fase 1",
    sim_phase2_obj: "Objetivo Fase 2",
    sim_daily_dd2: "DD Diario",
    sim_total_dd2: "DD Total",
    sim_time_limit: "Límite de tiempo",
    sim_none: "Ninguno",
    sim_min_days_phase: "Mín días/fase",
    sim_days_unit: "días",
    sim_first_payout: "1er payout",
    sim_after: "después",
    sim_split_funded: "Split Financiado",
    sim_ea_algo: "EA/Algo",
    sim_authorized: "Permitido",
    sim_save_config: "Guardar config",
    sim_calendar_pnl: "Calendario PnL",
    sim_month_dayday: "Mes {n} - simulación día a día",
    sim_pl_month: "P&L mes",
    sim_days_pm: "Días +/-",
    sim_best: "Mejor",
    sim_worst: "Peor",
    sim_detail_monthly: "Detalle Mensual",
    sim_month_col: "Mes",
    sim_status_col: "Estado",
    sim_mc_analysis: "ANÁLISIS MONTE CARLO",
    sim_mc_sims: "Monte Carlo - 200 simulaciones",
    sim_mc_survive: "Supervivencia funded",
    sim_mc_profitable: "Rentable",
    sim_mc_distribution: "Distribución resultado neto",
    sim_mc_dd_avg: "DD medio en runs pasados:",
    sim_mc_fees: "Costo desafío:",
    sim_indicative: "Simulación indicativa - No es una garantía",
    sim_rr_impossible: "RR imposible o > 20 - win rate demasiado bajo para este ratio",
    sim_raise_wr: "Sube el win rate o baja el objetivo/día.",
    mt_import_history: "IMPORTAR HISTORIAL",
    mt_csv_text: "CSV / Texto",
    mt_backtest_html: "Backtest HTML",
    mt_csv_formats: "CSV, TXT, TSV, o HTML",
    mt_no_file: "Ningún archivo",
    mt_trading_journal: "DIARIO DE TRADING",
    mt_my_real_journal: "Mi diario real",
    mt_journal_desc: "Registra tus días de trading y añade tus capturas MT4/MT5. Sincronizado con el inicio.",
    an_lever_reduce_risk: "Reducir riesgo/operación",
    an_lever_improve_rr: "Mejorar ratio R/R",
    an_lever_improve_wr: "Mejorar win rate",
    an_probability: "Probabilidad",
    an_time_estimated: "Tiempo estimado (f.1)",
    an_max_losses: "Pérdidas máx soportables",
    an_levers: "Palancas de optimización",
    an_positive_points: "Puntos positivos",
    an_wr_days: "WR días",
    an_best_day: "Mejor día",
    an_worst_day: "Peor día",
    an_win_streak: "Racha ganadora máx",
    an_loss_streak: "Racha perdedora máx",
    an_run_or_enter: "Lanza una simulación o registra operaciones",
    prof_choose_avatar: "Elegir un avatar",
    prof_edit_avatar: "Editar avatar",
    prof_display_mode: "MODO DE VISUALIZACIÓN",
    prof_simple: "Simple",
    prof_advanced: "Avanzado",
    prof_advanced_desc: "Visualización avanzada: todas las métricas, clustering, Kelly, estadísticas.",
    prof_simple_desc: "Visualización simple: solo lo esencial (DD, riesgo, proyecciones).",
    prof_lang_fr: "Francés",
    mt_rr_real: "RR real",
    mt_pf_real: "PF real",
    mt_avg_gain: "Ganancia med.",
    mt_profit_phase1: "Beneficio Fase 1",
    mt_obj_phase1: "Objetivo Fase 1",
    mt_profile_loaded: "Perfil cargado",
    mt_config_restored: "Configuración restaurada",
    mt_sim_history: "Historial de simulaciones",
    mt_ready: "Listo",
    mt_monthly: "Mensual",
    mt_no_balance_dd: "Sin un saldo inicial real, el drawdown no puede calcularse — por lo tanto es imposible confirmar si el desafío fue superado o no.",
    login_cgu: "Términos de uso",
    login_and_our: " y nuestra ",
    sim_phase_passed: "PASADO",
    sim_phase_running: "EN CURSO",
    sim_phase_failed: "FALLIDO",
    sim_phase_inprogress: "EN CURSO",
    sim_exceeded: "SUPERADO",
    sim_account_closed: "cuenta cerrada",
    sim_my_simulation: "TU SIMULACIÓN EN CURSO",
    sim_copy_report: "Copiar informe",
    sim_dd_safe_pre: "Seguro - el DD diario",
    sim_dd_safe_mid: "es inalcanzable en 1 día con tu config",
    sim_dd_safe_end: "máx). Solo una acumulación durante",
    sim_dd_safe_end2: "+ días perdedores podría sacarte.",
    sim_dd_warn_pre: "Atención - con",
    sim_dd_warn_mid: "operaciones al",
    sim_dd_warn_end: "puedes activar el DD diario en un solo día. Reduce el riesgo/operación o el número de operaciones.",
    sim_pending: "Pendiente",
    sim_balance: "Saldo cuenta",
    sim_scaling: "Scaling",
    sim_final_split: "Split final",
    sim_funded_account: "Cuenta Financiada",
    sim_funded_title: "Cuenta Financiada",
    sim_active: "ACTIVA",
    sim_closed: "CERRADA",
    sim_payouts_cashed: "Payouts cobrados",
    sim_winning_months: "Meses ganadores",
    sim_exp_trade: "Esperanza / operación",
    sim_exp_day: "Esperanza / día",
    sim_pf_theo: "Factor benef. teó.",
    sim_dd_expected: "DD esperado (racha)",
    sim_trades_day: "Operaciones/día",
    sim_target_day: "Objetivo/día (%)",
    sim_split: "Split (%)",
    sim_funded_months: "Meses Funded",
    sim_weekend_7d: "Trading 7d/7 — 30 días/mes simulados (cripto, índices 24/7)",
    sim_weekend_5d: "Lunes → Viernes — 21 días hábiles/mes (forex 24/5)",
    tip_clustering: "Simula el realismo psicológico: ¿las pérdidas llegan en rachas?",
    tip_maxconsec: "La peor racha de pérdidas conocida de tu EA o estrategia.",
    tip_weekend: "La mayoría de prop firms cierran el forex los fines de semana.",
    tip_tradingdays: "Configura los días que tu EA opera realmente y los días de noticias.",
    tip_newsdays: "Número de días/semana que tu EA no opera por grandes noticias.",
    tip_tradesday: "Número de operaciones por día. 1 op/día = scalping tranquilo. 5+ = activo.",
    tip_targetday: "Ganancia diaria objetivo en % del capital. Ej: 0.3% sobre $10,000 = $30/día.",
    tip_split: "% de beneficios que mantienes en la cuenta financiada. Ej: 80% = por $1000, recibes $800.",
    tip_fundedmonths: "Duración simulada en la cuenta financiada tras pasar el desafío.",
    ps_which_firm: "¿Qué Prop Firm?",
    ps_which_capital: "¿Qué capital?",
    ps_your_profile: "Tu perfil de trader",
    ps_firm_desc: "Selecciona la prop firm donde quieres hacer tu desafío.",
    ps_capital_desc: "Elige el capital del desafío que quieres simular.",
    ps_profile_desc: "Dinos tu nivel para adaptar la interfaz.",
    ps_beginner: "Principiante",
    ps_beginner_desc: "Estoy descubriendo las Prop Firms y los desafíos",
    ps_experienced: "Experimentado",
    ps_experienced_desc: "Ya he intentado uno o varios desafíos",
    ps_professional: "Profesional",
    ps_professional_desc: "Opero activamente y optimizo mi rendimiento",
    ps_start: "Empezar",
    ps_continue: "Continuar",
    ps_back: "Volver",
    ps_step_firm: "Prop Firm",
    ps_step_capital: "Capital",
    ps_step_profile: "Perfil",
    sim_dd_reached: "DD alcanzado esta simulación",
    sim_zone_safe: "Zona segura",
    sim_max_loss_day: "Pérdida máx 1 día",
    sim_days_full_dd: "Días pérdida-total DD",
    sim_dd_breachable: "DD diario alcanzable",
    sim_margin_left: "Margen restante",
    sim_reading: "Lectura:",
    sim_account_active: "CUENTA ACTIVA",
    sim_net_result: "Resultado neto:",
    sim_dd_analysis: "ANÁLISIS DRAWDOWN - TU CONFIG",
    sim_limit: "LÍMITE",
    sim_attention: "Atención",
    sim_danger: "Peligro",
    sim_before_limit: "antes del límite",
    sim_remaining: "restantes",
    sim_max_loss_short: "pérdida máx",
    sim_winrate_global: "WIN RATE GLOBAL",
    sim_risk_trade: "Riesgo/operación",
    sim_max_loss_per_day: "Pérdida máx/día",
    sim_profit: "Beneficio",
    sim_wr_trades: "WR operaciones",
    sim_copied: "✓ ¡Copiado!",
    dash_hello: "Hola",
    dash_subtitle: "¿Listo para simular tu próximo desafío?",
    dash_stats_appear: "Tus estadísticas aparecerán aquí tras la simulación.",
    dash_each_day: "Cada día es un paso más hacia tu próxima validación.",
    dash_start_sim: "Iniciar una simulación",
    an_quant_engine: "Motor de evaluación cuantitativa",
    an_local_optional: "Análisis local + informe experto opcional · Datos 100% confidenciales",
    an_score_success: "Puntuación de éxito",
    an_score_coherence: "Puntuación de coherencia",
    an_behavioral: "Métricas de comportamiento",
    an_improve_axes: "Áreas de mejora",
    mt_real_vs_sim: "Real vs Simulación",
    mt_equity_real_sim: "Curva de Equity — Real vs Simulación",
    mt_wr_real: "WR real",
    mt_firm_selected: "Prop Firm seleccionada",
    login_terms: "Al crear una cuenta, aceptas nuestra",
    login_privacy: "Política de privacidad.",
    an_center: "Centro de Análisis",
    an_select: "Seleccione",
    an_your_analysis: "su análisis",
    an_intro: "Cada informe se construye a partir de sus datos reales y ofrece recomendaciones específicas.",
    an_ready: "Listo",
    an_sim_title: "Simulación de Desafío",
    an_sim_sub: "Evaluación pre-desafío",
    an_sim_desc: "Evalúe los parámetros de su estrategia antes de comprar un desafío de prop firm.",
    an_sim_cta: "Analizar la simulación",
    an_journal_title: "Diario de Trading",
    an_journal_sub: "Análisis de comportamiento",
    an_journal_desc: "Analice sus hábitos de trading reales para identificar sus patrones de error y nivel de disciplina.",
    an_journal_cta: "Analizar mi diario",
    an_bt_title: "Resultados Backtest",
    an_bt_sub: "Auditoría estadística",
    an_bt_desc: "Valide la robustez estadística de su estrategia a partir de un historial de operaciones importado.",
    an_bt_cta: "Auditar el backtest",
    an_get_data: "Obtener datos →",
    an_forces: "Puntos fuertes",
    an_risks: "Riesgos identificados",
    an_expert: "Informe Experto",
    an_advanced: "Análisis avanzado",
    an_local: "Análisis local",
    an_analyzing: "Analizando...",
    an_trades_analyzed: "Operaciones analizadas",
    an_avg_gain: "Ganancia media",
    an_avg_loss: "Pérdida media",
    an_real_rr: "Ratio R/R real",
    an_robustness: "Puntuación de robustez",
    an_robust: "Robusto",
    an_acceptable: "Aceptable",
    an_fragile: "Frágil",
    an_unreliable: "No fiable",
    an_incomplete: "Auditoría incompleta",
    an_stat_metrics: "Métricas estadísticas",
    an_validity: "Análisis de validez",
    an_dd_missing: "DATOS DD FALTANTES",
    mt_back_challenge: "Volver al Desafío",
    mt_validate: "Validar",
    mt_indep_validation: "Validación independiente",
    mt_confidence: "Confianza",
    an_no_sim: "No se encontró ninguna simulación.",
    an_run_sim: "Lanzar una simulación",
    an_no_journal: "No hay operaciones en el diario.",
    an_open_journal: "Abrir el diario",
    an_no_bt: "No hay backtest importado.",
    an_import_bt: "Importar en Mis Operaciones",
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
    coach_title: "Análisis",
    coach_subtitle: "Centro de Evaluación Cuantitativa",
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
    dec_pf_strong: "Solid Profit Factor", dec_pf_ok: "Decent Profit Factor", dec_pf_weak: "PF too weak", dec_pf_negative: "Negative PF — losing strategy",
    dec_wr_rr_balanced: "Balanced win rate and RR", dec_wr_low: "Win rate too low for this RR",
    dec_dd_unknown: "Unknown DD — cannot validate", dec_dd_excellent: "Very controlled drawdown", dec_dd_good: "Controlled drawdown",
    dec_dd_borderline: "DD close to the limit", dec_dd_too_high: "DD too high",
    dec_sample_insufficient: "Insufficient sample", dec_sample_ok: "Decent sample", dec_sample_strong: "Strong sample",
    dec_mc_unavailable: "Monte Carlo unavailable", dec_mc_favorable: "Favorable Monte Carlo", dec_mc_moderate: "Moderate Monte Carlo",
    dec_mc_unfavorable: "Unfavorable Monte Carlo",
    dec_launch: "Launch the challenge", dec_wait: "Wait", dec_dont_launch: "Don't launch this challenge",

    day_sun: "Sunday", day_mon: "Monday", day_tue: "Tuesday", day_wed: "Wednesday", day_thu: "Thursday", day_fri: "Friday", day_sat: "Saturday",
    mt5_pf_strong: "Solid Profit Factor", mt5_wr_strong: "Solid win rate", mt5_dd_controlled: "Controlled drawdown",
    mt5_rr_strong: "Favorable R/R ratio", mt5_symbol_strong: "Performance-driving instrument", mt5_of_gains: "of your gains",
    mt5_pf_weak: "Weak Profit Factor", mt5_dd_high: "High drawdown", mt5_revenge: "Revenge trading detected",
    mt5_after_streak: "after losing streak", mt5_overtrading: "Overtrading detected", mt5_days_over8: "days with 8+ trades",
    mt5_underrisk: "Risk underutilization", mt5_underrisk_detail: "avg risk < 0.3% of capital",
    mt5_bad_day: "Risky day", mt5_of_losses: "of your losses", mt5_bad_hour: "Risky hour", mt5_bad_symbol: "Risky instrument",
    mt5_reco_revenge: "Stop trading after 3 consecutive losses — take a break of at least 1h.",
    mt5_reco_overtrading: "Limit yourself to a fixed number of trades per day to avoid overtrading.",
    mt5_reco_avoid_day: "Avoid or reduce exposure on", mt5_reco_avoid_hour: "Avoid trading around",
    mt5_reco_avoid_symbol: "Re-evaluate your strategy on", mt5_reco_underrisk: "Slightly increase your risk/trade to exploit your statistical edge.",
    mt5_reco_streak: "Your worst losing streak is", mt5_reco_streak2: "trades — plan a stop rule before this threshold.",
    mt5_reco_keep_going: "No risky pattern detected — keep going this way.",

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
    dec_title: "Can I launch this challenge?",
    dec_subtitle: "Decision based on your imported history",
    dec_score_label: "Decision score",
    dec_why: "Why this verdict",
    dec_metrics: "Key metrics",
    dec_import_first: "Import an MT5 CSV or a backtest to get your decision.",
    dec_pf_metric: "Profit Factor",
    dec_wr_metric: "Win rate",
    dec_rr_metric: "RR",
    dec_dd_metric: "Drawdown",
    dec_sample_metric: "Sample",
    dec_mc_metric: "Monte Carlo",
    dec_trades_unit: "trades",
    mt5_title: "MT5 Behavioral Analysis",
    mt5_subtitle: "Automatic analysis of your trading history",
    mt5_score_title: "Trader Quality Score",
    mt5_score_excellent: "Excellent",
    mt5_score_good: "Good",
    mt5_score_average: "Average",
    mt5_score_weak: "Weak",
    mt5_global_stats: "Global statistics",
    mt5_winrate: "Win rate",
    mt5_pf: "Profit Factor",
    mt5_avg_rr: "Avg R/R",
    mt5_max_dd: "Max drawdown",
    mt5_win_streak: "Max winning streak",
    mt5_loss_streak: "Max losing streak",
    mt5_time_analysis: "Profitable hours & days",
    mt5_best_day: "Best day",
    mt5_worst_day: "Worst day",
    mt5_best_hour: "Best hour",
    mt5_worst_hour: "Worst hour",
    mt5_instrument_analysis: "Profitable instruments",
    mt5_best_instrument: "Best instrument",
    mt5_worst_instrument: "Worst instrument",
    mt5_forces: "Strengths",
    mt5_weaknesses: "Weaknesses",
    mt5_recommendations: "Recommendations",
    mt5_no_time_data: "Insufficient time data in the imported file",
    mt5_no_symbol_data: "Instrument data not available in the imported file",
    mt5_trades_analyzed: "trades analyzed",
    guard_title: "Daily Loss Guardian",
    guard_subtitle: "Real-time safety guard",
    guard_zone_safe: "Safety zone",
    guard_zone_warning: "Warning zone",
    guard_zone_danger: "Danger zone",
    guard_losses_left_daily: "losses possible before Daily DD",
    guard_losses_left_max: "losses possible before Max DD",
    guard_daily_consumed: "of your Daily DD consumed",
    guard_max_consumed: "of your Max DD consumed",
    guard_margin_left: "Margin remaining",
    guard_min_capital: "Minimum capital to protect",
    guard_stop_recommended: "🛑 Stop trading recommended",
    guard_stay_alert: "⚠️ Stay alert",
    guard_all_clear: "✅ All good, keep going",
    guard_one_loss_left: "1 more loss possible today.",
    guard_n_losses_left: "losses possible today.",
    guard_zero_left: "0 losses left — limit reached.",
    guard_based_on: "Based on your current risk/trade and",
    guard_trades_day: "trades/day",
    guard_daily_limit: "Daily DD Limit",
    guard_total_limit: "Max DD Limit",
    guard_consumed: "Consumed",
    guard_capital_floor: "Capital floor",
    guard_below_floor: "Don't go below this threshold today",
    sim_funded_need_challenge: "Run a Challenge simulation first to access the Funded account.",
    sim_go_challenge: "Go to Challenge",
    sim_challenge_not_validated: "The challenge was not validated. Adjust your parameters and rerun the simulation.",
    sim_funded_not_generated: "The Funded account could not be generated. Rerun the simulation.",
    sim_back_challenge2: "Back to Challenge",
    an_projection_challenge: "Challenge Projection",
    mt_csv_instr: "MT4: History → right-click → CSV",
    mt_csv_instr2: "MT5: History → Report → CSV",
    mt_html_instr: "MT4/MT5: Tester → Report → Open → HTML file",
    mt_trades_loaded: "trades loaded",
    mt_clear_data: "Clear imported data",
    sim_winrate_global2: "Global win rate",
    sim_loss_clustering: "Loss Clustering",
    sim_clustering_help: "0% = independent trades (theoretical). The higher it is, the more losses come in",
    sim_black_series: "losing streaks",
    sim_recommended: "Recommended: 35-50%.",
    sim_max_consec: "Max consecutive EA losses",
    sim_lot_instrument: "Lot & Instrument",
    sim_enable: "Enable",
    sim_instrument: "Instrument",
    sim_of_capital: "% of capital",
    sim_how_much_risk: "How much do you risk per trade?",
    sim_define_risk: "Set your risk as % of capital. Everything else follows automatically.",
    sim_capital_label: "Capital ($)",
    sim_risk_per_trade: "Risk per trade (%)",
    sim_target_obj: "Target",
    sim_expected: "expected",
    sim_new_sim: "New simulation",
    sim_copy_report2: "Copy report",
    sim_print_pdf: "Print / PDF",
    sim_real_results: "Real results may be 5 to 15% lower due to spread, slippage and market conditions.",
    sim_balance_net: "Net Financial Summary",
    sim_reward_challenge: "Challenge reward",
    sim_payouts_paid: "Funded payouts paid",
    sim_pending_unpaid: "Pending (unpaid)",
    sim_challenge_fees: "Challenge purchase fees",
    sim_net_result_label: "NET RESULT",
    sim_rules: "RULES",
    sim_phase1_obj: "Phase 1 target",
    sim_phase2_obj: "Phase 2 target",
    sim_daily_dd2: "Daily DD",
    sim_total_dd2: "Total DD",
    sim_time_limit: "Time limit",
    sim_none: "None",
    sim_min_days_phase: "Min days/phase",
    sim_days_unit: "days",
    sim_first_payout: "1st payout",
    sim_after: "after",
    sim_split_funded: "Funded Split",
    sim_ea_algo: "EA/Algo",
    sim_authorized: "Allowed",
    sim_save_config: "Save this config",
    sim_calendar_pnl: "PnL Calendar",
    sim_month_dayday: "Month {n} - day-by-day simulation",
    sim_pl_month: "P&L month",
    sim_days_pm: "Days +/-",
    sim_best: "Best",
    sim_worst: "Worst",
    sim_detail_monthly: "Monthly Detail",
    sim_month_col: "Month",
    sim_status_col: "Status",
    sim_mc_analysis: "MONTE CARLO ANALYSIS",
    sim_mc_sims: "Monte Carlo - 200 simulations",
    sim_mc_survive: "Funded survival",
    sim_mc_profitable: "Profitable",
    sim_mc_distribution: "Net result distribution",
    sim_mc_dd_avg: "Avg DD on passed runs:",
    sim_mc_fees: "Challenge fees:",
    sim_indicative: "Indicative simulation - Not a guarantee",
    sim_rr_impossible: "RR impossible or > 20 - win rate too low for this ratio",
    sim_raise_wr: "Raise the win rate or lower the target/day.",
    mt_import_history: "IMPORT HISTORY",
    mt_csv_text: "CSV / Text",
    mt_backtest_html: "Backtest HTML",
    mt_csv_formats: "CSV, TXT, TSV, or HTML",
    mt_no_file: "No file",
    mt_trading_journal: "TRADING JOURNAL",
    mt_my_real_journal: "My real journal",
    mt_journal_desc: "Enter your trading days and add your MT4/MT5 screenshots. Synced with home.",
    an_lever_reduce_risk: "Reduce risk/trade",
    an_lever_improve_rr: "Improve R/R ratio",
    an_lever_improve_wr: "Improve win rate",
    an_probability: "Probability",
    an_time_estimated: "Estimated time (ph.1)",
    an_max_losses: "Max bearable losses",
    an_levers: "Optimization levers",
    an_positive_points: "Positive points",
    an_wr_days: "WR days",
    an_best_day: "Best day",
    an_worst_day: "Worst day",
    an_win_streak: "Max winning streak",
    an_loss_streak: "Max losing streak",
    an_run_or_enter: "Run a simulation or enter trades",
    prof_choose_avatar: "Choose an avatar",
    prof_edit_avatar: "Edit avatar",
    prof_display_mode: "DISPLAY MODE",
    prof_simple: "Simple",
    prof_advanced: "Advanced",
    prof_advanced_desc: "Advanced display: all metrics, clustering, Kelly, statistics.",
    prof_simple_desc: "Simple display: essentials only (DD, risk, projections).",
    prof_lang_fr: "French",
    mt_rr_real: "Real RR",
    mt_pf_real: "Real PF",
    mt_avg_gain: "Avg gain",
    mt_profit_phase1: "Phase 1 Profit",
    mt_obj_phase1: "Phase 1 Target",
    mt_profile_loaded: "Profile loaded",
    mt_config_restored: "Configuration restored",
    mt_sim_history: "Simulation history",
    mt_ready: "Ready",
    mt_monthly: "Monthly",
    mt_no_balance_dd: "Without a real starting balance, the drawdown cannot be calculated — it is therefore impossible to confirm whether the challenge was passed or not.",
    login_cgu: "Terms of Use",
    login_and_our: " and our ",
    sim_phase_passed: "PASSED",
    sim_phase_running: "RUNNING",
    sim_phase_failed: "FAILED",
    sim_phase_inprogress: "RUNNING",
    sim_exceeded: "EXCEEDED",
    sim_account_closed: "account closed",
    sim_my_simulation: "YOUR RUNNING SIMULATION",
    sim_copy_report: "Copy report",
    sim_dd_safe_pre: "Safe - the daily DD",
    sim_dd_safe_mid: "is unreachable in 1 day with your config",
    sim_dd_safe_end: "max). Only an accumulation over",
    sim_dd_safe_end2: "+ losing days could break you out.",
    sim_dd_warn_pre: "Warning - with",
    sim_dd_warn_mid: "trades at",
    sim_dd_warn_end: "you can trigger the daily DD in a single day. Reduce risk/trade or the number of trades.",
    sim_pending: "Pending",
    sim_balance: "Account balance",
    sim_scaling: "Scaling",
    sim_final_split: "Final split",
    sim_funded_account: "Funded Account",
    sim_funded_title: "Funded Account",
    sim_active: "ACTIVE",
    sim_closed: "CLOSED",
    sim_payouts_cashed: "Payouts cashed",
    sim_winning_months: "Winning months",
    sim_exp_trade: "Expectancy / trade",
    sim_exp_day: "Expectancy / day",
    sim_pf_theo: "Theo. Profit Factor",
    sim_dd_expected: "Expected DD (streak)",
    sim_trades_day: "Trades/day",
    sim_target_day: "Target/day (%)",
    sim_split: "Split (%)",
    sim_funded_months: "Funded Months",
    sim_weekend_7d: "Trading 7d/7 — 30 days/month simulated (crypto, indices 24/7)",
    sim_weekend_5d: "Monday → Friday — 21 trading days/month (forex 24/5)",
    tip_clustering: "Simulates psychological realism: do losses come in streaks?",
    tip_maxconsec: "The worst losing streak known from your EA or strategy.",
    tip_weekend: "Most prop firms close forex on weekends (market closed).",
    tip_tradingdays: "Configure the days your EA actually trades and news days.",
    tip_newsdays: "Number of days/week your EA doesn't trade due to major news.",
    tip_tradesday: "Number of trades you take per day. 1 trade/day = quiet scalping. 5+ = active.",
    tip_targetday: "Daily gain target in % of capital. E.g.: 0.3% on $10,000 = $30/day target.",
    tip_split: "% of profits you keep on the funded account. E.g.: 80% = for $1000 profit, you get $800.",
    tip_fundedmonths: "Simulated duration on the funded account after passing the challenge.",
    ps_which_firm: "Which Prop Firm?",
    ps_which_capital: "Which capital?",
    ps_your_profile: "Your trader profile",
    ps_firm_desc: "Select the prop firm where you want to take your challenge.",
    ps_capital_desc: "Choose the capital of the challenge you want to simulate.",
    ps_profile_desc: "Tell us your level to adapt the interface.",
    ps_beginner: "Beginner",
    ps_beginner_desc: "I'm discovering Prop Firms and challenges",
    ps_experienced: "Experienced",
    ps_experienced_desc: "I've already attempted one or more challenges",
    ps_professional: "Professional",
    ps_professional_desc: "I trade actively and optimize my performance",
    ps_start: "Start",
    ps_continue: "Continue",
    ps_back: "Back",
    ps_step_firm: "Prop Firm",
    ps_step_capital: "Capital",
    ps_step_profile: "Profile",
    sim_dd_reached: "DD reached this simulation",
    sim_zone_safe: "Safe zone",
    sim_max_loss_day: "Max loss 1 day",
    sim_days_full_dd: "Days full-loss total DD",
    sim_dd_breachable: "Daily DD breachable",
    sim_margin_left: "Margin left",
    sim_reading: "Reading:",
    sim_account_active: "ACTIVE ACCOUNT",
    sim_net_result: "Net result:",
    sim_dd_analysis: "DRAWDOWN ANALYSIS - YOUR CONFIG",
    sim_limit: "LIMIT",
    sim_attention: "Warning",
    sim_danger: "Danger",
    sim_before_limit: "before limit",
    sim_remaining: "remaining",
    sim_max_loss_short: "max loss",
    sim_winrate_global: "GLOBAL WIN RATE",
    sim_risk_trade: "Risk/trade",
    sim_max_loss_per_day: "Max loss/day",
    sim_profit: "Profit",
    sim_wr_trades: "WR trades",
    sim_copied: "✓ Copied!",
    dash_hello: "Hello",
    dash_subtitle: "Ready to simulate your next challenge?",
    dash_stats_appear: "Your stats will appear here after the simulation.",
    dash_each_day: "Every day is a step closer to your next validation.",
    dash_start_sim: "Start a simulation",
    an_quant_engine: "Quantitative evaluation engine",
    an_local_optional: "Local analysis + optional expert report · 100% confidential data",
    an_score_success: "Success score",
    an_score_coherence: "Consistency score",
    an_behavioral: "Behavioral metrics",
    an_improve_axes: "Areas for improvement",
    mt_real_vs_sim: "Real vs Simulation",
    mt_equity_real_sim: "Equity Curve — Real vs Simulation",
    mt_wr_real: "Real WR",
    mt_firm_selected: "Selected Prop Firm",
    login_terms: "By creating an account, you accept our",
    login_privacy: "Privacy Policy.",
    an_center: "Analysis Center",
    an_select: "Select",
    an_your_analysis: "your analysis",
    an_intro: "Each report is built from your real data and provides specific recommendations.",
    an_ready: "Ready",
    an_sim_title: "Challenge Simulation",
    an_sim_sub: "Pre-challenge assessment",
    an_sim_desc: "Assess your strategy parameters before investing in a prop firm challenge.",
    an_sim_cta: "Analyse simulation",
    an_journal_title: "Trading Journal",
    an_journal_sub: "Behavioral analysis",
    an_journal_desc: "Analyse your real trading habits to identify your error patterns and discipline level.",
    an_journal_cta: "Analyse my journal",
    an_bt_title: "Backtest Results",
    an_bt_sub: "Statistical audit",
    an_bt_desc: "Validate the statistical robustness of your strategy from an imported trade history.",
    an_bt_cta: "Audit the backtest",
    an_get_data: "Get data →",
    an_forces: "Strengths",
    an_risks: "Identified risks",
    an_expert: "Expert Report",
    an_advanced: "Advanced analysis",
    an_local: "Local analysis",
    an_analyzing: "Analyzing...",
    an_trades_analyzed: "Trades analyzed",
    an_avg_gain: "Average gain",
    an_avg_loss: "Average loss",
    an_real_rr: "Real R/R ratio",
    an_robustness: "Robustness score",
    an_robust: "Robust",
    an_acceptable: "Acceptable",
    an_fragile: "Fragile",
    an_unreliable: "Unreliable",
    an_incomplete: "Incomplete audit",
    an_stat_metrics: "Statistical metrics",
    an_validity: "Validity analysis",
    an_dd_missing: "MISSING DD DATA",
    mt_back_challenge: "Back to Challenge",
    mt_validate: "Validate",
    mt_indep_validation: "Independent validation",
    mt_confidence: "Confidence",
    an_no_sim: "No simulation found.",
    an_run_sim: "Run a simulation",
    an_no_journal: "No trades entered in the journal.",
    an_open_journal: "Open the journal",
    an_no_bt: "No backtest imported.",
    an_import_bt: "Import in My Trades",
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
    coach_title: "Analysis",
    coach_subtitle: "Quantitative Evaluation Center",
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
    color: "#e05252",
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

// ══════════════════════════════════════════════════════════════════
// CENTRE D'ANALYSE — Moteur d'évaluation quantitative
// 3 modes : Simulation Challenge | Journal | Backtest
// ══════════════════════════════════════════════════════════════════

// ── Helper de traduction pour les moteurs d'analyse ──
const AL_DICT = {
  fr: {
    lever_reduce_risk: "Réduire le risque/trade",    lever_improve_rr: "Améliorer le ratio R/R",    lever_improve_wr: "Améliorer le winrate",
    // Forces
    dd_unknown: "DD inconnu", dd_uncalc: "Drawdown non calculé — audit incomplet",
    pf_exceptional: "Profit Factor exceptionnel", pf_excellent: "Profit Factor excellent",
    pf_solid: "Profit Factor solide", pf_strategy_perf: "stratégie très performante",
    pf_gains_over: "gains supérieurs aux pertes", pf_structurally: "stratégie structurellement rentable",
    exp_high: "Espérance élevée", exp_positive: "Espérance positive",
    exp_edge: "edge statistique fort", exp_profitable: "stratégie rentable en moyenne",
    dd_controlled: "Drawdown très maîtrisé", dd_wellcontrolled: "Drawdown bien maîtrisé",
    dd_oflimit: "de la limite", dd_safety_margin: "bonne marge de sécurité",
    wr_robust: "Winrate robuste", wr_reliability: "fiabilité élevée",
    rr_excellent: "Ratio R/R excellent", rr_good: "Bon ratio R/R",
    rr_gains_over: "gains supérieurs aux pertes unitaires", rr_favorable: "rapport gain/risque favorable",
    sample_excellent: "Excellent échantillon", sample_good: "Bon échantillon",
    sample_veryreliable: "statistiquement très fiable", sample_usable: "base statistique exploitable",
    // Risques
    dd_absent: "DD ABSENT", dd_cantvalidate: "Impossible de valider le respect des limites de risque",
    sample_critical: "Échantillon critique", sample_insufficient: "Échantillon insuffisant",
    sample_min: "min. 50 recommandés", sample_bias: "risque de biais",
    dd_critical: "Drawdown critique", dd_nearlimit: "Drawdown proche limite", dd_watch: "Drawdown à surveiller",
    dd_imminent: "élimination imminente", dd_max: "max",
    risk_excessive: "Risque/trade excessif", risk_high: "Risque/trade élevé",
    risk_in4: "DD en 4 pertes", risk_reduce: "réduire à 0.75-1%",
    rr_insufficient: "Ratio R/R insuffisant", rr_toolow: "trop faible",
    overopt_risk: "Risque sur-optimisation", overopt_bias: "biais potentiel",
    exp_negative: "Espérance négative", exp_losing: "stratégie structurellement perdante",
    // Projection
    risk_low: "Faible", risk_moderate: "Modéré", risk_elevated: "Élevé", risk_critical2: "Critique",
    risk_unknown: "INCONNU",
    per_trade: "/ trade",
  },
  en: {
    lever_reduce_risk: "Reduce risk/trade",    lever_improve_rr: "Improve R/R ratio",    lever_improve_wr: "Improve win rate",
    dd_unknown: "Unknown DD", dd_uncalc: "Drawdown not calculated — incomplete audit",
    pf_exceptional: "Exceptional Profit Factor", pf_excellent: "Excellent Profit Factor",
    pf_solid: "Solid Profit Factor", pf_strategy_perf: "very high-performing strategy",
    pf_gains_over: "gains exceed losses", pf_structurally: "structurally profitable strategy",
    exp_high: "High expectancy", exp_positive: "Positive expectancy",
    exp_edge: "strong statistical edge", exp_profitable: "profitable strategy on average",
    dd_controlled: "Very controlled drawdown", dd_wellcontrolled: "Well-controlled drawdown",
    dd_oflimit: "of the limit", dd_safety_margin: "good safety margin",
    wr_robust: "Robust win rate", wr_reliability: "high reliability",
    rr_excellent: "Excellent R/R ratio", rr_good: "Good R/R ratio",
    rr_gains_over: "gains exceed unit losses", rr_favorable: "favorable gain/risk ratio",
    sample_excellent: "Excellent sample", sample_good: "Good sample",
    sample_veryreliable: "statistically very reliable", sample_usable: "usable statistical base",
    dd_absent: "DD ABSENT", dd_cantvalidate: "Cannot validate risk limit compliance",
    sample_critical: "Critical sample", sample_insufficient: "Insufficient sample",
    sample_min: "min. 50 recommended", sample_bias: "bias risk",
    dd_critical: "Critical drawdown", dd_nearlimit: "Drawdown near limit", dd_watch: "Drawdown to watch",
    dd_imminent: "imminent elimination", dd_max: "max",
    risk_excessive: "Excessive risk/trade", risk_high: "High risk/trade",
    risk_in4: "DD in 4 losses", risk_reduce: "reduce to 0.75-1%",
    rr_insufficient: "Insufficient R/R ratio", rr_toolow: "too low",
    overopt_risk: "Over-optimization risk", overopt_bias: "potential bias",
    exp_negative: "Negative expectancy", exp_losing: "structurally losing strategy",
    risk_low: "Low", risk_moderate: "Moderate", risk_elevated: "High", risk_critical2: "Critical",
    risk_unknown: "UNKNOWN",
    per_trade: "/ trade",
  },
  es: {
    lever_reduce_risk: "Reducir riesgo/operación",    lever_improve_rr: "Mejorar ratio R/R",    lever_improve_wr: "Mejorar win rate",
    dd_unknown: "DD desconocido", dd_uncalc: "Drawdown no calculado — auditoría incompleta",
    pf_exceptional: "Factor de beneficio excepcional", pf_excellent: "Factor de beneficio excelente",
    pf_solid: "Factor de beneficio sólido", pf_strategy_perf: "estrategia muy eficiente",
    pf_gains_over: "ganancias superiores a pérdidas", pf_structurally: "estrategia estructuralmente rentable",
    exp_high: "Esperanza alta", exp_positive: "Esperanza positiva",
    exp_edge: "ventaja estadística fuerte", exp_profitable: "estrategia rentable en promedio",
    dd_controlled: "Drawdown muy controlado", dd_wellcontrolled: "Drawdown bien controlado",
    dd_oflimit: "del límite", dd_safety_margin: "buen margen de seguridad",
    wr_robust: "Tasa de aciertos robusta", wr_reliability: "alta fiabilidad",
    rr_excellent: "Ratio R/R excelente", rr_good: "Buen ratio R/R",
    rr_gains_over: "ganancias superiores a pérdidas unitarias", rr_favorable: "relación ganancia/riesgo favorable",
    sample_excellent: "Muestra excelente", sample_good: "Buena muestra",
    sample_veryreliable: "estadísticamente muy fiable", sample_usable: "base estadística utilizable",
    dd_absent: "DD AUSENTE", dd_cantvalidate: "Imposible validar el cumplimiento de los límites de riesgo",
    sample_critical: "Muestra crítica", sample_insufficient: "Muestra insuficiente",
    sample_min: "mín. 50 recomendados", sample_bias: "riesgo de sesgo",
    dd_critical: "Drawdown crítico", dd_nearlimit: "Drawdown cerca del límite", dd_watch: "Drawdown a vigilar",
    dd_imminent: "eliminación inminente", dd_max: "máx",
    risk_excessive: "Riesgo/operación excesivo", risk_high: "Riesgo/operación alto",
    risk_in4: "DD en 4 pérdidas", risk_reduce: "reducir a 0.75-1%",
    rr_insufficient: "Ratio R/R insuficiente", rr_toolow: "demasiado bajo",
    overopt_risk: "Riesgo de sobreoptimización", overopt_bias: "sesgo potencial",
    exp_negative: "Esperanza negativa", exp_losing: "estrategia estructuralmente perdedora",
    risk_low: "Bajo", risk_moderate: "Moderado", risk_elevated: "Alto", risk_critical2: "Crítico",
    risk_unknown: "DESCONOCIDO",
    per_trade: "/ operación",
  },
};
let AL_LANG = "fr";
function setALLang(l) { AL_LANG = l || "fr"; }
function AL(key) { return (AL_DICT[AL_LANG] || AL_DICT.fr)[key] || (AL_DICT.fr[key] || key); }

function coachEstimateProbability({ winrate, rr, ddUsedPct, ddLimitPct, profitFactor, totalTrades, riskPct }) {
  const wr = Math.max(0, Math.min(1, winrate / 100));
  const expectancyR = wr * rr - (1 - wr);
  let prob = 50 + expectancyR * 45;
  const ddRatio = ddLimitPct > 0 ? ddUsedPct / ddLimitPct : 0;
  if (ddRatio > 0.9) prob -= 30; else if (ddRatio > 0.75) prob -= 18;
  else if (ddRatio > 0.6) prob -= 10; else if (ddRatio > 0.4) prob -= 3; else prob += 5;
  if (profitFactor >= 1.5) prob += 8; else if (profitFactor >= 1.2) prob += 3;
  else if (profitFactor < 1.0) prob -= 25; else if (profitFactor < 1.1) prob -= 10;
  if (totalTrades < 20) prob -= 15; else if (totalTrades < 50) prob -= 5; else if (totalTrades >= 100) prob += 3;
  if (riskPct > 2) prob -= 12; else if (riskPct > 1.5) prob -= 5;
  return Math.max(2, Math.min(96, Math.round(prob)));
}

function coachAnalyze(data, firmName) {
  if (!data) return null;
  const winrate = data.winrate || 0, rr = data.rr || 1;
  const ddDayUsed = parseFloat(data.ddDayPct || 0), ddTotUsed = parseFloat(data.ddTotPct || 0);
  const ddDayLimit = data.dailyDDLimit || 5, ddTotLimit = data.totalDDLimit || 10;
  const riskPct = data.riskPctValue || data.riskPct || 1;
  const totalTrades = data.totalTrades || 0, capital = data.capital || 25000, phase1Target = data.phase1Target || 8;
  const wr = winrate / 100;
  const profitFactor = (1 - wr) > 0 ? (wr * rr) / (1 - wr) : 99;
  const expectancyR = +(wr * rr - (1 - wr)).toFixed(3);
  const ddDayRatio = ddDayLimit > 0 ? ddDayUsed / ddDayLimit : 0;
  const ddTotRatio = ddTotLimit > 0 ? ddTotUsed / ddTotLimit : 0;
  const worstDD = ddDayRatio > ddTotRatio ? ddDayUsed : ddTotUsed;
  const worstDDLim = ddDayRatio > ddTotRatio ? ddDayLimit : ddTotLimit;
  const ddIsValid = !(isNaN(worstDD) || worstDD === null || worstDD === undefined);
  const probability = !ddIsValid ? 0 : coachEstimateProbability({ winrate, rr, ddUsedPct: worstDD, ddLimitPct: worstDDLim, profitFactor, totalTrades, riskPct });
  const auditConfidence = !ddIsValid ? 30 : totalTrades >= 100 ? 95 : totalTrades >= 50 ? 75 : 60;
  const auditStatus = !ddIsValid ? 'INCOMPLET' : 'Complet';

  const buildForces = () => {
    const f = [];
    const ddIsValidF = !(isNaN(worstDD) || worstDD === null || worstDD === undefined);
    const ddRatio = ddIsValidF && worstDDLim > 0 ? worstDD / worstDDLim : 0;
    if (!ddIsValidF) { f.push({ icon:'⚠️', title:AL('dd_unknown'), detail:AL('dd_uncalc'), s:0 }); }
    if (profitFactor >= 2.5) f.push({ icon:'💎', title:AL('pf_exceptional'), detail:`PF ${profitFactor.toFixed(2)} — ${AL('pf_strategy_perf')}`, s:100 });
    else if (profitFactor >= 1.8) f.push({ icon:'✅', title:AL('pf_excellent'), detail:`PF ${profitFactor.toFixed(2)} — ${AL('pf_gains_over')}`, s:88 });
    else if (profitFactor >= 1.4) f.push({ icon:'✅', title:AL('pf_solid'), detail:`PF ${profitFactor.toFixed(2)} — ${AL('pf_structurally')}`, s:72 });
    if (expectancyR >= 0.8) f.push({ icon:'✅', title:AL('exp_high'), detail:`+${expectancyR.toFixed(2)}R ${AL('per_trade')} — ${AL('exp_edge')}`, s:95 });
    else if (expectancyR >= 0.4) f.push({ icon:'✅', title:AL('exp_positive'), detail:`+${expectancyR.toFixed(2)}R ${AL('per_trade')} — ${AL('exp_profitable')}`, s:78 });
    if (ddRatio <= 0.25) f.push({ icon:'✅', title:AL('dd_controlled'), detail:`${worstDD.toFixed(1)}% — ${Math.round(ddRatio*100)}% ${AL('dd_oflimit')}`, s:90 });
    else if (ddRatio <= 0.5) f.push({ icon:'✅', title:AL('dd_wellcontrolled'), detail:`${worstDD.toFixed(1)}% — ${AL('dd_safety_margin')}`, s:74 });
    if (winrate >= 60) f.push({ icon:'✅', title:AL('wr_robust'), detail:`${winrate.toFixed(0)}% — ${AL('wr_reliability')}`, s:80 });
    if (rr >= 2.5) f.push({ icon:'✅', title:AL('rr_excellent'), detail:`1:${rr.toFixed(1)} — ${AL('rr_gains_over')}`, s:85 });
    else if (rr >= 2.0) f.push({ icon:'✅', title:AL('rr_good'), detail:`1:${rr.toFixed(1)} — ${AL('rr_favorable')}`, s:70 });
    if (totalTrades >= 150) f.push({ icon:'✅', title:AL('sample_excellent'), detail:`${totalTrades} trades — ${AL('sample_veryreliable')}`, s:88 });
    else if (totalTrades >= 80) f.push({ icon:'✅', title:AL('sample_good'), detail:`${totalTrades} trades — ${AL('sample_usable')}`, s:70 });
    return f.sort((a,b)=>b.s-a.s).slice(0,3);
  };

  const buildRisks = () => {
    const r = [];
    const ddIsValidR = !(isNaN(worstDD) || worstDD === null || worstDD === undefined);
    const ddRatio = ddIsValidR && worstDDLim > 0 ? worstDD / worstDDLim : 0;
    if (!ddIsValidR) { r.push({ icon:'🚨', title:'DD ABSENT', detail:'Impossible de valider les limites de risque prop firm — verdict NON VALIDABLE', s:100 }); }
    if (totalTrades < 20) r.push({ icon:'🚨', title:AL('sample_critical'), detail:`${totalTrades} trades — ${AL('sample_min')}`, s:100 });
    else if (totalTrades < 50) r.push({ icon:'⚠️', title:AL('sample_insufficient'), detail:`${totalTrades} trades — ${AL('sample_bias')}`, s:80 });
    if (ddRatio >= 0.9) r.push({ icon:'🚨', title:AL('dd_critical'), detail:`${worstDD.toFixed(1)}% / ${worstDDLim}% — ${AL('dd_imminent')}`, s:100 });
    else if (ddRatio >= 0.75) r.push({ icon:'🚨', title:AL('dd_nearlimit'), detail:`${worstDD.toFixed(1)}% / ${worstDDLim}% ${AL('dd_max')}`, s:85 });
    else if (ddRatio >= 0.6) r.push({ icon:'⚠️', title:AL('dd_watch'), detail:`${worstDD.toFixed(1)}% / ${worstDDLim}%`, s:60 });
    if (riskPct > 2.5) r.push({ icon:'🚨', title:AL('risk_excessive'), detail:`${riskPct.toFixed(2)}% — ${Math.round(riskPct*4)}% ${AL('risk_in4')}`, s:95 });
    else if (riskPct > 1.5) r.push({ icon:'⚠️', title:AL('risk_high'), detail:`${riskPct.toFixed(2)}% — ${AL('risk_reduce')}`, s:70 });
    if (rr < 1.2) r.push({ icon:'🚨', title:AL('rr_insufficient'), detail:`1:${rr.toFixed(1)} — ${AL('rr_toolow')}`, s:90 });
    if (profitFactor > 3.5 && totalTrades < 60) r.push({ icon:'⚠️', title:AL('overopt_risk'), detail:`PF ${profitFactor.toFixed(2)} / ${totalTrades} trades — ${AL('overopt_bias')}`, s:72 });
    if (expectancyR <= 0) r.push({ icon:'🚨', title:AL('exp_negative'), detail:`${expectancyR.toFixed(2)}R — ${AL('exp_losing')}`, s:100 });
    return r.sort((a,b)=>b.s-a.s).slice(0,3);
  };

  const buildProjection = () => {
    const riskAmt = capital * (riskPct / 100);
    const expectedPT = riskAmt * (wr * rr - (1 - wr));
    const eDailyPnl = expectedPT * 3;
    const targetAmt = capital * (phase1Target / 100);
    const ddRemaining = Math.max(0, worstDDLim - worstDD);
    const maxLosses = riskPct > 0 ? Math.floor(ddRemaining / riskPct) : 0;
    const daysMin = eDailyPnl > 0 ? Math.ceil(targetAmt / (eDailyPnl * 1.3)) : null;
    const daysMax = eDailyPnl > 0 ? Math.ceil(targetAmt / (eDailyPnl * 0.7)) : null;
    const failureRisk = probability >= 75 ? AL('risk_low') : probability >= 55 ? AL('risk_moderate') : probability >= 35 ? AL('risk_elevated') : AL('risk_critical2');
    const failureColor = probability >= 75 ? '#6ee7b7' : probability >= 55 ? '#fbbf24' : probability >= 35 ? '#f97316' : '#ef4444';
    return { daysMin, daysMax, maxConsecLosses: maxLosses, failureRisk, failureColor, ddRemaining: ddRemaining.toFixed(1) };
  };

  const buildLevers = () => {
    const levers = [];
    if (riskPct > 0.5) {
      const nr = Math.max(0.25, riskPct - 0.25);
      const np = coachEstimateProbability({ winrate, rr, ddUsedPct: worstDD*(nr/riskPct), ddLimitPct: worstDDLim, profitFactor, totalTrades, riskPct: nr });
      if (np > probability) levers.push({ from: riskPct.toFixed(2)+'%', to: nr.toFixed(2)+'%', gain: np-probability, newProb: np, label:AL('lever_reduce_risk') });
    }
    const nrr = rr + 0.5, nPF = (1-wr)>0?(wr*nrr)/(1-wr):99;
    const np2 = coachEstimateProbability({ winrate, rr:nrr, ddUsedPct:worstDD, ddLimitPct:worstDDLim, profitFactor:nPF, totalTrades, riskPct });
    if (np2 > probability) levers.push({ from:'1:'+rr.toFixed(1), to:'1:'+nrr.toFixed(1), gain:np2-probability, newProb:np2, label:AL('lever_improve_rr') });
    if (winrate < 70) {
      const nwr=winrate+5, nwrr=nwr/100, nPF3=(1-nwrr)>0?(nwrr*rr)/(1-nwrr):99;
      const np3=coachEstimateProbability({winrate:nwr,rr,ddUsedPct:worstDD,ddLimitPct:worstDDLim,profitFactor:nPF3,totalTrades,riskPct});
      if (np3>probability) levers.push({ from:winrate.toFixed(0)+'%', to:nwr.toFixed(0)+'%', gain:np3-probability, newProb:np3, label:AL('lever_improve_wr') });
    }
    return levers.sort((a,b)=>b.gain-a.gain).slice(0,3);
  };

  return { probability, profitFactor:+profitFactor.toFixed(2), expectancyR, forces:buildForces(), risks:buildRisks(), levers:buildLevers(), projection:buildProjection(), metrics:{winrate,rr,ddDayUsed,ddTotUsed,ddDayLimit,ddTotLimit,riskPct,totalTrades,capital,phase1Target}, firmName:firmName||'ton challenge', ddKnown:ddIsValid, auditConfidence, auditStatus };
}

// Moteur analyse journal (mode 2)
function journalAnalyze(journalRaw) {
  const allDays = [];
  Object.entries(journalRaw || {}).forEach(([mk, days]) => {
    Object.entries(days || {}).forEach(([d, e]) => {
      if (e && (e.pnl !== undefined || e.wins !== undefined))
        allDays.push({ date:`${mk}-${d.padStart(2,'0')}`, pnl:e.pnl||0, wins:e.wins||0, losses:e.losses||0 });
    });
  });
  if (!allDays.length) return null;
  allDays.sort((a,b)=>a.date.localeCompare(b.date));

  let totalWins=0, totalLosses=0, totalPnl=0, bestDay=-Infinity, worstDay=Infinity;
  let streakW=0, streakL=0, maxStreakW=0, maxStreakL=0;
  allDays.forEach(d => {
    totalWins+=d.wins; totalLosses+=d.losses; totalPnl+=d.pnl;
    if(d.pnl>bestDay) bestDay=d.pnl; if(d.pnl<worstDay) worstDay=d.pnl;
    if(d.pnl>0){streakW++;streakL=0;maxStreakW=Math.max(maxStreakW,streakW);}
    else{streakL++;streakW=0;maxStreakL=Math.max(maxStreakL,streakL);}
  });
  const tt=totalWins+totalLosses, tradeWR=tt>0?totalWins/tt*100:0;
  const posDays=allDays.filter(d=>d.pnl>0).length, dayWR=allDays.length>0?posDays/allDays.length*100:0;

  let consistency=50;
  if(dayWR>=65) consistency+=20; else if(dayWR>=55) consistency+=12; else if(dayWR<40) consistency-=15;
  if(maxStreakL<=2) consistency+=15; else if(maxStreakL<=4) consistency+=5; else if(maxStreakL>=6) consistency-=20;
  const pnlRatio=Math.abs(bestDay)/(Math.abs(worstDay)||1);
  if(pnlRatio>=2) consistency+=10; else if(pnlRatio<0.7) consistency-=10;
  if(allDays.length>=30) consistency+=10; else if(allDays.length<10) consistency-=20;
  consistency=Math.max(5,Math.min(95,Math.round(consistency)));

  const issues=[];
  if(maxStreakL>=4) issues.push({sev:'high',text:`Série de ${maxStreakL} journées perdantes consécutives — risque de revenge trading`});
  if(dayWR<45) issues.push({sev:'high',text:`${dayWR.toFixed(0)}% de jours positifs — cohérence journalière insuffisante`});
  if(allDays.length<15) issues.push({sev:'med',text:`${allDays.length} jours saisis seulement — historique insuffisant`});
  if(Math.abs(worstDay)>Math.abs(bestDay)*1.5) issues.push({sev:'med',text:`Pire journée (${worstDay.toFixed(0)}$) disproportionnée — manque de discipline possible`});

  const strengths=[];
  if(dayWR>=60) strengths.push({text:`${dayWR.toFixed(0)}% de journées positives — régularité solide`});
  if(maxStreakW>=5) strengths.push({text:`Série gagnante max ${maxStreakW} jours — capacité à enchaîner`});
  if(totalPnl>0) strengths.push({text:`P&L global +${totalPnl.toFixed(0)}$ sur ${allDays.length} jours de trading`});
  if(tradeWR>=55) strengths.push({text:`Winrate trade ${tradeWR.toFixed(0)}% — sélection d'entrées efficace`});

  return {
    consistency, totalDays:allDays.length, totalTrades:tt, totalWins, totalLosses, tradeWR:+tradeWR.toFixed(1), dayWR:+dayWR.toFixed(1),
    totalPnl:+totalPnl.toFixed(2), avgDailyPnl:+(totalPnl/allDays.length).toFixed(2),
    bestDay:bestDay===-Infinity?0:+bestDay.toFixed(2), worstDay:worstDay===Infinity?0:+worstDay.toFixed(2),
    maxStreakW, maxStreakL, monthsTracked:Object.keys(journalRaw||{}).length,
    issues:issues.slice(0,3), strengths:strengths.slice(0,3),
  };
}

// Moteur analyse backtest (mode 3)
function backtestAnalyze(stored) {
  if (!stored || !stored.trades || !stored.trades.length) return null;
  const trades=stored.trades, initBal=stored.initBalance||(trades[0]?.balance-trades[0]?.profit)||0;
  if(!initBal) return null;

  const wins=trades.filter(t=>t.profit>0), losses=trades.filter(t=>t.profit<=0);
  const totalTrades=trades.length, wr=wins.length/totalTrades*100;
  const avgW=wins.length?wins.reduce((s,t)=>s+t.profit,0)/wins.length:0;
  const avgL=losses.length?Math.abs(losses.reduce((s,t)=>s+t.profit,0))/losses.length:1;
  const rr=avgL>0?avgW/avgL:0;
  const grossW=wins.reduce((s,t)=>s+t.profit,0), grossL=Math.abs(losses.reduce((s,t)=>s+t.profit,0));
  const pf=grossL>0?grossW/grossL:99;

  // ── VALIDATION DD : même logique que MesTrades ──
  // Si balanceReconstructed=true → pas de colonne balance → DD non fiable
  const balanceReconstructed = stored.balanceReconstructed === true;
  let rawMaxDD = 0;
  let peak = initBal;
  trades.forEach(t => {
    if (t.balance > peak) peak = t.balance;
    const dd = (peak - t.balance) / peak * 100;
    if (dd > rawMaxDD) rawMaxDD = dd;
  });

  // DD non fiable si : balance reconstruite OU DD=0 malgré des pertes
  const ddZeroButLosses = rawMaxDD < 0.01 && losses.length > 0;
  const ddUnreliable = balanceReconstructed || ddZeroButLosses;
  const ddKnown = !ddUnreliable;

  // Si DD manuel fourni (depuis MesTrades), l'utiliser
  const manualDD = stored.manualDD != null ? stored.manualDD : null;
  const maxDD = manualDD != null ? manualDD : (ddUnreliable ? null : rawMaxDD);

  const finalBal=trades[trades.length-1].balance, profit=(finalBal-initBal)/initBal*100;

  // ── SCORE ROBUSTESSE ──
  let robustness=50;
  if(pf>=2.5) robustness+=20; else if(pf>=1.5) robustness+=12; else if(pf<1.1) robustness-=25;
  if(totalTrades>=100) robustness+=15; else if(totalTrades>=50) robustness+=8; else if(totalTrades<30) robustness-=20;
  if(!ddKnown && manualDD==null) robustness-=25; // Forte pénalité si DD absent
  else if(maxDD!=null && maxDD<=5) robustness+=10; else if(maxDD!=null && maxDD<=10) robustness+=5; else if(maxDD!=null && maxDD>20) robustness-=15;
  if(pf>4&&totalTrades<50) robustness-=20;
  robustness=Math.max(5,Math.min(95,Math.round(robustness)));

  // ── CONFIANCE AUDIT ──
  let auditConfidence = 100;
  if(!ddKnown && manualDD==null) auditConfidence = 30;
  else if(manualDD!=null) auditConfidence = 65; // DD manuel = partiel
  if(totalTrades<50) auditConfidence = Math.min(auditConfidence, 60);
  const auditStatus = (!ddKnown && manualDD==null) ? 'INCOMPLET' : manualDD!=null ? 'Partiel (DD manuel)' : 'Complet';

  return {
    robustness, totalTrades, wr:+wr.toFixed(1), rr:+rr.toFixed(2),
    pf:+pf.toFixed(2), maxDD: maxDD!=null ? +maxDD.toFixed(2) : null,
    profit:+profit.toFixed(2), avgW:+avgW.toFixed(2), avgL:+avgL.toFixed(2),
    filename:stored.filename,
    ddKnown, ddUnreliable, balanceReconstructed, manualDD,
    ddZeroButLosses, auditConfidence, auditStatus,
    ddMissingReason: ddUnreliable ? (balanceReconstructed ? 'Balances reconstruites — colonne Balance absente du CSV' : `DD 0% malgré ${losses.length} trades perdants — balances intermédiaires manquantes`) : null
  };
}

async function callGeminiCoach(data, lang, mode) {
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || '';
  if (!GEMINI_KEY) return null;
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const langLabel = { fr:'français', en:'English', es:'español' }[lang]||'français';

  let prompt = '';
  if (mode==='simulation' && data) {
    const m=data.metrics;
    prompt=`Tu es un analyste quantitatif expert en Prop Trading, direct et chiffré. Réponds UNIQUEMENT en JSON valide sans markdown.\n\nDonnées de simulation pour "${data.firmName}" (capital $${m.capital}):\n- Winrate: ${m.winrate.toFixed(0)}%, RR: 1:${m.rr.toFixed(1)}, PF: ${data.profitFactor}, Espérance: ${data.expectancyR}R\n- DD: ${Math.max(m.ddDayUsed,m.ddTotUsed).toFixed(1)}%/${Math.max(m.ddDayLimit,m.ddTotLimit)}%, Trades: ${m.totalTrades}, Score: ${data.probability}%\n\nJSON en ${langLabel}:\n{"recommendation":"2-3 phrases directes sur la probabilité ${data.probability}% de réussir ce challenge, avec les chiffres réels.","readyForChallenge":${data.probability>=55},"expertQuote":"1 phrase concise d'un analyste senior sur cette stratégie."}`;
  } else if (mode==='journal' && data) {
    prompt=`Tu es un psychologue-trader spécialisé en performance. Réponds UNIQUEMENT en JSON valide sans markdown.\n\nDonnées journal: ${data.totalDays} jours, WR day: ${data.dayWR.toFixed(0)}%, WR trade: ${data.tradeWR.toFixed(0)}%, P&L: +${data.totalPnl}$, série pertes max: ${data.maxStreakL} jours, score cohérence: ${data.consistency}%\n\nJSON en ${langLabel}:\n{"recommendation":"2-3 phrases sur la discipline et la cohérence du trader, avec les chiffres réels.","readyForChallenge":${data.consistency>=60},"expertQuote":"1 phrase percutante d'un coach trader sur les habitudes observées."}`;
  } else if (mode==='backtest' && data) {
    prompt=`Tu es un analyste quant spécialisé en backtests. Réponds UNIQUEMENT en JSON valide sans markdown.\n\nBacktest: ${data.totalTrades} trades, WR: ${data.wr}%, RR: 1:${data.rr}, PF: ${data.pf}, DD max: ${data.maxDD}%, Profit: +${data.profit}%, Score robustesse: ${data.robustness}%\n\nJSON en ${langLabel}:\n{"recommendation":"2-3 phrases sur la robustesse statistique et la fiabilité du backtest, avec les chiffres réels.","readyForChallenge":${data.robustness>=60},"expertQuote":"1 phrase d'un analyste quantitatif sur la validité de ces résultats."}`;
  }
  if (!prompt) return null;
  try {
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),8000);
    const res=await fetch(GEMINI_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.65,maxOutputTokens:400}}),signal:controller.signal});
    clearTimeout(timeout);
    const d=await res.json();
    const raw=d.candidates?.[0]?.content?.parts?.[0]?.text||'';
    return JSON.parse(raw.replace(/```json\n?|\n?```/g,'').trim());
  } catch(e){return null;}
}

// ── Filtre de cohérence Gemini pour MesTrades (garde-fou silencieux) ──
async function callGeminiVerdict(verdict, sim, lang) {
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || '';
  if (!GEMINI_KEY || !verdict) return null;
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const langLabel = { fr:'français', en:'English', es:'español' }[lang] || 'français';

  const prompt = `Tu es un analyste quantitatif expert en prop trading. Tu dois valider la cohérence d'un audit de backtest et fournir une analyse statistique indépendante.

Données du backtest :
- Verdict local : ${verdict.label}
- Probabilité Monte Carlo : ${verdict.passPct !== null ? verdict.passPct + '%' : 'N/C (données DD manquantes)'}
- Winrate réel : ${verdict.realWR}%
- Ratio R/R réel : 1:${verdict.realRR}
- Profit Factor : ${verdict.realPF}
- DD max : ${verdict.ddUnreliable ? 'INCONNU' : verdict.maxDD + '%'}
- Profit final backtest : ${verdict.finalProfit}%
- Phases atteintes : ${verdict.phasesPassed}/${verdict.totalPhases}
- Cohérence avec simulation : ${verdict.matchScore}%
- Trades analysés : ${verdict.tooFewTrades ? 'INSUFFISANT' : 'suffisant'}
- DD fiable : ${verdict.ddUnreliable ? 'NON' : 'OUI'}
${sim ? `- Paramètres simulation : WR cible ${sim.winrate}%, RR cible 1:${sim.rr}, risque ${sim.riskPctValue || sim.riskPct}%` : ''}

RÈGLES STRICTES :
1. Ne jamais mentionner "IA", "intelligence artificielle", "Gemini", "algorithme" ou "modèle"
2. Parler uniquement de chiffres, statistiques et faits observables
3. Si le DD est inconnu, confirmer l'impossibilité de valider
4. Identifier 1-2 incohérences ou points de vigilance non couverts par le verdict local
5. Être concis, factuel, professionnel

Réponds UNIQUEMENT en JSON valide sans markdown :
{"validationSummary":"2-3 phrases de validation indépendante en ${langLabel}, avec les chiffres réels. Commence par confirmer ou nuancer le verdict.","watchpoints":["point de vigilance 1","point de vigilance 2"],"confidenceLevel":"ÉLEVÉ|MODÉRÉ|FAIBLE|INDÉTERMINÉ","confidenceReason":"1 phrase sur pourquoi ce niveau de confiance"}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 500 } }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const d = await res.json();
    const raw = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonClean = raw.split('```json').pop().split('```')[0].trim(); return JSON.parse(jsonClean || raw.trim());
  } catch (e) { return null; }
}

function CoachScreen({ t, lang, lastSim, profile, goto, premiumAccess = true, requirePremium = () => {} }) {
  const [mode, setMode] = useState(null); // null | 'simulation' | 'journal' | 'backtest'
  const [gemini, setGemini] = useState(null);
  const [gemLoading, setGemLoading] = useState(false);

  // Scroll to top on mode change
  useEffect(() => { window.scrollTo({top:0,behavior:'instant'}); }, [mode]);

  // Read journal data
  const journalRaw = (() => { try { const r=localStorage.getItem('eapropfirm_journal'); return r?JSON.parse(r):{}; } catch(e){return{};} })();
  const journalStats = journalAnalyze(journalRaw);

  // Read backtest data
  const backtestRaw = (() => { try { const r=localStorage.getItem('eapropfirm_trades'); const d=r?JSON.parse(r):null; return d&&d.trades&&d.trades.length?d:null; } catch(e){return null;} })();
  const backtestStats = backtestRaw ? backtestAnalyze(backtestRaw) : null;

  // Simulation data
  setALLang(lang);
  const simAnalysis = lastSim ? coachAnalyze({ winrate:lastSim.winrate, rr:lastSim.rr, ddDayPct:lastSim.ddDayPct, ddTotPct:lastSim.ddTotPct, dailyDDLimit:lastSim.dailyDDLimit, totalDDLimit:lastSim.totalDDLimit, riskPctValue:lastSim.riskPctValue, riskPct:lastSim.riskPct, totalTrades:lastSim.totalTrades, capital:lastSim.capital, phase1Target:lastSim.phase1Target }, lastSim.firmKey?lastSim.firmKey.toUpperCase():'PROP FIRM') : null;

  // Appel expert async selon le mode
  useEffect(() => {
    if (!mode || gemLoading) return;
    setGemini(null); setGemLoading(true);
    const d = mode==='simulation'?simAnalysis : mode==='journal'?journalStats : backtestStats;
    callGeminiCoach(d, lang, mode).then(r => { setGemLoading(false); if(r) setGemini(r); });
  }, [mode]);

  // ── Helpers visuels ──
  const scoreColor = (s) => s>=75?'#4ade80':s>=55?'#6ee7b7':s>=35?'#fbbf24':'#ef4444';
  const scoreLabel = (s, labels) => s>=75?labels[0]:s>=55?labels[1]:s>=35?labels[2]:labels[3];

  const ScoreCircle = ({ score, size=100 }) => {
    const r=42, c=50, sw=8;
    const pColor=scoreColor(score);
    return (
      <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
        <svg width={size} height={size} viewBox="0 0 100 100" style={{transform:'rotate(-90deg)'}}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw}/>
          <circle cx={c} cy={c} r={r} fill="none" stroke={pColor} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={String(2*Math.PI*r)}
            strokeDashoffset={String(2*Math.PI*r*(1-score/100))}/>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <div style={{fontSize:size*0.22,fontWeight:900,color:pColor,lineHeight:1}}>{score}<span style={{fontSize:size*0.12}}>%</span></div>
        </div>
      </div>
    );
  };

  const ReportHeader = ({ title, subtitle, onBack }) => (
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
      <button onClick={onBack} style={{width:36,height:36,borderRadius:18,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)',fontSize:16,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>
      <div>
        <div style={{fontSize:17,fontWeight:800,color:'#fff',letterSpacing:-0.3}}>{title}</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{subtitle}</div>
      </div>
    </div>
  );

  const ExpertSection = ({ gemini, gemLoading, localText }) => {
    const narrative = gemini || (localText ? { recommendation:localText, expertQuote:null, readyForChallenge:null } : null);
    return (
      <div style={{background:'linear-gradient(135deg,rgba(110,231,183,0.07),rgba(6,9,15,0.8))',border:'1px solid rgba(110,231,183,0.2)',borderRadius:16,padding:16,marginBottom:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2}}>
            <span style={{marginRight:5}}>🔬</span>Rapport Expert
          </div>
          <div style={{padding:'3px 8px',borderRadius:9,fontSize:9,fontWeight:700,background:gemLoading?'rgba(251,191,36,0.12)':gemini?'rgba(110,231,183,0.12)':'rgba(255,255,255,0.07)',color:gemLoading?'#fbbf24':gemini?'#6ee7b7':'rgba(255,255,255,0.4)',border:`1px solid ${gemLoading?'rgba(251,191,36,0.3)':gemini?'rgba(110,231,183,0.3)':'rgba(255,255,255,0.1)'}`}}>
            {gemLoading?t('an_analyzing') : gemini?t('an_advanced') : t('an_local')}
          </div>
        </div>
        {gemLoading ? (
          <div style={{display:'flex',flexDirection:'column',gap:7}}>{[90,75,60].map((w,i)=><div key={i} style={{height:10,borderRadius:5,background:'rgba(255,255,255,0.07)',width:w+'%'}}/>)}</div>
        ) : narrative ? (
          <>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.85)',lineHeight:1.65,marginBottom:10}}>{narrative.recommendation}</div>
            {narrative.expertQuote && (
              <div style={{padding:'9px 12px',borderRadius:10,background:'rgba(255,255,255,0.05)',borderLeft:'3px solid rgba(110,231,183,0.5)'}}>
                <div style={{fontSize:9,color:'rgba(255,255,255,0.3)',marginBottom:2,textTransform:'uppercase',letterSpacing:0.8}}>Analyste senior</div>
                <div style={{fontSize:12,fontStyle:'italic',color:'rgba(255,255,255,0.7)',lineHeight:1.5}}>"{narrative.expertQuote}"</div>
              </div>
            )}
            {narrative.readyForChallenge !== null && narrative.readyForChallenge !== undefined && (
              <div style={{marginTop:9,display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:12}}>{narrative.readyForChallenge?'✅':'⚠️'}</span>
                <span style={{fontSize:11,color:narrative.readyForChallenge?'#6ee7b7':'#fbbf24',fontWeight:600}}>{narrative.readyForChallenge?'Stratégie validée pour un challenge':'Optimisation recommandée avant de lancer'}</span>
              </div>
            )}
          </>
        ) : null}
      </div>
    );
  };

  // ── Écran de sélection ──
  if (!mode) {
    const cards = [
      {
        key:'simulation', accent:'#6ee7b7', bg:'rgba(110,231,183,0.06)', border:'rgba(110,231,183,0.2)',
        icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="3" stroke="#6ee7b7" strokeWidth="1.5"/><path d="M7 17l2.5-5 3 4 2-3 2.5 4" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        title: t('an_sim_title'),
        subtitle: t('an_sim_sub'),
        desc: t('an_sim_desc'),
        chips: ['Winrate', 'Ratio R/R', 'Drawdown', 'Probabilité'],
        hasData: !!simAnalysis,
        dataLabel: simAnalysis ? `${simAnalysis.metrics.totalTrades} trades · ${(simAnalysis.firmName)} · Score ${simAnalysis.probability}%` : (lang==='en'?'Run a simulation first':'Lancez d\'abord une simulation'),
        cta: t('an_sim_cta'),
        ctaGoto: 'simulator',
      },
      {
        key:'journal', accent:'#fbbf24', bg:'rgba(251,191,36,0.06)', border:'rgba(251,191,36,0.2)',
        icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="14" height="18" rx="2" stroke="#fbbf24" strokeWidth="1.5"/><path d="M8 7h8M8 10h8M8 13h5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 5v14a2 2 0 002 2h14" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/></svg>,
        title: t('an_journal_title'),
        subtitle: t('an_journal_sub'),
        desc: t('an_journal_desc'),
        chips: ['Historique', 'Discipline', 'Régularité', 'Séries'],
        hasData: !!journalStats,
        dataLabel: journalStats ? `${journalStats.totalDays} jours saisis · ${journalStats.monthsTracked} mois · Score ${journalStats.consistency}%` : (lang==='en'?'Enter trades in your journal first':'Saisissez des trades dans le journal'),
        cta: t('an_journal_cta'),
        ctaGoto: 'dashboard',
      },
      {
        key:'backtest', accent:'#e05252', bg:'rgba(224,82,82,0.06)', border:'rgba(224,82,82,0.2)',
        icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 3H5a2 2 0 00-2 2v4M9 3h6M9 3v4M15 3h4a2 2 0 012 2v4M15 3v4M9 7h6M9 7v4M15 7v4M9 11h6M9 11v4M15 11v4M9 15h6M9 15v4M15 15v4M2 9h20" stroke="#e05252" strokeWidth="1.5" strokeLinecap="round"/></svg>,
        title: t('an_bt_title'),
        subtitle: t('an_bt_sub'),
        desc: t('an_bt_desc'),
        chips: ['Equity curve', 'Profit Factor', 'Monte Carlo', 'Robustesse'],
        hasData: !!backtestStats,
        dataLabel: backtestStats ? `${backtestStats.totalTrades} trades importés · PF ${backtestStats.pf} · Score ${backtestStats.robustness}%` : (lang==='en'?'Import a CSV file in My Trades':'Importez un fichier CSV dans Mes Trades'),
        cta: t('an_bt_cta'),
        ctaGoto: 'trades',
      },
    ];
    return (
      <div style={{padding:'14px 16px 100px',maxWidth:480,margin:'0 auto'}}>
        <div style={{marginBottom:22}}>
          <div style={{fontSize:11,fontWeight:800,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:1.5,marginBottom:4}}>{t('an_center')}</div>
          <div style={{fontSize:22,fontWeight:900,color:'#fff',letterSpacing:-0.5,lineHeight:1.15}}>{t('an_select')}<br/><span style={{color:'#6ee7b7'}}>{t('an_your_analysis')}</span></div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.45)',marginTop:6,lineHeight:1.5}}>{t('an_intro')}</div>
        </div>

        {cards.map((card, i) => (
          <div key={card.key} style={{background:card.bg,border:`1px solid ${card.border}`,borderRadius:18,padding:'18px 16px',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:14}}>
              <div style={{width:44,height:44,borderRadius:12,background:`rgba(${card.accent==='#6ee7b7'?'110,231,183':card.accent==='#fbbf24'?'251,191,36':'224,82,82'},0.12)`,border:`1px solid ${card.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {card.icon}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:800,color:'#fff',marginBottom:1}}>{card.title}</div>
                <div style={{fontSize:10,fontWeight:700,color:card.accent,textTransform:'uppercase',letterSpacing:0.8}}>{card.subtitle}</div>
              </div>
              {card.hasData && <div style={{padding:'3px 9px',borderRadius:10,background:'rgba(110,231,183,0.1)',border:'1px solid rgba(110,231,183,0.25)',fontSize:9,fontWeight:700,color:'#6ee7b7',whiteSpace:'nowrap'}}>{t('an_ready')}</div>}
            </div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.55,marginBottom:12}}>{card.desc}</div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:14}}>
              {card.chips.map(c=>(
                <div key={c} style={{padding:'3px 9px',borderRadius:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.09)',fontSize:10,color:'rgba(255,255,255,0.5)'}}>{c}</div>
              ))}
            </div>
            <div style={{fontSize:10,color:card.hasData?'rgba(255,255,255,0.55)':'rgba(255,255,255,0.3)',marginBottom:12,lineHeight:1.4}}>
              {card.hasData?'✓ ':card.key==='simulation'?'ℹ ':card.key==='journal'?'ℹ ':'ℹ '}{card.dataLabel}
            </div>
            <button
              onClick={() => { if(!premiumAccess){requirePremium();return;} if(!card.hasData){goto(card.ctaGoto);return;} setMode(card.key); }}
              style={{width:'100%',padding:'13px',borderRadius:13,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,
                background:card.hasData?(card.accent==='#6ee7b7'?'linear-gradient(135deg,#6ee7b7,#34d399)':card.accent==='#fbbf24'?'linear-gradient(135deg,#fbbf24,#f59e0b)':'linear-gradient(135deg,#e05252,#c93b3b)'):'rgba(255,255,255,0.07)',
                color:card.hasData?'#000':'rgba(255,255,255,0.4)',
              }}>
              {!premiumAccess?'🔒 Premium':card.hasData?card.cta:t('an_get_data')}
            </button>
          </div>
        ))}

        <div style={{textAlign:'center',marginTop:8,padding:'12px 14px',background:'rgba(255,255,255,0.02)',borderRadius:12,border:'1px solid rgba(255,255,255,0.05)'}}>
          <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:1}}>{t("an_quant_engine")}</div>
          <div style={{fontSize:9,color:'rgba(255,255,255,0.2)',marginTop:3}}>{t("an_local_optional")}</div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // RAPPORT MODE 1 : SIMULATION CHALLENGE
  // ══════════════════════════════════════════════════════════════════
  if (mode==='simulation') {
    const a=simAnalysis;
    if(!a) return (
      <div style={{padding:'14px 16px 100px',maxWidth:480,margin:'0 auto'}}>
        <ReportHeader title="Simulation Challenge" subtitle="Rapport d'évaluation" onBack={()=>setMode(null)}/>
        <div style={{textAlign:'center',padding:'40px 20px',background:'rgba(255,255,255,0.03)',borderRadius:20}}>
          <div style={{fontSize:32,marginBottom:12}}>📊</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:16}}>{t('an_no_sim')}</div>
          <button onClick={()=>goto('simulator')} style={{padding:'12px 24px',borderRadius:12,background:'#6ee7b7',color:'#000',fontWeight:700,border:'none',cursor:'pointer'}}>{t('an_run_sim')}</button>
        </div>
      </div>
    );
    const pColor=scoreColor(a.probability);
    const localText=a.probability>=75?`Avec un score de ${a.probability}% et un Profit Factor de ${a.profitFactor}, votre stratégie présente les caractéristiques d'une approche solide pour ce challenge. ${a.risks[0]?'Le principal risque identifié est : '+a.risks[0].detail+'.':''} ${a.probability>=75?'La stratégie semble prête pour un challenge.':'Optimisez avant de lancer.'}`:
      `Votre score de ${a.probability}% révèle ${a.probability>=55?'une stratégie viable mais perfectible':'des fragilités importantes'}. PF ${a.profitFactor}, espérance ${a.expectancyR}R. ${a.risks[0]?a.risks[0].detail+'.':''} ${a.probability>=55?'Optimisez le risque/trade avant de lancer.':'Ne lancez pas de challenge avec ces métriques.'}`;
    return (
      <div style={{padding:'14px 16px 100px',maxWidth:480,margin:'0 auto'}}>
        <ReportHeader title="Simulation Challenge" subtitle={`${a.firmName} · Probabilité de réussite`} onBack={()=>setMode(null)}/>

        {/* Score */}
        <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${pColor}22`,borderRadius:20,padding:'20px 18px',marginBottom:12,display:'flex',alignItems:'center',gap:20}}>
          <ScoreCircle score={a.probability} size={100}/>
          <div style={{flex:1}}>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:4}}>{t("an_score_success")}</div>
            <div style={{fontSize:22,fontWeight:900,color:pColor,marginBottom:2}}>{a.probability>=75?'Excellent':a.probability>=55?'Solide':a.probability>=35?'Risqué':'Critique'}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{a.metrics.totalTrades} trades · {a.firmName}</div>
            <div style={{display:'flex',gap:8,marginTop:10}}>
              {[{l:'PF',v:a.profitFactor,g:a.profitFactor>=1.5},{l:'Esp.',v:(a.expectancyR>0?'+':'')+a.expectancyR+'R',g:a.expectancyR>0},{l:'DD',v:Math.max(a.metrics.ddDayUsed,a.metrics.ddTotUsed).toFixed(1)+'%',g:true}].map((m,i)=>(
                <div key={i} style={{flex:1,background:'rgba(255,255,255,0.06)',borderRadius:10,padding:'7px 6px',textAlign:'center'}}>
                  <div style={{fontSize:8,color:'rgba(255,255,255,0.4)'}}>{m.l}</div>
                  <div style={{fontSize:13,fontWeight:800,color:m.warn?'#ef4444':m.g?'#4ade80':'#fbbf24'}}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Forces */}
        {a.forces.length>0&&<div style={{background:'rgba(110,231,183,0.04)',border:'1px solid rgba(110,231,183,0.15)',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:10}}><span style={{marginRight:5}}>💪</span>{t('an_forces')}</div>
          {a.forces.map((f,i)=><div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:i<a.forces.length-1?8:0}}><span style={{fontSize:14,flexShrink:0}}>{f.icon}</span><div><div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{f.title}</div><div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:1,lineHeight:1.4}}>{f.detail}</div></div></div>)}
        </div>}

        {/* Risques */}
        {a.risks.length>0&&<div style={{background:'rgba(251,191,36,0.04)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:10}}><span style={{marginRight:5}}>🔍</span>{t('an_risks')}</div>
          {a.risks.map((r,i)=><div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:i<a.risks.length-1?8:0}}><span style={{fontSize:14,flexShrink:0}}>{r.icon}</span><div><div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{r.title}</div><div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:1,lineHeight:1.4}}>{r.detail}</div></div></div>)}
        </div>}

        {/* Rapport expert */}
        <ExpertSection gemini={gemini} gemLoading={gemLoading} localText={localText}/>

        {/* Projection */}
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:12}}><span style={{marginRight:5}}>🎯</span>{t("an_projection_challenge")}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[
              {l:t('an_probability'),v:a.probability+'%',c:pColor},
              {l:t('an_time_estimated'),v:a.projection.daysMin?`${a.projection.daysMin}–${a.projection.daysMax}j`:'N/A',c:'#fff'},
              {l:'Risque d\'échec',v:a.projection.failureRisk,c:a.projection.failureColor},
              {l:t('an_max_losses'),v:a.projection.maxConsecLosses>0?`${a.projection.maxConsecLosses} trades`:'Inconnu',c:a.projection.maxConsecLosses>5?'#4ade80':a.projection.maxConsecLosses>2?'#fbbf24':'#ef4444'},
            ].map((m,i)=>(
              <div key={i} style={{background:'rgba(255,255,255,0.05)',borderRadius:12,padding:'11px 12px'}}>
                <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',marginBottom:3,lineHeight:1.3}}>{m.l}</div>
                <div style={{fontSize:15,fontWeight:800,color:m.c}}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Optimisation */}
        {a.levers.length>0&&<div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:10}}><span style={{marginRight:5}}>⚡</span>{t("an_levers")}</div>
          {a.levers.map((l,i)=>(
            <div key={i} style={{background:'rgba(110,231,183,0.05)',border:'1px solid rgba(110,231,183,0.15)',borderRadius:12,padding:'11px 14px',marginBottom:i<a.levers.length-1?8:0,display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:'rgba(110,231,183,0.12)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <div style={{fontSize:13,fontWeight:900,color:'#6ee7b7',lineHeight:1}}>+{l.gain}</div>
                <div style={{fontSize:7,color:'rgba(110,231,183,0.6)'}}>pts</div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:'#fff',marginBottom:2}}>{l.label}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.45)'}}><span style={{color:'#f87171',fontWeight:600}}>{l.from}</span>{' → '}<span style={{color:'#4ade80',fontWeight:600}}>{l.to}</span>{' → '}<span style={{color:'#6ee7b7',fontWeight:700}}>{l.newProb}%</span></div>
              </div>
            </div>
          ))}
        </div>}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // RAPPORT MODE 2 : JOURNAL DE TRADING
  // ══════════════════════════════════════════════════════════════════
  if (mode==='journal') {
    const j=journalStats;
    if(!j) return (
      <div style={{padding:'14px 16px 100px',maxWidth:480,margin:'0 auto'}}>
        <ReportHeader title="Journal de Trading" subtitle="Analyse comportementale" onBack={()=>setMode(null)}/>
        <div style={{textAlign:'center',padding:'40px 20px',background:'rgba(255,255,255,0.03)',borderRadius:20}}>
          <div style={{fontSize:32,marginBottom:12}}>📓</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:16}}>{t('an_no_journal')}</div>
          <button onClick={()=>goto('dashboard')} style={{padding:'12px 24px',borderRadius:12,background:'#fbbf24',color:'#000',fontWeight:700,border:'none',cursor:'pointer'}}>{t('an_open_journal')}</button>
        </div>
      </div>
    );
    const cColor=scoreColor(j.consistency);
    const cLabel=j.consistency>=75?'Excellent':j.consistency>=55?'Cohérent':j.consistency>=35?'Irrégulier':'Instable';
    const localText=j.consistency>=70?`Avec ${j.totalDays} jours de trading analysés, votre score de cohérence de ${j.consistency}% reflète une discipline solide. Votre winrate journalier de ${j.dayWR.toFixed(0)}% est supérieur à la moyenne, et votre série de pertes max de ${j.maxStreakL} jours reste dans des limites acceptables.`:
      `Votre score de cohérence de ${j.consistency}% sur ${j.totalDays} jours révèle ${j.consistency>=50?'quelques irrégularités':'des lacunes importantes'}. ${j.maxStreakL>=4?`La série de ${j.maxStreakL} jours perdants consécutifs suggère du revenge trading. `:''}Un winrate journalier de ${j.dayWR.toFixed(0)}% ${j.dayWR>=50?'est correct mais perfectible':'est insuffisant pour un challenge'}. Travaillez la régularité avant de vous lancer.`;
    return (
      <div style={{padding:'14px 16px 100px',maxWidth:480,margin:'0 auto'}}>
        <ReportHeader title="Journal de Trading" subtitle={`${j.monthsTracked} mois · ${j.totalDays} jours analysés`} onBack={()=>setMode(null)}/>

        {/* Score cohérence */}
        <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${cColor}22`,borderRadius:20,padding:'20px 18px',marginBottom:12,display:'flex',alignItems:'center',gap:20}}>
          <ScoreCircle score={j.consistency} size={100}/>
          <div style={{flex:1}}>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:4}}>{t("an_score_coherence")}</div>
            <div style={{fontSize:22,fontWeight:900,color:cColor,marginBottom:2}}>{cLabel}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{j.totalDays} jours · P&L {j.totalPnl>0?'+':''}{j.totalPnl}$</div>
            <div style={{display:'flex',gap:8,marginTop:10}}>
              {[{l:t('an_wr_days'),v:j.dayWR.toFixed(0)+'%',g:j.dayWR>=55},{l:'WR trades',v:j.tradeWR.toFixed(0)+'%',g:j.tradeWR>=50},{l:'Moy./jour',v:(j.avgDailyPnl>0?'+':'')+j.avgDailyPnl+'$',g:j.avgDailyPnl>0}].map((m,i)=>(
                <div key={i} style={{flex:1,background:'rgba(255,255,255,0.06)',borderRadius:10,padding:'7px 6px',textAlign:'center'}}>
                  <div style={{fontSize:8,color:'rgba(255,255,255,0.4)'}}>{m.l}</div>
                  <div style={{fontSize:12,fontWeight:800,color:m.warn?'#ef4444':m.g?'#4ade80':'#fbbf24'}}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Métriques comportementales */}
        <div style={{background:'rgba(251,191,36,0.04)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:12}}><span style={{marginRight:5}}>🧠</span>{t("an_behavioral")}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[
              {l:t('an_best_day'),v:'+'+(j.bestDay||0).toFixed(0)+'$',c:'#4ade80'},
              {l:t('an_worst_day'),v:(j.worstDay||0).toFixed(0)+'$',c:'#ef4444'},
              {l:t('an_win_streak'),v:j.maxStreakW+' jours',c:j.maxStreakW>=5?'#4ade80':'#fff'},
              {l:t('an_loss_streak'),v:j.maxStreakL+' jours',c:j.maxStreakL>=5?'#ef4444':j.maxStreakL>=3?'#fbbf24':'#6ee7b7'},
            ].map((m,i)=>(
              <div key={i} style={{background:'rgba(255,255,255,0.05)',borderRadius:12,padding:'11px 12px'}}>
                <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',marginBottom:3}}>{m.l}</div>
                <div style={{fontSize:15,fontWeight:800,color:m.c}}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Points forts */}
        {j.strengths.length>0&&<div style={{background:'rgba(110,231,183,0.04)',border:'1px solid rgba(110,231,183,0.15)',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:10}}><span style={{marginRight:5}}>💪</span>{t("an_positive_points")}</div>
          {j.strengths.map((s,i)=><div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:i<j.strengths.length-1?7:0}}><span style={{color:'#6ee7b7',fontSize:13,flexShrink:0}}>✓</span><div style={{fontSize:12,color:'rgba(255,255,255,0.8)',lineHeight:1.4}}>{s.text}</div></div>)}
        </div>}

        {/* Erreurs */}
        {j.issues.length>0&&<div style={{background:'rgba(239,68,68,0.04)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:10}}><span style={{marginRight:5}}>⚠️</span>{t("an_improve_axes")}</div>
          {j.issues.map((issue,i)=><div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:i<j.issues.length-1?7:0}}><span style={{color:issue.sev==='high'?'#f87171':'#fbbf24',fontSize:13,flexShrink:0}}>{issue.sev==='high'?'✕':'!'}</span><div style={{fontSize:12,color:'rgba(255,255,255,0.8)',lineHeight:1.4}}>{issue.text}</div></div>)}
        </div>}

        {/* Rapport expert */}
        <ExpertSection gemini={gemini} gemLoading={gemLoading} localText={localText}/>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // RAPPORT MODE 3 : BACKTEST
  // ══════════════════════════════════════════════════════════════════
  if (mode==='backtest') {
    const b=backtestStats;
    if(!b) return (
      <div style={{padding:'14px 16px 100px',maxWidth:480,margin:'0 auto'}}>
        <ReportHeader title="Résultats Backtest" subtitle="Audit statistique" onBack={()=>setMode(null)}/>
        <div style={{textAlign:'center',padding:'40px 20px',background:'rgba(255,255,255,0.03)',borderRadius:20}}>
          <div style={{fontSize:32,marginBottom:12}}>📁</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:16}}>{t('an_no_bt')}</div>
          <button onClick={()=>goto('trades')} style={{padding:'12px 24px',borderRadius:12,background:'#e05252',color:'#000',fontWeight:700,border:'none',cursor:'pointer'}}>{t('an_import_bt')}</button>
        </div>
      </div>
    );
    const rColor = (!b.ddKnown && b.manualDD==null) ? '#fbbf24' : scoreColor(b.robustness);
    const rLabel = (!b.ddKnown && b.manualDD==null) ? 'Audit incomplet' : b.robustness>=75?'Robuste':b.robustness>=55?'Acceptable':b.robustness>=35?'Fragile':'Non fiable';
    const overfit=b.pf>4&&b.totalTrades<60;
    const localText = (!b.ddKnown && b.manualDD==null)
      ? `AUDIT INCOMPLET — Le DD de ce backtest est inconnu (${b.ddMissingReason||'données insuffisantes'}). Avec ${b.totalTrades} trades et un PF de ${b.pf}, les autres métriques sont solides, MAIS le respect des limites de risque prop firm ne peut pas être validé sans drawdown réel. Importez un CSV avec la colonne Balance, ou saisissez manuellement le DD max dans Mes Trades.`
      : b.robustness>=70
        ? `Avec ${b.totalTrades} trades et un Profit Factor de ${b.pf}, ce backtest présente les caractéristiques d'une stratégie ${b.robustness>=75?'statistiquement robuste':'acceptable'}. Le drawdown de ${b.maxDD}% ${b.manualDD!=null?'(saisi manuellement)':'réel'} reste ${b.maxDD<10?'dans des limites raisonnables':'à surveiller'}. ${overfit?'Attention au risque de sur-optimisation.':''}`
        : `Ce backtest de ${b.totalTrades} trades montre des fragilités. PF ${b.pf}, DD ${b.maxDD!=null?b.maxDD+'%':'inconnu'}. ${b.totalTrades<50?'Échantillon insuffisant.':''} ${overfit?'Risque de sur-optimisation.':''}`;
    return (
      <div style={{padding:'14px 16px 100px',maxWidth:480,margin:'0 auto'}}>
        <ReportHeader title="Résultats Backtest" subtitle={`${b.filename||'Backtest'} · ${b.totalTrades} trades`} onBack={()=>setMode(null)}/>

        {/* Score robustesse */}
        <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${rColor}22`,borderRadius:20,padding:'20px 18px',marginBottom:12,display:'flex',alignItems:'center',gap:20}}>
          <ScoreCircle score={b.robustness} size={100}/>
          <div style={{flex:1}}>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:4}}>Score de robustesse</div>
            <div style={{fontSize:22,fontWeight:900,color:rColor,marginBottom:2}}>{rLabel}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{b.totalTrades} trades · Profit {b.profit>0?'+':''}{b.profit}%</div>
            <div style={{display:'flex',gap:8,marginTop:10}}>
              {[{l:'PF',v:b.pf,g:b.pf>=1.5},{l:'WR',v:b.wr.toFixed(0)+'%',g:b.wr>=50},{l:'DD',v:b.maxDD!=null?b.maxDD.toFixed(1)+'%':'N/A',g:b.maxDD!=null&&b.maxDD<10,warn:b.maxDD==null}].map((m,i)=>(
                <div key={i} style={{flex:1,background:'rgba(255,255,255,0.06)',borderRadius:10,padding:'7px 6px',textAlign:'center'}}>
                  <div style={{fontSize:8,color:'rgba(255,255,255,0.4)'}}>{m.l}</div>
                  <div style={{fontSize:13,fontWeight:800,color:m.g?'#4ade80':'#fbbf24'}}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerte DD absent — calquée sur Mes Trades */}
        {(!b.ddKnown && b.manualDD==null) && (
          <div style={{background:'rgba(251,191,36,0.08)',border:'2px solid rgba(251,191,36,0.4)',borderRadius:16,padding:16,marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:900,color:'#fbbf24',marginBottom:8}}>⚠️ DONNÉES DD MANQUANTES</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.75)',lineHeight:1.6,marginBottom:12}}>
              {b.ddMissingReason||'Drawdown non calculable'}. Les métriques WR, RR et PF sont fiables, mais <strong style={{color:'#fbbf24'}}>le verdict prop firm est invalide</strong> sans DD réel.
            </div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',lineHeight:1.5}}>
              💡 Pour débloquer le verdict complet :<br/>
              • Importez un CSV avec colonne Balance (trade par trade)<br/>
              • Ou saisissez le DD max manuellement dans <strong style={{color:'#6ee7b7'}}>Mes Trades</strong>
            </div>
          </div>
        )}

        {/* KPIs statistiques */}
        <div style={{background:'rgba(224,82,82,0.04)',border:'1px solid rgba(224,82,82,0.2)',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:12}}><span style={{marginRight:5}}>📊</span>{t('an_stat_metrics')}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[
              {l:t('an_trades_analyzed'),v:b.totalTrades,c:b.totalTrades>=100?'#4ade80':b.totalTrades>=50?'#fbbf24':'#ef4444'},
              {l:t('an_real_rr'),v:`1:${b.rr}`,c:b.rr>=1.5?'#4ade80':'#fbbf24'},
              {l:t('an_avg_gain'),v:'+'+b.avgW.toFixed(0)+'$',c:'#4ade80'},
              {l:t('an_avg_loss'),v:'-'+b.avgL.toFixed(0)+'$',c:'#ef4444'},
            ].map((m,i)=>(
              <div key={i} style={{background:'rgba(255,255,255,0.05)',borderRadius:12,padding:'11px 12px'}}>
                <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',marginBottom:3}}>{m.l}</div>
                <div style={{fontSize:15,fontWeight:800,color:m.c}}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes statistiques */}
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:10}}><span style={{marginRight:5}}>🔍</span>{t('an_validity')}</div>
          {[
            {cond:b.totalTrades>=100,good:'Échantillon statistiquement significatif ('+b.totalTrades+' trades)',bad:'Échantillon insuffisant ('+b.totalTrades+' trades) — min. 100 pour un backtest fiable'},
            {cond:b.pf>=1.5&&!overfit,good:'Profit Factor robuste ('+b.pf+') validé sur suffisamment de trades',bad:overfit?'Risque de sur-optimisation : PF '+b.pf+' sur '+b.totalTrades+' trades seulement':'Profit Factor faible ('+b.pf+') — stratégie peu rentable'},
            {cond:b.ddKnown&&b.maxDD!=null&&b.maxDD<10, neutral:!b.ddKnown&&b.manualDD==null, good:'Drawdown maîtrisé ('+b.maxDD+'%) — en dessous du seuil critique', bad:b.ddKnown?'Drawdown élevé ('+b.maxDD+'%) — à corriger avant un challenge':'DD absent — verdict impossible sans colonne Balance dans le CSV'},
          ].map((item,i)=>(
            <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:i<2?9:0}}>
              <span style={{color:item.neutral?'#fbbf24':item.cond?'#6ee7b7':'#f87171',fontSize:13,flexShrink:0,marginTop:1}}>{item.neutral?'?':item.cond?'✓':'✕'}</span>
              <div style={{fontSize:12,color:item.neutral?'#fbbf24':item.cond?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.65)',lineHeight:1.4}}>{item.neutral?item.bad:item.cond?item.good:item.bad}</div>
            </div>
          ))}
        </div>

        {/* Rapport expert */}
        <ExpertSection gemini={gemini} gemLoading={gemLoading} localText={localText}/>
      </div>
    );
  }

  return null;
}

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
  // Jours de trading par mois : override récurrence si fourni, sinon calcul standard
  const TD_MONTH_DYNAMIC = p.tdMonthOverride || (p.includeWeekend ? 30 : 21);
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
// INFO TIP — bouton ⓘ avec tooltip intelligent
// Position calculée depuis getBoundingClientRect → jamais coupé
// Style uniforme dans toute l'app : 13px, non-gras, fond #0f1a2e
// ══════════════════════════════════════════════════════════════════
function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, arrowX: 0 });
  const btnRef = { current: null };

  const handleClick = (e) => {
    e.stopPropagation();
    if (!open) {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const TIP_W = 240;
      const MARGIN = 12;
      const vw = window.innerWidth || 375;
      // Centre idéal sur le bouton
      let x = rect.left + rect.width / 2 - TIP_W / 2;
      // Clamp pour rester dans l'écran
      const xClamped = Math.max(MARGIN, Math.min(x, vw - TIP_W - MARGIN));
      // Position de la flèche relative à la bulle
      const arrowX = Math.max(12, Math.min(rect.left + rect.width / 2 - xClamped, TIP_W - 12));
      setPos({ x: xClamped, y: rect.bottom + 8, arrowX });
    }
    setOpen(v => !v);
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", marginLeft: 5, flexShrink: 0 }}>
      <button
        onClick={handleClick}
        style={{
          width: 16, height: 16, borderRadius: "50%",
          background: open ? "rgba(110,231,183,0.22)" : "rgba(255,255,255,0.10)",
          border: "1px solid " + (open ? "#6ee7b7" : "rgba(255,255,255,0.22)"),
          color: open ? "#6ee7b7" : "rgba(255,255,255,0.45)",
          fontSize: 9, fontWeight: 700, lineHeight: 1,
          cursor: "pointer", padding: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "all .15s",
        }}
      >i</button>

      {open && (
        <>
          {/* Overlay fermeture */}
          <div
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            style={{ position: "fixed", inset: 0, zIndex: 998 }}
          />
          {/* Bulle — position fixed, jamais coupée */}
          <div style={{
            position: "fixed",
            left: pos.x,
            top: pos.y,
            width: 240,
            zIndex: 999,
            background: "#0f1a2e",
            border: "1px solid rgba(110,231,183,0.28)",
            borderRadius: 12,
            padding: "11px 13px",
            // Style uniforme dans toute l'app
            fontSize: 13,
            fontWeight: 400,
            color: "rgba(255,255,255,0.82)",
            lineHeight: 1.55,
            boxShadow: "0 8px 28px rgba(0,0,0,0.55)",
          }}>
            {/* Flèche positionnée dynamiquement */}
            <div style={{
              position: "absolute",
              top: -5,
              left: pos.arrowX - 4,
              width: 8, height: 8,
              background: "#0f1a2e",
              border: "1px solid rgba(110,231,183,0.28)",
              borderBottom: "none", borderRight: "none",
              transform: "rotate(45deg)",
            }} />
            {text}
          </div>
        </>
      )}
    </span>
  );
}

function SimulatorScreen({ t = (k) => k, lang = "fr", tab = "challenge", setTab = () => {}, onSimResult = () => {}, displayMode = "advanced", usageType = "propfirm", premiumAccess = true, requirePremium = () => {} }) {
  // Mode avancé = premium. Sans accès → forcé en mode simple (débutant).
  const isSimple = displayMode === "simple" || !premiumAccess;
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
  // ── Récurrence EA ──
  // Jours actifs : "1"=Lun, "2"=Mar, "3"=Mer, "4"=Jeu, "5"=Ven, "6"=Sam, "7"=Dim
  const [activeDays, setActiveDays] = useState(() => {
    const saved = loadPremium(); // réutilise localStorage
    try {
      const r = localStorage.getItem("eapropfirm_activedays");
      return r ? JSON.parse(r) : [1,2,3,4,5]; // Lun-Ven par défaut
    } catch (e) { return [1,2,3,4,5]; }
  });
  const toggleDay = (d) => {
    setActiveDays(prev => {
      const next = prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d];
      const sorted = next.sort((a,b) => a - b);
      try { localStorage.setItem("eapropfirm_activedays", JSON.stringify(sorted)); } catch(e) {}
      // Auto-corriger newsSkipDays si supérieur au nouveau nombre de jours actifs
      const newActiveCount = sorted.filter(x => x <= 5).length; // jours ouvrés actifs
      setNewsSkipDays(prev => {
        const corrected = Math.min(prev, newActiveCount);
        if (corrected !== prev) {
          try { localStorage.setItem("eapropfirm_newsskip", String(corrected)); } catch(e) {}
        }
        return corrected;
      });
      return sorted;
    });
  };
  // Jours d'annonces évités par mois (NFP, FOMC, CPI...)
  const [newsSkipDays, setNewsSkipDays] = useState(() => {
    try {
      const r = localStorage.getItem("eapropfirm_newsskip");
      return r ? parseInt(r) : 0;
    } catch (e) { return 0; }
  });
  const setAndSaveNewsSkip = (v) => {
    // Cap à activeDaysInBase : impossible d'éviter plus de jours que l'EA ne trade
    // activeDaysInBase est défini plus bas dans le composant mais c'est sûr car
    // cette fonction n'est appelée que depuis des event handlers (après le render)
    const maxSkip = typeof activeDaysInBase !== "undefined" ? activeDaysInBase : 7;
    const val = Math.max(0, Math.min(maxSkip, v));
    setNewsSkipDays(val);
    try { localStorage.setItem("eapropfirm_newsskip", String(val)); } catch (e) {}
  };

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
  }, [firmKey, modelKey, capital, riskPct, dailyTargetPct, winrate, tradesPerDay, clusteringPct, maxConsecLosses, split, fundedMonths, instrument, lotSize, slPips, useFixedLot, includeWeekend, activeDays.join(","), newsSkipDays]);

  const firm = PROP_FIRMS[firmKey] || PROP_FIRMS.fundednext;
  const firmModels = firm.models;
  const safeModelKey = firmModels[modelKey] ? modelKey : Object.keys(firmModels)[0];
  const model = firmModels[safeModelKey];
  const dailyTarget = dailyTargetPct / 100;
  const splitRate = split / 100;
  const clustering = clusteringPct / 100;
  const fee = challengeFee(capital);
  const w = winrate / 100;
  // Calcul des jours de trading effectifs par mois selon récurrence EA
  // newsSkipDays = jours évités PAR SEMAINE (pas par mois)
  // ex: 1 = évite 1 jour/semaine → ~4 jours/mois en moins
  const baseWeekDays = includeWeekend ? 7 : 5;
  const activeDaysInBase = activeDays.filter(d => includeWeekend ? d >= 1 : d <= 5).length;
  // Nombre de jours actifs effectifs par semaine (après soustraction news)
  const effectiveActiveDaysPerWeek = Math.max(0, activeDaysInBase - newsSkipDays);
  const activeDayRatio = baseWeekDays > 0 ? effectiveActiveDaysPerWeek / baseWeekDays : 1;
  const tdMonthRecurrence = Math.max(1, Math.round((includeWeekend ? 30 : 21) * activeDayRatio));

  const monthlyTarget = dailyTarget * tdMonthRecurrence;

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
    activeDays,
    newsSkipDays,
    tdMonthOverride: tdMonthRecurrence, // override TD_MONTH dans simulateFunded
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
  // activeDays (array) : on utilise join pour que React détecte les changements
  }, [firmKey, modelKey, capital, riskPct, dailyTargetPct, winrate, tradesPerDay, clusteringPct, maxConsecLosses, splitRate, fundedMonths, seed, useFixedLot, lotSize, slPips, instrument, newsImpact, includeWeekend, activeDays.join(","), newsSkipDays]);

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
    // ── Daily Loss Guardian : pertes restantes avant violation ──
    const lossesLeftDaily = effectiveRiskAmount > 0 ? Math.max(0, Math.floor(dailyDDLimit / effectiveRiskAmount)) : 0;
    const lossesLeftMax = effectiveRiskAmount > 0 ? Math.max(0, Math.floor((ddLimit - simMaxDDAmount) / effectiveRiskAmount)) : 0;
    const dailyConsumedPct = dailyDDLimit > 0 ? Math.min(100, (maxDayLoss / dailyDDLimit) * 100) : 0;
    const maxConsumedPct = ddLimit > 0 ? Math.min(100, (simMaxDDAmount / ddLimit) * 100) : 0;
    const guardMarginPct = 100 - Math.max(dailyConsumedPct, maxConsumedPct);
    const guardMinCapital = capital - (ddLimit - simMaxDDAmount); // plancher = capital - marge restante avant Max DD
    const guardZone = (Math.max(dailyConsumedPct, maxConsumedPct) >= 80) ? "danger"
                     : (Math.max(dailyConsumedPct, maxConsumedPct) >= 50) ? "warning"
                     : "safe";
    return {
      maxDayLoss, maxDayLossPct, ddLimit, dailyDDLimit,
      daysToTotalDD, canBreachDaily,
      simMaxDD, simMaxDDAmount,
      distancePct, distanceAmt,
      safePct: 100 - (simMaxDD / (model.totalDD * 100)) * 100,
      lossesLeftDaily, lossesLeftMax, dailyConsumedPct, maxConsumedPct,
      guardMarginPct, guardMinCapital, guardZone,
    };
  };
  const dda = ddAnalysis();

  // ── Daily Loss Guardian : notification si passage en zone danger ──
  const guardZoneRef = useRef(null);
  useEffect(() => {
    if (!dda || !dda.guardZone) return;
    if (guardZoneRef.current === "danger") { guardZoneRef.current = dda.guardZone; return; } // déjà alerté
    if (dda.guardZone === "danger" && guardZoneRef.current !== "danger") {
      fireNotification(
        "🛑 " + t("guard_title"),
        t("guard_stop_recommended") + " — " + Math.round(Math.max(dda.dailyConsumedPct, dda.maxConsumedPct)) + "% " + t("guard_daily_consumed")
      );
    }
    guardZoneRef.current = dda.guardZone;
  }, [dda?.guardZone]);

  const globalStatus = () => {
    if (!sim) return null;
    for (let i = 0; i < sim.phaseResults.length; i++) {
      const ph = sim.phaseResults[i];
      if (ph && ph.status.startsWith("failed"))
        return { label: "ECHEC - " + model.phases[i].label, color: "#ef4444", bg: "rgba(239,68,68,0.08)", emoji: "ROUGE" };
      if (ph && ph.status === "running_ok")
        return { label: t("sim_phase_inprogress") + " - " + model.phases[i].label, color: "#fbbf24", bg: "rgba(251,191,36,0.08)", emoji: "ORANGE" };
    }
    if (!sim.funded) return null;
    if (sim.funded.status.startsWith("failed"))
      return { label: "COMPTE FERME", color: "#ef4444", bg: "rgba(239,68,68,0.08)", emoji: "ROUGE" };
    return { label: "COMPTE ACTIF", color: "#6ee7b7", bg: "rgba(255,255,255,0.05)", emoji: "VERT" };
  };
  const gs = globalStatus();
  const dot = (e) => e === "VERT" ? "\u{1F7E2}" : e === "ORANGE" ? "\u{1F7E0}" : "\u{1F534}";

  const phaseIcon = (s) => {
    if (s === "passed") return { icon: "\u2713", color: "#6ee7b7", bg: "rgba(255,255,255,0.05)", label: t("sim_phase_passed") };
    if (s === "running_ok") return { icon: "~", color: "#fbbf24", bg: "rgba(251,191,36,0.08)", label: t("sim_phase_running") };
    if (s && s.startsWith("failed")) return { icon: "\u2717", color: "#ef4444", bg: "rgba(239,68,68,0.08)", label: t("sim_phase_failed") };
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
    <div style={{ fontFamily: "-apple-system, sans-serif", color: "#FFFFFF", marginTop: "-16px", marginLeft: "-16px", marginRight: "-16px", paddingLeft: "16px", paddingRight: "16px" }}>
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

      {/* Toggle Challenge / Funded — fixed header bar (figé, immobile) */}
      {(tab === "challenge" || tab === "funded" || tab === "montecarlo") && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 20,
          background: "rgba(6,9,15,0.98)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          paddingTop: "env(safe-area-inset-top)", paddingBottom: "10px",
          paddingLeft: 16, paddingRight: 16,
          borderBottom: "1px solid rgba(110,231,183,0.1)",
          transition: "all 0.2s ease-out",
        }}>
          {/* saveStatus silencieux — pas d'affichage visuel */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, border: "1px solid rgba(255,255,255,0.08)" }}>
            {[{ id: "challenge", label: "Challenge" }, { id: "funded", label: "Funded" }].map(tg => (
              <button key={tg.id} onClick={() => {
                if (tg.id === "funded") {
                  setTab("montecarlo");
                } else {
                  setTab(tg.id);
                  window.scrollTo({ top: 0, behavior: "instant" });
                }
              }} style={{
                flex: 1, padding: "12px 14px", borderRadius: 9, cursor: "pointer", fontSize: 14, fontWeight: 600,
                background: (tab === tg.id || (tg.id === "funded" && tab === "montecarlo")) ? "#6ee7b7" : "transparent",
                color: (tab === tg.id || (tg.id === "funded" && tab === "montecarlo")) ? "#000000" : "rgba(255,255,255,0.65)",
                border: "none", transition: "all .2s", userSelect: "none",
              }}>{tg.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Spacer pour compenser le toggle fixed */}
      <div style={{ height: "calc(env(safe-area-inset-top, 8px) + 54px)" }} />

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
              {bilan ? t("sim_net_result") + " " + fmt2(bilan.net) : "Resultat challenge"}
            </div>
          </div>
          <div style={{ fontSize: 26 }}>{dot(gs.emoji)}</div>
        </div>
      )}

      {/* CARTE DRAWDOWN ESTIME — mode avancé uniquement */}
      {!isSimple && dda && (
        <div className="card" >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
            {t("sim_dd_analysis")}
          </div>

          {/* Jauge DD */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.65)" }}>{t("sim_dd_reached")}</span>
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
              <span style={{ color: "rgba(255,255,255,0.55)" }}>{t("sim_zone_safe")}</span>
              <span style={{ color: "#fbbf24" }}>{t("sim_attention")}</span>
              <span style={{ color: "#ef4444" }}>{t("sim_danger")}</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="kpi">
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{t("sim_max_loss_day")}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24" }}>{dda.maxDayLossPct.toFixed(2)}%</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{fmt2(dda.maxDayLoss)}</div>
            </div>
            <div className="kpi">
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{t("sim_days_full_dd")}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>{dda.daysToTotalDD}j</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>avant limite {(model.totalDD*100)}%</div>
            </div>
            <div className="kpi">
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{t("sim_dd_breachable")}</div>
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
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{t("sim_margin_left")}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: dda.distancePct > 5 ? "#6ee7b7" : "#ef4444" }}>
                {dda.distancePct > 0 ? dda.distancePct.toFixed(2) + "%" : t("sim_exceeded")}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{dda.distancePct > 0 ? fmt2(dda.distanceAmt) + " " + t("sim_remaining") : t("sim_account_closed")}</div>
            </div>
          </div>

          <div style={{ marginTop: 10, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "8px 10px", fontSize: 11, lineHeight: 1.5 }}>
            <span style={{ color: "rgba(255,255,255,0.65)" }}>Lecture : </span>
            {dda.canBreachDaily
              ? <span style={{ color: "#ef4444" }}>{t("sim_dd_warn_pre")} {tradesPerDay} {t("sim_dd_warn_mid")} {riskPct}% {t("sim_dd_warn_end")}</span>
              : <span style={{ color: "#6ee7b7" }}>{t("sim_dd_safe_pre")} {(model.dailyDD*100)}% {t("sim_dd_safe_mid")} ({dda.maxDayLossPct.toFixed(2)}% {t("sim_dd_safe_end")} {dda.daysToTotalDD}{t("sim_dd_safe_end2")}</span>
            }
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          🛡️ DAILY LOSS GUARDIAN — garde-fou DD temps réel
          Fonctionne avec toutes les Prop Firms (model.dailyDD/totalDD dynamiques)
      ══════════════════════════════════════════════════════════ */}
      {!isSimple && (() => {
        const zoneColor = dda.guardZone === "danger" ? "#ef4444" : dda.guardZone === "warning" ? "#fbbf24" : "#6ee7b7";
        const zoneBg = dda.guardZone === "danger" ? "rgba(239,68,68,0.08)" : dda.guardZone === "warning" ? "rgba(251,191,36,0.08)" : "rgba(110,231,183,0.06)";
        const zoneLabel = dda.guardZone === "danger" ? t("guard_zone_danger") : dda.guardZone === "warning" ? t("guard_zone_warning") : t("guard_zone_safe");
        const zoneEmoji = dda.guardZone === "danger" ? "🔴" : dda.guardZone === "warning" ? "🟡" : "🟢";
        const maxConsumed = Math.max(dda.dailyConsumedPct, dda.maxConsumedPct);
        const recoText = dda.guardZone === "danger" ? t("guard_stop_recommended") : dda.guardZone === "warning" ? t("guard_stay_alert") : t("guard_all_clear");
        const lossesLeftText = dda.lossesLeftDaily === 0 ? t("guard_zero_left")
          : dda.lossesLeftDaily === 1 ? t("guard_one_loss_left")
          : `${t("guard_n_losses_left").includes("Encore") ? "" : ""}${dda.lossesLeftDaily} ${t("guard_n_losses_left")}`;
        return (
          <div className="card" style={{ border: `1.5px solid ${zoneColor}40`, background: zoneBg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                  🛡️ {t("guard_title")}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{t("guard_subtitle")}</div>
              </div>
              <div style={{ padding: "6px 12px", borderRadius: 10, background: zoneColor + "22", border: `1px solid ${zoneColor}55`, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{zoneEmoji}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: zoneColor }}>{zoneLabel}</span>
              </div>
            </div>

            {/* Jauge visuelle temps réel — 3 zones */}
            <div style={{ position: "relative", height: 14, borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,0.06)", marginBottom: 4 }}>
              <div style={{ position: "absolute", inset: 0, display: "flex" }}>
                <div style={{ width: "50%", background: "rgba(110,231,183,0.25)" }} />
                <div style={{ width: "30%", background: "rgba(251,191,36,0.25)" }} />
                <div style={{ width: "20%", background: "rgba(239,68,68,0.25)" }} />
              </div>
              <div style={{
                position: "absolute", top: 0, left: 0, height: "100%",
                width: Math.min(100, maxConsumed) + "%",
                background: zoneColor, transition: "width .4s ease, background .4s ease",
                boxShadow: `0 0 8px ${zoneColor}99`,
              }} />
              <div style={{ position: "absolute", left: "50%", top: 0, height: "100%", width: 1, background: "rgba(0,0,0,0.3)" }} />
              <div style={{ position: "absolute", left: "80%", top: 0, height: "100%", width: 1, background: "rgba(0,0,0,0.3)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>
              <span>0%</span><span>50%</span><span>80%</span><span>100%</span>
            </div>

            {/* Message recommandation */}
            <div style={{ padding: "9px 12px", borderRadius: 10, background: zoneColor + "15", marginBottom: 12, textAlign: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: zoneColor }}>{recoText}</span>
            </div>

            {/* Pertes restantes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>{t("guard_daily_limit")}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: dda.lossesLeftDaily <= 1 ? "#ef4444" : dda.lossesLeftDaily <= 2 ? "#fbbf24" : "#6ee7b7" }}>
                  {dda.lossesLeftDaily}
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{t("guard_losses_left_daily")}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>{t("guard_total_limit")}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: dda.lossesLeftMax <= 1 ? "#ef4444" : dda.lossesLeftMax <= 3 ? "#fbbf24" : "#6ee7b7" }}>
                  {dda.lossesLeftMax}
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{t("guard_losses_left_max")}</div>
              </div>
            </div>

            {/* % consommé + marge + plancher capital */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: "rgba(255,255,255,0.55)" }}>{dda.dailyConsumedPct.toFixed(0)}% {t("guard_daily_consumed")}</span>
                <span style={{ color: "rgba(255,255,255,0.55)" }}>{dda.maxConsumedPct.toFixed(0)}% {t("guard_max_consumed")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{t("guard_margin_left")}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: zoneColor }}>{Math.max(0, dda.guardMarginPct).toFixed(0)}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{t("guard_min_capital")}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{fmt2(Math.max(0, dda.guardMinCapital))}</span>
              </div>
            </div>

            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
              {t("guard_based_on")} {effectiveRiskAmount ? fmt2(effectiveRiskAmount) : ""} · {tradesPerDay} {t("guard_trades_day")}
            </div>
          </div>
        );
      })()}

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
          <span style={{ fontSize: 11, fontWeight: 700, color: clColor, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center" }}>{t("sim_clustering_losses")}<InfoTip text="Simule le réalisme psychologique : les pertes arrivent-elles en séries ? 0% = trades indépendants (théorique). 40-60% = réaliste. Plus c'est élevé, plus tu vivras de longues séries noires." /></span>
          <span style={{ fontSize: 24, fontWeight: 700, color: clColor }}>{clusteringPct}%</span>
        </div>
        <input type="range" min={0} max={100} step={5} value={clusteringPct} onChange={e => setClusteringPct(parseInt(e.target.value))} />
        <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
          0% = trades independants (theorique). Plus c'est haut, plus les pertes arrivent en
          <b style={{ color: clColor }}> {t("sim_black_series")}</b>. Recommande : 35-50%.
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
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>{t("sim_enable")}</span>
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
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginBottom: 3, fontWeight: 700 }}>{t("sim_instrument")}</div>
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
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>{t("sim_lot_suggested")}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{instInfo.label} · SL {slPips} pips</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#6ee7b7" }}>{suggestedLot}</div>
          </div>
        )}

        {/* Métriques statistiques avancées — mode avancé uniquement */}
        {!isSimple && <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{t("sim_calc_stats")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { l: t("sim_exp_trade"), v: (expectedPerTrade >= 0 ? "+" : "") + fmt2(expectedPerTrade), c: expectedPerTrade >= 0 ? "#6ee7b7" : "#f87171" },
              { l: t("sim_exp_day"), v: (expectedDailyPnL >= 0 ? "+" : "") + fmt2(expectedDailyPnL), c: expectedDailyPnL >= 0 ? "#6ee7b7" : "#f87171" },
              { l: t("sim_pf_theo"), v: theoreticalPF >= 99 ? "∞" : theoreticalPF, c: theoreticalPF >= 1.5 ? "#6ee7b7" : theoreticalPF >= 1 ? "#fbbf24" : "#ef4444" },
              { l: "Edge (R)", v: (expectancyR >= 0 ? "+" : "") + expectancyR + "R", c: expectancyR > 0 ? "#6ee7b7" : "#ef4444" },
              { l: "Kelly optimal", v: (kellyFraction * 100).toFixed(1) + "%", c: "rgba(255,255,255,0.85)" },
              { l: t("sim_dd_expected"), v: expectedMaxDDPct.toFixed(1) + "%", c: expectedMaxDDPct > (model.totalDD * 100 * 0.7) ? "#ef4444" : expectedMaxDDPct > (model.totalDD * 100 * 0.4) ? "#fbbf24" : "#6ee7b7" },
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
                {t("sim_weekend_included")}
                <InfoTip text={"La plupart des prop firms ferment le forex le weekend (marché fermé). Active uniquement si tu trades du crypto le weekend (FTMO, FundingPips l'autorisent). Désactivé = lundi à vendredi (21 jours/mois)."} />
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2, lineHeight: 1.4 }}>
                {includeWeekend
                  ? t("sim_weekend_7d")
                  : t("sim_weekend_5d")}
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
          {includeWeekend && (
            <div style={{ marginTop: 6, background: "rgba(110,231,183,0.06)", border: "1px solid rgba(110,231,183,0.18)", borderRadius: 12, padding: "7px 10px", fontSize: 10, color: "#6ee7b7", lineHeight: 1.5 }}>
              ⚠️ Vérifie les règles de ta prop firm : le forex est fermé le weekend. Le weekend ne s'applique qu'au crypto/indices 24/7 selon les firms.
            </div>
          )}
        </div>

        {/* ══════ RÉCURRENCE EA ══════ */}
        <div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>

          {/* Label section */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 5 }}>
                {t("sim_recurrence")}
                <InfoTip text={"Configure les jours où ton EA trade réellement et les journées d'annonces qu'il évite. Impacte directement le nombre de jours tradés/mois dans la simulation."} />
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                {tdMonthRecurrence} jour{tdMonthRecurrence > 1 ? "s" : ""} tradé{tdMonthRecurrence > 1 ? "s" : ""}/mois estimé{tdMonthRecurrence > 1 ? "s" : ""}
                {newsSkipDays > 0 && <span style={{ color: "#fbbf24" }}> · {newsSkipDays}j annonces évités</span>}
              </div>
            </div>
          </div>

          {/* Jours de trading actifs */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 7, fontWeight: 600 }}>
              {t("sim_days_ea_trades")}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { d: 1, label: "Lu" },
                { d: 2, label: "Ma" },
                { d: 3, label: "Me" },
                { d: 4, label: "Je" },
                { d: 5, label: "Ve" },
                { d: 6, label: "Sa" },
                { d: 7, label: "Di" },
              ].map(({ d, label }) => {
                const isWeekend = d >= 6;
                const active = activeDays.includes(d);
                const disabled = isWeekend && !includeWeekend;
                return (
                  <button
                    key={d}
                    onClick={() => { if (!disabled) toggleDay(d); }}
                    style={{
                      flex: 1, height: 36, borderRadius: 9,
                      background: active && !disabled
                        ? (isWeekend ? "rgba(251,191,36,0.18)" : "rgba(110,231,183,0.18)")
                        : "rgba(255,255,255,0.04)",
                      border: active && !disabled
                        ? ("1.5px solid " + (isWeekend ? "#fbbf24" : "#6ee7b7"))
                        : "1.5px solid rgba(255,255,255,0.08)",
                      color: disabled
                        ? "rgba(255,255,255,0.12)"
                        : (active ? (isWeekend ? "#fbbf24" : "#6ee7b7") : "rgba(255,255,255,0.35)"),
                      fontSize: 11, fontWeight: 700, cursor: disabled ? "default" : "pointer",
                      transition: "all .15s",
                    }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jours d'annonces évités */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                {t("sim_news_avoided_week")}
              </div>
              <InfoTip text={"Nombre de jours/semaine où ton EA ne trade pas à cause des grosses annonces. Ex : NFP tous les 1ers vendredis → 1j/semaine ce vendredi-là. FOMC ~1 fois/mois. 0 = pas de filtre."} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Stepper */}
              <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, height: 40, overflow: "hidden", flex: 1 }}>
                <button
                  onClick={() => setAndSaveNewsSkip(newsSkipDays - 1)}
                  style={{ width: 40, height: "100%", background: "transparent", border: "none", color: newsSkipDays > 0 ? "#fbbf24" : "rgba(255,255,255,0.15)", fontSize: 20, cursor: newsSkipDays > 0 ? "pointer" : "default", flexShrink: 0 }}>
                  −
                </button>
                <div style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 700, color: newsSkipDays > 0 ? "#fbbf24" : "rgba(255,255,255,0.35)" }}>
                  {newsSkipDays}
                </div>
                <button
                  onClick={() => setAndSaveNewsSkip(newsSkipDays + 1)}
                  style={{ width: 40, height: "100%", background: newsSkipDays < activeDaysInBase ? "rgba(251,191,36,0.10)" : "rgba(255,255,255,0.03)", border: "none", color: newsSkipDays < activeDaysInBase ? "#fbbf24" : "rgba(255,255,255,0.15)", fontSize: 20, cursor: newsSkipDays < activeDaysInBase ? "pointer" : "default", flexShrink: 0 }}>
                  +
                </button>
              </div>
              {/* Annonces de référence */}
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", lineHeight: 1.6, flex: 1 }}>
                NFP: 1j<br/>FOMC: ~1j<br/>CPI+PPI: 2j
              </div>
            </div>
            {newsSkipDays > 0 && (
              <div style={{ marginTop: 7, fontSize: 10, color: "rgba(251,191,36,0.7)", lineHeight: 1.4 }}>
                Ton EA évite {newsSkipDays}j/semaine (~{Math.round(newsSkipDays * 4.33)}j/mois) → simulation sur {tdMonthRecurrence}j/mois.
              </div>
            )}
          </div>
        </div>
      </div>}

      {/* Bandeau mode débutant — affiché uniquement en mode simple */}
      {isSimple && (
        <div style={{ background:"rgba(110,231,183,0.06)", border:"1px solid rgba(110,231,183,0.15)", borderRadius:14, padding:"12px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 16V9" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 9C9 5 5 4 4 5c0 3 3 4 5 4" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 12c0-3 4-4 5-3 0 3-3 4-5 4" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#6ee7b7" }}>{t("sim_beginner_active")}</div>
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
            {t("sim_define_risk")}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* Capital */}
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginBottom: 3, fontWeight: 700 }}>{t("sim_capital_label")}</div>
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
            { label: t("sim_trades_day"), tip: t("tip_tradesday"), val: tradesPerDay, set: (v) => setTradesPerDay(Math.round(v)), min: 1, max: 15, step: 1 },
            { label: t("sim_target_day"), tip: t("tip_targetday"), val: dailyTargetPct, set: setDailyTargetPct, min: 0.05, max: 1.5, step: 0.05 },
            { label: t("sim_split"), tip: t("tip_split"), val: split, set: setSplit, min: 80, max: 95, step: 5 },
            { label: t("sim_funded_months"), tip: t("tip_fundedmonths"), val: fundedMonths, set: setFundedMonths, min: 1, max: 60, step: 1 },
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
            {copied ? t("sim_copied") : t("sim_copy_report")}
          </button>
          <button onClick={printReport}
            style={{ flex: 1, padding: 9, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#FFFFFF", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Imprimer / PDF
          </button>
        </div>
        {/* C4 — Estimation de réalisme */}
        <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 10, fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, textAlign: "center" }}>
          {t("sim_real_results")}
        </div>
      </div>

      {/* BILAN FINANCIER NET */}
      {bilan && (
        <div className="card" style={{ border: "1px solid rgba(110,231,183,0.10)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{t("sim_balance_net")}</div>
          {[
            { label: t("sim_reward_challenge") + " (" + (model.rewardPct||15) + "%)", val: "+" + fmt2(bilan.reward), color: "#6ee7b7" },
            { label: t("sim_payouts_paid"), val: "+" + fmt2(bilan.payout), color: "#6ee7b7" },
            { label: t("sim_pending_unpaid"), val: "+" + fmt2(bilan.pending), color: "rgba(255,255,255,0.55)" },
            { label: t("sim_challenge_fees"), val: "-" + fmt2(bilan.fee), color: "#ef4444" },
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
      <button onClick={() => { if (!premiumAccess) { requirePremium(); return; } saveCurrentConfig(); }} disabled={!premiumAccess ? false : !configChanged} style={{
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
            {t("sim_save_config")}{!premiumAccess && " 🔒"}
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
          <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 400, fontSize: 12 }}>{t("sim_raise_wr")}</span>
        </div>
      )}

      {/* TAB CHALLENGE */}
      {tab === "challenge" && sim && (
        <div>
          {model.phases.map((ph, i) => {
            const data = sim.phaseResults[i];
            const color = i === 0 ? "#6ee7b7" : "rgba(255,255,255,0.55)";
            return (
              <div className="card" key={i} style={{ position: "relative" }}>
                {/* Lock premium sur les résultats détaillés (winrate, taux de réussite) */}
                {!premiumAccess && data && (
                  <LockOverlay onUnlock={requirePremium} label={lang === "en" ? "Unlock your real success rate" : lang === "es" ? "Desbloquea tu tasa de éxito real" : "Débloque ton taux de réussite réel"} />
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{ph.label} - Objectif +{(ph.target * 100)}%</div>
                  {data ? (
                    !premiumAccess ? (
                      <span className="tag" style={{ background: "rgba(110,231,183,0.1)", color: "#6ee7b7", border: "1px solid rgba(110,231,183,0.3)" }}>🔒 Premium</span>
                    ) : (
                    <span className="tag" style={{ background: phaseIcon(data.status).bg, color: phaseIcon(data.status).color }}>
                      {phaseIcon(data.status).icon} {phaseIcon(data.status).label}
                    </span>
                    )
                  ) : (
                    <span className="tag" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.08)" }}>VERROUILLE</span>
                  )}
                </div>
                {data ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                      <div className="kpi">
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{t("sim_days")}</div>
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
            <button onClick={() => { if (!premiumAccess) { requirePremium(); return; } setTab("montecarlo"); }} style={{
              width: "100%", padding: 15, marginTop: 4, borderRadius: 12, cursor: "pointer",
              background: "#6ee7b7", color: "#000000", fontSize: 15, fontWeight: 600,
              border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(110,231,183,0.25)",
            }}>
              {t("sim_view_funded")}{!premiumAccess && " 🔒"}
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
              {t("sim_funded_need_challenge")}
            </div>
            <button onClick={() => setTab("challenge")} style={{ marginTop: 14, padding: "11px 20px", borderRadius: 10, background: "#6ee7b7", color: "#000", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
              {t("sim_go_challenge")}
            </button>
          </div>
          )
        ) : !sim.funded || !sim.allPassed ? (
          tab === "montecarlo" ? null : (
          <div className="card" style={{ textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 14 }}>
              {!sim.allPassed
                ? t("sim_challenge_not_validated")
                : t("sim_funded_not_generated")}
            </div>
            <button onClick={() => setTab("challenge")} style={{ padding: "11px 20px", borderRadius: 10, background: "rgba(255,255,255,0.07)", color: "#6ee7b7", fontSize: 13, fontWeight: 700, border: "1px solid rgba(110,231,183,0.25)", cursor: "pointer" }}>
              {t("sim_back_challenge2")}
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
                {t('mt_back_challenge')}
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
            <div id="sim-funded-section" style={{ scrollMarginTop: 80 }} />
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
                  { label: t("sim_payouts_cashed"), val: fmt(sim.funded.cumulPayout), color: "#6ee7b7" },
                  { label: t("sim_pending"), val: fmt2(sim.funded.pendingPayout), color: "rgba(255,255,255,0.55)" },
                  { label: t("sim_balance"), val: fmt(sim.funded.finalEquity), color: "rgba(255,255,255,0.85)" },
                  { label: t("sim_winning_months"), val: sim.funded.winMonths + "/" + (sim.funded.winMonths + sim.funded.lossMonths), color: sim.funded.winrateMonth >= 60 ? "#6ee7b7" : "#fbbf24" },
                  { label: t("sim_scaling"), val: sim.funded.scalingCount + "x (+40%)", color: "rgba(255,255,255,0.55)" },
                  { label: t("sim_final_split"), val: sim.funded.finalSplit + "%", color: sim.funded.finalSplit >= 90 ? "#6ee7b7" : "#fbbf24" },
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

            {/* CALENDRIER PnL — jours skippés répartis aléatoirement selon la récurrence EA */}
            <CalendrierPnL t={t} lang={lang} dailyLog={sim.funded.dailyLog} newsSkipDays={newsSkipDays} activeDays={activeDays} />

            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#fbbf24" }}>{t("sim_detail_monthly")}</div>
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
          <MonteCarloTab t={t} firmKey={firmKey} modelKey={safeModelKey} capital={capital} p={p} fundedMonths={fundedMonths}
            splitRate={splitRate} winrate={winrate} fee={fee} clusteringPct={clusteringPct} />
        </div>
      )}

      {/* TAB MES TRADES */}
      {tab === "trades" && (
        <MesTradesTab t={t} lang={lang} sim={sim} capital={capital} fundedMonths={fundedMonths} winrate={winrate} riskPct={riskPct} dailyTargetPct={dailyTargetPct} model={model} finalRR={finalRR} tradesPerDay={tradesPerDay} firm={firm} effectiveRiskAmount={effectiveRiskAmount} />
      )}

      <div style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.08)", marginTop: 12, paddingBottom: 8 }}>
        {firm.name} {model.name} - Simulation indicative - Pas une garantie
      </div>
    </div>
  );
}

function MonteCarloTab({ firmKey, modelKey, capital, p, fundedMonths, splitRate, winrate, fee, clusteringPct, t = (k)=>k }) {
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
            { l: t("sim_mc_survive"), v: res.survRate + "%", c: rate_color(+res.survRate) },
            { l: t("sim_mc_profitable"), v: res.profRate + "%", c: rate_color(+res.profRate) },
          ].map(k => (
            <div key={k.l} className="kpi">
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{k.l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 8 }}>{t("sim_mc_distribution")}</div>
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
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>{t("sim_mc_dd_avg")} <b style={{ color: "#fbbf24" }}>{res.avgDD}%</b></div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>{t("sim_mc_fees")} <b style={{ color: "#ef4444" }}>{fmt(-fee)}</b></div>
        </div>
        <div style={{ marginTop: 8, padding: "7px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 10, fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5, textAlign: "center" }}>
          {t("sim_real_results")}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// PARSE DATE — robuste multi-formats MT4/MT5 (best-effort, retourne null si échec)
// Formats gérés : "2026.06.15 14:32:10", "2026-06-15 14:32", "15/06/2026 14:32", "06/15/2026"
// ══════════════════════════════════════════════════════════════════
function parseTradeDate(raw) {
  if (!raw) return null;
  const s = raw.trim();
  // Format MT4/MT5 natif : YYYY.MM.DD HH:MM[:SS]
  let m = s.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +(m[6]||0));
  // Format ISO : YYYY-MM-DD HH:MM[:SS]
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +(m[6]||0));
  // Format DD/MM/YYYY HH:MM
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (m) return new Date(+m[3], +m[2]-1, +m[1], +m[4], +m[5]);
  // Dernier recours : laisser le moteur natif tenter
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// ══════════════════════════════════════════════════════════════════
// MOTEUR D'ANALYSE AUTOMATIQUE MT5 — analyse comportementale + détection de patterns
// Reçoit la liste de trades parsés (avec profit, parsedDate, symbol si dispo)
// Retourne : stats globales, forces, faiblesses, recommandations, score/100
// ══════════════════════════════════════════════════════════════════
function mt5Analyze(trades, initBalance) {
  if (!trades || trades.length < 5) return null;
  const DAY_NAMES = [AL('day_sun'), AL('day_mon'), AL('day_tue'), AL('day_wed'), AL('day_thu'), AL('day_fri'), AL('day_sat')];

  const wins = trades.filter(t => t.profit > 0);
  const losses = trades.filter(t => t.profit < 0);
  const n = trades.length;
  const winrate = (wins.length / n) * 100;
  const grossWin = wins.reduce((s,t)=>s+t.profit,0);
  const grossLoss = Math.abs(losses.reduce((s,t)=>s+t.profit,0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : (grossWin > 0 ? 99 : 0);
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;

  // ── Drawdown (équité reconstituée) ──
  let bal = initBalance || trades[0].balance - trades[0].profit || 1000;
  let peak = bal, maxDD = 0, maxDDAmt = 0;
  trades.forEach(t => {
    bal = t.balance != null ? t.balance : bal + t.profit;
    if (bal > peak) peak = bal;
    const dd = peak > 0 ? ((peak - bal) / peak) * 100 : 0;
    if (dd > maxDD) { maxDD = dd; maxDDAmt = peak - bal; }
  });

  // ── Séries gagnantes / perdantes ──
  let curWinStreak = 0, maxWinStreak = 0, curLossStreak = 0, maxLossStreak = 0;
  let streaks = []; // historique des séries perdantes (pour détecter le pattern "PF chute après N pertes")
  trades.forEach(t => {
    if (t.profit > 0) {
      curWinStreak++; maxWinStreak = Math.max(maxWinStreak, curWinStreak);
      if (curLossStreak > 0) streaks.push(curLossStreak);
      curLossStreak = 0;
    } else if (t.profit < 0) {
      curLossStreak++; maxLossStreak = Math.max(maxLossStreak, curLossStreak);
      curWinStreak = 0;
    }
  });
  if (curLossStreak > 0) streaks.push(curLossStreak);

  // ── Détection "PF chute après N pertes consécutives" (revenge trading proxy) ──
  // On regarde le profit moyen des trades qui suivent une série de 3+ pertes
  let afterStreakTrades = [], normalTrades = [];
  let runningLossStreak = 0;
  for (let i = 0; i < trades.length; i++) {
    if (runningLossStreak >= 3 && trades[i]) afterStreakTrades.push(trades[i]);
    else if (trades[i]) normalTrades.push(trades[i]);
    if (trades[i].profit < 0) runningLossStreak++; else runningLossStreak = 0;
  }
  const afterStreakWR = afterStreakTrades.length ? (afterStreakTrades.filter(t=>t.profit>0).length / afterStreakTrades.length) * 100 : null;
  const revengeTradingDetected = afterStreakTrades.length >= 5 && afterStreakWR !== null && afterStreakWR < winrate - 15;

  // ── Analyse temporelle (heures / jours) — nécessite parsedDate ──
  const withDates = trades.filter(t => t.parsedDate);
  const hasTimeData = withDates.length >= n * 0.5; // au moins 50% des trades datés
  let hourStats = {}, dayStats = {};
  if (hasTimeData) {
    withDates.forEach(t => {
      const h = t.parsedDate.getHours();
      const d = t.parsedDate.getDay();
      if (!hourStats[h]) hourStats[h] = { trades: 0, profit: 0, wins: 0 };
      hourStats[h].trades++; hourStats[h].profit += t.profit; if (t.profit > 0) hourStats[h].wins++;
      if (!dayStats[d]) dayStats[d] = { trades: 0, profit: 0, wins: 0 };
      dayStats[d].trades++; dayStats[d].profit += t.profit; if (t.profit > 0) dayStats[d].wins++;
    });
  }
  const totalLossAmt = grossLoss || 1;
  const totalProfitAmt = grossWin || 1;
  const dayList = Object.entries(dayStats).map(([d, s]) => ({
    day: DAY_NAMES[+d], dayIdx: +d, ...s,
    wr: s.trades ? (s.wins / s.trades) * 100 : 0,
    pctOfLosses: s.profit < 0 ? (Math.abs(s.profit) / totalLossAmt) * 100 : 0,
    pctOfProfit: s.profit > 0 ? (s.profit / totalProfitAmt) * 100 : 0,
  })).sort((a,b) => a.profit - b.profit);
  const bestDay = dayList.length ? dayList[dayList.length-1] : null;
  const worstDay = dayList.length ? dayList[0] : null;

  const hourList = Object.entries(hourStats).map(([h, s]) => ({
    hour: +h, ...s, wr: s.trades ? (s.wins / s.trades) * 100 : 0,
  })).sort((a,b) => a.profit - b.profit);
  const bestHour = hourList.length ? hourList[hourList.length-1] : null;
  const worstHour = hourList.length ? hourList[0] : null;

  // ── Analyse par instrument ──
  const withSymbol = trades.filter(t => t.symbol);
  const hasSymbolData = withSymbol.length >= n * 0.5;
  let symbolStats = {};
  if (hasSymbolData) {
    withSymbol.forEach(t => {
      if (!symbolStats[t.symbol]) symbolStats[t.symbol] = { trades: 0, profit: 0, wins: 0 };
      symbolStats[t.symbol].trades++; symbolStats[t.symbol].profit += t.profit; if (t.profit > 0) symbolStats[t.symbol].wins++;
    });
  }
  const symbolList = Object.entries(symbolStats).map(([sym, s]) => ({
    symbol: sym, ...s, wr: s.trades ? (s.wins / s.trades) * 100 : 0,
    pctOfProfit: s.profit > 0 ? (s.profit / totalProfitAmt) * 100 : 0,
    pctOfLosses: s.profit < 0 ? (Math.abs(s.profit) / totalLossAmt) * 100 : 0,
  })).sort((a,b) => b.profit - a.profit);
  const bestSymbol = symbolList.length ? symbolList[0] : null;
  const worstSymbol = symbolList.length ? symbolList[symbolList.length-1] : null;

  // ── Overtrading : trades/jour anormalement élevé (proxy : >8 trades le même jour calendaire) ──
  let overtradingDays = 0;
  if (hasTimeData) {
    const byCalDay = {};
    withDates.forEach(t => {
      const key = t.parsedDate.toDateString();
      byCalDay[key] = (byCalDay[key] || 0) + 1;
    });
    overtradingDays = Object.values(byCalDay).filter(c => c > 8).length;
  }
  const overtradingDetected = overtradingDays >= 3;

  // ── Sous-utilisation du risque : volume très variable ou risque moyen < 0.3% du capital ──
  const withVolume = trades.filter(t => t.volume != null);
  let underRiskDetected = false;
  if (avgLoss > 0 && initBalance) {
    const avgRiskPct = (avgLoss / initBalance) * 100;
    underRiskDetected = avgRiskPct < 0.3 && avgRiskPct > 0;
  }

  // ──────────────────────────────────────────────────────────────
  // SCORE GLOBAL /100 — pondération multi-facteurs
  // ──────────────────────────────────────────────────────────────
  let score = 0;
  // Profit Factor (35 pts max)
  score += profitFactor >= 2 ? 35 : profitFactor >= 1.5 ? 28 : profitFactor >= 1.2 ? 20 : profitFactor >= 1 ? 10 : 0;
  // Winrate (15 pts max)
  score += winrate >= 55 ? 15 : winrate >= 45 ? 11 : winrate >= 35 ? 6 : 2;
  // Drawdown maîtrisé (20 pts max)
  score += maxDD <= 5 ? 20 : maxDD <= 10 ? 15 : maxDD <= 15 ? 8 : maxDD <= 25 ? 3 : 0;
  // RR moyen (15 pts max)
  score += avgRR >= 2 ? 15 : avgRR >= 1.5 ? 11 : avgRR >= 1 ? 7 : 2;
  // Discipline (pas de revenge trading / overtrading) (15 pts max)
  score += (!revengeTradingDetected ? 8 : 0) + (!overtradingDetected ? 7 : 0);
  score = Math.round(Math.max(0, Math.min(100, score)));

  // ──────────────────────────────────────────────────────────────
  // FORCES / FAIBLESSES / RECOMMANDATIONS
  // ──────────────────────────────────────────────────────────────
  const forces = [], weaknesses = [], recommendations = [];

  if (profitFactor >= 1.5) forces.push({ title: AL('mt5_pf_strong'), detail: `PF ${profitFactor.toFixed(2)}` });
  if (winrate >= 50) forces.push({ title: AL('mt5_wr_strong'), detail: `${winrate.toFixed(0)}%` });
  if (maxDD <= 10) forces.push({ title: AL('mt5_dd_controlled'), detail: `${maxDD.toFixed(1)}%` });
  if (avgRR >= 1.5) forces.push({ title: AL('mt5_rr_strong'), detail: `1:${avgRR.toFixed(2)}` });
  if (bestSymbol && bestSymbol.pctOfProfit >= 30) forces.push({ title: AL('mt5_symbol_strong'), detail: `${bestSymbol.symbol} → ${bestSymbol.pctOfProfit.toFixed(0)}% ${AL('mt5_of_gains')}` });

  if (profitFactor < 1.2) weaknesses.push({ title: AL('mt5_pf_weak'), detail: `PF ${profitFactor.toFixed(2)}` });
  if (maxDD > 15) weaknesses.push({ title: AL('mt5_dd_high'), detail: `${maxDD.toFixed(1)}%` });
  if (revengeTradingDetected) weaknesses.push({ title: AL('mt5_revenge'), detail: `WR ${afterStreakWR.toFixed(0)}% ${AL('mt5_after_streak')}` });
  if (overtradingDetected) weaknesses.push({ title: AL('mt5_overtrading'), detail: `${overtradingDays} ${AL('mt5_days_over8')}` });
  if (underRiskDetected) weaknesses.push({ title: AL('mt5_underrisk'), detail: AL('mt5_underrisk_detail') });
  if (worstDay && worstDay.pctOfLosses >= 30) weaknesses.push({ title: AL('mt5_bad_day'), detail: `${worstDay.day} → ${worstDay.pctOfLosses.toFixed(0)}% ${AL('mt5_of_losses')}` });
  if (worstHour && worstHour.trades >= 5 && worstHour.wr < winrate - 15) weaknesses.push({ title: AL('mt5_bad_hour'), detail: `${worstHour.hour}h → WR ${worstHour.wr.toFixed(0)}%` });
  if (worstSymbol && worstSymbol.profit < 0 && worstSymbol.pctOfLosses >= 25) weaknesses.push({ title: AL('mt5_bad_symbol'), detail: `${worstSymbol.symbol} → ${worstSymbol.pctOfLosses.toFixed(0)}% ${AL('mt5_of_losses')}` });

  if (revengeTradingDetected) recommendations.push(AL('mt5_reco_revenge'));
  if (overtradingDetected) recommendations.push(AL('mt5_reco_overtrading'));
  if (worstDay && worstDay.pctOfLosses >= 30) recommendations.push(`${AL('mt5_reco_avoid_day')} ${worstDay.day}`);
  if (worstHour && worstHour.wr < winrate - 15 && worstHour.trades >= 5) recommendations.push(`${AL('mt5_reco_avoid_hour')} ${worstHour.hour}h`);
  if (worstSymbol && worstSymbol.pctOfLosses >= 25) recommendations.push(`${AL('mt5_reco_avoid_symbol')} ${worstSymbol.symbol}`);
  if (underRiskDetected) recommendations.push(AL('mt5_reco_underrisk'));
  if (maxLossStreak >= 4) recommendations.push(`${AL('mt5_reco_streak')} ${maxLossStreak} ${AL('mt5_reco_streak2')}`);
  if (recommendations.length === 0) recommendations.push(AL('mt5_reco_keep_going'));

  return {
    n, winrate, profitFactor, avgRR, avgWin, avgLoss, maxDD, maxDDAmt,
    maxWinStreak, maxLossStreak,
    hasTimeData, hasSymbolData,
    bestDay, worstDay, bestHour, worstHour, bestSymbol, worstSymbol,
    dayList, hourList, symbolList,
    revengeTradingDetected, overtradingDetected, overtradingDays, underRiskDetected,
    afterStreakWR,
    score, forces, weaknesses, recommendations,
  };
}

// ══════════════════════════════════════════════════════════════════
// MOTEUR DE DÉCISION — "Puis-je lancer ce challenge ?"
// Synthétise verdict (Monte Carlo/PF/WR/DD/échantillon) en un verdict
// final 🟢🟡🔴 avec raisons précises et score /100.
// Fonctionne avec tout résultat de computeVerdictSync (CSV ou backtest).
// ══════════════════════════════════════════════════════════════════
function canLaunchChallenge(verdict) {
  if (!verdict) return null;
  const reasons = [];      // raisons négatives précises (pourquoi pas / attendre)
  const positives = [];    // raisons positives (pourquoi c'est bon)
  let score = 0;

  const pf = parseFloat(verdict.realPF) || 0;
  const wr = parseFloat(verdict.realWR) || 0;
  const rr = parseFloat(verdict.realRR) || 0;
  const dd = verdict.ddUnreliable ? null : parseFloat(verdict.maxDD);
  const mc = verdict.passPct; // probabilité Monte Carlo (peut être null)
  const tooFewTrades = verdict.tooFewTrades;
  const nTrades = verdict.metrics?.totalTrades || 0;

  // ── 1. Profit Factor (25 pts) ──
  if (pf >= 1.8) { score += 25; positives.push(AL('dec_pf_strong')); }
  else if (pf >= 1.3) { score += 18; positives.push(AL('dec_pf_ok')); }
  else if (pf >= 1.0) { score += 8; reasons.push(AL('dec_pf_weak')); }
  else { score += 0; reasons.push(AL('dec_pf_negative')); }

  // ── 2. Winrate / RR cohérence (15 pts) ──
  if (wr >= 45 && rr >= 1.2) { score += 15; positives.push(AL('dec_wr_rr_balanced')); }
  else if (wr >= 35) { score += 9; }
  else { score += 3; reasons.push(AL('dec_wr_low')); }

  // ── 3. Drawdown (25 pts) — pénalité forte si DD inconnu ──
  if (dd === null) { score += 0; reasons.push(AL('dec_dd_unknown')); }
  else if (dd <= 5) { score += 25; positives.push(AL('dec_dd_excellent')); }
  else if (dd <= 8) { score += 18; positives.push(AL('dec_dd_good')); }
  else if (dd <= 10) { score += 10; reasons.push(AL('dec_dd_borderline')); }
  else { score += 0; reasons.push(AL('dec_dd_too_high')); }

  // ── 4. Échantillon statistique (15 pts) ──
  if (tooFewTrades || nTrades < 30) { score += 3; reasons.push(AL('dec_sample_insufficient')); }
  else if (nTrades < 100) { score += 10; positives.push(AL('dec_sample_ok')); }
  else { score += 15; positives.push(AL('dec_sample_strong')); }

  // ── 5. Monte Carlo (20 pts) — le facteur le plus déterminant ──
  if (mc === null || mc === undefined) { score += 0; reasons.push(AL('dec_mc_unavailable')); }
  else if (mc >= 75) { score += 20; positives.push(AL('dec_mc_favorable')); }
  else if (mc >= 50) { score += 12; reasons.push(AL('dec_mc_moderate')); }
  else { score += 0; reasons.push(AL('dec_mc_unfavorable')); }

  score = Math.round(Math.max(0, Math.min(100, score)));

  // ── Verdict final 🟢🟡🔴 ──
  let verdictLevel, verdictLabel, verdictColor, verdictEmoji;
  // Blocages immédiats : DD réel trop élevé, DD inconnu, ou échantillon trop faible pour décider
  const hasBlockingIssue = (dd !== null && dd > 10) || dd === null || tooFewTrades || nTrades < 20;
  if (hasBlockingIssue || score < 35) {
    verdictLevel = "red"; verdictLabel = AL('dec_dont_launch'); verdictColor = "#ef4444"; verdictEmoji = "🔴";
  } else if (score < 65) {
    verdictLevel = "yellow"; verdictLabel = AL('dec_wait'); verdictColor = "#fbbf24"; verdictEmoji = "🟡";
  } else {
    verdictLevel = "green"; verdictLabel = AL('dec_launch'); verdictColor = "#6ee7b7"; verdictEmoji = "🟢";
  }

  return { score, verdictLevel, verdictLabel, verdictColor, verdictEmoji, reasons, positives, pf, wr, rr, dd, mc, nTrades };
}

function MesTradesTab({ sim, capital, fundedMonths, winrate, riskPct, dailyTargetPct, model, finalRR, tradesPerDay, firm, effectiveRiskAmount, t = (k) => k, lang = "fr" }) {
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
  // DD max saisi manuellement par l'utilisateur (quand non calculable depuis le fichier)
  const [manualDD, setManualDD] = useState(saved0.manualDD ?? null);
  // ── Moteur d'analyse automatique MT5 (calculé à chaque changement de trades) ──
  setALLang(lang);
  const mt5Analysis = trades.length >= 5 ? mt5Analyze(trades, effectiveInitBalance) : null;
  const [manualDDInput, setManualDDInput] = useState("");
  const [geminiVerdict, setGeminiVerdict] = useState(null);
  const [geminiVerdictLoading, setGeminiVerdictLoading] = useState(false);
  const geminiVerdictRef = useRef(null); // évite les appels multiples
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    try { localStorage.setItem("eapropfirm_trades", JSON.stringify({ trades, filename, initBalance, balanceReconstructed, manualDD })); } catch (e) {}
  }, [trades, filename, initBalance, balanceReconstructed, manualDD]);


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
    // Colonnes additionnelles pour le moteur d'analyse avancé (symbole, volume) — best-effort, n'affecte rien si absent
    const symbolIdx = cols.findIndex(c => c.includes('symbol') || c.includes('instrument') || c.trim() === 'item');
    const volumeIdx = cols.findIndex(c => c.includes('volume') || c.includes('lots') || c.trim() === 'size');
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
      const timeRaw = (timeIdx >= 0 ? row[timeIdx] : '').trim();
      const symbolRaw = (symbolIdx >= 0 ? row[symbolIdx] : '').trim().toUpperCase();
      const volumeRaw = volumeIdx >= 0 ? parseFloat(row[volumeIdx]) : null;
      parsed.push({
        idx: i, time: timeRaw, type: (typeIdx >= 0 ? row[typeIdx] : '').trim(), profit: netProfit, balance,
        symbol: symbolRaw || null, volume: (volumeRaw && !isNaN(volumeRaw)) ? volumeRaw : null,
        parsedDate: parseTradeDate(timeRaw),
      });
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
  const computeVerdictSync = (trds, initBal, ddReliable = true, manualDDOverride = null) => {
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
    const computedDD = isTrailing ? maxDDTrailing : Math.max(0, maxDDAbsolute);
    const ddLimitPct = model.totalDD * 100;

    // ── Fiabilité du DD ──
    // Le DD calculé est non fiable si : balance reconstruite OU 0% malgré des pertes
    const hasLosses = losses.length > 0;
    const ddIsZeroButLosses = computedDD < 0.01 && hasLosses;
    const computedDDUnreliable = !ddReliable || ddIsZeroButLosses;

    // Si l'utilisateur a saisi un DD manuel, il PRIME et rend le DD fiable
    const hasManualDD = manualDDOverride !== null && manualDDOverride >= 0;
    const maxDD = hasManualDD ? manualDDOverride : computedDD;
    const ddUnreliable = hasManualDD ? false : computedDDUnreliable;
    const ddSource = hasManualDD ? "manuel" : "calculé";

    // ── Phases déjà franchies dans le backtest (lecture factuelle) ──
    const finalProfit = (trds[trds.length - 1].balance - initBal) / initBal * 100;
    const phasesTargets = model.phases.map(ph => ph.target * 100);
    const phasesPassed = phasesTargets.filter(tgt => finalProfit >= tgt).length;
    const totalPhases = phasesTargets.length;

    // ── Violation de règle DÉTECTÉE dans le backtest réel ──
    const ddViolated = maxDD >= ddLimitPct;

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
    if (ddUnreliable) factors.push({ t: `Drawdown non calculable — données de balance manquantes ou incohérentes`, c: "#fbbf24" });
    else if (ddViolated) factors.push({ t: `DD réel ${maxDD.toFixed(1)}% DÉPASSE la limite ${ddLimitPct}% — échec sur ces données`, c: "#ef4444" });
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

    if (ddUnreliable) {
      // PRIORITÉ ABSOLUE : sans données de drawdown fiables, aucun verdict possible.
      // On ne devine PAS un résultat favorable à partir d'une information manquante.
      label = "DONNÉES DD MANQUANTES";
      color = "#fbbf24";
      bg = "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(6,9,15,0.98))";
      icon = "WARN";
      displayPct = null; // pas de probabilité affichée
      verdictReason = ddIsZeroButLosses
        ? `Drawdown réel impossible à calculer : le fichier montre 0% de DD malgré ${losses.length} trades perdants. Les balances intermédiaires manquent ou sont agrégées. Importe un export avec la colonne Balance trade par trade pour un verdict fiable.`
        : `Le fichier ne contient pas les balances trade par trade nécessaires au calcul du drawdown. Sans cette donnée, impossible de valider le respect des règles prop firm. Ajoute la colonne Balance/Equity à ton export.`;
    } else if (ddViolated) {
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
    // Plafond de prudence : jamais 100% (sauf si null = données manquantes)
    if (displayPct !== null) displayPct = Math.min(displayPct, 95);

    return {
      passPct: displayPct, matchScore, label, color, bg, icon, factors, verdictReason,
      realWR: (realWR*100).toFixed(0), realRR: realRR.toFixed(2), realPF: realPF.toFixed(2),
      maxDD: maxDD.toFixed(2), maxDDTrailing: maxDDTrailing.toFixed(2), maxDDAbsolute: Math.max(0, maxDDAbsolute).toFixed(2),
      ddViolated, ddLimitPct, finalProfit: finalProfit.toFixed(2),
      phasesPassed, totalPhases, isTrailing,
      isLosing, isUnprofitable, reachedFirstTarget, firstPhaseTarget, tooFewTrades,
      ddUnreliable, ddIsZeroButLosses, ddSource, hasManualDD,
    };
  };

  // ── Appel Gemini silencieux APRÈS computeVerdictSync (ordre correct) ──
  useEffect(() => {
    if (!trades.length || !model) return;
    const v = computeVerdictSync(trades, effectiveInitBalance, !balanceReconstructed, manualDD);
    if (!v) return;
    const vKey = `${v.label}_${v.realWR}_${v.realPF}_${v.maxDD}_${trades.length}`;
    if (geminiVerdictRef.current === vKey) return;
    geminiVerdictRef.current = vKey;
    setGeminiVerdict(null);
    setGeminiVerdictLoading(true);
    callGeminiVerdict(v, sim, lang).then(r => {
      setGeminiVerdictLoading(false);
      if (r) setGeminiVerdict(r);
    });
  }, [trades.length, balanceReconstructed, manualDD]);

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
      // Extraire le vrai jour du mois depuis la chaîne de date
      // Formats supportés : YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, YYYY.MM.DD, DD.MM.YYYY
      let realDayOfMonth = null;
      if (d.date && (d.date.includes('-') || d.date.includes('/') || d.date.includes('.'))) {
        const norm = d.date.replace(/[./]/g, '-').split(' ')[0]; // "2024-01-15" ou "15-01-2024"
        const parts = norm.split('-');
        if (parts.length >= 3) {
          const p0 = parseInt(parts[0]);
          const p2 = parseInt(parts[2]);
          if (p0 > 31) {
            // YYYY-MM-DD → jour = parts[2]
            if (p2 >= 1 && p2 <= 31) realDayOfMonth = p2;
          } else {
            // DD-MM-YYYY → jour = parts[0]
            if (p0 >= 1 && p0 <= 31) realDayOfMonth = p0;
          }
        }
      }
      const hasRealDate = realDayOfMonth !== null;
      return { globalDay: d.dayIdx, month, dayOfMonth: hasRealDate ? realDayOfMonth : d.dayIdx,
               hasRealDate, pnl: +pnl.toFixed(2), equity: +equity.toFixed(2), wins, losses, breached: false };
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
  // Le DD n'est fiable que si la balance vient du fichier (pas reconstruite depuis les profits)
  const verdict = trades.length > 0 && stats
    ? computeVerdictSync(trades, effectiveInitBalance, !balanceReconstructed, manualDD)
    : null;
  // ── "Puis-je lancer ce challenge ?" — décision finale 🟢🟡🔴 ──
  const decision = verdict ? canLaunchChallenge(verdict) : null;

  const alertColor = (l) => l === "danger" ? "#ef4444" : l === "warning" ? "#fbbf24" : l === "ok" ? "#6ee7b7" : "rgba(255,255,255,0.55)";
  const alertBg = (l) => l === "danger" ? "rgba(239,68,68,0.08)" : l === "warning" ? "rgba(251,191,36,0.08)" : l === "ok" ? "rgba(255,255,255,0.05)" : "#0c1a3d";
  const alertIcon = (l) => null; // icônes gérées par border-left couleur

  return (
    <div>
      {/* ══════════════════════════════════════════════════════════
          🎯 "PUIS-JE LANCER CE CHALLENGE ?" — écran de décision
          Synthèse PF/WR/RR/DD/Échantillon/Monte Carlo → verdict 🟢🟡🔴
      ══════════════════════════════════════════════════════════ */}
      <div className="card" style={{ border: decision ? `1.5px solid ${decision.verdictColor}55` : "1px solid rgba(255,255,255,0.08)", background: decision ? decision.verdictColor + "0c" : "rgba(255,255,255,0.03)" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>🎯 {t("dec_title")}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{t("dec_subtitle")}</div>
        </div>

        {!decision ? (
          <div style={{ textAlign: "center", padding: "20px 10px", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
            {t("dec_import_first")}
          </div>
        ) : (
          <>
            {/* Verdict principal */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke={decision.verdictColor} strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={`${2*Math.PI*30*(decision.score/100)} ${2*Math.PI*30}`}
                    transform="rotate(-90 36 36)" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: decision.verdictColor }}>{decision.score}</span>
                  <span style={{ fontSize: 7, color: "rgba(255,255,255,0.4)" }}>/100</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5 }}>{t("dec_score_label")}</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: decision.verdictColor, display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 22 }}>{decision.verdictEmoji}</span> {decision.verdictLabel}
                </div>
              </div>
            </div>

            {/* Métriques clés */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                [t("dec_pf_metric"), decision.pf.toFixed(2)],
                [t("dec_wr_metric"), decision.wr.toFixed(0) + "%"],
                [t("dec_rr_metric"), "1:" + decision.rr.toFixed(2)],
                [t("dec_dd_metric"), decision.dd !== null ? decision.dd.toFixed(1) + "%" : "?"],
                [t("dec_sample_metric"), decision.nTrades + " " + t("dec_trades_unit")],
                [t("dec_mc_metric"), decision.mc !== null && decision.mc !== undefined ? decision.mc + "%" : "N/A"],
              ].map(([label, val], i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{val}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Pourquoi ce verdict — raisons précises */}
            {(decision.reasons.length > 0 || decision.positives.length > 0) && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 8 }}>{t("dec_why")}</div>
                {decision.positives.map((p, i) => (
                  <div key={"p"+i} style={{ display: "flex", gap: 7, alignItems: "flex-start", padding: "4px 0" }}>
                    <span style={{ color: "#6ee7b7", fontSize: 11, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>{p}</span>
                  </div>
                ))}
                {decision.reasons.map((r, i) => (
                  <div key={"r"+i} style={{ display: "flex", gap: 7, alignItems: "flex-start", padding: "4px 0" }}>
                    <span style={{ color: decision.verdictColor, fontSize: 11, flexShrink: 0 }}>✗</span>
                    <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── UPLOAD : CSV + HTML ── */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
          {t("mt_import_history")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>📊 {t("mt_csv_text")}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{t("mt_csv_instr")}<br/>{t("mt_csv_instr2")}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>🌐 {t("mt_backtest_html")}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{t("mt_html_instr")}</div>
          </div>
        </div>
        <label style={{ display: "block", background: "rgba(255,255,255,0.05)", border: "2px dashed #2d2d3d", borderRadius: 10, padding: "16px", textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
          <div style={{ fontSize: 13, color: "#6ee7b7", fontWeight: 700 }}>
            {filename ? filename : t("mt_csv_formats")}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
            {trades.length > 0 ? trades.length + " " + t("mt_trades_loaded") : t("mt_no_file")}
          </div>
          <input type="file" accept=".csv,.txt,.tsv,.html,.htm" onChange={handleFile} style={{ display: "none" }} />
        </label>
        {parseError && <div style={{ marginTop: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: 10, fontSize: 12, color: "#fca5a5" }}>{parseError}</div>}
        {trades.length > 0 && (
          <button onClick={() => { setTrades([]); setFilename(null); setAlerts([]); setVerdict(null); try { localStorage.removeItem("eapropfirm_trades"); } catch (e) {} }}
            style={{ marginTop: 8, width: "100%", padding: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, color: "#fca5a5", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {t("mt_clear_data")}
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
              {t("mt_no_balance_dd")}
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
              { l: t("mt_rr_real"), v: "1:" + stats.rr.toFixed(2), c: "#FFFFFF" },
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
                  {`Analyse Backtest · ${firm?.name || ""}`}
                </div>
                <div style={{ fontSize: 19, fontWeight: 700, color: verdict.color, lineHeight: 1.1 }}>
                  <VerdictIcon icon={verdict.icon} /> {verdict.label}
                </div>
              </div>
              {/* Cercle probabilité */}
              <div style={{ textAlign: "center", flexShrink: 0, marginLeft: 12 }}>
                <div style={{ width: 68, height: 68, borderRadius: 34, background: verdict.color + "20", border: "3px solid " + verdict.color, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: verdict.passPct === null ? 26 : 19, fontWeight: 700, color: verdict.color, lineHeight: 1 }}>{verdict.passPct === null ? "?" : "~" + verdict.passPct + "%"}</div>
                  <div style={{ fontSize: 7, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>{verdict.passPct === null ? "incertain" : "estimation"}</div>
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

            {/* ── SAISIE MANUELLE DU DD (si non calculable) ── */}
            {verdict.ddUnreliable && (
              <div style={{ background: "rgba(110,231,183,0.05)", border: "1px solid rgba(110,231,183,0.2)", borderRadius: 10, padding: "12px 13px", marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6ee7b7", marginBottom: 4 }}>
                  Tu connais ton drawdown max ?
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginBottom: 10 }}>
                  Saisis le DD max de ton backtest (visible dans ton rapport MT4/MT5 ou ta prop firm) pour débloquer le verdict complet.
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="Ex : 6.5"
                      value={manualDDInput}
                      onChange={e => setManualDDInput(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(110,231,183,0.25)", borderRadius: 10, color: "#fff", padding: "11px 32px 11px 12px", fontSize: 15, fontWeight: 700, outline: "none" }}
                    />
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>%</span>
                  </div>
                  <button
                    onClick={() => {
                      const v = parseFloat(manualDDInput);
                      if (!isNaN(v) && v >= 0 && v <= 100) { setManualDD(v); setManualDDInput(""); }
                    }}
                    disabled={!manualDDInput || isNaN(parseFloat(manualDDInput)) || parseFloat(manualDDInput) < 0 || parseFloat(manualDDInput) > 100}
                    style={{
                      padding: "11px 18px", borderRadius: 10, border: "none", flexShrink: 0,
                      background: (manualDDInput && !isNaN(parseFloat(manualDDInput)) && parseFloat(manualDDInput) >= 0 && parseFloat(manualDDInput) <= 100) ? "#6ee7b7" : "rgba(255,255,255,0.1)",
                      color: (manualDDInput && !isNaN(parseFloat(manualDDInput)) && parseFloat(manualDDInput) >= 0 && parseFloat(manualDDInput) <= 100) ? "#000" : "rgba(255,255,255,0.35)",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}>
                    Valider
                  </button>
                </div>
                <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                  Le DD saisi sera utilisé tel quel pour évaluer le respect de la limite {verdict.ddLimitPct}%.
                </div>
              </div>
            )}

            {/* Badge DD saisi manuellement */}
            {verdict.hasManualDD && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(110,231,183,0.06)", border: "1px solid rgba(110,231,183,0.18)", borderRadius: 10, padding: "9px 12px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                  DD saisi manuellement : <span style={{ color: "#6ee7b7", fontWeight: 700 }}>{manualDD}%</span>
                </div>
                <button onClick={() => setManualDD(null)} style={{ fontSize: 11, color: "#f87171", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  Retirer
                </button>
              </div>
            )}

            {/* Lecture factuelle du backtest */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>"Phases atteintes (backtest)"</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: verdict.phasesPassed >= verdict.totalPhases ? "#6ee7b7" : "rgba(255,255,255,0.85)" }}>
                  {verdict.phasesPassed} / {verdict.totalPhases}
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>profit final {verdict.finalProfit >= 0 ? "+" : ""}{verdict.finalProfit}%</div>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>DD max observé ({verdict.isTrailing ? "trailing" : "absolu"})</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: verdict.ddUnreliable ? "#fbbf24" : verdict.ddViolated ? "#ef4444" : parseFloat(verdict.maxDD) > verdict.ddLimitPct * 0.7 ? "#fbbf24" : "#6ee7b7" }}>
                  {verdict.ddUnreliable ? "N/A" : verdict.maxDD + "%"}
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{verdict.ddUnreliable ? "donnée manquante" : "limite " + verdict.ddLimitPct + "%"}</div>
              </div>
            </div>

            {/* Score de cohérence */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{t("mt_coherence_sim")}</span>
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
                { l: t("mt_wr_real"), v: verdict.realWR + "%", expected: winrate + "%", ok: parseFloat(verdict.realWR) >= winrate - 5 },
                { l: t("mt_rr_real"), v: "1:" + verdict.realRR, expected: "1:" + (finalRR || "-").toString().slice(0,4), ok: parseFloat(verdict.realRR) >= (finalRR || 0) * 0.85 },
                { l: t("mt_pf_real"), v: verdict.realPF, expected: "≥ 1.5", ok: parseFloat(verdict.realPF) >= 1.5 },
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

            {/* ── VALIDATION INDÉPENDANTE (filtre de cohérence silencieux) ── */}
            {(geminiVerdictLoading || geminiVerdict) && (
              <div style={{ marginTop: 10, padding: "13px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(110,231,183,0.12)", borderRadius: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>
                    🔬 {t('mt_indep_validation')}
                  </div>
                  {geminiVerdict?.confidenceLevel && (
                    <div style={{ padding: "2px 8px", borderRadius: 8, fontSize: 9, fontWeight: 700,
                      background: geminiVerdict.confidenceLevel === 'ÉLEVÉ' ? 'rgba(110,231,183,0.12)' : geminiVerdict.confidenceLevel === 'MODÉRÉ' ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)',
                      color: geminiVerdict.confidenceLevel === 'ÉLEVÉ' ? '#6ee7b7' : geminiVerdict.confidenceLevel === 'MODÉRÉ' ? '#fbbf24' : '#ef4444',
                    }}>
                      {t('mt_confidence')} {geminiVerdict.confidenceLevel}
                    </div>
                  )}
                </div>

                {geminiVerdictLoading && !geminiVerdict ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[85, 70, 55].map((w, i) => (
                      <div key={i} style={{ height: 9, borderRadius: 5, background: "rgba(255,255,255,0.06)", width: w + "%" }} />
                    ))}
                  </div>
                ) : geminiVerdict ? (
                  <>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.65, marginBottom: 10 }}>
                      {geminiVerdict.validationSummary}
                    </div>
                    {geminiVerdict.confidenceReason && (
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontStyle: "italic", marginBottom: 8 }}>
                        {geminiVerdict.confidenceReason}
                      </div>
                    )}
                    {geminiVerdict.watchpoints?.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
                        {geminiVerdict.watchpoints.map((wp, i) => (
                          <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                            <span style={{ color: "#fbbf24", fontSize: 10, flexShrink: 0, marginTop: 1 }}>⚡</span>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{wp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════
              🤖 MOTEUR D'ANALYSE AUTOMATIQUE MT5
              Winrate, PF, RR, DD, séries, horaires, jours, instruments
              + détection revenge trading / overtrading / sous-risque
          ══════════════════════════════════════════════════════ */}
          {mt5Analysis && (() => {
            const m = mt5Analysis;
            const scoreColor = m.score >= 75 ? "#6ee7b7" : m.score >= 55 ? "#fbbf24" : m.score >= 35 ? "#f97316" : "#ef4444";
            const scoreLabel = m.score >= 75 ? t("mt5_score_excellent") : m.score >= 55 ? t("mt5_score_good") : m.score >= 35 ? t("mt5_score_average") : t("mt5_score_weak");
            return (
              <div className="card" style={{ border: "1px solid rgba(110,231,183,0.12)" }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>🤖 {t("mt5_title")}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{t("mt5_subtitle")} · {m.n} {t("mt5_trades_analyzed")}</div>
                </div>

                {/* Score global /100 */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, padding: "12px 14px", background: scoreColor + "12", borderRadius: 14, border: `1px solid ${scoreColor}33` }}>
                  <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                    <svg width="64" height="64" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                      <circle cx="32" cy="32" r="27" fill="none" stroke={scoreColor} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${2*Math.PI*27*(m.score/100)} ${2*Math.PI*27}`}
                        transform="rotate(-90 32 32)" />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: scoreColor }}>{m.score}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5 }}>{t("mt5_score_title")}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor }}>{scoreLabel}</div>
                  </div>
                </div>

                {/* Stats globales */}
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 8 }}>{t("mt5_global_stats")}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                  {[
                    [t("mt5_winrate"), m.winrate.toFixed(0) + "%"],
                    [t("mt5_pf"), m.profitFactor.toFixed(2)],
                    [t("mt5_avg_rr"), "1:" + m.avgRR.toFixed(2)],
                    [t("mt5_max_dd"), m.maxDD.toFixed(1) + "%"],
                    [t("mt5_win_streak"), m.maxWinStreak],
                    [t("mt5_loss_streak"), m.maxLossStreak],
                  ].map(([label, val], i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{val}</div>
                      <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Horaires & jours rentables */}
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 8 }}>{t("mt5_time_analysis")}</div>
                {m.hasTimeData ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {m.bestDay && <div style={{ background: "rgba(110,231,183,0.06)", borderRadius: 10, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{t("mt5_best_day")}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7" }}>{m.bestDay.day}</div>
                    </div>}
                    {m.worstDay && <div style={{ background: "rgba(239,68,68,0.06)", borderRadius: 10, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{t("mt5_worst_day")}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>{m.worstDay.day}{m.worstDay.pctOfLosses >= 10 ? ` (${m.worstDay.pctOfLosses.toFixed(0)}%)` : ""}</div>
                    </div>}
                    {m.bestHour && <div style={{ background: "rgba(110,231,183,0.06)", borderRadius: 10, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{t("mt5_best_hour")}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7" }}>{m.bestHour.hour}h</div>
                    </div>}
                    {m.worstHour && <div style={{ background: "rgba(239,68,68,0.06)", borderRadius: 10, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{t("mt5_worst_hour")}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>{m.worstHour.hour}h</div>
                    </div>}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 16, fontStyle: "italic" }}>{t("mt5_no_time_data")}</div>
                )}

                {/* Instruments rentables */}
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 8 }}>{t("mt5_instrument_analysis")}</div>
                {m.hasSymbolData ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {m.bestSymbol && <div style={{ background: "rgba(110,231,183,0.06)", borderRadius: 10, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{t("mt5_best_instrument")}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7" }}>{m.bestSymbol.symbol}</div>
                    </div>}
                    {m.worstSymbol && m.worstSymbol.symbol !== m.bestSymbol?.symbol && <div style={{ background: "rgba(239,68,68,0.06)", borderRadius: 10, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{t("mt5_worst_instrument")}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>{m.worstSymbol.symbol}</div>
                    </div>}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 16, fontStyle: "italic" }}>{t("mt5_no_symbol_data")}</div>
                )}

                {/* Forces */}
                {m.forces.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#6ee7b7", textTransform: "uppercase", marginBottom: 6 }}>✅ {t("mt5_forces")}</div>
                    {m.forces.map((f, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < m.forces.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{f.title}</span>
                        <span style={{ fontSize: 11, color: "#6ee7b7", fontWeight: 700 }}>{f.detail}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Points faibles */}
                {m.weaknesses.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", marginBottom: 6 }}>⚠️ {t("mt5_weaknesses")}</div>
                    {m.weaknesses.map((w, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < m.weaknesses.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{w.title}</span>
                        <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>{w.detail}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommandations */}
                {m.recommendations.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 6 }}>📈 {t("mt5_recommendations")}</div>
                    {m.recommendations.map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", padding: "5px 0" }}>
                        <span style={{ color: "#6ee7b7", fontSize: 10, flexShrink: 0, marginTop: 2 }}>→</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

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
            <div style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>{t("mt_real_vs_sim")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", textAlign: "center", paddingBottom: 4 }}>Indicateur</div>
              <div style={{ fontSize: 10, color: "#6ee7b7", textAlign: "center", fontWeight: 700 }}>{t("mt_real")}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textAlign: "center", fontWeight: 700 }}>{t("mt_simulation")}</div>
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
              { label: t("mt_rr_real"), real: "1:" + stats.rr.toFixed(2), sim2: finalRR ? "1:" + finalRR.toFixed(2) : "-", ok: stats.rr >= (finalRR || 0) * 0.85 },
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
                {t("mt_equity_real_sim")}
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
            <CalendrierPnL t={t} lang={lang} dailyLog={dailyLogReel} realMode={true} />
          )}

          {/* ── TABLEAU MENSUEL — 100% calculé depuis trades importés ── */}
          {monthlyReel.length > 0 && (
            <div className="card" style={{ border: "1px solid rgba(110,231,183,0.12)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                {t("sim_monthly_detail")} — Backtest réel
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
          📓 {t("cal_journal_title")}
        </div>
        <div style={{ flex: 1, height: 1, background: "rgba(110,231,183,0.15)" }} />
      </div>

      {/* Toggle affichage journal */}
      <div className="card" style={{ border: "1px solid rgba(110,231,183,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>{t("mt_my_journal")}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
              {t("mt_journal_desc")}
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
                {Object.keys(jMonthData).length} {t("cal_days_entered")}
              </span>
            </div>
            <CalendrierPnL t={t} lang={lang}
              dailyLog={[]}
              journalMode={true}
              journalData={jMonthData}
              onJournalSave={saveJEntry}
              journalMonthLabel={t("cal_click_day") + " · " + jMonth}
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

function CalendrierPnL({ dailyLog, journalMode = false, journalData = {}, onJournalSave = null, journalMonthLabel = null, newsSkipDays = 0, activeDays = [1,2,3,4,5], t = (k) => k, lang = "fr", realMode = false }) {
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [editingDay, setEditingDay] = useState(null); // jour en cours d'édition (mode journal)
  const [formWins, setFormWins] = useState(0);
  const [formLosses, setFormLosses] = useState(0);
  const [formGainAbs, setFormGainAbs] = useState(""); // valeur absolue (toujours positive)
  const [formGainSign, setFormGainSign] = useState(1); // +1 ou -1
  const [formImages, setFormImages] = useState([]);
  const [viewerImg, setViewerImg] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgDateWarn, setImgDateWarn] = useState(null); // alerte doublon potentiel

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
    // ── Mode backtest RÉEL : les vrais jours du fichier, sans scatter ──
    // Chaque trade est placé à sa vraie date calendaire (si disponible).
    // Les cases vides = vrais jours sans trade dans le backtest.
    // AUCUN algo aléatoire — on n'invente pas de jours non tradés.
    if (realMode) {
      const hasDates = monthDays.some(d => d.hasRealDate);
      if (hasDates) {
        // Placement par vraie date : chaque case = jour réel du mois
        const dayMap = {};
        monthDays.forEach(d => { dayMap[d.dayOfMonth] = d; });
        for (let dayNum = 1; dayNum <= 28; dayNum++) {
          const dow = (dayNum - 1) % 7;
          const isWeekend = dow >= 5;
          const data = dayMap[dayNum];
          if (data) {
            grid.push({ dayNum, trading: true, data });
          } else {
            grid.push({ dayNum, trading: false, data: null, isEmptyWeekday: !isWeekend });
          }
        }
      } else {
        // Pas de vraies dates : placement séquentiel pur, sans scatter ni case vide artificielle
        let tradingIdx = 0;
        for (let dayNum = 1; dayNum <= 28; dayNum++) {
          const dow = (dayNum - 1) % 7;
          const isWeekend = dow >= 5;
          if (!isWeekend && tradingIdx < monthDays.length) {
            grid.push({ dayNum, trading: true, data: monthDays[tradingIdx++] });
          } else {
            grid.push({ dayNum, trading: false, data: null, isEmptyWeekday: !isWeekend });
          }
        }
      }
      return grid;
    }

    // ── Mode simulation : grille 28 jours avec répartition ALÉATOIRE des jours skippés ──
    // Les jours d'annonces (NFP, FOMC, CPI...) ne tombent pas toujours le même jour
    // → On utilise un PRNG seedé par le numéro de mois pour répartir les skips
    // Logique professionnelle : chaque semaine, newsSkipDays jours actifs sont choisis
    // aléatoirement comme "jours d'annonces" → vides sur le calendrier.

    // PRNG déterministe (sin-based) — seedé par numéro de mois pour cohérence
    const prng = (n) => {
      const x = Math.sin(selectedMonth * 9301 + n * 49297 + 233280) * 233280;
      return x - Math.floor(x);
    };

    // Jours actifs EA (0=Lun..4=Ven, exclure weekends)
    const eaDows = new Set((activeDays || [1,2,3,4,5]).filter(d => d >= 1 && d <= 5).map(d => d - 1));

    let tradingIdx = 0;
    for (let week = 0; week < 4; week++) {
      // Pour cette semaine : choisir aléatoirement quels jours actifs sont des "news days"
      const eaActiveArr = Array.from(eaDows); // [0,1,2,3,4] par défaut
      const skipCount = Math.min(newsSkipDays, eaActiveArr.length);

      // Fisher-Yates shuffle seedé → résultat différent par semaine ET par mois
      const shuffled = [...eaActiveArr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(prng(selectedMonth * 1000 + week * 100 + i) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const skipDowsThisWeek = new Set(shuffled.slice(0, skipCount));

      // Construire les 7 cases de la semaine
      for (let d = 0; d < 7; d++) {
        const dayNum = week * 7 + d + 1;
        const isWeekend = d >= 5;
        const isEaActive = eaDows.has(d);
        const isNewsSkip = skipDowsThisWeek.has(d);

        if (isWeekend) {
          // Weekend : case très sombre (le calendrier affiche toujours Sam/Dim)
          grid.push({ dayNum, trading: false, data: null, isEmptyWeekday: false });
        } else if (!isEaActive || isNewsSkip) {
          // Jour non tradé : EA ne trade pas ce jour OU c'est un jour d'annonce
          grid.push({ dayNum, trading: false, data: null, isEmptyWeekday: true });
        } else if (tradingIdx < monthDays.length) {
          // Jour tradé avec données de simulation
          grid.push({ dayNum, trading: true, data: monthDays[tradingIdx] });
          tradingIdx++;
        } else {
          // Fin des données de simulation → case vide (fin de mois)
          grid.push({ dayNum, trading: false, data: null, isEmptyWeekday: true });
        }
      }
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
              ? (journalMonthLabel || t("cal_click_day"))
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
          { label: t("cal_pnl_month"), val: (monthPnl >= 0 ? "+$" : "-$") + Math.abs(monthPnl).toFixed(0), color: monthPnl >= 0 ? "#4ade80" : "#f87171" },
          { label: "Jours +/-", val: winDays + "j / " + lossDays + "j", color: "#FFFFFF" },
          { label: t("cal_best"), val: (bestDay >= 0 ? "+$" : "-$") + Math.abs(bestDay).toFixed(0), color: bestDay >= 0 ? "#4ade80" : "#f87171" },
          { label: t("cal_worst"), val: (worstDay >= 0 ? "+$" : "-$") + Math.abs(worstDay).toFixed(0), color: worstDay >= 0 ? "#4ade80" : "#f87171" },
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
          // Style : jour tradé (données) | jour vide ouvrable | weekend
          const c = (cell.trading && hasData)
            ? cellColor(cell.data.pnl)
            : cell.isEmptyWeekday
              ? { bg: "rgba(255,255,255,0.02)", fg: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.07)", numColor: "rgba(255,255,255,0.2)" }
              : { bg: "#0d0d15", fg: "rgba(255,255,255,0.03)", border: "1px solid #12121a", numColor: "rgba(255,255,255,0.04)" };
          const isWeekend = journalMode ? cell.isWeekendDay : !cell.trading && !cell.isEmptyWeekday;
          // En mode journal : TOUTES les cases sont cliquables (weekend inclus)
          const clickable = journalMode && cell.trading;
          const emptyJournalCell = journalMode && cell.trading && !hasData;
          return (
            <div key={i}
              onClick={() => {
                if (!clickable) return;
                const existing = journalData[String(cell.dayNum)];
                setEditingDay(cell.dayNum);
                setFormWins(existing ? existing.wins : 0);
                setFormLosses(existing ? existing.losses : 0);
                const existingPnl = existing ? existing.pnl : 0;
                setFormGainAbs(existingPnl !== 0 ? String(Math.abs(existingPnl)) : "");
                setFormGainSign(existingPnl < 0 ? -1 : 1);
                setFormImages(existing && existing.images ? existing.images : []);
                setImgDateWarn(null);
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
              {/* Case vide en mode simulation : jour non tradé (EA recurrence/news skip) */}
              {!journalMode && cell.isEmptyWeekday && !hasData && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.15)", lineHeight: 1 }}>—</span>
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
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.75)",
            // Aligner en HAUT → clavier iOS s'ouvre EN DESSOUS du formulaire
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "calc(env(safe-area-inset-top, 16px) + 12px)",
            paddingLeft: 16, paddingRight: 16,
            overflowX: "hidden",
          }}>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 430,
              background: "#12121a",
              border: "1px solid rgba(110,231,183,0.22)",
              borderRadius: 20,
              overflowX: "hidden", // bloque tout scroll horizontal
              display: "flex",
              flexDirection: "column",
            }}>

            {/* ── HEADER ── */}
            <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 32, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "0 auto 12px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>{t("cal_day")} {editingDay}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>{t("cal_results_day")}</div>
                </div>
                {journalData[String(editingDay)] && (
                  <button
                    onClick={() => { if (onJournalSave) onJournalSave(editingDay, null); setEditingDay(null); }}
                    style={{ padding: "6px 11px", borderRadius: 9, background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 11, fontWeight: 700, border: "1px solid rgba(239,68,68,0.18)", cursor: "pointer" }}>
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* ── CONTENU (pas de scroll horizontal) ── */}
            <div style={{ padding: "14px 18px", overflowX: "hidden" }}>

              {/* Gagnants + Perdants côte à côte */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {/* Gagnants */}
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 5 }}>{t("cal_wins")}</div>
                  <div style={{ display: "flex", alignItems: "center", height: 46, borderRadius: 12, overflow: "hidden", border: "1.5px solid rgba(110,231,183,0.22)", background: "rgba(110,231,183,0.04)" }}>
                    <button onClick={() => setFormWins(v => Math.max(0, v - 1))}
                      style={{ width: 40, height: "100%", background: "transparent", border: "none", borderRight: "1px solid rgba(110,231,183,0.12)", color: formWins > 0 ? "#6ee7b7" : "rgba(255,255,255,0.12)", fontSize: 20, cursor: "pointer", flexShrink: 0 }}>−</button>
                    <div style={{ flex: 1, textAlign: "center", fontSize: 20, fontWeight: 800, color: formWins > 0 ? "#6ee7b7" : "rgba(255,255,255,0.3)" }}>{formWins}</div>
                    <button onClick={() => setFormWins(v => v + 1)}
                      style={{ width: 40, height: "100%", background: "rgba(110,231,183,0.10)", border: "none", borderLeft: "1px solid rgba(110,231,183,0.12)", color: "#6ee7b7", fontSize: 20, cursor: "pointer", flexShrink: 0 }}>+</button>
                  </div>
                </div>

                {/* Perdants */}
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 5 }}>{t("cal_losses")}</div>
                  <div style={{ display: "flex", alignItems: "center", height: 46, borderRadius: 12, overflow: "hidden", border: "1.5px solid rgba(239,68,68,0.22)", background: "rgba(239,68,68,0.04)" }}>
                    <button onClick={() => setFormLosses(v => Math.max(0, v - 1))}
                      style={{ width: 40, height: "100%", background: "transparent", border: "none", borderRight: "1px solid rgba(239,68,68,0.12)", color: formLosses > 0 ? "#f87171" : "rgba(255,255,255,0.12)", fontSize: 20, cursor: "pointer", flexShrink: 0 }}>−</button>
                    <div style={{ flex: 1, textAlign: "center", fontSize: 20, fontWeight: 800, color: formLosses > 0 ? "#f87171" : "rgba(255,255,255,0.3)" }}>{formLosses}</div>
                    <button onClick={() => setFormLosses(v => v + 1)}
                      style={{ width: 40, height: "100%", background: "rgba(239,68,68,0.10)", border: "none", borderLeft: "1px solid rgba(239,68,68,0.12)", color: "#f87171", fontSize: 20, cursor: "pointer", flexShrink: 0 }}>+</button>
                  </div>
                </div>
              </div>

              {/* Gain / Perte — compact */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7 }}>{t("cal_gain_loss")} ($)</div>
                  {formGainAbs !== "" && formGainAbs !== "0" && (
                    <div style={{ fontSize: 12, fontWeight: 800, color: formGainSign > 0 ? "#6ee7b7" : "#f87171" }}>
                      {formGainSign > 0 ? "+" : "−"}{formGainAbs} $
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {/* Toggle +/− vertical compact */}
                  <div style={{ display: "flex", flexDirection: "column", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)", width: 44, height: 46, flexShrink: 0 }}>
                    <button onClick={() => setFormGainSign(1)}
                      style={{ flex: 1, background: formGainSign > 0 ? "rgba(110,231,183,0.22)" : "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.08)", color: formGainSign > 0 ? "#6ee7b7" : "rgba(255,255,255,0.3)", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>+</button>
                    <button onClick={() => setFormGainSign(-1)}
                      style={{ flex: 1, background: formGainSign < 0 ? "rgba(239,68,68,0.22)" : "transparent", border: "none", color: formGainSign < 0 ? "#f87171" : "rgba(255,255,255,0.3)", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>−</button>
                  </div>
                  {/* Input compact — même hauteur que les steppers */}
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={formGainAbs}
                    onChange={e => setFormGainAbs(e.target.value.replace(/-/g, ""))}
                    placeholder="0"
                    style={{
                      flex: 1, height: 46,
                      background: formGainSign > 0 ? "rgba(110,231,183,0.05)" : "rgba(239,68,68,0.05)",
                      border: "1.5px solid " + (formGainSign > 0 ? "rgba(110,231,183,0.22)" : "rgba(239,68,68,0.22)"),
                      borderRadius: 12,
                      padding: "0 14px",
                      color: formGainSign > 0 ? "#6ee7b7" : "#f87171",
                      fontSize: 20, fontWeight: 800,
                      outline: "none",
                      boxSizing: "border-box",
                      minWidth: 0, // évite overflow flex
                    }}
                  />
                </div>
              </div>

              {/* Captures MT4/MT5 — compact */}
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 7 }}>
                  {t("cal_screenshots")} ({formImages.length}/3)
                </div>
                {imgDateWarn && (
                  <div style={{ marginBottom: 7, padding: "8px 10px", borderRadius: 9, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", fontSize: 10, color: "#fbbf24", lineHeight: 1.4 }}>
                    ⚠️ {imgDateWarn}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "nowrap" }}>
                  {formImages.map((img, idx) => (
                    <div key={idx} style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                      <img src={img} alt={"c"+(idx+1)} onClick={() => setViewerImg(img)}
                        style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(110,231,183,0.2)", cursor: "pointer", display: "block" }} />
                      <button onClick={() => setFormImages(prev => prev.filter((_, i) => i !== idx))}
                        style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: 9, background: "#ef4444", color: "#fff", border: "2px solid #12121a", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                  ))}
                  {formImages.length < 3 && (
                    <label style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 10, border: "1.5px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(255,255,255,0.02)", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: 18, color: imgLoading ? "#6ee7b7" : "rgba(255,255,255,0.3)", lineHeight: 1 }}>{imgLoading ? "⏳" : "+"}</span>
                      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>{imgLoading ? "" : "photo"}</span>
                      <input type="file" accept="image/*" style={{ display: "none" }}
                        onChange={async (e) => {
                          const file = e.target.files && e.target.files[0];
                          e.target.value = "";
                          if (!file) return;
                        setImgLoading(true);
                        setImgDateWarn(null);
                        try {
                          // ── Détection de date via lastModified ──
                          const fileDate = new Date(file.lastModified);
                          const fileDay = fileDate.getDate();
                          const fileMonth = fileDate.getMonth() + 1; // 1-12
                          const fileYear = fileDate.getFullYear();
                          // On essaie de matcher le mois du journal (journalMonthLabel contient "YYYY-MM")
                          const journalYearMonth = journalMonthLabel ? journalMonthLabel.slice(-7) : null; // "YYYY-MM"
                          if (journalYearMonth) {
                            const [jYear, jMonth] = journalYearMonth.split("-").map(Number);
                            if (fileYear === jYear && fileMonth === jMonth) {
                              // Même mois — vérifier si le jour est déjà saisi
                              if (fileDay !== editingDay) {
                                // Image d'un autre jour du même mois
                                const hasEntry = journalData[String(fileDay)];
                                if (hasEntry) {
                                  setImgDateWarn("Cette capture semble dater du Jour " + fileDay + " (déjà saisi). Assure-toi de l'ajouter au bon jour.");
                                } else {
                                  setImgDateWarn("Cette capture semble dater du Jour " + fileDay + ". Tu es en train de saisir le Jour " + editingDay + ".");
                                }
                              }
                            } else if (fileYear !== jYear || fileMonth !== jMonth) {
                              // Mois différent
                              setImgDateWarn("Cette capture semble dater du " + fileDay + "/" + fileMonth + "/" + fileYear + " (hors du mois en cours).");
                            }
                          }
                          const compressed = await compressImage(file);
                          setFormImages(prev => prev.length < 3 ? [...prev, compressed] : prev);
                        } catch (err) {
                          alert("Impossible de lire cette image.");
                        }
                        setImgLoading(false);
                        }} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* ── FOOTER BOUTONS ── */}
            <div style={{ padding: "12px 18px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
              <button onClick={() => setEditingDay(null)}
                style={{ flex: 1, padding: "13px", borderRadius: 12, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 700, border: "1px solid rgba(255,255,255,0.09)", cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={() => {
                  const pnl = +(parseFloat(formGainAbs) || 0) * formGainSign;
                  const entry = { wins: formWins, losses: formLosses, pnl };
                  if (formImages.length > 0) entry.images = formImages;
                  if (onJournalSave) onJournalSave(editingDay, entry);
                  setEditingDay(null);
                }}
                style={{ flex: 2, padding: "13px", borderRadius: 12, background: "linear-gradient(135deg,#6ee7b7,#34d399)", color: "#000", fontSize: 14, fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 3px 12px rgba(110,231,183,0.2)" }}>
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
          { bg: "#6ee7b7", label: t("cal_big_gain") },
          { bg: "#052e16", label: t("cal_small_gain"), fg: "#4ade80" },
          { bg: "#dc2626", label: t("cal_big_loss") },
          { bg: "rgba(239,68,68,0.08)", label: t("cal_small_loss"), fg: "#f87171" },
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

// ══════════════════════════════════════════════════════════════════
// PREMIUM / TRIAL — 7 jours d'essai dès la 1ère connexion.
// Plus tard relié à RevenueCat. Pour l'instant : statut local.
// ══════════════════════════════════════════════════════════════════
const TRIAL_DAYS = 7;
const PREMIUM_KEY = "eapropfirm_premium";

function loadPremium() {
  try {
    const r = localStorage.getItem(PREMIUM_KEY);
    return r ? JSON.parse(r) : { trialStart: null, subscribed: false };
  } catch (e) { return { trialStart: null, subscribed: false }; }
}
function savePremium(patch) {
  const cur = loadPremium();
  const next = { ...cur, ...patch };
  try { localStorage.setItem(PREMIUM_KEY, JSON.stringify(next)); } catch (e) {}
  return next;
}
// Démarre le trial à la 1ère connexion (si pas déjà démarré)
function startTrialIfNeeded() {
  const p = loadPremium();
  if (!p.trialStart && !p.subscribed) {
    return savePremium({ trialStart: Date.now() });
  }
  return p;
}
// Jours restants de trial (0 si expiré)
function trialDaysLeft() {
  const p = loadPremium();
  if (p.subscribed) return Infinity;
  if (!p.trialStart) return TRIAL_DAYS;
  const elapsed = (Date.now() - p.trialStart) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(TRIAL_DAYS - elapsed));
}
// L'utilisateur a-t-il accès au premium ? (abonné OU trial actif)
function hasPremiumAccess() {
  const p = loadPremium();
  if (p.subscribed) return true;
  return trialDaysLeft() > 0;
}

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
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Messages d'erreur Firebase lisibles
  const friendlyError = (code) => {
    const map = {
      "auth/email-already-in-use": "Cet email a déjà un compte. Connecte-toi.",
      "auth/invalid-email": "Email invalide.",
      "auth/weak-password": "Mot de passe trop faible (min 6 caractères).",
      "auth/wrong-password": "Mot de passe incorrect.",
      "auth/invalid-credential": "Email ou mot de passe incorrect.",
      "auth/user-not-found": "Aucun compte avec cet email. Inscris-toi.",
      "auth/too-many-requests": "Trop de tentatives. Réessaie dans quelques minutes.",
      "auth/popup-closed-by-user": "Connexion annulée.",
      "auth/popup-blocked": "Popup bloquée par le navigateur. Autorise les popups.",
      "auth/network-request-failed": "Problème réseau. Vérifie ta connexion.",
    };
    return map[code] || "Erreur de connexion. Réessaie.";
  };

  // Auth sociale — Firebase
  const handleSocialAuth = async (provider) => {
    setAuthError(""); setAuthLoading(true);
    try {
      const fbUser = provider === "google" ? await fbSignInGoogle() : await fbSignInApple();
      onAuth(fbUserToAppUser(fbUser));
    } catch (e) {
      setAuthError(friendlyError(e.code));
    }
    setAuthLoading(false);
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
          {t("login_tagline")}
        </div>
      </div>

      {/* Carte connexion — Google + Apple uniquement */}
      <div style={{ margin:"0 20px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(110,231,183,0.15)", borderRadius:24, padding:"26px 20px", position:"relative", zIndex:1, backdropFilter:"blur(20px)" }}>

        <div style={{ textAlign:"center", marginBottom:22 }}>
          <span style={{ fontSize:15, fontWeight:600, color: "rgba(255,255,255,0.5)" }}>
            {t("login_subtitle")}
          </span>
        </div>

        {/* Erreur auth */}
        {authError && (
          <div style={{ marginBottom:14, padding:"11px 13px", borderRadius:12, background:"rgba(239,68,68,0.10)", border:"1px solid rgba(239,68,68,0.25)", color:"#f87171", fontSize:13, lineHeight:1.4, textAlign:"center" }}>
            {authError}
          </div>
        )}

        {/* Bouton Google */}
        <button onClick={() => handleSocialAuth("google")} disabled={authLoading} style={{
          width:"100%", padding:"17px 20px", borderRadius:16, marginBottom:12,
          background:"#ffffff", border:"none",
          display:"flex", alignItems:"center", cursor: authLoading ? "default" : "pointer",
          opacity: authLoading ? 0.6 : 1,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span style={{ flex:1, fontSize:16, fontWeight:700, color:"#1f1f1f", textAlign:"center" }}>
            {authLoading ? "..." : t("login_google")}
          </span>
        </button>

        {/* Bouton Apple */}
        <button onClick={() => handleSocialAuth("apple")} disabled={authLoading} style={{
          width:"100%", padding:"17px 20px", borderRadius:16,
          background:"#000000", border:"1px solid rgba(255,255,255,0.18)",
          display:"flex", alignItems:"center", cursor: authLoading ? "default" : "pointer",
          opacity: authLoading ? 0.6 : 1,
        }}>
          <svg width="20" height="24" viewBox="0 0 20 24" fill="white" style={{ flexShrink:0 }}>
            <path d="M16.125 12.578c-.028-2.65 2.16-3.935 2.26-3.998-1.232-1.8-3.149-2.047-3.831-2.075-1.63-.163-3.18.95-4.007.95-.825 0-2.105-.924-3.456-.9-1.78.025-3.41 1.025-4.328 2.6-1.843 3.195-.473 7.943 1.328 10.543.88 1.275 1.934 2.712 3.314 2.66 1.33-.052 1.835-.858 3.444-.858 1.612 0 2.068.858 3.48.83 1.432-.026 2.342-1.3 3.215-2.578.995-1.453 1.412-2.876 1.44-2.948-.03-.014-2.79-1.075-2.82-4.227z"/>
            <path d="M13.595 4.35c.718-.89 1.208-2.127 1.075-3.35-1.04.042-2.3.69-3.047 1.577-.668.782-1.252 2.03-1.094 3.23 1.163.09 2.35-.59 3.066-1.457z"/>
          </svg>
          <span style={{ flex:1, fontSize:16, fontWeight:700, color:"#ffffff", textAlign:"center" }}>
            {authLoading ? "..." : t("login_apple")}
          </span>
        </button>


      </div>

      {/* Badge essai gratuit 7 jours */}
      <div style={{ textAlign:"center", marginTop:22, position:"relative", zIndex:1 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:20, background:"rgba(110,231,183,0.10)", border:"1px solid rgba(110,231,183,0.22)" }}>
          <span style={{ fontSize:14 }}>🎁</span>
          <span style={{ fontSize:13, fontWeight:600, color:"#6ee7b7" }}>{t("login_trial_badge")}</span>
        </div>
      </div>

      <div style={{ flex:1 }} />

            {/* CGU + Politique */}
      <div style={{ padding:"28px 24px 0", textAlign:"center", lineHeight:1.6 }}>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.28)" }}>{t("login_terms")}</div>
        <div style={{ fontSize:13 }}>
          <span style={{ color:"#6ee7b7", cursor:"pointer" }}>{t("login_cgu")}</span>
          <span style={{ color:"rgba(255,255,255,0.28)" }}>{t("login_and_our")}</span>
          <span style={{ color:"#6ee7b7", cursor:"pointer" }}>{t("login_privacy")}</span>
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
            <stop offset="0%" stopColor="#c93b3b"/>
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

// PROFIL SETUP — 3 étapes Prop Firm : firm → capital → niveau
// ══════════════════════════════════════════════════════════════════
function ProfileSetupScreen({ t, lang, setLang, onDone }) {
  const [step, setStep]       = useState(0); // 0=firm 1=capital 2=niveau
  const [firmKey, setFirmKey] = useState("fundednext");
  const [capital, setCapital] = useState(25000);
  const [level, setLevel]     = useState(null); // "beginner"|"experienced"|"professional"
  const [displayMode, setDisplayMode] = useState("advanced");

  const firm = PROP_FIRMS[firmKey] || PROP_FIRMS.fundednext;
  const caps = FIRM_CAPITALS[firmKey] || FIRM_CAPITALS.fundednext;
  const fees = FIRM_FEES[firmKey] || {};

  const selectFirm = (k) => {
    setFirmKey(k);
    setCapital((FIRM_CAPITALS[k] || FIRM_CAPITALS.fundednext)[0]);
  };

  const totalSteps = 3;

  const finish = () => {
    onDone({ lang, firmKey, capital, usageType: "propfirm", level, displayMode });
  };

  const canAdvance = () => {
    if (step === 0) return !!firmKey;
    if (step === 1) return capital >= 1000;
    if (step === 2) return level !== null;
    return false;
  };

  const next = () => {
    if (!canAdvance()) return;
    if (step === 2) { finish(); return; }
    setStep(s => s + 1);
  };

  const progress = Math.round((step / totalSteps) * 100);

  const stepLabels = [t("ps_step_firm"), t("ps_step_capital"), t("ps_step_profile")];

  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(160deg,#060a0f 0%,#0d1a12 100%)", display: "flex", flexDirection: "column", padding: "0 20px 32px", fontFamily: "-apple-system,sans-serif", color: "#fff" }}>

      {/* Header */}
      <div style={{ paddingTop: "max(env(safe-area-inset-top),24px)", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", letterSpacing: 1.5, textTransform: "uppercase" }}>
            EA PropFirm Pro
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["fr","en","es"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: "4px 9px", borderRadius: 8, fontSize: 10, fontWeight: 700, border: "1px solid", borderColor: lang === l ? "#6ee7b7" : "rgba(255,255,255,0.1)", background: lang === l ? "rgba(110,231,183,0.12)" : "transparent", color: lang === l ? "#6ee7b7" : "rgba(255,255,255,0.4)", cursor: "pointer" }}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* Titre */}
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -0.5, marginBottom: 4 }}>
          {step === 0 && t("ps_which_firm")}
          {step === 1 && t("ps_which_capital")}
          {step === 2 && t("ps_your_profile")}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
          {step === 0 && t("ps_firm_desc")}
          {step === 1 && t("ps_capital_desc")}
          {step === 2 && t("ps_profile_desc")}
        </div>

        {/* Progress steps */}
        <div style={{ display: "flex", gap: 6, marginTop: 18 }}>
          {stepLabels.map((label, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ height: 3, borderRadius: 2, width: "100%", background: i <= step ? "#6ee7b7" : "rgba(255,255,255,0.1)", transition: "all .3s" }} />
              <div style={{ fontSize: 9, color: i <= step ? "#6ee7b7" : "rgba(255,255,255,0.3)", fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ STEP 0 : CHOIX PROP FIRM ══ */}
      {step === 0 && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.keys(PROP_FIRMS).map(k => {
              const f = PROP_FIRMS[k];
              const isSelected = firmKey === k;
              return (
                <button key={k} onClick={() => selectFirm(k)} style={{
                  background: isSelected ? "rgba(110,231,183,0.08)" : "rgba(255,255,255,0.03)",
                  border: "1.5px solid " + (isSelected ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
                  borderRadius: 16, padding: "14px 16px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: isSelected ? "rgba(110,231,183,0.15)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <TradingAvatar id={Object.keys(PROP_FIRMS).indexOf(k) + 1} size={22} color={isSelected ? "#6ee7b7" : "rgba(255,255,255,0.4)"} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? "#fff" : "rgba(255,255,255,0.7)", marginBottom: 2 }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                      {Object.keys(f.models).map(mk => f.models[mk].name.replace(f.name + " ","").replace("Stellar ","")).join(" · ")}
                    </div>
                  </div>
                  {isSelected && <div style={{ width: 20, height: 20, borderRadius: 10, background: "#6ee7b7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 11, color: "#000", fontWeight: 900 }}>✓</span></div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ STEP 1 : CAPITAL ══ */}
      {step === 1 && (
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 16, padding: "12px 14px", background: "rgba(110,231,183,0.06)", border: "1px solid rgba(110,231,183,0.15)", borderRadius: 12 }}>
            <div style={{ fontSize: 11, color: "#6ee7b7", fontWeight: 700, marginBottom: 2 }}>{t("mt_firm_selected")}</div>
            <div style={{ fontSize: 14, color: "#fff", fontWeight: 700 }}>{firm.name}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {caps.map(c => (
              <button key={c} onClick={() => setCapital(c)} style={{
                flex: "1 1 calc(33% - 8px)", minWidth: 90, padding: "14px 8px", borderRadius: 14,
                background: capital === c ? "rgba(110,231,183,0.12)" : "rgba(255,255,255,0.04)",
                border: "1.5px solid " + (capital === c ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
                color: capital === c ? "#6ee7b7" : "rgba(255,255,255,0.6)", cursor: "pointer",
                fontSize: 13, fontWeight: 700,
              }}>
                {c >= 1000 ? "$" + (c / 1000) + "k" : "$" + c}
              </button>
            ))}
          </div>
          {/* Frais associés */}
          {fees[capital] != null && (
            <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 12, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              Frais estimés pour ce challenge : <span style={{ color: "#fbbf24", fontWeight: 700 }}>${fees[capital]}</span>
            </div>
          )}
        </div>
      )}

      {/* ══ STEP 2 : NIVEAU ══ */}
      {step === 2 && (
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { k: "beginner", icon: "🌱", title: t("ps_beginner"), desc: t("ps_beginner_desc") },
              { k: "experienced", icon: "📈", title: t("ps_experienced"), desc: t("ps_experienced_desc") },
              { k: "professional", icon: "🏆", title: t("ps_professional"), desc: t("ps_professional_desc") },
            ].map(opt => (
              <button key={opt.k} onClick={() => { setLevel(opt.k); setDisplayMode(opt.k === "beginner" ? "simple" : "advanced"); }} style={{
                background: level === opt.k ? "rgba(110,231,183,0.08)" : "rgba(255,255,255,0.03)",
                border: "1.5px solid " + (level === opt.k ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
                borderRadius: 16, padding: "16px 16px", cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{opt.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: level === opt.k ? "#fff" : "rgba(255,255,255,0.7)", marginBottom: 3 }}>{opt.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{opt.desc}</div>
                </div>
                {level === opt.k && <div style={{ width: 20, height: 20, borderRadius: 10, background: "#6ee7b7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 11, color: "#000", fontWeight: 900 }}>✓</span></div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bouton principal */}
      <div style={{ marginTop: 24 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{ display: "block", width: "100%", padding: "12px", marginBottom: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
            ← {t("ps_back")}
          </button>
        )}
        <button onClick={next} disabled={!canAdvance()} style={{
          display: "block", width: "100%", padding: "16px",
          background: canAdvance() ? "linear-gradient(135deg,#6ee7b7,#34d399)" : "rgba(255,255,255,0.07)",
          color: canAdvance() ? "#000" : "rgba(255,255,255,0.3)",
          borderRadius: 16, border: "none", cursor: canAdvance() ? "pointer" : "default",
          fontSize: 15, fontWeight: 800, letterSpacing: -0.2,
        }}>
          {step === 2 ? "🚀 " + t("ps_start") : t("ps_continue") + " →"}
        </button>
      </div>

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
    let equity = cap;
    return sortedMonths.map((monthKey, idx) => {
      const days = journalAll[monthKey] || {};
      const monthPnl = Object.values(days).reduce((sum, d) => sum + (d.pnl || 0), 0);
      equity += monthPnl;
      return { journalMonthIdx: idx + 1, journalEquity: Math.round(equity) };
    });
  })();

  // ── COURBE MENSUELLE (mois courant, jour par jour) ──
  const now = new Date();
  const currentMonthKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Source simulation : dailyLog du funded, filtré sur le mois courant (M1 par défaut si 1 mois)
  // On prend les jours du premier mois de la simulation funded
  const simDailyLog = ls.funded?.dailyLog || [];
  const simMonth1Days = simDailyLog.filter(d => d.month === 1); // M1

  // Source journal : mois courant uniquement
  const journalCurrentMonth = journalAll?.[currentMonthKey] || {};
  const journalCurrentDays = Object.entries(journalCurrentMonth)
    .map(([day, data]) => ({ day: parseInt(day), pnl: data?.pnl || 0, wins: data?.wins || 0, losses: data?.losses || 0 }))
    .sort((a, b) => a.day - b.day);
  const hasJournalCurrentMonth = journalCurrentDays.length > 0;

  // Construire les données du graphique mensuel (J1 → jour actuel seulement)
  const todayDay = now.getDate();
  const monthlyChartData = (() => {
    const result = [];
    let simEquity = cap;
    let journalEquity = cap;

    // S'arrêter au jour actuel, pas au dernier jour du mois
    for (let day = 1; day <= todayDay; day++) {
      // Simulation : trouver le jour correspondant (dayOfMonth)
      const simDay = simMonth1Days.find(d => d.dayOfMonth === day);
      if (simDay) simEquity = simDay.equity;

      // Journal : cumuler le PnL jusqu'à ce jour
      const journalDay = journalCurrentDays.find(d => d.day === day);
      if (journalDay) journalEquity += journalDay.pnl;

      result.push({
        day,
        simEquity: simMonth1Days.length > 0 ? simEquity : null,
        // Journal seulement pour les jours où il y a eu des saisies
        journalEquity: hasJournalCurrentMonth ? journalEquity : null,
        hasJournalEntry: !!journalDay,
      });
    }
    return result;
  })();

  // Déterminer la source principale selon journalMode (switch du calendrier)
  const monthlyHasJournal = hasJournalCurrentMonth;
  const monthlyHasSim = simMonth1Days.length > 0;
  // Si journalMode actif → journal principal (vert), sim secondaire (amber pointillé)
  // Si journalMode inactif → sim principal (vert), journal secondaire (amber pointillé)
  const monthlyPrimaryIsJournal = journalMode && monthlyHasJournal;
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
            <div style={{fontSize:16,fontWeight:700}}>{t("dash_hello")} <span style={{color:"#6ee7b7",fontWeight:700}}>trader</span></div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>{t("dash_subtitle")}</div>
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
          <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:18}}>{t("dash_stats_appear")}</div>
          <button onClick={()=>goto("simulator")} style={{padding:"14px 28px",borderRadius:100,background:"#6ee7b7",color:"#000",fontSize:14,fontWeight:700,border:"none",cursor:"pointer"}}>{t("dash_start_now")}</button>
        </div>
      )}

      {hasData && (<>

      {/* ── SIMULATION EN COURS ── */}
      <div style={{marginBottom:"14px",background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",border:"1px solid rgba(255,255,255,0.09)",borderRadius:20,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing: -0.2,marginBottom:4}}>{t("sim_my_simulation")}</div>
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
            {l:t("mt_obj_phase1"),v:phase1Target.toFixed(0)+"%",sub:"+"+phase1Pct+"% atteint",vc:"#6ee7b7"},
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
            {/* Copie exacte du CalendrierPnL de la page Funded */}
            <CalendrierPnL t={t} lang={lang} dailyLog={ls.funded.dailyLog}
              newsSkipDays={ls.newsSkipDays || 0}
              activeDays={ls.activeDays || [1,2,3,4,5]}
            />
          </div>
        ) : (
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:16,textAlign:"center",color:"rgba(255,255,255,0.35)",fontSize:13}}>
            Lance une simulation pour voir le tableau PnL, ou active le mode journal pour saisir tes trades réels.
          </div>
        )}
      </div>
      {/* ── APERÇU ÉQUITÉ — Mois courant, jour par jour ── */}
      <div style={{marginBottom:"14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:16}}>
        {/* Titre + légende */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:1}}>Équité — {currentMonthKey}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",marginTop:2}}>
              {monthlyPrimaryIsJournal ? "📓 Journal actif" : "📊 Simulation active"} · J1 → J{todayDay}
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {/* Légende dynamique : suit journalMode */}
            {monthlyHasJournal && (
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                {monthlyPrimaryIsJournal
                  ? <div style={{width:14,height:2,background:"#6ee7b7",borderRadius:1}}/>
                  : <svg width="14" height="3" viewBox="0 0 14 3"><line x1="0" y1="1.5" x2="14" y2="1.5" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 2"/></svg>
                }
                <span style={{fontSize:9,color:monthlyPrimaryIsJournal?"#6ee7b7":"rgba(255,255,255,0.4)",fontWeight:monthlyPrimaryIsJournal?700:400}}>Journal</span>
              </div>
            )}
            {monthlyHasSim && (
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                {!monthlyPrimaryIsJournal
                  ? <div style={{width:14,height:2,background:"#6ee7b7",borderRadius:1}}/>
                  : <svg width="14" height="3" viewBox="0 0 14 3"><line x1="0" y1="1.5" x2="14" y2="1.5" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 2"/></svg>
                }
                <span style={{fontSize:9,color:!monthlyPrimaryIsJournal?"#6ee7b7":"rgba(255,255,255,0.4)",fontWeight:!monthlyPrimaryIsJournal?700:400}}>Simulation</span>
              </div>
            )}
          </div>
        </div>

        {(monthlyHasJournal || monthlyHasSim) ? (
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={monthlyChartData} margin={{top:4,right:4,left:0,bottom:0}}>
              <defs>
                <linearGradient id="grad-journal-monthly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.2}/>
                  <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="grad-sim-monthly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="day" tick={{fontSize:10,fill:"rgba(255,255,255,0.3)"}} tickFormatter={v=>"J"+v} interval={4}/>
              <YAxis tick={{fontSize:10,fill:"rgba(255,255,255,0.3)"}} tickFormatter={v=>"$"+(v/1000).toFixed(0)+"k"} domain={["auto","auto"]} width={40}/>
              <Tooltip
                labelFormatter={v=>"Jour "+v}
                formatter={(v,name)=>[fmt(v),name==="journalEquity"?"Journal réel":name==="simEquity"?"Simulation":name]}
                contentStyle={{background:"rgba(10,12,22,0.97)",border:"1px solid rgba(110,231,183,0.15)",borderRadius:12,fontSize:11}}
              />
              <ReferenceLine y={cap} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 2"/>
              {/* ── Cas 1 : journalMode actif → Journal principal (vert Area) + Sim secondaire (amber pointillé) ── */}
              {monthlyPrimaryIsJournal && monthlyHasJournal && (
                <Area type="monotone" dataKey="journalEquity" stroke="#6ee7b7" strokeWidth={2.5} fill="url(#grad-journal-monthly)" dot={false} name="journalEquity" connectNulls={true}/>
              )}
              {monthlyPrimaryIsJournal && monthlyHasSim && (
                <Line type="monotone" dataKey="simEquity" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="simEquity" connectNulls={true}/>
              )}
              {/* ── Cas 2 : journalMode inactif → Sim principale (vert Area) + Journal secondaire (amber pointillé) ── */}
              {!monthlyPrimaryIsJournal && monthlyHasSim && (
                <Area type="monotone" dataKey="simEquity" stroke="#6ee7b7" strokeWidth={2.5} fill="url(#grad-sim-monthly)" dot={false} name="simEquity" connectNulls={true}/>
              )}
              {!monthlyPrimaryIsJournal && monthlyHasJournal && (
                <Line type="monotone" dataKey="journalEquity" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="journalEquity" connectNulls={true}/>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div style={{height:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.2)"}}>
            <div style={{fontSize:28,marginBottom:8}}>📈</div>
            <div style={{fontSize:12}}>{t("an_run_or_enter")}</div>
            <div style={{fontSize:10,marginTop:4,color:"rgba(255,255,255,0.15)"}}>pour voir la courbe du mois courant</div>
          </div>
        )}
      </div>

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
              <div style={{fontSize:8,color:"rgba(255,255,255,0.4)"}}>{t("mt_wr_real")}</div>
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
              {l:t("an_best_day"),
               v: bestTrade > 0 ? "+$"+fmtMoney(bestTrade) : bestTrade < 0 ? "-$"+fmtMoney(Math.abs(bestTrade)) : "$0",
               c: bestTrade >= 0 ? "#6ee7b7" : "#f87171"},
              {l:t("an_worst_day"),
               v: worstTrade < 0 ? "-$"+fmtMoney(Math.abs(worstTrade)) : worstTrade > 0 ? "+$"+fmtMoney(worstTrade) : "$0",
               c: worstTrade <= 0 ? "#f87171" : "#6ee7b7"},
              {l:t("mt_profit_phase1"),
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
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:1.4}}>{t("dash_each_day")}</div>
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
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", marginBottom: 10 }}>{t("prof_choose_avatar")}</div>
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
            {[{ k: "fr", label: t("prof_lang_fr") }, { k: "en", label: "English" }, { k: "es", label: "Español" }].map(o => (
              <button key={o.k} onClick={() => changeLang(o.k)} style={{
                flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700,
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
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: -0.2, marginBottom: 12 }}>{t("prof_display_mode")}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { k: "simple", label: t("prof_simple") },
            { k: "advanced", label: t("prof_advanced") },
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
            ? t("prof_simple_desc")
            : t("prof_advanced_desc")}
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
        <rect x="6" y="6" width="10" height="10" rx="1.5" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.5"/>
        <circle cx="8" cy="8" r="0.8" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="14" cy="8" r="0.8" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="8" cy="14" r="0.8" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="14" cy="14" r="0.8" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <path d="M8 2v2M14 2v2M8 18v2M14 18v2M2 8h2M2 14h2M18 8h2M18 14h2" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.4" strokeLinecap="round"/>
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
function SplashScreen({ user, onReady, t = (k)=>k }) {
  const [step, setStep]       = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    { label: t("mt_profile_loaded"),         duration: 350 },
    { label: t("mt_config_restored"), duration: 400 },
    { label: t("mt_sim_history"), duration: 350 },
    { label: t("mt_ready"),                  duration: 300 },
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
  const [profile, setProfileRaw] = useState(app0.profile ?? { lang: "fr", firmKey: "fundednext", capital: 25000 });
  // Wrapper : toute modif du profil est aussi persistée par utilisateur (séparation comptes)
  const setProfile = (p) => {
    setProfileRaw(p);
    if (p && typeof p === "object") {
      const uid = user?.uid || user?.email || "guest";
      try { localStorage.setItem("eapropfirm_user_" + uid, JSON.stringify({ profile: p, setupDone: true })); } catch(e) {}
      // Synchro cloud (non bloquante)
      if (user?.uid) fbSaveUserProfile(user.uid, { profile: p, setupDone: true });
    }
  };
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
    return <SplashScreen t={t} user={user} onReady={() => setShowSplash(false)} />;
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
      const uid = u?.uid || u?.email || "guest";
      const p = startTrialIfNeeded(); // démarre les 7 jours à la 1ère connexion
      setPremium(p);
      setShowSplash(true);
      // ── Séparation des comptes : cloud d'abord (multi-appareils), fallback local ──
      (async () => {
        let restored = null;
        if (u?.uid) {
          const cloud = await fbLoadUserProfile(u.uid);
          if (cloud && cloud.profile) restored = cloud;
        }
        if (!restored) {
          try { restored = JSON.parse(localStorage.getItem("eapropfirm_user_" + uid) || "null"); } catch(e) {}
        }
        if (restored && restored.profile) {
          setProfile(restored.profile);
          setSetupDone(restored.setupDone ?? true);
          saveApp({ profile: restored.profile, setupDone: restored.setupDone ?? true });
          try { localStorage.setItem("eapropfirm_user_" + uid, JSON.stringify({ profile: restored.profile, setupDone: restored.setupDone ?? true })); } catch(e) {}
        } else {
          // Nouveau compte : ProfileSetup s'affichera
          setSetupDone(false);
          saveApp({ setupDone: false });
        }
      })();
    }} />;
  }
  if (!setupDone) {
    return <ProfileSetupScreen t={t} lang={lang} setLang={setLang} onDone={(p) => {
      setProfile(p);
      setSetupDone(true);
      // Persister globalement ET par utilisateur (séparation des comptes)
      saveApp({ profile: p, setupDone: true });
      const uid = user?.uid || user?.email || "guest";
      try { localStorage.setItem("eapropfirm_user_" + uid, JSON.stringify({ profile: p, setupDone: true })); } catch(e) {}
      // Synchro cloud (non bloquante)
      if (user?.uid) fbSaveUserProfile(user.uid, { profile: p, setupDone: true });
      // Synchroniser la config du simulateur (firm + capital)
      syncSimConfig({ firmKey: p.firmKey, capital: p.capital });
    }} />;
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
