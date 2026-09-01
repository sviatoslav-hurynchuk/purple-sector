'use client';

import React from 'react';
import Link from 'next/link';
import type { LiveSessionState } from '@/types/f1';
import { LiveStatusIndicator } from './live-status-indicator';
import { ShieldAlert, Flag, ArrowRight, Gauge, Clock, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveSessionBannerProps {
  state: LiveSessionState | null;
  showLiveLink?: boolean;
  className?: string;
}

function resolveTrackFlag(state: LiveSessionState | null) {
  if (!state || !state.raceControlFeed || state.raceControlFeed.length === 0) {
    return { flag: 'GREEN', label: 'TRACK CLEAR', color: 'emerald' };
  }

  // Look at the latest race control messages for active flags
  const recentEvents = state.raceControlFeed.slice(-5);
  for (let i = recentEvents.length - 1; i >= 0; i--) {
    const e = recentEvents[i];
    if (e.type === 'safety_car') return { flag: 'SC', label: 'SAFETY CAR', color: 'amber' };
    if (e.type === 'vsc') return { flag: 'VSC', label: 'VSC DEPLOYED', color: 'amber' };
    if (e.type === 'red_flag') return { flag: 'RED', label: 'RED FLAG', color: 'red' };
    if (e.type === 'yellow_flag') return { flag: 'YELLOW', label: 'YELLOW FLAG', color: 'yellow' };
    if (e.type === 'chequered_flag') return { flag: 'CHEQUERED', label: 'SESSION FINISHED', color: 'zinc' };
  }

  return { flag: 'GREEN', label: 'TRACK CLEAR', color: 'emerald' };
}

export function LiveSessionBanner({
  state,
  showLiveLink = true,
  className,
}: LiveSessionBannerProps) {
  if (!state || !state.isActive) {
    return null;
  }

  const trackStatus = resolveTrackFlag(state);
  const leader = state.drivers.find((d) => d.position === 1);
  const p2 = state.drivers.find((d) => d.position === 2);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-zinc-900/90 to-zinc-950/90 p-4 sm:p-6 backdrop-blur-xl shadow-lg shadow-red-950/20',
        className
      )}
    >
      {/* Ambient background glow */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        {/* Session info & Status */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <LiveStatusIndicator isActive={true} isStreaming={true} size="md" />
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider',
                trackStatus.color === 'emerald' && 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                trackStatus.color === 'amber' && 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
                trackStatus.color === 'yellow' && 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
                trackStatus.color === 'red' && 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse',
                trackStatus.color === 'zinc' && 'bg-zinc-800 text-zinc-300 border-white/10'
              )}
            >
              {trackStatus.flag === 'SC' || trackStatus.flag === 'VSC' ? (
                <ShieldAlert className="h-3.5 w-3.5" />
              ) : (
                <Flag className="h-3.5 w-3.5" />
              )}
              <span>{trackStatus.label}</span>
            </span>

            {state.sessionType && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/5 uppercase">
                {state.sessionType}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{state.sessionName || 'Live Session'}</span>
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              {state.circuitShortName ? `${state.circuitShortName}` : ''}
              {state.countryName ? ` · ${state.countryName}` : ''}
            </p>
          </div>
        </div>

        {/* Quick telemetry summary */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {leader && (
            <div className="flex items-center gap-3 p-2.5 px-3.5 rounded-xl bg-zinc-950/70 border border-white/10">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Trophy className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  Leader (P1)
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-1 rounded-full"
                    style={{ backgroundColor: leader.teamColour || '#e10600' }}
                  />
                  <span className="font-mono font-bold text-sm text-zinc-100">
                    {leader.code || leader.name || `#${leader.driverNumber}`}
                  </span>
                  {p2 && p2.interval && (
                    <span className="text-xs font-mono text-zinc-400">
                      (+{typeof p2.interval === 'number' ? `${p2.interval.toFixed(3)}s` : p2.interval} to P2)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action CTA */}
          {showLiveLink && (
            <Link
              href="/live"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-tight transition-all duration-200 shadow-md shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch Live Timing</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
