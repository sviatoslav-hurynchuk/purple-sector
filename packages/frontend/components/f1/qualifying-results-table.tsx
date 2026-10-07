import React from 'react';
import Link from 'next/link';
import type { QualifyingResultEntry } from '@/types/f1';
import { CountryFlag } from '@/components/f1/country-flag';
import { TeamLogo } from '@/components/f1/team-logo';
import { getTeamTheme } from '@/lib/team-colors';
import { cn } from '@/lib/utils';

interface QualifyingResultsTableProps {
    results: QualifyingResultEntry[];
}

/** Parses lap time string "M:SS.mmm" or "SS.mmm" into seconds */
function parseTimeToSeconds(timeStr?: string): number | null {
    if (!timeStr) return null;
    const clean = timeStr.trim();
    if (!clean || clean === '—') return null;
    const parts = clean.split(':');
    if (parts.length === 2) {
        const mins = parseFloat(parts[0]);
        const secs = parseFloat(parts[1]);
        if (isNaN(mins) || isNaN(secs)) return null;
        return mins * 60 + secs;
    }
    const secs = parseFloat(clean);
    return isNaN(secs) ? null : secs;
}

/** Resolves driver's best qualifying time and session phase */
function getDriverBestTime(
    result: QualifyingResultEntry
): { time: string; phase: 'Q3' | 'Q2' | 'Q1' } | null {
    if (result.Q3) return { time: result.Q3, phase: 'Q3' };
    if (result.Q2) return { time: result.Q2, phase: 'Q2' };
    if (result.Q1) return { time: result.Q1, phase: 'Q1' };
    return null;
}

export function QualifyingResultsTable({ results }: QualifyingResultsTableProps) {
    const poleBest = results[0] ? getDriverBestTime(results[0]) : null;
    const poleSec = poleBest ? parseTimeToSeconds(poleBest.time) : null;

    return (
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                    <tr className="border-b border-white/10 bg-zinc-950/90 text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                        <th className="py-2.5 px-3 text-center w-14">Pos</th>
                        <th className="py-2.5 px-3">Driver</th>
                        <th className="py-2.5 px-3">Constructor</th>
                        <th className="py-2.5 px-3 text-center w-24">Q1</th>
                        <th className="py-2.5 px-3 text-center w-24">Q2</th>
                        <th className="py-2.5 px-3 text-center w-24">Q3</th>
                        <th className="py-2.5 px-3 text-right w-24">Gap</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {results.map((result, idx) => {
                        const posNum = parseInt(result.position, 10);
                        const isPole = posNum === 1;
                        const isPodium = posNum === 2 || posNum === 3;
                        const theme = getTeamTheme(result.Constructor.constructorId);
                        const best = getDriverBestTime(result);
                        const bestSec = best ? parseTimeToSeconds(best.time) : null;
                        const gapSec = bestSec && poleSec ? bestSec - poleSec : null;

                        return (
                            <tr
                                key={`${result.Driver.driverId}-${result.position}-${idx}`}
                                className="group hover:bg-zinc-900/40 transition-colors"
                            >
                                    {/* Position Badge */}
                                    <td className="py-2 px-3 text-center align-middle">
                                        {isPole ? (
                                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40 font-mono font-black text-xs">
                                                POLE
                                            </span>
                                        ) : isPodium ? (
                                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 ring-1 ring-white/10 font-mono font-bold text-xs">
                                                {posNum.toString().padStart(2, '0')}
                                            </span>
                                        ) : (
                                            <span className="font-mono font-bold text-zinc-400 text-xs">
                                                {posNum ? posNum.toString().padStart(2, '0') : result.position}
                                            </span>
                                        )}
                                    </td>

                                    {/* Driver */}
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
                                        </div>
                                    </td>

                                    {/* Constructor */}
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

                                    {/* Q1 Lap Time */}
                                    <td className="py-2 px-3 text-center align-middle font-mono text-xs">
                                        {result.Q1 ? (
                                            <span
                                                className={cn(
                                                    best?.phase === 'Q1'
                                                        ? 'font-bold text-white'
                                                        : 'text-zinc-400'
                                                )}
                                            >
                                                {result.Q1}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">—</span>
                                        )}
                                    </td>

                                    {/* Q2 Lap Time */}
                                    <td className="py-2 px-3 text-center align-middle font-mono text-xs">
                                        {result.Q2 ? (
                                            <span
                                                className={cn(
                                                    best?.phase === 'Q2'
                                                        ? 'font-bold text-white'
                                                        : 'text-zinc-400'
                                                )}
                                            >
                                                {result.Q2}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">—</span>
                                        )}
                                    </td>

                                    {/* Q3 Lap Time */}
                                    <td className="py-2 px-3 text-center align-middle font-mono text-xs">
                                        {result.Q3 ? (
                                            <span
                                                className={cn(
                                                    best?.phase === 'Q3'
                                                        ? 'font-bold text-white'
                                                        : 'text-zinc-400'
                                                )}
                                            >
                                                {result.Q3}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">—</span>
                                        )}
                                    </td>

                                    {/* Gap to Pole */}
                                    <td className="py-2 px-3 text-right align-middle font-mono text-xs">
                                        {isPole ? (
                                            <span className="font-black text-amber-400">POLE</span>
                                        ) : gapSec !== null ? (
                                            <span className="text-zinc-400">
                                                +{gapSec.toFixed(3)}s
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">—</span>
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
