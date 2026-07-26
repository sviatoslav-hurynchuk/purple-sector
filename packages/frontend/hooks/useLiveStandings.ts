'use client';

import useSWR from 'swr';
import { clientFetch } from '@/lib/api-client';
import type { DriverStanding, ConstructorStanding } from '@/types/f1';

interface StandingsResponse<T> {
    season: string;
    standings: T[];
}

export function useLiveStandings(
    year: number,
    initialDrivers?: DriverStanding[],
    initialConstructors?: ConstructorStanding[]
) {
    const { data: driversData } = useSWR<StandingsResponse<DriverStanding>>(
        `/api/standings/drivers?season=${year}`,
        (path: string) => clientFetch<StandingsResponse<DriverStanding>>(path),
        {
            fallbackData: initialDrivers ? { season: String(year), standings: initialDrivers } : undefined,
            refreshInterval: 30_000,
            revalidateOnFocus: true,
            dedupingInterval: 10_000,
        }
    );

    const { data: constructorsData } = useSWR<StandingsResponse<ConstructorStanding>>(
        `/api/standings/constructors?season=${year}`,
        (path: string) => clientFetch<StandingsResponse<ConstructorStanding>>(path),
        {
            fallbackData: initialConstructors ? { season: String(year), standings: initialConstructors } : undefined,
            refreshInterval: 30_000,
            revalidateOnFocus: true,
            dedupingInterval: 10_000,
        }
    );

    return {
        driverStandings: driversData?.standings ?? initialDrivers ?? [],
        constructorStandings: constructorsData?.standings ?? initialConstructors ?? [],
    };
}
