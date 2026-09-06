'use client';

import React, { useRef } from 'react';
import type { TeammatePairBattle } from '@/types/f1';
import { TeamLogo } from '@/components/f1/team-logo';
import { getTeamTheme } from '@/lib/team-colors';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PitlaneTeamSelectorProps {
  groups: TeammatePairBattle[][];
  selectedConstructorId: string;
  season: string | number;
  onSelectConstructor: (constructorId: string) => void;
  className?: string;
}

export function PitlaneTeamSelector({
  groups,
  selectedConstructorId,
  season,
  onSelectConstructor,
  className = '',
}: PitlaneTeamSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={cn('relative group/pitlane', className)}>
      {/* Scroll Left Button */}
      <button
        type="button"
        aria-label="Scroll teams left"
        onClick={() => scroll('left')}
        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full bg-zinc-900/90 border border-white/15 items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 shadow-xl backdrop-blur-sm transition-all opacity-0 group-hover/pitlane:opacity-100 cursor-pointer"
      >
        <ChevronLeft className="size-4" />
      </button>

      {/* Horizontal Pitlane Strip */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 px-1 scrollbar-none scroll-smooth snap-x select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {groups.map((group) => {
          const primaryBattle = group.find((b) => b.isPrimary) || group[0];
          if (!primaryBattle) return null;

          const isSelected = primaryBattle.constructorId === selectedConstructorId;
          const theme = getTeamTheme(primaryBattle.constructorId);
          const { driver1, driver2, stats } = primaryBattle;

          // Quick score preview: Races H2H
          const d1Wins = stats.race.d1Wins;
          const d2Wins = stats.race.d2Wins;

          return (
            <button
              key={primaryBattle.constructorId}
              type="button"
              onClick={() => onSelectConstructor(primaryBattle.constructorId)}
              className={cn(
                'snap-start shrink-0 flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer text-left',
                isSelected
                  ? 'bg-zinc-900 border-white/30 shadow-lg ring-1'
                  : 'bg-zinc-950/70 border-white/10 hover:border-white/20 hover:bg-zinc-900/70'
              )}
              style={{
                borderColor: isSelected ? theme.primary : undefined,
                boxShadow: isSelected ? `0 0 20px ${theme.primary}25` : undefined,
              }}
            >
              {/* Colored Team Bar Indicator */}
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ backgroundColor: theme.primary }}
              />

              {/* Team Logo */}
              <div className="shrink-0">
                <TeamLogo
                  constructorId={primaryBattle.constructorId}
                  season={season}
                  size={24}
                />
              </div>

              {/* Team Name & Duel Score */}
              <div className="space-y-0.5 min-w-[90px]">
                <p
                  className={cn(
                    'text-xs font-black uppercase tracking-tight truncate',
                    isSelected ? 'text-white' : 'text-zinc-300'
                  )}
                >
                  {primaryBattle.constructorName}
                </p>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
                  <span className={d1Wins >= d2Wins ? 'font-bold text-white' : ''}>
                    {driver1.code} {d1Wins}
                  </span>
                  <span className="text-zinc-600">:</span>
                  <span className={d2Wins >= d1Wins ? 'font-bold text-white' : ''}>
                    {d2Wins} {driver2.code}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        type="button"
        aria-label="Scroll teams right"
        onClick={() => scroll('right')}
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full bg-zinc-900/90 border border-white/15 items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 shadow-xl backdrop-blur-sm transition-all opacity-0 group-hover/pitlane:opacity-100 cursor-pointer"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
