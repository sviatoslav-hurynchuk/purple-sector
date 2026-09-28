import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RaceDetailContent } from '@/components/f1/sections/race-detail-content';
import { RaceDetailSkeleton } from '@/components/f1/skeletons/race-detail-skeleton';
import { parseYear, parseRound, getMaxYear } from '@/lib/utils';

interface RaceDetailPageProps {
    params: Promise<{ round: string }>;
    searchParams: Promise<{ season?: string }>;
}

export async function generateMetadata({ params, searchParams }: RaceDetailPageProps): Promise<Metadata> {
    const { round } = await params;
    const { season } = await searchParams;
    const parsedRound = parseRound(round);
    const maxYear = getMaxYear();
    const year = parseYear(season, maxYear);

    if (parsedRound === null) {
        return {
            title: 'Race Not Found',
        };
    }

    return {
        title: `Round ${parsedRound} · ${year}`,
    };
}

export default function RaceDetailPage({ params, searchParams }: RaceDetailPageProps) {
    return (
        <div className="space-y-6 sm:space-y-8 pb-16">
            {/* ── Top Dual F1 Racing Speed Stripes (Poster Header Hook) ─────── */}
            <div className="space-y-1.5" aria-hidden="true">
                <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-transparent rounded-full opacity-90" />
                <div className="h-0.5 sm:h-1 w-3/4 bg-gradient-to-r from-red-700 via-red-600 to-transparent rounded-full opacity-60" />
            </div>

            <Suspense fallback={<RaceDetailSkeleton />}>
                <RaceDetailContent params={params} searchParams={searchParams} />
            </Suspense>
        </div>
    );
}