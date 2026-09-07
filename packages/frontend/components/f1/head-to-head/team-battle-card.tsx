'use client';

import React, { useState } from 'react';
import type { TeammatePairBattle } from '@/types/f1';
import { TeamLogo } from '@/components/f1/team-logo';
import { DriverImage } from '@/components/f1/driver-image';
import { CountryFlag } from '@/components/f1/country-flag';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { getTeamTheme } from '@/lib/team-colors';
import { cn } from '@/lib/utils';
import { BattleModal } from './battle-modal';
import { ChevronRight, Zap, Trophy, TrendingUp } from 'lucide-react';

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
  const [selectedBattleId, setSelectedBattleId] = useState<string>(
    battles.find((b) => b.isPrimary)?.id || battles[0]?.id || ''
  );
  const [modalOpen, setModalOpen] = useState(false);

  const activeBattle =
    battles.find((b) => b.id === selectedBattleId) || battles[0];
  if (!activeBattle) return null;

  const { constructorId, constructorName, driver1, driver2, stats, rounds } =
    activeBattle;
  const theme = getTeamTheme(constructorId);
  const isLight = theme.textColor === 'dark';

  const seasonStr = String(season);
  const seasonNum = parseInt(seasonStr, 10);
  const isModernSeason = !isNaN(seasonNum) && seasonNum >= 2024;
  const d1Photo = getDriverPhotoUrl(
    driver1.driverId,
    driver1.givenName,
    driver1.familyName,
    seasonStr,
    constructorId,
    'left'
  );
  const d2Photo = getDriverPhotoUrl(
    driver2.driverId,
    driver2.givenName,
    driver2.familyName,
    seasonStr,
    constructorId,
    'right'
  );

  const deltaFormatted =
    stats.qualifying.medianDeltaMs !== 0
      ? `${(Math.abs(stats.qualifying.medianDeltaMs) / 1000).toFixed(3)}s`
      : '0.000s';
  const d1Faster = stats.qualifying.medianDeltaMs < 0;

  // Driver numbers
  const d1Num = driver1.permanentNumber || driver1.code;
  const d2Num = driver2.permanentNumber || driver2.code;

  // Proportional metrics & progress bar calculations
  // 1. Qualifying
  const qD1 = stats.qualifying.d1Wins;
  const qD2 = stats.qualifying.d2Wins;
  const qTotal = Math.max(1, qD1 + qD2);
  const qD1Pct = Math.round((qD1 / qTotal) * 100);
  const qD2Pct = 100 - qD1Pct;

  // 2. Races
  const rD1 = stats.race.d1Wins;
  const rD2 = stats.race.d2Wins;
  const rTotal = Math.max(1, rD1 + rD2);
  const rD1Pct = Math.round((rD1 / rTotal) * 100);
  const rD2Pct = 100 - rD1Pct;

  // 3. Points (precision fixed to 1 decimal place max)
  const d1PtsShare = Number(stats.points.d1SharePercent.toFixed(1));
  const d2PtsShare = Number((100 - d1PtsShare).toFixed(1));
  const pD1 = stats.points.d1Points;
  const pD2 = stats.points.d2Points;
  const pTotal = Math.max(1, pD1 + pD2);
  const pD1Pct = Math.round((pD1 / pTotal) * 100);
  const pD2Pct = 100 - pD1Pct;

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className={[
          'group relative rounded-2xl border border-white/10 overflow-hidden shadow-xl flex flex-col',
          'bg-card hover:border-white/25 transition-all duration-300 hover:shadow-2xl cursor-pointer select-none',
          className,
        ].join(' ')}
      >
        {/* ── Top Header Strip (Full-bleed team theme) ────────────────────── */}
        <div
          className="p-4 sm:p-5 flex items-center justify-between border-b border-black/15 transition-all group-hover:brightness-105"
          style={{ backgroundColor: theme.primary }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <TeamLogo constructorId={constructorId} season={season} size={30} />
            <div className="min-w-0">
              <h2
                className={[
                  'text-xl sm:text-2xl font-black uppercase tracking-tight truncate',
                  isLight ? 'text-black' : 'text-white',
                ].join(' ')}
              >
                {constructorName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mid-season driver pairing toggle (e.g. Williams 2024: Sargeant / Colapinto) */}
            {battles.length > 1 && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={[
                  'flex items-center gap-1 p-1 rounded-lg border backdrop-blur-sm text-[10px] font-mono font-bold',
                  isLight
                    ? 'bg-black/10 border-black/20 text-black'
                    : 'bg-white/10 border-white/20 text-white',
                ].join(' ')}
              >
                {battles.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBattleId(b.id)}
                    className={[
                      'px-2 py-0.5 rounded transition-colors',
                      b.id === selectedBattleId
                        ? isLight
                          ? 'bg-black text-white'
                          : 'bg-white text-black'
                        : 'opacity-70 hover:opacity-100',
                    ].join(' ')}
                  >
                    {b.driver1.code}/{b.driver2.code}
                  </button>
                ))}
              </div>
            )}

            <div
              className={[
                'hidden sm:block text-right px-3 py-1 rounded-lg border backdrop-blur-sm',
                isLight
                  ? 'bg-black/10 border-black/20 text-black'
                  : 'bg-white/10 border-white/20 text-white',
              ].join(' ')}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                RACES
              </span>
              <span className="text-sm font-black font-mono">
                {rounds.length} GPs
              </span>
            </div>
          </div>
        </div>

        {/* ── Driver Showcase (Split 2-column arena with authentic cutouts) ── */}
        <div
          className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10 relative"
          style={{
            background: `linear-gradient(180deg, ${theme.primary}25 0%, ${theme.primary}0e 45%, rgba(12,12,14,0.96) 100%)`,
          }}
        >
          {/* Driver 1 (Left) */}
          <div className="relative overflow-hidden min-h-[170px] sm:min-h-[195px] flex flex-col justify-between p-4 sm:p-5">
            <div className="relative z-10 space-y-0.5 max-w-[65%]">
              <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider drop-shadow-sm">
                {driver1.givenName}
              </p>
              <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight transition-colors drop-shadow-sm truncate">
                {driver1.familyName}
              </h3>
              {d1Num && (
                <p className="text-2xl sm:text-3xl font-black italic text-white/35 font-mono">
                  #{d1Num}
                </p>
              )}
            </div>

            <div className="relative z-10 mt-auto pt-2">
              <CountryFlag countryName={driver1.nationality} />
            </div>

            {/* Authentic Driver 1 Cutout Photo */}
            <div
              className={cn(
                'absolute top-1 pointer-events-none select-none',
                isModernSeason
                  ? 'h-[275%] sm:h-[290%] w-[82%] sm:w-[76%] -right-3 sm:-right-1'
                  : 'h-[115%] w-[62%] -right-2 sm:right-0'
              )}
            >
              <DriverImage
                src={d1Photo}
                alt={`${driver1.givenName} ${driver1.familyName}`}
                fill
                sizes="(max-width: 640px) 250px, 300px"
                className="object-contain object-top transition-transform duration-300 group-hover:scale-105 origin-top drop-shadow-lg"
              />
            </div>
          </div>

          {/* Driver 2 (Right) */}
          <div className="relative overflow-hidden min-h-[170px] sm:min-h-[195px] flex flex-col justify-between p-4 sm:p-5">
            <div className="relative z-10 space-y-0.5 max-w-[65%]">
              <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider drop-shadow-sm">
                {driver2.givenName}
              </p>
              <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight transition-colors drop-shadow-sm truncate">
                {driver2.familyName}
              </h3>
              {d2Num && (
                <p className="text-2xl sm:text-3xl font-black italic text-white/35 font-mono">
                  #{d2Num}
                </p>
              )}
            </div>

            <div className="relative z-10 mt-auto pt-2">
              <CountryFlag countryName={driver2.nationality} />
            </div>

            {/* Authentic Driver 2 Cutout Photo */}
            <div
              className={cn(
                'absolute top-1 pointer-events-none select-none',
                isModernSeason
                  ? 'h-[275%] sm:h-[290%] w-[82%] sm:w-[76%] -right-3 sm:-right-1'
                  : 'h-[115%] w-[62%] -right-2 sm:right-0'
              )}
            >
              <DriverImage
                src={d2Photo}
                alt={`${driver2.givenName} ${driver2.familyName}`}
                fill
                sizes="(max-width: 640px) 250px, 300px"
                className="object-contain object-top transition-transform duration-300 group-hover:scale-105 origin-top drop-shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* ── Broadcast Duel Scoreboard ────────────────────────────────────── */}
        <div className="bg-zinc-950 p-4 sm:p-5 space-y-3">
          {/* Qualifying Scoreline */}
          {(discipline === 'all' || discipline === 'qualifying') && (
            <div className="bg-zinc-900/60 rounded-xl p-3 sm:px-4 sm:py-3 border border-zinc-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      'font-mono text-xl sm:text-2xl font-black tabular-nums',
                      qD1 >= qD2 ? 'text-white' : 'text-zinc-500',
                    ].join(' ')}
                  >
                    {qD1}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-zinc-400">
                    {driver1.code}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                    <Zap className="size-3 text-yellow-400" />
                    <span>Qualifying</span>
                  </div>
                  {stats.qualifying.medianDeltaMs !== 0 && (
                    <span className="text-[10px] font-mono font-semibold text-zinc-400 mt-0.5">
                      {d1Faster ? `${driver1.code} -${deltaFormatted}` : `${driver2.code} -${deltaFormatted}`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-zinc-400">
                    {driver2.code}
                  </span>
                  <span
                    className={[
                      'font-mono text-xl sm:text-2xl font-black tabular-nums',
                      qD2 >= qD1 ? 'text-white' : 'text-zinc-500',
                    ].join(' ')}
                  >
                    {qD2}
                  </span>
                </div>
              </div>

              {/* Proportional Progress Bar in team color for better driver */}
              <div className="h-1.5 sm:h-2 w-full bg-zinc-800/60 rounded-full overflow-hidden flex items-center mt-2.5">
                <div
                  className="h-full rounded-l-full transition-all duration-500"
                  style={{
                    width: `${qD1Pct}%`,
                    backgroundColor: qD1 > qD2 ? theme.primary : qD1 === qD2 ? `${theme.primary}99` : '#3f3f46',
                  }}
                />
                <div className="w-0.5 h-full bg-zinc-950 shrink-0" />
                <div
                  className="h-full rounded-r-full transition-all duration-500"
                  style={{
                    width: `${qD2Pct}%`,
                    backgroundColor: qD2 > qD1 ? theme.primary : qD1 === qD2 ? `${theme.primary}99` : '#3f3f46',
                  }}
                />
              </div>
            </div>
          )}

          {/* Race Finish Scoreline */}
          {(discipline === 'all' || discipline === 'race') && (
            <div className="bg-zinc-900/60 rounded-xl p-3 sm:px-4 sm:py-3 border border-zinc-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      'font-mono text-xl sm:text-2xl font-black tabular-nums',
                      rD1 >= rD2 ? 'text-amber-400' : 'text-zinc-500',
                    ].join(' ')}
                  >
                    {rD1}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-zinc-400">
                    {driver1.code}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                    <Trophy className="size-3 text-amber-400" />
                    <span>Races Ahead</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 mt-0.5">
                    {stats.race.bothFinishedCount} both finished
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-zinc-400">
                    {driver2.code}
                  </span>
                  <span
                    className={[
                      'font-mono text-xl sm:text-2xl font-black tabular-nums',
                      rD2 >= rD1 ? 'text-amber-400' : 'text-zinc-500',
                    ].join(' ')}
                  >
                    {rD2}
                  </span>
                </div>
              </div>

              {/* Proportional Progress Bar in team color for better driver */}
              <div className="h-1.5 sm:h-2 w-full bg-zinc-800/60 rounded-full overflow-hidden flex items-center mt-2.5">
                <div
                  className="h-full rounded-l-full transition-all duration-500"
                  style={{
                    width: `${rD1Pct}%`,
                    backgroundColor: rD1 > rD2 ? theme.primary : rD1 === rD2 ? `${theme.primary}99` : '#3f3f46',
                  }}
                />
                <div className="w-0.5 h-full bg-zinc-950 shrink-0" />
                <div
                  className="h-full rounded-r-full transition-all duration-500"
                  style={{
                    width: `${rD2Pct}%`,
                    backgroundColor: rD2 > rD1 ? theme.primary : rD1 === rD2 ? `${theme.primary}99` : '#3f3f46',
                  }}
                />
              </div>
            </div>
          )}

          {/* Points Share Scoreline */}
          {(discipline === 'all' || discipline === 'points') && (
            <div className="bg-zinc-900/60 rounded-xl p-3 sm:px-4 sm:py-3 border border-zinc-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      'font-mono text-lg sm:text-xl font-black tabular-nums',
                      pD1 >= pD2 ? 'text-white' : 'text-zinc-500',
                    ].join(' ')}
                  >
                    {pD1}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    pts
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                    <TrendingUp className="size-3 text-emerald-400" />
                    <span>Points</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-zinc-400 mt-0.5">
                    <span className={pD1 >= pD2 ? 'text-white font-bold' : ''}>
                      {d1PtsShare}%
                    </span>
                    <span>/</span>
                    <span className={pD2 >= pD1 ? 'text-white font-bold' : ''}>
                      {d2PtsShare}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400">
                    pts
                  </span>
                  <span
                    className={[
                      'font-mono text-lg sm:text-xl font-black tabular-nums',
                      pD2 >= pD1 ? 'text-white' : 'text-zinc-500',
                    ].join(' ')}
                  >
                    {pD2}
                  </span>
                </div>
              </div>

              {/* Proportional Progress Bar in team color for better driver */}
              <div className="h-1.5 sm:h-2 w-full bg-zinc-800/60 rounded-full overflow-hidden flex items-center mt-2.5">
                <div
                  className="h-full rounded-l-full transition-all duration-500"
                  style={{
                    width: `${pD1Pct}%`,
                    backgroundColor: pD1 > pD2 ? theme.primary : pD1 === pD2 ? `${theme.primary}99` : '#3f3f46',
                  }}
                />
                <div className="w-0.5 h-full bg-zinc-950 shrink-0" />
                <div
                  className="h-full rounded-r-full transition-all duration-500"
                  style={{
                    width: `${pD2Pct}%`,
                    backgroundColor: pD2 > pD1 ? theme.primary : pD1 === pD2 ? `${theme.primary}99` : '#3f3f46',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom Action Trigger ────────────────────────────────────────── */}
        <div className="px-5 py-3 bg-zinc-900/50 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400 group-hover:text-white transition-colors">
          <span className="font-mono text-[11px] uppercase tracking-wider">
            View Radar &amp; GP Breakdown
          </span>
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-1 text-zinc-400 group-hover:text-white" />
        </div>
      </div>

      {/* Deep Dive Modal */}
      <BattleModal
        battle={activeBattle}
        season={season}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
