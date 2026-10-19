'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SeasonSelector } from '@/components/f1/season-selector';
import { ReliabilityKpiCards } from './reliability-kpi-cards';
import { ConstructorReliabilityTable } from './constructor-reliability-table';
import { AttritionMatrix } from './attrition-matrix';
import { CauseBreakdownCard } from './cause-breakdown-card';
import { TeamReliabilityView } from './team-reliability-view';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Grid, Award, Wrench, Layers, ChevronRight, ChevronLeft } from 'lucide-react';
import type {
  SeasonReliabilityResponse,
  ConstructorMultiSeasonReliabilityResponse,
} from '@/types/f1';

interface ReliabilityContentProps {
  data: SeasonReliabilityResponse | null;
  teamData?: ConstructorMultiSeasonReliabilityResponse | null;
  selectedTeamId?: string;
  season: number;
  allYears: number[];
  from?: string;
}

export function ReliabilityContent({
  data,
  teamData,
  selectedTeamId,
  season,
  allYears,
  from,
}: ReliabilityContentProps) {
  const router = useRouter();

  // If a specific team was requested and resolved, render the single-constructor multi-season deep-dive
  if (teamData) {
    return (
      <TeamReliabilityView
        teamData={teamData}
        seasonData={data}
        season={season}
        allYears={allYears}
        from={from}
      />
    );
  }

  const hasData = Boolean(data && data.completedRaces > 0);

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      {/* ── Top Dual F1 Racing Speed Stripes ───────────────────────────── */}
      <div className="space-y-1.5" aria-hidden="true">
        <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-transparent rounded-full opacity-90" />
        <div className="h-0.5 sm:h-1 w-3/4 bg-gradient-to-r from-red-700 via-red-600 to-transparent rounded-full opacity-60" />
      </div>

      {/* Notice if team was requested but not found */}
      {selectedTeamId && !teamData && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-mono text-amber-300 flex items-center justify-between gap-4">
          <span>
            Constructor &quot;{selectedTeamId}&quot; reliability data not available for season {season}.
          </span>
          <Link
            href={`/reliability?season=${season}`}
            className="inline-flex items-center gap-1 font-bold text-white hover:underline shrink-0"
          >
            <ChevronLeft className="size-3.5" />
            <span>View Grid Overview</span>
          </Link>
        </div>
      )}

      {/* ── Main Cockpit Header ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white uppercase flex flex-wrap items-baseline gap-3">
            <span>{season}</span>
            <span className="text-zinc-400 font-sans font-black tracking-tighter text-2xl sm:text-3xl lg:text-4xl">
              RELIABILITY &amp; ATTRITION
            </span>
          </h1>

          <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
            <span>{data?.completedRaces ?? 0} Completed Grands Prix</span>
            <span className="text-zinc-600">•</span>
            <span>{data?.constructors?.length ?? 0} Constructors</span>
            <span className="text-zinc-600">•</span>
            <span>{data?.kpis?.totalDnfs ?? 0} Total Retirements</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {data?.constructors && data.constructors.length > 0 && (
            <div className="relative">
              <select
                aria-label="Filter by Constructor"
                defaultValue="__all__"
                onChange={(e) => {
                  const teamId = e.target.value;
                  if (teamId !== '__all__') {
                    router.push(`/reliability?team=${teamId}&season=${season}`);
                  }
                }}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-mono font-bold text-zinc-200 hover:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500/50 cursor-pointer shadow-sm transition-all"
              >
                <option value="__all__">All Constructors</option>
                {data.constructors.map((c) => (
                  <option key={c.constructorId} value={c.constructorId}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
                <ChevronRight className="size-3.5 rotate-90" />
              </div>
            </div>
          )}
          <SeasonSelector currentSeason={season} allYears={allYears} />
        </div>
      </div>

      {!hasData ? (
        <div className="py-20 text-center text-zinc-400 font-mono text-sm border border-zinc-800 rounded-2xl bg-zinc-950/40">
          No reliability data available for season {season}.
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* ── 1. Monolithic Hero Telemetry Ribbon (Always Visible) ───────── */}
          <ReliabilityKpiCards kpis={data!.kpis} />

          {/* ── 2. Interactive Analytical Modules (Segmented Tabs) ─────────── */}
          <Tabs defaultValue="matrix" className="space-y-4">
            <div className="flex items-center justify-end pb-2 border-b border-white/10">
              <TabsList className="w-full sm:w-auto bg-zinc-950 border border-white/10 p-1 rounded-xl h-auto gap-1 shadow-inner overflow-x-auto max-w-full scrollbar-none">
                <TabsTrigger
                  value="matrix"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-white/10 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0"
                >
                  <Grid className="size-3.5 text-emerald-400" />
                  <span>Attrition Timeline</span>
                </TabsTrigger>

                <TabsTrigger
                  value="constructors"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-white/10 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0"
                >
                  <Award className="size-3.5 text-amber-400" />
                  <span>Constructor Standings</span>
                </TabsTrigger>

                <TabsTrigger
                  value="causes"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-white/10 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0"
                >
                  <Wrench className="size-3.5 text-sky-400" />
                  <span>Failure Causes</span>
                </TabsTrigger>

                <TabsTrigger
                  value="all"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-white/10 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0"
                >
                  <Layers className="size-3.5 text-purple-400" />
                  <span>All Views</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab 1: Primary Feature: Season Attrition Matrix */}
            <TabsContent value="matrix" className="pt-1 focus-visible:outline-hidden">
              <AttritionMatrix matrix={data!.matrix} season={season} />
            </TabsContent>

            {/* Tab 2: Constructor Reliability Leaderboard */}
            <TabsContent value="constructors" className="pt-1 focus-visible:outline-hidden">
              <ConstructorReliabilityTable
                constructors={data!.constructors}
                season={season}
              />
            </TabsContent>

            {/* Tab 3: Attrition Taxonomy & Failure Triggers */}
            <TabsContent value="causes" className="pt-1 focus-visible:outline-hidden">
              <CauseBreakdownCard
                causeBreakdown={data!.causeBreakdown}
                season={season}
              />
            </TabsContent>

            {/* Tab 4: All Modules Stacked */}
            <TabsContent value="all" className="pt-1 space-y-6 sm:space-y-8 focus-visible:outline-hidden">
              <AttritionMatrix matrix={data!.matrix} season={season} />
              <ConstructorReliabilityTable
                constructors={data!.constructors}
                season={season}
              />
              <CauseBreakdownCard
                causeBreakdown={data!.causeBreakdown}
                season={season}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
