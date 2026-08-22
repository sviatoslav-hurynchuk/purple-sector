'use client';

import React, { useState, useCallback, useRef } from 'react';
import type { PitStopEntry, RaceResultEntry } from '@/types/f1';
import { cn } from '@/lib/utils';
import { getTeamTheme } from '@/lib/team-colors';
import { pitStopKey, formatDuration } from './pit-stop-chronicle';

// ── Animation constants ───────────────────────────────────────────────────────

/** Total wall-clock time for the "Race!" animation in ms */
const RACE_DURATION_MS = 4000;
/** How long the car decelerates/brakes when entering the pit box */
const BRAKE_PHASE_FRACTION = 0.15;
/** How long the car accelerates out of the pit box */
const ACCEL_PHASE_FRACTION = 0.15;

// ── F1 Car SVG (top-down view) ────────────────────────────────────────────────

function F1CarSvg({ color, secondaryColor = '#ffffff' }: { color: string; secondaryColor?: string }) {
  return (
    <svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Main chassis */}
      <ellipse cx="60" cy="20" rx="44" ry="10" fill={color} />
      {/* Nose cone */}
      <polygon points="104,20 112,18 115,20 112,22" fill={color} />
      {/* Cockpit/halo area */}
      <ellipse cx="58" cy="20" rx="14" ry="7" fill={secondaryColor} opacity="0.15" />
      <ellipse cx="58" cy="20" rx="10" ry="5" fill="#111" />
      <ellipse cx="56" cy="19" rx="6" ry="3.5" fill="#1a1a2e" />
      {/* Front wing */}
      <rect x="100" y="13" width="12" height="3" rx="1" fill={color} opacity="0.85" />
      <rect x="100" y="24" width="12" height="3" rx="1" fill={color} opacity="0.85" />
      <rect x="108" y="13" width="2" height="14" rx="1" fill={color} />
      {/* Rear wing */}
      <rect x="8" y="11" width="14" height="4" rx="1.5" fill={color} opacity="0.9" />
      <rect x="8" y="25" width="14" height="4" rx="1.5" fill={color} opacity="0.9" />
      <rect x="12" y="11" width="2" height="18" rx="1" fill={color} />
      {/* Sidepods */}
      <ellipse cx="52" cy="11" rx="22" ry="5.5" fill={color} opacity="0.8" />
      <ellipse cx="52" cy="29" rx="22" ry="5.5" fill={color} opacity="0.8" />
      {/* Wheels - front */}
      <ellipse cx="86" cy="10" rx="7" ry="4.5" fill="#1a1a1a" />
      <ellipse cx="86" cy="10" rx="5" ry="3" fill="#2a2a2a" />
      <ellipse cx="86" cy="30" rx="7" ry="4.5" fill="#1a1a1a" />
      <ellipse cx="86" cy="30" rx="5" ry="3" fill="#2a2a2a" />
      {/* Wheels - rear */}
      <ellipse cx="34" cy="10" rx="8" ry="5" fill="#1a1a1a" />
      <ellipse cx="34" cy="10" rx="6" ry="3.5" fill="#2a2a2a" />
      <ellipse cx="34" cy="30" rx="8" ry="5" fill="#1a1a1a" />
      <ellipse cx="34" cy="30" rx="6" ry="3.5" fill="#2a2a2a" />
      {/* Team livery stripe */}
      <rect x="30" y="16" width="60" height="3" rx="1.5" fill={secondaryColor} opacity="0.3" />
      {/* Wheel covers highlight */}
      <ellipse cx="86" cy="9" rx="3" ry="1.8" fill={color} opacity="0.6" />
      <ellipse cx="86" cy="29" rx="3" ry="1.8" fill={color} opacity="0.6" />
      <ellipse cx="34" cy="9" rx="3.5" ry="2" fill={color} opacity="0.6" />
      <ellipse cx="34" cy="29" rx="3.5" ry="2" fill={color} opacity="0.6" />
    </svg>
  );
}

// ── Mechanic SVG figures ──────────────────────────────────────────────────────

