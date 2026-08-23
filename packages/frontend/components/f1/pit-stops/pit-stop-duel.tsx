'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { PitStopEntry, RaceResultEntry } from '@/types/f1';
import { cn } from '@/lib/utils';
import { getTeamTheme } from '@/lib/team-colors';
import { pitStopKey, formatDuration, parseDurationToSeconds } from './pit-stop-chronicle';
import { Play, Trash2, Trophy, Check, Gauge } from 'lucide-react';

/** Base wall-clock simulation time for the longest selected stop (in ms) */
const BASE_SIMULATION_MS = 6500;
/** Proportion of total pit stop time spent decelerating into the pit box */
const ENTRY_FRACTION = 0.35;
/** Proportion of total pit stop time spent stationary changing tires */
const STOPPED_FRACTION = 0.30;
/** Proportion of total pit stop time spent accelerating out of pit lane */
const EXIT_FRACTION = 0.35;

/** High-fidelity top-down Formula 1 car vector with authentic compact proportions */
function F1CarSvg({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 170 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
      {/* ── Floor & Venturi Tunnels Underbody ── */}
      <path
        d="M 44 18 Q 85 13 124 20 L 124 44 Q 85 51 44 46 Z"
        fill="#121215"
        stroke="#27272a"
        strokeWidth="1"
      />
      {/* Floor Edge Winglets / Strakes */}
      <line x1="56" y1="13" x2="108" y2="13" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="56" y1="51" x2="108" y2="51" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── Rear Suspension Wishbones ── */}
      <line x1="38" y1="32" x2="52" y2="14" stroke="#3f3f46" strokeWidth="1.5" />
      <line x1="48" y1="32" x2="52" y2="14" stroke="#3f3f46" strokeWidth="1.5" />
      <line x1="38" y1="32" x2="52" y2="50" stroke="#3f3f46" strokeWidth="1.5" />
      <line x1="48" y1="32" x2="52" y2="50" stroke="#3f3f46" strokeWidth="1.5" />

      {/* ── Rear Wheels (Wide Pirelli Slicks at x=52) ── */}
      {/* Left Rear */}
      <rect x="41" y="6" width="22" height="14" rx="3.5" fill="#18181b" />
      <rect x="43" y="8" width="18" height="10" rx="2" fill="#27272a" />
      <circle cx="52" cy="13" r="3.5" fill={color} />
      <circle cx="52" cy="13" r="1.5" fill="#18181b" />
      {/* Right Rear */}
      <rect x="41" y="44" width="22" height="14" rx="3.5" fill="#18181b" />
      <rect x="43" y="46" width="18" height="10" rx="2" fill="#27272a" />
      <circle cx="52" cy="51" r="3.5" fill={color} />
      <circle cx="52" cy="51" r="1.5" fill="#18181b" />

      {/* ── Rear Wing & DRS Actuator ── */}
      {/* Main Plane & Flap */}
      <rect x="22" y="14" width="9" height="36" rx="2" fill="#18181b" />
      <rect x="24.5" y="16" width="4.5" height="32" rx="1" fill={color} opacity="0.9" />
      {/* Endplates */}
      <rect x="19" y="12" width="15" height="3" rx="1" fill="#27272a" />
      <rect x="19" y="49" width="15" height="3" rx="1" fill="#27272a" />
      {/* DRS Pod */}
      <rect x="25.5" y="30.5" width="4.5" height="3" rx="1" fill="#52525b" />
      {/* Rain Light & Exhaust */}
      <circle cx="31" cy="32" r="2.5" fill="#09090b" />
      <circle cx="19.5" cy="32" r="1.5" fill="#ef4444" />

      {/* ── Main Monocoque Chassis & Compact Sculpted Sidepods ── */}
      <path
        d="M 32 32 L 44 23 Q 75 16 110 23 L 132 27 L 155 31.5 L 160 32 L 155 32.5 L 132 37 L 110 41 Q 75 48 44 41 Z"
        fill={color}
      />
      {/* Sidepod Radiator Air Intakes */}
      <path d="M 106 19 L 114 19 L 111 23 L 103 23 Z" fill="#09090b" />
      <path d="M 106 45 L 114 45 L 111 41 L 103 41 Z" fill="#09090b" />
      {/* Sidepod Undercut Shadows */}
      <path d="M 50 23 Q 80 20 104 25 L 104 26 Q 80 22 50 25 Z" fill="#000000" opacity="0.3" />
      <path d="M 50 41 Q 80 44 104 39 L 104 38 Q 80 42 50 39 Z" fill="#000000" opacity="0.3" />

      {/* Engine Cover Spine (Shark Fin) */}
      <line x1="45" y1="32" x2="88" y2="32" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" />
      {/* Engine Cooling Louvers */}
      <line x1="60" y1="26" x2="80" y2="26" stroke="#000000" strokeWidth="1" strokeOpacity="0.45" strokeDasharray="2,2" />
      <line x1="60" y1="38" x2="80" y2="38" stroke="#000000" strokeWidth="1" strokeOpacity="0.45" strokeDasharray="2,2" />

      {/* Airbox Intake & T-Cam */}
      <ellipse cx="89" cy="32" rx="4" ry="3.2" fill="#09090b" />
      <rect x="86" y="30.5" width="5.5" height="3" rx="1" fill="#eab308" />

      {/* ── Cockpit, Halo & Driver (Centered at x=104) ── */}
      <ellipse cx="104" cy="32" rx="11" ry="6.5" fill="#09090b" />
      {/* Driver Helmet */}
      <circle cx="102" cy="32" r="3.8" fill="#f4f4f5" />
      <ellipse cx="104" cy="32" rx="2" ry="1.6" fill="#18181b" />
      {/* Titanium Halo */}
      <path
        d="M 94 28 Q 106 29 114 32 Q 106 35 94 36"
        fill="none"
        stroke="#27272a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line x1="114" y1="32" x2="110" y2="32" stroke="#27272a" strokeWidth="2.5" strokeLinecap="round" />

      {/* Side Aero Mirrors */}
      <rect x="108" y="18" width="3.5" height="2" rx="0.5" fill="#27272a" />
      <line x1="107" y1="23" x2="108" y2="19" stroke="#3f3f46" strokeWidth="1" />
      <rect x="108" y="44" width="3.5" height="2" rx="0.5" fill="#27272a" />
      <line x1="107" y1="41" x2="108" y2="45" stroke="#3f3f46" strokeWidth="1" />

      {/* ── Front Suspension Wishbones (at x=132) ── */}
      <line x1="122" y1="32" x2="132" y2="19" stroke="#3f3f46" strokeWidth="1.5" />
      <line x1="138" y1="32" x2="132" y2="19" stroke="#3f3f46" strokeWidth="1.5" />
      <line x1="122" y1="32" x2="132" y2="45" stroke="#3f3f46" strokeWidth="1.5" />
      <line x1="138" y1="32" x2="132" y2="45" stroke="#3f3f46" strokeWidth="1.5" />

      {/* ── Front Wheels (at x=132) ── */}
      {/* Left Front */}
      <rect x="122" y="8" width="20" height="12" rx="3" fill="#18181b" />
      <rect x="124" y="10" width="16" height="8" rx="1.5" fill="#27272a" />
      <circle cx="132" cy="14" r="3" fill={color} />
      <circle cx="132" cy="14" r="1.2" fill="#18181b" />
      {/* Right Front */}
      <rect x="122" y="44" width="20" height="12" rx="3" fill="#18181b" />
      <rect x="124" y="46" width="16" height="8" rx="1.5" fill="#27272a" />
      <circle cx="132" cy="50" r="3" fill={color} />
      <circle cx="132" cy="50" r="1.2" fill="#18181b" />

      {/* Front Wheel Wake Deflectors */}
      <path d="M 119 6 L 134 6 L 132 8 L 119 8 Z" fill="#27272a" />
      <path d="M 119 58 L 134 58 L 132 56 L 119 56 Z" fill="#27272a" />

      {/* ── Front Wing Assembly ── */}
      <path
        d="M 144 13 L 156 17 L 159 28 L 156 32 L 159 36 L 156 47 L 144 51 L 146 54 L 161 49 L 164 32 L 161 15 L 146 10 Z"
        fill={color}
      />
      {/* Front Wing Flap Elements */}
      <line x1="146" y1="16" x2="158" y2="20" stroke="#18181b" strokeWidth="1" />
      <line x1="146" y1="48" x2="158" y2="44" stroke="#18181b" strokeWidth="1" />
      {/* Front Wing Endplates */}
      <rect x="143" y="9" width="14" height="2.5" rx="0.5" fill="#27272a" />
      <rect x="143" y="52.5" width="14" height="2.5" rx="0.5" fill="#27272a" />
      {/* Nose Tip Camera Housing */}
      <polygon points="159,32 163,30.5 165,32 163,33.5" fill="#27272a" />
    </svg>
  );
}

