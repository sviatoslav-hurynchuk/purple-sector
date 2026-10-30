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
        <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative">
            <NextRaceCard race={race} isEmbedded />
            <CircuitDetailsCard circuitId={race.Circuit.circuitId} season={race.season} isEmbedded />
        </div>
    );
}
