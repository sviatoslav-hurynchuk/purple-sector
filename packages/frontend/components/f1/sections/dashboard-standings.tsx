import { getDriverStandings, getConstructorStandings } from '@/lib/api';
import type { DriverStanding, ConstructorStanding } from '@/types/f1';
import { DriverStandingsCard } from '@/components/f1/standings/driver-standings-card';
import { ConstructorStandingsCard } from '@/components/f1/standings/constructor-standings-card';

export async function DashboardStandings() {
    const [driverStandings, constructorStandings] = await Promise.all([
        getDriverStandings().catch(() => [] as DriverStanding[]),
        getConstructorStandings().catch(() => [] as ConstructorStanding[]),
    ]);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-5 items-stretch">
            <DriverStandingsCard
                standings={driverStandings}
                limit={10}
                showFullStandingsLink
                title="DRIVERS' CHAMPIONSHIP TOP 10"
            />
            <ConstructorStandingsCard
                standings={constructorStandings}
                showFullStandingsLink
                title="CONSTRUCTORS' CHAMPIONSHIP"
            />
        </div>
    );
}
