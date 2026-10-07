import React from 'react';
import Link from 'next/link';
import type { RaceResultEntry } from '@/types/f1';
import { CountryFlag } from '@/components/f1/country-flag';
import { TeamLogo } from '@/components/f1/team-logo';
import { getTeamTheme } from '@/lib/team-colors';
import { isDnfStatus } from '@/lib/f1-status';
import { Timer, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RaceResultsTableProps {
    results: RaceResultEntry[];
    highlightPoints?: boolean;
}

/** Classifies driver finish type for motorsports badge rendering */
function getClassificationType(
    result: RaceResultEntry
): 'winner' | 'podium' | 'classified' | 'dsq' | 'dns' | 'dnf' {
    const p = (result.positionText ?? '').trim().toUpperCase();
    const s = (result.status ?? '').trim().toLowerCase();
    const posNum = parseInt(result.position, 10);

    if (p === 'D' || s.includes('disqualif') || s === 'dsq') return 'dsq';
    if (p === 'DNS' || s.includes('did not start')) return 'dns';
    if (isDnfStatus(result.status, result.positionText)) return 'dnf';
    if (posNum === 1) return 'winner';
    if (posNum === 2 || posNum === 3) return 'podium';
    return 'classified';
}

/** Calculates positions gained or lost from starting grid to chequered flag */
function getGridDelta(gridStr: string, posStr: string, isDnf: boolean): number | null {
    if (isDnf) return null;
    const grid = parseInt(gridStr, 10);
    const finish = parseInt(posStr, 10);
    if (isNaN(grid) || isNaN(finish) || grid <= 0 || finish <= 0) return null;
    return grid - finish;
}

export function RaceResultsTable({ results, highlightPoints = false }: RaceResultsTableProps) {
    return (
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                    <tr className="border-b border-white/10 bg-zinc-950/90 text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                        <th className="py-2.5 px-3 text-center w-14">Pos</th>
                        <th className="py-2.5 px-3">Driver</th>
                        <th className="py-2.5 px-3">Constructor</th>
                        <th className="py-2.5 px-3 text-center w-20">Grid</th>
                        <th className="py-2.5 px-3 text-center w-16">Laps</th>
                        <th className="py-2.5 px-3">Time / Status</th>
                        <th className="py-2.5 px-3 text-right w-24">Pts</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {results.map((result, idx) => {
                        const classification = getClassificationType(result);
                        const isDnf = classification === 'dnf' || classification === 'dsq' || classification === 'dns';
                        const gridDelta = getGridDelta(result.grid, result.position, isDnf);
                        const posNum = parseInt(result.position, 10);
                        const theme = getTeamTheme(result.Constructor.constructorId);
                        const isFastestLap = result.FastestLap?.rank === '1';
                        const ptsNum = parseFloat(result.points);
                        const hasPoints = !isNaN(ptsNum) && ptsNum > 0;

                        return (
                            <tr
                                key={`${result.Driver.driverId}-${result.positionText}-${idx}`}
                                className="group hover:bg-zinc-900/40 transition-colors"
                            >
                                {/* Position Badge */}
                                <td className="py-2 px-3 text-center align-middle">
                                    {classification === 'winner' ? (
                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40 font-mono font-black text-xs">
                                            P01
                                        </span>
                                    ) : classification === 'podium' ? (
                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 ring-1 ring-white/10 font-mono font-bold text-xs">
                                            {posNum ? posNum.toString().padStart(2, '0') : result.positionText}
                                        </span>
                                    ) : classification === 'dnf' ? (
                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono text-[10px] font-bold">
                                            DNF
                                        </span>
                                    ) : classification === 'dsq' ? (
                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-700/50 font-mono text-[10px] font-bold">
                                            DSQ
                                        </span>
                                    ) : classification === 'dns' ? (
                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-700/50 font-mono text-[10px] font-bold">
                                            DNS
                                        </span>
                                    ) : (
                                        <span className="font-mono font-bold text-zinc-400 text-xs">
                                            {posNum ? posNum.toString().padStart(2, '0') : result.positionText}
                                        </span>
                                    )}
                                </td>

                                {/* Driver with Team Strip, Flag, Code/Number */}
                                <td className="py-2 px-3 align-middle">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className="h-4.5 w-1 rounded-full shrink-0"
                                            style={{ backgroundColor: theme.primary }}
                                        />
                                        <CountryFlag
                                            countryName={result.Driver.nationality}
                                            className="w-4 h-3 rounded-xs shadow-xs shrink-0"
                                        />
                                        <Link
                                            href={`/drivers/${result.Driver.driverId}`}
                                            className="font-bold text-xs sm:text-sm text-white hover:text-red-400 transition-colors truncate flex items-center gap-1.5 group/driver"
                                        >
                                            <span className="text-zinc-400 font-normal hidden md:inline">
                                                {result.Driver.givenName}
                                            </span>
                                            <span className="uppercase tracking-tight font-black group-hover/driver:underline">
                                                {result.Driver.familyName}
                                            </span>
                                        </Link>
                                        {(result.Driver.code || result.number) && (
                                            <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-white/5 uppercase shrink-0">
                                                {result.Driver.code ? result.Driver.code : `#${result.number}`}
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Constructor with Logo */}
                                <td className="py-2 px-3 align-middle">
                                    <Link
                                        href={`/constructors/${result.Constructor.constructorId}`}
                                        className="inline-flex items-center gap-1.5 group/team hover:text-white transition-colors"
                                    >
                                        <TeamLogo constructorId={result.Constructor.constructorId} size={15} />
                                        <span className="text-xs font-mono text-zinc-300 group-hover/team:text-white transition-colors truncate max-w-[140px] xl:max-w-[180px]">
                                            {result.Constructor.name}
                                        </span>
                                    </Link>
                                </td>

                                {/* Starting Grid & Position Delta */}
                                <td className="py-2 px-3 text-center align-middle">
                                    <div className="inline-flex items-center justify-center gap-1.5">
                                        <span className="font-mono text-xs text-zinc-300 font-bold">
                                            {result.grid && result.grid !== '0'
                                                ? result.grid.padStart(2, '0')
                                                : 'PL'}
                                        </span>
                                        {gridDelta !== null && (
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1 py-0.2 rounded',
                                                    gridDelta > 0 && 'bg-emerald-500/10 text-emerald-400',
                                                    gridDelta < 0 && 'bg-rose-500/10 text-rose-400',
                                                    gridDelta === 0 && 'text-zinc-500'
                                                )}
                                                title={
                                                    gridDelta > 0
                                                        ? `Gained ${gridDelta} position${gridDelta > 1 ? 's' : ''}`
                                                        : gridDelta < 0
                                                        ? `Lost ${Math.abs(gridDelta)} position${Math.abs(gridDelta) > 1 ? 's' : ''}`
                                                        : 'Maintained grid position'
                                                }
                                            >
                                                {gridDelta > 0 ? (
                                                    <>
                                                        <ArrowUp className="size-2.5" />
                                                        <span>+{gridDelta}</span>
                                                    </>
                                                ) : gridDelta < 0 ? (
                                                    <>
                                                        <ArrowDown className="size-2.5" />
                                                        <span>{gridDelta}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Minus className="size-2.5" />
                                                        <span>0</span>
                                                    </>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Laps completed */}
                                <td className="py-2 px-3 text-center align-middle font-mono text-xs text-zinc-300">
                                    {result.laps}
                                </td>

                                {/* Time / Status / Fastest Lap Highlight */}
                                <td className="py-2 px-3 align-middle">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {classification === 'winner' ? (
                                            <span className="font-mono text-xs font-bold text-white">
                                                {result.Time?.time ?? 'Winner'}
                                            </span>
                                        ) : isDnf ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-xs font-semibold text-rose-400">
                                                    {result.status}
                                                </span>
                                                <span className="text-[10px] font-mono text-zinc-500">
                                                    (Lap {result.laps})
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="font-mono text-xs text-zinc-300">
                                                {result.Time?.time ?? result.status}
                                            </span>
                                        )}

                                        {isFastestLap && (
                                            <span
                                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[10px] font-bold"
                                                title={`Fastest Lap: ${result.FastestLap?.Time.time} (Lap ${result.FastestLap?.lap})`}
                                            >
                                                <Timer className="size-3 text-purple-400" />
                                                <span>FL {result.FastestLap?.Time.time}</span>
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Points Badge */}
                                <td className="py-2 px-3 text-right align-middle">
                                    {hasPoints ? (
                                        <span
                                            className={cn(
                                                'inline-flex items-center justify-center font-mono font-black text-xs px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-white shadow-xs',
                                                highlightPoints && 'border-amber-500/30 text-amber-300 bg-amber-500/10'
                                            )}
                                        >
                                            {result.points} pts
                                        </span>
                                    ) : (
                                        <span className="font-mono text-xs text-zinc-600">—</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
