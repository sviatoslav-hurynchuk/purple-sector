'use client';

import React, { useState, useEffect } from 'react';
import type { Race, RaceResult } from '@/types/f1';
import {
  getCircuitTimezone,
  getFormattedSessions,
  formatTimeInTimezone,
} from '@/lib/timezones';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface RaceScheduleProps {
  race: Race | RaceResult;
}

export function RaceSchedule({ race }: RaceScheduleProps) {
  const [mode, setMode] = useState<'my' | 'track'>('my');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [userTimeZone, setUserTimeZone] = useState<string>('UTC');

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

    // Initialize clock interval to update every 30 seconds
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

  const trackTimeZone = getCircuitTimezone(race.Circuit);
  const activeTimeZone = mode === 'my' ? userTimeZone : trackTimeZone;
  const sessions = getFormattedSessions(race, activeTimeZone);

  const myTimeStr = currentTime ? formatTimeInTimezone(currentTime, userTimeZone) : '--:--';
  const trackTimeStr = currentTime ? formatTimeInTimezone(currentTime, trackTimeZone) : '--:--';

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

        {/* Clock Box widget*/}
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

          {/* Red clock / timing wheel graphic */}
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

      {/* Controls Bar: Add to calendar + Timezone Pill Switcher */}
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
      <Card className="bg-zinc-950/90 border-zinc-800 overflow-hidden shadow-2xl divide-y divide-zinc-800/80">
        {sessions.length > 0 ? (
          sessions.map((item) => {
            const isRace = item.id === 'race';
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between px-4 sm:px-8 py-6 transition-colors hover:bg-zinc-900/60',
                  isRace && 'bg-primary/5 hover:bg-primary/10'
                )}
              >
                {/* Date & Session Name */}
                <div className="flex items-center gap-6 sm:gap-10">
                  <div className="flex flex-col items-center justify-center w-12 sm:w-14 border-r border-zinc-800 pr-6 shrink-0 text-center">
                    <span className="text-2xl sm:text-3xl font-black font-mono leading-none tracking-tight">
                      {item.dateParts.day}
                    </span>
                    <span className="text-xs font-black tracking-widest text-primary mt-1 uppercase">
                      {item.dateParts.month}
                    </span>
                  </div>

                  <div>
                    <span className={cn(
                      'text-base sm:text-xl font-black tracking-wide uppercase',
                      isRace ? 'text-primary' : 'text-foreground'
                    )}>
                      {item.name}
                    </span>
                  </div>
                </div>

                {/* Session Time */}
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-sm sm:text-lg tabular-nums text-zinc-300">
                    {item.timeString}
                  </span>
                </div>
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
