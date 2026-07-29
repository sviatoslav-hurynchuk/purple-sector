import { notFound } from 'next/navigation';
import { getRaceDetail, getRaceSchedule } from '@/lib/api';
import { RaceSchedule } from '@/components/f1/race-schedule';
import { CircuitDetailsCard } from '@/components/f1/circuit-details-card';
import { parseYear, parseRound, getMaxYear } from '@/lib/utils';
import type { Race } from '@/types/f1';
import { Badge } from '@/components/ui/badge';

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

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                        Round {race.round} · {year}
                    </p>
                    <h1 className="text-3xl font-black tracking-tight">{race.raceName}</h1>
                    <p className="text-muted-foreground mt-1">
                        {race.Circuit.circuitName} — {race.Circuit.Location.locality},{' '}
                        {race.Circuit.Location.country}
                    </p>
                </div>
                <Badge variant="outline" className="self-start border-border text-muted-foreground">
                    {race.date}
                </Badge>
            </div>

            <RaceSchedule race={race} />

            <CircuitDetailsCard circuitId={race.Circuit.circuitId} />
        </>
    );
}
