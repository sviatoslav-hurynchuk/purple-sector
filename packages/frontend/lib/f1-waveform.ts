import type { CSSProperties } from 'react';

/**
 * 28 baseline soundwave frequency heights (percentages) mimicking voice telemetry.
 */
export const WAVE_BARS = [
  35, 60, 40, 85, 70, 95, 45, 65, 80, 50, 90, 75, 40, 60, 100, 85, 55, 70, 90, 65, 45, 80, 60, 40, 70, 50, 35, 25,
];

const ANIM_NAMES = ['f1Waveform1', 'f1Waveform2', 'f1Waveform3', 'f1Waveform4'];
const DURATIONS = [0.65, 0.85, 0.72, 0.95, 0.68, 0.82];

/**
 * Returns buttery-smooth hardware-accelerated (60/120fps) styles for soundwave bars.
 * Bypasses HTML5 audio low-frequency timeupdate stutter by executing directly on the GPU compositor.
 */
export function getWaveformBarStyle(params: {
  idx: number;
  isPlaying: boolean;
  baseHeightPct: number;
  isPlayed: boolean;
  livery: string;
}): CSSProperties {
  const { idx, isPlaying, baseHeightPct, isPlayed, livery } = params;
  const baseHeight = `${Math.max(24, Math.round(baseHeightPct * 0.65))}%`;

  if (!isPlaying) {
    return {
      height: baseHeight,
      minHeight: '4px',
      backgroundColor: livery,
      opacity: 0.8,
      transform: 'scaleY(1)',
      transformOrigin: 'center',
      transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, background-color 0.2s ease',
    };
  }

  const animName = ANIM_NAMES[idx % ANIM_NAMES.length];
  const duration = DURATIONS[idx % DURATIONS.length];
  const delay = -((idx * 0.17) % 0.85).toFixed(2);

  return {
    height: baseHeight,
    minHeight: '4px',
    backgroundColor: isPlayed ? '#ffffff' : livery,
    opacity: isPlayed ? 1 : 0.85,
    transformOrigin: 'center',
    animation: `${animName} ${duration}s ease-in-out ${delay}s infinite alternate`,
    transition: 'background-color 0.15s ease, opacity 0.15s ease',
  };
}
