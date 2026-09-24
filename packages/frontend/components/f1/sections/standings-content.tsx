import {
    getDriverStandings,
    getConstructorStandings,
    getRaceSchedule,
} from '@/lib/api';
import type { DriverStanding, ConstructorStanding, Race } from '@/types/f1';
import { SeasonSelector } from '@/components/f1/season-selector';
import { RoundSelector } from '@/components/f1/round-selector';
import { parseYear, parseRound, getMaxYear, isRacePast } from '@/lib/utils';
import { DriverStandingsCard } from '@/components/f1/standings/driver-standings-card';
import { ConstructorStandingsCard } from '@/components/f1/standings/constructor-standings-card';

interface StandingsContentProps {
    searchParams: Promise<{ season?: string; round?: string }>;
    allYears: number[];
}

export async function StandingsContent({ searchParams, allYears }: StandingsContentProps) {
    const { season, round } = await searchParams;

    const maxYear = getMaxYear();
    const year = parseYear(season, maxYear);
    const rawRound = parseRound(round) ?? undefined;

    const races = await getRaceSchedule(year).catch(() => [] as Race[]);
    const completedRaces = races.filter((r) => isRacePast(r.date, r.time));

    const selectedRound =
        rawRound !== undefined && completedRaces.some((r) => parseInt(r.round, 10) === rawRound)
            ? rawRound
            : undefined;

    const [driverStandings, constructorStandings] = await Promise.all([
        getDriverStandings(year, selectedRound).catch(() => [] as DriverStanding[]),
        getConstructorStandings(year, selectedRound).catch(() => [] as ConstructorStanding[]),
    ]);

    const activeRoundRace = selectedRound
        ? completedRaces.find((r) => parseInt(r.round, 10) === selectedRound)
        : undefined;

    // Telemetry Highlights Calculation
    const leaderDriver = driverStandings[0];
    const leaderTeam = constructorStandings[0];
    const p1Pts = parseFloat(driverStandings[0]?.points || '0');
    const p2Pts = parseFloat(driverStandings[1]?.points || '0');
    const titleMargin = (p1Pts - p2Pts).toFixed(0);
    const totalRacesCount = races.length || 24;
    const currentCompletedCount = activeRoundRace
        ? parseInt(activeRoundRace.round, 10)
        : completedRaces.length;
    const seasonPct = Math.min(100, Math.round((currentCompletedCount / totalRacesCount) * 100));

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* ── Main Cockpit Header ────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white uppercase flex flex-wrap items-baseline gap-3">
                        <span>{year}</span>
                        <span className="text-zinc-400 font-sans font-black tracking-tighter text-2xl sm:text-3xl lg:text-4xl">
                            CHAMPIONSHIP STANDINGS
                        </span>
                    </h1>

                    {activeRoundRace && (
                        <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-red-500 font-bold uppercase">Round {activeRoundRace.round}</span>
                            <span className="text-zinc-600">•</span>
                            <span>{activeRoundRace.raceName}</span>
                            <span className="text-zinc-600">•</span>
                            <span>Official Classification</span>
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
                    <SeasonSelector currentSeason={year} allYears={allYears} />
                    {completedRaces.length > 0 && (
                        <RoundSelector
                            currentSeason={year}
                            currentRound={selectedRound}
                            races={completedRaces}
                        />
                    )}
                </div>
            </div>

            {/* ── Season Pulse Telemetry Ribbon (Monolithic 4-Metric Bar) ───── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-white/10 bg-zinc-950/90 divide-y sm:divide-y-0 sm:divide-x divide-white/10 overflow-hidden shadow-xl">
                {/* Metric 1: Drivers' Leader */}
                <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
                    <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
                        Drivers&apos; Leader
                    </span>
                    <p className="text-xl sm:text-2xl font-black font-mono text-white truncate">
                        {leaderDriver
                            ? (leaderDriver.Driver.code || leaderDriver.Driver.familyName).toUpperCase()
                            : '—'}
                    </p>
                    <span className="text-[11px] font-mono text-zinc-400 truncate">
                        {leaderDriver
                            ? `${leaderDriver.points} PTS • ${leaderDriver.Constructors[0]?.name ?? ''}`
                            : 'Awaiting season results'}
                    </span>
                </div>

                {/* Metric 2: Constructors' Leader */}
                <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
                    <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
                        Constructors&apos; Leader
                    </span>
                    <p className="text-xl sm:text-2xl font-black font-mono text-amber-400 truncate">
                        {leaderTeam ? leaderTeam.Constructor.name.toUpperCase() : '—'}
                    </p>
                    <span className="text-[11px] font-mono text-zinc-400 truncate">
                        {leaderTeam ? `${leaderTeam.points} PTS • ${leaderTeam.wins} Wins` : 'Awaiting team results'}
                    </span>
                </div>

                {/* Metric 3: Title Margin */}
                <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
                    <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
                        Title Margin (P1-P2)
                    </span>
                    <p className="text-xl sm:text-2xl font-black font-mono text-white">
                        {driverStandings.length > 1 ? `+${titleMargin} PTS` : '—'}
                    </p>
                    <span className="text-[11px] font-mono text-zinc-400 truncate">
                        {driverStandings.length > 1
                            ? `Gap to ${driverStandings[1]?.Driver?.code || driverStandings[1]?.Driver?.familyName}`
                            : 'Championship battle'}
                    </span>
                </div>

                {/* Metric 4: Season Stage */}
                <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
                    <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
                        Season Stage
                    </span>
                    <p className="text-xl sm:text-2xl font-black font-mono text-white">
                        {currentCompletedCount} / {totalRacesCount}{' '}
                        <span className="text-xs font-mono font-semibold text-zinc-400">Rounds</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden border border-white/5">
                            <div
                                className="h-full bg-red-500 rounded-full transition-all duration-500"
                                style={{ width: `${seasonPct}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                            {seasonPct}%
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Standings Matrix (Full Positions) ─────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-5 items-stretch">
                <DriverStandingsCard
                    standings={driverStandings}
                    subtitle={
                        activeRoundRace
                            ? `Classifications after ${activeRoundRace.raceName} (Round ${activeRoundRace.round})`
                            : undefined
                    }
                />
                <ConstructorStandingsCard
                    standings={constructorStandings}
                    subtitle={
                        activeRoundRace
                            ? `Team classifications after ${activeRoundRace.raceName} (Round ${activeRoundRace.round})`
                            : undefined
                    }
                />
            </div>
        </div>
    );
}
