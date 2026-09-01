'use client';

import React, { useState } from 'react';
import type { TireStint, TireCompound } from '@/types/f1';
import { Layers, Disc } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TyreStrategyChartProps {
  stints: TireStint[];
  totalLaps?: number;
  className?: string;
}

const COMPOUND_CONFIG: Record<
  TireCompound,
  { label: string; bg: string; text: string; border: string; circle: string }
> = {
  SOFT: { label: 'Soft', bg: 'bg-red-500/80', text: 'text-red-400', border: 'border-red-500', circle: '#ef4444' },
  MEDIUM: { label: 'Medium', bg: 'bg-yellow-500/80', text: 'text-yellow-400', border: 'border-yellow-500', circle: '#eab308' },
  HARD: { label: 'Hard', bg: 'bg-zinc-100/90', text: 'text-zinc-100', border: 'border-zinc-300', circle: '#f4f4f5' },
  INTERMEDIATE: { label: 'Intermediate', bg: 'bg-emerald-500/80', text: 'text-emerald-400', border: 'border-emerald-500', circle: '#10b981' },
  WET: { label: 'Wet', bg: 'bg-blue-500/80', text: 'text-blue-400', border: 'border-blue-500', circle: '#3b82f6' },
  UNKNOWN: { label: 'Unknown', bg: 'bg-zinc-700', text: 'text-zinc-400', border: 'border-zinc-600', circle: '#71717a' },
};

