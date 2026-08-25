'use client';

import React, { useMemo } from 'react';
import type { LapData, DriverLapSummary, PitStopEntry } from '@/types/f1';
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
              <span>Pace Comparison & Teammate Duel</span>
              <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
                {selectedDrivers.length} Drivers
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Lap-by-lap pace evolution, fastest sectors, and stint comparison
            </p>
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
          <span className="text-[11px] font-mono">
            Faster pace is higher ↑
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
                    {formatSecondsToLapTime(sec).split('.')[0]}s
                  </text>
                </g>
              );
            })}

            {/* Driver Pace Lines */}
            {selectedDrivers.map((d) => {
              const pts = driverPaceData.get(d.driverId) ?? [];
              const theme = getTeamTheme(d.constructorId);

              if (pts.length === 0) return null;

              const pathD = pts
                .map((pt, idx) => {
                  const x = getPaceX(pt.lap);
                  const y = getPaceY(pt.seconds);
                  return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ');

              return (
                <g key={`pace-line-${d.driverId}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.85}
                  />
                  {pts.map((pt) => (
                    <circle
                      key={`pt-${d.driverId}-${pt.lap}`}
                      cx={getPaceX(pt.lap)}
                      cy={getPaceY(pt.seconds)}
                      r="2.5"
                      fill={theme.primary}
                      stroke="#18181b"
                      strokeWidth="1"
                    />
                  ))}
                </g>
              );
            })}

            {/* X Axis Lap Labels */}
            {paceLapTicks.map((lap) => {
              const x = getPaceX(lap);
              return (
                <text
                  key={`pace-lap-lbl-${lap}`}
                  x={x}
                  y={CHART_HEIGHT - PADDING_BOTTOM + 18}
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

      {/* Mocked Tire Stints Section (Placeholder for OpenF1 Pirelli Stint Telemetry) */}
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc className="size-4 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Tire Compound & Stint Evolution
            </span>
            <Badge variant="outline" className="text-[9px] font-mono border-zinc-700 text-muted-foreground">
              Mock Preview
            </Badge>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            Detailed Pirelli degradation telemetry coming in next update
          </span>
        </div>

        {/* Mock Stint Bars for Selected Drivers */}
        <div className="space-y-2 pt-1">
          {selectedDrivers.map((d) => {
            const theme = getTeamTheme(d.constructorId);
            return (
              <div key={`stint-${d.driverId}`} className="flex items-center gap-3">
                <span className="w-12 text-xs font-mono font-bold text-foreground shrink-0 flex items-center gap-1">
                  <span className="size-1.5 rounded-full inline-block" style={{ backgroundColor: theme.primary }} />
                  {d.code}
                </span>

                {/* Stint Segments */}
                <div className="flex-1 h-6 rounded-md bg-zinc-950 flex overflow-hidden border border-zinc-800 font-mono text-[10px]">
                  {/* Stint 1: Medium */}
                  <div className="w-[35%] bg-yellow-500/20 border-r border-yellow-500/40 text-yellow-300 flex items-center justify-center font-bold">
                    🟡 M (L1-18)
                  </div>
                  {/* Stint 2: Hard */}
                  <div className="w-[45%] bg-zinc-100/15 border-r border-zinc-500/30 text-zinc-200 flex items-center justify-center font-bold">
                    ⚪ H (L19-42)
                  </div>
                  {/* Stint 3: Soft */}
                  <div className="w-[20%] bg-red-500/20 text-red-300 flex items-center justify-center font-bold">
                    🔴 S (L43-{totalLaps})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
