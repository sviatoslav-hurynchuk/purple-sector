import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import racesRouter from './routes/races';
import standingsRouter from './routes/standings';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/races', racesRouter);
app.use('/api/standings', standingsRouter);

// ── Error Handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`-> F1 Backend running on http://localhost:${PORT}`);
});

export default app;