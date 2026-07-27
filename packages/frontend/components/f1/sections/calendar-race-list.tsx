import Link from 'next/link';
import { getRaceSchedule } from '@/lib/api';
import type { Race } from '@/types/f1';
import { SeasonSelector } from '@/components/f1/season-selector';
import { formatDateDDMMYYYY, isRacePast, parseYear, getMaxYear } from '@/lib/utils';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CalendarRaceListProps {
    searchParams: Promise<{ season?: string }>;
    allYears: number[];
}

export async function CalendarRaceList({ searchParams, allYears }: CalendarRaceListProps) {
    const { season } = await searchParams;
    const maxYear = getMaxYear();
    const year = parseYear(season, maxYear);
    const races = await getRaceSchedule(year);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">{year} Race Calendar</h1>
                    <p className="text-muted-foreground mt-1">{races.length} races scheduled.</p>
                </div>
                <SeasonSelector currentSeason={year} allYears={allYears} />
            </div>

            <div className="grid grid-cols-1 gap-3">
                {races.map((race: Race) => {
                    const past = isRacePast(race.date, race.time);
                    return (
                        <Link key={race.round} href={`/calendar/${race.round}?season=${year}`}>
                            <Card className={`transition-all hover:ring-primary/50 hover:ring-2 cursor-pointer ${past ? 'opacity-60' : ''}`}>
                                <CardHeader>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl font-black font-mono text-muted-foreground w-8 shrink-0">
                                                {race.round}
                                            </span>
                                            <div>
                                                <CardTitle className="text-base">{race.raceName}</CardTitle>
                                                <CardDescription>
                                                    {race.Circuit.circuitName} — {race.Circuit.Location.locality},{' '}
                                                    {race.Circuit.Location.country}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            {race.Sprint && (
                                                <Badge variant="secondary" className="text-xs">Sprint</Badge>
                                            )}
                                            <Badge variant={past ? 'secondary' : 'outline'} className={!past ? 'border-primary text-primary' : ''}>
                                                {formatDateDDMMYYYY(race.date)}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
