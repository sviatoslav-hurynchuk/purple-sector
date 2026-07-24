import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a YYYY-MM-DD date string to DD.MM.YYYY format.
 * Example: "2026-07-26" -> "26.07.2026"
 */
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

/**
 * Formats a Date object or date string into DD.MM.YYYY string in a given timezone.
 */
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
