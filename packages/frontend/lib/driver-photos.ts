/**
 * Multi-season Driver Photo Resolution Engine powered by official Formula 1 CDN & Cloudinary Media Pipeline.
 *
 * Supported Pipelines:
 * 1. Modern WebP (2024, 2025, 2026):
 *    https://media.formula1.com/image/upload/c_lfill,w_700/q_auto/d_common:f1:{season}:fallback:driver:{season}fallbackdriverright.webp/v1740000001/common/f1/{season}/{team}/{code}/{season}{team}{code}right.webp
 *
 * 2. Official F1 DAM Cutout CDN (for historical drivers 2018–2023):
 *    https://media.formula1.com/content/dam/fom-website/drivers/{FOLDER}/{CODE}.png.transform/2col/image.png
 */

interface DriverRegistryEntry {
  code: string;
  defaultTeam: string;
  /** Historical team overrides for specific seasons */
  history?: Record<string, string>;
  /** Official DAM cutout path if available for pre-2024 seasons */
  damPath?: string;
}

/** Team constructorId to official F1 Cloudinary media slug normalizer */
const TEAM_SLUG_MAP: Record<string, string> = {
  mercedes: 'mercedes',
  ferrari: 'ferrari',
  mclaren: 'mclaren',
  red_bull: 'redbullracing',
  redbull: 'redbullracing',
  redbullracing: 'redbullracing',
  alpine: 'alpine',
  aston_martin: 'astonmartin',
  astonmartin: 'astonmartin',
  williams: 'williams',
  haas: 'haas',
  audi: 'audi',
  cadillac: 'cadillac',
  racing_bulls: 'racingbulls',
  racingbulls: 'racingbulls',
  rb: 'racingbulls',
  alphatauri: 'alphatauri',
  toro_rosso: 'tororosso',
  sauber: 'kicksauber',
  kick_sauber: 'kicksauber',
  kicksauber: 'kicksauber',
  alfa: 'alfaromeo',
  alfa_romeo: 'alfaromeo',
  alfaromeo: 'alfaromeo',
  renault: 'renault',
  force_india: 'forceindia',
  racing_point: 'racingpoint',
};

/**
 * Comprehensive F1 Driver Registry with codes, team histories, and media links.
 */
