'use client';

import React, { useState } from 'react';
import type { PitStopEntry, RaceResultEntry } from '@/types/f1';
import { getPitStops } from '@/lib/api-client';
import { PitStopDialog } from './pit-stop-dialog';
import { cn } from '@/lib/utils';

interface PitStopButtonProps {
  season: string | number;
  round: string | number;
  raceName: string;
  raceResults?: RaceResultEntry[];
  className?: string;
}

export function PitStopButton({
  season,
  round,
  raceName,
  raceResults = [],
  className,
}: PitStopButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pitStops, setPitStops] = useState<PitStopEntry[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const seasonNum = typeof season === 'string' ? parseInt(season, 10) : season;
  // Pit stop timing loops became standardized by the FIA from the 2012 season onwards
  if (seasonNum < 2012) {
    return null;
  }

  const handleClick = async () => {
    if (pitStops) {
      setIsOpen(true);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await getPitStops(season, round);

      if (!data || !data.pitStops || data.pitStops.length === 0) {
        setErrorMessage('No pit stop data available for this race.');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      setPitStops(data.pitStops);
      setIsOpen(true);
    } catch (err) {
      console.error('Failed to load pit stop data:', err);
      setErrorMessage('Failed to load pit stops');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md select-none',
          'bg-zinc-900 border border-zinc-700 hover:border-primary/60 hover:bg-zinc-800 text-foreground',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          className
        )}
      >
        {isLoading ? (
          <>
            <svg
              className="size-4 animate-spin text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading stops...</span>
          </>
        ) : (
          <>
            {/* Pit Stop Icon: Tire / Stop watch icon */}
            <svg
              className="size-4 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
              <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
              <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
              <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
            </svg>
            <span>Pit Stop Strategy</span>
          </>
        )}
      </button>

      {errorMessage && (
        <span className="text-xs text-amber-400 font-medium animate-pulse ml-2 self-center">
          {errorMessage}
        </span>
      )}

      {pitStops && pitStops.length > 0 && (
        <PitStopDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          pitStops={pitStops}
          raceResults={raceResults}
          raceName={raceName}
          season={String(season)}
          round={String(round)}
        />
      )}
    </>
  );
}