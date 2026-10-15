'use client';

import React from 'react';
import {
  TelemetryRibbon,
  TelemetryRibbonCell,
  TelemetryRibbonLabel,
  TelemetryRibbonValue,
  TelemetryRibbonSub,
} from '@/components/f1/telemetry-ribbon';
import { ShieldCheck, Flag, AlertTriangle, Activity } from 'lucide-react';
import { getTeamTheme } from '@/lib/team-colors';
import type { SeasonReliabilityKpis } from '@/types/f1';

interface ReliabilityKpiCardsProps {
  kpis: SeasonReliabilityKpis;
}

export function ReliabilityKpiCards({ kpis }: ReliabilityKpiCardsProps) {
  const topTeam = kpis.mostReliableConstructor;
  const topTeamTheme = topTeam ? getTeamTheme(topTeam.constructorId) : null;
  const chaoticRound = kpis.mostChaoticRound;

  return (
    <TelemetryRibbon columns={4}>
      {/* 1. Overall Completion Rate */}
      <TelemetryRibbonCell
        label={
          <TelemetryRibbonLabel className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>Finish Rate</span>
          </TelemetryRibbonLabel>
        }
        value={
          <TelemetryRibbonValue className="text-emerald-400">
            {kpis.overallReliabilityRate}%
          </TelemetryRibbonValue>
        }
        sub={
          <TelemetryRibbonSub>
            {kpis.totalFinishes} of {kpis.totalStarts} race starts
          </TelemetryRibbonSub>
        }
      />

      {/* 2. Total Distance / Laps Completed */}
      <TelemetryRibbonCell
        label={
          <TelemetryRibbonLabel className="flex items-center gap-1.5">
            <Activity className="size-3.5 text-sky-400" />
            <span>Laps Completed</span>
          </TelemetryRibbonLabel>
        }
        value={
          <TelemetryRibbonValue className="text-sky-400">
            {kpis.lapCompletionRate}%
          </TelemetryRibbonValue>
        }
        sub={
          <TelemetryRibbonSub>
            {kpis.totalLapsCompleted.toLocaleString()} / {kpis.totalLapsScheduled.toLocaleString()} laps
          </TelemetryRibbonSub>
        }
      />

      {/* 3. Most Reliable Constructor */}
      <TelemetryRibbonCell
        label={
          <TelemetryRibbonLabel className="flex items-center gap-1.5">
            <Flag className="size-3.5 text-amber-400" />
            <span>Most Reliable Team</span>
          </TelemetryRibbonLabel>
        }
        value={
          <div className="flex items-center gap-2 truncate">
            {topTeamTheme && (
              <span
                className="size-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: topTeamTheme.primary }}
              />
            )}
            <span className="truncate text-lg sm:text-xl font-bold font-mono text-white">
              {topTeam?.name ?? '—'}
            </span>
          </div>
        }
        sub={
          <TelemetryRibbonSub>
            {topTeam ? `${topTeam.reliabilityRate}% • ${topTeam.dnfCount} DNF` : 'No DNF data'}
          </TelemetryRibbonSub>
        }
      />

      {/* 4. Chaos Round / Highest Attrition */}
      <TelemetryRibbonCell
        label={
          <TelemetryRibbonLabel className="flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-rose-400" />
            <span>Peak Attrition GP</span>
          </TelemetryRibbonLabel>
        }
        value={
          <div className="flex items-center gap-2 truncate">
            <span className="text-rose-400 font-bold font-mono text-lg sm:text-xl truncate">
              {chaoticRound ? chaoticRound.raceName.replace(' Grand Prix', ' GP') : '—'}
            </span>
          </div>
        }
        sub={
          <TelemetryRibbonSub>
            {chaoticRound ? `${chaoticRound.dnfCount} DNFs (${chaoticRound.dnfRate}% of field)` : 'No retirements'}
          </TelemetryRibbonSub>
        }
      />
    </TelemetryRibbon>
  );
}