const DRIVER_REGISTRY: Record<string, DriverRegistryEntry> = {
  // ── 2026 Grid ──────────────────────────────────────────────────────────────
  antonelli: { code: 'andant01', defaultTeam: 'mercedes' },
  russell: { code: 'georus01', defaultTeam: 'mercedes', history: { '2021': 'williams', '2020': 'williams', '2019': 'williams' } },
  leclerc: { code: 'chalec01', defaultTeam: 'ferrari', history: { '2018': 'alfaromeo' } },
  hamilton: {
    code: 'lewham01',
    defaultTeam: 'ferrari',
    history: { '2024': 'mercedes', '2023': 'mercedes', '2022': 'mercedes', '2021': 'mercedes', '2020': 'mercedes', '2019': 'mercedes' },
    damPath: 'L/LEWHAM01_Lewis_Hamilton/lewham01.png',
  },
  norris: { code: 'lannor01', defaultTeam: 'mclaren' },
  piastri: { code: 'oscpia01', defaultTeam: 'mclaren' },
  max_verstappen: {
    code: 'maxver01',
    defaultTeam: 'redbullracing',
    damPath: 'M/MAXVER01_Max_Verstappen/maxver01.png',
  },
  verstappen: {
    code: 'maxver01',
    defaultTeam: 'redbullracing',
    damPath: 'M/MAXVER01_Max_Verstappen/maxver01.png',
  },
  hadjar: { code: 'isahad01', defaultTeam: 'redbullracing' },
  lawson: { code: 'lialaw01', defaultTeam: 'racingbulls', history: { '2023': 'alphatauri', '2024': 'racingbulls' } },
  arvid_lindblad: { code: 'arvlin01', defaultTeam: 'racingbulls' },
  lindblad: { code: 'arvlin01', defaultTeam: 'racingbulls' },
  gasly: {
    code: 'piegas01',
    defaultTeam: 'alpine',
    history: { '2022': 'alphatauri', '2021': 'alphatauri', '2020': 'alphatauri', '2019': 'redbullracing' },
    damPath: 'P/PIEGAS01_Pierre_Gasly/piegas01.png',
  },
  colapinto: { code: 'fracol01', defaultTeam: 'alpine', history: { '2024': 'williams' } },
  bearman: { code: 'olibea01', defaultTeam: 'haas', history: { '2024': 'haas' } },
  ocon: {
    code: 'estoco01',
    defaultTeam: 'haas',
    history: { '2024': 'alpine', '2023': 'alpine', '2022': 'alpine', '2021': 'alpine', '2020': 'renault' },
    damPath: 'E/ESTOCO01_Esteban_Ocon/estoco01.png',
  },
  bortoleto: { code: 'gabbor01', defaultTeam: 'audi' },
  hulkenberg: {
    code: 'nichul01',
    defaultTeam: 'audi',
    history: { '2024': 'haas', '2023': 'haas', '2020': 'racingpoint', '2019': 'renault' },
    damPath: 'N/NICHUL01_Nico_Hulkenberg/nichul01.png',
  },
  sainz: {
    code: 'carsai01',
    defaultTeam: 'williams',
    history: { '2024': 'ferrari', '2023': 'ferrari', '2022': 'ferrari', '2021': 'ferrari', '2020': 'mclaren', '2019': 'mclaren' },
    damPath: 'C/CARSAI01_Carlos_Sainz/carsai01.png',
  },
  albon: {
    code: 'alealb01',
    defaultTeam: 'williams',
    history: { '2020': 'redbullracing', '2019': 'tororosso' },
    damPath: 'A/ALEALB01_Alexander_Albon/alealb01.png',
  },
  alonso: {
    code: 'feralo01',
    defaultTeam: 'astonmartin',
    history: { '2022': 'alpine', '2021': 'alpine', '2018': 'mclaren' },
    damPath: 'F/FERALO01_Fernando_Alonso/feralo01.png',
  },
  stroll: {
    code: 'lanstr01',
    defaultTeam: 'astonmartin',
    history: { '2020': 'racingpoint', '2019': 'racingpoint', '2018': 'williams' },
    damPath: 'L/LANSTR01_Lance_Stroll/lanstr01.png',
  },
  bottas: {
    code: 'valbot01',
    defaultTeam: 'cadillac',
    history: { '2024': 'kicksauber', '2023': 'alfaromeo', '2022': 'alfaromeo', '2021': 'mercedes', '2020': 'mercedes' },
    damPath: 'V/VALBOT01_Valtteri_Bottas/valbot01.png',
  },
  perez: {
    code: 'serper01',
    defaultTeam: 'cadillac',
    history: { '2024': 'redbullracing', '2023': 'redbullracing', '2022': 'redbullracing', '2021': 'redbullracing', '2020': 'racingpoint' },
    damPath: 'S/SERPER01_Sergio_Perez/serper01.png',
  },

  // ── Recent & Historical Drivers ───────────────────────────────────────────
  tsunoda: { code: 'yuktsu01', defaultTeam: 'racingbulls', history: { '2023': 'alphatauri', '2022': 'alphatauri', '2021': 'alphatauri' }, damPath: 'Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png' },
  ricciardo: { code: 'danric01', defaultTeam: 'racingbulls', history: { '2023': 'alphatauri', '2022': 'mclaren', '2021': 'mclaren', '2020': 'renault' }, damPath: 'D/DANRIC01_Daniel_Ricciardo/danric01.png' },
  vettel: { code: 'sebvet01', defaultTeam: 'astonmartin', history: { '2020': 'ferrari', '2019': 'ferrari' }, damPath: 'S/SEBVET01_Sebastian_Vettel/sebvet01.png' },
  raikkonen: { code: 'kimrai01', defaultTeam: 'alfaromeo', history: { '2018': 'ferrari' }, damPath: 'K/KIMRAI01_Kimi_R%C3%A4ikk%C3%B6nen/kimrai01.png' },
  magnussen: { code: 'kevmag01', defaultTeam: 'haas', damPath: 'K/KEVMAG01_Kevin_Magnussen/kevmag01.png' },
  zhou: { code: 'guazho01', defaultTeam: 'kicksauber', history: { '2023': 'alfaromeo', '2022': 'alfaromeo' }, damPath: 'G/GUAZHO01_Guanyu_Zhou/guazho01.png' },
  sargeant: { code: 'logsar01', defaultTeam: 'williams', damPath: 'L/LOGSAR01_Logan_Sargeant/logsar01.png' },
  de_vries: { code: 'nycdev01', defaultTeam: 'alphatauri', damPath: 'N/NYCDEV01_Nyck_de%20Vries/nycdev01.png' },
  giovinazzi: { code: 'antgio01', defaultTeam: 'alfaromeo', damPath: 'A/ANTGIO01_Antonio_Giovinazzi/antgio01.png' },
};

