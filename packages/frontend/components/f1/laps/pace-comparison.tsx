'use client';

import React, { useMemo } from 'react';
import type { LapData, DriverLapSummary, PitStopEntry, TireStint } from '@/types/f1';
import { getTeamTheme } from '@/lib/team-colors';
import { formatRaceOutcome } from '@/lib/f1-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Swords, X, Trophy, Timer, TrendingUp, Gauge, Disc } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaceComparisonProps {
  selectedDriverIds: Set<string>;
  totalLaps: number;
  lapsData: LapData[];
  drivers: DriverLapSummary[];
  pitStops: PitStopEntry[];
  openF1Stints?: TireStint[];
  onRemoveDriver: (driverId: string) => void;
  onClearAll: () => void;
}

/** Parses "M:SS.mmm" or "SS.mmm" into seconds */
function parseLapTimeToSeconds(timeStr: string): number {
  if (!timeStr) return Number.NaN;
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  const seconds = parseFloat(parts[0]);
  return Number.isNaN(seconds) ? Number.NaN : seconds;
}

/** Formats seconds into "M:SS.mmm" */
function formatSecondsToLapTime(sec: number): string {
  if (Number.isNaN(sec) || !Number.isFinite(sec) || sec <= 0) return '—';
  const minutes = Math.floor(sec / 60);
  const remainder = sec % 60;
  return `${minutes}:${remainder.toFixed(3).padStart(6, '0')}`;
}

