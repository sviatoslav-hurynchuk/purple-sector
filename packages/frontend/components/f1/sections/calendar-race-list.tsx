import { getRaceSchedule } from '@/lib/api';
import { parseYear, getMaxYear } from '@/lib/utils';
import { CalendarCockpit } from '@/components/f1/calendar/calendar-cockpit';

interface CalendarRaceListProps {
  searchParams: Promise<{ season?: string }>;
  allYears: number[];
}

export async function CalendarRaceList({ searchParams, allYears }: CalendarRaceListProps) {
  const { season } = await searchParams;
  const maxYear = getMaxYear();
  const year = parseYear(season, maxYear);
  const races = await getRaceSchedule(year);

  return <CalendarCockpit races={races} year={year} allYears={allYears} />;
}
