import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CountryFlag } from '@/components/f1/country-flag';
import type { Race, RaceResult } from '@/types/f1';
import { cn } from '@/lib/utils';

export interface RaceCockpitHeaderProps {
  race: Race | RaceResult;
  /** Back link URL. Defaults to `/calendar/${race.round}?season=${race.season}` */
  backHref?: string;
  /** Back link text. Defaults to `Back to ${race.raceName}` */
  backLabel?: string;
  /** Accent section tag displayed in the subtitle (e.g. 'Lap-by-Lap Replay', 'Pit Stop Telemetry & Strategy') */
  sectionTag?: string;
  /** Right-aligned slot for actions/badges (e.g. lap count badges, action buttons) */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard cockpit header for Grand Prix weekend pages and sub-pages.
 * Unifies breadcrumbs, two-tone year/GP typography, country flag, and telemetry subtitles.
 */
export function RaceCockpitHeader({
  race,
  backHref,
  backLabel,
  sectionTag,
  actions,
  className,
}: RaceCockpitHeaderProps) {
  const year = race.season;
  const targetBackHref = backHref ?? `/calendar/${race.round}?season=${race.season}`;
  const targetBackLabel = backLabel ?? `Back to ${race.raceName}`;

  return (
    <div className={cn('flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4', className)}>
      <div>
        {/* Back link / breadcrumb */}
        <Link
          href={targetBackHref}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors mb-2 group"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>{targetBackLabel}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-red-500">Round {race.round}</span>
        </Link>

        {/* Main Two-Tone Heading */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white uppercase flex flex-wrap items-baseline gap-2.5 sm:gap-3">
          <span>{year}</span>
          <span className="text-zinc-400 font-sans font-black tracking-tighter text-2xl sm:text-3xl lg:text-4xl">
            {race.raceName.toUpperCase()}
          </span>
          <CountryFlag
            countryName={race.Circuit.Location.country}
            className="w-7 h-4.5 sm:w-8 sm:h-5 shadow-md rounded-xs ml-1 shrink-0"
            preload
          />
        </h1>

        {/* Telemetry & Circuit Subtitle */}
        <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
          {sectionTag && (
            <>
              <span className="text-red-500 font-bold uppercase">{sectionTag}</span>
              <span className="text-zinc-600">•</span>
            </>
          )}
          <span>{race.Circuit.circuitName}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-300 font-bold">{race.date}</span>
        </p>
      </div>

      {/* Right Actions / Badges Slot */}
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
