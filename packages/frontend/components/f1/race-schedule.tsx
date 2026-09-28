'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Race, RaceResult, RaceResultEntry, QualifyingResultEntry } from '@/types/f1';
import {
  getCircuitTimezone,
  getFormattedSessions,
  formatTimeInTimezone,
  type FormattedSessionItem,
} from '@/lib/timezones';
import { getCircuitDetails } from '@/lib/circuit-details';
import { getNextSessionForRace } from '@/lib/sessions';
import { useCountdown } from '@/hooks/useCountdown';
import { cn, formatDateInTimezone } from '@/lib/utils';
import { RaceResultsTable } from '@/components/f1/race-results-table';
import { QualifyingResultsTable } from '@/components/f1/qualifying-results-table';
import { ChevronDown, Calendar } from 'lucide-react';

interface RaceScheduleProps {
  race: Race | RaceResult;
}

/** Checkered flag SVG icon with distinct checkered pattern on a flagpole */
export function CheckeredFlagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-4 shrink-0 inline-block align-middle text-zinc-400', className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Flag pole */}
      <path d="M4 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Flag canvas outline */}
      <path
        d="M4 4C7 3 11 5 14 4C17 3 20 4.5 21 4V14C20 14.5 17 13 14 14C11 15 7 13 4 14V4Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Checkered pattern squares */}
      <path d="M4 4H8.25V9H4V4Z" fill="currentColor" />
      <path d="M12.5 4.3H16.75V9H12.5V4.3Z" fill="currentColor" />
      <path d="M8.25 9H12.5V13.8H8.25V9Z" fill="currentColor" />
      <path d="M16.75 9H20.7V13.8H16.75V9Z" fill="currentColor" />
    </svg>
  );
}

/** Checks whether a session has ended based on rawDate + durationMinutes or if results exist */
function isSessionCompleted(item: FormattedSessionItem, now: Date, hasResults: boolean): boolean {
  if (hasResults) return true;
  if (!item.hasKnownTime) return false;
  if (item.durationMinutes <= 0) return false;
  const endTime = item.rawDate.getTime() + item.durationMinutes * 60 * 1000;
  return now.getTime() > endTime;
}

type SessionResultData =
  | { type: 'race'; data: RaceResultEntry[] }
  | { type: 'sprint'; data: RaceResultEntry[] }
  | { type: 'qualifying'; data: QualifyingResultEntry[] };

/** Resolves results data for a given session ID from the race object */
function getResultsForSession(
  race: Race | RaceResult,
  sessionId: string
): SessionResultData | undefined {
  if (sessionId === 'race' && 'Results' in race && Array.isArray(race.Results) && race.Results.length > 0) {
    return { type: 'race', data: race.Results };
  }
  if (sessionId === 'sprint' && 'SprintResults' in race && Array.isArray(race.SprintResults) && race.SprintResults.length > 0) {
    return { type: 'sprint', data: race.SprintResults };
  }
  if (sessionId === 'qualifying' && 'QualifyingResults' in race && Array.isArray(race.QualifyingResults) && race.QualifyingResults.length > 0) {
    return { type: 'qualifying', data: race.QualifyingResults };
  }
  return undefined;
}

function formatTimeZoneLabel(tz: string, date: Date | null) {
  try {
    const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz;
    const now = date ?? new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(now);
    const tzShort = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    return tzShort ? `${city} (${tzShort})` : city;
  } catch {
    return tz;
  }
}

