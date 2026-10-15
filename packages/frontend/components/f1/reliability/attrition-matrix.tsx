'use client';

import React, { useState } from 'react';
import { CountryFlag } from '@/components/f1/country-flag';
import { getTeamTheme } from '@/lib/team-colors';
import { cn } from '@/lib/utils';
import { Grid, HelpCircle, AlertOctagon } from 'lucide-react';
import type { SeasonAttritionMatrix, RoundAttritionEntry } from '@/types/f1';

interface AttritionMatrixProps {
  matrix: SeasonAttritionMatrix;
  season: number;
}

/** Formats circuit or GP name to a 3-letter uppercase country/race abbreviation */
function getRoundShortCode(country: string, raceName: string): string {
  if (country.toLowerCase() === 'bahrain') return 'BHR';
  if (country.toLowerCase() === 'saudi arabia') return 'SAU';
  if (country.toLowerCase() === 'australia') return 'AUS';
  if (country.toLowerCase() === 'japan') return 'JPN';
  if (country.toLowerCase() === 'china') return 'CHN';
  if (country.toLowerCase() === 'united states' && raceName.includes('Miami')) return 'MIA';
  if (country.toLowerCase() === 'united states' && raceName.includes('Vegas')) return 'LVG';
  if (country.toLowerCase() === 'united states') return 'USA';
  if (country.toLowerCase() === 'italy' && raceName.includes('Emilia')) return 'EMI';
  if (country.toLowerCase() === 'italy') return 'ITA';
  if (country.toLowerCase() === 'monaco') return 'MON';
  if (country.toLowerCase() === 'canada') return 'CAN';
  if (country.toLowerCase() === 'spain') return 'ESP';
  if (country.toLowerCase() === 'austria') return 'AUT';
  if (country.toLowerCase() === 'uk' || country.toLowerCase() === 'great britain') return 'GBR';
  if (country.toLowerCase() === 'hungary') return 'HUN';
  if (country.toLowerCase() === 'belgium') return 'BEL';
  if (country.toLowerCase() === 'netherlands') return 'NLD';
  if (country.toLowerCase() === 'azerbaijan') return 'AZE';
  if (country.toLowerCase() === 'singapore') return 'SGP';
  if (country.toLowerCase() === 'mexico') return 'MEX';
  if (country.toLowerCase() === 'brazil') return 'BRA';
  if (country.toLowerCase() === 'qatar') return 'QAT';
  if (country.toLowerCase() === 'uae' || country.toLowerCase() === 'abu dhabi') return 'ABU';
  return country.slice(0, 3).toUpperCase();
}

