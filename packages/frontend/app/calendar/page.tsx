import type { Metadata } from 'next';
import Link from 'next/link';
import { getRaceSchedule } from '@/lib/api';
import type { Race } from '@/types/f1';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
    title: 'Race Calendar',
};

interface CalendarPageProps {
    searchParams: Promise<{ season?: string }>;
}

/**
 * Determines if a race is in the past relative to today.
 */
function isRacePast(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
    const { season } = await searchParams;
    const year = season ? parseInt(season, 10) : new Date().getFullYear();

    const races = await getRaceSchedule(year);

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    return (
        <div className="space-y-8">

            {/* Header with year switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">{year} Race Calendar</h1>
                    <p className="text-muted-foreground mt-1">{races.length} races scheduled.</p>
                </div>
                <div className="flex gap-2">
                    {years.map((y) => (
                        <Link
                            key={y}
                            href={`/calendar?season=${y}`}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                                y === year
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'border-border hover:border-primary hover:text-primary'
                            }`}
                        >
                            {y}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Race list */}
            <div className="grid grid-cols-1 gap-3">
                {races.map((race: Race) => {
                    const past = isRacePast(race.date);
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
                                                {race.date}
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