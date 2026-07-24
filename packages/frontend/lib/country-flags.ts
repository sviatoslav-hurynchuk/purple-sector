/**
 * Utility mapping F1 countries and localities to their 2-letter ISO country codes.
 * Used for rendering high-res SVG/PNG flags from FlagCDN.
 */
const COUNTRY_CODES: Record<string, string> = {
  Australia: 'au',
  China: 'cn',
  Japan: 'jp',
  Bahrain: 'bh',
  'Saudi Arabia': 'sa',
  Italy: 'it',
  Monaco: 'mc',
  Spain: 'es',
  Canada: 'ca',
  Austria: 'at',
  UK: 'gb',
  'United Kingdom': 'gb',
  Hungary: 'hu',
  Belgium: 'be',
  Netherlands: 'nl',
  Azerbaijan: 'az',
  Singapore: 'sg',
  Qatar: 'qa',
  Mexico: 'mx',
  Brazil: 'br',
  UAE: 'ae',
  'United Arab Emirates': 'ae',
  USA: 'us',
  'United States': 'us',
  France: 'fr',
  Germany: 'de',
  Portugal: 'pt',
  Turkey: 'tr',
  Russia: 'ru',
  Malaysia: 'my',
  India: 'in',
  Korea: 'kr',
};

/**
 * Returns the ISO 2-letter country code for a given F1 country name.
 */
export function getCountryCode(countryName?: string): string | null {
  if (!countryName) return null;
  return COUNTRY_CODES[countryName] ?? null;
}

/**
 * Returns the CDN URL for a country flag image.
 */
export function getCountryFlagUrl(countryName?: string): string | null {
  const code = getCountryCode(countryName);
  if (!code) return null;
  return `https://flagcdn.com/w40/${code}.png`;
}
