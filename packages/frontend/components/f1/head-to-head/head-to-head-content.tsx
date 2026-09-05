'use client';

import React, { useMemo, useState } from 'react';
import type { SeasonHeadToHeadResponse, TeammatePairBattle } from '@/types/f1';
import { SeasonSelector } from '@/components/f1/season-selector';
import { TeamBattleCard } from './team-battle-card';
import { PreloadedContent } from '@/components/f1/preloaded-content';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { Search } from 'lucide-react';

interface HeadToHeadContentProps {
  data: SeasonHeadToHeadResponse | null;
  season: number;
  allYears: number[];
}

function HeadToHeadGridSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/10 overflow-hidden shadow-xl flex flex-col bg-card animate-pulse h-[360px]"
        >
          <div className="p-5 bg-zinc-800 flex items-center justify-between border-b border-white/5">
            <div className="space-y-2">
              <div className="h-6 w-40 bg-zinc-700 rounded" />
            </div>
            <div className="h-8 w-20 bg-zinc-700/80 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 divide-x divide-white/10 flex-1 bg-zinc-900/50 p-5">
            <div className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-zinc-800 rounded" />
                <div className="h-6 w-28 bg-zinc-800 rounded" />
                <div className="h-8 w-12 bg-zinc-800/40 rounded" />
              </div>
            </div>
            <div className="space-y-3 flex flex-col justify-between pl-5">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-zinc-800 rounded" />
                <div className="h-6 w-28 bg-zinc-800 rounded" />
                <div className="h-8 w-12 bg-zinc-800/40 rounded" />
              </div>
            </div>
          </div>
          <div className="p-4 bg-zinc-950 space-y-2 border-t border-white/5">
            <div className="h-9 bg-zinc-900 rounded-xl" />
            <div className="h-9 bg-zinc-900 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeadToHeadContent({
  data,
  season,
  allYears,
}: HeadToHeadContentProps) {
  const [discipline, setDiscipline] = useState<'all' | 'qualifying' | 'race' | 'points'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Group battles by constructor (so Williams with Albon/Colapinto and Albon/Sargeant are grouped into 1 card)
  const constructorGroups = useMemo(() => {
    if (!data?.teams) return [];

    const map = new Map<string, TeammatePairBattle[]>();
    for (const battle of data.teams) {
      const list = map.get(battle.constructorId) || [];
      list.push(battle);
      map.set(battle.constructorId, list);
    }

    return Array.from(map.values());
  }, [data]);

  // Filter groups based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return constructorGroups;

    const query = searchQuery.toLowerCase().trim();
    return constructorGroups.filter((group) => {
      const teamMatch =
        group[0].constructorName.toLowerCase().includes(query) ||
        group[0].constructorId.toLowerCase().includes(query);

      const driverMatch = group.some(
        (b) =>
          b.driver1.familyName.toLowerCase().includes(query) ||
          b.driver1.givenName.toLowerCase().includes(query) ||
          b.driver1.code.toLowerCase().includes(query) ||
          b.driver2.familyName.toLowerCase().includes(query) ||
          b.driver2.givenName.toLowerCase().includes(query) ||
          b.driver2.code.toLowerCase().includes(query)
      );

      return teamMatch || driverMatch;
    });
  }, [constructorGroups, searchQuery]);

  // Collect all driver photos for preloading
  const allPhotoUrls = useMemo(() => {
    const urls: string[] = [];
    for (const group of constructorGroups) {
      for (const battle of group) {
        urls.push(
          getDriverPhotoUrl(
            battle.driver1.driverId,
            battle.driver1.givenName,
            battle.driver1.familyName,
            String(season),
            battle.constructorId
          ),
          getDriverPhotoUrl(
            battle.driver2.driverId,
            battle.driver2.givenName,
            battle.driver2.familyName,
            String(season),
            battle.constructorId
          )
        );
      }
    }
    return urls;
  }, [constructorGroups, season]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header toolbar matching Teams & Drivers layout */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            {season} Teammate Head-to-Head
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Direct intra-team Formula 1 battles across Qualifying pace deltas, Race finishes, and points contribution for the {season} season.
          </p>
        </div>
        <SeasonSelector currentSeason={season} allYears={allYears} />
      </div>

      {/* Control Bar: Discipline Segmented Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Segmented Discipline Filter */}
        <div className="inline-flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setDiscipline('all')}
            className={[
              'px-3.5 py-1.5 rounded-lg transition-all',
              discipline === 'all'
                ? 'bg-white/10 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white',
            ].join(' ')}
          >
            All Duels
          </button>
          <button
            type="button"
            onClick={() => setDiscipline('qualifying')}
            className={[
              'px-3.5 py-1.5 rounded-lg transition-all',
              discipline === 'qualifying'
                ? 'bg-white/10 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white',
            ].join(' ')}
          >
            Qualifying
          </button>
          <button
            type="button"
            onClick={() => setDiscipline('race')}
            className={[
              'px-3.5 py-1.5 rounded-lg transition-all',
              discipline === 'race'
                ? 'bg-white/10 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white',
            ].join(' ')}
          >
            Races
          </button>
          <button
            type="button"
            onClick={() => setDiscipline('points')}
            className={[
              'px-3.5 py-1.5 rounded-lg transition-all',
              discipline === 'points'
                ? 'bg-white/10 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white',
            ].join(' ')}
          >
            Points
          </button>
        </div>

        {/* Minimalist Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search driver or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors font-sans"
          />
        </div>
      </div>

      {/* Head-to-Head Cards Bento Grid with Image Preloading */}
      {constructorGroups.length > 0 ? (
        <PreloadedContent imageUrls={allPhotoUrls} skeleton={<HeadToHeadGridSkeleton />}>
          {filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredGroups.map((group) => (
                <TeamBattleCard
                  key={group[0].constructorId}
                  battles={group}
                  season={season}
                  discipline={discipline}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground font-mono text-sm border border-zinc-800/80 rounded-2xl bg-zinc-950/40">
              No teammate battles found matching &quot;{searchQuery}&quot;.
            </div>
          )}
        </PreloadedContent>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          No teammate head-to-head battle data available for {season}.
        </div>
      )}
    </div>
  );
}
