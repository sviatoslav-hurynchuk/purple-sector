import { notFound } from 'next/navigation';
import { getRaceDetail, getRaceSchedule } from '@/lib/api';
import { RaceSchedule } from '@/components/f1/race-schedule';
import { CircuitDetailsCard } from '@/components/f1/circuit-details-card';
import { PitStopButton } from '@/components/f1/pit-stops/pit-stop-button';
import { LapsButton } from '@/components/f1/laps/laps-button';
import { RaceCockpitHeader } from '@/components/f1/race-cockpit-header';
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
            <RaceCockpitHeader
                race={race}
                backHref={`/calendar?season=${year}`}
                backLabel="Season Calendar"
                actions={
                    hasResults ? (
                        <>
                            <LapsButton season={race.season} round={race.round} />
                            <PitStopButton season={race.season} round={race.round} />
                        </>
                    ) : undefined
                }
            />

            <RaceSchedule race={race} />

            <CircuitDetailsCard
                circuitId={race.Circuit.circuitId}
                season={year}
                raceResults={validResults}
            />
        </>
    );
}
