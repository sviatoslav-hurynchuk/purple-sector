import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMaxYear(): number {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}

export function parseYear(season?: string, maxYear: number = getMaxYear()): number {
  if (!season) return new Date().getFullYear();
  const parsed = parseInt(season, 10);
  if (!Number.isFinite(parsed)) return new Date().getFullYear();
  if (parsed < 1950) return 1950;
  if (parsed > maxYear) return maxYear;
  return parsed;
}

export function parseRound(round?: string): number | null {
  if (!round) return null;
  const parsed = parseInt(round, 10);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 50 ? parsed : null;
}

export function isRacePast(dateStr: string, timeStr?: string): boolean {
  if (!dateStr) return false;
  if (timeStr) {
    const cleanTime = timeStr.endsWith('Z') ? timeStr : `${timeStr}Z`;
    const fullDate = new Date(`${dateStr}T${cleanTime}`);
    if (!isNaN(fullDate.getTime())) {
      return fullDate.getTime() < Date.now();
    }
  }
  const endOfDay = new Date(`${dateStr}T23:59:59Z`);
  return !isNaN(endOfDay.getTime()) ? endOfDay.getTime() < Date.now() : false;
}

export function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return dateStr;

  const [, year, month, day] = match;
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  if (
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() + 1 !== Number(month) ||
    parsed.getUTCDate() !== Number(day)
  ) {
    return dateStr;
  }

  return `${day}.${month}.${year}`;
}

export function formatDateInTimezone(date: Date | string, timeZone: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return typeof date === 'string' ? formatDateDDMMYYYY(date) : '';

  try {
    return new Intl.DateTimeFormat('uk-UA', {
      timeZone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat('uk-UA', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  }
}
