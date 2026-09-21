import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getRaceDetail, getRaceSchedule } from '@/lib/api';
import { RaceSchedule } from '@/components/f1/race-schedule';
import { CircuitDetailsCard } from '@/components/f1/circuit-details-card';
import { CountryFlag } from '@/components/f1/country-flag';
import { PitStopButton } from '@/components/f1/pit-stops/pit-stop-button';
import { LapsButton } from '@/components/f1/laps/laps-button';
import { parseYear, parseRound, getMaxYear } from '@/lib/utils';
import type { Race } from '@/types/f1';

interface RaceDetailContentProps {
    params: Promise<{ round: string }>;
    searchParams: Promise<{ season?: string }>;
}

export async function RaceDetailContent({ params, searchParams }: RaceDetailContentProps) {
    const { round } = await params;
    const { season } = await searchParams;

    const parsedRound = parseRound(round);
    const maxYear = getMaxYear();
    const year = parseYear(season, maxYear);

    if (parsedRound === null) {
        notFound();
    }

    let race: Race | null = await getRaceDetail(year, parsedRound);

    if (!race) {
        const schedule = await getRaceSchedule(year).catch(() => [] as Race[]);
        race = schedule.find((r) => parseInt(r.round, 10) === parsedRound) ?? null;
    }

    if (!race) notFound();

    const validResults =
        'Results' in race &&
        Array.isArray((race as { Results?: unknown[] }).Results) &&
        (race as { Results: unknown[] }).Results.every(
            (r) => Boolean(r && typeof r === 'object')
        )
            ? (race as { Results: import('@/types/f1').RaceResultEntry[] }).Results
            : undefined;

    const hasResults = Boolean(validResults && validResults.length > 0);

    return (
        <>
            {/* ── Main Cockpit Header ────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    {/* Back link / breadcrumb */}
                    <Link
                        href={`/calendar?season=${year}`}
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors mb-2 group"
                    >
                        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span>Season Calendar</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-red-500">Round {race.round}</span>
                    </Link>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white uppercase flex flex-wrap items-baseline gap-3">
                        <span>{year}</span>
                        <span className="text-zinc-400 font-sans font-black tracking-tighter text-2xl sm:text-3xl lg:text-4xl">
                            {race.raceName.toUpperCase()}
                        </span>
                        <CountryFlag
                            countryName={race.Circuit.Location.country}
                            className="w-7 h-4.5 sm:w-8 sm:h-5 shadow-md rounded-xs ml-1"
                            preload
                        />
                    </h1>

                    <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                        <span>{race.Circuit.circuitName}</span>
                        <span className="text-zinc-600">•</span>
                        <span>{race.Circuit.Location.locality}, {race.Circuit.Location.country}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-300 font-bold">{race.date}</span>
                    </p>
                </div>

                {/* Header Action Buttons (Laps & Pit Stops if completed) */}
                {hasResults && (
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <LapsButton season={race.season} round={race.round} />
                        <PitStopButton season={race.season} round={race.round} />
                    </div>
                )}
            </div>

            <RaceSchedule race={race} />

            <CircuitDetailsCard
                circuitId={race.Circuit.circuitId}
                season={year}
                raceResults={validResults}
            />
        </>
    );
}
