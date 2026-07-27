import { Suspense } from 'react';
import type { Metadata } from 'next';
import { StandingsContent } from '@/components/f1/sections/standings-content';
import { StandingsPageSkeleton } from '@/components/f1/skeletons/standings-page-skeleton';
import { getMaxYear } from '@/lib/utils';

export const metadata: Metadata = {
    title: 'Championship Standings',
};

interface StandingsPageProps {
    searchParams: Promise<{ season?: string; round?: string }>;
}

export default function StandingsPage({ searchParams }: StandingsPageProps) {
    const FIRST_SEASON = 1950;
    const maxYear = getMaxYear();
    const allYears = Array.from(
        { length: maxYear - FIRST_SEASON + 1 },
        (_, i) => maxYear - i
    );

    return (
        <div className="space-y-8">
            <Suspense fallback={<StandingsPageSkeleton />}>
                <StandingsContent searchParams={searchParams} allYears={allYears} />
            </Suspense>
        </div>
    );
}
