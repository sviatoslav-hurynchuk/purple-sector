/**
 * Cache Warmup Crawler for Purple Sector F1 Platform.
 * 
 * Crawls and pre-warms all primary platform routes, ensuring
 * that Next.js ISR HTML caches and CDN edge caches are populated
 * immediately after deployment.
 * 
 * Usage:
 *   node scripts/warm-pages.mjs [baseUrl]
 *   SITE_URL=https://your-production-domain.com node scripts/warm-pages.mjs
 */

const BASE_URL = process.argv[2] || process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const CONCURRENCY = 3;
const RETRIES = 2;

const CONSTRUCTORS = [
  'ferrari',
  'mclaren',
  'mercedes',
  'red_bull',
  'aston_martin',
  'alpine',
  'williams',
  'rb',
  'sauber',
  'haas',
];

const DRIVERS = [
  'max_verstappen',
  'norris',
  'leclerc',
  'piastri',
  'sainz',
  'hamilton',
  'russell',
  'perez',
  'alonso',
  'stroll',
  'gasly',
  'ocon',
  'albon',
  'colapinto',
  'bearman',
  'hulkenberg',
  'bortoleto',
  'lawson',
  'hadjar',
  'antonelli',
  'arvid_lindblad',
  'bottas',
];

const STATIC_ROUTES = [
  '/',
  '/calendar',
  '/standings',
  '/constructors',
  '/drivers',
  '/head-to-head',
];

const CALENDAR_ROUNDS = Array.from({ length: 24 }, (_, i) => String(i + 1));
const TELEMETRY_ROUNDS = ['1', '2', '3'];

const ALL_ROUTES = [
  ...STATIC_ROUTES,
  ...CONSTRUCTORS.map((c) => `/constructors/${c}`),
  ...DRIVERS.map((d) => `/drivers/${d}`),
  ...CALENDAR_ROUNDS.map((r) => `/calendar/${r}`),
  ...TELEMETRY_ROUNDS.flatMap((r) => [
    `/calendar/${r}/laps`,
    `/calendar/${r}/pit-stops`,
  ]),
];

async function warmRoute(path) {
  const url = `${BASE_URL.replace(/\/$/, '')}${path}`;
  let lastStatus = 0;
  let lastError = null;

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const start = performance.now();
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'PurpleSector-CacheWarmer/1.0',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      const elapsed = Math.round(performance.now() - start);
      lastStatus = res.status;

      if (res.ok) {
        // Read small chunk to ensure stream initiates
        await res.text();
        return { path, status: res.status, elapsed, ok: true };
      }

      if (attempt < RETRIES) {
        await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    } catch (err) {
      lastError = err;
      if (attempt < RETRIES) {
        await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    }
  }

  return {
    path,
    status: lastStatus || 500,
    elapsed: 0,
    ok: false,
    error: lastError?.message || `HTTP ${lastStatus}`,
  };
}

async function run() {
  console.log(`[Warmup] Target: ${BASE_URL}`);
  console.log(`[Warmup] Warming ${ALL_ROUTES.length} routes with concurrency ${CONCURRENCY}...\n`);

  const globalStart = performance.now();
  const results = [];
  let index = 0;

  async function worker() {
    while (index < ALL_ROUTES.length) {
      const i = index++;
      const path = ALL_ROUTES[i];
      const res = await warmRoute(path);
      results.push(res);

      const statusTag = res.ok ? '✓' : '✗';
      const color = res.ok ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';
      console.log(`  ${color}[${statusTag}] ${res.status}${reset} ${path.padEnd(32)} (${res.elapsed}ms)${res.error ? ` [Error: ${res.error}]` : ''}`);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, ALL_ROUTES.length) }, () => worker());
  await Promise.all(workers);

  const totalTime = Math.round(performance.now() - globalStart);
  const successCount = results.filter((r) => r.ok).length;
  const failCount = results.length - successCount;
  const avgTime = Math.round(results.reduce((sum, r) => sum + r.elapsed, 0) / (results.length || 1));

  console.log(`\n========================================`);
  console.log(`[Warmup Finished]`);
  console.log(`  Total routes: ${results.length}`);
  console.log(`  Succeeded:    ${successCount}`);
  console.log(`  Failed:       ${failCount}`);
  console.log(`  Avg latency:  ${avgTime}ms`);
  console.log(`  Total time:   ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`========================================\n`);

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('[Warmup Fatal Error]:', err);
  process.exit(1);
});
