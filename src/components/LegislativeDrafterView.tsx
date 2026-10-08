import React, { useState } from 'react';
import { Sparkles, FileText, Play, Sliders, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LawPolicy, PolicyCategory, PolicyParameters } from '../types/policy';

interface LegislativeDrafterViewProps {
  policies: LawPolicy[];
  activePolicy: LawPolicy;
  onSelectPolicy: (policy: LawPolicy) => void;
  onPolicyCreated: (newPolicy: LawPolicy, launchSimulator: boolean) => void;
  onUpdateActiveParameters: (params: PolicyParameters) => void;
}

const SAMPLE_PROMPTS = [
  {
    label: '4-Day Workweek & Automation Credit',
    category: 'Labor & Automation' as PolicyCategory,
    prompt:
      'Establish a statutory 32-hour standard workweek with no reduction in base pay for wage workers, offset by a 75-point AI/robotics adoption tax credit for SMEs and corporations and streamlined digital payroll filing.',
  },
  {
    label: 'Urban Land-Value & Vacancy Surtax',
    category: 'Housing & Urban' as PolicyCategory,
    prompt:
      'Replace municipal commercial surtaxes with a progressive tax on speculative vacant land and high-capital real estate holdings, routing 85% of revenue into a $650/month household housing dividend and transit infrastructure.',
  },
  {
    label: 'Sovereign Data Royalty & Zero-Tax Floor',
    category: 'Digital & AI Governance' as PolicyCategory,
    prompt:
      'Enact a 14% royalty levy on large-scale commercial AI model training and automated data monetization, funding a $920/month Universal Data Dividend while lowering compliance paperwork for small local businesses.',
  },
  {
    label: 'Negative Income Tax & Welfare Simplification',
    category: 'Public Health & Welfare' as PolicyCategory,
    prompt:
      'Consolidate fragmented welfare bureaucracies into a single automated Negative Income Tax providing $780/month to low-income and retiree households, cutting administrative compliance friction to 15 while maintaining balanced enforcement.',
  },
];

