import React, { useState } from 'react';
import { Sparkles, Check, ArrowUpRight, AlertTriangle } from 'lucide-react';
import {
  LawPolicy,
  PolicyAuditReport,
  PolicyParameters,
  SimulationRunRecord,
} from '../types/policy';
import {
  LorenzCurveChart,
  MultiPolicyOutcomeChart,
  TrajectoryChart,
} from './SimulationCharts';

interface OutcomeDashboardViewProps {
  runs: SimulationRunRecord[];
  activeRun: SimulationRunRecord;
  baselineRun: SimulationRunRecord;
  onSelectPolicyId: (id: string) => void;
  onApplyAmendment: (policyId: string, newParams: PolicyParameters, audit: PolicyAuditReport) => void;
}

export const OutcomeDashboardView: React.FC<OutcomeDashboardViewProps> = ({
  runs,
  activeRun,
  baselineRun,
  onSelectPolicyId,
  onApplyAmendment,
}) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [localAudit, setLocalAudit] = useState<PolicyAuditReport | null>(
    activeRun.policy.auditReport || null
  );
  const [amendmentApplied, setAmendmentApplied] = useState(false);

  const fm = activeRun.finalMetrics;
  const bm = baselineRun.finalMetrics;

  const handleRunEmpiricalAudit = async () => {
    setIsAuditing(true);
    setAuditError(null);
    setAmendmentApplied(false);

    try {
      const res = await fetch('/api/policies/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policy: activeRun.policy,
          finalMetrics: fm,
          baselineMetrics: bm,
          stratumBreakdown: fm.strata,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate empirical audit.');
      }
      setLocalAudit(data);
    } catch (err: any) {
      setAuditError(err.message || 'Unable to complete empirical policy audit.');
    } finally {
      setIsAuditing(false);
    }
  };

  const activeAudit = localAudit || activeRun.policy.auditReport;

  const gdpDelta = fm.gdpIndex - bm.gdpIndex;
  const giniDelta = fm.gini - bm.gini;
  const compDelta = fm.complianceRate - bm.complianceRate;

  return (
    <div className="space-y-8">
      {/* Section 1: Cross-Law Comparative Outcome Bars */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-4">
          <div>
            <div className="text-xs text-[#64748B]">
              Comparative Policy Telemetry · 36-Month Horizon (240-Agent Cohort)
            </div>
            <h1 className="text-2xl font-semibold text-[#0F172A] font-display">
              Legislative Outcome Dashboard
            </h1>
          </div>

          {/* Law Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#E2E8F0]/70 rounded-lg">
            {runs.map((r) => {
              const active = r.policy.id === activeRun.policy.id;
              return (
                <button
                  key={r.policy.id}
                  onClick={() => {
                    onSelectPolicyId(r.policy.id);
                    setLocalAudit(r.policy.auditReport || null);
                    setAmendmentApplied(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-[#0F172A] shadow-2xs font-semibold'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  {r.policy.billCode}
                </button>
              );
            })}
          </div>
        </div>

        <MultiPolicyOutcomeChart
          runs={runs}
          selectedPolicyId={activeRun.policy.id}
          onSelectPolicy={(id) => {
            onSelectPolicyId(id);
            const found = runs.find((r) => r.policy.id === id);
            setLocalAudit(found?.policy.auditReport || null);
            setAmendmentApplied(false);
          }}
        />
      </section>

      {/* Section 2: Active Law Deep-Dive KPI Strip & Trajectory + Lorenz Curve */}
      <section className="bg-white border border-[#E2E8F0] rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2E8F0] pb-5 mb-6">
          <div>
            <div className="text-xs text-[#64748B] mb-1">
              Selected Statute Deep-Dive · {activeRun.policy.billCode} · {activeRun.policy.category}
            </div>
            <h2 className="text-xl font-semibold text-[#0F172A] font-display">
              {activeRun.policy.title}
            </h2>
            <p className="text-xs text-[#475569] mt-1 max-w-3xl leading-relaxed">
              {activeRun.policy.preamble}
            </p>
          </div>

          <button
            onClick={handleRunEmpiricalAudit}
            disabled={isAuditing}
            className="px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] disabled:bg-[#94A3B8] text-white text-xs font-semibold rounded transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isAuditing
              ? 'Auditing 36-Month Telemetry...'
              : 'AI Empirical Audit & Propose Amendment'}
          </button>
        </div>

        {/* 5-Column Key Outcome Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pb-6 mb-6 border-b border-[#E2E8F0]">
          <div>
            <div className="text-xs text-[#64748B] mb-1">Real GDP Index (M36)</div>
            <div className="text-2xl font-mono font-semibold text-[#0F172A] tabular-nums">
              {fm.gdpIndex.toFixed(1)}
            </div>
            <div
              className={`text-xs font-mono mt-0.5 tabular-nums ${
                gdpDelta >= 0.4
                  ? 'text-[#059669]'
                  : gdpDelta <= -0.4
                    ? 'text-[#DC2626]'
                    : 'text-[#64748B]'
              }`}
            >
              {gdpDelta >= 0 ? '▲ +' : '▼ '}
              {gdpDelta.toFixed(1)} pts vs Baseline
            </div>
          </div>

          <div>
            <div className="text-xs text-[#64748B] mb-1">Gini Inequality Index</div>
            <div className="text-2xl font-mono font-semibold text-[#0F172A] tabular-nums">
              {fm.gini.toFixed(3)}
            </div>
            <div
              className={`text-xs font-mono mt-0.5 tabular-nums ${
                giniDelta <= -0.005
                  ? 'text-[#059669]'
                  : giniDelta >= 0.005
                    ? 'text-[#DC2626]'
                    : 'text-[#64748B]'
              }`}
            >
              {giniDelta <= -0.005
                ? `● FAIRER (${giniDelta.toFixed(3)})`
                : giniDelta >= 0.005
                  ? `▲ UNEQUAL (+${giniDelta.toFixed(3)})`
                  : '● PARITY WITH REF'}
            </div>
          </div>

          <div>
            <div className="text-xs text-[#64748B] mb-1">Voluntary Compliance</div>
            <div className="text-2xl font-mono font-semibold text-[#0F172A] tabular-nums">
              {fm.complianceRate.toFixed(1)}%
            </div>
            <div
              className={`text-xs font-mono mt-0.5 tabular-nums ${
                compDelta >= 0.5
                  ? 'text-[#059669]'
                  : compDelta <= -0.5
                    ? 'text-[#DC2626]'
                    : 'text-[#64748B]'
              }`}
            >
              Shadow Evasion: {fm.evasionRate.toFixed(1)}%
            </div>
          </div>

          <div>
            <div className="text-xs text-[#64748B] mb-1">Net Fiscal Balance</div>
            <div className="text-2xl font-mono font-semibold text-[#0F172A] tabular-nums">
              {fm.fiscalBalanceB >= 0 ? '+' : ''}${fm.fiscalBalanceB.toFixed(1)}B
            </div>
            <div className="text-xs font-mono text-[#64748B] mt-0.5 tabular-nums">
              {fm.fiscalBalanceB >= 0 ? '● SURPLUS / BALANCED' : '◆ DEFICIT FINANCED'}
            </div>
          </div>

          <div>
            <div className="text-xs text-[#64748B] mb-1">Civic Wellbeing Index</div>
            <div className="text-2xl font-mono font-semibold text-[#0F172A] tabular-nums">
              {fm.wellbeingIndex.toFixed(1)}
              <span className="text-sm text-[#64748B] font-normal">/100</span>
            </div>
            <div className="text-xs font-mono text-[#64748B] mt-0.5 tabular-nums">
              Unemployment: {fm.unemploymentRate.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Trajectory & Lorenz Curve Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="text-xs font-semibold text-[#0F172A] mb-2">
              36-Month Multi-Metric Time-Series Trajectory (Dashed = Baseline GDP)
            </div>
            <TrajectoryChart
              history={activeRun.history}
              baselineHistory={baselineRun.history}
            />
          </div>

          <div className="lg:col-span-5">
            <LorenzCurveChart
              lorenzCurve={fm.lorenzCurve}
              baselineLorenz={bm.lorenzCurve}
              gini={fm.gini}
              baselineGini={bm.gini}
            />
          </div>
        </div>

        {/* AI Empirical Audit Report & Statutory Amendment Proposal (if generated) */}
        {auditError && (
          <div className="mt-6 p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded text-xs text-[#991B1B] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            <span>{auditError}</span>
          </div>
        )}

        {activeAudit && (
          <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-xs font-mono text-[#0284C7] font-semibold">
                  AI EMPIRICAL AUDIT &amp; STATUTORY RECALIBRATION
                </div>
                <h3 className="text-base font-semibold text-[#0F172A] mt-0.5">
                  {activeAudit.verdictHeadline}
                </h3>
              </div>

              <button
                onClick={() => {
                  onApplyAmendment(
                    activeRun.policy.id,
                    activeAudit.recommendedParameters,
                    activeAudit
                  );
                  setAmendmentApplied(true);
                }}
                className="px-3.5 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold rounded transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                {amendmentApplied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Amendment Adopted &amp; Re-Simulated
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-3.5 h-3.5" /> Adopt {activeAudit.amendmentTitle}
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                <div className="font-semibold text-[#0F172A] mb-1">01. Economic Diagnosis</div>
                <p className="text-[#475569] leading-relaxed">{activeAudit.economicDiagnosis}</p>
              </div>
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                <div className="font-semibold text-[#0F172A] mb-1">02. Fairness Diagnosis</div>
                <p className="text-[#475569] leading-relaxed">{activeAudit.fairnessDiagnosis}</p>
              </div>
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                <div className="font-semibold text-[#0F172A] mb-1">03. Compliance Diagnosis</div>
                <p className="text-[#475569] leading-relaxed">{activeAudit.complianceDiagnosis}</p>
              </div>
            </div>

            <div className="p-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded text-xs text-[#0C4A6E]">
              <span className="font-semibold">{activeAudit.amendmentTitle}: </span>
              {activeAudit.amendmentRationale}
            </div>
          </div>
        )}
      </section>

      {/* Section 3: Socio-Economic Stratum Distributional Breakdown Table */}
      <section className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">
              Distributional Impact by Socio-Economic Agent Stratum
            </h3>
            <p className="text-xs text-[#64748B]">
              Disaggregated 36-month outcomes across all 5 household and enterprise cohorts
            </p>
          </div>
          <span className="text-xs font-mono text-[#64748B]">N = 240 Autonomous Agents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#475569]">
                <th className="py-3 px-6">Agent Cohort / Stratum</th>
                <th className="py-3 px-4 text-right">Pop. Share</th>
                <th className="py-3 px-4 text-right">Avg Net Income</th>
                <th className="py-3 px-4 text-right">Income vs Ref</th>
                <th className="py-3 px-4 text-right">Formal Compliance</th>
                <th className="py-3 px-4 text-right">Reg. Strain</th>
                <th className="py-3 px-4 text-right">Shadow Evasion</th>
                <th className="py-3 px-6 text-right">Wellbeing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {fm.strata.map((st) => {
                return (
                  <tr key={st.stratum} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-6 font-medium text-[#0F172A]">{st.label}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#475569] tabular-nums">
                      {st.populationShare.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-[#0F172A] tabular-nums">
                      ${st.avgMonthlyIncome.toLocaleString()}/mo
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-semibold tabular-nums ${
                        st.incomeDeltaPct >= 1.0
                          ? 'text-[#059669]'
                          : st.incomeDeltaPct <= -1.0
                            ? 'text-[#DC2626]'
                            : 'text-[#64748B]'
                      }`}
                    >
                      {st.incomeDeltaPct >= 0 ? '▲ +' : '▼ '}
                      {st.incomeDeltaPct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#059669] tabular-nums">
                      {st.complianceRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#D97706] tabular-nums">
                      {st.strainedRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#DC2626] tabular-nums">
                      {st.evasionRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-medium text-[#0F172A] tabular-nums">
                      {st.avgWellbeing.toFixed(1)} / 100
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
