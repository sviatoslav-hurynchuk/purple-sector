import React from 'react';
import Link from 'next/link';
import { Timer, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PitStopButtonProps {
  season: string | number;
  round: string | number;
  className?: string;
}

export function PitStopButton({
  season,
  round,
  className,
}: PitStopButtonProps) {
  const seasonNum = typeof season === 'string' ? parseInt(season, 10) : season;
  // Pit stop timing loops are available from the 2012 season onwards
  if (seasonNum < 2012) {
    return null;
  }

  return (
    <Link
      href={`/calendar/${round}/pit-stops?season=${season}`}
      className={cn(
        'group/pit inline-flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl border border-white/10 bg-zinc-950/90 hover:bg-zinc-900 hover:border-red-500/50 text-zinc-300 hover:text-white transition-all shadow-md select-none backdrop-blur-md',
        className
      )}
    >
      <Timer className="size-3.5 text-red-500" />
      <span>Pit Stop Strategy</span>
      <ArrowRight className="size-3 text-zinc-400 transition-transform duration-200 group-hover/pit:translate-x-0.5" />
    </Link>
  );
}