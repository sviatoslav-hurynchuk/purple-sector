'use client';

import React from 'react';
import type { PitStopEntry, RaceResultEntry } from '@/types/f1';
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
    .filter((s) => !isNaN(s.durationNum) && s.durationNum > 0 && s.durationNum < ANOMALY_THRESHOLD_SECONDS)
    .sort((a, b) => a.durationNum - b.durationNum);

  const incidentStops = withDuration
    .filter((s) => isNaN(s.durationNum) || s.durationNum <= 0 || s.durationNum >= ANOMALY_THRESHOLD_SECONDS)
    .sort((a, b) => a.durationNum - b.durationNum);

  const fastestTime = normalStops[0]?.durationNum ?? 0;

  function renderRankBadge(rank: number) {
    if (rank === 0) {
      return (
        <span className="inline-flex items-center justify-center size-6 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black text-xs shadow-xs">
          <Trophy className="size-3 mr-0.5" />
          1
        </span>
      );
    }
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center size-6 rounded-md bg-zinc-400/20 border border-zinc-400/40 text-zinc-200 font-mono font-black text-xs shadow-xs">
          2
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center size-6 rounded-md bg-amber-700/20 border border-amber-700/40 text-amber-500 font-mono font-black text-xs shadow-xs">
          3
        </span>
      );
    }
    return (
      <span className="text-xs font-mono font-bold text-zinc-400 tabular-nums">
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
      <tr
        key={key}
        className={cn(
          'border-b border-white/5 transition-colors',
          canSelect && 'cursor-pointer hover:bg-zinc-900/50',
          isSelected && 'bg-zinc-900/90 border-l-2',
          !canSelect && !isSelected && 'opacity-40',
          isTopThree && !isSelected && 'bg-zinc-950/30'
        )}
        style={isSelected ? { borderLeftColor: theme.primary } : undefined}
        onClick={canSelect ? () => onToggle(key) : undefined}
      >
        {/* Checkbox */}
        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => canSelect && onToggle(key)}
            disabled={!canSelect || isLocked}
            aria-label={`Select pit stop by ${driverName} for comparison`}
            className={cn(
              'size-4 mx-auto rounded border transition-colors flex items-center justify-center cursor-pointer',
              isSelected
                ? 'border-red-500 bg-red-600 text-white'
                : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500',
              isLocked && 'cursor-not-allowed opacity-60'
            )}
          >
            {isSelected && <Check className="size-3 stroke-[3]" />}
          </button>
        </td>

        {/* Position / Rank */}
        <td className="py-2.5 px-3 w-14 text-center">
          {renderRankBadge(rank)}
        </td>

        {/* Driver */}
        <td className="py-2.5 px-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-1.5 h-4 rounded-full shrink-0"
              style={{ backgroundColor: theme.primary }}
            />
            <Link
              href={`/drivers/${stop.driverId}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-white uppercase tracking-tight hover:text-red-400 transition-colors inline-flex items-center gap-2"
            >
              <span>{driverName}</span>
              {result?.Driver.code && (
                <span className="text-[11px] font-mono text-zinc-400">
                  {result.Driver.code}
                </span>
              )}
            </Link>
          </div>
        </td>

        {/* Constructor */}
        <td className="py-2.5 px-3 text-xs font-mono text-zinc-400">
          {teamName}
        </td>

        {/* Lap */}
        <td className="py-2.5 px-3 text-center font-mono text-xs text-zinc-300 tabular-nums">
          Lap {stop.lap}
        </td>

        {/* Stop Number */}
        <td className="py-2.5 px-3 text-center font-mono text-xs text-zinc-400 tabular-nums">
          #{stop.stop}
        </td>

        {/* Duration + Progress bar */}
        <td className="py-2.5 px-3 text-right">
          <div className="flex items-center justify-end gap-3">
            <div className="hidden sm:block w-24 bg-zinc-900/80 rounded-full h-1.5 border border-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${barPct}%`, backgroundColor: theme.primary }}
              />
            </div>
            <span
              className={cn(
                'font-mono font-black tabular-nums text-sm',
                rank === 0 ? 'text-amber-400' : 'text-white'
              )}
            >
              {formatDuration(stop.duration)}
            </span>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative">
      {/* Cockpit Sub-Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 sm:px-7 py-2.5 border-b border-white/10 bg-zinc-900/30">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-amber-400" />
          <span className="font-mono text-xs font-black uppercase tracking-widest text-zinc-200">
            Fastest Pit Stops Ranking
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          Select up to 4 stops for duel simulation
        </span>
      </div>

      {/* Table Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-950/80">
              <th className="py-2.5 px-3 text-center text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider w-12">
                Select
              </th>
              <th className="py-2.5 px-3 text-center text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider w-14">
                Pos
              </th>
              <th className="py-2.5 px-3 text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                Driver
              </th>
              <th className="py-2.5 px-3 text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                Constructor
              </th>
              <th className="py-2.5 px-3 text-center text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider w-20">
                Lap
              </th>
              <th className="py-2.5 px-3 text-center text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider w-20">
                Stop
              </th>
              <th className="py-2.5 px-3 text-right text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                Pit Lane Time
              </th>
            </tr>
          </thead>
          <tbody>
            {normalStops.map((stop, idx) => renderRow(stop, idx))}
          </tbody>
        </table>
      </div>

      {/* Incident stops bottom panel */}
      {incidentStops.length > 0 && (
        <div className="border-t border-white/10 bg-zinc-950/70 p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
            <AlertTriangle className="size-4" />
            <span>Stationary Incidents &amp; Extended Stops (&gt;60s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody>
                {incidentStops.map((stop) => {
                  const result = raceResults.find((r) => r.Driver.driverId === stop.driverId);
                  const driverName = result
                    ? `${result.Driver.givenName} ${result.Driver.familyName}`
                    : stop.driverId.replace(/_/g, ' ');
                  return (
                    <tr key={pitStopKey(stop)} className="border-b border-white/5 opacity-75 hover:opacity-100 transition-opacity">
                      <td className="py-2 px-3 w-12 text-center text-zinc-500 font-mono text-xs">—</td>
                      <td className="py-2 px-3 text-sm font-bold text-white uppercase">{driverName}</td>
                      <td className="py-2 px-3 text-xs font-mono text-zinc-400">{result?.Constructor.name ?? stop.driverId}</td>
                      <td className="py-2 px-3 text-center text-xs font-mono text-zinc-400">Lap {stop.lap}</td>
                      <td className="py-2 px-3 text-center text-xs font-mono text-zinc-400">Stop #{stop.stop}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-sm text-amber-400">
                        {formatDuration(stop.duration)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}