function MechanicFigure({ working, mirrorX = false, color }: { working: boolean; mirrorX?: boolean; color: string }) {
  return (
    <svg
      viewBox="0 0 24 36"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={mirrorX ? { transform: 'scaleX(-1)' } : undefined}
    >
      {/* Head */}
      <circle cx="12" cy="5" r="4" fill={color} />
      {/* Helmet visor */}
      <ellipse cx="12" cy="5.5" rx="2.5" ry="2" fill="#333" opacity="0.8" />
      {/* Body */}
      <rect x="7" y="10" width="10" height="12" rx="2" fill={color} />
      {/* Stripes on suit */}
      <rect x="7" y="14" width="10" height="1.5" fill="white" opacity="0.25" />
      {/* Left arm */}
      {working ? (
        <line x1="7" y1="12" x2="2" y2="8" stroke={color} strokeWidth="3" strokeLinecap="round" />
      ) : (
        <line x1="7" y1="12" x2="3" y2="18" stroke={color} strokeWidth="3" strokeLinecap="round" />
      )}
      {/* Right arm */}
      {working ? (
        <line x1="17" y1="12" x2="22" y2="8" stroke={color} strokeWidth="3" strokeLinecap="round" />
      ) : (
        <line x1="17" y1="12" x2="21" y2="18" stroke={color} strokeWidth="3" strokeLinecap="round" />
      )}
      {/* Legs */}
      <line x1="10" y1="22" x2="9" y2="34" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="14" y1="22" x2="15" y2="34" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* Tool/wheel gun in hands when working */}
      {working && (
        <>
          <rect x="0" y="5" width="5" height="3" rx="1" fill="#555" />
          <rect x="19" y="5" width="5" height="3" rx="1" fill="#555" />
        </>
      )}
    </svg>
  );
}

// ── Pit box scene ─────────────────────────────────────────────────────────────

type AnimPhase = 'idle' | 'entry' | 'stopped' | 'exit' | 'done';

interface PitBoxSceneProps {
  teamColor: string;
  phase: AnimPhase;
  /** Duration in seconds for the progress timer */
  durationSec: number;
  /** Elapsed fraction 0-1 during 'stopped' phase */
  stoppedProgress: number;
  driverName: string;
  duration: string;
}

