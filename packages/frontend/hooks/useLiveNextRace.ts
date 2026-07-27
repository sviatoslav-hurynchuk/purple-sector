'use client';

import useSWR from 'swr';
import { clientFetch } from '@/lib/api-client';
import type { Race } from '@/types/f1';
import { getNextSessionForRace } from '@/lib/sessions';

interface NextRaceResponse {
    race: Race;
}

function isSessionActive(race: Race | null | undefined): boolean {
    if (!race) return false;
    const session = getNextSessionForRace(race);
    return session?.isOngoing ?? false;
}

export function useLiveNextRace(initialRace?: Race | null) {
    const sessionActive = isSessionActive(initialRace);
    const refreshInterval = sessionActive ? 10_000 : 60_000;

    const { data, error, isLoading } = useSWR<NextRaceResponse>(
        '/api/races/next',
        (path: string) => clientFetch<NextRaceResponse>(path),
        {
            fallbackData: initialRace ? { race: initialRace } : undefined,
            refreshInterval,
            revalidateOnFocus: true,
            dedupingInterval: 5_000,
        }
    );

    return {
        race: data?.race ?? initialRace ?? null,
        isLoading,
        error,
    };
}
