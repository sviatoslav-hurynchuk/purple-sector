import type { Metadata } from 'next';
import { getSeasonReliability } from '@/lib/api';
import { getMaxYear, parseYear } from '@/lib/utils';
import { ReliabilityContent } from '@/components/f1/reliability/reliability-content';

export const metadata: Metadata = {
  title: 'Reliability & Attrition Hub',
  description:
    'Formula 1 car reliability, completion rates, DNF mechanical failures, and round-by-round attrition matrix across all constructors and drivers.',
};

export const revalidate = 900;

interface ReliabilityPageProps {
  searchParams: Promise<{ season?: string }>;
}

export default async function ReliabilityPage({
  searchParams,
}: ReliabilityPageProps) {
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

  const data = await getSeasonReliability(validYear);

  return (
    <ReliabilityContent
      data={data}
      season={validYear}
      allYears={allYears}
    />
  );
}
