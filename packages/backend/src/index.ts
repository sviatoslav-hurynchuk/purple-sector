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

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, or mobile requests with no origin header
      if (!origin) return callback(null, true);

      // In non-production, allow any localhost/127.0.0.1 origin
      if (
        process.env.NODE_ENV !== 'production' &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      // Allow explicitly configured origins
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // Allow Vercel deployment and preview subdomains
      if (/^https:\/\/[a-z0-9-]+-sviatoslav-hurynchuk\.vercel\.app$/.test(origin)) {
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

  app.listen(PORT, () => {
    console.log(`-> F1 Backend running on http://localhost:${PORT}`);
  });
}

start();

export default app;