/**
 * Builds the official F1 website Cloudinary URL for a given driver, team, and season.
 */
export function buildF1WebpUrl(team: string, code: string, season: string = '2026'): string {
  const cleanTeam = (TEAM_SLUG_MAP[team.toLowerCase()] ?? team.toLowerCase()).replace(/[^a-z0-9]/g, '');
  const cleanCode = code.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s = String(season);

  // F1 Cloudinary currently supports native season paths for 2024, 2025, and 2026.
  const seasonNum = parseInt(s, 10);
  const seasonYear = seasonNum >= 2024 ? String(seasonNum) : '2024';

  return `https://media.formula1.com/image/upload/c_lfill,w_700/q_auto/d_common:f1:${seasonYear}:fallback:driver:${seasonYear}fallbackdriverright.webp/v1740000001/common/f1/${seasonYear}/${cleanTeam}/${cleanCode}/${seasonYear}${cleanTeam}${cleanCode}right.webp`;
}

/**
 * Returns official F1 CDN driver portrait photo URL for any given driver, season, and team.
 */
export function getDriverPhotoUrl(
  driverId: string,
  givenName?: string,
  familyName?: string,
  season: string = '2026',
  constructorId?: string
): string {
  const key = driverId.trim().toLowerCase();
  const meta = DRIVER_REGISTRY[key];
  const s = String(season);
  const seasonNum = parseInt(s, 10);

  // 1. If we have registry entry for this driver
  if (meta) {
    // For seasons prior to 2024, if a dedicated official DAM cutout is available, use it
    if (!isNaN(seasonNum) && seasonNum < 2024 && meta.damPath) {
      return `https://media.formula1.com/content/dam/fom-website/drivers/${meta.damPath}.transform/2col/image.png`;
    }

    // Determine the team slug for the requested season
    let team = meta.defaultTeam;
    if (constructorId && TEAM_SLUG_MAP[constructorId.toLowerCase()]) {
      team = TEAM_SLUG_MAP[constructorId.toLowerCase()];
    } else if (meta.history && meta.history[s]) {
      team = meta.history[s];
    }

    return buildF1WebpUrl(team, meta.code, s);
  }

  // 2. Dynamic generation for unmapped drivers
  if (givenName && familyName) {
    const givenCode = givenName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toLowerCase();
    const familyCode = familyName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toLowerCase();
    const dynamicCode = `${givenCode}${familyCode}01`;
    const teamSlug = constructorId ? (TEAM_SLUG_MAP[constructorId.toLowerCase()] ?? constructorId) : 'generic';
    return buildF1WebpUrl(teamSlug, dynamicCode, s);
  }

  // 3. Fallback
  const fallbackYear = !isNaN(seasonNum) && seasonNum >= 2024 ? String(seasonNum) : '2026';
  return `https://media.formula1.com/image/upload/c_lfill,w_700/q_auto/v1740000001/common/f1/${fallbackYear}/fallback/driver/${fallbackYear}fallbackdriverright.webp`;
}
