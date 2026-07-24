import type { Race, F1Session } from '@/types/f1';

export interface TargetSessionInfo {
  code: string;       // e.g. 'FP1', 'QUALY', 'SPRINT', 'RACE'
  name: string;       // e.g. 'PRACTICE 1', 'QUALIFYING'
  rawDate: Date;      // Start date/time of session
  isOngoing: boolean; // True if session currently in progress
}

/**
 * Extracts and identifies the next upcoming or currently active session for a given race.
 */
export function getNextSessionForRace(race: Race, now: Date = new Date()): TargetSessionInfo | null {
  const sessionList: Array<{
    code: string;
    name: string;
    session?: F1Session;
    durationMinutes: number;
  }> = [
    { code: 'FP1', name: 'PRACTICE 1', session: race.FirstPractice, durationMinutes: 60 },
    { code: 'FP2', name: 'PRACTICE 2', session: race.SecondPractice, durationMinutes: 60 },
    { code: 'FP3', name: 'PRACTICE 3', session: race.ThirdPractice, durationMinutes: 60 },
    { code: 'SQ', name: 'SPRINT QUALY', session: race.SprintQualifying || race.SprintShootout, durationMinutes: 45 },
    { code: 'SPRINT', name: 'SPRINT', session: race.Sprint, durationMinutes: 60 },
    { code: 'QUALY', name: 'QUALIFYING', session: race.Qualifying, durationMinutes: 60 },
    { code: 'RACE', name: 'RACE', session: { date: race.date, time: race.time }, durationMinutes: 120 },
  ];

  const validSessions: Array<{ code: string; name: string; rawDate: Date; durationMinutes: number }> = [];

  for (const item of sessionList) {
    if (!item.session) continue;

    let rawDate: Date;
    if (item.session.time) {
      const cleanTime = item.session.time.endsWith('Z') ? item.session.time : `${item.session.time}Z`;
      rawDate = new Date(`${item.session.date}T${cleanTime}`);
    } else {
      rawDate = new Date(`${item.session.date}T12:00:00Z`);
    }

    if (isNaN(rawDate.getTime())) continue;

    validSessions.push({
      code: item.code,
      name: item.name,
      rawDate,
      durationMinutes: item.durationMinutes,
    });
  }

  // Sort chronologically
  validSessions.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

  const currentTime = now.getTime();

  // First check if any session is currently ongoing
  for (const s of validSessions) {
    const startTime = s.rawDate.getTime();
    const endTime = startTime + s.durationMinutes * 60 * 1000;
    if (currentTime >= startTime && currentTime <= endTime) {
      return {
        code: s.code,
        name: s.name,
        rawDate: s.rawDate,
        isOngoing: true,
      };
    }
  }

  // Find the first upcoming session
  for (const s of validSessions) {
    if (s.rawDate.getTime() > currentTime) {
      return {
        code: s.code,
        name: s.name,
        rawDate: s.rawDate,
        isOngoing: false,
      };
    }
  }

  // If all sessions are in the past, return null
  return null;
}
