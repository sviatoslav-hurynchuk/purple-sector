'use client';

import React from 'react';
import type { TeammatePairBattle } from '@/types/f1';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TeamLogo } from '@/components/f1/team-logo';
import { DriverImage } from '@/components/f1/driver-image';
import { CountryFlag } from '@/components/f1/country-flag';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { getTeamTheme } from '@/lib/team-colors';
import { RadarChart } from './radar-chart';
import { RoundTimeline } from './round-timeline';
import {
  Trophy,
  Zap,
  Clock,
  X,
  TrendingUp,
} from 'lucide-react';

interface BattleModalProps {
  battle: TeammatePairBattle | null;
  season: string | number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BattleModal({
  battle,
  season,
  open,
  onOpenChange,
}: BattleModalProps) {
  if (!battle) return null;

  const { driver1, driver2, stats, rounds, constructorId, constructorName } =
    battle;
  const teamTheme = getTeamTheme(constructorId);
  const primaryColor = teamTheme.primary;

  const seasonStr = String(season);
  const d1Photo = getDriverPhotoUrl(
    driver1.driverId,
    driver1.givenName,
    driver1.familyName,
    seasonStr,
    constructorId
  );
  const d2Photo = getDriverPhotoUrl(
    driver2.driverId,
    driver2.givenName,
    driver2.familyName,
    seasonStr,
    constructorId
  );

  const deltaFormatted =
    stats.qualifying.medianDeltaMs !== 0
      ? `${(Math.abs(stats.qualifying.medianDeltaMs) / 1000).toFixed(3)}s`
      : '0.000s';

  const d1Faster = stats.qualifying.medianDeltaMs < 0;

  const d1PtsShare = Number(stats.points.d1SharePercent.toFixed(1));
  const d2PtsShare = Number((100 - d1PtsShare).toFixed(1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPanel className="max-w-4xl max-h-[92vh] border-zinc-800 bg-zinc-950 p-0 overflow-hidden shadow-2xl">
        {/* Modal Top Header with Team Banner */}
        <div className="relative border-b border-zinc-800 bg-gradient-to-r from-zinc-900/90 via-zinc-950 to-zinc-900/90 px-6 py-5">
          {/* Accent glow on top edge */}
          <div
            className="absolute top-0 inset-x-0 h-1"
            style={{ backgroundColor: primaryColor }}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo constructorId={constructorId} season={season} size={42} />
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{constructorName}</span>
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/50">
                    {season} Season
                  </span>
                </DialogTitle>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Teammate Head-to-Head Deep Dive • {rounds.length} Grands Prix
                </p>
              </div>
            </div>

            <DialogClose className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors">
              <X className="size-5" />
            </DialogClose>
          </div>

          {/* Driver Cutouts Face-off Strip */}
          <div className="mt-5 grid grid-cols-11 items-center gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80">
            {/* Driver 1 Info & Portrait */}
            <div className="col-span-4 flex items-center gap-3.5">
              <div className="relative size-16 sm:size-20 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 shadow-md">
                <DriverImage
                  src={d1Photo}
                  alt={`${driver1.givenName} ${driver1.familyName}`}
                  fill
                  sizes="80px"
                  className="object-cover object-top scale-105"
                />
                <div
                  className="absolute bottom-0 inset-x-0 h-1"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
              <div className="overflow-hidden min-w-0">
                <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                  <CountryFlag countryName={driver1.nationality} />
                  <span>#{driver1.permanentNumber || driver1.code}</span>
                </div>
                <div className="font-black text-white text-base sm:text-lg uppercase tracking-tight truncate mt-0.5">
                  {driver1.familyName}
                </div>
                <div
                  className="inline-block text-[11px] font-mono font-bold px-1.5 py-0.2 rounded mt-0.5"
                  style={{
                    backgroundColor: `${primaryColor}25`,
                    color: primaryColor,
                  }}
                >
                  {driver1.code}
                </div>
              </div>
            </div>

            {/* Middle Quick Score Badges */}
            <div className="col-span-3 flex flex-col items-center justify-center gap-1.5 text-center font-mono">
              <div className="flex items-center gap-2 text-xs bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-zinc-800 w-full justify-between">
                <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Qualy</span>
                <span className="font-black text-white">{stats.qualifying.d1Wins} - {stats.qualifying.d2Wins}</span>
              </div>
              <div className="flex items-center gap-2 text-xs bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-zinc-800 w-full justify-between">
                <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Races</span>
                <span className="font-black text-amber-400">{stats.race.d1Wins} - {stats.race.d2Wins}</span>
              </div>
              <div className="flex items-center gap-2 text-xs bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-zinc-800 w-full justify-between">
                <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Points</span>
                <span className="font-black text-emerald-400">{stats.points.d1Points} - {stats.points.d2Points}</span>
              </div>
            </div>

            {/* Driver 2 Info & Portrait */}
            <div className="col-span-4 flex items-center justify-end gap-3.5 text-right">
              <div className="overflow-hidden min-w-0">
                <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-end gap-1.5">
                  <span>#{driver2.permanentNumber || driver2.code}</span>
                  <CountryFlag countryName={driver2.nationality} />
                </div>
                <div className="font-black text-white text-base sm:text-lg uppercase tracking-tight truncate mt-0.5">
                  {driver2.familyName}
                </div>
                <div className="inline-block text-[11px] font-mono font-bold px-1.5 py-0.2 rounded mt-0.5 bg-zinc-800 text-zinc-300">
                  {driver2.code}
                </div>
              </div>
              <div className="relative size-16 sm:size-20 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 shadow-md">
                <DriverImage
                  src={d2Photo}
                  alt={`${driver2.givenName} ${driver2.familyName}`}
                  fill
                  sizes="80px"
                  className="object-cover object-top scale-105"
                />
                <div
                  className="absolute bottom-0 inset-x-0 h-1 bg-zinc-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body with Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-220px)] space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-4 bg-zinc-900 border border-zinc-800 p-1 mb-6 rounded-xl">
              <TabsTrigger value="overview" className="text-xs font-medium">
                Overview &amp; Radar
              </TabsTrigger>
              <TabsTrigger value="qualifying" className="text-xs font-medium">
                Qualifying Battle
              </TabsTrigger>
              <TabsTrigger value="race" className="text-xs font-medium">
                Race &amp; Points
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs font-medium">
                GP Breakdown ({rounds.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* 6-Axis Radar Spider Chart */}
                <div className="md:col-span-6 flex flex-col items-center bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/80">
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Performance Profile Radar
                  </h4>
                  <RadarChart
                    stats={stats}
                    driver1={driver1}
                    driver2={driver2}
                    constructorId={constructorId}
                    size={320}
                  />
                  <p className="text-[11px] text-zinc-500 text-center font-mono mt-2">
                    Normalized 6-axis head-to-head comparison
                  </p>
                </div>

                {/* Key Metric Tiles */}
                <div className="md:col-span-6 flex flex-col gap-3">
                  {/* Qualifying Advantage Tile */}
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-yellow-500/10 text-yellow-400">
                        <Zap className="size-5" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400 font-medium">
                          Median Qualy Delta
                        </div>
                        <div className="text-lg font-bold font-mono text-white mt-0.5">
                          {d1Faster ? (
                            <span style={{ color: primaryColor }}>
                              {driver1.code} -{deltaFormatted}
                            </span>
                          ) : stats.qualifying.medianDeltaMs > 0 ? (
                            <span className="text-slate-300">
                              {driver2.code} -{deltaFormatted}
                            </span>
                          ) : (
                            <span>Even (0.000s)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs text-zinc-400">
                      <div>Poles: {stats.qualifying.d1Poles} vs {stats.qualifying.d2Poles}</div>
                      <div className="text-[11px] text-zinc-500">
                        Mean: {(Math.abs(stats.qualifying.meanDeltaMs) / 1000).toFixed(3)}s
                      </div>
                    </div>
                  </div>

                  {/* Race Advantage Tile */}
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
                        <Trophy className="size-5" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400 font-medium">
                          Race Win Head-to-Head
                        </div>
                        <div className="text-lg font-bold font-mono text-white mt-0.5">
                          {stats.race.d1Wins > stats.race.d2Wins ? (
                            <span style={{ color: primaryColor }}>
                              {driver1.code} +{stats.race.d1Wins - stats.race.d2Wins}
                            </span>
                          ) : stats.race.d2Wins > stats.race.d1Wins ? (
                            <span className="text-slate-300">
                              {driver2.code} +{stats.race.d2Wins - stats.race.d1Wins}
                            </span>
                          ) : (
                            <span>Tied ({stats.race.d1Wins} each)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs text-zinc-400">
                      <div>GP Wins: {stats.wins.d1} vs {stats.wins.d2}</div>
                      <div className="text-[11px] text-zinc-500">
                        Podiums: {stats.podiums.d1} vs {stats.podiums.d2}
                      </div>
                    </div>
                  </div>

                  {/* Points Share Tile */}
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <TrendingUp className="size-5" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400 font-medium">
                          Constructor Points Share
                        </div>
                        <div className="text-lg font-bold font-mono text-white mt-0.5">
                          {d1PtsShare}% vs {d2PtsShare}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs text-zinc-400">
                      <div>{stats.points.d1Points} vs {stats.points.d2Points} pts</div>
                      <div className="text-[11px] text-zinc-500">
                        Total: {stats.points.total} pts
                      </div>
                    </div>
                  </div>

                  {/* Quick Discipline Recap Row */}
                  <div className="grid grid-cols-2 gap-3 font-mono text-center">
                    <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                      <div className="text-[10px] text-zinc-500 uppercase">Best Finish</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        P{stats.bestFinish.d1 || '—'} vs P{stats.bestFinish.d2 || '—'}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                      <div className="text-[10px] text-zinc-500 uppercase">Fastest Laps</div>
                      <div className="text-base font-bold text-purple-400 mt-0.5">
                        {stats.fastestLaps.d1} vs {stats.fastestLaps.d2}
                      </div>
                    </div>
                  </div>

                  {/* Both Finished Ratio Tile */}
                  <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">Races Both Classified:</span>
                    <span className="font-bold text-white">
                      {stats.race.bothFinishedCount} of {rounds.length} Grands Prix
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: QUALIFYING */}
            <TabsContent value="qualifying" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center">
                  <div className="text-xs text-zinc-400">Qualifying Duel</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {stats.qualifying.d1Wins} - {stats.qualifying.d2Wins}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {stats.qualifying.total} sessions compared
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center">
                  <div className="text-xs text-zinc-400">Pole Positions</div>
                  <div className="text-2xl font-bold text-yellow-400 mt-1">
                    {stats.qualifying.d1Poles} - {stats.qualifying.d2Poles}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Season pole awards
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center">
                  <div className="text-xs text-zinc-400">Best Grid Position</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    P{stats.bestGrid.d1 || '—'} vs P{stats.bestGrid.d2 || '—'}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Highest starting position
                  </div>
                </div>
              </div>

              {/* Lap Delta Narrative */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-start gap-3">
                <Clock className="size-5 text-yellow-400 shrink-0 mt-0.5" />
                <div className="text-xs font-sans text-zinc-300 leading-relaxed">
                  <p className="font-semibold text-white">
                    Qualifying Pace Analysis
                  </p>
                  <p className="mt-1 text-zinc-400">
                    Calculated exclusively from the latest session in which both
                    drivers set a timed lap (Q3, Q2, or Q1). The median lap time
                    delta is{' '}
                    <strong className="text-white">
                      {d1Faster ? `${driver1.code} faster by ${deltaFormatted}` : `${driver2.code} faster by ${deltaFormatted}`}
                    </strong>{' '}
                    with a mean gap of{' '}
                    <span className="font-mono text-white">
                      {(Math.abs(stats.qualifying.meanDeltaMs) / 1000).toFixed(3)}s
                    </span>
                    .
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: RACE & POINTS */}
            <TabsContent value="race" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center">
                  <div className="text-xs text-zinc-400">Race Head-to-Head</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">
                    {stats.race.d1Wins} - {stats.race.d2Wins}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {stats.race.totalRaces} shared starts
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center">
                  <div className="text-xs text-zinc-400">Points Scored</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {stats.points.d1Points} - {stats.points.d2Points}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {stats.points.total} team points total
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center">
                  <div className="text-xs text-zinc-400">Podiums &amp; Wins</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {stats.podiums.d1 + stats.wins.d1} - {stats.podiums.d2 + stats.wins.d2}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {stats.wins.d1} vs {stats.wins.d2} victories
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center">
                  <div className="text-xs text-zinc-400">Best Finish</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    P{stats.bestFinish.d1 || '—'} vs P{stats.bestFinish.d2 || '—'}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Highest race result
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: TIMELINE */}
            <TabsContent value="timeline" className="space-y-4">
              <RoundTimeline
                rounds={rounds}
                driver1={driver1}
                driver2={driver2}
                constructorId={constructorId}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogPanel>
    </Dialog>
  );
}
