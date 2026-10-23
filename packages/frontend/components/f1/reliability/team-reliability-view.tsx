'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { CountryFlag } from '@/components/f1/country-flag';
import { TeamLogo } from '@/components/f1/team-logo';
import { DriverImage } from '@/components/f1/driver-image';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { SeasonSelector } from '@/components/f1/season-selector';
import { getTeamTheme } from '@/lib/team-colors';
import { cn } from '@/lib/utils';
import type {
  ConstructorMultiSeasonReliabilityResponse,
  SeasonReliabilityResponse,
} from '@/types/f1';

interface TeamReliabilityViewProps {
  teamData: ConstructorMultiSeasonReliabilityResponse;
  seasonData: SeasonReliabilityResponse | null;
  season: number;
  allYears: number[];
  from?: string;
}

export function TeamReliabilityView({
  teamData,
  seasonData,
  season,
  allYears,
  from,
}: TeamReliabilityViewProps) {
  const router = useRouter();
  const theme = getTeamTheme(teamData.constructorId);
  const activeDetails = teamData.activeSeasonDetails;
  const activeConstructor = activeDetails.constructor;
  const history = teamData.history;
  const allTimeKpis = teamData.allTimeKpis;

  // Primary drivers in active season
  const drivers = activeConstructor.driverBreakdown || [];

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      {/* ── Top Dual F1 Racing Speed Stripes ───────────────────────────── */}
      <div className="space-y-1.5" aria-hidden="true">
        <div
          className="h-1 sm:h-1.5 w-full rounded-full opacity-90 transition-colors"
          style={{
            background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary || '#52525b'}, transparent)`,
          }}
        />
        <div
          className="h-0.5 sm:h-1 w-3/4 rounded-full opacity-60 transition-colors"
          style={{
            background: `linear-gradient(to right, ${theme.primary}, transparent)`,
          }}
        />
      </div>

      {/* ── Top Navigation Row: Back to Origin + In-Page Switcher ─────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {from === 'profile' ? (
          <Link
            href={`/constructors/${teamData.constructorId}`}
            className="group inline-flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="size-4 text-zinc-500 group-hover:-translate-x-0.5 group-hover:text-white transition-all" />
            <span>{teamData.name.toUpperCase()} PROFILE</span>
          </Link>
        ) : (
          <Link
            href={`/reliability?season=${season}`}
            className="group inline-flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="size-4 text-zinc-500 group-hover:-translate-x-0.5 group-hover:text-white transition-all" />
            <span>GRID RELIABILITY OVERVIEW</span>
          </Link>
        )}

        {/* Team Selector & Season Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {seasonData && seasonData.constructors.length > 0 && (
            <div className="relative">
              <select
                aria-label="Select Constructor"
                value={teamData.constructorId}
                onChange={(e) => {
                  const newTeam = e.target.value;
                  if (newTeam === '__all__') {
                    router.push(`/reliability?season=${season}`);
                  } else {
                    router.push(
                      `/reliability?team=${newTeam}&season=${season}${from ? `&from=${from}` : ''}`
                    );
                  }
                }}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-mono font-bold text-zinc-200 hover:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500/50 cursor-pointer shadow-sm transition-all"
              >
                <option value="__all__">All Constructors (Grid)</option>
                {seasonData.constructors.map((c) => (
                  <option key={c.constructorId} value={c.constructorId}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
                <ChevronRight className="size-3.5 rotate-90" />
              </div>
            </div>
          )}

          <SeasonSelector
            currentSeason={season}
            allYears={allYears}
            onSeasonChange={(year) => {
              router.push(
                `/reliability?team=${teamData.constructorId}&season=${year}${from ? `&from=${from}` : ''}`
              );
            }}
          />
        </div>
      </div>

      {/* ── Team Identity Cockpit Header ───────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative">
        {/* Dynamic Livery Top Stripe */}
        <div className="h-[3px] w-full" style={{ backgroundColor: theme.primary }} />

        {/* Ambient Livery Glow */}
        <div
          className="absolute -top-24 -right-24 size-80 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ backgroundColor: theme.primary }}
        />

        <div className="p-5 sm:p-7 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {/* Team Logo Emblem */}
            <div className="size-16 sm:size-20 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-md shadow-xl flex items-center justify-center shrink-0 overflow-hidden">
              <TeamLogo
                constructorId={teamData.constructorId}
                season={season}
                size={64}
                className="!w-full !h-full rounded-none shadow-none p-2 sm:p-2.5"
              />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <CountryFlag
                  countryName={teamData.nationality}
                  className="w-4 h-3 rounded-xs shrink-0"
                />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                  {teamData.nationality}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  {season} Campaign
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-sans uppercase tracking-tight text-white truncate">
                {teamData.name}
              </h1>

              <p className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                <span>{history.length} Seasons Analyzed</span>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-400 font-bold">
                  {allTimeKpis.overallReliabilityRate}% Multi-Season Reliability
                </span>
              </p>
            </div>
          </div>

          {/* Quick Profile Link */}
          <Link
            href={`/constructors/${teamData.constructorId}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-mono font-bold text-zinc-300 hover:text-white transition-all shrink-0 self-start md:self-auto"
          >
            <span>Team Profile</span>
            <ChevronRight className="size-3.5 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* ── Section 1: Hero Telemetry Ribbon (Active Season) ───────────── */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
        {/* 5-Cell Monolithic 1px Grid Container */}
        <div className="grid grid-cols-2 lg:grid-cols-5 -mt-px -ml-px border-t border-l border-white/10 bg-zinc-950/60">
          {/* Finish Rate */}
          <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 flex flex-col justify-between">
            <p className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Finish Rate
            </p>
            <div className="mt-2">
              <p
                className={cn(
                  'text-2xl sm:text-3xl font-black font-mono',
                  activeConstructor.reliabilityRate >= 95
                    ? 'text-emerald-400'
                    : activeConstructor.reliabilityRate >= 85
                      ? 'text-sky-400'
                      : 'text-amber-400'
                )}
              >
                {activeConstructor.reliabilityRate}%
              </p>
              <p className="text-[11px] font-mono text-zinc-400 mt-1">
                {activeConstructor.finishes} / {activeConstructor.totalStarts} Finished
              </p>
            </div>
          </div>

          {/* Lap Completion */}
          <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 flex flex-col justify-between">
            <p className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Lap Completion
            </p>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                {activeConstructor.lapCompletionRate}%
              </p>
              <p className="text-[11px] font-mono text-zinc-400 mt-1 truncate">
                {activeConstructor.lapsCompleted.toLocaleString()} /{' '}
                {activeConstructor.totalPossibleLaps.toLocaleString()} Laps
              </p>
            </div>
          </div>

          {/* Mechanical Failures */}
          <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 flex flex-col justify-between">
            <p className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Mechanical DNFs
            </p>
            <div className="mt-2">
              <p
                className={cn(
                  'text-2xl sm:text-3xl font-black font-mono',
                  (activeDetails.causeBreakdown.categories.find(
                    (c) => c.category === 'mechanical'
                  )?.count ?? 0) === 0
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                )}
              >
                {activeDetails.causeBreakdown.categories.find(
                  (c) => c.category === 'mechanical'
                )?.count ?? 0}
              </p>
              <p className="text-[11px] font-mono text-zinc-400 mt-1">
                Power Unit &amp; Systems
              </p>
            </div>
          </div>

          {/* Incident Retirements */}
          <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 flex flex-col justify-between">
            <p className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Collision DNFs
            </p>
            <div className="mt-2">
              <p
                className={cn(
                  'text-2xl sm:text-3xl font-black font-mono',
                  (activeDetails.causeBreakdown.categories.find(
                    (c) => c.category === 'incident'
                  )?.count ?? 0) === 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                )}
              >
                {activeDetails.causeBreakdown.categories.find(
                  (c) => c.category === 'incident'
                )?.count ?? 0}
              </p>
              <p className="text-[11px] font-mono text-zinc-400 mt-1">
                Accidents &amp; Damage
              </p>
            </div>
          </div>

          {/* 5-Year Aggregate */}
          <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 col-span-2 lg:col-span-1 flex flex-col justify-between">
            <p className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Multi-Year Average
            </p>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                {allTimeKpis.overallReliabilityRate}%
              </p>
              <p className="text-[11px] font-mono text-zinc-400 mt-1">
                {allTimeKpis.totalFinishes} / {allTimeKpis.totalStarts} Starts (
                {allTimeKpis.seasonsAnalyzed} Yrs)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Multi-Season History (Headerless Table) ─────────── */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
        {/* Monolithic 1px Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900/40 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3 px-4 sm:px-5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-3.5 text-amber-400 shrink-0" />
                    <span>Season</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Grid Rank</th>
                <th className="py-3 px-3">Starts / Finishes</th>
                <th className="py-3 px-3 text-center">Mechanical</th>
                <th className="py-3 px-3 text-center">Incident</th>
                <th className="py-3 px-3 text-right">Finish Rate</th>
                <th className="py-3 px-4 sm:px-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Laps Completed</span>
                    <span className="text-[9px] text-zinc-500 font-normal">({history.length} Yrs)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {history.map((entry) => {
                const isActive = entry.season === season;

                return (
                  <tr
                    key={entry.season}
                    className={cn(
                      'hover:bg-white/[0.02] transition-colors',
                      isActive && 'bg-white/[0.03]'
                    )}
                  >
                    {/* Season Badge */}
                    <td className="py-3 px-4 sm:px-5">
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <span
                            className="size-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: theme.primary }}
                          />
                        )}
                        <span
                          className={cn(
                            'font-black text-sm',
                            isActive ? 'text-white' : 'text-zinc-300'
                          )}
                        >
                          {entry.season}
                        </span>
                        {isActive && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 border border-white/10">
                            Active
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Grid Rank */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={cn(
                          'font-bold px-2 py-0.5 rounded text-xs',
                          entry.gridReliabilityRank === 1
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            : entry.gridReliabilityRank <= 3
                              ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400'
                              : 'bg-zinc-800 text-zinc-300'
                        )}
                      >
                        P{entry.gridReliabilityRank}
                        <span className="text-[10px] text-zinc-500 ml-1">
                          /{entry.totalConstructors}
                        </span>
                      </span>
                    </td>

                    {/* Starts & Finishes */}
                    <td className="py-3 px-3 text-zinc-300">
                      <span className="font-bold text-white">{entry.finishes}</span>
                      <span className="text-zinc-500"> / {entry.totalStarts}</span>
                    </td>

                    {/* Mechanical DNFs */}
                    <td className="py-3 px-3 text-center">
                      {entry.mechanicalDnfs > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs">
                          {entry.mechanicalDnfs} MECH
                        </span>
                      ) : (
                        <span className="text-zinc-500">0</span>
                      )}
                    </td>

                    {/* Incident DNFs */}
                    <td className="py-3 px-3 text-center">
                      {entry.incidentDnfs > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs">
                          {entry.incidentDnfs} CRASH
                        </span>
                      ) : (
                        <span className="text-zinc-500">0</span>
                      )}
                    </td>

                    {/* Reliability % + Bar */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex flex-col items-end">
                        <span
                          className={cn(
                            'font-black text-sm',
                            entry.reliabilityRate >= 95
                              ? 'text-emerald-400'
                              : entry.reliabilityRate >= 85
                                ? 'text-sky-400'
                                : 'text-amber-400'
                          )}
                        >
                          {entry.reliabilityRate}%
                        </span>
                        <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(5, entry.reliabilityRate))}%`,
                              backgroundColor: theme.primary,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Laps Ratio */}
                    <td className="py-3 px-4 sm:px-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-zinc-200 font-bold">
                          {entry.lapCompletionRate}%
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {entry.lapsCompleted.toLocaleString()} /{' '}
                          {entry.totalPossibleLaps.toLocaleString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3: Teammate Reliability Split (Headerless Split) ──── */}
      {drivers.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 -mt-px -ml-px border-t border-l border-white/10 bg-zinc-950/60">
            {drivers.map((driver, idx) => {
              const orientation = idx % 2 === 0 ? 'left' : 'right';
              const nameParts = (driver.name || '').trim().split(' ');
              const givenName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';
              const familyName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : driver.name;
              const photo = getDriverPhotoUrl(
                driver.driverId,
                givenName,
                familyName,
                String(season),
                teamData.constructorId,
                orientation
              );

              return (
                <div
                  key={driver.driverId}
                  className="border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex items-stretch overflow-hidden group"
                >
                  {/* Seamless Edge-to-Edge Driver Portrait Column (Monolithic 1px Border) */}
                  <div className="w-28 sm:w-36 shrink-0 relative bg-zinc-950/80 border-r border-white/10 group-hover:border-white/20 overflow-hidden transition-colors min-h-[110px] sm:min-h-[120px]">
                    <DriverImage
                      src={photo}
                      alt={driver.name}
                      fill
                      sizes="(max-width: 640px) 112px, 144px"
                      className="object-contain object-top scale-[5.0] origin-[50%_0%]"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Driver Reliability Metrics & Info */}
                  <div className="p-4 sm:p-5 flex-1 min-w-0 flex flex-col justify-between space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                          {driver.code}
                        </span>
                        <Link
                          href={`/drivers/${driver.driverId}`}
                          className="text-base sm:text-lg font-black font-sans uppercase tracking-tight text-white hover:text-emerald-400 transition-colors truncate block mt-0.5"
                        >
                          {driver.name}
                        </Link>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <span
                          className={cn(
                            'text-xl sm:text-2xl font-black',
                            driver.reliabilityRate >= 95
                              ? 'text-emerald-400'
                              : driver.reliabilityRate >= 85
                                ? 'text-sky-400'
                                : 'text-amber-400'
                          )}
                        >
                          {driver.reliabilityRate}%
                        </span>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                          Finish Rate
                        </p>
                      </div>
                    </div>

                    {/* Sub Telemetry Bar */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
                        <span className="text-[10px] text-zinc-400 block uppercase">
                          Finishes
                        </span>
                        <span className="font-bold text-white mt-0.5 block truncate">
                          {driver.finishes} / {driver.starts}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
                        <span className="text-[10px] text-zinc-400 block uppercase">
                          Retirements
                        </span>
                        <span
                          className={cn(
                            'font-bold mt-0.5 block truncate',
                            driver.dnfs === 0 ? 'text-emerald-400' : 'text-rose-400'
                          )}
                        >
                          {driver.dnfs} DNF
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-zinc-900/60 border border-white/5">
                        <span className="text-[10px] text-zinc-400 block uppercase">
                          Laps Done
                        </span>
                        <span className="font-bold text-zinc-300 mt-0.5 block truncate">
                          {driver.lapsCompleted.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section 4: Round-by-Round Attrition Timeline (Headerless Log) ── */}
      {activeDetails.rounds.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
          <div className="divide-y divide-white/5">
            {activeDetails.rounds.map((round) => (
              <div
                key={round.round}
                className="px-4 py-3 sm:px-5 sm:py-3.5 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Round Meta */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 font-mono font-bold text-xs text-zinc-500 shrink-0">
                    R{round.round.toString().padStart(2, '0')}
                  </span>
                  <CountryFlag
                    countryName={round.country}
                    className="w-4 h-3 rounded-xs shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold font-sans text-white uppercase tracking-tight truncate">
                      {round.raceName}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-500 truncate">
                      {round.date} • {round.circuitName}
                    </p>
                  </div>
                </div>

                {/* Cars Result Badges */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {round.cars.map((car) => {
                    const isFinish = car.category === 'finished';
                    const isMech = car.category === 'mechanical';
                    const isIncident = car.category === 'incident';
                    const isDsq = car.category === 'dsq';

                    return (
                      <div
                        key={car.driverId}
                        className={cn(
                          'inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono',
                          isFinish &&
                            'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
                          isMech && 'bg-amber-500/10 border-amber-500/20 text-amber-300',
                          isIncident &&
                            'bg-rose-500/10 border-rose-500/20 text-rose-300',
                          isDsq && 'bg-purple-500/10 border-purple-500/20 text-purple-300',
                          !isFinish &&
                            !isMech &&
                            !isIncident &&
                            !isDsq &&
                            'bg-zinc-800 border-zinc-700 text-zinc-400'
                        )}
                      >
                        <span className="font-bold">{car.driverCode}:</span>
                        <span>
                          {isFinish
                            ? `P${car.positionText || car.position}`
                            : `${car.status || 'DNF'}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section 5: Specific Failure Triggers (Headerless Grid) ────── */}
      {activeDetails.causeBreakdown.detailedCauses.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 -mt-px -ml-px border-t border-l border-white/10 bg-zinc-950/60 font-mono text-xs">
            {activeDetails.causeBreakdown.detailedCauses.map((cause) => (
              <div
                key={cause.cause}
                className="p-4 border-b border-r border-white/10 bg-zinc-900/20 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                    {cause.category}
                  </span>
                  <span className="font-bold text-white uppercase truncate block">
                    {cause.cause}
                  </span>
                </div>
                <span className="font-black text-sm px-2 py-0.5 rounded bg-zinc-800 border border-white/10 text-amber-400 shrink-0">
                  {cause.count}×
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
