'use client';

import React from 'react';
import type { DriverLapSummary } from '@/types/f1';
import { getTeamTheme } from '@/lib/team-colors';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Zap, AlertTriangle, ShieldAlert, Flag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RaceEventsOverlayProps {
  drivers: DriverLapSummary[];
}

export function RaceEventsOverlay({ drivers }: RaceEventsOverlayProps) {
  // Find official fastest lap holder
  const fastestLapDriver = drivers.find((d) => d.fastestLap?.rank === 1);
  const theme = fastestLapDriver ? getTeamTheme(fastestLapDriver.constructorId) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Fastest Lap KPI Card */}
      <Card className="border-zinc-800 bg-zinc-950/70 relative overflow-hidden group">
        {/* Top team accent stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: fastestLapDriver && theme ? theme.primary : '#a855f7' }}
        />

        {/* Large right-aligned feature icon */}
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 transition-all duration-300 group-hover:scale-110 group-hover:opacity-75"
          style={{ color: fastestLapDriver && theme ? theme.primary : '#a855f7' }}
        >
          <Trophy className="size-14 sm:size-16 stroke-[1.25]" />
        </div>

        <CardContent className="p-5 relative z-10">
          <div className="text-muted-foreground mb-2 flex items-center justify-between pr-16">
            <span className="text-xs font-semibold uppercase tracking-wider">Official Fastest Lap</span>
            {fastestLapDriver && (
              <Badge variant="outline" className="font-mono text-[10px] border-zinc-700 bg-zinc-900/60 px-1.5 py-0">
                P1 Speed Award
              </Badge>
            )}
          </div>

          {fastestLapDriver ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
                  {fastestLapDriver.fastestLap?.time ?? '—'}
                </span>
                {fastestLapDriver.fastestLap?.lap && (
                  <span className="text-xs font-mono text-muted-foreground">
                    Lap {fastestLapDriver.fastestLap.lap}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                {theme && (
                  <div
                    className="w-1.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: theme.primary }}
                  />
                )}
                <p className="text-xs font-medium text-muted-foreground truncate">
                  <span className="font-semibold text-foreground">
                    {fastestLapDriver.givenName} {fastestLapDriver.familyName}
                  </span>{' '}
                  ({fastestLapDriver.code}) · {fastestLapDriver.constructorName}
                </p>
              </div>
            </>
          ) : (
            <div className="text-2xl font-black font-mono text-muted-foreground">
              —
            </div>
          )}
        </CardContent>
      </Card>

      {/* Race Control & Telemetry Card */}
      <Card className="border-zinc-800 bg-zinc-950/70 relative overflow-hidden group">
        {/* Top amber accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />

        {/* Large right-aligned feature icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-amber-400 transition-all duration-300 group-hover:scale-110 group-hover:opacity-75">
          <Zap className="size-14 sm:size-16 stroke-[1.25]" />
        </div>

        <CardContent className="p-5 relative z-10">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 pr-16">
            <span className="text-xs font-semibold uppercase tracking-wider">Race Control & Telemetry</span>
            <Badge variant="outline" className="text-[9px] font-mono border-amber-500/30 text-amber-400 bg-amber-500/10 px-1.5 py-0">
              OpenF1 Update
            </Badge>
          </div>

          <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground">
            Live Race Events
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldAlert className="size-3 text-amber-400" /> Safety Car
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="size-3 text-orange-400" /> VSC
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Flag className="size-3 text-red-400" /> Red Flag
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
