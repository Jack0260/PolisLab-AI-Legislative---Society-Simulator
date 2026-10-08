import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  FastForward,
  Sliders,
  FileText,
  Activity,
} from 'lucide-react';
import {
  AgentStratum,
  LawPolicy,
  MicroEventLog,
  MonthlyTelemetry,
  PolicyAuditReport,
  PolicyParameters,
  SimAgent,
  SimulationRunRecord,
} from './types/policy';
import {
  createInitialAgents,
  createRng,
  hashPolicySeed,
  PRESET_LAWS,
  runBatchSimulation,
  stepSimulationMonth,
  STRATUM_META,
} from './simulation/engine';
import { CivicAgentCanvas } from './components/CivicAgentCanvas';
import { LorenzCurveChart, TrajectoryChart } from './components/SimulationCharts';
import { LegislativeDrafterView, ParameterSlider } from './components/LegislativeDrafterView';
import { OutcomeDashboardView } from './components/OutcomeDashboardView';
import { PolicyComparisonView } from './components/PolicyComparisonView';

type ActiveTab = 'simulator' | 'drafter' | 'dashboard' | 'comparison';

const STORAGE_KEY = 'polislab_custom_laws_v1';

export default function App() {
  // Load preset laws + any AI-drafted laws from localStorage
  const [policies, setPolicies] = useState<LawPolicy[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as LawPolicy[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const presetIds = new Set(PRESET_LAWS.map((p) => p.id));
          const customOnly = parsed.filter((p) => !presetIds.has(p.id));
          return [...PRESET_LAWS, ...customOnly];
        }
      }
    } catch {
      // ignore storage errors
    }
    return PRESET_LAWS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [activePolicyId, setActivePolicyId] = useState<string>(PRESET_LAWS[1].id); // Default to HB-2026-401

  // Live Sandbox Simulation State
  const [simMonth, setSimMonth] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [agents, setAgents] = useState<SimAgent[]>(() => createInitialAgents(104729));
  const [liveHistory, setLiveHistory] = useState<MonthlyTelemetry[]>(() => {
    const initAgents = createInitialAgents(104729);
    const m0 = stepSimulationMonth(initAgents, 0, PRESET_LAWS[0].parameters, createRng(104729));
    return [m0.telemetry];
  });
  const [liveEvents, setLiveEvents] = useState<MicroEventLog[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [stratumFilter, setStratumFilter] = useState<AgentStratum | 'all'>('all');
  const [rightDeckMode, setRightDeckMode] = useState<'sliders' | 'clauses' | 'events'>('sliders');

  const rngRef = useRef<() => number>(createRng(998123));

  const activePolicy = useMemo(
    () => policies.find((p) => p.id === activePolicyId) || policies[0],
    [policies, activePolicyId]
  );

  // Save custom AI laws to localStorage
  useEffect(() => {
    try {
      const presetIds = new Set(PRESET_LAWS.map((p) => p.id));
      const custom = policies.filter((p) => !presetIds.has(p.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    } catch {
      // ignore
    }
  }, [policies]);

  // Pre-compute 36-month batch simulation runs for all laws for the Outcome Dashboard & Comparison views
  const allSimulationRuns: SimulationRunRecord[] = useMemo(() => {
    return policies.map((pol) => runBatchSimulation(pol, 36));
  }, [policies]);

  const baselineRun = useMemo(
    () => allSimulationRuns.find((r) => r.policy.id === 'law-baseline-2026') || allSimulationRuns[0],
    [allSimulationRuns]
  );

  const activeBatchRun = useMemo(
    () => allSimulationRuns.find((r) => r.policy.id === activePolicy.id) || allSimulationRuns[0],
    [allSimulationRuns, activePolicy.id]
  );

  // Reset live sandbox to Month 0 for a given policy
  const resetLiveSimulation = (policyToLoad: LawPolicy, autoPlay = false) => {
    const freshAgents = createInitialAgents(104729);
    const seed = hashPolicySeed(policyToLoad.parameters);
    rngRef.current = createRng(seed);
    const m0 = stepSimulationMonth(freshAgents, 0, PRESET_LAWS[0].parameters, createRng(104729));
    setAgents(freshAgents);
    setSimMonth(0);
    setLiveHistory([m0.telemetry]);
    setLiveEvents([]);
    setIsRunning(autoPlay);
  };

  // Step forward 1 month in the live sandbox
  const stepOneMonth = () => {
    setSimMonth((prevMonth) => {
      if (prevMonth >= 60) {
        setIsRunning(false);
        return prevMonth;
      }
      const nextM = prevMonth + 1;
      setAgents((prevAgents) => {
        const res = stepSimulationMonth(
          prevAgents,
          nextM,
          activePolicy.parameters,
          rngRef.current
        );
        setLiveHistory((h) => [...h.slice(0, prevMonth + 1), res.telemetry]);
        if (res.newEvents.length > 0) {
          setLiveEvents((ev) => [...res.newEvents, ...ev].slice(0, 30));
        }
        return res.agents;
      });
      return nextM;
    });
  };

  // Jump immediately to Month 36 in live sandbox
  const runInstant36Months = () => {
    setIsRunning(false);
    let currAgents = createInitialAgents(104729);
    const seed = hashPolicySeed(activePolicy.parameters);
    const localRng = createRng(seed);
    const m0 = stepSimulationMonth(currAgents, 0, PRESET_LAWS[0].parameters, createRng(104729));
    const hist: MonthlyTelemetry[] = [m0.telemetry];
    const evts: MicroEventLog[] = [];

    for (let m = 1; m <= 36; m++) {
      const step = stepSimulationMonth(currAgents, m, activePolicy.parameters, localRng);
      currAgents = step.agents;
      hist.push(step.telemetry);
      evts.unshift(...step.newEvents);
    }

    rngRef.current = localRng;
    setAgents(currAgents);
    setSimMonth(36);
    setLiveHistory(hist);
    setLiveEvents(evts.slice(0, 30));
  };

  // Interval loop for live agent playback
  useEffect(() => {
    if (!isRunning || activeTab !== 'simulator') return;
    const intervalMs = playbackSpeed === 4 ? 220 : playbackSpeed === 2 ? 450 : 850;
    const timer = setInterval(() => {
      setSimMonth((prevMonth) => {
        if (prevMonth >= 36) {
          setIsRunning(false);
          return prevMonth;
        }
        const nextM = prevMonth + 1;
        setAgents((prevAgents) => {
          const res = stepSimulationMonth(
            prevAgents,
            nextM,
            activePolicy.parameters,
            rngRef.current
          );
          setLiveHistory((h) => [...h.slice(0, prevMonth + 1), res.telemetry]);
          if (res.newEvents.length > 0) {
            setLiveEvents((ev) => [...res.newEvents, ...ev].slice(0, 30));
          }
          return res.agents;
        });
        return nextM;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, playbackSpeed, activeTab, activePolicy.parameters]);

  const handleSelectPolicy = (pol: LawPolicy) => {
    setActivePolicyId(pol.id);
    resetLiveSimulation(pol, true);
  };

  const handleUpdateActiveParameters = (newParams: PolicyParameters) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === activePolicy.id ? { ...p, parameters: newParams } : p))
    );
  };

  const handlePolicyCreated = (newPolicy: LawPolicy, launchSimulator: boolean) => {
    setPolicies((prev) => {
      const exists = prev.some((p) => p.id === newPolicy.id);
      if (exists) return prev;
      return [newPolicy, ...prev];
    });
    setActivePolicyId(newPolicy.id);
    resetLiveSimulation(newPolicy, true);
    if (launchSimulator) {
      setActiveTab('simulator');
    }
  };

  const handleApplyAmendment = (
    policyId: string,
    newParams: PolicyParameters,
    auditReport: PolicyAuditReport
  ) => {
    setPolicies((prev) =>
      prev.map((p) =>
        p.id === policyId
          ? {
              ...p,
              parameters: newParams,
              auditReport,
            }
          : p
      )
    );
  };

  const currentTelemetry = liveHistory[liveHistory.length - 1] || baselineRun.finalMetrics;
  const baselineCurrentMonth =
    baselineRun.history[Math.min(simMonth, baselineRun.history.length - 1)] ||
    baselineRun.finalMetrics;

  const gdpDelta = currentTelemetry.gdpIndex - baselineCurrentMonth.gdpIndex;
  const giniDelta = currentTelemetry.gini - baselineCurrentMonth.gini;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Bar Contract: Strictly 1 row, 3 zones (Brand wordmark | 4 Nav links | 1 Primary CTA) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#E2E8F0] px-6 py-3.5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#simulator"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('simulator');
            }}
            className="text-xl font-semibold tracking-tight text-[#0F172A] font-display whitespace-nowrap"
          >
            PolisLab
          </a>

          {/* Zone 2: 4 clean text navigation links */}
          <nav className="flex items-center gap-6 text-sm font-medium text-[#475569] overflow-x-auto">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                activeTab === 'simulator'
                  ? 'text-[#0F172A] font-semibold border-[#0F172A]'
                  : 'border-transparent hover:text-[#0F172A]'
              }`}
            >
              Live Simulator
            </button>
            <button
              onClick={() => setActiveTab('drafter')}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                activeTab === 'drafter'
                  ? 'text-[#0F172A] font-semibold border-[#0F172A]'
                  : 'border-transparent hover:text-[#0F172A]'
              }`}
            >
              Legislative Drafter
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                activeTab === 'dashboard'
                  ? 'text-[#0F172A] font-semibold border-[#0F172A]'
                  : 'border-transparent hover:text-[#0F172A]'
              }`}
            >
              Outcome Dashboard
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                activeTab === 'comparison'
                  ? 'text-[#0F172A] font-semibold border-[#0F172A]'
                  : 'border-transparent hover:text-[#0F172A]'
              }`}
            >
              Policy Comparison
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('drafter')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F172A] hover:bg-[#0284C7] rounded-md transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Draft New Law with AI
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container (1400px desktop presence) */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6">
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            {/* Simulator Top Control & Active Statute Strip */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 min-w-0">
                <label htmlFor="active-law-select" className="text-xs font-semibold text-[#64748B]">
                  Active Statute:
                </label>
                <select
                  id="active-law-select"
                  value={activePolicy.id}
                  onChange={(e) => {
                    const found = policies.find((p) => p.id === e.target.value);
                    if (found) handleSelectPolicy(found);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#0F172A] focus:outline-none focus:border-[#0284C7] max-w-md truncate"
                >
                  {policies.map((pol) => (
                    <option key={pol.id} value={pol.id}>
                      {pol.billCode} — {pol.title} ({pol.category})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-[#64748B] hidden xl:inline">
                  · {activePolicy.category} · {activePolicy.isAI ? 'AI Drafted' : 'Reference Model'}
                </span>
              </div>

              {/* Playback Transport Deck */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded font-mono text-xs font-semibold text-[#0F172A] tabular-nums">
                  Month {String(simMonth).padStart(2, '0')} / 36
                </div>

                <button
                  onClick={() => setIsRunning((r) => !r)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isRunning
                      ? 'bg-[#D97706] text-white hover:bg-[#B45309]'
                      : 'bg-[#0F172A] text-white hover:bg-[#1E293B]'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Run Simulation
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsRunning(false);
                    stepOneMonth();
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded text-[#0F172A] inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                  title="Step Forward 1 Month"
                >
                  <SkipForward className="w-3.5 h-3.5" /> +1 Mo
                </button>

                <button
                  onClick={runInstant36Months}
                  className="px-3 py-1.5 text-xs font-medium bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] rounded text-[#0369A1] inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                  title="Fast-forward to Month 36 equilibrium"
                >
                  <FastForward className="w-3.5 h-3.5" /> Instant 36M
                </button>

                <button
                  onClick={() => resetLiveSimulation(activePolicy, false)}
                  className="px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded text-[#475569] inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                  title="Reset Simulation to Month 0"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>

                {/* Speed Selector */}
                <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded border border-[#E2E8F0]">
                  {([1, 2, 4] as const).map((sp) => (
                    <button
                      key={sp}
                      onClick={() => setPlaybackSpeed(sp)}
                      className={`px-2 py-1 text-[11px] font-mono rounded-xs cursor-pointer ${
                        playbackSpeed === sp
                          ? 'bg-white text-[#0F172A] font-semibold shadow-2xs'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      {sp}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live 4-Metric Macro Telemetry Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
                <div className="flex items-baseline justify-between text-xs text-[#64748B] mb-1">
                  <span>Economy · Real GDP Index</span>
                  <span className="font-mono">Ref = 100.0</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-mono font-semibold text-[#0F172A] tabular-nums">
                    {currentTelemetry.gdpIndex.toFixed(1)}
                  </span>
                  <span
                    className={`text-xs font-mono font-semibold tabular-nums ${
                      gdpDelta >= 0.3
                        ? 'text-[#059669]'
                        : gdpDelta <= -0.3
                          ? 'text-[#DC2626]'
                          : 'text-[#64748B]'
                    }`}
                  >
                    {gdpDelta >= 0 ? '▲ +' : '▼ '}
                    {gdpDelta.toFixed(1)} pts
                  </span>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
                <div className="flex items-baseline justify-between text-xs text-[#64748B] mb-1">
                  <span>Fairness · Gini Coefficient</span>
                  <span className="font-mono">Bottom 40%: {currentTelemetry.bottom40SharePct.toFixed(1)}%</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-mono font-semibold text-[#0F172A] tabular-nums">
                    {currentTelemetry.gini.toFixed(3)}
                  </span>
                  <span
                    className={`text-xs font-mono font-semibold tabular-nums ${
                      giniDelta <= -0.004
                        ? 'text-[#059669]'
                        : giniDelta >= 0.004
                          ? 'text-[#DC2626]'
                          : 'text-[#64748B]'
                    }`}
                  >
                    {giniDelta <= -0.004
                      ? `● EQUALITY (${giniDelta.toFixed(3)})`
                      : giniDelta >= 0.004
                        ? `▲ INEQUALITY (+${giniDelta.toFixed(3)})`
                        : '● BASELINE PARITY'}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
                <div className="flex items-baseline justify-between text-xs text-[#64748B] mb-1">
                  <span>Compliance · Formal Sector</span>
                  <span className="font-mono">Strain: {currentTelemetry.strainedRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-mono font-semibold text-[#059669] tabular-nums">
                    {currentTelemetry.complianceRate.toFixed(1)}%
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#DC2626] tabular-nums">
                    ▲ {currentTelemetry.evasionRate.toFixed(1)}% Shadow Evasion
                  </span>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
                <div className="flex items-baseline justify-between text-xs text-[#64748B] mb-1">
                  <span>Fiscal &amp; Civic Wellbeing</span>
                  <span className="font-mono">Unemp: {currentTelemetry.unemploymentRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-mono font-semibold text-[#0F172A] tabular-nums">
                    {currentTelemetry.fiscalBalanceB >= 0 ? '+' : ''}$
                    {currentTelemetry.fiscalBalanceB.toFixed(1)}B
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#0284C7] tabular-nums">
                    Wellbeing {currentTelemetry.wellbeingIndex.toFixed(1)}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Two-Zone Sandbox Layout: Left Interactive Stage (7 cols) + Right Control & Statutory Deck (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Interactive Stage (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-[#0F172A]">
                        Agent-Based Civic Topology (240 Autonomous Households &amp; Enterprises)
                      </h2>
                      <p className="text-xs text-[#64748B]">
                        Agents dynamically evaluate tax burden, compliance friction, audit deterrence, and transfers each month
                      </p>
                    </div>

                    {/* Interactive Stratum Filter Bar */}
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F1F5F9] rounded-md">
                      <button
                        onClick={() => setStratumFilter('all')}
                        className={`px-2 py-1 text-[11px] font-medium rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                          stratumFilter === 'all'
                            ? 'bg-white text-[#0F172A] shadow-2xs font-semibold'
                            : 'text-[#475569] hover:text-[#0F172A]'
                        }`}
                      >
                        All (240)
                      </button>
                      {(Object.keys(STRATUM_META) as AgentStratum[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => setStratumFilter(st)}
                          className={`px-2 py-1 text-[11px] font-medium rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                            stratumFilter === st
                              ? 'bg-white text-[#0F172A] shadow-2xs font-semibold'
                              : 'text-[#475569] hover:text-[#0F172A]'
                          }`}
                        >
                          {STRATUM_META[st].shortLabel}
                        </button>
                      ))}
                    </div>
                  </div>

                  <CivicAgentCanvas
                    agents={agents}
                    isRunning={isRunning}
                    month={simMonth}
                    parameters={activePolicy.parameters}
                    selectedAgentId={selectedAgentId}
                    onSelectAgent={setSelectedAgentId}
                    stratumFilter={stratumFilter}
                  />
                </div>

                {/* Live Trajectory & Lorenz Curve Pair */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-6">
                  <TrajectoryChart
                    history={liveHistory}
                    baselineHistory={baselineRun.history}
                  />
                  <div className="pt-4 border-t border-[#E2E8F0]">
                    <LorenzCurveChart
                      lorenzCurve={currentTelemetry.lorenzCurve}
                      baselineLorenz={baselineRun.finalMetrics.lorenzCurve}
                      gini={currentTelemetry.gini}
                      baselineGini={baselineRun.finalMetrics.gini}
                    />
                  </div>
                </div>
              </div>

              {/* Right Control & Concept Deck (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
                  {/* Segmented Deck Mode Selector */}
                  <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg mb-5">
                    <button
                      onClick={() => setRightDeckMode('sliders')}
                      className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        rightDeckMode === 'sliders'
                          ? 'bg-white text-[#0F172A] shadow-2xs font-semibold'
                          : 'text-[#475569] hover:text-[#0F172A]'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" /> Policy Levers
                    </button>
                    <button
                      onClick={() => setRightDeckMode('clauses')}
                      className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        rightDeckMode === 'clauses'
                          ? 'bg-white text-[#0F172A] shadow-2xs font-semibold'
                          : 'text-[#475569] hover:text-[#0F172A]'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" /> Statutory Text
                    </button>
                    <button
                      onClick={() => setRightDeckMode('events')}
                      className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        rightDeckMode === 'events'
                          ? 'bg-white text-[#0F172A] shadow-2xs font-semibold'
                          : 'text-[#475569] hover:text-[#0F172A]'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" /> Agent Feed ({liveEvents.length})
                    </button>
                  </div>

                  {rightDeckMode === 'sliders' && (
                    <div className="space-y-4">
                      <div className="border-b border-[#E2E8F0] pb-3">
                        <div className="text-xs font-mono text-[#0284C7] font-semibold">
                          {activePolicy.billCode} · LIVE PARAMETER DECK
                        </div>
                        <h3 className="text-base font-semibold text-[#0F172A] font-display mt-0.5">
                          {activePolicy.title}
                        </h3>
                        <p className="text-xs text-[#64748B] mt-1">
                          Adjust any statutory lever below to immediately alter agent utility incentives in the live simulation.
                        </p>
                      </div>

                      <div className="space-y-3.5">
                        <ParameterSlider
                          label="Marginal Tax Rate Delta (Capital & High-Bracket)"
                          value={activePolicy.parameters.taxRateDelta}
                          min={-20}
                          max={30}
                          step={1}
                          unit="%"
                          prefix={activePolicy.parameters.taxRateDelta > 0 ? '+' : ''}
                          onChange={(v) =>
                            handleUpdateActiveParameters({
                              ...activePolicy.parameters,
                              taxRateDelta: v,
                            })
                          }
                        />
                        <ParameterSlider
                          label="Universal Citizen Monthly Transfer"
                          value={activePolicy.parameters.universalTransferMonthly}
                          min={0}
                          max={2000}
                          step={25}
                          unit="/mo"
                          prefix="$"
                          onChange={(v) =>
                            handleUpdateActiveParameters({
                              ...activePolicy.parameters,
                              universalTransferMonthly: v,
                            })
                          }
                        />
                        <ParameterSlider
                          label="Enforcement & Algorithmic Audit Intensity"
                          value={activePolicy.parameters.enforcementIntensity}
                          min={5}
                          max={95}
                          step={1}
                          unit="/100"
                          onChange={(v) =>
                            handleUpdateActiveParameters({
                              ...activePolicy.parameters,
                              enforcementIntensity: v,
                            })
                          }
                        />
                        <ParameterSlider
                          label="Non-Compliance Penalty Severity"
                          value={activePolicy.parameters.penaltySeverity}
                          min={10}
                          max={95}
                          step={1}
                          unit="/100"
                          onChange={(v) =>
                            handleUpdateActiveParameters({
                              ...activePolicy.parameters,
                              penaltySeverity: v,
                            })
                          }
                        />
                        <ParameterSlider
                          label="Administrative Compliance Friction (Paperwork)"
                          value={activePolicy.parameters.complianceFriction}
                          min={5}
                          max={90}
                          step={1}
                          unit="/100"
                          onChange={(v) =>
                            handleUpdateActiveParameters({
                              ...activePolicy.parameters,
                              complianceFriction: v,
                            })
                          }
                        />
                        <ParameterSlider
                          label="R&D / Green Innovation Tax Credit"
                          value={activePolicy.parameters.innovationIncentive}
                          min={0}
                          max={95}
                          step={1}
                          unit="/100"
                          onChange={(v) =>
                            handleUpdateActiveParameters({
                              ...activePolicy.parameters,
                              innovationIncentive: v,
                            })
                          }
                        />
                        <ParameterSlider
                          label="Public Infrastructure & Service Reinvestment"
                          value={activePolicy.parameters.publicServiceReinvestment}
                          min={10}
                          max={95}
                          step={1}
                          unit="%"
                          onChange={(v) =>
                            handleUpdateActiveParameters({
                              ...activePolicy.parameters,
                              publicServiceReinvestment: v,
                            })
                          }
                        />
                        <ParameterSlider
                          label="Statutory Minimum Wage Floor Index"
                          value={activePolicy.parameters.minimumWageFloorIndex}
                          min={70}
                          max={145}
                          step={1}
                          unit=" idx"
                          onChange={(v) =>
                            handleUpdateActiveParameters({
                              ...activePolicy.parameters,
                              minimumWageFloorIndex: v,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {rightDeckMode === 'clauses' && (
                    <div className="space-y-4">
                      <div className="border-b border-[#E2E8F0] pb-3">
                        <div className="text-xs font-mono text-[#0284C7] font-semibold">
                          {activePolicy.billCode} · STATUTORY CODEX
                        </div>
                        <h3 className="text-base font-semibold text-[#0F172A] font-display mt-0.5">
                          {activePolicy.title}
                        </h3>
                        <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                          {activePolicy.preamble}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {activePolicy.clauses.map((cl, i) => (
                          <div
                            key={i}
                            className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded space-y-1.5"
                          >
                            <div className="text-xs font-mono font-semibold text-[#0F172A]">
                              {cl.section} — {cl.heading}
                            </div>
                            <p className="text-xs text-[#334155] leading-relaxed">
                              {cl.statuteText}
                            </p>
                            <div className="text-[11px] text-[#0284C7] pt-1 border-t border-[#E2E8F0]">
                              Mechanism: {cl.behavioralMechanism}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {rightDeckMode === 'events' && (
                    <div className="space-y-3">
                      <div className="border-b border-[#E2E8F0] pb-3">
                        <h3 className="text-sm font-semibold text-[#0F172A]">
                          Micro-Agent Behavioral Decisions Log
                        </h3>
                        <p className="text-xs text-[#64748B]">
                          Real-time audit enforcement, shadow sector transitions, and regulatory strain events
                        </p>
                      </div>

                      {liveEvents.length === 0 ? (
                        <div className="py-10 text-center text-xs text-[#64748B]">
                          Run or step the simulation forward to observe micro-agent compliance and audit events.
                        </div>
                      ) : (
                        <div className="divide-y divide-[#E2E8F0] max-h-[420px] overflow-y-auto pr-1">
                          {liveEvents.map((ev) => (
                            <div key={ev.id} className="py-2.5 text-xs">
                              <div className="flex items-center justify-between font-mono text-[11px] mb-0.5">
                                <span
                                  className={
                                    ev.type === 'audit'
                                      ? 'text-[#0284C7] font-semibold'
                                      : ev.type === 'evasion'
                                        ? 'text-[#DC2626] font-semibold'
                                        : 'text-[#D97706] font-semibold'
                                  }
                                >
                                  {ev.type === 'audit'
                                    ? '◎ AUDIT ENFORCEMENT'
                                    : ev.type === 'evasion'
                                      ? '▲ SHADOW EXIT'
                                      : '◆ REGULATORY STRAIN'}
                                </span>
                                <span className="text-[#64748B]">Month {ev.month}</span>
                              </div>
                              <p className="text-[#334155] leading-relaxed">{ev.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Live Stratum Snapshot Compact Table */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
                  <div className="flex items-baseline justify-between mb-3">
                    <h3 className="text-xs font-semibold text-[#0F172A]">
                      Live Stratum Telemetry (Month {simMonth})
                    </h3>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="text-xs font-medium text-[#0284C7] hover:underline cursor-pointer"
                    >
                      Open Full Outcome Dashboard →
                    </button>
                  </div>

                  <div className="divide-y divide-[#E2E8F0] text-xs">
                    {currentTelemetry.strata.map((st) => (
                      <div
                        key={st.stratum}
                        className="py-2 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-medium text-[#0F172A]">{st.label}</div>
                          <div className="text-[11px] text-[#64748B] font-mono tabular-nums">
                            Comp: {st.complianceRate.toFixed(0)}% · Evasion: {st.evasionRate.toFixed(0)}%
                          </div>
                        </div>
                        <div className="text-right font-mono tabular-nums">
                          <div className="font-semibold text-[#0F172A]">
                            ${st.avgMonthlyIncome.toLocaleString()}/mo
                          </div>
                          <div
                            className={`text-[11px] ${
                              st.incomeDeltaPct >= 0.5
                                ? 'text-[#059669]'
                                : st.incomeDeltaPct <= -0.5
                                  ? 'text-[#DC2626]'
                                  : 'text-[#64748B]'
                            }`}
                          >
                            {st.incomeDeltaPct >= 0 ? '▲ +' : '▼ '}
                            {st.incomeDeltaPct.toFixed(1)}% vs ref
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'drafter' && (
          <LegislativeDrafterView
            policies={policies}
            activePolicy={activePolicy}
            onSelectPolicy={handleSelectPolicy}
            onPolicyCreated={handlePolicyCreated}
            onUpdateActiveParameters={handleUpdateActiveParameters}
          />
        )}

        {activeTab === 'dashboard' && (
          <OutcomeDashboardView
            runs={allSimulationRuns}
            activeRun={activeBatchRun}
            baselineRun={baselineRun}
            onSelectPolicyId={(id) => {
              const found = policies.find((p) => p.id === id);
              if (found) setActivePolicyId(found.id);
            }}
            onApplyAmendment={handleApplyAmendment}
          />
        )}

        {activeTab === 'comparison' && (
          <PolicyComparisonView
            runs={allSimulationRuns}
            onLoadIntoSimulator={(id) => {
              const found = policies.find((p) => p.id === id);
              if (found) {
                handleSelectPolicy(found);
                setActiveTab('simulator');
              }
            }}
          />
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white px-6 py-4 mt-12">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748B]">
          <div>
            PolisLab Legislative &amp; Multi-Agent Socio-Economic Sandbox · 240-Agent Micro-Simulation Engine
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('simulator')}
              className="hover:text-[#0F172A] cursor-pointer"
            >
              Live Sandbox
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('drafter')}
              className="hover:text-[#0F172A] cursor-pointer"
            >
              AI Legislative Counsel
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="hover:text-[#0F172A] cursor-pointer"
            >
              Outcome Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
