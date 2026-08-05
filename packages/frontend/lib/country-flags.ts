/**
 * Utility mapping F1 countries, nationalities, and localities to their 2-letter ISO country codes.
 * Used for rendering high-res SVG/PNG flags from FlagCDN.
 */
const COUNTRY_CODES: Record<string, string> = {
  // Current & Recent F1 Host Countries
  australia: 'au',
  china: 'cn',
  japan: 'jp',
  bahrain: 'bh',
  'saudi arabia': 'sa',
  italy: 'it',
  monaco: 'mc',
  spain: 'es',
  canada: 'ca',
  austria: 'at',
  uk: 'gb',
  'united kingdom': 'gb',
  'great britain': 'gb',
  hungary: 'hu',
  belgium: 'be',
  netherlands: 'nl',
  azerbaijan: 'az',
  singapore: 'sg',
  qatar: 'qa',
  mexico: 'mx',
  brazil: 'br',
  uae: 'ae',
  'united arab emirates': 'ae',
  usa: 'us',
  'united states': 'us',
  france: 'fr',
  germany: 'de',
  portugal: 'pt',
  turkey: 'tr',
  russia: 'ru',
  malaysia: 'my',
  india: 'in',
  korea: 'kr',
  'south korea': 'kr',
  vietnam: 'vn',

  // Historical F1 Host Countries (1950 - present)
  argentina: 'ar',
  morocco: 'ma',
  'south africa': 'za',
  switzerland: 'ch',
  sweden: 'se',

  // Nationalities (for driver/constructor flags)
  australian: 'au',
  austrian: 'at',
  british: 'gb',
  canadian: 'ca',
  chinese: 'cn',
  dutch: 'nl',
  french: 'fr',
  german: 'de',
  hungarian: 'hu',
  italian: 'it',
  japanese: 'jp',
  mexican: 'mx',
  monegasque: 'mc',
  'new zealander': 'nz',
  kiwi: 'nz',
  spanish: 'es',
  american: 'us',
  swiss: 'ch',
  danish: 'dk',
  finnish: 'fi',
  thailand: 'th',
  thai: 'th',
  polish: 'pl',
  russian: 'ru',
  belgian: 'be',
  brazilian: 'br',
  emirati: 'ae',
};

/**
 * Returns the ISO 2-letter country code for a given F1 country name or nationality (case-insensitive).
 */
export function getCountryCode(countryName?: string): string | null {
  if (!countryName) return null;
  const key = countryName.trim().toLowerCase();
  return COUNTRY_CODES[key] ?? null;
}

/**
 * Returns the CDN URL for a country flag image.
 */
export function getCountryFlagUrl(countryName?: string): string | null {
  const code = getCountryCode(countryName);
  if (!code) return null;
  return `https://flagcdn.com/w40/${code}.png`;
}
