import type { Metadata } from 'next';
import { getSeasonHeadToHead } from '@/lib/api';
import { getMaxYear } from '@/lib/utils';
import { HeadToHeadContent } from '@/components/f1/head-to-head/head-to-head-content';

export const metadata: Metadata = {
  title: 'Teammate Head-to-Head',
  description:
    'Comprehensive intra-team Formula 1 teammate battles across Qualifying, Race results, points share, and median lap time deltas.',
};

interface HeadToHeadPageProps {
  searchParams: Promise<{ season?: string }>;
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
  const requestedYear = resolvedParams.season
    ? parseInt(resolvedParams.season, 10)
    : maxYear;

  const validYear =
    !isNaN(requestedYear) && requestedYear >= FIRST_SEASON && requestedYear <= maxYear
      ? requestedYear
      : maxYear;

  const data = await getSeasonHeadToHead(validYear);

  return (
    <HeadToHeadContent
      data={data}
      season={validYear}
      allYears={allYears}
    />
  );
}
