'use client';

import React from 'react';
import type { RoundBattle, DriverH2HSummary } from '@/types/f1';
import { getTeamTheme } from '@/lib/team-colors';
import { CountryFlag } from '@/components/f1/country-flag';


interface RoundTimelineProps {
  rounds: RoundBattle[];
  driver1: DriverH2HSummary;
  driver2: DriverH2HSummary;
  constructorId: string;
  className?: string;
}

/**
 * Normalizes race finish status into display text and classification flags.
 * Correctly distinguishes between classified finishes (e.g. Finished, Lapped, +1 Lap),
 * disqualifications (DSQ), did-not-start (DNS), and retirements (DNF).
 */
export function getFinishDisplay(
  position?: number,
  status?: string
): { text: string; isDnf: boolean; isDsq: boolean; isDns: boolean } {
  if (!status) {
    return {
      text: position ? `P${position}` : '—',
      isDnf: false,
      isDsq: false,
      isDns: false,
    };
  }
  const s = status.toLowerCase();
  if (s === 'disqualified') {
    return { text: 'DSQ', isDnf: true, isDsq: true, isDns: false };
  }
  if (s === 'did not start') {
    return { text: 'DNS', isDnf: true, isDsq: false, isDns: true };
  }
  if (s === 'finished' || s === 'lapped' || status.startsWith('+')) {
    return {
      text: position ? `P${position}` : status,
      isDnf: false,
      isDsq: false,
      isDns: false,
    };
  }
  // Any other status ('Retired', 'Collision', 'Engine', 'Accident', etc.) is a DNF
  return { text: 'DNF', isDnf: true, isDsq: false, isDns: false };
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
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-300 font-mono text-xs uppercase tracking-wider font-bold">
              <th className="py-3 px-4 w-12 text-center">Rnd</th>
              <th className="py-3 px-4">Grand Prix</th>
              <th className="py-3 px-4 text-center" colSpan={3}>
                <div className="flex items-center justify-center gap-1.5 text-zinc-200">
                  Qualifying
                </div>
              </th>
              <th className="py-3 px-4 text-center" colSpan={3}>
                <div className="flex items-center justify-center gap-1.5 text-zinc-200">
                  Race
                </div>
              </th>
              <th className="py-3 px-4 text-right">Points Delta</th>
            </tr>
            <tr className="border-b border-zinc-800/80 text-xs text-zinc-400 font-mono font-semibold bg-zinc-900/50">
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

              const d1Finish = getFinishDisplay(round.race.d1Position, round.race.d1Status);
              const d2Finish = getFinishDisplay(round.race.d2Position, round.race.d2Status);
              const bothDnf = d1Finish.isDnf && d2Finish.isDnf;

              return (
                <tr
                  key={round.round}
                  className="hover:bg-zinc-900/40 transition-colors group"
                >
                  {/* Round Number */}
                  <td className="py-3 px-4 text-center text-zinc-400 font-bold font-mono">
                    R{round.round}
                  </td>

                  {/* Grand Prix & Country Flag */}
                  <td className="py-3 px-4 font-sans">
                    <div className="flex items-center gap-2">
                      <CountryFlag
                        countryName={round.country}
                        width={20}
                        height={14}
                        className="w-5 h-3.5 rounded-xs border border-white/10 shrink-0 shadow-xs object-cover"
                      />
                      <span className="font-bold text-zinc-100 group-hover:text-white transition-colors">
                        {round.raceName}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5 pl-7 truncate max-w-xs sm:max-w-sm">
                      {round.circuitName}
                    </div>
                  </td>

                  {/* Qualy: Driver 1 */}
                  <td className="py-3 px-3 text-center">
                    <div
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-bold text-xs ${
                        q1Won
                          ? 'bg-zinc-800 text-white ring-1 ring-white/20'
                          : 'text-zinc-300'
                      }`}
                      style={q1Won ? { borderColor: primaryColor } : undefined}
                    >
                      {round.qualifying.d1Position ? `P${round.qualifying.d1Position}` : '—'}
                    </div>
                  </td>

                  {/* Qualy: Gap Delta */}
                  <td className="py-3 px-2 text-center text-xs">
                    <span
                      className={`font-bold font-mono ${
                        q1Won
                          ? 'text-emerald-400'
                          : q2Won
                          ? 'text-sky-400'
                          : 'text-zinc-500'
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
                          ? 'bg-zinc-800 text-white ring-1 ring-slate-400/30'
                          : 'text-zinc-300'
                      }`}
                    >
                      {round.qualifying.d2Position ? `P${round.qualifying.d2Position}` : '—'}
                    </div>
                  </td>

                  {/* Race: Driver 1 */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      {d1Finish.isDnf ? (
                        <span
                          className="inline-flex items-center justify-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-rose-500/15 text-rose-400 border border-rose-500/30 tracking-wider"
                          title={round.race.d1Status}
                        >
                          {d1Finish.text}
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-bold text-xs ${
                            r1Won
                              ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40'
                              : 'text-zinc-200'
                          }`}
                        >
                          {d1Finish.text}
                        </span>
                      )}
                      {round.race.d1Points > 0 && (
                        <span className="text-[11px] font-bold text-emerald-400 font-mono">
                          +{round.race.d1Points} pts
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Race: Winner Pill */}
                  <td className="py-3 px-2 text-center">
                    {bothDnf ? (
                      <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-950/40 text-rose-400/90 border border-rose-800/40">
                        Both DNF
                      </span>
                    ) : r1Won ? (
                      <span
                        className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded"
                        style={{
                          backgroundColor: `${primaryColor}25`,
                          color: primaryColor,
                        }}
                      >
                        {driver1.code}
                      </span>
                    ) : r2Won ? (
                      <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-800 text-slate-200">
                        {driver2.code}
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-[10px] font-mono">Draw</span>
                    )}
                  </td>

                  {/* Race: Driver 2 */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      {d2Finish.isDnf ? (
                        <span
                          className="inline-flex items-center justify-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-rose-500/15 text-rose-400 border border-rose-500/30 tracking-wider"
                          title={round.race.d2Status}
                        >
                          {d2Finish.text}
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-bold text-xs ${
                            r2Won
                              ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40'
                              : 'text-zinc-200'
                          }`}
                        >
                          {d2Finish.text}
                        </span>
                      )}
                      {round.race.d2Points > 0 && (
                        <span className="text-[11px] font-bold text-emerald-400 font-mono">
                          +{round.race.d2Points} pts
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Points Delta in this Round */}
                  <td className="py-3 px-4 text-right font-bold text-xs font-mono">
                    {ptsDelta > 0 ? (
                      <span className="text-emerald-400">+{ptsDelta}</span>
                    ) : ptsDelta < 0 ? (
                      <span className="text-rose-400">{ptsDelta}</span>
                    ) : (
                      <span className="text-zinc-500">0</span>
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

          const d1Finish = getFinishDisplay(round.race.d1Position, round.race.d1Status);
          const d2Finish = getFinishDisplay(round.race.d2Position, round.race.d2Status);

          return (
            <div
              key={round.round}
              className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 flex flex-col gap-2.5 text-xs font-mono"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 font-bold font-mono">R{round.round}</span>
                  <CountryFlag
                    countryName={round.country}
                    width={18}
                    height={13}
                    className="w-4.5 h-3 rounded-xs border border-white/10 shrink-0 shadow-xs object-cover"
                  />
                  <span className="font-sans font-semibold text-zinc-100">
                    {round.raceName}
                  </span>
                </div>
                <span className="text-xs text-zinc-400 font-mono">{round.date}</span>
              </div>

              {/* Qualifying row */}
              <div className="flex items-center justify-between bg-zinc-950/40 p-2 rounded-lg">

                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold ${
                      q1Won ? 'text-white underline decoration-2' : 'text-zinc-400'
                    }`}
                  >
                    {driver1.code}{' '}
                    {round.qualifying.d1Position ? `P${round.qualifying.d1Position}` : '—'}
                  </span>
                  {deltaFormatted && (
                    <span className="text-[10px] text-zinc-300 px-1.5 py-0.5 rounded bg-zinc-800 font-bold">
                      Δ {deltaFormatted}
                    </span>
                  )}
                  <span
                    className={`font-bold ${
                      q2Won ? 'text-white underline decoration-2' : 'text-zinc-400'
                    }`}
                  >
                    {driver2.code}{' '}
                    {round.qualifying.d2Position ? `P${round.qualifying.d2Position}` : '—'}
                  </span>
                </div>
              </div>

              {/* Race row */}
              <div className="flex items-center justify-between bg-zinc-950/40 p-2 rounded-lg">

                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold ${
                      d1Finish.isDnf
                        ? 'text-rose-400'
                        : r1Won
                        ? 'text-amber-300'
                        : 'text-zinc-300'
                    }`}
                  >
                    {driver1.code}{' '}
                    {d1Finish.isDnf ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/30 ml-0.5 font-mono">
                        {d1Finish.text}
                      </span>
                    ) : (
                      d1Finish.text
                    )}
                    {round.race.d1Points > 0 && (
                      <span className="text-[10px] text-emerald-400 ml-1">
                        (+{round.race.d1Points})
                      </span>
                    )}
                  </span>
                  <span className="text-zinc-600">vs</span>
                  <span
                    className={`font-bold ${
                      d2Finish.isDnf
                        ? 'text-rose-400'
                        : r2Won
                        ? 'text-amber-300'
                        : 'text-zinc-300'
                    }`}
                  >
                    {driver2.code}{' '}
                    {d2Finish.isDnf ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/30 ml-0.5 font-mono">
                        {d2Finish.text}
                      </span>
                    ) : (
                      d2Finish.text
                    )}
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
