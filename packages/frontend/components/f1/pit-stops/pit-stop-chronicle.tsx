'use client';

import React from 'react';
import type { PitStopEntry, RaceResultEntry } from '@/types/f1';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTeamTheme } from '@/lib/team-colors';
import { AlertTriangle, Check } from 'lucide-react';
import Link from 'next/link';

interface PitStopChronicleProps {
  pitStops: PitStopEntry[];
  raceResults: RaceResultEntry[];
  selectedIds: Set<string>;
  onToggle: (key: string) => void;
}

export function pitStopKey(stop: PitStopEntry): string {
  return `${stop.driverId}:${stop.stop}`;
}

/**
 * Parses Ergast/Jolpica pit stop duration into total seconds.
 * Correctly parses both "SS.mmm" (e.g. "24.474") and "MM:SS.mmm" (e.g. "1:14.195" or "35:54.149" under Red Flag).
 */
export function parseDurationToSeconds(duration: string): number {
  if (!duration) return 0;
  if (duration.includes(':')) {
    const parts = duration.split(':');
    if (parts.length === 2) {
      const mins = parseFloat(parts[0]) || 0;
      const secs = parseFloat(parts[1]) || 0;
      return mins * 60 + secs;
    }
    if (parts.length === 3) {
      const hrs = parseFloat(parts[0]) || 0;
      const mins = parseFloat(parts[1]) || 0;
      const secs = parseFloat(parts[2]) || 0;
      return hrs * 3600 + mins * 60 + secs;
    }
  }
  return parseFloat(duration) || 0;
}

export function formatDuration(raw: string): string {
  if (!raw) return '—';
  if (raw.includes(':')) {
    return raw;
  }
  const num = parseFloat(raw);
  if (isNaN(num)) return raw;
  if (num >= 60) {
    const mins = Math.floor(num / 60);
    const secs = (num % 60).toFixed(3).padStart(6, '0');
    return `${mins}:${secs}`;
  }
  return `${num.toFixed(3)}s`;
}

export function PitStopChronicle({
  pitStops,
  raceResults,
  selectedIds,
  onToggle,
}: PitStopChronicleProps) {
  const maxSelections = 4;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="w-12 text-center">Select</TableHead>
            <TableHead className="text-center w-16">Lap</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Constructor</TableHead>
            <TableHead className="text-center w-16">Stop</TableHead>
            <TableHead className="text-right">Duration</TableHead>
            <TableHead className="text-right">Time of Day</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pitStops.map((stop) => {
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
            const durationSec = parseDurationToSeconds(stop.duration);
            const isAnomaly = durationSec >= 60;

            return (
              <TableRow
                key={key}
                className={cn(
                  'border-zinc-800/80 transition-colors',
                  canSelect && 'cursor-pointer hover:bg-zinc-900/60',
                  isSelected && 'bg-zinc-900/90 border-l-2',
                  !canSelect && !isSelected && 'opacity-40'
                )}
                style={isSelected ? { borderLeftColor: theme.primary } : undefined}
                onClick={canSelect ? () => onToggle(key) : undefined}
              >
                {/* Checkbox */}
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => canSelect && onToggle(key)}
                    disabled={!canSelect}
                    aria-label={`Select pit stop by ${driverName} on lap ${stop.lap}`}
                    className={cn(
                      'size-4 mx-auto rounded border transition-colors flex items-center justify-center',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                    )}
                  >
                    {isSelected && <Check className="size-3 stroke-[3]" />}
                  </button>
                </TableCell>

                <TableCell className="text-center font-mono font-bold tabular-nums text-foreground">
                  {stop.lap}
                </TableCell>

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

                <TableCell className="text-center font-mono tabular-nums text-muted-foreground">
                  #{stop.stop}
                </TableCell>

                <TableCell className="text-right font-mono font-bold tabular-nums">
                  <div className="flex items-center justify-end gap-2">
                    <span className={cn(isAnomaly ? 'text-amber-400' : 'text-foreground')}>
                      {formatDuration(stop.duration)}
                    </span>
                    {isAnomaly && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] px-1.5 py-0 gap-1"
                      >
                        <AlertTriangle className="size-2.5" />
                        Incident
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-right font-mono text-xs text-muted-foreground tabular-nums">
                  {stop.time}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}