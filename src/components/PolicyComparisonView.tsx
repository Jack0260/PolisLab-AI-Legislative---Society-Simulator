import React, { useState } from 'react';
import { SimulationRunRecord } from '../types/policy';
import { Play, Download } from 'lucide-react';

interface PolicyComparisonViewProps {
  runs: SimulationRunRecord[];
  onLoadIntoSimulator: (policyId: string) => void;
}

export const PolicyComparisonView: React.FC<PolicyComparisonViewProps> = ({
  runs,
  onLoadIntoSimulator,
}) => {
  const [lawAId, setLawAId] = useState<string>(runs[1]?.policy.id || runs[0]?.policy.id);
  const [lawBId, setLawBId] = useState<string>(runs[2]?.policy.id || runs[0]?.policy.id);
  const [sortBy, setSortBy] = useState<'gdp' | 'gini' | 'compliance' | 'wellbeing'>('gdp');

  const runA = runs.find((r) => r.policy.id === lawAId) || runs[0];
  const runB = runs.find((r) => r.policy.id === lawBId) || runs[0];

  const sortedRuns = [...runs].sort((a, b) => {
    if (sortBy === 'gdp') return b.finalMetrics.gdpIndex - a.finalMetrics.gdpIndex;
    if (sortBy === 'gini') return a.finalMetrics.gini - b.finalMetrics.gini; // Lower Gini is fairer
    if (sortBy === 'compliance') return b.finalMetrics.complianceRate - a.finalMetrics.complianceRate;
    return b.finalMetrics.wellbeingIndex - a.finalMetrics.wellbeingIndex;
  });

  const handleExportCSV = () => {
    const headers = [
      'Bill Code',
      'Title',
      'Category',
      'Tax Rate Delta (%)',
      'Universal Transfer ($/mo)',
      'Enforcement (0-100)',
      'Friction (0-100)',
      'Real GDP Index (M36)',
      'Gini Coefficient (M36)',
      'Bottom 40% Income Share (%)',
      'Voluntary Compliance (%)',
      'Shadow Evasion (%)',
      'Fiscal Balance ($B)',
      'Wellbeing Index',
    ];
    const rows = sortedRuns.map((r) => [
      r.policy.billCode,
      `"${r.policy.title.replace(/"/g, '""')}"`,
      r.policy.category,
      r.policy.parameters.taxRateDelta,
      r.policy.parameters.universalTransferMonthly,
      r.policy.parameters.enforcementIntensity,
      r.policy.parameters.complianceFriction,
      r.finalMetrics.gdpIndex.toFixed(1),
      r.finalMetrics.gini.toFixed(3),
      r.finalMetrics.bottom40SharePct.toFixed(1),
      r.finalMetrics.complianceRate.toFixed(1),
      r.finalMetrics.evasionRate.toFixed(1),
      r.finalMetrics.fiscalBalanceB.toFixed(2),
      r.finalMetrics.wellbeingIndex.toFixed(1),
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'polislab_legislative_outcomes_36m.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Pareto Frontier SVG dimensions
  const W = 540;
  const H = 260;
  const padL = 48;
  const padR = 28;
  const padT = 24;
  const padB = 36;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xForGdp = (gdp: number) => {
    const c = Math.max(82, Math.min(115, gdp));
    return padL + ((c - 82) / (115 - 82)) * plotW;
  };
  // Y axis: Equality (1 - Gini) from 0.52 to 0.72
  const yForGini = (gini: number) => {
    const eq = Math.max(0.52, Math.min(0.72, 1 - gini));
    return padT + plotH - ((eq - 0.52) / (0.72 - 0.52)) * plotH;
  };

  return (
    <div className="space-y-8">
      {/* Header & CSV Export */}
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="text-xs text-[#64748B]">
            Cross-Statutory Benchmarking · Economy, Fairness &amp; Compliance Frontier
          </div>
          <h1 className="text-2xl font-semibold text-[#0F172A] font-display">
            Multi-Law Comparison &amp; Pareto Frontier
          </h1>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold rounded transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Export 36-Month Ledger CSV
        </button>
      </div>

      {/* Top Row: Pareto Efficiency-Equity Frontier + Head-to-Head Statutory Diff */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pareto Frontier Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-lg p-5">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              01. Efficiency vs. Equity Pareto Frontier
            </h2>
            <span className="text-xs font-mono text-[#64748B]">X: Real GDP · Y: Equality (1-Gini)</span>
          </div>
          <p className="text-xs text-[#64748B] mb-3">
            Upper-right quadrant represents high output paired with low wealth inequality. Node color reflects voluntary compliance.
          </p>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded"
          >
            {/* Quadrant crosshairs at Baseline (GDP=100, Gini=0.382) */}
            <line
              x1={xForGdp(100)}
              y1={padT}
              x2={xForGdp(100)}
              y2={H - padB}
              stroke="#CBD5E1"
              strokeDasharray="4 4"
            />
            <line
              x1={padL}
              y1={yForGini(0.382)}
              x2={W - padR}
              y2={yForGini(0.382)}
              stroke="#CBD5E1"
              strokeDasharray="4 4"
            />

            <text
              x={W - padR - 6}
              y={padT + 14}
              textAnchor="end"
              className="fill-[#059669] text-[9.5px] font-mono font-semibold"
            >
              HIGH GROWTH + HIGH EQUITY
            </text>
            <text
              x={padL + 6}
              y={H - padB - 8}
              className="fill-[#DC2626] text-[9.5px] font-mono"
            >
              CONTRACTION + INEQUALITY
            </text>

            {/* Axes */}
            <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#94A3B8" />
            <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#94A3B8" />

            <text
              x={padL + plotW / 2}
              y={H - 8}
              textAnchor="middle"
              className="fill-[#475569] text-[10px] font-mono"
            >
              Real GDP Output Index (Month 36) →
            </text>

            {runs.map((r) => {
              const cx = xForGdp(r.finalMetrics.gdpIndex);
              const cy = yForGini(r.finalMetrics.gini);
              const isSelected = r.policy.id === lawAId || r.policy.id === lawBId;
              const comp = r.finalMetrics.complianceRate;
              const color =
                comp >= 88 ? '#059669' : comp <= 76 ? '#DC2626' : '#0284C7';

              return (
                <g
                  key={r.policy.id}
                  onClick={() => setLawAId(r.policy.id)}
                  className="cursor-pointer"
                >
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="11"
                      fill="none"
                      stroke="#0F172A"
                      strokeWidth="1.5"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="6.5"
                    fill={color}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    className="fill-[#0F172A] text-[10px] font-mono font-semibold"
                  >
                    {r.policy.billCode}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Head-to-Head Statutory & Outcome Diff (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#0F172A]">
                02. Head-to-Head Statutory Benchmark
              </h2>
              <span className="text-xs text-[#64748B]">Select any two bills to compare</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                  Statute A
                </label>
                <select
                  value={lawAId}
                  onChange={(e) => setLawAId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#0F172A] font-medium"
                >
                  {runs.map((r) => (
                    <option key={r.policy.id} value={r.policy.id}>
                      {r.policy.billCode} — {r.policy.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                  Statute B
                </label>
                <select
                  value={lawBId}
                  onChange={(e) => setLawBId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#0F172A] font-medium"
                >
                  {runs.map((r) => (
                    <option key={r.policy.id} value={r.policy.id}>
                      {r.policy.billCode} — {r.policy.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="divide-y divide-[#E2E8F0] text-xs border-t border-b border-[#E2E8F0]">
              <DiffRow
                label="Real GDP Output Index"
                valA={runA.finalMetrics.gdpIndex.toFixed(1)}
                valB={runB.finalMetrics.gdpIndex.toFixed(1)}
                delta={runA.finalMetrics.gdpIndex - runB.finalMetrics.gdpIndex}
                unit=" pts"
                higherIsBetter={true}
              />
              <DiffRow
                label="Gini Inequality Coefficient"
                valA={runA.finalMetrics.gini.toFixed(3)}
                valB={runB.finalMetrics.gini.toFixed(3)}
                delta={runA.finalMetrics.gini - runB.finalMetrics.gini}
                unit=""
                higherIsBetter={false}
                decimals={3}
              />
              <DiffRow
                label="Bottom 40% Income Share"
                valA={`${runA.finalMetrics.bottom40SharePct.toFixed(1)}%`}
                valB={`${runB.finalMetrics.bottom40SharePct.toFixed(1)}%`}
                delta={runA.finalMetrics.bottom40SharePct - runB.finalMetrics.bottom40SharePct}
                unit="%"
                higherIsBetter={true}
              />
              <DiffRow
                label="Voluntary Compliance Rate"
                valA={`${runA.finalMetrics.complianceRate.toFixed(1)}%`}
                valB={`${runB.finalMetrics.complianceRate.toFixed(1)}%`}
                delta={runA.finalMetrics.complianceRate - runB.finalMetrics.complianceRate}
                unit="%"
                higherIsBetter={true}
              />
              <DiffRow
                label="Shadow Economy Evasion"
                valA={`${runA.finalMetrics.evasionRate.toFixed(1)}%`}
                valB={`${runB.finalMetrics.evasionRate.toFixed(1)}%`}
                delta={runA.finalMetrics.evasionRate - runB.finalMetrics.evasionRate}
                unit="%"
                higherIsBetter={false}
              />
              <DiffRow
                label="Monthly Citizen Transfer"
                valA={`$${runA.policy.parameters.universalTransferMonthly}/mo`}
                valB={`$${runB.policy.parameters.universalTransferMonthly}/mo`}
                delta={
                  runA.policy.parameters.universalTransferMonthly -
                  runB.policy.parameters.universalTransferMonthly
                }
                unit=""
                higherIsBetter={true}
                decimals={0}
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-xs text-[#64748B]">
            <span>Click any law in the table below to launch live agent playback</span>
          </div>
        </div>
      </div>

      {/* Full Multi-Law Ledger Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">
              03. Complete Legislative Simulation Ledger ({sortedRuns.length} Laws)
            </h2>
            <p className="text-xs text-[#64748B]">
              Standardized 36-month multi-agent outcomes across fiscal, labor, environmental, and governance bills
            </p>
          </div>

          {/* Interactive Sort Controls */}
          <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg">
            <span className="text-[11px] text-[#64748B] px-2">Rank by:</span>
            {(
              [
                { key: 'gdp', label: 'GDP Output' },
                { key: 'gini', label: 'Fairness (Gini)' },
                { key: 'compliance', label: 'Compliance' },
                { key: 'wellbeing', label: 'Wellbeing' },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                onClick={() => setSortBy(item.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                  sortBy === item.key
                    ? 'bg-white text-[#0F172A] shadow-2xs font-semibold'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#475569]">
                <th className="py-3 px-5">Bill Code &amp; Title</th>
                <th className="py-3 px-3 text-right">Tax Δ</th>
                <th className="py-3 px-3 text-right">Transfer</th>
                <th className="py-3 px-3 text-right">Friction</th>
                <th className="py-3 px-3 text-right">Real GDP</th>
                <th className="py-3 px-3 text-right">Gini Index</th>
                <th className="py-3 px-3 text-right">Bottom 40%</th>
                <th className="py-3 px-3 text-right">Compliance</th>
                <th className="py-3 px-3 text-right">Fiscal Bal.</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {sortedRuns.map((r) => {
                const fm = r.finalMetrics;
                const p = r.policy.parameters;
                return (
                  <tr key={r.policy.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-5">
                      <div className="font-semibold text-[#0F172A]">
                        <span className="font-mono text-[#0284C7] mr-2">{r.policy.billCode}</span>
                        {r.policy.title}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {r.policy.category} · {r.policy.isAI ? 'AI Counsel Draft' : 'Preset Reference'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#334155]">
                      {p.taxRateDelta > 0 ? `+${p.taxRateDelta}%` : `${p.taxRateDelta}%`}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#334155]">
                      ${p.universalTransferMonthly}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#334155]">
                      {p.complianceFriction}/100
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-[#0F172A]">
                      {fm.gdpIndex.toFixed(1)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono font-semibold tabular-nums ${
                        fm.gini <= 0.35
                          ? 'text-[#059669]'
                          : fm.gini >= 0.41
                            ? 'text-[#DC2626]'
                            : 'text-[#0F172A]'
                      }`}
                    >
                      {fm.gini.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#334155]">
                      {fm.bottom40SharePct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-[#059669]">
                      {fm.complianceRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#334155]">
                      {fm.fiscalBalanceB >= 0 ? '+' : ''}${fm.fiscalBalanceB.toFixed(1)}B
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => onLoadIntoSimulator(r.policy.id)}
                        className="px-2.5 py-1 bg-[#0F172A] hover:bg-[#0284C7] text-white text-[11px] font-medium rounded transition-colors inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                      >
                        <Play className="w-3 h-3" /> Simulate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DiffRow: React.FC<{
  label: string;
  valA: string;
  valB: string;
  delta: number;
  unit: string;
  higherIsBetter: boolean;
  decimals?: number;
}> = ({ label, valA, valB, delta, unit, higherIsBetter, decimals = 1 }) => {
  const isPositiveGood = higherIsBetter ? delta > 0.01 : delta < -0.005;
  const isNegativeBad = higherIsBetter ? delta < -0.01 : delta > 0.005;

  return (
    <div className="py-2 flex items-center justify-between gap-2">
      <span className="text-[#475569]">{label}</span>
      <div className="flex items-center gap-4 font-mono tabular-nums">
        <span className="font-semibold text-[#0F172A]">{valA}</span>
        <span className="text-[#94A3B8]">vs</span>
        <span className="text-[#475569]">{valB}</span>
        <span
          className={`w-20 text-right font-semibold ${
            isPositiveGood
              ? 'text-[#059669]'
              : isNegativeBad
                ? 'text-[#DC2626]'
                : 'text-[#64748B]'
          }`}
        >
          {delta > 0 ? '+' : ''}
          {delta.toFixed(decimals)}
          {unit}
        </span>
      </div>
    </div>
  );
};