function PitBoxScene({
  teamColor,
  phase,
  durationSec,
  stoppedProgress,
  driverName,
  duration,
}: PitBoxSceneProps) {
  // Car X position: enters from left (-130%), stops at center, exits right (+130%)
  const carX =
    phase === 'idle' ? '-130%'
    : phase === 'entry' ? '0%'
    : phase === 'stopped' ? '0%'
    : phase === 'exit' ? '130%'
    : '130%';

  const entryDuration = `${RACE_DURATION_MS * BRAKE_PHASE_FRACTION}ms`;
  const exitDuration = `${RACE_DURATION_MS * ACCEL_PHASE_FRACTION}ms`;
  const isWorking = phase === 'stopped';

  return (
    <div className="relative h-28 bg-zinc-900/60 rounded-xl border border-zinc-800 overflow-hidden select-none">
      {/* Pit lane floor markings */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-zinc-700/50" />
      <div
        className="absolute top-0 bottom-0 left-1/3 right-1/3 border-x-2 border-dashed opacity-20"
        style={{ borderColor: teamColor }}
      />

      {/* Mechanic figures — only visible when stopped */}
      {(phase === 'stopped' || phase === 'done') && (
        <>
          {/* Front left */}
          <div className="absolute top-2 left-[28%] w-7 h-10">
            <MechanicFigure working={isWorking} color={teamColor} />
          </div>
          {/* Rear left */}
          <div className="absolute top-2 left-[38%] w-7 h-10">
            <MechanicFigure working={isWorking} mirrorX color={teamColor} />
          </div>
          {/* Front right */}
          <div className="absolute bottom-2 left-[28%] w-7 h-10">
            <MechanicFigure working={isWorking} mirrorX color={teamColor} />
          </div>
          {/* Rear right */}
          <div className="absolute bottom-2 left-[38%] w-7 h-10">
            <MechanicFigure working={isWorking} color={teamColor} />
          </div>
          {/* Jack man - front */}
          <div className="absolute top-1/2 -translate-y-1/2 left-[56%] w-6 h-10">
            <MechanicFigure working={isWorking} color={teamColor} />
          </div>
        </>
      )}

      {/* F1 Car */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-44 h-14"
        style={{
          left: '50%',
          marginLeft: '-88px',
          transform: `translateX(${carX}) translateY(-50%)`,
          transition:
            phase === 'entry'
              ? `transform ${entryDuration} cubic-bezier(0.3,0,0.1,1)`
              : phase === 'exit'
              ? `transform ${exitDuration} cubic-bezier(0.6,0,0.8,1)`
              : 'none',
        }}
      >
        <F1CarSvg color={teamColor} />
      </div>

      {/* Driver label */}
      <div className="absolute bottom-1 right-3 text-right">
        <p className="text-xs font-bold text-zinc-400 truncate max-w-[140px]">{driverName}</p>
        {phase === 'stopped' && (
          <p className="font-mono text-xs text-primary tabular-nums">
            {(stoppedProgress * durationSec).toFixed(2)}s
          </p>
        )}
        {(phase === 'exit' || phase === 'done') && (
          <p className="font-mono text-xs text-green-400 tabular-nums">{formatDuration(duration)} ✓</p>
        )}
      </div>
    </div>
  );
}

// ── Main Duel component ───────────────────────────────────────────────────────

interface SelectedStop {
  pitStop: PitStopEntry;
  constructorId: string | undefined;
  driverName: string;
}

interface PitStopDuelProps {
  pitStops: PitStopEntry[];
  raceResults: RaceResultEntry[];
  selectedIds: Set<string>;
  onClear: () => void;
}

/**
 * Animated pit stop comparison ("Pit Stop Duel").
 *
 * Each selected pit stop is rendered as a pit box scene with:
 *   - An F1 car SVG (colored by team) that enters from the left, stops,
 *     then exits to the right.
 *   - Four mechanic SVG figures that animate (arms up = working).
 *   - A live timer that counts up to the actual stop duration.
 *
 * All scenes animate in sync. The longest stop normalises to RACE_DURATION_MS,
 * so shorter stops finish earlier — creating an intuitive sense of speed delta.
 */
export function PitStopDuel({
  pitStops,
  raceResults,
  selectedIds,
  onClear,
}: PitStopDuelProps) {
  const [phases, setPhases] = useState<Record<string, AnimPhase>>({});
  const [stoppedProgress, setStoppedProgress] = useState<Record<string, number>>({});
  const [isRacing, setIsRacing] = useState(false);
  const rafRef = useRef<number | null>(null);

  const selectedStops: SelectedStop[] = Array.from(selectedIds)
    .map((key) => {
      const [driverId, stopNum] = key.split(':');
      const stop = pitStops.find(
        (s) => s.driverId === driverId && s.stop === stopNum
      );
      if (!stop) return null;
      const result = raceResults.find((r) => r.Driver.driverId === driverId);
      return {
        pitStop: stop,
        constructorId: result?.Constructor.constructorId,
        driverName: result
          ? `${result.Driver.givenName} ${result.Driver.familyName}`
          : driverId.replace(/_/g, ' '),
      };
    })
    .filter(Boolean) as SelectedStop[];

  const handleRace = useCallback(() => {
    if (isRacing || selectedStops.length === 0) return;
    setIsRacing(true);

    // Resolve durations; use RACE_DURATION_MS as the wall-clock anchor for the longest
    const durations = selectedStops.map((s) => parseFloat(s.pitStop.duration) || 24);
    const maxDuration = Math.max(...durations);

    // Phase 1: all cars enter
    const entryMs = RACE_DURATION_MS * BRAKE_PHASE_FRACTION;
    const initPhases: Record<string, AnimPhase> = {};
    for (const s of selectedStops) initPhases[pitStopKey(s.pitStop)] = 'entry';
    setPhases(initPhases);

    // Phase 2: all cars stop and timers run proportionally
    setTimeout(() => {
      const stopPhases: Record<string, AnimPhase> = {};
      for (const s of selectedStops) stopPhases[pitStopKey(s.pitStop)] = 'stopped';
      setPhases(stopPhases);

      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;

        const nextProgress: Record<string, number> = {};
        const nextPhases: Record<string, AnimPhase> = { ...stopPhases };

        for (let i = 0; i < selectedStops.length; i++) {
          const s = selectedStops[i];
          const key = pitStopKey(s.pitStop);
          const dur = durations[i];
          // Wall-clock time allocated for this stop proportional to the longest
          const wallMs = (dur / maxDuration) * RACE_DURATION_MS * (1 - BRAKE_PHASE_FRACTION - ACCEL_PHASE_FRACTION);
          const progress = Math.min(elapsed / wallMs, 1);
          nextProgress[key] = progress;
          if (progress >= 1) nextPhases[key] = 'exit';
        }

        setStoppedProgress(nextProgress);
        setPhases(nextPhases);

        if (Object.values(nextProgress).some((p) => p < 1)) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          // All done — exit phase
          setTimeout(() => {
            const donePhases: Record<string, AnimPhase> = {};
            for (const s of selectedStops) donePhases[pitStopKey(s.pitStop)] = 'done';
            setPhases(donePhases);
            setIsRacing(false);
          }, RACE_DURATION_MS * ACCEL_PHASE_FRACTION);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    }, entryMs);
  }, [isRacing, selectedStops]);

  const handleReset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPhases({});
    setStoppedProgress({});
    setIsRacing(false);
  }, []);

  if (selectedStops.length === 0) return null;

  return (
    <div className="border-t border-zinc-800 mt-0 bg-zinc-950/80">
      {/* Duel header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground font-black italic px-2 py-0.5 rounded text-xs tracking-wider">
            F1
          </div>
          <span className="font-black uppercase tracking-wider text-sm">
            PIT STOP DUEL
          </span>
          <span className="text-xs font-mono text-zinc-500 bg-zinc-800 rounded-full px-2 py-0.5">
            {selectedStops.length}/4
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isRacing}
            className="text-xs text-zinc-400 hover:text-zinc-100 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={isRacing}
            className="text-xs text-zinc-400 hover:text-zinc-100 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handleRace}
            disabled={isRacing}
            className={cn(
              'px-5 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all',
              'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isRacing ? 'Racing...' : 'Race! 🏁'}
          </button>
        </div>
      </div>

      {/* Pit box scenes */}
      <div className="px-6 py-4 space-y-3">
        {selectedStops.map((s) => {
          const key = pitStopKey(s.pitStop);
          const theme = getTeamTheme(s.constructorId);
          return (
            <PitBoxScene
              key={key}
              teamColor={theme.primary}
              phase={phases[key] ?? 'idle'}
              durationSec={parseFloat(s.pitStop.duration) || 24}
              stoppedProgress={stoppedProgress[key] ?? 0}
              driverName={s.driverName}
              duration={s.pitStop.duration}
            />
          );
        })}
      </div>

      {/* Delta summary after racing */}
      {Object.values(phases).every((p) => p === 'done') && selectedStops.length > 1 && (
        <div className="px-6 pb-4">
          <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
              Delta
            </p>
            {(() => {
              const sorted = [...selectedStops].sort(
                (a, b) => parseFloat(a.pitStop.duration) - parseFloat(b.pitStop.duration)
              );
              const fastest = parseFloat(sorted[0].pitStop.duration);
              return sorted.map((s, i) => {
                const dur = parseFloat(s.pitStop.duration);
                const delta = dur - fastest;
                const theme = getTeamTheme(s.constructorId);
                return (
                  <div key={pitStopKey(s.pitStop)} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />
                      <span className="text-sm font-semibold">{s.driverName}</span>
                    </div>
                    <div className="font-mono text-sm tabular-nums">
                      {i === 0 ? (
                        <span className="text-green-400 font-bold">{formatDuration(s.pitStop.duration)} 🏆</span>
                      ) : (
                        <span className="text-zinc-400">
                          {formatDuration(s.pitStop.duration)}{' '}
                          <span className="text-red-400">+{delta.toFixed(3)}s</span>
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