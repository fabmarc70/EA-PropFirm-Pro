import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from "recharts";

// MODELES FUNDEDNEXT - REGLES OFFICIELLES 2026 (Stellar)
const MODELS = {
  "2step": {
    name: "Stellar 2-Step",
    phases: [
      { label: "Phase 1", target: 0.08, minDays: 5 },
      { label: "Phase 2", target: 0.05, minDays: 5 },
    ],
    dailyDD: 0.05, totalDD: 0.10, challengeReward: 0.15, firstPayoutDays: 21,
  },
  "1step": {
    name: "Stellar 1-Step",
    phases: [{ label: "Phase unique", target: 0.10, minDays: 2 }],
    dailyDD: 0.03, totalDD: 0.06, challengeReward: 0.15, firstPayoutDays: 5,
  },
  "lite": {
    name: "Stellar Lite",
    phases: [
      { label: "Phase 1", target: 0.08, minDays: 5 },
      { label: "Phase 2", target: 0.04, minDays: 5 },
    ],
    dailyDD: 0.04, totalDD: 0.08, challengeReward: 0.15, firstPayoutDays: 21,
  },
};

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

export default function App() {
  const loadSaved = () => {
    try {
      const raw = localStorage.getItem("eapropfirm_config");
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  };
  const saved = loadSaved();

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
    goldstrom_v5s: {
      label: "v5 Safe",
      bt: { monthly: 3.11, dd: 3.7, sharpe: 4.05, pf: 2.12, trades: 143,
            wr: 47.6, rr: 2.12, tpd: 0.28, clustering: 40, maxConsec: 5,
            newsFilter: "FOMC CPI NFP PPI PCE - Blocage 30min avant / 60min apres",
            note: "Max 2 trades/jour | Max 1 entree/session | RR 2.8/1.8" },
      values: {
        winrate: 48, tradesPerDay: 0.28, dailyTargetPct: 0.15,
        riskPct: 0.2, clusteringPct: 40, maxConsecLosses: 5,
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
  const [tab, setTab] = useState("challenge");
  const [sim, setSim] = useState(null);
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    try {
      const configToSave = {
        modelKey, capital, riskPct: useFixedLot ? lotRiskPct : riskPct, dailyTargetPct, winrate,
        tradesPerDay, clusteringPct, maxConsecLosses, split, fundedMonths,
        instrument, lotSize, slPips, useFixedLot, newsImpact, activePreset
      };
      localStorage.setItem("eapropfirm_config", JSON.stringify(configToSave));
      setSaveStatus("Enregistre");
      const t = setTimeout(() => setSaveStatus(""), 1500);
      return () => clearTimeout(t);
    } catch (e) { /* localStorage indisponible (artefact) - ignore */ }
  }, [modelKey, capital, riskPct, dailyTargetPct, winrate, tradesPerDay, clusteringPct, maxConsecLosses, split, fundedMonths, instrument, lotSize, slPips, useFixedLot]);

  const model = MODELS[modelKey];
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
  }, [modelKey, capital, riskPct, dailyTargetPct, winrate, tradesPerDay, clusteringPct, maxConsecLosses, splitRate, fundedMonths, seed, useFixedLot, lotSize, slPips, instrument, newsImpact]);

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
    return { label: "COMPTE ACTIF", color: "#6ee7b7", bg: "#062318", emoji: "VERT" };
  };
  const gs = globalStatus();
  const dot = (e) => e === "VERT" ? "\u{1F7E2}" : e === "ORANGE" ? "\u{1F7E0}" : "\u{1F534}";

  const phaseIcon = (s) => {
    if (s === "passed") return { icon: "\u2713", color: "#6ee7b7", bg: "#062318", label: "PASSE" };
    if (s === "running_ok") return { icon: "~", color: "#fbbf24", bg: "#2d1f08", label: "EN COURS" };
    if (s && s.startsWith("failed")) return { icon: "\u2717", color: "#ef4444", bg: "#2d0808", label: "ECHOUE" };
    return { icon: "-", color: "#64748b", bg: "#111118", label: "N/A" };
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
      <div style={{ fontSize: 10, fontWeight: 800, color: "#f59e0b", marginBottom: 6, textTransform: "uppercase" }}>Diagnostic FundedNext</div>
      {_d.chks.map(([ok, l, v, e]) => (
        <div key={l} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6, background: ok ? "#062318" : "#2d0808", border: "1px solid " + (ok ? "#6ee7b730" : "#ef444430"), borderRadius: 8, padding: "7px 10px" }}>
          <span style={{ fontSize: 12, color: ok ? "#6ee7b7" : "#ef4444" }}>{ok ? "+" : "x"}</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: ok ? "#6ee7b7" : "#ef4444" }}>{l}</div>
            <div style={{ fontSize: 10, color: ok ? "#94a3b8" : "#fca5a5" }}>{ok ? v : e}</div>
          </div>
        </div>
      ))}
      <div style={{ background: lotRiskPct > 0.5 ? "#2d1f08" : "#062318", border: "1px solid " + (lotRiskPct > 0.5 ? "#f59e0b40" : "#6ee7b740"), borderRadius: 8, padding: "8px 10px", fontSize: 11 }}>
        <b style={{ color: "#f59e0b" }}>Resume: </b><span style={{ color: "#e2e8f0" }}>{_d.resume}</span>
      </div>
    </div>
  ) : null;


  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#080810", minHeight: "100vh", color: "#e2e8f0", padding: "14px", paddingTop: "calc(14px + env(safe-area-inset-top))", paddingBottom: "calc(14px + env(safe-area-inset-bottom))", maxWidth: 480, margin: "0 auto" }}>
      <style>{`
        * { box-sizing: border-box; }
        .card { background: #111118; border: 1px solid #1e1e2e; border-radius: 12px; padding: 14px; margin-bottom: 12px; }
        .tab-btn { padding: 7px 12px; border-radius: 8px; border: none; cursor: pointer; font-size: 11px; font-weight: 800; }
        .tab-btn.on { background: #6ee7b7; color: #080810; }
        .tab-btn.off { background: #111118; color: #64748b; border: 1px solid #1e1e2e; }
        .model-btn { flex: 1; padding: 9px 4px; border-radius: 8px; cursor: pointer; font-size: 10px; font-weight: 800; border: 1px solid #1e1e2e; }
        .model-btn.on { background: #6ee7b7; color: #080810; border-color: #6ee7b7; }
        .model-btn.off { background: #111118; color: #64748b; }
        input[type=range] { width: 100%; accent-color: #6ee7b7; margin-top: 3px; }
        input[type=number] { background: #080810; border: 1px solid #1e1e2e; border-radius: 6px; color: #e2e8f0; padding: 5px 8px; width: 100%; font-size: 13px; }
        .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #1e1e2e; font-size: 12px; }
        .row:last-child { border-bottom: none; }
        .tag { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; }
        .kpi { background: #0a0a14; border-radius: 8px; padding: 10px; }
      `}</style>

      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: "#6ee7b7" }}>FundedNext Simulator</div>
        <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>Moteur trade-par-trade realiste - Stellar 2026</div>
        <div style={{ height: 14, marginTop: 2 }}>
          {saveStatus && <span style={{ fontSize: 10, color: "#6ee7b7", opacity: 0.8 }}>✓ {saveStatus}</span>}
        </div>
      </div>

      {/* PRESETS */}
      <div className="card" style={{ borderLeft: "3px solid #a78bfa" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Configuration EA</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.keys(PRESETS).map(key => (
            <button key={key}
              onClick={() => applyPreset(key)}
              style={{
                padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700,
                background: activePreset === key ? "#a78bfa" : "#111118",
                color: activePreset === key ? "#080810" : "#64748b",
                border: "1px solid " + (activePreset === key ? "#a78bfa" : "#1e1e2e"),
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
            <div style={{ marginTop: 8, background: "#0d0816", border: "1px solid #a78bfa30", borderRadius: 8, padding: "9px 10px", fontSize: 10, color: "#94a3b8", lineHeight: 1.8 }}>
              <b style={{ color: "#a78bfa", fontSize: 11 }}>{pr.label}</b>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginTop: 6 }}>
                {[
                  { l: "Mensuel BT", v: "+" + bt.monthly + "%", c: "#6ee7b7" },
                  { l: "DD max BT", v: bt.dd + "%", c: bt.dd > 6 ? "#fbbf24" : "#6ee7b7" },
                  { l: "Sharpe", v: bt.sharpe, c: "#93c5fd" },
                  { l: "PF", v: bt.pf, c: "#6ee7b7" },
                  { l: "Trades", v: bt.trades, c: "#e2e8f0" },
                  { l: "WR", v: (bt.wr || "-") + "%", c: "#fbbf24" },
                ].map(s => (
                  <div key={s.l} style={{ background: "#111118", borderRadius: 6, padding: "4px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: "#475569" }}>{s.l}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>
              {bt.newsFilter && (
                <div style={{ marginTop: 6, fontSize: 9, color: "#475569" }}>
                  Filtre news: {bt.newsFilter}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* MODELE */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 800, color: "#6ee7b7", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Modele</div>
        <div style={{ display: "flex", gap: 6 }}>
          {Object.keys(MODELS).map(k => (
            <button key={k} className={"model-btn " + (modelKey === k ? "on" : "off")} onClick={() => setModelKey(k)}>
              {MODELS[k].name.replace("Stellar ", "")}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: "#64748b", lineHeight: 1.5 }}>
          {model.phases.map(ph => ph.label + " " + (ph.target * 100) + "%").join(" / ")}
          {" - DD jour " + (model.dailyDD * 100) + "% - DD total " + (model.totalDD * 100) + "% - frais ~" + fmt(fee)}
        </div>
        {modelKey === "lite" && (
          <div style={{ marginTop: 8, background: "#2d0808", border: "1px solid #ef444440", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: "#fca5a5", lineHeight: 1.5 }}>
            EA INTERDIT sur Stellar Lite CFD. Les EAs et indicateurs tiers sont strictement interdits - trading manuel uniquement. Utilise le 2-Step ou 1-Step pour ton EA.
          </div>
        )}
      </div>

      {/* STATUT */}
      {gs && (
        <div style={{ background: gs.bg, border: "1px solid " + gs.color + "30", borderRadius: 10, padding: "12px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: gs.color }}>{gs.label}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
              {bilan ? "Resultat net : " + fmt2(bilan.net) : "Resultat challenge"}
            </div>
          </div>
          <div style={{ fontSize: 26 }}>{dot(gs.emoji)}</div>
        </div>
      )}

      {/* CARTE DRAWDOWN ESTIME */}
      {dda && (
        <div className="card" style={{ borderLeft: "3px solid " + (dda.simMaxDD < model.totalDD * 50 ? "#6ee7b7" : dda.simMaxDD < model.totalDD * 75 ? "#fbbf24" : "#ef4444") }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#e2e8f0", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
            Analyse Drawdown - Ta config
          </div>

          {/* Jauge DD */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: "#64748b" }}>DD atteint cette simulation</span>
              <span style={{ fontWeight: 800, color: dda.simMaxDD < model.totalDD * 100 * 0.5 ? "#6ee7b7" : dda.simMaxDD < model.totalDD * 100 * 0.75 ? "#fbbf24" : "#ef4444" }}>
                {dda.simMaxDD.toFixed(2)}% ({fmt2(dda.simMaxDDAmount)})
              </span>
            </div>
            <div style={{ background: "#1e1e2e", borderRadius: 8, height: 18, overflow: "hidden", position: "relative" }}>
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
              <div style={{ position: "absolute", right: 4, top: 1, fontSize: 9, color: "#ef4444", fontWeight: 700 }}>
                {(model.totalDD * 100)}% = LIMITE
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#475569", marginTop: 2 }}>
              <span>0%</span>
              <span style={{ color: "#6ee7b7" }}>Zone safe</span>
              <span style={{ color: "#fbbf24" }}>Attention</span>
              <span style={{ color: "#ef4444" }}>Danger</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="kpi">
              <div style={{ fontSize: 9, color: "#64748b" }}>Perte max 1 jour</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>{dda.maxDayLossPct.toFixed(2)}%</div>
              <div style={{ fontSize: 9, color: "#475569" }}>{fmt2(dda.maxDayLoss)}</div>
            </div>
            <div className="kpi">
              <div style={{ fontSize: 9, color: "#64748b" }}>Jours full-perte DD total</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#ef4444" }}>{dda.daysToTotalDD}j</div>
              <div style={{ fontSize: 9, color: "#475569" }}>avant limite {(model.totalDD*100)}%</div>
            </div>
            <div className="kpi">
              <div style={{ fontSize: 9, color: "#64748b" }}>DD journalier franchissable</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: dda.canBreachDaily ? "#ef4444" : "#6ee7b7" }}>
                {dda.canBreachDaily ? "OUI - RISQUE" : "NON - SAFE"}
              </div>
              <div style={{ fontSize: 9, color: "#475569" }}>
                {dda.canBreachDaily
                  ? "perte max " + dda.maxDayLossPct.toFixed(2) + "% > " + (model.dailyDD*100) + "%"
                  : "perte max " + dda.maxDayLossPct.toFixed(2) + "% < " + (model.dailyDD*100) + "%"}
              </div>
            </div>
            <div className="kpi">
              <div style={{ fontSize: 9, color: "#64748b" }}>Marge restante</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: dda.distancePct > 5 ? "#6ee7b7" : "#ef4444" }}>
                {dda.distancePct > 0 ? dda.distancePct.toFixed(2) + "%" : "DEPASSE"}
              </div>
              <div style={{ fontSize: 9, color: "#475569" }}>{dda.distancePct > 0 ? fmt2(dda.distanceAmt) + " restants" : "compte ferme"}</div>
            </div>
          </div>

          <div style={{ marginTop: 10, background: "#0a0a14", borderRadius: 8, padding: "8px 10px", fontSize: 11, lineHeight: 1.5 }}>
            <span style={{ color: "#64748b" }}>Lecture : </span>
            {dda.canBreachDaily
              ? <span style={{ color: "#ef4444" }}>Attention - avec {tradesPerDay} trades a {riskPct}% tu peux declencher le DD journalier en 1 seule journee. Reduis le risque/trade ou le nombre de trades.</span>
              : <span style={{ color: "#6ee7b7" }}>Securise - le DD journalier {(model.dailyDD*100)}% est inatteignable en 1 jour avec ta config ({dda.maxDayLossPct.toFixed(2)}% max). Seule une accumulation sur {dda.daysToTotalDD}+ jours perdants peut te sortir.</span>
            }
          </div>
        </div>
      )}
      <div className="card" style={{ borderLeft: "3px solid " + wrColor }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: wrColor, textTransform: "uppercase", letterSpacing: 1 }}>Winrate global</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: wrColor }}>{winrate}%</span>
        </div>
        <input type="range" min={30} max={90} step={1} value={winrate} onChange={e => setWinrate(parseInt(e.target.value))} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#475569", marginTop: 2 }}>
          <span>30%</span><span>60%</span><span>90%</span>
        </div>
        <div style={{ marginTop: 8, background: "#0a0a14", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: finalRRValid ? "#93c5fd" : "#ef4444" }}>
          {finalRRValid
            ? <>RR necessaire : <b>1:{finalRR.toFixed(2)}</b> (gain {fmt2(effectiveRiskAmount * finalRR)} / perte {fmt2(effectiveRiskAmount)})</>
            : <>RR impossible ou &gt; 20 - winrate trop bas pour cet objectif.</>}
        </div>
      </div>

      {/* JAUGE CLUSTERING + MAX PERTES CONSECUTIVES */}
      <div className="card" style={{ borderLeft: "3px solid " + clColor }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: clColor, textTransform: "uppercase", letterSpacing: 1 }}>Clustering des pertes</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: clColor }}>{clusteringPct}%</span>
        </div>
        <input type="range" min={0} max={100} step={5} value={clusteringPct} onChange={e => setClusteringPct(parseInt(e.target.value))} />
        <div style={{ marginTop: 8, fontSize: 10, color: "#64748b", lineHeight: 1.5 }}>
          0% = trades independants (theorique). Plus c'est haut, plus les pertes arrivent en
          <b style={{ color: clColor }}> series noires</b>. Recommande : 35-50%.
        </div>

        <div style={{ marginTop: 12, borderTop: "1px solid #1e1e2e", paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#6ee7b7", textTransform: "uppercase", letterSpacing: 1 }}>
              Max pertes consecutives EA
            </span>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#6ee7b7" }}>{maxConsecLosses}</span>
          </div>
          <input type="range" min={1} max={20} step={1} value={maxConsecLosses} onChange={e => setMaxConsecLosses(parseInt(e.target.value))} style={{ accentColor: "#6ee7b7" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#475569", marginTop: 2 }}>
            <span>1</span><span>5</span><span>10</span><span>20</span>
          </div>
          <div style={{ marginTop: 8, background: "#062318", border: "1px solid #6ee7b730", borderRadius: 8, padding: "8px 10px", fontSize: 11, lineHeight: 1.6 }}>
            <div style={{ color: "#6ee7b7", fontWeight: 700, marginBottom: 4 }}>Avec ton EA (max {maxConsecLosses} pertes)</div>
            <div style={{ color: "#e2e8f0" }}>
              Perte max en serie : <b style={{ color: "#fbbf24" }}>{(maxConsecLosses * effectiveRiskPct).toFixed(2)}%</b>
              {" = "}<b style={{ color: "#fbbf24" }}>{(maxConsecLosses * effectiveRiskAmount).toFixed(0)}$</b>
            </div>
            <div style={{ color: "#e2e8f0" }}>
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
      <div className="card" style={{ borderLeft: "3px solid #f59e0b" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 1 }}>Lot & Instrument</span>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <span style={{ fontSize: 10, color: "#64748b" }}>Activer</span>
            <div onClick={() => setUseFixedLot(v => !v)} style={{
              width: 36, height: 20, borderRadius: 10, background: useFixedLot ? "#f59e0b" : "#1e1e2e",
              border: "1px solid " + (useFixedLot ? "#f59e0b" : "#2d2d3d"),
              position: "relative", cursor: "pointer", transition: "all .2s"
            }}>
              <div style={{ position: "absolute", top: 2, left: useFixedLot ? 18 : 2, width: 14, height: 14, borderRadius: 7, background: "#fff", transition: "all .2s" }} />
            </div>
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
          {/* Instrument */}
          <div>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3, fontWeight: 700 }}>Instrument</div>
            <select value={instrument} onChange={e => setInstrument(e.target.value)}
              style={{ background: "#080810", border: "1px solid #1e1e2e", borderRadius: 6, color: "#e2e8f0", padding: "5px 4px", width: "100%", fontSize: 12 }}>
              {["XAUUSD","EURUSD","GBPUSD","USDJPY","GBPJPY","NAS100","US30","SP500"].map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          {/* Lot */}
          <div>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3, fontWeight: 700 }}>Lot size</div>
            <input type="number" value={lotSize} min={0.01} max={10} step={0.01}
              onChange={e => setLotSize(parseFloat(e.target.value) || 0.01)}
              style={{ background: "#080810", border: "1px solid #1e1e2e", borderRadius: 6, color: "#e2e8f0", padding: "5px 6px", width: "100%", fontSize: 13 }} />
          </div>
          {/* SL pips */}
          <div>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3, fontWeight: 700 }}>SL (pips)</div>
            <input type="number" value={slPips} min={1} max={5000} step={1}
              onChange={e => setSlPips(parseInt(e.target.value) || 1)}
              style={{ background: "#080810", border: "1px solid #1e1e2e", borderRadius: 6, color: "#e2e8f0", padding: "5px 6px", width: "100%", fontSize: 13 }} />
          </div>
        </div>

        {/* Résultat calculé */}
        <div style={{ background: "#0a0a14", borderRadius: 8, padding: 10, marginBottom: useFixedLot ? 10 : 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#64748b" }}>Risque/trade</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b" }}>{fmt2(lotRiskAmount)}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#64748b" }}>% du capital</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: lotRiskPct > 1 ? "#ef4444" : lotRiskPct > 0.5 ? "#fbbf24" : "#6ee7b7" }}>
                {lotRiskPct.toFixed(2)}%
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#64748b" }}>Perte max/jour</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>{fmt2(lotRiskAmount * tradesPerDay)}</div>
            </div>
          </div>
        </div>

        {/* Diagnostic de compatibilité FundedNext */}
        {lotDiagJSX}

        {/* TOGGLE IMPACT ANNONCES NEWS */}
        <div style={{ marginTop: 10, borderTop: "1px solid #1e1e2e", paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: newsImpact ? "#ef4444" : "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
                Impact annonces news
              </div>
              <div style={{ fontSize: 9, color: "#475569", marginTop: 2, lineHeight: 1.4 }}>
                FundedNext: gains reduits a 40% si trade en fenetres news (+/-5min)
              </div>
            </div>
            <div onClick={() => setNewsImpact(v => !v)} style={{
              width: 36, height: 20, borderRadius: 10, background: newsImpact ? "#ef4444" : "#1e1e2e",
              border: "1px solid " + (newsImpact ? "#ef4444" : "#2d2d3d"),
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
        <div style={{ fontSize: 11, fontWeight: 800, color: "#6ee7b7", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Parametres Trading</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* Capital */}
          <div>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3, fontWeight: 700 }}>Capital ($)</div>
            <input type="number" value={capital} min={6000} max={200000} step={1000} onChange={e => setCapital(parseFloat(e.target.value) || 0)} style={{ background: "#080810", border: "1px solid #1e1e2e", borderRadius: 6, color: "#e2e8f0", padding: "5px 8px", width: "100%", fontSize: 13 }} />
            <input type="range" min={6000} max={200000} step={1000} value={capital} onChange={e => setCapital(parseFloat(e.target.value))} />
          </div>

          {/* Risque/trade - affichage différent si mode lot actif */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>Risque/trade (%)</span>
              {useFixedLot && <span style={{ fontSize: 9, background: "#f59e0b20", color: "#f59e0b", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>LOT AUTO</span>}
            </div>
            <input
              type="number"
              value={useFixedLot ? +effectiveRiskPct.toFixed(2) : riskPct}
              min={0.05} max={5} step={0.05}
              readOnly={useFixedLot}
              onChange={e => !useFixedLot && setRiskPct(parseFloat(e.target.value) || 0)}
              style={{
                background: useFixedLot ? "#1a1004" : "#080810",
                border: "1px solid " + (useFixedLot ? "#f59e0b80" : "#1e1e2e"),
                borderRadius: 6,
                color: useFixedLot ? "#f59e0b" : "#e2e8f0",
                padding: "5px 8px", width: "100%", fontSize: 13,
                cursor: useFixedLot ? "not-allowed" : "text",
                fontWeight: useFixedLot ? 800 : 400,
              }} />
            {useFixedLot
              ? <div style={{ fontSize: 9, color: "#f59e0b", marginTop: 3, lineHeight: 1.4 }}>
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
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3, fontWeight: 700 }}>{f.label}</div>
              <input type="number" value={f.val} min={f.min} max={f.max} step={f.step} onChange={e => f.set(parseFloat(e.target.value) || 0)} style={{ background: "#080810", border: "1px solid #1e1e2e", borderRadius: 6, color: "#e2e8f0", padding: "5px 8px", width: "100%", fontSize: 13 }} />
              <input type="range" min={f.min} max={f.max} step={f.step} value={f.val} onChange={e => f.set(parseFloat(e.target.value))} />
            </div>
          ))}
        </div>

        {/* Résumé paramètres */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <div style={{ background: useFixedLot ? "#1a1004" : "#0a0a14", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: useFixedLot ? "#f59e0b" : "#fbbf24", border: useFixedLot ? "1px solid #f59e0b30" : "none" }}>
            Risque : <b>{fmt2(effectiveRiskAmount)}</b>/trade = <b>{effectiveRiskPct.toFixed(2)}%</b>
          </div>
          <div style={{ background: "#0a0a14", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: "#6ee7b7" }}>
            Objectif : <b>{fmt2(capital * dailyTarget)}</b>/jour
            <span style={{ color: "#475569", fontSize: 9, marginLeft: 4 }}>
              (E espéré : {fmt2(Math.max(0, expectedDailyPnL))}/j)
            </span>
          </div>
          <div style={{ background: "#0a0a14", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: "#93c5fd", gridColumn: "1 / 3" }}>
            Profit equiv. : <b>{(monthlyTarget * 100).toFixed(1)}% / mois</b> - frais : <b>{fmt(fee)}</b> - RR : <b style={{ color: finalRR < 1.5 ? "#6ee7b7" : finalRR < 2.5 ? "#fbbf24" : "#ef4444" }}>1:{finalRR.toFixed(2)}</b>
          </div>
        </div>
        <button onClick={() => setSeed(s => s + 1)}
          style={{ marginTop: 10, width: "100%", padding: 9, background: "#1e1e2e", border: "1px solid #2d2d3d", borderRadius: 8, color: "#6ee7b7", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
          Nouvelle simulation
        </button>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={copyReport}
            style={{ flex: 1, padding: 9, background: copied ? "#062318" : "#6ee7b7", border: copied ? "1px solid #6ee7b7" : "none", borderRadius: 8, color: copied ? "#6ee7b7" : "#080810", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
            {copied ? "Copie !" : "Copier le rapport"}
          </button>
          <button onClick={printReport}
            style={{ flex: 1, padding: 9, background: "#93c5fd", border: "none", borderRadius: 8, color: "#080810", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
            Imprimer / PDF
          </button>
        </div>
      </div>

      {/* BILAN FINANCIER NET */}
      {bilan && (
        <div className="card" style={{ borderLeft: "3px solid #fbbf24" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Bilan Financier Net</div>
          {[
            { label: "Reward challenge (15%)", val: "+" + fmt2(bilan.reward), color: "#6ee7b7" },
            { label: "Payouts funded verses", val: "+" + fmt2(bilan.payout), color: "#6ee7b7" },
            { label: "En attente (non verse)", val: "+" + fmt2(bilan.pending), color: "#94a3b8" },
            { label: "Frais d'achat challenge", val: "-" + fmt2(bilan.fee), color: "#ef4444" },
          ].map(k => (
            <div key={k.label} className="row">
              <span style={{ color: "#64748b" }}>{k.label}</span>
              <span style={{ color: k.color, fontWeight: 700 }}>{k.val}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 4, borderTop: "1px solid #2d2d3d" }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>RESULTAT NET</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: bilan.net >= 0 ? "#6ee7b7" : "#ef4444" }}>{fmt2(bilan.net)}</span>
          </div>
        </div>
      )}

      {/* REGLES */}
      <div className="card" style={{ borderLeft: "3px solid #6ee7b7" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#6ee7b7", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Regles {model.name}</div>
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
              <span style={{ color: "#64748b", fontSize: 11 }}>{kv[0]}</span>
              <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 11 }}>{kv[1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {[{ id: "challenge", label: "Challenge" }, { id: "funded", label: "Funded" }, { id: "montecarlo", label: "Monte Carlo" }, { id: "trades", label: "Mes Trades" }]
          .map(t => <button key={t.id} className={"tab-btn " + (tab === t.id ? "on" : "off")} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      {!finalRRValid && (
        <div className="card" style={{ textAlign: "center", padding: 24, color: "#ef4444", fontWeight: 700, fontSize: 13 }}>
          Combinaison impossible : winrate trop bas pour cet objectif.<br />
          <span style={{ color: "#64748b", fontWeight: 400, fontSize: 12 }}>Monte le winrate ou baisse l'objectif/jour.</span>
        </div>
      )}

      {/* TAB CHALLENGE */}
      {tab === "challenge" && sim && (
        <div>
          {model.phases.map((ph, i) => {
            const data = sim.phaseResults[i];
            const color = i === 0 ? "#6ee7b7" : "#93c5fd";
            return (
              <div className="card" key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{ph.label} - Objectif +{(ph.target * 100)}%</div>
                  {data ? (
                    <span className="tag" style={{ background: phaseIcon(data.status).bg, color: phaseIcon(data.status).color }}>
                      {phaseIcon(data.status).icon} {phaseIcon(data.status).label}
                    </span>
                  ) : (
                    <span className="tag" style={{ background: "#111118", color: "#64748b", border: "1px solid #1e1e2e" }}>VERROUILLE</span>
                  )}
                </div>
                {data ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                      <div className="kpi">
                        <div style={{ fontSize: 9, color: "#64748b" }}>Jours</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color }}>{data.tradingDays}</div>
                      </div>
                      <div className="kpi">
                        <div style={{ fontSize: 9, color: "#64748b" }}>Profit</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: data.profit >= ph.target ? "#6ee7b7" : data.profit >= 0 ? "#fbbf24" : "#ef4444" }}>
                          {fmtPn(data.profit)}
                        </div>
                      </div>
                      <div className="kpi">
                        <div style={{ fontSize: 9, color: "#64748b" }}>WR trades</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#93c5fd" }}>{data.tradeWinrate.toFixed(0)}%</div>
                      </div>
                      <div className="kpi">
                        <div style={{ fontSize: 9, color: "#64748b" }}>Equity</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>{fmt(data.finalEquity)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
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
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#475569" }} tickFormatter={v => "J" + v} />
                        <YAxis tick={{ fontSize: 9, fill: "#475569" }} tickFormatter={v => "$" + (v / 1000).toFixed(1) + "k"} domain={["auto", "auto"]} />
                        <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 11 }} />
                        <ReferenceLine y={capital * (1 + ph.target)} stroke={color} strokeDasharray="4 2" />
                        <ReferenceLine y={capital * (1 - model.totalDD)} stroke="#ef4444" strokeDasharray="4 2" />
                        <Area type="monotone" dataKey="equity" stroke={color} strokeWidth={2} fill={"url(#gp" + i + ")"} dot={false} name="Equity" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#64748b", fontSize: 13 }}>
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
                <div style={{ fontWeight: 800, fontSize: 14 }}>Compte Funded - {fundedMonths} mois</div>
                <span className="tag" style={{ background: sim.funded.status === "active" ? "#062318" : "#2d0808", color: sim.funded.status === "active" ? "#6ee7b7" : "#ef4444" }}>
                  {sim.funded.status === "active" ? "ACTIF" : "FERME"}
                </span>
              </div>
              <div style={{ background: "#062318", border: "1px solid #6ee7b730", borderRadius: 8, padding: 8, marginBottom: 12, fontSize: 11, color: "#6ee7b7" }}>
                Capital funded = {fmt(capital)} (remis a l'initial) - Seuil retrait : $50 - Payout bi-weekly (14j)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Capital final", val: fmt(sim.funded.finalEquity), color: "#6ee7b7" },
                  { label: "Payout verse", val: fmt(sim.funded.cumulPayout), color: "#fbbf24" },
                  { label: "En attente", val: fmt2(sim.funded.pendingPayout), color: "#94a3b8" },
                  { label: "WR mensuel", val: sim.funded.winrateMonth.toFixed(0) + "%", color: sim.funded.winrateMonth >= 60 ? "#6ee7b7" : "#fbbf24" },
                  { label: "Scaling", val: sim.funded.scalingCount + "x (+40%)", color: "#93c5fd" },
                  { label: "Split final", val: sim.funded.finalSplit + "%", color: sim.funded.finalSplit >= 90 ? "#6ee7b7" : "#fbbf24" },
                ].map((k) => (
                  <div key={k.label} className="kpi">
                    <div style={{ fontSize: 9, color: "#64748b" }}>{k.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: k.color, marginTop: 2 }}>{k.val}</div>
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
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#475569" }} tickFormatter={v => "M" + v} />
                  <YAxis tick={{ fontSize: 9, fill: "#475569" }} tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} domain={["auto", "auto"]} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 11 }} />
                  <ReferenceLine y={capital} stroke="#475569" strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="equity" stroke="#6ee7b7" strokeWidth={2} fill="url(#gfunded)" dot={false} name="Equity" />
                  <Line type="monotone" dataKey="cumul" stroke="#fbbf24" strokeWidth={2} dot={false} name="Payout Cumule" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* CALENDRIER PnL */}
            <CalendrierPnL dailyLog={sim.funded.dailyLog} />

            <div className="card">
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10, color: "#fbbf24" }}>Detail Mensuel</div>
              <div style={{ overflowY: "auto", maxHeight: 300 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
                      {["Mois", "Equity", "Profit%", "Payout", "Split", "Streak", "Statut"].map(h => (
                        <th key={h} style={{ padding: "5px 4px", color: "#64748b", textAlign: "right", fontWeight: 700, fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sim.funded.data.map(r => (
                      <tr key={r.month} style={{ borderBottom: "1px solid #0f0f18", background: r.scalingNote ? "#062318" : "transparent" }}>
                        <td style={{ padding: "5px 4px", color: "#94a3b8", textAlign: "right" }}>M{r.month}</td>
                        <td style={{ padding: "5px 4px", color: "#e2e8f0", textAlign: "right" }}>{fmt(r.equity)}</td>
                        <td style={{ padding: "5px 4px", textAlign: "right", color: r.profitPct >= 0 ? "#6ee7b7" : "#ef4444" }}>
                          {(r.profitPct >= 0 ? "+" : "") + r.profitPct.toFixed(2)}%
                        </td>
                        <td style={{ padding: "5px 4px", textAlign: "right", fontWeight: r.payout > 0 ? 700 : 400, color: r.payout > 0 ? "#fbbf24" : "#475569" }}>
                          {r.payout > 0 ? fmt(r.payout) : "-"}
                        </td>
                        <td style={{ padding: "5px 4px", textAlign: "right", color: r.currentSplit >= 90 ? "#6ee7b7" : "#94a3b8" }}>
                          {r.currentSplit}%
                        </td>
                        <td style={{ padding: "5px 4px", textAlign: "right", color: r.streakMonths >= 4 ? "#6ee7b7" : r.streakMonths >= 2 ? "#fbbf24" : "#64748b" }}>
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
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>Monte le winrate ou reduis le clustering</div>
          </div>
        )
      )}

      {/* TAB MONTE CARLO */}
      {tab === "montecarlo" && finalRRValid && (
        <MonteCarloTab modelKey={modelKey} capital={capital} p={p} fundedMonths={fundedMonths}
          splitRate={splitRate} winrate={winrate} fee={fee} clusteringPct={clusteringPct} />
      )}

      {/* TAB MES TRADES */}
      {tab === "trades" && (
        <MesTradesTab sim={sim} capital={capital} fundedMonths={fundedMonths} winrate={winrate} riskPct={riskPct} dailyTargetPct={dailyTargetPct} model={model} />
      )}

      <div style={{ textAlign: "center", fontSize: 10, color: "#1e1e2e", marginTop: 12, paddingBottom: 8 }}>
        Regles FundedNext Stellar 2026 - Simulation indicative - Pas une garantie
      </div>
    </div>
  );
}

function MonteCarloTab({ modelKey, capital, p, fundedMonths, splitRate, winrate, fee, clusteringPct }) {
  const [res, setRes] = useState(null);
  const model = MODELS[modelKey];
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

  if (!res) return <div className="card" style={{ color: "#64748b", textAlign: "center" }}>Calcul Monte Carlo en cours... ({RUNS} simulations)</div>;
  const fmt = v => "$" + (v >= 0 ? "+" : "") + Math.abs(v).toFixed(0);
  const color = v => v >= 0 ? "#6ee7b7" : "#ef4444";
  const rate_color = v => v >= 70 ? "#6ee7b7" : v >= 50 ? "#fbbf24" : "#ef4444";
  return (
    <div>
      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12, color: "#e2e8f0" }}>Monte Carlo - {RUNS} simulations</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { l: "Challenge", v: res.passRate + "%", c: rate_color(+res.passRate) },
            { l: "Survie funded", v: res.survRate + "%", c: rate_color(+res.survRate) },
            { l: "Profitable", v: res.profRate + "%", c: rate_color(+res.profRate) },
          ].map(k => (
            <div key={k.l} className="kpi">
              <div style={{ fontSize: 9, color: "#64748b" }}>{k.l}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#0a0a14", borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>Distribution resultat net</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
            {[["Min", res.min], ["P25", res.p25], ["P50", res.p50], ["P75", res.p75], ["Max", res.max]].map(([l, v]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#475569" }}>{l}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: color(v) }}>{fmt(v)}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#0a0a14", borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 10, color: "#64748b" }}>DD moyen sur runs passes : <b style={{ color: "#fbbf24" }}>{res.avgDD}%</b></div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Frais challenge : <b style={{ color: "#ef4444" }}>{fmt(-fee)}</b></div>
        </div>
      </div>
    </div>
  );
}

function MesTradesTab({ sim, capital, fundedMonths, winrate, riskPct, dailyTargetPct, model }) {
  const loadTrades = () => {
    try {
      const raw = localStorage.getItem("eapropfirm_trades");
      return raw ? JSON.parse(raw) : { trades: [], filename: null };
    } catch (e) { return { trades: [], filename: null }; }
  };
  const savedTrades = loadTrades();

  const [trades, setTrades] = useState(savedTrades.trades || []);
  const [parseError, setParseError] = useState(null);
  const [filename, setFilename] = useState(savedTrades.filename || null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (trades.length > 0) {
      const initBal = trades[0].balance - trades[0].profit;
      computeAlerts(trades, initBal);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("eapropfirm_trades", JSON.stringify({ trades, filename }));
    } catch (e) { /* indispo */ }
  }, [trades, filename]);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (lines.length < 2) return { error: "Fichier vide ou invalide" };

    const header = lines[0].toLowerCase().replace(/"/g, '');
    const cols = header.split(/[,;\t]/);

    let format = null;
    let profitIdx = -1, timeIdx = -1, typeIdx = -1, balanceIdx = -1, commIdx = -1, swapIdx = -1;

    if (cols.some(c => c.includes('ticket')) && cols.some(c => c.includes('profit'))) {
      format = 'mt4';
      timeIdx = cols.findIndex(c => c.includes('close time') || (c.includes('time') && cols.indexOf(c) > 0));
      if (timeIdx === -1) timeIdx = cols.findIndex(c => c.includes('time'));
      typeIdx = cols.findIndex(c => c.includes('type'));
      profitIdx = cols.findIndex(c => c.trim() === 'profit' || c.includes('profit'));
      commIdx = cols.findIndex(c => c.includes('commission') || c.includes('comm'));
      swapIdx = cols.findIndex(c => c.includes('swap'));
      balanceIdx = cols.findIndex(c => c.includes('balance'));
    }
    else if (cols.some(c => c.includes('position')) && cols.some(c => c.includes('profit'))) {
      format = 'mt5';
      timeIdx = cols.findIndex(c => c.includes('time'));
      typeIdx = cols.findIndex(c => c.includes('type'));
      profitIdx = cols.findIndex(c => c.trim() === 'profit' || c.includes('profit'));
      commIdx = cols.findIndex(c => c.includes('commission') || c.includes('comm'));
      swapIdx = cols.findIndex(c => c.includes('swap'));
      balanceIdx = cols.findIndex(c => c.includes('balance'));
    }
    else if (cols.some(c => c.includes('date')) && cols.some(c => c.includes('profit'))) {
      format = 'simple';
      timeIdx = cols.findIndex(c => c.includes('date') || c.includes('time'));
      profitIdx = cols.findIndex(c => c.includes('profit'));
      balanceIdx = cols.findIndex(c => c.includes('balance'));
    }
    else if (cols.length >= 2) {
      format = 'minimal';
      timeIdx = 0;
      profitIdx = cols.findIndex(c => c.includes('profit') || c.includes('pnl') || c.includes('gain'));
      if (profitIdx === -1) profitIdx = 1;
      balanceIdx = cols.findIndex(c => c.includes('balance') || c.includes('equity'));
    }

    if (!format) return { error: "Format non reconnu. Attendu : export MT4/MT5 ou colonnes Date,Profit,Balance" };
    if (profitIdx === -1) return { error: "Colonne Profit introuvable dans le CSV" };

    const parsed = [];
    let runningBalance = capital;
    let initBalance = null;

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].replace(/"/g, '').split(/[,;\t]/);
      if (row.length < 2) continue;

      const profitRaw = parseFloat(row[profitIdx]);
      if (isNaN(profitRaw)) continue;

      const comm = commIdx >= 0 ? parseFloat(row[commIdx]) || 0 : 0;
      const swap = swapIdx >= 0 ? parseFloat(row[swapIdx]) || 0 : 0;
      const netProfit = profitRaw + comm + swap;

      let balance = balanceIdx >= 0 ? parseFloat(row[balanceIdx]) : NaN;
      if (isNaN(balance)) {
        runningBalance += netProfit;
        balance = runningBalance;
      }
      if (initBalance === null) initBalance = balance - netProfit;

      const timeRaw = timeIdx >= 0 ? row[timeIdx] : '';
      const type = typeIdx >= 0 ? row[typeIdx] : '';

      parsed.push({
        idx: i,
        time: timeRaw.trim(),
        type: type.trim(),
        profit: netProfit,
        balance,
      });
    }

    if (parsed.length === 0) return { error: "Aucun trade valide trouve dans le fichier" };
    return { trades: parsed, format, initBalance: initBalance || capital };
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFilename(file.name);
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = parseCSV(ev.target.result);
      if (result.error) { setParseError(result.error); setTrades([]); return; }
      setTrades(result.trades);
      computeAlerts(result.trades, result.initBalance);
    };
    reader.readAsText(file);
  };

  // CALCUL DES ALERTES
  const computeAlerts = (trades, initBalance) => {
    const newAlerts = [];
    if (!trades.length) return;

    const totalPnl = trades.reduce((s, t) => s + t.profit, 0);
    const wins = trades.filter(t => t.profit > 0).length;
    const losses = trades.filter(t => t.profit < 0).length;
    const realWR = trades.length > 0 ? (wins / trades.length) * 100 : 0;
    const lastBalance = trades[trades.length - 1].balance;
    const ddPct = ((initBalance - lastBalance) / initBalance) * 100;
    const ddDayLimit = initBalance * (model ? model.dailyDD : 0.05);

    const maxLoss = Math.min(...trades.map(t => t.profit));
    if (Math.abs(maxLoss) > ddDayLimit * 0.8) {
      newAlerts.push({
        level: "danger",
        msg: "Trade a " + Math.abs(maxLoss).toFixed(0) + "$ de perte - proche du DD journalier (" + ddDayLimit.toFixed(0) + "$)"
      });
    }

    if (realWR < winrate - 10) {
      newAlerts.push({
        level: "warning",
        msg: "Winrate reel " + realWR.toFixed(0) + "% < simulation " + winrate + "% - performance en dessous des attentes"
      });
    }

    if (ddPct > (model ? model.totalDD * 100 * 0.7 : 7)) {
      newAlerts.push({
        level: "danger",
        msg: "DD cumule " + ddPct.toFixed(2) + "% - dangereux, proche de la limite " + (model ? model.totalDD * 100 : 10) + "%"
      });
    } else if (ddPct > (model ? model.totalDD * 100 * 0.4 : 4)) {
      newAlerts.push({
        level: "warning",
        msg: "DD cumule " + ddPct.toFixed(2) + "% - surveillance requise"
      });
    }

    const avgProfit = totalPnl / trades.length;
    const targetPerTrade = (capital * dailyTargetPct / 100) / 3;
    if (avgProfit < targetPerTrade * 0.5) {
      newAlerts.push({
        level: "info",
        msg: "Profit moyen/trade " + avgProfit.toFixed(0) + "$ < objectif " + targetPerTrade.toFixed(0) + "$ - revois le RR ou la config"
      });
    }

    let maxConsec = 0, cur = 0;
    trades.forEach(t => { if (t.profit < 0) { cur++; if (cur > maxConsec) maxConsec = cur; } else cur = 0; });
    if (maxConsec > 6) {
      newAlerts.push({ level: "warning", msg: "Serie de " + maxConsec + " pertes consecutives detectee - verifie ton EA" });
    }

    if (newAlerts.length === 0) {
      newAlerts.push({ level: "ok", msg: "Aucune anomalie detectee - performances coherentes avec la simulation" });
    }

    setAlerts(newAlerts);
  };

  const stats = trades.length > 0 ? (() => {
    const wins = trades.filter(t => t.profit > 0);
    const losses = trades.filter(t => t.profit < 0);
    const totalPnl = trades.reduce((s, t) => s + t.profit, 0);
    const initBal = trades[0].balance - trades[0].profit;
    const finalBal = trades[trades.length - 1].balance;
    const wr = (wins.length / trades.length) * 100;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.profit, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.profit, 0) / losses.length) : 0;
    const rr = avgLoss > 0 ? avgWin / avgLoss : 0;
    const ddPct = ((initBal - Math.min(...trades.map(t => t.balance))) / initBal) * 100;
    return { wins: wins.length, losses: losses.length, total: trades.length, totalPnl, wr, avgWin, avgLoss, rr, ddPct, initBal, finalBal };
  })() : null;

  const chartData = (() => {
    if (!trades.length || !sim || !sim.funded) return [];
    const simData = sim.funded.data;
    const step = Math.max(1, Math.floor(trades.length / Math.max(fundedMonths, 12)));
    const result = [];
    for (let i = 0; i < Math.min(trades.length, fundedMonths * step * 2); i += step) {
      const t = trades[Math.min(i, trades.length - 1)];
      const simIdx = Math.min(Math.floor(i / step), simData.length - 1);
      result.push({
        pt: i + 1,
        reel: +t.balance.toFixed(2),
        simulation: simIdx >= 0 ? simData[simIdx].equity : capital,
      });
    }
    return result;
  })();

  const alertColor = (level) => level === "danger" ? "#ef4444" : level === "warning" ? "#fbbf24" : level === "ok" ? "#6ee7b7" : "#93c5fd";
  const alertBg = (level) => level === "danger" ? "#2d0808" : level === "warning" ? "#2d1f08" : level === "ok" ? "#062318" : "#0c1a3d";
  const alertIcon = (level) => level === "danger" ? "\u26A0\uFE0F" : level === "warning" ? "\uD83D\uDFE1" : level === "ok" ? "\u2705" : "\uD83D\uDCA1";

  return (
    <div>
      {/* UPLOAD */}
      <div className="card" style={{ borderLeft: "3px solid #6ee7b7" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#6ee7b7", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
          Import trades MT4 / MT5
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, lineHeight: 1.5 }}>
          MT4 : Historique des comptes → clic droit → Enregistrer en CSV<br />
          MT5 : Historique → Rapport → Exporter en CSV<br />
          Accepte aussi : Date,Profit,Balance (format simplifie)
        </div>
        <label style={{ display: "block", background: "#0a0a14", border: "2px dashed #2d2d3d", borderRadius: 10, padding: "16px", textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
          <div style={{ fontSize: 13, color: "#6ee7b7", fontWeight: 700 }}>
            {filename ? filename : "Appuie pour choisir le fichier CSV"}
          </div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>
            {trades.length > 0 ? trades.length + " trades charges" : "Aucun fichier"}
          </div>
          <input type="file" accept=".csv,.txt,.tsv" onChange={handleFile} style={{ display: "none" }} />
        </label>
        {parseError && (
          <div style={{ marginTop: 8, background: "#2d0808", border: "1px solid #ef444440", borderRadius: 8, padding: 10, fontSize: 12, color: "#fca5a5" }}>
            {parseError}
          </div>
        )}
        {trades.length > 0 && (
          <button onClick={() => { setTrades([]); setFilename(null); setAlerts([]); try { localStorage.removeItem("eapropfirm_trades"); } catch (e) {} }}
            style={{ marginTop: 8, width: "100%", padding: 8, background: "#2d0808", border: "1px solid #ef444440", borderRadius: 8, color: "#fca5a5", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            Effacer les trades importes
          </button>
        )}
      </div>

      {trades.length > 0 && stats && (
        <>
          {/* ALERTES */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 800, color: "#e2e8f0", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
              Alertes & Diagnostics
            </div>
            {alerts.map((a, i) => (
              <div key={i} style={{ background: alertBg(a.level), border: "1px solid " + alertColor(a.level) + "30", borderRadius: 8, padding: "9px 12px", marginBottom: 8, fontSize: 12, color: alertColor(a.level), lineHeight: 1.5, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span>{alertIcon(a.level)}</span>
                <span>{a.msg}</span>
              </div>
            ))}
          </div>

          {/* STATS COMPARATIVES */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 800, color: "#e2e8f0", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
              Reel vs Simulation
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: "#64748b", textAlign: "center", paddingBottom: 4 }}>Indicateur</div>
              <div style={{ fontSize: 10, color: "#6ee7b7", textAlign: "center", fontWeight: 700 }}>Reel</div>
              <div style={{ fontSize: 10, color: "#93c5fd", textAlign: "center", fontWeight: 700 }}>Simulation</div>
            </div>
            {[
              { label: "Trades", real: stats.total, sim2: "-" },
              { label: "Winrate", real: stats.wr.toFixed(0) + "%", sim2: winrate + "%", ok: stats.wr >= winrate - 5 },
              { label: "Moy. gain", real: "$" + stats.avgWin.toFixed(0), sim2: "-" },
              { label: "Moy. perte", real: "$" + stats.avgLoss.toFixed(0), sim2: "$" + (capital * riskPct / 100).toFixed(0), ok: stats.avgLoss <= capital * riskPct / 100 * 1.2 },
              { label: "RR reel", real: "1:" + stats.rr.toFixed(2), sim2: "-" },
              { label: "P&L total", real: "$" + stats.totalPnl.toFixed(0), sim2: sim && sim.funded ? "$" + (sim.funded.cumulPayout).toFixed(0) : "-" },
              { label: "DD max", real: stats.ddPct.toFixed(2) + "%", sim2: (model ? model.totalDD * 100 : 10) + "% max", ok: stats.ddPct < (model ? model.totalDD * 100 * 0.7 : 7) },
            ].map(row => (
              <div key={row.label} className="row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                <span style={{ color: "#64748b", fontSize: 11 }}>{row.label}</span>
                <span style={{ textAlign: "center", fontWeight: 700, fontSize: 11, color: row.ok === false ? "#ef4444" : row.ok === true ? "#6ee7b7" : "#e2e8f0" }}>{row.real}</span>
                <span style={{ textAlign: "center", fontSize: 11, color: "#475569" }}>{row.sim2}</span>
              </div>
            ))}
          </div>

          {/* GRAPHIQUE SUPERPOSE */}
          {chartData.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 11, fontWeight: 800, color: "#e2e8f0", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                Courbe Equity - Reel vs Simulation
              </div>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 12 }}>
                Vert = reel · Bleu = simulation
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="greel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gsim" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#93c5fd" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a28" />
                  <XAxis dataKey="pt" tick={{ fontSize: 9, fill: "#475569" }} tickFormatter={v => "#" + v} />
                  <YAxis tick={{ fontSize: 9, fill: "#475569" }} tickFormatter={v => "$" + (v / 1000).toFixed(1) + "k"} domain={["auto", "auto"]} />
                  <Tooltip
                    formatter={(v, name) => ["$" + Number(v).toFixed(0), name]}
                    contentStyle={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 11 }}
                  />
                  <ReferenceLine y={capital} stroke="#475569" strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="simulation" stroke="#93c5fd" strokeWidth={1.5} fill="url(#gsim)" dot={false} name="Simulation" strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="reel" stroke="#6ee7b7" strokeWidth={2.5} fill="url(#greel)" dot={false} name="Reel" />
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
      return { bg: "#16161f", fg: "#334155", border: "1px solid #1e1e2e", numColor: "#334155" };

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
    return { bg: "#1e1e2e", fg: "#94a3b8", border: "1px solid #2d2d3d", numColor: "#94a3b8" };
  };

  return (
    <div className="card" style={{ padding: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#e2e8f0" }}>Calendrier PnL</div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>Mois {selectedMonth} - simulation jour par jour</div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button onClick={() => setSelectedMonth(Math.max(1, selectedMonth - 1))}
            disabled={selectedMonth <= 1}
            style={{ background: "#1e1e2e", border: "1px solid #2d2d3d", borderRadius: 8, color: selectedMonth <= 1 ? "#334155" : "#6ee7b7", width: 32, height: 32, fontSize: 18, fontWeight: 800, cursor: "pointer", lineHeight: 1 }}>
            ‹
          </button>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#6ee7b7", minWidth: 60, textAlign: "center" }}>
            M{selectedMonth}/{months.length}
          </span>
          <button onClick={() => setSelectedMonth(Math.min(months.length, selectedMonth + 1))}
            disabled={selectedMonth >= months.length}
            style={{ background: "#1e1e2e", border: "1px solid #2d2d3d", borderRadius: 8, color: selectedMonth >= months.length ? "#334155" : "#6ee7b7", width: 32, height: 32, fontSize: 18, fontWeight: 800, cursor: "pointer", lineHeight: 1 }}>
            ›
          </button>
        </div>
      </div>

      {/* Stats resume */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14 }}>
        {[
          { label: "P&L mois", val: (monthPnl >= 0 ? "+" : "") + "$" + Math.abs(monthPnl).toFixed(0), color: monthPnl >= 0 ? "#4ade80" : "#f87171" },
          { label: "Jours +/-", val: winDays + "j / " + lossDays + "j", color: "#e2e8f0" },
          { label: "Meilleur", val: "+$" + bestDay.toFixed(0), color: "#4ade80" },
          { label: "Pire", val: "-$" + Math.abs(worstDay).toFixed(0), color: "#f87171" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0a0a14", borderRadius: 8, padding: "7px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#64748b", marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* En-tete jours semaine */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 3 }}>
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((j, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 9, color: i >= 5 ? "#1e293b" : "#64748b", fontWeight: 700, paddingBottom: 4 }}>{j}</div>
        ))}
      </div>

      {/* Grille calendrier */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {grid.map((cell, i) => {
          const c = cell.trading && cell.data ? cellColor(cell.data.pnl) : { bg: "#0d0d15", fg: "#1e293b", border: "1px solid #12121a", numColor: "#1e293b" };
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
                  <div style={{ fontSize: 9, color: c.fg, fontWeight: 800, textAlign: "center", lineHeight: 1.2 }}>
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
          { bg: "#16a34a", label: "Gros gain" },
          { bg: "#052e16", label: "Petit gain", fg: "#4ade80" },
          { bg: "#dc2626", label: "Grosse perte" },
          { bg: "#2d0808", label: "Petite perte", fg: "#f87171" },
        ].map(l => (
          <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: l.fg || "#94a3b8" }}>
            <span style={{ display: "inline-block", width: 10, height: 10, background: l.bg, border: "1px solid " + (l.fg || "#fff") + "30", borderRadius: 3 }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
