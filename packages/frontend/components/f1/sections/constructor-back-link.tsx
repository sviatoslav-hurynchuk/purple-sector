'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface ConstructorBackLinkProps {
  fallbackSeason?: string | number;
}

export function ConstructorBackLink({ fallbackSeason }: ConstructorBackLinkProps) {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const season = searchParams.get('season') || (fallbackSeason ? String(fallbackSeason) : '');

  if (from === 'reliability') {
    const query = season ? `?season=${encodeURIComponent(season)}` : '';
    return (
      <Link
        href={`/reliability${query}`}
        className="group inline-flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="size-4 text-zinc-500 group-hover:-translate-x-0.5 group-hover:text-white transition-all" />
        <span>RELIABILITY OVERVIEW</span>
      </Link>
    );
  }

  return (
    <Link
      href="/constructors"
      className="group inline-flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors"
    >
      <ChevronLeft className="size-4 text-zinc-500 group-hover:-translate-x-0.5 group-hover:text-white transition-all" />
      <span>ALL CONSTRUCTORS</span>
    </Link>
  );
}
