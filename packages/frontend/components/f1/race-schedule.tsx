'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Race, RaceResult, RaceResultEntry, QualifyingResultEntry } from '@/types/f1';
import {
  getCircuitTimezone,
  getFormattedSessions,
  formatTimeInTimezone,
  type FormattedSessionItem,
} from '@/lib/timezones';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { CountdownWidget } from '@/components/f1/countdown-widget';
import { RaceResultsTable } from '@/components/f1/race-results-table';
import { QualifyingResultsTable } from '@/components/f1/qualifying-results-table';
import { ChevronDown } from 'lucide-react';

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

  const myTimeStr = currentTime ? formatTimeInTimezone(currentTime, userTimeZone) : '--:--';
  const trackTimeStr = currentTime ? formatTimeInTimezone(currentTime, trackTimeZone) : '--:--';

  const now = currentTime ?? new Date();

  return (
    <div className="space-y-6">
      {/* Top Banner: SCHEDULE title + Clock Box */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

        <div className="flex items-center gap-4">
          <div className="bg-primary text-primary-foreground font-black italic px-3 py-1 rounded text-sm tracking-wider">
            F1
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic">
            SCHEDULE
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <CountdownWidget race={race as Race} size="sm" showCountry={true} />

          {/* Clock Box widget */}
          <div className="flex items-center gap-4 bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-3 shrink-0">
            <div className="space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between gap-6">
                <span className={cn('flex items-center gap-1.5 font-bold', mode === 'my' ? 'text-primary' : 'text-zinc-400')}>
                  {mode === 'my' && <span className="size-1.5 rounded-full bg-primary animate-pulse" />}
                  MY TIME
                </span>
                <span className="font-bold text-foreground tabular-nums">{myTimeStr}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className={cn('flex items-center gap-1.5 font-bold', mode === 'track' ? 'text-primary' : 'text-zinc-400')}>
                  {mode === 'track' && <span className="size-1.5 rounded-full bg-primary animate-pulse" />}
                  TRACK TIME
                </span>
                <span className="font-bold text-foreground tabular-nums">{trackTimeStr}</span>
              </div>
            </div>

            {/* Red clock graphic */}
            <div className="size-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <svg
                className="size-5 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar: Add to calendar + Timezone Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => alert('Add to calendar feature coming soon!')}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-primary/20"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
            <path d="M8 14h.01" />
            <path d="M12 14h.01" />
            <path d="M16 14h.01" />
            <path d="M8 18h.01" />
            <path d="M12 18h.01" />
            <path d="M16 18h.01" />
          </svg>
          Add F1 calendar (in progress)
        </button>

        {/* Timezone Switcher */}
        <div className="inline-flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleModeChange('my')}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-bold transition-all',
              mode === 'my'
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100'
            )}
          >
            My time
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('track')}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-bold transition-all',
              mode === 'track'
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100'
            )}
          >
            Track time
          </button>
        </div>
      </div>

      {/* Sessions List Card */}
      <Card className="border-zinc-800 overflow-hidden shadow-2xl divide-y divide-zinc-800/80" style={{ background: 'var(--card)' }}>
        {sessions.length > 0 ? (
          sessions.map((item) => {
            const isRace = item.id === 'race';
            const isSprint = item.id === 'sprint';
            const isQualy = item.id === 'qualifying';
            const resultData = getResultsForSession(race, item.id);
            const hasResults = !!resultData && resultData.data.length > 0;
            const completed = isSessionCompleted(item, now, hasResults);
            const isExpandable = hasResults;

            // Determine expanded state
            const isExpanded = isRace
              ? raceExpanded && hasResults
              : isSprint
              ? sprintExpanded && hasResults
              : isQualy
              ? qualyExpanded && hasResults
              : expandedNonRace === item.id;

            return (
              <div key={item.id}>
                {/* Session Row */}
                <div
                  className={cn(
                    'flex items-center justify-between px-4 sm:px-8 py-6 transition-colors',
                    isRace && 'bg-primary/5 hover:bg-primary/10',
                    !isRace && 'hover:bg-zinc-900/40',
                    isExpandable && 'cursor-pointer select-none'
                  )}
                  onClick={isExpandable ? () => handleToggleSession(item.id) : undefined}
                  role={isExpandable ? 'button' : undefined}
                  tabIndex={isExpandable ? 0 : undefined}
                  onKeyDown={isExpandable ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleSession(item.id);
                    }
                  } : undefined}
                >
                  {/* Left side: Date + Session Name + (completed: inline time & flag) */}
                  <div className="flex items-center gap-6 sm:gap-10 min-w-0">
                    <div className="flex flex-col items-center justify-center w-12 sm:w-14 border-r border-zinc-800 pr-6 shrink-0 text-center">
                      <span className="text-2xl sm:text-3xl font-black font-mono leading-none tracking-tight">
                        {item.dateParts.day}
                      </span>
                      <span className="text-xs font-black tracking-widest text-primary mt-1 uppercase">
                        {item.dateParts.month}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={cn(
                        'text-base sm:text-xl font-black tracking-wide uppercase',
                        isRace ? 'text-primary' : 'text-foreground'
                      )}>
                        {item.name}
                      </span>

                      {/* Completed: inline time + Checkered Flag */}
                      {completed && (
                        <>
                          <span className="font-mono font-bold text-xs sm:text-sm tabular-nums text-zinc-500">
                            {item.timeString}
                          </span>
                          <CheckeredFlagIcon />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right side: time (if NOT completed) or chevron (if expandable) */}
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {!completed && (
                      <span className="font-mono font-bold text-sm sm:text-lg tabular-nums text-zinc-300">
                        {item.timeString}
                      </span>
                    )}

                    {isExpandable && (
                      <div className="size-8 flex items-center justify-center rounded-lg bg-zinc-800/60 hover:bg-zinc-700/60 transition-colors">
                        <ChevronDown
                          className={cn(
                            'size-5 text-zinc-400 transition-transform duration-200',
                            isExpanded && 'rotate-180'
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
                      isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    <div className="border-t border-zinc-800/60 bg-zinc-900/30">
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
          <div className="py-12 text-center text-muted-foreground">
            No schedule available for this race weekend yet.
          </div>
        )}
      </Card>
    </div>
  );
}
