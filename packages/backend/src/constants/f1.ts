/**
 * Formula 1 historical domain constants and era boundaries.
 */
export const F1_HISTORICAL_BOUNDS = {
  /** The first Formula 1 World Championship season (1950) */
  FIRST_SEASON: 1950,
  /** First season with digital lap-by-lap timing archive (1996) */
  LAPS_FIRST_SEASON: 1996,
  /** First season with digital pit stop timing data (2012) */
  PIT_STOPS_FIRST_SEASON: 2012,
  /** First season supported by OpenF1 telemetry and team radio (2023) */
  OPENF1_FIRST_SEASON: 2023,
} as const;

/**
 * Jolpica Ergast API queue and rate limiting parameters.
 */
export const JOLPICA_LIMITS = {
  /** Maximum concurrent in-flight HTTP requests to Jolpica */
  MAX_CONCURRENCY: 2,
  /** Minimum interval in milliseconds between consecutive requests */
  MIN_INTERVAL_MS: 120,
  /** Maximum backlog queue capacity before rejecting excess calls */
  MAX_QUEUE_CAPACITY: 200,
} as const;
