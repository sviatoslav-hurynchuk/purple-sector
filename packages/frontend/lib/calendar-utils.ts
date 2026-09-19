import type { Race } from '@/types/f1';
import { isRacePast, formatDateDDMMYYYY } from '@/lib/utils';

const MONTH_NAMES = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const;

export interface RaceWeekendInfo {
  month: string;
  days: string;
  startMonth: string;
  endMonth: string;
  isCrossMonth: boolean;
  formattedDate: string;
}

/**
 * Extracts authentic F1 weekend date ranges (e.g. "06-08 MAR" or "30-01 OCT/NOV")
 * directly matching the typography seen in official Formula 1 calendar posters.
 */
export function getRaceWeekendInfo(race: Race): RaceWeekendInfo {
  if (!race.date) {
    return {
      month: '',
      days: '',
      startMonth: '',
      endMonth: '',
      isCrossMonth: false,
      formattedDate: '',
    };
  }

  const raceDate = new Date(`${race.date}T00:00:00Z`);
  if (isNaN(raceDate.getTime())) {
    return {
      month: '',
      days: race.date,
      startMonth: '',
      endMonth: '',
      isCrossMonth: false,
      formattedDate: race.date,
    };
  }

  let startDate: Date;
  if (race.FirstPractice?.date) {
    const fpDate = new Date(`${race.FirstPractice.date}T00:00:00Z`);
    if (!isNaN(fpDate.getTime()) && fpDate.getTime() <= raceDate.getTime()) {
      startDate = fpDate;
    } else {
      startDate = new Date(raceDate.getTime() - 2 * 86400000);
    }
  } else {
    // Standard Grand Prix weekend span (Friday to Sunday)
    startDate = new Date(raceDate.getTime() - 2 * 86400000);
  }

  const startDay = String(startDate.getUTCDate()).padStart(2, '0');
  const endDay = String(raceDate.getUTCDate()).padStart(2, '0');
  const startMonth = MONTH_NAMES[startDate.getUTCMonth()] ?? '';
  const endMonth = MONTH_NAMES[raceDate.getUTCMonth()] ?? '';
  const isCrossMonth = startMonth !== endMonth;

  const monthLabel = isCrossMonth ? `${startMonth} · ${endMonth}` : endMonth;
  const daysLabel = `${startDay}-${endDay}`;

  return {
    month: monthLabel,
    days: daysLabel,
    startMonth,
    endMonth,
    isCrossMonth,
    formattedDate: formatDateDDMMYYYY(race.date),
  };
}

export interface SeasonCalendarStats {
  totalRaces: number;
  sprintCount: number;
  completedCount: number;
  remainingCount: number;
  progressPercentage: number;
  nextRace: Race | null;
}

/**
 * Computes telemetry metrics for the entire season calendar.
 */
export function computeSeasonCalendarStats(races: Race[]): SeasonCalendarStats {
  const totalRaces = races.length;
  const sprintCount = races.filter((r) => Boolean(r.Sprint)).length;
  const completedCount = races.filter((r) => isRacePast(r.date, r.time)).length;
  const remainingCount = Math.max(0, totalRaces - completedCount);
  const progressPercentage = totalRaces > 0 ? Math.round((completedCount / totalRaces) * 100) : 0;
  const nextRace = races.find((r) => !isRacePast(r.date, r.time)) ?? null;

  return {
    totalRaces,
    sprintCount,
    completedCount,
    remainingCount,
    progressPercentage,
    nextRace,
  };
}
