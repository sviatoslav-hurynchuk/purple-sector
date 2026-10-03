'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { TeammatePairBattle } from '@/types/f1';
import { getTeamTheme } from '@/lib/team-colors';
import { Swords, Zap, Trophy, TrendingUp, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConstructorDuelWidgetProps {
  battles: TeammatePairBattle[];
  season: string | number;
  className?: string;
}

export function ConstructorDuelWidget({
  battles,
  season,
  className,
}: ConstructorDuelWidgetProps) {
  const [selectedBattleId, setSelectedBattleId] = useState<string | null>(null);

  const activeBattle =
    (selectedBattleId ? battles.find((b) => b.id === selectedBattleId) : null) ||
    battles.find((b) => b.isPrimary) ||
    battles[0];

  if (!activeBattle) return null;

  const { constructorId, driver1, driver2, stats, rounds } = activeBattle;
  const theme = getTeamTheme(constructorId);

  const deltaFormatted =
    stats.qualifying.medianDeltaMs !== 0
      ? `${(Math.abs(stats.qualifying.medianDeltaMs) / 1000).toFixed(3)}s`
      : '0.000s';
  const d1Faster = stats.qualifying.medianDeltaMs < 0;

  // Driver numbers/codes
  const d1Num = driver1.permanentNumber ? `#${driver1.permanentNumber}` : driver1.code;
  const d2Num = driver2.permanentNumber ? `#${driver2.permanentNumber}` : driver2.code;

  // 1. Qualifying calculations
  const qD1 = stats.qualifying.d1Wins;
  const qD2 = stats.qualifying.d2Wins;
  const qTotal = Math.max(1, qD1 + qD2);
  const qD1Raw = (qD1 / qTotal) * 100;
  const qD1Pct = qD1 === 0 ? 0 : qD2 === 0 ? 100 : Math.max(12, Math.min(88, Math.round(qD1Raw)));
  const qD2Pct = 100 - qD1Pct;

  // 2. Races calculations
  const rD1 = stats.race.d1Wins;
  const rD2 = stats.race.d2Wins;
  const rTotal = Math.max(1, rD1 + rD2);
  const rD1Raw = (rD1 / rTotal) * 100;
  const rD1Pct = rD1 === 0 ? 0 : rD2 === 0 ? 100 : Math.max(12, Math.min(88, Math.round(rD1Raw)));
  const rD2Pct = 100 - rD1Pct;

  // 3. Points calculations
  const d1PtsShare = Number(stats.points.d1SharePercent.toFixed(1));
  const d2PtsShare = Number((100 - d1PtsShare).toFixed(1));
  const pD1 = stats.points.d1Points;
  const pD2 = stats.points.d2Points;
  const pTotal = Math.max(1, pD1 + pD2);
  const pD1Raw = (pD1 / pTotal) * 100;
  const pD1Pct = pD1 === 0 ? 0 : pD2 === 0 ? 100 : Math.max(12, Math.min(88, Math.round(pD1Raw)));
  const pD2Pct = 100 - pD1Pct;

  return (
    <div
      className={cn(
        'rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col',
        className
      )}
    >
      {/* ── Monolithic Header Controls ─────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-1.5 h-5 rounded-full shrink-0"
            style={{ backgroundColor: theme.primary }}
          />
          <div>
            <div className="flex items-center gap-2">
              <Swords className="size-4 text-purple-400" />
              <h3 className="text-sm sm:text-base font-black font-sans uppercase tracking-tight text-white">
                Teammate Head-to-Head Duel
              </h3>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/5">
                {season}
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
              Intra-team performance duel across {rounds.length} Grand Prix weekends
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Mid-season pairings toggle */}
          {battles.length > 1 && (
            <div className="inline-flex p-0.5 rounded-lg border border-white/10 bg-zinc-900 text-xs font-mono">
              {battles.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBattleId(b.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all',
                    b.id === activeBattle.id
                      ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  {b.driver2.code}
                </button>
              ))}
            </div>
          )}

          <Link
            href={`/head-to-head?season=${season}&team=${constructorId}`}
            className="text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 group/link"
          >
            <span>FULL ARENA</span>
            <ChevronRight className="size-3.5 text-zinc-500 group-hover/link:text-white group-hover/link:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>

      {/* ── Driver Duelists Summary Strip ───────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-950/60 relative">
        <div className="grid grid-cols-2 items-center text-center">
          {/* Driver 1 */}
          <div className="text-left space-y-0.5 pr-6">
            <p className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
              {driver1.givenName} <span className="text-zinc-500">{d1Num}</span>
            </p>
            <p className="text-lg sm:text-2xl font-black font-sans uppercase tracking-tight text-white">
              {driver1.familyName}
            </p>
          </div>

          {/* Center VS Divider Badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            <div
              className="size-8 rounded-full flex items-center justify-center text-[10px] font-black font-mono tracking-wider border shadow-xl bg-zinc-900"
              style={{
                borderColor: `${theme.primary}80`,
                color: theme.primary,
              }}
            >
              VS
            </div>
          </div>

          {/* Driver 2 */}
          <div className="text-right space-y-0.5 pl-6">
            <p className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
              {driver2.givenName} <span className="text-zinc-500">{d2Num}</span>
            </p>
            <p className="text-lg sm:text-2xl font-black font-sans uppercase tracking-tight text-white">
              {driver2.familyName}
            </p>
          </div>
        </div>
      </div>

      {/* ── Metric Comparison Bars ───────────────────────────────────────── */}
      <div className="p-4 sm:p-6 space-y-5 bg-zinc-900/10">
        {/* 1. Qualifying H2H */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={cn('font-black text-sm', qD1 >= qD2 ? 'text-white' : 'text-zinc-400')}>
              {qD1} <span className="text-[10px] font-bold text-zinc-500">{driver1.code}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <Zap className="size-3.5 text-amber-400" />
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-zinc-300">
                Qualifying
              </span>
              {deltaFormatted !== '0.000s' && (
                <span
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-white/10"
                  style={{
                    backgroundColor: `${theme.primary}25`,
                    color: theme.textColor === 'dark' ? '#ffffff' : theme.primary,
                  }}
                >
                  {d1Faster ? driver1.code : driver2.code} -{deltaFormatted}
                </span>
              )}
            </div>

            <span className={cn('font-black text-sm', qD2 >= qD1 ? 'text-white' : 'text-zinc-400')}>
              <span className="text-[10px] font-bold text-zinc-500">{driver2.code}</span> {qD2}
            </span>
          </div>

          <div className="h-2.5 w-full bg-zinc-900 border border-white/10 rounded-full overflow-hidden flex">
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
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={cn('font-black text-sm', rD1 >= rD2 ? 'text-white' : 'text-zinc-400')}>
              {rD1} <span className="text-[10px] font-bold text-zinc-500">{driver1.code}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <Trophy className="size-3.5 text-amber-400" />
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-zinc-300">
                Races Ahead
              </span>
            </div>

            <span className={cn('font-black text-sm', rD2 >= rD1 ? 'text-white' : 'text-zinc-400')}>
              <span className="text-[10px] font-bold text-zinc-500">{driver2.code}</span> {rD2}
            </span>
          </div>

          <div className="h-2.5 w-full bg-zinc-900 border border-white/10 rounded-full overflow-hidden flex">
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
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={cn('font-black text-sm', pD1 >= pD2 ? 'text-white' : 'text-zinc-400')}>
              {pD1} pts <span className="text-[10px] font-bold text-zinc-500">({d1PtsShare}%)</span>
            </span>

            <div className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-emerald-400" />
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-zinc-300">
                Points Share
              </span>
            </div>

            <span className={cn('font-black text-sm', pD2 >= pD1 ? 'text-white' : 'text-zinc-400')}>
              <span className="text-[10px] font-bold text-zinc-500">({d2PtsShare}%)</span> {pD2} pts
            </span>
          </div>

          <div className="h-2.5 w-full bg-zinc-900 border border-white/10 rounded-full overflow-hidden flex">
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

      {/* ── Bottom Action Strip ─────────────────────────────────────────── */}
      <div className="p-3 sm:p-4 bg-zinc-950/80 border-t border-white/10 flex items-center justify-between">
        <span className="text-[11px] font-mono text-zinc-400">
          Telemetry aggregated across official FIA qualifying &amp; Grand Prix sessions
        </span>
        <Link
          href={`/head-to-head?season=${season}&team=${constructorId}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 transition-all group/btn shrink-0"
        >
          <span>OPEN IN ARENA</span>
          <ChevronRight className="size-3.5 text-zinc-500 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
}
