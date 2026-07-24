'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Race } from '@/types/f1';

interface RoundSelectorProps {
  currentSeason: number;
  currentRound?: number;
  races: Race[];
}

/**
 * Determines if a race is in the past relative to today.
 */
function isRacePast(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

/**
 * Dropdown allowing users to view standings after a specific race round within a season
 * or view the overall final/latest standings.
 * Races that haven't occurred yet are displayed in red text.
 */
export function RoundSelector({ currentSeason, currentRound, races }: RoundSelectorProps) {
  const router = useRouter();

  const handleRoundChange = (roundValue: string) => {
    if (!roundValue || roundValue === 'all') {
      router.push(`/standings?season=${currentSeason}`);
    } else {
      router.push(`/standings?season=${currentSeason}&round=${roundValue}`);
    }
  };

  return (
    <div className="relative">
      <select
        aria-label="Select Race Round for Standings"
        value={currentRound ?? 'all'}
        onChange={(e) => handleRoundChange(e.target.value)}
        className="appearance-none bg-zinc-900 border border-border hover:border-primary text-foreground text-sm font-semibold px-4 py-1.5 pr-8 rounded-full cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="all" className="bg-zinc-950 text-foreground py-1 font-mono">
          Full Season (Final / Current)
        </option>
        {races.map((r) => {
          const past = isRacePast(r.date);
          return (
            <option
              key={r.round}
              value={r.round}
              className={`bg-zinc-950 py-1 font-mono ${
                past ? 'text-foreground' : 'text-red-500 font-semibold'
              }`}
            >
              After R{r.round}: {r.raceName} {!past ? '(Upcoming)' : ''}
            </option>
          );
        })}
      </select>
      {/* Dropdown arrow icon */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground">
        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}
