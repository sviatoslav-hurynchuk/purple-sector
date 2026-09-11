'use client';

import React, { useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SeasonSelectorProps {
  currentSeason: number;
  allYears: number[];
}

export function SeasonSelector({ currentSeason, allYears }: SeasonSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleSeasonChange = (year: number) => {
    startTransition(() => {
      router.push(`${pathname}?season=${year}`);
    });
  };

  const ascYears = [...allYears].sort((a, b) => a - b);
  const idx = ascYears.indexOf(currentSeason);
  const startIdx = idx !== -1 ? Math.max(0, Math.min(ascYears.length - 5, idx - 2)) : Math.max(0, ascYears.length - 5);
  const displayedYears = ascYears.slice(startIdx, startIdx + 5);

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-1 max-w-[380px] w-full sm:max-w-none sm:w-auto sm:justify-start sm:gap-2 transition-opacity duration-200', isPending && 'opacity-60 pointer-events-none')}>
      {displayedYears.map((y) => (
        <button
          key={y}
          type="button"
          disabled={isPending}
          onClick={() => handleSeasonChange(y)}
          className={cn(
            'px-2 sm:px-4 py-1 sm:py-1.5 min-h-[44px] inline-flex items-center justify-center rounded-full text-xs sm:text-sm font-semibold border transition-all',
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
          disabled={isPending}
          value={currentSeason}
          onChange={(e) => handleSeasonChange(parseInt(e.target.value, 10))}
          className="appearance-none bg-zinc-900 border border-border hover:border-primary text-foreground text-xs sm:text-sm font-semibold px-2.5 sm:px-4 py-1 sm:py-1.5 pr-6 sm:pr-8 rounded-full cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[44px]"
        >
          {allYears.map((y) => (
            <option key={y} value={y} className="bg-zinc-950 text-foreground py-1 font-mono text-xs sm:text-sm">
              {y} Season
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 sm:px-2 text-muted-foreground">
          <svg className="size-3 sm:size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
