import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import racesRouter from './routes/races';
import standingsRouter from './routes/standings';
import driversRouter from './routes/drivers';
import constructorsRouter from './routes/constructors';
import adminRouter from './routes/admin';
import openF1Router from './routes/openf1';
import liveRouter from './routes/live';
import headToHeadRouter from './routes/head-to-head';
import reliabilityRouter from './routes/reliability';
import { errorHandler } from './middleware/errorHandler';
import { connectRedis, cache } from './services/cache';
import { warmCache } from './services/jolpica';
import { startSessionWatcher } from './services/session-watcher';
import { startCacheRefresher, stopCacheRefresher } from './services/cache-refresher';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';
const DOCUMENTED_PRODUCTION_ORIGIN = 'https://purple-sector-sviatoslav.vercel.app';

// Parse allowed origins strictly from environment variables (ALLOWED_ORIGINS, FRONTEND_URL, NEXT_PUBLIC_APP_URL)
const rawEnvOrigins = [
  process.env.ALLOWED_ORIGINS,
  process.env.FRONTEND_URL,
  process.env.NEXT_PUBLIC_APP_URL,
]
  .filter(Boolean)
  .flatMap((v) => (v as string).split(','))
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins: string[] =
  rawEnvOrigins.length > 0
    ? rawEnvOrigins
    : isProduction
      ? [DOCUMENTED_PRODUCTION_ORIGIN]
      : [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:3001',
        ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, or mobile requests with no origin header
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, '');

      // In non-production, allow any localhost/127.0.0.1 origin
      if (
        !isProduction &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)
      ) {
        return callback(null, true);
      }

      // Allow explicitly configured origins from ENV
      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: {
      backend: cache.isConnected() ? 'redis' : 'memory',
      stats: cache.getStats(),
    },
  });
});

app.use('/api/races', racesRouter);
app.use('/api/standings', standingsRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/constructors', constructorsRouter);
app.use('/api/openf1', openF1Router);
app.use('/api/live', liveRouter);
app.use('/api/head-to-head', headToHeadRouter);
app.use('/api/reliability', reliabilityRouter);
app.use('/api/admin', adminRouter);

// ── Error Handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  await connectRedis();

  // Asynchronously warm cache without blocking HTTP server listen
  warmCache().catch((err) => console.warn('[CacheWarming] Error:', err));

  // Start background OpenF1 session lifecycle watcher
  startSessionWatcher();

  // Start autonomous proactive background cache refresher
  startCacheRefresher();

  const server = app.listen(PORT, () => {
    console.log(`-> F1 Backend running on http://localhost:${PORT}`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('Shutting down backend gracefully...');
    stopCacheRefresher();
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();

export default app;
