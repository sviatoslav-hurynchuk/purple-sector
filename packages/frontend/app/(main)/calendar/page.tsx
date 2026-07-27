import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CalendarRaceList } from '@/components/f1/sections/calendar-race-list';
import { CalendarListSkeleton } from '@/components/f1/skeletons/calendar-list-skeleton';
import { parseYear, getMaxYear } from '@/lib/utils';

export const metadata: Metadata = {
    title: 'Race Calendar',
};

interface CalendarPageProps {
    searchParams: Promise<{ season?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
    const { season } = await searchParams;
    const maxYear = getMaxYear();
    const year = parseYear(season, maxYear);

    const FIRST_SEASON = 1950;
    const allYears = Array.from(
        { length: maxYear - FIRST_SEASON + 1 },
        (_, i) => maxYear - i
    );

    return (
        <div className="space-y-8">
            <Suspense fallback={<CalendarListSkeleton />}>
                <CalendarRaceList year={year} allYears={allYears} />
            </Suspense>
        </div>
    );
}