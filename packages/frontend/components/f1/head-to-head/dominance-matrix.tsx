'use client';

import React, { useState, useMemo } from 'react';
import type { TeammatePairBattle } from '@/types/f1';
import { TeamLogo } from '@/components/f1/team-logo';
import { CountryFlag } from '@/components/f1/country-flag';
import { getTeamTheme } from '@/lib/team-colors';
import { Swords, Zap, Trophy, TrendingUp, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DominanceMatrixProps {
  groups: TeammatePairBattle[][];
  selectedConstructorId: string;
  season: string | number;
  onSelectConstructor: (constructorId: string) => void;
  className?: string;
}

export function DominanceMatrix({
  groups,
  selectedConstructorId,
  season,
  onSelectConstructor,
  className = '',
}: DominanceMatrixProps) {
  const [filter, setFilter] = useState<'all' | 'closest' | 'dominant'>('all');
  const [metric, setMetric] = useState<'race' | 'qualifying' | 'points'>('race');

  // Process primary battles with dominance index
  const battleRows = useMemo(() => {
    return groups.map((group) => {
      const primary = group.find((b) => b.isPrimary) || group[0];
      const { constructorId, constructorName, driver1, driver2, stats } = primary;
      const theme = getTeamTheme(constructorId);

      // Race split
      const r1 = stats.race.d1Wins;
      const r2 = stats.race.d2Wins;
      const rTotal = Math.max(1, r1 + r2);
      const r1Pct = Math.round((r1 / rTotal) * 100);
      const r2Pct = 100 - r1Pct;
      const rDeltaPct = Math.abs(r1Pct - r2Pct);

      // Qualy split
      const q1 = stats.qualifying.d1Wins;
      const q2 = stats.qualifying.d2Wins;
      const qTotal = Math.max(1, q1 + q2);
      const q1Pct = Math.round((q1 / qTotal) * 100);
      const q2Pct = 100 - q1Pct;
      const qDeltaPct = Math.abs(q1Pct - q2Pct);

      // Points split
      const p1 = stats.points.d1Points;
      const p2 = stats.points.d2Points;
      const pTotal = Math.max(1, p1 + p2);
      const p1Pct = Math.round((p1 / pTotal) * 100);
      const p2Pct = 100 - p1Pct;
      const pDeltaPct = Math.abs(p1Pct - p2Pct);

      // Delta median
      const deltaMs = stats.qualifying.medianDeltaMs;
      const deltaFormatted =
        deltaMs !== 0 ? `${(Math.abs(deltaMs) / 1000).toFixed(3)}s` : '0.000s';
      const d1Faster = deltaMs < 0;

      // Active metric values
      let active1 = r1;
      let active2 = r2;
      let active1Pct = r1Pct;
      let active2Pct = r2Pct;
      let activeDelta = rDeltaPct;

      if (metric === 'qualifying') {
        active1 = q1;
        active2 = q2;
        active1Pct = q1Pct;
        active2Pct = q2Pct;
        activeDelta = qDeltaPct;
      } else if (metric === 'points') {
        active1 = p1;
        active2 = p2;
        active1Pct = p1Pct;
        active2Pct = p2Pct;
        activeDelta = pDeltaPct;
      }

      return {
        constructorId,
        constructorName,
        theme,
        driver1,
        driver2,
        stats,
        active1,
        active2,
        active1Pct,
        active2Pct,
        activeDelta,
        deltaFormatted,
        d1Faster,
      };
    });
  }, [groups, metric]);

  // Sort according to filter
  const sortedRows = useMemo(() => {
    const list = [...battleRows];
    if (filter === 'closest') {
      return list.sort((a, b) => a.activeDelta - b.activeDelta);
    }
    if (filter === 'dominant') {
      return list.sort((a, b) => b.activeDelta - a.activeDelta);
    }
    return list;
  }, [battleRows, filter]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        {/* Metric Selector */}
        <div className="inline-flex items-center border border-white/10 bg-zinc-900 divide-x divide-white/10 rounded-md overflow-hidden text-xs font-mono">
          <button
            type="button"
            onClick={() => setMetric('race')}
            className={cn(
              'px-3 py-1.5 transition-colors cursor-pointer uppercase tracking-wider font-bold',
              metric === 'race'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            Races
          </button>
          <button
            type="button"
            onClick={() => setMetric('qualifying')}
            className={cn(
              'px-3 py-1.5 transition-colors cursor-pointer uppercase tracking-wider font-bold',
              metric === 'qualifying'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            Qualifying
          </button>
          <button
            type="button"
            onClick={() => setMetric('points')}
            className={cn(
              'px-3 py-1.5 transition-colors cursor-pointer uppercase tracking-wider font-bold',
              metric === 'points'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            Points
          </button>
        </div>

        {/* Ranking Sort Filter */}
        <div className="inline-flex items-center border border-white/10 bg-zinc-900 divide-x divide-white/10 rounded-md overflow-hidden text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1.5 transition-colors cursor-pointer uppercase tracking-wider font-bold',
              filter === 'all'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('closest')}
            className={cn(
              'px-3 py-1.5 transition-colors cursor-pointer uppercase tracking-wider font-bold',
              filter === 'closest'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            Closest Duels
          </button>
          <button
            type="button"
            onClick={() => setFilter('dominant')}
            className={cn(
              'px-3 py-1.5 transition-colors cursor-pointer uppercase tracking-wider font-bold',
              filter === 'dominant'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            Total Dominance
          </button>
        </div>
      </div>

      {/* Dominance Matrix List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {sortedRows.map((row) => {
          const isSelected = row.constructorId === selectedConstructorId;

          return (
            <div
              key={row.constructorId}
              onClick={() => onSelectConstructor(row.constructorId)}
              className={cn(
                'group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer overflow-hidden',
                isSelected
                  ? 'bg-zinc-900/90 border-white/30 shadow-xl'
                  : 'bg-zinc-950/70 border-white/10 hover:border-white/20 hover:bg-zinc-900/50'
              )}
              style={{
                boxShadow: isSelected ? `0 0 25px ${row.theme.primary}20` : undefined,
              }}
            >
              {/* Colored Left Edge Line */}
              <div
                className="absolute left-0 inset-y-0 w-1"
                style={{ backgroundColor: row.theme.primary }}
              />

              {/* Row Header */}
              <div className="flex items-center justify-between gap-3 pb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <TeamLogo constructorId={row.constructorId} season={season} size={22} />
                  <span className="font-black text-xs uppercase tracking-tight text-white truncate">
                    {row.constructorName}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {row.activeDelta <= 15 ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      CLOSEST DUEL
                    </span>
                  ) : row.activeDelta >= 60 ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      DOMINANT
                    </span>
                  ) : null}

                  <ArrowUpRight className="size-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
              </div>

              {/* Duel Bar & Driver Names */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <CountryFlag countryName={row.driver1.nationality} />
                    <span className={cn('font-bold', row.active1 >= row.active2 ? 'text-white' : 'text-zinc-400')}>
                      {row.driver1.code}
                    </span>
                    <span className="text-zinc-400 font-bold">
                      {row.active1} {metric === 'points' ? 'pts' : ''}
                    </span>
                  </div>

                  <span className="text-[10px] text-zinc-400 font-mono">
                    {row.active1Pct}% vs {row.active2Pct}%
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 font-bold">
                      {row.active2} {metric === 'points' ? 'pts' : ''}
                    </span>
                    <span className={cn('font-bold', row.active2 >= row.active1 ? 'text-white' : 'text-zinc-400')}>
                      {row.driver2.code}
                    </span>
                    <CountryFlag countryName={row.driver2.nationality} />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${row.active1Pct}%`,
                      backgroundColor: row.active1 >= row.active2 ? row.theme.primary : '#52525b',
                    }}
                  />
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${row.active2Pct}%`,
                      backgroundColor: row.active2 >= row.active1 ? row.theme.primary : '#52525b',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
