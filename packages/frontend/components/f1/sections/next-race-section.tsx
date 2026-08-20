import { getNextRace } from '@/lib/api';
import { NextRaceSectionClient } from '@/components/f1/sections/next-race-section-client';

export async function NextRaceSection() {
    const initialRace = await getNextRace().catch(() => null);

    if (!initialRace) return null;

    return <NextRaceSectionClient initialRace={initialRace} />;
}
