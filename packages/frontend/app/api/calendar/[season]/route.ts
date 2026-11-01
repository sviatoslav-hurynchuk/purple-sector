import { NextResponse, type NextRequest } from 'next/server';
import { getRaceSchedule } from '@/lib/api';
import { generateSeasonICS, type SessionCode } from '@/lib/ics-generator';
import { parseYear, getMaxYear } from '@/lib/utils';
import { getAppBaseUrl } from '@/lib/calendar-links';

const SESSION_CODE_ALIASES: Record<string, SessionCode> = {
  P1: 'P1',
  FP1: 'P1',
  P2: 'P2',
  FP2: 'P2',
  P3: 'P3',
  FP3: 'P3',
  SQ: 'SQ',
  SPRINT_QUALIFYING: 'SQ',
  SPRINT_SHOOTOUT: 'SQ',
  SPRINT: 'SPRINT',
  QUALY: 'QUALY',
  QUALI: 'QUALY',
  QUALIFYING: 'QUALY',
  RACE: 'RACE',
  GP: 'RACE',
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ season: string }> }
): Promise<Response> {
  const { season: rawSeason } = await context.params;
  const maxYear = getMaxYear();
  const year = parseYear(rawSeason, maxYear);

  const searchParams = request.nextUrl.searchParams;
  const sessionsParam = searchParams.get('sessions');
  let sessionCodes: SessionCode[] | undefined;

  if (sessionsParam) {
    const rawTokens = sessionsParam
      .toUpperCase()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const validCodes: SessionCode[] = [];
    for (const token of rawTokens) {
      const mapped = SESSION_CODE_ALIASES[token];
      if (mapped && !validCodes.includes(mapped)) {
        validCodes.push(mapped);
      }
    }

    if (validCodes.length > 0) {
      sessionCodes = validCodes;
    }
  }

  try {
    const races = await getRaceSchedule(year);

    if (!races || races.length === 0) {
      return new NextResponse(`No race schedule found for season ${year}`, { status: 404 });
    }

    const baseUrl = getAppBaseUrl();
    const icsContent = generateSeasonICS(races, year, {
      sessionCodes,
      baseUrl,
      calName: `Formula 1 ${year} Season Calendar`,
    });

    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="f1-${year}-season.ics"`,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error(`Failed to generate calendar feed for season ${year}:`, error);
    return new NextResponse('Internal server error generating calendar', { status: 500 });
  }
}
