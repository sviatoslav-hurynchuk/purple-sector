import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { RaceDetailContent } from '@/components/f1/sections/race-detail-content';
import { RaceDetailSkeleton } from '@/components/f1/skeletons/race-detail-skeleton';

interface RaceDetailPageProps {
    params: Promise<{ round: string }>;
    searchParams: Promise<{ season?: string }>;
}

export async function generateMetadata({ params, searchParams }: RaceDetailPageProps): Promise<Metadata> {
    const { round } = await params;
    const { season } = await searchParams;
    const year = season ? parseInt(season, 10) : new Date().getFullYear();
    return {
        title: `Round ${round} · ${year} | F1 Data Hub`,
    };
}

export default async function RaceDetailPage({ params, searchParams }: RaceDetailPageProps) {
    const { round } = await params;
    const { season } = await searchParams;
    const year = season ? parseInt(season, 10) : new Date().getFullYear();

    return (
        <div className="space-y-8">
            <Link
                href={`/calendar?season=${year}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                ← Back to {year} Calendar
            </Link>

            <Suspense fallback={<RaceDetailSkeleton />}>
                <RaceDetailContent year={year} round={parseInt(round, 10)} />
            </Suspense>
        </div>
    );
}