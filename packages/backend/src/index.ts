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
import { errorHandler } from './middleware/errorHandler';
import { connectRedis, cache } from './services/cache';
import { warmCache } from './services/jolpica';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
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
app.use('/api/admin', adminRouter);

// ── Error Handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  await connectRedis();

  // Asynchronously warm cache without blocking HTTP server listen
  warmCache().catch((err) => console.warn('[CacheWarming] Error:', err));

  app.listen(PORT, () => {
    console.log(`-> F1 Backend running on http://localhost:${PORT}`);
  });
}

start();

export default app;