import type { Race, F1Session } from '@/types/f1';

export interface TargetSessionInfo {
  code: string;       // e.g. 'P1', 'P2', 'P3', 'QUALY', 'SQ', 'SPRINT', 'RACE'
  name: string;       // e.g. 'PRACTICE 1', 'QUALIFYING'
  rawDate: Date;      // Start date/time of session
  isOngoing: boolean; // True if session currently in progress
  durationMinutes: number;
}

export function getNextSessionForRace(race: Race, now: Date = new Date()): TargetSessionInfo | null {
  const sessionList: Array<{
    code: string;
    name: string;
    session?: F1Session;
    durationMinutes: number;
  }> = [
    { code: 'P1', name: 'PRACTICE 1', session: race.FirstPractice, durationMinutes: 60 },
    { code: 'P2', name: 'PRACTICE 2', session: race.SecondPractice, durationMinutes: 60 },
    { code: 'P3', name: 'PRACTICE 3', session: race.ThirdPractice, durationMinutes: 60 },
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

  validSessions.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

  const currentTime = now.getTime();

  for (const s of validSessions) {
    const startTime = s.rawDate.getTime();
    const endTime = startTime + s.durationMinutes * 60 * 1000;
    if (currentTime >= startTime && currentTime <= endTime) {
      return {
        code: s.code,
        name: s.name,
        rawDate: s.rawDate,
        isOngoing: true,
        durationMinutes: s.durationMinutes,
      };
    }
  }

  for (const s of validSessions) {
    if (s.rawDate.getTime() > currentTime) {
      return {
        code: s.code,
        name: s.name,
        rawDate: s.rawDate,
        isOngoing: false,
        durationMinutes: s.durationMinutes,
      };
    }
  }

  return null;
}

export function resolveQualifyingSegment(
  code: string,
  rawDate: Date,
  now: Date = new Date()
): { segmentCode: string; remainingSeconds: number } | null {
  const elapsedMs = now.getTime() - rawDate.getTime();
  if (elapsedMs < 0) return null;
  const elapsedSec = Math.floor(elapsedMs / 1000);

  if (code === 'QUALY') {
    if (elapsedSec < 1080) {
      return { segmentCode: 'Q1', remainingSeconds: 1080 - elapsedSec };
    }
    if (elapsedSec < 1500) {
      return { segmentCode: 'Q1 END', remainingSeconds: 1500 - elapsedSec };
    }
    if (elapsedSec < 2400) {
      return { segmentCode: 'Q2', remainingSeconds: 2400 - elapsedSec };
    }
    if (elapsedSec < 2820) {
      return { segmentCode: 'Q2 END', remainingSeconds: 2820 - elapsedSec };
    }
    if (elapsedSec < 3540) {
      return { segmentCode: 'Q3', remainingSeconds: 3540 - elapsedSec };
    }
  }

  if (code === 'SQ') {
    if (elapsedSec < 720) {
      return { segmentCode: 'SQ1', remainingSeconds: 720 - elapsedSec };
    }
    if (elapsedSec < 1140) {
      return { segmentCode: 'SQ1 END', remainingSeconds: 1140 - elapsedSec };
    }
    if (elapsedSec < 1740) {
      return { segmentCode: 'SQ2', remainingSeconds: 1740 - elapsedSec };
    }
    if (elapsedSec < 2160) {
      return { segmentCode: 'SQ2 END', remainingSeconds: 2160 - elapsedSec };
    }
    if (elapsedSec < 2640) {
      return { segmentCode: 'SQ3', remainingSeconds: 2640 - elapsedSec };
    }
  }

  return null;
}
