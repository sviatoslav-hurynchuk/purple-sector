import { NextRaceSkeleton } from '@/components/f1/skeletons/next-race-skeleton';
import { StandingsSkeleton } from '@/components/f1/skeletons/standings-skeleton';

export default function DashboardLoading() {
    return (
        <div className="space-y-8">
            <div>
                <div className="h-9 w-48 bg-muted rounded-md animate-pulse" />
            </div>
            <NextRaceSkeleton />
            <StandingsSkeleton />
        </div>
    );
}
