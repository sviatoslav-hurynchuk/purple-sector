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
        <div className="space-y-6 sm:space-y-8 pb-16">
            {/* ── Top Dual F1 Racing Speed Stripes (Poster Header Hook) ─────── */}
            <div className="space-y-1.5" aria-hidden="true">
                <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-transparent rounded-full opacity-90" />
                <div className="h-0.5 sm:h-1 w-3/4 bg-gradient-to-r from-red-700 via-red-600 to-transparent rounded-full opacity-60" />
            </div>

            <Suspense fallback={<StandingsPageSkeleton />}>
                <StandingsContent searchParams={searchParams} allYears={allYears} />
            </Suspense>
        </div>
    );
}
