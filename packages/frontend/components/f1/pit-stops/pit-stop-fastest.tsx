'use client';

import React from 'react';
import type { PitStopEntry, RaceResultEntry } from '@/types/f1';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTeamTheme } from '@/lib/team-colors';
import { AlertTriangle, Check, Trophy } from 'lucide-react';
import { pitStopKey, formatDuration, parseDurationToSeconds } from './pit-stop-chronicle';
import Link from 'next/link';

interface PitStopFastestProps {
  pitStops: PitStopEntry[];
  raceResults: RaceResultEntry[];
  selectedIds: Set<string>;
  onToggle: (key: string) => void;
  isLocked?: boolean;
}

const ANOMALY_THRESHOLD_SECONDS = 60;

export function PitStopFastest({
  pitStops,
  raceResults,
  selectedIds,
  onToggle,
  isLocked = false,
}: PitStopFastestProps) {
  const maxSelections = 4;

  const withDuration = pitStops.map((s) => ({
    ...s,
    durationNum: parseDurationToSeconds(s.duration),
  }));

  const normalStops = withDuration
    .filter((s) => !isNaN(s.durationNum) && s.durationNum < ANOMALY_THRESHOLD_SECONDS)
    .sort((a, b) => a.durationNum - b.durationNum);

  const incidentStops = withDuration
    .filter((s) => isNaN(s.durationNum) || s.durationNum >= ANOMALY_THRESHOLD_SECONDS)
    .sort((a, b) => a.durationNum - b.durationNum);

  const fastestTime = normalStops[0]?.durationNum ?? 0;

  function renderRankBadge(rank: number) {
    if (rank === 0) {
      return (
        <span className="inline-flex items-center justify-center size-6 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs">
          <Trophy className="size-3 mr-0.5" />
          1
        </span>
      );
    }
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center size-6 rounded-md bg-zinc-400/20 border border-zinc-400/40 text-zinc-200 font-mono font-bold text-xs">
          2
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center size-6 rounded-md bg-amber-700/20 border border-amber-700/40 text-amber-600 dark:text-amber-500 font-mono font-bold text-xs">
          3
        </span>
      );
    }
    return (
      <span className="text-xs font-mono font-medium text-muted-foreground">
        {rank + 1}
      </span>
    );
  }

  function renderRow(stop: (typeof withDuration)[0], rank: number) {
    const key = pitStopKey(stop);
    const isSelected = selectedIds.has(key);
    const result = raceResults.find((r) => r.Driver.driverId === stop.driverId);
    const constructorId = result?.Constructor.constructorId;
    const theme = getTeamTheme(constructorId);
    const canSelect = !isLocked && (isSelected || selectedIds.size < maxSelections);
    const driverName = result
      ? `${result.Driver.givenName} ${result.Driver.familyName}`
      : stop.driverId.replace(/_/g, ' ');
    const teamName = result?.Constructor.name ?? constructorId ?? '—';
    const isTopThree = rank < 3;
    const barPct = fastestTime > 0 ? Math.min((fastestTime / stop.durationNum) * 100, 100) : 0;

    return (
      <TableRow
        key={key}
        className={cn(
          'border-zinc-800/80 transition-colors',
          canSelect && 'cursor-pointer hover:bg-zinc-900/60',
          isSelected && 'bg-zinc-900/90 border-l-2',
          !canSelect && !isSelected && 'opacity-40',
          isTopThree && !isSelected && 'bg-zinc-950/40'
        )}
        style={isSelected ? { borderLeftColor: theme.primary } : undefined}
        onClick={canSelect ? () => onToggle(key) : undefined}
      >
        {/* Checkbox */}
        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => canSelect && onToggle(key)}
            disabled={!canSelect || isLocked}
            aria-label={`Select pit stop by ${driverName} for comparison`}
            className={cn(
              'size-4 mx-auto rounded border transition-colors flex items-center justify-center',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500',
              isLocked && 'cursor-not-allowed opacity-60'
            )}
          >
            {isSelected && <Check className="size-3 stroke-[3]" />}
          </button>
        </TableCell>

        {/* Position */}
        <TableCell className="w-14 text-center">
          {renderRankBadge(rank)}
        </TableCell>

        {/* Driver */}
        <TableCell>
          <div className="flex items-center gap-2.5">
            <div
              className="w-1 h-4 rounded-full shrink-0"
              style={{ backgroundColor: theme.primary }}
            />
            <Link
              href={`/drivers/${stop.driverId}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold hover:text-primary transition-colors inline-flex items-center gap-2"
            >
              <span>{driverName}</span>
              {result?.Driver.code && (
                <span className="text-xs font-mono text-muted-foreground">
                  {result.Driver.code}
                </span>
              )}
            </Link>
          </div>
        </TableCell>

        <TableCell className="text-sm text-muted-foreground">
          {teamName}
        </TableCell>

        <TableCell className="text-center font-mono tabular-nums text-muted-foreground text-sm">
          Lap {stop.lap}
        </TableCell>

        <TableCell className="text-center font-mono tabular-nums text-muted-foreground text-sm">
          #{stop.stop}
        </TableCell>

        {/* Relative bar + duration */}
        <TableCell className="text-right min-w-[180px]">
          <div className="flex items-center justify-end gap-3">
            <div className="w-20 sm:w-28 h-1.5 rounded-full bg-zinc-800/80 overflow-hidden shrink-0">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${barPct}%`, backgroundColor: theme.primary }}
              />
            </div>
            <span className={cn(
              'font-mono font-bold tabular-nums text-sm',
              rank === 0 ? 'text-amber-400' : 'text-foreground'
            )}>
              {formatDuration(stop.duration)}
            </span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-12 text-center">Select</TableHead>
              <TableHead className="w-14 text-center">Pos</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Constructor</TableHead>
              <TableHead className="text-center w-20">Lap</TableHead>
              <TableHead className="text-center w-20">Stop</TableHead>
              <TableHead className="text-right">Pit Lane Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {normalStops.map((stop, idx) => renderRow(stop, idx))}
          </TableBody>
        </Table>
      </div>

      {incidentStops.length > 0 && (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <AlertTriangle className="size-4" />
            <span>Stationary Incidents & Extended Stops (&gt;60s)</span>
          </div>
          <Table>
            <TableBody>
              {incidentStops.map((stop) => {
                const result = raceResults.find((r) => r.Driver.driverId === stop.driverId);
                const driverName = result
                  ? `${result.Driver.givenName} ${result.Driver.familyName}`
                  : stop.driverId.replace(/_/g, ' ');
                return (
                  <TableRow key={pitStopKey(stop)} className="border-zinc-800/50 hover:bg-transparent opacity-70">
                    <TableCell className="w-12 text-center text-muted-foreground font-mono text-xs">—</TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{driverName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{result?.Constructor.name ?? stop.driverId}</TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">Lap {stop.lap}</TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">Stop #{stop.stop}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm text-amber-400">
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