export function PaceComparison({
  selectedDriverIds,
  totalLaps,
  lapsData,
  drivers,
  pitStops,
  openF1Stints = [],
  onRemoveDriver,
  onClearAll,
}: PaceComparisonProps) {
  // Selected driver summaries
  const selectedDrivers = useMemo(() => {
    return drivers.filter((d) => selectedDriverIds.has(d.driverId));
  }, [drivers, selectedDriverIds]);

  // Driver lap times per lap (map driverId -> array of { lap, seconds, timeStr })
  const driverPaceData = useMemo(() => {
    const map = new Map<string, Array<{ lap: number; seconds: number; timeStr: string }>>();
    for (const d of selectedDrivers) {
      map.set(d.driverId, []);
    }

    for (const lap of lapsData) {
      const lapNum = parseInt(lap.number, 10);
      for (const t of lap.Timings) {
        if (selectedDriverIds.has(t.driverId)) {
          const sec = parseLapTimeToSeconds(t.time);
          if (Number.isFinite(sec) && sec > 0) {
            map.get(t.driverId)?.push({
              lap: lapNum,
              seconds: sec,
              timeStr: t.time,
            });
          }
        }
      }
    }
    return map;
  }, [selectedDrivers, selectedDriverIds, lapsData]);

  // Summary stats per driver
  const driverStats = useMemo(() => {
    return selectedDrivers.map((d) => {
      const paceArr = driverPaceData.get(d.driverId) ?? [];
      const validLaps = paceArr.filter((p) => p.seconds < 150); // filter extreme outliers
      const bestLapSec = validLaps.length > 0 ? Math.min(...validLaps.map((p) => p.seconds)) : 0;
      const bestLapObj = validLaps.find((p) => p.seconds === bestLapSec);

      // Average pace excluding pit in/out laps (over 107% of best lap)
      const normalPaceLaps = validLaps.filter((p) => bestLapSec > 0 && p.seconds <= bestLapSec * 1.08);
      const avgPaceSec =
        normalPaceLaps.length > 0
          ? normalPaceLaps.reduce((sum, p) => sum + p.seconds, 0) / normalPaceLaps.length
          : 0;

      const driverPits = pitStops.filter((p) => p.driverId === d.driverId);
      const theme = getTeamTheme(d.constructorId);

      return {
        driver: d,
        theme,
        bestLapTime: bestLapObj?.timeStr ?? '—',
        bestLapSec,
        bestLapNum: bestLapObj?.lap,
        avgPaceSec,
        pitCount: driverPits.length,
        totalLapsCompleted: d.totalLaps,
        finishPosition: d.finishPosition,
        gridPosition: d.gridPosition,
      };
    });
  }, [selectedDrivers, driverPaceData, pitStops]);

  // SVG dimensions for pace line chart
  const CHART_WIDTH = 760;
  const CHART_HEIGHT = 280;
  const PADDING_TOP = 24;
  const PADDING_BOTTOM = 32;
  const PADDING_LEFT = 50;
  const PADDING_RIGHT = 30;

  const innerWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  // Min / Max lap times for chart Y-axis scaling (clamping slow laps / safety cars)
  const { minPaceSec, maxPaceSec } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    for (const [, laps] of driverPaceData) {
      for (const pt of laps) {
        if (pt.seconds > 40 && pt.seconds < 140) {
          if (pt.seconds < min) min = pt.seconds;
          if (pt.seconds > max) max = pt.seconds;
        }
      }
    }

    if (!Number.isFinite(min)) min = 75;
    if (!Number.isFinite(max)) max = 95;

    // Add padding
    const range = max - min || 10;
    return {
      minPaceSec: Math.floor(min - 0.5),
      maxPaceSec: Math.min(Math.ceil(max + 1), min + range * 1.5),
    };
  }, [driverPaceData]);

  const getPaceX = (lap: number) => {
    if (totalLaps <= 1) return PADDING_LEFT + innerWidth / 2;
    return PADDING_LEFT + ((lap - 1) / (totalLaps - 1)) * innerWidth;
  };

  const getPaceY = (sec: number) => {
    const clamped = Math.min(Math.max(sec, minPaceSec), maxPaceSec);
    const fraction = (clamped - minPaceSec) / (maxPaceSec - minPaceSec || 1);
    // Faster lap time (smaller seconds) at the top of the chart!
    return PADDING_TOP + fraction * innerHeight;
  };

  // Deduplicated X-axis lap ticks
  const paceLapTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = totalLaps > 50 ? 10 : totalLaps > 25 ? 5 : 2;
    for (let l = 1; l <= totalLaps; l++) {
      if (l === 1 || l === totalLaps || l % step === 0) {
        ticks.push(l);
      }
    }
    return Array.from(new Set(ticks)).sort((a, b) => a - b);
  }, [totalLaps]);

  if (selectedDrivers.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-zinc-950/90 p-5 shadow-xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
            <Swords className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>Pace Comparison</span>
              <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
                {selectedDrivers.length} Drivers
              </Badge>
            </h3>
          </div>
        </div>

        {/* Selected Driver Pills & Clear Button */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedDrivers.map((d) => {
            const theme = getTeamTheme(d.constructorId);
            return (
              <Badge
                key={d.driverId}
                variant="secondary"
                className="pl-2.5 pr-1 py-1 flex items-center gap-1.5 font-mono text-xs border border-zinc-800 bg-zinc-900"
              >
                <span
                  className="size-2 rounded-full inline-block"
                  style={{ backgroundColor: theme.primary }}
                />
                <span className="font-bold text-foreground">{d.code}</span>
                <button
                  type="button"
                  onClick={() => onRemoveDriver(d.driverId)}
                  className="size-4 rounded hover:bg-zinc-800 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs h-7 text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Head to Head Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {driverStats.map((stat) => (
          <div
            key={stat.driver.driverId}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 relative overflow-hidden"
          >
            {/* Top team accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: stat.theme.primary }}
            />

            {/* Driver Identity */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-4 rounded-full"
                  style={{ backgroundColor: stat.theme.primary }}
                />
                <span className="font-bold text-sm text-foreground">{stat.driver.givenName} {stat.driver.familyName}</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs border-zinc-700">
                {formatRaceOutcome(stat.driver.status, stat.driver.positionText, stat.finishPosition)}
              </Badge>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Best Lap</span>
                <div className="font-bold text-foreground tabular-nums">{stat.bestLapTime}</div>
                {stat.bestLapNum && <div className="text-[10px] text-zinc-500">Lap {stat.bestLapNum}</div>}
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Clean Avg Pace</span>
                <div className="font-bold text-foreground tabular-nums">
                  {stat.avgPaceSec > 0 ? formatSecondsToLapTime(stat.avgPaceSec) : '—'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Pit Stops</span>
                <div className="font-bold text-foreground tabular-nums">{stat.pitCount} stops</div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Grid → Finish</span>
                <div className="font-bold text-foreground tabular-nums truncate" title={formatRaceOutcome(stat.driver.status, stat.driver.positionText, stat.finishPosition)}>
                  P{stat.gridPosition} → {formatRaceOutcome(stat.driver.status, stat.driver.positionText, stat.finishPosition)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lap Time Progression Line Chart (SVG) */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-primary" />
            Lap Time Progression (Seconds)
          </span>
        </div>

        <div className="w-full overflow-x-auto custom-scrollbar">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="w-full h-auto min-w-[620px]"
          >
            {/* Y Axis Grid lines & labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const sec = minPaceSec + frac * (maxPaceSec - minPaceSec);
              const y = PADDING_TOP + frac * innerHeight;
              return (
                <g key={`pace-grid-${frac}`}>
                  <line
                    x1={PADDING_LEFT}
                    y1={y}
                    x2={CHART_WIDTH - PADDING_RIGHT}
                    y2={y}
                    stroke="#27272a"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity={0.5}
                  />
                  <text
                    x={PADDING_LEFT - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="9"
                    fontFamily="monospace"
                    fill="#71717a"
                  >
                    {formatSecondsToLapTime(sec).split('.')[0]}
                  </text>
                </g>
              );
            })}

            {/* Driver Pace Lines */}
            {selectedDrivers.map((d) => {
              const pts = driverPaceData.get(d.driverId) ?? [];
              const theme = getTeamTheme(d.constructorId);

              if (pts.length === 0) return null;

              const pathData = pts
                .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getPaceX(pt.lap)} ${getPaceY(pt.seconds)}`)
                .join(' ');

              return (
                <g key={`pace-line-${d.driverId}`}>
                  {/* Outer line glow */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth="3.5"
                    strokeOpacity="0.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Main pace line */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Data Points */}
                  {pts.map((pt) => (
                    <circle
                      key={`pt-${d.driverId}-${pt.lap}`}
                      cx={getPaceX(pt.lap)}
                      cy={getPaceY(pt.seconds)}
                      r={pt.lap === d.fastestLap?.lap ? 4 : 2}
                      fill={pt.lap === d.fastestLap?.lap ? '#e10600' : theme.primary}
                      stroke="#09090b"
                      strokeWidth="1"
                    />
                  ))}
                </g>
              );
            })}

            {/* Lap numbers on X-axis */}
            {paceLapTicks.map((lap) => {
              const x = getPaceX(lap);
              return (
                <text
                  key={`pace-lap-tick-${lap}`}
                  x={x}
                  y={CHART_HEIGHT - PADDING_BOTTOM + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="monospace"
                  fill="#71717a"
                >
                  L{lap}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Real Stint Evolution Derived from Pit Stops & OpenF1 */}
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <Disc className="size-4 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Stint Evolution & Tyre Strategy
            </span>
            <Badge variant="outline" className="text-[9px] font-mono border-zinc-700 text-muted-foreground">
              {openF1Stints && openF1Stints.length > 0 ? 'Pirelli Telemetry' : pitStops.length > 0 ? 'Pit Strategy' : 'Single Stint'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-red-500 inline-block" /> Soft
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-yellow-400 inline-block" /> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-white inline-block" /> Hard
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-400 inline-block" /> Inter
            </span>
          </div>
        </div>

        {/* Stint Bars for Selected Drivers */}
        <div className="space-y-2 pt-1">
          {selectedDrivers.map((d) => {
            const theme = getTeamTheme(d.constructorId);
            const driverStops = pitStops
              .filter((p) => p.driverId === d.driverId)
              .sort((a, b) => (parseInt(a.stop, 10) || 0) - (parseInt(b.stop, 10) || 0));

            // Find matching OpenF1 driver stints if available
            const driverOpenF1Stints = openF1Stints?.filter(
              (s) => String(s.driverNumber) === String(d.gridPosition) || s.driverId === d.driverId
            ) ?? [];

            const effectiveTotal = Math.max(1, d.totalLaps || totalLaps);
            const stints: {
              stintNum: number;
              startLap: number;
              endLap: number;
              percent: number;
              compound?: string;
            }[] = [];

            let currentStart = 1;
            for (let i = 0; i < driverStops.length; i++) {
              const stopLap = Math.min(parseInt(driverStops[i].lap, 10) || effectiveTotal, effectiveTotal);
              const lapCount = Math.max(1, stopLap - currentStart + 1);
              const stintNum = i + 1;
              const matchedOpenF1 = driverOpenF1Stints.find((s) => s.stintNumber === stintNum);

              stints.push({
                stintNum,
                startLap: currentStart,
                endLap: stopLap,
                percent: (lapCount / effectiveTotal) * 100,
                compound: matchedOpenF1?.compound,
              });
              currentStart = stopLap + 1;
            }

            if (currentStart <= effectiveTotal) {
              const lapCount = Math.max(1, effectiveTotal - currentStart + 1);
              const stintNum = driverStops.length + 1;
              const matchedOpenF1 = driverOpenF1Stints.find((s) => s.stintNumber === stintNum);

              stints.push({
                stintNum,
                startLap: currentStart,
                endLap: effectiveTotal,
                percent: (lapCount / effectiveTotal) * 100,
                compound: matchedOpenF1?.compound,
              });
            }

            return (
              <div key={`stint-${d.driverId}`} className="flex items-center gap-3">
                <span className="w-12 text-xs font-mono font-bold text-foreground shrink-0 flex items-center gap-1">
                  <span className="size-1.5 rounded-full inline-block" style={{ backgroundColor: theme.primary }} />
                  {d.code}
                </span>

                {/* Stint Segments */}
                <div className="flex-1 h-6 rounded-md bg-zinc-950 flex overflow-hidden border border-zinc-800 font-mono text-[10px]">
                  {stints.map((stint, idx) => {
                    const compound = stint.compound?.toUpperCase();
                    const isSoft = compound === 'SOFT';
                    const isMedium = compound === 'MEDIUM';
                    const isHard = compound === 'HARD';
                    const isInter = compound === 'INTERMEDIATE';
                    const isWet = compound === 'WET';

                    const bgClass = isSoft
                      ? 'bg-red-600/30 text-red-200 border-red-500/30'
                      : isMedium
                      ? 'bg-yellow-500/30 text-yellow-200 border-yellow-500/30'
                      : isHard
                      ? 'bg-zinc-200/20 text-zinc-100 border-zinc-300/30'
                      : isInter
                      ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500/30'
                      : isWet
                      ? 'bg-blue-600/30 text-blue-200 border-blue-500/30'
                      : idx % 2 === 0
                      ? 'bg-zinc-800/60 text-zinc-300'
                      : 'bg-zinc-700/40 text-zinc-300';

                    return (
                      <div
                        key={`stint-${d.driverId}-${stint.stintNum}`}
                        style={{ width: `${stint.percent}%` }}
                        className={cn(
                          'flex items-center justify-center font-bold truncate px-1 border-r border-zinc-800/80 last:border-r-0 transition-colors',
                          bgClass
                        )}
                        title={`Stint ${stint.stintNum}${compound ? ` · ${compound}` : ''}: Lap ${stint.startLap} - Lap ${stint.endLap} (${stint.endLap - stint.startLap + 1} laps)`}
                      >
                        {compound ? (
                          <span className="flex items-center gap-1 truncate">
                            <span
                              className={cn(
                                'size-1.5 rounded-full inline-block shrink-0',
                                isSoft
                                  ? 'bg-red-500'
                                  : isMedium
                                  ? 'bg-yellow-400'
                                  : isHard
                                  ? 'bg-white'
                                  : isInter
                                  ? 'bg-emerald-400'
                                  : isWet
                                  ? 'bg-blue-400'
                                  : 'bg-zinc-400'
                              )}
                            />
                            <span>
                              {compound.slice(0, 1)} (L{stint.startLap}–{stint.endLap})
                            </span>
                          </span>
                        ) : (
                          <span>
                            Stint {stint.stintNum} (L{stint.startLap}–{stint.endLap})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
