import { Suspense } from 'react';
import type { Metadata } from 'next';
import { NextRaceSection } from '@/components/f1/sections/next-race-section';
import { DashboardStandings } from '@/components/f1/sections/dashboard-standings';
import { DashboardLiveSection } from '@/components/f1/sections/dashboard-live-section';
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

            <DashboardLiveSection />

            <Suspense fallback={<NextRaceSkeleton />}>
                <NextRaceSection />
            </Suspense>

            <Suspense fallback={<StandingsSkeleton />}>
                <DashboardStandings />
            </Suspense>
        </div>
    );
}