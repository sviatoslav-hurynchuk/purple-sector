import type { Metadata } from 'next';
import { getSeasonHeadToHead } from '@/lib/api';
import { getMaxYear, parseYear } from '@/lib/utils';
import { HeadToHeadContent } from '@/components/f1/head-to-head/head-to-head-content';

export const metadata: Metadata = {
  title: 'Teammate Head-to-Head',
  description:
    'Comprehensive intra-team Formula 1 teammate battles across Qualifying, Race results, points share, and median lap time deltas.',
};

export const revalidate = 900;

interface HeadToHeadPageProps {
  searchParams: Promise<{ season?: string; team?: string }>;
}

export default async function HeadToHeadPage({
  searchParams,
}: HeadToHeadPageProps) {
  const FIRST_SEASON = 1950;
  const maxYear = getMaxYear();
  const allYears = Array.from(
    { length: maxYear - FIRST_SEASON + 1 },
    (_, i) => maxYear - i
  );

  const resolvedParams = await searchParams;
  const validYear =
    resolvedParams.season && parseInt(resolvedParams.season, 10) < FIRST_SEASON
      ? maxYear
      : parseYear(resolvedParams.season, maxYear);

  const data = await getSeasonHeadToHead(validYear);

  return (
    <HeadToHeadContent
      data={data}
      season={validYear}
      allYears={allYears}
      initialConstructorId={resolvedParams.team}
    />
  );
}
