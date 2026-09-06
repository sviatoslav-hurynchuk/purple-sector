'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { TeammatePairBattle } from '@/types/f1';
import { TeamLogo } from '@/components/f1/team-logo';
import { DriverImage } from '@/components/f1/driver-image';
import { CountryFlag } from '@/components/f1/country-flag';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { getTeamTheme } from '@/lib/team-colors';
import { RadarChart } from './radar-chart';
import { RoundTimeline } from './round-timeline';
import { BattleModal } from './battle-modal';
import {
  Swords,
  Zap,
  Trophy,
  TrendingUp,
  Maximize2,
  ChevronRight,
  Target,
  Clock,
  Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArenaFaceoffHeroProps {
  battles: TeammatePairBattle[];
  season: string | number;
  className?: string;
}

export function ArenaFaceoffHero({
  battles,
  season,
  className = '',
}: ArenaFaceoffHeroProps) {
  const [selectedBattleId, setSelectedBattleId] = useState<string>(
    battles.find((b) => b.isPrimary)?.id || battles[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'radar' | 'timeline' | 'stats'>('radar');
  const [modalOpen, setModalOpen] = useState(false);

  const activeBattle =
    battles.find((b) => b.id === selectedBattleId) || battles[0];
  if (!activeBattle) return null;

  const { constructorId, constructorName, driver1, driver2, stats, rounds } =
    activeBattle;
  const theme = getTeamTheme(constructorId);

  const seasonStr = String(season);
  const d1Photo = getDriverPhotoUrl(
    driver1.driverId,
    driver1.givenName,
    driver1.familyName,
    seasonStr,
    constructorId
  );
  const d2Photo = getDriverPhotoUrl(
    driver2.driverId,
    driver2.givenName,
    driver2.familyName,
    seasonStr,
    constructorId
  );

  const deltaFormatted =
    stats.qualifying.medianDeltaMs !== 0
      ? `${(Math.abs(stats.qualifying.medianDeltaMs) / 1000).toFixed(3)}s`
      : '0.000s';
  const d1Faster = stats.qualifying.medianDeltaMs < 0;

  // Driver numbers
  const d1Num = driver1.permanentNumber || driver1.code;
  const d2Num = driver2.permanentNumber || driver2.code;

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

  // 3. Points
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
        className={cn(
          'relative rounded-3xl border border-white/10 overflow-hidden bg-zinc-950 shadow-2xl',
          className
        )}
      >
        {/* Subtle top ambient glow from team color */}
        <div
          className="absolute top-0 inset-x-0 h-40 opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: theme.primary }}
        />

        {/* ── Arena Top Bar ─────────────────────────────────────────────── */}
        <div className="relative p-5 sm:p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-zinc-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <TeamLogo constructorId={constructorId} season={season} size={36} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                  {constructorName}
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {rounds.length} GPs
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Official {season} teammate telemetry & performance face-off
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mid-season pairings switcher */}
            {battles.length > 1 && (
              <div className="flex items-center gap-1 p-1 rounded-lg border border-white/10 bg-zinc-900 text-xs font-mono">
                {battles.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBattleId(b.id)}
                    className={cn(
                      'px-2.5 py-1 rounded transition-colors cursor-pointer',
                      b.id === selectedBattleId
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    {b.driver2.code}
                  </button>
                ))}
              </div>
            )}

            {/* Fullscreen Dialog Trigger */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-white/10 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Open full-screen modal"
            >
              <Maximize2 className="size-3.5" />
              <span className="hidden sm:inline">Fullscreen Analysis</span>
            </button>
          </div>
        </div>

        {/* ── Main Face-Off Stage ─────────────────────────────────────────── */}
        <div className="relative p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center border-b border-white/5">
          {/* Driver 1 (Left Champion) */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-center text-center sm:text-left lg:text-center gap-4 relative">
            {/* Cutout Hero Frame */}
            <Link
              href={`/drivers/${driver1.driverId}`}
              className="group relative size-44 sm:size-48 lg:size-52 rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 overflow-hidden shadow-xl hover:border-white/30 transition-all shrink-0"
            >
              <DriverImage
                src={d1Photo}
                alt={`${driver1.givenName} ${driver1.familyName}`}
                fill
                sizes="240px"
                className="object-contain object-top pt-2 scale-105 group-hover:scale-110 transition-transform duration-300 origin-top"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-xs font-mono font-black text-white">
                #{d1Num}
              </div>
            </Link>

            {/* Info */}
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start lg:justify-center gap-1.5 text-xs text-zinc-400">
                <CountryFlag countryName={driver1.nationality} />
                <span>{driver1.nationality}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                <span className="text-zinc-400 text-lg sm:text-xl font-medium block">
                  {driver1.givenName}
                </span>
                {driver1.familyName}
              </h3>
              <div className="flex items-center justify-center sm:justify-start lg:justify-center gap-2 pt-1 font-mono text-xs text-zinc-300">
                <span className="font-bold text-amber-400">{stats.points.d1Points} pts</span>
                <span>•</span>
                <span>{stats.wins.d1}W</span>
                <span>•</span>
                <span>{stats.podiums.d1}P</span>
              </div>
            </div>
          </div>

          {/* Center Battle Core (Quick duel metrics) */}
          <div className="lg:col-span-4 flex flex-col items-center space-y-5 px-2">
            {/* VS Badge */}
            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
              <div
                className="size-11 rounded-full flex items-center justify-center text-xs font-black font-mono tracking-widest border shadow-lg"
                style={{
                  borderColor: `${theme.primary}80`,
                  backgroundColor: '#09090b',
                  color: theme.primary,
                  boxShadow: `0 0 15px ${theme.primary}30`,
                }}
              >
                VS
              </div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
            </div>

            {/* Duel Metric Bars Container */}
            <div className="w-full space-y-4 bg-zinc-900/60 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
              {/* 1. Qualifying Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={cn('font-black', qD1 >= qD2 ? 'text-white' : 'text-zinc-400')}>
                    {qD1} <span className="text-[10px] font-normal text-zinc-500">{driver1.code}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Zap className="size-3 text-amber-400" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                      Qualifying
                    </span>
                    {deltaFormatted !== '0.000s' && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                        style={{
                          backgroundColor: `${theme.primary}25`,
                          color: theme.primary,
                        }}
                      >
                        {d1Faster ? driver1.code : driver2.code} -{deltaFormatted}
                      </span>
                    )}
                  </div>
                  <span className={cn('font-black', qD2 >= qD1 ? 'text-white' : 'text-zinc-400')}>
                    <span className="text-[10px] font-normal text-zinc-500">{driver2.code}</span> {qD2}
                  </span>
                </div>

                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${qD1Pct}%`,
                      backgroundColor: qD1 >= qD2 ? theme.primary : '#52525b',
                    }}
                  />
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${qD2Pct}%`,
                      backgroundColor: qD2 >= qD1 ? theme.primary : '#52525b',
                    }}
                  />
                </div>
              </div>

              {/* 2. Races Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={cn('font-black', rD1 >= rD2 ? 'text-white' : 'text-zinc-400')}>
                    {rD1} <span className="text-[10px] font-normal text-zinc-500">{driver1.code}</span>
                  </span>
                  <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                    <Trophy className="size-3 text-amber-400" />
                    <span>Races Ahead</span>
                  </div>
                  <span className={cn('font-black', rD2 >= rD1 ? 'text-white' : 'text-zinc-400')}>
                    <span className="text-[10px] font-normal text-zinc-500">{driver2.code}</span> {rD2}
                  </span>
                </div>

                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${rD1Pct}%`,
                      backgroundColor: rD1 >= rD2 ? theme.primary : '#52525b',
                    }}
                  />
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${rD2Pct}%`,
                      backgroundColor: rD2 >= rD1 ? theme.primary : '#52525b',
                    }}
                  />
                </div>
              </div>

              {/* 3. Points Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={cn('font-black', pD1 >= pD2 ? 'text-white' : 'text-zinc-400')}>
                    {pD1} <span className="text-[10px] font-normal text-zinc-500">({d1PtsShare}%)</span>
                  </span>
                  <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                    <TrendingUp className="size-3 text-emerald-400" />
                    <span>Points Share</span>
                  </div>
                  <span className={cn('font-black', pD2 >= pD1 ? 'text-white' : 'text-zinc-400')}>
                    <span className="text-[10px] font-normal text-zinc-500">({d2PtsShare}%)</span> {pD2}
                  </span>
                </div>

                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${pD1Pct}%`,
                      backgroundColor: pD1 >= pD2 ? theme.primary : '#52525b',
                    }}
                  />
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${pD2Pct}%`,
                      backgroundColor: pD2 >= pD1 ? theme.primary : '#52525b',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Driver 2 (Right Champion) */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row-reverse lg:flex-col items-center sm:items-start lg:items-center text-center sm:text-right lg:text-center gap-4 relative">
            {/* Cutout Hero Frame */}
            <Link
              href={`/drivers/${driver2.driverId}`}
              className="group relative size-44 sm:size-48 lg:size-52 rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 overflow-hidden shadow-xl hover:border-white/30 transition-all shrink-0"
            >
              <DriverImage
                src={d2Photo}
                alt={`${driver2.givenName} ${driver2.familyName}`}
                fill
                sizes="240px"
                className="object-contain object-top pt-2 scale-105 group-hover:scale-110 transition-transform duration-300 origin-top"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-xs font-mono font-black text-white">
                #{d2Num}
              </div>
            </Link>

            {/* Info */}
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-end lg:justify-center gap-1.5 text-xs text-zinc-400">
                <CountryFlag countryName={driver2.nationality} />
                <span>{driver2.nationality}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                <span className="text-zinc-400 text-lg sm:text-xl font-medium block">
                  {driver2.givenName}
                </span>
                {driver2.familyName}
              </h3>
              <div className="flex items-center justify-center sm:justify-end lg:justify-center gap-2 pt-1 font-mono text-xs text-zinc-300">
                <span className="font-bold text-amber-400">{stats.points.d2Points} pts</span>
                <span>•</span>
                <span>{stats.wins.d2}W</span>
                <span>•</span>
                <span>{stats.podiums.d2}P</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── In-Page Analysis Hub (Radar & Timeline directly visible) ─────── */}
        <div className="p-5 sm:p-8 space-y-6 bg-zinc-950/80">
          {/* Tab Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-zinc-900 text-zinc-300">
                <Target className="size-4" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight text-white">
                Deep Dive Telemetry &amp; Round Logs
              </h4>
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('radar')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
                  activeTab === 'radar'
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                Radar Comparison
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
                  activeTab === 'timeline'
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                GP Timeline ({rounds.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
                  activeTab === 'stats'
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                Key Stats Table
              </button>
            </div>
          </div>

          {/* Tab 1: Radar Chart */}
          {activeTab === 'radar' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4 sm:p-6 rounded-2xl bg-zinc-900/40 border border-white/5">
                <div className="w-full md:w-1/2 flex justify-center">
                  <RadarChart
                    stats={stats}
                    driver1={driver1}
                    driver2={driver2}
                    constructorId={constructorId}
                    size={320}
                  />
                </div>

                <div className="w-full md:w-1/2 space-y-4">
                  <div className="space-y-1">
                    <h5 className="text-base font-black uppercase tracking-tight text-white">
                      6-Axis Intra-Team Performance Index
                    </h5>
                    <p className="text-xs text-zinc-400">
                      Holistic evaluation normalized across 6 critical performance vectors:
                      qualifying pace, race results, points share, podium rate, fastest laps, and best finish.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl border border-white/10 bg-zinc-900/60 space-y-1">
                      <p className="text-[10px] font-mono text-zinc-400 uppercase">
                        Median Qualy Delta
                      </p>
                      <p className="text-base font-black font-mono text-white">
                        {deltaFormatted !== '0.000s' ? (
                          <span style={{ color: theme.primary }}>
                            {d1Faster ? driver1.code : driver2.code} -{deltaFormatted}
                          </span>
                        ) : (
                          'Equal 0.000s'
                        )}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-white/10 bg-zinc-900/60 space-y-1">
                      <p className="text-[10px] font-mono text-zinc-400 uppercase">
                        Points Dominance
                      </p>
                      <p className="text-base font-black font-mono text-white">
                        {pD1 >= pD2 ? (
                          <>
                            {driver1.code}{' '}
                            <span className="text-xs text-zinc-400">({d1PtsShare}%)</span>
                          </>
                        ) : (
                          <>
                            {driver2.code}{' '}
                            <span className="text-xs text-zinc-400">({d2PtsShare}%)</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: GP Timeline Table */}
          {activeTab === 'timeline' && (
            <div className="space-y-2">
              <RoundTimeline
                rounds={rounds}
                driver1={driver1}
                driver2={driver2}
                constructorId={constructorId}
              />
            </div>
          )}

          {/* Tab 3: Key Stats Table */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-white/10 bg-zinc-900/50 space-y-1">
                <p className="text-[11px] font-bold text-zinc-400 uppercase">Best Finish</p>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-mono text-lg font-black text-white">
                    P{stats.bestFinish.d1 > 0 ? stats.bestFinish.d1 : '—'}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">vs</span>
                  <span className="font-mono text-lg font-black text-white">
                    P{stats.bestFinish.d2 > 0 ? stats.bestFinish.d2 : '—'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-zinc-900/50 space-y-1">
                <p className="text-[11px] font-bold text-zinc-400 uppercase">Best Grid Start</p>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-mono text-lg font-black text-white">
                    P{stats.bestGrid.d1 > 0 ? stats.bestGrid.d1 : '—'}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">vs</span>
                  <span className="font-mono text-lg font-black text-white">
                    P{stats.bestGrid.d2 > 0 ? stats.bestGrid.d2 : '—'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-zinc-900/50 space-y-1">
                <p className="text-[11px] font-bold text-zinc-400 uppercase">Fastest Laps</p>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-mono text-lg font-black text-amber-400">
                    {stats.fastestLaps.d1}x
                  </span>
                  <span className="text-xs font-mono text-zinc-500">vs</span>
                  <span className="font-mono text-lg font-black text-amber-400">
                    {stats.fastestLaps.d2}x
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-zinc-900/50 space-y-1">
                <p className="text-[11px] font-bold text-zinc-400 uppercase">Pole Positions</p>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-mono text-lg font-black text-amber-400">
                    {stats.qualifying.d1Poles}x
                  </span>
                  <span className="text-xs font-mono text-zinc-500">vs</span>
                  <span className="font-mono text-lg font-black text-amber-400">
                    {stats.qualifying.d2Poles}x
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Detailed Dialog */}
      <BattleModal
        battle={activeBattle}
        season={season}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
