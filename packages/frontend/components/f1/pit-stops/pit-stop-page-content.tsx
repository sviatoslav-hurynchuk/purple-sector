'use client';

import React, { useState, useCallback } from 'react';
import type { PitStopEntry, Race, RaceResult, RaceResultEntry } from '@/types/f1';
import { CountryFlag } from '@/components/f1/country-flag';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PitStopStatsCards } from './pit-stop-stats-cards';
import { PitStopChronicle } from './pit-stop-chronicle';
import { PitStopFastest } from './pit-stop-fastest';
import { PitStopDuel } from './pit-stop-duel';
import { ArrowLeft, Trophy, Clock, Swords } from 'lucide-react';
import Link from 'next/link';

interface PitStopPageContentProps {
  race: Race | RaceResult;
  pitStops: PitStopEntry[];
  raceResults?: RaceResultEntry[];
}

export function PitStopPageContent({
  race,
  pitStops,
  raceResults = [],
}: PitStopPageContentProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRacing, setIsRacing] = useState(false);

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
    <div className="space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div>
        <Link
          href={`/calendar/${race.round}?season=${race.season}`}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors mb-3 group"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to {race.raceName}</span>
        </Link>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Pit Stop Strategy
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs font-mono text-muted-foreground">
                Round {race.round} · {race.date}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">
                {race.raceName}
              </h1>
              <CountryFlag countryName={race.Circuit.Location.country} preload />
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <PitStopStatsCards pitStops={pitStops} raceResults={raceResults} />

      {/* Main Tabs Container */}
      <div className="space-y-4">
        <Tabs defaultValue="fastest" className="w-full">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <TabsList>
              <TabsTrigger value="fastest" className="inline-flex items-center gap-2">
                <Trophy className="size-3.5" />
                <span>Fastest Stops</span>
              </TabsTrigger>
              <TabsTrigger value="chronicle" className="inline-flex items-center gap-2">
                <Clock className="size-3.5" />
                <span>Chronicle Log</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="fastest" className="pt-4">
            <PitStopFastest
              pitStops={pitStops}
              raceResults={raceResults}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              isLocked={isRacing}
            />
          </TabsContent>

          <TabsContent value="chronicle" className="pt-4">
            <PitStopChronicle
              pitStops={pitStops}
              raceResults={raceResults}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              isLocked={isRacing}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Interactive Duel Arena */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="size-4 text-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight">
              Head-to-Head Comparison
            </h2>
          </div>
        </div>

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