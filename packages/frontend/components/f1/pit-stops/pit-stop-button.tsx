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
        'group/pit inline-flex items-center justify-center gap-2 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md select-none',
        'bg-zinc-900 border border-zinc-700 hover:border-primary/60 hover:bg-zinc-800 text-foreground',
        className
      )}
    >
      <Timer className="size-4 text-primary" />
      <span>Pit Stop Strategy</span>
      <ArrowRight className="size-3.5 text-muted-foreground transition-transform duration-200 group-hover/pit:translate-x-0.5" />
    </Link>
  );
}