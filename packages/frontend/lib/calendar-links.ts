import type { Race } from '@/types/f1';
import {
  type SessionCode,
  getRaceCalendarSessions,
  formatUTCDateTimeICS,
} from './ics-generator';

export interface CalendarLinkOptions {
  sessionCode?: SessionCode;
  baseUrl?: string;
}

/**
 * Resolves the primary base URL of the application.
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}

/**
 * Generates a Google Calendar "Add Event" web URL for a specific session of a Race weekend.
 * Defaults to the Grand Prix (Race) session, or the earliest available session.
 */
export function getGoogleCalendarUrl(race: Race, options?: CalendarLinkOptions): string | null {
  const sessions = getRaceCalendarSessions(race);
  if (sessions.length === 0) return null;

  const targetSession = options?.sessionCode
    ? sessions.find((s) => s.code === options.sessionCode) ?? sessions[0]
    : sessions.find((s) => s.code === 'RACE') ?? sessions[sessions.length - 1];

  if (!targetSession) return null;

  const title = `F1: ${race.raceName} — ${targetSession.name}`;
  const startUTC = formatUTCDateTimeICS(targetSession.startDate);
  const endUTC = formatUTCDateTimeICS(targetSession.endDate);

  const baseUrl = options?.baseUrl ?? getAppBaseUrl();
  const raceUrl = `${baseUrl}/calendar/${race.round}?season=${race.season}`;

  const location = `${race.Circuit.circuitName}, ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`;
  const details = [
    `Formula 1 ${race.season} — Round ${race.round}: ${race.raceName}`,
    `Session: ${targetSession.name}`,
    `Circuit: ${race.Circuit.circuitName}`,
    `Live Timing & Details: ${raceUrl}`,
  ].join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUTC}/${endUTC}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an Outlook Web "Add Event" deeplink URL for a specific session of a Race weekend.
 */
export function getOutlookCalendarUrl(race: Race, options?: CalendarLinkOptions): string | null {
  const sessions = getRaceCalendarSessions(race);
  if (sessions.length === 0) return null;

  const targetSession = options?.sessionCode
    ? sessions.find((s) => s.code === options.sessionCode) ?? sessions[0]
    : sessions.find((s) => s.code === 'RACE') ?? sessions[sessions.length - 1];

  if (!targetSession) return null;

  const subject = `F1: ${race.raceName} — ${targetSession.name}`;
  const location = `${race.Circuit.circuitName}, ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`;

  const baseUrl = options?.baseUrl ?? getAppBaseUrl();
  const raceUrl = `${baseUrl}/calendar/${race.round}?season=${race.season}`;

  const body = [
    `Formula 1 ${race.season} — Round ${race.round}: ${race.raceName}`,
    `Session: ${targetSession.name}`,
    `Circuit: ${race.Circuit.circuitName}`,
    `Live Timing & Details: ${raceUrl}`,
  ].join('\n');

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject,
    body,
    location,
    startdt: targetSession.startDate.toISOString(),
    enddt: targetSession.endDate.toISOString(),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Builds the Webcal subscription URL for the entire F1 season.
 * Transforms http(s):// to webcal:// for 1-click subscription in macOS/iOS Calendar and Outlook.
 */
export function getWebcalSubscribeUrl(
  season: number | string,
  options?: { baseUrl?: string; sessionCodes?: SessionCode[] }
): string {
  const baseUrl = options?.baseUrl ?? getAppBaseUrl();
  const webcalBase = baseUrl.replace(/^https?:\/\//, 'webcal://');
  let url = `${webcalBase}/api/calendar/${season}`;

  if (options?.sessionCodes && options.sessionCodes.length > 0) {
    const codes = options.sessionCodes.join(',').toLowerCase();
    url += `?sessions=${encodeURIComponent(codes)}`;
  }

  return url;
}
