'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { SeasonHeadToHeadResponse, TeammatePairBattle } from '@/types/f1';
import { SeasonSelector } from '@/components/f1/season-selector';
import { PitlaneTeamSelector } from './pitlane-team-selector';
import { ArenaFaceoffHero } from './arena-faceoff-hero';
import { DominanceMatrix } from './dominance-matrix';
import { PreloadedContent } from '@/components/f1/preloaded-content';
import { getDriverPhotoUrl } from '@/lib/driver-photos';

interface HeadToHeadContentProps {
  data: SeasonHeadToHeadResponse | null;
  season: number;
  allYears: number[];
  initialConstructorId?: string;
}

function BattleArenaSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Pitlane selector skeleton */}
      <div className="flex gap-3 overflow-hidden pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 w-44 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0" />
        ))}
      </div>

      {/* Arena Stage skeleton */}
      <div className="h-[520px] rounded-3xl bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between">
        <div className="h-8 w-60 bg-zinc-800 rounded-lg" />
        <div className="grid grid-cols-3 gap-6 items-center">
          <div className="size-48 rounded-2xl bg-zinc-800 mx-auto" />
          <div className="h-40 rounded-2xl bg-zinc-800" />
          <div className="size-48 rounded-2xl bg-zinc-800 mx-auto" />
        </div>
        <div className="h-12 rounded-xl bg-zinc-800" />
      </div>

      {/* Matrix skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-zinc-900 border border-zinc-800" />
        ))}
      </div>
    </div>
  );
}

export function HeadToHeadContent({
  data,
  season,
  allYears,
  initialConstructorId,
}: HeadToHeadContentProps) {
  // Group battles by constructor
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

  // Selected constructor for the Face-Off Arena Hero
  const [selectedConstructorId, setSelectedConstructorId] = useState<string>(() => {
    if (initialConstructorId) {
      const match = constructorGroups.find((g) => g[0]?.constructorId === initialConstructorId);
      if (match) return initialConstructorId;
    }
    return constructorGroups[0]?.[0]?.constructorId || 'ferrari';
  });

  const lastInitialTeamRef = useRef<string | undefined>(initialConstructorId);

  // Synchronize selection state when incoming data or query param changes
  useEffect(() => {
    if (constructorGroups.length === 0) return;

    if (initialConstructorId && initialConstructorId !== lastInitialTeamRef.current) {
      lastInitialTeamRef.current = initialConstructorId;
      const match = constructorGroups.find((g) => g[0]?.constructorId === initialConstructorId);
      if (match) {
        setSelectedConstructorId(initialConstructorId);
        return;
      }
    }

    const exists = constructorGroups.some((g) => g[0]?.constructorId === selectedConstructorId);
    if (!exists) {
      setSelectedConstructorId(constructorGroups[0]?.[0]?.constructorId || '');
    }
  }, [constructorGroups, initialConstructorId, selectedConstructorId]);

  // Active battle group for the selected constructor
  const activeGroup = useMemo(() => {
    return (
      constructorGroups.find(
        (g) => g[0]?.constructorId === selectedConstructorId
      ) || constructorGroups[0]
    );
  }, [constructorGroups, selectedConstructorId]);

  // Grid Pulse Highlights
  const pulseHighlights = useMemo(() => {
    if (constructorGroups.length === 0) return null;

    let closestDelta = Infinity;
    let closestTeam = '';
    let closestMatchup = '';

    let maxPointsShare = 0;
    let dominantDriver = '';
    let dominantTeam = '';

    let totalGapMs = 0;
    let gapCount = 0;

    for (const group of constructorGroups) {
      const b = group.find((item) => item.isPrimary) || group[0];
      if (!b) continue;

      // Closest battle
      const r1 = b.stats.race.d1Wins;
      const r2 = b.stats.race.d2Wins;
      const rDiff = Math.abs(r1 - r2);
      if (rDiff < closestDelta) {
        closestDelta = rDiff;
        closestTeam = b.constructorName;
        closestMatchup = `${b.driver1.code} ${r1} - ${r2} ${b.driver2.code}`;
      }

      // Dominance
      const ptsShare1 = b.stats.points.d1SharePercent;
      const ptsShare2 = 100 - ptsShare1;
      if (ptsShare1 > maxPointsShare) {
        maxPointsShare = ptsShare1;
        dominantDriver = b.driver1.familyName;
        dominantTeam = b.constructorName;
      }
      if (ptsShare2 > maxPointsShare) {
        maxPointsShare = ptsShare2;
        dominantDriver = b.driver2.familyName;
        dominantTeam = b.constructorName;
      }

      // Qualy gap
      if (b.stats.qualifying.medianDeltaMs !== 0) {
        totalGapMs += Math.abs(b.stats.qualifying.medianDeltaMs);
        gapCount++;
      }
    }

    const avgGapSec = gapCount > 0 ? (totalGapMs / gapCount / 1000).toFixed(3) : '0.150';

    return {
      totalDuels: constructorGroups.length,
      closestTeam,
      closestMatchup,
      dominantDriver,
      dominantTeam,
      dominantShare: maxPointsShare.toFixed(1),
      avgGapSec,
    };
  }, [constructorGroups]);

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
            battle.constructorId,
            'left'
          ),
          getDriverPhotoUrl(
            battle.driver2.driverId,
            battle.driver2.givenName,
            battle.driver2.familyName,
            String(season),
            battle.constructorId,
            'right'
          )
        );
      }
    }
    return urls;
  }, [constructorGroups, season]);

  const handleSelectConstructor = (constructorId: string) => {
    setSelectedConstructorId(constructorId);
    // Smooth scroll back to arena top if user clicks from lower down
    const arenaEl = document.getElementById('battle-arena-hero');
    if (arenaEl) {
      const topPos = arenaEl.getBoundingClientRect().top + window.scrollY - 100;
      if (window.scrollY > topPos + 250) {
        window.scrollTo({ top: topPos, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* ── Header Toolbar ───────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Teammate Head-to-Head
          </h1>
        </div>
        <SeasonSelector currentSeason={season} allYears={allYears} />
      </div>

      {/* ── Season Pulse Highlights Strip (Monolithic Telemetry Bar) ── */}
      {pulseHighlights && (
        <div className="grid grid-cols-2 lg:grid-cols-4 rounded-xl border border-white/10 bg-zinc-950/80 divide-y sm:divide-y-0 sm:divide-x divide-white/10 overflow-hidden shadow-lg">
          <div className="p-4 flex flex-col justify-between gap-1.5">
            <div className="text-zinc-300 text-xs font-mono uppercase font-bold tracking-wider">
              Grid Duels
            </div>
            <p className="text-lg sm:text-xl font-black font-mono text-white">
              {pulseHighlights.totalDuels} Constructors
            </p>
            <p className="text-xs font-mono text-zinc-400 font-medium">
              Active pairings
            </p>
          </div>

          <div className="p-4 flex flex-col justify-between gap-1.5">
            <div className="text-zinc-300 text-xs font-mono uppercase font-bold tracking-wider">
              Closest Margin
            </div>
            <p className="text-sm sm:text-base font-black text-white truncate">
              {pulseHighlights.closestTeam}
            </p>
            <p className="text-xs font-mono text-amber-400 font-bold">
              {pulseHighlights.closestMatchup}
            </p>
          </div>

          <div className="p-4 flex flex-col justify-between gap-1.5">
            <div className="text-zinc-300 text-xs font-mono uppercase font-bold tracking-wider">
              Highest Dominance
            </div>
            <p className="text-sm sm:text-base font-black text-white truncate">
              {pulseHighlights.dominantDriver}
            </p>
            <p className="text-xs font-mono text-emerald-400 font-bold">
              {pulseHighlights.dominantShare}% points share
            </p>
          </div>

          <div className="p-4 flex flex-col justify-between gap-1.5">
            <div className="text-zinc-300 text-xs font-mono uppercase font-bold tracking-wider">
              Avg Qualy Delta
            </div>
            <p className="text-lg sm:text-xl font-black font-mono text-white">
              ±{pulseHighlights.avgGapSec}s
            </p>
            <p className="text-xs font-mono text-zinc-400 font-medium">
              Across all constructors
            </p>
          </div>
        </div>
      )}

      {constructorGroups.length > 0 ? (
        <PreloadedContent imageUrls={allPhotoUrls} skeleton={<BattleArenaSkeleton />}>
          {/* ── Pitlane Team Selector Strip ───────────────────────────── */}
          <PitlaneTeamSelector
            groups={constructorGroups}
            selectedConstructorId={selectedConstructorId}
            season={season}
            onSelectConstructor={handleSelectConstructor}
          />

          {/* ── Main Face-Off Hero Arena ──────────────────────────────── */}
          <div id="battle-arena-hero">
            {activeGroup && (
              <ArenaFaceoffHero
                battles={activeGroup}
                season={season}
              />
            )}
          </div>

          {/* ── Full Grid Dominance Matrix ────────────────────────────── */}
          <div className="pt-4">
            <DominanceMatrix
              groups={constructorGroups}
              selectedConstructorId={selectedConstructorId}
              season={season}
              onSelectConstructor={handleSelectConstructor}
            />
          </div>
        </PreloadedContent>
      ) : (
        <div className="py-20 text-center text-muted-foreground font-mono text-sm border border-zinc-800 rounded-2xl bg-zinc-950/40">
          No teammate head-to-head battle data available for {season}.
        </div>
      )}
    </div>
  );
}
