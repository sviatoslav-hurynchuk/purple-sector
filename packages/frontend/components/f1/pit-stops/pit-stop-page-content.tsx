'use client';

import React, { useState, useCallback } from 'react';
import type { PitStopEntry, Race, RaceResult, RaceResultEntry, RaceSessionData } from '@/types/f1';
import { CountryFlag } from '@/components/f1/country-flag';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PitStopStatsCards } from './pit-stop-stats-cards';
import { PitStopChronicle } from './pit-stop-chronicle';
import { PitStopFastest } from './pit-stop-fastest';
import { PitStopDuel } from './pit-stop-duel';
import { TyreStrategyChart } from '@/components/f1/race/tyre-strategy-chart';
import { WeatherTimeline } from '@/components/f1/race/weather-timeline';
import { ArrowLeft, Trophy, Clock, Disc, CloudRain } from 'lucide-react';
import Link from 'next/link';

interface PitStopPageContentProps {
  race: Race | RaceResult;
  pitStops: PitStopEntry[];
  raceResults?: RaceResultEntry[];
  openF1Data?: RaceSessionData | null;
}

export function PitStopPageContent({
  race,
  pitStops,
  raceResults = [],
  openF1Data,
}: PitStopPageContentProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRacing, setIsRacing] = useState(false);

  const hasStints = Boolean(openF1Data?.stints && openF1Data.stints.length > 0);
  const hasWeather = Boolean(openF1Data?.weather && openF1Data.weather.length > 1);

  const handleToggle = useCallback((key: string) => {
    if (isRacing) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else if (next.size < 4) {
        next.add(key);
      }
      return next;
    });
  }, [isRacing]);

  const handleClear = useCallback(() => {
    if (isRacing) return;
    setSelectedIds(new Set());
  }, [isRacing]);

  return (
    <div className="space-y-6">
      {/* ── Main Cockpit Header ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          {/* Back link / breadcrumb */}
          <Link
            href={`/calendar/${race.round}?season=${race.season}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors mb-2 group"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to {race.raceName}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-red-500">Round {race.round}</span>
          </Link>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white uppercase flex flex-wrap items-baseline gap-3">
            <span>{race.season}</span>
            <span className="text-zinc-400 font-sans font-black tracking-tighter text-2xl sm:text-3xl lg:text-4xl">
              {race.raceName.toUpperCase()}
            </span>
            <CountryFlag
              countryName={race.Circuit.Location.country}
              className="w-7 h-4.5 sm:w-8 sm:h-5 shadow-md rounded-xs ml-1"
              preload
            />
          </h1>

          <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
            <span className="text-red-500 font-bold uppercase">Pit Stop Telemetry &amp; Strategy</span>
            <span className="text-zinc-600">•</span>
            <span>{race.Circuit.circuitName}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-300 font-bold">{race.date}</span>
          </p>
        </div>
      </div>

      {/* Summary KPI Cards (Monolithic 1px Matrix) */}
      <PitStopStatsCards pitStops={pitStops} raceResults={raceResults} />

      {/* Main Tabs Container */}
      <div className="space-y-4">
        <Tabs defaultValue={hasStints ? 'stints' : 'fastest'} className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-red-600" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                Strategy &amp; Telemetry Modules
              </h2>
            </div>

            <TabsList className="inline-flex p-1 rounded-xl bg-zinc-950 border border-white/10 h-auto gap-1 shadow-inner overflow-x-auto max-w-full">
              {hasStints && (
                <TabsTrigger
                  value="stints"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-white/10 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0"
                >
                  <Disc className="size-3.5 text-red-500" />
                  <span>Tyre Stints</span>
                </TabsTrigger>
              )}
              <TabsTrigger
                value="fastest"
                className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-white/10 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0"
              >
                <Trophy className="size-3.5 text-amber-400" />
                <span>Fastest Stops</span>
              </TabsTrigger>
              <TabsTrigger
                value="chronicle"
                className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-white/10 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0"
              >
                <Clock className="size-3.5 text-zinc-300" />
                <span>Chronicle Log</span>
              </TabsTrigger>
              {hasWeather && (
                <TabsTrigger
                  value="weather"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-white/10 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0"
                >
                  <CloudRain className="size-3.5 text-blue-400" />
                  <span>Weather Timeline</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {hasStints && (
            <TabsContent value="stints" className="pt-2">
              <TyreStrategyChart
                stints={openF1Data!.stints}
                totalLaps={raceResults[0]?.laps ? parseInt(raceResults[0].laps, 10) : undefined}
              />
            </TabsContent>
          )}

          <TabsContent value="fastest" className="pt-2">
            <PitStopFastest
              pitStops={pitStops}
              raceResults={raceResults}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              isLocked={isRacing}
            />
          </TabsContent>

          <TabsContent value="chronicle" className="pt-2">
            <PitStopChronicle
              pitStops={pitStops}
              raceResults={raceResults}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              isLocked={isRacing}
            />
          </TabsContent>

          {hasWeather && (
            <TabsContent value="weather" className="pt-2">
              <WeatherTimeline weather={openF1Data!.weather} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Interactive Duel Arena */}
      <div className="space-y-3">

        <PitStopDuel
          pitStops={pitStops}
          raceResults={raceResults}
          selectedIds={selectedIds}
          onClear={handleClear}
          isRacing={isRacing}
          onRacingChange={setIsRacing}
        />
      </div>
    </div>
  );
}