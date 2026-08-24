'use client';

import React from 'react';
import type { PitStopEntry, RaceResultEntry } from '@/types/f1';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Gauge, Timer, Users } from 'lucide-react';
import { getTeamTheme } from '@/lib/team-colors';
import { parseDurationToSeconds } from './pit-stop-chronicle';

interface PitStopStatsCardsProps {
  pitStops: PitStopEntry[];
  raceResults: RaceResultEntry[];
}

export function PitStopStatsCards({ pitStops, raceResults }: PitStopStatsCardsProps) {
  const totalStops = pitStops.length;
  const uniqueDrivers = new Set(pitStops.map((s) => s.driverId)).size;

  const validStops = pitStops
    .map((s) => ({ ...s, durationNum: parseDurationToSeconds(s.duration) }))
    .filter((s) => !isNaN(s.durationNum) && s.durationNum > 0);

  const nonIncidentStops = validStops.filter((s) => s.durationNum < 60);

  const fastest = nonIncidentStops.length > 0
    ? [...nonIncidentStops].sort((a, b) => a.durationNum - b.durationNum)[0]
    : null;

  const avgDuration = nonIncidentStops.length > 0
    ? nonIncidentStops.reduce((acc, s) => acc + s.durationNum, 0) / nonIncidentStops.length
    : 0;

  const fastestDriverResult = fastest
    ? raceResults.find((r) => r.Driver.driverId === fastest.driverId)
    : null;

  const fastestDriverName = fastestDriverResult
    ? `${fastestDriverResult.Driver.givenName} ${fastestDriverResult.Driver.familyName}`
    : fastest?.driverId?.replace(/_/g, ' ') ?? '—';

  const fastestTeamName = fastestDriverResult?.Constructor.name ?? '—';
  const fastestTheme = getTeamTheme(fastestDriverResult?.Constructor.constructorId);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Fastest Pit Stop */}
      <Card className="border-zinc-800 bg-zinc-950/70 relative overflow-hidden group">
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: fastest ? fastestTheme.primary : 'var(--primary)' }}
        />
        {/* Large right-aligned feature icon */}
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 transition-all duration-300 group-hover:scale-110 group-hover:opacity-75"
          style={{ color: fastest ? fastestTheme.primary : '#fbbf24' }}
        >
          <Trophy className="size-14 sm:size-16 stroke-[1.25]" />
        </div>

        <CardContent className="p-5 relative z-10">
          <div className="text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fastest Pit Stop</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
              {fastest ? `${fastest.durationNum.toFixed(3)}s` : '—'}
            </span>
            {fastest && (
              <span className="text-xs font-mono text-muted-foreground">Lap {fastest.lap}</span>
            )}
          </div>
          {fastest && (
            <div className="flex items-center gap-2 mt-2">
              <div
                className="w-1.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: fastestTheme.primary }}
              />
              <p className="text-xs font-medium text-muted-foreground truncate">
                <span className="font-semibold text-foreground">{fastestDriverName}</span> · {fastestTeamName}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Stops */}
      <Card className="border-zinc-800 bg-zinc-950/70 relative overflow-hidden group">
        {/* Large right-aligned feature icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-primary transition-all duration-300 group-hover:scale-110 group-hover:opacity-75">
          <Gauge className="size-14 sm:size-16 stroke-[1.25]" />
        </div>

        <CardContent className="p-5 relative z-10">
          <div className="text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pit Stops</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
            {totalStops}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Across {uniqueDrivers} drivers during Grand Prix
          </p>
        </CardContent>
      </Card>

      {/* Average Pit Duration */}
      <Card className="border-zinc-800 bg-zinc-950/70 relative overflow-hidden group">
        {/* Large right-aligned feature icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-blue-400 transition-all duration-300 group-hover:scale-110 group-hover:opacity-75">
          <Timer className="size-14 sm:size-16 stroke-[1.25]" />
        </div>

        <CardContent className="p-5 relative z-10">
          <div className="text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Lane Time</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
            {avgDuration > 0 ? `${avgDuration.toFixed(2)}s` : '—'}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Excluding stationary incident delays
          </p>
        </CardContent>
      </Card>

      {/* Active Drivers */}
      <Card className="border-zinc-800 bg-zinc-950/70 relative overflow-hidden group">
        {/* Large right-aligned feature icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-emerald-400 transition-all duration-300 group-hover:scale-110 group-hover:opacity-75">
          <Users className="size-14 sm:size-16 stroke-[1.25]" />
        </div>

        <CardContent className="p-5 relative z-10">
          <div className="text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Drivers Serviced</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
            {uniqueDrivers}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Avg {(totalStops / (uniqueDrivers || 1)).toFixed(1)} stops per active driver
          </p>
        </CardContent>
      </Card>
    </div>
  );
}