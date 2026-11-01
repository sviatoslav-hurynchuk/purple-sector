import type { Race, F1Session } from '@/types/f1';

export type SessionCode = 'P1' | 'P2' | 'P3' | 'SQ' | 'SPRINT' | 'QUALY' | 'RACE';

export interface CalendarSessionItem {
  code: SessionCode;
  name: string;
  startDate: Date;
  endDate: Date;
  durationMinutes: number;
}

export interface ICSOptions {
  /** Filter to specific session codes. If omitted or empty, all sessions are included. */
  sessionCodes?: SessionCode[];
  /** Reminder alert in minutes before session start. Defaults to 15. Set to false to disable. */
  reminderMinutes?: number | false;
  /** Calendar display name (X-WR-CALNAME) */
  calName?: string;
  /** Base URL for event links */
  baseUrl?: string;
}

const SESSION_METADATA: Array<{
  code: SessionCode;
  name: string;
  durationMinutes: number;
  getSession: (race: Race) => F1Session | undefined;
}> = [
  { code: 'P1', name: 'Practice 1', durationMinutes: 60, getSession: (r) => r.FirstPractice },
  { code: 'P2', name: 'Practice 2', durationMinutes: 60, getSession: (r) => r.SecondPractice },
  { code: 'P3', name: 'Practice 3', durationMinutes: 60, getSession: (r) => r.ThirdPractice },
  {
    code: 'SQ',
    name: 'Sprint Qualifying',
    durationMinutes: 45,
    getSession: (r) => r.SprintQualifying || r.SprintShootout,
  },
  { code: 'SPRINT', name: 'Sprint', durationMinutes: 60, getSession: (r) => r.Sprint },
  { code: 'QUALY', name: 'Qualifying', durationMinutes: 60, getSession: (r) => r.Qualifying },
  {
    code: 'RACE',
    name: 'Grand Prix',
    durationMinutes: 120,
    getSession: (r) => (r.date ? { date: r.date, time: r.time } : undefined),
  },
];

/**
 * Extracts all valid scheduled sessions for a given Race weekend.
 */
export function getRaceCalendarSessions(race: Race): CalendarSessionItem[] {
  const result: CalendarSessionItem[] = [];

  for (const meta of SESSION_METADATA) {
    const rawSession = meta.getSession(race);
    if (!rawSession || !rawSession.date) continue;

    const override = race.scheduleOverrides?.find((o) => o.sessionCode === meta.code);
    const dateStr = override?.revisedDate ?? rawSession.date;
    const timeStr = override?.revisedTime ?? rawSession.time;

    let startDate: Date;
    if (timeStr) {
      const cleanTime = timeStr.endsWith('Z') ? timeStr : `${timeStr}Z`;
      startDate = new Date(`${dateStr}T${cleanTime}`);
    } else {
      startDate = new Date(`${dateStr}T12:00:00Z`);
    }

    if (isNaN(startDate.getTime())) continue;

    const durationMinutes = meta.durationMinutes;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    result.push({
      code: meta.code,
      name: meta.name,
      startDate,
      endDate,
      durationMinutes,
    });
  }

  return result.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

/**
 * Formats a Date object to RFC 5545 UTC timestamp format (YYYYMMDDTHHMMSSZ).
 */
export function formatUTCDateTimeICS(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes characters according to RFC 5545 section 3.3.11.
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n');
}

/**
 * Folds lines longer than 75 characters as recommended by RFC 5545.
 */
function foldICSLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  chunks.push(line.slice(0, 75));
  let remaining = line.slice(75);
  while (remaining.length > 0) {
    chunks.push(' ' + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  return chunks.join('\r\n');
}

/**
 * Builds a single VEVENT block for an F1 session.
 */
function buildEventBlock(
  race: Race,
  session: CalendarSessionItem,
  options?: ICSOptions,
  nowUTC = new Date()
): string[] {
  const dtStamp = formatUTCDateTimeICS(nowUTC);
  const dtStart = formatUTCDateTimeICS(session.startDate);
  const dtEnd = formatUTCDateTimeICS(session.endDate);
  const uid = `${race.season}-${race.round}-${session.code.toLowerCase()}@purple-sector`;

  const summary = `F1: ${race.raceName} — ${session.name}`;
  const location = `${race.Circuit.circuitName}, ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`;

  const raceUrl = options?.baseUrl
    ? `${options.baseUrl.replace(/\/$/, '')}/calendar/${race.round}?season=${race.season}`
    : `https://f1.local/calendar/${race.round}?season=${race.season}`;

  const description = [
    `Formula 1 ${race.season} — Round ${race.round}: ${race.raceName}`,
    `Session: ${session.name}`,
    `Circuit: ${race.Circuit.circuitName} (${race.Circuit.Location.locality}, ${race.Circuit.Location.country})`,
    `Track Details & Live Timing: ${raceUrl}`,
  ].join('\n');

  const reminderMinutes = options?.reminderMinutes ?? 15;

  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `LOCATION:${escapeICSText(location)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    `URL:${raceUrl}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
  ];

  if (reminderMinutes !== false && reminderMinutes > 0) {
    lines.push(
      'BEGIN:VALARM',
      `TRIGGER:-PT${reminderMinutes}M`,
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICSText(`F1 Reminder: ${summary} starts in ${reminderMinutes} minutes`)}`,
      'END:VALARM'
    );
  }

  lines.push('END:VEVENT');
  return lines;
}

/**
 * Generates an RFC 5545 iCalendar (.ics) string for a single Race weekend.
 */
export function generateRaceWeekendICS(race: Race, options?: ICSOptions): string {
  const sessions = getRaceCalendarSessions(race);
  const selectedSessions =
    options?.sessionCodes && options.sessionCodes.length > 0
      ? sessions.filter((s) => options.sessionCodes!.includes(s.code))
      : sessions;

  const calName = options?.calName ?? `F1: ${race.raceName} (${race.season})`;
  const now = new Date();

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Purple Sector//F1 Cockpit Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(calName)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const session of selectedSessions) {
    lines.push(...buildEventBlock(race, session, options, now));
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldICSLine).join('\r\n') + '\r\n';
}

/**
 * Generates an RFC 5545 iCalendar (.ics) string for an entire F1 Season (ideal for Webcal feed or full download).
 */
export function generateSeasonICS(races: Race[], season: number | string, options?: ICSOptions): string {
  const calName = options?.calName ?? `Formula 1 ${season} World Championship`;
  const now = new Date();

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Purple Sector//F1 Cockpit Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(calName)}`,
    'X-WR-TIMEZONE:UTC',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ];

  for (const race of races) {
    const sessions = getRaceCalendarSessions(race);
    const selectedSessions =
      options?.sessionCodes && options.sessionCodes.length > 0
        ? sessions.filter((s) => options.sessionCodes!.includes(s.code))
        : sessions;

    for (const session of selectedSessions) {
      lines.push(...buildEventBlock(race, session, options, now));
    }
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldICSLine).join('\r\n') + '\r\n';
}

/**
 * Triggers a browser download of an .ics file from generated text content.
 */
export function downloadICS(content: string, filename: string): void {
  if (typeof window === 'undefined') return;

  const safeFilename = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
