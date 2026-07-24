'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Race } from '@/types/f1';
import { useCountdown } from '@/hooks/useCountdown';
import { getNextSessionForRace } from '@/lib/sessions';
import { getCountryFlagUrl } from '@/lib/country-flags';
import { cn } from '@/lib/utils';

interface CountdownWidgetProps {
  race?: Race | null;
  className?: string;
  showCountry?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CountdownWidget({
  race,
  className,
  showCountry = true,
  size = 'md',
}: CountdownWidgetProps) {
  const nextSession = race ? getNextSessionForRace(race) : null;
  const countdown = useCountdown(nextSession?.rawDate);

  if (!race) return null;

  const countryName = race.Circuit.Location.country;
  const flagUrl = getCountryFlagUrl(countryName);
  const season = race.season ?? race.date?.substring(0, 4) ?? new Date().getFullYear();
  const eventUrl = `/calendar/${race.round}?season=${season}`;

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm sm:text-base',
    lg: 'text-lg sm:text-xl',
  };

  const numberSizes = {
    sm: 'text-sm font-black',
    md: 'text-lg sm:text-xl font-black',
    lg: 'text-2xl sm:text-3xl font-black',
  };

  const unitSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const pad = (num: number) => num.toString().padStart(2, '0');

  if (nextSession?.isOngoing) {
    return (
      <Link
        href={eventUrl}
        className={cn(
          'group inline-flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-zinc-950/90 border border-red-900/40 hover:border-red-600/80 hover:bg-zinc-900/90 shadow-lg backdrop-blur-sm transition-all cursor-pointer',
          className
        )}
      >
        <span className="flex items-center gap-1.5 bg-red-600/20 text-red-500 font-bold px-2 py-0.5 rounded text-xs border border-red-500/30">
          <span className="size-2 rounded-full bg-red-500 animate-pulse" />
          LIVE
        </span>

        <span className="font-mono text-xs sm:text-sm font-black text-zinc-200 uppercase tracking-tight">
          {nextSession.code} IN PROGRESS
        </span>

        <svg
          className="size-4 text-zinc-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-auto"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>
    );
  }

  if (!nextSession || countdown.isExpired) {
    return (
      <Link
        href={eventUrl}
        className={cn(
          'group inline-flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/90 transition-all cursor-pointer',
          className
        )}
      >
        {showCountry && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold tracking-wide">
            {flagUrl && (
              <Image
                src={flagUrl}
                alt={`${countryName} flag`}
                width={16}
                height={12}
                className="w-4 h-3 object-cover rounded-xs border border-zinc-700/50 shrink-0"
              />
            )}
            <span>{countryName}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-black font-mono text-zinc-400">
          <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[11px]">EVENT</span>
          <span>COMPLETED</span>
        </div>
        <svg
          className="size-4 text-zinc-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-auto"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>
    );
  }

  const { days, hours, minutes, seconds, isReady } = countdown;

  return (
    <Link
      href={eventUrl}
      className={cn(
        'group inline-flex flex-col gap-1.5 p-3 sm:p-4 rounded-xl bg-zinc-950/90 border border-zinc-800/80 hover:border-primary/50 hover:bg-zinc-900/90 shadow-lg backdrop-blur-sm transition-all cursor-pointer',
        className
      )}
    >
      {showCountry && (
        <div className="flex items-center justify-between gap-1.5 text-xs sm:text-sm font-bold tracking-tight text-zinc-200">
          <div className="flex items-center gap-1.5">
            {flagUrl && (
              <Image
                src={flagUrl}
                alt={`${countryName} flag`}
                width={18}
                height={14}
                className="w-4 sm:w-4.5 h-3 sm:h-3.5 object-cover rounded-xs border border-zinc-700/60 shadow-xs shrink-0"
              />
            )}
            <span className="group-hover:text-primary transition-colors">{countryName}</span>
          </div>
          <svg
            className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      )}

      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'font-black tracking-tighter text-foreground uppercase font-mono',
              textSizes[size]
            )}
          >
            {nextSession.code}
          </span>

          <div className="h-4 sm:h-5 w-px bg-zinc-700/80 mx-0.5" />

          {!isReady ? (
            <span className="font-mono text-xs text-muted-foreground animate-pulse">--H --M --S</span>
          ) : (
            <div className="flex items-baseline gap-1.5 font-mono leading-none tracking-tight">
              {days > 0 && (
                <span className="flex items-baseline">
                  <span className={cn('text-foreground font-extrabold', numberSizes[size])}>{pad(days)}</span>
                  <span className={cn('text-primary font-black uppercase ml-0.5', unitSizes[size])}>D</span>
                </span>
              )}

              <span className="flex items-baseline">
                <span className={cn('text-foreground font-extrabold', numberSizes[size])}>{pad(hours)}</span>
                <span className={cn('text-primary font-black uppercase ml-0.5', unitSizes[size])}>H</span>
              </span>

              <span className="flex items-baseline">
                <span className={cn('text-foreground font-extrabold', numberSizes[size])}>{pad(minutes)}</span>
                <span className={cn('text-primary font-black uppercase ml-0.5', unitSizes[size])}>M</span>
              </span>

              <span className="flex items-baseline">
                <span className={cn('text-foreground font-extrabold', numberSizes[size])}>{pad(seconds)}</span>
                <span className={cn('text-primary font-black uppercase ml-0.5', unitSizes[size])}>S</span>
              </span>
            </div>
          )}
        </div>

        {!showCountry && (
          <svg
            className="size-4 text-zinc-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        )}
      </div>
    </Link>
  );
}
