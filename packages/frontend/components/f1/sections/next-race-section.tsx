import { getNextRace } from '@/lib/api';
import { NextRaceSectionClient } from '@/components/f1/sections/next-race-section-client';

export async function NextRaceSection({ mockParam }: { mockParam?: string } = {}) {
    const initialRace = await getNextRace(mockParam).catch(() => null);

    if (!initialRace) return null;

    return <NextRaceSectionClient initialRace={initialRace} />;
}
