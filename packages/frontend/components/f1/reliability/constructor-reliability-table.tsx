'use client';

import React from 'react';
import Link from 'next/link';
import { getTeamTheme } from '@/lib/team-colors';
import { CountryFlag } from '@/components/f1/country-flag';
import { TeamLogo } from '@/components/f1/team-logo';
import { cn } from '@/lib/utils';
import { ChevronRight, Award } from 'lucide-react';
import type { ConstructorReliability } from '@/types/f1';

interface ConstructorReliabilityTableProps {
  constructors: ConstructorReliability[];
  season: number;
}

export function ConstructorReliabilityTable({
  constructors,
  season,
}: ConstructorReliabilityTableProps) {
  if (!constructors || constructors.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8 text-center text-zinc-400 font-mono text-sm">
        No constructor reliability data available for season {season}.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl w-full">
      {/* ── Compact Cockpit Sub-Header (Standard py-2.5) ── */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-white/10 bg-zinc-900/30">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-emerald-400 shrink-0" />
          <span className="font-mono text-xs font-black uppercase tracking-widest text-zinc-200">
            Constructor Reliability
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          {constructors.length} Constructors
        </span>
      </div>

      {/* Rows Container */}
      <div className="divide-y divide-white/5">
        {constructors.map((c, index) => {
          const theme = getTeamTheme(c.constructorId);

          return (
            <div
              key={c.constructorId}
              className="px-4 py-3 sm:px-5 sm:py-3.5 hover:bg-white/[0.02] transition-colors flex flex-col gap-3 group w-full"
            >
              {/* Primary Row: Responsive full-width flex container */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full">
                {/* Team Info & Mobile Badges */}
                <div className="flex items-center justify-between gap-2 w-full lg:w-auto">
                  {/* Left: Position + Livery Stripe + Logo + Name */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    {/* Position */}
                    <span
                      className={cn(
                        'w-6 sm:w-7 font-mono font-black text-sm sm:text-base text-right shrink-0',
                        index === 0 && 'text-amber-400',
                        index === 1 && 'text-zinc-300',
                        index === 2 && 'text-amber-600',
                        index > 2 && 'text-zinc-500'
                      )}
                    >
                      P{index + 1}
                    </span>

                    {/* Team Livery Color Accent Bar */}
                    <span
                      className="w-1.5 h-8 rounded-full shrink-0 shadow-xs transition-transform group-hover:scale-y-110"
                      style={{ backgroundColor: theme.primary }}
                    />

                    {/* Logo / Flag / Name */}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <TeamLogo
                          constructorId={c.constructorId}
                          className="size-4 object-contain shrink-0 opacity-80"
                        />
                        <Link
                          href={`/constructors/${c.constructorId}?from=reliability&season=${season}`}
                          className="text-sm sm:text-base font-bold font-mono text-white hover:text-emerald-400 transition-colors truncate flex items-center gap-1"
                        >
                          <span className="truncate">{c.name}</span>
                          <ChevronRight className="size-3 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </Link>
                        <Link
                          href={`/reliability?team=${c.constructorId}&season=${season}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-white/10 bg-zinc-900/80 hover:bg-zinc-800 hover:border-emerald-500/30 text-[10px] sm:text-[11px] font-mono font-bold text-zinc-300 hover:text-white transition-all shadow-xs shrink-0"
                          title={`View ${c.name} Multi-Season Reliability`}
                        >
                          <span>History</span>
                          <ChevronRight className="size-3 text-zinc-500" />
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 mt-0.5">
                        <CountryFlag
                          countryName={c.nationality}
                          className="w-4 h-2.5 object-cover rounded-xs border border-white/10 shrink-0"
                        />
                        <span className="truncate">{c.nationality}</span>
                        <span className="text-zinc-600">•</span>
                        <span>{c.totalStarts} Starts</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges on mobile/tablet (docked to the right of team header) */}
                  <div className="flex lg:hidden items-center gap-1 shrink-0">
                    <span
                      title="Classified Finishes"
                      className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold"
                    >
                      {c.finishes} FIN
                    </span>
                    {c.dnfs > 0 && (
                      <span
                        title="Did Not Finish (Retirements)"
                        className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-bold"
                      >
                        {c.dnfs} DNF
                      </span>
                    )}
                    {c.dnss > 0 && (
                      <span
                        title="Did Not Start"
                        className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 text-[11px] font-mono"
                      >
                        {c.dnss} DNS
                      </span>
                    )}
                    {c.dsqs > 0 && (
                      <span
                        title="Disqualifications"
                        className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono font-bold"
                      >
                        {c.dsqs} DSQ
                      </span>
                    )}
                  </div>
                </div>

                {/* Metrics Breakdown: Full width 2-column telemetry on mobile, inline on desktop */}
                <div className="grid grid-cols-2 gap-3 w-full lg:flex lg:items-center lg:gap-6 lg:w-auto shrink-0">
                  {/* Finish Rate & Full Progress Bar */}
                  <div className="flex flex-col w-full lg:w-36">
                    <div className="flex items-baseline justify-between lg:justify-end gap-2">
                      <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                        Finish Rate
                      </span>
                      <span
                        className={cn(
                          'text-sm sm:text-base font-black font-mono',
                          c.reliabilityRate >= 95
                            ? 'text-emerald-400'
                            : c.reliabilityRate >= 85
                              ? 'text-sky-400'
                              : 'text-amber-400'
                        )}
                      >
                        {c.reliabilityRate}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(5, c.reliabilityRate))}%`,
                          backgroundColor: theme.primary,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 mt-0.5 lg:text-right">
                      {c.finishes} / {c.totalStarts} finished
                    </span>
                  </div>

                  {/* Laps Distance Survival */}
                  <div className="flex flex-col w-full lg:w-32">
                    <div className="flex items-baseline justify-between lg:justify-end gap-2">
                      <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                        Laps Ratio
                      </span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-zinc-200">
                        {c.lapCompletionRate}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-sky-400"
                        style={{
                          width: `${Math.min(100, Math.max(5, c.lapCompletionRate))}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 mt-0.5 lg:text-right truncate">
                      {c.lapsCompleted.toLocaleString()} / {c.totalPossibleLaps.toLocaleString()}
                    </span>
                  </div>

                  {/* Badges: Desktop only (on mobile they are docked to the header row above) */}
                  <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                    <span
                      title="Classified Finishes"
                      className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold"
                    >
                      {c.finishes} FIN
                    </span>
                    {c.dnfs > 0 && (
                      <span
                        title="Did Not Finish (Retirements)"
                        className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-bold"
                      >
                        {c.dnfs} DNF
                      </span>
                    )}
                    {c.dsqs > 0 && (
                      <span
                        title="Disqualifications"
                        className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono font-bold"
                      >
                        {c.dsqs} DSQ
                      </span>
                    )}
                    {c.dnss > 0 && (
                      <span
                        title="Did Not Start"
                        className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-mono"
                      >
                        {c.dnss} DNS
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-row: Teammate Split Breakdown (Full Width Grid on Mobile) */}
              {c.driverBreakdown.length > 0 && (
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-mono w-full">
                  <span className="text-zinc-500 uppercase tracking-wider text-[10px] shrink-0">
                    Drivers:
                  </span>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 w-full flex-1">
                    {c.driverBreakdown.map((driver) => (
                      <div
                        key={driver.driverId}
                        className="flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/60 border border-white/5 text-zinc-300 w-full sm:w-auto"
                      >
                        <span className="font-bold text-white text-[11px]">
                          {driver.code || driver.name}
                        </span>
                        <span className="text-zinc-600 hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                          <span
                            className={cn(
                              'font-bold text-[11px]',
                              driver.dnfs === 0
                                ? 'text-emerald-400'
                                : driver.dnfs <= 2
                                  ? 'text-zinc-300'
                                  : 'text-rose-400'
                            )}
                          >
                            {driver.dnfs} DNF
                          </span>
                          <span className="text-zinc-500 text-[10px]">
                            ({driver.reliabilityRate}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
