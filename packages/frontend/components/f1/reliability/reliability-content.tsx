'use client';

import React from 'react';
import { SeasonSelector } from '@/components/f1/season-selector';
import { ReliabilityKpiCards } from './reliability-kpi-cards';
import { ConstructorReliabilityTable } from './constructor-reliability-table';
import { AttritionMatrix } from './attrition-matrix';
import { CauseBreakdownCard } from './cause-breakdown-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ShieldCheck, Award, Grid, PieChart } from 'lucide-react';
import type { SeasonReliabilityResponse } from '@/types/f1';

interface ReliabilityContentProps {
  data: SeasonReliabilityResponse | null;
  season: number;
  allYears: number[];
}

export function ReliabilityContent({
  data,
  season,
  allYears,
}: ReliabilityContentProps) {
  const hasData = Boolean(data && data.completedRaces > 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Main Cockpit Header ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold tracking-wide">
              <ShieldCheck className="size-3.5" />
              ATTRITION ANALYTICS
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white uppercase flex flex-wrap items-baseline gap-3">
            <span>{season}</span>
            <span className="text-zinc-400 font-sans font-black tracking-tighter text-2xl sm:text-3xl lg:text-4xl">
              RELIABILITY &amp; DNF HUB
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

        <div className="flex items-center gap-3 shrink-0">
          <SeasonSelector currentSeason={season} allYears={allYears} />
        </div>
      </div>

      {!hasData ? (
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-12 text-center shadow-2xl space-y-3">
          <ShieldCheck className="size-12 text-zinc-600 mx-auto" />
          <h2 className="text-lg font-bold font-mono text-white">
            No Reliability Data Available for {season}
          </h2>
          <p className="text-sm font-mono text-zinc-400 max-w-md mx-auto">
            This season has either not started yet or has no recorded official race classifications.
            Please select another year from the season picker above.
          </p>
        </div>
      ) : (
        <>
          {/* ── 1. Hero KPI Cards ──────────────────────────────────────────── */}
          <ReliabilityKpiCards kpis={data!.kpis} />

          {/* ── 2. Interactive Analytical Sections (Tabs) ──────────────────── */}
          <Tabs defaultValue="teams" className="space-y-6">
            <div className="flex items-center justify-between overflow-x-auto pb-1 scrollbar-none">
              <TabsList className="bg-zinc-950 border border-white/10 p-1 rounded-2xl">
                <TabsTrigger
                  value="teams"
                  className="px-3.5 sm:px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-xl flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 hover:text-zinc-200 transition-all"
                >
                  <Award className="size-3.5 text-amber-400" />
                  <span>Team Standings</span>
                </TabsTrigger>

                <TabsTrigger
                  value="matrix"
                  className="px-3.5 sm:px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-xl flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 hover:text-zinc-200 transition-all"
                >
                  <Grid className="size-3.5 text-emerald-400" />
                  <span>Attrition Matrix</span>
                </TabsTrigger>

                <TabsTrigger
                  value="causes"
                  className="px-3.5 sm:px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-xl flex items-center gap-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 hover:text-zinc-200 transition-all"
                >
                  <PieChart className="size-3.5 text-sky-400" />
                  <span>Failure Causes</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab 1: Constructor Reliability Leaderboard */}
            <TabsContent value="teams" className="focus-visible:outline-hidden">
              <ConstructorReliabilityTable
                constructors={data!.constructors}
                season={season}
              />
            </TabsContent>

            {/* Tab 2: Season Attrition Heatmap Matrix */}
            <TabsContent value="matrix" className="focus-visible:outline-hidden">
              <AttritionMatrix matrix={data!.matrix} season={season} />
            </TabsContent>

            {/* Tab 3: Specific Failure Causes Breakdown */}
            <TabsContent value="causes" className="focus-visible:outline-hidden">
              <CauseBreakdownCard
                causeBreakdown={data!.causeBreakdown}
                season={season}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
