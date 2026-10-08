import React, { useState } from 'react';
import { MonthlyTelemetry, SimulationRunRecord } from '../types/policy';

interface TrajectoryChartProps {
  history: MonthlyTelemetry[];
  baselineHistory?: MonthlyTelemetry[];
}

export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({ history, baselineHistory }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const W = 560;
  const H = 215;
  const padL = 42;
  const padR = 18;
  const padT = 18;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const maxMonths = Math.max(36, history.length - 1);

  const xForMonth = (m: number) => padL + (m / maxMonths) * plotW;
  // Normalize values onto a 50..120 scale for unified multi-metric trajectory inspection
  const yForVal = (v: number, minV: number, maxV: number) => {
    const clamped = Math.max(minV, Math.min(maxV, v));
    return padT + plotH - ((clamped - minV) / (maxV - minV)) * plotH;
  };

  const buildPath = (pts: { m: number; y: number }[]) => {
    if (pts.length === 0) return '';
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${xForMonth(p.m).toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
  };

  const gdpPts = history.map((h) => ({ m: h.month, y: yForVal(h.gdpIndex, 78, 118) }));
  const compPts = history.map((h) => ({ m: h.month, y: yForVal(h.complianceRate, 50, 100) }));
  // Equality Index = (1 - Gini) * 100 so higher is fairer (50..85 range)
  const eqPts = history.map((h) => ({ m: h.month, y: yForVal((1 - h.gini) * 100, 45, 78) }));

  const baseGdpPts = (baselineHistory || []).slice(0, history.length).map((h) => ({
    m: h.month,
    y: yForVal(h.gdpIndex, 78, 118),
  }));

  const activePoint =
    hoverIdx !== null && history[hoverIdx] ? history[hoverIdx] : history[history.length - 1];

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-medium text-[#0284C7]">
            <span className="w-3 h-0.5 bg-[#0284C7] inline-block" /> Real GDP Index
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-[#059669]">
            <span className="w-3 h-0.5 bg-[#059669] inline-block" /> Voluntary Compliance (%)
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-[#D97706]">
            <span className="w-3 h-0.5 bg-[#D97706] inline-block" /> Equality Score (1-Gini)
          </span>
        </div>
        {activePoint && (
          <div className="font-mono text-[11px] text-[#475569] tabular-nums">
            Month {activePoint.month} · GDP {activePoint.gdpIndex.toFixed(1)} · Comp{' '}
            {activePoint.complianceRate.toFixed(1)}% · Gini {activePoint.gini.toFixed(3)}
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto bg-white border border-[#E2E8F0] rounded overflow-visible"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Horizontal reference lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = padT + t * plotH;
          return (
            <g key={i}>
              <line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke="#F1F5F9"
                strokeWidth="1"
              />
            </g>
          );
        })}

        {/* Month X-axis labels */}
        {[0, 6, 12, 18, 24, 30, 36].map((m) => {
          const x = xForMonth(m);
          return (
            <g key={m}>
              <line x1={x} y1={padT} x2={x} y2={H - padB} stroke="#F1F5F9" strokeWidth="1" />
              <text
                x={x}
                y={H - 9}
                textAnchor="middle"
                className="fill-[#64748B] text-[10px] font-mono"
              >
                M{m}
              </text>
            </g>
          );
        })}

        {/* Baseline GDP dashed reference */}
        {baseGdpPts.length > 1 && (
          <path
            d={buildPath(baseGdpPts)}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
        )}

        {/* Primary Trajectory Lines */}
        {gdpPts.length > 1 && (
          <path d={buildPath(gdpPts)} fill="none" stroke="#0284C7" strokeWidth="2.2" />
        )}
        {compPts.length > 1 && (
          <path d={buildPath(compPts)} fill="none" stroke="#059669" strokeWidth="2" />
        )}
        {eqPts.length > 1 && (
          <path d={buildPath(eqPts)} fill="none" stroke="#D97706" strokeWidth="2" />
        )}

        {/* Interactive Hover Slices */}
        {history.map((h, idx) => {
          const x = xForMonth(h.month);
          return (
            <g key={h.month}>
              <rect
                x={x - plotW / maxMonths / 2}
                y={padT}
                width={plotW / maxMonths}
                height={plotH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIdx(idx)}
              />
              {hoverIdx === idx && (
                <>
                  <line
                    x1={x}
                    y1={padT}
                    x2={x}
                    y2={H - padB}
                    stroke="#0F172A"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <circle cx={x} cy={gdpPts[idx].y} r="3.5" fill="#0284C7" stroke="#fff" />
                  <circle cx={x} cy={compPts[idx].y} r="3.5" fill="#059669" stroke="#fff" />
                  <circle cx={x} cy={eqPts[idx].y} r="3.5" fill="#D97706" stroke="#fff" />
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

interface LorenzCurveChartProps {
  lorenzCurve: number[];
  baselineLorenz?: number[];
  gini: number;
  baselineGini?: number;
}

export const LorenzCurveChart: React.FC<LorenzCurveChartProps> = ({
  lorenzCurve,
  baselineLorenz = [0, 2.8, 6.9, 12.4, 19.2, 27.5, 37.4, 49.0, 62.8, 79.1, 100],
  gini,
  baselineGini = 0.382,
}) => {
  const S = 215;
  const pad = 28;
  const plot = S - pad * 2;

  const pt = (decileIdx: number, sharePct: number) => {
    const x = pad + (decileIdx / 10) * plot;
    const y = pad + plot - (sharePct / 100) * plot;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const activePoly = [
    ...lorenzCurve.map((val, idx) => pt(idx, val)),
    `${(pad + plot).toFixed(1)},${pad.toFixed(1)}`,
    `${pad.toFixed(1)},${(pad + plot).toFixed(1)}`,
  ].join(' ');

  const activeLine = lorenzCurve
    .map((val, idx) => `${idx === 0 ? 'M' : 'L'}${pt(idx, val)}`)
    .join(' ');

  const baseLine = baselineLorenz
    .map((val, idx) => `${idx === 0 ? 'M' : 'L'}${pt(idx, val)}`)
    .join(' ');

  const giniDelta = gini - baselineGini;

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span className="text-xs font-semibold text-[#0F172A]">Lorenz Inequality Curve</span>
          <span className="text-[11px] text-[#64748B] ml-2">Cumulative Income Share</span>
        </div>
        <div className="text-xs font-mono tabular-nums">
          <span className="text-[#0F172A] font-semibold">Gini: {gini.toFixed(3)}</span>
          <span
            className={`ml-2 ${
              giniDelta < -0.005
                ? 'text-[#059669]'
                : giniDelta > 0.005
                  ? 'text-[#DC2626]'
                  : 'text-[#64748B]'
            }`}
          >
            ({giniDelta <= 0 ? '' : '+'}
            {giniDelta.toFixed(3)} vs ref)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <svg
          viewBox={`0 0 ${S} ${S}`}
          className="w-44 h-44 shrink-0 bg-white border border-[#E2E8F0] rounded"
        >
          {/* Grid */}
          {[0.25, 0.5, 0.75].map((t) => (
            <React.Fragment key={t}>
              <line
                x1={pad}
                y1={pad + t * plot}
                x2={pad + plot}
                y2={pad + t * plot}
                stroke="#F1F5F9"
              />
              <line
                x1={pad + t * plot}
                y1={pad}
                x2={pad + t * plot}
                y2={pad + plot}
                stroke="#F1F5F9"
              />
            </React.Fragment>
          ))}

          {/* Shaded Gini Area */}
          <polygon points={activePoly} fill="rgba(2, 132, 199, 0.12)" />

          {/* Line of Absolute Equality */}
          <line
            x1={pad}
            y1={pad + plot}
            x2={pad + plot}
            y2={pad}
            stroke="#94A3B8"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Baseline Lorenz Curve */}
          <path d={baseLine} fill="none" stroke="#CBD5E1" strokeWidth="1.5" />

          {/* Active Policy Lorenz Curve */}
          <path d={activeLine} fill="none" stroke="#0284C7" strokeWidth="2.2" />

          {/* Axes labels */}
          <text x={pad} y={S - 7} className="fill-[#64748B] text-[9px] font-mono">
            0% Pop
          </text>
          <text
            x={pad + plot}
            y={S - 7}
            textAnchor="end"
            className="fill-[#64748B] text-[9px] font-mono"
          >
            100% Pop
          </text>
          <text x={pad + 3} y={pad + 9} className="fill-[#64748B] text-[9px] font-mono">
            100% Inc
          </text>
        </svg>

        <div className="flex-1 space-y-2.5 text-xs">
          <div className="border-b border-[#E2E8F0] pb-2">
            <div className="text-[#64748B] text-[11px]">Bottom 40% Population Share</div>
            <div className="font-mono font-semibold text-sm text-[#0F172A] tabular-nums">
              {lorenzCurve[4]?.toFixed(1)}% of total income
            </div>
          </div>
          <div className="border-b border-[#E2E8F0] pb-2">
            <div className="text-[#64748B] text-[11px]">Top 10% Population Share</div>
            <div className="font-mono font-semibold text-sm text-[#0F172A] tabular-nums">
              {(100 - (lorenzCurve[9] || 79)).toFixed(1)}% of total income
            </div>
          </div>
          <div className="text-[11px] text-[#475569] leading-relaxed">
            Shaded region denotes the Gini inequality area between absolute parity and actual agent wealth distribution.
          </div>
        </div>
      </div>
    </div>
  );
};

interface MultiPolicyOutcomeChartProps {
  runs: SimulationRunRecord[];
  selectedPolicyId: string;
  onSelectPolicy: (id: string) => void;
}

export const MultiPolicyOutcomeChart: React.FC<MultiPolicyOutcomeChartProps> = ({
  runs,
  selectedPolicyId,
  onSelectPolicy,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Dimension 1: Economic Output (Real GDP Index) */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-sm font-semibold text-[#0F172A]">01. Economic Output Trajectory</h3>
          <span className="text-xs font-mono text-[#64748B]">Real GDP Index (Ref = 100)</span>
        </div>
        <p className="text-xs text-[#64748B] mb-4">
          36-month aggregate output factoring innovation productivity and formal labor participation.
        </p>

        <div className="space-y-3">
          {runs.map((r) => {
            const val = r.finalMetrics.gdpIndex;
            const delta = val - 100;
            const pctWidth = Math.max(15, Math.min(100, ((val - 75) / 40) * 100));
            const isSel = r.policy.id === selectedPolicyId;
            return (
              <button
                key={r.policy.id}
                onClick={() => onSelectPolicy(r.policy.id)}
                className={`w-full text-left group p-2 rounded transition-colors ${
                  isSel ? 'bg-[#F1F5F9]' : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="font-medium text-[#0F172A] truncate pr-2">
                    {r.policy.billCode} · {r.policy.title}
                  </span>
                  <span className="font-mono font-semibold tabular-nums shrink-0 text-[#0F172A]">
                    {val.toFixed(1)}{' '}
                    <span
                      className={
                        delta >= 0.5
                          ? 'text-[#059669]'
                          : delta <= -0.5
                            ? 'text-[#DC2626]'
                            : 'text-[#64748B]'
                      }
                    >
                      ({delta >= 0 ? '+' : ''}
                      {delta.toFixed(1)})
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 bg-[#E2E8F0] rounded-xs overflow-hidden">
                  <div
                    className="h-full bg-[#0284C7] transition-all duration-200"
                    style={{ width: `${pctWidth}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dimension 2: Distributional Fairness (Equality & Gini) */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-sm font-semibold text-[#0F172A]">02. Distributional Fairness</h3>
          <span className="text-xs font-mono text-[#64748B]">Gini Coefficient (Lower = Fairer)</span>
        </div>
        <p className="text-xs text-[#64748B] mb-4">
          Measured across all 240 households after taxes, compliance costs, and universal transfers.
        </p>

        <div className="space-y-3">
          {runs.map((r) => {
            const gini = r.finalMetrics.gini;
            // Bar fills more when equality is higher (lower Gini)
            const equalityScore = (1 - gini) * 100;
            const barWidth = Math.max(15, Math.min(100, ((equalityScore - 45) / 30) * 100));
            const isSel = r.policy.id === selectedPolicyId;
            return (
              <button
                key={r.policy.id}
                onClick={() => onSelectPolicy(r.policy.id)}
                className={`w-full text-left group p-2 rounded transition-colors ${
                  isSel ? 'bg-[#F1F5F9]' : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="font-medium text-[#0F172A] truncate pr-2">
                    {r.policy.billCode} · Bottom 40% holds {r.finalMetrics.bottom40SharePct.toFixed(1)}%
                  </span>
                  <span className="font-mono font-semibold tabular-nums shrink-0 text-[#0F172A]">
                    Gini {gini.toFixed(3)}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#E2E8F0] rounded-xs overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      gini <= 0.35 ? 'bg-[#059669]' : gini >= 0.41 ? 'bg-[#DC2626]' : 'bg-[#D97706]'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dimension 3: Rule of Law & Voluntary Compliance */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-sm font-semibold text-[#0F172A]">03. Compliance & Shadow Drift</h3>
          <span className="text-xs font-mono text-[#64748B]">Formal vs Strained vs Evading</span>
        </div>
        <p className="text-xs text-[#64748B] mb-4">
          Proportion of agents complying voluntarily versus strained or evading in the shadow fringe.
        </p>

        <div className="space-y-3">
          {runs.map((r) => {
            const ev = r.finalMetrics.evasionRate;
            const st = r.finalMetrics.strainedRate;
            const cleanComp = Math.max(0, 100 - ev - st);
            const isSel = r.policy.id === selectedPolicyId;
            return (
              <button
                key={r.policy.id}
                onClick={() => onSelectPolicy(r.policy.id)}
                className={`w-full text-left group p-2 rounded transition-colors ${
                  isSel ? 'bg-[#F1F5F9]' : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="font-medium text-[#0F172A] truncate pr-2">
                    {r.policy.billCode} · Evasion {ev.toFixed(1)}% · Strain {st.toFixed(1)}%
                  </span>
                  <span className="font-mono font-semibold tabular-nums shrink-0 text-[#059669]">
                    {r.finalMetrics.complianceRate.toFixed(1)}% Formal
                  </span>
                </div>
                <div className="w-full h-2 bg-[#E2E8F0] rounded-xs overflow-hidden flex">
                  <div
                    className="h-full bg-[#059669]"
                    style={{ width: `${cleanComp}%` }}
                    title={`Unstrained Compliant: ${cleanComp.toFixed(1)}%`}
                  />
                  <div
                    className="h-full bg-[#D97706]"
                    style={{ width: `${st}%` }}
                    title={`Regulatory Strain: ${st.toFixed(1)}%`}
                  />
                  <div
                    className="h-full bg-[#DC2626]"
                    style={{ width: `${ev}%` }}
                    title={`Shadow Evasion: ${ev.toFixed(1)}%`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
