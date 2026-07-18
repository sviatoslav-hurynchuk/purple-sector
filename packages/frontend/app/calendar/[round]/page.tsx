import Link from 'next/link';
import { getRaceSchedule } from '@/lib/api';
import type { Race } from '@/types/f1';

export const metadata = {
    title: 'Race Calendar',
};

interface CalendarPageProps {
    searchParams: Promise<{ season?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
    const { season } = await searchParams;
    const year = season ? parseInt(season, 10) : new Date().getFullYear();

    const races = await getRaceSchedule(year);

    return (
        <div>
            <h1>{year} Race Calendar</h1>

            <ul>
                {races.map((race: Race) => (
                    <li key={race.round}>
                        <Link href={`/calendar/${race.round}?season=${year}`}>
                            <span>Round {race.round}</span>
                            <span>{race.raceName}</span>
                            <span>{race.Circuit.Location.country}</span>
                            <span>{race.date}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}