export function AttritionMatrix({ matrix, season }: AttritionMatrixProps) {
  const [activeCell, setActiveCell] = useState<{
    driverName: string;
    roundName: string;
    entry: RoundAttritionEntry;
  } | null>(null);

  if (!matrix || matrix.rounds.length === 0 || matrix.drivers.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8 text-center text-zinc-400 font-mono text-sm">
        No round attrition matrix data available for season {season}.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
      {/* ── Header & Legend ──────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Grid className="size-4 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-black font-mono tracking-wider text-white uppercase">
              Season Attrition Matrix
            </h2>
          </div>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            Round-by-round race completion, mechanical reliability, and retirement timeline
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/40" />
            <span className="text-zinc-400">Top 10 (Points)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-zinc-800 border border-zinc-700" />
            <span className="text-zinc-400">P11+ Finish</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-rose-500/30 border border-rose-500/60" />
            <span className="text-rose-400 font-bold">DNF (Retired)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-purple-500/30 border border-purple-500/60" />
            <span className="text-purple-400 font-bold">DSQ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-zinc-700 border border-zinc-600" />
            <span className="text-zinc-500">DNS</span>
          </div>
        </div>
      </div>

      {/* ── Active Inspection Callout Banner (if mobile/tapped) ───────────── */}
      {activeCell && (
        <div className="px-4 py-2.5 bg-zinc-900 border-b border-white/10 flex items-center justify-between gap-3 text-xs font-mono animate-in fade-in duration-200">
          <div className="flex items-center gap-2 truncate">
            <AlertOctagon className="size-4 text-amber-400 shrink-0" />
            <span className="font-bold text-white truncate">{activeCell.driverName}</span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-300 truncate">{activeCell.roundName}</span>
            <span className="text-zinc-500">•</span>
            <span
              className={cn(
                'font-bold uppercase',
                activeCell.entry.category === 'finished'
                  ? 'text-emerald-400'
                  : activeCell.entry.category === 'dsq'
                    ? 'text-purple-400'
                    : 'text-rose-400'
              )}
            >
              {activeCell.entry.status}
            </span>
            {activeCell.entry.totalRoundLaps > 0 && (
              <span className="text-zinc-400">
                (Lap {activeCell.entry.laps} of {activeCell.entry.totalRoundLaps})
              </span>
            )}
          </div>
          <button
            onClick={() => setActiveCell(null)}
            className="text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 text-[11px]"
          >
            Close
          </button>
        </div>
      )}

      {/* ── Matrix Table Container with Sticky Column ────────────────────── */}
      <div className="relative overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse text-left">
          {/* Header Row: Rounds */}
          <thead>
            <tr className="border-b border-white/10 bg-zinc-950">
              {/* Sticky Top-Left Corner */}
              <th className="sticky left-0 z-30 bg-zinc-950 border-r border-white/10 p-3 sm:p-4 text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider min-w-[130px] sm:min-w-[160px]">
                Driver & Team
              </th>

              {/* Round Column Headers */}
              {matrix.rounds.map((round) => {
                const code = getRoundShortCode(round.country, round.raceName);
                const hasHighDnfs = round.dnfCount >= 4;

                return (
                  <th
                    key={round.round}
                    className="p-2 sm:p-2.5 text-center border-r border-white/5 min-w-[56px] sm:min-w-[64px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <CountryFlag
                        countryName={round.country}
                        className="w-4.5 h-3 object-cover rounded-xs border border-white/15"
                      />
                      <span className="font-mono text-[11px] font-bold text-zinc-300 tracking-wider">
                        {code}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-mono px-1 py-0.2 rounded-xs',
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
            {matrix.drivers.map((driver) => {
              const theme = getTeamTheme(driver.constructorId);

              return (
                <tr
                  key={driver.driverId}
                  className="hover:bg-white/[0.02] transition-colors group/row"
                >
                  {/* Sticky Driver Info Column */}
                  <td className="sticky left-0 z-20 bg-zinc-950 group-hover/row:bg-zinc-900/90 border-r border-white/10 p-2.5 sm:p-3 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Livery Bar */}
                      <span
                        className="w-1 h-7 rounded-full shrink-0"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono font-bold text-xs sm:text-sm text-white truncate">
                          {driver.driverCode}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[100px] sm:max-w-[120px]">
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
                        onClick={() =>
                          setActiveCell({
                            driverName: driver.driverName,
                            roundName,
                            entry,
                          })
                        }
                        className="p-1 sm:p-1.5 text-center border-r border-white/5 align-middle cursor-pointer"
                      >
                        {entry.category === 'finished' ? (
                          <div
                            title={`P${entry.position} (${entry.status}) • ${roundName}`}
                            className={cn(
                              'w-full py-1 sm:py-1.5 rounded text-[11px] font-mono font-bold transition-transform hover:scale-105 select-none',
                              isWin && 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs',
                              isPodium && !isWin && 'bg-amber-600/15 text-amber-200 border border-amber-600/30',
                              isPoints && !isPodium && 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
                              !isPoints && 'bg-zinc-900/80 text-zinc-400 border border-white/5'
                            )}
                          >
                            P{entry.position ?? entry.positionText}
                          </div>
                        ) : entry.category === 'dsq' ? (
                          <div
                            title={`Disqualified • ${roundName}`}
                            className="w-full py-1 sm:py-1.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] sm:text-[11px] font-mono font-bold transition-transform hover:scale-105 select-none"
                          >
                            DSQ
                          </div>
                        ) : entry.category === 'dns' && entry.status === 'Did not participate' ? (
                          <div
                            title={`Did not participate • ${roundName}`}
                            className="text-zinc-600 text-xs font-mono select-none"
                          >
                            —
                          </div>
                        ) : entry.category === 'dns' ? (
                          <div
                            title={`Did Not Start (${entry.status}) • ${roundName}`}
                            className="w-full py-1 sm:py-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-mono select-none"
                          >
                            DNS
                          </div>
                        ) : (
                          /* DNF / Retired / Mechanical / Collision */
                          <div
                            title={`DNF: ${entry.status} (Lap ${entry.laps}/${entry.totalRoundLaps}) • ${roundName}`}
                            className={cn(
                              'w-full py-1 sm:py-1.5 rounded text-[10px] sm:text-[11px] font-mono font-black transition-transform hover:scale-105 select-none',
                              'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                            )}
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
  );
}
