'use client';

import React, { useMemo, useState } from 'react';
import type { SeasonHeadToHeadResponse, TeammatePairBattle } from '@/types/f1';
import { SeasonSelector } from '@/components/f1/season-selector';
import { TeamBattleCard } from './team-battle-card';
import {
  Swords,
  Zap,
  Trophy,
  Percent,
  Search,
  Users,
  Gauge,
  Sparkles,
} from 'lucide-react';

interface HeadToHeadContentProps {
  data: SeasonHeadToHeadResponse | null;
  season: number;
  allYears: number[];
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

  // Season summary stats
  const summaryStats = useMemo(() => {
    if (!data?.teams || data.teams.length === 0) return null;

    const primaryBattles = data.teams.filter((b) => b.isPrimary);
    let totalDeltas = 0;
    let deltaCount = 0;
    let maxQualyDiff = 0;
    let maxQualyWinner = '';
    let closestDelta = 9999;
    let closestPair = '';

    for (const b of primaryBattles) {
      const delta = Math.abs(b.stats.qualifying.medianDeltaMs);
      if (delta > 0) {
        totalDeltas += delta;
        deltaCount++;
        if (delta < closestDelta) {
          closestDelta = delta;
          closestPair = `${b.driver1.code} vs ${b.driver2.code}`;
        }
      }

      const qDiff = Math.abs(b.stats.qualifying.d1Wins - b.stats.qualifying.d2Wins);
      if (qDiff > maxQualyDiff) {
        maxQualyDiff = qDiff;
        maxQualyWinner = `${b.driver1.code} (${b.stats.qualifying.d1Wins}-${b.stats.qualifying.d2Wins})`;
      }
    }

    const avgGapMs = deltaCount > 0 ? Math.round(totalDeltas / deltaCount) : 0;

    return {
      completedRaces: data.completedRaces,
      totalRaces: data.totalRaces,
      teamsCount: constructorGroups.length,
      avgGapMs,
      maxQualyWinner,
      closestPair: closestDelta < 9999 ? `${closestPair} (${closestDelta}ms)` : '—',
    };
  }, [data, constructorGroups]);

  return (
    <div className="space-y-8 pb-16">
      {/* Hero / Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-mono font-bold text-primary uppercase tracking-widest mb-1.5">
            <Swords className="w-4 h-4 text-purple-400" />
            <span>Intra-Team Analytics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Teammate Head-to-Head
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl mt-1.5 leading-relaxed">
            Direct comparison between Formula 1 teammates on identical machinery.
            Analyzed across qualifying deltas, race finishes, and points share.
          </p>
        </div>

        {/* Season Selector */}
        <div className="flex-shrink-0">
          <SeasonSelector currentSeason={season} allYears={allYears} />
        </div>
      </div>

      {/* Grid Summary Stats Bar */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Completed GPs
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {summaryStats.completedRaces}{' '}
              <span className="text-xs text-zinc-500 font-sans font-normal">
                of {summaryStats.totalRaces}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-yellow-400" />
              Grid Avg Qualy Gap
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {(summaryStats.avgGapMs / 1000).toFixed(3)}s
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Dominant Qualy
            </div>
            <div className="text-lg font-bold font-mono text-purple-300 mt-1 truncate">
              {summaryStats.maxQualyWinner || '—'}
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Closest Teammates
            </div>
            <div className="text-lg font-bold font-mono text-emerald-300 mt-1 truncate">
              {summaryStats.closestPair}
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Discipline Tabs & Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-950/80 p-2 rounded-2xl border border-zinc-800/80">
        {/* Discipline Filters */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setDiscipline('all')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              discipline === 'all'
                ? 'bg-white/10 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-purple-400" />
            <span>All Duels</span>
          </button>
          <button
            type="button"
            onClick={() => setDiscipline('qualifying')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              discipline === 'qualifying'
                ? 'bg-white/10 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Qualifying</span>
          </button>
          <button
            type="button"
            onClick={() => setDiscipline('race')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              discipline === 'race'
                ? 'bg-white/10 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Race Head-to-Head</span>
          </button>
          <button
            type="button"
            onClick={() => setDiscipline('points')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              discipline === 'points'
                ? 'bg-white/10 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
            <span>Points Share</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter driver or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-sans"
          />
        </div>
      </div>

      {/* Head-to-Head Cards Bento Grid */}
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-950/40 text-zinc-400 font-mono text-sm">
          No teammate battles found matching &quot;{searchQuery}&quot;.
        </div>
      )}
    </div>
  );
}
