import type { Response } from 'express';

export const DEFAULT_STALE_WHILE_REVALIDATE_SECONDS = 30;

/**
 * Sets standardized Cache-Control headers with stale-while-revalidate for CDN & browser edge caching.
 *
 * @param res Express Response object
 * @param maxAgeSeconds Fresh duration in seconds (max-age, s-maxage)
 * @param staleWhileRevalidate Grace period in seconds for background revalidation (default: 30s)
 */
export function setCacheHeaders(
  res: Response,
  maxAgeSeconds: number,
  staleWhileRevalidate: number = DEFAULT_STALE_WHILE_REVALIDATE_SECONDS
): void {
  res.setHeader(
    'Cache-Control',
    `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidate}`
  );
}

/**
 * Explicit no-store cache header to prevent caching errors or sensitive data.
 */
export function setNoStoreCacheHeaders(res: Response): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
}
