'use client';

import React from 'react';
import type { PitStopEntry, RaceResultEntry } from '@/types/f1';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getTeamTheme } from '@/lib/team-colors';

interface PitStopChronicleProps {
  pitStops: PitStopEntry[];
  /** Race results are used to resolve driverId -> constructor for team colors */
  raceResults: RaceResultEntry[];
  selectedIds: Set<string>;
  onToggle: (key: string) => void;
}

/** Builds a unique key for a specific pit stop (driver + stop number) */
export function pitStopKey(stop: PitStopEntry): string {
  return `${stop.driverId}:${stop.stop}`;
}

/** Resolves driverId to the team constructorId from race results */
function resolveConstructorId(driverId: string, results: RaceResultEntry[]): string | undefined {
  return results.find((r) => r.Driver.driverId === driverId)?.Constructor.constructorId;
}

/** Formats duration string to always show 2 decimal places */
export function formatDuration(raw: string): string {
  const num = parseFloat(raw);
  if (isNaN(num)) return raw;
  return `${num.toFixed(3)}s`;
}

/**
 * Tab 1 — Chronological pit stop timeline.
 * Rows are sorted by lap then time-of-day (already sorted by the backend).
 * Up to 4 rows can be selected for the Pit Stop Duel visualization.
 */
export function PitStopChronicle({
  pitStops,
  raceResults,
  selectedIds,
  onToggle,
}: PitStopChronicleProps) {
  const maxSelections = 4;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <TableHead className="text-center w-14">Lap</TableHead>
          <TableHead>Driver</TableHead>
          <TableHead>Team</TableHead>
          <TableHead className="text-center w-14">Stop</TableHead>
          <TableHead className="text-right">Duration</TableHead>
          <TableHead className="text-right text-xs text-zinc-500">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pitStops.map((stop) => {
          const key = pitStopKey(stop);
          const isSelected = selectedIds.has(key);
          const constructorId = resolveConstructorId(stop.driverId, raceResults);
          const theme = getTeamTheme(constructorId);
          const canSelect = isSelected || selectedIds.size < maxSelections;
          const driverResult = raceResults.find((r) => r.Driver.driverId === stop.driverId);
          const driverName = driverResult
            ? `${driverResult.Driver.givenName} ${driverResult.Driver.familyName}`
            : stop.driverId.replace(/_/g, ' ');
          const teamName = driverResult?.Constructor.name ?? constructorId ?? '—';
          const duration = parseFloat(stop.duration);
          // Flag anomalous stops (>60s, e.g. mechanical issues or drive-through penalties)
          const isAnomaly = !isNaN(duration) && duration > 60;

          return (
            <TableRow
              key={key}
              className={cn(
                'transition-colors',
                canSelect && 'cursor-pointer',
                isSelected && 'bg-zinc-800/50',
                !canSelect && !isSelected && 'opacity-50'
              )}
              onClick={canSelect ? () => onToggle(key) : undefined}
            >
              {/* Team color indicator + checkbox */}
              <TableCell className="pr-0">
                <div className="flex items-center gap-2">
                  <div
                    className="w-1 h-7 rounded-full shrink-0"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div
                    className={cn(
                      'size-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-zinc-600 bg-transparent'
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

              <TableCell className="text-center font-mono font-bold tabular-nums">
                {stop.lap}
              </TableCell>

              <TableCell className="font-semibold">
                {driverName}
                {driverResult?.Driver.code && (
                  <span className="ml-2 text-xs font-mono text-zinc-500">
                    {driverResult.Driver.code}
                  </span>
                )}
              </TableCell>

              <TableCell className="text-sm text-zinc-400">{teamName}</TableCell>

              <TableCell className="text-center font-mono tabular-nums text-zinc-400">
                #{stop.stop}
              </TableCell>

              <TableCell className="text-right font-mono font-bold tabular-nums">
                <span className={cn(isAnomaly && 'text-amber-400')}>
                  {formatDuration(stop.duration)}
                </span>
                {isAnomaly && (
                  <span className="ml-1 text-xs text-amber-400/70" title="Anomalous stop duration">
                    ⚠
                  </span>
                )}
              </TableCell>

              <TableCell className="text-right font-mono text-xs text-zinc-600 tabular-nums">
                {stop.time}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}