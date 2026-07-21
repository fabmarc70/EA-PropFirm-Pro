import { useState, useEffect, useRef } from "react";
import { fbSignInGoogle, fbSignInApple, fbSignUpEmail, fbSignInEmail, fbOnAuthChange, fbSignOut, fbUserToAppUser, fbLoadUserProfile, fbSaveUserProfile, fbDeleteAccount } from "./firebase.js";
import { listAvailableDatasets, downloadCandles, idbListCached } from "./historicalData.js";
import { runBacktest, runGridBacktest, listStrategies, aggregateCandles, TIMEFRAMES, filterByDateRange, SESSIONS, computePropFirmScore, MONEY_MANAGEMENT_MODES } from "./backtestEngine.js";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceDot, Cell
} from "recharts";

// ══════════════════════════════════════════════════════════════════
// I18N — Traductions FR / EN
// ══════════════════════════════════════════════════════════════════
const I18N = {
  fr: {
    econ_nfp: "NFP (Non-Farm Payrolls)", econ_cpi: "CPI (Inflation)", econ_fomc: "FOMC (Fed)",
    econ_rate: "Taux directeurs", econ_pmi: "PMI", econ_gdp: "PIB",
    econ_loss_increase: "Tes pertes augmentent de", econ_during: "pendant les", econ_pf_drops: "Ton Profit Factor chute de",
    econ_to: "à", econ_during_news: "durant les news",

    cmp_dd_excellent: "Ton drawdown laisse une large marge de sécurité sous la limite", cmp_dd_good: "Ton drawdown reste confortable par rapport à la limite",
    cmp_dd_tight: "Ton drawdown est proche de la limite — marge réduite", cmp_dd_critical: "Ton drawdown est trop agressif pour cette firme",
    cmp_dd_exceeds: "Ton drawdown dépasse la limite autorisée", cmp_trailing_strict: "DD trailing — plus strict qu'un DD statique au même seuil",
    cmp_rr_favors: "Ton RR favorise fortement cette firme", cmp_rr_low: "Ton RR moyen est faible pour ce type de challenge",
    cmp_risk_too_high_tight: "Ton risque/trade est trop élevé pour le DD serré de cette firme", cmp_risk_disciplined: "Ton risque/trade discipliné convient bien",
    cmp_risk_moderate: "Ton risque/trade est modéré",
    cmp_hft_forbidden: "Le HFT est interdit chez cette firme", cmp_ea_forbidden: "Les EA sont interdits sur ce modèle",
    cmp_news_restricted: "Le trading de news est restreint chez cette firme", cmp_style_compatible: "Ton style de trading est compatible",
    cmp_freq_reduces: "Ta fréquence de trading réduit tes chances sur ce modèle (durée minimale de phase)",
    cmp_sample_low: "Échantillon de trades trop faible pour une évaluation fiable",

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
    mt_page_title: "Mes Trades",
    mt_page_subtitle: "Importe et analyse ton historique MT4/MT5",
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
    bench_rr_approx_note: "RR approximatif (ratio meilleure/pire journée — pas un calcul par trade)",
    bench_data_source: "Basé sur ton Journal de Trading",
    bench_disclaimer: "Les seuils de comparaison (moyenne, Top 50/25/10/1%) sont des repères indicatifs du secteur, pas des données mesurées auprès d'autres utilisateurs de l'app.",
    bench_title: "Benchmark Mondial des Traders",
    bench_subtitle: "Ta performance comparée à la communauté",
    bench_no_data: "Saisis au moins 5 jours dans ton Journal de Trading pour te comparer.",
    bench_global_rank: "Classement mondial estimé",
    bench_current_level: "Niveau actuel",
    bench_next_step: "Prochaine étape",
    bench_rank_of: "sur environ 50 000 traders",
    bench_you: "Toi",
    bench_average: "Moyenne",
    bench_top50: "Top 50%",
    bench_top25: "Top 25%",
    bench_top10: "Top 10%",
    bench_top1: "Top 1%",
    bench_metric_winrate: "Winrate",
    bench_metric_pf: "Profit Factor",
    bench_metric_rr: "RR",
    bench_metric_dd: "Drawdown",
    bench_metric_discipline: "Discipline",
    bench_metric_consistency: "Consistance",
    bench_to_reach: "Pour atteindre",
    bench_improve: "améliore ton",
    bench_weakest_label: "Ton point faible relatif",
    bench_motivation_top1: "Tu fais partie de l'élite mondiale. Continue ainsi.",
    bench_motivation_top10: "Tu es dans le top 10% mondial. Encore un effort pour l'élite.",
    bench_motivation_top25: "Solide ! Tu surperformes 3 traders sur 4.",
    bench_motivation_top50: "Tu es au-dessus de la moyenne. La marge de progression est claire.",
    bench_motivation_average: "Tu es dans la moyenne. Chaque amélioration te fait grimper rapidement.",
    heat_title: "Heatmap des Erreurs de Trading",
    heat_subtitle: "Où perds-tu réellement ton argent ?",
    heat_no_data: "Données temporelles insuffisantes pour générer la heatmap.",
    heat_red_zones: "Zones à risque",
    heat_green_zones: "Zones favorables",
    heat_financial_impact: "Impact financier identifié",
    heat_sessions_title: "Sessions de marché",
    heat_days_title: "Carte thermique — Jours",
    heat_grid_title: "Carte thermique — Jour × Heure",
    heat_session_asia: "Asie",
    heat_session_london: "Londres",
    heat_session_overlap: "Londres/NY",
    heat_session_newyork: "New York",
    heat_after: "après",
    heat_morning: "matin",
    heat_afternoon: "après-midi",
    heat_evening: "soir",
    heat_trades_unit: "trades",
    heat_legend_more_loss: "Plus de pertes",
    heat_legend_more_gain: "Plus de gains",
    disc_title: "Coach de Discipline",
    disc_subtitle: "Ton comportement, mesuré au quotidien",
    disc_score_label: "Score de discipline",
    disc_level_beginner: "Débutant",
    disc_level_disciplined: "Discipliné",
    disc_level_professional: "Professionnel",
    disc_level_elite: "Elite",
    disc_next_level: "Prochain niveau à",
    disc_positives_title: "Points positifs",
    disc_negatives_title: "Points négatifs",
    disc_no_data: "Saisis tes journées avec les indicateurs de discipline pour activer le coach.",
    disc_respect_risk_count: "Jours risque respecté",
    disc_respect_plan_count: "Jours plan respecté",
    disc_exceeded_risk_count: "Jours risque dépassé",
    disc_broke_plan_count: "Jours plan non respecté",
    disc_lot_increase_count: "Jours lot augmenté après perte",
    disc_emotional_count: "Jours trading émotionnel",
    disc_overtrading_count: "Jours de sur-trading",
    disc_clean_days_count: "Journées sans sur-trading",
    disc_today_change: "Aujourd'hui",
    cal_respect_plan: "J'ai respecté mon plan de trading",
    cal_respect_risk: "J'ai respecté mon risque par trade",
    cal_lot_increase: "J'ai augmenté mon lot après une perte",
    cal_emotional: "J'ai tradé sous le coup de l'émotion",
    disc_form_title: "Discipline du jour",
    nav_journal: "Journal",
    nav_analyse: "Analyse",
    an_lab_title: "Laboratoire de Recherche",
    an_lab_sub: "Teste ta stratégie avant de risquer",
    an_lab_desc: "Décris ta stratégie, obtiens son score, explore des variantes Monte Carlo et découvre ce qui maximise tes chances de passer un challenge.",
    an_lab_saved: "Stratégie enregistrée · reprendre",
    an_lab_new: "Nouvelle analyse stratégique",
    an_lab_cta: "Ouvrir le Laboratoire",
    an_backtest_title: "Backtest Réel",
    an_backtest_sub: "Teste tes stratégies sur données historiques réelles",
    an_backtest_desc: "Télécharge des historiques de marché gratuits et lance des backtests déterministes (breakout, RSI, MACD) sur des données réelles — pas des estimations.",
    an_backtest_data_label: "Données mises à jour régulièrement",
    an_backtest_cta: "Ouvrir le Backtest",
    dash_sims_left_singular: "simulation gratuite restante",
    dash_sims_left_plural: "simulations gratuites restantes",
    dash_sims_limit_reached: "Limite gratuite atteinte",
    dash_go_pro: "Passer Pro",
    journal_title: "Journal de Trading",
    journal_subtitle: "Suis tes trades réels jour par jour",
    journal_month_stats: "Statistiques du mois",
    journal_consistency_title: "Score de cohérence",
    journal_no_data: "Aucune saisie ce mois-ci. Clique un jour pour commencer.",
    journal_prev_month: "Mois précédent",
    journal_next_month: "Mois suivant",
    journal_overview: "Vue d'ensemble",
    journal_total_days: "Jours saisis",
    journal_total_pnl: "P&L total",
    journal_best_day: "Meilleur jour",
    journal_worst_day: "Pire jour",
    journal_win_days: "Jours gagnants",
    journal_loss_days: "Jours perdants",
    econ_title: "Calendrier Économique Intelligent",
    econ_subtitle: "Impact des news sur ta performance",
    econ_risk_title: "Niveau de risque news",
    econ_risk_low: "Faible",
    econ_risk_medium: "Moyen",
    econ_risk_high: "Élevé",
    econ_during_label: "Pendant les news",
    econ_normal_label: "Hors news",
    econ_breakdown_title: "Détail par événement",
    econ_no_data: "Données temporelles insuffisantes pour analyser l'impact des news.",
    econ_assets_impacted: "Actifs impactés",
    econ_upcoming_title: "Prochains événements critiques",
    econ_impact_high: "Impact fort",
    econ_impact_medium: "Impact modéré",
    econ_in: "dans",
    econ_days: "j",
    econ_hours: "h",
    econ_today: "Aujourd'hui",
    econ_trades_count: "trades",
    cmp_card_title: "Comparateur Prop Firm",
    cmp_card_sub: "Compatibilité avec ton style",
    cmp_card_desc: "Découvre quelle prop firm correspond le mieux à ton profil de trading réel.",
    cmp_card_cta: "Comparer les firms",
    cmp_no_data: "Importe un backtest ou lance une simulation pour comparer.",
    cmp_report_title: "Comparateur Prop Firm",
    cmp_report_sub: "Classement de compatibilité",
    cmp_why_title: "Pourquoi cette compatibilité",
    cmp_blockers_title: "Points bloquants",
    cmp_adjustments_title: "Ajustements nécessaires",
    cmp_tier_excellent: "Excellent match",
    cmp_tier_good: "Bon match",
    cmp_tier_moderate: "Match modéré",
    cmp_tier_poor: "Match faible",
    cmp_based_on: "Basé sur",
    cmp_dd_limit: "Limite DD",
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
    guard_stop_recommended: "Stop trading recommandé",
    guard_stay_alert: "Reste vigilant",
    guard_all_clear: "Tout va bien, continue",
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
    journal_total_trades: "Trades",
    acc_my_accounts: "Mes comptes",
    acc_add: "Ajouter un compte",
    acc_add_title: "Nouveau compte de trading",
    acc_choose_firm: "Choisir une prop firm",
    acc_or_custom: "ou nom personnalisé",
    acc_custom_placeholder: "Ex : Mon compte FTMO #2",
    acc_none_firm: "Aucune / autre",
    acc_create: "Créer le compte",
    acc_cancel: "Annuler",
    dash_launch_sim_or_journal: "Lance une simulation pour voir le tableau PnL, ou active le mode journal pour saisir tes trades réels.",
    cal_month1: "Mois 1",
    journal_storage_full: "Stockage plein. Supprime quelques images du journal pour libérer de l'espace.",
    journal_img_error: "Impossible de lire cette image.",
    acc_main: "Compte principal",
    acc_remove_confirm: "Retirer ce compte ? Les entrées déjà saisies resteront dans le journal.",
    acc_select_for_day: "Compte pour ce jour",
    acc_capital: "Capital du compte",
    acc_account_type: "Type de compte",
    acc_type_challenge: "Challenge",
    acc_type_funded: "Funded",
    acc_type_perso: "Personnel",
    acc_delete: "Supprimer",
    acc_archive: "Archiver",
    acc_edit: "Modifier",
    acc_save: "Enregistrer",
    acc_edit_title: "Modifier le compte",
    acc_delete_confirm: "Supprimer définitivement ce compte ? Toutes ses entrées de journal seront effacées. Cette action est irréversible.",
    acc_archived_singular: "compte archivé",
    acc_archived_plural: "comptes archivés",
    acc_archived_title: "Comptes archivés",
    acc_manage_title: "Compte sélectionné",
    acc_balance_title: "Solde du compte",
    acc_live: "En direct",
    acc_initial_capital: "Capital initial :",
    acc_reactivate: "Réactiver",
    cal_intraday_dd_label: "DD max du jour (%)",
    cal_intraday_dd_hint: "Optionnel — si tu connais le creux le plus bas atteint",
    journal_max_dd_today: "DD max",
    dash_journal_pnl: "P&L Journal",
    an_premium_locked: "Premium",
    cal_journal_active: "Journal actif",
    cal_sim_active: "Simulation active",
    sim_enable: "Activer",
    sim_instrument: "Instrument",
    sim_of_capital: "% du capital",
    sim_define_risk: "Définissez votre risque en % du capital. Tout le reste en découle automatiquement.",
    sim_capital_label: "Capital ($)",
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
    prof_delete_account: "Supprimer mon compte",
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
    econ_nfp: "NFP (Nóminas no agrícolas)", econ_cpi: "CPI (Inflación)", econ_fomc: "FOMC (Fed)",
    econ_rate: "Tipos de interés", econ_pmi: "PMI", econ_gdp: "PIB",
    econ_loss_increase: "Tus pérdidas aumentan un", econ_during: "durante", econ_pf_drops: "Tu Factor de Beneficio cae de",
    econ_to: "a", econ_during_news: "durante las noticias",

    cmp_dd_excellent: "Tu drawdown deja un amplio margen de seguridad bajo el límite", cmp_dd_good: "Tu drawdown se mantiene cómodo respecto al límite",
    cmp_dd_tight: "Tu drawdown está cerca del límite — margen reducido", cmp_dd_critical: "Tu drawdown es demasiado agresivo para esta firma",
    cmp_dd_exceeds: "Tu drawdown supera el límite permitido", cmp_trailing_strict: "DD trailing — más estricto que un DD estático al mismo umbral",
    cmp_rr_favors: "Tu RR favorece fuertemente a esta firma", cmp_rr_low: "Tu RR medio es bajo para este tipo de desafío",
    cmp_risk_too_high_tight: "Tu riesgo/operación es demasiado alto para el DD ajustado de esta firma", cmp_risk_disciplined: "Tu riesgo/operación disciplinado se adapta bien",
    cmp_risk_moderate: "Tu riesgo/operación es moderado",
    cmp_hft_forbidden: "El HFT está prohibido en esta firma", cmp_ea_forbidden: "Los EA están prohibidos en este modelo",
    cmp_news_restricted: "El trading de noticias está restringido en esta firma", cmp_style_compatible: "Tu estilo de trading es compatible",
    cmp_freq_reduces: "Tu frecuencia de trading reduce tus posibilidades en este modelo (duración mínima de fase)",
    cmp_sample_low: "Muestra de operaciones demasiado baja para una evaluación fiable",

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
    mt_page_title: "Mis Trades",
    mt_page_subtitle: "Importa y analiza tu historial MT4/MT5",
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
    sim_config_saved: "Config guardada",
    prof_title: "Perfil",
    prof_account: "Cuenta",
    prof_prefs: "Preferencias",
    prof_lang: "Idioma",
    bench_title: "Benchmark Mundial de Traders",
    bench_subtitle: "Tu rendimiento comparado con la comunidad",
    bench_no_data: "Registra al menos 5 días en tu Diario de Trading para compararte.",
    bench_global_rank: "Clasificación mundial estimada",
    bench_current_level: "Nivel actual",
    bench_next_step: "Próximo paso",
    bench_rank_of: "de unos 50.000 traders",
    bench_you: "Tú",
    bench_average: "Media",
    bench_top50: "Top 50%",
    bench_top25: "Top 25%",
    bench_top10: "Top 10%",
    bench_top1: "Top 1%",
    bench_rr_approx_note: "RR aproximado (ratio mejor/peor día — no es un cálculo por operación)",
    bench_data_source: "Basado en tu Diario de Trading",
    bench_disclaimer: "Los umbrales de comparación (media, Top 50/25/10/1%) son referencias indicativas del sector, no datos medidos de otros usuarios de la app.",
    bench_metric_winrate: "Win rate",
    bench_metric_pf: "Factor de beneficio",
    bench_metric_rr: "RR",
    bench_metric_dd: "Drawdown",
    bench_metric_discipline: "Disciplina",
    bench_metric_consistency: "Consistencia",
    bench_to_reach: "Para alcanzar",
    bench_improve: "mejora tu",
    bench_weakest_label: "Tu punto débil relativo",
    bench_motivation_top1: "Formas parte de la élite mundial. Continúa así.",
    bench_motivation_top10: "Estás en el top 10% mundial. Un esfuerzo más para la élite.",
    bench_motivation_top25: "¡Sólido! Superas a 3 de cada 4 traders.",
    bench_motivation_top50: "Estás por encima de la media. El margen de mejora es claro.",
    bench_motivation_average: "Estás en la media. Cada mejora te hace subir rápido.",
    heat_title: "Mapa de Calor de Errores de Trading",
    heat_subtitle: "¿Dónde pierdes realmente tu dinero?",
    heat_no_data: "Datos temporales insuficientes para generar el mapa de calor.",
    heat_red_zones: "Zonas de riesgo",
    heat_green_zones: "Zonas favorables",
    heat_financial_impact: "Impacto financiero identificado",
    heat_sessions_title: "Sesiones de mercado",
    heat_days_title: "Mapa de calor — Días",
    heat_grid_title: "Mapa de calor — Día × Hora",
    heat_session_asia: "Asia",
    heat_session_london: "Londres",
    heat_session_overlap: "Londres/NY",
    heat_session_newyork: "Nueva York",
    heat_after: "después de",
    heat_morning: "mañana",
    heat_afternoon: "tarde",
    heat_evening: "noche",
    heat_trades_unit: "operaciones",
    heat_legend_more_loss: "Más pérdidas",
    heat_legend_more_gain: "Más ganancias",
    disc_title: "Coach de Disciplina",
    disc_subtitle: "Tu comportamiento, medido a diario",
    disc_score_label: "Puntuación de disciplina",
    disc_level_beginner: "Principiante",
    disc_level_disciplined: "Disciplinado",
    disc_level_professional: "Profesional",
    disc_level_elite: "Elite",
    disc_next_level: "Próximo nivel en",
    disc_positives_title: "Puntos positivos",
    disc_negatives_title: "Puntos negativos",
    disc_no_data: "Registra tus días con los indicadores de disciplina para activar el coach.",
    disc_respect_risk_count: "Días riesgo respetado",
    disc_respect_plan_count: "Días plan respetado",
    disc_exceeded_risk_count: "Días riesgo excedido",
    disc_broke_plan_count: "Días plan incumplido",
    disc_lot_increase_count: "Días lote aumentado tras pérdida",
    disc_emotional_count: "Días trading emocional",
    disc_overtrading_count: "Días de overtrading",
    disc_clean_days_count: "Días sin overtrading",
    disc_today_change: "Hoy",
    cal_respect_plan: "Respeté mi plan de trading",
    cal_respect_risk: "Respeté mi riesgo por operación",
    cal_lot_increase: "Aumenté mi lote después de una pérdida",
    cal_emotional: "Operé de forma emocional",
    disc_form_title: "Disciplina del día",
    nav_journal: "Diario",
    nav_analyse: "Análisis",
    an_lab_title: "Laboratorio de Investigación",
    an_lab_sub: "Prueba tu estrategia antes de arriesgar",
    an_lab_desc: "Describe tu estrategia, obtén su puntuación, explora variantes Monte Carlo y descubre qué maximiza tus posibilidades de pasar un challenge.",
    an_lab_saved: "Estrategia guardada · continuar",
    an_lab_new: "Nuevo análisis estratégico",
    an_lab_cta: "Abrir el Laboratorio",
    an_backtest_title: "Backtest Real",
    an_backtest_sub: "Prueba tus estrategias con datos históricos reales",
    an_backtest_desc: "Descarga históricos de mercado gratuitos y lanza backtests deterministas (breakout, RSI, MACD) sobre datos reales — no estimaciones.",
    an_backtest_data_label: "Datos actualizados regularmente",
    an_backtest_cta: "Abrir el Backtest",
    dash_sims_left_singular: "simulación gratis restante",
    dash_sims_left_plural: "simulaciones gratis restantes",
    dash_sims_limit_reached: "Límite gratis alcanzado",
    dash_go_pro: "Pasar a Pro",
    journal_title: "Diario de Trading",
    journal_subtitle: "Sigue tus operaciones reales día a día",
    journal_month_stats: "Estadísticas del mes",
    journal_consistency_title: "Puntuación de consistencia",
    journal_no_data: "Sin registros este mes. Haz clic en un día para empezar.",
    journal_prev_month: "Mes anterior",
    journal_next_month: "Mes siguiente",
    journal_overview: "Resumen",
    journal_total_days: "Días registrados",
    journal_total_pnl: "P&L total",
    journal_best_day: "Mejor día",
    journal_worst_day: "Peor día",
    journal_win_days: "Días ganadores",
    journal_loss_days: "Días perdedores",
    econ_title: "Calendario Económico Inteligente",
    econ_subtitle: "Impacto de las noticias en tu rendimiento",
    econ_risk_title: "Nivel de riesgo noticias",
    econ_risk_low: "Bajo",
    econ_risk_medium: "Medio",
    econ_risk_high: "Alto",
    econ_during_label: "Durante noticias",
    econ_normal_label: "Fuera de noticias",
    econ_breakdown_title: "Detalle por evento",
    econ_no_data: "Datos temporales insuficientes para analizar el impacto de las noticias.",
    econ_assets_impacted: "Activos impactados",
    econ_upcoming_title: "Próximos eventos críticos",
    econ_impact_high: "Impacto alto",
    econ_impact_medium: "Impacto medio",
    econ_in: "en",
    econ_days: "d",
    econ_hours: "h",
    econ_today: "Hoy",
    econ_trades_count: "operaciones",
    cmp_card_title: "Comparador de Prop Firms",
    cmp_card_sub: "Compatibilidad con tu estilo",
    cmp_card_desc: "Descubre qué prop firm se adapta mejor a tu perfil real de trading.",
    cmp_card_cta: "Comparar firms",
    cmp_no_data: "Importa un backtest o lanza una simulación para comparar.",
    cmp_report_title: "Comparador de Prop Firms",
    cmp_report_sub: "Clasificación de compatibilidad",
    cmp_why_title: "Por qué esta compatibilidad",
    cmp_blockers_title: "Puntos bloqueantes",
    cmp_adjustments_title: "Ajustes necesarios",
    cmp_tier_excellent: "Coincidencia excelente",
    cmp_tier_good: "Buena coincidencia",
    cmp_tier_moderate: "Coincidencia moderada",
    cmp_tier_poor: "Coincidencia débil",
    cmp_based_on: "Basado en",
    cmp_dd_limit: "Límite DD",
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
    guard_stop_recommended: "Se recomienda detener el trading",
    guard_stay_alert: "Mantente alerta",
    guard_all_clear: "Todo bien, continúa",
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
    journal_total_trades: "Operaciones",
    acc_my_accounts: "Mis cuentas",
    acc_add: "Añadir una cuenta",
    acc_add_title: "Nueva cuenta de trading",
    acc_choose_firm: "Elegir una prop firm",
    acc_or_custom: "o nombre personalizado",
    acc_custom_placeholder: "Ej: Mi cuenta FTMO #2",
    acc_none_firm: "Ninguna / otra",
    acc_create: "Crear cuenta",
    acc_cancel: "Cancelar",
    dash_launch_sim_or_journal: "Lanza una simulación para ver la tabla PnL, o activa el modo diario para registrar tus trades reales.",
    cal_month1: "Mes 1",
    journal_storage_full: "Almacenamiento lleno. Elimina algunas imágenes del diario para liberar espacio.",
    journal_img_error: "No se pudo leer esta imagen.",
    acc_main: "Cuenta principal",
    acc_remove_confirm: "¿Quitar esta cuenta? Las entradas ya registradas permanecerán en el diario.",
    acc_select_for_day: "Cuenta para este día",
    acc_capital: "Capital de la cuenta",
    acc_account_type: "Tipo de cuenta",
    acc_type_challenge: "Challenge",
    acc_type_funded: "Funded",
    acc_type_perso: "Personal",
    acc_delete: "Eliminar",
    acc_archive: "Archivar",
    acc_edit: "Editar",
    acc_save: "Guardar",
    acc_edit_title: "Editar cuenta",
    acc_delete_confirm: "¿Eliminar definitivamente esta cuenta? Todas sus entradas del diario se borrarán. Esta acción es irreversible.",
    acc_archived_singular: "cuenta archivada",
    acc_archived_plural: "cuentas archivadas",
    acc_archived_title: "Cuentas archivadas",
    acc_manage_title: "Cuenta seleccionada",
    acc_balance_title: "Saldo de la cuenta",
    acc_live: "En vivo",
    acc_initial_capital: "Capital inicial:",
    acc_reactivate: "Reactivar",
    cal_intraday_dd_label: "DD máx del día (%)",
    cal_intraday_dd_hint: "Opcional — si conoces el punto más bajo alcanzado",
    journal_max_dd_today: "DD máx",
    dash_journal_pnl: "P&L del Diario",
    an_premium_locked: "Premium",
    cal_journal_active: "Diario activo",
    cal_sim_active: "Simulación activa",
    sim_enable: "Activar",
    sim_instrument: "Instrumento",
    sim_of_capital: "% del capital",
    sim_define_risk: "Define tu riesgo en % del capital. Todo lo demás se calcula automáticamente.",
    sim_capital_label: "Capital ($)",
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
    prof_delete_account: "Eliminar mi cuenta",
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
    econ_nfp: "NFP (Non-Farm Payrolls)", econ_cpi: "CPI (Inflation)", econ_fomc: "FOMC (Fed)",
    econ_rate: "Interest rates", econ_pmi: "PMI", econ_gdp: "GDP",
    econ_loss_increase: "Your losses increase by", econ_during: "during", econ_pf_drops: "Your Profit Factor drops from",
    econ_to: "to", econ_during_news: "during news",

    cmp_dd_excellent: "Your drawdown leaves a wide safety margin under the limit", cmp_dd_good: "Your drawdown stays comfortable vs. the limit",
    cmp_dd_tight: "Your drawdown is close to the limit — reduced margin", cmp_dd_critical: "Your drawdown is too aggressive for this firm",
    cmp_dd_exceeds: "Your drawdown exceeds the allowed limit", cmp_trailing_strict: "Trailing DD — stricter than a static DD at the same threshold",
    cmp_rr_favors: "Your RR strongly favors this firm", cmp_rr_low: "Your average RR is low for this type of challenge",
    cmp_risk_too_high_tight: "Your risk/trade is too high for this firm's tight DD", cmp_risk_disciplined: "Your disciplined risk/trade fits well",
    cmp_risk_moderate: "Your risk/trade is moderate",
    cmp_hft_forbidden: "HFT is forbidden at this firm", cmp_ea_forbidden: "EAs are forbidden on this model",
    cmp_news_restricted: "News trading is restricted at this firm", cmp_style_compatible: "Your trading style is compatible",
    cmp_freq_reduces: "Your trading frequency reduces your odds on this model (minimum phase duration)",
    cmp_sample_low: "Trade sample too low for a reliable assessment",

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
    mt_page_title: "My Trades",
    mt_page_subtitle: "Import and analyze your MT4/MT5 history",
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
    sim_config_saved: "Config saved",
    prof_title: "Profile",
    prof_account: "Account",
    prof_prefs: "Preferences",
    prof_lang: "Language",
    bench_rr_approx_note: "Approximate RR (best/worst day ratio — not a per-trade calculation)",
    bench_data_source: "Based on your Trading Journal",
    bench_disclaimer: "Comparison thresholds (average, Top 50/25/10/1%) are indicative industry benchmarks, not data measured from other app users.",
    bench_title: "World Trader Benchmark",
    bench_subtitle: "Your performance vs the community",
    bench_no_data: "Log at least 5 days in your Trading Journal to compare yourself.",
    bench_global_rank: "Estimated world ranking",
    bench_current_level: "Current level",
    bench_next_step: "Next step",
    bench_rank_of: "out of ~50,000 traders",
    bench_you: "You",
    bench_average: "Average",
    bench_top50: "Top 50%",
    bench_top25: "Top 25%",
    bench_top10: "Top 10%",
    bench_top1: "Top 1%",
    bench_metric_winrate: "Win rate",
    bench_metric_pf: "Profit Factor",
    bench_metric_rr: "RR",
    bench_metric_dd: "Drawdown",
    bench_metric_discipline: "Discipline",
    bench_metric_consistency: "Consistency",
    bench_to_reach: "To reach",
    bench_improve: "improve your",
    bench_weakest_label: "Your relative weak point",
    bench_motivation_top1: "You're part of the world elite. Keep it up.",
    bench_motivation_top10: "You're in the world top 10%. One more push for the elite.",
    bench_motivation_top25: "Solid! You outperform 3 out of 4 traders.",
    bench_motivation_top50: "You're above average. The improvement margin is clear.",
    bench_motivation_average: "You're at the average. Every improvement moves you up fast.",
    heat_title: "Trading Mistakes Heatmap",
    heat_subtitle: "Where are you really losing money?",
    heat_no_data: "Insufficient time data to generate the heatmap.",
    heat_red_zones: "Risk zones",
    heat_green_zones: "Favorable zones",
    heat_financial_impact: "Identified financial impact",
    heat_sessions_title: "Market sessions",
    heat_days_title: "Heatmap — Days",
    heat_grid_title: "Heatmap — Day × Hour",
    heat_session_asia: "Asia",
    heat_session_london: "London",
    heat_session_overlap: "London/NY",
    heat_session_newyork: "New York",
    heat_after: "after",
    heat_morning: "morning",
    heat_afternoon: "afternoon",
    heat_evening: "evening",
    heat_trades_unit: "trades",
    heat_legend_more_loss: "More losses",
    heat_legend_more_gain: "More gains",
    disc_title: "Discipline Coach",
    disc_subtitle: "Your behavior, measured daily",
    disc_score_label: "Discipline score",
    disc_level_beginner: "Beginner",
    disc_level_disciplined: "Disciplined",
    disc_level_professional: "Professional",
    disc_level_elite: "Elite",
    disc_next_level: "Next level at",
    disc_positives_title: "Positive points",
    disc_negatives_title: "Negative points",
    disc_no_data: "Log your days with discipline indicators to activate the coach.",
    disc_respect_risk_count: "Days risk respected",
    disc_respect_plan_count: "Days plan respected",
    disc_exceeded_risk_count: "Days risk exceeded",
    disc_broke_plan_count: "Days plan broken",
    disc_lot_increase_count: "Days lot increased after loss",
    disc_emotional_count: "Days emotional trading",
    disc_overtrading_count: "Overtrading days",
    disc_clean_days_count: "Days without overtrading",
    disc_today_change: "Today",
    cal_respect_plan: "I respected my trading plan",
    cal_respect_risk: "I respected my risk per trade",
    cal_lot_increase: "I increased my lot size after a loss",
    cal_emotional: "I traded emotionally",
    disc_form_title: "Today's discipline",
    nav_journal: "Journal",
    nav_analyse: "Analysis",
    an_lab_title: "Research Lab",
    an_lab_sub: "Test your strategy before risking",
    an_lab_desc: "Describe your strategy, get its score, explore Monte Carlo variants and discover what maximizes your chances of passing a challenge.",
    an_lab_saved: "Saved strategy · resume",
    an_lab_new: "New strategic analysis",
    an_lab_cta: "Open the Lab",
    an_backtest_title: "Real Backtest",
    an_backtest_sub: "Test your strategies on real historical data",
    an_backtest_desc: "Download free market history and run deterministic backtests (breakout, RSI, MACD) on real data — not estimates.",
    an_backtest_data_label: "Regularly updated data",
    an_backtest_cta: "Open Backtest",
    dash_sims_left_singular: "free simulation left",
    dash_sims_left_plural: "free simulations left",
    dash_sims_limit_reached: "Free limit reached",
    dash_go_pro: "Go Pro",
    journal_title: "Trading Journal",
    journal_subtitle: "Track your real trades day by day",
    journal_month_stats: "Monthly statistics",
    journal_consistency_title: "Consistency score",
    journal_no_data: "No entries this month. Click a day to start.",
    journal_prev_month: "Previous month",
    journal_next_month: "Next month",
    journal_overview: "Overview",
    journal_total_days: "Days logged",
    journal_total_pnl: "Total P&L",
    journal_best_day: "Best day",
    journal_worst_day: "Worst day",
    journal_win_days: "Winning days",
    journal_loss_days: "Losing days",
    econ_title: "Smart Economic Calendar",
    econ_subtitle: "News impact on your performance",
    econ_risk_title: "News risk level",
    econ_risk_low: "Low",
    econ_risk_medium: "Medium",
    econ_risk_high: "High",
    econ_during_label: "During news",
    econ_normal_label: "Outside news",
    econ_breakdown_title: "Breakdown by event",
    econ_no_data: "Insufficient time data to analyze news impact.",
    econ_assets_impacted: "Impacted assets",
    econ_upcoming_title: "Upcoming critical events",
    econ_impact_high: "High impact",
    econ_impact_medium: "Medium impact",
    econ_in: "in",
    econ_days: "d",
    econ_hours: "h",
    econ_today: "Today",
    econ_trades_count: "trades",
    cmp_card_title: "Prop Firm Comparator",
    cmp_card_sub: "Compatibility with your style",
    cmp_card_desc: "Discover which prop firm best matches your real trading profile.",
    cmp_card_cta: "Compare firms",
    cmp_no_data: "Import a backtest or run a simulation to compare.",
    cmp_report_title: "Prop Firm Comparator",
    cmp_report_sub: "Compatibility ranking",
    cmp_why_title: "Why this compatibility",
    cmp_blockers_title: "Blocking points",
    cmp_adjustments_title: "Necessary adjustments",
    cmp_tier_excellent: "Excellent match",
    cmp_tier_good: "Good match",
    cmp_tier_moderate: "Moderate match",
    cmp_tier_poor: "Poor match",
    cmp_based_on: "Based on",
    cmp_dd_limit: "DD limit",
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
    guard_stop_recommended: "Stop trading recommended",
    guard_stay_alert: "Stay alert",
    guard_all_clear: "All good, keep going",
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
    journal_total_trades: "Trades",
    acc_my_accounts: "My accounts",
    acc_add: "Add an account",
    acc_add_title: "New trading account",
    acc_choose_firm: "Choose a prop firm",
    acc_or_custom: "or custom name",
    acc_custom_placeholder: "E.g.: My FTMO account #2",
    acc_none_firm: "None / other",
    acc_create: "Create account",
    acc_cancel: "Cancel",
    dash_launch_sim_or_journal: "Run a simulation to see the PnL table, or enable journal mode to log your real trades.",
    cal_month1: "Month 1",
    journal_storage_full: "Storage full. Delete some journal images to free up space.",
    journal_img_error: "Could not read this image.",
    acc_main: "Main account",
    acc_remove_confirm: "Remove this account? Already logged entries will stay in the journal.",
    acc_select_for_day: "Account for this day",
    acc_capital: "Account capital",
    acc_account_type: "Account type",
    acc_type_challenge: "Challenge",
    acc_type_funded: "Funded",
    acc_type_perso: "Personal",
    acc_delete: "Delete",
    acc_archive: "Archive",
    acc_edit: "Edit",
    acc_save: "Save",
    acc_edit_title: "Edit account",
    acc_delete_confirm: "Permanently delete this account? All its journal entries will be erased. This action cannot be undone.",
    acc_archived_singular: "archived account",
    acc_archived_plural: "archived accounts",
    acc_archived_title: "Archived accounts",
    acc_manage_title: "Selected account",
    acc_balance_title: "Account balance",
    acc_live: "Live",
    acc_initial_capital: "Initial capital:",
    acc_reactivate: "Reactivate",
    cal_intraday_dd_label: "Max DD of the day (%)",
    cal_intraday_dd_hint: "Optional — if you know the lowest point reached",
    journal_max_dd_today: "Max DD",
    dash_journal_pnl: "Journal P&L",
    an_premium_locked: "Premium",
    cal_journal_active: "Journal active",
    cal_sim_active: "Simulation active",
    sim_enable: "Enable",
    sim_instrument: "Instrument",
    sim_of_capital: "% of capital",
    sim_define_risk: "Set your risk as % of capital. Everything else follows automatically.",
    sim_capital_label: "Capital ($)",
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
    prof_delete_account: "Delete my account",
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
// ══════════════════════════════════════════════════════════════════
// Montants de capital prédéfinis — choix rapide dans les formulaires
// de création/modification d'un compte du Journal de Trading
// ══════════════════════════════════════════════════════════════════
const CAPITAL_PRESETS = [1000, 5000, 10000, 25000, 50000, 100000, 200000];

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
  fundingtraders: {
    name: "Funding Traders",
    color: "#a78bfa",
    note: "2-Step Standard - DD total 10% STATIC - Style flexible (scalping/news autorisés)",
    models: {
      "2step": {
        name: "FT 2-Step",
        phases: [
          { label: "Phase 1", target: 0.08, minDays: 0 },
          { label: "Phase 2", target: 0.05, minDays: 0 },
        ],
        dailyDD: 0.05, totalDD: 0.10, ddType: "static", challengeReward: 0,
        firstPayoutDays: 14, payoutCycle: 14, splitStart: 80, splitMax: 90,
      },
      "1step": {
        name: "FT 1-Step",
        phases: [{ label: "Evaluation", target: 0.10, minDays: 0 }],
        dailyDD: 0.04, totalDD: 0.08, ddType: "trailing", challengeReward: 0,
        firstPayoutDays: 14, payoutCycle: 14, splitStart: 80, splitMax: 90,
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
    day_sun: "Dimanche",
    day_mon: "Lundi",
    day_tue: "Mardi",
    day_wed: "Mercredi",
    day_thu: "Jeudi",
    day_fri: "Vendredi",
    day_sat: "Samedi",
    dec_dd_borderline: "DD proche de la limite",
    dec_dd_excellent: "Drawdown très maîtrisé",
    dec_dd_good: "Drawdown maîtrisé",
    dec_dd_too_high: "DD trop élevé",
    dec_dd_unknown: "DD inconnu — impossible de valider",
    dec_dont_launch: "Ne lancez pas ce challenge",
    dec_launch: "Lancer le challenge",
    dec_mc_favorable: "Monte Carlo favorable",
    dec_mc_moderate: "Monte Carlo modéré",
    dec_mc_unavailable: "Monte Carlo non disponible",
    dec_mc_unfavorable: "Monte Carlo défavorable",
    dec_pf_negative: "PF négatif — stratégie perdante",
    dec_pf_ok: "Profit Factor correct",
    dec_pf_strong: "Profit Factor solide",
    dec_pf_weak: "PF trop faible",
    dec_sample_insufficient: "Échantillon insuffisant",
    dec_sample_ok: "Échantillon correct",
    dec_sample_strong: "Échantillon solide",
    dec_wait: "Attendre",
    dec_wr_low: "Winrate trop bas pour ce RR",
    dec_wr_rr_balanced: "Winrate et RR équilibrés",
    mt5_after_streak: "après série de pertes",
    mt5_bad_day: "Jour à risque",
    mt5_bad_hour: "Horaire à risque",
    mt5_bad_symbol: "Instrument à risque",
    mt5_days_over8: "jours à 8+ trades",
    mt5_dd_controlled: "Drawdown maîtrisé",
    mt5_dd_high: "Drawdown élevé",
    mt5_of_gains: "de tes gains",
    mt5_of_losses: "de tes pertes",
    mt5_overtrading: "Overtrading détecté",
    mt5_pf_strong: "Profit Factor solide",
    mt5_pf_weak: "Profit Factor faible",
    mt5_reco_avoid_day: "Évite ou réduis ton exposition le",
    mt5_reco_avoid_hour: "Évite de trader autour de",
    mt5_reco_avoid_symbol: "Réévalue ta stratégie sur",
    mt5_reco_keep_going: "Aucun pattern à risque détecté — continue sur cette voie.",
    mt5_reco_overtrading: "Limite-toi à un nombre de trades fixe par jour pour éviter l'overtrading.",
    mt5_reco_revenge: "Arrête de trader après 3 pertes consécutives — fais une pause d'au moins 1h.",
    mt5_reco_streak: "Ta pire série perdante est de",
    mt5_reco_streak2: "trades — prévois une règle d'arrêt avant ce seuil.",
    mt5_reco_underrisk: "Augmente légèrement ton risque/trade pour exploiter ton edge statistique.",
    mt5_revenge: "Revenge trading détecté",
    mt5_rr_strong: "Ratio R/R favorable",
    mt5_symbol_strong: "Instrument moteur de performance",
    mt5_underrisk: "Sous-utilisation du risque",
    mt5_underrisk_detail: "risque moyen < 0.3% du capital",
    mt5_wr_strong: "Winrate solide",
    cmp_dd_excellent: "Ton drawdown laisse une large marge de sécurité sous la limite",
    cmp_dd_good: "Ton drawdown reste confortable par rapport à la limite",
    cmp_dd_tight: "Ton drawdown est proche de la limite — marge réduite",
    cmp_dd_critical: "Ton drawdown est trop agressif pour cette firme",
    cmp_dd_exceeds: "Ton drawdown dépasse la limite autorisée",
    cmp_trailing_strict: "DD trailing — plus strict qu'un DD statique au même seuil",
    cmp_rr_favors: "Ton RR favorise fortement cette firme",
    cmp_rr_low: "Ton RR moyen est faible pour ce type de challenge",
    cmp_risk_too_high_tight: "Ton risque/trade est trop élevé pour le DD serré de cette firme",
    cmp_risk_disciplined: "Ton risque/trade discipliné convient bien",
    cmp_risk_moderate: "Ton risque/trade est modéré",
    cmp_hft_forbidden: "Le HFT est interdit chez cette firme",
    cmp_ea_forbidden: "Les EA sont interdits sur ce modèle",
    cmp_news_restricted: "Le trading de news est restreint chez cette firme",
    cmp_style_compatible: "Ton style de trading est compatible",
    cmp_freq_reduces: "Ta fréquence de trading réduit tes chances sur ce modèle (durée minimale de phase)",
    cmp_sample_low: "Échantillon de trades trop faible pour une évaluation fiable",
    econ_nfp: "NFP (Non-Farm Payrolls)",
    econ_cpi: "CPI (Inflation)",
    econ_fomc: "FOMC (Fed)",
    econ_rate: "Taux directeurs",
    econ_pmi: "PMI",
    econ_gdp: "PIB",
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
    day_sun: "Sunday",
    day_mon: "Monday",
    day_tue: "Tuesday",
    day_wed: "Wednesday",
    day_thu: "Thursday",
    day_fri: "Friday",
    day_sat: "Saturday",
    dec_dd_borderline: "DD close to the limit",
    dec_dd_excellent: "Very controlled drawdown",
    dec_dd_good: "Controlled drawdown",
    dec_dd_too_high: "DD too high",
    dec_dd_unknown: "Unknown DD — cannot validate",
    dec_dont_launch: "Don't launch this challenge",
    dec_launch: "Launch the challenge",
    dec_mc_favorable: "Favorable Monte Carlo",
    dec_mc_moderate: "Moderate Monte Carlo",
    dec_mc_unavailable: "Monte Carlo unavailable",
    dec_mc_unfavorable: "Unfavorable Monte Carlo",
    dec_pf_negative: "Negative PF — losing strategy",
    dec_pf_ok: "Decent Profit Factor",
    dec_pf_strong: "Solid Profit Factor",
    dec_pf_weak: "PF too weak",
    dec_sample_insufficient: "Insufficient sample",
    dec_sample_ok: "Decent sample",
    dec_sample_strong: "Strong sample",
    dec_wait: "Wait",
    dec_wr_low: "Win rate too low for this RR",
    dec_wr_rr_balanced: "Balanced win rate and RR",
    mt5_after_streak: "after losing streak",
    mt5_bad_day: "Risky day",
    mt5_bad_hour: "Risky hour",
    mt5_bad_symbol: "Risky instrument",
    mt5_days_over8: "days with 8+ trades",
    mt5_dd_controlled: "Controlled drawdown",
    mt5_dd_high: "High drawdown",
    mt5_of_gains: "of your gains",
    mt5_of_losses: "of your losses",
    mt5_overtrading: "Overtrading detected",
    mt5_pf_strong: "Solid Profit Factor",
    mt5_pf_weak: "Weak Profit Factor",
    mt5_reco_avoid_day: "Avoid or reduce exposure on",
    mt5_reco_avoid_hour: "Avoid trading around",
    mt5_reco_avoid_symbol: "Re-evaluate your strategy on",
    mt5_reco_keep_going: "No risky pattern detected — keep going this way.",
    mt5_reco_overtrading: "Limit yourself to a fixed number of trades per day to avoid overtrading.",
    mt5_reco_revenge: "Stop trading after 3 consecutive losses — take a break of at least 1h.",
    mt5_reco_streak: "Your worst losing streak is",
    mt5_reco_streak2: "trades — plan a stop rule before this threshold.",
    mt5_reco_underrisk: "Slightly increase your risk/trade to exploit your statistical edge.",
    mt5_revenge: "Revenge trading detected",
    mt5_rr_strong: "Favorable R/R ratio",
    mt5_symbol_strong: "Performance-driving instrument",
    mt5_underrisk: "Risk underutilization",
    mt5_underrisk_detail: "avg risk < 0.3% of capital",
    mt5_wr_strong: "Solid win rate",
    cmp_dd_excellent: "Your drawdown leaves a wide safety margin under the limit",
    cmp_dd_good: "Your drawdown stays comfortable vs. the limit",
    cmp_dd_tight: "Your drawdown is close to the limit — reduced margin",
    cmp_dd_critical: "Your drawdown is too aggressive for this firm",
    cmp_dd_exceeds: "Your drawdown exceeds the allowed limit",
    cmp_trailing_strict: "Trailing DD — stricter than a static DD at the same threshold",
    cmp_rr_favors: "Your RR strongly favors this firm",
    cmp_rr_low: "Your average RR is low for this type of challenge",
    cmp_risk_too_high_tight: "Your risk/trade is too high for this firm's tight DD",
    cmp_risk_disciplined: "Your disciplined risk/trade fits well",
    cmp_risk_moderate: "Your risk/trade is moderate",
    cmp_hft_forbidden: "HFT is forbidden at this firm",
    cmp_ea_forbidden: "EAs are forbidden on this model",
    cmp_news_restricted: "News trading is restricted at this firm",
    cmp_style_compatible: "Your trading style is compatible",
    cmp_freq_reduces: "Your trading frequency reduces your odds on this model (minimum phase duration)",
    cmp_sample_low: "Trade sample too low for a reliable assessment",
    econ_nfp: "NFP (Non-Farm Payrolls)",
    econ_cpi: "CPI (Inflation)",
    econ_fomc: "FOMC (Fed)",
    econ_rate: "Interest rates",
    econ_pmi: "PMI",
    econ_gdp: "GDP",
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
    day_sun: "Domingo",
    day_mon: "Lunes",
    day_tue: "Martes",
    day_wed: "Miércoles",
    day_thu: "Jueves",
    day_fri: "Viernes",
    day_sat: "Sábado",
    dec_dd_borderline: "DD cerca del límite",
    dec_dd_excellent: "Drawdown muy controlado",
    dec_dd_good: "Drawdown controlado",
    dec_dd_too_high: "DD demasiado alto",
    dec_dd_unknown: "DD desconocido — no se puede validar",
    dec_dont_launch: "No lances este desafío",
    dec_launch: "Lanzar el desafío",
    dec_mc_favorable: "Monte Carlo favorable",
    dec_mc_moderate: "Monte Carlo moderado",
    dec_mc_unavailable: "Monte Carlo no disponible",
    dec_mc_unfavorable: "Monte Carlo desfavorable",
    dec_pf_negative: "PF negativo — estrategia perdedora",
    dec_pf_ok: "Factor de beneficio correcto",
    dec_pf_strong: "Factor de beneficio sólido",
    dec_pf_weak: "PF demasiado débil",
    dec_sample_insufficient: "Muestra insuficiente",
    dec_sample_ok: "Muestra correcta",
    dec_sample_strong: "Muestra sólida",
    dec_wait: "Esperar",
    dec_wr_low: "Win rate demasiado bajo para este RR",
    dec_wr_rr_balanced: "Win rate y RR equilibrados",
    mt5_after_streak: "tras racha de pérdidas",
    mt5_bad_day: "Día de riesgo",
    mt5_bad_hour: "Horario de riesgo",
    mt5_bad_symbol: "Instrumento de riesgo",
    mt5_days_over8: "días con 8+ operaciones",
    mt5_dd_controlled: "Drawdown controlado",
    mt5_dd_high: "Drawdown alto",
    mt5_of_gains: "de tus ganancias",
    mt5_of_losses: "de tus pérdidas",
    mt5_overtrading: "Overtrading detectado",
    mt5_pf_strong: "Factor de beneficio sólido",
    mt5_pf_weak: "Factor de beneficio débil",
    mt5_reco_avoid_day: "Evita o reduce tu exposición el",
    mt5_reco_avoid_hour: "Evita operar alrededor de",
    mt5_reco_avoid_symbol: "Reevalúa tu estrategia en",
    mt5_reco_keep_going: "No se detectó ningún patrón de riesgo — continúa así.",
    mt5_reco_overtrading: "Límitate a un número fijo de operaciones por día para evitar el overtrading.",
    mt5_reco_revenge: "Deja de operar tras 3 pérdidas consecutivas — toma un descanso de al menos 1h.",
    mt5_reco_streak: "Tu peor racha perdedora es de",
    mt5_reco_streak2: "operaciones — prevé una regla de parada antes de este umbral.",
    mt5_reco_underrisk: "Aumenta ligeramente tu riesgo/operación para explotar tu ventaja estadística.",
    mt5_revenge: "Revenge trading detectado",
    mt5_rr_strong: "Ratio R/R favorable",
    mt5_symbol_strong: "Instrumento motor de rendimiento",
    mt5_underrisk: "Subutilización del riesgo",
    mt5_underrisk_detail: "riesgo medio < 0.3% del capital",
    mt5_wr_strong: "Win rate sólido",
    cmp_dd_excellent: "Tu drawdown deja un amplio margen de seguridad bajo el límite",
    cmp_dd_good: "Tu drawdown se mantiene cómodo respecto al límite",
    cmp_dd_tight: "Tu drawdown está cerca del límite — margen reducido",
    cmp_dd_critical: "Tu drawdown es demasiado agresivo para esta firma",
    cmp_dd_exceeds: "Tu drawdown supera el límite permitido",
    cmp_trailing_strict: "DD trailing — más estricto que un DD estático al mismo umbral",
    cmp_rr_favors: "Tu RR favorece fuertemente a esta firma",
    cmp_rr_low: "Tu RR medio es bajo para este tipo de desafío",
    cmp_risk_too_high_tight: "Tu riesgo/operación es demasiado alto para el DD ajustado de esta firma",
    cmp_risk_disciplined: "Tu riesgo/operación disciplinado se adapta bien",
    cmp_risk_moderate: "Tu riesgo/operación es moderado",
    cmp_hft_forbidden: "El HFT está prohibido en esta firma",
    cmp_ea_forbidden: "Los EA están prohibidos en este modelo",
    cmp_news_restricted: "El trading de noticias está restringido en esta firma",
    cmp_style_compatible: "Tu estilo de trading es compatible",
    cmp_freq_reduces: "Tu frecuencia de trading reduce tus posibilidades en este modelo (duración mínima de fase)",
    cmp_sample_low: "Muestra de operaciones demasiado baja para una evaluación fiable",
    econ_nfp: "NFP (Nóminas no agrícolas)",
    econ_cpi: "CPI (Inflación)",
    econ_fomc: "FOMC (Fed)",
    econ_rate: "Tipos de interés",
    econ_pmi: "PMI",
    econ_gdp: "PIB",
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
    if (!ddIsValidF) { f.push({ icon:'warn', title:AL('dd_unknown'), detail:AL('dd_uncalc'), s:0 }); }
    if (profitFactor >= 2.5) f.push({ icon:'star', title:AL('pf_exceptional'), detail:`PF ${profitFactor.toFixed(2)} — ${AL('pf_strategy_perf')}`, s:100 });
    else if (profitFactor >= 1.8) f.push({ icon:'ok', title:AL('pf_excellent'), detail:`PF ${profitFactor.toFixed(2)} — ${AL('pf_gains_over')}`, s:88 });
    else if (profitFactor >= 1.4) f.push({ icon:'ok', title:AL('pf_solid'), detail:`PF ${profitFactor.toFixed(2)} — ${AL('pf_structurally')}`, s:72 });
    if (expectancyR >= 0.8) f.push({ icon:'ok', title:AL('exp_high'), detail:`+${expectancyR.toFixed(2)}R ${AL('per_trade')} — ${AL('exp_edge')}`, s:95 });
    else if (expectancyR >= 0.4) f.push({ icon:'ok', title:AL('exp_positive'), detail:`+${expectancyR.toFixed(2)}R ${AL('per_trade')} — ${AL('exp_profitable')}`, s:78 });
    if (ddRatio <= 0.25) f.push({ icon:'ok', title:AL('dd_controlled'), detail:`${worstDD.toFixed(1)}% — ${Math.round(ddRatio*100)}% ${AL('dd_oflimit')}`, s:90 });
    else if (ddRatio <= 0.5) f.push({ icon:'ok', title:AL('dd_wellcontrolled'), detail:`${worstDD.toFixed(1)}% — ${AL('dd_safety_margin')}`, s:74 });
    if (winrate >= 60) f.push({ icon:'ok', title:AL('wr_robust'), detail:`${winrate.toFixed(0)}% — ${AL('wr_reliability')}`, s:80 });
    if (rr >= 2.5) f.push({ icon:'ok', title:AL('rr_excellent'), detail:`1:${rr.toFixed(1)} — ${AL('rr_gains_over')}`, s:85 });
    else if (rr >= 2.0) f.push({ icon:'ok', title:AL('rr_good'), detail:`1:${rr.toFixed(1)} — ${AL('rr_favorable')}`, s:70 });
    if (totalTrades >= 150) f.push({ icon:'ok', title:AL('sample_excellent'), detail:`${totalTrades} trades — ${AL('sample_veryreliable')}`, s:88 });
    else if (totalTrades >= 80) f.push({ icon:'ok', title:AL('sample_good'), detail:`${totalTrades} trades — ${AL('sample_usable')}`, s:70 });
    return f.sort((a,b)=>b.s-a.s).slice(0,3);
  };

  const buildRisks = () => {
    const r = [];
    const ddIsValidR = !(isNaN(worstDD) || worstDD === null || worstDD === undefined);
    const ddRatio = ddIsValidR && worstDDLim > 0 ? worstDD / worstDDLim : 0;
    if (!ddIsValidR) { r.push({ icon:'danger', title:'DD ABSENT', detail:'Impossible de valider les limites de risque prop firm — verdict NON VALIDABLE', s:100 }); }
    if (totalTrades < 20) r.push({ icon:'danger', title:AL('sample_critical'), detail:`${totalTrades} trades — ${AL('sample_min')}`, s:100 });
    else if (totalTrades < 50) r.push({ icon:'warn', title:AL('sample_insufficient'), detail:`${totalTrades} trades — ${AL('sample_bias')}`, s:80 });
    if (ddRatio >= 0.9) r.push({ icon:'danger', title:AL('dd_critical'), detail:`${worstDD.toFixed(1)}% / ${worstDDLim}% — ${AL('dd_imminent')}`, s:100 });
    else if (ddRatio >= 0.75) r.push({ icon:'danger', title:AL('dd_nearlimit'), detail:`${worstDD.toFixed(1)}% / ${worstDDLim}% ${AL('dd_max')}`, s:85 });
    else if (ddRatio >= 0.6) r.push({ icon:'warn', title:AL('dd_watch'), detail:`${worstDD.toFixed(1)}% / ${worstDDLim}%`, s:60 });
    if (riskPct > 2.5) r.push({ icon:'danger', title:AL('risk_excessive'), detail:`${riskPct.toFixed(2)}% — ${Math.round(riskPct*4)}% ${AL('risk_in4')}`, s:95 });
    else if (riskPct > 1.5) r.push({ icon:'warn', title:AL('risk_high'), detail:`${riskPct.toFixed(2)}% — ${AL('risk_reduce')}`, s:70 });
    if (rr < 1.2) r.push({ icon:'danger', title:AL('rr_insufficient'), detail:`1:${rr.toFixed(1)} — ${AL('rr_toolow')}`, s:90 });
    if (profitFactor > 3.5 && totalTrades < 60) r.push({ icon:'warn', title:AL('overopt_risk'), detail:`PF ${profitFactor.toFixed(2)} / ${totalTrades} trades — ${AL('overopt_bias')}`, s:72 });
    if (expectancyR <= 0) r.push({ icon:'danger', title:AL('exp_negative'), detail:`${expectancyR.toFixed(2)}R — ${AL('exp_losing')}`, s:100 });
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

// ══════════════════════════════════════════════════════════════════
// Construit le profil de métriques RÉELLES du Journal de Trading pour
// le Benchmark Mondial — par honnêteté, ne calcule QUE ce qui est
// réellement mesurable depuis les données du journal (pnl/wins/losses
// par jour). Le Profit Factor n'est PAS calculable (pas de détail par
// trade individuel dans le journal) → laissé null plutôt qu'estimé.
// ══════════════════════════════════════════════════════════════════
function buildJournalProfileForBenchmark(journalRaw, capital) {
  const stats = journalAnalyze(journalRaw);
  if (!stats || stats.totalDays < 5) return null;
  const startCapital = capital > 0 ? capital : 25000; // référentiel réel du compte, pas le profit cumulé

  // ── Drawdown réel : équité reconstituée à partir du CAPITAL RÉEL (pas juste le P&L cumulé) ──
  // Bug précédent : le DD était calculé en % du profit cumulé au lieu du capital, ce qui gonflait
  // artificiellement la valeur (ex: une perte de $300 sur un pic de profit de $1000 donnait 30%
  // au lieu du ~1.2% réel rapporté à un capital de $25 000).
  const allDays = [];
  Object.entries(journalRaw || {}).forEach(([mk, days]) => {
    Object.entries(days || {}).forEach(([d, e]) => {
      if (e && e.pnl !== undefined) allDays.push({ date: `${mk}-${d.padStart(2,'0')}`, pnl: e.pnl || 0, intradayDD: e.intradayDD });
    });
  });
  allDays.sort((a,b) => a.date.localeCompare(b.date));
  let equity = startCapital, peak = startCapital, maxDD = 0;
  let maxIntradayDD = 0; // DD intrajournalier max saisi manuellement par l'utilisateur
  let hasIntradayDD = false;
  allDays.forEach(d => {
    equity += d.pnl;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
    if (d.intradayDD !== undefined && d.intradayDD !== null) {
      hasIntradayDD = true;
      if (d.intradayDD > maxIntradayDD) maxIntradayDD = d.intradayDD;
    }
  });
  // Si tu as saisi au moins un DD intrajournalier précis, on s'y fie plutôt que de prendre le
  // maximum avec le DD reconstitué automatiquement (qui n'est qu'une approximation depuis les
  // clôtures de fin de journée, sur une échelle différente — comparer les deux n'a pas de sens).
  const finalDD = hasIntradayDD ? maxIntradayDD : maxDD;

  // ── RR approximatif : ratio |meilleure journée| / |pire journée| (proxy faute de détail par trade) ──
  const rrApprox = stats.worstDay !== 0 ? Math.abs(stats.bestDay / stats.worstDay) : null;

  return {
    winrate: stats.tradeWR,       // réel : winrate trade calculé sur tous les trades saisis
    avgRR: rrApprox,              // approximatif : proxy meilleure/pire journée, PAS un vrai RR par trade
    avgDD: finalDD,               // réel, rapporté au capital réel du compte (+ DD intrajournalier saisi si renseigné)
    profitFactor: null,           // non calculable : le journal n'a pas le détail gain/perte par trade
    sampleSize: stats.totalDays,
    totalPnl: stats.totalPnl,
  };
}

// ══════════════════════════════════════════════════════════════════
// COACH DE DISCIPLINE — score comportemental /100 basé sur le journal
// Points positifs : respect risque/plan, pas de sur-trading
// Points négatifs : revenge trading, lot augmenté après perte, trading émotionnel, dépassement risque
// Évolue quotidiennement (système de progression façon jeu vidéo).
// ══════════════════════════════════════════════════════════════════
function disciplineAnalyze(journalRaw) {
  const allDays = [];
  Object.entries(journalRaw || {}).forEach(([mk, days]) => {
    Object.entries(days || {}).forEach(([d, e]) => {
      if (e && (e.pnl !== undefined || e.wins !== undefined)) {
        allDays.push({
          date: `${mk}-${d.padStart(2,'0')}`, pnl: e.pnl || 0, wins: e.wins || 0, losses: e.losses || 0,
          respectPlan: e.respectPlan !== undefined ? e.respectPlan : null,
          respectRisk: e.respectRisk !== undefined ? e.respectRisk : null,
          lotIncreaseAfterLoss: !!e.lotIncreaseAfterLoss,
          emotionalTrading: !!e.emotionalTrading,
        });
      }
    });
  });
  if (!allDays.length) return null;
  allDays.sort((a,b) => a.date.localeCompare(b.date));

  const events = []; // historique des +/- points (façon jeu vidéo)

  // ── Score quotidien individuel par jour (0-100), puis moyenne pondérée récente ──
  // Système "jeu vidéo" : la forme récente compte plus que l'historique ancien (decay exponentiel).
  let curLossStreakDays = 0;
  const dailyScores = allDays.map((day, i) => {
    let dayScore = 50; // neutre par défaut pour CE jour
    const totalTrades = day.wins + day.losses;
    const lossRate = totalTrades > 0 ? day.losses / totalTrades : 0;

    if (day.respectRisk === true) { dayScore += 15; events.push({ date: day.date, delta: +3, key: 'disc_ev_respect_risk' }); }
    else if (day.respectRisk === false) { dayScore -= 25; events.push({ date: day.date, delta: -6, key: 'disc_ev_exceeded_risk' }); }

    if (day.respectPlan === true) { dayScore += 15; events.push({ date: day.date, delta: +3, key: 'disc_ev_respect_plan' }); }
    else if (day.respectPlan === false) { dayScore -= 20; events.push({ date: day.date, delta: -5, key: 'disc_ev_broke_plan' }); }

    if (day.lotIncreaseAfterLoss) { dayScore -= 25; events.push({ date: day.date, delta: -8, key: 'disc_ev_lot_increase' }); }
    if (day.emotionalTrading) { dayScore -= 20; events.push({ date: day.date, delta: -7, key: 'disc_ev_emotional' }); }

    // Revenge trading proxy : journée à forte proportion de pertes (>=70%, 3+ trades) + émotionnel
    if (totalTrades >= 3 && lossRate >= 0.7 && day.emotionalTrading) {
      dayScore -= 15; events.push({ date: day.date, delta: -10, key: 'disc_ev_revenge' });
      curLossStreakDays++;
    } else if (day.pnl < 0) {
      curLossStreakDays++;
    } else {
      curLossStreakDays = 0;
    }

    // Sur-trading proxy : plus de 8 trades dans la journée
    if (totalTrades > 8) { dayScore -= 12; events.push({ date: day.date, delta: -4, key: 'disc_ev_overtrading' }); }
    else if (totalTrades > 0) { dayScore += 3; events.push({ date: day.date, delta: +1, key: 'disc_ev_no_overtrading' }); }

    // Journée propre : pas de pertes, pas d'émotion, plan + risque respectés
    if (day.pnl >= 0 && !day.emotionalTrading && !day.lotIncreaseAfterLoss && day.respectPlan !== false && day.respectRisk !== false) {
      dayScore += 10; events.push({ date: day.date, delta: +2, key: 'disc_ev_clean_day' });
    }

    return Math.max(0, Math.min(100, dayScore));
  });

  // Moyenne pondérée : les jours récents comptent plus (decay), façon "forme du moment" jeu vidéo.
  // Poids exponentiel croissant vers les jours les plus récents.
  let weightedSum = 0, weightTotal = 0;
  dailyScores.forEach((s, i) => {
    const recencyWeight = Math.pow(1.08, i); // les indices élevés (récents) pèsent plus
    weightedSum += s * recencyWeight;
    weightTotal += recencyWeight;
  });
  let score = weightTotal > 0 ? weightedSum / weightTotal : 50;
  score = Math.round(Math.max(0, Math.min(100, score)));

  // ── Niveau (façon jeu vidéo) ──
  let level, levelColor, levelIcon, nextLevelScore;
  if (score >= 85) { level = "elite"; levelColor = "#a78bfa"; levelIcon = "elite"; nextLevelScore = 100; }
  else if (score >= 65) { level = "professional"; levelColor = "#6ee7b7"; levelIcon = "professional"; nextLevelScore = 85; }
  else if (score >= 40) { level = "disciplined"; levelColor = "#fbbf24"; levelIcon = "disciplined"; nextLevelScore = 65; }
  else { level = "beginner"; levelColor = "#f97316"; levelIcon = "beginner"; nextLevelScore = 40; }

  // ── Compteurs pour l'affichage Forces/Faiblesses ──
  const respectRiskDays = allDays.filter(d => d.respectRisk === true).length;
  const respectPlanDays = allDays.filter(d => d.respectPlan === true).length;
  const exceededRiskDays = allDays.filter(d => d.respectRisk === false).length;
  const brokePlanDays = allDays.filter(d => d.respectPlan === false).length;
  const lotIncreaseDays = allDays.filter(d => d.lotIncreaseAfterLoss).length;
  const emotionalDays = allDays.filter(d => d.emotionalTrading).length;
  const overtradingDays = allDays.filter(d => (d.wins + d.losses) > 8).length;
  const cleanDays = allDays.filter(d => d.pnl >= 0 && !d.emotionalTrading && !d.lotIncreaseAfterLoss && d.respectPlan !== false && d.respectRisk !== false).length;

  // Score d'hier vs aujourd'hui (progression façon jeu vidéo)
  const last7 = events.slice(-7);
  const todayDelta = events.length ? events[events.length - 1] : null;

  return {
    score, level, levelColor, levelIcon, nextLevelScore,
    totalDays: allDays.length, events, last7,
    respectRiskDays, respectPlanDays, exceededRiskDays, brokePlanDays,
    lotIncreaseDays, emotionalDays, overtradingDays, cleanDays,
    todayDelta,
  };
}

// ── Icône de statut neutre (puce colorée) — remplace les émojis dans les listes forces/risques ──
// ══════════════════════════════════════════════════════════════════
// Carte de validation Gemini réutilisable — affichée sous un module
// pour donner une seconde opinion factuelle, jamais mentionnée comme IA.
// ══════════════════════════════════════════════════════════════════
function GeminiValidationCard({ t, loading, result, titleKey = "mt_indep_validation" }) {
  if (!loading && !result) return null;
  return (
    <div style={{ marginTop: 10, padding: "13px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(110,231,183,0.12)", borderRadius: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>
          {t(titleKey)}
        </div>
        {result?.confidenceLevel && (
          <div style={{ padding: "2px 8px", borderRadius: 8, fontSize: 9, fontWeight: 700,
            background: result.confidenceLevel === 'ÉLEVÉ' ? 'rgba(110,231,183,0.12)' : result.confidenceLevel === 'MODÉRÉ' ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)',
            color: result.confidenceLevel === 'ÉLEVÉ' ? '#6ee7b7' : result.confidenceLevel === 'MODÉRÉ' ? '#fbbf24' : '#ef4444',
          }}>
            {t('mt_confidence')} {result.confidenceLevel}
          </div>
        )}
      </div>
      {loading && !result ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[85, 70, 55].map((w, i) => (
            <div key={i} style={{ height: 9, borderRadius: 5, background: "rgba(255,255,255,0.06)", width: w + "%" }} />
          ))}
        </div>
      ) : result ? (
        <>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.65, marginBottom: 10 }}>
            {result.validationSummary}
          </div>
          {result.confidenceReason && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontStyle: "italic", marginBottom: 8 }}>
              {result.confidenceReason}
            </div>
          )}
          {result.actionableAdvice && (
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginTop: 6 }}>
              <StatusDot kind="ok" />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>{result.actionableAdvice}</span>
            </div>
          )}
          {result.watchpoints?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
              {result.watchpoints.map((wp, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <StatusDot kind="warn" />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{wp}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function StatusDot({ kind }) {
  const color = kind === 'danger' ? '#ef4444' : kind === 'warn' ? '#fbbf24' : kind === 'star' ? '#a78bfa' : '#6ee7b7';
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: color, flexShrink: 0 }} />;
}

// ── Icône de niveau (étoile à N branches selon le rang) — remplace les émojis 👑🏆🎯🌱 ──
function LevelIcon({ level, color, size = 20 }) {
  const points = level === 'elite' ? 8 : level === 'professional' ? 6 : level === 'disciplined' ? 5 : 4;
  const cx = size/2, cy = size/2, rOuter = size/2 - 1, rInner = rOuter * 0.45;
  let path = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
    path += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
  }
  path += 'Z';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={path} fill={color} opacity="0.9" />
    </svg>
  );
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

// ══════════════════════════════════════════════════════════════════
// Validation Gemini — Analyse Comportementale MT5 (horaires/jours/instruments)
// Même pattern silencieux que callGeminiVerdict : seconde opinion factuelle,
// jamais mentionnée comme IA, juste une "validation indépendante".
// ══════════════════════════════════════════════════════════════════
async function callGeminiMT5Validation(mt5Data, lang) {
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || '';
  if (!GEMINI_KEY || !mt5Data) return null;
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const langLabel = { fr:'français', en:'English', es:'español' }[lang] || 'français';

  const prompt = `Tu es un analyste quantitatif expert en comportement de trading. Valide la cohérence de cette analyse d'historique MT5.

Données de l'historique :
- Trades analysés : ${mt5Data.n}
- Meilleur jour : ${mt5Data.bestDay?.day || 'N/C'}
- Pire jour : ${mt5Data.worstDay?.day || 'N/C'} (${mt5Data.worstDay?.pctOfLosses?.toFixed(0) || 0}% des pertes)
- Meilleure heure : ${mt5Data.bestHour?.hour ?? 'N/C'}h
- Pire heure : ${mt5Data.worstHour?.hour ?? 'N/C'}h
- Meilleur instrument : ${mt5Data.bestSymbol?.symbol || 'N/C'}
- Pire instrument : ${mt5Data.worstSymbol?.symbol || 'N/C'}
- Données horaires disponibles : ${mt5Data.hasTimeData ? 'OUI' : 'NON'}
- Données d'instrument disponibles : ${mt5Data.hasSymbolData ? 'OUI' : 'NON'}

RÈGLES STRICTES :
1. Ne jamais mentionner "IA", "intelligence artificielle", "Gemini", "algorithme" ou "modèle"
2. Parler uniquement de faits observables et de chiffres
3. Si les données horaires ou d'instrument sont absentes, le signaler clairement
4. Donner 1 conseil concret et actionnable basé sur le pattern le plus fiable
5. Être concis, factuel, professionnel

Réponds UNIQUEMENT en JSON valide sans markdown :
{"validationSummary":"2-3 phrases de validation indépendante en ${langLabel}, basées sur les chiffres réels disponibles.","actionableAdvice":"1 conseil concret et actionnable.","confidenceLevel":"ÉLEVÉ|MODÉRÉ|FAIBLE|INDÉTERMINÉ","confidenceReason":"1 phrase sur pourquoi ce niveau de confiance"}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 400 } }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const d = await res.json();
    const raw = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonClean = raw.split('```json').pop().split('```')[0].trim(); return JSON.parse(jsonClean || raw.trim());
  } catch (e) { return null; }
}

// ══════════════════════════════════════════════════════════════════
// Validation Gemini — Écran de décision "Puis-je lancer ce challenge ?"
// ══════════════════════════════════════════════════════════════════
async function callGeminiDecisionValidation(decision, lang) {
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || '';
  if (!GEMINI_KEY || !decision) return null;
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const langLabel = { fr:'français', en:'English', es:'español' }[lang] || 'français';

  const prompt = `Tu es un analyste quantitatif expert en prop trading. Valide la cohérence de cette décision "peut-on lancer ce challenge ?".

Données de la décision :
- Verdict local : ${decision.verdictLabel} (score ${decision.score}/100)
- Profit Factor : ${decision.pf?.toFixed(2)}
- Winrate : ${decision.wr?.toFixed(0)}%
- RR : 1:${decision.rr?.toFixed(2)}
- Drawdown : ${decision.dd !== null ? decision.dd.toFixed(1) + '%' : 'INCONNU'}
- Probabilité Monte Carlo : ${decision.mc !== null && decision.mc !== undefined ? decision.mc + '%' : 'N/C'}
- Échantillon : ${decision.nTrades} trades
- Raisons négatives identifiées : ${decision.reasons?.join('; ') || 'aucune'}
- Points positifs identifiés : ${decision.positives?.join('; ') || 'aucun'}

RÈGLES STRICTES :
1. Ne jamais mentionner "IA", "intelligence artificielle", "Gemini", "algorithme" ou "modèle"
2. Parler uniquement de chiffres et faits observables
3. Confirmer ou nuancer le verdict local avec un angle complémentaire
4. Être concis, factuel, professionnel

Réponds UNIQUEMENT en JSON valide sans markdown :
{"validationSummary":"2-3 phrases de validation indépendante en ${langLabel}, avec les chiffres réels.","watchpoints":["point de vigilance 1","point de vigilance 2"],"confidenceLevel":"ÉLEVÉ|MODÉRÉ|FAIBLE|INDÉTERMINÉ","confidenceReason":"1 phrase sur pourquoi ce niveau de confiance"}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 400 } }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const d = await res.json();
    const raw = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonClean = raw.split('```json').pop().split('```')[0].trim(); return JSON.parse(jsonClean || raw.trim());
  } catch (e) { return null; }
}

// ══════════════════════════════════════════════════════════════════
// LABORATOIRE DE RECHERCHE — système expert de trading
// Base de connaissances + moteur d'analyse + variantes Monte Carlo
// ══════════════════════════════════════════════════════════════════
const TRADING_KB = {
  // Chaque item ajuste les paramètres estimés de simulation (deltas) et porte des métadonnées expertes.
  // wr/rr/cl/risk = deltas sur la base (wr 50%, rr 1.5, clustering 20%, risk 0.5%)
  // ruin = risque de ruine intrinsèque 0-10 · prop = compatibilité prop firm 0-10 · robust = robustesse 0-10
  botTypes: [
    { k:"manual",     label:"Trading manuel",        wr:0,   rr:0,    cl:0,   risk:0,    ruin:3, prop:8, robust:6, note:"Discipline = variable clé. Journal obligatoire." },
    { k:"algo",       label:"EA / Algo classique",   wr:0,   rr:0,    cl:-5,  risk:0,    ruin:2, prop:9, robust:8, note:"Constance mécanique, idéal prop firm si backtesté 200+ trades." },
    { k:"martingale", label:"Martingale",            wr:15,  rr:-0.7, cl:25,  risk:0.6,  ruin:9, prop:1, robust:2, note:"Winrate élevé trompeur : la perte terminale efface tout. DD explosif = incompatible règles prop firm." },
    { k:"grid",       label:"Grille (Grid)",         wr:12,  rr:-0.5, cl:20,  risk:0.4,  ruin:8, prop:2, robust:3, note:"Accumule l'exposition en range. Tendance forte = drawdown catastrophique." },
    { k:"dca",        label:"DCA / Moyennage",       wr:8,   rr:-0.3, cl:15,  risk:0.3,  ruin:7, prop:3, robust:4, note:"Version douce de la grille. Le DD reste le tueur silencieux." },
    { k:"hedging",    label:"Hedging",               wr:3,   rr:-0.2, cl:5,   risk:0.1,  ruin:5, prop:4, robust:5, note:"Réduit la variance mais coûte du spread/swap. Interdit chez certaines firms." },
    { k:"scalpbot",   label:"Bot scalping HF",       wr:5,   rr:-0.6, cl:-5,  risk:-0.1, ruin:5, prop:4, robust:4, note:"Ultra-sensible au spread/slippage réel. Backtest ≠ live. Vérifier règles HFT de la firm." },
    { k:"trend",      label:"Suiveur de tendance",   wr:-10, rr:1.0,  cl:10,  risk:0,    ruin:2, prop:8, robust:8, note:"Winrate bas, gains asymétriques. Psychologiquement dur, statistiquement sain." },
    { k:"meanrev",    label:"Retour à la moyenne",   wr:8,   rr:-0.4, cl:5,   risk:0,    ruin:5, prop:6, robust:6, note:"Marche en range, casse en breakout. Filtre de régime indispensable." },
    { k:"newsbot",    label:"Bot news/événements",   wr:-5,  rr:0.6,  cl:15,  risk:0.2,  ruin:6, prop:2, robust:3, note:"Slippage massif sur annonces. La plupart des firms l'interdisent ou réduisent les gains." },
  ],
  // tags: "manual_only" = ne s'affiche que pour les styles manuels ; "auto_only" = bots seulement ; "any" = tous
  entries: [
    { k:"breakout",   label:"Breakout",              wr:-6, rr:0.5,  tags:["any"],         note:"Faux breakouts fréquents : filtre volume/ATR requis." },
    { k:"macross",    label:"Croisement MM",         wr:-3, rr:0.2,  tags:["auto","any"],  note:"Retard structurel. Bon en tendance, saigne en range." },
    { k:"pullback",   label:"Pullback / retracement",wr:4,  rr:0.1,  tags:["manual"],      note:"Meilleur prix d'entrée, rate les départs violents." },
    { k:"srbounce",   label:"Rebond S/R",            wr:5,  rr:-0.1, tags:["manual"],      note:"Zones objectives, mais tout le monde les voit." },
    { k:"pattern",    label:"Patterns chartistes",   wr:2,  rr:0.1,  tags:["manual"],      note:"Subjectif : backtest strict des règles nécessaire." },
    { k:"orderblock", label:"Order blocks / SMC",    wr:1,  rr:0.3,  tags:["manual"],      note:"Cadre séduisant — plus de preuves en 2025 sur HTF." },
    { k:"liquidity",  label:"Liquidity sweep",       wr:0,  rr:0.35, tags:["manual"],      note:"RR souvent excellent quand maîtrisé. Nécessite lecture fine." },
    { k:"rsidiv",     label:"Divergence RSI/MACD",   wr:3,  rr:0,    tags:["manual","auto"],note:"Signal contrarien : dangereux contre tendance forte." },
    { k:"news_spike", label:"Spike news",            wr:-8, rr:0.9,  tags:["auto"],        note:"Entrée algorithmique pure. Slippage massif chez la plupart des firms." },
    { k:"grid_algo",  label:"Entrée grille / niveau",wr:10, rr:-0.5, tags:["auto"],        note:"Distance entre niveaux = paramètre critique à optimiser." },
    { k:"martentry",  label:"Entrée + renforcement", wr:14, rr:-0.7, tags:["auto"],        note:"Chaque renforcement double l'exposition. DD non linéaire." },
    { k:"reversion",  label:"Mean reversion signal", wr:6,  rr:-0.2, tags:["auto"],        note:"Adapté aux marchés en range. Filtre ATR indispensable." },
  ],
  exits: [
    { k:"tpfixed",    label:"TP fixe",               wr:2,  rr:-0.1, tags:["any"],    note:"Simple et backtestable. Laisse des gains sur la table." },
    { k:"rrfixed",    label:"RR fixe (1:2, 1:3...)", wr:0,  rr:0.2,  tags:["any"],    note:"Discipline mathématique. Le standard prop firm." },
    { k:"trailing",   label:"Trailing stop",         wr:-4, rr:0.6,  tags:["any"],    note:"Capture les grands mouvements, se fait sortir en range." },
    { k:"partial",    label:"Sorties partielles",    wr:3,  rr:-0.15,tags:["manual"], note:"Lisse la courbe d'équité — psychologiquement précieux en challenge." },
    { k:"timeexit",   label:"Sortie temporelle",     wr:0,  rr:-0.1, tags:["any"],    note:"Évite l'exposition overnight/weekend. Utile règles prop firm." },
    { k:"betrail",    label:"BE + trailing",         wr:-2, rr:0.4,  tags:["any"],    note:"Protège le capital tôt, transforme des gagnants en BE." },
    { k:"martclose",  label:"Clôture globale niveau",wr:12, rr:-0.6, tags:["auto"],   note:"Clôture toutes les positions quand le niveau cible est atteint." },
    { k:"scalerate",  label:"Scale out partielle",   wr:2,  rr:0.1,  tags:["auto"],   note:"Réduit l'exposition progressivement. Courbe d'équité lissée." },
  ],
  indicators: [
    { k:"ma",    label:"Moyennes mobiles",  tags:["any"] },
    { k:"rsi",   label:"RSI",              tags:["any"] },
    { k:"macd",  label:"MACD",             tags:["any"] },
    { k:"bb",    label:"Bollinger",        tags:["any"] },
    { k:"atr",   label:"ATR",              tags:["any"] },
    { k:"fibo",  label:"Fibonacci",        tags:["manual"] },
    { k:"ichi",  label:"Ichimoku",         tags:["manual"] },
    { k:"vol",   label:"Volume/OBV",       tags:["any"] },
    { k:"vwap",  label:"VWAP",             tags:["auto","any"] },
    { k:"none",  label:"Price action pur", tags:["manual"] },
    { k:"param", label:"Paramètres algo",  tags:["auto"] },
    { k:"ml",    label:"Signal ML/stat",   tags:["auto"] },
  ],
  approach: [
    { k:"technical",   label:"Technique pur",        note:"Backtestable. La voie standard prop firm." },
    { k:"fundamental", label:"Fondamental",          note:"Horizon long — peu adapté aux contraintes de temps des challenges." },
    { k:"hybrid",      label:"Techno-fondamental",   note:"Le filtre macro évite de trader contre la Fed." },
  ],
  markets: [
    { k:"majors",  label:"Forex majors",   spread:1, vol:5,  note:"Spreads minimes, comportement propre. Le terrain d'entraînement idéal." },
    { k:"minors",  label:"Forex minors",   spread:3, vol:6,  note:"Spreads plus larges — vérifier l'impact sur le RR réel." },
    { k:"exotics", label:"Exotiques",      spread:8, vol:8,  note:"Spreads destructeurs pour scalping. Gaps fréquents." },
    { k:"gold",    label:"Or (XAUUSD)",    spread:4, vol:9,  note:"Volatilité extrême : diviser la taille de position par 2-3 vs forex." },
    { k:"indices", label:"Indices (US30, NAS)", spread:3, vol:8, note:"Gaps d'ouverture violents. Sessions US décisives." },
    { k:"crypto",  label:"Crypto",         spread:5, vol:10, note:"24/7 + volatilité max. Peu de firms crypto sérieuses." },
  ],
  sessions: [
    { k:"asia",    label:"Asie",           note:"Range, faible volume — terrain du mean-reversion." },
    { k:"london",  label:"Londres",        note:"Volume et directionnel : le breakout y respire." },
    { k:"ny",      label:"New York",       note:"News US, volatilité — gérer NFP/FOMC/CPI." },
    { k:"overlap", label:"Londres+NY",     note:"Le pic de liquidité mondiale. Fenêtre optimale du scalping pro." },
    { k:"all",     label:"24h (bot)",      note:"Nécessite un bot robuste à TOUS les régimes de volatilité." },
  ],
};

// Détermine si un style de trading est "manuel" ou "automatique"
function labIsAuto(botKey) {
  return ["algo","martingale","grid","dca","scalpbot","newsbot"].includes(botKey);
}
// Filtre les items KB selon le style sélectionné
function labFilterItems(items, botKey) {
  if (!botKey) return items;
  const isAuto = labIsAuto(botKey);
  return items.filter(it => {
    if (!it.tags) return true;
    if (it.tags.includes("any")) return true;
    return isAuto ? it.tags.includes("auto") : it.tags.includes("manual");
  });
}

// Estime les paramètres de simulation à partir des sélections du laboratoire
function labEstimateParams(sel) {
  let wr = 50, rr = 1.5, cl = 20, risk = 0.5;
  const bot = TRADING_KB.botTypes.find(b => b.k === sel.bot);
  if (bot) { wr += bot.wr; rr += bot.rr; cl += bot.cl; risk += bot.risk; }
  (sel.entries || []).forEach(k => { const e = TRADING_KB.entries.find(x => x.k === k); if (e) { wr += e.wr * 0.6; rr += e.rr * 0.6; } });
  (sel.exits || []).forEach(k => { const e = TRADING_KB.exits.find(x => x.k === k); if (e) { wr += e.wr * 0.6; rr += e.rr * 0.6; } });
  const mk = TRADING_KB.markets.find(m => m.k === sel.market);
  if (mk) { cl += (mk.vol - 5) * 1.5; rr -= mk.spread * 0.02; }
  if (sel.approach === "hybrid") wr += 2;
  return {
    winrate: Math.max(20, Math.min(85, Math.round(wr))),
    rr: Math.max(0.4, Math.min(5, +rr.toFixed(2))),
    clustering: Math.max(0, Math.min(70, Math.round(cl))),
    riskPct: Math.max(0.1, Math.min(3, +risk.toFixed(2))),
    tradesPerDay: sel.bot === "scalpbot" ? 8 : sel.bot === "algo" ? 3 : 2,
  };
}

// Scores 0-100 sur 5 dimensions + forces/faiblesses
function labAnalyzeProfile(sel) {
  const bot = TRADING_KB.botTypes.find(b => b.k === sel.bot) || TRADING_KB.botTypes[0];
  const params = labApplyUserOverrides(labEstimateParams(sel), sel);
  const expectancy = (params.winrate / 100) * params.rr - (1 - params.winrate / 100);
  const scores = {
    robustesse: Math.round(bot.robust * 10),
    survie: Math.round((10 - bot.ruin) * 10),
    propfirm: Math.round(bot.prop * 10),
    esperance: Math.max(0, Math.min(100, Math.round(50 + expectancy * 120))),
    scalabilite: Math.round(((sel.bot === "algo" || sel.bot === "trend" ? 8 : sel.bot === "manual" ? 5 : 3) + (sel.market === "majors" ? 2 : 0)) * 10),
    // Discipline : à quel point la stratégie est mécanique/exécutable sans dérive émotionnelle
    discipline: Math.max(10, Math.min(95,
      (sel.bot === "algo" || sel.bot === "scalpbot" || sel.bot === "newsbot" ? 85 : sel.bot === "manual" ? 55 : 70)
      + ((sel.exits || []).includes("tp_fixed") ? 6 : 0)
      + (sel.newsBehavior === "avoid" ? 5 : 0)
      - (sel.bot === "martingale" || sel.bot === "dca" ? 20 : 0)
    )),
  };
  const global = Math.round((scores.robustesse + scores.survie * 1.5 + scores.propfirm * 1.5 + scores.esperance + scores.scalabilite) / 6);
  const forces = [], faiblesses = [];
  if (scores.survie >= 70) forces.push("Risque de ruine maîtrisé"); else if (scores.survie <= 40) faiblesses.push("Risque de ruine élevé — " + bot.note);
  if (scores.propfirm >= 70) forces.push("Compatible règles prop firm"); else if (scores.propfirm <= 40) faiblesses.push("Structure incompatible avec les limites de drawdown prop firm");
  if (expectancy > 0.15) forces.push("Espérance mathématique positive solide (" + expectancy.toFixed(2) + "R/trade)");
  else if (expectancy < 0.03) faiblesses.push("Espérance quasi nulle (" + expectancy.toFixed(2) + "R) — le spread mangera l'edge");
  if ((sel.exits || []).includes("partial")) forces.push("Sorties partielles = courbe d'équité lissée");
  if (sel.market === "gold" || sel.market === "crypto") faiblesses.push("Marché haute volatilité : sizing à réduire de 50%+");
  if ((sel.sessions || []).includes("overlap")) forces.push("Session overlap = liquidité et spreads optimaux");
  if (sel.approach === "hybrid") forces.push("Filtre fondamental = évite de trader contre la macro");
  // KPIs dérivés du moteur
  const riskRuine = (100 - scores.survie) / 10; // 0-10
  const maxConsecLoss = Math.max(2, Math.round(Math.log(0.02) / Math.log(1 - params.winrate / 100)));
  const tradesForSig = Math.ceil(Math.pow(1.96 / 0.05, 2) * (params.winrate / 100) * (1 - params.winrate / 100) * 10000) / 100;
  const profitFactor = params.winrate > 0 ? +((params.winrate / 100 * params.rr) / (1 - params.winrate / 100)).toFixed(2) : 0;
  const kellyCriterion = +(params.winrate / 100 - (1 - params.winrate / 100) / params.rr).toFixed(4);
  const kpis = { riskRuine, maxConsecLoss, tradesForSig, profitFactor, kellyCriterion };
  return { scores, global, forces, faiblesses, params, bot, expectancy, kpis };
}

// Variantes dérivées pour le mode recherche.
// Chaque variante expose apply(p) — un transformateur COMPOSABLE de paramètres —
// pour pouvoir générer le NIVEAU 2 de l'arbre (combinaisons de deux modifications).
function labGenerateVariants(sel, baseParams) {
  const v = [];
  v.push({ key: "risk2", name: "Réduire le risque", short: "Risque ÷2", desc: "Même stratégie, risque par trade divisé par 2",
    apply: (p) => ({ ...p, riskPct: +(p.riskPct / 2).toFixed(2) }) });
  v.push({ key: "rr", name: "Améliorer le RR", short: "RR +0.5", desc: "Cibles plus ambitieuses (trailing/extension) — coûte du winrate",
    apply: (p) => ({ ...p, rr: +(p.rr + 0.5).toFixed(2), winrate: Math.max(20, p.winrate - 5) }) });
  v.push({ key: "quality", name: "Filtre qualité", short: "WR +5, trades -40%", desc: "Filtre d'entrée plus strict, moins de trades/jour",
    apply: (p) => ({ ...p, winrate: Math.min(85, p.winrate + 5), tradesPerDay: Math.max(0.5, +(p.tradesPerDay * 0.6).toFixed(1)) }) });
  v.push({ key: "stress", name: "Stress test", short: "WR -5 (dégradé)", desc: "Robustesse en conditions dégradées — AUCUNE amélioration, juste la vérité",
    apply: (p) => ({ ...p, winrate: Math.max(15, p.winrate - 5) }) });
  if (!(sel.exits || []).includes("partial")) v.push({ key: "partial", name: "Sorties partielles", short: "50% à 1R + trailing", desc: "Courbe d'équité lissée, RR moyen légèrement réduit",
    apply: (p) => ({ ...p, winrate: Math.min(85, p.winrate + 3), rr: Math.max(0.4, +(p.rr - 0.15).toFixed(2)) }) });
  if ((sel.bot === "martingale" || sel.bot === "grid" || sel.bot === "dca")) v.push({ key: "fixrisk", name: "Conversion risque fixe", short: "Sans moyennage, SL dur", desc: "Même logique d'entrée, 1 position, stop dur — winrate chute mais la ruine disparaît",
    apply: (p) => ({ ...p, winrate: Math.max(20, p.winrate - 12), rr: +(p.rr + 0.8).toFixed(2), clustering: Math.max(0, p.clustering - 20), riskPct: 0.5 }) });
  v.push({ key: "declust", name: "Casser les séries", short: "Clustering -50%", desc: "Diversification horaire/paires — réduit les séries de pertes",
    apply: (p) => ({ ...p, clustering: Math.round(p.clustering / 2) }) });
  // Rétro-compat : params précalculés depuis la base
  return v.map(x => ({ ...x, params: x.apply(baseParams) }));
}

// Overrides explicites saisis au wizard (risque/trade, trades/jour, comportement news)
// — appliqués APRÈS l'estimation KB : la saisie utilisateur prime toujours sur l'estimation.
function labApplyUserOverrides(params, sel) {
  const p = { ...params };
  if (sel.riskChoice) p.riskPct = sel.riskChoice;
  if (sel.tpdChoice) p.tradesPerDay = sel.tpdChoice;
  if (sel.newsBehavior === "avoid") { p.winrate = Math.min(85, p.winrate + 1); p.clustering = Math.max(0, p.clustering - 5); }
  else if (sel.newsBehavior === "trade") { p.clustering = Math.min(90, p.clustering + 8); }
  return p;
}

// Monte Carlo compact : N runs de la phase 1+2 d'un challenge.
// 100% RÉALISTE, zéro optimisme : le gain attendu est moyenné sur TOUS les runs
// (un run échoué compte sa perte réelle au moment du breach, pas zéro), et la
// stabilité est dérivée de la dispersion réelle (coefficient de variation) des
// équités finales — une stratégie qui gagne "parfois beaucoup" score mal.
function labRunMonteCarlo(params, capital, firmKey, modelKey, runs = 60) {
  const firm = PROP_FIRMS[firmKey] || PROP_FIRMS.fundednext;
  const model = firm.models[modelKey] || firm.models[Object.keys(firm.models)[0]];
  let passed = 0, ruined = 0, ddSum = 0;
  const gains = []; // profit % de CHAQUE run, échecs inclus (perte réelle au moment du breach)
  for (let i = 0; i < runs; i++) {
    const rng = mulberry32(hashParamsToSeed(JSON.stringify(params) + "|" + i));
    const p = { tradesPerDay: params.tradesPerDay, riskPct: params.riskPct / 100, rr: params.rr, winrate: params.winrate, clustering: params.clustering / 100, maxConsecLosses: 0, rng };
    let ok = true, maxDDRun = 0, runProfitPct = 0;
    for (const phase of model.phases) {
      const r = simulatePhase(capital, phase, model, p);
      maxDDRun = Math.max(maxDDRun, (r.maxDD || 0) * 100);
      runProfitPct = (r.profit || 0) * 100; // dernier état connu, y compris négatif si breach
      if (r.status !== "passed") { ok = false; if (r.status && r.status.startsWith("failed")) ruined++; break; }
    }
    if (ok) passed++;
    ddSum += maxDDRun;
    gains.push(runProfitPct);
  }
  const avgGain = gains.reduce((s, g) => s + g, 0) / runs;
  const variance = gains.reduce((s, g) => s + Math.pow(g - avgGain, 2), 0) / runs;
  const stdev = Math.sqrt(variance);
  // Coefficient de variation → étoiles de stabilité (1-5). CV élevé = résultats erratiques.
  const cv = Math.abs(avgGain) > 0.5 ? stdev / Math.abs(avgGain) : 9;
  const stability = cv < 0.6 ? 5 : cv < 1.1 ? 4 : cv < 1.8 ? 3 : cv < 3 ? 2 : 1;
  const passRate = Math.round((passed / runs) * 100);
  const ruinRate = Math.round((ruined / runs) * 100);
  const riskLabel = ruinRate >= 35 ? "eleve" : ruinRate >= 15 ? "moyen" : "faible";
  const reco = (passRate >= 60 && riskLabel === "faible") ? "tresbon"
    : (passRate >= 45 && riskLabel !== "eleve") ? "bon"
    : (passRate >= 30) ? "moyen" : "faible";
  return { passRate, ruinRate, avgDD: +(ddSum / runs).toFixed(1), avgGain: +avgGain.toFixed(1), stdev: +stdev.toFixed(1), stability, riskLabel, reco };
}

// ══════════════════════════════════════════════════════════════════
// ÉCRAN LABORATOIRE — wizard de profil, analyse, roadmap, arbre de recherche
// ══════════════════════════════════════════════════════════════════
// Header commun des rapports (Analyse + Laboratoire) — niveau module car utilisé
// par LabScreen (module-level) ET CoachScreen. `function` = hoisté, zéro risque TDZ.
function ReportHeader({ title, subtitle, onBack }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
      <button onClick={onBack} style={{width:36,height:36,borderRadius:18,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)',fontSize:16,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>
      <div>
        <div style={{fontSize:17,fontWeight:800,color:'#fff',letterSpacing:-0.3}}>{title}</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{subtitle}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// BACKTEST RÉEL — sélection paire/période, téléchargement depuis
// GitHub Releases (fabmarc70/HISTDATA-), backtest déterministe local.
// ══════════════════════════════════════════════════════════════════
function BacktestScreen({ t, lang, onBack }) {
  const ACCENT = "#6ee7b7";
  const [datasets, setDatasets] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // ── Configuration (section 1) ──
  const [firmKey, setFirmKey] = useState("fundednext");
  const [modelKey, setModelKey] = useState("2step");
  const [capital, setCapital] = useState(25000);
  const [selectedPair, setSelectedPair] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [timeframeKey, setTimeframeKey] = useState("1");
  const [strategyKey, setStrategyKey] = useState("breakout");
  const [strategyParams, setStrategyParams] = useState({});
  const [tpPips, setTpPips] = useState(15);
  const [slPips, setSlPips] = useState(10);
  const [riskPct, setRiskPct] = useState(1);
  const [slippagePips, setSlippagePips] = useState(0.3);
  const [sessionKey, setSessionKey] = useState("24h");
  const [newsFilterOn, setNewsFilterOn] = useState(false);
  const [mmMode, setMmMode] = useState("fixed");
  const [martingaleMultiplier, setMartingaleMultiplier] = useState(2);
  const [martingaleMaxSteps, setMartingaleMaxSteps] = useState(5);
  const [gridSpacingPips, setGridSpacingPips] = useState(20);
  const [gridLevels, setGridLevels] = useState(5);
  const [gridDirection, setGridDirection] = useState("both");

  const [candles, setCandles] = useState(null);
  const [dlProgress, setDlProgress] = useState(null);
  const [dlError, setDlError] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(null);
  const [manifestLoading, setManifestLoading] = useState(true);
  const [history, setHistory] = useState(() => { try { return JSON.parse(localStorage.getItem("eapropfirm_backtest_history") || "[]"); } catch (e) { return []; } });
  const [showHistory, setShowHistory] = useState(false);

  const loadManifest = () => {
    setManifestLoading(true); setLoadError(null);
    // Timeout de sécurité : si le manifeste ne répond pas en 15s (réseau lent/bloqué),
    // on sort de l'état de chargement infini pour proposer un vrai message + réessayer.
    let done = false;
    const timeoutId = setTimeout(() => {
      if (!done) { done = true; setManifestLoading(false); setLoadError("Le chargement prend trop de temps (réseau lent ou instable). Réessaie."); }
    }, 15000);
    listAvailableDatasets(true).then(d => {
      if (done) return; done = true; clearTimeout(timeoutId);
      setDatasets(d); setManifestLoading(false);
      if (d.assets.length) { setSelectedPair(d.assets[0].pair); setSelectedPeriod(d.assets[0].period); }
    }).catch(e => {
      if (done) return; done = true; clearTimeout(timeoutId);
      setLoadError(e.message); setManifestLoading(false);
    });
  };

  useEffect(() => { loadManifest(); }, []);

  useEffect(() => {
    const def = listStrategies().find(s => s.key === strategyKey);
    setStrategyParams(def ? { ...def.defaultParams } : {});
  }, [strategyKey]);

  const pairs = datasets ? [...new Set(datasets.assets.map(a => a.pair))] : [];
  const periodsForPair = selectedPair && datasets ? datasets.assets.filter(a => a.pair === selectedPair).map(a => a.period) : [];
  const strategies = listStrategies();
  const firm = PROP_FIRMS[firmKey];
  const modelsForFirm = firm ? Object.keys(firm.models) : [];

  const resetBacktest = () => {
    setCandles(null); setResult(null); setScore(null); setDlError(null); setDlProgress(null);
  };

  const archiveResult = () => {
    if (!result || result.error) return;
    const entry = {
      id: Date.now(),
      savedAt: new Date().toISOString(),
      pair: selectedPair, period: selectedPeriod, strategyLabel: result.strategyLabel,
      timeframe: TIMEFRAMES.find(x => x.key === timeframeKey)?.label || "M1",
      firmName: firm?.name, modelName: firm?.models[modelKey]?.name,
      totalUSD: result.totalUSD, totalPct: result.totalPct, winrate: result.winrate,
      profitFactor: result.profitFactor, maxDrawdownPct: result.maxDrawdownPct, totalTrades: result.totalTrades,
      scoreVal: score?.score ?? null, passRate: score?.passRate ?? null,
    };
    const next = [entry, ...history].slice(0, 30); // 30 archives max, évite un localStorage qui grossit indéfiniment
    setHistory(next);
    try { localStorage.setItem("eapropfirm_backtest_history", JSON.stringify(next)); } catch (e) {}
  };

  const deleteArchive = (id) => {
    const next = history.filter(h => h.id !== id);
    setHistory(next);
    try { localStorage.setItem("eapropfirm_backtest_history", JSON.stringify(next)); } catch (e) {}
  };

  const handleDownload = async () => {
    if (!selectedPair || !selectedPeriod) return;
    setDlProgress(0); setDlError(null); setCandles(null); setResult(null);
    try {
      const data = await downloadCandles(selectedPair, selectedPeriod, { onProgress: setDlProgress });
      setCandles(data.candles);
      setDlProgress(null);
    } catch (e) { setDlError(e.message); setDlProgress(null); }
  };

  useEffect(() => { if (selectedPair && selectedPeriod) handleDownload(); }, [selectedPair, selectedPeriod]);

  const currentStrategyDefEarly = strategies.find(s => s.key === strategyKey);
  const isGridStrategy = !!currentStrategyDefEarly?.isGrid;

  const handleRun = () => {
    if (!candles) return;
    setRunning(true);
    setTimeout(() => {
      try {
        const tf = TIMEFRAMES.find(x => x.key === timeframeKey);
        const prepared = aggregateCandles(candles, tf ? tf.minutes : 1);
        const r = isGridStrategy
          ? runGridBacktest({
              candles: prepared, pair: selectedPair, capital, riskPct,
              spacingPips: gridSpacingPips, levels: gridLevels, direction: gridDirection, slippagePips,
            })
          : runBacktest({
              candles: prepared, pair: selectedPair, strategyKey, tpPips, slPips, strategyParams,
              capital, riskPct, slippagePips, sessionKey, newsFilterOn,
              mmMode, martingaleMultiplier, martingaleMaxSteps,
            });
        setResult(r);
        const sc = r.isGridResult ? null : computePropFirmScore(r, capital, firmKey, modelKey, labRunMonteCarlo);
        setScore(sc);
      } catch (e) {
        setResult({ error: e.message });
        setScore(null);
      }
      setRunning(false);
    }, 50);
  };

  const tier = (val, good, mid) => val >= good ? "#6ee7b7" : val >= mid ? "#fbbf24" : "#ef4444";
  const tierInv = (val, good, mid) => val <= good ? "#6ee7b7" : val <= mid ? "#fbbf24" : "#ef4444"; // plus bas = mieux (ex: drawdown)

  const Select = ({ label, value, onChange, options }) => (
    <div>
      <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.45)", marginBottom: 4, fontWeight: 700 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10, color: "#fff", padding: "9px 8px", fontSize: 12.5, fontWeight: 700, boxSizing: "border-box",
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const ScoreCircle = ({ val, size = 66, label, sub }) => {
    const color = val >= 65 ? "#6ee7b7" : val >= 40 ? "#fbbf24" : "#ef4444";
    const r = (size - 7) / 2, circ = 2 * Math.PI * r;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.max(0, Math.min(100, val)) / 100)}
            strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>
          <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize="17" fontWeight="900" fill={color}>{Math.round(val)}</text>
        </svg>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{label}</div>
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)" }}>{sub}</div>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ n, title }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
      <div style={{ width: 24, height: 24, borderRadius: 12, background: ACCENT + "18", border: "1.5px solid " + ACCENT, color: ACCENT, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</div>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</div>
    </div>
  );

  if (loadError) {
    return (
      <div style={{ minHeight: "100vh", paddingBottom: 100 }}>
        <ReportHeader title={t("an_backtest_title")} subtitle="Données réelles · zéro estimation" onBack={onBack} />
        <div className="card" style={{ textAlign: "center", padding: 20, border: "1px solid rgba(239,68,68,0.2)" }}>
          <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Impossible de charger les données</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>{loadError}</div>
          <button onClick={loadManifest} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid " + ACCENT, background: "transparent", color: ACCENT, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            ↻ Réessayer
          </button>
        </div>
      </div>
    );
  }
  // Écran de chargement explicite — avant, la page restait vide (return null)
  // tant que le manifeste réseau n'avait pas répondu, ce qui donnait
  // l'impression que "la page a du mal à s'ouvrir" sans aucun retour visuel.
  if (manifestLoading || !datasets) {
    return (
      <div style={{ minHeight: "100vh", paddingBottom: 100 }}>
        <ReportHeader title={t("an_backtest_title")} subtitle="Données réelles · zéro estimation" onBack={onBack} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 17, border: "3px solid rgba(110,231,183,0.15)", borderTopColor: ACCENT, animation: "eapfp-spin 0.8s linear infinite" }} />
          <style>{"@keyframes eapfp-spin { to { transform: rotate(360deg); } }"}</style>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Connexion aux données historiques…</div>
        </div>
      </div>
    );
  }

  const currentStrategyDef = currentStrategyDefEarly;

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 100 }}>
      <ReportHeader title={t("an_backtest_title")} subtitle="Données réelles · zéro estimation" onBack={onBack} />

      {history.length > 0 && (
        <button onClick={() => setShowHistory(true)} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", borderRadius: 12, marginBottom: 12, cursor: "pointer",
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>📂 Historique des backtests archivés</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{history.length} →</span>
        </button>
      )}

      {showHistory && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(3,6,10,0.92)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(16px + env(safe-area-inset-top)) 16px 12px" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Backtests archivés</div>
            <button onClick={() => setShowHistory(false)} style={{ width: 32, height: 32, borderRadius: 16, background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", fontSize: 15, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px" }}>
            {history.length === 0 && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 40 }}>Aucune archive pour le moment.</div>}
            {history.map(h => (
              <div key={h.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{h.pair} · {h.strategyLabel}</div>
                    <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)" }}>{h.timeframe} · {h.period} · {h.firmName} {h.modelName}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{new Date(h.savedAt).toLocaleString()}</div>
                  </div>
                  <button onClick={() => deleteArchive(h.id)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 11, cursor: "pointer", padding: 4 }}>Suppr.</button>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: h.totalUSD >= 0 ? ACCENT : "#ef4444" }}>{(h.totalUSD >= 0 ? "+$" : "-$") + Math.abs(h.totalUSD).toLocaleString()} ({h.totalPct >= 0 ? "+" : ""}{h.totalPct}%)</span>
                  <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)" }}>WR {h.winrate}%</span>
                  <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)" }}>PF {h.profitFactor === Infinity ? "∞" : h.profitFactor}</span>
                  <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)" }}>DD -{h.maxDrawdownPct}%</span>
                  <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)" }}>{h.totalTrades} trades</span>
                  {h.scoreVal != null && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#a78bfa" }}>Score {h.scoreVal}/100</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "10px 12px", marginBottom: 14, fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
        ⚠️ Stratégies déterministes (breakout, RSI, MACD) sur données réelles. Filtre news = estimation d'horaires à risque (pas un calendrier économique réel). Ne remplace pas un forward test.
      </div>

      {/* ══ SECTION 1 — CONFIGURATION ══ */}
      <div className="card">
        <SectionHeader n="1" title="Configuration du backtest" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <Select label="Prop firm" value={firmKey} onChange={v => { setFirmKey(v); setModelKey(Object.keys(PROP_FIRMS[v].models)[0]); }}
            options={Object.keys(PROP_FIRMS).map(k => ({ value: k, label: PROP_FIRMS[k].name }))} />
          <Select label="Type de challenge" value={modelKey} onChange={setModelKey}
            options={modelsForFirm.map(k => ({ value: k, label: firm.models[k].name }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <Select label="Solde du challenge" value={capital} onChange={v => setCapital(parseInt(v))}
            options={CAPITAL_OPTIONS.map(c => ({ value: c, label: "$" + c.toLocaleString() }))} />
          <Select label="Actif" value={selectedPair || ""} onChange={v => { setSelectedPair(v); setSelectedPeriod(datasets.assets.find(a => a.pair === v)?.period || null); }}
            options={pairs.map(p => ({ value: p, label: p }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <Select label="Timeframe" value={timeframeKey} onChange={setTimeframeKey}
            options={TIMEFRAMES.map(tf => ({ value: tf.key, label: tf.label }))} />
          <Select label="Période" value={selectedPeriod || ""} onChange={setSelectedPeriod}
            options={periodsForPair.map(p => ({ value: p, label: p }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <Select label="Stratégie" value={strategyKey} onChange={setStrategyKey}
            options={strategies.map(s => ({ value: s.key, label: (s.category ? "[" + s.category + "] " : "") + s.label }))} />
          <Select label="Gestion du risque" value={mmMode} onChange={setMmMode}
            options={MONEY_MANAGEMENT_MODES.map(m => ({ value: m.key, label: m.label }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <Select label="Frais & slippage" value={slippagePips} onChange={v => setSlippagePips(parseFloat(v))}
            options={[0, 0.2, 0.5, 1].map(s => ({ value: s, label: s === 0 ? "Aucun (idéal)" : "Spread + " + s + " pip" }))} />
          {isGridStrategy ? (
            <Select label="Risque total (% capital)" value={riskPct} onChange={v => setRiskPct(parseFloat(v))}
              options={[0.5, 1, 2, 3, 5].map(r => ({ value: r, label: r + "% réparti sur la grille" }))} />
          ) : (
            <Select label="Heures de trading" value={sessionKey} onChange={setSessionKey}
              options={SESSIONS.map(s => ({ value: s.key, label: s.label }))} />
          )}
        </div>
        {!isGridStrategy && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <Select label="Risque par trade (%)" value={riskPct} onChange={v => setRiskPct(parseFloat(v))}
              options={[0.25, 0.5, 1, 1.5, 2].map(r => ({ value: r, label: r + "%" }))} />
            {mmMode === "martingale" ? (
              <Select label="Multiplicateur martingale" value={martingaleMultiplier} onChange={v => setMartingaleMultiplier(parseFloat(v))}
                options={[1.5, 2, 2.5, 3].map(m => ({ value: m, label: "×" + m }))} />
            ) : <div />}
          </div>
        )}
        {!isGridStrategy && mmMode === "martingale" && (
          <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 10, marginBottom: 8, fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
            ⚠️ La Martingale double la mise après chaque perte pour "rattraper" le capital — cela amplifie mécaniquement le risque de ruine. Le drawdown sera très probablement bien plus élevé qu'en risque fixe. Plafond de doublements : {martingaleMaxSteps}.
          </div>
        )}

        {/* Paramètres spécifiques à la stratégie (ou à la grille) */}
        {isGridStrategy ? (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 8 }}>Configuration de la grille</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, marginBottom: 2 }}>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>Écart entre niveaux (pips)</span>
                <span style={{ fontWeight: 800, color: ACCENT }}>{gridSpacingPips}</span>
              </div>
              <input type="range" min={5} max={100} step={1} value={gridSpacingPips} onChange={e => setGridSpacingPips(parseFloat(e.target.value))} style={{ width: "100%", accentColor: ACCENT }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, marginBottom: 2 }}>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>Nombre de niveaux (de chaque côté)</span>
                <span style={{ fontWeight: 800, color: ACCENT }}>{gridLevels}</span>
              </div>
              <input type="range" min={2} max={15} step={1} value={gridLevels} onChange={e => setGridLevels(parseInt(e.target.value))} style={{ width: "100%", accentColor: ACCENT }} />
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              {[{ k: "both", l: "Achat + Vente" }, { k: "buy", l: "Achat seul" }, { k: "sell", l: "Vente seule" }].map(d => (
                <button key={d.k} onClick={() => setGridDirection(d.k)} style={{
                  flex: 1, padding: "8px 6px", borderRadius: 8, cursor: "pointer", fontSize: 10.5, fontWeight: 700,
                  background: gridDirection === d.k ? ACCENT + "22" : "rgba(255,255,255,0.04)",
                  color: gridDirection === d.k ? ACCENT : "rgba(255,255,255,0.6)",
                  border: "1px solid " + (gridDirection === d.k ? ACCENT : "rgba(255,255,255,0.1)"),
                }}>{d.l}</button>
              ))}
            </div>
            <div style={{ fontSize: 9.5, color: "rgba(239,68,68,0.75)", marginTop: 8, lineHeight: 1.4 }}>⚠️ Pas de stop loss par niveau (caractéristique réelle des grilles) — le risque est dans le drawdown flottant, suivi et affiché honnêtement dans les résultats.</div>
          </div>
        ) : currentStrategyDef && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 8 }}>Setup d'entrée — {currentStrategyDef.label}</div>
            {currentStrategyDef.paramDefs.map(pd => (
              <div key={pd.key} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, marginBottom: 2 }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>{pd.label}</span>
                  <span style={{ fontWeight: 800, color: ACCENT }}>{strategyParams[pd.key]}</span>
                </div>
                <input type="range" min={pd.min} max={pd.max} step={pd.step} value={strategyParams[pd.key] ?? pd.min}
                  onChange={e => setStrategyParams(sp => ({ ...sp, [pd.key]: parseFloat(e.target.value) }))}
                  style={{ width: "100%", accentColor: ACCENT }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>Take Profit (pips)</div>
                <input type="number" value={tpPips} min={1} max={200} onChange={e => setTpPips(parseFloat(e.target.value) || 1)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", padding: "6px 8px", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>Stop Loss (pips)</div>
                <input type="number" value={slPips} min={1} max={200} onChange={e => setSlPips(parseFloat(e.target.value) || 1)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", padding: "6px 8px", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>
          </div>
        )}

        {!isGridStrategy && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "9px 12px", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Filtre news</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Estimation horaires à risque (NFP/FOMC/CPI)</div>
          </div>
          <div onClick={() => setNewsFilterOn(v => !v)} style={{ width: 38, height: 21, borderRadius: 11, background: newsFilterOn ? ACCENT : "rgba(255,255,255,0.12)", position: "relative", cursor: "pointer", transition: "all .2s" }}>
            <div style={{ position: "absolute", top: 2, left: newsFilterOn ? 19 : 2, width: 17, height: 17, borderRadius: 9, background: "#fff", transition: "all .2s" }} />

          </div>
        </div>
        )}

        <div style={{ fontSize: 10.5, color: dlProgress !== null ? "#fbbf24" : candles ? ACCENT : dlError ? "#ef4444" : "rgba(255,255,255,0.4)", marginBottom: 10, textAlign: "center" }}>
          {dlProgress !== null ? `Téléchargement des données… ${dlProgress}%` : candles ? `✓ ${candles.length.toLocaleString()} bougies M1 chargées (${selectedPair} · ${selectedPeriod})` : dlError || "En attente de données…"}
        </div>

        <button onClick={handleRun} disabled={!candles || running} style={{
          width: "100%", padding: 15, borderRadius: 13, border: "none",
          cursor: (!candles || running) ? "default" : "pointer",
          background: (!candles || running) ? "rgba(255,255,255,0.07)" : `linear-gradient(135deg,${ACCENT},#34d399)`,
          color: (!candles || running) ? "rgba(255,255,255,0.3)" : "#000", fontSize: 14, fontWeight: 800,
        }}>
          {running ? "Calcul en cours…" : "▶ Lancer le backtest"}
        </button>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 6 }}>Simulation locale, calcul instantané — pas de données inventées</div>
      </div>

      {/* ══ SECTION 2 — RÉSULTATS ══ */}
      {result && !result.error && (
        <div className="card">
          <SectionHeader n="2" title="Résultats du backtest" />
          {result.equityCurve.length > 2 && (
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={result.equityCurve}>
                <defs>
                  <linearGradient id="btEquityUSD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={result.totalUSD >= 0 ? ACCENT : "#ef4444"} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={result.totalUSD >= 0 ? ACCENT : "#ef4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "T" + v} />
                <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "$" + (v/1000).toFixed(0) + "k"} domain={["auto","auto"]} />
                <Tooltip formatter={v => "$" + v.toLocaleString()} contentStyle={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 11 }} />
                <Area type="monotone" dataKey="usd" stroke={result.totalUSD >= 0 ? ACCENT : "#ef4444"} strokeWidth={2} fill="url(#btEquityUSD)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
            {(result.isGridResult ? [
              { l: "Gain net", v: (result.totalUSD >= 0 ? "+$" : "-$") + Math.abs(result.totalUSD).toLocaleString(), sub: (result.totalPct >= 0 ? "+" : "") + result.totalPct + "%", c: result.totalUSD >= 0 ? ACCENT : "#ef4444" },
              { l: "Niveaux clôturés", v: result.totalTrades, c: "#fff" },
              { l: "Drawdown flottant max", v: "-" + result.maxDrawdownPct + "%", sub: "-$" + result.maxDrawdownUSD.toLocaleString(), c: tierInv(result.maxDrawdownPct, 8, 15) },
              { l: "Niveaux ouverts", v: result.openLevelsCount + " / " + result.gridLevelsTotal, c: "rgba(255,255,255,0.85)" },
            ] : [
              { l: "Gain net", v: (result.totalUSD >= 0 ? "+$" : "-$") + Math.abs(result.totalUSD).toLocaleString(), sub: (result.totalPct >= 0 ? "+" : "") + result.totalPct + "%", c: result.totalUSD >= 0 ? ACCENT : "#ef4444" },
              { l: "Profit Factor", v: result.profitFactor === Infinity ? "∞" : result.profitFactor, c: tier(result.profitFactor, 1.5, 1) },
              { l: "Win Rate", v: result.winrate + "%", c: tier(result.winrate, 55, 40) },
              { l: "R Ratio", v: "1:" + result.rRatio, c: tier(result.rRatio, 1.5, 1) },
              { l: "Drawdown max", v: "-" + result.maxDrawdownPct + "%", sub: "-$" + result.maxDrawdownUSD.toLocaleString(), c: tierInv(result.maxDrawdownPct, 8, 15) },
              { l: "Trades", v: result.totalTrades, c: "#fff" },
            ]).map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "9px 10px" }}>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{k.l}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: k.c }}>{k.v}</div>
                {k.sub && <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)" }}>{k.sub}</div>}
              </div>
            ))}
          </div>

          {score && (
            <div style={{ display: "flex", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <ScoreCircle val={score.score} label={score.score >= 65 ? "Très bon" : score.score >= 40 ? "Correct" : "Faible"} sub={`${firm.name} ${firm.models[modelKey].name}`} />
              <ScoreCircle val={score.passRate} label={score.passRate >= 55 ? "Élevée" : score.passRate >= 30 ? "Moyenne" : "Faible"} sub={"Probabilité de réussite · Monte Carlo"} />
            </div>
          )}
          {!score && !result.isGridResult && result.totalTrades < 10 && (
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginTop: 10, textAlign: "center" }}>Échantillon trop faible (&lt;10 trades) pour un score fiable — élargis la période.</div>
          )}
          {result.isGridResult && (
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginTop: 10, textAlign: "center" }}>Score PropFirm non calculé pour Grid Trading — le drawdown flottant sans stop loss rend une simulation Monte Carlo standard peu représentative.</div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={archiveResult} style={{ flex: 1, padding: 11, borderRadius: 10, border: "1px solid " + ACCENT + "55", background: ACCENT + "12", color: ACCENT, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
              📥 Archiver ce résultat
            </button>
            <button onClick={resetBacktest} style={{ flex: 1, padding: 11, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
              ↺ Réinitialiser
            </button>
          </div>
        </div>
      )}
      {result?.error && <div style={{ fontSize: 12, color: "#ef4444", textAlign: "center", padding: 20 }}>{result.error}</div>}

      {/* ══ SECTION 3 — DIAGNOSTIC (regles deterministes, pas d'IA) ══ */}
      {result && !result.error && !result.isGridResult && (() => {
        const forces = [], faiblesses = [], recos = [];
        if (result.maxDrawdownPct < 8) forces.push("Drawdown maîtrisé (< 8%)");
        if (result.profitFactor >= 1.3) forces.push("Profit Factor solide (≥ 1.3)");
        if (result.maxLossStreak <= 4) forces.push("Séries de pertes courtes");
        const worstDay = [...result.byDow].filter(d => d.count >= 3).sort((a, b) => (a.winrate ?? 100) - (b.winrate ?? 100))[0];
        if (worstDay && worstDay.winrate != null && worstDay.winrate < result.winrate - 10) faiblesses.push(`Performance faible le ${worstDay.label} (${worstDay.winrate}% WR)`);
        if (Math.abs((result.longWinrate ?? result.winrate) - (result.shortWinrate ?? result.winrate)) > 15) faiblesses.push("Déséquilibre fort entre Long et Short");
        if (result.rRatio < 1) faiblesses.push("R Ratio < 1 — les pertes pèsent plus que les gains");
        if (result.maxDrawdownPct >= 15) faiblesses.push("Drawdown élevé (≥ 15%)");
        if (result.rRatio < 1.5) recos.push("Viser un R Ratio ≥ 1.5 (TP plus large ou SL plus serré)");
        if (worstDay && worstDay.winrate != null && worstDay.winrate < 40) recos.push(`Éviter de trader le ${worstDay.label}`);
        if (result.maxLossStreak >= 6) recos.push("Réduire le risque/trade — séries de pertes longues détectées");
        if (!newsFilterOn) recos.push("Teste avec le filtre news activé pour comparer");
        return (
          <div className="card">
            <SectionHeader n="3" title="Diagnostic automatique" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: "rgba(110,231,183,0.05)", border: "1px solid rgba(110,231,183,0.15)", borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: ACCENT, marginBottom: 6 }}>✓ Points forts</div>
                {forces.length ? forces.map((f, i) => <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", padding: "2px 0" }}>• {f}</div>) : <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Aucun point fort net détecté</div>}
              </div>
              <div style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: "#fbbf24", marginBottom: 6 }}>⚠ Points faibles</div>
                {faiblesses.length ? faiblesses.map((f, i) => <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", padding: "2px 0" }}>• {f}</div>) : <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Aucune faiblesse majeure détectée</div>}
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>◆ Recommandations</div>
                {recos.length ? recos.map((f, i) => <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", padding: "2px 0" }}>• {f}</div>) : <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Rien à signaler</div>}
              </div>
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 10, lineHeight: 1.4 }}>Diagnostic calculé par règles déterministes sur les résultats réels du backtest — aucune IA, aucune donnée inventée.</div>
          </div>
        );
      })()}
    </div>
  );
}


function LabScreen({ t, lang, profile, onBack }) {
  const LAB_KEY = "eapropfirm_lab_profile";
  const EMPTY = { bot: null, entries: [], exits: [], indicators: [], approach: null, market: null, sessions: [], freeDesc: "", riskChoice: null, tpdChoice: null, newsBehavior: null, firmTarget: null };
  const [sel, setSel] = useState(() => { try { return JSON.parse(localStorage.getItem(LAB_KEY)) || EMPTY; } catch (e) { return EMPTY; } });
  const [step, setStep] = useState(sel.bot ? 99 : 0);
  const [research, setResearch] = useState(null);
  const [researching, setResearching] = useState(false);
  // Paramètres override interactifs (sliders résultats)
  const [ovWR, setOvWR] = useState(null);
  const [ovRR, setOvRR] = useState(null);
  const [ovRisk, setOvRisk] = useState(null);
  // Nœud sélectionné dans l'arbre
  const [treeSelected, setTreeSelected] = useState(null);
  const advanceRef = useRef(null);

  const save = (next) => { setSel(next); try { localStorage.setItem(LAB_KEY, JSON.stringify(next)); } catch (e) {} };
  const capital = profile?.capital || 25000;
  const firmKey = sel.firmTarget || profile?.firmKey || "fundednext";
  const modelKey = Object.keys((PROP_FIRMS[firmKey] || PROP_FIRMS.fundednext).models)[0];
  const isAuto = labIsAuto(sel.bot);

  // Analyse avec overrides interactifs
  const baseAnalysis = sel.bot ? labAnalyzeProfile(sel) : null;
  const analysis = baseAnalysis ? (() => {
    if (ovWR === null && ovRR === null && ovRisk === null) return baseAnalysis;
    const pOverride = { ...baseAnalysis.params,
      winrate: ovWR !== null ? ovWR : baseAnalysis.params.winrate,
      rr: ovRR !== null ? ovRR : baseAnalysis.params.rr,
      riskPct: ovRisk !== null ? ovRisk : baseAnalysis.params.riskPct,
    };
    const expectancy = (pOverride.winrate / 100) * pOverride.rr - (1 - pOverride.winrate / 100);
    const profitFactor = pOverride.winrate > 0 ? +((pOverride.winrate / 100 * pOverride.rr) / (1 - pOverride.winrate / 100)).toFixed(2) : 0;
    const kellyCriterion = +(pOverride.winrate / 100 - (1 - pOverride.winrate / 100) / pOverride.rr).toFixed(4);
    const maxConsecLoss = Math.max(2, Math.round(Math.log(0.02) / Math.log(1 - pOverride.winrate / 100)));
    const scores = {
      ...baseAnalysis.scores,
      esperance: Math.max(0, Math.min(100, Math.round(50 + expectancy * 120))),
      survie: Math.max(10, Math.min(95, baseAnalysis.scores.survie - (pOverride.riskPct - baseAnalysis.params.riskPct) * 18)),
    };
    const global = Math.round((scores.robustesse + scores.survie * 1.5 + scores.propfirm * 1.5 + scores.esperance + scores.scalabilite) / 6);
    return { ...baseAnalysis, params: pOverride, expectancy, scores, global, kpis: { ...baseAnalysis.kpis, profitFactor, kellyCriterion, maxConsecLoss } };
  })() : null;

  const autoNext = (nextSel, stepIdx) => {
    save(nextSel);
    if (advanceRef.current) clearTimeout(advanceRef.current);
    advanceRef.current = setTimeout(() => {
      const done = (() => {
        if (stepIdx === 0) return !!nextSel.bot;
        if (stepIdx === 1) return !!nextSel.approach;
        if (stepIdx === 3) return !!nextSel.riskChoice && !!nextSel.tpdChoice;
        if (stepIdx === 4) return !!nextSel.newsBehavior && (nextSel.sessions || []).length > 0;
        if (stepIdx === 5) return !!nextSel.firmTarget && !!nextSel.market;
        return false;
      })();
      if (done) setStep(stepIdx + 1 >= 6 ? 99 : stepIdx + 1);
    }, 340);
  };

  const STEPS = [
    { key: "style",  label: "Style",      sub: "Type de trading" },
    { key: "method", label: "Méthode",    sub: "Indicateurs" },
    { key: "inout",  label: "Entrées /",  sub: "Sorties" },
    { key: "risk",   label: "Risque",     sub: "Sizing" },
    { key: "news",   label: "News &",     sub: "Sessions" },
    { key: "firm",   label: "Marché &",   sub: "Prop firm" },
  ];
  const RISK_CHOICES = [0.25, 0.35, 0.5, 1, 2];
  const TPD_CHOICES = [{ k:1.5, l:"1-2/j" }, { k:3, l:"3-4/j" }, { k:6, l:"5-8/j" }, { k:12, l:"9+/j" }];
  const NEWS_CHOICES = [{ k:"avoid", l:"J'évite les news" }, { k:"reduce", l:"Je réduis le risque" }, { k:"trade", l:"Je trade les news" }];
  const FIRM_CHOICES = Object.keys(PROP_FIRMS).map(k => ({ k, l: PROP_FIRMS[k].name }));
  const stepDone = (i) => {
    if (i === 0) return !!sel.bot;
    if (i === 1) return !!sel.approach;
    if (i === 2) return (sel.entries || []).length > 0 && (sel.exits || []).length > 0;
    if (i === 3) return !!sel.riskChoice && !!sel.tpdChoice;
    if (i === 4) return !!sel.newsBehavior && (sel.sessions || []).length > 0;
    if (i === 5) return !!sel.firmTarget && !!sel.market;
    return false;
  };

  const Pill = ({ active, onClick, children, accent = "#6ee7b7", disabled = false }) => (
    <button onClick={disabled ? undefined : onClick} style={{
      padding: "9px 14px", borderRadius: 100, cursor: disabled ? "default" : "pointer", fontSize: 12, fontWeight: 600,
      background: active ? accent + "22" : "rgba(255,255,255,0.04)",
      border: `1.5px solid ${active ? accent : "rgba(255,255,255,0.1)"}`,
      color: active ? accent : disabled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.6)",
      opacity: disabled ? 0.45 : 1, transition: "all .15s",
    }}>{children}</button>
  );
  const SectionLabel = ({ children }) => <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>{children}</div>;
  const mcColor = (r) => r >= 55 ? "#6ee7b7" : r >= 30 ? "#fbbf24" : "#ef4444";

  const LabStepper = () => (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 10px 10px", marginBottom: 8 }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: "#fff", margin: "0 0 11px 6px" }}>Parcours de création</div>
      <div style={{ display: "flex", alignItems: "flex-start", overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
        {STEPS.map((s, i) => {
          const done = i < step || (step === 99), active = i === step;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "flex-start", flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 72 }}>
                <button onClick={() => step === 99 || i < step ? setStep(i) : null}
                  style={{ width: 34, height: 34, borderRadius: 17, display: "flex", alignItems: "center", justifyContent: "center",
                    background: done ? "#6ee7b7" : active ? "rgba(110,231,183,0.12)" : "rgba(255,255,255,0.05)",
                    border: `2px solid ${done || active ? "#6ee7b7" : "rgba(255,255,255,0.15)"}`,
                    fontSize: 13, fontWeight: 800, color: done ? "#000" : active ? "#6ee7b7" : "rgba(255,255,255,0.4)",
                    cursor: (done || step === 99) ? "pointer" : "default", transition: "all .2s" }}>
                  {done ? "✓" : i + 1}
                </button>
                <div style={{ fontSize: 9, fontWeight: 700, color: active ? "#6ee7b7" : done ? "rgba(110,231,183,0.8)" : "rgba(255,255,255,0.55)", marginTop: 5, textAlign: "center", lineHeight: 1.2 }}>{s.label}</div>
                <div style={{ fontSize: 8, color: active ? "rgba(110,231,183,0.65)" : "rgba(255,255,255,0.3)", textAlign: "center", lineHeight: 1.1 }}>{s.sub}</div>
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 20, height: 2, borderRadius: 1, marginTop: 16, flexShrink: 0, background: done ? "#6ee7b7" : "rgba(255,255,255,0.12)", transition: "background .25s" }} />}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── WIZARD ──
  if (step < 6) {
    // Items filtrés selon le style choisi
    const filteredEntries = labFilterItems(TRADING_KB.entries, sel.bot);
    const filteredExits = labFilterItems(TRADING_KB.exits, sel.bot);
    const filteredIndicators = labFilterItems(TRADING_KB.indicators, sel.bot);
    const botLabel = isAuto ? "automatique" : "manuel";
    return (
      <div style={{ minHeight: "100vh", paddingBottom: 100, display: "flex", flexDirection: "column" }}>
        <ReportHeader title="Laboratoire" subtitle={`Étape ${step + 1}/6 · ${STEPS[step].label} ${STEPS[step].sub}`} onBack={step === 0 ? onBack : () => setStep(step - 1)} />
        <LabStepper />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "42vh", padding: "14px 2px" }}>
          {step === 0 && (<>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 3, textAlign: "center" }}>Quel est ton style de trading ?</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 14, textAlign: "center" }}>Ton choix adapte automatiquement les étapes suivantes</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {TRADING_KB.botTypes.map(it => (
                <Pill key={it.k} active={sel.bot === it.k} onClick={() => autoNext({ ...EMPTY, bot: it.k }, 0)}>{it.label}</Pill>
              ))}
            </div>
            {sel.bot && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 10, background: "rgba(110,231,183,0.06)", border: "1px solid rgba(110,231,183,0.15)", fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
              {(TRADING_KB.botTypes.find(b => b.k === sel.bot) || {}).note}
            </div>}
          </>)}
          {step === 1 && (<>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 3, textAlign: "center" }}>Ta méthode d'analyse {isAuto ? "(algorithmique)" : "(manuelle)"}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 14, textAlign: "center" }}>Filtré pour un style {botLabel}</div>
            <SectionLabel>Indicateurs / signaux utilisés</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
              {filteredIndicators.map(it => <Pill key={it.k} active={(sel.indicators || []).includes(it.k)} onClick={() => {
                const next = { ...sel, indicators: (sel.indicators || []).includes(it.k) ? sel.indicators.filter(x => x !== it.k) : [...(sel.indicators || []), it.k] };
                save(next);
              }}>{it.label}</Pill>)}
            </div>
            <SectionLabel>Approche globale — avance automatiquement</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {TRADING_KB.approach.map(a => <Pill key={a.k} active={sel.approach === a.k} onClick={() => autoNext({ ...sel, approach: a.k }, 1)}>{a.label}</Pill>)}
            </div>
          </>)}
          {step === 2 && (<>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 3, textAlign: "center" }}>Entrées & sorties</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 14, textAlign: "center" }}>Sélections adaptées à un style {botLabel}</div>
            <SectionLabel>Types d'entrée</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
              {filteredEntries.map(it => <Pill key={it.k} active={(sel.entries || []).includes(it.k)} onClick={() => {
                const next = { ...sel, entries: (sel.entries || []).includes(it.k) ? sel.entries.filter(x => x !== it.k) : [...(sel.entries || []), it.k] };
                save(next);
              }}>{it.label}</Pill>)}
            </div>
            <SectionLabel>Types de sortie</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {filteredExits.map(it => <Pill key={it.k} active={(sel.exits || []).includes(it.k)} onClick={() => {
                const next = { ...sel, exits: (sel.exits || []).includes(it.k) ? sel.exits.filter(x => x !== it.k) : [...(sel.exits || []), it.k] };
                save(next);
              }}>{it.label}</Pill>)}
            </div>
          </>)}
          {step === 3 && (<>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 14, textAlign: "center" }}>Gestion du risque</div>
            <SectionLabel>Risque par trade (% du capital)</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
              {RISK_CHOICES.map(r => <Pill key={r} active={sel.riskChoice === r} onClick={() => autoNext({ ...sel, riskChoice: r }, 3)}>{r}%</Pill>)}
            </div>
            <SectionLabel>Fréquence de trading (moyenne)</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {TPD_CHOICES.map(x => <Pill key={x.k} active={sel.tpdChoice === x.k} onClick={() => autoNext({ ...sel, tpdChoice: x.k }, 3)}>{x.l}</Pill>)}
            </div>
            {isAuto && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 10, background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)", fontSize: 10.5, color: "rgba(255,255,255,0.5)" }}>
              Bot : le risque par lot est calculé avant chaque trade. Un risque &gt; 1% amplifie l'exposition sur les séries perdantes automatiques.
            </div>}
          </>)}
          {step === 4 && (<>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 14, textAlign: "center" }}>News & sessions</div>
            <SectionLabel>Comportement sur annonces (NFP, FOMC, CPI…)</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
              {NEWS_CHOICES.map(n => <Pill key={n.k} active={sel.newsBehavior === n.k} onClick={() => autoNext({ ...sel, newsBehavior: n.k }, 4)}>{n.l}</Pill>)}
            </div>
            <SectionLabel>Sessions tradées</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {TRADING_KB.sessions.map(sn => <Pill key={sn.k} active={(sel.sessions || []).includes(sn.k)} onClick={() => {
                const next = { ...sel, sessions: (sel.sessions || []).includes(sn.k) ? sel.sessions.filter(x => x !== sn.k) : [...(sel.sessions || []), sn.k] };
                autoNext(next, 4);
              }}>{sn.label}</Pill>)}
            </div>
          </>)}
          {step === 5 && (<>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 14, textAlign: "center" }}>Marché & prop firm visée</div>
            <SectionLabel>Marché principal</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
              {TRADING_KB.markets.map(m => <Pill key={m.k} active={sel.market === m.k} onClick={() => autoNext({ ...sel, market: m.k }, 5)}>{m.label}</Pill>)}
            </div>
            <SectionLabel>Prop firm visée</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
              {FIRM_CHOICES.map(f => <Pill key={f.k} active={sel.firmTarget === f.k} onClick={() => autoNext({ ...sel, firmTarget: f.k }, 5)}>{f.l}</Pill>)}
            </div>
            <SectionLabel>Décris ta méthode en quelques mots (optionnel)</SectionLabel>
            <textarea value={sel.freeDesc || ""} onChange={e => save({ ...sel, freeDesc: e.target.value })} rows={2}
              placeholder={isAuto ? "Ex: EA breakout sur H1 XAUUSD, entrée sur ATR élevé, SL adaptatif 1.2× ATR…" : "Ex: j'entre sur retest de zone H4 après sweep de liquidité…"}
              style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 12, color: "#fff", fontSize: 13, outline: "none", resize: "vertical" }} />
          </>)}
        </div>
        <div style={{ position: "fixed", bottom: 70, left: 0, right: 0, padding: "0 16px 8px", zIndex: 50, background: "linear-gradient(0deg, rgba(6,9,15,1) 80%, rgba(6,9,15,0) 100%)" }}>
          <button onClick={() => setStep(step + 1 >= 6 ? 99 : step + 1)} disabled={!stepDone(step)}
            style={{ width: "100%", padding: 14, borderRadius: 13, border: "none", cursor: "pointer",
              background: !stepDone(step) ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg,#6ee7b7,#34d399)",
              color: !stepDone(step) ? "rgba(255,255,255,0.3)" : "#000", fontSize: 14, fontWeight: 800 }}>
            {step + 1 >= 6 ? "⚗ Analyser" : "Suivant →"}
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) { setStep(0); return null; }

  // ── RÉSULTATS INTERACTIFS ──
  const displayWR = ovWR !== null ? ovWR : analysis.params.winrate;
  const displayRR = ovRR !== null ? ovRR : analysis.params.rr;
  const displayRisk = ovRisk !== null ? ovRisk : analysis.params.riskPct;

  const LabRadar = ({ scores }) => {
    const AXES = [
      { label: "Rentabilité", val: scores.esperance },
      { label: "Stabilité",   val: scores.robustesse },
      { label: "Discipline",  val: scores.discipline ?? 60 },
      { label: "DD Control",  val: scores.survie },
      { label: "Robustesse",  val: scores.propfirm },
      { label: "Adaptabilité",val: scores.scalabilite },
    ];
    const CX = 90, CY = 78, R = 58;
    const pt = (i, r) => { const a = (Math.PI * 2 * i) / 6 - Math.PI / 2; return [CX + Math.cos(a) * r, CY + Math.sin(a) * r]; };
    const poly = (r) => AXES.map((_, i) => pt(i, r).join(",")).join(" ");
    const dataPoly = AXES.map((ax, i) => pt(i, (Math.max(5, ax.val) / 100) * R).join(",")).join(" ");
    return (
      <svg viewBox="0 0 180 160" width="170" height="150">
        <defs>
          <linearGradient id="rFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.32"/><stop offset="100%" stopColor="#a78bfa" stopOpacity="0.32"/>
          </linearGradient>
          <linearGradient id="rStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee"/><stop offset="100%" stopColor="#a78bfa"/>
          </linearGradient>
        </defs>
        {[1, 2/3, 1/3].map((f, j) => {
          // Grille en cercles doux (approximation hexagonale lissée) via bezier
          const gPts = AXES.map((_, i) => pt(i, R * f));
          const gd = gPts.map((p, i) => {
            const prev = gPts[(i + AXES.length - 1) % AXES.length];
            const next = gPts[(i + 1) % AXES.length];
            const cp1 = [p[0] + (next[0] - prev[0]) * 0.15, p[1] + (next[1] - prev[1]) * 0.15];
            const cp2 = [next[0] - (gPts[(i + 2) % AXES.length][0] - p[0]) * 0.15, next[1] - (gPts[(i + 2) % AXES.length][1] - p[1]) * 0.15];
            return i === 0 ? `M ${p[0]} ${p[1]}` : `C ${cp1[0]} ${cp1[1]}, ${cp2[0]} ${cp2[1]}, ${next[0]} ${next[1]}`;
          }).join(' ') + ' Z';
          return <path key={j} d={gd} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1"/>;
        })}
        {AXES.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>; })}
        {(() => {
          const dPts = AXES.map((ax, i) => pt(i, (Math.max(5, ax.val) / 100) * R));
          const dd = dPts.map((p, i) => {
            const prev = dPts[(i + dPts.length - 1) % dPts.length];
            const next = dPts[(i + 1) % dPts.length];
            const cp1 = [p[0] + (next[0] - prev[0]) * 0.2, p[1] + (next[1] - prev[1]) * 0.2];
            const cp2 = [next[0] - (dPts[(i + 2) % dPts.length][0] - p[0]) * 0.2, next[1] - (dPts[(i + 2) % dPts.length][1] - p[1]) * 0.2];
            return i === 0 ? `M ${p[0]} ${p[1]}` : `C ${cp1[0]} ${cp1[1]}, ${cp2[0]} ${cp2[1]}, ${next[0]} ${next[1]}`;
          }).join(' ') + ' Z';
          return <><path d={dd} fill="url(#rFill)" strokeWidth="0"/><path d={dd} fill="none" stroke="url(#rStroke)" strokeWidth="2"/></>;
        })()}
        {AXES.map((ax, i) => { const [x, y] = pt(i, (Math.max(5, ax.val) / 100) * R); return <circle key={i} cx={x} cy={y} r="3" fill={i < 3 ? "#22d3ee" : "#a78bfa"} stroke="#0a0e14" strokeWidth="1.4"/>; })}
        {AXES.map((ax, i) => { const [x, y] = pt(i, R + 14); return <text key={i} x={x} y={y + 3} textAnchor="middle" fontSize="8.5" fontWeight="600" fill="rgba(255,255,255,0.65)">{ax.label}</text>; })}
      </svg>
    );
  };

  const ScoreCircle = ({ val, size = 50 }) => {
    const color = val >= 65 ? "#6ee7b7" : val >= 40 ? "#fbbf24" : "#ef4444";
    const r = (size - 5) / 2, circ = 2 * Math.PI * r;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - val / 100)}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dashoffset .4s" }}/>
        <text x={size/2} y={size/2 + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={color}>{val}</text>
      </svg>
    );
  };

  const SliderRow = ({ label, val, setVal, min, max, step: s = 1, format = (x) => x }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, marginBottom: 3 }}>
        <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
        <span style={{ fontWeight: 800, color: "#6ee7b7" }}>{format(val)}</span>
      </div>
      <style>{`input[type=range]{-webkit-appearance:none;appearance:none;height:26px;background:transparent;cursor:pointer;touch-action:none}input[type=range]::-webkit-slider-runnable-track{height:4px;background:rgba(255,255,255,0.12);border-radius:2px}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:11px;background:#6ee7b7;margin-top:-9px;box-shadow:0 0 0 3px rgba(110,231,183,0.25)}input[type=range]::-moz-range-thumb{width:22px;height:22px;border-radius:11px;background:#6ee7b7;border:none;box-shadow:0 0 0 3px rgba(110,231,183,0.25)}`}</style>
      <input type="range" min={min} max={max} step={s} value={val}
        onChange={e => setVal(parseFloat(e.target.value))}
        onTouchMove={e => { e.stopPropagation(); }}
        style={{ width: "100%", display: "block", cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );

  const KpiCard = ({ label, val, sub, color = "#fff" }) => (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 10px", flex: 1, minWidth: 90 }}>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{val}</div>
      {sub && <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{sub}</div>}
    </div>
  );

  const riskColors = { faible: "#6ee7b7", moyen: "#fbbf24", eleve: "#ef4444" };
  const recoColors = { tresbon: "#6ee7b7", bon: "#a3e635", moyen: "#fbbf24", faible: "#ef4444" };
  const recoLabels = { tresbon: "Très bon", bon: "Bon", moyen: "Moyen", faible: "Faible" };

  const runResearch = () => {
    if (!analysis) return;
    setResearching(true);
    setTimeout(() => {
      const rootMC = labRunMonteCarlo(analysis.params, capital, firmKey, modelKey);
      const all = labGenerateVariants(sel, analysis.params)
        .map(v => ({ ...v, mc: labRunMonteCarlo(v.params, capital, firmKey, modelKey) }))
        .sort((a, b) => b.mc.passRate - a.mc.passRate);
      const branches = all.slice(0, 5);
      branches.slice(0, 2).forEach(parent => {
        parent.children = all.filter(o => o.key !== parent.key && o.key !== "stress").slice(0, 2)
          .map(o => {
            const cp = o.apply(parent.params);
            return { name: parent.short + " + " + o.short, mc: labRunMonteCarlo(cp, capital, firmKey, modelKey, 40), params: cp };
          }).sort((a, b) => b.mc.passRate - a.mc.passRate);
      });
      setResearch({ root: { name: "Stratégie initiale", label: (TRADING_KB.botTypes.find(b => b.k === sel.bot) || {}).label + " · " + ((TRADING_KB.markets.find(m => m.k === sel.market) || {}).label || ""), params: analysis.params, mc: rootMC }, branches });
      setResearching(false);
      setTreeSelected(null);
    }, 60);
  };

  const selectedNode = treeSelected === "root" ? research?.root
    : treeSelected && research ? (() => {
        const [bi, ci] = treeSelected.split("-").map(Number);
        if (ci !== undefined && research.branches[bi]?.children) return research.branches[bi].children[ci];
        return research.branches[bi];
      })() : null;

  const roadmapSteps = [
    { n: 1, title: "Backtest 200+ trades", desc: `Valide WR ≥ ${Math.max(30, analysis.params.winrate - 6)}% et RR ≥ 1:${analysis.params.rr} sur données réelles.` },
    { n: 2, title: "Monte Carlo validation", desc: `Lance l'exploration ci-dessous. Cible ≥ 55% de passage et ruine < 15%.` },
    { n: 3, title: "30 jours démo / paper", desc: `Risque max ${analysis.params.riskPct}%/trade. Journal quotidien — discipline mesurée, pas ressentie.` },
    { n: 4, title: "Challenge prop firm", desc: `${(PROP_FIRMS[firmKey] || PROP_FIRMS.fundednext).name} — capital $${capital.toLocaleString()}. Ne lance qu'avec score ≥ 60/100.` },
    { n: 5, title: "Funded — survivre d'abord", desc: `Risque ÷2 le premier mois. L'objectif n'est pas de gagner vite, c'est de DURER.` },
    { n: 6, title: "Scaling", desc: analysis.scores.scalabilite >= 60 ? "Profil scalable — ajoute des comptes progressivement." : "Scalabilité limitée — consolide avant de multiplier." },
  ];

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 100 }}>
      <ReportHeader title="Laboratoire de Recherche" subtitle="Analyse interactive · modifie les variables en temps réel" onBack={onBack} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{(TRADING_KB.botTypes.find(b => b.k === sel.bot) || {}).label} · {(TRADING_KB.markets.find(m => m.k === sel.market) || {}).label || "—"}</div>
        <div style={{ display: "flex", gap: 6 }}>
          {(ovWR !== null || ovRR !== null || ovRisk !== null) && (
            <button onClick={() => { setOvWR(null); setOvRR(null); setOvRisk(null); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#ef4444", fontSize: 10.5, fontWeight: 700, padding: "4px 8px", cursor: "pointer" }}>Reset</button>
          )}
          <button onClick={() => setStep(0)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "rgba(255,255,255,0.6)", fontSize: 10.5, fontWeight: 700, padding: "4px 10px", cursor: "pointer" }}>Modifier</button>
        </div>
      </div>

      {/* ── CARTE PROFIL : score global + infos gauche + radar droite ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(110,231,183,0.15)", borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 58, height: 58, borderRadius: 29, border: `3px solid ${mcColor(analysis.global)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 19, fontWeight: 900, color: mcColor(analysis.global) }}>{analysis.global}</span>
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)" }}>/100</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{analysis.global >= 65 ? "✓ Profil viable prop firm" : analysis.global >= 40 ? "⚠ Profil à consolider" : "✕ Restructuration nécessaire"}</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>WR {displayWR}% · RR 1:{displayRR} · Espérance {analysis.expectancy.toFixed(2)}R/trade</div>
          </div>
        </div>

        {/* Infos gauche + Radar droite */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {[
                ["Type", (TRADING_KB.botTypes.find(b => b.k === sel.bot) || {}).label || "—"],
                ["Marché", (TRADING_KB.markets.find(m => m.k === sel.market) || {}).label || "—"],
                ["Sessions", (sel.sessions || []).map(s => TRADING_KB.sessions.find(x => x.k === s)?.label || s).join(", ") || "—"],
                ["Entrée", (sel.entries || []).slice(0, 2).map(k => TRADING_KB.entries.find(x => x.k === k)?.label || k).join(" + ") || "—"],
                ["Sortie", (sel.exits || []).slice(0, 2).map(k => TRADING_KB.exits.find(x => x.k === k)?.label || k).join(" + ") || "—"],
                ["Risque/t", displayRisk + "%"],
                ["Trades/j", analysis.params.tradesPerDay],
                ["Prop firm", (PROP_FIRMS[firmKey] || PROP_FIRMS.fundednext).name],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: 2, paddingTop: 2 }}>
                  <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.42)", fontWeight: 600, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 9.5, color: "#fff", fontWeight: 700, textAlign: "right", marginLeft: 6, lineHeight: 1.2 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <LabRadar scores={analysis.scores} />
          </div>
        </div>
      </div>

      {/* ── KPIs QUANTITATIFS ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>KPIs calculés</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          <KpiCard label="Profit Factor" val={analysis.kpis.profitFactor} sub="Seuil viable : 1.3+" color={analysis.kpis.profitFactor >= 1.3 ? "#6ee7b7" : "#ef4444"} />
          <KpiCard label="Kelly" val={(analysis.kpis.kellyCriterion * 100).toFixed(1) + "%"} sub="Fraction Kelly" color={analysis.kpis.kellyCriterion > 0 ? "#6ee7b7" : "#ef4444"} />
          <KpiCard label="Pertes max / série" val={analysis.kpis.maxConsecLoss} sub="Stat 98%" color={analysis.kpis.maxConsecLoss <= 6 ? "#6ee7b7" : "#fbbf24"} />
          <KpiCard label="Trades pour fiabilité" val={Math.round(analysis.kpis.tradesForSig)} sub="IC 95%, ±5%" color="rgba(255,255,255,0.75)" />
        </div>
      </div>

      {/* ── SLIDERS INTERACTIFS ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(110,231,183,0.15)", borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#6ee7b7", marginBottom: 10 }}>⚡ Simulation interactive — modifie et vois l'impact en temps réel</div>
        <SliderRow label="Winrate %" val={displayWR} setVal={setOvWR} min={15} max={85} step={1} format={v => v + "%"} />
        <SliderRow label="Risk Reward (1:x)" val={displayRR} setVal={setOvRR} min={0.4} max={5} step={0.1} format={v => "1:" + v.toFixed(1)} />
        <SliderRow label="Risque / trade" val={displayRisk} setVal={setOvRisk} min={0.1} max={3} step={0.05} format={v => v.toFixed(2) + "%"} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {[{ label: "Robustesse", val: analysis.scores.robustesse }, { label: "Survie", val: analysis.scores.survie }, { label: "Prop firm", val: analysis.scores.propfirm }, { label: "Espérance", val: analysis.scores.esperance }].map(s => (
            <div key={s.label} style={{ flex: 1, textAlign: "center" }}>
              <ScoreCircle val={s.val} size={46} />
              <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FORCES / FAIBLESSES ── */}
      {(analysis.forces.length > 0 || analysis.faiblesses.length > 0) && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Diagnostic</div>
          {analysis.forces.map((f, i) => <div key={"f"+i} style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)", padding: "3px 0" }}><span style={{ color: "#6ee7b7", marginRight: 7 }}>✓</span>{f}</div>)}
          {analysis.faiblesses.map((f, i) => <div key={"w"+i} style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)", padding: "3px 0" }}><span style={{ color: "#ef4444", marginRight: 7 }}>✕</span>{f}</div>)}
        </div>
      )}

      {/* ── ROADMAP ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Roadmap personnalisée</div>
        {roadmapSteps.map((r, i) => (
          <div key={r.n} style={{ display: "flex", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 24, height: 24, borderRadius: 12, background: "rgba(110,231,183,0.12)", border: "1.5px solid rgba(110,231,183,0.45)", color: "#6ee7b7", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{r.n}</div>
              {i < roadmapSteps.length - 1 && <div style={{ width: 1.5, flex: 1, minHeight: 14, background: "linear-gradient(180deg, rgba(110,231,183,0.35), rgba(110,231,183,0.06))" }} />}
            </div>
            <div style={{ paddingBottom: i < roadmapSteps.length - 1 ? 12 : 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{r.title}</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", marginTop: 2, lineHeight: 1.4 }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── ARBRE INTERACTIF ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#fbbf24", marginBottom: 4 }}>🔬 Arbre de décision stratégique</div>
        <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>Clique sur n'importe quel nœud pour explorer ses métriques en détail.</div>
        {!research ? (
          <button onClick={runResearch} disabled={researching} style={{ width: "100%", padding: 13, borderRadius: 13, border: "none", cursor: researching ? "default" : "pointer",
            background: researching ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg,#fbbf24,#f59e0b)", color: researching ? "rgba(255,255,255,0.35)" : "#000", fontSize: 13, fontWeight: 800 }}>
            {researching ? "Simulation Monte Carlo en cours…" : "Lancer l'exploration (~3s)"}
          </button>
        ) : (<>
          {/* ── PANEL détail nœud sélectionné ── */}
          {selectedNode && (
            <div style={{ border: `1.5px solid ${mcColor(selectedNode.mc.passRate)}`, borderRadius: 12, padding: 12, marginBottom: 12, background: `${mcColor(selectedNode.mc.passRate)}09` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{selectedNode.name}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {[
                  { l: "Passage", v: selectedNode.mc.passRate + "%", c: mcColor(selectedNode.mc.passRate) },
                  { l: "DD moy", v: selectedNode.mc.avgDD + "%", c: selectedNode.mc.avgDD <= 5 ? "#6ee7b7" : "#fbbf24" },
                  { l: "Gain moy", v: (selectedNode.mc.avgGain >= 0 ? "+" : "") + selectedNode.mc.avgGain + "%", c: selectedNode.mc.avgGain >= 0 ? "#6ee7b7" : "#ef4444" },
                  { l: "Ruine", v: selectedNode.mc.ruinRate + "%", c: selectedNode.mc.ruinRate < 15 ? "#6ee7b7" : "#ef4444" },
                ].map(x => <div key={x.l} style={{ flex: 1, minWidth: 70, textAlign: "center", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 4px" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)" }}>{x.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: x.c }}>{x.v}</div>
                </div>)}
              </div>
              {selectedNode.params && <div style={{ display: "flex", gap: 6, fontSize: 10, color: "rgba(255,255,255,0.5)", flexWrap: "wrap" }}>
                <span>WR {selectedNode.params.winrate}%</span>
                <span>·</span><span>RR 1:{selectedNode.params.rr}</span>
                <span>·</span><span>Risque {selectedNode.params.riskPct}%</span>
                <span>·</span><span>Trades/j {selectedNode.params.tradesPerDay}</span>
              </div>}
            </div>
          )}

          {/* ── ARBRE HORIZONTAL (gauche→droite) avec scroll ── */}
          <div style={{ overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", margin: "0 -14px", padding: "0 14px 8px" }}>
            {(() => {
              const B = research.branches;
              // Dimensions des colonnes horizontales
              const ROOT_W = 100, COL_H = 72, BRANCH_W = 88, L2_W = 84;
              const GAP_V = 8, GAP_H = 28;
              const recoColor = (b) => (recoColors[b.mc.reco] || "#fbbf24");

              // Nœud cliquable horizontal (titre + cercle)
              const HNode = ({ node, id, w = BRANCH_W, accent }) => {
                const sel2 = treeSelected === id;
                const col = accent || recoColor(node);
                return (
                  <div onClick={() => setTreeSelected(sel2 ? null : id)}
                    style={{ width: w, border: `1.5px solid ${sel2 ? "#fff" : col + "90"}`, borderLeft: `3px solid ${col}`,
                      borderRadius: 9, padding: "6px 8px", background: sel2 ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.025)",
                      cursor: "pointer", transition: "all .18s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ fontSize: 8.5, fontWeight: 800, color: "#fff", lineHeight: 1.25, textAlign: "center", width: "100%" }}>{node.name}</div>
                    <ScoreCircle val={node.mc.passRate} size={34} />
                    <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.4)" }}>DD {node.mc.avgDD}%</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: col }}>{recoLabels[node.mc.reco] || "—"}</div>
                  </div>
                );
              };

              // Calcul dynamique de la hauteur totale de chaque branche (avec enfants)
              const branchHeight = (b) => (b.children?.length ? b.children.length * (COL_H + GAP_V) - GAP_V : COL_H);
              const totalH = B.reduce((s, b) => s + branchHeight(b) + GAP_V, -GAP_V);

              // Positions Y centrées de chaque branche
              let yAcc = 0;
              const bY = B.map(b => { const h = branchHeight(b); const cy = yAcc + h / 2; yAcc += h + GAP_V; return cy; });

              const rootCY = totalH / 2;
              const svgW = ROOT_W + GAP_H + BRANCH_W + GAP_H + L2_W;
              const hasL2 = B.some(b => b.children?.length);

              return (
                <div style={{ display: "inline-flex", alignItems: "flex-start", gap: 0, minWidth: svgW + 20 }}>
                  {/* Colonne RACINE centrée verticalement */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: totalH, flexShrink: 0 }}>
                    <div onClick={() => setTreeSelected(treeSelected === "root" ? null : "root")}
                      style={{ width: ROOT_W, border: `1.5px solid ${treeSelected === "root" ? "#fff" : "rgba(167,139,250,0.7)"}`, borderLeft: "3px solid #a78bfa",
                        borderRadius: 10, padding: "8px", background: "linear-gradient(135deg,rgba(167,139,250,0.10),rgba(34,211,238,0.05))",
                        cursor: "pointer", transition: "all .2s", textAlign: "center" }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>✦ {research.root.name}</div>
                      <div style={{ fontSize: 8, color: "#a78bfa", marginTop: 1 }}>{research.root.label}</div>
                      <ScoreCircle val={research.root.mc.passRate} size={36} />
                    </div>
                  </div>

                  {/* SVG connecteurs racine→branches */}
                  <svg width={GAP_H} height={totalH} style={{ flexShrink: 0, overflow: "visible" }}>
                    {B.map((b, i) => {
                      const y1 = rootCY, y2 = bY[i];
                      return <path key={i} d={`M 0 ${y1} C ${GAP_H * 0.5} ${y1}, ${GAP_H * 0.5} ${y2}, ${GAP_H} ${y2}`}
                        fill="none" stroke={recoColor(b)} strokeWidth="1.6" opacity="0.8"/>;
                    })}
                  </svg>

                  {/* Colonne BRANCHES niveau 1 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: GAP_V, flexShrink: 0 }}>
                    {B.map((b, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: branchHeight(b) }}>
                        <HNode node={b} id={String(i)} />
                      </div>
                    ))}
                  </div>

                  {/* SVG connecteurs branches→niveau 2 */}
                  {hasL2 && <svg width={GAP_H} height={totalH} style={{ flexShrink: 0, overflow: "visible" }}>
                    {B.map((b, i) => (b.children || []).map((ch, ci) => {
                      const childH = COL_H, parentCY = bY[i];
                      let childYAcc = bY[i] - branchHeight(b) / 2;
                      for (let x = 0; x < ci; x++) childYAcc += COL_H + GAP_V;
                      const childCY = childYAcc + childH / 2;
                      return <path key={`${i}-${ci}`} d={`M 0 ${parentCY} C ${GAP_H * 0.5} ${parentCY}, ${GAP_H * 0.5} ${childCY}, ${GAP_H} ${childCY}`}
                        fill="none" stroke={recoColor(b)} strokeWidth="1.3" opacity="0.55" strokeDasharray="3 2"/>;
                    }))}
                  </svg>}

                  {/* Colonne NIVEAU 2 */}
                  {hasL2 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: GAP_V, flexShrink: 0 }}>
                      {B.map((b, i) => (b.children || []).map((ch, ci) => (
                        <HNode key={`${i}-${ci}`} node={{ ...ch, name: ch.name }} id={`${i}-${ci}`} w={L2_W} accent={recoColor(b)} />
                      )))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* ── BARRE DE CONCLUSION BACKTESTING ── */}
          {(() => {
            const pr = research.root.mc.passRate;
            const verdict = pr >= 65 ? { icon: "✅", color: "#6ee7b7", txt: "Stratégie viable", action: "Commence par un forward test de 30 jours minimum avec un capital fictif avant de payer le moindre challenge." }
              : pr >= 40 ? { icon: "⚠️", color: "#fbbf24", txt: "Améliorations requises", action: "Tu dois accumuler au moins 200 trades réels ou démo pour valider la statistique, puis relancer cette simulation." }
              : { icon: "🛑", color: "#ef4444", txt: "Non viable en l'état", action: "Stop. Cette stratégie ne peut pas passer un challenge dans l'état actuel. Retravaille le RR ou le winrate, puis recommence." };
            const checklist = [
              { ok: research.root.mc.passRate >= 50, txt: `Passage MC ≥ 50% (tu as ${research.root.mc.passRate}%)` },
              { ok: research.root.mc.ruinRate < 20, txt: `Ruine < 20% (tu as ${research.root.mc.ruinRate}%)` },
              { ok: analysis.kpis.profitFactor >= 1.3, txt: `Profit Factor ≥ 1.3 (tu as ${analysis.kpis.profitFactor})` },
              { ok: analysis.kpis.maxConsecLoss <= 8, txt: `Série pertes max ≤ 8 (tu as ${analysis.kpis.maxConsecLoss})` },
              { ok: Math.round(analysis.kpis.tradesForSig) <= 500, txt: `Échantillon atteignable (${Math.round(analysis.kpis.tradesForSig)} trades requis pour validité)` },
            ];
            const passCount = checklist.filter(c => c.ok).length;
            return (
              <div style={{ marginTop: 14, border: `1.5px solid ${verdict.color}44`, borderLeft: `4px solid ${verdict.color}`, borderRadius: 12, padding: 14, background: `${verdict.color}07` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{verdict.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: verdict.color }}>{verdict.txt} · {passCount}/5 critères</div>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)", marginTop: 1, lineHeight: 1.35 }}>{verdict.action}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 8 }}>
                  {checklist.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5 }}>
                      <span style={{ color: item.ok ? "#6ee7b7" : "#ef4444", flexShrink: 0, fontWeight: 800 }}>{item.ok ? "✓" : "✕"}</span>
                      <span style={{ color: item.ok ? "rgba(255,255,255,0.65)" : "rgba(239,68,68,0.8)" }}>{item.txt}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Protocole de validation :</span> Backtest sur données historiques 12+ mois → Forward test 30 jours démo → Seulement APRÈS ces deux étapes, lance le challenge.
                  Un backtest positif ne suffit pas — le marché évolue. La sur-optimisation (overfit) est le principal ennemi : si ta stratégie fonctionne UNIQUEMENT sur la période backtestée, elle est fragile.
                </div>
              </div>
            );
          })()}

          <button onClick={() => { setResearch(null); setTreeSelected(null); }} style={{ width: "100%", marginTop: 10, padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Relancer l'exploration</button>
        </>)}
      </div>
    </div>
  );
}

function CoachScreen({ t, lang, lastSim, profile, goto, premiumAccess = true, requirePremium = () => {} }) {
  const [mode, setMode] = useState(null); // null | 'simulation' | 'journal' | 'backtest' | 'comparator'
  const [gemini, setGemini] = useState(null);
  const [gemLoading, setGemLoading] = useState(false);

  // Scroll to top on mode change
  useEffect(() => { window.scrollTo({top:0,behavior:'instant'}); }, [mode]);

  // Read journal data — structure multi-comptes { mois: { jour: { accountId: entry } } } depuis le fix du 26/06.
  // On migre à la volée (cas d'un vieux localStorage jamais migré) puis on aplatit sur le compte sélectionné
  // du Dashboard (fallback "default"), pour redonner aux fonctions d'analyse la vue plate qu'elles attendent.
  const journalRaw = (() => {
    try {
      const r = localStorage.getItem('eapropfirm_journal');
      const parsed = r ? JSON.parse(r) : {};
      const migrated = migrateJournalToMultiAccount(parsed);
      let accId = "default";
      try {
        const savedAcc = localStorage.getItem("eapropfirm_dash_selected_account");
        if (savedAcc) accId = savedAcc;
      } catch (e) {}
      const flat = filterJournalByAccount(migrated, accId);
      // Si le compte sélectionné n'a aucune donnée mais que "default" en a, retomber sur "default"
      // (évite un écran Analyse vide juste parce qu'un compte neuf est sélectionné sur la Home)
      if (!Object.keys(flat).length && accId !== "default") {
        return filterJournalByAccount(migrated, "default");
      }
      return flat;
    } catch(e) { return {}; }
  })();
  const journalStats = journalAnalyze(journalRaw);

  // Read backtest data
  const backtestRaw = (() => { try { const r=localStorage.getItem('eapropfirm_trades'); const d=r?JSON.parse(r):null; return d&&d.trades&&d.trades.length?d:null; } catch(e){return null;} })();
  const backtestStats = backtestRaw ? backtestAnalyze(backtestRaw) : null;

  // Simulation data
  setALLang(lang);
  const simAnalysis = lastSim ? coachAnalyze({ winrate:lastSim.winrate, rr:lastSim.rr, ddDayPct:lastSim.ddDayPct, ddTotPct:lastSim.ddTotPct, dailyDDLimit:lastSim.dailyDDLimit, totalDDLimit:lastSim.totalDDLimit, riskPctValue:lastSim.riskPctValue, riskPct:lastSim.riskPct, totalTrades:lastSim.totalTrades, capital:lastSim.capital, phase1Target:lastSim.phase1Target }, lastSim.firmKey?lastSim.firmKey.toUpperCase():'PROP FIRM') : null;

  // ── Profil trader réel pour le Comparateur Prop Firm (priorité: backtest > simulation) ──
  const traderProfileForCompare = backtestStats ? {
    winrate: backtestStats.wr || 50, avgRR: backtestStats.rr || 1.5, avgDD: backtestStats.maxDD || 5,
    riskPerTrade: backtestStats.avgRiskPct || 1, tradesPerDay: backtestStats.tradesPerDay || 3,
    style: backtestStats.style || "swing", sampleSize: backtestStats.totalTrades || 0,
  } : simAnalysis ? {
    winrate: simAnalysis.metrics.winrate || 50, avgRR: simAnalysis.metrics.rr || 1.5,
    avgDD: Math.max(simAnalysis.metrics.ddDayUsed||0, simAnalysis.metrics.ddTotUsed||0) || 5,
    riskPerTrade: simAnalysis.metrics.riskPct || 1, tradesPerDay: 3, style: "swing",
    sampleSize: simAnalysis.metrics.totalTrades || 0,
  } : null;
  const firmComparison = traderProfileForCompare ? compareAllFirms(traderProfileForCompare) : null;

  // ── Benchmark Mondial des Traders : basé sur le JOURNAL DE TRADING réel ──
  // (PF non inclus : pas calculable depuis les données du journal — voir buildJournalProfileForBenchmark)
  const disciplineForBenchmark = disciplineAnalyze(journalRaw);
  const journalProfileForBenchmark = buildJournalProfileForBenchmark(journalRaw, profile.capital);
  const worldBenchmarkData = journalProfileForBenchmark ? worldBenchmark({
    winrate: journalProfileForBenchmark.winrate,
    profitFactor: journalProfileForBenchmark.profitFactor,
    rr: journalProfileForBenchmark.avgRR,
    drawdown: journalProfileForBenchmark.avgDD,
    discipline: disciplineForBenchmark ? disciplineForBenchmark.score : null,
    consistency: journalStats ? journalStats.consistency : null,
  }) : null;

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

  const ExpertSection = ({ gemini, gemLoading, localText }) => {
    const narrative = gemini || (localText ? { recommendation:localText, expertQuote:null, readyForChallenge:null } : null);
    return (
      <div style={{background:'linear-gradient(135deg,rgba(110,231,183,0.07),rgba(6,9,15,0.8))',border:'1px solid rgba(110,231,183,0.2)',borderRadius:16,padding:16,marginBottom:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2}}>
            Rapport Expert
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
                <StatusDot kind={narrative.readyForChallenge?'ok':'warn'} />
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
        icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="13" rx="2.5" stroke="#6ee7b7" strokeWidth="1.6"/><path d="M6.5 13.5l3-4 2.5 2.8 3-3.8 2.5 3" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 20.5h6" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round"/></svg>,
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
        icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 6.5c-1.6-1.3-4-2-6.5-2-1 0-1.5.2-1.5.7v12.6c0 .5.5.7 1.5.7 2.5 0 4.9.7 6.5 2 1.6-1.3 4-2 6.5-2 1 0 1.5-.2 1.5-.7V5.2c0-.5-.5-.7-1.5-.7-2.5 0-4.9.7-6.5 2z" stroke="#fbbf24" strokeWidth="1.6" strokeLinejoin="round"/><path d="M12 6.5v13" stroke="#fbbf24" strokeWidth="1.6"/></svg>,
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
        icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 4v3M6 7h0M6 7v9M6 16v4" stroke="#e05252" strokeWidth="1.6" strokeLinecap="round"/><rect x="4" y="7" width="4" height="6" rx="0.8" stroke="#e05252" strokeWidth="1.6"/><path d="M12 2v4M12 14v8M16 9v2M16 18v3" stroke="#e05252" strokeWidth="1.6" strokeLinecap="round"/><rect x="10" y="6" width="4" height="8" rx="0.8" stroke="#e05252" strokeWidth="1.6"/><rect x="14" y="11" width="4" height="7" rx="0.8" stroke="#e05252" strokeWidth="1.6"/></svg>,
        title: t('an_bt_title'),
        subtitle: t('an_bt_sub'),
        desc: t('an_bt_desc'),
        chips: ['Equity curve', 'Profit Factor', 'Monte Carlo', 'Robustesse'],
        hasData: !!backtestStats,
        dataLabel: backtestStats ? `${backtestStats.totalTrades} trades importés · PF ${backtestStats.pf} · Score ${backtestStats.robustness}%` : (lang==='en'?'Import a CSV file in My Trades':'Importez un fichier CSV dans Mes Trades'),
        cta: t('an_bt_cta'),
        ctaGoto: 'trades',
      },
      {
        key:'comparator', accent:'#a78bfa', bg:'rgba(167,139,250,0.06)', border:'rgba(167,139,250,0.2)',
        icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="11" width="5" height="9" rx="1.2" stroke="#a78bfa" strokeWidth="1.6"/><rect x="10" y="6" width="5" height="14" rx="1.2" stroke="#a78bfa" strokeWidth="1.6"/><rect x="16.5" y="3" width="5" height="17" rx="1.2" stroke="#a78bfa" strokeWidth="1.6"/></svg>,
        title: t('cmp_card_title'),
        subtitle: t('cmp_card_sub'),
        desc: t('cmp_card_desc'),
        chips: ['FTMO', 'FundedNext', 'E8', 'The5ers'],
        hasData: !!firmComparison,
        dataLabel: firmComparison ? `${firmComparison[0].firmName} ${firmComparison[0].score}% · ${firmComparison.length} firms` : t('cmp_no_data'),
        cta: t('cmp_card_cta'),
        ctaGoto: 'trades',
      },
      {
        key:'benchmark', accent:'#fbbf24', bg:'rgba(251,191,36,0.06)', border:'rgba(251,191,36,0.2)',
        icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="6" stroke="#fbbf24" strokeWidth="1.6"/><path d="M9 14.2L7 21l5-2.5 5 2.5-2-6.8" stroke="#fbbf24" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/><path d="M9.5 9l1.3 1.3L14.5 7" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        title: t('bench_title'),
        subtitle: t('bench_subtitle'),
        desc: t('bench_subtitle'),
        chips: [t('bench_metric_winrate'), t('bench_metric_dd'), t('bench_metric_discipline'), t('bench_metric_consistency')],
        hasData: !!worldBenchmarkData,
        dataLabel: worldBenchmarkData ? `${worldBenchmarkData.globalLevel.icon} ${worldBenchmarkData.globalLevel.label} · #${worldBenchmarkData.rankEstimate.toLocaleString()}` : t('bench_no_data'),
        cta: t('bench_title'),
        ctaGoto: 'journal',
      },
      {
        key:'lab', accent:'#22d3ee', bg:'rgba(34,211,238,0.06)', border:'rgba(34,211,238,0.2)',
        icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 3h6M10 3v5.5L4.8 17.2A2 2 0 0 0 6.5 20h11a2 2 0 0 0 1.7-2.8L14 8.5V3" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.5 14h9" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round"/><circle cx="11" cy="16.5" r="0.9" fill="#22d3ee"/><circle cx="14" cy="17.8" r="0.7" fill="#22d3ee"/></svg>,
        title: t('an_lab_title'),
        subtitle: t('an_lab_sub'),
        desc: t('an_lab_desc'),
        chips: ['Monte Carlo', 'Variantes', 'Scoring', 'IA'],
        hasData: true, // Le wizard EST le point d'entrée — toujours accessible
        dataLabel: (() => { try { const p = JSON.parse(localStorage.getItem("eapropfirm_lab_profile") || "null"); return p && p.bot ? t('an_lab_saved') : t('an_lab_new'); } catch(e) { return t('an_lab_new'); } })(),
        cta: t('an_lab_cta'),
        ctaGoto: 'trades',
      },
      {
        key:'realbacktest', accent:'#a3e635', bg:'rgba(163,230,53,0.06)', border:'rgba(163,230,53,0.2)',
        icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" stroke="#a3e635" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        title: t('an_backtest_title'),
        subtitle: t('an_backtest_sub'),
        desc: t('an_backtest_desc'),
        chips: ['Données réelles', 'Breakout', 'RSI', 'MACD'],
        hasData: true,
        dataLabel: t('an_backtest_data_label'),
        cta: t('an_backtest_cta'),
        ctaGoto: 'trades',
      },
    ];
    return (
      <div style={{padding:'14px 16px 18px',marginTop:'-16px',marginLeft:'-16px',marginRight:'-16px',minHeight:'100vh',display:'flex',flexDirection:'column'}}>
        <div style={{marginBottom:16, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10}}>
          <div>
            <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:1.5,marginBottom:3}}>{t('an_center')}</div>
            <div style={{fontSize:19,fontWeight:900,color:'#fff',letterSpacing:-0.5,lineHeight:1.15}}>{t('an_select')} <span style={{color:'#6ee7b7'}}>{t('an_your_analysis')}</span></div>
          </div>
          {/* Accès profil depuis la page Analyse */}
          <button onClick={() => goto('profile')} aria-label="Profil" style={{
            width: 40, height: 40, borderRadius: 13, flexShrink: 0, cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="6.5" r="3.2" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5"/>
              <path d="M3.5 17c1-3.2 3.5-4.8 6.5-4.8s5.5 1.6 6.5 4.8" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Grille Stream Deck : 2 colonnes, tuiles uniformes (toutes carrées, même forme) ── */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
          {cards.map((card, idx) => {
            const scorePct = card.hasData && card.dataLabel ? (card.dataLabel.match(/Score (\d+)%/) || card.dataLabel.match(/(\d+)%/)) : null;
            const scoreVal = scorePct ? parseInt(scorePct[1], 10) : null;
            const isLastOdd = idx === cards.length - 1 && cards.length % 2 === 1;
            return (
              <button
                key={card.key}
                onClick={() => { if(!premiumAccess){requirePremium();return;} if(!card.hasData){goto(card.ctaGoto);return;} setMode(card.key); }}
                style={{
                  position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  gap:6, aspectRatio:'1.15', padding:'10px 8px',
                  gridColumn: isLastOdd ? '1 / -1' : 'auto',
                  width: isLastOdd ? 'calc(50% - 4.5px)' : '100%',
                  justifySelf: isLastOdd ? 'start' : 'stretch',
                  background:`linear-gradient(155deg, ${card.bg}, rgba(255,255,255,0.02))`,
                  border:`1.5px solid ${card.hasData ? card.border : 'rgba(255,255,255,0.08)'}`,
                  borderRadius:18, cursor:'pointer', textAlign:'center',
                  boxShadow: card.hasData ? `0 4px 18px -6px ${card.accent}55` : 'none',
                  transition:'transform .15s ease',
                }}>
                {/* Badge statut coin supérieur droit */}
                <div style={{position:'absolute', top:7, right:7, width:6, height:6, borderRadius:3, background: card.hasData ? '#6ee7b7' : 'rgba(255,255,255,0.15)'}} />

                {/* Icône large */}
                <div style={{width:38, height:38, borderRadius:12, background:`${card.accent}1f`, border:`1px solid ${card.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  {card.icon}
                </div>

                <div style={{display:'flex', flexDirection:'column', gap:6, alignItems:'center', textAlign:'center'}}>
                  {/* Titre court */}
                  <div style={{fontSize:11.5, fontWeight:800, color:'#fff', lineHeight:1.15, padding:'0 2px'}}>{card.title}</div>

                  {/* Mini score ou statut */}
                  {scoreVal !== null ? (
                    <div style={{display:'flex', alignItems:'center', gap:5, width:'80%'}}>
                      <div style={{flex:1, height:4, borderRadius:2, background:'rgba(255,255,255,0.08)', overflow:'hidden'}}>
                        <div style={{height:'100%', width:scoreVal+'%', background:card.accent, borderRadius:2}} />
                      </div>
                      <span style={{fontSize:9.5, fontWeight:700, color:card.accent, flexShrink:0}}>{scoreVal}%</span>
                    </div>
                  ) : (
                    <div style={{fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:0.5}}>
                      {!premiumAccess ? t('an_premium_locked') : t('an_get_data')}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Mention discrète moteur quantitatif — hors grille, ne prend pas de place fonctionnelle */}
        <div style={{textAlign:'center', marginTop:10, fontSize:8.5, color:'rgba(255,255,255,0.2)', lineHeight:1.4}}>
          {t("an_quant_engine")} · {t("an_local_optional")}
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
      <div style={{padding:'14px 16px 100px',marginTop:'-16px',marginLeft:'-16px',marginRight:'-16px'}}>
        <ReportHeader title="Simulation Challenge" subtitle="Rapport d'évaluation" onBack={()=>setMode(null)}/>
        <div style={{textAlign:'center',padding:'40px 20px',background:'rgba(255,255,255,0.03)',borderRadius:20}}>
          
          <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:16}}>{t('an_no_sim')}</div>
          <button onClick={()=>goto('simulator')} style={{padding:'12px 24px',borderRadius:12,background:'#6ee7b7',color:'#000',fontWeight:700,border:'none',cursor:'pointer'}}>{t('an_run_sim')}</button>
        </div>
      </div>
    );
    const pColor=scoreColor(a.probability);
    const localText=a.probability>=75?`Avec un score de ${a.probability}% et un Profit Factor de ${a.profitFactor}, votre stratégie présente les caractéristiques d'une approche solide pour ce challenge. ${a.risks[0]?'Le principal risque identifié est : '+a.risks[0].detail+'.':''} ${a.probability>=75?'La stratégie semble prête pour un challenge.':'Optimisez avant de lancer.'}`:
      `Votre score de ${a.probability}% révèle ${a.probability>=55?'une stratégie viable mais perfectible':'des fragilités importantes'}. PF ${a.profitFactor}, espérance ${a.expectancyR}R. ${a.risks[0]?a.risks[0].detail+'.':''} ${a.probability>=55?'Optimisez le risque/trade avant de lancer.':'Ne lancez pas de challenge avec ces métriques.'}`;
    return (
      <div style={{padding:'14px 16px 100px',marginTop:'-16px',marginLeft:'-16px',marginRight:'-16px'}}>
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
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:10}}>{t('an_forces')}</div>
          {a.forces.map((f,i)=><div key={i} style={{display:'flex',gap:10,alignItems:'center',marginBottom:i<a.forces.length-1?8:0}}><StatusDot kind={f.icon} /><div><div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{f.title}</div><div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:1,lineHeight:1.4}}>{f.detail}</div></div></div>)}
        </div>}

        {/* Risques */}
        {a.risks.length>0&&<div style={{background:'rgba(251,191,36,0.04)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:10}}>{t('an_risks')}</div>
          {a.risks.map((r,i)=><div key={i} style={{display:'flex',gap:10,alignItems:'center',marginBottom:i<a.risks.length-1?8:0}}><StatusDot kind={r.icon} /><div><div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{r.title}</div><div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:1,lineHeight:1.4}}>{r.detail}</div></div></div>)}
        </div>}

        {/* Rapport expert */}
        <ExpertSection gemini={gemini} gemLoading={gemLoading} localText={localText}/>

        {/* Projection */}
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:12}}>{t("an_projection_challenge")}</div>
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
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:10}}>{t("an_levers")}</div>
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
      <div style={{padding:'14px 16px 100px',marginTop:'-16px',marginLeft:'-16px',marginRight:'-16px'}}>
        <ReportHeader title="Journal de Trading" subtitle="Analyse comportementale" onBack={()=>setMode(null)}/>
        <div style={{textAlign:'center',padding:'40px 20px',background:'rgba(255,255,255,0.03)',borderRadius:20}}>
          
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
      <div style={{padding:'14px 16px 100px',marginTop:'-16px',marginLeft:'-16px',marginRight:'-16px'}}>
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
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:12}}>{t("an_behavioral")}</div>
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
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:10}}>{t("an_positive_points")}</div>
          {j.strengths.map((s,i)=><div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:i<j.strengths.length-1?7:0}}><span style={{color:'#6ee7b7',fontSize:13,flexShrink:0}}>✓</span><div style={{fontSize:12,color:'rgba(255,255,255,0.8)',lineHeight:1.4}}>{s.text}</div></div>)}
        </div>}

        {/* Erreurs */}
        {j.issues.length>0&&<div style={{background:'rgba(239,68,68,0.04)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:10}}>{t("an_improve_axes")}</div>
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
      <div style={{padding:'14px 16px 100px',marginTop:'-16px',marginLeft:'-16px',marginRight:'-16px'}}>
        <ReportHeader title="Résultats Backtest" subtitle="Audit statistique" onBack={()=>setMode(null)}/>
        <div style={{textAlign:'center',padding:'40px 20px',background:'rgba(255,255,255,0.03)',borderRadius:20}}>
          
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
      <div style={{padding:'14px 16px 100px',marginTop:'-16px',marginLeft:'-16px',marginRight:'-16px'}}>
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
            <div style={{fontSize:13,fontWeight:900,color:'#fbbf24',marginBottom:8}}>DONNÉES DD MANQUANTES</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.75)',lineHeight:1.6,marginBottom:12}}>
              {b.ddMissingReason||'Drawdown non calculable'}. Les métriques WR, RR et PF sont fiables, mais <strong style={{color:'#fbbf24'}}>le verdict prop firm est invalide</strong> sans DD réel.
            </div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',lineHeight:1.5}}>
              Pour débloquer le verdict complet :<br/>
              • Importez un CSV avec colonne Balance (trade par trade)<br/>
              • Ou saisissez le DD max manuellement dans <strong style={{color:'#6ee7b7'}}>Mes Trades</strong>
            </div>
          </div>
        )}

        {/* KPIs statistiques */}
        <div style={{background:'rgba(224,82,82,0.04)',border:'1px solid rgba(224,82,82,0.2)',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:12}}>{t('an_stat_metrics')}</div>
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
          <div style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:1.2,marginBottom:10}}>{t('an_validity')}</div>
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

  if (mode === 'lab') {
    return <LabScreen t={t} lang={lang} profile={profile} onBack={() => setMode(null)} />;
  }

  if (mode === 'realbacktest') {
    return <BacktestScreen t={t} lang={lang} onBack={() => setMode(null)} />;
  }

  if (mode === 'comparator') {
    if (!firmComparison) return (
      <div style={{padding:'14px 16px 100px',marginTop:'-16px',marginLeft:'-16px',marginRight:'-16px'}}>
        <ReportHeader title={t('cmp_report_title')} subtitle={t('cmp_report_sub')} onBack={()=>setMode(null)}/>
        <div style={{textAlign:'center',padding:'40px 20px',background:'rgba(255,255,255,0.03)',borderRadius:20}}>
          
          <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:16}}>{t('cmp_no_data')}</div>
          <button onClick={()=>goto('trades')} style={{padding:'12px 24px',borderRadius:12,background:'#a78bfa',color:'#000',fontWeight:700,border:'none',cursor:'pointer'}}>{t('an_import_bt')}</button>
        </div>
      </div>
    );
    const tierLabel = (tier) => tier==='excellent' ? t('cmp_tier_excellent') : tier==='good' ? t('cmp_tier_good') : tier==='moderate' ? t('cmp_tier_moderate') : t('cmp_tier_poor');
    const tierColor = (tier) => tier==='excellent' ? '#6ee7b7' : tier==='good' ? '#6ee7b7' : tier==='moderate' ? '#fbbf24' : '#ef4444';
    return (
      <div style={{padding:'14px 16px 100px',marginTop:'-16px',marginLeft:'-16px',marginRight:'-16px'}}>
        <ReportHeader title={t('cmp_report_title')} subtitle={t('cmp_report_sub')} onBack={()=>setMode(null)}/>

        {/* Classement complet — toutes les Prop Firms */}
        {firmComparison.map((f, i) => (
          <div key={f.firmKey} style={{
            background: i===0 ? `${f.color}10` : 'rgba(255,255,255,0.03)',
            border: `1.5px solid ${i===0 ? f.color+'55' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 16, padding: '14px 16px', marginBottom: 10,
          }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom: (f.blockers.length+f.adjustments.length+f.strengths.length)>0 ? 10 : 0}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:18,fontWeight:900,color:'rgba(255,255,255,0.3)',width:20}}>{i+1}</span>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:'#fff',display:'flex',alignItems:'center',gap:6}}>
                    <StatusDot kind={f.tierIcon} /> {f.firmName}
                  </div>
                  <div style={{fontSize:10,color:tierColor(f.tier),fontWeight:600}}>{tierLabel(f.tier)}</div>
                </div>
              </div>
              <div style={{fontSize:22,fontWeight:900,color:f.score>=75?'#6ee7b7':f.score>=60?'#6ee7b7':f.score>=40?'#fbbf24':'#ef4444'}}>{f.score}%</div>
            </div>

            {/* Détail : pourquoi / blockers / ajustements (collapsible visuellement par simple liste) */}
            {f.blockers.length > 0 && (
              <div style={{marginBottom:6}}>
                {f.blockers.map((b,bi) => (
                  <div key={bi} style={{display:'flex',gap:6,alignItems:'flex-start',padding:'3px 0'}}>
                    <StatusDot kind="danger" />
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.65)',lineHeight:1.4}}>{AL(b.key)}{b.val ? ` (${b.val}%)` : ''}</span>
                  </div>
                ))}
              </div>
            )}
            {f.adjustments.length > 0 && (
              <div style={{marginBottom:6}}>
                {f.adjustments.map((a,ai) => (
                  <div key={ai} style={{display:'flex',gap:6,alignItems:'flex-start',padding:'3px 0'}}>
                    <StatusDot kind="warn" />
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.65)',lineHeight:1.4}}>{AL(a.key)}{a.val ? ` (${a.val}%)` : ''}</span>
                  </div>
                ))}
              </div>
            )}
            {f.strengths.length > 0 && (
              <div>
                {f.strengths.map((s,si) => (
                  <div key={si} style={{display:'flex',gap:6,alignItems:'flex-start',padding:'3px 0'}}>
                    <span style={{color:'#6ee7b7',fontSize:10,flexShrink:0,marginTop:2}}>✓</span>
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.65)',lineHeight:1.4}}>{AL(s.key)}{s.val ? ` (${s.val}%)` : ''}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{fontSize:9,color:'rgba(255,255,255,0.3)',marginTop:8,paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.05)'}}>
              {f.model.name} · {t('cmp_dd_limit')} {f.ddLimitPct.toFixed(0)}%
            </div>
          </div>
        ))}

        <div style={{fontSize:9,color:'rgba(255,255,255,0.3)',textAlign:'center',marginTop:10}}>
          {t('cmp_based_on')} {traderProfileForCompare.sampleSize} {t('mt5_trades_analyzed')}
        </div>
      </div>
    );
  }

  if (mode === 'benchmark') {
    if (!worldBenchmarkData) return (
      <div style={{padding:'14px 16px 100px',marginTop:'-16px',marginLeft:'-16px',marginRight:'-16px'}}>
        <ReportHeader title={t('bench_title')} subtitle={t('bench_subtitle')} onBack={()=>setMode(null)}/>
        <div style={{textAlign:'center',padding:'40px 20px',background:'rgba(255,255,255,0.03)',borderRadius:20}}>
          
          <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:16}}>{t('bench_no_data')}</div>
          <button onClick={()=>goto('journal')} style={{padding:'12px 24px',borderRadius:12,background:'#fbbf24',color:'#000',fontWeight:700,border:'none',cursor:'pointer'}}>{t('nav_journal')}</button>
        </div>
      </div>
    );
    const b = worldBenchmarkData;
    const metricLabels = {
      winrate: t('bench_metric_winrate'), profitFactor: t('bench_metric_pf'), rr: t('bench_metric_rr'),
      drawdown: t('bench_metric_dd'), discipline: t('bench_metric_discipline'), consistency: t('bench_metric_consistency'),
    };
    const motivationText = b.globalLevel.key === 'top1' ? t('bench_motivation_top1')
      : b.globalLevel.key === 'top10' ? t('bench_motivation_top10')
      : b.globalLevel.key === 'top25' ? t('bench_motivation_top25')
      : b.globalLevel.key === 'top50' ? t('bench_motivation_top50')
      : t('bench_motivation_average');
    // Niveau suivant à atteindre
    const levelOrder = ['average','top50','top25','top10','top1'];
    const curIdx = levelOrder.indexOf(b.globalLevel.key);
    const nextLevelKey = curIdx < levelOrder.length - 1 ? levelOrder[curIdx+1] : null;
    const nextLevelLabels = { top50: t('bench_top50'), top25: t('bench_top25'), top10: t('bench_top10'), top1: t('bench_top1') };

    return (
      <div style={{padding:'14px 16px 100px',marginTop:'-16px',marginLeft:'-16px',marginRight:'-16px'}}>
        <ReportHeader title={t('bench_title')} subtitle={t('bench_subtitle')} onBack={()=>setMode(null)}/>

        <div style={{fontSize:9.5,color:'rgba(255,255,255,0.35)',lineHeight:1.5,marginBottom:14,padding:'0 2px'}}>
          {t('bench_data_source')} · {t('bench_disclaimer')}
        </div>

        {/* Classement mondial + niveau actuel */}
        <div style={{background:`${b.globalLevel.color}12`,border:`1.5px solid ${b.globalLevel.color}50`,borderRadius:20,padding:'20px 18px',marginBottom:14,textAlign:'center'}}>
          <div style={{marginBottom:6, display:"flex", justifyContent:"center"}}><LevelIcon level={b.globalLevel.icon} color={b.globalLevel.color} size={36} /></div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:2}}>{t('bench_current_level')}</div>
          <div style={{fontSize:22,fontWeight:900,color:b.globalLevel.color,marginBottom:10}}>{b.globalLevel.label}</div>
          <div style={{display:'flex',justifyContent:'center',gap:20}}>
            <div>
              <div style={{fontSize:9,color:'rgba(255,255,255,0.4)'}}>{t('bench_global_rank')}</div>
              <div style={{fontSize:15,fontWeight:800,color:'#fff'}}>#{b.rankEstimate.toLocaleString()}</div>
              <div style={{fontSize:8,color:'rgba(255,255,255,0.3)'}}>{t('bench_rank_of')}</div>
            </div>
            <div style={{width:1,background:'rgba(255,255,255,0.1)'}} />
            <div>
              <div style={{fontSize:9,color:'rgba(255,255,255,0.4)'}}>Percentile</div>
              <div style={{fontSize:15,fontWeight:800,color:b.globalLevel.color}}>{b.globalPercentile}%</div>
            </div>
          </div>
        </div>

        {/* Message de motivation */}
        <div style={{textAlign:'center',padding:'10px 16px',marginBottom:16,fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.5,fontStyle:'italic'}}>
          {motivationText}
        </div>

        {/* Comparaison détaillée par métrique */}
        {Object.entries(b.metrics).filter(([,v]) => v !== null).map(([key, m]) => {
          const isDD = key === 'drawdown';
          const fmtVal = (v) => isDD ? v.toFixed(1)+'%' : (key==='winrate' ? v.toFixed(0)+'%' : key==='profitFactor'||key==='rr' ? v.toFixed(2) : v.toFixed(0));
          // Position relative sur la barre (0-100%), orientée selon higherIsBetter
          const barPos = Math.min(100, Math.max(0, m.percentile));
          return (
            <div key={key} className="card" style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:700,color:'#fff'}}>{metricLabels[key]}</span>
                <span style={{fontSize:11,fontWeight:700,color:m.level.color,display:"inline-flex",alignItems:"center",gap:4}}><LevelIcon level={m.level.icon} color={m.level.color} size={12} /> {m.level.label}</span>
              </div>
              {/* Barre de positionnement avec marqueurs */}
              <div style={{position:'relative',height:8,borderRadius:4,background:'rgba(255,255,255,0.08)',marginBottom:8}}>
                <div style={{position:'absolute',left:0,top:0,height:'100%',width:barPos+'%',borderRadius:4,background:m.level.color}} />
                <div style={{position:'absolute',left:barPos+'%',top:-3,width:2,height:14,background:'#fff',transform:'translateX(-1px)'}} />
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'rgba(255,255,255,0.4)'}}>
                <span>{t('bench_you')}: <b style={{color:'#fff'}}>{fmtVal(m.value)}</b></span>
                <span>{t('bench_average')}: {fmtVal(m.average)}</span>
                <span>{t('bench_top10')}: {fmtVal(m.top10)}</span>
              </div>
              {key === 'rr' && (
                <div style={{fontSize:8.5,color:'rgba(255,255,255,0.3)',fontStyle:'italic',marginTop:6}}>{t('bench_rr_approx_note')}</div>
              )}
            </div>
          );
        })}

        {/* Prochaine étape */}
        {nextLevelKey && b.weakestMetric && (
          <div className="card" style={{marginTop:6}}>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:8}}>{t('bench_next_step')}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.7)',lineHeight:1.5}}>
              {t('bench_to_reach')} <b style={{color:'#fbbf24'}}>{nextLevelLabels[nextLevelKey]}</b>, {t('bench_improve')} <b style={{color:'#fff'}}>{metricLabels[b.weakestMetric[0]]}</b>.
            </div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:6}}>
              {t('bench_weakest_label')}: {metricLabels[b.weakestMetric[0]]} ({b.weakestMetric[1].percentile}e percentile)
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ══════════════════════════════════════════════════════════════════
// RNG SEEDÉ — rend la simulation Challenge/Funded DÉTERMINISTE et
// PERSISTANTE : mêmes paramètres + même seed => résultat IDENTIQUE
// à chaque rendu (remonter sur l'écran Simulateur ne régénère plus
// une simulation différente). Seul un changement réel de paramètre
// (ou un clic explicite sur "Relancer") produit un nouveau résultat.
// Monte Carlo (200 runs) reste sur Math.random() natif — il a besoin
// de vraie variance pour construire sa distribution de probabilité.
// ══════════════════════════════════════════════════════════════════
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Hash de chaîne déterministe (cyrb53) → seed numérique stable pour un jeu de paramètres donné
function hashParamsToSeed(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)) >>> 0;
}

function makeTradeStream(winrate, clustering, maxConsecLosses, rng = Math.random) {
  const w = winrate / 100;
  let lastWin = rng() < w;
  let consecLosses = 0;
  const cap = (maxConsecLosses > 0 && maxConsecLosses < 100) ? maxConsecLosses : Infinity;

  return function nextTrade() {
    if (consecLosses >= cap) {
      lastWin = true;
      consecLosses = 0;
      return true;
    }
    if (clustering <= 0) {
      lastWin = rng() < w;
    } else {
      const pull = clustering * 0.5;
      const adjW = lastWin
        ? w + (1 - w) * pull
        : w - w * pull;
      lastWin = rng() < Math.max(0.02, Math.min(0.98, adjW));
    }
    if (!lastWin) consecLosses++;
    else consecLosses = 0;
    return lastWin;
  };
}

function simulateDay(equity, tradesPerDay, riskAmount, rr, nextTrade, dailyDDLimit, rng = Math.random) {
  let dayEquity = equity;
  let dayLowPnl = 0;
  let dayPeakPnl = 0;
  let wins = 0, losses = 0;
  // Support fractionnel : 0.33 trade/jour = 1 trade avec P=0.33
  const nTrades = tradesPerDay < 1
    ? (rng() < tradesPerDay ? 1 : 0)
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
  const rng = p.rng || Math.random;
  const nextTrade = makeTradeStream(p.winrate, p.clustering, p.maxConsecLosses, rng);
  let equity = capital;
  const days = [];
  let status = "running";
  let tradingDays = 0, totalWins = 0, totalLosses = 0, winDayCount = 0;
  let peak = capital;
  let maxDD = 0;          // DD total depuis capital initial (en fraction)
  let maxDDTrailing = 0;  // DD trailing depuis le pic (en fraction)
  let maxDailyDD = 0;     // pire DD intraday d'une journée (en fraction)

  for (let d = 1; d <= SIM_DAYS; d++) {
    const res = simulateDay(equity, p.tradesPerDay, riskAmount, p.rr, nextTrade, dailyDDLimit, rng);
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
  const rng = p.rng || Math.random;
  const nextTrade = makeTradeStream(p.winrate, p.clustering, p.maxConsecLosses, rng);
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
      const res = simulateDay(equity, p.tradesPerDay, riskAmount, p.rr, nextTrade, dailyDDLimit, rng);
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
    try {
      const r = localStorage.getItem("eapropfirm_activedays");
      const base = r ? JSON.parse(r) : [1,2,3,4,5];
      // Sync avec includeWeekend DÈS l'init — évite le décalage entre le
      // useState de includeWeekend (qui lit saved.includeWeekend) et le
      // useEffect de sync qui s'exécute APRÈS le premier rendu.
      const iwSaved = (() => {
        try { return JSON.parse(localStorage.getItem("eapropfirm_config") || "{}").includeWeekend === true; }
        catch (e) { return false; }
      })();
      if (iwSaved) return [...new Set([...base, 6, 7])].sort((a, b) => a - b);
      return base.filter(d => d <= 5);
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
  // ── Fix bug "Weekend inclus ne fonctionne pas" ──
  // Sans cette synchro, activer le toggle ne suffisait pas : Sa/Di restaient absents
  // d'activeDays tant que l'utilisateur ne les tapait pas manuellement, et le calcul
  // de tdMonthRecurrence (ratio jours actifs / jours de base) s'auto-annulait quasi
  // exactement (30*(5/7) ≈ 21*(5/5)) → le toggle semblait n'avoir aucun effet.
  // Ici : toggle ON => Sa/Di ajoutés automatiquement. Toggle OFF => Sa/Di retirés
  // (cohérent avec leur affichage grisé/désactivé quand includeWeekend est false).
  useEffect(() => {
    setActiveDays(prev => {
      const next = includeWeekend
        ? [...new Set([...prev, 6, 7])].sort((a, b) => a - b)
        : prev.filter(d => d <= 5);
      if (next.length === prev.length && next.every((v, i) => v === prev[i])) return prev; // no-op, évite un re-render inutile
      try { localStorage.setItem("eapropfirm_activedays", JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, [includeWeekend]);
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
  // Mesure la vraie hauteur rendue de la barre d'onglets fixe (Configuration/Challenge/Funded)
  // pour que le spacer en dessous compense EXACTEMENT — plus de gap ni de recouvrement,
  // quel que soit l'appareil (notch, Dynamic Island, safe-area variable).
  const simTabBarRef = useRef(null);
  const [simTabBarH, setSimTabBarH] = useState(null);
  useEffect(() => {
    const measure = () => { if (simTabBarRef.current) setSimTabBarH(simTabBarRef.current.getBoundingClientRect().height); };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    const id = setTimeout(measure, 50); // re-mesure après le premier paint (polices/safe-area)
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("orientationchange", measure); clearTimeout(id); };
  }, [tab]);
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
  // RNG déterministe : dérivé d'un hash de TOUS les paramètres qui influencent le résultat + seed.
  // Revenir sur cet écran (remount) sans rien changer => même hash => résultat IDENTIQUE (persistant).
  // Changer un paramètre OU cliquer "Relancer"/changer de preset (seed++) => hash différent => nouveau résultat.
  const simHash = hashParamsToSeed(JSON.stringify({
    firmKey, modelKey, capital, riskPct: effectiveRisk, rr: finalRR, winrate,
    tradesPerDay, clusteringPct, maxConsecLosses, split, fundedMonths,
    instrument, lotSize, slPips, useFixedLot, includeWeekend,
    activeDays, newsSkipDays, seed,
  }));
  p.rng = mulberry32(simHash);

  useEffect(() => {
    if (!finalRRValid) { setSim(null); return; }
    // ── Quota freemium : 3 combinaisons firm+modèle explorées max en version gratuite.
    // Les sliders (winrate, risque, RR...) restent libres sur une combinaison déjà consommée.
    if (!premiumAccess && !consumeFreeSim(firmKey, modelKey)) {
      setSim(null);
      requirePremium();
      return;
    }
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
        // ── Paramètres de trading nécessaires pour reconstruire le calendrier depuis le Dashboard ──
        activeDays, newsSkipDays, includeWeekend,
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
      {(tab === "challenge" || tab === "bilan" || tab === "funded" || tab === "montecarlo") && (
        <div data-coach="sim-toggle" ref={simTabBarRef} style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 20,
          background: "rgba(6,9,15,0.98)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          paddingTop: "env(safe-area-inset-top)", paddingBottom: "8px",
          paddingLeft: 16, paddingRight: 16,
          borderBottom: "1px solid rgba(110,231,183,0.1)",
          transition: "all 0.2s ease-out",
        }}>
          {/* saveStatus silencieux — pas d'affichage visuel */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { id: "challenge", label: "Configuration" },
              { id: "bilan",     label: "Challenge" },
              { id: "funded",    label: "Funded" },
            ].map(tg => (
              <button key={tg.id} onClick={() => {
                if (tg.id === "funded") {
                  setTab("montecarlo");
                } else {
                  setTab(tg.id);
                  window.scrollTo({ top: 0, behavior: "instant" });
                }
              }} style={{
                flex: 1, padding: "12px 8px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700,
                background: (
                  (tg.id === "challenge" && tab === "challenge") ||
                  (tg.id === "bilan"     && tab === "bilan") ||
                  (tg.id === "funded"    && (tab === "funded" || tab === "montecarlo"))
                ) ? "#6ee7b7" : "transparent",
                color: (
                  (tg.id === "challenge" && tab === "challenge") ||
                  (tg.id === "bilan"     && tab === "bilan") ||
                  (tg.id === "funded"    && (tab === "funded" || tab === "montecarlo"))
                ) ? "#000000" : "rgba(255,255,255,0.65)",
                border: "none", transition: "all .2s", userSelect: "none",
              }}>{tg.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Spacer pour compenser le toggle fixed — hauteur EXACTE mesurée en temps réel (zéro gap, zéro recouvrement) */}
      {(tab === "challenge" || tab === "bilan" || tab === "funded" || tab === "montecarlo") && (
        <div style={{ height: simTabBarH != null ? simTabBarH : "calc(env(safe-area-inset-top, 8px) + 54px)" }} />
      )}

      {/* ══ CARTES CONFIG — vue Configuration + Funded uniquement (PAS sur l'onglet Challenge/bilan, qui est un rapport de résultats) ══ */}
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
              Ton risque ({effectiveRiskPct.toFixed(2)}%) dépasse le Kelly optimal ({(kellyFraction * 100).toFixed(1)}%). Risque de ruine accru.
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
              Vérifie les règles de ta prop firm : le forex est fermé le weekend. Le weekend ne s'applique qu'au crypto/indices 24/7 selon les firms.
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
          <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 400, fontSize: 12 }}>{t("sim_raise_wr")}</span>
        </div>
      )}

      {/* ════════ TAB BILAN ════════ */}
      {tab === "bilan" && (
        <div style={{ paddingBottom: 24 }}>
          {!sim || !bilan ? (
            <div className="card" style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontSize: 16, marginBottom: 6 }}>📊</div>
              <div style={{ fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: 4 }}>Lance une simulation</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                Configure tes paramètres dans l'onglet Challenge, puis reviens ici.
              </div>
            </div>
          ) : (<>
            {/* ── Score global passe/échoue ── */}
            <div className="card" style={{ border: "1px solid rgba(110,231,183,0.15)", background: "linear-gradient(135deg, rgba(110,231,183,0.06), rgba(110,231,183,0.01))", textAlign: "center", padding: "20px 16px" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: sim.allPassed ? "#6ee7b7" : "#ef4444", marginBottom: 4 }}>
                {sim.allPassed ? "✓" : "✕"}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 3 }}>
                {sim.allPassed ? "Challenge réussi" : "Challenge échoué"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                {sim.allPassed
                  ? `Toutes les ${model.phases.length} phases passées — compte Funded débloqué`
                  : `Simulation stoppée — revoir winrate ou gestion du risque`}
              </div>
            </div>

            {/* ── BILAN FINANCIER NET (déplacé ici depuis Challenge) ── */}
            <div className="card" style={{ border: "1px solid rgba(110,231,183,0.12)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                {t("sim_balance_net")}
              </div>
              {[
                { label: t("sim_reward_challenge") + " (" + (model.rewardPct||15) + "%)", val: "+" + fmt2(bilan.reward), color: "#6ee7b7", icon: "🏆" },
                { label: t("sim_payouts_paid"), val: "+" + fmt2(bilan.payout), color: "#6ee7b7", icon: "💸" },
                { label: t("sim_pending_unpaid"), val: "+" + fmt2(bilan.pending), color: "rgba(255,255,255,0.55)", icon: "⏳" },
                { label: t("sim_challenge_fees"), val: "-" + fmt2(bilan.fee), color: "#ef4444", icon: "💳" },
              ].map(k => (
                <div key={k.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{k.icon} {k.label}</span>
                  <span style={{ color: k.color, fontWeight: 800, fontSize: 13 }}>{k.val}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, marginTop: 6, borderTop: "2px solid rgba(255,255,255,0.1)" }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>RÉSULTAT NET</span>
                <span style={{ fontWeight: 900, fontSize: 22, color: bilan.net >= 0 ? "#6ee7b7" : "#ef4444" }}>{fmt2(bilan.net)}</span>
              </div>
            </div>

            {/* ── Métriques clés de la simulation ── */}
            <div className="card" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                Synthèse de performance
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { l: "Capital de départ", v: fmt(capital), c: "#fff" },
                  { l: "Prop firm", v: firm.name, c: "#fff" },
                  { l: "Winrate simulé", v: sim.tradeWR ? (sim.tradeWR * 100).toFixed(1) + "%" : "—", c: "rgba(255,255,255,0.85)" },
                  { l: "Trades simulés", v: sim.totalTrades || "—", c: "rgba(255,255,255,0.85)" },
                  { l: "Jours de trading", v: sim.tradingDays || "—", c: "rgba(255,255,255,0.85)" },
                  { l: "Frais challenge", v: "-" + fmt2(bilan.fee), c: "#ef4444" },
                  { l: "ROI brut", v: bilan.reward > 0 ? "+" + ((bilan.reward / capital) * 100).toFixed(1) + "%" : "—", c: "#6ee7b7" },
                  { l: "ROI net", v: "+" + ((bilan.net / capital) * 100).toFixed(1) + "%", c: bilan.net >= 0 ? "#6ee7b7" : "#ef4444" },
                ].map(item => (
                  <div key={item.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{item.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: item.c }}>{item.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Phases détaillées (avec courbes d'équité) ── */}
            {model.phases.map((ph, i) => {
              const data = sim.phaseResults[i];
              const color = i === 0 ? "#6ee7b7" : "rgba(255,255,255,0.55)";
              return (
                <div className="card" key={i} style={{ position: "relative", border: data?.status === "passed" ? "1px solid rgba(110,231,183,0.2)" : "1px solid rgba(239,68,68,0.15)" }}>
                  {!premiumAccess && data && (
                    <LockOverlay onUnlock={requirePremium} label={lang === "en" ? "Unlock your real success rate" : lang === "es" ? "Desbloquea tu tasa de éxito real" : "Débloque ton taux de réussite réel"} />
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{ph.label} - Objectif +{(ph.target * 100)}%</div>
                    {data ? (
                      !premiumAccess ? (
                        <span className="tag" style={{ background: "rgba(110,231,183,0.1)", color: "#6ee7b7", border: "1px solid rgba(110,231,183,0.3)" }}>Premium</span>
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
                            <linearGradient id={"gbp" + i} x1="0" y1="0" x2="0" y2="1">
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
                          <Area type="monotone" dataKey="equity" stroke={color} strokeWidth={2} fill={"url(#gbp" + i + ")"} dot={false} name="Equity" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                      Passe la phase précédente pour débloquer
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Règles du modèle ── */}
            <div className="card">
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Règles {model.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                {[
                  ...model.phases.map(ph => [ph.label + " objectif", "+" + (ph.target * 100) + "%"]),
                  ["DD Journalier", (model.dailyDD * 100) + "% (intraday)"],
                  ["DD Total", (model.totalDD * 100) + "% max"],
                  ["Limite de temps", "Aucune"],
                  ["Min jours/phase", model.phases[0].minDays + " jours"],
                  ["Reward challenge", (model.challengeReward * 100) + "%"],
                  ["1er payout", "après " + model.firstPayoutDays + "j"],
                  ["Split Funded", "80-90%"],
                  ["EA/Algo", "Autorisé"],
                ].map((kv) => (
                  <div key={kv[0]} className="row">
                    <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{kv[0]}</span>
                    <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 11 }}>{kv[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </>)}
        </div>
      )}

      {/* ════════ TAB CHALLENGE ════════ */}
      {tab === "challenge" && (
        <div>
          {!sim ? (
            <div className="card" style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontSize: 16, marginBottom: 6 }}>⚙️</div>
              <div style={{ fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: 4 }}>
                Configure tes paramètres ci-dessus
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                Winrate, risque, RR… puis clique sur <strong style={{ color: "#6ee7b7" }}>Nouvelle simulation</strong>.
              </div>
            </div>
          ) : (<>
            {/* Résumé rapide : état du challenge */}
            <div className="card" style={{ border: sim.allPassed ? "1px solid rgba(110,231,183,0.2)" : "1px solid rgba(239,68,68,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: sim.allPassed ? "#6ee7b7" : "#ef4444" }}>
                    {sim.allPassed ? "✓ Challenge réussi" : "✕ Challenge échoué"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                    {model.phases.length} phases · capital ${capital.toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {model.phases.map((ph, i) => {
                    const data = sim.phaseResults[i];
                    return (
                      <div key={i} style={{ fontSize: 11, color: data?.status === "passed" ? "#6ee7b7" : "rgba(255,255,255,0.4)", marginBottom: 2 }}>
                        {ph.label} {data ? (data.status === "passed" ? "✓" : "✕") + " " + fmtPn(data.profit) : "—"}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Invitation Bilan */}
            <button onClick={() => setTab("bilan")} style={{
              width: "100%", padding: 13, marginTop: 4, borderRadius: 12, cursor: "pointer",
              background: "rgba(110,231,183,0.08)", color: "#6ee7b7",
              border: "1.5px solid rgba(110,231,183,0.3)",
              fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h8" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Voir le Bilan détaillé →
            </button>

            {/* Bouton Funded si réussi */}
            {sim?.allPassed && sim?.funded && (
              <button onClick={() => { if (!premiumAccess) { requirePremium(); return; } setTab("montecarlo"); }} style={{
                width: "100%", padding: 15, marginTop: 6, borderRadius: 12, cursor: "pointer",
                background: "#6ee7b7", color: "#000000", fontSize: 15, fontWeight: 600,
                border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 20px rgba(110,231,183,0.25)",
              }}>
                {t("sim_view_funded")}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M7 4l5 5-5 5" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </>)}
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
            <CalendrierPnL t={t} lang={lang} dailyLog={sim.funded.dailyLog} newsSkipDays={newsSkipDays} activeDays={activeDays} journalMonthLabel={(() => { const n = new Date(); return n.getFullYear() + "-" + String(n.getMonth()+1).padStart(2,"0"); })()} />

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
// ── Parse robuste d'un nombre depuis un export CSV réel (gère les variantes courantes) ──
// - tiret unicode "−" (U+2212) utilisé par certains exports au lieu du tiret ASCII "-"
// - séparateurs de milliers (virgule ou espace) : "1,234.56" / "1 234.56"
// - parenthèses comptables pour le négatif : "(45.30)" → -45.30
// - symboles de devise : "$45.30", "€-12.50"
function parseTradeNumber(raw) {
  if (raw === null || raw === undefined) return NaN;
  let s = String(raw).trim();
  if (!s) return NaN;
  let negative = false;
  // Parenthèses comptables = négatif
  if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1); }
  // Normaliser le tiret unicode (minus sign, dash divers) vers le tiret ASCII
  s = s.replace(/[\u2212\u2010-\u2015]/g, '-');
  // Retirer les symboles de devise et espaces
  s = s.replace(/[€$£¥\s]/g, '');
  if (s.startsWith('-')) { negative = true; s = s.slice(1); }
  // Retirer les séparateurs de milliers (virgule suivie de 3 chiffres groupés)
  s = s.replace(/,(?=\d{3}(?:[.,]|$))/g, '');
  // Si une virgule reste seule (format européen décimal), la convertir en point
  if (/,\d+$/.test(s) && !s.includes('.')) s = s.replace(',', '.');
  const v = parseFloat(s);
  if (isNaN(v)) return NaN;
  return negative ? -Math.abs(v) : v;
}

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
// ══════════════════════════════════════════════════════════════════
// CALENDRIER ÉCONOMIQUE INTELLIGENT
// Base d'événements récurrents (NFP, CPI, FOMC, taux directeurs, PMI, PIB)
// + mapping vers les actifs impactés + moteur d'analyse d'impact réel
// sur l'historique du trader (PF/pertes pendant vs hors événements).
// ══════════════════════════════════════════════════════════════════

// Actifs impactés par type d'événement, avec niveau d'impact (high/medium)
const ECON_ASSET_IMPACT = {
  NFP:    { XAUUSD: "high", GBPUSD: "medium", EURUSD: "medium", US30: "high", NASDAQ: "high" },
  CPI:    { XAUUSD: "high", GBPUSD: "medium", EURUSD: "medium", US30: "high", NASDAQ: "high" },
  FOMC:   { XAUUSD: "high", GBPUSD: "medium", EURUSD: "medium", US30: "high", NASDAQ: "high" },
  RATE:   { XAUUSD: "high", GBPUSD: "high",   EURUSD: "high",   US30: "medium", NASDAQ: "medium" },
  PMI:    { XAUUSD: "medium", GBPUSD: "medium", EURUSD: "medium", US30: "medium", NASDAQ: "medium" },
  GDP:    { XAUUSD: "medium", GBPUSD: "medium", EURUSD: "medium", US30: "medium", NASDAQ: "medium" },
};

const ECON_EVENT_LABELS = {
  NFP: "NFP (Non-Farm Payrolls)", CPI: "CPI (Inflation)", FOMC: "FOMC (Fed)",
  RATE: "Taux directeurs", PMI: "PMI", GDP: "PIB",
};


// Drapeaux des pays émetteurs par type d'événement (emoji unicode — rendu natif sur iOS/Android)
const ECON_FLAGS = {
  NFP:  "🇺🇸",  // Etats-Unis
  CPI:  "🇺🇸",  // Etats-Unis (Fed)
  FOMC: "🇺🇸",  // Etats-Unis (Fed)
  RATE: "🇪🇺",  // Zone Euro (BCE) / Banque d'Angleterre selon le mois
  PMI:  "🌍",   // Multi-zones (US + EU + UK)
  GDP:  "🇺🇸",  // Etats-Unis en priorité
};

// Génère les prochains événements économiques récurrents à partir d'aujourd'hui (best-effort, dates réalistes)
function generateUpcomingEconEvents(fromDate, count = 8) {
  const events = [];
  const d0 = new Date(fromDate);
  // NFP : 1er vendredi de chaque mois, 13:30 UTC
  for (let m = 0; m < 3; m++) {
    const ref = new Date(d0.getFullYear(), d0.getMonth() + m, 1);
    while (ref.getDay() !== 5) ref.setDate(ref.getDate() + 1);
    const ev = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 13, 30);
    if (ev >= d0) events.push({ type: "NFP", date: ev });
  }
  // CPI : ~13 de chaque mois, 13:30 UTC (date indicative)
  for (let m = 0; m < 3; m++) {
    const ev = new Date(d0.getFullYear(), d0.getMonth() + m, 13, 13, 30);
    if (ev >= d0) events.push({ type: "CPI", date: ev });
  }
  // FOMC : ~8 fois par an, environ toutes les 6 semaines (indicatif, mi-mois pairs)
  for (let m = 0; m < 4; m++) {
    if (((d0.getMonth() + m) % 2) === 0) {
      const ev = new Date(d0.getFullYear(), d0.getMonth() + m, 19, 19, 0);
      if (ev >= d0) events.push({ type: "FOMC", date: ev });
    }
  }
  // Taux directeurs (BCE/BoE) : indicatif, jeudi milieu de mois alterné
  for (let m = 0; m < 4; m++) {
    if (((d0.getMonth() + m) % 2) === 1) {
      const ref = new Date(d0.getFullYear(), d0.getMonth() + m, 14);
      const ev = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 13, 0);
      if (ev >= d0) events.push({ type: "RATE", date: ev });
    }
  }
  // PMI : 1er jour ouvré du mois, 9:00 UTC
  for (let m = 0; m < 3; m++) {
    const ref = new Date(d0.getFullYear(), d0.getMonth() + m, 1);
    while (ref.getDay() === 0 || ref.getDay() === 6) ref.setDate(ref.getDate() + 1);
    const ev = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 9, 0);
    if (ev >= d0) events.push({ type: "PMI", date: ev });
  }
  // PIB : trimestriel, ~28 du dernier mois du trimestre
  for (let m = 0; m < 4; m++) {
    if (((d0.getMonth() + m + 1) % 3) === 0) {
      const ev = new Date(d0.getFullYear(), d0.getMonth() + m, 28, 13, 30);
      if (ev >= d0) events.push({ type: "GDP", date: ev });
    }
  }
  events.sort((a, b) => a.date - b.date);
  return events.slice(0, count);
}

// ── Analyse d'impact réel des news sur l'historique du trader ──
// Croise parsedDate des trades avec les fenêtres d'événements (±windowMin minutes)
function economicAnalyze(trades, windowMin = 30) {
  if (!trades || trades.length < 10) return null;
  const withDates = trades.filter(t => t.parsedDate);
  if (withDates.length < trades.length * 0.5) return null; // pas assez de dates fiables

  // Construire les fenêtres d'événements couvrant la période des trades
  const dates = withDates.map(t => t.parsedDate);
  const minDate = new Date(Math.min(...dates)), maxDate = new Date(Math.max(...dates));
  const allEvents = [];
  let cursor = new Date(minDate.getFullYear(), minDate.getMonth() - 1, 1);
  while (cursor <= maxDate) {
    allEvents.push(...generateUpcomingEconEvents(cursor, 20).filter(e => e.date <= maxDate));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  // Dédupliquer par type+date
  const seen = new Set();
  const uniqueEvents = allEvents.filter(e => {
    const k = e.type + e.date.getTime();
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  // Classer chaque trade : pendant un événement (et lequel) ou hors événement
  const newsTrades = [], normalTrades = [];
  const byEventType = {};
  withDates.forEach(t => {
    const hit = uniqueEvents.find(e => Math.abs(t.parsedDate - e.date) <= windowMin * 60000);
    if (hit) {
      newsTrades.push(t);
      if (!byEventType[hit.type]) byEventType[hit.type] = [];
      byEventType[hit.type].push(t);
    } else {
      normalTrades.push(t);
    }
  });

  if (newsTrades.length < 3) return null; // pas assez de trades pendant news pour conclure

  const calcStats = (arr) => {
    const wins = arr.filter(t => t.profit > 0);
    const losses = arr.filter(t => t.profit < 0);
    const grossWin = wins.reduce((s,t)=>s+t.profit,0);
    const grossLoss = Math.abs(losses.reduce((s,t)=>s+t.profit,0));
    const pf = grossLoss > 0 ? grossWin / grossLoss : (grossWin > 0 ? 99 : 0);
    const avgLoss = losses.length ? grossLoss / losses.length : 0;
    const totalLossAmt = grossLoss;
    return { n: arr.length, wins: wins.length, losses: losses.length, pf, avgLoss, totalLossAmt,
      lossRate: arr.length ? (losses.length / arr.length) * 100 : 0 };
  };

  const newsStats = calcStats(newsTrades);
  const normalStats = calcStats(normalTrades);

  // % d'augmentation des pertes pendant news vs normal
  const lossIncreasePct = normalStats.lossRate > 0 ? ((newsStats.lossRate - normalStats.lossRate) / normalStats.lossRate) * 100 : 0;
  const pfDropPct = normalStats.pf > 0 ? ((normalStats.pf - newsStats.pf) / normalStats.pf) * 100 : 0;

  // Stats par type d'événement
  const eventBreakdown = Object.entries(byEventType).map(([type, arr]) => ({
    type, label: ECON_EVENT_LABELS[type] || type, ...calcStats(arr),
  })).sort((a,b) => b.n - a.n);

  // ── Niveau de risque global 🟢🟡🔴 ──
  let riskLevel, riskColor;
  if (pfDropPct >= 40 || lossIncreasePct >= 35) { riskLevel = "high"; riskColor = "#ef4444"; }
  else if (pfDropPct >= 15 || lossIncreasePct >= 15) { riskLevel = "medium"; riskColor = "#fbbf24"; }
  else { riskLevel = "low"; riskColor = "#6ee7b7"; }

  return {
    newsStats, normalStats, lossIncreasePct, pfDropPct, eventBreakdown,
    riskLevel, riskColor, totalNewsTrades: newsTrades.length, totalNormalTrades: normalTrades.length,
  };
}

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
// ══════════════════════════════════════════════════════════════════
// COMPARATEUR INTELLIGENT DE COMPATIBILITÉ PROP FIRM
// Compare le profil réel du trader (winrate, RR, DD, risque/trade,
// trades/jour, style) avec les règles réelles de chaque Prop Firm
// (PROP_FIRMS) → classement de compatibilité % avec raisons précises.
// ══════════════════════════════════════════════════════════════════
function compareAllFirms(trader) {
  // trader = { winrate, avgRR, avgDD, riskPerTrade, tradesPerDay, style, sampleSize }
  if (!trader) return null;
  const { winrate = 0, avgRR = 0, avgDD = 0, riskPerTrade = 0, tradesPerDay = 0, style = "swing", sampleSize = 0 } = trader;
  const isScalper = style === "scalping" || tradesPerDay >= 8;
  const isHFT = tradesPerDay >= 20;

  const results = Object.keys(PROP_FIRMS).map(firmKey => {
    const firm = PROP_FIRMS[firmKey];
    // Utiliser le modèle 2-step par défaut (référence la plus commune), sinon le premier dispo
    const model = firm.models["2step"] || Object.values(firm.models)[0];
    const blockers = [], adjustments = [], strengths = [];
    let score = 0;

    // ── 1. Drawdown compatibility (35 pts) — le facteur le plus déterminant ──
    const ddLimitPct = model.totalDD * 100;
    const ddMarginPct = ddLimitPct - avgDD; // marge restante en points
    if (avgDD <= ddLimitPct * 0.4) { score += 35; strengths.push({ key: 'cmp_dd_excellent', val: ddLimitPct.toFixed(0) }); }
    else if (avgDD <= ddLimitPct * 0.6) { score += 28; strengths.push({ key: 'cmp_dd_good', val: ddLimitPct.toFixed(0) }); }
    else if (avgDD <= ddLimitPct * 0.85) { score += 16; adjustments.push({ key: 'cmp_dd_tight', val: ddLimitPct.toFixed(0) }); }
    else if (avgDD <= ddLimitPct) { score += 6; blockers.push({ key: 'cmp_dd_critical', val: ddLimitPct.toFixed(0) }); }
    else { score += 0; blockers.push({ key: 'cmp_dd_exceeds', val: ddLimitPct.toFixed(0) }); }
    // Pénalité supplémentaire si DD type trailing (plus strict) et trader proche de la limite
    if (model.ddType === "trailing" && avgDD > ddLimitPct * 0.5) {
      score -= 5; adjustments.push({ key: 'cmp_trailing_strict', val: null });
    }

    // ── 2. Profil de risque / RR (20 pts) ──
    // Firms avec DD total serré (≤8%) favorisent un RR élevé et un risque/trade faible
    const tightDD = ddLimitPct <= 8;
    if (avgRR >= 1.5) { score += 12; strengths.push({ key: 'cmp_rr_favors', val: null }); }
    else if (avgRR >= 1.0) { score += 7; }
    else { score += 2; adjustments.push({ key: 'cmp_rr_low', val: null }); }
    if (riskPerTrade > 0) {
      if (tightDD && riskPerTrade > 1.0) { score += 0; blockers.push({ key: 'cmp_risk_too_high_tight', val: ddLimitPct.toFixed(0) }); }
      else if (riskPerTrade <= 1.0) { score += 8; strengths.push({ key: 'cmp_risk_disciplined', val: null }); }
      else { score += 4; adjustments.push({ key: 'cmp_risk_moderate', val: null }); }
    } else { score += 4; }

    // ── 3. Style de trading vs règles spécifiques (20 pts) ──
    const firmForbidsHFT = (firm.note && firm.note.toUpperCase().includes("HFT INTERDIT")) || (firm.note && firm.note.toUpperCase().includes("HFT") && firm.note.toUpperCase().includes("INTERDIT"));
    const firmForbidsNews = model.newsForbidden || (firm.note && firm.note.toLowerCase().includes("news") && (firm.note.toLowerCase().includes("interdit") || firm.note.toLowerCase().includes("non comptee")));
    if (firmForbidsHFT && isHFT) {
      score += 0; blockers.push({ key: 'cmp_hft_forbidden', val: null });
    } else if (model.eaForbidden && style === "ea") {
      score += 0; blockers.push({ key: 'cmp_ea_forbidden', val: null });
    } else if (firmForbidsNews && style === "news") {
      score += 3; blockers.push({ key: 'cmp_news_restricted', val: null });
    } else if (firmForbidsNews && isScalper) {
      score += 10; adjustments.push({ key: 'cmp_news_restricted', val: null });
    } else {
      score += 18; strengths.push({ key: 'cmp_style_compatible', val: null });
    }
    // Fréquence de trading vs minDays (phases courtes pénalisent le swing/scalping lent)
    const minDaysTotal = model.phases.reduce((s,p) => s + (p.minDays||0), 0);
    if (tradesPerDay > 0 && tradesPerDay < 1 && minDaysTotal >= 6) {
      score -= 4; adjustments.push({ key: 'cmp_freq_reduces', val: null });
    }

    // ── 4. Échantillon statistique / fiabilité (15 pts) ──
    if (sampleSize >= 100) score += 15;
    else if (sampleSize >= 30) score += 10;
    else if (sampleSize >= 10) score += 5;
    else { score += 0; adjustments.push({ key: 'cmp_sample_low', val: null }); }

    // ── 5. Winrate cohérence (10 pts) ──
    if (winrate >= 40 && winrate <= 70) score += 10;
    else if (winrate > 0) score += 5;

    score = Math.round(Math.max(0, Math.min(100, score)));
    const tier = score >= 75 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "moderate" : "poor";
    const tierIcon = score >= 75 ? "ok" : score >= 60 ? "ok" : score >= 40 ? "warn" : "danger";

    return { firmKey, firmName: firm.name, color: firm.color, model, score, tier, tierIcon, blockers, adjustments, strengths, ddLimitPct };
  });

  results.sort((a, b) => b.score - a.score);
  return results;
}

// ══════════════════════════════════════════════════════════════════
// HEATMAP DES ERREURS DE TRADING
// Croise jours de semaine × heures × actifs × sessions de marché
// pour identifier précisément où le trader perd réellement son argent.
// ══════════════════════════════════════════════════════════════════

// Sessions de marché (heures UTC approximatives, usage courant retail)
function getMarketSession(hourUTC) {
  if (hourUTC >= 0 && hourUTC < 8) return "asia";
  if (hourUTC >= 8 && hourUTC < 13) return "london";
  if (hourUTC >= 13 && hourUTC < 16) return "london_ny_overlap";
  if (hourUTC >= 16 && hourUTC < 22) return "newyork";
  return "asia"; // 22h-00h, début session Asie
}
const SESSION_LABELS = { asia: "Asie", london: "Londres", london_ny_overlap: "Londres/NY", newyork: "New York" };

// ══════════════════════════════════════════════════════════════════
// BENCHMARK MONDIAL DES TRADERS
// Compare le profil réel du trader à des distributions de référence
// du secteur (issues de données publiques sur la performance retail/
// prop trading : la majorité des traders ont un PF proche de 1, DD
// élevé et faible consistance ; l'élite a un edge statistique net).
// Échelle : average (médiane) → top50 → top25 → top10 → top1.
// Plus haut = meilleur, SAUF pour drawdown où plus bas = meilleur.
// ══════════════════════════════════════════════════════════════════
const BENCHMARK_DISTRIBUTIONS = {
  winrate:    { higherIsBetter: true,  average: 42,   top50: 48,   top25: 55,   top10: 62,   top1: 70   }, // %
  profitFactor:{ higherIsBetter: true, average: 1.05, top50: 1.18, top25: 1.42, top10: 1.85, top1: 2.6  },
  rr:         { higherIsBetter: true,  average: 1.05, top50: 1.25, top25: 1.55, top10: 1.95, top1: 2.8  },
  drawdown:   { higherIsBetter: false, average: 14,   top50: 9,    top25: 5.5,  top10: 2.3,  top1: 0.9  }, // %
  discipline: { higherIsBetter: true,  average: 38,   top50: 50,   top25: 62,   top10: 78,   top1: 92   }, // score /100
  consistency:{ higherIsBetter: true,  average: 35,   top50: 48,   top25: 60,   top10: 75,   top1: 90   }, // score /100
};

// Calcule le percentile estimé d'une valeur par interpolation entre les jalons connus.
// Jalons toujours exprimés en (percentile, valeur) avec percentile croissant.
// Pour higherIsBetter=true : la valeur croît avec le percentile.
// Pour higherIsBetter=false (ex: drawdown) : la valeur DÉCROÎT quand le percentile croît.
function estimatePercentile(value, dist) {
  const { higherIsBetter, average, top50, top25, top10, top1 } = dist;
  // Jalons (percentile, valeur) triés par percentile croissant — la valeur suit le sens de "higherIsBetter"
  const milestones = [
    [50, average], [75, top50], [90, top25], [97, top10], [99.5, top1],
  ];
  // Borne basse (percentile ~1) et haute (percentile ~100) extrapolées au-delà du top1
  const worstVal = higherIsBetter ? average * 0.4 : average * 1.8;
  const bestVal = higherIsBetter ? top1 * 1.3 : top1 * 0.5;
  const points = [[1, worstVal], ...milestones, [100, bestVal]];

  // Si meilleur que le meilleur jalon connu, percentile ≈ 99.5+
  if (higherIsBetter && value >= bestVal) return 99;
  if (!higherIsBetter && value <= bestVal) return 99;

  for (let i = 0; i < points.length - 1; i++) {
    const [p1, v1] = points[i], [p2, v2] = points[i+1];
    const lo = Math.min(v1, v2), hi = Math.max(v1, v2);
    if (value >= lo && value <= hi) {
      // Position de "value" dans le segment [v1, v2] (qui peut être croissant ou décroissant selon higherIsBetter)
      const ratio = v2 === v1 ? 0.5 : (value - v1) / (v2 - v1);
      return Math.round(Math.max(1, Math.min(99, p1 + ratio * (p2 - p1))));
    }
  }
  // Hors bornes : pire que le pire jalon connu
  return 1;
}

// Détermine le niveau de classement (badge) à partir du percentile
function rankLevelFromPercentile(pct) {
  if (pct >= 99) return { key: "top1", label: "Top 1%", color: "#fbbf24", icon: "elite" };
  if (pct >= 90) return { key: "top10", label: "Top 10%", color: "#a78bfa", icon: "professional" };
  if (pct >= 75) return { key: "top25", label: "Top 25%", color: "#6ee7b7", icon: "disciplined" };
  if (pct >= 50) return { key: "top50", label: "Top 50%", color: "#60a5fa", icon: "beginner" };
  return { key: "average", label: "Moyenne", color: "rgba(255,255,255,0.5)", icon: "beginner" };
}

// ══════════════════════════════════════════════════════════════════
// worldBenchmark(metrics) — point d'entrée principal
// metrics = { winrate, profitFactor, rr, drawdown, discipline, consistency } (valeurs réelles, certaines peuvent être null)
// ══════════════════════════════════════════════════════════════════
function worldBenchmark(metrics) {
  if (!metrics) return null;
  const results = {};
  let validCount = 0, percentileSum = 0;

  Object.keys(BENCHMARK_DISTRIBUTIONS).forEach(key => {
    const value = metrics[key];
    if (value === null || value === undefined || isNaN(value)) {
      results[key] = null;
      return;
    }
    const dist = BENCHMARK_DISTRIBUTIONS[key];
    const percentile = estimatePercentile(value, dist);
    const level = rankLevelFromPercentile(percentile);
    results[key] = { value, percentile, level, ...dist };
    validCount++; percentileSum += percentile;
  });

  if (validCount === 0) return null;

  const globalPercentile = Math.round(percentileSum / validCount);
  const globalLevel = rankLevelFromPercentile(globalPercentile);

  // Prochaine étape : la métrique la plus faible (percentile le plus bas) = priorité d'amélioration
  const validMetrics = Object.entries(results).filter(([,v]) => v !== null);
  validMetrics.sort((a,b) => a[1].percentile - b[1].percentile);
  const weakestMetric = validMetrics.length ? validMetrics[0] : null;

  // Cible suivante : le prochain jalon au-dessus du niveau global actuel
  const nextThresholds = { average: 50, top50: 75, top25: 90, top10: 99, top1: 100 };
  const nextTarget = nextThresholds[globalLevel.key];

  return {
    metrics: results, globalPercentile, globalLevel, weakestMetric, nextTarget,
    rankEstimate: Math.max(1, Math.round((100 - globalPercentile) / 100 * 50000) + 1), // estimation "classement mondial" sur base 50k traders
  };
}

function heatmapAnalyze(trades) {
  if (!trades || trades.length < 10) return null;
  const DAY_NAMES = [AL('day_sun'), AL('day_mon'), AL('day_tue'), AL('day_wed'), AL('day_thu'), AL('day_fri'), AL('day_sat')];
  const withDates = trades.filter(t => t.parsedDate);
  if (withDates.length < trades.length * 0.5) return null; // pas assez de dates fiables

  const totalLossAll = Math.abs(trades.filter(t => t.profit < 0).reduce((s,t)=>s+t.profit,0)) || 1;
  const totalProfitAll = trades.filter(t => t.profit > 0).reduce((s,t)=>s+t.profit,0) || 1;

  // ── 1. Heatmap croisée Jour × Heure (grille 7×24) ──
  const grid = {}; // key "day-hour" -> {trades, profit, wins, losses}
  withDates.forEach(t => {
    const day = t.parsedDate.getDay();
    const hour = t.parsedDate.getHours();
    const key = day + "-" + hour;
    if (!grid[key]) grid[key] = { day, hour, trades: 0, profit: 0, wins: 0, losses: 0 };
    grid[key].trades++; grid[key].profit += t.profit;
    if (t.profit > 0) grid[key].wins++; else if (t.profit < 0) grid[key].losses++;
  });
  const gridCells = Object.values(grid).map(c => ({
    ...c, dayLabel: DAY_NAMES[c.day], wr: c.trades ? (c.wins/c.trades)*100 : 0,
    pctOfTotalLoss: c.profit < 0 ? (Math.abs(c.profit)/totalLossAll)*100 : 0,
  }));

  // ── 2. Sessions de marché ──
  let sessionStats = {};
  withDates.forEach(t => {
    const sess = getMarketSession(t.parsedDate.getHours());
    if (!sessionStats[sess]) sessionStats[sess] = { trades: 0, profit: 0, wins: 0, losses: 0 };
    sessionStats[sess].trades++; sessionStats[sess].profit += t.profit;
    if (t.profit > 0) sessionStats[sess].wins++; else if (t.profit < 0) sessionStats[sess].losses++;
  });
  const sessionList = Object.entries(sessionStats).map(([k, s]) => ({
    key: k, label: SESSION_LABELS[k] || k, ...s, wr: s.trades ? (s.wins/s.trades)*100 : 0,
    pctOfTotalLoss: s.profit < 0 ? (Math.abs(s.profit)/totalLossAll)*100 : 0,
    pctOfTotalProfit: s.profit > 0 ? (s.profit/totalProfitAll)*100 : 0,
  })).sort((a,b) => a.profit - b.profit);

  // ── 3. Croisement Actif × Heure (ex: "XAUUSD après 15h30") ──
  const withSymbol = withDates.filter(t => t.symbol);
  const hasSymbolData = withSymbol.length >= trades.length * 0.3;
  let symbolHourStats = {};
  if (hasSymbolData) {
    withSymbol.forEach(t => {
      const hour = t.parsedDate.getHours();
      const bucket = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"; // tranches larges
      const key = t.symbol + "|" + bucket;
      if (!symbolHourStats[key]) symbolHourStats[key] = { symbol: t.symbol, bucket, trades: 0, profit: 0, wins: 0, losses: 0, hours: [] };
      symbolHourStats[key].trades++; symbolHourStats[key].profit += t.profit; symbolHourStats[key].hours.push(hour);
      if (t.profit > 0) symbolHourStats[key].wins++; else if (t.profit < 0) symbolHourStats[key].losses++;
    });
  }
  const symbolHourList = Object.values(symbolHourStats)
    .filter(s => s.trades >= 3)
    .map(s => ({
      ...s, wr: s.trades ? (s.wins/s.trades)*100 : 0,
      avgHour: s.hours.length ? Math.round(s.hours.reduce((a,b)=>a+b,0)/s.hours.length) : 0,
      pctOfTotalLoss: s.profit < 0 ? (Math.abs(s.profit)/totalLossAll)*100 : 0,
    }))
    .sort((a,b) => a.profit - b.profit);

  // ── 4. Zones rouges / vertes — synthèse des pires et meilleures combinaisons ──
  const dayAgg = {};
  gridCells.forEach(c => {
    if (!dayAgg[c.day]) dayAgg[c.day] = { day: c.day, dayLabel: c.dayLabel, trades: 0, profit: 0, wins: 0 };
    dayAgg[c.day].trades += c.trades; dayAgg[c.day].profit += c.profit; dayAgg[c.day].wins += c.wins;
  });
  const dayList = Object.values(dayAgg).map(d => ({
    ...d, wr: d.trades ? (d.wins/d.trades)*100 : 0, pctOfTotalLoss: d.profit < 0 ? (Math.abs(d.profit)/totalLossAll)*100 : 0,
  })).sort((a,b) => a.profit - b.profit);

  // Construire les "red zones" et "green zones" les plus significatives (triées par impact $ et fiabilité échantillon)
  const redZones = [];
  const worstDay = dayList.find(d => d.trades >= 5 && d.profit < 0);
  if (worstDay) redZones.push({ type: "day", label: worstDay.dayLabel, detail: worstDay, impact: Math.abs(worstDay.profit) });
  const worstSession = sessionList.find(s => s.trades >= 5 && s.profit < 0);
  if (worstSession) redZones.push({ type: "session", label: worstSession.label, detail: worstSession, impact: Math.abs(worstSession.profit) });
  const worstSymbolHour = symbolHourList.find(sh => sh.profit < 0);
  if (worstSymbolHour) redZones.push({ type: "symbolhour", label: worstSymbolHour.symbol, detail: worstSymbolHour, impact: Math.abs(worstSymbolHour.profit) });
  redZones.sort((a,b) => b.impact - a.impact);

  const greenZones = [];
  const bestDay = [...dayList].reverse().find(d => d.trades >= 5 && d.profit > 0);
  if (bestDay) greenZones.push({ type: "day", label: bestDay.dayLabel, detail: bestDay, impact: bestDay.profit });
  const bestSession = [...sessionList].reverse().find(s => s.trades >= 5 && s.profit > 0);
  if (bestSession) greenZones.push({ type: "session", label: bestSession.label, detail: bestSession, impact: bestSession.profit });
  const bestSymbolHour = [...symbolHourList].reverse().find(sh => sh.profit > 0);
  if (bestSymbolHour) greenZones.push({ type: "symbolhour", label: bestSymbolHour.symbol, detail: bestSymbolHour, impact: bestSymbolHour.profit });
  greenZones.sort((a,b) => b.impact - a.impact);

  // ── Impact financier total identifié ──
  const totalRedImpact = redZones.reduce((s,z) => s + z.impact, 0);

  return {
    gridCells, dayList, sessionList, symbolHourList, hasSymbolData,
    redZones, greenZones, totalRedImpact,
    totalTrades: withDates.length,
  };
}

// ══════════════════════════════════════════════════════════════════
// HEATMAP — variante Journal de Trading
// Le journal capture pnl/wins/losses PAR JOUR CALENDAIRE (pas d'heure ni
// d'actif précis) → on analyse uniquement la dimension Jour de semaine,
// mais on réutilise le même format de sortie (redZones/greenZones) pour
// garder un rendu visuel identique au rapport MesTrades.
// ══════════════════════════════════════════════════════════════════
function heatmapAnalyzeJournal(journalRaw) {
  const allDays = [];
  Object.entries(journalRaw || {}).forEach(([mk, days]) => {
    Object.entries(days || {}).forEach(([d, e]) => {
      if (e && (e.pnl !== undefined || e.wins !== undefined)) {
        const [y, m] = mk.split("-").map(Number);
        const date = new Date(y, m - 1, parseInt(d, 10));
        allDays.push({ date, pnl: e.pnl || 0, wins: e.wins || 0, losses: e.losses || 0 });
      }
    });
  });
  if (allDays.length < 5) return null;

  const DAY_NAMES = [AL('day_sun'), AL('day_mon'), AL('day_tue'), AL('day_wed'), AL('day_thu'), AL('day_fri'), AL('day_sat')];
  const totalLossAll = Math.abs(allDays.filter(d => d.pnl < 0).reduce((s,d)=>s+d.pnl,0)) || 1;

  let dayAgg = {};
  allDays.forEach(d => {
    const dow = d.date.getDay();
    if (!dayAgg[dow]) dayAgg[dow] = { day: dow, dayLabel: DAY_NAMES[dow], trades: 0, profit: 0, wins: 0, losses: 0 };
    dayAgg[dow].trades++; dayAgg[dow].profit += d.pnl;
    dayAgg[dow].wins += d.wins > d.losses ? 1 : 0;
    dayAgg[dow].losses += d.losses > d.wins ? 1 : 0;
  });
  const dayList = Object.values(dayAgg).map(d => ({
    ...d, wr: d.trades ? (d.wins/d.trades)*100 : 0, pctOfTotalLoss: d.profit < 0 ? (Math.abs(d.profit)/totalLossAll)*100 : 0,
  })).sort((a,b) => a.profit - b.profit);

  const redZones = [];
  const worstDay = dayList.find(d => d.trades >= 2 && d.profit < 0);
  if (worstDay) redZones.push({ type: "day", label: worstDay.dayLabel, detail: worstDay, impact: Math.abs(worstDay.profit) });

  const greenZones = [];
  const bestDay = [...dayList].reverse().find(d => d.trades >= 2 && d.profit > 0);
  if (bestDay) greenZones.push({ type: "day", label: bestDay.dayLabel, detail: bestDay, impact: bestDay.profit });

  const totalRedImpact = redZones.reduce((s,z) => s + z.impact, 0);

  // gridCells/sessionList vides (pas de donnée horaire dans le journal) → le composant masquera ces sections
  return {
    gridCells: [], dayList, sessionList: [], symbolHourList: [], hasSymbolData: false,
    redZones, greenZones, totalRedImpact, totalTrades: allDays.length, dayOnly: true,
  };
}

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
    verdictLevel = "red"; verdictLabel = AL('dec_dont_launch'); verdictColor = "#ef4444"; verdictEmoji = "danger";
  } else if (score < 65) {
    verdictLevel = "yellow"; verdictLabel = AL('dec_wait'); verdictColor = "#fbbf24"; verdictEmoji = "warn";
  } else {
    verdictLevel = "green"; verdictLabel = AL('dec_launch'); verdictColor = "#6ee7b7"; verdictEmoji = "ok";
  }

  return { score, verdictLevel, verdictLabel, verdictColor, verdictEmoji, reasons, positives, pf, wr, rr, dd, mc, nTrades };
}

// ══════════════════════════════════════════════════════════════════
// COMPOSANT RÉUTILISABLE — Rapport Heatmap des Erreurs de Trading
// Utilisé dans MesTradesTab (après import CSV) ET dans JournalScreen.
// ══════════════════════════════════════════════════════════════════
function HeatmapReport({ heat, t }) {
  if (!heat) {
    return (
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(110,231,183,0.10)", borderRadius: 16, padding: "20px 14px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{t("heat_no_data")}</div>
      </div>
    );
  }

  const sessionLabel = (k) => k === "asia" ? t("heat_session_asia") : k === "london" ? t("heat_session_london")
    : k === "london_ny_overlap" ? t("heat_session_overlap") : t("heat_session_newyork");
  const zoneIcon = { day: "", session: "", symbolhour: "" };
  const fmtZoneDetail = (z) => {
    if (z.type === "day") return `${z.detail.trades} ${t("heat_trades_unit")} · WR ${z.detail.wr.toFixed(0)}%`;
    if (z.type === "session") return `${sessionLabel(z.detail.key)} · ${z.detail.trades} ${t("heat_trades_unit")}`;
    return `${z.detail.symbol} ${z.detail.bucket === "morning" ? t("heat_morning") : z.detail.bucket === "afternoon" ? t("heat_afternoon") : t("heat_evening")} (~${z.detail.avgHour}h) · ${z.detail.trades} ${t("heat_trades_unit")}`;
  };

  // Grille 7×24 pour la carte thermique visuelle (simplifiée par tranches de 3h pour la lisibilité mobile)
  const DAY_SHORT = ["D","L","M","M","J","V","S"];
  const hourBuckets = [0,3,6,9,12,15,18,21]; // tranches de 3h
  const maxAbsProfit = Math.max(1, ...heat.gridCells.map(c => Math.abs(c.profit)));

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(110,231,183,0.10)", borderRadius: 16, padding: 16 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{t("heat_title")}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{t("heat_subtitle")}</div>
      </div>

      {/* Impact financier total */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{t("heat_financial_impact")}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#ef4444" }}>-${Math.round(heat.totalRedImpact)}</span>
      </div>

      {/* Carte thermique Jour × Heure — uniquement si données horaires dispo (pas dans le journal) */}
      {!heat.dayOnly && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 8 }}>{t("heat_grid_title")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "24px repeat(7, 1fr)", gap: 3, marginBottom: 6 }}>
            <div></div>
            {DAY_SHORT.map((d, i) => <div key={i} style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>{d}</div>)}
          </div>
          {hourBuckets.map(hStart => (
            <div key={hStart} style={{ display: "grid", gridTemplateColumns: "24px repeat(7, 1fr)", gap: 3, marginBottom: 3 }}>
              <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center" }}>{hStart}h</div>
              {[0,1,2,3,4,5,6].map(day => {
                const cells = heat.gridCells.filter(c => c.day === day && c.hour >= hStart && c.hour < hStart + 3);
                const profit = cells.reduce((s,c) => s + c.profit, 0);
                const tradesCount = cells.reduce((s,c) => s + c.trades, 0);
                const intensity = tradesCount > 0 ? Math.min(1, Math.abs(profit) / maxAbsProfit) : 0;
                const color = tradesCount === 0 ? "rgba(255,255,255,0.03)" : profit < 0 ? `rgba(239,68,68,${0.15 + intensity*0.65})` : `rgba(110,231,183,${0.15 + intensity*0.65})`;
                return <div key={day} style={{ height: 16, borderRadius: 3, background: color }} title={tradesCount + " trades, $" + profit.toFixed(0)} />;
              })}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 8, color: "#ef4444" }}>{t("heat_legend_more_loss")}</span>
            <span style={{ fontSize: 8, color: "#6ee7b7" }}>{t("heat_legend_more_gain")}</span>
          </div>
        </>
      )}

      {/* Sessions de marché — uniquement si données horaires dispo */}
      {!heat.dayOnly && heat.sessionList.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 8 }}>{t("heat_sessions_title")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {heat.sessionList.map((s, i) => (
              <div key={i} style={{ background: s.profit < 0 ? "rgba(239,68,68,0.06)" : "rgba(110,231,183,0.06)", borderRadius: 10, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{sessionLabel(s.key)}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.profit < 0 ? "#ef4444" : "#6ee7b7" }}>{s.profit >= 0 ? "+" : ""}${s.profit.toFixed(0)}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{s.trades} {t("heat_trades_unit")} · WR {s.wr.toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Zones à risque */}
      {heat.redZones.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", marginBottom: 6 }}>{t("heat_red_zones")}</div>
          {heat.redZones.map((z, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < heat.redZones.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{z.label}</span>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{fmtZoneDetail(z)}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#ef4444" }}>-${Math.round(z.impact)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Zones favorables */}
      {heat.greenZones.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6ee7b7", textTransform: "uppercase", marginBottom: 6 }}>{t("heat_green_zones")}</div>
          {heat.greenZones.map((z, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < heat.greenZones.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{z.label}</span>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{fmtZoneDetail(z)}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#6ee7b7" }}>+${Math.round(z.impact)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MesTradesTab({ sim, capital, fundedMonths, winrate, riskPct, dailyTargetPct, model, finalRR, tradesPerDay, firm, effectiveRiskAmount, t = (k) => k, lang = "fr" }) {
  // ── Journal de trading (partagé avec l'accueil via useJournal) ──
  const { journal: jAll, journalMonth: jMonth, setJournalMonth: setJMonth, saveJournalEntry: saveJEntry } = useJournal();
  const jMonthData = filterJournalByAccount(jAll, "default")[jMonth] || {};
  const [showJournal, setShowJournal] = useState(false);
  const loadTrades = () => {
    try {
      const r = localStorage.getItem("eapropfirm_trades");
      if (!r) return { trades: [], filename: null, initBalance: null, balanceReconstructed: false };
      const data = JSON.parse(r);
      // JSON.parse désérialise les Date en strings — les reconvertir pour mt5Analyze/economicAnalyze/heatmapAnalyze
      if (data.trades && Array.isArray(data.trades)) {
        data.trades = data.trades.map(tr => ({
          ...tr,
          parsedDate: tr.parsedDate ? new Date(tr.parsedDate) : null,
        }));
      }
      return data;
    } catch (e) { return { trades: [], filename: null, initBalance: null, balanceReconstructed: false }; }
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
  // effectiveInitBalance doit être défini AVANT les moteurs qui l'utilisent (mt5Analyze, etc.)
  const effectiveInitBalance = initBalance || (trades.length > 0 ? trades[0].balance - trades[0].profit : capital);
  // ── Moteur d'analyse automatique MT5 (calculé à chaque changement de trades) ──
  setALLang(lang);
  const mt5Analysis = trades.length >= 5 ? mt5Analyze(trades, effectiveInitBalance) : null;
  // ── Calendrier économique intelligent : impact des news sur la performance ──
  const econAnalysis = trades.length >= 10 ? economicAnalyze(trades, 30) : null;
  // ── Heatmap des erreurs de trading : jours/heures/actifs/sessions ──
  const heatmapData = trades.length >= 10 ? heatmapAnalyze(trades) : null;
  const upcomingEconEvents = generateUpcomingEconEvents(new Date(), 5);
  const [manualDDInput, setManualDDInput] = useState("");
  const [geminiVerdict, setGeminiVerdict] = useState(null);
  const [geminiVerdictLoading, setGeminiVerdictLoading] = useState(false);
  const geminiVerdictRef = useRef(null); // évite les appels multiples
  // ── Validation Gemini : Analyse Comportementale MT5 ──
  const [geminiMT5, setGeminiMT5] = useState(null);
  const [geminiMT5Loading, setGeminiMT5Loading] = useState(false);
  const geminiMT5Ref = useRef(null);
  // ── Validation Gemini : Écran de décision "Puis-je lancer ce challenge ?" ──
  const [geminiDecision, setGeminiDecision] = useState(null);
  const [geminiDecisionLoading, setGeminiDecisionLoading] = useState(false);
  const geminiDecisionRef = useRef(null);
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
      const profitRaw = parseTradeNumber(row[profitIdx]); if (isNaN(profitRaw)) continue;
      const comm = commIdx >= 0 ? (parseTradeNumber(row[commIdx]) || 0) : 0; const swap = swapIdx >= 0 ? (parseTradeNumber(row[swapIdx]) || 0) : 0;
      const netProfit = profitRaw + comm + swap;
      let balance = balanceIdx >= 0 ? parseTradeNumber(row[balanceIdx]) : NaN;
      if (!isNaN(balance) && balance > 0) { hasRealBalance = true; }
      if (isNaN(balance)) { runningBalance += netProfit; balance = runningBalance; }
      if (initBalance === null) initBalance = balance - netProfit;
      const timeRaw = (timeIdx >= 0 ? row[timeIdx] : '').trim();
      const symbolRaw = (symbolIdx >= 0 ? row[symbolIdx] : '').trim().toUpperCase();
      const volumeRaw = volumeIdx >= 0 ? parseTradeNumber(row[volumeIdx]) : null;
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

    // ── Validation Gemini : Écran de décision "Puis-je lancer ce challenge ?" ──
    const d = canLaunchChallenge(v);
    if (d) {
      const dKey = `${d.verdictLevel}_${d.score}_${trades.length}`;
      if (geminiDecisionRef.current !== dKey) {
        geminiDecisionRef.current = dKey;
        setGeminiDecision(null);
        setGeminiDecisionLoading(true);
        callGeminiDecisionValidation(d, lang).then(r => {
          setGeminiDecisionLoading(false);
          if (r) setGeminiDecision(r);
        });
      }
    }
  }, [trades.length, balanceReconstructed, manualDD]);

  // ── Validation Gemini : Analyse Comportementale MT5 ──
  useEffect(() => {
    if (!mt5Analysis) return;
    const mKey = `${mt5Analysis.n}_${mt5Analysis.hasTimeData}_${mt5Analysis.hasSymbolData}_${mt5Analysis.bestDay?.day}_${mt5Analysis.bestSymbol?.symbol}`;
    if (geminiMT5Ref.current === mKey) return;
    geminiMT5Ref.current = mKey;
    setGeminiMT5(null);
    setGeminiMT5Loading(true);
    callGeminiMT5Validation(mt5Analysis, lang).then(r => {
      setGeminiMT5Loading(false);
      if (r) setGeminiMT5(r);
    });
  }, [trades.length]);

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
      {/* ── HEADER PAGE — même style que Journal de Trading ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{t("mt_page_title")}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{t("mt_page_subtitle")}</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          "PUIS-JE LANCER CE CHALLENGE ?" — écran de décision
          Synthèse PF/WR/RR/DD/Échantillon/Monte Carlo → verdict 3 niveaux
      ══════════════════════════════════════════════════════════ */}
      <div className="card" style={{ border: decision ? `1.5px solid ${decision.verdictColor}55` : "1px solid rgba(255,255,255,0.08)", background: decision ? decision.verdictColor + "0c" : "rgba(255,255,255,0.03)" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{t("dec_title")}</div>
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
                  <StatusDot kind={decision.verdictEmoji} /> {decision.verdictLabel}
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

            {/* ── Validation indépendante (Gemini) ── */}
            <GeminiValidationCard t={t} loading={geminiDecisionLoading} result={geminiDecision} />
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
            <div style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>{t("mt_csv_text")}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{t("mt_csv_instr")}<br/>{t("mt_csv_instr2")}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>{t("mt_backtest_html")}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{t("mt_html_instr")}</div>
          </div>
        </div>
        <label style={{ display: "block", background: "rgba(255,255,255,0.05)", border: "2px dashed #2d2d3d", borderRadius: 10, padding: "16px", textAlign: "center", cursor: "pointer" }}>
          
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
              <StatusDot kind={balanceReconstructed ? "warn" : "ok"} />
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
              {showBalanceInput ? t("acc_cancel") : t("acc_edit")}
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
              { l: "DD max", v: "inconnu", c: "#fbbf24" },
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

          {/* ══════════════════════════════════════════════════════
              MOTEUR D'ANALYSE AUTOMATIQUE MT5
              Winrate, PF, RR, DD, séries, horaires, jours, instruments
              + détection revenge trading / overtrading / sous-risque
          ══════════════════════════════════════════════════════ */}
          {mt5Analysis && (() => {
            const m = mt5Analysis;
            return (
              <div className="card" style={{ border: "1px solid rgba(110,231,183,0.12)" }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{t("mt5_title")}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{t("mt5_subtitle")} · {m.n} {t("mt5_trades_analyzed")}</div>
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
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>{t("mt5_no_symbol_data")}</div>
                )}

                {/* ── Validation indépendante (Gemini) ── */}
                <GeminiValidationCard t={t} loading={geminiMT5Loading} result={geminiMT5} />
              </div>
            );
          })()}

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
                real: balanceReconstructed ? "inconnu" : stats.ddPct.toFixed(2) + "%",
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
                Réel (backtest importé){sim && sim.funded && sim.funded.data && sim.funded.data.length ? " · Simulation" : ""}
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
            <CalendrierPnL t={t} lang={lang} dailyLog={dailyLogReel} realMode={true} journalMonthLabel={(() => { const n = new Date(); return n.getFullYear() + "-" + String(n.getMonth()+1).padStart(2,"0"); })()} />
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
          {t("cal_journal_title")}
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
// Formate une clé mois "YYYY-MM" en libellé localisé lisible, ex: "2026-06" -> "Juin 2026"
function formatMonthLabel(monthKey, lang = "fr") {
  const [y, m] = (monthKey || "").split("-").map(Number);
  if (!y || !m) return monthKey;
  const names = {
    fr: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
    en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
    es: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
  };
  const list = names[lang] || names.fr;
  return `${list[m-1]} ${y}`;
}

// ══════════════════════════════════════════════════════════════════
// Migre l'ancien format de stockage { mois: { jour: entry } } vers le
// nouveau { mois: { jour: { accountId: entry } } }, qui permet à
// CHAQUE compte d'avoir sa propre entrée pour un même jour. L'ancien
// format ne pouvait stocker qu'UNE SEULE entrée par jour, partagée
// entre tous les comptes — d'où le bug où saisir sur un compte
// effaçait les données d'un autre compte au même jour.
// Une entrée détectée par la présence d'un champ .pnl au niveau du
// jour est considérée comme l'ancien format et rattachée au compte
// qu'elle référence (entry.accountId), ou "default" sinon.
// ══════════════════════════════════════════════════════════════════
function migrateJournalToMultiAccount(rawJournal) {
  const out = {};
  Object.entries(rawJournal || {}).forEach(([month, days]) => {
    const newDays = {};
    Object.entries(days || {}).forEach(([day, dayData]) => {
      if (!dayData) return;
      if (dayData.pnl !== undefined) {
        // Ancien format : dayData est l'entrée elle-même
        const accId = dayData.accountId || "default";
        const cleanEntry = { ...dayData };
        delete cleanEntry.accountId;
        newDays[day] = { [accId]: cleanEntry };
      } else {
        // Déjà au nouveau format
        newDays[day] = dayData;
      }
    });
    if (Object.keys(newDays).length) out[month] = newDays;
  });
  return out;
}

function useJournal() {
  const [journalMonth, setJournalMonth] = useState(() => {
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  });
  const [journal, setJournal] = useState(() => {
    try {
      const r = localStorage.getItem("eapropfirm_journal");
      const parsed = r ? JSON.parse(r) : {};
      const migrated = migrateJournalToMultiAccount(parsed);
      // Persiste immédiatement le résultat migré pour que toutes les futures lectures soient cohérentes
      try { localStorage.setItem("eapropfirm_journal", JSON.stringify(migrated)); } catch (e) {}
      return migrated;
    }
    catch (e) { return {}; }
  });
  // accountId : compte auquel rattacher cette entrée. "default" si non précisé
  // (cas des écrans qui n'ont pas encore de sélecteur de compte, ex. mini-journal de Mes Trades).
  const saveJournalEntry = (day, entry, accountId = "default") => {
    setJournal(prev => {
      const next = { ...prev };
      next[journalMonth] = { ...(next[journalMonth] || {}) };
      const dayKey = String(day);
      const dayAccounts = { ...(next[journalMonth][dayKey] || {}) };
      if (entry === null) {
        delete dayAccounts[accountId];
      } else {
        dayAccounts[accountId] = entry;
      }
      if (Object.keys(dayAccounts).length) {
        next[journalMonth][dayKey] = dayAccounts;
      } else {
        delete next[journalMonth][dayKey];
      }
      if (!Object.keys(next[journalMonth]).length) delete next[journalMonth];
      try {
        localStorage.setItem("eapropfirm_journal", JSON.stringify(next));
      } catch (e) {
        // Quota localStorage dépassé (souvent à cause des images)
        const lsLang = (() => { try { return JSON.parse(localStorage.getItem("eapropfirm_app") || "{}")?.profile?.lang || "fr"; } catch(e){ return "fr"; } })();
        alert(makeT(lsLang)("journal_storage_full"));
        return prev;
      }
      return next;
    });
  };
  // Purge toutes les entrées d'un compte donné (utilisé lors d'une suppression DÉFINITIVE de compte) —
  // ne touche QUE ce compte, les autres comptes gardent leurs entrées sur les mêmes jours.
  const purgeAccountEntries = (accId) => {
    setJournal(prev => {
      const next = {};
      Object.entries(prev).forEach(([month, days]) => {
        const filteredDays = {};
        Object.entries(days || {}).forEach(([day, dayAccounts]) => {
          const remaining = { ...dayAccounts };
          delete remaining[accId];
          if (Object.keys(remaining).length) filteredDays[day] = remaining;
        });
        if (Object.keys(filteredDays).length) next[month] = filteredDays;
      });
      try { localStorage.setItem("eapropfirm_journal", JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };
  return { journal, journalMonth, setJournalMonth, saveJournalEntry, purgeAccountEntries, monthData: journal[journalMonth] || {} };
}

// ══════════════════════════════════════════════════════════════════
// Gestion des comptes multiples du Journal de Trading — un trader
// performant peut avoir plusieurs comptes prop firm en parallèle.
// Chaque compte = { id, firmKey (optionnel, parmi PROP_FIRMS) ou
// customName (texte libre), color }. Stocké localement, indépendant
// des entrées de jour (qui référencent juste un accountId).
// ══════════════════════════════════════════════════════════════════
function useJournalAccounts() {
  const [accounts, setAccounts] = useState(() => {
    try {
      const r = localStorage.getItem("eapropfirm_journal_accounts");
      const parsed = r ? JSON.parse(r) : [];
      return parsed.length ? parsed : [{ id: "default", firmKey: null, customName: null, color: "#6ee7b7", capital: null, accountType: null, archived: false }];
    } catch (e) { return [{ id: "default", firmKey: null, customName: null, color: "#6ee7b7", capital: null, accountType: null, archived: false }]; }
  });

  const persist = (next) => {
    setAccounts(next);
    try { localStorage.setItem("eapropfirm_journal_accounts", JSON.stringify(next)); } catch (e) {}
  };

  const addAccount = (firmKey, customName, capital, accountType) => {
    const id = "acc_" + Date.now();
    const palette = ["#6ee7b7", "#fbbf24", "#a78bfa", "#60a5fa", "#f97316", "#ec4899"];
    const color = palette[accounts.length % palette.length];
    const next = [...accounts, { id, firmKey: firmKey || null, customName: customName || null, color, capital: capital || null, accountType: accountType || null, archived: false }];
    persist(next);
    return id;
  };

  // Suppression DÉFINITIVE — efface le compte ET ses entrées de journal (gérée côté JournalScreen via purgeAccountEntries)
  const removeAccount = (id) => {
    const activeCount = accounts.filter(a => !a.archived).length;
    const target = accounts.find(a => a.id === id);
    if (target && !target.archived && activeCount <= 1) return; // toujours garder au moins un compte actif
    persist(accounts.filter(a => a.id !== id));
  };

  // Modification générique (capital, type de compte, prop firm / nom)
  const updateAccount = (id, patch) => {
    persist(accounts.map(a => a.id === id ? { ...a, ...patch } : a));
  };

  // Archivage doux — conserve les données, masque le compte des comptes actifs
  const archiveAccount = (id, archived = true) => {
    if (archived) {
      const activeCount = accounts.filter(a => !a.archived).length;
      const target = accounts.find(a => a.id === id);
      if (target && !target.archived && activeCount <= 1) return; // toujours garder au moins un compte actif
    }
    updateAccount(id, { archived });
  };

  const accountLabel = (acc) => {
    if (!acc) return "";
    if (acc.customName) return acc.customName;
    if (acc.firmKey && PROP_FIRMS[acc.firmKey]) return PROP_FIRMS[acc.firmKey].name;
    return "Compte principal";
  };

  return { accounts, addAccount, removeAccount, updateAccount, archiveAccount, accountLabel };
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

function CalendrierPnL({ dailyLog, journalMode = false, journalData = {}, onJournalSave = null, journalMonthLabel = null, newsSkipDays = 0, activeDays = [1,2,3,4,5], t = (k) => k, lang = "fr", realMode = false, accounts = null, accountLabel = null, activeAccountId = null, journalLocked = false, onJournalLocked = null }) {
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [editingDay, setEditingDay] = useState(null); // jour en cours d'édition (mode journal)
  const [formWins, setFormWins] = useState(0);
  const [formLosses, setFormLosses] = useState(0);
  const [formGainAbs, setFormGainAbs] = useState(""); // valeur absolue (toujours positive)
  const [formGainSign, setFormGainSign] = useState(1); // +1 ou -1
  const [formImages, setFormImages] = useState([]);
  // ── Drawdown max de la journée (saisi manuellement, optionnel — plus précis que la reconstitution depuis la clôture) ──
  const [formIntradayDD, setFormIntradayDD] = useState("");
  // ── Compte de trading associé à ce jour (multi-comptes, calendrier unique) ──
  const [formAccountId, setFormAccountId] = useState(null);
  // ── Coach de Discipline : signaux comportementaux saisis par le trader ──
  const [formRespectPlan, setFormRespectPlan] = useState(true);
  const [formRespectRisk, setFormRespectRisk] = useState(true);
  const [formLotIncreaseAfterLoss, setFormLotIncreaseAfterLoss] = useState(false);
  const [formEmotionalTrading, setFormEmotionalTrading] = useState(false);
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

  // ── Vrai positionnement calendaire ──
  // Extrait année/mois via regex YYYY-MM présente dans journalMonthLabel (ou la prop moisStr des modes simulation/backtest)
  const calDateMatch = (journalMonthLabel || "").match(/(\d{4})-(\d{2})/);
  const calYear = calDateMatch ? parseInt(calDateMatch[1]) : new Date().getFullYear();
  const calMonth = calDateMatch ? parseInt(calDateMatch[2]) : new Date().getMonth() + 1;
  // Nombre réel de jours dans le mois (28/29/30/31)
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  // Jour de la semaine du 1er : 0=Sun..6=Sat → convertir en Lun=0..Dim=6
  const firstDowJS = new Date(calYear, calMonth - 1, 1).getDay(); // 0=Sun
  const firstDowMon = (firstDowJS + 6) % 7; // Lun=0, Mar=1, ..., Dim=6

  const buildCalendarGrid = () => {
    const grid = [];
    if (journalMode) {
      // Mode journal : grille calendaire réelle — le 1er tombe sur son vrai jour de la semaine.
      // Cellules vides avant le 1er (padding de début) + tous les jours du mois.
      for (let pad = 0; pad < firstDowMon; pad++) {
        grid.push({ dayNum: null, trading: false, data: null, isPadding: true });
      }
      for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const entry = journalData[String(dayNum)];
        grid.push({
          dayNum,
          trading: true,
          isWeekendDay: (() => {
            const dow = (firstDowMon + dayNum - 1) % 7; // 0=Lun..6=Dim
            return dow >= 5;
          })(),
          journalEntry: entry || null,
          data: entry ? { pnl: entry.pnl, wins: entry.wins, losses: entry.losses } : null,
        });
      }
      return grid;
    }
    // ── Mode backtest RÉEL : les vrais jours du fichier, avec positionnement calendaire ──
    if (realMode) {
      // Cellules de padding avant le 1er
      for (let pad = 0; pad < firstDowMon; pad++) {
        grid.push({ dayNum: null, trading: false, data: null, isPadding: true });
      }
      const hasDates = monthDays.some(d => d.hasRealDate);
      if (hasDates) {
        const dayMap = {};
        monthDays.forEach(d => { dayMap[d.dayOfMonth] = d; });
        for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
          const dow = (firstDowMon + dayNum - 1) % 7;
          const isWeekend = dow >= 5;
          const data = dayMap[dayNum];
          if (data) { grid.push({ dayNum, trading: true, data }); }
          else { grid.push({ dayNum, trading: false, data: null, isEmptyWeekday: !isWeekend }); }
        }
      } else {
        const eaDowsSeq = new Set((activeDays || [1,2,3,4,5]).map(d => d - 1));
        let tradingIdx = 0;
        for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
          const dow = (firstDowMon + dayNum - 1) % 7;
          const isActive = eaDowsSeq.has(dow);
          if (isActive && tradingIdx < monthDays.length) {
            grid.push({ dayNum, trading: true, data: monthDays[tradingIdx++] });
          } else {
            grid.push({ dayNum, trading: false, data: null, isEmptyWeekday: !eaDowsSeq.has(dow) });
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

    // Jours actifs EA (0=Lun..6=Dim), y compris Sa/Di si includeWeekend est actif
    // AVANT: filter(d => d <= 5) excluait les jours 6 et 7 (Sa=6, Di=7) même quand activés
    const eaDows = new Set((activeDays || [1,2,3,4,5]).map(d => d - 1)); // 0=Lun, 5=Sam, 6=Dim

    // Padding de début (jours vides avant le 1er)
    for (let pad = 0; pad < firstDowMon; pad++) {
      grid.push({ dayNum: null, trading: false, data: null, isPadding: true });
    }

    let tradingIdx = 0;
    // Le mois s'étend sur ceil((firstDowMon + daysInMonth) / 7) semaines
    const totalCells = firstDowMon + daysInMonth;
    const weeks = Math.ceil(totalCells / 7);
    for (let week = 0; week < weeks; week++) {
      const eaActiveArr = Array.from(eaDows);
      const skipCount = Math.min(newsSkipDays, eaActiveArr.length);
      const shuffled = [...eaActiveArr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(prng(selectedMonth * 1000 + week * 100 + i) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const skipDowsThisWeek = new Set(shuffled.slice(0, skipCount));

      for (let d = 0; d < 7; d++) {
        // dayNum réel = position dans le mois (1-based), en tenant compte du padding
        const cellIdx = week * 7 + d; // index dans la grille totale (padding inclu)
        const dayNum = cellIdx - firstDowMon + 1;
        if (dayNum < 1 || dayNum > daysInMonth) continue; // ne pas re-générer le padding
        const isWeekend = d >= 5;
        const isEaActive = eaDows.has(d);
        const isNewsSkip = skipDowsThisWeek.has(d);

        if (isWeekend && !isEaActive) {
          grid.push({ dayNum, trading: false, data: null, isEmptyWeekday: false });
        } else if (!isEaActive || isNewsSkip) {
          grid.push({ dayNum, trading: false, data: null, isEmptyWeekday: true });
        } else if (tradingIdx < monthDays.length) {
          grid.push({ dayNum, trading: true, data: monthDays[tradingIdx] });
          tradingIdx++;
        } else {
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
    <div className="card" style={{ padding: 16 }}>
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
          // Cellule de padding : vide invisible avant le 1er du mois
          if (cell.isPadding) {
            return <div key={`pad-${i}`} style={{ background: "transparent", border: "none", borderRadius: 8, padding: "5px 4px", minHeight: 52 }} />;
          }
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
                // Quota freemium : au-delà de 7 jours saisis, ajouter un NOUVEAU jour est Pro.
                // Modifier un jour déjà saisi reste toujours possible.
                if (!existing && journalLocked) { if (onJournalLocked) onJournalLocked(); return; }
                setEditingDay(cell.dayNum);
                setFormWins(existing ? existing.wins : 0);
                setFormLosses(existing ? existing.losses : 0);
                const existingPnl = existing ? existing.pnl : 0;
                setFormGainAbs(existingPnl !== 0 ? String(Math.abs(existingPnl)) : "");
                setFormGainSign(existingPnl < 0 ? -1 : 1);
                setFormImages(existing && existing.images ? existing.images : []);
                setFormRespectPlan(existing && existing.respectPlan !== undefined ? existing.respectPlan : true);
                setFormRespectRisk(existing && existing.respectRisk !== undefined ? existing.respectRisk : true);
                setFormLotIncreaseAfterLoss(existing ? !!existing.lotIncreaseAfterLoss : false);
                setFormEmotionalTrading(existing ? !!existing.emotionalTrading : false);
                setFormIntradayDD(existing && existing.intradayDD !== undefined && existing.intradayDD !== null ? String(existing.intradayDD) : "");
                setFormAccountId(activeAccountId || (accounts && accounts.length ? accounts[0].id : "default"));
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
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
                        <circle cx="9" cy="9" r="1.5" fill="rgba(255,255,255,0.5)"/>
                        <path d="M21 15l-5-5-4 4-3-3-6 6" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
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
                    onClick={() => { if (onJournalSave) onJournalSave(editingDay, null, formAccountId || "default"); setEditingDay(null); }}
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

              {/* ── Drawdown max de la journée (optionnel, saisi manuellement) ── */}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 5 }}>
                  {t("cal_intraday_dd_label")}
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  value={formIntradayDD}
                  onChange={e => setFormIntradayDD(e.target.value.replace(/-/g, ""))}
                  placeholder="0.0"
                  style={{
                    width: "100%", height: 42,
                    background: "rgba(255,255,255,0.04)",
                    border: "1.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: "0 14px",
                    color: "#fff",
                    fontSize: 15, fontWeight: 700,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{t("cal_intraday_dd_hint")}</div>
              </div>

              {/* Compte de trading associé à ce jour : déterminé automatiquement par le compte actif de la page (plus de sélecteur manuel ici, pour éviter qu'une saisie parte vers un autre compte que celui affiché) */}

              {/* ── Coach de Discipline : signaux comportementaux du jour ── */}
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 7 }}>
                  {t("disc_form_title")}
                </div>
                {[
                  [t("cal_respect_plan"), formRespectPlan, setFormRespectPlan, true],
                  [t("cal_respect_risk"), formRespectRisk, setFormRespectRisk, true],
                  [t("cal_lot_increase"), formLotIncreaseAfterLoss, setFormLotIncreaseAfterLoss, false],
                  [t("cal_emotional"), formEmotionalTrading, setFormEmotionalTrading, false],
                ].map(([label, val, setter, positiveIsTrue], i) => {
                  const isGood = positiveIsTrue ? val : !val;
                  return (
                    <div key={i} onClick={() => setter(v => !v)} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 10px", borderRadius: 10, marginBottom: 6, cursor: "pointer",
                      background: isGood ? "rgba(110,231,183,0.05)" : "rgba(239,68,68,0.06)",
                      border: "1px solid " + (isGood ? "rgba(110,231,183,0.15)" : "rgba(239,68,68,0.2)"),
                    }}>
                      <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.75)" }}>{label}</span>
                      <div style={{
                        width: 38, height: 22, borderRadius: 11, position: "relative", flexShrink: 0,
                        background: val ? "#6ee7b7" : "rgba(255,255,255,0.12)", transition: "all .2s",
                      }}>
                        <div style={{ position: "absolute", top: 2, left: val ? 18 : 2, width: 18, height: 18, borderRadius: 9, background: "#fff", transition: "all .2s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Captures MT4/MT5 — compact */}
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 7 }}>
                  {t("cal_screenshots")} ({formImages.length}/3)
                </div>
                {imgDateWarn && (
                  <div style={{ marginBottom: 7, padding: "8px 10px", borderRadius: 9, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", fontSize: 10, color: "#fbbf24", lineHeight: 1.4 }}>
                    {imgDateWarn}
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
                          alert(t("journal_img_error"));
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
                  const entry = { wins: formWins, losses: formLosses, pnl,
                    respectPlan: formRespectPlan, respectRisk: formRespectRisk,
                    lotIncreaseAfterLoss: formLotIncreaseAfterLoss, emotionalTrading: formEmotionalTrading };
                  if (formImages.length > 0) entry.images = formImages;
                  if (formIntradayDD !== "" && !isNaN(parseFloat(formIntradayDD))) entry.intradayDD = Math.abs(parseFloat(formIntradayDD));
                  if (onJournalSave) onJournalSave(editingDay, entry, formAccountId || "default");
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
  // Modèle freemium à quotas (pas de trial temporel) : on ne démarre plus de compte à rebours.
  // Gratuit à vie : profil + choix prop firm + 3 simulations (combinaisons firm+modèle) + 7 jours de journal.
  // Pro : Analyse, Mes Trades, Monte Carlo, simulations et journal illimités.
  return loadPremium();
}

// ── Quota simulations gratuites : 3 combinaisons firm+modèle distinctes ──
const FREE_SIM_LIMIT = 3;
const FREE_SIMS_KEY = "eapropfirm_free_sims";
function loadFreeSims() {
  try { return JSON.parse(localStorage.getItem(FREE_SIMS_KEY) || "[]"); } catch (e) { return []; }
}
// Retourne true si la simulation est autorisée (déjà connue ou quota dispo), false si quota atteint.
function consumeFreeSim(firmKey, modelKey) {
  const sig = firmKey + "|" + modelKey;
  const used = loadFreeSims();
  if (used.includes(sig)) return true;
  if (used.length >= FREE_SIM_LIMIT) return false;
  used.push(sig);
  try { localStorage.setItem(FREE_SIMS_KEY, JSON.stringify(used)); } catch (e) {}
  return true;
}
function freeSimsLeft() { return Math.max(0, FREE_SIM_LIMIT - loadFreeSims().length); }

// ── Quota journal gratuit : 7 jours distincts de saisie (dérivé des données, tous comptes/mois) ──
const FREE_JOURNAL_DAYS = 7;
function countJournalDays(journalAll) {
  let n = 0;
  Object.values(journalAll || {}).forEach(days => { n += Object.keys(days || {}).length; });
  return n;
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="8" width="18" height="13" rx="1" stroke="#6ee7b7" strokeWidth="1.6"/>
            <path d="M3 12h18M12 8v13" stroke="#6ee7b7" strokeWidth="1.6"/>
            <path d="M12 8c-1.5-3-5-3-5 0s3.5 0 5 0zM12 8c1.5-3 5-3 5 0s-3.5 0-5 0z" stroke="#6ee7b7" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
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
              { k: "beginner", icon: "beginner", title: t("ps_beginner"), desc: t("ps_beginner_desc") },
              { k: "experienced", icon: "disciplined", title: t("ps_experienced"), desc: t("ps_experienced_desc") },
              { k: "professional", icon: "professional", title: t("ps_professional"), desc: t("ps_professional_desc") },
            ].map(opt => (
              <button key={opt.k} onClick={() => { setLevel(opt.k); setDisplayMode(opt.k === "beginner" ? "simple" : "advanced"); }} style={{
                background: level === opt.k ? "rgba(110,231,183,0.08)" : "rgba(255,255,255,0.03)",
                border: "1.5px solid " + (level === opt.k ? "#6ee7b7" : "rgba(255,255,255,0.08)"),
                borderRadius: 16, padding: "16px 16px", cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{ flexShrink: 0 }}><LevelIcon level={opt.icon} color={level === opt.k ? "#6ee7b7" : "rgba(255,255,255,0.4)"} size={28} /></div>
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
          {step === 2 ? t("ps_start") : t("ps_continue") + " →"}
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
      "N'oublie pas de remplir ton journal de trading du jour"
    );
    saveNotifPref({ ...pref, lastFired: todayKey });
  }
}

// ══════════════════════════════════════════════════════════════════
// DASHBOARD (page d'accueil)
// ══════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════
// Construit les données de la courbe Équité (Journal réel vs Simulation)
// pour un mois donné — réutilisé par DashboardScreen ET JournalScreen.
// ══════════════════════════════════════════════════════════════════
function buildMonthlyEquityChart({ monthKey, journalAll, lastSim, capital, journalMode }) {
  const ls = lastSim || {};
  const cap = capital || ls.capital || 25000;
  const [y, m] = monthKey.split("-").map(Number);
  const isCurrentMonth = (() => {
    const n = new Date();
    return n.getFullYear() === y && (n.getMonth() + 1) === m;
  })();
  const lastDayOfMonth = new Date(y, m, 0).getDate();
  const upToDay = isCurrentMonth ? new Date().getDate() : lastDayOfMonth;

  const simDailyLog = ls.funded?.dailyLog || [];
  const simMonth1Days = simDailyLog.filter(d => d.month === 1);

  const journalMonthData = journalAll?.[monthKey] || {};
  const journalDays = Object.entries(journalMonthData)
    .map(([day, data]) => ({ day: parseInt(day), pnl: data?.pnl || 0 }))
    .sort((a, b) => a.day - b.day);
  const hasJournal = journalDays.length > 0;
  const hasSim = simMonth1Days.length > 0;

  const chartData = [];
  let simEquity = cap, journalEquity = cap;
  for (let day = 1; day <= upToDay; day++) {
    const simDay = simMonth1Days.find(d => d.dayOfMonth === day);
    if (simDay) simEquity = simDay.equity;
    const journalDay = journalDays.find(d => d.day === day);
    if (journalDay) journalEquity += journalDay.pnl;
    chartData.push({
      day,
      simEquity: hasSim ? simEquity : null,
      journalEquity: hasJournal ? journalEquity : null,
    });
  }

  const primaryIsJournal = journalMode && hasJournal;
  return { chartData, hasJournal, hasSim, primaryIsJournal, cap, todayDay: upToDay };
}

// ══════════════════════════════════════════════════════════════════
// Composant visuel — Carte "Équité" (Journal réel vs Simulation)
// Réplique exacte du graphique de la Home, réutilisée dans JournalScreen.
// ══════════════════════════════════════════════════════════════════
function EquityChartCard({ t, lang = "fr", monthKey, chartData, hasJournal, hasSim, primaryIsJournal, cap, todayDay, gradientSuffix = "" }) {
  const gradJournal = "grad-journal-eq" + gradientSuffix;
  const gradSim = "grad-sim-eq" + gradientSuffix;
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(110,231,183,0.10)", borderRadius: 20, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>Équité — {formatMonthLabel(monthKey, lang)}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
            {primaryIsJournal ? t("cal_journal_active") : t("cal_sim_active")} · J1 → J{todayDay}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {hasJournal && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {primaryIsJournal
                ? <div style={{ width: 14, height: 2, background: "#6ee7b7", borderRadius: 1 }} />
                : <svg width="14" height="3" viewBox="0 0 14 3"><line x1="0" y1="1.5" x2="14" y2="1.5" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 2" /></svg>}
              <span style={{ fontSize: 9, color: primaryIsJournal ? "#6ee7b7" : "rgba(255,255,255,0.4)", fontWeight: primaryIsJournal ? 700 : 400 }}>Journal</span>
            </div>
          )}
          {hasSim && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {!primaryIsJournal
                ? <div style={{ width: 14, height: 2, background: "#6ee7b7", borderRadius: 1 }} />
                : <svg width="14" height="3" viewBox="0 0 14 3"><line x1="0" y1="1.5" x2="14" y2="1.5" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 2" /></svg>}
              <span style={{ fontSize: 9, color: !primaryIsJournal ? "#6ee7b7" : "rgba(255,255,255,0.4)", fontWeight: !primaryIsJournal ? 700 : 400 }}>Simulation</span>
            </div>
          )}
        </div>
      </div>

      {(hasJournal || hasSim) ? (
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradJournal} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={gradSim} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "J" + v} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} domain={["auto", "auto"]} width={40} />
            <Tooltip
              labelFormatter={v => "Jour " + v}
              formatter={(v, name) => [fmt(v), name === "journalEquity" ? "Journal réel" : name === "simEquity" ? "Simulation" : name]}
              contentStyle={{ background: "rgba(10,12,22,0.97)", border: "1px solid rgba(110,231,183,0.15)", borderRadius: 12, fontSize: 11 }}
            />
            <ReferenceLine y={cap} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 2" />
            {primaryIsJournal && hasJournal && (
              <Area type="monotone" dataKey="journalEquity" stroke="#6ee7b7" strokeWidth={2.5} fill={`url(#${gradJournal})`} dot={false} name="journalEquity" connectNulls={true} />
            )}
            {primaryIsJournal && hasSim && (
              <Line type="monotone" dataKey="simEquity" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="simEquity" connectNulls={true} />
            )}
            {!primaryIsJournal && hasSim && (
              <Area type="monotone" dataKey="simEquity" stroke="#6ee7b7" strokeWidth={2.5} fill={`url(#${gradSim})`} dot={false} name="simEquity" connectNulls={true} />
            )}
            {!primaryIsJournal && hasJournal && (
              <Line type="monotone" dataKey="journalEquity" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="journalEquity" connectNulls={true} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)" }}>
          <div style={{ fontSize: 12 }}>{t("an_run_or_enter")}</div>
          <div style={{ fontSize: 10, marginTop: 4, color: "rgba(255,255,255,0.15)" }}>pour voir la courbe du mois</div>
        </div>
      )}
    </div>
  );
}

function DashboardScreen({ t, lang, user, profile, lastSim, goto, loadConfig, premiumAccess = true, daysLeft = 0, requirePremium = () => {} }) {
  setALLang(lang); // requis pour AL() — traduit les libellés d'événements économiques, etc.
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
  const { accounts: journalAccounts, accountLabel: journalAccountLabel } = useJournalAccounts();
  const activeJournalAccounts = journalAccounts.filter(a => !a.archived);
  // ── Compte du Journal sélectionné depuis le Dashboard — partagé entre la carte "Solde du compte" et le Calendrier PnL ci-dessous ──
  const [dashSelectedAccountId, setDashSelectedAccountId] = useState(() => {
    try {
      const saved = localStorage.getItem("eapropfirm_dash_selected_account");
      if (saved && journalAccounts.find(a => a.id === saved)) return saved;
    } catch (e) {}
    return (activeJournalAccounts[0] || journalAccounts[0])?.id || "default";
  });
  useEffect(() => {
    if (!activeJournalAccounts.find(a => a.id === dashSelectedAccountId)) {
      setDashSelectedAccountId((activeJournalAccounts[0] || journalAccounts[0])?.id || "default");
    }
  }, [journalAccounts]);
  const principalAccount = journalAccounts.find(a => a.id === dashSelectedAccountId) || activeJournalAccounts[0] || journalAccounts[0];
  const principalCapital = (principalAccount && principalAccount.capital) ? principalAccount.capital : (profile.capital || 25000);
  const journalMonthDataForSelectedAccount = filterJournalByAccount(journalAll, dashSelectedAccountId)[journalMonth] || {};


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
        fireNotification("Notifications activées", "Tu recevras un rappel chaque jour après " + (next.hour) + "h pour ton journal.");
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

  // ── Courbe equity journal : cumul mensuel depuis le capital de référence (compte sélectionné uniquement) ──
  // DOIT être après cap — utilise cap comme point de départ
  const journalAllForSelectedAccount = filterJournalByAccount(journalAll, dashSelectedAccountId);
  const journalEquityCurve = (() => {
    if (!journalAllForSelectedAccount || Object.keys(journalAllForSelectedAccount).length === 0) return null;
    const sortedMonths = Object.keys(journalAllForSelectedAccount).sort();
    if (sortedMonths.length === 0) return null;
    let equity = cap;
    return sortedMonths.map((monthKey, idx) => {
      const days = journalAllForSelectedAccount[monthKey] || {};
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

  // Source journal : mois courant, compte sélectionné uniquement
  const journalCurrentMonth = journalAllForSelectedAccount[currentMonthKey] || {};
  const journalCurrentDays = Object.entries(journalCurrentMonth)
    .map(([day, data]) => ({ day: parseInt(day), pnl: data?.pnl || 0, wins: data?.wins || 0, losses: data?.losses || 0 }))
    .sort((a, b) => a.day - b.day);
  const hasJournalCurrentMonth = journalCurrentDays.length > 0;

  // Construire les données du graphique mensuel :
  // - Mode simulation → courbe COMPLÈTE du mois M1 simulé (tous les jours, pas juste jusqu'à aujourd'hui)
  // - Mode journal → jusqu'à aujourd'hui (données réelles saisies)
  const todayDay = now.getDate();
  const lastSimDay = simMonth1Days.length > 0
    ? Math.max(...simMonth1Days.map(d => d.dayOfMonth))
    : todayDay;
  const chartEndDay = journalMode ? todayDay : Math.max(todayDay, lastSimDay);

  const monthlyChartData = (() => {
    const result = [];
    let simEquity = cap;
    let journalEquity = cap;

    for (let day = 1; day <= chartEndDay; day++) {
      // Simulation : trouver le jour correspondant (dayOfMonth)
      const simDay = simMonth1Days.find(d => d.dayOfMonth === day);
      if (simDay) simEquity = simDay.equity;

      // Journal : cumuler le PnL jusqu'à ce jour (uniquement jours réels)
      const journalDay = journalCurrentDays.find(d => d.day === day);
      if (journalDay) journalEquity += journalDay.pnl;

      result.push({
        day,
        simEquity: simMonth1Days.length > 0 ? simEquity : null,
        journalEquity: hasJournalCurrentMonth ? journalEquity : null,
        hasJournalEntry: !!journalDay,
        isFuture: day > todayDay, // pour distinguer projection vs données réelles si besoin
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
  // ── Bloc STATISTIQUES de la Home : basé sur le JOURNAL DE TRADING réel (pas la simulation), compte sélectionné ──
  const journalGlobalStats = journalAnalyze(journalAllForSelectedAccount);
  const allJournalDays = Object.values(journalAllForSelectedAccount || {}).flatMap(monthData => Object.values(monthData || {}));
  const journalWins = allJournalDays.reduce((s, d) => s + (d.wins || 0), 0);
  const journalLosses = allJournalDays.reduce((s, d) => s + (d.losses || 0), 0);
  const wins = journalWins;
  const losses = journalLosses;
  const totalTrades = wins + losses;
  const wr = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const rr = ls.rr || 2.0; // RR cible reste celui de la simulation (objectif visé), pas une donnée du journal
  const bestTrade = journalGlobalStats ? journalGlobalStats.bestDay : 0;
  const worstTrade = journalGlobalStats ? journalGlobalStats.worstDay : 0;
  const profitAmount = journalGlobalStats ? journalGlobalStats.totalPnl : 0;
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
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* Icône Profil — déplacée ici depuis la navbar */}
          <button onClick={() => goto("profile")} aria-label={t("nav_profile")} style={{width:38,height:38,borderRadius:10,background:"rgba(255,255,255,0.08)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="8" r="4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6"/>
              <path d="M3 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
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
      </div>

      {/* ══════════════════════════════════════════════════════════
          Prochains événements économiques — bandeau défilant en haut de page
      ══════════════════════════════════════════════════════════ */}
      {(() => {
        const upcoming = generateUpcomingEconEvents(new Date(), 6);
        if (!upcoming.length) return null;
        const now = new Date();
        const fmtDelay = (date) => {
          const diffH = (date - now) / 3600000;
          if (diffH < 24) return t("econ_today");
          return `${Math.floor(diffH / 24)}${t("econ_days")}`;
        };
        const Chip = ({ ev, i }) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
            padding: "5px 11px 5px 8px", borderRadius: 100,
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(255,255,255,0.07)",
            marginRight: 8,
          }}>
            <span style={{ fontSize: 12, lineHeight: 1, flexShrink: 0 }}>{ECON_FLAGS[ev.type] || "🌐"}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 500, whiteSpace: "nowrap" }}>{t('econ_' + ev.type.toLowerCase())}</span>
            <span style={{ fontSize: 9.5, color: "rgba(251,191,36,0.65)", fontWeight: 600, whiteSpace: "nowrap" }}>· {fmtDelay(ev.date)}</span>
          </div>
        );
        // Liste dupliquée pour un défilement en boucle continue (sans saut visible)
        return (
          <div style={{ marginBottom: 14, overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 12 }}>
            <style>{`
              @keyframes eapfp-econ-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
              .eapfp-econ-track { display: flex; width: max-content; animation: eapfp-econ-marquee 22s linear infinite; }
              .eapfp-econ-track:hover { animation-play-state: paused; }
            `}</style>
            <div className="eapfp-econ-track">
              {upcoming.map((ev, i) => <Chip ev={ev} i={i} key={"a"+i} />)}
              {upcoming.map((ev, i) => <Chip ev={ev} i={i} key={"b"+i} />)}
            </div>
          </div>
        );
      })()}

      {!hasData && (
        <div style={{margin:"16px",background:"rgba(110,231,183,0.05)",border:"1px solid rgba(110,231,183,0.15)",borderRadius:16,padding:"28px 20px",textAlign:"center"}}>
          <div style={{marginBottom:12, display:"flex", justifyContent:"center"}}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M5 19L19 5M19 5h-6M19 5v6" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>{t("dash_first_sim")}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:18}}>{t("dash_stats_appear")}</div>
          <button onClick={()=>goto("simulator")} style={{padding:"14px 28px",borderRadius:100,background:"#6ee7b7",color:"#000",fontSize:14,fontWeight:700,border:"none",cursor:"pointer"}}>{t("dash_start_now")}</button>
        </div>
      )}

      {hasData && (<>

      {/* ── Compteur simulations gratuites restantes (freemium, masqué si abonné) ── */}
      {!premiumAccess && (
        <button onClick={requirePremium} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 12, padding: "10px 14px", borderRadius: 14, cursor: "pointer",
          background: freeSimsLeft() > 0 ? "rgba(251,191,36,0.07)" : "rgba(239,68,68,0.09)",
          border: "1px solid " + (freeSimsLeft() > 0 ? "rgba(251,191,36,0.25)" : "rgba(239,68,68,0.3)"),
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15 }}>{freeSimsLeft() > 0 ? "⚡" : "🔒"}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: freeSimsLeft() > 0 ? "#fbbf24" : "#f87171" }}>
              {freeSimsLeft() > 0
                ? freeSimsLeft() + " " + (freeSimsLeft() > 1 ? t("dash_sims_left_plural") : t("dash_sims_left_singular"))
                : t("dash_sims_limit_reached")}
            </span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{t("dash_go_pro")} ›</span>
        </button>
      )}

      {/* ── SOLDE DU COMPTE — dynamique : compte principal du Journal si mode Journal actif, sinon Mois 1 de la simulation (même scope que le Calendrier PnL ci-dessous) ── */}
      {(() => {
        const simMonth1Sorted = [...simMonth1Days].sort((a, b) => a.dayOfMonth - b.dayOfMonth);
        const simSeries = simMonth1Sorted.length
          ? [{ x: 0, y: cap }, ...simMonth1Sorted.map((d, i) => ({ x: i + 1, y: d.equity }))]
          : [{ x: 0, y: cap }];
        const simBalance = simMonth1Sorted.length ? simMonth1Sorted[simMonth1Sorted.length - 1].equity : cap;
        const simAllTimePnl = simBalance - cap;
        const simChangePct = cap ? (simAllTimePnl / cap) * 100 : 0;

        // Mois calendaire RÉEL en cours (ex: "2026-07") — scope commun Journal/Simulateur
        const now = new Date();
        const realMonthKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");

        // Journal : courbe + chiffres restreints au MOIS EN COURS (cohérent avec le Simulateur "Mois 1")
        const principalData = journalMode
          ? computeCurrentMonthBalanceSeries(journalAll, principalAccount?.id || "default", principalCapital, realMonthKey)
          : null;

        // ── Courbe simulateur : vue GRANDE ÉCHELLE (tout le compte Funded, comme
        // le graphique M1→M11 de l'onglet Funded) au lieu du seul Mois 1. On voit
        // ainsi la croissance projetée sur toute la durée, avec un repère sur le
        // Mois 1 (= là où on en est réellement aujourd'hui dans ce parcours).
        const fundedData = ls.funded?.data || [];
        const fundedSeries = fundedData.length
          ? [{ x: 0, y: cap }, ...fundedData.map(d => ({ x: d.month, y: d.equity }))]
          : null;
        const simSeriesToUse = fundedSeries || simSeries;

        const dCapital = journalMode ? principalData.opening : cap;
        const dBalance = journalMode ? principalData.balance : simBalance;
        const dPnl = journalMode ? principalData.monthPnl : simAllTimePnl;
        const dPct = journalMode ? principalData.monthPct : simChangePct;
        const dSeries = journalMode ? principalData.series : simSeriesToUse;
        const dLabel = journalMode
          ? journalAccountLabel(principalAccount) + " · " + formatMonthLabel(realMonthKey, lang)
          : (firm.name + (fm?.name ? " · " + fm.name : "") + " · " + t("cal_month1")
              + (fundedSeries ? " sur " + fundedData.length + " mois" : ""));

        // ── Repère "où on en est" sur la courbe (subtil, même code couleur) ──
        // Simulateur : si la vue grande échelle (Funded) est disponible, le repère
        // marque le Mois 1 — le point réel où on se trouve aujourd'hui dans le
        // parcours, le reste de la courbe étant la projection à venir. Sinon
        // (challenge pas encore réussi, pas de Funded), repère = date de
        // génération de la simulation dans le Mois 1 seul.
        // Journal : la courbe avance jour par jour, le repère est la pointe (dernier jour saisi).
        let todayMarker = null;
        if (dSeries.length > 1) {
          if (journalMode) {
            if (principalData.hasEntries) todayMarker = dSeries[dSeries.length - 1];
          } else if (fundedSeries) {
            todayMarker = dSeries[1]; // index 1 = Mois 1 (index 0 = capital de départ)
          } else if (simMonth1Sorted.length) {
            const genDate = ls.ts ? new Date(ls.ts) : new Date();
            const genDayOfMonth = genDate.getDate();
            let matchIdx = simMonth1Sorted.findIndex(d => d.dayOfMonth === genDayOfMonth);
            if (matchIdx === -1) {
              for (let i = simMonth1Sorted.length - 1; i >= 0; i--) {
                if (simMonth1Sorted[i].dayOfMonth <= genDayOfMonth) { matchIdx = i; break; }
              }
              if (matchIdx === -1) matchIdx = simMonth1Sorted.length - 1;
            }
            todayMarker = dSeries[matchIdx + 1];
          }
        }

        return (
          <div data-coach="dash-balance" style={{
            marginBottom: "14px",
            background: "linear-gradient(135deg, rgba(110,231,183,0.09), rgba(110,231,183,0.015))",
            border: "1px solid rgba(110,231,183,0.2)", borderRadius: 20, padding: "18px 18px 8px",
            position: "relative", overflow: "hidden",
          }}>
            <style>{`@keyframes eapfp-livepulse { 0% { box-shadow: 0 0 0 0 rgba(110,231,183,0.55); } 70% { box-shadow: 0 0 0 5px rgba(110,231,183,0); } 100% { box-shadow: 0 0 0 0 rgba(110,231,183,0); } }`}</style>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 0.7 }}>
                {journalMode ? t("acc_balance_title") : t("sim_my_simulation")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: 3, background: "#6ee7b7",
                  animation: "eapfp-livepulse 1.8s ease-out infinite",
                }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(110,231,183,0.7)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {t("acc_live")}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{dLabel}</div>

            <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: -0.5, lineHeight: 1 }}>
              {fmt(dBalance)}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7, flexWrap: "wrap" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 100,
                background: dPnl >= 0 ? "rgba(110,231,183,0.12)" : "rgba(239,68,68,0.12)",
                color: dPnl >= 0 ? "#6ee7b7" : "#ef4444", fontSize: 11, fontWeight: 700,
              }}>
                <span>{dPnl >= 0 ? "▲" : "▼"}</span>
                <span>{dPnl >= 0 ? "+" : ""}{fmt(dPnl)} ({dPnl >= 0 ? "+" : ""}{dPct.toFixed(1)}%)</span>
              </div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)" }}>
                {t("acc_initial_capital")} {fmt(dCapital)}
              </div>
            </div>

            {dSeries.length > 2 && (
              <div style={{ height: 46, marginTop: 10, marginLeft: -18, marginRight: -18 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dSeries} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="eapfp-dash-balance-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={dPnl >= 0 ? "#6ee7b7" : "#ef4444"} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={dPnl >= 0 ? "#6ee7b7" : "#ef4444"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="y" stroke={dPnl >= 0 ? "#6ee7b7" : "#ef4444"} strokeWidth={1.8} fill="url(#eapfp-dash-balance-grad)" isAnimationActive={false} />
                    {todayMarker && (
                      <ReferenceDot
                        x={todayMarker.x} y={todayMarker.y}
                        r={3.5}
                        fill={dPnl >= 0 ? "#6ee7b7" : "#ef4444"}
                        stroke="#0a0e14"
                        strokeWidth={1.5}
                        isFront={true}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── CALENDRIER PNL / JOURNAL DE TRADING ── */}
      <div style={{marginBottom:"14px"}}>
        {/* Toggle mode journal */}
        <div data-coach="dash-toggle" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 2px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
            {journalMode ? t("cal_journal_title") : t("cal_title")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: journalMode ? "#6ee7b7" : "rgba(255,255,255,0.4)", fontWeight: 600 }}>
              {t("cal_journal_mode")}
              
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
              {Object.keys(journalMonthDataForSelectedAccount).length} {t("cal_days_entered")}
            </span>
          </div>
        )}

        {/* Le calendrier : mode journal OU mode simulation */}
        {journalMode ? (
          <div data-coach="dash-calendar" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,overflow:"hidden"}}>
            <CalendrierPnL t={t} lang={lang}
              dailyLog={[]}
              journalMode={true}
              journalData={journalMonthDataForSelectedAccount}
              onJournalSave={saveJournalEntry}
              journalMonthLabel={t("cal_click_day") + " · " + journalMonth}
              accounts={activeJournalAccounts}
              accountLabel={journalAccountLabel}
              activeAccountId={dashSelectedAccountId}
              journalLocked={!premiumAccess && countJournalDays(journalAll) >= FREE_JOURNAL_DAYS}
              onJournalLocked={requirePremium}
            />
          </div>
        ) : ls.funded ? (
          <div data-coach="dash-calendar" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,overflow:"hidden"}}>
            {/* Copie exacte du CalendrierPnL de la page Funded */}
            <CalendrierPnL t={t} lang={lang} dailyLog={ls.funded.dailyLog}
              newsSkipDays={ls.newsSkipDays || 0}
              activeDays={ls.activeDays || [1,2,3,4,5]}
              journalMonthLabel={currentMonthKey}
            />
          </div>
        ) : (
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(110,231,183,0.10)",borderRadius:20,padding:16,textAlign:"center",color:"rgba(255,255,255,0.35)",fontSize:13}}>
            {t("dash_launch_sim_or_journal")}
          </div>
        )}

        {/* ── Sélecteur de compte du Journal — sous le calendrier, visible en mode journal ── */}
        {journalMode && activeJournalAccounts.length > 0 && (
          <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2, marginTop: 12, WebkitOverflowScrolling: "touch" }}>
            {activeJournalAccounts.map(acc => {
              const isSelected = acc.id === dashSelectedAccountId;
              return (
                <button key={acc.id}
                  onClick={() => {
                    setDashSelectedAccountId(acc.id);
                    try { localStorage.setItem("eapropfirm_dash_selected_account", acc.id); } catch (e) {}
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                    padding: "6px 12px", borderRadius: 100, cursor: "pointer",
                    background: isSelected ? acc.color + "22" : "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${isSelected ? acc.color : "rgba(255,255,255,0.1)"}`,
                    opacity: isSelected ? 1 : 0.55,
                  }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: acc.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}>{journalAccountLabel(acc)}</span>
                </button>
              );
            })}
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
              {monthlyPrimaryIsJournal ? t("cal_journal_active") : t("cal_sim_active")} · J1 → J{todayDay}
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
               v: bestTrade > 0 ? "+"+fmtMoney(bestTrade) : bestTrade < 0 ? "-"+fmtMoney(Math.abs(bestTrade)) : "$0",
               c: bestTrade >= 0 ? "#6ee7b7" : "#f87171"},
              {l:t("an_worst_day"),
               v: worstTrade < 0 ? "-"+fmtMoney(Math.abs(worstTrade)) : worstTrade > 0 ? "+"+fmtMoney(worstTrade) : "$0",
               c: worstTrade <= 0 ? "#f87171" : "#6ee7b7"},
              {l:t("dash_journal_pnl"),
               v: profitAmount >= 0 ? "+"+fmtMoney(profitAmount) : "-"+fmtMoney(Math.abs(profitAmount)),
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

function ProfileScreen({ t, lang, setLang, user, profile, setProfile, onLogout, onReset, onDeleteAccount = () => {}, premium = {}, daysLeft = 0, onUpgrade = () => {} }) {
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
                ? (premium.plan === "life" ? (lang === "en" ? "Lifetime" : "Lifetime · accès à vie") : premium.plan === "year" ? "79,99 €/an" : "9,99 €/mois")
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
      <button onClick={() => { if (confirm(t("prof_reset_confirm"))) onReset(); }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
        {t("prof_reset")}
      </button>
      {/* Suppression DÉFINITIVE du compte (RGPD) — double confirmation, réservé aux comptes Firebase (pas invité) */}
      {user && user.uid && (
        <button onClick={onDeleteAccount} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.45)", cursor: "pointer", background: "rgba(239,68,68,0.16)", color: "#ef4444", fontSize: 14, fontWeight: 800 }}>
          {t("prof_delete_account")}
        </button>
      )}

      {/* ── TEST INTERNE — Proxy Twelve Data (données historiques réelles) ──
          Panneau temporaire de validation du pipeline avant intégration au
          Laboratoire. À retirer une fois le vrai module de backtest branché. */}
      <TwelveDataTestPanel />
    </div>
  );
}

function TwelveDataTestPanel() {
  const [symbol, setSymbol] = useState("EUR/USD");
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [result, setResult] = useState(null);

  const runTest = async () => {
    setStatus("loading"); setResult(null);
    try {
      const r = await fetch(`/api/twelvedata?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=10`);
      const data = await r.json();
      if (!r.ok || data.error) { setStatus("error"); setResult(data); return; }
      setStatus("ok"); setResult(data);
    } catch (e) {
      setStatus("error"); setResult({ error: "Requête échouée côté client", detail: String(e) });
    }
  };

  const candles = result?.values || [];

  return (
    <div style={{ marginTop: 24, padding: 14, borderRadius: 14, border: "1px dashed rgba(251,191,36,0.35)", background: "rgba(251,191,36,0.04)" }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#fbbf24", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
        🧪 Test interne · Proxy données historiques
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <select value={symbol} onChange={e => setSymbol(e.target.value)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", padding: "8px 10px", fontSize: 12 }}>
          <option value="EUR/USD">EUR/USD</option>
          <option value="XAU/USD">XAU/USD (Or)</option>
          <option value="GBP/USD">GBP/USD</option>
          <option value="USD/JPY">USD/JPY</option>
        </select>
        <button onClick={runTest} disabled={status === "loading"} style={{
          padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer",
          background: status === "loading" ? "rgba(255,255,255,0.1)" : "#fbbf24",
          color: status === "loading" ? "rgba(255,255,255,0.4)" : "#000", fontSize: 12, fontWeight: 800,
        }}>
          {status === "loading" ? "..." : "Tester"}
        </button>
      </div>

      {status === "ok" && candles.length > 0 && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
          <div style={{ color: "#6ee7b7", fontWeight: 700, marginBottom: 4 }}>✓ {candles.length} bougies reçues</div>
          <div>Dernière : {candles[0].datetime} · clôture {candles[0].close}</div>
          <div>Plus ancienne : {candles[candles.length - 1].datetime} · clôture {candles[candles.length - 1].close}</div>
        </div>
      )}
      {status === "error" && (
        <div style={{ fontSize: 11, color: "#ef4444", lineHeight: 1.6, wordBreak: "break-word" }}>
          ✕ {result?.error || "Erreur inconnue"}
          {result?.fix && <div style={{ color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{result.fix}</div>}
          {result?.detail?.message && <div style={{ color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{result.detail.message}</div>}
        </div>
      )}
      {status === "idle" && (
        <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)" }}>
          Vérifie que la clé Twelve Data (TWELVE_DATA_API_KEY) est configurée sur Vercel, puis clique Tester.
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Filtre la structure du journal pour ne garder que les entrées d'un
// compte donné, et retourne la vue "plate" { mois: { jour: entry } }
// attendue par CalendrierPnL/journalAnalyze/etc.
//
// Stockage réel (depuis le fix du 26/06) : { mois: { jour: { accountId: entry } } }
// — chaque jour peut contenir une entrée DISTINCTE par compte, pour
// éviter qu'un compte écrase les données d'un autre au même jour.
//
// Rétro-compatibilité : si une entrée de jour est encore à l'ANCIEN
// format (mois: { jour: entry } directement, détecté par la présence
// d'un champ .pnl au niveau du jour), elle est traitée comme une
// entrée unique du compte "default".
// ══════════════════════════════════════════════════════════════════
function filterJournalByAccount(journalData, accountId) {
  const out = {};
  Object.entries(journalData || {}).forEach(([month, days]) => {
    const filteredDays = {};
    Object.entries(days || {}).forEach(([day, dayData]) => {
      if (!dayData) return;
      if (dayData.pnl !== undefined) {
        // Ancien format : dayData EST l'entrée (jamais migré, cas limite)
        const entryAcc = dayData.accountId || "default";
        if (entryAcc === accountId) filteredDays[day] = dayData;
      } else {
        // Nouveau format : dayData = { accountId: entry, ... }
        const entry = dayData[accountId];
        if (entry) filteredDays[day] = entry;
      }
    });
    if (Object.keys(filteredDays).length) out[month] = filteredDays;
  });
  return out;
}

// ══════════════════════════════════════════════════════════════════
// Calcule le solde d'un compte (capital + PnL cumulé jour par jour sur
// TOUT son historique) et la série équivalente pour un sparkline.
// Réutilisé par la carte "Solde du compte" du Journal ET par la carte
// "compte principal" du Dashboard quand le mode Journal est actif.
// ══════════════════════════════════════════════════════════════════
function computeAccountBalanceSeries(journalAllData, accountId, baseCapital) {
  const filtered = filterJournalByAccount(journalAllData, accountId);
  const months = Object.keys(filtered).sort();
  let running = baseCapital;
  const series = [{ x: 0, y: running }];
  months.forEach(mk => {
    const daysSorted = Object.keys(filtered[mk]).map(Number).sort((a, b) => a - b);
    daysSorted.forEach(d => {
      running += (filtered[mk][String(d)].pnl || 0);
      series.push({ x: series.length, y: running });
    });
  });
  const allTimePnl = running - baseCapital;
  const changePct = baseCapital ? (allTimePnl / baseCapital) * 100 : 0;
  return { balance: running, series, allTimePnl, changePct };
}

// ══════════════════════════════════════════════════════════════════
// Version SCOPÉE AU MOIS EN COURS de computeAccountBalanceSeries.
// Utilisée uniquement par la carte "Solde" du Dashboard (accueil) pour
// que la courbe (et les chiffres associés) reflètent le mois calendaire
// réel en cours — cohérent avec le Simulateur qui affiche "Mois 1".
// Le solde d'ouverture du mois = capital + somme de tous les PnL des
// mois précédents (donc le solde/pourcentage affichés restent exacts,
// juste recentrés sur "ce mois-ci" au lieu du cumul depuis toujours).
// ══════════════════════════════════════════════════════════════════
function computeCurrentMonthBalanceSeries(journalAllData, accountId, baseCapital, monthKey) {
  const filtered = filterJournalByAccount(journalAllData, accountId);
  const priorMonths = Object.keys(filtered).sort().filter(mk => mk < monthKey);
  let opening = baseCapital;
  priorMonths.forEach(mk => {
    Object.values(filtered[mk] || {}).forEach(entry => { opening += (entry.pnl || 0); });
  });
  const daysSorted = Object.keys(filtered[monthKey] || {}).map(Number).sort((a, b) => a - b);
  let running = opening;
  const series = [{ x: 0, y: running }];
  daysSorted.forEach(d => {
    running += (filtered[monthKey][String(d)].pnl || 0);
    series.push({ x: series.length, y: running });
  });
  const monthPnl = running - opening;
  const monthPct = opening ? (monthPnl / opening) * 100 : 0;
  return { balance: running, series, monthPnl, monthPct, opening, hasEntries: daysSorted.length > 0 };
}

// ══════════════════════════════════════════════════════════════════
// NAVBAR (bas d'écran)
// ══════════════════════════════════════════════════════════════════
function JournalScreen({ t, lang, goto, capital = 25000, lastSim = null, premiumAccess = true, requirePremium = () => {} }) {
  const { journal: journalAll, journalMonth, setJournalMonth, saveJournalEntry, purgeAccountEntries, monthData: journalMonthData } = useJournal();
  const { accounts, addAccount, removeAccount, updateAccount, archiveAccount, accountLabel } = useJournalAccounts();
  // Quota freemium journal : 7 jours distincts de saisie (tous comptes et mois confondus)
  const journalQuotaReached = !premiumAccess && countJournalDays(journalAll) >= FREE_JOURNAL_DAYS;
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [showArchivedList, setShowArchivedList] = useState(false);

  // ── Compte actif du Journal — chaque compte = une session de journal totalement indépendante ──
  const activeAccounts = accounts.filter(a => !a.archived);
  const archivedAccounts = accounts.filter(a => a.archived);
  const [selectedAccountId, setSelectedAccountId] = useState(() => (activeAccounts[0] || accounts[0])?.id || "default");
  useEffect(() => {
    // Si le compte sélectionné a été supprimé/archivé entre deux rendus, retomber sur le premier compte actif disponible
    if (!activeAccounts.find(a => a.id === selectedAccountId)) {
      setSelectedAccountId((activeAccounts[0] || accounts[0])?.id || "default");
    }
  }, [accounts]);
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || activeAccounts[0] || accounts[0];

  // ── Données du journal filtrées sur le SEUL compte sélectionné (isolation réelle entre comptes) ──
  const journalAllFiltered = filterJournalByAccount(journalAll, selectedAccountId);
  const journalMonthDataFiltered = journalAllFiltered[journalMonth] || {};
  // Capital propre au compte (si défini), sinon capital global du profil par défaut
  const effectiveCapital = (selectedAccount && selectedAccount.capital) ? selectedAccount.capital : capital;

  // ── Solde du compte — capital + PnL cumulé sur TOUT l'historique du compte (tous mois confondus) ──
  const { balance: runningBalance, series: accountEquitySeries, allTimePnl: accountAllTimePnl, changePct: accountChangePct } =
    computeAccountBalanceSeries(journalAll, selectedAccountId, effectiveCapital);

  const journalStats = journalAnalyze(journalAllFiltered);
  const discipline = disciplineAnalyze(journalAllFiltered);
  const journalHeatmap = heatmapAnalyzeJournal(journalAllFiltered);

  const shiftMonth = (delta) => {
    const [y, m] = journalMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setJournalMonth(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  };

  // Stats rapides du mois courant (compte sélectionné uniquement)
  const daysArr = Object.values(journalMonthDataFiltered || {});
  const monthPnl = daysArr.reduce((s, d) => s + (d.pnl || 0), 0);
  const winDays = daysArr.filter(d => (d.pnl || 0) > 0).length;
  const lossDays = daysArr.filter(d => (d.pnl || 0) < 0).length;
  const totalTradesMonth = daysArr.reduce((s, d) => s + (d.wins || 0) + (d.losses || 0), 0);
  const bestDay = daysArr.length ? Math.max(...daysArr.map(d => d.pnl || 0)) : 0;
  const worstDay = daysArr.length ? Math.min(...daysArr.map(d => d.pnl || 0)) : 0;
  // ── DD max du mois : priorité aux valeurs saisies manuellement (intradayDD), sinon reconstitué depuis la courbe d'équité ──
  const intradayDDValues = daysArr.map(d => d.intradayDD).filter(v => v !== undefined && v !== null && !isNaN(v));
  const maxIntradayDDOfMonth = intradayDDValues.length ? Math.max(...intradayDDValues) : null;

  // ── Courbe Équité du mois affiché (Journal réel vs Simulation) — copie de la Home ──
  const equityData = buildMonthlyEquityChart({
    monthKey: journalMonth, journalAll: journalAllFiltered, lastSim, capital: effectiveCapital, journalMode: true,
  });

  // ── Actions sur le compte sélectionné ──
  const handleDeleteAccount = () => {
    if (!selectedAccount) return;
    if (!confirm(t("acc_delete_confirm"))) return;
    purgeAccountEntries(selectedAccount.id);
    removeAccount(selectedAccount.id);
  };
  const handleArchiveAccount = () => {
    if (!selectedAccount) return;
    archiveAccount(selectedAccount.id, true);
  };

  return (
    <div style={{ fontFamily: "-apple-system, sans-serif", color: "#fff", marginTop: "-16px", marginLeft: "-16px", marginRight: "-16px" }}>
      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{t("journal_title")}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{t("journal_subtitle")}</div>
        </div>
      </div>

      <div style={{ padding: "14px 16px 100px" }}>
        {/* ══════════════════════════════════════════════════════════
            MES COMPTES — chaque compte est une session de journal
            totalement isolée (entrées, stats, capital indépendants)
        ══════════════════════════════════════════════════════════ */}
        <div data-coach="journal-accounts" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>
            {t("acc_my_accounts")}
          </div>
          <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2, WebkitOverflowScrolling: "touch" }}>
            {activeAccounts.map(acc => {
              const isSelected = acc.id === selectedAccountId;
              return (
                <button key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                    padding: "6px 12px", borderRadius: 100, cursor: "pointer",
                    background: isSelected ? acc.color + "22" : "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${isSelected ? acc.color : "rgba(255,255,255,0.1)"}`,
                    opacity: isSelected ? 1 : 0.55,
                  }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: acc.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}>{accountLabel(acc)}</span>
                </button>
              );
            })}
            <button
              onClick={() => setShowAddAccount(true)}
              style={{
                display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                padding: "6px 12px", borderRadius: 100,
                background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600,
                cursor: "pointer",
              }}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>+</span> {t("acc_add")}
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SOLDE DU COMPTE — capital + évolution cumulée en temps réel
        ══════════════════════════════════════════════════════════ */}
        <div style={{
          background: "linear-gradient(135deg, rgba(110,231,183,0.09), rgba(110,231,183,0.015))",
          border: "1px solid rgba(110,231,183,0.2)", borderRadius: 18, padding: "18px 18px 8px", marginBottom: 16,
          position: "relative", overflow: "hidden",
        }}>
          <style>{`@keyframes eapfp-livepulse { 0% { box-shadow: 0 0 0 0 rgba(110,231,183,0.55); } 70% { box-shadow: 0 0 0 5px rgba(110,231,183,0); } 100% { box-shadow: 0 0 0 0 rgba(110,231,183,0); } }`}</style>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 0.7 }}>
              {t("acc_balance_title")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 6, height: 6, borderRadius: 3, background: "#6ee7b7",
                boxShadow: "0 0 0 0 rgba(110,231,183,0.6)", animation: "eapfp-livepulse 1.8s ease-out infinite",
              }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(110,231,183,0.7)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {t("acc_live")}
              </span>
            </div>
          </div>

          <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: -0.5, lineHeight: 1 }}>
            {fmt(runningBalance)}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 100,
              background: accountAllTimePnl >= 0 ? "rgba(110,231,183,0.12)" : "rgba(239,68,68,0.12)",
              color: accountAllTimePnl >= 0 ? "#6ee7b7" : "#ef4444", fontSize: 11, fontWeight: 700,
            }}>
              <span>{accountAllTimePnl >= 0 ? "▲" : "▼"}</span>
              <span>{accountAllTimePnl >= 0 ? "+" : ""}{fmt(accountAllTimePnl)} ({accountAllTimePnl >= 0 ? "+" : ""}{accountChangePct.toFixed(1)}%)</span>
            </div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)" }}>
              {t("acc_initial_capital")} {fmt(effectiveCapital)}
            </div>
          </div>

          {accountEquitySeries.length > 2 && (
            <div style={{ height: 46, marginTop: 10, marginLeft: -18, marginRight: -18 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accountEquitySeries} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="eapfp-balance-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accountAllTimePnl >= 0 ? "#6ee7b7" : "#ef4444"} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={accountAllTimePnl >= 0 ? "#6ee7b7" : "#ef4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="y" stroke={accountAllTimePnl >= 0 ? "#6ee7b7" : "#ef4444"} strokeWidth={1.8} fill="url(#eapfp-balance-grad)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            COACH DE DISCIPLINE — score comportemental façon jeu vidéo
        ══════════════════════════════════════════════════════════ */}
        {!discipline ? (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(110,231,183,0.10)", borderRadius: 16, padding: "20px 14px", marginBottom: 16, textAlign: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 8, opacity: 0.3 }}>
              <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="1" fill="rgba(255,255,255,0.5)"/>
            </svg>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{t("disc_no_data")}</div>
          </div>
        ) : (() => {
          const levelLabel = discipline.level === "elite" ? t("disc_level_elite")
            : discipline.level === "professional" ? t("disc_level_professional")
            : discipline.level === "disciplined" ? t("disc_level_disciplined")
            : t("disc_level_beginner");
          const progressToNext = discipline.level === "elite" ? 100 : Math.min(100, (discipline.score / discipline.nextLevelScore) * 100);
          return (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(110,231,183,0.10)", borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{t("disc_title")}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{t("disc_subtitle")}</div>
                </div>
                {discipline.todayDelta && (
                  <div style={{ fontSize: 11, fontWeight: 800, color: discipline.todayDelta.delta >= 0 ? "#6ee7b7" : "#ef4444", padding: "3px 9px", borderRadius: 8, background: (discipline.todayDelta.delta >= 0 ? "#6ee7b7" : "#ef4444") + "15" }}>
                    {discipline.todayDelta.delta >= 0 ? "+" : ""}{discipline.todayDelta.delta}
                  </div>
                )}
              </div>

              {/* Score + niveau façon jeu vidéo */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
                    <circle cx="36" cy="36" r="30" fill="none" stroke={discipline.levelColor} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${2*Math.PI*30*(discipline.score/100)} ${2*Math.PI*30}`} transform="rotate(-90 36 36)" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 17, fontWeight: 800, color: discipline.levelColor }}>{discipline.score}</span>
                    <span style={{ fontSize: 7, color: "rgba(255,255,255,0.4)" }}>/100</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5 }}>{t("disc_score_label")}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: discipline.levelColor, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <LevelIcon level={discipline.levelIcon} color={discipline.levelColor} size={18} /> {levelLabel}
                  </div>
                  {/* Barre XP vers le prochain niveau */}
                  {discipline.level !== "elite" && (
                    <>
                      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: progressToNext + "%", background: discipline.levelColor, transition: "width .4s ease" }} />
                      </div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{t("disc_next_level")} {discipline.nextLevelScore}</div>
                    </>
                  )}
                </div>
              </div>

            </div>
          );
        })()}

        {/* Navigation mois + stats rapides — regroupées dans une carte standard */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(110,231,183,0.10)", borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <button onClick={() => shiftMonth(-1)} aria-label={t("journal_prev_month")} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "none", color: "#fff", cursor: "pointer" }}>‹</button>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7" }}>{formatMonthLabel(journalMonth, lang)}</div>
            <button onClick={() => shiftMonth(1)} aria-label={t("journal_next_month")} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "none", color: "#fff", cursor: "pointer" }}>›</button>
          </div>

          {(() => {
            const indicators = [
              [t("journal_total_pnl"), (monthPnl>=0?"+":"") + "$" + Math.abs(Math.round(monthPnl)), monthPnl>=0?"#6ee7b7":"#ef4444"],
              [t("journal_win_days"), winDays, "#6ee7b7"],
              [t("journal_loss_days"), lossDays, "#ef4444"],
              [t("journal_total_trades"), totalTradesMonth, "#a78bfa"],
              ...(maxIntradayDDOfMonth !== null ? [[t("journal_max_dd_today"), maxIntradayDDOfMonth.toFixed(1) + "%", "#fbbf24"]] : []),
            ];
            const cols = indicators.length;
            return (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 5 }}>
                {indicators.map(([label, val, color], i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 3px", textAlign: "center", minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color, whiteSpace: "nowrap" }}>{val}</div>
                    <div style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", marginTop: 2, lineHeight: 1.2 }}>{label}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Courbe Équité du mois — copie de la Home (Journal réel vs Simulation) */}
        <EquityChartCard
          t={t} lang={lang} monthKey={journalMonth}
          chartData={equityData.chartData} hasJournal={equityData.hasJournal} hasSim={equityData.hasSim}
          primaryIsJournal={equityData.primaryIsJournal} cap={equityData.cap} todayDay={equityData.todayDay}
          gradientSuffix="-journalpage"
        />

        {/* Calendrier en mode journal (saisie + visualisation) */}
        <div data-coach="journal-calendar" style={{ marginBottom: 16 }}>
          <CalendrierPnL t={t} lang={lang}
            dailyLog={[]}
            journalMode={true}
            journalData={journalMonthDataFiltered}
            onJournalSave={saveJournalEntry}
            journalMonthLabel={t("cal_click_day") + " · " + formatMonthLabel(journalMonth, lang)}
            accounts={activeAccounts}
            accountLabel={accountLabel}
            activeAccountId={selectedAccountId}
            journalLocked={journalQuotaReached}
            onJournalLocked={requirePremium}
          />
        </div>

        {!journalStats && (
          <div style={{ textAlign: "center", padding: "20px 10px", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
            {t("journal_no_data")}
          </div>
        )}

        {/* Forces / faiblesses (si données dispo) — réutilise journalAnalyze */}
        {journalStats && journalStats.bestDay !== undefined && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(110,231,183,0.10)", borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 10 }}>{t("journal_overview")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div style={{ background: "rgba(110,231,183,0.06)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{t("journal_best_day")}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7" }}>+${Math.abs(Math.round(journalStats.bestDay))}</div>
              </div>
              <div style={{ background: "rgba(239,68,68,0.06)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{t("journal_worst_day")}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>-${Math.abs(Math.round(journalStats.worstDay))}</div>
              </div>
              <div style={{ background: journalStats.tradeWR >= 50 ? "rgba(110,231,183,0.06)" : "rgba(239,68,68,0.06)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{t("dec_wr_metric")}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: journalStats.tradeWR >= 50 ? "#6ee7b7" : "#ef4444" }}>{journalStats.tradeWR.toFixed(0)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            HEATMAP DES ERREURS DE TRADING (variante journal)
        ══════════════════════════════════════════════════════════ */}
        <div style={{ marginTop: 14, marginBottom: 16 }}>
          <HeatmapReport heat={journalHeatmap} t={t} />
        </div>

        {/* ══════════════════════════════════════════════════════════
            GESTION DU COMPTE SÉLECTIONNÉ — Supprimer / Archiver / Modifier
        ══════════════════════════════════════════════════════════ */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span style={{ width: 7, height: 7, borderRadius: 4, background: selectedAccount?.color || "#6ee7b7", flexShrink: 0 }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
              {t("acc_manage_title")} : <span style={{ color: "#fff" }}>{accountLabel(selectedAccount)}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <button onClick={handleDeleteAccount} disabled={activeAccounts.length <= 1}
              style={{
                flex: 1, padding: "9px 6px", borderRadius: 10, cursor: activeAccounts.length <= 1 ? "default" : "pointer",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                color: activeAccounts.length <= 1 ? "rgba(239,68,68,0.3)" : "#f87171", fontSize: 11, fontWeight: 700,
              }}>
              {t("acc_delete")}
            </button>
            <button onClick={handleArchiveAccount} disabled={activeAccounts.length <= 1}
              style={{
                flex: 1, padding: "9px 6px", borderRadius: 10, cursor: activeAccounts.length <= 1 ? "default" : "pointer",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                color: activeAccounts.length <= 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700,
              }}>
              {t("acc_archive")}
            </button>
            <button onClick={() => setShowEditAccount(true)}
              style={{
                flex: 1, padding: "9px 6px", borderRadius: 10, cursor: "pointer",
                background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.25)",
                color: "#6ee7b7", fontSize: 11, fontWeight: 700,
              }}>
              {t("acc_edit")}
            </button>
          </div>

          {archivedAccounts.length > 0 && (
            <button onClick={() => setShowArchivedList(true)}
              style={{ marginTop: 10, background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 10.5, color: "rgba(255,255,255,0.35)", textDecoration: "underline" }}>
              {archivedAccounts.length} {t(archivedAccounts.length > 1 ? "acc_archived_plural" : "acc_archived_singular")}
            </button>
          )}
        </div>

      </div>

      {/* ── Modal Ajouter un compte ── */}
      {showAddAccount && (
        <AddAccountModal
          t={t}
          defaultCapital={capital}
          onClose={() => setShowAddAccount(false)}
          onCreate={(firmKey, customName, accCapital, accountType) => {
            const newId = addAccount(firmKey, customName, accCapital, accountType);
            setSelectedAccountId(newId);
            setShowAddAccount(false);
          }}
        />
      )}

      {/* ── Modal Modifier le compte sélectionné (capital / type / propfirm) ── */}
      {showEditAccount && selectedAccount && (
        <EditAccountModal
          t={t}
          account={selectedAccount}
          defaultCapital={capital}
          onClose={() => setShowEditAccount(false)}
          onSave={(patch) => { updateAccount(selectedAccount.id, patch); setShowEditAccount(false); }}
        />
      )}

      {/* ── Liste des comptes archivés (réactiver ou supprimer définitivement) ── */}
      {showArchivedList && (
        <ArchivedAccountsModal
          t={t}
          accounts={archivedAccounts}
          accountLabel={accountLabel}
          onClose={() => setShowArchivedList(false)}
          onRestore={(id) => archiveAccount(id, false)}
          onDeletePermanently={(id) => {
            if (!confirm(t("acc_delete_confirm"))) return;
            purgeAccountEntries(id);
            removeAccount(id);
          }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Modal de création d'un nouveau compte de trading (firme existante OU nom libre)
// ══════════════════════════════════════════════════════════════════
function AddAccountModal({ t, onClose, onCreate, defaultCapital = 25000 }) {
  const [selectedFirm, setSelectedFirm] = useState("");
  const [customName, setCustomName] = useState("");
  const [capitalInput, setCapitalInput] = useState(String(defaultCapital || ""));
  const [accountType, setAccountType] = useState(null);
  const firmList = Object.entries(PROP_FIRMS).map(([key, f]) => ({ key, name: f.name, color: f.color }));
  const typeOptions = [
    { key: "challenge", label: t("acc_type_challenge") },
    { key: "funded", label: t("acc_type_funded") },
    { key: "perso", label: t("acc_type_perso") },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", zIndex: 200 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 440, maxHeight: "85vh", background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "24px 20px", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 16 }}>{t("acc_add_title")}</div>

        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
          {t("acc_choose_firm")}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18 }}>
          {firmList.map(f => (
            <button
              key={f.key}
              onClick={() => { setSelectedFirm(f.key); setCustomName(""); }}
              style={{
                padding: "8px 13px", borderRadius: 100, cursor: "pointer",
                background: selectedFirm === f.key ? f.color + "22" : "rgba(255,255,255,0.04)",
                border: `1px solid ${selectedFirm === f.key ? f.color : "rgba(255,255,255,0.1)"}`,
                color: selectedFirm === f.key ? f.color : "rgba(255,255,255,0.6)",
                fontSize: 12, fontWeight: 600,
              }}>
              {f.name}
            </button>
          ))}
          <button
            onClick={() => setSelectedFirm("")}
            style={{
              padding: "8px 13px", borderRadius: 100, cursor: "pointer",
              background: !selectedFirm && !customName ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
              fontSize: 12, fontWeight: 600,
            }}>
            {t("acc_none_firm")}
          </button>
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
          {t("acc_or_custom")}
        </div>
        <input
          type="text"
          value={customName}
          onChange={e => { setCustomName(e.target.value); if (e.target.value) setSelectedFirm(""); }}
          placeholder={t("acc_custom_placeholder")}
          style={{
            width: "100%", height: 46, background: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12,
            padding: "0 14px", color: "#fff", fontSize: 14, outline: "none",
            boxSizing: "border-box", marginBottom: 18,
          }}
        />

        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
          {t("acc_capital")}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {CAPITAL_PRESETS.map(p => (
            <button key={p}
              onClick={() => setCapitalInput(String(p))}
              style={{
                padding: "6px 11px", borderRadius: 100, cursor: "pointer",
                background: parseFloat(capitalInput) === p ? "#6ee7b722" : "rgba(255,255,255,0.04)",
                border: `1px solid ${parseFloat(capitalInput) === p ? "#6ee7b7" : "rgba(255,255,255,0.1)"}`,
                color: parseFloat(capitalInput) === p ? "#6ee7b7" : "rgba(255,255,255,0.55)",
                fontSize: 11, fontWeight: 600,
              }}>
              {p >= 1000 ? (p / 1000) + "K" : p}$
            </button>
          ))}
        </div>
        <input
          type="number"
          inputMode="decimal"
          value={capitalInput}
          onChange={e => setCapitalInput(e.target.value)}
          placeholder="25000"
          style={{
            width: "100%", height: 46, background: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12,
            padding: "0 14px", color: "#fff", fontSize: 14, outline: "none",
            boxSizing: "border-box", marginBottom: 18,
          }}
        />

        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
          {t("acc_account_type")}
        </div>
        <div style={{ display: "flex", gap: 7, marginBottom: 22 }}>
          {typeOptions.map(opt => (
            <button key={opt.key}
              onClick={() => setAccountType(accountType === opt.key ? null : opt.key)}
              style={{
                flex: 1, padding: "9px 6px", borderRadius: 10, cursor: "pointer",
                background: accountType === opt.key ? "#6ee7b722" : "rgba(255,255,255,0.04)",
                border: `1px solid ${accountType === opt.key ? "#6ee7b7" : "rgba(255,255,255,0.1)"}`,
                color: accountType === opt.key ? "#6ee7b7" : "rgba(255,255,255,0.6)",
                fontSize: 11.5, fontWeight: 600,
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "13px", borderRadius: 13, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {t("acc_cancel")}
          </button>
          <button
            onClick={() => { if (selectedFirm || customName.trim()) onCreate(selectedFirm || null, customName.trim() || null, parseFloat(capitalInput) || null, accountType); }}
            disabled={!selectedFirm && !customName.trim()}
            style={{
              flex: 1, padding: "13px", borderRadius: 13, border: "none",
              background: (selectedFirm || customName.trim()) ? "linear-gradient(135deg,#6ee7b7,#34d399)" : "rgba(255,255,255,0.07)",
              color: (selectedFirm || customName.trim()) ? "#000" : "rgba(255,255,255,0.3)",
              fontSize: 13, fontWeight: 700, cursor: (selectedFirm || customName.trim()) ? "pointer" : "default",
            }}>
            {t("acc_create")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Modal de modification d'un compte existant — capital, type de
// compte, prop firm / nom. Pré-rempli avec les valeurs actuelles.
// ══════════════════════════════════════════════════════════════════
function EditAccountModal({ t, account, onClose, onSave, defaultCapital = 25000 }) {
  const [selectedFirm, setSelectedFirm] = useState(account.firmKey || "");
  const [customName, setCustomName] = useState(account.customName || "");
  const [capitalInput, setCapitalInput] = useState(String(account.capital || defaultCapital || ""));
  const [accountType, setAccountType] = useState(account.accountType || null);
  const firmList = Object.entries(PROP_FIRMS).map(([key, f]) => ({ key, name: f.name, color: f.color }));
  const typeOptions = [
    { key: "challenge", label: t("acc_type_challenge") },
    { key: "funded", label: t("acc_type_funded") },
    { key: "perso", label: t("acc_type_perso") },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", zIndex: 200 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 440, maxHeight: "85vh", background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "24px 20px", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 16 }}>{t("acc_edit_title")}</div>

        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
          {t("acc_choose_firm")}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18 }}>
          {firmList.map(f => (
            <button
              key={f.key}
              onClick={() => { setSelectedFirm(f.key); setCustomName(""); }}
              style={{
                padding: "8px 13px", borderRadius: 100, cursor: "pointer",
                background: selectedFirm === f.key ? f.color + "22" : "rgba(255,255,255,0.04)",
                border: `1px solid ${selectedFirm === f.key ? f.color : "rgba(255,255,255,0.1)"}`,
                color: selectedFirm === f.key ? f.color : "rgba(255,255,255,0.6)",
                fontSize: 12, fontWeight: 600,
              }}>
              {f.name}
            </button>
          ))}
          <button
            onClick={() => setSelectedFirm("")}
            style={{
              padding: "8px 13px", borderRadius: 100, cursor: "pointer",
              background: !selectedFirm && !customName ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
              fontSize: 12, fontWeight: 600,
            }}>
            {t("acc_none_firm")}
          </button>
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
          {t("acc_or_custom")}
        </div>
        <input
          type="text"
          value={customName}
          onChange={e => { setCustomName(e.target.value); if (e.target.value) setSelectedFirm(""); }}
          placeholder={t("acc_custom_placeholder")}
          style={{
            width: "100%", height: 46, background: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12,
            padding: "0 14px", color: "#fff", fontSize: 14, outline: "none",
            boxSizing: "border-box", marginBottom: 18,
          }}
        />

        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
          {t("acc_capital")}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {CAPITAL_PRESETS.map(p => (
            <button key={p}
              onClick={() => setCapitalInput(String(p))}
              style={{
                padding: "6px 11px", borderRadius: 100, cursor: "pointer",
                background: parseFloat(capitalInput) === p ? "#6ee7b722" : "rgba(255,255,255,0.04)",
                border: `1px solid ${parseFloat(capitalInput) === p ? "#6ee7b7" : "rgba(255,255,255,0.1)"}`,
                color: parseFloat(capitalInput) === p ? "#6ee7b7" : "rgba(255,255,255,0.55)",
                fontSize: 11, fontWeight: 600,
              }}>
              {p >= 1000 ? (p / 1000) + "K" : p}$
            </button>
          ))}
        </div>
        <input
          type="number"
          inputMode="decimal"
          value={capitalInput}
          onChange={e => setCapitalInput(e.target.value)}
          placeholder="25000"
          style={{
            width: "100%", height: 46, background: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12,
            padding: "0 14px", color: "#fff", fontSize: 14, outline: "none",
            boxSizing: "border-box", marginBottom: 18,
          }}
        />

        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
          {t("acc_account_type")}
        </div>
        <div style={{ display: "flex", gap: 7, marginBottom: 22 }}>
          {typeOptions.map(opt => (
            <button key={opt.key}
              onClick={() => setAccountType(accountType === opt.key ? null : opt.key)}
              style={{
                flex: 1, padding: "9px 6px", borderRadius: 10, cursor: "pointer",
                background: accountType === opt.key ? "#6ee7b722" : "rgba(255,255,255,0.04)",
                border: `1px solid ${accountType === opt.key ? "#6ee7b7" : "rgba(255,255,255,0.1)"}`,
                color: accountType === opt.key ? "#6ee7b7" : "rgba(255,255,255,0.6)",
                fontSize: 11.5, fontWeight: 600,
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "13px", borderRadius: 13, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {t("acc_cancel")}
          </button>
          <button
            onClick={() => onSave({
              firmKey: selectedFirm || null,
              customName: customName.trim() || null,
              capital: parseFloat(capitalInput) || null,
              accountType,
            })}
            style={{
              flex: 1, padding: "13px", borderRadius: 13, border: "none",
              background: "linear-gradient(135deg,#6ee7b7,#34d399)",
              color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
            {t("acc_save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Modal listant les comptes archivés — réactiver ou supprimer définitivement
// ══════════════════════════════════════════════════════════════════
function ArchivedAccountsModal({ t, accounts, accountLabel, onClose, onRestore, onDeletePermanently }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", zIndex: 200 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 440, maxHeight: "85vh", background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "24px 20px", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 16 }}>{t("acc_archived_title")}</div>
        {accounts.map(acc => (
          <div key={acc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: acc.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{accountLabel(acc)}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => onRestore(acc.id)} style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(110,231,183,0.1)", border: "1px solid rgba(110,231,183,0.3)", color: "#6ee7b7", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {t("acc_reactivate")}
              </button>
              <button onClick={() => onDeletePermanently(acc.id)} style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {t("acc_delete")}
              </button>
            </div>
          </div>
        ))}
        <button onClick={onClose} style={{ width: "100%", marginTop: 18, padding: "13px", borderRadius: 13, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          {t("acc_cancel")}
        </button>
      </div>
    </div>
  );
}

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
    { k:"journal", label:t("nav_journal"),
      icon:(on)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="4" y="2" width="14" height="18" rx="2" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.6"/>
        <path d="M8 7h6M8 10.5h6M8 14h4" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.4" strokeLinecap="round"/>
      </svg>},
    { k:"trades", label:t("nav_trades"),
      icon:(on)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="6" width="18" height="12" rx="3" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.6"/>
        <path d="M7 2h8" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M7 11h4M7 14.5h7" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.4" strokeLinecap="round"/>
      </svg>},
    { k:"coach", label:t("nav_analyse"),
      icon:(on)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="6" y="6" width="10" height="10" rx="1.5" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.5"/>
        <circle cx="8" cy="8" r="0.8" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="14" cy="8" r="0.8" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="8" cy="14" r="0.8" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <circle cx="14" cy="14" r="0.8" fill={on?"#6ee7b7":"rgba(255,255,255,0.4)"}/>
        <path d="M8 2v2M14 2v2M8 18v2M14 18v2M2 8h2M2 14h2M18 8h2M18 14h2" stroke={on?"#6ee7b7":"rgba(255,255,255,0.4)"} strokeWidth="1.4" strokeLinecap="round"/>
      </svg>},
  ];

  const navGoto=(k)=>{
    if(k==="trades"){goto("trades");}
    else if(k==="montecarlo"){goto("montecarlo");}
    else goto(k);
  };

  return (
    <div data-coach="nav-bar" style={{
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
// ══════════════════════════════════════════════════════════════════
// COACH MARKS — tutoriel premium par bulles contextuelles.
// Spotlight sur l'élément ciblé (data-coach="...") + bulle explicative.
// Skippable à tout moment, 1 seule fois par tour (persisté localStorage).
// ══════════════════════════════════════════════════════════════════
const COACH_KEY = "eapropfirm_coach_done";
function loadCoachDone() { try { return JSON.parse(localStorage.getItem(COACH_KEY) || "{}"); } catch (e) { return {}; } }
function markCoachDone(tourId) {
  const d = loadCoachDone(); d[tourId] = true;
  try { localStorage.setItem(COACH_KEY, JSON.stringify(d)); } catch (e) {}
}

const COACH_TOURS = {
  dashboard: [
    { target: "dash-balance",
      fr: ["Ton solde en direct", "Capital + P&L en temps réel. La courbe suit ta simulation ou ton journal selon le mode actif."],
      en: ["Your live balance", "Capital + P&L in real time. The curve follows your simulation or journal depending on the active mode."],
      es: ["Tu saldo en vivo", "Capital + P&L en tiempo real. La curva sigue tu simulación o tu diario según el modo activo."] },
    { target: "dash-toggle",
      fr: ["Simulation ou réel", "Bascule ici entre ta simulation et ton Journal de Trading réel."],
      en: ["Simulation or real", "Switch here between your simulation and your real Trading Journal."],
      es: ["Simulación o real", "Cambia aquí entre tu simulación y tu Diario de Trading real."] },
    { target: "dash-calendar",
      fr: ["Ton mois en un coup d'œil", "Chaque case = un jour. En mode journal, clique un jour pour saisir tes trades."],
      en: ["Your month at a glance", "Each cell = one day. In journal mode, tap a day to log your trades."],
      es: ["Tu mes de un vistazo", "Cada celda = un día. En modo diario, toca un día para registrar tus trades."] },
    { target: "nav-bar",
      fr: ["Tout est là", "Simulateur, Journal, Mes Trades et Analyse. Bonne route 🚀"],
      en: ["Everything is here", "Simulator, Journal, My Trades and Analysis. Enjoy 🚀"],
      es: ["Todo está aquí", "Simulador, Diario, Mis Trades y Análisis. Buen viaje 🚀"] },
  ],
  journal: [
    { target: "journal-accounts",
      fr: ["Tes comptes", "Crée plusieurs comptes — chaque journal est totalement isolé. Tape une pastille pour switcher."],
      en: ["Your accounts", "Create multiple accounts — each journal is fully isolated. Tap a pill to switch."],
      es: ["Tus cuentas", "Crea varias cuentas — cada diario está totalmente aislado. Toca una píldora para cambiar."] },
    { target: "journal-calendar",
      fr: ["Saisis tes journées", "Clique un jour pour enregistrer P&L, trades et discipline."],
      en: ["Log your days", "Tap a day to record P&L, trades and discipline."],
      es: ["Registra tus días", "Toca un día para registrar P&L, trades y disciplina."] },
  ],
  simulator: [
    { target: "sim-toggle",
      fr: ["3 modes de simulation", "Challenge, compte Funded et Monte Carlo — change de mode ici."],
      en: ["3 simulation modes", "Challenge, Funded account and Monte Carlo — switch modes here."],
      es: ["3 modos de simulación", "Challenge, cuenta Funded y Monte Carlo — cambia de modo aquí."] },
  ],
};

function CoachMarks({ tourId, lang = "fr", onDone }) {
  const steps = COACH_TOURS[tourId] || [];
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState(null);
  const skipLabel = lang === "en" ? "Skip" : lang === "es" ? "Omitir" : "Passer";
  const nextLabel = lang === "en" ? "Next" : lang === "es" ? "Siguiente" : "Suivant";
  const doneLabel = lang === "en" ? "Got it" : lang === "es" ? "Entendido" : "C'est parti";

  const finish = () => { markCoachDone(tourId); onDone(); };

  useEffect(() => {
    const step = steps[idx];
    if (!step) { finish(); return; }
    const el = document.querySelector('[data-coach="' + step.target + '"]');
    if (!el) {
      // Cible absente de l'écran actuel → sauter l'étape plutôt que bloquer
      if (idx < steps.length - 1) setIdx(idx + 1); else finish();
      return;
    }
    setRect(null); // fondu entre étapes
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const timer = setTimeout(() => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }, 380);
    return () => clearTimeout(timer);
  }, [idx]);

  if (!steps.length) return null;
  const step = steps[idx];
  const txt = step[lang] || step.fr;
  const isLast = idx === steps.length - 1;

  // Bulle au-dessus ou en dessous selon la place disponible
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const bubbleBelow = rect ? rect.top + rect.height / 2 < vh / 2 : true;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500 }} onClick={(e) => e.stopPropagation()}>
      <style>{"@keyframes eapfp-coach-in { from { opacity: 0; transform: translateY(6px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }"}</style>

      {/* Spotlight — masque sombre autour de l'élément ciblé */}
      {rect ? (
        <div style={{
          position: "fixed", top: rect.top - 6, left: rect.left - 6,
          width: rect.width + 12, height: rect.height + 12,
          borderRadius: 18, pointerEvents: "none",
          boxShadow: "0 0 0 9999px rgba(3,6,10,0.82)",
          border: "1.5px solid rgba(110,231,183,0.55)",
          transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
        }} />
      ) : (
        <div style={{ position: "fixed", inset: 0, background: "rgba(3,6,10,0.82)", pointerEvents: "none" }} />
      )}

      {/* Bulle */}
      {rect && (
        <div style={{
          position: "fixed",
          left: Math.max(14, Math.min(rect.left + rect.width / 2 - 140, (typeof window !== "undefined" ? window.innerWidth : 400) - 294)),
          top: bubbleBelow ? rect.top + rect.height + 16 : undefined,
          bottom: bubbleBelow ? undefined : vh - rect.top + 16,
          width: 280, zIndex: 501,
          background: "rgba(13,17,23,0.98)",
          border: "1px solid rgba(110,231,183,0.25)",
          borderRadius: 16, padding: "16px 16px 13px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
          animation: "eapfp-coach-in 0.35s cubic-bezier(0.22,1,0.36,1)",
          fontFamily: "-apple-system, sans-serif",
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 5 }}>{txt[0]}</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,0.6)", marginBottom: 13 }}>{txt[1]}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 5 }}>
              {steps.map((_, i) => (
                <span key={i} style={{
                  width: i === idx ? 16 : 5, height: 5, borderRadius: 3,
                  background: i === idx ? "#6ee7b7" : "rgba(255,255,255,0.2)",
                  transition: "all 0.25s",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {!isLast && (
                <button onClick={finish} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: "rgba(255,255,255,0.4)", fontWeight: 600, padding: 0 }}>
                  {skipLabel}
                </button>
              )}
              <button onClick={() => (isLast ? finish() : setIdx(idx + 1))} style={{
                padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,#6ee7b7,#34d399)", color: "#000",
                fontSize: 12, fontWeight: 800,
              }}>
                {isLast ? doneLabel : nextLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaywallScreen({ t, lang, daysLeft, onSubscribe, onClose, canClose = true }) {
  const [plan, setPlan] = useState("year"); // annuel mis en avant par défaut
  const simsLeft = freeSimsLeft();
  const expired = false; // freemium : jamais "expiré", quotas gratuits à vie

  const L = {
    fr: {
      badge: simsLeft > 0 ? "Version gratuite · " + simsLeft + " simulation" + (simsLeft > 1 ? "s" : "") + " restante" + (simsLeft > 1 ? "s" : "") : "Limite gratuite atteinte",
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
      lifeLabel: "Lifetime", lifePrice: "199,99 €", lifePer: "une fois",
      lifeBadge: "ACCÈS À VIE", lifeSub: "Payé une fois, à toi pour toujours",
      trust1: "Paiement 100 % sécurisé", trust2: "Annulation à tout moment", trust3: "Satisfait ou remboursé",
      cta: "Passer en Pro",
      stars: "Rejoint par des milliers de traders prop firm",
      restore: "Restaurer mes achats",
    },
    en: {
      badge: simsLeft > 0 ? "Free plan · " + simsLeft + " simulation" + (simsLeft > 1 ? "s" : "") + " left" : "Free limit reached",
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
      lifeLabel: "Lifetime", lifePrice: "$199.99", lifePer: "one-time",
      lifeBadge: "LIFETIME ACCESS", lifeSub: "Pay once, yours forever",
      trust1: "100% secure payment", trust2: "Cancel anytime", trust3: "Satisfied or refunded",
      cta: "Go Pro",
      stars: "Joined by thousands of prop firm traders",
      restore: "Restore purchases",
    },
    es: {
      badge: simsLeft > 0 ? "Plan gratis · " + simsLeft + " simulación" + (simsLeft > 1 ? "es" : "") + " restante" + (simsLeft > 1 ? "s" : "") : "Límite gratis alcanzado",
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
      lifeLabel: "Lifetime", lifePrice: "199,99 €", lifePer: "una vez",
      lifeBadge: "ACCESO DE POR VIDA", lifeSub: "Paga una vez, tuyo para siempre",
      trust1: "Pago 100% seguro", trust2: "Cancela cuando quieras", trust3: "Satisfecho o reembolsado",
      cta: "Pasar a Pro",
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
            <div style={{ position:"absolute", top:-9, right:12, background:"#6ee7b7", color:"#000", fontSize:8, fontWeight:800, padding:"2px 8px", borderRadius:6, letterSpacing:0.5 }}>{x.popular}</div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"rgba(110,231,183,0.12)", border:"1px solid rgba(110,231,183,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2l2 4h5l-4 3 1.5 4.5L9 11l-4.5 2.5L6 9 2 6h5L9 2z" fill="#6ee7b7" opacity="0.9"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:6 }}>
                  {x.yearLabel}
                  
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

          {/* Lifetime */}
          <div onClick={() => setPlan("life")} style={{
            position:"relative", borderRadius:14, padding:"10px 14px", cursor:"pointer",
            background: plan==="life" ? "rgba(251,191,36,0.07)" : "rgba(255,255,255,0.03)",
            border:"1.5px solid "+(plan==="life" ? "#fbbf24" : "rgba(255,255,255,0.10)"),
          }}>
            
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"rgba(251,191,36,0.10)", border:"1px solid rgba(251,191,36,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 6l3.5 3L9 3l3.5 6L16 6v7a1 1 0 01-1 1H3a1 1 0 01-1-1V6z" fill="rgba(251,191,36,0.85)"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{x.lifeLabel}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", marginTop:1 }}>{x.lifeSub}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>{x.lifePrice}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>{x.lifePer}</div>
                </div>
                <div style={{ width:26, height:26, borderRadius:13, background: plan==="life"?"#fbbf24":"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2l3.5 3-3.5 3" stroke={plan==="life"?"#000":"rgba(255,255,255,0.5)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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

  // ── Hors ligne : bannière discrète. L'app (journal, simulateur, laboratoire,
  // analyse) fonctionne intégralement en localStorage — seul le login initial
  // et la synchro cloud du profil nécessitent le réseau. ──
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => { window.removeEventListener("offline", goOffline); window.removeEventListener("online", goOnline); };
  }, []);

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
  // ── Coach marks : tour contextuel à la 1re visite de chaque écran (après l'onboarding) ──
  const [activeTour, setActiveTour] = useState(null);
  // Modèle freemium : premium = abonné uniquement (plus de trial temporel).
  // Les quotas gratuits (3 simulations, 7 jours de journal) gèrent la découverte du produit.
  const premiumAccess = !!premium.subscribed;
  const daysLeft = premium.subscribed ? Infinity : 0;
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
  useEffect(() => {
    if (!user || !onboardingPaywallDone || activeTour) return;
    const tourFor = screen === "dashboard" ? "dashboard" : screen === "journal" ? "journal" : screen === "simulator" ? "simulator" : null;
    if (tourFor && !loadCoachDone()[tourFor]) {
      const timer = setTimeout(() => setActiveTour(tourFor), 650); // laisser l'écran se rendre
      return () => clearTimeout(timer);
    }
  }, [screen, onboardingPaywallDone, user]);
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
  // Suppression DÉFINITIVE du compte : Firestore (users/{uid}) + compte Auth + purge locale.
  const handleDeleteAccount = async () => {
    const msg1 = lang === "en" ? "Permanently delete your account? All your cloud data will be erased. This cannot be undone."
      : lang === "es" ? "¿Eliminar definitivamente tu cuenta? Todos tus datos en la nube se borrarán. Irreversible."
      : "Supprimer définitivement ton compte ? Toutes tes données cloud seront effacées. Action irréversible.";
    const msg2 = lang === "en" ? "Last confirmation: type-free final check. Delete everything?"
      : lang === "es" ? "Última confirmación. ¿Borrar todo?"
      : "Dernière confirmation. Tout effacer ?";
    if (!confirm(msg1) || !confirm(msg2)) return;
    const res = await fbDeleteAccount();
    if (res.ok) {
      try { localStorage.clear(); } catch (e) {}
      window.location.reload();
    } else if (res.needsReauth) {
      alert(lang === "en" ? "For security, please log out, log back in, then retry deletion."
        : lang === "es" ? "Por seguridad, cierra sesión, vuelve a entrar y reintenta."
        : "Par sécurité, déconnecte-toi, reconnecte-toi, puis relance la suppression.");
    } else {
      alert((lang === "en" ? "Deletion failed: " : lang === "es" ? "Error al eliminar: " : "Échec de la suppression : ") + (res.error || ""));
    }
  };
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

  // Freemium : jamais de blocage total de l'app — les gates sont sur les features Pro et les quotas.

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
          <ProfileScreen t={t} lang={lang} setLang={setLang} user={user} profile={profile} setProfile={setProfile} onLogout={logout} onReset={reset} onDeleteAccount={handleDeleteAccount} premium={premium} daysLeft={daysLeft} onUpgrade={() => setShowPaywall(true)} />
        )}
        {screen === "journal" && (
          <JournalScreen t={t} lang={lang} goto={navGoto} capital={profile.capital || 25000} lastSim={lastSim} premiumAccess={premiumAccess} requirePremium={() => setShowPaywall(true)} />
        )}
      </div>
      {isOffline && (
        <div style={{
          position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 76, zIndex: 90,
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(251,191,36,0.14)", border: "1px solid rgba(251,191,36,0.35)",
          borderRadius: 100, padding: "6px 12px", backdropFilter: "blur(6px)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: "#fbbf24" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24" }}>
            {lang === "en" ? "Offline — your data stays local" : lang === "es" ? "Sin conexión — tus datos siguen locales" : "Hors ligne — tes données restent disponibles"}
          </span>
        </div>
      )}
      <NavBar t={t} active={navActive} goto={navGoto} />
      {activeTour && <CoachMarks tourId={activeTour} lang={lang} onDone={() => setActiveTour(null)} />}
    </div>
  );
}
