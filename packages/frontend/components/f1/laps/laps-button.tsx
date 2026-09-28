import React from 'react';
import Link from 'next/link';
import { LineChart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LapsButtonProps {
  season: string | number;
  round: string | number;
  className?: string;
}

export function LapsButton({
  season,
  round,
  className,
}: LapsButtonProps) {
  const seasonNum = typeof season === 'string' ? parseInt(season, 10) : season;
  // Lap timing data is available from 1996 onwards
  if (seasonNum < 1996) {
    return null;
  }

  return (
    <Link
      href={`/calendar/${round}/laps?season=${season}`}
      className={cn(
        'group/laps inline-flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl border border-white/10 bg-zinc-950/90 hover:bg-zinc-900 hover:border-red-500/50 text-zinc-300 hover:text-white transition-all shadow-md select-none backdrop-blur-md',
        className
      )}
    >
      <LineChart className="size-3.5 text-red-500" />
      <span>Lap Chart & Replay</span>
      <ArrowRight className="size-3 text-zinc-400 transition-transform duration-200 group-hover/laps:translate-x-0.5" />
    </Link>
  );
}