export const LegislativeDrafterView: React.FC<LegislativeDrafterViewProps> = ({
  policies,
  activePolicy,
  onSelectPolicy,
  onPolicyCreated,
  onUpdateActiveParameters,
}) => {
  const [prompt, setPrompt] = useState('');
  const [focusArea, setFocusArea] = useState<PolicyCategory>('Labor & Automation');
  const [jurisdictionScale, setJurisdictionScale] = useState('National Mixed-Market Economy (240-Agent Cohort)');
  const [isDrafting, setIsDrafting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justDraftedId, setJustDraftedId] = useState<string | null>(null);

  const handleDraftWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isDrafting) return;

    setIsDrafting(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/policies/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          focusArea,
          jurisdictionScale,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to draft hypothetical statute.');
      }

      const newLaw: LawPolicy = {
        id: `law-ai-${Date.now()}`,
        billCode: data.billCode || `HB-2026-${Math.floor(500 + Math.random() * 400)}`,
        title: data.title || 'Hypothetical Statutory Reform Act',
        category: data.category || focusArea,
        draftedAt: 'AI Legislative Counsel',
        isAI: true,
        preamble: data.preamble,
        clauses: data.clauses || [],
        parameters: {
          taxRateDelta: Math.max(-20, Math.min(30, Number(data.parameters?.taxRateDelta ?? 0))),
          universalTransferMonthly: Math.max(
            0,
            Math.min(2000, Number(data.parameters?.universalTransferMonthly ?? 300))
          ),
          enforcementIntensity: Math.max(
            5,
            Math.min(95, Number(data.parameters?.enforcementIntensity ?? 50))
          ),
          penaltySeverity: Math.max(10, Math.min(95, Number(data.parameters?.penaltySeverity ?? 50))),
          complianceFriction: Math.max(
            5,
            Math.min(90, Number(data.parameters?.complianceFriction ?? 35))
          ),
          innovationIncentive: Math.max(
            0,
            Math.min(95, Number(data.parameters?.innovationIncentive ?? 45))
          ),
          publicServiceReinvestment: Math.max(
            10,
            Math.min(95, Number(data.parameters?.publicServiceReinvestment ?? 50))
          ),
          minimumWageFloorIndex: Math.max(
            70,
            Math.min(145, Number(data.parameters?.minimumWageFloorIndex ?? 100))
          ),
        },
        hypotheses: data.hypotheses || {
          economyHypothesis: 'Projected shift in aggregate output based on tax and innovation incentives.',
          fairnessHypothesis: 'Projected shift in Gini coefficient driven by transfer and wage schedules.',
          complianceHypothesis: 'Projected shift in voluntary compliance vs informal sector drift.',
          unintendedRisk: 'Potential secondary friction across sensitive agent strata.',
        },
      };

      setJustDraftedId(newLaw.id);
      onPolicyCreated(newLaw, false);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while drafting the statute.');
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: AI Legislative Counsel Drafting Desk (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6">
          <div className="border-b border-[#E2E8F0] pb-4 mb-5">
            <div className="text-xs text-[#64748B] mb-1">
              01. Generative Statutory Synthesis · Gemini Legislative Counsel
            </div>
            <h2 className="text-xl font-semibold text-[#0F172A] font-display">
              Draft Hypothetical Law or Policy
            </h2>
            <p className="text-xs text-[#475569] mt-1 leading-relaxed">
              Describe any socio-economic reform, tax architecture, regulatory mandate, or universal dividend. AI will synthesize formal statutory clauses and calibrate the 8 macroeconomic simulation levers.
            </p>
          </div>

          <form onSubmit={handleDraftWithAI} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Quick-Fill Policy Scenarios
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_PROMPTS.map((sp) => (
                  <button
                    key={sp.label}
                    type="button"
                    onClick={() => {
                      setPrompt(sp.prompt);
                      setFocusArea(sp.category);
                    }}
                    className="text-left px-3 py-2 text-xs bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded text-[#0F172A] font-medium transition-colors truncate"
                    title={sp.prompt}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="policy-category"
                  className="block text-xs font-semibold text-[#0F172A] mb-1"
                >
                  Legislative Domain
                </label>
                <select
                  id="policy-category"
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value as PolicyCategory)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                >
                  <option value="Fiscal & Taxation">Fiscal &amp; Taxation</option>
                  <option value="Labor & Automation">Labor &amp; Automation</option>
                  <option value="Environmental & Carbon">Environmental &amp; Carbon</option>
                  <option value="Housing & Urban">Housing &amp; Urban</option>
                  <option value="Public Health & Welfare">Public Health &amp; Welfare</option>
                  <option value="Digital & AI Governance">Digital &amp; AI Governance</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="jurisdiction-scale"
                  className="block text-xs font-semibold text-[#0F172A] mb-1"
                >
                  Institutional Context
                </label>
                <select
                  id="jurisdiction-scale"
                  value={jurisdictionScale}
                  onChange={(e) => setJurisdictionScale(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                >
                  <option value="National Mixed-Market Economy (240-Agent Cohort)">
                    National Mixed-Market Economy
                  </option>
                  <option value="High-Automation Metropolitan Corridor">
                    High-Automation Metro Corridor
                  </option>
                  <option value="Post-Industrial Transition Region">
                    Post-Industrial Transition Region
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="policy-prompt"
                className="block text-xs font-semibold text-[#0F172A] mb-1"
              >
                Legislative Directive &amp; Mechanism Description
              </label>
              <textarea
                id="policy-prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Enact a 15% tax on automated warehouse robotics and high-frequency algorithmic trading to fund a $750/month universal basic dividend and public vocational retraining..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7] leading-relaxed"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded text-xs text-[#991B1B] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isDrafting || !prompt.trim()}
              className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-[#1E293B] disabled:bg-[#94A3B8] text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              {isDrafting
                ? 'Synthesizing Statutory Clauses & Calibrating Parameters...'
                : 'Draft Hypothetical Statute & Run 36-Month Forecast'}
            </button>
          </form>
        </div>

        {/* Statutory Docket Library */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6">
          <div className="text-xs font-semibold text-[#0F172A] mb-3">
            02. Statutory Docket ({policies.length} Laws Available)
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {policies.map((pol) => {
              const isSelected = pol.id === activePolicy.id;
              return (
                <button
                  key={pol.id}
                  onClick={() => onSelectPolicy(pol)}
                  className={`w-full text-left py-3 px-3 transition-colors rounded ${
                    isSelected ? 'bg-[#F1F5F9]' : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-[#64748B] mb-0.5">
                    <span className="font-mono font-medium text-[#0284C7]">{pol.billCode}</span>
                    <span>
                      {pol.category} · {pol.isAI ? 'AI Drafted' : 'Reference Model'}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#0F172A]">{pol.title}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Full Statutory Codex & Parameter Calibration (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6">
          {/* Header of Active Bill */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2E8F0] pb-5 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1.5">
                <span className="font-mono font-semibold text-[#0284C7]">
                  {activePolicy.billCode}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activePolicy.category}</span>
                <span aria-hidden="true">·</span>
                <span>{activePolicy.draftedAt}</span>
                {justDraftedId === activePolicy.id && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#059669] font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Newly Drafted &amp; Simulated
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-2xl font-semibold text-[#0F172A] font-display text-balance">
                {activePolicy.title}
              </h1>
            </div>

            <button
              onClick={() => onPolicyCreated(activePolicy, true)}
              className="px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold rounded transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Simulate in Live Agent Sandbox
            </button>
          </div>

          {/* Enacting Preamble */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-[#64748B] mb-1.5">
              Enacting Clause &amp; Executive Digest
            </div>
            <p className="text-sm text-[#1E293B] leading-relaxed bg-[#F8FAFC] border-l-2 border-[#0F172A] pl-4 py-2.5">
              {activePolicy.preamble}
            </p>
          </div>

          {/* Statutory Clauses */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] mb-3">
              <FileText className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Statutory Articles &amp; Micro-Agent Behavioral Mechanisms</span>
            </div>
            <div className="space-y-4">
              {activePolicy.clauses.map((clause, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-2"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-mono font-semibold text-[#0F172A]">
                      {clause.section} — {clause.heading}
                    </span>
                  </div>
                  <p className="text-xs text-[#334155] leading-relaxed">{clause.statuteText}</p>
                  <div className="pt-1.5 border-t border-[#E2E8F0] text-[11px] text-[#475569]">
                    <span className="font-semibold text-[#0284C7]">Agent Behavioral Mechanism: </span>
                    {clause.behavioralMechanism}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Theoretical Hypotheses vs Unintended Risk */}
          <div className="mb-8 pt-6 border-t border-[#E2E8F0]">
            <div className="text-xs font-semibold text-[#0F172A] mb-3">
              Legislative Counsel Pre-Simulation Hypotheses
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 border border-[#E2E8F0] rounded">
                <div className="font-semibold text-[#0284C7] mb-1">Macroeconomic Output</div>
                <p className="text-[#475569] leading-relaxed">
                  {activePolicy.hypotheses.economyHypothesis}
                </p>
              </div>
              <div className="p-3.5 border border-[#E2E8F0] rounded">
                <div className="font-semibold text-[#059669] mb-1">Distributional Fairness</div>
                <p className="text-[#475569] leading-relaxed">
                  {activePolicy.hypotheses.fairnessHypothesis}
                </p>
              </div>
              <div className="p-3.5 border border-[#E2E8F0] rounded">
                <div className="font-semibold text-[#D97706] mb-1">Compliance &amp; Deterrence</div>
                <p className="text-[#475569] leading-relaxed">
                  {activePolicy.hypotheses.complianceHypothesis}
                </p>
              </div>
              <div className="p-3.5 border border-[#FECACA] bg-[#FEF2F2]/40 rounded">
                <div className="font-semibold text-[#DC2626] mb-1">Second-Order Unintended Risk</div>
                <p className="text-[#7F1D1D] leading-relaxed">
                  {activePolicy.hypotheses.unintendedRisk}
                </p>
              </div>
            </div>
          </div>

          {/* Quantitative Parameter Fine-Tuning Deck */}
          <div className="pt-6 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                <Sliders className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Calibrated Statutory Simulation Levers (Adjust to Re-Simulate)</span>
              </div>
              <span className="text-[11px] text-[#64748B]">
                Changes immediately recompute 36-month outcomes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <ParameterSlider
                label="Marginal Tax Rate Delta"
                value={activePolicy.parameters.taxRateDelta}
                min={-20}
                max={30}
                step={1}
                unit="%"
                prefix={activePolicy.parameters.taxRateDelta > 0 ? '+' : ''}
                onChange={(v) =>
                  onUpdateActiveParameters({ ...activePolicy.parameters, taxRateDelta: v })
                }
              />
              <ParameterSlider
                label="Universal Monthly Dividend"
                value={activePolicy.parameters.universalTransferMonthly}
                min={0}
                max={2000}
                step={25}
                unit="/mo"
                prefix="$"
                onChange={(v) =>
                  onUpdateActiveParameters({
                    ...activePolicy.parameters,
                    universalTransferMonthly: v,
                  })
                }
              />
              <ParameterSlider
                label="Enforcement Audit Intensity"
                value={activePolicy.parameters.enforcementIntensity}
                min={5}
                max={95}
                step={1}
                unit="/100"
                onChange={(v) =>
                  onUpdateActiveParameters({
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
                  onUpdateActiveParameters({ ...activePolicy.parameters, penaltySeverity: v })
                }
              />
              <ParameterSlider
                label="Administrative Compliance Friction"
                value={activePolicy.parameters.complianceFriction}
                min={5}
                max={90}
                step={1}
                unit="/100"
                onChange={(v) =>
                  onUpdateActiveParameters({ ...activePolicy.parameters, complianceFriction: v })
                }
              />
              <ParameterSlider
                label="R&D / Green Innovation Credit"
                value={activePolicy.parameters.innovationIncentive}
                min={0}
                max={95}
                step={1}
                unit="/100"
                onChange={(v) =>
                  onUpdateActiveParameters({ ...activePolicy.parameters, innovationIncentive: v })
                }
              />
              <ParameterSlider
                label="Public Service Reinvestment"
                value={activePolicy.parameters.publicServiceReinvestment}
                min={10}
                max={95}
                step={1}
                unit="%"
                onChange={(v) =>
                  onUpdateActiveParameters({
                    ...activePolicy.parameters,
                    publicServiceReinvestment: v,
                  })
                }
              />
              <ParameterSlider
                label="Statutory Wage Floor Index"
                value={activePolicy.parameters.minimumWageFloorIndex}
                min={70}
                max={145}
                step={1}
                unit=" idx"
                onChange={(v) =>
                  onUpdateActiveParameters({
                    ...activePolicy.parameters,
                    minimumWageFloorIndex: v,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  prefix?: string;
  onChange: (val: number) => void;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  prefix = '',
  onChange,
}) => {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs mb-1">
        <span className="font-medium text-[#334155]">{label}</span>
        <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
          {prefix}
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full precision-slider"
      />
    </div>
  );
};
