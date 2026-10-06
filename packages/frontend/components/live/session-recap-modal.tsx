'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSharedLiveSession } from '@/components/live/live-session-provider';
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
  Trophy,
  Timer,
  Thermometer,
  Droplets,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clientFetchNullable } from '@/lib/api-client';
import type { LiveDriverState, RaceEvent, Race } from '@/types/f1';

/**
 * Resolves the start time of Free Practice 1 (or the first session of the weekend)
 * for a given race.
 */
function getWeekendPracticeStartDate(race: Race): Date | null {
  // 1. Check FirstPractice
  if (race.FirstPractice?.date) {
    const timeStr = race.FirstPractice.time
      ? (race.FirstPractice.time.endsWith('Z')
          ? race.FirstPractice.time
          : `${race.FirstPractice.time}Z`)
      : '10:00:00Z';
    const d = new Date(`${race.FirstPractice.date}T${timeStr}`);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Check any other practice / sprint qualifying session
  const otherSessions = [
    race.SprintQualifying,
    race.SprintShootout,
    race.SecondPractice,
    race.ThirdPractice,
    race.Qualifying,
  ];
  for (const s of otherSessions) {
    if (s?.date) {
      const timeStr = s.time
        ? (s.time.endsWith('Z') ? s.time : `${s.time}Z`)
        : '10:00:00Z';
      const d = new Date(`${s.date}T${timeStr}`);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 3. Fallback to 2 days before the Sunday race date (Friday at 10:00 UTC)
  if (race.date) {
    const timeStr = race.time
      ? (race.time.endsWith('Z') ? race.time : `${race.time}Z`)
      : '12:00:00Z';
    const raceDate = new Date(`${race.date}T${timeStr}`);
    if (!isNaN(raceDate.getTime())) {
      return new Date(raceDate.getTime() - 2 * 86400000);
    }
  }

  return null;
}

/** Extract notable race control events (SC, VSC, Red Flag, Penalty). */
function getNotableEvents(events: RaceEvent[]): RaceEvent[] {
  const types = new Set(['safety_car', 'vsc', 'red_flag', 'penalty']);
  return events.filter((e) => types.has(e.type));
}

/** Helper to determine if a session is a Race or Sprint session */
function isRaceOrSprintSession(sessionType?: string | null): boolean {
  if (!sessionType) return false;
  const lower = sessionType.toLowerCase().trim();
  if (lower.includes('qualifying') || lower.includes('shootout') || lower.includes('practice')) {
    return false;
  }
  return lower.includes('race') || lower.includes('sprint');
}

/** Find the driver with the session's best (fastest) lap time. */
function findBestLapDriver(drivers: LiveDriverState[]): {
  driver: LiveDriverState;
  lapDuration: number;
} | null {
  // Prefer official session best lap if present on LiveDriverState
  const withBest = drivers.filter(
    (d) => d.bestLapTime != null && d.bestLapTime > 0
  );
  if (withBest.length > 0) {
    const best = withBest.reduce((prev, d) =>
      (d.bestLapTime ?? Infinity) < (prev.bestLapTime ?? Infinity) ? d : prev
    );
    return { driver: best, lapDuration: best.bestLapTime! };
  }

  // Fallback to recorded lap times if available
  const withTimes = drivers.filter((d) => d.lastLapDuration != null && d.lastLapDuration > 0);
  if (withTimes.length === 0) return null;
  const best = withTimes.reduce((prev, d) =>
    (d.lastLapDuration ?? Infinity) < (prev.lastLapDuration ?? Infinity) ? d : prev
  );
  return { driver: best, lapDuration: best.lastLapDuration! };
}

/** Format lap time in seconds to M:SS.mmm display format. */
function formatLapTime(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
  }
  return secs.toFixed(3);
}

// ── Trigger button ────────────────────────────────────────────────────────────

export interface SessionResultsButtonProps extends React.ComponentPropsWithRef<'button'> {
  /** Whether this is a Race session type (adds country flag). */
  isRace: boolean;
  /** Country name for the race flag (only used when isRace=true). */
  countryName?: string;
  /** Session type label, e.g. "Race", "Qualifying". */
  sessionType: string;
}

/**
 * Compact inline button styled to match CountdownWidget.
 * Renders next to the countdown in NextRaceCard.
 * Forwards ref and button props from DialogTrigger for proper focus management.
 */
export const SessionResultsButton = React.forwardRef<HTMLButtonElement, SessionResultsButtonProps>(
  function SessionResultsButton(
    { isRace, countryName, sessionType, className, type = 'button', ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'group inline-flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl',
          'bg-zinc-950/80 border border-zinc-800 hover:border-emerald-600/50 hover:bg-zinc-900/90',
          'transition-all cursor-pointer',
          className
        )}
        {...props}
      >
        {isRace && countryName && (
          <CountryFlag
            countryName={countryName}
            width={18}
            height={14}
            className="w-4 h-3 rounded-xs border border-zinc-700/50 shrink-0"
          />
        )}
        <span className="font-mono text-xs sm:text-sm font-black text-zinc-300 group-hover:text-white tracking-tight whitespace-nowrap">
          {sessionType} Results
        </span>
        <svg
          className="size-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    );
  }
);
SessionResultsButton.displayName = 'SessionResultsButton';

// ── Full modal component ──────────────────────────────────────────────────────

interface SessionRecapModalProps {
  className?: string;
  nextRace?: Race | null;
}

/**
 * Session recap dialog.
 *
 * Visibility rules:
 *  - Only shown when status === 'COMPLETED' and drivers data is present.
 *  - Persists until the start of the next race weekend (specifically until Free Practice 1 begins).
 *  - Disappears immediately when a new live session becomes active.
 *
 * The trigger is the compact `SessionResultsButton` rendered beside CountdownWidget
 * inside NextRaceCard. This component renders the Dialog only (no outer trigger).
 */
export function SessionRecapModal({ className, nextRace }: SessionRecapModalProps) {
  const { state } = useSharedLiveSession();
  const [open, setOpen] = useState(false);

  // Stable references to avoid optional-chaining in deps (fixes react-hooks/preserve-manual-memoization)
  const drivers = state?.drivers ?? null;
  const raceControlFeed = state?.raceControlFeed ?? null;

  // Compute initial practice timestamp from nextRace synchronously (zero render cascade)
  const initialPracticeMs = useMemo(() => {
    if (!nextRace) return null;
    const d = getWeekendPracticeStartDate(nextRace);
    return d ? d.getTime() : null;
  }, [nextRace]);

  // State for asynchronously fetched subsequent round practice timestamp (if nextRace was completed)
  const [subsequentPracticeMs, setSubsequentPracticeMs] = useState<number | null>(null);

  const nextPracticeMs = subsequentPracticeMs ?? initialPracticeMs;

  // Clock state to automatically re-evaluate visibility as time advances
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Resolve upcoming practice start time asynchronously if needed
  useEffect(() => {
    if (!nextRace) {
      // If nextRace prop is omitted, fetch current next race automatically
      clientFetchNullable<Race>('/api/races/next')
        .then((race) => {
          if (!race) return;
          const practiceDate = getWeekendPracticeStartDate(race);
          if (practiceDate && practiceDate.getTime() > Date.now()) {
            setSubsequentPracticeMs(practiceDate.getTime());
          }
        })
        .catch(() => {});
      return;
    }

    const practiceDate = getWeekendPracticeStartDate(nextRace);
    const now = Date.now();

    // If nextRace's practice is already in the past (e.g. nextRace is the completed race),
    // look up round + 1 asynchronously from the season schedule
    if (!practiceDate || practiceDate.getTime() <= now) {
      const season = nextRace.season || new Date().getFullYear();
      const currentRoundNum = parseInt(nextRace.round, 10);
      if (!isNaN(currentRoundNum)) {
        clientFetchNullable<{ season: string; races: Race[] }>(`/api/races/${season}`)
          .then((data) => {
            if (!data?.races) return;
            const subsequentRace = data.races.find(
              (r) => parseInt(r.round, 10) === currentRoundNum + 1
            );
            if (subsequentRace) {
              const subDate = getWeekendPracticeStartDate(subsequentRace);
              if (subDate) {
                setSubsequentPracticeMs(subDate.getTime());
              }
            }
          })
          .catch(() => {});
      }
    }
  }, [nextRace]);

  const isBeforeNextPractice = nextPracticeMs == null || nowMs < nextPracticeMs;

  const isVisible =
    state?.status === 'COMPLETED' &&
    !state.isActive &&
    isBeforeNextPractice &&
    drivers &&
    drivers.length > 0;

  const sortedDrivers = useMemo(() => {
    if (!drivers) return [];
    return [...drivers].sort((a, b) => a.position - b.position);
  }, [drivers]);

  const top10 = sortedDrivers.slice(0, 10);

  const sessionType = state?.sessionType ?? 'Session';
  const isRaceOrSprint = useMemo(() => isRaceOrSprintSession(sessionType), [sessionType]);
  const isRace = sessionType.toLowerCase().includes('race');
  const countryName = state?.countryName;

  const bestLapInfo = useMemo(() => {
    if (!isRaceOrSprint || !drivers) return null;
    return findBestLapDriver(drivers);
  }, [isRaceOrSprint, drivers]);

  const showBestLap = isRaceOrSprint && bestLapInfo !== null;

  const notableEvents = useMemo(
    () => getNotableEvents(raceControlFeed ?? []),
    [raceControlFeed]
  );

  if (!isVisible) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <SessionResultsButton
          isRace={isRace}
          countryName={countryName}
          sessionType={sessionType}
          className={className}
        />
      </DialogTrigger>

      <DialogPanel className="max-w-xl sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 min-w-0">
            {countryName && (
              <CountryFlag
                countryName={countryName}
                className="w-7 h-5 object-cover rounded-xs border border-white/15 shadow-sm shrink-0"
              />
            )}
            <div className="min-w-0">
              <DialogTitle>
                {state?.sessionName || 'Session Recap'}
              </DialogTitle>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {state?.circuitShortName}
                {countryName ? ` · ${countryName}` : ''}
              </p>
            </div>
          </div>
          <DialogClose />
        </DialogHeader>

        <DialogContent className="p-0">
          {/* ── Top-10 Classification ─────────────────────────────────── */}
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
                      ? 'LEADER'
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

          {/* ── Bottom Info Grid ──────────────────────────────────────── */}
          <div
            className={cn(
              'grid divide-zinc-800',
              showBestLap
                ? 'grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x'
                : 'grid-cols-1'
            )}
          >
            {/* Best Lap (Only shown for Race and Sprint sessions) */}
            {showBestLap && bestLapInfo && (
              <div className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Timer className="size-3.5 text-purple-400" />
                  <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Best Lap
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-1 rounded-full shrink-0"
                    style={{ backgroundColor: bestLapInfo.driver.teamColour || '#a855f7' }}
                  />
                  <span className="font-mono font-bold text-sm text-white">
                    {bestLapInfo.driver.code || bestLapInfo.driver.name}
                  </span>
                  <span className="font-mono text-sm font-bold text-purple-400">
                    {formatLapTime(bestLapInfo.lapDuration)}
                  </span>
                </div>
              </div>
            )}

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
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-3.5 text-amber-400" />
                  <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Race Control
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {notableEvents.length} {notableEvents.length === 1 ? 'event' : 'events'}
                </span>
              </div>
              <div className="max-h-32 sm:max-h-36 overflow-y-auto space-y-1.5 pr-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {notableEvents.map((event, i) => (
                  <div
                    key={`${event.type}-${event.lap ?? 0}-${i}`}
                    className={cn(
                      'flex items-center gap-2 text-xs font-mono px-2.5 py-1.5 rounded-lg border',
                      event.type === 'safety_car' && 'bg-amber-500/5 text-amber-300 border-amber-500/15',
                      event.type === 'vsc' && 'bg-amber-500/5 text-amber-300 border-amber-500/15',
                      event.type === 'red_flag' && 'bg-red-500/5 text-red-300 border-red-500/15',
                      event.type === 'penalty' && 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                    )}
                  >
                    <ShieldAlert
                      className={cn(
                        'size-3.5 shrink-0',
                        event.type === 'penalty' ? 'text-rose-400' : 'text-amber-400'
                      )}
                    />
                    <span className="font-bold uppercase shrink-0">
                      {event.type === 'safety_car'
                        ? 'SC'
                        : event.type === 'vsc'
                          ? 'VSC'
                          : event.type === 'red_flag'
                            ? 'RED FLAG'
                            : 'PENALTY'}
                    </span>
                    {(event.lap ?? 0) > 0 && (
                      <span className="text-zinc-400 shrink-0">
                        Lap {event.lap}{event.endLap && event.endLap !== event.lap ? `–${event.endLap}` : ''}
                      </span>
                    )}
                    <span className="text-zinc-300 truncate flex-1" title={event.message}>
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
