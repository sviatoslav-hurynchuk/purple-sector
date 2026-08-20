import { cache } from './cache';
import type { OfficialDriverStats } from '../types/f1';

const DRIVER_SLUG_MAP: Record<string, string> = {
  antonelli: 'kimi-antonelli',
  russell: 'george-russell',
  leclerc: 'charles-leclerc',
  hamilton: 'lewis-hamilton',
  norris: 'lando-norris',
  piastri: 'oscar-piastri',
  max_verstappen: 'max-verstappen',
  hadjar: 'isack-hadjar',
  lawson: 'liam-lawson',
  arvid_lindblad: 'arvid-lindblad',
  lindblad: 'arvid-lindblad',
  gasly: 'pierre-gasly',
  colapinto: 'franco-colapinto',
  bearman: 'oliver-bearman',
  ocon: 'esteban-ocon',
  bortoleto: 'gabriel-bortoleto',
  hulkenberg: 'nico-hulkenberg',
  sainz: 'carlos-sainz',
  carlos_sainz: 'carlos-sainz',
  albon: 'alexander-albon',
  alonso: 'fernando-alonso',
  stroll: 'lance-stroll',
  bottas: 'valtteri-bottas',
  perez: 'sergio-perez',
  tsunoda: 'yuki-tsunoda',
  ricciardo: 'daniel-ricciardo',
  kevin_magnussen: 'kevin-magnussen',
  mick_schumacher: 'mick-schumacher',
  zhou: 'guanyu-zhou',
  doohan: 'jack-doohan',
};

