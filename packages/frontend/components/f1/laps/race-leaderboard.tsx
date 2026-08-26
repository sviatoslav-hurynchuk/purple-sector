'use client';

import React, { useMemo } from 'react';
import type { LapData, DriverLapSummary, PitStopEntry } from '@/types/f1';
import { getTeamTheme } from '@/lib/team-colors';
import { isDnfStatus, isLappedStatus } from '@/lib/f1-status';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus, Check, Timer, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RaceLeaderboardProps {
  currentLap: number;
  totalLaps: number;
  lapsData: LapData[];
  drivers: DriverLapSummary[];
  pitStops: PitStopEntry[];
  selectedDriverIds: Set<string>;
  isPaused: boolean;
  isFullscreen?: boolean;
  onToggleDriver: (driverId: string) => void;
}

interface LeaderboardRow {
  driverId: string;
  driverName: string;
  code: string;
  constructorId: string;
  constructorName: string;
  position: number;
  gridPosition: number;
  lapTime?: string;
  isPitStopThisLap: boolean;
  pitStopNumber?: string;
  pitDuration?: string;
  isDnf: boolean;
  dnfStatus?: string;
  isLapped: boolean;
  lappedStatus?: string;
  totalLapsCompleted: number;
}

export function RaceLeaderboard({
  currentLap,
  totalLaps,
  lapsData,
  drivers,
  pitStops,
  selectedDriverIds,
  isPaused,
  isFullscreen = false,
  onToggleDriver,
}: RaceLeaderboardProps) {
  // Driver lookup map
  const driverMap = useMemo(() => {
    const map = new Map<string, DriverLapSummary>();
    for (const d of drivers) {
      map.set(d.driverId, d);
    }
    return map;
  }, [drivers]);

  // Find timings for current lap
  const currentLapTimings = useMemo(() => {
    const lap = lapsData.find((l) => parseInt(l.number, 10) === currentLap);
    return lap?.Timings ?? [];
  }, [lapsData, currentLap]);

  // Pit stops map by lap
  const pitStopsByLap = useMemo(() => {
    const map = new Map<string, PitStopEntry[]>();
    for (const p of pitStops) {
      const key = `${p.driverId}:${p.lap}`;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return map;
  }, [pitStops]);

  // Map lap number to LapData for O(1) direct lookup
  const lapsByNumber = useMemo(() => {
    const map = new Map<number, LapData>();
    for (const l of lapsData) {
      map.set(parseInt(l.number, 10), l);
    }
    return map;
  }, [lapsData]);

  // Build sorted leaderboard rows
  const leaderboardRows = useMemo<LeaderboardRow[]>(() => {
    const timingsMap = new Map(currentLapTimings.map((t) => [t.driverId, t]));
    const activeRows: LeaderboardRow[] = [];
    const dnfRows: LeaderboardRow[] = [];

    for (const driver of drivers) {
      const timing = timingsMap.get(driver.driverId);
      const isDnf = isDnfStatus(driver.status, driver.positionText) && currentLap > driver.totalLaps;
      const isLapped = isLappedStatus(driver.status);
      const pitEntries = pitStopsByLap.get(`${driver.driverId}:${currentLap}`);
      const latestPit = pitEntries?.[0];

      if (timing) {
        const pos = parseInt(timing.position, 10);
        activeRows.push({
          driverId: driver.driverId,
          driverName: `${driver.givenName} ${driver.familyName}`,
          code: driver.code,
          constructorId: driver.constructorId,
          constructorName: driver.constructorName,
          position: pos,
          gridPosition: driver.gridPosition,
          lapTime: timing.time,
          isPitStopThisLap: Boolean(latestPit),
          pitStopNumber: latestPit?.stop,
          pitDuration: latestPit?.duration,
          isDnf: false,
          isLapped: false,
          totalLapsCompleted: currentLap,
        });
      } else if (isDnf) {
        dnfRows.push({
          driverId: driver.driverId,
          driverName: `${driver.givenName} ${driver.familyName}`,
          code: driver.code,
          constructorId: driver.constructorId,
          constructorName: driver.constructorName,
          position: driver.finishPosition || 99,
          gridPosition: driver.gridPosition,
          isPitStopThisLap: false,
          isDnf: true,
          dnfStatus: driver.status,
          isLapped: false,
          totalLapsCompleted: driver.totalLaps,
        });
      } else {
        // Driver might not have timing this exact lap (lapped / took flag on earlier lap)
        let lastTimingPos: number | undefined;
        let lastTimingTime: string | undefined;

        for (let l = currentLap - 1; l >= 1; l--) {
          const lapObj = lapsByNumber.get(l);
          const t = lapObj?.Timings.find((x) => x.driverId === driver.driverId);
          if (t) {
            lastTimingPos = parseInt(t.position, 10);
            lastTimingTime = t.time;
            break;
          }
        }

        activeRows.push({
          driverId: driver.driverId,
          driverName: `${driver.givenName} ${driver.familyName}`,
          code: driver.code,
          constructorId: driver.constructorId,
          constructorName: driver.constructorName,
          position: lastTimingPos ?? driver.finishPosition ?? 99,
          gridPosition: driver.gridPosition,
          lapTime: lastTimingTime,
          isPitStopThisLap: false,
          isDnf: false,
          isLapped,
          lappedStatus: isLapped ? driver.status : undefined,
          totalLapsCompleted: driver.totalLaps,
        });
      }
    }

    activeRows.sort((a, b) => a.position - b.position);
    dnfRows.sort((a, b) => a.position - b.position);

    return [...activeRows, ...dnfRows];
  }, [currentLap, currentLapTimings, drivers, lapsByNumber, pitStopsByLap]);

  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden flex flex-col shadow-md',
        isFullscreen ? 'h-full' : 'h-[640px] lg:h-[660px]'
      )}
    >
      {/* Leaderboard Header */}
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-3">
            <span>Race Leaderboard</span>
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-zinc-700 bg-zinc-800/50">
              Lap {currentLap}/{totalLaps}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {isPaused ? (
                  <span className="text-primary font-medium">Select drivers to compare</span>
              ) : (
                  <span>Pause replay to select drivers</span>
              )}
            </p>
            {selectedDriverIds.size > 0 && (
              <Badge
                  variant="secondary"
                  className="text-[10px] font-mono bg-primary/20 text-primary border-primary/30"
              >
                {selectedDriverIds.size}
              </Badge>
          )}
          </h2>


      </div>

      {/* Driver list */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60 p-2 space-y-1 custom-scrollbar">
        {leaderboardRows.map((row) => {
          const theme = getTeamTheme(row.constructorId);
          const isSelected = selectedDriverIds.has(row.driverId);
          const posDelta = row.gridPosition > 0 ? row.gridPosition - row.position : 0;

          return (
            <button
              key={row.driverId}
              type="button"
              onClick={() => isPaused && onToggleDriver(row.driverId)}
              disabled={!isPaused}
              className={cn(
                'w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all select-none',
                isSelected
                  ? 'bg-zinc-800/90 border border-primary/40 shadow-xs'
                  : 'hover:bg-zinc-900/60 border border-transparent',
                !isPaused && 'cursor-default opacity-90'
              )}
            >
              {/* Left: Position & Delta & Color Bar */}
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Position Badge */}
                <div
                  className={cn(
                    'size-6.5 rounded-md flex items-center justify-center font-mono font-bold text-xs shrink-0',
                    row.isDnf
                      ? 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                      : row.position === 1
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : row.position <= 3
                      ? 'bg-zinc-800 text-foreground border border-zinc-700'
                      : 'bg-zinc-900/80 text-muted-foreground border border-zinc-800'
                  )}
                >
                  {row.isDnf ? 'DNF' : row.position}
                </div>

                {/* Team Color Pillar */}
                <div
                  className="w-1 h-5 rounded-full shrink-0"
                  style={{ backgroundColor: theme.primary }}
                />

                {/* Driver Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-foreground tracking-tight">
                      {row.code}
                    </span>
                    <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                      {row.driverName}
                    </span>
                    {isSelected && (
                      <Check className="size-3 text-primary shrink-0 ml-0.5" />
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {row.constructorName}
                  </div>
                </div>
              </div>

              {/* Right: Lap time, Delta / Pit / DNF status */}
              <div className="flex items-center gap-2.5 text-right shrink-0">
                {/* Pit Stop Badge */}
                {row.isPitStopThisLap && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] font-mono px-1.5 py-0 flex items-center gap-1">
                    <Timer className="size-2.5" />
                    <span>PIT {row.pitDuration ? `${row.pitDuration}s` : ''}</span>
                  </Badge>
                )}

                {/* Status Column: DNF vs Lapped vs Active Lap Time */}
                {row.isDnf ? (
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-mono font-bold text-red-400">
                      OUT L{row.totalLapsCompleted}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[85px]" title={row.dnfStatus}>
                      {row.dnfStatus}
                    </span>
                  </div>
                ) : row.isLapped && currentLap >= row.totalLapsCompleted ? (
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {row.lappedStatus || '+1 Lap'}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Fin L{row.totalLapsCompleted}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-mono font-medium text-foreground tabular-nums">
                      {row.lapTime ?? '—'}
                    </span>
                    {/* Position Change vs Grid */}
                    {row.gridPosition > 0 && (
                      <div className="flex items-center text-[10px] font-mono">
                        {posDelta > 0 ? (
                          <span className="text-emerald-400 flex items-center">
                            <ArrowUp className="size-2.5 mr-0.5" />+{posDelta}
                          </span>
                        ) : posDelta < 0 ? (
                          <span className="text-red-400 flex items-center">
                            <ArrowDown className="size-2.5 mr-0.5" />{posDelta}
                          </span>
                        ) : (
                          <span className="text-zinc-500 flex items-center">
                            <Minus className="size-2.5 mr-0.5" />0
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
