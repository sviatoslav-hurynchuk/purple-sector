'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { TeammatePairBattle } from '@/types/f1';
import { DriverImage } from '@/components/f1/driver-image';
import { CountryFlag } from '@/components/f1/country-flag';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { getTeamTheme } from '@/lib/team-colors';
import { RadarChart } from './radar-chart';
import { RoundTimeline } from './round-timeline';
import {
  Swords,
  ChevronRight,
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

  // Synchronize selected battle if absent from the new battles array
  useEffect(() => {
    if (battles.length === 0) return;
    const exists = battles.some((b) => b.id === selectedBattleId);
    if (!exists) {
      setSelectedBattleId(battles.find((b) => b.isPrimary)?.id || battles[0]?.id || '');
    }
  }, [battles, selectedBattleId]);

  const activeBattle =
    battles.find((b) => b.id === selectedBattleId) || battles[0];
  if (!activeBattle) return null;

  const { constructorId, constructorName, driver1, driver2, stats, rounds } =
    activeBattle;
  const theme = getTeamTheme(constructorId);

  const seasonStr = String(season);
  const seasonNum = parseInt(seasonStr, 10);
  const isModernSeason = !isNaN(seasonNum) ? seasonNum >= 2024 : true;

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

  const formatDriverName = (d: { givenName: string; familyName: string; code?: string }) => {
    if (d.code === 'ANT') return 'Kimi Antonelli';
    return `${d.givenName} ${d.familyName}`;
  };

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

  // Proportional bar width calculations with graceful clamping so bars never collapse to 0%
  const calcBarSplit = (val1: number, val2: number) => {
    if (val1 === 0 && val2 === 0) return { d1Pct: 50, d2Pct: 50 };
    if (val1 === 0) return { d1Pct: 10, d2Pct: 90 };
    if (val2 === 0) return { d1Pct: 90, d2Pct: 10 };
    const total = val1 + val2;
    let d1 = Math.round((val1 / total) * 100);
    d1 = Math.max(10, Math.min(90, d1));
    return { d1Pct: d1, d2Pct: 100 - d1 };
  };

  const qBarSplit = calcBarSplit(qD1, qD2);
  const rBarSplit = calcBarSplit(rD1, rD2);
  const pBarSplit = calcBarSplit(pD1, pD2);

  const d1Color = theme.primary;
  const d2Color =
    theme.secondary ||
    (theme.textColor === 'dark' ? '#27272A' : '#E2E8F0');
  const d1TextColor =
    theme.textColor === 'dark' ? 'text-zinc-950' : 'text-white';
  const d2TextColor =
    (theme.secondaryTextColor ?? 'light') === 'dark'
      ? 'text-zinc-950'
      : 'text-white';

  return (
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


        {/* ── Main Face-Off Stage (Seamless Architectural Layout: Flush Panels, Zero Gaps, Sharp Division) ── */}
        <div className="relative border-b border-white/10 flex flex-col lg:grid lg:grid-cols-12 items-stretch bg-zinc-950">
          {/* Mobile Driver Face-Off Bar (< lg) */}
          <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10 lg:hidden min-h-[175px] bg-zinc-950">
            {/* Driver 1 Mobile Box */}
            <Link
              href={`/drivers/${driver1.driverId}`}
              className="relative p-3.5 sm:p-4 overflow-hidden flex flex-col justify-between bg-zinc-900/40 group hover:bg-zinc-900/70 transition-colors"
            >
              <div
                className="absolute -top-10 -left-10 size-32 rounded-full opacity-25 blur-2xl pointer-events-none"
                style={{ backgroundColor: d1Color }}
              />
              {/* Clean Top Header - No obstruction of face */}
              <div className="relative z-10 flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                <CountryFlag countryName={driver1.nationality} />
                <span className="font-bold text-white/80">#{d1Num}</span>
                <span className="text-white font-bold text-xs truncate uppercase tracking-tight ml-1 group-hover:text-primary transition-colors">
                  {driver1.familyName}
                </span>
              </div>

              {/* Cutout Photo (Facing Right via left.webp) */}
              <div className="absolute top-7 -right-2 h-[230%] w-[68%] pointer-events-none select-none">
                <DriverImage
                  src={d1Photo}
                  alt={`${driver1.givenName} ${driver1.familyName}`}
                  fill
                  sizes="180px"
                  className="object-contain object-top drop-shadow-lg"
                  priority
                />
              </div>

              {/* Clean Bottom Stats - Integrated, No floating pill */}
              <div className="relative z-10 text-xs font-mono font-bold text-amber-400 mt-auto pt-16">
                {stats.points.d1Points} <span className="text-[10px] text-zinc-400 font-normal">pts</span>
                <span className="text-zinc-500 font-normal ml-1">• {stats.wins.d1}W</span>
              </div>
            </Link>

            {/* Driver 2 Mobile Box */}
            <Link
              href={`/drivers/${driver2.driverId}`}
              className="relative p-3.5 sm:p-4 overflow-hidden flex flex-col justify-between text-right bg-zinc-900/40 group hover:bg-zinc-900/70 transition-colors"
            >
              <div
                className="absolute -top-10 -right-10 size-32 rounded-full opacity-20 blur-2xl pointer-events-none"
                style={{ backgroundColor: d2Color }}
              />
              {/* Clean Top Header - No obstruction of face */}
              <div className="relative z-10 flex items-center justify-end gap-1.5 text-xs font-mono text-zinc-400">
                <span className="text-white font-bold text-xs truncate uppercase tracking-tight mr-1 group-hover:text-primary transition-colors">
                  {driver2.familyName}
                </span>
                <span className="font-bold text-white/80">#{d2Num}</span>
                <CountryFlag countryName={driver2.nationality} />
              </div>

              {/* Cutout Photo (Facing Left via right.webp) */}
              <div className="absolute top-7 -left-2 h-[230%] w-[68%] pointer-events-none select-none">
                <DriverImage
                  src={d2Photo}
                  alt={`${driver2.givenName} ${driver2.familyName}`}
                  fill
                  sizes="180px"
                  className="object-contain object-top drop-shadow-lg"
                  priority
                />
              </div>

              {/* Clean Bottom Stats - Integrated, No floating pill */}
              <div className="relative z-10 text-xs font-mono font-bold text-amber-400 mt-auto pt-16 text-right">
                <span className="text-zinc-500 font-normal mr-1">{stats.wins.d2}W •</span>
                {stats.points.d2Points} <span className="text-[10px] text-zinc-400 font-normal">pts</span>
              </div>
            </Link>
          </div>

          {/* ── Left Driver Panel (Desktop >= lg:col-span-3) ── */}
          <div className="hidden lg:flex lg:col-span-3 flex-col justify-between border-r border-white/10 relative overflow-hidden min-h-[440px] lg:min-h-[480px] bg-zinc-950 group">
            {/* Architectural Top Bar */}
            <Link
              href={`/drivers/${driver1.driverId}`}
              className="h-[52px] border-b border-white/10 px-5 flex items-center justify-between bg-zinc-950/85 backdrop-blur-md relative z-20 group/header hover:bg-zinc-900/80 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CountryFlag countryName={driver1.nationality} />
                <span className="font-mono text-xs font-bold text-zinc-400">#{d1Num}</span>
                <span className="text-zinc-600 font-bold">•</span>
                <h3 className="text-sm xl:text-base font-black uppercase tracking-tight text-white truncate group-hover/header:text-primary transition-colors">
                  {formatDriverName(driver1)}
                </h3>
              </div>
            </Link>

            {/* Authentic Cutout Photo (Facing Inward Right via left.webp) */}
            <div className="absolute top-[52px] bottom-[44px] inset-x-0 overflow-hidden pointer-events-none select-none">
              {/* Ambient Driver Glow */}
              <div
                className="absolute -top-10 -left-10 size-48 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ backgroundColor: d1Color }}
              />
              <div
                className={cn(
                  'relative w-full h-[260%] transition-transform duration-300 origin-top',
                  isModernSeason
                    ? 'top-1 flex items-start'
                    : 'h-full flex items-center justify-center p-2'
                )}
              >
                <DriverImage
                  src={d1Photo}
                  alt={`${driver1.givenName} ${driver1.familyName}`}
                  fill
                  sizes="320px"
                  className="object-contain object-top drop-shadow-2xl"
                  priority
                />
              </div>
            </div>

            {/* Architectural Bottom Telemetry Strip */}
            <div className="h-[44px] border-t border-white/10 px-5 flex items-center justify-between bg-zinc-950/85 backdrop-blur-md relative z-20">
              <span className="font-mono text-xs font-black text-amber-400 tracking-tight">
                {stats.points.d1Points} <span className="text-[10px] text-zinc-500 font-bold">PTS</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-zinc-400">
                {stats.wins.d1}W • {stats.podiums.d1}P
              </span>
            </div>
          </div>

          {/* ── Center Metrics Slab (Desktop lg:col-span-6 / Flush 3-Tier Division) ── */}
          <div className="w-full lg:col-span-6 flex flex-col justify-stretch divide-y divide-white/10 bg-zinc-950">
            {/* 1. Qualifying Duel */}
            <div className="relative min-h-[115px] sm:min-h-[135px] lg:min-h-[145px] overflow-hidden select-none group flex items-center justify-between">
              {/* Proportional Split Background Bars (Pinned Absolutely to fill 100% on Mobile and Desktop) */}
              <div className="absolute inset-0 flex pointer-events-none select-none">
                <div
                  className="h-full transition-all duration-700 relative"
                  style={{
                    width: `${qBarSplit.d1Pct}%`,
                    backgroundColor: d1Color,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/35 pointer-events-none" />
                </div>
                <div
                  className="h-full transition-all duration-700 relative"
                  style={{
                    width: `${qBarSplit.d2Pct}%`,
                    backgroundColor: d2Color,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-l from-black/20 via-transparent to-black/35 pointer-events-none" />
                </div>
              </div>

              {/* Clean Architectural Center Typography (No Floating Stickers) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10 px-2 sm:px-4">
                <span className="text-xl sm:text-4xl lg:text-5xl font-black uppercase tracking-[0.16em] sm:tracking-[0.22em] text-white/20 mix-blend-overlay whitespace-nowrap">
                  QUALIFYING
                </span>
                <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-0.5">
                  {deltaFormatted !== '0.000s'
                    ? `${d1Faster ? driver1.code : driver2.code} -${deltaFormatted}`
                    : 'EQUAL PACE'}
                </span>
              </div>

              {/* Foreground Values */}
              <div className="relative z-20 w-full flex items-center justify-between px-4 sm:px-8 pointer-events-none">
                {/* Left: Driver 1 Score */}
                <div className="flex flex-col items-start drop-shadow-md">
                  <span className={cn('font-mono text-3xl sm:text-4xl lg:text-5xl font-black leading-none', d1TextColor)}>
                    {qD1}
                  </span>
                  <span className={cn('text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider mt-1 opacity-90', d1TextColor)}>
                    {driver1.code} ({qD1Pct}%)
                  </span>
                </div>

                {/* Right: Driver 2 Score */}
                <div className="flex flex-col items-end drop-shadow-md text-right">
                  <span className={cn('font-mono text-3xl sm:text-4xl lg:text-5xl font-black leading-none', d2TextColor)}>
                    {qD2}
                  </span>
                  <span className={cn('text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider mt-1 opacity-90', d2TextColor)}>
                    {driver2.code} ({qD2Pct}%)
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Races Ahead / Race Results */}
            <div className="relative min-h-[115px] sm:min-h-[135px] lg:min-h-[145px] overflow-hidden select-none group flex items-center justify-between">
              {/* Proportional Split Background Bars (Pinned Absolutely to fill 100% on Mobile and Desktop) */}
              <div className="absolute inset-0 flex pointer-events-none select-none">
                <div
                  className="h-full transition-all duration-700 relative"
                  style={{
                    width: `${rBarSplit.d1Pct}%`,
                    backgroundColor: d1Color,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/35 pointer-events-none" />
                </div>
                <div
                  className="h-full transition-all duration-700 relative"
                  style={{
                    width: `${rBarSplit.d2Pct}%`,
                    backgroundColor: d2Color,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-l from-black/20 via-transparent to-black/35 pointer-events-none" />
                </div>
              </div>

              {/* Clean Architectural Center Typography (No Floating Stickers) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10 px-2 sm:px-4">
                <span className="text-xl sm:text-4xl lg:text-5xl font-black uppercase tracking-[0.16em] sm:tracking-[0.22em] text-white/20 mix-blend-overlay whitespace-nowrap">
                  RACES AHEAD
                </span>
                <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-0.5">
                  {rD1 > rD2
                    ? `+${rD1 - rD2} ${driver1.code} ADVANTAGE`
                    : rD2 > rD1
                    ? `+${rD2 - rD1} ${driver2.code} ADVANTAGE`
                    : 'TIED DUEL'}
                </span>
              </div>

              {/* Foreground Values */}
              <div className="relative z-20 w-full flex items-center justify-between px-4 sm:px-8 pointer-events-none">
                {/* Left: Driver 1 Ahead */}
                <div className="flex flex-col items-start drop-shadow-md">
                  <span className={cn('font-mono text-3xl sm:text-4xl lg:text-5xl font-black leading-none', d1TextColor)}>
                    {rD1}
                  </span>
                  <span className={cn('text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider mt-1 opacity-90', d1TextColor)}>
                    {driver1.code} ({rD1Pct}%)
                  </span>
                </div>

                {/* Right: Driver 2 Ahead */}
                <div className="flex flex-col items-end drop-shadow-md text-right">
                  <span className={cn('font-mono text-3xl sm:text-4xl lg:text-5xl font-black leading-none', d2TextColor)}>
                    {rD2}
                  </span>
                  <span className={cn('text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider mt-1 opacity-90', d2TextColor)}>
                    {driver2.code} ({rD2Pct}%)
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Championship Points */}
            <div className="relative min-h-[115px] sm:min-h-[135px] lg:min-h-[145px] overflow-hidden select-none group flex items-center justify-between">
              {/* Proportional Split Background Bars (Pinned Absolutely to fill 100% on Mobile and Desktop) */}
              <div className="absolute inset-0 flex pointer-events-none select-none">
                <div
                  className="h-full transition-all duration-700 relative"
                  style={{
                    width: `${pBarSplit.d1Pct}%`,
                    backgroundColor: d1Color,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/35 pointer-events-none" />
                </div>
                <div
                  className="h-full transition-all duration-700 relative"
                  style={{
                    width: `${pBarSplit.d2Pct}%`,
                    backgroundColor: d2Color,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-l from-black/20 via-transparent to-black/35 pointer-events-none" />
                </div>
              </div>

              {/* Clean Architectural Center Typography (No Floating Stickers) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10 px-2 sm:px-4">
                <span className="text-xl sm:text-4xl lg:text-5xl font-black uppercase tracking-[0.16em] sm:tracking-[0.22em] text-white/20 mix-blend-overlay whitespace-nowrap">
                  POINTS
                </span>
                <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-0.5">
                  {pD1 !== pD2
                    ? `+${Math.abs(pD1 - pD2)} PTS GAP`
                    : 'EQUAL PTS'}
                </span>
              </div>

              {/* Foreground Values */}
              <div className="relative z-20 w-full flex items-center justify-between px-4 sm:px-8 pointer-events-none">
                {/* Left: Driver 1 Points */}
                <div className="flex flex-col items-start drop-shadow-md">
                  <span className={cn('font-mono text-3xl sm:text-4xl lg:text-5xl font-black leading-none', d1TextColor)}>
                    {pD1} <span className="text-sm font-normal opacity-75">pts</span>
                  </span>
                  <span className={cn('text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider mt-1 opacity-90', d1TextColor)}>
                    {driver1.code} ({d1PtsShare}%)
                  </span>
                </div>

                {/* Right: Driver 2 Points */}
                <div className="flex flex-col items-end drop-shadow-md text-right">
                  <span className={cn('font-mono text-3xl sm:text-4xl lg:text-5xl font-black leading-none', d2TextColor)}>
                    {pD2} <span className="text-sm font-normal opacity-75">pts</span>
                  </span>
                  <span className={cn('text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider mt-1 opacity-90', d2TextColor)}>
                    {driver2.code} ({d2PtsShare}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Driver Panel (Desktop >= lg:col-span-3) ── */}
          <div className="hidden lg:flex lg:col-span-3 flex-col justify-between border-l border-white/10 relative overflow-hidden min-h-[440px] lg:min-h-[480px] bg-zinc-950 group text-right">
            {/* Architectural Top Bar */}
            <Link
              href={`/drivers/${driver2.driverId}`}
              className="h-[52px] border-b border-white/10 px-5 flex items-center justify-between bg-zinc-950/85 backdrop-blur-md relative z-20 group/header hover:bg-zinc-900/80 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 justify-end w-full">
                <h3 className="text-sm xl:text-base font-black uppercase tracking-tight text-white truncate group-hover/header:text-primary transition-colors">
                  {formatDriverName(driver2)}
                </h3>
                <span className="text-zinc-600 font-bold">•</span>
                <span className="font-mono text-xs font-bold text-zinc-400">#{d2Num}</span>
                <CountryFlag countryName={driver2.nationality} />
              </div>
            </Link>

            {/* Authentic Cutout Photo (Facing Inward Left via right.webp) */}
            <div className="absolute top-[52px] bottom-[44px] inset-x-0 overflow-hidden pointer-events-none select-none">
              {/* Ambient Driver Glow */}
              <div
                className="absolute -top-10 -right-10 size-48 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ backgroundColor: d2Color }}
              />
              <div
                className={cn(
                  'relative w-full h-[260%] transition-transform duration-300 origin-top',
                  isModernSeason
                    ? 'top-1 flex items-start'
                    : 'h-full flex items-center justify-center p-2'
                )}
              >
                <DriverImage
                  src={d2Photo}
                  alt={`${driver2.givenName} ${driver2.familyName}`}
                  fill
                  sizes="320px"
                  className="object-contain object-top drop-shadow-2xl"
                  priority
                />
              </div>
            </div>

            {/* Architectural Bottom Telemetry Strip */}
            <div className="h-[44px] border-t border-white/10 px-5 flex items-center justify-between bg-zinc-950/85 backdrop-blur-md relative z-20">
              <span className="font-mono text-[11px] font-bold text-zinc-400">
                {stats.wins.d2}W • {stats.podiums.d2}P
              </span>
              <span className="font-mono text-xs font-black text-amber-400 tracking-tight">
                {stats.points.d2Points} <span className="text-[10px] text-zinc-500 font-bold">PTS</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── In-Page Analysis Hub (Radar & Timeline directly visible) ─────── */}
        <div className="p-4 sm:p-6 lg:py-3.5 lg:px-6 space-y-3 sm:space-y-4 lg:space-y-3 bg-zinc-950/80">
          {/* Tab Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/10 pb-2.5 lg:pb-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Mid-season pairings switcher if multiple */}
              {battles.length > 1 && (
                <div className="flex items-center gap-1 p-0.5 rounded-lg border border-white/10 bg-zinc-900 text-xs font-mono">
                  {battles.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBattleId(b.id)}
                      className={cn(
                        'px-2 py-0.5 rounded text-xs transition-colors cursor-pointer',
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

              <div className="inline-flex items-center border border-white/10 bg-zinc-900 divide-x divide-white/10 rounded-md overflow-hidden text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTab('radar')}
                  className={cn(
                    'px-3 sm:px-3.5 py-1.5 transition-colors cursor-pointer uppercase tracking-wider font-bold',
                    activeTab === 'radar'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  Radar Comparison
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className={cn(
                    'px-3 sm:px-3.5 py-1.5 transition-colors cursor-pointer uppercase tracking-wider font-bold',
                    activeTab === 'timeline'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  GP Timeline ({rounds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('stats')}
                  className={cn(
                    'px-3 sm:px-3.5 py-1.5 transition-colors cursor-pointer uppercase tracking-wider font-bold',
                    activeTab === 'stats'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  Key Stats Table
                </button>
              </div>
            </div>
          </div>

          {/* Tab 1: Radar Chart + 6 Essential Telemetry Cards (Seamless Monolithic Matrix) */}
          {activeTab === 'radar' && (
            <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6 lg:gap-6 pt-1 lg:pt-0">
              <div className="w-full lg:w-5/12 flex justify-center py-1 lg:py-0 shrink-0">
                <RadarChart
                  stats={stats}
                  driver1={driver1}
                  driver2={driver2}
                  constructorId={constructorId}
                  size={285}
                />
              </div>

              <div className="w-full lg:w-7/12">
                <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-white/10 bg-zinc-950/60 rounded-xl overflow-hidden shadow-xl">
                  {/* 1. Qualy Delta */}
                  <div className="p-3 sm:p-3.5 lg:p-2.5 lg:px-3 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                    <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                      Median Qualy Delta
                    </p>
                    <div className="pt-1.5 lg:pt-1">
                      <p className="text-base sm:text-lg lg:text-base xl:text-lg font-black font-mono text-white">
                        {deltaFormatted !== '0.000s' ? (
                          <span style={{ color: theme.primary }}>
                            {d1Faster ? driver1.code : driver2.code} -{deltaFormatted}
                          </span>
                        ) : (
                          'Equal 0.000s'
                        )}
                      </p>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">season median</p>
                    </div>
                  </div>

                  {/* 2. Points Share */}
                  <div className="p-3 sm:p-3.5 lg:p-2.5 lg:px-3 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                    <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                      Points Share
                    </p>
                    <div className="pt-1.5 lg:pt-1">
                      <p className="text-base sm:text-lg lg:text-base xl:text-lg font-black font-mono text-white">
                        {pD1 >= pD2 ? (
                          <>
                            <span style={{ color: theme.primary }}>{driver1.code}</span>{' '}
                            <span className="text-xs text-zinc-300 font-normal">({d1PtsShare}%)</span>
                          </>
                        ) : (
                          <>
                            <span className="text-zinc-200">{driver2.code}</span>{' '}
                            <span className="text-xs text-zinc-300 font-normal">({d2PtsShare}%)</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">
                        {pD1} vs {pD2} pts
                      </p>
                    </div>
                  </div>

                  {/* 3. Best Finish */}
                  <div className="p-3 sm:p-3.5 lg:p-2.5 lg:px-3 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                    <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                      Best Finish
                    </p>
                    <div className="pt-1.5 lg:pt-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-base sm:text-lg lg:text-base xl:text-lg font-black text-white">
                          P{stats.bestFinish.d1 > 0 ? stats.bestFinish.d1 : '—'}
                        </span>
                        <span className="text-xs font-mono text-zinc-400 font-semibold">vs</span>
                        <span className="font-mono text-base sm:text-lg lg:text-base xl:text-lg font-black text-white">
                          P{stats.bestFinish.d2 > 0 ? stats.bestFinish.d2 : '—'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">
                        <span style={{ color: theme.primary }} className="font-bold">{driver1.code}</span> vs <span className="text-zinc-200 font-bold">{driver2.code}</span>
                      </p>
                    </div>
                  </div>

                  {/* 4. Best Grid */}
                  <div className="p-3 sm:p-3.5 lg:p-2.5 lg:px-3 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                    <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                      Best Grid
                    </p>
                    <div className="pt-1.5 lg:pt-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-base sm:text-lg lg:text-base xl:text-lg font-black text-white">
                          P{stats.bestGrid.d1 > 0 ? stats.bestGrid.d1 : '—'}
                        </span>
                        <span className="text-xs font-mono text-zinc-400 font-semibold">vs</span>
                        <span className="font-mono text-base sm:text-lg lg:text-base xl:text-lg font-black text-white">
                          P{stats.bestGrid.d2 > 0 ? stats.bestGrid.d2 : '—'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">
                        <span style={{ color: theme.primary }} className="font-bold">{driver1.code}</span> vs <span className="text-zinc-200 font-bold">{driver2.code}</span>
                      </p>
                    </div>
                  </div>

                  {/* 5. Fastest Laps */}
                  <div className="p-3 sm:p-3.5 lg:p-2.5 lg:px-3 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                    <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                      Fastest Laps
                    </p>
                    <div className="pt-1.5 lg:pt-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-base sm:text-lg lg:text-base xl:text-lg font-black text-amber-400">
                          {stats.fastestLaps.d1}x
                        </span>
                        <span className="text-xs font-mono text-zinc-400 font-semibold">vs</span>
                        <span className="font-mono text-base sm:text-lg lg:text-base xl:text-lg font-black text-amber-400">
                          {stats.fastestLaps.d2}x
                        </span>
                      </div>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">
                        <span style={{ color: theme.primary }} className="font-bold">{driver1.code}</span> vs <span className="text-zinc-200 font-bold">{driver2.code}</span>
                      </p>
                    </div>
                  </div>

                  {/* 6. Pole Positions */}
                  <div className="p-3 sm:p-3.5 lg:p-2.5 lg:px-3 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                    <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                      Pole Positions
                    </p>
                    <div className="pt-1.5 lg:pt-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-base sm:text-lg lg:text-base xl:text-lg font-black text-amber-400">
                          {stats.qualifying.d1Poles}x
                        </span>
                        <span className="text-xs font-mono text-zinc-400 font-semibold">vs</span>
                        <span className="font-mono text-base sm:text-lg lg:text-base xl:text-lg font-black text-amber-400">
                          {stats.qualifying.d2Poles}x
                        </span>
                      </div>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">
                        <span style={{ color: theme.primary }} className="font-bold">{driver1.code}</span> vs <span className="text-zinc-200 font-bold">{driver2.code}</span>
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

          {/* Tab 3: Key Stats Table (Seamless Monolithic Strip) */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-white/10 bg-zinc-950/60 rounded-xl overflow-hidden shadow-xl">
              <div className="p-3 sm:p-3.5 lg:p-2.5 lg:px-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between gap-1.5 lg:gap-1">
                <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">Best Finish</p>
                <div className="pt-1 flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-lg sm:text-xl lg:text-xl font-black text-white">
                      P{stats.bestFinish.d1 > 0 ? stats.bestFinish.d1 : '—'}
                    </span>
                    <span className="text-xs font-mono text-zinc-400 font-semibold">vs</span>
                    <span className="font-mono text-lg sm:text-xl lg:text-xl font-black text-white">
                      P{stats.bestFinish.d2 > 0 ? stats.bestFinish.d2 : '—'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-zinc-400">
                    <span style={{ color: theme.primary }} className="font-bold">{driver1.code}</span> vs <span className="text-zinc-200 font-bold">{driver2.code}</span>
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 lg:p-2.5 lg:px-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between gap-1.5 lg:gap-1">
                <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">Best Grid Start</p>
                <div className="pt-1 flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-lg sm:text-xl lg:text-xl font-black text-white">
                      P{stats.bestGrid.d1 > 0 ? stats.bestGrid.d1 : '—'}
                    </span>
                    <span className="text-xs font-mono text-zinc-400 font-semibold">vs</span>
                    <span className="font-mono text-lg sm:text-xl lg:text-xl font-black text-white">
                      P{stats.bestGrid.d2 > 0 ? stats.bestGrid.d2 : '—'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-zinc-400">
                    <span style={{ color: theme.primary }} className="font-bold">{driver1.code}</span> vs <span className="text-zinc-200 font-bold">{driver2.code}</span>
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 lg:p-2.5 lg:px-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between gap-1.5 lg:gap-1">
                <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">Fastest Laps</p>
                <div className="pt-1 flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-lg sm:text-xl lg:text-xl font-black text-amber-400">
                      {stats.fastestLaps.d1}x
                    </span>
                    <span className="text-xs font-mono text-zinc-400 font-semibold">vs</span>
                    <span className="font-mono text-lg sm:text-xl lg:text-xl font-black text-amber-400">
                      {stats.fastestLaps.d2}x
                    </span>
                  </div>
                  <p className="text-xs font-mono text-zinc-400">
                    <span style={{ color: theme.primary }} className="font-bold">{driver1.code}</span> vs <span className="text-zinc-200 font-bold">{driver2.code}</span>
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 lg:p-2.5 lg:px-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between gap-1.5 lg:gap-1">
                <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">Pole Positions</p>
                <div className="pt-1 flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-lg sm:text-xl lg:text-xl font-black text-amber-400">
                      {stats.qualifying.d1Poles}x
                    </span>
                    <span className="text-xs font-mono text-zinc-400 font-semibold">vs</span>
                    <span className="font-mono text-lg sm:text-xl lg:text-xl font-black text-amber-400">
                      {stats.qualifying.d2Poles}x
                    </span>
                  </div>
                  <p className="text-xs font-mono text-zinc-400">
                    <span style={{ color: theme.primary }} className="font-bold">{driver1.code}</span> vs <span className="text-zinc-200 font-bold">{driver2.code}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
