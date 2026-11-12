import type { TireCompound } from '@/types/f1';

export interface CompoundStyleConfig {
  label: string;
  shortLabel: string;
  bg: string;
  text: string;
  border: string;
  badgeClass: string;
  circle: string;
}

/**
 * Standard Pirelli tyre compound visual identities across telemetry and strategy widgets.
 */
export const TIRE_COMPOUND_CONFIG: Record<TireCompound, CompoundStyleConfig> = {
  SOFT: {
    label: 'Soft',
    shortLabel: 'S',
    bg: 'bg-red-500/80',
    text: 'text-red-400',
    border: 'border-red-500',
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40',
    circle: '#ef4444',
  },
  MEDIUM: {
    label: 'Medium',
    shortLabel: 'M',
    bg: 'bg-yellow-500/80',
    text: 'text-yellow-400',
    border: 'border-yellow-500',
    badgeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    circle: '#eab308',
  },
  HARD: {
    label: 'Hard',
    shortLabel: 'H',
    bg: 'bg-zinc-100/90',
    text: 'text-zinc-100',
    border: 'border-zinc-300',
    badgeClass: 'bg-white/20 text-zinc-100 border-white/40',
    circle: '#f4f4f5',
  },
  INTERMEDIATE: {
    label: 'Intermediate',
    shortLabel: 'I',
    bg: 'bg-emerald-500/80',
    text: 'text-emerald-400',
    border: 'border-emerald-500',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    circle: '#10b981',
  },
  WET: {
    label: 'Wet',
    shortLabel: 'W',
    bg: 'bg-blue-500/80',
    text: 'text-blue-400',
    border: 'border-blue-500',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    circle: '#3b82f6',
  },
  UNKNOWN: {
    label: 'Unknown',
    shortLabel: 'U',
    bg: 'bg-zinc-700',
    text: 'text-zinc-400',
    border: 'border-zinc-600',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    circle: '#71717a',
  },
};
