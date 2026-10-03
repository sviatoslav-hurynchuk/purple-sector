'use client';

import React from 'react';
import type { PitStopEntry, RaceResultEntry } from '@/types/f1';
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
    <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative">
      {/* Ambient Livery Glow for Fastest Team */}
      {fastest && (
        <div
          className="absolute top-0 inset-x-0 h-36 opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: fastestTheme.primary }}
        />
      )}

      {/* Cockpit Sub-Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 sm:px-7 py-2.5 border-b border-white/10 bg-zinc-900/30 relative z-10">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-red-600 animate-pulse" />
          <span className="font-mono text-xs font-black uppercase tracking-widest text-zinc-200">
            Pit Lane Telemetry Cluster
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          Official Grand Prix Stint Records
        </span>
      </div>

      {/* Contiguous 1px Grid Matrix */}
      <div className="border-t border-l border-white/10 bg-zinc-950/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
        {/* Cell 1: Fastest Pit Stop */}
        <div className="border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 p-4 sm:p-5 transition-colors flex flex-col justify-between gap-2 group relative overflow-hidden">
          {/* Watermark icon */}
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-15 transition-all duration-300 group-hover:scale-110 group-hover:opacity-25"
            style={{ color: fastest ? fastestTheme.primary : '#fbbf24' }}
          >
            <Trophy className="size-16 stroke-[1.25]" />
          </div>

          <div className="space-y-1 relative z-10">
            <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
              Fastest Pit Stop
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
                {fastest ? `${fastest.durationNum.toFixed(3)}s` : '—'}
              </span>
              {fastest && (
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                  Lap {fastest.lap}
                </span>
              )}
            </div>
          </div>

          {fastest ? (
            <div className="flex items-center gap-2 relative z-10 pt-1 border-t border-white/5">
              <div
                className="w-1.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: fastestTheme.primary }}
              />
              <p className="text-xs font-mono text-zinc-300 truncate">
                <span className="font-bold text-white uppercase">{fastestDriverName}</span> · {fastestTeamName}
              </p>
            </div>
          ) : (
            <span className="text-[11px] font-mono text-zinc-500">No qualifying stops</span>
          )}
        </div>

        {/* Cell 2: Total Stops */}
        <div className="border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 p-4 sm:p-5 transition-colors flex flex-col justify-between gap-2 group relative overflow-hidden">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-15 text-red-500 transition-all duration-300 group-hover:scale-110 group-hover:opacity-25">
            <Gauge className="size-16 stroke-[1.25]" />
          </div>

          <div className="space-y-1 relative z-10">
            <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
              Total Pit Stops
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
              {totalStops}{' '}
              <span className="text-xs font-mono font-semibold text-zinc-400">Stints</span>
            </p>
          </div>

          <div className="relative z-10 pt-1 border-t border-white/5">
            <span className="text-[11px] font-mono text-zinc-400">
              Across {uniqueDrivers} drivers during Grand Prix
            </span>
          </div>
        </div>

        {/* Cell 3: Average Pit Lane Duration */}
        <div className="border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 p-4 sm:p-5 transition-colors flex flex-col justify-between gap-2 group relative overflow-hidden">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-15 text-cyan-400 transition-all duration-300 group-hover:scale-110 group-hover:opacity-25">
            <Timer className="size-16 stroke-[1.25]" />
          </div>

          <div className="space-y-1 relative z-10">
            <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
              Average Lane Time
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
              {avgDuration > 0 ? `${avgDuration.toFixed(2)}s` : '—'}
            </p>
          </div>

          <div className="relative z-10 pt-1 border-t border-white/5">
            <span className="text-[11px] font-mono text-zinc-400">
              Pit in to pit out delta (&lt;60s stops)
            </span>
          </div>
        </div>

        {/* Cell 4: Drivers Serviced */}
        <div className="border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 p-4 sm:p-5 transition-colors flex flex-col justify-between gap-2 group relative overflow-hidden">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-15 text-emerald-400 transition-all duration-300 group-hover:scale-110 group-hover:opacity-25">
            <Users className="size-16 stroke-[1.25]" />
          </div>

          <div className="space-y-1 relative z-10">
            <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
              Drivers Serviced
            </span>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
              {uniqueDrivers}{' '}
              <span className="text-xs font-mono font-semibold text-zinc-400">
                / {raceResults.length || 20}
              </span>
            </p>
          </div>

          <div className="relative z-10 pt-1 border-t border-white/5">
            <span className="text-[11px] font-mono text-zinc-400">
              Avg {(totalStops / (uniqueDrivers || 1)).toFixed(1)} stops per active driver
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}