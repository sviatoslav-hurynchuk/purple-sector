'use client';

import { useLiveNextRace } from '@/hooks/useLiveNextRace';
import { NextRaceCard } from '@/components/f1/next-race-card';
import { CircuitDetailsCard } from '@/components/f1/circuit-details-card';
import type { Race } from '@/types/f1';

interface NextRaceSectionClientProps {
    initialRace: Race;
}

export function NextRaceSectionClient({ initialRace }: NextRaceSectionClientProps) {
    const { race } = useLiveNextRace(initialRace);

    if (!race) return null;

    return (
        <>
            <NextRaceCard race={race} />
            <CircuitDetailsCard circuitId={race.Circuit.circuitId} />
        </>
    );
}
