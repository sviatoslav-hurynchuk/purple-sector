'use client';

import React from 'react';
import type { DriverLapSummary } from '@/types/f1';
import { getTeamTheme } from '@/lib/team-colors';
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
      {/* Fastest Lap Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Trophy className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Official Fastest Lap
            </div>
            {fastestLapDriver ? (
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-base font-bold text-foreground">
                  {fastestLapDriver.givenName} {fastestLapDriver.familyName}
                </span>
                <span className="text-xs font-mono font-bold text-purple-400">
                  {fastestLapDriver.fastestLap?.time}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  (Lap {fastestLapDriver.fastestLap?.lap})
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </div>

        {fastestLapDriver && theme && (
          <Badge
            variant="outline"
            className="font-mono text-xs border-zinc-700"
            style={{ color: theme.primary }}
          >
            {fastestLapDriver.code}
          </Badge>
        )}
      </div>

      {/* Race Control & Telemetry Placeholder / Mock */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 flex items-center justify-between shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Race Control Messages
              </span>
              <Badge variant="outline" className="text-[9px] font-mono border-amber-500/30 text-amber-400 px-1.5 py-0">
                Coming in OpenF1 update
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
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
          </div>
        </div>
      </div>
    </div>
  );
}
