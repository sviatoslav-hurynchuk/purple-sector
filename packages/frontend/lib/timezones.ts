import type { Circuit, F1Session } from '@/types/f1';

/**
 * Maps F1 circuits/countries to their IANA timezone strings.
 * Used for converting UTC session times to circuit local time ("Track time").
 */
const CIRCUIT_TIMEZONES: Record<string, string> = {
  // Countries
  Australia: 'Australia/Melbourne',
  China: 'Asia/Shanghai',
  Japan: 'Asia/Tokyo',
  Bahrain: 'Asia/Bahrain',
  'Saudi Arabia': 'Asia/Riyadh',
  Italy: 'Europe/Rome',
  Monaco: 'Europe/Monaco',
  Spain: 'Europe/Madrid',
  Canada: 'America/Toronto',
  Austria: 'Europe/Vienna',
  UK: 'Europe/London',
  'United Kingdom': 'Europe/London',
  Hungary: 'Europe/Budapest',
  Belgium: 'Europe/Brussels',
  Netherlands: 'Europe/Amsterdam',
  Azerbaijan: 'Asia/Baku',
  Singapore: 'Asia/Singapore',
  Qatar: 'Asia/Qatar',
  Mexico: 'America/Mexico_City',
  Brazil: 'America/Sao_Paulo',
  UAE: 'Asia/Dubai',
  'United Arab Emirates': 'Asia/Dubai',
  France: 'Europe/Paris',
  Germany: 'Europe/Berlin',
  Portugal: 'Europe/Lisbon',
  Turkey: 'Europe/Istanbul',
  Russia: 'Europe/Moscow',
  Malaysia: 'Asia/Kuala_Lumpur',
  India: 'Asia/Kolkata',
  Korea: 'Asia/Seoul',
};

/**
 * Resolves the IANA timezone for a specific F1 Circuit.
 * Checks locality overrides (like USA cities) first, then falls back to country map, then UTC.
 */
export function getCircuitTimezone(circuit: Circuit): string {
  const { country, locality } = circuit.Location;

  // Specific locality overrides for countries with multiple timezones (USA, etc.)
  if (country === 'USA' || country === 'United States') {
    const loc = locality.toLowerCase();
    if (loc.includes('miami')) return 'America/New_York';
    if (loc.includes('austin')) return 'America/Chicago';
    if (loc.includes('las vegas')) return 'America/Los_Angeles';
    if (loc.includes('indianapolis')) return 'America/Indiana/Indianapolis';
    return 'America/New_York';
  }

  return CIRCUIT_TIMEZONES[country] ?? 'UTC';
}

/**
 * Formats a Date object into "HH:MM" in the specified IANA timezone.
 */
export function formatTimeInTimezone(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    // Fallback if invalid timezone passed
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }
}

/**
 * Formats a Date object into { day: "24", month: "JUL" } in the specified IANA timezone.
 */
export function formatDatePartsInTimezone(date: Date, timeZone: string): { day: string; month: string } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      day: '2-digit',
      month: 'short',
    });
    const parts = formatter.formatToParts(date);
    const day = parts.find((p) => p.type === 'day')?.value ?? '';
    const month = (parts.find((p) => p.type === 'month')?.value ?? '').toUpperCase();
    return { day, month };
  } catch {
    return { day: date.getUTCDate().toString().padStart(2, '0'), month: 'TBD' };
  }
}

export interface FormattedSessionItem {
  id: string;
  name: string;
  dateParts: { day: string; month: string };
  timeString: string;
  rawDate: Date;
}

/**
 * Extracts and formats all weekend sessions for a given race into standardized list items.
 */
export function getFormattedSessions(
  race: {
    date: string;
    time?: string;
    FirstPractice?: F1Session;
    SecondPractice?: F1Session;
    ThirdPractice?: F1Session;
    Qualifying?: F1Session;
    Sprint?: F1Session;
    SprintQualifying?: F1Session;
    SprintShootout?: F1Session;
  },
  timeZone: string
): FormattedSessionItem[] {
  const sessions: Array<{ id: string; name: string; session?: F1Session; durationMinutes?: number }> = [
    { id: 'fp1', name: 'PRACTICE 1', session: race.FirstPractice, durationMinutes: 60 },
    { id: 'fp2', name: 'PRACTICE 2', session: race.SecondPractice, durationMinutes: 60 },
    { id: 'fp3', name: 'PRACTICE 3', session: race.ThirdPractice, durationMinutes: 60 },
    { id: 'sprint-qualifying', name: 'SPRINT QUALIFYING', session: race.SprintQualifying || race.SprintShootout, durationMinutes: 45 },
    { id: 'sprint', name: 'SPRINT', session: race.Sprint, durationMinutes: 60 },
    { id: 'qualifying', name: 'QUALIFYING', session: race.Qualifying, durationMinutes: 60 },
    { id: 'race', name: 'RACE', session: { date: race.date, time: race.time } },
  ];

  const results: FormattedSessionItem[] = [];

  for (const item of sessions) {
    if (!item.session) continue;

    let rawDate: Date;
    if (item.session.time) {
      // Clean up time string if it doesn't end with Z or offset
      const timeStr = item.session.time.endsWith('Z') ? item.session.time : `${item.session.time}Z`;
      rawDate = new Date(`${item.session.date}T${timeStr}`);
    } else {
      rawDate = new Date(`${item.session.date}T12:00:00Z`);
    }

    if (isNaN(rawDate.getTime())) continue;

    const dateParts = formatDatePartsInTimezone(rawDate, timeZone);

    let timeString = '';
    if (item.session.time) {
      const startTime = formatTimeInTimezone(rawDate, timeZone);
      if (item.durationMinutes) {
        const endDate = new Date(rawDate.getTime() + item.durationMinutes * 60 * 1000);
        const endTime = formatTimeInTimezone(endDate, timeZone);
        timeString = `${startTime} - ${endTime}`;
      } else {
        timeString = startTime;
      }
    } else {
      timeString = 'Time TBD';
    }

    results.push({
      id: item.id,
      name: item.name,
      dateParts,
      timeString,
      rawDate,
    });
  }

  // Sort chronologically by start time
  results.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

  return results;
}