export function TyreStrategyChart({
  stints,
  totalLaps: propTotalLaps,
  className,
}: TyreStrategyChartProps) {
  const [hoveredStint, setHoveredStint] = useState<{
    driverNumber: number;
    stintNumber: number;
    compound: TireCompound;
    startLap: number;
    endLap: number;
    laps: number;
    age: number;
  } | null>(null);

  // Group stints by driver
  const driverStintsMap = new Map<number, TireStint[]>();
  let calculatedMaxLap = 0;

  for (const s of stints) {
    if (!driverStintsMap.has(s.driverNumber)) {
      driverStintsMap.set(s.driverNumber, []);
    }
    driverStintsMap.get(s.driverNumber)!.push(s);
    if (s.endLap > calculatedMaxLap) calculatedMaxLap = s.endLap;
  }

  const raceLaps = propTotalLaps && propTotalLaps > 0 ? propTotalLaps : Math.max(calculatedMaxLap, 50);
  const driverEntries = Array.from(driverStintsMap.entries()).sort(
    (a, b) => a[0] - b[0]
  );

  if (stints.length === 0) {
    return (
      <div className={cn('p-8 rounded-2xl bg-zinc-900/60 border border-white/10 text-center text-zinc-500 text-xs', className)}>
        <Layers className="h-6 w-6 mx-auto mb-2 opacity-40 text-zinc-400" />
        <span>No tyre strategy telemetry recorded for this race.</span>
      </div>
    );
  }

  // Lap markers every 10 laps
  const lapMarkers: number[] = [];
  for (let i = 10; i < raceLaps; i += 10) {
    lapMarkers.push(i);
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl p-4 sm:p-5 shadow-sm space-y-4',
        className
      )}
    >
      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Disc className="h-4 w-4 text-red-500" />
          <h3 className="font-black text-sm text-zinc-100 uppercase tracking-tight">
            Tyre Strategy Matrix
          </h3>
          <span className="text-[11px] font-mono text-zinc-400">
            ({raceLaps} Laps)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {(['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'] as TireCompound[]).map((c) => {
            const conf = COMPOUND_CONFIG[c];
            return (
              <div key={c} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/30"
                  style={{ backgroundColor: conf.circle }}
                />
                <span className="text-[11px] text-zinc-300 font-semibold">{conf.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategy Bars Matrix */}
      <div className="relative overflow-x-auto">
        <div className="min-w-[600px] space-y-2 py-2">
          {/* Top Lap Scale */}
          <div className="flex items-center text-[10px] font-mono text-zinc-500 border-b border-white/5 pb-1 pl-16 pr-2 relative">
            <span className="w-16 shrink-0 -ml-16 font-bold text-zinc-400">Driver</span>
            <div className="flex-1 relative h-4">
              <span>L1</span>
              {lapMarkers.map((m) => (
                <span
                  key={m}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${(m / raceLaps) * 100}%` }}
                >
                  L{m}
                </span>
              ))}
              <span className="absolute right-0">L{raceLaps}</span>
            </div>
          </div>

          {/* Drivers rows */}
          {driverEntries.map(([driverNum, dStints]) => {
            const driverSlug = dStints[0]?.driverId || `driver_${driverNum}`;
            const driverDisplayName = driverSlug.replace(/_/g, ' ').toUpperCase();

            return (
              <div key={driverNum} className="flex items-center gap-2 group">
                {/* Driver Tag */}
                <div className="w-16 shrink-0 flex items-center gap-1 font-mono text-xs font-bold text-zinc-300">
                  <span className="text-zinc-500 text-[10px]">#{driverNum}</span>
                  <span className="truncate">{driverSlug.slice(0, 3).toUpperCase()}</span>
                </div>

                {/* Stint Bars Track */}
                <div className="flex-1 h-6 bg-zinc-950/80 rounded-md border border-white/5 relative flex overflow-hidden">
                  {/* Grid Lines */}
                  {lapMarkers.map((m) => (
                    <div
                      key={m}
                      className="absolute top-0 bottom-0 border-r border-white/[0.04] pointer-events-none"
                      style={{ left: `${(m / raceLaps) * 100}%` }}
                    />
                  ))}

                  {/* Stint Segments */}
                  {dStints.map((stint) => {
                    const stintLapsCount = Math.max(1, stint.endLap - stint.startLap + 1);
                    const widthPercent = (stintLapsCount / raceLaps) * 100;
                    const leftPercent = ((stint.startLap - 1) / raceLaps) * 100;
                    const conf = COMPOUND_CONFIG[stint.compound] || COMPOUND_CONFIG.UNKNOWN;

                    return (
                      <div
                        key={stint.stintNumber}
                        onMouseEnter={() =>
                          setHoveredStint({
                            driverNumber: driverNum,
                            stintNumber: stint.stintNumber,
                            compound: stint.compound,
                            startLap: stint.startLap,
                            endLap: stint.endLap,
                            laps: stintLapsCount,
                            age: stint.tyreAgeAtStart,
                          })
                        }
                        onMouseLeave={() => setHoveredStint(null)}
                        className={cn(
                          'absolute top-0.5 bottom-0.5 rounded-sm flex items-center justify-center cursor-pointer transition-all duration-150',
                          conf.bg,
                          'hover:brightness-125 hover:z-10 shadow-sm'
                        )}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      >
                        <span className="text-[10px] font-mono font-black text-black/90 select-none">
                          {conf.label[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stint Tooltip Details */}
      {hoveredStint ? (
        <div className="p-2.5 rounded-xl bg-zinc-950/90 border border-white/10 flex items-center justify-between text-xs font-mono animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Car #{hoveredStint.driverNumber}</span>
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-400">Stint {hoveredStint.stintNumber}</span>
            <span className="text-zinc-500">·</span>
            <span
              className={cn(
                'font-bold',
                COMPOUND_CONFIG[hoveredStint.compound]?.text
              )}
            >
              {COMPOUND_CONFIG[hoveredStint.compound]?.label} Compound
            </span>
          </div>
          <div className="flex items-center gap-3 text-zinc-300">
            <span>Laps {hoveredStint.startLap} - {hoveredStint.endLap} ({hoveredStint.laps} laps)</span>
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-400">Age at Start: {hoveredStint.age} laps</span>
          </div>
        </div>
      ) : (
        <div className="text-[11px] font-mono text-zinc-500 text-center py-1">
          Hover over any stint bar to inspect lap bounds and tyre age.
        </div>
      )}
    </div>
  );
}
