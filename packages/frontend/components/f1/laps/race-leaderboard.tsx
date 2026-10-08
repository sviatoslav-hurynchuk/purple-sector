'use client';

import React, { useMemo } from 'react';
import type { LapData, DriverLapSummary, PitStopEntry } from '@/types/f1';
import { isDnfStatus, isLappedStatus } from '@/lib/f1-status';
import { TeamLogo } from '@/components/f1/team-logo';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus, Check, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RaceLeaderboardProps {
  currentLap: number;
  totalLaps: number;
  lapsData: LapData[];
  drivers: DriverLapSummary[];
  pitStops: PitStopEntry[];
  selectedDriverIds: Set<string>;
  isPaused: boolean;
  season?: string | number;
  isFullscreen?: boolean;
  className?: string;
  onToggleDriver: (driverId: string) => void;
}

interface LeaderboardRow {
  driverId: string;
  driverName: string;
  givenName: string;
  familyName: string;
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
  prevLapPosition: number;
  lapDelta: number;
  overtakeType: 'gain' | 'loss' | 'none';
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

export function RaceLeaderboard({
  currentLap,
  totalLaps,
  lapsData,
  drivers,
  pitStops,
  selectedDriverIds,
  isPaused,
  season = '2026',
  isFullscreen = false,
  className,
  onToggleDriver,
}: RaceLeaderboardProps) {
  // DOM element and animation tracking for smooth F1 broadcast FLIP reordering
  const itemRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const prevRectsRef = React.useRef<Map<string, number>>(new Map());
  const activeAnimationsRef = React.useRef<Map<string, Animation>>(new Map());

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

  // Build sorted leaderboard rows with previous-lap overtake detection
  const leaderboardRows = useMemo<LeaderboardRow[]>(() => {
    // Special handling for Lap 0: Starting Grid
    if (currentLap === 0) {
      const sortedGridDrivers = [...drivers].sort((a, b) => {
        const posA = a.gridPosition > 0 ? a.gridPosition : 99;
        const posB = b.gridPosition > 0 ? b.gridPosition : 99;
        return posA - posB;
      });

      return sortedGridDrivers.map((driver, idx) => {
        const pos = driver.gridPosition > 0 ? driver.gridPosition : idx + 1;
        return {
          driverId: driver.driverId,
          driverName: `${driver.givenName} ${driver.familyName}`,
          givenName: driver.givenName,
          familyName: driver.familyName || driver.code,
          code: driver.code,
          constructorId: driver.constructorId,
          constructorName: driver.constructorName,
          position: pos,
          gridPosition: driver.gridPosition,
          lapTime: '—',
          isPitStopThisLap: false,
          isDnf: false,
          isLapped: false,
          totalLapsCompleted: 0,
          prevLapPosition: pos,
          lapDelta: 0,
          overtakeType: 'none',
        };
      });
    }

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

        // Previous lap position to detect overtake change on this lap transition
        let prevLapPosition = driver.gridPosition || pos;
        if (currentLap > 1) {
          const prevLapObj = lapsByNumber.get(currentLap - 1);
          const prevTiming = prevLapObj?.Timings.find((x) => x.driverId === driver.driverId);
          if (prevTiming) {
            prevLapPosition = parseInt(prevTiming.position, 10) || prevLapPosition;
          }
        }
        const lapDelta = prevLapPosition - pos;
        const overtakeType: 'gain' | 'loss' | 'none' =
          lapDelta > 0 ? 'gain' : lapDelta < 0 ? 'loss' : 'none';

        activeRows.push({
          driverId: driver.driverId,
          driverName: `${driver.givenName} ${driver.familyName}`,
          givenName: driver.givenName,
          familyName: driver.familyName || driver.code,
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
          prevLapPosition,
          lapDelta,
          overtakeType,
        });
      } else if (isDnf) {
        dnfRows.push({
          driverId: driver.driverId,
          driverName: `${driver.givenName} ${driver.familyName}`,
          givenName: driver.givenName,
          familyName: driver.familyName || driver.code,
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
          prevLapPosition: driver.gridPosition || 99,
          lapDelta: 0,
          overtakeType: 'none',
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

        const pos = lastTimingPos ?? driver.finishPosition ?? 99;
        let prevLapPosition = driver.gridPosition || pos;
        if (currentLap > 1) {
          const prevLapObj = lapsByNumber.get(currentLap - 1);
          const prevTiming = prevLapObj?.Timings.find((x) => x.driverId === driver.driverId);
          if (prevTiming) {
            prevLapPosition = parseInt(prevTiming.position, 10) || prevLapPosition;
          }
        }
        const lapDelta = prevLapPosition - pos;
        const overtakeType: 'gain' | 'loss' | 'none' =
          lapDelta > 0 ? 'gain' : lapDelta < 0 ? 'loss' : 'none';

        activeRows.push({
          driverId: driver.driverId,
          driverName: `${driver.givenName} ${driver.familyName}`,
          givenName: driver.givenName,
          familyName: driver.familyName || driver.code,
          code: driver.code,
          constructorId: driver.constructorId,
          constructorName: driver.constructorName,
          position: pos,
          gridPosition: driver.gridPosition,
          lapTime: lastTimingTime,
          isPitStopThisLap: false,
          isDnf: false,
          isLapped,
          lappedStatus: isLapped ? driver.status : undefined,
          totalLapsCompleted: driver.totalLaps,
          prevLapPosition,
          lapDelta,
          overtakeType,
        });
      }
    }

    activeRows.sort((a, b) => a.position - b.position);
    dnfRows.sort((a, b) => a.position - b.position);

    return [...activeRows, ...dnfRows];
  }, [currentLap, currentLapTimings, drivers, lapsByNumber, pitStopsByLap]);

  // Smooth FLIP (First, Last, Invert, Play) Layout Animation for F1 Broadcast Overtakes
  useIsomorphicLayoutEffect(() => {
    const prevRects = prevRectsRef.current;
    const currentRects = new Map<string, number>();

    // 1. Measure each driver row and smoothly animate if position changed
    for (const row of leaderboardRows) {
      const el = itemRefs.current.get(row.driverId);
      if (!el) continue;

      const newTop = el.getBoundingClientRect().top;
      currentRects.set(row.driverId, newTop);

      const oldTop = prevRects.get(row.driverId);
      if (oldTop !== undefined) {
        const deltaY = oldTop - newTop;

        // Cancel previous animation cleanly if a new lap update arrives mid-flight
        const prevAnim = activeAnimationsRef.current.get(row.driverId);
        if (prevAnim) {
          prevAnim.cancel();
          activeAnimationsRef.current.delete(row.driverId);
        }

        if (Math.abs(deltaY) > 0.5) {
          const anim = el.animate(
            [
              { transform: `translateY(${deltaY}px)` },
              { transform: 'translateY(0px)' },
            ],
            {
              duration: 380,
              easing: 'cubic-bezier(0.2, 0, 0, 1)',
              fill: 'none',
            }
          );

          activeAnimationsRef.current.set(row.driverId, anim);

          anim.onfinish = () => {
            if (activeAnimationsRef.current.get(row.driverId) === anim) {
              activeAnimationsRef.current.delete(row.driverId);
            }
          };
        }
      }
    }

    // 2. Save current rects for the next lap update
    prevRectsRef.current = currentRects;
  }, [leaderboardRows]);

  const setItemRef = (driverId: string, el: HTMLButtonElement | null) => {
    if (el) {
      itemRefs.current.set(driverId, el);
    } else {
      itemRefs.current.delete(driverId);
    }
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-zinc-950/90 overflow-hidden flex flex-col shadow-xl h-full min-h-0',
        isFullscreen ? 'h-full' : 'h-full min-h-0 max-h-full',
        className
      )}
    >
      {/* Leaderboard Header */}
      <div className="p-3.5 sm:p-4 border-b border-white/10 bg-zinc-900/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <span>Leaderboard</span>
              <Badge variant="outline" className="text-[10px] font-mono font-bold px-2 py-0.5 border-white/10 bg-zinc-900/80 text-zinc-300">
                {currentLap === 0 ? 'Grid' : `Lap ${currentLap}/${totalLaps}`}
              </Badge>
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-zinc-400">
              {isPaused ? (
                <span className="text-zinc-300">Compare up to 4</span>
              ) : (
                <span>Replay active</span>
              )}
            </span>
            {selectedDriverIds.size > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] font-mono font-bold bg-red-600/20 text-red-400 border border-red-500/30 px-1.5 py-0"
              >
                {selectedDriverIds.size}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Driver list */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-white/5 p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {leaderboardRows.map((row) => {
          const isSelected = selectedDriverIds.has(row.driverId);
          const posDelta = currentLap === 0 ? 0 : (row.gridPosition > 0 ? row.gridPosition - row.position : 0);

          return (
            <button
              key={row.driverId}
              ref={(el) => setItemRef(row.driverId, el)}
              type="button"
              onClick={() => isPaused && onToggleDriver(row.driverId)}
              disabled={!isPaused}
              className={cn(
                'w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors select-none relative will-change-transform',
                isSelected
                  ? 'bg-zinc-800/80 border border-white/20 ring-1 ring-white/10 shadow-sm'
                  : 'hover:bg-zinc-900/60 border border-transparent',
                !isPaused && 'cursor-default opacity-90'
              )}
            >
              {/* Left: Position, Overtake Arrow, Team Logo, Driver Surname */}
              <div className="flex items-center gap-2 min-w-0">
                {/* Position Badge */}
                <div
                  className={cn(
                    'size-6 rounded-md flex items-center justify-center font-mono text-xs shrink-0',
                    row.isDnf
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 font-black text-[10px]'
                      : row.position === 1
                      ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40 font-black shadow-xs'
                      : row.position <= 3
                      ? 'bg-zinc-800 text-zinc-200 ring-1 ring-white/10 font-bold'
                      : 'bg-zinc-900/80 text-zinc-400 border border-white/5 font-semibold'
                  )}
                >
                  {row.isDnf ? 'DNF' : row.position}
                </div>

                {/* F1 Broadcast Overtake Indicator Arrow */}
                <div className="w-3 flex items-center justify-center shrink-0">
                  {row.overtakeType === 'gain' ? (
                    <span
                      key={`gain-${currentLap}-${row.driverId}`}
                      className="text-[10px] text-emerald-400 font-black leading-none drop-shadow-[0_0_6px_rgba(52,211,153,0.85)] animate-in zoom-in-75 duration-200"
                      title={`Gained +${row.lapDelta} position${row.lapDelta > 1 ? 's' : ''} on lap ${currentLap}`}
                    >
                      ▲
                    </span>
                  ) : row.overtakeType === 'loss' ? (
                    <span
                      key={`loss-${currentLap}-${row.driverId}`}
                      className="text-[10px] text-rose-500 font-black leading-none drop-shadow-[0_0_6px_rgba(244,63,94,0.85)] animate-in zoom-in-75 duration-200"
                      title={`Lost ${Math.abs(row.lapDelta)} position${Math.abs(row.lapDelta) > 1 ? 's' : ''} on lap ${currentLap}`}
                    >
                      ▼
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-700 select-none">·</span>
                  )}
                </div>

                {/* Team Logo */}
                <TeamLogo constructorId={row.constructorId} season={season} size={22} className="size-5.5 shrink-0" />

                {/* Driver Full Surname in Uppercase */}
                <div className="min-w-0 flex items-center gap-1.5">
                  <span className="font-mono font-black text-xs tracking-wider text-white uppercase truncate">
                    {row.familyName}
                  </span>
                  {isSelected && (
                    <Check className="size-3 text-red-500 shrink-0 ml-0.5" />
                  )}
                </div>
              </div>

              {/* Right: Lap time, Delta / Pit / DNF status */}
              <div className="flex items-center gap-2.5 text-right shrink-0">
                {/* Pit Stop Badge */}
                {row.isPitStopThisLap && (
                  <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-mono px-1.5 py-0 flex items-center gap-1">
                    <Timer className="size-2.5" />
                    <span>PIT {row.pitDuration ? `${row.pitDuration}s` : ''}</span>
                  </Badge>
                )}

                {/* Status Column: DNF vs Lapped vs Active Lap Time */}
                {row.isDnf ? (
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-mono font-bold text-rose-400">
                      OUT L{row.totalLapsCompleted}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[85px]" title={row.dnfStatus}>
                      {row.dnfStatus}
                    </span>
                  </div>
                ) : row.isLapped && currentLap >= row.totalLapsCompleted ? (
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-mono font-bold text-sky-400">
                      {row.lappedStatus || '+1 Lap'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Fin L{row.totalLapsCompleted}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-mono font-bold text-white tabular-nums">
                      {row.lapTime ?? '—'}
                    </span>
                    {/* Position Change vs Grid */}
                    {row.gridPosition > 0 && (
                      <div className="flex items-center text-[10px] font-mono">
                        {posDelta > 0 ? (
                          <span className="text-emerald-400 flex items-center font-bold">
                            <ArrowUp className="size-2.5 mr-0.5" />+{posDelta}
                          </span>
                        ) : posDelta < 0 ? (
                          <span className="text-rose-400 flex items-center font-bold">
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
