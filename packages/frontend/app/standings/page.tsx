import { Suspense } from 'react';
import type { Metadata } from 'next';
import { StandingsContent } from '@/components/f1/sections/standings-content';
import { StandingsPageSkeleton } from '@/components/f1/skeletons/standings-page-skeleton';
import { parseYear, parseRound } from '@/lib/utils';

export const metadata: Metadata = {
    title: 'Championship Standings',
};

interface StandingsPageProps {
    searchParams: Promise<{ season?: string; round?: string }>;
}

function getMaxYear(): number {
    const now = new Date();
    return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}

export default async function StandingsPage({ searchParams }: StandingsPageProps) {
    const { season, round } = await searchParams;

    const year = parseYear(season);
    const selectedRound = parseRound(round) ?? undefined;

    const FIRST_SEASON = 1950;
    const maxYear = getMaxYear();
    const allYears = Array.from(
        { length: maxYear - FIRST_SEASON + 1 },
        (_, i) => maxYear - i
    );

    return (
        <div className="space-y-8">
            <Suspense fallback={<StandingsPageSkeleton />}>
                <StandingsContent year={year} selectedRound={selectedRound} allYears={allYears} />
            </Suspense>
        </div>
    );
}
