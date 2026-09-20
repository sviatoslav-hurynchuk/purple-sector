'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Race } from '@/types/f1';
import { SeasonSelector } from '@/components/f1/season-selector';
import { CountryFlag } from '@/components/f1/country-flag';
import { cn } from '@/lib/utils';
import {
  getRaceWeekendInfo,
  computeSeasonCalendarStats,
  isRaceCompleted,
} from '@/lib/calendar-utils';

interface CalendarCockpitProps {
  races: Race[];
  year: number;
  allYears: number[];
}

type FilterMode = 'all' | 'upcoming' | 'sprint' | 'completed';

export function CalendarCockpit({ races, year, allYears }: CalendarCockpitProps) {
  const [filter, setFilter] = useState<FilterMode>('all');

  // Compute telemetry metrics
  const stats = useMemo(() => computeSeasonCalendarStats(races), [races]);

  // Filtered list of races
  const filteredRaces = useMemo(() => {
    switch (filter) {
      case 'upcoming':
        return races.filter((r) => !isRaceCompleted(r));
      case 'sprint':
        return races.filter((r) => Boolean(r.Sprint));
      case 'completed':
        return races.filter((r) => isRaceCompleted(r));
      case 'all':
      default:
        return races;
    }
  }, [races, filter]);

  // Dual-column split logic for the authentic poster aesthetic
  const { leftCol, rightCol } = useMemo(() => {
    if (filter === 'all' && filteredRaces.length > 1) {
      const mid = Math.ceil(filteredRaces.length / 2);
      return {
        leftCol: filteredRaces.slice(0, mid),
        rightCol: filteredRaces.slice(mid),
      };
    }
    return {
      leftCol: filteredRaces,
      rightCol: [],
    };
  }, [filteredRaces, filter]);

  const nextWeekendInfo = stats.nextRace ? getRaceWeekendInfo(stats.nextRace) : null;

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* ── Top Dual F1 Racing Speed Stripes (Poster Header Hook) ─────── */}
      <div className="space-y-1.5" aria-hidden="true">
        <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-transparent rounded-full opacity-90" />
        <div className="h-0.5 sm:h-1 w-3/4 bg-gradient-to-r from-red-700 via-red-600 to-transparent rounded-full opacity-60" />
      </div>

      {/* ── Main Cockpit Title & Season Control ───────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/10 pb-6 relative">
        <div className="relative">
          {/* Subtle crimson background glow */}
          <div className="absolute -top-10 -left-6 w-56 h-28 bg-red-600/10 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-red-500 uppercase">
              FIA Formula 1 World Championship™
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white uppercase flex items-baseline gap-3">
            <span>{year}</span>
            <span className="text-zinc-400 font-sans font-black tracking-tighter text-2xl sm:text-3xl lg:text-4xl">
              RACE CALENDAR
            </span>
          </h1>

          <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1">
            Official FIA tour schedule • {stats.totalRaces} Grands Prix
          </p>
        </div>

        <div className="shrink-0 pt-2 lg:pt-0">
          <SeasonSelector currentSeason={year} allYears={allYears} />
        </div>
      </div>

      {/* ── Season Pulse Telemetry Ribbon (Monolithic 4-Metric Bar) ───── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-white/10 bg-zinc-950/90 divide-y sm:divide-y-0 sm:divide-x divide-white/10 overflow-hidden shadow-xl">
        {/* Metric 1: Total Grands Prix */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
          <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
            Total Grands Prix
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-white">
            {stats.totalRaces}{' '}
            <span className="text-xs font-mono font-semibold text-zinc-400">Rounds</span>
          </p>
          <span className="text-[11px] font-mono text-zinc-400">Global World Tour</span>
        </div>

        {/* Metric 2: Sprint Weekends */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
              Sprint Weekends
            </span>
            <span className="px-1.5 py-0.2 rounded bg-red-600/20 text-red-400 border border-red-500/30 text-[9px] font-mono font-bold">
              [S]
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-red-400">
            {stats.sprintCount}{' '}
            <span className="text-xs font-mono font-semibold text-zinc-400">Sprints</span>
          </p>
          <span className="text-[11px] font-mono text-zinc-400">Saturday Shootout</span>
        </div>

        {/* Metric 3: Season Progress */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
          <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
            Season Progress
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-white">
            {stats.completedCount} / {stats.totalRaces}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden border border-white/5">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.progressPercentage}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-400">
              {stats.progressPercentage}%
            </span>
          </div>
        </div>

        {/* Metric 4: Next Grand Prix */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
              Next Up
            </span>
            {stats.nextRace && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </div>
          {stats.nextRace ? (
            <div>
              <p className="text-base sm:text-lg font-black font-mono text-white truncate">
                R{stats.nextRace.round} • {stats.nextRace.Circuit.Location.locality}
              </p>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {nextWeekendInfo?.days} {nextWeekendInfo?.month}
              </span>
            </div>
          ) : (
            <div>
              <p className="text-base sm:text-lg font-black font-mono text-zinc-400">
                Season Concluded
              </p>
              <span className="text-[11px] font-mono text-zinc-500">All rounds completed</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Segmented Cockpit Filter Toolbar ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-zinc-950 border border-white/10 overflow-x-auto scrollbar-none w-full sm:w-auto">
          {(
            [
              { id: 'all', label: 'All Races', count: stats.totalRaces },
              { id: 'upcoming', label: 'Upcoming', count: stats.remainingCount },
              { id: 'sprint', label: 'Sprint Weekends', count: stats.sprintCount },
              { id: 'completed', label: 'Completed', count: stats.completedCount },
            ] as const
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap min-h-[44px] flex items-center gap-1.5',
                  active
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-1 ring-white/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px]',
                    active ? 'bg-black/25 text-white' : 'bg-zinc-900 text-zinc-400'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs font-mono text-zinc-400">
            Showing <strong className="text-white font-mono">{filteredRaces.length}</strong> of{' '}
            <strong className="text-white font-mono">{stats.totalRaces}</strong> Grands Prix
          </span>
        </div>
      </div>

      {/* ── Monolithic 1px Dual-Column Schedule Matrix ────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative">
        {/* Subtle carbon grid backdrop overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

        {filteredRaces.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 font-mono text-sm">
            No races found matching this filter.
          </div>
        ) : (
          <div
            className={cn(
              'grid grid-cols-1 divide-y divide-white/10 relative z-10',
              rightCol.length > 0 && 'lg:grid-cols-2 lg:divide-y-0 lg:divide-x'
            )}
          >
            {/* Column 1 (Rounds 1-12 or single column) */}
            <div className="divide-y divide-white/10">
              {leftCol.map((race) => (
                <RaceCalendarItem
                  key={race.round}
                  race={race}
                  year={year}
                  isNext={stats.nextRace?.round === race.round}
                />
              ))}
            </div>

            {/* Column 2 (Rounds 13-24 on poster layout) */}
            {rightCol.length > 0 && (
              <div className="divide-y divide-white/10">
                {rightCol.map((race) => (
                  <RaceCalendarItem
                    key={race.round}
                    race={race}
                    year={year}
                    isNext={stats.nextRace?.round === race.round}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Bottom Dual F1 Speed Stripes (Poster Footer Hook) ─────────── */}
      <div className="space-y-1.5" aria-hidden="true">
        <div className="h-0.5 sm:h-1 w-2/3 ml-auto bg-gradient-to-l from-red-600 via-red-700 to-transparent rounded-full opacity-60" />
        <div className="h-1 sm:h-1.5 w-full bg-gradient-to-l from-red-600 via-red-500 to-transparent rounded-full opacity-90" />
      </div>
    </div>
  );
}

interface RaceCalendarItemProps {
  race: Race;
  year: number;
  isNext: boolean;
}

function RaceCalendarItem({ race, year, isNext }: RaceCalendarItemProps) {
  const isCompleted = isRaceCompleted(race);
  const weekend = getRaceWeekendInfo(race);
  const paddedRound = race.round.padStart(2, '0');

  return (
    <Link
      href={`/calendar/${race.round}?season=${year}`}
      className={cn(
        'group block p-3.5 sm:p-4 transition-all relative overflow-hidden',
        isCompleted
          ? 'bg-zinc-950/40 hover:bg-zinc-900/40 opacity-80 hover:opacity-100'
          : 'bg-zinc-950/70 hover:bg-zinc-900/60',
        isNext && 'border-l-4 border-l-red-500 bg-red-950/15 hover:bg-red-950/25'
      )}
    >
      {/* Dynamic hover illumination bar on top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left cluster: Round Code, Flag, and Date Stack */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Round Code Badge (Poster R01 / 01 style) */}
          <div
            className={cn(
              'w-8 sm:w-10 py-1 sm:py-1.5 rounded-md border text-center font-mono font-black text-xs sm:text-sm shrink-0 transition-colors',
              isNext
                ? 'bg-red-600 text-white border-red-500 shadow-sm shadow-red-500/40'
                : 'bg-zinc-900/80 border-white/10 text-zinc-300 group-hover:border-red-500/40 group-hover:text-white'
            )}
          >
            R{paddedRound}
          </div>

          {/* National Flag */}
          <div className="shrink-0">
            <CountryFlag
              countryName={race.Circuit.Location.country}
              width={34}
              height={22}
              className="w-8 h-5.5 sm:w-9 sm:h-6 object-cover rounded-xs border border-white/15 shadow-sm"
            />
          </div>

          {/* Date Range Unit (F1 Poster style: Month over Digital Days) */}
          <div className="w-[38px] sm:w-[42px] shrink-0 text-left">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block leading-none truncate">
              {weekend.month}
            </span>
            <span
              className={cn(
                'text-sm sm:text-base font-mono font-black tracking-tight block leading-tight mt-0.5',
                isCompleted
                  ? 'text-zinc-300 group-hover:text-white'
                  : 'text-red-500 group-hover:text-red-400'
              )}
            >
              {weekend.days}
            </span>
          </div>

          {/* F1 Sprint Indicator Slot in the exact space between Date & Country */}
          <div className="w-4 sm:w-5 shrink-0 flex items-center justify-center">
            {race.Sprint ? (
              <span
                className="font-mono font-black italic text-base sm:text-lg text-red-500 select-none leading-none drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] group-hover:scale-110 transition-transform"
                title="F1 Sprint Race Weekend"
                aria-label="Sprint Weekend"
              >
                S
              </span>
            ) : null}
          </div>

          {/* Race Title, City & Circuit */}
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider truncate block">
              ROUND {race.round} • {race.Circuit.Location.locality}
            </span>

            <h2 className="text-sm sm:text-base lg:text-lg font-black uppercase tracking-tight text-white group-hover:text-red-400 sm:group-hover:text-white transition-colors truncate">
              {race.Circuit.Location.country}
            </h2>

            <p className="text-xs font-sans text-zinc-400 truncate hidden sm:block">
              {race.raceName} • {race.Circuit.circuitName}
            </p>
          </div>
        </div>

        {/* Right cluster: Minimalist Action & Status Readout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isNext ? (
            <div className="flex items-center gap-1 sm:gap-1.5 text-red-400">
              <span className="text-xs font-mono font-bold uppercase tracking-wider hidden sm:inline">
                Next Race
              </span>
              <svg
                className="size-4 text-red-400 group-hover:translate-x-1 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider hidden sm:inline">
                {isCompleted ? 'Results' : 'Details'}
              </span>
              <svg
                className="size-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
