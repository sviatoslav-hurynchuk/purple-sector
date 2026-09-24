import React from 'react';
import Link from 'next/link';
import type { DriverStanding } from '@/types/f1';
import { CountryFlag } from '@/components/f1/country-flag';
import { TeamLogo } from '@/components/f1/team-logo';
import { getTeamTheme } from '@/lib/team-colors';
import { Trophy, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DriverStandingsCardProps {
    standings: DriverStanding[];
    limit?: number;
    showFullStandingsLink?: boolean;
    title?: string;
    subtitle?: string;
    className?: string;
}

export function DriverStandingsCard({
    standings,
    limit,
    showFullStandingsLink = false,
    title,
    subtitle,
    className,
}: DriverStandingsCardProps) {
    const maxDriverPts = Math.max(1, parseFloat(standings[0]?.points || '1'));
    const displayedStandings = limit ? standings.slice(0, limit) : standings;
    const defaultTitle = limit ? `DRIVERS' CHAMPIONSHIP TOP ${limit}` : `DRIVERS' WORLD CHAMPIONSHIP`;

    return (
        <div
            className={cn(
                'rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative flex flex-col justify-between',
                className
            )}
        >
            {/* Cockpit Sub-Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-2.5 border-b border-white/10 bg-zinc-900/30">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                        <Trophy className="size-4 text-[#e10600] shrink-0" />
                        <span className="font-mono text-xs font-black uppercase tracking-widest text-zinc-200">
                            {title ?? defaultTitle}
                        </span>
                    </div>
                    {subtitle && (
                        <span className="text-[11px] font-mono text-zinc-400 pl-6">
                            {subtitle}
                        </span>
                    )}
                </div>

                {showFullStandingsLink && (
                    <Link
                        href="/standings"
                        className="inline-flex items-center gap-1 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors group self-start sm:self-auto shrink-0"
                    >
                        <span>Full Standings</span>
                        <ChevronRight className="size-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                )}
            </div>

            {/* Table Matrix */}
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 bg-zinc-950/80">
                            <th className="py-2 px-2 sm:px-2.5 text-center text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider w-10 sm:w-11">
                                Pos
                            </th>
                            <th className="py-2 px-2 sm:px-2.5 text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                                Driver
                            </th>
                            <th className="py-2 px-2 sm:px-2.5 text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider hidden sm:table-cell">
                                Team
                            </th>
                            <th className="py-2 px-2 sm:px-2.5 text-right text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                                Pts
                            </th>
                            <th className="py-2 px-2 sm:px-2.5 text-right text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider w-12 sm:w-14">
                                Wins
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {displayedStandings.map((item: DriverStanding) => {
                            const posNum = parseInt(item.position, 10);
                            const isLeader = posNum === 1;
                            const isPodium = posNum === 2 || posNum === 3;
                            const constructorId = item.Constructors[0]?.constructorId ?? '';
                            const theme = getTeamTheme(constructorId);
                            const pts = parseFloat(item.points) || 0;
                            const ptsPct = Math.max(4, Math.round((pts / maxDriverPts) * 100));

                            return (
                                <tr
                                    key={`${item.Driver.driverId}-${item.position}`}
                                    className="group hover:bg-zinc-900/40 transition-colors"
                                >
                                    {/* Position */}
                                    <td className="py-1.5 sm:py-2 px-2 sm:px-2.5 text-center">
                                        {isLeader ? (
                                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40 font-mono font-black text-xs">
                                                P01
                                            </span>
                                        ) : isPodium ? (
                                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 ring-1 ring-white/10 font-mono font-bold text-xs">
                                                {posNum.toString().padStart(2, '0')}
                                            </span>
                                        ) : (
                                            <span className="font-mono font-bold text-zinc-400 text-xs">
                                                {posNum.toString().padStart(2, '0')}
                                            </span>
                                        )}
                                    </td>

                                    {/* Driver */}
                                    <td className="py-1.5 sm:py-2 px-2 sm:px-2.5">
                                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                            <CountryFlag
                                                countryName={item.Driver.nationality}
                                                className="w-4 h-3 rounded-xs shadow-xs shrink-0"
                                            />
                                            <Link
                                                href={`/drivers/${item.Driver.driverId}`}
                                                className="font-bold text-xs sm:text-sm text-white group-hover:text-primary transition-colors truncate flex items-center gap-1"
                                            >
                                                <span className="text-zinc-400 font-normal hidden sm:inline xl:hidden 2xl:inline">
                                                    {item.Driver.givenName}
                                                </span>
                                                <span className="uppercase tracking-tight font-black">
                                                    {item.Driver.familyName}
                                                </span>
                                            </Link>
                                            {item.Driver.code && (
                                                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 px-1 py-0.2 rounded border border-white/5 uppercase shrink-0">
                                                    {item.Driver.code}
                                                </span>
                                            )}
                                        </div>
                                        {/* Mobile Team Subtitle */}
                                        <div className="sm:hidden flex items-center gap-1.5 mt-0.5">
                                            <span
                                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                                style={{ backgroundColor: theme.primary }}
                                            />
                                            <span className="text-[11px] font-mono text-zinc-400 truncate">
                                                {item.Constructors[0]?.name ?? '—'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Constructor (Desktop) */}
                                    <td className="py-1.5 sm:py-2 px-2 sm:px-2.5 hidden sm:table-cell">
                                        <Link
                                            href={`/constructors/${constructorId}`}
                                            className="inline-flex items-center gap-1.5 group/team"
                                        >
                                            <div
                                                className="w-1 h-3.5 rounded-full shrink-0"
                                                style={{ backgroundColor: theme.primary }}
                                            />
                                            <TeamLogo constructorId={constructorId} size={15} />
                                            <span className="text-xs font-mono text-zinc-300 group-hover/team:text-white transition-colors truncate max-w-[100px] xl:max-w-[85px] 2xl:max-w-[130px]">
                                                {item.Constructors[0]?.name ?? '—'}
                                            </span>
                                        </Link>
                                    </td>

                                    {/* Points + Micro Bar */}
                                    <td className="py-1.5 sm:py-2 px-2 sm:px-2.5 text-right">
                                        <span className="font-mono font-black text-white text-xs sm:text-sm tabular-nums">
                                            {item.points}
                                        </span>
                                        <div className="w-10 sm:w-12 h-1 rounded-full bg-zinc-800/80 overflow-hidden mt-0.5 ml-auto">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${ptsPct}%`,
                                                    backgroundColor: theme.primary,
                                                }}
                                            />
                                        </div>
                                    </td>

                                    {/* Wins */}
                                    <td className="py-1.5 sm:py-2 px-2 sm:px-2.5 text-right font-mono text-xs">
                                        {item.wins !== '0' ? (
                                            <span className="font-bold text-amber-400">{item.wins}</span>
                                        ) : (
                                            <span className="text-zinc-500">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {displayedStandings.length === 0 && (
                <div className="py-12 text-center text-sm font-mono text-zinc-400">
                    No driver standings available for this selection.
                </div>
            )}
        </div>
    );
}
