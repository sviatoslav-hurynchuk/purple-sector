import { Suspense } from 'react';
import type { Metadata } from 'next';
import { NextRaceSection } from '@/components/f1/sections/next-race-section';
import { DashboardStandings } from '@/components/f1/sections/dashboard-standings';
import { DashboardLiveSection } from '@/components/f1/sections/dashboard-live-section';
import { NextRaceSkeleton } from '@/components/f1/skeletons/next-race-skeleton';
import { StandingsSkeleton } from '@/components/f1/skeletons/standings-skeleton';

export const metadata: Metadata = {
    title: 'Dashboard',
};

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
            </div>

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