import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RaceDetailContent } from '@/components/f1/sections/race-detail-content';
import { RaceDetailSkeleton } from '@/components/f1/skeletons/race-detail-skeleton';
import { parseYear, parseRound } from '@/lib/utils';

interface RaceDetailPageProps {
    params: Promise<{ round: string }>;
    searchParams: Promise<{ season?: string }>;
}

export async function generateMetadata({ params, searchParams }: RaceDetailPageProps): Promise<Metadata> {
    const { round } = await params;
    const { season } = await searchParams;
    const parsedRound = parseRound(round);
    const year = parseYear(season);

    if (parsedRound === null) {
        return {
            title: 'Race Not Found | F1 Data Hub',
        };
    }

    return {
        title: `Round ${parsedRound} · ${year} | F1 Data Hub`,
    };
}

export default async function RaceDetailPage({ params, searchParams }: RaceDetailPageProps) {
    const { round } = await params;
    const { season } = await searchParams;
    const parsedRound = parseRound(round);
    const year = parseYear(season);

    if (parsedRound === null) {
        notFound();
    }

    return (
        <div className="space-y-8">
            <Link
                href={`/calendar?season=${year}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                ← Back to {year} Calendar
            </Link>

            <Suspense fallback={<RaceDetailSkeleton />}>
                <RaceDetailContent year={year} round={parsedRound} />
            </Suspense>
        </div>
    );
}