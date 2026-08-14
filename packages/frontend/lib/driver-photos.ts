/**
 * Driver photo URL utilities powered by official 2026 F1 Website Cloudinary Media Pipeline.
 *
 * Pattern:
 * https://media.formula1.com/image/upload/c_lfill,w_700/q_auto/d_common:f1:2026:fallback:driver:2026fallbackdriverright.webp/v1740000001/common/f1/2026/{team}/{code}/2026{team}{code}right.webp
 */

interface DriverF1Meta {
  team: string;
  code: string;
}

const DRIVER_2026_META: Record<string, DriverF1Meta> = {
  antonelli: { team: 'mercedes', code: 'andant01' },
  russell: { team: 'mercedes', code: 'georus01' },
  leclerc: { team: 'ferrari', code: 'chalec01' },
  hamilton: { team: 'ferrari', code: 'lewham01' },
  norris: { team: 'mclaren', code: 'lannor01' },
  piastri: { team: 'mclaren', code: 'oscpia01' },
  max_verstappen: { team: 'redbullracing', code: 'maxver01' },
  hadjar: { team: 'redbullracing', code: 'isahad01' },
  lawson: { team: 'racingbulls', code: 'lialaw01' },
  arvid_lindblad: { team: 'racingbulls', code: 'arvlin01' },
  lindblad: { team: 'racingbulls', code: 'arvlin01' },
  gasly: { team: 'alpine', code: 'piegas01' },
  colapinto: { team: 'alpine', code: 'fracol01' },
  bearman: { team: 'haas', code: 'olibea01' },
  ocon: { team: 'haas', code: 'estoco01' },
  bortoleto: { team: 'audi', code: 'gabbor01' },
  hulkenberg: { team: 'audi', code: 'nichul01' },
  sainz: { team: 'williams', code: 'carsai01' },
  albon: { team: 'williams', code: 'alealb01' },
  alonso: { team: 'astonmartin', code: 'feralo01' },
  stroll: { team: 'astonmartin', code: 'lanstr01' },
  bottas: { team: 'cadillac', code: 'valbot01' },
  perez: { team: 'cadillac', code: 'serper01' },
};

/**
 * Builds the official F1 website Cloudinary URL for a given driver and season.
 */
export function buildF1WebpUrl(team: string, code: string, season: string = '2026'): string {
  const cleanTeam = team.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanCode = code.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://media.formula1.com/image/upload/c_lfill,w_700/q_auto/d_common:f1:${season}:fallback:driver:${season}fallbackdriverright.webp/v1740000001/common/f1/${season}/${cleanTeam}/${cleanCode}/${season}${cleanTeam}${cleanCode}right.webp`;
}

/**
 * Returns official F1 CDN driver portrait photo URL.
 */
export function getDriverPhotoUrl(
  driverId: string,
  givenName?: string,
  familyName?: string,
  season: string = '2026'
): string {
  const key = driverId.trim().toLowerCase();

  // 1. Direct 2026 official driver metadata match
  if (Object.prototype.hasOwnProperty.call(DRIVER_2026_META, key)) {
    const { team, code } = DRIVER_2026_META[key];
    return buildF1WebpUrl(team, code, season);
  }

  // 2. Dynamic generation for non-mapped drivers
  if (givenName && familyName) {
    const givenCode = givenName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toLowerCase();
    const familyCode = familyName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toLowerCase();
    const dynamicCode = `${givenCode}${familyCode}01`;
    return buildF1WebpUrl('generic', dynamicCode, season);
  }

  // 3. Official F1 Cloudinary fallback
  return `https://media.formula1.com/image/upload/c_lfill,w_700/q_auto/v1740000001/common/f1/${season}/fallback/driver/${season}fallbackdriverright.webp`;
}
