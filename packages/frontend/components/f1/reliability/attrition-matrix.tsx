'use client';

import React, { useState, useMemo } from 'react';
import { CountryFlag } from '@/components/f1/country-flag';
import { getTeamTheme } from '@/lib/team-colors';
import { cn } from '@/lib/utils';
import type { SeasonAttritionMatrix } from '@/types/f1';

interface AttritionMatrixProps {
  matrix: SeasonAttritionMatrix;
  season: number;
}

/** Formats circuit or GP name to a 3-letter uppercase country/race abbreviation */
function getRoundShortCode(country: string, raceName: string): string {
  const c = country.toLowerCase();
  if (c === 'bahrain') return 'BHR';
  if (c === 'saudi arabia') return 'SAU';
  if (c === 'australia') return 'AUS';
  if (c === 'japan') return 'JPN';
  if (c === 'china') return 'CHN';
  if (c === 'united states' && raceName.includes('Miami')) return 'MIA';
  if (c === 'united states' && raceName.includes('Vegas')) return 'LVG';
  if (c === 'united states') return 'USA';
  if (c === 'italy' && raceName.includes('Emilia')) return 'EMI';
  if (c === 'italy') return 'ITA';
  if (c === 'monaco') return 'MON';
  if (c === 'canada') return 'CAN';
  if (c === 'spain') return 'ESP';
  if (c === 'austria') return 'AUT';
  if (c === 'uk' || c === 'great britain') return 'GBR';
  if (c === 'hungary') return 'HUN';
  if (c === 'belgium') return 'BEL';
  if (c === 'netherlands') return 'NLD';
  if (c === 'azerbaijan') return 'AZE';
  if (c === 'singapore') return 'SGP';
  if (c === 'mexico') return 'MEX';
  if (c === 'brazil') return 'BRA';
  if (c === 'qatar') return 'QAT';
  if (c === 'uae' || c === 'abu dhabi') return 'ABU';
  return country.slice(0, 3).toUpperCase();
}

