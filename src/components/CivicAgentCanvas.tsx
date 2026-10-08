import React, { useEffect, useRef, useState } from 'react';
import { AgentStratum, SimAgent, PolicyParameters } from '../types/policy';
import { STRATUM_META, ZONE_BOUNDS } from '../simulation/engine';

interface CivicAgentCanvasProps {
  agents: SimAgent[];
  isRunning: boolean;
  month: number;
  parameters: PolicyParameters;
  selectedAgentId: number | null;
  onSelectAgent: (id: number | null) => void;
  stratumFilter: AgentStratum | 'all';
}

export const CivicAgentCanvas: React.FC<CivicAgentCanvasProps> = ({
  agents,
  isRunning,
  month,
  parameters,
  selectedAgentId,
  onSelectAgent,
  stratumFilter,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const posRef = useRef<
    Map<number, { x: number; y: number; vx: number; vy: number; pulse: number }>
  >(new Map());
  const [hoveredAgent, setHoveredAgent] = useState<SimAgent | null>(null);

  // Sync agent positions with smooth interpolation
  useEffect(() => {
    const map = posRef.current;
    for (const a of agents) {
      const existing = map.get(a.id);
      if (!existing) {
        map.set(a.id, {
          x: a.x,
          y: a.y,
          vx: a.vx,
          vy: a.vy,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }
  }, [agents]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tickCount = 0;

    const render = () => {
      tickCount++;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const W = rect.width;
      const H = rect.height;

      // 1. Background Canvas (Clean off-white architectural blueprint)
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, W, H);

      // Subtle coordinate grid
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 0.6;
      const gridStep = 36;
      ctx.beginPath();
      for (let gx = gridStep; gx < W; gx += gridStep) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
      }
      for (let gy = gridStep; gy < H; gy += gridStep) {
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
      }
      ctx.stroke();

      // 2. Draw the 4 Civic Zones
      const zones = Object.entries(ZONE_BOUNDS) as [
        keyof typeof ZONE_BOUNDS,
        (typeof ZONE_BOUNDS)[keyof typeof ZONE_BOUNDS],
      ][];

      for (const [zoneKey, z] of zones) {
        const zx = z.xMin * W;
        const zy = z.yMin * H;
        const zw = (z.xMax - z.xMin) * W;
        const zh = (z.yMax - z.yMin) * H;

        const isShadow = zoneKey === 'shadow_fringe';

        ctx.fillStyle = isShadow ? 'rgba(254, 242, 242, 0.55)' : 'rgba(255, 255, 255, 0.82)';
        ctx.strokeStyle = isShadow ? '#FECACA' : '#CBD5E1';
        ctx.lineWidth = 1;

        if (isShadow) {
          ctx.setLineDash([5, 4]);
        } else {
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.roundRect(zx, zy, zw, zh, 6);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        // Zone Header Text
        ctx.fillStyle = isShadow ? '#991B1B' : '#0F172A';
        ctx.font = '600 11.5px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(z.title, zx + 12, zy + 20);

        ctx.fillStyle = isShadow ? '#B91C1C' : '#64748B';
        ctx.font = '400 10.5px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(z.subtitle, zx + 12, zy + 35);
      }

      // 3. Draw Central Treasury Clearing Node & Fiscal Flow Pathways
      const tx = W * 0.50;
      const ty = H * 0.50;

      const zoneCenters = [
        { x: W * 0.26, y: H * 0.28, type: 'tax' },
        { x: W * 0.74, y: H * 0.28, type: 'tax' },
        { x: W * 0.31, y: H * 0.74, type: 'transfer' },
      ];

      for (const zc of zoneCenters) {
        ctx.strokeStyle = zc.type === 'transfer' ? 'rgba(2, 132, 199, 0.22)' : 'rgba(5, 150, 105, 0.22)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(zc.x, zc.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Moving flow particle along fiscal rail
        const speed = isRunning ? 0.014 : 0.003;
        const phase = (tickCount * speed) % 1;
        const dir = zc.type === 'transfer' ? phase : 1 - phase;
        const px = tx + (zc.x - tx) * dir;
        const py = ty + (zc.y - ty) * dir;

        ctx.fillStyle = zc.type === 'transfer' ? '#0284C7' : '#059669';
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Central Treasury Node Badge
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(tx - 58, ty - 15, 116, 30, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TREASURY CLEARING', tx, ty + 3.5);
      ctx.textAlign = 'left';

      // 4. Update & Render the 240 Societal Agents
      const map = posRef.current;
      const lerpRate = isRunning ? 0.055 : 0.025;
      const jitterAmp = isRunning ? 0.0009 : 0.0002;

      for (const agent of agents) {
        const pos = map.get(agent.id) || {
          x: agent.x,
          y: agent.y,
          vx: 0,
          vy: 0,
          pulse: 0,
        };

        // Smooth interpolation toward zone target + gentle micro-orbital motion
        pos.pulse += isRunning ? 0.08 : 0.02;
        const dx = agent.targetX - pos.x;
        const dy = agent.targetY - pos.y;
        pos.x += dx * lerpRate + Math.cos(pos.pulse + agent.id) * jitterAmp;
        pos.y += dy * lerpRate + Math.sin(pos.pulse * 0.8 + agent.id) * jitterAmp;

        map.set(agent.id, pos);

        const ax = pos.x * W;
        const ay = pos.y * H;

        const isDimmed = stratumFilter !== 'all' && agent.stratum !== stratumFilter;
        const isSelected = selectedAgentId === agent.id;
        const isHovered = hoveredAgent?.id === agent.id;

        // Radius by economic stratum
        let radius = 4.2;
        if (agent.stratum === 'corporate_capital') radius = 6.4;
        else if (agent.stratum === 'sme_owner') radius = 5.4;
        else if (agent.stratum === 'skilled_pro') radius = 4.6;
        else if (agent.stratum === 'retiree_dependent') radius = 3.8;

        // Color by Compliance State
        let fillColor = '#059669'; // Compliant (Emerald)
        let ringColor = 'rgba(5, 150, 105, 0.25)';
        if (agent.complianceState === 'strained') {
          fillColor = '#D97706'; // Strained (Amber)
          ringColor = 'rgba(217, 119, 6, 0.30)';
        } else if (agent.complianceState === 'evading') {
          fillColor = '#DC2626'; // Evading (Crimson)
          ringColor = 'rgba(220, 38, 38, 0.32)';
        } else if (agent.complianceState === 'audited') {
          fillColor = '#0284C7'; // Audited (Cobalt)
          ringColor = 'rgba(2, 132, 199, 0.38)';
        }

        ctx.globalAlpha = isDimmed ? 0.16 : 1.0;

        // Draw migration trail if moving between zones
        if (!isDimmed && Math.hypot(dx * W, dy * H) > 22) {
          ctx.strokeStyle =
            agent.complianceState === 'evading'
              ? 'rgba(220, 38, 38, 0.28)'
              : 'rgba(2, 132, 199, 0.22)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - dx * W * 0.35, ay - dy * H * 0.35);
          ctx.stroke();
        }

        // Outer halo for selected, hovered, or audited agents
        if (isSelected || isHovered || agent.complianceState === 'audited') {
          ctx.fillStyle = ringColor;
          ctx.beginPath();
          ctx.arc(ax, ay, radius + (isSelected ? 6 : 4), 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Agent Node shape (distinctive geometry for color-blind accessibility!)
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = isSelected ? '#0F172A' : '#FFFFFF';
        ctx.lineWidth = isSelected ? 2 : 1.2;

        ctx.beginPath();
        if (agent.complianceState === 'evading') {
          // Triangle for Evading (▲)
          const r = radius * 1.25;
          ctx.moveTo(ax, ay - r);
          ctx.lineTo(ax + r * 0.92, ay + r * 0.78);
          ctx.lineTo(ax - r * 0.92, ay + r * 0.78);
          ctx.closePath();
        } else if (agent.complianceState === 'strained') {
          // Diamond for Strained (◆)
          const r = radius * 1.2;
          ctx.moveTo(ax, ay - r);
          ctx.lineTo(ax + r, ay);
          ctx.lineTo(ax, ay + r);
          ctx.lineTo(ax - r, ay);
          ctx.closePath();
        } else {
          // Circle for Compliant / Audited (●)
          ctx.arc(ax, ay, radius, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();

        ctx.globalAlpha = 1.0;
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [agents, isRunning, month, parameters, selectedAgentId, hoveredAgent, stratumFilter]);

  const handleCanvasPointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const map = posRef.current;
    let closest: SimAgent | null = null;
    let minDist = 16;

    for (const agent of agents) {
      if (stratumFilter !== 'all' && agent.stratum !== stratumFilter) continue;
      const pos = map.get(agent.id);
      if (!pos) continue;
      const ax = pos.x * rect.width;
      const ay = pos.y * rect.height;
      const d = Math.hypot(mx - ax, my - ay);
      if (d < minDist) {
        minDist = d;
        closest = agent;
      }
    }
    setHoveredAgent(closest);
  };

  const handleCanvasClick = () => {
    if (hoveredAgent) {
      onSelectAgent(hoveredAgent.id === selectedAgentId ? null : hoveredAgent.id);
    } else {
      onSelectAgent(null);
    }
  };

  const activeAgent =
    agents.find((a) => a.id === selectedAgentId) || hoveredAgent || null;

  return (
    <div className="relative w-full h-[430px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        onMouseMove={handleCanvasPointerMove}
        onMouseLeave={() => setHoveredAgent(null)}
        onClick={handleCanvasClick}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Bottom Legend Bar — Dual-coded with geometric glyphs + text labels (never color-only) */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-white/95 backdrop-blur-xs border border-[#E2E8F0] rounded text-xs text-[#475569]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-medium text-[#0F172A]">Agent State Legend:</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[#059669]">
            <span aria-hidden="true">●</span> COMPLIANT
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[#D97706]">
            <span aria-hidden="true">◆</span> STRAINED
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[#DC2626]">
            <span aria-hidden="true">▲</span> EVADING (SHADOW)
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[#0284C7]">
            <span aria-hidden="true">◎</span> AUDITED
          </span>
        </div>
        <div className="text-[11px] text-[#64748B] font-mono">
          Click any of the 240 agents to lock dossier
        </div>
      </div>

      {/* Live Micro-Agent Inspector Overlay */}
      {activeAgent && (
        <div className="absolute top-3 right-3 w-72 bg-white/95 backdrop-blur-xs border border-[#CBD5E1] rounded-md p-3.5 shadow-xs pointer-events-none">
          <div className="flex items-baseline justify-between border-b border-[#E2E8F0] pb-2 mb-2.5">
            <div>
              <div className="text-xs font-semibold text-[#0F172A]">{activeAgent.label}</div>
              <div className="text-[11px] text-[#64748B]">
                {STRATUM_META[activeAgent.stratum].label}
              </div>
            </div>
            <div className="text-[11px] font-mono font-semibold">
              {activeAgent.complianceState === 'compliant' && (
                <span className="text-[#059669]">● COMPLIANT</span>
              )}
              {activeAgent.complianceState === 'strained' && (
                <span className="text-[#D97706]">◆ STRAINED</span>
              )}
              {activeAgent.complianceState === 'evading' && (
                <span className="text-[#DC2626]">▲ EVADING</span>
              )}
              {activeAgent.complianceState === 'audited' && (
                <span className="text-[#0284C7]">◎ AUDITED</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs">
            <div className="text-[#64748B]">Net Monthly Income</div>
            <div className="text-right font-mono font-medium text-[#0F172A] tabular-nums">
              ${activeAgent.monthlyIncome.toLocaleString()}/mo
            </div>

            <div className="text-[#64748B]">Accumulated Wealth</div>
            <div className="text-right font-mono font-medium text-[#0F172A] tabular-nums">
              ${activeAgent.wealth.toLocaleString()}
            </div>

            <div className="text-[#64748B]">Effective Tax Rate</div>
            <div className="text-right font-mono font-medium text-[#0F172A] tabular-nums">
              {(activeAgent.taxBurdenRate * 100).toFixed(1)}%
            </div>

            <div className="text-[#64748B]">Monthly Transfer</div>
            <div className="text-right font-mono font-medium text-[#0284C7] tabular-nums">
              +${activeAgent.effectiveTransferReceived.toLocaleString()}
            </div>

            <div className="text-[#64748B]">Compliance Propensity</div>
            <div className="text-right font-mono font-medium text-[#0F172A] tabular-nums">
              {(activeAgent.complianceProbability * 100).toFixed(0)}%
            </div>

            <div className="text-[#64748B]">Household Wellbeing</div>
            <div className="text-right font-mono font-medium text-[#0F172A] tabular-nums">
              {activeAgent.wellbeing.toFixed(1)} / 100
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
