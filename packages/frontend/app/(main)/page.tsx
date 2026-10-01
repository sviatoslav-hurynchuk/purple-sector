import { Suspense } from 'react';
import type { Metadata } from 'next';
import { NextRaceSection } from '@/components/f1/sections/next-race-section';
import { DashboardStandings } from '@/components/f1/sections/dashboard-standings';
import { NextRaceSkeleton } from '@/components/f1/skeletons/next-race-skeleton';
import { StandingsSkeleton } from '@/components/f1/skeletons/standings-skeleton';

export const metadata: Metadata = {
    title: 'Dashboard | Purple Sector',
    description: 'Real-time Formula 1 live telemetry, upcoming race countdown, and official championship standings.',
};

export default function DashboardPage() {
    return (
        <div className="space-y-4 sm:space-y-5">
            <h1 className="sr-only">Formula 1 Dashboard</h1>

            {/* ── Top Dual F1 Racing Speed Stripes ───────────────────────────── */}
            <div className="space-y-1.5" aria-hidden="true">
                <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-transparent rounded-full opacity-90" />
                <div className="h-0.5 sm:h-1 w-3/4 bg-gradient-to-r from-red-700 via-red-600 to-transparent rounded-full opacity-60" />
            </div>

            <Suspense fallback={<NextRaceSkeleton />}>
                <NextRaceSection />
            </Suspense>

            <Suspense fallback={<StandingsSkeleton />}>
                <DashboardStandings />
            </Suspense>
        </div>
    );
}