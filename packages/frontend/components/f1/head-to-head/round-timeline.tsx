'use client';

import React from 'react';
import type { RoundBattle, DriverH2HSummary } from '@/types/f1';
import { getTeamTheme } from '@/lib/team-colors';
import { Trophy, Zap, Flag, AlertCircle } from 'lucide-react';

interface RoundTimelineProps {
  rounds: RoundBattle[];
  driver1: DriverH2HSummary;
  driver2: DriverH2HSummary;
  constructorId: string;
  className?: string;
}

export function RoundTimeline({
  rounds,
  driver1,
  driver2,
  constructorId,
  className = '',
}: RoundTimelineProps) {
  const teamTheme = getTeamTheme(constructorId);
  const primaryColor = teamTheme.primary;

  return (
    <div className={`w-full overflow-hidden flex flex-col gap-3 ${className}`}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">Rnd</th>
              <th className="py-3 px-4">Grand Prix</th>
              <th className="py-3 px-4 text-center" colSpan={3}>
                <div className="flex items-center justify-center gap-1 text-zinc-300">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  Qualifying Battle
                </div>
              </th>
              <th className="py-3 px-4 text-center" colSpan={3}>
                <div className="flex items-center justify-center gap-1 text-zinc-300">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Race Battle
                </div>
              </th>
              <th className="py-3 px-4 text-right">Points Delta</th>
            </tr>
            <tr className="border-b border-zinc-800/60 text-[10px] text-zinc-500 font-mono bg-zinc-900/30">
              <th></th>
              <th></th>
              <th className="py-1 px-3 text-center">{driver1.code}</th>
              <th className="py-1 px-2 text-center">Delta</th>
              <th className="py-1 px-3 text-center">{driver2.code}</th>
              <th className="py-1 px-3 text-center">{driver1.code}</th>
              <th className="py-1 px-2 text-center">Winner</th>
              <th className="py-1 px-3 text-center">{driver2.code}</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 font-mono">
            {rounds.map((round) => {
              const q1Won = round.qualifying.winnerId === driver1.driverId;
              const q2Won = round.qualifying.winnerId === driver2.driverId;
              const r1Won = round.race.winnerId === driver1.driverId;
              const r2Won = round.race.winnerId === driver2.driverId;

              const deltaFormatted =
                round.qualifying.deltaMs !== undefined
                  ? `${(round.qualifying.deltaMs / 1000).toFixed(3)}s`
                  : '—';

              const ptsDelta = round.race.d1Points - round.race.d2Points;

              return (
                <tr
                  key={round.round}
                  className="hover:bg-zinc-900/40 transition-colors group"
                >
                  {/* Round Number */}
                  <td className="py-3 px-4 text-center text-zinc-500 font-semibold">
                    R{round.round}
                  </td>

                  {/* Grand Prix & Country */}
                  <td className="py-3 px-4 font-sans">
                    <div className="font-semibold text-zinc-200 group-hover:text-white transition-colors">
                      {round.raceName}
                    </div>
                    <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                      <Flag className="w-3 h-3 text-zinc-600" />
                      <span>{round.circuitName}</span>
                    </div>
                  </td>

                  {/* Qualy: Driver 1 */}
                  <td className="py-3 px-3 text-center">
                    <div
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-bold text-xs ${
                        q1Won
                          ? 'bg-zinc-800 text-white ring-1 ring-white/20'
                          : 'text-zinc-500'
                      }`}
                      style={q1Won ? { borderColor: primaryColor } : undefined}
                    >
                      {round.qualifying.d1Position ? `P${round.qualifying.d1Position}` : '—'}
                    </div>
                  </td>

                  {/* Qualy: Gap Delta */}
                  <td className="py-3 px-2 text-center text-[11px]">
                    <span
                      className={`font-semibold ${
                        q1Won
                          ? 'text-emerald-400'
                          : q2Won
                          ? 'text-sky-400'
                          : 'text-zinc-600'
                      }`}
                    >
                      {round.qualifying.deltaMs !== undefined ? (
                        <span>
                          {q1Won ? `-${deltaFormatted}` : `+${deltaFormatted}`}
                        </span>
                      ) : (
                        '—'
                      )}
                    </span>
                  </td>

                  {/* Qualy: Driver 2 */}
                  <td className="py-3 px-3 text-center">
                    <div
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-bold text-xs ${
                        q2Won
                          ? 'bg-zinc-800 text-slate-200 ring-1 ring-slate-400/30'
                          : 'text-zinc-500'
                      }`}
                    >
                      {round.qualifying.d2Position ? `P${round.qualifying.d2Position}` : '—'}
                    </div>
                  </td>

                  {/* Race: Driver 1 */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-bold text-xs ${
                          r1Won
                            ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30'
                            : round.race.d1Position
                            ? 'text-zinc-400'
                            : 'text-zinc-600'
                        }`}
                      >
                        {round.race.d1Position ? `P${round.race.d1Position}` : 'DNF'}
                      </span>
                      {round.race.d1Points > 0 && (
                        <span className="text-[10px] text-emerald-400">
                          +{round.race.d1Points} pts
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Race: Winner Pill */}
                  <td className="py-3 px-2 text-center">
                    {r1Won ? (
                      <span
                        className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded"
                        style={{
                          backgroundColor: `${primaryColor}25`,
                          color: primaryColor,
                        }}
                      >
                        {driver1.code}
                      </span>
                    ) : r2Won ? (
                      <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300">
                        {driver2.code}
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-[10px]">Draw</span>
                    )}
                  </td>

                  {/* Race: Driver 2 */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-bold text-xs ${
                          r2Won
                            ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30'
                            : round.race.d2Position
                            ? 'text-zinc-400'
                            : 'text-zinc-600'
                        }`}
                      >
                        {round.race.d2Position ? `P${round.race.d2Position}` : 'DNF'}
                      </span>
                      {round.race.d2Points > 0 && (
                        <span className="text-[10px] text-emerald-400">
                          +{round.race.d2Points} pts
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Points Delta in this Round */}
                  <td className="py-3 px-4 text-right font-semibold">
                    {ptsDelta > 0 ? (
                      <span className="text-emerald-400">+{ptsDelta}</span>
                    ) : ptsDelta < 0 ? (
                      <span className="text-rose-400">{ptsDelta}</span>
                    ) : (
                      <span className="text-zinc-600">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden flex flex-col gap-2.5">
        {rounds.map((round) => {
          const q1Won = round.qualifying.winnerId === driver1.driverId;
          const q2Won = round.qualifying.winnerId === driver2.driverId;
          const r1Won = round.race.winnerId === driver1.driverId;
          const r2Won = round.race.winnerId === driver2.driverId;

          const deltaFormatted =
            round.qualifying.deltaMs !== undefined
              ? `${(round.qualifying.deltaMs / 1000).toFixed(3)}s`
              : null;

          return (
            <div
              key={round.round}
              className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 flex flex-col gap-2.5 text-xs font-mono"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div>
                  <span className="text-zinc-500 font-bold mr-2">R{round.round}</span>
                  <span className="font-sans font-semibold text-zinc-200">
                    {round.raceName}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500">{round.date}</span>
              </div>

              {/* Qualifying row */}
              <div className="flex items-center justify-between bg-zinc-950/40 p-2 rounded-lg">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1 font-sans">
                  <Zap className="w-3 h-3 text-yellow-400" /> Qualy:
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold ${
                      q1Won ? 'text-white underline decoration-2' : 'text-zinc-500'
                    }`}
                  >
                    {driver1.code}{' '}
                    {round.qualifying.d1Position ? `P${round.qualifying.d1Position}` : '—'}
                  </span>
                  {deltaFormatted && (
                    <span className="text-[10px] text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800">
                      Δ {deltaFormatted}
                    </span>
                  )}
                  <span
                    className={`font-bold ${
                      q2Won ? 'text-white underline decoration-2' : 'text-zinc-500'
                    }`}
                  >
                    {driver2.code}{' '}
                    {round.qualifying.d2Position ? `P${round.qualifying.d2Position}` : '—'}
                  </span>
                </div>
              </div>

              {/* Race row */}
              <div className="flex items-center justify-between bg-zinc-950/40 p-2 rounded-lg">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1 font-sans">
                  <Trophy className="w-3 h-3 text-amber-400" /> Race:
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold ${
                      r1Won ? 'text-amber-300' : 'text-zinc-400'
                    }`}
                  >
                    {driver1.code}{' '}
                    {round.race.d1Position ? `P${round.race.d1Position}` : 'DNF'}
                    {round.race.d1Points > 0 && (
                      <span className="text-[10px] text-emerald-400 ml-1">
                        (+{round.race.d1Points})
                      </span>
                    )}
                  </span>
                  <span className="text-zinc-600">vs</span>
                  <span
                    className={`font-bold ${
                      r2Won ? 'text-amber-300' : 'text-zinc-400'
                    }`}
                  >
                    {driver2.code}{' '}
                    {round.race.d2Position ? `P${round.race.d2Position}` : 'DNF'}
                    {round.race.d2Points > 0 && (
                      <span className="text-[10px] text-emerald-400 ml-1">
                        (+{round.race.d2Points})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
