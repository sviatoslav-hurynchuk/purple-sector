'use client';

import React, { useState, useMemo } from 'react';
import { useSharedLiveSession } from '@/components/live/live-session-provider';
import { LiveStatusIndicator } from '@/components/live/live-status-indicator';
import { CountryFlag } from '@/components/f1/country-flag';
import {
  Dialog,
  DialogTrigger,
  DialogPanel,
  DialogContent,
  DialogHeader,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Flag,
  Trophy,
  Timer,
  Thermometer,
  Droplets,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LiveDriverState, RaceEvent } from '@/types/f1';

/** Extract notable race control events (SC, VSC, Red Flag) */
function getNotableEvents(events: RaceEvent[]): RaceEvent[] {
  const types = new Set(['safety_car', 'vsc', 'red_flag']);
  return events.filter((e) => types.has(e.type));
}

/** Find the driver with the fastest lap (rank 1 or best lastLapDuration) */
function findFastestLapDriver(drivers: LiveDriverState[]): LiveDriverState | null {
  // Sort by lastLapDuration ascending, filter out nulls
  const withTimes = drivers.filter((d) => d.lastLapDuration != null && d.lastLapDuration > 0);
  if (withTimes.length === 0) return null;
  return withTimes.reduce((best, d) =>
    (d.lastLapDuration ?? Infinity) < (best.lastLapDuration ?? Infinity) ? d : best
  );
}

/** Format lap time from seconds to M:SS.mmm */
function formatLapTime(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
  }
  return secs.toFixed(3);
}

