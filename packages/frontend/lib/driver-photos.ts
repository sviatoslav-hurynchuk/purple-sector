/**
 * Driver photo URL utilities for F1 CDN.
 *
 * The F1 media CDN uses a Cloudinary pipeline:
 * https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/
 *   {INITIAL}/{GIVENCODE}{FAMILYCODE}01_{GivenName}_{FamilyName}/{code_lowercase}.png
 *
 * The `d_driver_fallback_image.png` Cloudinary directive serves a silhouette fallback
 * if the target path doesn't exist, so incorrect URLs degrade gracefully.
 */

const F1_CDN_BASE =
  'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers';

/**
 * Manual overrides for drivers whose CDN code doesn't match the simple name formula.
 * Key: driverId (Jolpica), Value: full CDN path (after the /drivers/ segment).
 */
const DRIVER_PATH_OVERRIDES: Record<string, string> = {
  // 2025 grid
  max_verstappen: 'M/MAXVER01_Max_Verstappen/maxver01.png',
  hamilton: 'L/LEWHAM01_Lewis_Hamilton/lewham01.png',
  russell: 'G/GEORUS01_George_Russell/georus01.png',
  leclerc: 'C/CHALEC01_Charles_Leclerc/chalec01.png',
  sainz: 'C/CARSAI01_Carlos_Sainz/carsai01.png',
  norris: 'L/LANNOR01_Lando_Norris/lannor01.png',
  piastri: 'O/OSCPIA01_Oscar_Piastri/oscpia01.png',
  alonso: 'F/FERALO01_Fernando_Alonso/feralo01.png',
  stroll: 'L/LANSTR01_Lance_Stroll/lanstr01.png',
  gasly: 'P/PIEGAS01_Pierre_Gasly/piegas01.png',
  ocon: 'E/ESTOCO01_Esteban_Ocon/estoco01.png',
  albon: 'A/ALEALB01_Alexander_Albon/alealb01.png',
  tsunoda: 'Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png',
  ricciardo: 'D/DANRIC01_Daniel_Ricciardo/danric01.png',
  bottas: 'V/VALBOT01_Valtteri_Bottas/valbot01.png',
  zhou: 'G/ZHOGUA01_Zhou_Guanyu/zhogua01.png',
  hulkenberg: 'N/NICHUL01_Nico_Hulkenberg/nichul01.png',
  magnussen: 'K/KEVMAG01_Kevin_Magnussen/kevmag01.png',
  perez: 'S/SERPER01_Sergio_Perez/serper01.png',
  // 2025 newcomers / updated names
  antonelli: 'K/KIMANT01_Kimi_Antonelli/kimant01.png',
  bearman: 'O/OLIBEA01_Oliver_Bearman/olibea01.png',
  colapinto: 'F/FRACOL01_Franco_Colapinto/fracol01.png',
  lawson: 'L/LIALAW01_Liam_Lawson/lialaw01.png',
  doohan: 'J/JACDOO01_Jack_Doohan/jacdoo01.png',
  bortoleto: 'G/GABBOR01_Gabriel_Bortoleto/gabbor01.png',
  hadjar: 'I/ISAHAD01_Isack_Hadjar/isahad01.png',
  // Potential 2026 drivers
  lindblad: 'A/ARVLIN01_Arvid_Lindblad/arvlin01.png',
};

/**
 * Generates a best-guess F1 CDN photo URL from a driver's given and family name.
 * Uses the formula: {3 letters given}{3 letters family}01
 */
function generateDynamicUrl(givenName: string, familyName: string): string {
  const givenCode = givenName
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase();
  const familyCode = familyName
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase();
  const code = `${givenCode}${familyCode}01`;
  const initial = givenCode[0] ?? 'X';
  const namePart = `${givenName.replace(/\s+/g, '_')}_${familyName.replace(/\s+/g, '_')}`;
  return `${F1_CDN_BASE}/${initial}/${code}_${namePart}/${code.toLowerCase()}.png`;
}

/**
 * Returns the official F1 CDN driver portrait URL.
 * Prefers the manual override map, then falls back to dynamic URL generation.
 * Thanks to Cloudinary's fallback directive, unknown paths serve a silhouette.
 */
export function getDriverPhotoUrl(
  driverId: string,
  givenName?: string,
  familyName?: string
): string {
  const key = driverId.trim().toLowerCase();

  if (Object.prototype.hasOwnProperty.call(DRIVER_PATH_OVERRIDES, key)) {
    return `${F1_CDN_BASE}/${DRIVER_PATH_OVERRIDES[key]}`;
  }

  // Generate dynamically if name parts are available
  if (givenName && familyName) {
    return generateDynamicUrl(givenName, familyName);
  }

  // Ultimate fallback
  return `${F1_CDN_BASE}/driver_fallback.png`;
}
