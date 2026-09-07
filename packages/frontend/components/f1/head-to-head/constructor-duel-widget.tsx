'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { TeammatePairBattle } from '@/types/f1';
import { getTeamTheme } from '@/lib/team-colors';
import { Swords, Zap, Trophy, TrendingUp, ChevronRight } from 'lucide-react';

interface ConstructorDuelWidgetProps {
  battles: TeammatePairBattle[];
  season: string | number;
  className?: string;
}

export function ConstructorDuelWidget({
  battles,
  season,
  className = '',
}: ConstructorDuelWidgetProps) {
  const [selectedBattleId, setSelectedBattleId] = useState<string>(
    battles.find((b) => b.isPrimary)?.id || battles[0]?.id || ''
  );

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

  const { constructorId, driver1, driver2, stats, rounds } = activeBattle;
  const theme = getTeamTheme(constructorId);

  const deltaFormatted =
    stats.qualifying.medianDeltaMs !== 0
      ? `${(Math.abs(stats.qualifying.medianDeltaMs) / 1000).toFixed(3)}s`
      : '0.000s';
  const d1Faster = stats.qualifying.medianDeltaMs < 0;

  // Driver numbers/codes
  const d1Num = driver1.permanentNumber || driver1.code;
  const d2Num = driver2.permanentNumber || driver2.code;

  // 1. Qualifying calculations
  const qD1 = stats.qualifying.d1Wins;
  const qD2 = stats.qualifying.d2Wins;
  const qTotal = Math.max(1, qD1 + qD2);
  const qD1Pct = Math.round((qD1 / qTotal) * 100);
  const qD2Pct = 100 - qD1Pct;

  // 2. Races calculations
  const rD1 = stats.race.d1Wins;
  const rD2 = stats.race.d2Wins;
  const rTotal = Math.max(1, rD1 + rD2);
  const rD1Pct = Math.round((rD1 / rTotal) * 100);
  const rD2Pct = 100 - rD1Pct;

  // 3. Points calculations
  const d1PtsShare = Number(stats.points.d1SharePercent.toFixed(1));
  const d2PtsShare = Number((100 - d1PtsShare).toFixed(1));
  const pD1 = stats.points.d1Points;
  const pD2 = stats.points.d2Points;
  const pTotal = Math.max(1, pD1 + pD2);
  const pD1Pct = Math.round((pD1 / pTotal) * 100);
  const pD2Pct = 100 - pD1Pct;

  return (
    <div
      className={[
          'rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-5 sm:p-6 shadow-xl space-y-5',
          className,
        ].join(' ')}
      >
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Swords className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase tracking-tight text-foreground">
                  Teammate Head-to-Head Duel
                </h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {season}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Intra-team performance across {rounds.length} Grand Prix weekends
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Mid-season pairings toggle */}
            {battles.length > 1 && (
              <div className="flex items-center gap-1 p-1 rounded-lg border border-white/10 bg-zinc-900 text-xs font-mono">
                {battles.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBattleId(b.id)}
                    className={[
                      'px-2.5 py-1 rounded transition-colors',
                      b.id === selectedBattleId
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'text-zinc-400 hover:text-white',
                    ].join(' ')}
                  >
                    {b.driver2.code}
                  </button>
                ))}
              </div>
            )}

            <Link
              href={`/head-to-head?season=${season}`}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
            >
              <span>All Battles</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Driver Duelists Summary Strip */}
        <div className="grid grid-cols-2 items-center text-center relative py-1">
          {/* Driver 1 */}
          <div className="text-left space-y-0.5 pr-4">
            <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              {driver1.givenName} #{d1Num}
            </p>
            <p className="text-lg sm:text-xl font-black uppercase tracking-tight text-foreground">
              {driver1.familyName}
            </p>
          </div>

          {/* Center VS Divider */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span
              className="size-7 rounded-full flex items-center justify-center text-[10px] font-black font-mono tracking-wider border shadow-md"
              style={{
                borderColor: `${theme.primary}60`,
                backgroundColor: '#18181b',
                color: theme.primary,
              }}
            >
              VS
            </span>
          </div>

          {/* Driver 2 */}
          <div className="text-right space-y-0.5 pl-4">
            <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              {driver2.givenName} #{d2Num}
            </p>
            <p className="text-lg sm:text-xl font-black uppercase tracking-tight text-foreground">
              {driver2.familyName}
            </p>
          </div>
        </div>

        {/* ── Metric Comparison Bars ───────────────────────────────────────── */}
        <div className="space-y-3.5 pt-1">
          {/* 1. Qualifying H2H */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={['font-black text-sm', qD1 >= qD2 ? 'text-white' : 'text-zinc-400'].join(' ')}>
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
              <span className={['font-black text-sm', qD2 >= qD1 ? 'text-white' : 'text-zinc-400'].join(' ')}>
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

          {/* 2. Race Head-to-Head */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={['font-black text-sm', rD1 >= rD2 ? 'text-white' : 'text-zinc-400'].join(' ')}>
                {rD1} <span className="text-[10px] font-normal text-zinc-500">{driver1.code}</span>
              </span>
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                <Trophy className="size-3 text-amber-400" />
                <span>Races Ahead</span>
              </div>
              <span className={['font-black text-sm', rD2 >= rD1 ? 'text-white' : 'text-zinc-400'].join(' ')}>
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

          {/* 3. Points Contribution */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={['font-black text-sm', pD1 >= pD2 ? 'text-white' : 'text-zinc-400'].join(' ')}>
                {pD1} pts <span className="text-[10px] font-normal text-zinc-500">({d1PtsShare}%)</span>
              </span>
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                <TrendingUp className="size-3 text-emerald-400" />
                <span>Points</span>
              </div>
              <span className={['font-black text-sm', pD2 >= pD1 ? 'text-white' : 'text-zinc-400'].join(' ')}>
                <span className="text-[10px] font-normal text-zinc-500">({d2PtsShare}%)</span> {pD2} pts
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

        {/* Open Detailed Arena Trigger */}
        <Link
          href={`/head-to-head?season=${season}&team=${constructorId}`}
          className="w-full py-2.5 px-4 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs font-bold text-zinc-300 hover:text-white group cursor-pointer"
        >
          <TrendingUp className="size-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
          <span>Open Full Teammate Arena</span>
          <ChevronRight className="size-3.5 text-zinc-500 group-hover:translate-x-0.5 group-hover:text-white transition-all" />
        </Link>
      </div>
  );
}
