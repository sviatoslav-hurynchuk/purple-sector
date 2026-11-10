/**
 * External and internal service URLs and hostname verification.
 */
export const DEFAULT_URLS = {
  /** Jolpica Ergast-compatible REST API endpoint */
  JOLPICA_BASE: process.env.JOLPICA_BASE_URL ?? 'https://api.jolpi.ca/ergast/f1',
  /** OpenF1 real-time & historical telemetry REST API endpoint */
  OPENF1_BASE: process.env.OPENF1_BASE_URL ?? 'https://api.openf1.org/v1',
  /** Official Formula 1 website base */
  F1_OFFICIAL_BASE: 'https://www.formula1.com',
  /** English Wikipedia article base */
  WIKIPEDIA_BASE: 'https://en.wikipedia.org/wiki',
} as const;

/** Allowed official Formula 1 hostnames for audio proxy and scraping */
export const F1_ALLOWED_DOMAINS = ['formula1.com'] as const;

/**
 * Validates whether a parsed hostname belongs to official Formula 1 domains.
 */
export function isAllowedF1OfficialHost(host: string): boolean {
  return host === 'formula1.com' || host.endsWith('.formula1.com');
}
