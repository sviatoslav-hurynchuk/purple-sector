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
        'group/laps inline-flex items-center justify-center gap-2 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md select-none',
        'bg-zinc-900 border border-zinc-700 hover:border-primary/60 hover:bg-zinc-800 text-foreground',
        className
      )}
    >
      <LineChart className="size-4 text-primary" />
      <span>Lap Chart & Replay</span>
      <ArrowRight className="size-3.5 text-muted-foreground transition-transform duration-200 group-hover/laps:translate-x-0.5" />
    </Link>
  );
}
