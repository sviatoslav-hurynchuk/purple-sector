import { notFound } from 'next/navigation';
import { getRaceDetail, getRaceSchedule, getOpenF1RaceData } from '@/lib/api';
import { RaceSchedule } from '@/components/f1/race-schedule';
import { CircuitDetailsCard } from '@/components/f1/circuit-details-card';
import { PitStopButton } from '@/components/f1/pit-stops/pit-stop-button';
import { LapsButton } from '@/components/f1/laps/laps-button';
import { RaceCockpitHeader } from '@/components/f1/race-cockpit-header';
import { parseYear, parseRound, getMaxYear } from '@/lib/utils';
import type { Race } from '@/types/f1';

interface RaceDetailContentProps {
    params: Promise<{ round: string }>;
    searchParams: Promise<{ season?: string; mockScheduleChange?: string; mock?: string }>;
}

export async function RaceDetailContent({ params, searchParams }: RaceDetailContentProps) {
    const { round } = await params;
    const sp = await searchParams;
    const season = sp?.season;
    const mockParam = sp?.mockScheduleChange || sp?.mock;

    const parsedRound = parseRound(round);
    const maxYear = getMaxYear();
    const year = parseYear(season, maxYear);

    if (parsedRound === null) {
        notFound();
    }

    const [raceData, openF1Data] = await Promise.all([
        getRaceDetail(year, parsedRound, mockParam).catch(() => null),
        year >= 2023 ? getOpenF1RaceData(year, parsedRound).catch(() => null) : Promise.resolve(null),
    ]);

    let race: Race | null = raceData;

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
    const radioHighlights = openF1Data?.highlights && openF1Data.highlights.length > 0
        ? openF1Data.highlights
        : [];

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

            {/* ── Race Schedule with Best Race Radio in Telemetry Ribbon ─────── */}
            <RaceSchedule race={race} radioHighlights={radioHighlights} />

            <CircuitDetailsCard
                circuitId={race.Circuit.circuitId}
                season={year}
                raceResults={validResults}
            />
        </>
    );
}
