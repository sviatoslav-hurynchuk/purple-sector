'use client';

import React from 'react';
import Link from 'next/link';
import { getTeamTheme } from '@/lib/team-colors';
import { CountryFlag } from '@/components/f1/country-flag';
import { TeamLogo } from '@/components/f1/team-logo';
import { cn } from '@/lib/utils';
import { ChevronRight, ShieldAlert, Award } from 'lucide-react';
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
    <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-900/40">
        <div>
          <div className="flex items-center gap-2">
            <Award className="size-4 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-black font-mono tracking-wider text-white uppercase">
              Constructor Reliability Leaderboard
            </h2>
          </div>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            Ranked by finish consistency (% starts completed) and lap distance survival
          </p>
        </div>
        <div className="text-xs font-mono text-zinc-400">
          {constructors.length} Constructors
        </div>
      </div>

      {/* Rows Container */}
      <div className="divide-y divide-white/5">
        {constructors.map((c, index) => {
          const theme = getTeamTheme(c.constructorId);
          const isTop3 = index < 3;

          return (
            <div
              key={c.constructorId}
              className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors flex flex-col gap-3 group"
            >
              {/* Primary Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Team Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Position */}
                  <span
                    className={cn(
                      'w-7 font-mono font-black text-base sm:text-lg text-right shrink-0',
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
                    className="w-1.5 h-10 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-y-110"
                    style={{ backgroundColor: theme.primary }}
                  />

                  {/* Logo / Flag / Name */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        constructorId={c.constructorId}
                        className="size-4.5 object-contain shrink-0 opacity-80"
                      />
                      <Link
                        href={`/constructors/${c.constructorId}`}
                        className="text-base sm:text-lg font-bold font-mono text-white hover:text-emerald-400 transition-colors truncate flex items-center gap-1.5"
                      >
                        <span>{c.name}</span>
                        <ChevronRight className="size-3.5 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-0.5">
                      <CountryFlag
                        countryName={c.nationality}
                        className="w-4.5 h-3.5 object-cover rounded-xs border border-white/10 shrink-0"
                      />
                      <span className="truncate">{c.nationality}</span>
                      <span className="text-zinc-600">•</span>
                      <span>{c.totalStarts} Starts</span>
                    </div>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 self-start lg:self-auto shrink-0">
                  {/* Progress Bar & Rate */}
                  <div className="flex flex-col items-start lg:items-end min-w-[130px] sm:min-w-[160px]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                        Reliability
                      </span>
                      <span
                        className={cn(
                          'text-base sm:text-lg font-black font-mono',
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
                    <div className="w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(5, c.reliabilityRate))}%`,
                          backgroundColor: theme.primary,
                        }}
                      />
                    </div>
                  </div>

                  {/* Laps Distance Survival */}
                  <div className="flex flex-col items-start lg:items-end min-w-[110px]">
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      Laps Ratio
                    </span>
                    <span className="text-sm sm:text-base font-bold font-mono text-zinc-200">
                      {c.lapCompletionRate}%
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {c.lapsCompleted} / {c.totalPossibleLaps}
                    </span>
                  </div>

                  {/* Badges: Finishes, DNFs, DSQ */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      title="Classified Finishes"
                      className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold"
                    >
                      {c.finishes} FIN
                    </span>
                    {c.dnfs > 0 && (
                      <span
                        title="Did Not Finish (Retirements)"
                        className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-bold"
                      >
                        {c.dnfs} DNF
                      </span>
                    )}
                    {c.dsqs > 0 && (
                      <span
                        title="Disqualifications"
                        className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono font-bold"
                      >
                        {c.dsqs} DSQ
                      </span>
                    )}
                    {c.dnss > 0 && (
                      <span
                        title="Did Not Start"
                        className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-mono"
                      >
                        {c.dnss} DNS
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-row: Teammate Split Breakdown */}
              {c.driverBreakdown.length > 0 && (
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="text-zinc-500 uppercase tracking-wider text-[11px]">
                    Drivers:
                  </span>
                  {c.driverBreakdown.map((driver) => (
                    <div
                      key={driver.driverId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-white/5 text-zinc-300"
                    >
                      <span className="font-bold text-white">{driver.code || driver.name}</span>
                      <span className="text-zinc-500">•</span>
                      <span
                        className={cn(
                          'font-bold',
                          driver.dnfs === 0
                            ? 'text-emerald-400'
                            : driver.dnfs <= 2
                              ? 'text-zinc-300'
                              : 'text-rose-400'
                        )}
                      >
                        {driver.dnfs} DNF
                      </span>
                      <span className="text-zinc-500 text-[11px]">
                        ({driver.reliabilityRate}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
