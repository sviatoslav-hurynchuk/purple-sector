'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getCircuitDetails } from '@/lib/circuit-details';
import { Card, CardContent } from '@/components/ui/card';
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

  if (!details) {
    return null;
  }

  const hasValidMapUrl = Boolean(details.officialMapUrl && details.officialMapUrl.trim() !== '');
  const showMap = !imageError && hasValidMapUrl;

  return (
    <Card className={cn('border-border overflow-hidden', className)}>
      <CardContent className="p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {showMap && (
            <div className="lg:col-span-6 flex items-center justify-center p-2 rounded-xl min-h-[260px] sm:min-h-[320px]">
              <Image
                src={details.officialMapUrl}
                alt={`${details.country} official circuit map`}
                width={600}
                height={400}
                className="w-full h-auto max-h-[340px] object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.08)]"
                priority
                unoptimized
                onError={() => setImageError(true)}
              />
            </div>
          )}

          <div
            className={cn(
              'space-y-6',
              showMap
                ? 'lg:col-span-6 lg:border-l border-border lg:pl-8'
                : 'lg:col-span-12'
            )}
          >
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Circuit Length
              </p>
              <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-foreground mt-1">
                {details.circuitLength}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-2 border-t border-border">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  First Grand Prix
                </p>
                <p className="text-xl sm:text-2xl font-black font-mono text-foreground mt-1">
                  {details.firstGrandPrix}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Number of Laps
                </p>
                <p className="text-xl sm:text-2xl font-black font-mono text-foreground mt-1">
                  {details.numberOfLaps}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-2 border-t border-border">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Fastest lap time
                </p>
                <p className="text-lg sm:text-xl font-black font-mono text-primary mt-1">
                  {details.fastestLap.time}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {details.fastestLap.driver} ({details.fastestLap.year})
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Race Distance
                </p>
                <p className="text-xl sm:text-2xl font-black font-mono text-foreground mt-1">
                  {details.raceDistance}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