interface MechanicFigureProps {
  working: boolean;
  position: 'top' | 'bottom' | 'front';
  color: string;
}

function MechanicFigure({ working, position, color }: MechanicFigureProps) {
  return (
    <svg
      viewBox="0 0 24 36"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Helmet */}
      <circle cx="12" cy="6" r="4.5" fill={color} />
      <ellipse cx="12" cy="6.5" rx="2.8" ry="2" fill="#18181b" opacity="0.9" />

      {/* Body Suit */}
      <rect x="6.5" y="11" width="11" height="12" rx="2" fill={color} />
      <rect x="6.5" y="15" width="11" height="1.5" fill="white" opacity="0.25" />

      {/* Arms & Wheel Guns depending on Top / Bottom / Front position */}
      {position === 'top' ? (
        working ? (
          <>
            {/* Top mechanic reaches DOWN towards the car tire */}
            <line x1="7" y1="13" x2="4" y2="25" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="17" y1="13" x2="20" y2="25" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <rect x="2" y="23" width="5" height="4" rx="1" fill="#52525b" />
            <rect x="17" y="23" width="5" height="4" rx="1" fill="#52525b" />
          </>
        ) : (
          <>
            <line x1="7" y1="13" x2="3" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="17" y1="13" x2="21" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          </>
        )
      ) : position === 'bottom' ? (
        working ? (
          <>
            {/* Bottom mechanic reaches UP towards the car tire */}
            <line x1="7" y1="13" x2="4" y2="2" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="17" y1="13" x2="20" y2="2" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <rect x="2" y="0" width="5" height="4" rx="1" fill="#52525b" />
            <rect x="17" y="0" width="5" height="4" rx="1" fill="#52525b" />
          </>
        ) : (
          <>
            <line x1="7" y1="13" x2="3" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="17" y1="13" x2="21" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          </>
        )
      ) : (
        /* Front Jack Man */
        working ? (
          <>
            <line x1="7" y1="13" x2="2" y2="10" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="17" y1="13" x2="22" y2="10" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <rect x="0" y="8" width="6" height="4" rx="1" fill="#71717a" />
          </>
        ) : (
          <>
            <line x1="7" y1="13" x2="3" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="17" y1="13" x2="21" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          </>
        )
      )}

      {/* Legs */}
      <line x1="9" y1="23" x2="8" y2="35" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="15" y1="23" x2="16" y2="35" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type AnimPhase = 'idle' | 'pre_entry' | 'entry' | 'stopped' | 'exit' | 'done';

interface PitBoxSceneProps {
  teamColor: string;
  phase: AnimPhase;
  currentElapsedSec: number;
  entryDurationMs: number;
  exitDurationMs: number;
  driverName: string;
  teamName: string;
  duration: string;
  lap: string;
}

function PitBoxScene({
  teamColor,
  phase,
  currentElapsedSec,
  entryDurationMs,
  exitDurationMs,
  driverName,
  teamName,
  duration,
  lap,
}: PitBoxSceneProps) {
  const carTransform =
    phase === 'idle' ? 'translateX(0px) translateY(-50%)'
    : phase === 'pre_entry' ? 'translateX(-650px) translateY(-50%)'
    : phase === 'entry' ? 'translateX(0px) translateY(-50%)'
    : phase === 'stopped' ? 'translateX(0px) translateY(-50%)'
    : phase === 'exit' ? 'translateX(650px) translateY(-50%)'
    : 'translateX(650px) translateY(-50%)';

  const isWorking = phase === 'stopped';

  const statusLabel =
    phase === 'idle' ? 'Ready on Grid'
    : phase === 'pre_entry' ? 'Entering Pit Lane'
    : phase === 'entry' ? 'Decelerating to Box'
    : phase === 'stopped' ? 'Stationary Service'
    : phase === 'exit' ? 'Accelerating to Track'
    : 'Complete';

  return (
    <div className="relative h-36 bg-zinc-950/80 rounded-xl border border-zinc-800 overflow-hidden select-none">
      {/* Pit lane floor track line */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-zinc-800/80" />

      {/* Centered Pit Box Area (240px wide) */}
      <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[240px] pointer-events-none">
        {/* Box boundaries */}
        <div
          className="absolute inset-y-0 left-0 right-0 border-x-2 border-dashed opacity-25"
          style={{ borderColor: teamColor }}
        />

        {/* ── 4 Tire Mechanics + 1 Front Jack (Aligned exactly with wheels at x=165px & x=88px) ── */}
        {/* Top-Front Left Tire Mechanic */}
        <div
          className="absolute top-1 left-[153px] w-6 h-9 transition-transform duration-300 ease-out"
          style={{ transform: isWorking ? 'translateY(11px)' : 'translateY(0px)' }}
        >
          <MechanicFigure working={isWorking} position="top" color={teamColor} />
        </div>

        {/* Top-Rear Left Tire Mechanic */}
        <div
          className="absolute top-1 left-[76px] w-6 h-9 transition-transform duration-300 ease-out"
          style={{ transform: isWorking ? 'translateY(11px)' : 'translateY(0px)' }}
        >
          <MechanicFigure working={isWorking} position="top" color={teamColor} />
        </div>

        {/* Bottom-Front Right Tire Mechanic */}
        <div
          className="absolute bottom-1 left-[153px] w-6 h-9 transition-transform duration-300 ease-out"
          style={{ transform: isWorking ? 'translateY(-11px)' : 'translateY(0px)' }}
        >
          <MechanicFigure working={isWorking} position="bottom" color={teamColor} />
        </div>

        {/* Bottom-Rear Right Tire Mechanic */}
        <div
          className="absolute bottom-1 left-[76px] w-6 h-9 transition-transform duration-300 ease-out"
          style={{ transform: isWorking ? 'translateY(-11px)' : 'translateY(0px)' }}
        >
          <MechanicFigure working={isWorking} position="bottom" color={teamColor} />
        </div>

        {/* Front Jack Man */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-[202px] w-5 h-9 transition-transform duration-300 ease-out"
          style={{ transform: isWorking ? 'translateY(-50%) translateX(-8px)' : 'translateY(-50%) translateX(0px)' }}
        >
          <MechanicFigure working={isWorking} position="front" color={teamColor} />
        </div>

        {/* Animated Detailed F1 Car (164px length x 58px height) */}
        <div
          className="absolute top-1/2 left-[38px] w-[164px] h-[58px]"
          style={{
            transform: carTransform,
            transition:
              phase === 'entry'
                ? `transform ${entryDurationMs}ms cubic-bezier(0.12, 0, 0.08, 1)`
                : phase === 'exit'
                ? `transform ${exitDurationMs}ms cubic-bezier(0.5, 0, 0.85, 1)`
                : 'none',
          }}
        >
          <F1CarSvg color={teamColor} />
        </div>
      </div>

      {/* Driver info overlay (Left side) */}
      <div className="absolute top-3 left-4 flex items-center gap-2.5 z-10">
        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: teamColor }} />
        <div>
          <p className="text-xs font-bold text-foreground leading-none">{driverName}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{teamName} · Lap {lap}</p>
        </div>
      </div>

      {/* Live Telemetry stopwatch (Right side) */}
      <div className="absolute bottom-3 right-4 text-right z-10">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block mb-0.5">
          {statusLabel}
        </span>
        {(phase === 'entry' || phase === 'stopped' || phase === 'exit') && (
          <span className="font-mono text-base font-bold text-primary tabular-nums">
            {currentElapsedSec.toFixed(3)}s
          </span>
        )}
        {phase === 'done' && (
          <span className="font-mono text-base font-bold text-emerald-400 tabular-nums inline-flex items-center gap-1">
            <Check className="size-3.5 stroke-[3]" />
            {formatDuration(duration)}
          </span>
        )}
        {(phase === 'idle' || phase === 'pre_entry') && (
          <span className="font-mono text-sm font-semibold text-muted-foreground tabular-nums">
            {formatDuration(duration)}
          </span>
        )}
      </div>
    </div>
  );
}

interface SelectedStop {
  pitStop: PitStopEntry;
  constructorId: string | undefined;
  driverName: string;
  teamName: string;
}

interface PitStopDuelProps {
  pitStops: PitStopEntry[];
  raceResults: RaceResultEntry[];
  selectedIds: Set<string>;
  onClear: () => void;
  isRacing?: boolean;
  onRacingChange?: (isRacing: boolean) => void;
}

export function PitStopDuel({
  pitStops,
  raceResults,
  selectedIds,
  onClear,
  isRacing: controlledIsRacing,
  onRacingChange,
}: PitStopDuelProps) {
  const [phases, setPhases] = useState<Record<string, AnimPhase>>({});
  const [currentElapsedSec, setCurrentElapsedSec] = useState<Record<string, number>>({});
  const [internalIsRacing, setInternalIsRacing] = useState(false);
  const isRacing = controlledIsRacing !== undefined ? controlledIsRacing : internalIsRacing;
  const rafRef = useRef<number | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const setIsRacing = useCallback(
    (val: boolean) => {
      setInternalIsRacing(val);
      onRacingChange?.(val);
    },
    [onRacingChange]
  );

  const clearAllTimers = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  // Reset duel visuals when selection changes while not racing
  useEffect(() => {
    if (!isRacing) {
      setPhases({});
      setCurrentElapsedSec({});
    }
  }, [selectedIds, isRacing]);

  const selectedStops: SelectedStop[] = Array.from(selectedIds)
    .map((key) => {
      const [driverId, stopNum] = key.split(':');
      const stop = pitStops.find((s) => s.driverId === driverId && s.stop === stopNum);
      if (!stop) return null;
      const result = raceResults.find((r) => r.Driver.driverId === driverId);
      return {
        pitStop: stop,
        constructorId: result?.Constructor.constructorId,
        driverName: result
          ? `${result.Driver.givenName} ${result.Driver.familyName}`
          : driverId.replace(/_/g, ' '),
        teamName: result?.Constructor.name ?? 'Independent',
      };
    })
    .filter(Boolean) as SelectedStop[];

  // Compute timing plan for each car
  const carTimings = React.useMemo(() => {
    if (selectedStops.length === 0) return {};
    const durations = selectedStops.map((s) => parseDurationToSeconds(s.pitStop.duration) || 24);
    const maxDuration = Math.max(...durations);

    const map: Record<string, { totalWallMs: number; entryMs: number; stoppedMs: number; exitMs: number; realSec: number }> = {};
    selectedStops.forEach((s, idx) => {
      const key = pitStopKey(s.pitStop);
      const realSec = durations[idx];
      const totalWallMs = (realSec / maxDuration) * BASE_SIMULATION_MS;
      const entryMs = totalWallMs * ENTRY_FRACTION;
      const stoppedMs = totalWallMs * STOPPED_FRACTION;
      const exitMs = totalWallMs * EXIT_FRACTION;
      map[key] = { totalWallMs, entryMs, stoppedMs, exitMs, realSec };
    });
    return map;
  }, [selectedStops]);

  const handleRace = useCallback(() => {
    if (isRacing || selectedStops.length === 0) return;
    clearAllTimers();
    setIsRacing(true);

    // Step 1: Teleport cars to off-screen left (pre_entry) with 0 transition
    const preEntryPhases: Record<string, AnimPhase> = {};
    for (const s of selectedStops) preEntryPhases[pitStopKey(s.pitStop)] = 'pre_entry';
    setPhases(preEntryPhases);
    setCurrentElapsedSec({});

    // Step 2: Next frame start pit entry deceleration and continuous stopwatch
    const t1 = setTimeout(() => {
      const entryPhases: Record<string, AnimPhase> = {};
      for (const s of selectedStops) entryPhases[pitStopKey(s.pitStop)] = 'entry';
      setPhases(entryPhases);

      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;

        const nextElapsed: Record<string, number> = {};
        const nextPhases: Record<string, AnimPhase> = {};
        let allCompleted = true;

        for (const s of selectedStops) {
          const key = pitStopKey(s.pitStop);
          const timing = carTimings[key];
          if (!timing) continue;

          const progress = Math.min(elapsed / timing.totalWallMs, 1);
          nextElapsed[key] = progress * timing.realSec;

          if (elapsed < timing.entryMs) {
            nextPhases[key] = 'entry';
            allCompleted = false;
          } else if (elapsed < timing.entryMs + timing.stoppedMs) {
            nextPhases[key] = 'stopped';
            allCompleted = false;
          } else if (elapsed < timing.totalWallMs) {
            nextPhases[key] = 'exit';
            allCompleted = false;
          } else {
            nextPhases[key] = 'done';
          }
        }

        setCurrentElapsedSec(nextElapsed);
        setPhases(nextPhases);

        if (!allCompleted) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setIsRacing(false);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    }, 40);
    timeoutsRef.current.push(t1);
  }, [isRacing, selectedStops, carTimings, clearAllTimers]);

  if (selectedStops.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center">
        <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
          <Gauge className="size-5" />
        </div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Pit Stop Duel Arena
        </h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Select up to 4 pit stops from the tables above to simulate and compare their real-time pit lane execution.
        </p>
      </div>
    );
  }

  const isDone = Object.values(phases).length > 0 && Object.values(phases).every((p) => p === 'done');

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden space-y-4 p-5">
      {/* Duel Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground font-black italic px-2.5 py-0.5 rounded text-xs tracking-wider">
            F1
          </div>
          <div>
            <h3 className="font-black uppercase tracking-tight text-base">
              Pit Stop Duel Comparison
            </h3>
            <p className="text-xs text-muted-foreground">
              {selectedStops.length} of 4 stops selected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onClear}
            disabled={isRacing}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition-colors disabled:opacity-40"
          >
            <Trash2 className="size-3.5" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={handleRace}
            disabled={isRacing}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
              'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Play className="size-3.5 fill-current" />
            <span>{isRacing ? 'Simulating...' : 'Start Duel'}</span>
          </button>
        </div>
      </div>

      {/* Lanes */}
      <div className="space-y-3">
        {selectedStops.map((s) => {
          const key = pitStopKey(s.pitStop);
          const theme = getTeamTheme(s.constructorId);
          const timing = carTimings[key] ?? { entryMs: 2000, exitMs: 2000 };
          return (
            <PitBoxScene
              key={key}
              teamColor={theme.primary}
              phase={phases[key] ?? 'idle'}
              currentElapsedSec={currentElapsedSec[key] ?? 0}
              entryDurationMs={timing.entryMs}
              exitDurationMs={timing.exitMs}
              driverName={s.driverName}
              teamName={s.teamName}
              duration={s.pitStop.duration}
              lap={s.pitStop.lap}
            />
          );
        })}
      </div>

      {/* Delta Leaderboard */}
      {isDone && selectedStops.length > 1 && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Duel Timing Analysis</span>
              <span>Delta</span>
            </div>
            {(() => {
              const sorted = [...selectedStops].sort(
                (a, b) => parseDurationToSeconds(a.pitStop.duration) - parseDurationToSeconds(b.pitStop.duration)
              );
              const fastest = parseDurationToSeconds(sorted[0].pitStop.duration);
              return sorted.map((s, i) => {
                const dur = parseDurationToSeconds(s.pitStop.duration);
                const delta = dur - fastest;
                const theme = getTeamTheme(s.constructorId);
                return (
                  <div key={pitStopKey(s.pitStop)} className="flex items-center justify-between py-1.5 border-b border-zinc-800/40 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-4 rounded-full shrink-0" style={{ backgroundColor: theme.primary }} />
                      <span className="text-sm font-semibold text-foreground">{s.driverName}</span>
                      <span className="text-xs text-muted-foreground">Lap {s.pitStop.lap}</span>
                    </div>
                    <div className="font-mono text-sm tabular-nums">
                      {i === 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                          <Trophy className="size-3.5" />
                          {formatDuration(s.pitStop.duration)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {formatDuration(s.pitStop.duration)}{' '}
                          <span className="text-rose-400 font-semibold ml-1.5">+{delta.toFixed(3)}s</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}