'use client';

import React from 'react';
import type { PitStopEntry, RaceResultEntry } from '@/types/f1';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getTeamTheme } from '@/lib/team-colors';
import { pitStopKey, formatDuration } from './pit-stop-chronicle';

interface PitStopFastestProps {
  pitStops: PitStopEntry[];
  raceResults: RaceResultEntry[];
  selectedIds: Set<string>;
  onToggle: (key: string) => void;
}

const ANOMALY_THRESHOLD_SECONDS = 60;

const MEDALS: Record<number, string> = { 0: 'text-yellow-400', 1: 'text-zinc-400', 2: 'text-amber-600' };
const MEDAL_ICONS: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

/**
 * Tab 2 — Fastest Pit Stop Award ranking.
 * Stops are sorted by duration ascending. Stops longer than 60 s are separated
 * into an "Incidents" section at the bottom to keep the main ranking clean.
 */
export function PitStopFastest({
  pitStops,
  raceResults,
  selectedIds,
  onToggle,
}: PitStopFastestProps) {
  const maxSelections = 4;

  // Parse and sort all stops by duration
  const withDuration = pitStops.map((s) => ({
    ...s,
    durationNum: parseFloat(s.duration),
  }));

  const normalStops = withDuration
    .filter((s) => !isNaN(s.durationNum) && s.durationNum < ANOMALY_THRESHOLD_SECONDS)
    .sort((a, b) => a.durationNum - b.durationNum);

  const incidentStops = withDuration
    .filter((s) => isNaN(s.durationNum) || s.durationNum >= ANOMALY_THRESHOLD_SECONDS)
    .sort((a, b) => a.durationNum - b.durationNum);

  const fastestTime = normalStops[0]?.durationNum ?? 0;

  function renderRow(stop: (typeof withDuration)[0], rank: number) {
    const key = pitStopKey(stop);
    const isSelected = selectedIds.has(key);
    const result = raceResults.find((r) => r.Driver.driverId === stop.driverId);
    const constructorId = result?.Constructor.constructorId;
    const theme = getTeamTheme(constructorId);
    const canSelect = isSelected || selectedIds.size < maxSelections;
    const driverName = result
      ? `${result.Driver.givenName} ${result.Driver.familyName}`
      : stop.driverId.replace(/_/g, ' ');
    const teamName = result?.Constructor.name ?? constructorId ?? '—';
    const isTopThree = rank < 3;
    // Width of the mini duration bar relative to the fastest stop
    const barPct = fastestTime > 0 ? Math.min((fastestTime / stop.durationNum) * 100, 100) : 0;

    return (
      <TableRow
        key={key}
        className={cn(
          'transition-colors',
          canSelect && 'cursor-pointer',
          isSelected && 'bg-zinc-800/50',
          !canSelect && !isSelected && 'opacity-50',
          isTopThree && 'bg-zinc-900/40'
        )}
        onClick={canSelect ? () => onToggle(key) : undefined}
      >
        {/* Rank + medal */}
        <TableCell className="w-12 text-center font-mono font-bold tabular-nums text-sm">
          <span className={cn(isTopThree ? MEDALS[rank] : 'text-zinc-500')}>
            {isTopThree ? MEDAL_ICONS[rank] : rank + 1}
          </span>
        </TableCell>

        {/* Team color indicator + checkbox */}
        <TableCell className="pr-0 w-10">
          <div className="flex items-center gap-2">
            <div className="w-1 h-7 rounded-full shrink-0" style={{ backgroundColor: theme.primary }} />
            <div
              className={cn(
                'size-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                isSelected ? 'border-primary bg-primary' : 'border-zinc-600 bg-transparent'
              )}
            >
              {isSelected && (
                <svg className="size-2.5 text-white" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
        </TableCell>

        <TableCell className="font-semibold">
          {driverName}
          {result?.Driver.code && (
            <span className="ml-2 text-xs font-mono text-zinc-500">{result.Driver.code}</span>
          )}
        </TableCell>

        <TableCell className="text-sm text-zinc-400">{teamName}</TableCell>

        <TableCell className="text-center font-mono tabular-nums text-zinc-400 text-sm">
          Lap {stop.lap}
        </TableCell>

        {/* Duration + relative bar */}
        <TableCell className="text-right min-w-[140px]">
          <div className="flex items-center justify-end gap-3">
            <div className="w-24 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${barPct}%`, backgroundColor: theme.primary }}
              />
            </div>
            <span className={cn(
              'font-mono font-bold tabular-nums text-sm',
              isTopThree && 'text-primary'
            )}>
              {formatDuration(stop.duration)}
            </span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead className="w-10" />
            <TableHead>Driver</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">Lap</TableHead>
            <TableHead className="text-right">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {normalStops.map((stop, idx) => renderRow(stop, idx))}
        </TableBody>
      </Table>

      {incidentStops.length > 0 && (
        <div className="mt-4 border-t border-zinc-800 pt-4 px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400/70 mb-2">
            ⚠ Incidents / Long Stops
          </p>
          <Table>
            <TableBody>
              {incidentStops.map((stop) => {
                const result = raceResults.find((r) => r.Driver.driverId === stop.driverId);
                const driverName = result
                  ? `${result.Driver.givenName} ${result.Driver.familyName}`
                  : stop.driverId.replace(/_/g, ' ');
                return (
                  <TableRow key={pitStopKey(stop)} className="opacity-60">
                    <TableCell className="text-center text-zinc-500 font-mono">—</TableCell>
                    <TableCell className="w-10" />
                    <TableCell className="text-sm text-zinc-400">{driverName}</TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {result?.Constructor.name ?? stop.driverId}
                    </TableCell>
                    <TableCell className="text-center text-sm text-zinc-500">
                      Lap {stop.lap}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-amber-400">
                      {formatDuration(stop.duration)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}