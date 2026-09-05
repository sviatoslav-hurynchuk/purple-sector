'use client';

import React, { useMemo, useState } from 'react';
import type { TeammatePairStats, DriverH2HSummary } from '@/types/f1';
import { getTeamTheme } from '@/lib/team-colors';

interface RadarChartProps {
  stats: TeammatePairStats;
  driver1: DriverH2HSummary;
  driver2: DriverH2HSummary;
  constructorId: string;
  className?: string;
  size?: number;
}

interface AxisDefinition {
  name: string;
  shortName: string;
  d1Raw: string | number;
  d2Raw: string | number;
  d1Val: number; // 0..1 normalized
  d2Val: number; // 0..1 normalized
}

export function RadarChart({
  stats,
  driver1,
  driver2,
  constructorId,
  className = '',
  size = 360,
}: RadarChartProps) {
  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);

  const teamTheme = getTeamTheme(constructorId);
  const d1Color = teamTheme.primary;
  // Use high-contrast complementary or bright cyan/violet for Driver 2
  const d2Color = '#94a3b8'; // Slate-400 for clear distinction

  const axes: AxisDefinition[] = useMemo(() => {
    // 1. Qualifying H2H
    const qTotal = Math.max(1, stats.qualifying.d1Wins + stats.qualifying.d2Wins);
    const qD1 = stats.qualifying.d1Wins / qTotal;
    const qD2 = stats.qualifying.d2Wins / qTotal;

    // 2. Race H2H
    const rTotal = Math.max(1, stats.race.d1Wins + stats.race.d2Wins);
    const rD1 = stats.race.d1Wins / rTotal;
    const rD2 = stats.race.d2Wins / rTotal;

    // 3. Points Share
    const ptsD1 = stats.points.d1SharePercent / 100;
    const ptsD2 = 1 - ptsD1;

    // 4. Podiums & Wins
    const podD1Score = stats.wins.d1 * 2 + stats.podiums.d1;
    const podD2Score = stats.wins.d2 * 2 + stats.podiums.d2;
    const podTotal = Math.max(1, podD1Score + podD2Score);
    const podD1 = podD1Score / podTotal;
    const podD2 = podD2Score / podTotal;

    // 5. Fastest Laps
    const flTotal = Math.max(1, stats.fastestLaps.d1 + stats.fastestLaps.d2);
    const flD1 = stats.fastestLaps.d1 / flTotal;
    const flD2 = stats.fastestLaps.d2 / flTotal;

    // 6. Best Finish Performance (lower number is better, scaled 1..20)
    const bestFin1 = stats.bestFinish.d1 > 0 ? (21 - stats.bestFinish.d1) / 20 : 0.1;
    const bestFin2 = stats.bestFinish.d2 > 0 ? (21 - stats.bestFinish.d2) / 20 : 0.1;
    const bestTotal = Math.max(0.1, bestFin1 + bestFin2);
    const finD1 = bestFin1 / bestTotal;
    const finD2 = bestFin2 / bestTotal;

    // Normalizing values into [0.2, 0.95] for aesthetic radar balance
    const scaleVal = (val: number) => Math.min(0.95, Math.max(0.2, 0.2 + val * 0.75));

    return [
      {
        name: 'Qualifying H2H',
        shortName: 'Qualifying',
        d1Raw: `${stats.qualifying.d1Wins} wins`,
        d2Raw: `${stats.qualifying.d2Wins} wins`,
        d1Val: scaleVal(qD1),
        d2Val: scaleVal(qD2),
      },
      {
        name: 'Race H2H',
        shortName: 'Race H2H',
        d1Raw: `${stats.race.d1Wins} wins`,
        d2Raw: `${stats.race.d2Wins} wins`,
        d1Val: scaleVal(rD1),
        d2Val: scaleVal(rD2),
      },
      {
        name: 'Points Share',
        shortName: 'Points',
        d1Raw: `${stats.points.d1Points} pts (${stats.points.d1SharePercent}%)`,
        d2Raw: `${stats.points.d2Points} pts (${(100 - stats.points.d1SharePercent).toFixed(1)}%)`,
        d1Val: scaleVal(ptsD1),
        d2Val: scaleVal(ptsD2),
      },
      {
        name: 'Podiums & Wins',
        shortName: 'Podiums',
        d1Raw: `${stats.podiums.d1}P / ${stats.wins.d1}W`,
        d2Raw: `${stats.podiums.d2}P / ${stats.wins.d2}W`,
        d1Val: scaleVal(podD1),
        d2Val: scaleVal(podD2),
      },
      {
        name: 'Fastest Laps',
        shortName: 'Fastest Laps',
        d1Raw: `${stats.fastestLaps.d1} FL`,
        d2Raw: `${stats.fastestLaps.d2} FL`,
        d1Val: scaleVal(flD1),
        d2Val: scaleVal(flD2),
      },
      {
        name: 'Best Finish',
        shortName: 'Best Finish',
        d1Raw: stats.bestFinish.d1 > 0 ? `P${stats.bestFinish.d1}` : 'N/A',
        d2Raw: stats.bestFinish.d2 > 0 ? `P${stats.bestFinish.d2}` : 'N/A',
        d1Val: scaleVal(finD1),
        d2Val: scaleVal(finD2),
      },
    ];
  }, [stats]);

  // SVG Geometry constants
  const center = 200;
  const maxRadius = 125;
  const numAxes = axes.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Concentric grid polygon rings (25%, 50%, 75%, 100%)
  const gridRings = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (index: number, val: number) => {
    const angle = -Math.PI / 2 + index * angleStep;
    return {
      x: center + maxRadius * val * Math.cos(angle),
      y: center + maxRadius * val * Math.sin(angle),
    };
  };

  // Polygon points
  const d1Points = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(i, axis.d1Val);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const d2Points = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(i, axis.d2Val);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Legend */}
      <div className="flex items-center gap-6 mb-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shadow-[0_0_8px] ring-2 ring-white/20"
            style={{ backgroundColor: d1Color, boxShadow: `0 0 8px ${d1Color}80` }}
          />
          <span className="font-bold text-white tracking-wide">{driver1.code}</span>
        </div>
        <span className="text-zinc-600">vs</span>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full bg-slate-400 ring-2 ring-white/20"
            style={{ boxShadow: `0 0 8px #94a3b880` }}
          />
          <span className="font-bold text-slate-300 tracking-wide">{driver2.code}</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full max-w-[360px] aspect-square">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full overflow-visible drop-shadow-md select-none"
        >
          {/* Background Concentric Webs */}
          {gridRings.map((factor) => {
            const ringPts = axes
              .map((_, i) => {
                const { x, y } = getCoordinates(i, factor);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(' ');

            return (
              <polygon
                key={factor}
                points={ringPts}
                fill={factor === 1.0 ? 'rgba(255, 255, 255, 0.015)' : 'none'}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
                strokeDasharray={factor === 1.0 ? undefined : '3,3'}
              />
            );
          })}

          {/* Radial Axis Spokes */}
          {axes.map((_, i) => {
            const { x, y } = getCoordinates(i, 1.0);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke={hoveredAxis === i ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)'}
                strokeWidth={hoveredAxis === i ? 1.5 : 1}
                className="transition-colors duration-200"
              />
            );
          })}

          {/* Driver 2 Polygon (Underneath) */}
          <polygon
            points={d2Points}
            fill={`${d2Color}25`}
            stroke={d2Color}
            strokeWidth="2"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Driver 1 Polygon (On Top with Team Glow) */}
          <polygon
            points={d1Points}
            fill={`${d1Color}35`}
            stroke={d1Color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            filter="drop-shadow(0 0 6px rgba(255,255,255,0.2))"
            className="transition-all duration-300"
          />

          {/* Vertices Dots for Driver 2 */}
          {axes.map((_, i) => {
            const { x, y } = getCoordinates(i, axes[i].d2Val);
            return (
              <circle
                key={`d2-${i}`}
                cx={x}
                cy={y}
                r="3.5"
                fill={d2Color}
                stroke="#09090b"
                strokeWidth="1.5"
                className="transition-all duration-300"
              />
            );
          })}

          {/* Vertices Dots for Driver 1 */}
          {axes.map((_, i) => {
            const { x, y } = getCoordinates(i, axes[i].d1Val);
            return (
              <circle
                key={`d1-${i}`}
                cx={x}
                cy={y}
                r="4"
                fill={d1Color}
                stroke="#09090b"
                strokeWidth="1.5"
                className="transition-all duration-300 shadow-sm"
              />
            );
          })}

          {/* Axis Labels & Interactive Hitboxes */}
          {axes.map((axis, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            const labelRadius = maxRadius + 32;
            const lx = center + labelRadius * Math.cos(angle);
            const ly = center + labelRadius * Math.sin(angle);

            // Alignment adjustments based on angle
            const isTop = Math.abs(angle - (-Math.PI / 2)) < 0.1;
            const isBottom = Math.abs(angle - (Math.PI / 2)) < 0.1;
            const isRight = Math.cos(angle) > 0.3;
            const isLeft = Math.cos(angle) < -0.3;

            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            if (isRight) textAnchor = 'start';
            if (isLeft) textAnchor = 'end';

            const isHovered = hoveredAxis === i;

            return (
              <g
                key={axis.name}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredAxis(i)}
                onMouseLeave={() => setHoveredAxis(null)}
              >
                <text
                  x={lx}
                  y={ly - (isBottom ? -4 : 0)}
                  textAnchor={textAnchor}
                  fill={isHovered ? '#ffffff' : '#a1a1aa'}
                  fontSize="11"
                  fontWeight={isHovered ? '600' : '500'}
                  className="transition-colors duration-150 select-none tracking-tight font-sans"
                >
                  {axis.shortName}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip / Active Axis Breakdown */}
        {hoveredAxis !== null && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-zinc-900/95 border border-zinc-700/70 backdrop-blur-md rounded-xl px-4 py-2 shadow-2xl flex items-center gap-4 text-xs font-mono">
              <span className="text-zinc-400 font-medium">
                {axes[hoveredAxis].name}:
              </span>
              <span className="font-bold text-white flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: d1Color }}
                />
                {driver1.code}: {axes[hoveredAxis].d1Raw}
              </span>
              <span className="text-zinc-600">vs</span>
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                {driver2.code}: {axes[hoveredAxis].d2Raw}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
