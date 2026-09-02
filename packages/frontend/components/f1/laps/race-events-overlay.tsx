'use client';

import React from 'react';
import type { DriverLapSummary, RaceEvent } from '@/types/f1';
import { getTeamTheme } from '@/lib/team-colors';
import { isDnfStatus } from '@/lib/f1-status';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, AlertTriangle, ShieldAlert, Flag, CheckCircle2, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RaceEventsOverlayProps {
  drivers: DriverLapSummary[];
  raceEvents?: RaceEvent[];
  currentLap?: number;
  totalLaps?: number;
}

export function RaceEventsOverlay({
  drivers,
  raceEvents = [],
  currentLap,
  totalLaps = 1,
}: RaceEventsOverlayProps) {
  // Find official fastest lap holder
  const fastestLapDriver = drivers.find((d) => d.fastestLap?.rank === 1);
  const theme = fastestLapDriver ? getTeamTheme(fastestLapDriver.constructorId) : null;

  // Find race winner & classification summary for pre-2023 or events-free races
  const winner = drivers.find((d) => d.finishPosition === 1);
  const winnerTheme = winner ? getTeamTheme(winner.constructorId) : null;
  const classifiedCount = drivers.filter((d) => !isDnfStatus(d.status, d.positionText)).length;
  const dnfCount = drivers.filter((d) => isDnfStatus(d.status, d.positionText)).length;

  // Normalize events to guarantee lap resolution
  const effectiveEvents = React.useMemo(() => {
    return raceEvents.map((e) => {
      let lap = e.lap;
      if (!lap && e.message) {
        const match = e.message.match(/(?:LAP|L)\s*(\d+)/i) ?? e.message.match(/ON\s+LAP\s*(\d+)/i);
        if (match) lap = parseInt(match[1], 10);
      }
      return { ...e, lap };
    });
  }, [raceEvents]);

  // Aggregate race events totals
  const scCount = effectiveEvents.filter((e) => e.type === 'safety_car').length;
  const vscCount = effectiveEvents.filter((e) => e.type === 'vsc').length;
  const redFlagCount = effectiveEvents.filter((e) => e.type === 'red_flag').length;
  const hasEventsData = effectiveEvents.length > 0;

  // Active event state at currentLap (for live replay / scrub tracking)
  const activeEventsAtLap = currentLap
    ? effectiveEvents.filter((e) => {
        if (!e.lap) return false;
        const start = e.lap;
        const end = e.endLap && e.endLap >= e.lap ? e.endLap : e.lap + 2;
        return currentLap >= start && currentLap <= end;
      })
    : [];

  const activeSC = activeEventsAtLap.find((e) => e.type === 'safety_car');
  const activeVSC = activeEventsAtLap.find((e) => e.type === 'vsc');
  const activeRedFlag = activeEventsAtLap.find((e) => e.type === 'red_flag');

  const hasActiveIncident = Boolean(activeSC || activeVSC || activeRedFlag);

  // Is fastest lap already set at this replay lap?
  const isFastestLapSetYet = Boolean(
    fastestLapDriver?.fastestLap && currentLap !== 0 && (!currentLap || currentLap >= fastestLapDriver.fastestLap.lap)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Fastest Lap KPI Card */}
      <Card className="border-zinc-800 bg-zinc-950/70 relative overflow-hidden group">
        {/* Top team accent stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-300"
          style={{ backgroundColor: isFastestLapSetYet && fastestLapDriver && theme ? theme.primary : '#71717a' }}
        />

        {/* Large right-aligned feature icon */}
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 transition-all duration-300 group-hover:scale-110 group-hover:opacity-75"
          style={{ color: isFastestLapSetYet && fastestLapDriver && theme ? theme.primary : '#71717a' }}
        >
          <Trophy className="size-14 sm:size-16 stroke-[1.25]" />
        </div>

        <CardContent className="p-5 relative z-10">
          <div className="text-muted-foreground mb-2 flex items-center justify-between pr-16">
            <span className="text-xs font-semibold uppercase tracking-wider">Official Fastest Lap</span>
          </div>

          {fastestLapDriver ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
                  {fastestLapDriver.fastestLap?.time ?? '—'}
                </span>
                {fastestLapDriver.fastestLap?.lap && (
                  <span
                    className={cn(
                      'text-xs font-mono font-semibold px-2 py-0.5 rounded-md border',
                      isFastestLapSetYet
                        ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-500'
                    )}
                  >
                    {isFastestLapSetYet ? `Lap ${fastestLapDriver.fastestLap.lap}` : `Set on Lap ${fastestLapDriver.fastestLap.lap}`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                {theme && (
                  <div
                    className="w-1.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: isFastestLapSetYet ? theme.primary : '#52525b' }}
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
            <div className="text-2xl font-black font-mono text-muted-foreground">—</div>
          )}
        </CardContent>
      </Card>

      {/* Dynamic Second Card: FIA Race Control (if OpenF1 available) or Grand Prix Winner (if pre-2023) */}
      {hasEventsData ? (
        <Card
          className={cn(
            'border-zinc-800 bg-zinc-950/70 relative overflow-hidden group transition-colors duration-300',
            activeRedFlag
              ? 'border-red-500/40 bg-red-950/20'
              : activeSC
              ? 'border-amber-500/40 bg-amber-950/20'
              : activeVSC
              ? 'border-orange-500/40 bg-orange-950/20'
              : ''
          )}
        >
          {/* Top accent stripe */}
          <div
            className={cn(
              'absolute top-0 left-0 right-0 h-0.5 transition-colors duration-300',
              activeRedFlag
                ? 'bg-red-500 animate-pulse'
                : activeSC
                ? 'bg-amber-400 animate-pulse'
                : activeVSC
                ? 'bg-orange-400 animate-pulse'
                : 'bg-emerald-500'
            )}
          />

          {/* Large right-aligned feature icon */}
          <div
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 transition-all duration-300 group-hover:scale-110 group-hover:opacity-75',
              activeRedFlag
                ? 'text-red-400'
                : activeSC
                ? 'text-amber-400'
                : activeVSC
                ? 'text-orange-400'
                : 'text-emerald-400'
            )}
          >
            {activeRedFlag ? (
              <Flag className="size-14 sm:size-16 stroke-[1.25]" />
            ) : activeSC ? (
              <ShieldAlert className="size-14 sm:size-16 stroke-[1.25]" />
            ) : activeVSC ? (
              <AlertTriangle className="size-14 sm:size-16 stroke-[1.25]" />
            ) : (
              <CheckCircle2 className="size-14 sm:size-16 stroke-[1.25]" />
            )}
          </div>

          <CardContent className="p-5 relative z-10">
            <div className="text-muted-foreground mb-2 flex items-center justify-between gap-2 pr-16">
              <span className="text-xs font-semibold uppercase tracking-wider">FIA Race Control</span>
              <Badge
                variant="outline"
                className={cn(
                  'text-[9px] font-mono px-1.5 py-0',
                  activeRedFlag
                    ? 'border-red-500/40 text-red-300 bg-red-500/20 animate-pulse'
                    : activeSC
                    ? 'border-amber-500/40 text-amber-300 bg-amber-500/20 animate-pulse'
                    : activeVSC
                    ? 'border-orange-500/40 text-orange-300 bg-orange-500/20 animate-pulse'
                    : currentLap === 0
                    ? 'border-zinc-700 text-zinc-300 bg-zinc-800/60'
                    : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                )}
              >
                {currentLap === 0 ? 'Starting Grid' : currentLap ? `Replay L${currentLap}/${totalLaps}` : 'FIA Session Feed'}
              </Badge>
            </div>

            {/* Dynamic Title based on current replay lap */}
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground flex items-center gap-2 truncate">
              {activeRedFlag ? (
                <span className="text-red-400 flex items-center gap-2">
                  <Flag className="size-5 text-red-500 fill-red-500/20 shrink-0" />
                  <span>RED FLAG · LAP {activeRedFlag.lap}</span>
                </span>
              ) : activeSC ? (
                <span className="text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="size-5 text-amber-400 shrink-0" />
                  <span>SAFETY CAR · L{activeSC.lap}{activeSC.endLap ? `–${activeSC.endLap}` : ''}</span>
                </span>
              ) : activeVSC ? (
                <span className="text-orange-400 flex items-center gap-2">
                  <AlertTriangle className="size-5 text-orange-400 shrink-0" />
                  <span>VSC · LAP {activeVSC.lap}</span>
                </span>
              ) : currentLap === 0 ? (
                <span className="text-zinc-300 flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-zinc-400 shrink-0" />
                  <span>STARTING GRID · PRE-RACE</span>
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                  <span>TRACK CLEAR · GREEN</span>
                </span>
              )}
            </div>

            {/* Subtitle / summary breakdown */}
            <div className="flex items-center gap-2.5 mt-2 text-xs text-muted-foreground flex-wrap font-mono">
              {currentLap === 0 ? (
                <span className="text-zinc-400 font-semibold">
                  Grid formation complete · Ready for lights out
                </span>
              ) : hasActiveIncident ? (
                <span className="text-zinc-300 font-semibold truncate max-w-[280px]">
                  {activeRedFlag?.message || activeSC?.message || activeVSC?.message}
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-1 font-semibold text-zinc-300">
                    <ShieldAlert className="size-3 text-amber-400" />
                    <span>{scCount} Safety Car</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-semibold text-zinc-300">
                    <AlertTriangle className="size-3 text-orange-400" />
                    <span>{vscCount} VSC</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-semibold text-zinc-300">
                    <Flag className="size-3 text-red-400" />
                    <span>{redFlagCount} Red Flag</span>
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Grand Prix Winner Card (Historical / pre-2023 races) */
        <Card className="border-zinc-800 bg-zinc-950/70 relative overflow-hidden group">
          {/* Top team accent stripe */}
          <div
            className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-300"
            style={{ backgroundColor: winnerTheme ? winnerTheme.primary : '#eab308' }}
          />

          {/* Large right-aligned feature icon */}
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 transition-all duration-300 group-hover:scale-110 group-hover:opacity-75"
            style={{ color: winnerTheme ? winnerTheme.primary : '#eab308' }}
          >
            <Award className="size-14 sm:size-16 stroke-[1.25]" />
          </div>

          <CardContent className="p-5 relative z-10">
            <div className="text-muted-foreground mb-2 flex items-center justify-between pr-16">
              <span className="text-xs font-semibold uppercase tracking-wider">Grand Prix Winner</span>
            </div>

            {winner ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground truncate">
                    {winner.givenName} {winner.familyName}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {winnerTheme && (
                    <div
                      className="w-1.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: winnerTheme.primary }}
                    />
                  )}
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    <span className="font-semibold text-foreground">{winner.constructorName}</span>
                    {winner.code && ` (${winner.code})`}
                    {winner.gridPosition > 0 && ` · Started P${winner.gridPosition}`}
                    {` · ${classifiedCount} Classified (${dnfCount} DNF)`}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-2xl font-black font-mono text-muted-foreground">—</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
