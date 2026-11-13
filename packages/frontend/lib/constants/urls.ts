/**
 * Centralized frontend URL constants and external CDN endpoints.
 */

/**
 * Backend API base URL for client & server components.
 * Defaults to http://localhost:3001 if NEXT_PUBLIC_API_URL is unset.
 */
export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Official Formula 1 CDN media pipeline base URL */
export const F1_MEDIA_CDN_URL = 'https://media.formula1.com';

/** Wikimedia Commons raw SVG/PNG asset file path */
export const WIKIMEDIA_COMMONS_BASE_URL = 'https://commons.wikimedia.org/wiki/Special:FilePath';

/** FlagCDN endpoint for authentic country flag icons */
export const FLAG_CDN_BASE_URL = 'https://flagcdn.com';
