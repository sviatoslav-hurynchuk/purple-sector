'use client';

import React, { useState } from 'react';
import type { TeammatePairBattle } from '@/types/f1';
import { TeamLogo } from '@/components/f1/team-logo';
import { DriverImage } from '@/components/f1/driver-image';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { getTeamTheme } from '@/lib/team-colors';
import { BattleModal } from './battle-modal';
import { Trophy, Zap, Clock, ChevronRight } from 'lucide-react';

interface TeamBattleCardProps {
  /** Either a single battle or a list of battles for this constructor (primary + alternates) */
  battles: TeammatePairBattle[];
  season: string | number;
  discipline?: 'all' | 'qualifying' | 'race' | 'points';
  className?: string;
}

export function TeamBattleCard({
  battles,
  season,
  discipline = 'all',
  className = '',
}: TeamBattleCardProps) {
  // If multiple pairings exist for this team, allow switching
  const [selectedBattleId, setSelectedBattleId] = useState<string>(
    battles.find((b) => b.isPrimary)?.id || battles[0]?.id || ''
  );
  const [modalOpen, setModalOpen] = useState(false);

  const activeBattle =
    battles.find((b) => b.id === selectedBattleId) || battles[0];
  if (!activeBattle) return null;

  const { constructorId, constructorName, driver1, driver2, stats, rounds } =
    activeBattle;
  const teamTheme = getTeamTheme(constructorId);
  const primaryColor = teamTheme.primary;

  const seasonStr = String(season);
  const d1Photo = getDriverPhotoUrl(
    driver1.driverId,
    constructorId,
    seasonStr,
    driver1.givenName,
    driver1.familyName
  );
  const d2Photo = getDriverPhotoUrl(
    driver2.driverId,
    constructorId,
    seasonStr,
    driver2.givenName,
    driver2.familyName
  );

  const deltaFormatted =
    stats.qualifying.medianDeltaMs !== 0
      ? `${(Math.abs(stats.qualifying.medianDeltaMs) / 1000).toFixed(3)}s`
      : '0.000s';
  const d1Faster = stats.qualifying.medianDeltaMs < 0;

  // Proportional percentages
  const qTotal = Math.max(1, stats.qualifying.d1Wins + stats.qualifying.d2Wins);
  const qD1Pct = Math.round((stats.qualifying.d1Wins / qTotal) * 100);

  const rTotal = Math.max(1, stats.race.d1Wins + stats.race.d2Wins);
  const rD1Pct = Math.round((stats.race.d1Wins / rTotal) * 100);

  const ptsD1Pct = stats.points.d1SharePercent;

  return (
    <>
      <div
        className={`group relative rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/70 via-zinc-950/90 to-zinc-950 p-5 shadow-lg hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl flex flex-col justify-between ${className}`}
      >
        {/* Top constructor accent line */}
        <div
          className="absolute top-0 inset-x-0 h-[2px] rounded-t-2xl opacity-80 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: primaryColor }}
        />

        {/* Card Header: Constructor Logo, Name, Alternate Pairing Toggle */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/60 pb-3.5">
          <div className="flex items-center gap-3">
            <TeamLogo constructorId={constructorId} size={36} />
            <div>
              <h3 className="font-bold text-white text-base tracking-tight leading-tight group-hover:text-zinc-100 transition-colors">
                {constructorName}
              </h3>
              <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                <span>{rounds.length} Rounds</span>
                <span>•</span>
                <span className="text-zinc-300 font-semibold">
                  {stats.points.total} pts
                </span>
              </div>
            </div>
          </div>

          {/* Alternate pairings switch if team had driver swaps */}
          {battles.length > 1 && (
            <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800 text-[10px] font-mono">
              {battles.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBattleId(b.id)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    b.id === selectedBattleId
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title={`${b.driver1.code} vs ${b.driver2.code} (${b.rounds.length} races)`}
                >
                  {b.driver1.code} / {b.driver2.code}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Driver Face-off Showcase */}
        <div className="my-4 grid grid-cols-12 items-center gap-2">
          {/* Driver 1 (Left) */}
          <div className="col-span-4 flex flex-col items-center text-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gradient-to-t from-zinc-900 to-zinc-800/80 border border-zinc-700/60 shadow-inner group/photo">
              <DriverImage
                src={d1Photo}
                alt={`${driver1.givenName} ${driver1.familyName}`}
                fill
                sizes="(max-width: 640px) 80px, 96px"
                className="object-cover object-top scale-105 group-hover/photo:scale-110 transition-transform duration-300"
              />
              <div
                className="absolute bottom-0 inset-x-0 h-1"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
            <div className="mt-2">
              <div className="font-bold text-white text-sm tracking-tight truncate max-w-[110px]">
                {driver1.familyName}
              </div>
              <div
                className="inline-block text-[11px] font-mono font-bold px-1.5 py-0.2 rounded mt-0.5"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor,
                }}
              >
                {driver1.code} #{driver1.permanentNumber || '—'}
              </div>
            </div>
          </div>

          {/* Middle VS Badge & Median Qualy Gap */}
          <div className="col-span-4 flex flex-col items-center justify-center text-center">
            <span className="text-zinc-600 font-mono text-xs font-bold uppercase tracking-widest">
              VS
            </span>
            {stats.qualifying.medianDeltaMs !== 0 && (
              <div className="mt-1.5 flex flex-col items-center">
                <span className="text-[10px] text-zinc-500 font-mono uppercase">
                  Avg Gap
                </span>
                <span
                  className="font-mono text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 border"
                  style={{
                    backgroundColor: d1Faster
                      ? `${primaryColor}15`
                      : 'rgba(148, 163, 184, 0.15)',
                    borderColor: d1Faster
                      ? `${primaryColor}40`
                      : 'rgba(148, 163, 184, 0.3)',
                    color: d1Faster ? primaryColor : '#cbd5e1',
                  }}
                >
                  {d1Faster
                    ? `${driver1.code} -${deltaFormatted}`
                    : `${driver2.code} -${deltaFormatted}`}
                </span>
              </div>
            )}
          </div>

          {/* Driver 2 (Right) */}
          <div className="col-span-4 flex flex-col items-center text-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gradient-to-t from-zinc-900 to-zinc-800/80 border border-zinc-700/60 shadow-inner group/photo">
              <DriverImage
                src={d2Photo}
                alt={`${driver2.givenName} ${driver2.familyName}`}
                fill
                sizes="(max-width: 640px) 80px, 96px"
                className="object-cover object-top scale-105 group-hover/photo:scale-110 transition-transform duration-300"
              />
              <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-500" />
            </div>
            <div className="mt-2">
              <div className="font-bold text-slate-200 text-sm tracking-tight truncate max-w-[110px]">
                {driver2.familyName}
              </div>
              <div className="inline-block text-[11px] font-mono font-bold px-1.5 py-0.2 rounded mt-0.5 bg-slate-800 text-slate-300">
                {driver2.code} #{driver2.permanentNumber || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Head-to-Head Bars */}
        <div className="flex flex-col gap-3 my-2 pt-2 border-t border-zinc-800/60">
          {/* 1. Qualifying Bar */}
          {(discipline === 'all' || discipline === 'qualifying') && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-white flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  {stats.qualifying.d1Wins}
                </span>
                <span className="text-[11px] text-zinc-400 font-sans uppercase tracking-wider font-semibold">
                  Qualifying
                </span>
                <span className="font-bold text-slate-300">
                  {stats.qualifying.d2Wins}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden flex">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${qD1Pct}%`,
                    backgroundColor: primaryColor,
                  }}
                />
                <div
                  className="h-full bg-slate-500 transition-all duration-500"
                  style={{ width: `${100 - qD1Pct}%` }}
                />
              </div>
            </div>
          )}

          {/* 2. Race Bar */}
          {(discipline === 'all' || discipline === 'race') && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-white flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  {stats.race.d1Wins}
                </span>
                <span className="text-[11px] text-zinc-400 font-sans uppercase tracking-wider font-semibold">
                  Race Finish
                </span>
                <span className="font-bold text-slate-300">
                  {stats.race.d2Wins}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden flex">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${rD1Pct}%`,
                    backgroundColor: primaryColor,
                  }}
                />
                <div
                  className="h-full bg-slate-500 transition-all duration-500"
                  style={{ width: `${100 - rD1Pct}%` }}
                />
              </div>
            </div>
          )}

          {/* 3. Points Bar */}
          {(discipline === 'all' || discipline === 'points') && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-white">
                  {stats.points.d1Points} pts ({ptsD1Pct}%)
                </span>
                <span className="text-[11px] text-zinc-400 font-sans uppercase tracking-wider font-semibold">
                  Points
                </span>
                <span className="font-bold text-slate-300">
                  {stats.points.d2Points} pts ({(100 - ptsD1Pct).toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden flex">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${ptsD1Pct}%`,
                    backgroundColor: primaryColor,
                  }}
                />
                <div
                  className="h-full bg-slate-500 transition-all duration-500"
                  style={{ width: `${100 - ptsD1Pct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Secondary Stats Pill Row */}
        <div className="mt-3 pt-3 border-t border-zinc-800/60 grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
          <div className="p-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
            <span className="text-zinc-500 block text-[10px]">Poles</span>
            <span className="text-white font-bold">
              {stats.qualifying.d1Poles} - {stats.qualifying.d2Poles}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
            <span className="text-zinc-500 block text-[10px]">Podiums</span>
            <span className="text-white font-bold">
              {stats.podiums.d1} - {stats.podiums.d2}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
            <span className="text-zinc-500 block text-[10px]">Fastest Laps</span>
            <span className="text-white font-bold">
              {stats.fastestLaps.d1} - {stats.fastestLaps.d2}
            </span>
          </div>
        </div>

        {/* Action Button to Open Full Analysis Modal */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-4 w-full py-2.5 px-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-2 group/btn shadow-sm"
        >
          <span>Full H2H Breakdown & Radar</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover/btn:translate-x-0.5 group-hover/btn:text-white transition-all" />
        </button>
      </div>

      {/* Deep-Dive Analysis Modal */}
      <BattleModal
        battle={activeBattle}
        season={season}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
