import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DriversContent } from '@/components/f1/sections/drivers-content';
import { getMaxYear } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'F1 Drivers Catalog | Purple Sector',
  description: 'Explore the full driver lineup for the Formula 1 Championship.',
};

interface DriversPageProps {
  searchParams: Promise<{ season?: string }>;
}

export default function DriversPage({ searchParams }: DriversPageProps) {
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
          <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="h-8 w-48 bg-zinc-800 animate-pulse rounded mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 bg-zinc-900 animate-pulse rounded-xl border border-zinc-800" />
              ))}
            </div>
          </div>
        }
      >
        <DriversContent searchParams={searchParams} allYears={allYears} />
      </Suspense>
    </div>
  );
}
