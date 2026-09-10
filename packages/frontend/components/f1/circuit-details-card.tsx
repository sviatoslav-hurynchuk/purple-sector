'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getCircuitDetails } from '@/lib/circuit-details';
import { CountryFlag } from '@/components/f1/country-flag';
import { cn } from '@/lib/utils';
import type { RaceResultEntry } from '@/types/f1';

interface CircuitDetailsCardProps {
  circuitId: string;
  season?: number | string;
  raceResults?: RaceResultEntry[];
  className?: string;
}

export function CircuitDetailsCard({
  circuitId,
  season,
  raceResults,
  className,
}: CircuitDetailsCardProps) {
  const [imageError, setImageError] = useState(false);
  const details = getCircuitDetails(circuitId, season, raceResults);

  const mapUrl = details?.officialMapUrl;
  React.useEffect(() => {
    setImageError(false);
  }, [mapUrl]);

  if (!details) {
    return null;
  }

  const hasValidMapUrl = Boolean(details.officialMapUrl && details.officialMapUrl.trim() !== '');
  const showMap = !imageError && hasValidMapUrl;

  const rawLapTime = details.fastestLap.time?.trim();
  const isPendingLapTime =
    !rawLapTime || rawLapTime === '—' || rawLapTime === '-' || rawLapTime === '--';
  const displayLapTime = isPendingLapTime ? '--' : rawLapTime;

  const rawDriver = details.fastestLap.driver?.trim();
  const hasDriverRecord =
    !isPendingLapTime &&
    Boolean(rawDriver && rawDriver !== '—' && rawDriver !== '-' && rawDriver !== '--');

  return (
    <div
      className={cn(
        'rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative',
        className
      )}
    >
      {/* Official F1 Dual Racing Stripes Header */}
      <div className="w-full flex flex-col">
        <div className="h-1.5 bg-[#e10600] w-full" />
        <div className="h-0.5 bg-[#e10600]/80 w-full mt-0.5" />
      </div>

      {/* Cockpit Sub-Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 sm:px-7 py-3 border-b border-white/10 bg-zinc-900/30">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="w-2 h-2 rounded-full bg-[#e10600] animate-pulse shrink-0" />
          <span className="font-mono text-xs font-black uppercase tracking-widest text-zinc-200">
            {details.circuitName ?? 'Circuit Specifications'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CountryFlag countryName={details.country} className="w-5 h-3.5 shadow-sm rounded-xs" />
          <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
            {details.country}
          </span>
        </div>
      </div>

      {/* Main Content: Map + Instrument Cluster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {showMap && (
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-8 relative bg-zinc-950/60 overflow-hidden min-h-[260px] sm:min-h-[340px]">
            {/* Ambient Livery Glow */}
            <div className="absolute inset-0 bg-[#e10600]/5 blur-3xl pointer-events-none rounded-full" />

            <Image
              src={details.officialMapUrl}
              alt={`${details.circuitName ?? details.country} official circuit map`}
              width={700}
              height={450}
              className="w-full h-auto max-h-[340px] object-contain drop-shadow-[0_0_24px_rgba(225,6,0,0.14)] relative z-10 transition-transform duration-500 hover:scale-[1.02]"
              priority
              unoptimized
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* Monolithic 1px Telemetry Matrix */}
        <div
          className={cn(
            'flex flex-col justify-between bg-zinc-950/40',
            showMap
              ? 'lg:col-span-5 border-t lg:border-t-0 lg:border-l border-white/10'
              : 'lg:col-span-12'
          )}
        >
          {/* Hero Cell: Circuit Length */}
          <div className="p-5 sm:p-7 border-b border-white/10 bg-zinc-900/20">
            <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e10600]" />
              Circuit Length
            </p>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white mt-1.5">
              {details.circuitLength}
            </p>
          </div>

          {/* 2x2 Instrument Grid */}
          <div className="grid grid-cols-2 flex-1">
            {/* First Grand Prix */}
            <div className="p-4 sm:p-6 border-b border-r border-white/10 bg-zinc-900/10 hover:bg-zinc-900/25 transition-colors">
              <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                First Grand Prix
              </p>
              <p className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
                {details.firstGrandPrix}
              </p>
            </div>

            {/* Number of Laps */}
            <div className="p-4 sm:p-6 border-b border-white/10 bg-zinc-900/10 hover:bg-zinc-900/25 transition-colors">
              <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Number of Laps
              </p>
              <p className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
                {details.numberOfLaps}
              </p>
            </div>

            {/* Fastest Lap Time */}
            <div className="p-4 sm:p-6 border-r border-white/10 bg-zinc-900/10 hover:bg-zinc-900/25 transition-colors flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Fastest Lap Time
                </p>
                <p
                  className={cn(
                    'text-xl sm:text-2xl font-black font-mono mt-1',
                    isPendingLapTime ? 'text-zinc-400' : 'text-red-400'
                  )}
                >
                  {displayLapTime}
                </p>
              </div>
              {hasDriverRecord ? (
                <p className="text-xs font-mono text-zinc-400 mt-1 truncate">
                  {details.fastestLap.driver} ({details.fastestLap.year})
                </p>
              ) : (
                <p className="text-[11px] font-mono text-zinc-500 mt-1">Record pending debut</p>
              )}
            </div>

            {/* Race Distance */}
            <div className="p-4 sm:p-6 bg-zinc-900/10 hover:bg-zinc-900/25 transition-colors flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Race Distance
                </p>
                <p className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
                  {details.raceDistance}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
