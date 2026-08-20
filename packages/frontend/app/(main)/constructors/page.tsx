import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ConstructorsContent } from '@/components/f1/sections/constructors-content';
import { getMaxYear } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Teams & Drivers',
  description: 'Explore all Formula 1 constructors, team lineups, and championship statistics.',
};

interface ConstructorsPageProps {
  searchParams: Promise<{ season?: string }>;
}

export default function ConstructorsPage({ searchParams }: ConstructorsPageProps) {
  const FIRST_SEASON = 1950;
  const maxYear = getMaxYear();
  const allYears = Array.from(
    { length: maxYear - FIRST_SEASON + 1 },
    (_, i) => maxYear - i
  );

  return (
    <div className="space-y-8">
      <Suspense
        fallback={
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-border pb-6">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-zinc-800 animate-pulse rounded" />
                <div className="h-4 w-96 bg-zinc-800/60 animate-pulse rounded" />
              </div>
              <div className="h-10 w-36 bg-zinc-800 animate-pulse rounded-lg" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 bg-zinc-900 animate-pulse rounded-2xl border border-zinc-800" />
              ))}
            </div>
          </div>
        }
      >
        <ConstructorsContent searchParams={searchParams} allYears={allYears} />
      </Suspense>
    </div>
  );
}
