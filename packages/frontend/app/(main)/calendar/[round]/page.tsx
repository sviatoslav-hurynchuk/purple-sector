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
        <div className="space-y-8">
            <Suspense fallback={<RaceDetailSkeleton />}>
                <RaceDetailContent params={params} searchParams={searchParams} />
            </Suspense>
        </div>
    );
}