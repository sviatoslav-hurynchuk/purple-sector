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
  verstappen: 'max-verstappen',
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
  albon: 'alexander-albon',
  alonso: 'fernando-alonso',
  stroll: 'lance-stroll',
  bottas: 'valtteri-bottas',
  perez: 'sergio-perez',
  tsunoda: 'yuki-tsunoda',
  ricciardo: 'daniel-ricciardo',
  magnussen: 'kevin-magnussen',
  zhou: 'guanyu-zhou',
  doohan: 'jack-doohan',
};

const TTL_OFFICIAL_DRIVER = 86400; // 24 hours

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 2,
  backoffMs = 300
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
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
export async function getOfficialF1DriverStats(driverId: string): Promise<OfficialDriverStats | null> {
  const key = driverId.trim().toLowerCase();
  const slug = DRIVER_SLUG_MAP[key] ?? key.replace(/_/g, '-');
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

/**
 * Pre-warms official stats for all key 2026 grid drivers in Upstash Redis.
 */
export async function warmOfficialDriverStats(): Promise<void> {
  const driverIds = Object.keys(DRIVER_SLUG_MAP);
  await Promise.allSettled(driverIds.map((id) => getOfficialF1DriverStats(id)));
}
