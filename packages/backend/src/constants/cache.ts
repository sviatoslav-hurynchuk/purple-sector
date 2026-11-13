/**
 * Centralized caching TTL durations (in seconds) and lock coordination settings.
 */
export const CACHE_TTL = {
  /** 20 seconds: Ultra-hot real-time data during active race weekends */
  TWENTY_SECONDS: 20,
  /** 1 minute: Standard dynamic updates and warmups */
  ONE_MINUTE: 60,
  /** 2 minutes: Live race session results polling */
  TWO_MINUTES: 120,
  /** 5 minutes: Fallback for empty/unpopulated data and constructor profiles */
  FIVE_MINUTES: 300,
  /** 10 minutes: Short retention for empty/transient responses */
  TEN_MINUTES: 600,
  /** 15 minutes: Head-to-head mid-week cache */
  FIFTEEN_MINUTES: 900,
  /** 1 hour: Semi-static season lists */
  ONE_HOUR: 3600,
  /** 6 hours: Active current-season schedule and telemetry */
  SIX_HOURS: 21600,
  /** 12 hours: Hard SWR retention for next race */
  TWELVE_HOURS: 43200,
  /** 24 hours (1 day): Completed races, pit stops, laps, historical seasons, driver profiles */
  ONE_DAY: 86400,
  /** 7 days (1 week): Past season immutable schedules and lap archives */
  ONE_WEEK: 604800,
  /** 30 days: Audio radio transcripts (immutable) */
  THIRTY_DAYS: 86400 * 30,
} as const;

/**
 * Standard lock timeouts and retry parameters for distributed coordination.
 */
export const CACHE_LOCK = {
  /** Default lock TTL in seconds to prevent deadlocks */
  DEFAULT_TTL_SECONDS: 30,
  /** Cache miss lock TTL in seconds */
  MISS_LOCK_TTL_SECONDS: 15,
  /** Maximum retry attempts while waiting for an in-flight cache miss fetch */
  MISS_RETRIES: 5,
  /** Backoff sleep duration (ms) between retry attempts */
  MISS_BACKOFF_MS: 200,
  /** Background refresher instance lock TTL in seconds */
  REFRESHER_LOCK_TTL_SECONDS: 60,
  /** Redis ping timeout in milliseconds */
  REDIS_PING_TIMEOUT_MS: 3000,
  /** Graceful shutdown timeout in milliseconds */
  SHUTDOWN_TIMEOUT_MS: 5000,
} as const;
