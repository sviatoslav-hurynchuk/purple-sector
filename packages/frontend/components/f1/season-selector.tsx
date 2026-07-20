'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SeasonSelectorProps {
  currentSeason: number;
  allYears: number[];
}

/**
 * Interactive season switcher allowing quick selection of recent seasons
 * or picking any historical F1 season from 1950 onwards via dropdown.
 */
export function SeasonSelector({ currentSeason, allYears }: SeasonSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSeasonChange = (year: number) => {
    router.push(`${pathname}?season=${year}`);
  };

  // Sort ascending and take a 5-year window centered around currentSeason
  const ascYears = [...allYears].sort((a, b) => a - b);
  const idx = ascYears.indexOf(currentSeason);
  const startIdx = idx !== -1 ? Math.max(0, Math.min(ascYears.length - 5, idx - 2)) : Math.max(0, ascYears.length - 5);
  const displayedYears = ascYears.slice(startIdx, startIdx + 5);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {displayedYears.map((y) => (
        <button
          key={y}
          type="button"
          onClick={() => handleSeasonChange(y)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-semibold border transition-all',
            y === currentSeason
              ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
              : 'border-border text-muted-foreground hover:border-primary hover:text-primary bg-zinc-900/50'
          )}
        >
          {y}
        </button>
      ))}

      <div className="relative">
        <select
          aria-label="Select F1 Season"
          value={currentSeason}
          onChange={(e) => handleSeasonChange(parseInt(e.target.value, 10))}
          className="appearance-none bg-zinc-900 border border-border hover:border-primary text-foreground text-sm font-semibold px-4 py-1.5 pr-8 rounded-full cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {allYears.map((y) => (
            <option key={y} value={y} className="bg-zinc-950 text-foreground py-1 font-mono">
              {y} Season
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground">
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