export function RaceSchedule({ race }: RaceScheduleProps) {
  const [mode, setMode] = useState<'my' | 'track'>('my');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [userTimeZone, setUserTimeZone] = useState<string>('UTC');

  // Toggle states: Race is open by default, others start closed
  const [raceExpanded, setRaceExpanded] = useState(true);
  const [sprintExpanded, setSprintExpanded] = useState(false);
  const [qualyExpanded, setQualyExpanded] = useState(false);
  const [expandedNonRace, setExpandedNonRace] = useState<string | null>(null);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) setUserTimeZone(tz);
      } catch {
        setUserTimeZone('UTC');
      }

      const savedMode = localStorage.getItem('f1_time_mode');
      if (savedMode === 'my' || savedMode === 'track') {
        setMode(savedMode);
      }

      setCurrentTime(new Date());
    }, 0);

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

  const handleModeChange = (newMode: 'my' | 'track') => {
    setMode(newMode);
    localStorage.setItem('f1_time_mode', newMode);
  };

  const handleToggleSession = useCallback((sessionId: string) => {
    if (sessionId === 'race') {
      setRaceExpanded((prev) => !prev);
    } else if (sessionId === 'sprint') {
      setSprintExpanded((prev) => !prev);
    } else if (sessionId === 'qualifying') {
      setQualyExpanded((prev) => !prev);
    } else {
      setExpandedNonRace((prev) => (prev === sessionId ? null : sessionId));
    }
  }, []);

  const trackTimeZone = getCircuitTimezone(race.Circuit);
  const activeTimeZone = mode === 'my' ? userTimeZone : trackTimeZone;
  const sessions = getFormattedSessions(race, activeTimeZone);

  const circuitDetails = useMemo(() => {
    return getCircuitDetails(race.Circuit.circuitId, race.season);
  }, [race.Circuit.circuitId, race.season]);

  const raceResults = 'Results' in race && Array.isArray(race.Results) ? race.Results : null;
  const hasResults = Boolean(raceResults && raceResults.length > 0);
  const winner = hasResults && raceResults ? (raceResults[0] as RaceResultEntry) : null;

  const now = useMemo(() => currentTime ?? new Date(), [currentTime]);
  const nextSession = useMemo(() => {
    return getNextSessionForRace(race as Race, now);
  }, [race, now]);

  const countdown = useCountdown(hasResults ? null : nextSession?.rawDate);

  const myTimeStr = currentTime ? formatTimeInTimezone(currentTime, userTimeZone) : '--:--';
  const trackTimeStr = currentTime ? formatTimeInTimezone(currentTime, trackTimeZone) : '--:--';

  const trackTzLabel = formatTimeZoneLabel(trackTimeZone, currentTime);
  const userTzLabel = formatTimeZoneLabel(userTimeZone, currentTime);

  return (
    <div className="space-y-6">
      {/* ── Race Pulse Telemetry Ribbon (Monolithic 4-Metric Bar) ───── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-white/10 bg-zinc-950/90 divide-y sm:divide-y-0 sm:divide-x divide-white/10 overflow-hidden shadow-xl">
        {/* Metric 1: Weekend Status / Lights Out */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
          <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
            {hasResults ? 'Classification' : nextSession ? 'Lights Out' : 'Status'}
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-white">
            {hasResults ? (
              <span className="flex items-center gap-2 text-emerald-400">
                <CheckeredFlagIcon className="size-5 text-emerald-400" />
                OFFICIAL
              </span>
            ) : nextSession ? (
              countdown.isReady && !countdown.isExpired ? (
                <span>
                  {countdown.days}D {String(countdown.hours).padStart(2, '0')}H {String(countdown.minutes).padStart(2, '0')}M
                </span>
              ) : (
                <span>EVENT READY</span>
              )
            ) : (
              <span>COMPLETE</span>
            )}
          </p>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {hasResults && winner
              ? `P1: ${winner.Driver.code || winner.Driver.familyName} (${winner.Constructor.name})`
              : nextSession
                ? `${nextSession.name} • ${formatDateInTimezone(nextSession.rawDate, activeTimeZone)}`
                : 'Results unavailable'}
          </span>
        </div>

        {/* Metric 2: Track Local Time */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
          <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
            Track Time
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
            {trackTimeStr}
          </p>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {trackTzLabel}
          </span>
        </div>

        {/* Metric 3: Your Local Time */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
          <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
            Your Time
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
            {myTimeStr}
          </p>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {userTzLabel}
          </span>
        </div>

        {/* Metric 4: Circuit Distance & Specs */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
          <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
            Grand Prix Distance
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-red-400">
            {circuitDetails?.numberOfLaps ?? '—'}{' '}
            <span className="text-xs font-mono font-semibold text-zinc-400">Laps</span>
          </p>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {circuitDetails?.circuitLength ?? '—'} • {circuitDetails?.raceDistance ?? 'Grand Prix'}
          </span>
        </div>
      </div>

      {/* ── Timetable Controls Bar ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-red-600" />
          <h2 className="text-lg sm:text-xl font-black font-mono uppercase tracking-tight text-white">
            Weekend Timetable
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Kept by user instruction: "Add F1 calendar (in progress)" */}
          <button
            type="button"
            onClick={() => alert('Add to calendar feature coming soon!')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/10 bg-primary text-zinc-300 hover:text-white hover:bg-white/5 font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
          >
            <Calendar className="size-3.5 text-zinc-300" />
            <span>Add F1 calendar (in progress)</span>
          </button>

          {/* Timezone Switcher */}
          <div className="inline-flex items-center rounded-xl border border-white/10 bg-zinc-950/90 p-1 divide-x divide-white/10 shadow-xl backdrop-blur-md">
            <button
              type="button"
              onClick={() => handleModeChange('my')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors',
                mode === 'my'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              My Time
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('track')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors',
                mode === 'track'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              Track Time
            </button>
          </div>
        </div>
      </div>

      {/* ── Sessions List Monolith (1px Contiguous Grid Architecture) ─── */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl divide-y divide-white/10">
        {sessions.length > 0 ? (
          sessions.map((item) => {
            const isRace = item.id === 'race';
            const isSprint = item.id === 'sprint';
            const isQualy = item.id === 'qualifying';
            const resultData = getResultsForSession(race, item.id);
            const hasSessionResults = !!resultData && resultData.data.length > 0;
            const completed = isSessionCompleted(item, now, hasSessionResults);
            const isExpandable = hasSessionResults;

            // Determine expanded state
            const isExpanded = isRace
              ? raceExpanded && hasSessionResults
              : isSprint
              ? sprintExpanded && hasSessionResults
              : isQualy
              ? qualyExpanded && hasSessionResults
              : expandedNonRace === item.id;

            return (
              <div key={item.id}>
                {/* Session Row */}
                <div
                  className={cn(
                    'flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 transition-colors',
                    isRace && 'bg-red-950/10 hover:bg-red-950/20',
                    !isRace && 'hover:bg-zinc-900/40',
                    isExpandable && 'cursor-pointer select-none'
                  )}
                  onClick={isExpandable ? () => handleToggleSession(item.id) : undefined}
                  role={isExpandable ? 'button' : undefined}
                  tabIndex={isExpandable ? 0 : undefined}
                  onKeyDown={
                    isExpandable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggleSession(item.id);
                          }
                        }
                      : undefined
                  }
                >
                  {/* Left side: Date block + Session Name */}
                  <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                    <div className="flex flex-col items-center justify-center w-12 sm:w-14 border-r border-white/10 pr-4 sm:pr-6 shrink-0 text-center">
                      <span className="text-xl sm:text-2xl font-black font-mono leading-none tracking-tight text-white">
                        {item.dateParts.day}
                      </span>
                      <span className="text-[10px] sm:text-xs font-mono font-black tracking-widest text-red-500 mt-1 uppercase">
                        {item.dateParts.month}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                      <span
                        className={cn(
                          'text-sm sm:text-base font-black font-mono tracking-wide uppercase',
                          isRace ? 'text-red-400' : 'text-zinc-100'
                        )}
                      >
                        {item.name}
                      </span>

                      {/* Completed: inline time + Checkered Flag */}
                      {completed && (
                        <div className="flex items-center gap-1.5 font-mono font-bold text-xs tabular-nums text-zinc-400">
                          <span>{item.timeString}</span>
                          <CheckeredFlagIcon className="size-3.5 text-zinc-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: time (if NOT completed) or chevron (if expandable) */}
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {!completed && (
                      <span className="font-mono font-bold text-sm sm:text-base tabular-nums text-zinc-300">
                        {item.timeString}
                      </span>
                    )}

                    {isExpandable && (
                      <div className="size-7 sm:size-8 flex items-center justify-center rounded-lg border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 transition-colors">
                        <ChevronDown
                          className={cn(
                            'size-4 text-zinc-400 transition-transform duration-200',
                            isExpanded && 'rotate-180 text-white'
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Collapsible Results Table */}
                {isExpandable && resultData && (
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300 ease-in-out',
                      isExpanded ? 'max-h-[2500px] opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    <div className="border-t border-white/10 bg-zinc-950/60">
                      {resultData.type === 'qualifying' ? (
                        <QualifyingResultsTable results={resultData.data} />
                      ) : (
                        <RaceResultsTable
                          results={resultData.data}
                          highlightPoints={resultData.type === 'sprint'}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center font-mono text-sm text-zinc-400">
            No schedule available for this race weekend yet.
          </div>
        )}
      </div>
    </div>
  );
}