export function AttritionMatrix({ matrix, season }: AttritionMatrixProps) {
  const [filter, setFilter] = useState<'all' | 'dnf-only'>('all');

  const filteredDrivers = useMemo(() => {
    if (filter === 'dnf-only') {
      return matrix.drivers.filter((d) =>
        d.results.some(
          (r) => r.category === 'retired' || r.category === 'mechanical' || r.category === 'incident'
        )
      );
    }
    return matrix.drivers;
  }, [matrix.drivers, filter]);

  if (!matrix || matrix.rounds.length === 0 || matrix.drivers.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8 text-center text-zinc-400 font-mono text-sm">
        No round attrition matrix data available for season {season}.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Headerless Analytical Command Strip (Dominance Matrix Benchmark) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Filter */}
        <div className="inline-flex items-center border border-white/10 bg-zinc-900 divide-x divide-white/10 rounded-md overflow-hidden text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1.5 transition-colors cursor-pointer uppercase tracking-wider font-bold',
              filter === 'all'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            All ({matrix.drivers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('dnf-only')}
            className={cn(
              'px-3 py-1.5 transition-colors cursor-pointer uppercase tracking-wider font-bold',
              filter === 'dnf-only'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            DNFs Only
          </button>
        </div>

        {/* Micro Legend & Grand Prix Counter */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="size-2 rounded-xs bg-emerald-500/30 border border-emerald-500/50" />
              P1-10
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="size-2 rounded-xs bg-zinc-800 border border-zinc-700" />
              P11+
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span className="size-2 rounded-xs bg-rose-500/30 border border-rose-500/50" />
              DNF
            </span>
            <span className="flex items-center gap-1.5 text-purple-400 font-bold">
              <span className="size-2 rounded-xs bg-purple-500/30 border border-purple-500/50" />
              DSQ
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline border-l border-white/10 pl-3">
            {matrix.rounds.length} Grands Prix
          </span>
        </div>
      </div>

      {/* ── High-Density Monolithic Matrix Table Shell ── */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
        <div className="relative overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse text-left">
          {/* Header Row: Rounds */}
          <thead>
            <tr className="border-b border-white/10 bg-zinc-950">
              {/* Sticky Top-Left Corner */}
              <th className="sticky left-0 z-30 bg-zinc-950 border-r border-white/10 px-3 py-2 text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider min-w-[130px] sm:min-w-[150px]">
                Driver
              </th>

              {/* Round Column Headers */}
              {matrix.rounds.map((round) => {
                const code = getRoundShortCode(round.country, round.raceName);
                const hasHighDnfs = round.dnfCount >= 4;

                return (
                  <th
                    key={round.round}
                    className="p-1.5 text-center border-r border-white/5 min-w-[46px] sm:min-w-[52px]"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <CountryFlag
                        countryName={round.country}
                        className="w-4 h-2.5 object-cover rounded-xs border border-white/15"
                      />
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold text-zinc-300 tracking-wider">
                        {code}
                      </span>
                      <span
                        className={cn(
                          'text-[9px] font-mono px-0.5 rounded-xs leading-tight',
                          hasHighDnfs
                            ? 'bg-rose-500/20 text-rose-300 font-bold'
                            : round.dnfCount > 0
                              ? 'text-zinc-500'
                              : 'text-emerald-500/60'
                        )}
                        title={`${round.dnfCount} retirements in ${round.raceName}`}
                      >
                        {round.dnfCount > 0 ? `${round.dnfCount}X` : '0X'}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body Rows: Drivers */}
          <tbody className="divide-y divide-white/5">
            {filteredDrivers.map((driver) => {
              const theme = getTeamTheme(driver.constructorId);

              return (
                <tr
                  key={driver.driverId}
                  className="hover:bg-white/[0.02] transition-colors group/row"
                >
                  {/* Sticky Driver Column */}
                  <td className="sticky left-0 z-20 bg-zinc-950 group-hover/row:bg-zinc-900 border-r border-white/10 px-3 py-1.5 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Livery Indicator */}
                      <span
                        className="w-1 h-5 rounded-full shrink-0"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono font-bold text-xs text-white truncate leading-none">
                          {driver.driverCode}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 truncate leading-tight mt-0.5">
                          {driver.constructorName}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Outcome Cells */}
                  {driver.results.map((entry) => {
                    const roundMeta = matrix.rounds.find((r) => r.round === entry.round);
                    const roundName = roundMeta?.raceName || `Round ${entry.round}`;
                    const isPoints = entry.position !== null && entry.position <= 10;
                    const isPodium = entry.position !== null && entry.position <= 3;
                    const isWin = entry.position === 1;

                    return (
                      <td
                        key={entry.round}
                        className="p-1 text-center border-r border-white/5 align-middle select-none"
                      >
                        {entry.category === 'finished' ? (
                          <div
                            title={`P${entry.position} (${entry.status}) • ${roundName}`}
                            className={cn(
                              'w-full py-0.5 rounded text-[10px] font-mono font-bold transition-transform hover:scale-105',
                              isWin && 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
                              isPodium && !isWin && 'bg-amber-600/15 text-amber-200 border border-amber-600/30',
                              isPoints && !isPodium && 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
                              !isPoints && 'bg-zinc-900 text-zinc-400 border border-white/5'
                            )}
                          >
                            P{entry.position ?? entry.positionText}
                          </div>
                        ) : entry.category === 'dsq' ? (
                          <div
                            title={`Disqualified • ${roundName}`}
                            className="w-full py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold transition-transform hover:scale-105"
                          >
                            DSQ
                          </div>
                        ) : entry.category === 'dns' && entry.status === 'Did not participate' ? (
                          <div
                            title={`Did not participate • ${roundName}`}
                            className="text-zinc-600 text-xs font-mono"
                          >
                            —
                          </div>
                        ) : entry.category === 'dns' ? (
                          <div
                            title={`Did Not Start (${entry.status}) • ${roundName}`}
                            className="w-full py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-mono"
                          >
                            DNS
                          </div>
                        ) : (
                          /* DNF / Retired / Mechanical / Collision */
                          <div
                            title={`DNF: ${entry.status} (Lap ${entry.laps}/${entry.totalRoundLaps}) • ${roundName}`}
                            className="w-full py-0.5 rounded text-[10px] font-mono font-black transition-transform hover:scale-105 bg-rose-500/20 border border-rose-500/40 text-rose-300"
                          >
                            DNF
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
}