const TTL_OFFICIAL_DRIVER = 86400; // 24 hours

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 2,
  backoffMs = 300,
  timeoutMs = 8000
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const signal = AbortSignal.timeout(timeoutMs);
      const res = await fetch(url, { ...options, signal });
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await res.body?.cancel();
        const delay = backoffMs * Math.pow(2, attempt);
        console.warn(`[F1 Official] Got HTTP ${res.status} for ${url}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delay = backoffMs * Math.pow(2, attempt);
        console.warn(`[F1 Official] Network error for ${url}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

/**
 * Scrapes and caches live official driver statistics directly from formula1.com/en/drivers/{slug}.
 */
export async function getOfficialF1DriverStats(driverId: string, givenName?: string): Promise<OfficialDriverStats | null> {
  const key = driverId.trim().toLowerCase();

  // Guard against ambiguous bare surname IDs colliding with current active grid drivers
  const first = (givenName ?? '').trim().toLowerCase();
  if (key === 'verstappen' && (!first || !first.includes('max'))) return null;
  if (key === 'schumacher' && (!first || !first.includes('mick'))) return null;
  if (key === 'magnussen' && (!first || !first.includes('kevin'))) return null;
  if (key === 'villeneuve' && (!first || !first.includes('jacques'))) return null;
  if (key === 'fittipaldi' && (!first || !first.includes('pietro'))) return null;
  if (key === 'hill' && (!first || !first.includes('damon'))) return null;
  if (key === 'rosberg' && (!first || !first.includes('nico'))) return null;
  if (key === 'andretti' && (!first || !first.includes('michael'))) return null;
  if (key === 'piquet' && (!first || (!first.includes('nelsinho') && !first.includes('junior')))) return null;

  const slug = DRIVER_SLUG_MAP[key] ?? (key === 'verstappen' && first.includes('max') ? 'max-verstappen' : key.replace(/_/g, '-'));
  const cacheKey = `f1:official:driver:${slug}`;

  // Check cache first
  const cached = await cache.get<OfficialDriverStats>(cacheKey);
  if (cached !== null && cached !== undefined) return cached;

  try {
    const res = await fetchWithRetry(`https://www.formula1.com/en/drivers/${slug}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();

    const statsMap: Record<string, string> = {};
    const regex = /<dt[^>]*>([^<]+)<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      statsMap[match[1].trim()] = match[2].trim();
    }

    const parseIntSafe = (val?: string) => {
      if (!val) return 0;
      const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
      return isNaN(num) ? 0 : num;
    };

    const parseFloatSafe = (val?: string) => {
      if (!val) return 0;
      const num = parseFloat(val.replace(/[^0-9.]/g, ''));
      return isNaN(num) ? 0 : num;
    };

    const stats: OfficialDriverStats = {
      season: {
        year: '2026',
        position: statsMap['Season Position'] ?? '—',
        points: statsMap['Season Points'] ?? '0',
        gpRaces: parseIntSafe(statsMap['Grand Prix Races']),
        gpPoints: parseFloatSafe(statsMap['Grand Prix Points']),
        gpWins: parseIntSafe(statsMap['Grand Prix Wins']),
        gpPodiums: parseIntSafe(statsMap['Grand Prix Podiums']),
        gpPoles: parseIntSafe(statsMap['Grand Prix Poles']),
        gpTop10s: parseIntSafe(statsMap['Grand Prix Top 10s']),
        fastestLaps: parseIntSafe(statsMap['DHL Fastest Laps']),
        dnfs: parseIntSafe(statsMap['DNFs']),
        sprintRaces: parseIntSafe(statsMap['Sprint Races']),
        sprintPoints: parseFloatSafe(statsMap['Sprint Points']),
        sprintWins: parseIntSafe(statsMap['Sprint Wins']),
        sprintPodiums: parseIntSafe(statsMap['Sprint Podiums']),
      },
      career: {
        grandsPrixEntered: parseIntSafe(statsMap['Grands Prix Entered']),
        careerPoints: parseFloatSafe(statsMap['Career Points']),
        highestRaceFinish: statsMap['Highest Race Finish'] ?? '—',
        podiums: parseIntSafe(statsMap['Podiums']),
        highestGridPosition: statsMap['Highest Grid Position'] ?? '—',
        polePositions: parseIntSafe(statsMap['Pole Positions']),
        worldChampionships: parseIntSafe(statsMap['World Championships']),
      },
      bio: {
        dateOfBirth: statsMap['Date of Birth'],
        placeOfBirth: statsMap['Place of Birth'],
      },
    };

    // Cache the result in Redis
    await cache.set(cacheKey, stats, TTL_OFFICIAL_DRIVER);
    return stats;
  } catch (err) {
    console.warn(`[F1 Official] Failed to fetch official stats for ${slug}:`, err);
    return null;
  }
}

// ── Official F1 Teams Scraper ────────────────────────────────────────────────

const TEAM_SLUG_MAP: Record<string, string> = {
  ferrari: 'ferrari',
  mclaren: 'mclaren',
  mercedes: 'mercedes',
  red_bull: 'red-bull-racing',
  redbull: 'red-bull-racing',
  redbullracing: 'red-bull-racing',
  aston_martin: 'aston-martin',
  astonmartin: 'aston-martin',
  alpine: 'alpine',
  williams: 'williams',
  haas: 'haas',
  rb: 'racing-bulls',
  racing_bulls: 'racing-bulls',
  racingbulls: 'racing-bulls',
  sauber: 'kick-sauber',
  kick_sauber: 'kick-sauber',
  kicksauber: 'kick-sauber',
  audi: 'kick-sauber',
};

/**
 * Scrapes and caches live official team metadata and leadership directly from formula1.com/en/teams/{slug}.
 */
export async function getOfficialF1TeamDetails(constructorId: string): Promise<import('../types/f1').OfficialTeamDetails | null> {
  const key = constructorId.trim().toLowerCase();
  const slug = TEAM_SLUG_MAP[key] ?? key.replace(/_/g, '-');
  const cacheKey = `f1:official:team:${slug}`;

  // Check cache first
  const cached = await cache.get<import('../types/f1').OfficialTeamDetails>(cacheKey);
  if (cached !== null && cached !== undefined) return cached;

  try {
    const res = await fetchWithRetry(`https://www.formula1.com/en/teams/${slug}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();

    const parseNumberOrUndefined = (val?: string): number | undefined => {
      if (!val) return undefined;
      const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
      return isNaN(num) ? undefined : num;
    };

    const getField = (label: string): string | undefined => {
      const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Look for <dt>label</dt><dd>value</dd> pattern anchored to full dt text
      const regex = new RegExp(`>\\s*${escapedLabel}\\s*<\\/d[te]>\\s*<d[de][^>]*>([^<]+)<\\/d[de]>`, 'i');
      const m = html.match(regex);
      return m ? m[1].trim() : undefined;
    };

    const details: import('../types/f1').OfficialTeamDetails = {
      fullName: getField('Full Team Name'),
      base: getField('Base'),
      teamPrincipal: getField('Team Chief'),
      technicalChief: getField('Technical Chief'),
      chassis: getField('Chassis'),
      powerUnit: getField('Power Unit'),
      firstEntry: parseNumberOrUndefined(getField('First Team Entry')),
      worldChampionships: parseNumberOrUndefined(getField('World Championships')),
      highestRaceFinish: getField('Highest Race Finish'),
      polePositions: parseNumberOrUndefined(getField('Pole Positions')),
      fastestLaps: parseNumberOrUndefined(getField('Fastest Laps')),
    };

    // Cache the result in Redis for 24h
    await cache.set(cacheKey, details, TTL_OFFICIAL_DRIVER);
    return details;
  } catch (err) {
    console.warn(`[F1 Official] Failed to fetch official team details for ${slug}:`, err);
    return null;
  }
}

/**
 * Helper to run async tasks in bounded batches to avoid overwhelming the upstream server.
 */
async function runInBatches(tasks: (() => Promise<unknown>)[], batchSize = 4): Promise<void> {
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    await Promise.allSettled(batch.map((fn) => fn()));
  }
}

/**
 * Pre-warms official stats for all key 2026 grid drivers and teams in Upstash Redis.
 * Deduplicates by unique target slug and bounds concurrency to avoid bursts.
 */
export async function warmOfficialDriverStats(): Promise<void> {
  const seenDriverSlugs = new Set<string>();
  const uniqueDriverIds: string[] = [];
  for (const [id, slug] of Object.entries(DRIVER_SLUG_MAP)) {
    if (!seenDriverSlugs.has(slug)) {
      seenDriverSlugs.add(slug);
      uniqueDriverIds.push(id);
    }
  }

  const seenTeamSlugs = new Set<string>();
  const uniqueTeamIds: string[] = [];
  for (const [id, slug] of Object.entries(TEAM_SLUG_MAP)) {
    if (!seenTeamSlugs.has(slug)) {
      seenTeamSlugs.add(slug);
      uniqueTeamIds.push(id);
    }
  }

  const tasks: (() => Promise<unknown>)[] = [
    ...uniqueDriverIds.map((id) => () => getOfficialF1DriverStats(id)),
    ...uniqueTeamIds.map((id) => () => getOfficialF1TeamDetails(id)),
  ];

  await runInBatches(tasks, 4);
}