export function SessionRecapModal() {
  const { state } = useSharedLiveSession();
  const [open, setOpen] = useState(false);

  // Only show when session is completed and has driver data
  const isVisible =
    state?.status === 'COMPLETED' &&
    !state.isActive &&
    state.drivers &&
    state.drivers.length > 0;

  const sortedDrivers = useMemo(() => {
    if (!state?.drivers) return [];
    return [...state.drivers].sort((a, b) => a.position - b.position);
  }, [state?.drivers]);

  const top10 = sortedDrivers.slice(0, 10);
  const fastestLapDriver = useMemo(
    () => findFastestLapDriver(state?.drivers ?? []),
    [state?.drivers]
  );
  const notableEvents = useMemo(
    () => getNotableEvents(state?.raceControlFeed ?? []),
    [state?.raceControlFeed]
  );

  if (!isVisible) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <button
          className={cn(
            'group w-full rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 via-zinc-900/80 to-zinc-950/80',
            'p-4 sm:p-5 backdrop-blur-xl shadow-lg shadow-emerald-950/10',
            'hover:border-emerald-500/40 hover:shadow-emerald-950/20 transition-all duration-300',
            'flex items-center justify-between gap-4'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              <Flag className="size-5 text-emerald-400" />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <div className="flex items-center gap-2">
                <LiveStatusIndicator status="COMPLETED" size="sm" />
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider truncate">
                  {state?.sessionType || 'Session'}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-white truncate">
                {state?.sessionName || 'Session Completed'}
              </p>
            </div>
          </div>

          {/* Quick winner preview */}
          <div className="flex items-center gap-3 shrink-0">
            {sortedDrivers[0] && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-white/5">
                <span
                  className="h-4 w-1 rounded-full shrink-0"
                  style={{ backgroundColor: sortedDrivers[0].teamColour || '#e10600' }}
                />
                <span className="text-sm font-mono font-bold text-white">
                  {sortedDrivers[0].code || sortedDrivers[0].name}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">P1</span>
              </div>
            )}
            <ChevronRight className="size-5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
          </div>
        </button>
      </DialogTrigger>

      <DialogPanel className="max-w-xl sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 min-w-0">
            {state?.countryName && (
              <CountryFlag
                countryName={state.countryName}
                className="w-7 h-5 object-cover rounded-xs border border-white/15 shadow-sm shrink-0"
              />
            )}
            <div className="min-w-0">
              <DialogTitle>
                {state?.sessionName || 'Session Recap'}
              </DialogTitle>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {state?.circuitShortName}
                {state?.countryName ? ` · ${state.countryName}` : ''}
                {state?.sessionType ? ` · ${state.sessionType}` : ''}
              </p>
            </div>
          </div>
          <DialogClose />
        </DialogHeader>

        <DialogContent className="p-0">
          {/* ── Top-10 Classification ───────────────────────────── */}
          <div className="border-b border-zinc-800">
            <div className="px-5 py-3 flex items-center gap-2">
              <Trophy className="size-4 text-amber-400" />
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                Classification
              </span>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {top10.map((driver) => (
                <div
                  key={driver.driverNumber}
                  className={cn(
                    'flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.02] transition-colors',
                    driver.position === 1 && 'bg-amber-500/[0.03]'
                  )}
                >
                  {/* Position */}
                  <span
                    className={cn(
                      'w-7 text-right font-mono font-black text-sm shrink-0',
                      driver.position === 1 && 'text-amber-400',
                      driver.position === 2 && 'text-zinc-300',
                      driver.position === 3 && 'text-orange-400',
                      driver.position > 3 && 'text-zinc-500'
                    )}
                  >
                    {driver.position}
                  </span>

                  {/* Team color bar */}
                  <span
                    className="h-5 w-1 rounded-full shrink-0"
                    style={{ backgroundColor: driver.teamColour || '#555' }}
                  />

                  {/* Driver info */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-white">
                      {driver.code || driver.name?.split(' ').pop()?.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="text-xs text-zinc-400 truncate">
                      {driver.name || `#${driver.driverNumber}`}
                    </span>
                  </div>

                  {/* Team name */}
                  <span className="hidden sm:block text-xs text-zinc-500 font-mono truncate max-w-[120px]">
                    {driver.teamName}
                  </span>

                  {/* Gap */}
                  <span className="text-xs font-mono text-zinc-400 shrink-0 w-20 text-right">
                    {driver.position === 1
                      ? (driver.lastLapDuration ? formatLapTime(driver.lastLapDuration) : 'LEADER')
                      : driver.gapToLeader != null
                        ? typeof driver.gapToLeader === 'number'
                          ? `+${driver.gapToLeader.toFixed(3)}s`
                          : `+${driver.gapToLeader}`
                        : '—'
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom Info Grid ───────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
            {/* Fastest Lap */}
            <div className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Timer className="size-3.5 text-purple-400" />
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  Fastest Lap
                </span>
              </div>
              {fastestLapDriver ? (
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-1 rounded-full shrink-0"
                    style={{ backgroundColor: fastestLapDriver.teamColour || '#a855f7' }}
                  />
                  <span className="font-mono font-bold text-sm text-white">
                    {fastestLapDriver.code || fastestLapDriver.name}
                  </span>
                  <span className="font-mono text-sm text-purple-400">
                    {formatLapTime(fastestLapDriver.lastLapDuration)}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-zinc-500 font-mono">No data</span>
              )}
            </div>

            {/* Weather */}
            <div className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Thermometer className="size-3.5 text-sky-400" />
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  Track Conditions
                </span>
              </div>
              {state?.weather ? (
                <div className="flex flex-wrap items-center gap-3 text-sm font-mono">
                  <span className="text-white">
                    {Math.round(state.weather.trackTemperature ?? 0)}°C
                    <span className="text-zinc-500 ml-1">Track</span>
                  </span>
                  <span className="text-white">
                    {Math.round(state.weather.airTemperature ?? 0)}°C
                    <span className="text-zinc-500 ml-1">Air</span>
                  </span>
                  <span className={cn(
                    'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border',
                    state.weather.rainfall
                      ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  )}>
                    <Droplets className="size-3" />
                    {state.weather.rainfall ? 'WET' : 'DRY'}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-zinc-500 font-mono">No weather data</span>
              )}
            </div>
          </div>

          {/* Notable Race Control Events */}
          {notableEvents.length > 0 && (
            <div className="border-t border-zinc-800 p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-3.5 text-amber-400" />
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  Race Control
                </span>
              </div>
              <div className="space-y-1.5">
                {notableEvents.slice(-5).map((event, i) => (
                  <div
                    key={`${event.type}-${event.lap}-${i}`}
                    className={cn(
                      'flex items-center gap-2 text-xs font-mono px-2.5 py-1.5 rounded-lg border',
                      event.type === 'safety_car' && 'bg-amber-500/5 text-amber-300 border-amber-500/15',
                      event.type === 'vsc' && 'bg-amber-500/5 text-amber-300 border-amber-500/15',
                      event.type === 'red_flag' && 'bg-red-500/5 text-red-300 border-red-500/15'
                    )}
                  >
                    <ShieldAlert className="size-3.5 shrink-0" />
                    <span className="font-bold uppercase">
                      {event.type === 'safety_car' ? 'SC' : event.type === 'vsc' ? 'VSC' : 'RED FLAG'}
                    </span>
                    {(event.lap ?? 0) > 0 && (
                      <span className="text-zinc-400">
                        Lap {event.lap}{event.endLap ? `–${event.endLap}` : ''}
                      </span>
                    )}
                    <span className="text-zinc-500 truncate flex-1">
                      {event.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </DialogPanel>
    </Dialog>
  );
}
