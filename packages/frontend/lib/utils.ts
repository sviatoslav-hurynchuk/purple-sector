import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseYear(season?: string): number {
  if (!season) return new Date().getFullYear();
  const parsed = parseInt(season, 10);
  return Number.isFinite(parsed) && parsed >= 1950 ? parsed : new Date().getFullYear();
}

export function parseRound(round?: string): number | null {
  if (!round) return null;
  const parsed = parseInt(round, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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
