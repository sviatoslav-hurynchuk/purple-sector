import { Router, Request, Response, NextFunction } from 'express';
import { livePollingEngine } from '../services/live-polling';
import { sessionWatcher } from '../services/session-watcher';
import {
  getRecentDriverTelemetry,
  getDriverLapTelemetry,
  getTelemetryComparison,
  getLocationSnapshot,
} from '../services/live-telemetry';
import type { LiveSessionState, RaceEvent, WeatherSnapshot } from '../types/f1';

const router: Router = Router();

function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const adminKey = process.env.ADMIN_CACHE_KEY;

  // If ADMIN_CACHE_KEY not set in local dev, allow request
  if (!adminKey && process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  if (!adminKey) {
    res.status(500).json({ error: 'Server misconfiguration: ADMIN_CACHE_KEY is not configured' });
    return;
  }

  let token: string | undefined;
  const xToken = req.headers['x-admin-token'];
  if (typeof xToken === 'string') {
    token = xToken;
  } else if (typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7).trim();
  }

  if (!token || token !== adminKey) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing admin token header' });
    return;
  }

  next();
}

/**
 * GET /api/live/state
 * Returns the current live session snapshot (JSON).
 * Automatically wakes up live engine if in-session, or provides completed snapshot.
 */
router.get('/state', async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const state = await sessionWatcher.ensureSessionState();
  res.json(state);
});

/**
 * GET /api/live/stream
 * Server-Sent Events (SSE) stream for real-time live timing & dashboard updates.
 */
router.get('/stream', async (req: Request, res: Response) => {
  // SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on Nginx/Render proxies
  res.flushHeaders?.();

  let isClosed = false;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  // Event handlers
  const handleState = (state: LiveSessionState) => {
    if (!isClosed && !res.writableEnded) {
      res.write(`event: state\ndata: ${JSON.stringify(state)}\n\n`);
    }
  };

  const handleRaceControl = (events: RaceEvent[]) => {
    if (!isClosed && !res.writableEnded) {
      res.write(`event: raceControl\ndata: ${JSON.stringify(events)}\n\n`);
    }
  };

  const handleWeather = (weather: WeatherSnapshot | null) => {
    if (!isClosed && !res.writableEnded) {
      res.write(`event: weather\ndata: ${JSON.stringify(weather)}\n\n`);
    }
  };

  // Cleanup on client disconnect registered early to handle aborts during initial state fetch
  const cleanup = () => {
    isClosed = true;
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    livePollingEngine.off('state', handleState);
    livePollingEngine.off('raceControl', handleRaceControl);
    livePollingEngine.off('weather', handleWeather);
    res.end();
  };

  req.on('close', cleanup);

  // Send initial state immediately upon connection (with lazy wakeup if in-session)
  const initialState = await sessionWatcher.ensureSessionState();

  // If client disconnected while waiting for sessionWatcher, abort setup
  if (isClosed || req.destroyed || res.writableEnded) {
    cleanup();
    return;
  }

  res.write(`event: state\ndata: ${JSON.stringify(initialState)}\n\n`);

  // Subscribe to LivePollingEngine events
  livePollingEngine.on('state', handleState);
  livePollingEngine.on('raceControl', handleRaceControl);
  livePollingEngine.on('weather', handleWeather);

  // Keepalive heartbeat ping every 15 seconds
  heartbeatInterval = setInterval(() => {
    if (!isClosed && !res.writableEnded) {
      res.write(': keep-alive\n\n');
    }
  }, 15000);
});

/**
 * POST /api/live/start
 * Starts the live polling engine for an active session.
 * Body (optional): { sessionKey?: number }
 */
router.post('/start', adminAuth, async (req: Request, res: Response) => {
  try {
    const rawKey = req.body?.sessionKey;
    const sessionKey = typeof rawKey === 'number' ? rawKey : undefined;

    const started = await livePollingEngine.start(sessionKey);

    if (!started) {
      res.status(404).json({
        error: 'Failed to start live polling: No active or latest session found.',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Live polling engine started successfully.',
      state: livePollingEngine.getState(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/live/stop
 * Stops the live polling engine.
 */
router.post('/stop', adminAuth, (_req: Request, res: Response) => {
  livePollingEngine.stop();
  res.json({
    success: true,
    message: 'Live polling engine stopped successfully.',
    state: livePollingEngine.getState(),
  });
});

// ── Live Telemetry & Timing Tower Endpoints ──────────────────────────────────

/**
 * GET /api/live/timing/tower
 * Returns the current live timing tower with positions, gaps, tyre compound and stints.
 */
router.get('/timing/tower', (_req: Request, res: Response) => {
  const state = livePollingEngine.getState();
  res.setHeader('Cache-Control', 'public, max-age=2, stale-while-revalidate=2');
  res.json({
    sessionKey: state.sessionKey,
    sessionName: state.sessionName,
    isActive: state.isActive,
    lastUpdated: state.lastUpdated,
    drivers: state.drivers,
  });
});

/**
 * GET /api/live/telemetry/compare/:driver1/:driver2
 * Returns side-by-side telemetry comparison for two drivers (for lap comparison overlays).
 * Query params:
 *   - sessionKey: target session ID
 *   - lap: optional lap number to compare
 *   - window: time window in seconds (default 15)
 *   - since / date: optional timestamp watermark
 *
 * NOTE: This route MUST be registered before /telemetry/:driverNumber
 * so Express doesn't interpret "compare" as a driver number param.
 */
router.get('/telemetry/compare/:driver1/:driver2', async (req: Request, res: Response) => {
  try {
    const { driver1, driver2 } = req.params;
    const d1 = parseInt(driver1, 10);
    const d2 = parseInt(driver2, 10);

    if (isNaN(d1) || isNaN(d2)) {
      res.status(400).json({ error: `Invalid driver numbers: ${driver1}, ${driver2}` });
      return;
    }

    const sessionKeyQuery = req.query['sessionKey'];
    const sessionKey = sessionKeyQuery
      ? parseInt(String(sessionKeyQuery), 10)
      : livePollingEngine.getState().sessionKey;

    if (!sessionKey) {
      res.status(400).json({
        error: 'No active live session. Provide ?sessionKey=<id> in query.',
      });
      return;
    }

    const lapQuery = req.query['lap'];
    let lapNum: number | undefined;
    if (lapQuery) {
      lapNum = parseInt(String(lapQuery), 10);
      if (isNaN(lapNum) || lapNum < 1) {
        res.status(400).json({ error: `Invalid lap: ${String(lapQuery)}` });
        return;
      }
    }
    const windowQuery = req.query['window'];
    const windowSec = windowQuery ? parseInt(String(windowQuery), 10) : 15;
    const sinceQuery = req.query['since'] || req.query['date'];
    const dateFrom = typeof sinceQuery === 'string' ? sinceQuery : undefined;

    const comparison = await getTelemetryComparison(sessionKey, d1, d2, lapNum, windowSec, dateFrom);
    const maxAge = lapNum ? 86400 : 1;
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    res.json({ sessionKey, driver1: d1, driver2: d2, lapNumber: lapNum, data: comparison });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/live/telemetry/:driverNumber
 * Returns high-frequency telemetry samples for a driver.
 * Query params:
 *   - sessionKey: target session ID (defaults to active session)
 *   - window: time window in seconds (default 15, max 30)
 *   - lap: optional lap number (fetches full lap telemetry)
 */
router.get('/telemetry/:driverNumber', async (req: Request, res: Response) => {
  try {
    const { driverNumber } = req.params;
    const dNum = parseInt(driverNumber, 10);

    if (isNaN(dNum)) {
      res.status(400).json({ error: `Invalid driverNumber: ${driverNumber}` });
      return;
    }

    const sessionKeyQuery = req.query['sessionKey'];
    const sessionKey = sessionKeyQuery
      ? parseInt(String(sessionKeyQuery), 10)
      : livePollingEngine.getState().sessionKey;

    if (!sessionKey) {
      res.status(400).json({
        error: 'No active live session. Provide ?sessionKey=<id> in query.',
      });
      return;
    }

    const lapQuery = req.query['lap'];
    if (lapQuery) {
      const lapNum = parseInt(String(lapQuery), 10);
      if (isNaN(lapNum) || lapNum < 1) {
        res.status(400).json({ error: `Invalid lap: ${String(lapQuery)}` });
        return;
      }
      const lapTelemetry = await getDriverLapTelemetry(sessionKey, dNum, lapNum);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.json({ sessionKey, driverNumber: dNum, lapNumber: lapNum, samples: lapTelemetry });
      return;
    }

    const windowQuery = req.query['window'];
    const windowSec = windowQuery ? parseInt(String(windowQuery), 10) : 15;
    const sinceQuery = req.query['since'] || req.query['date'];
    const dateFrom = typeof sinceQuery === 'string' ? sinceQuery : undefined;

    const samples = await getRecentDriverTelemetry(sessionKey, dNum, windowSec, dateFrom);
    res.setHeader('Cache-Control', 'public, max-age=1, stale-while-revalidate=1');
    res.json({ sessionKey, driverNumber: dNum, windowSeconds: windowSec, samples });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/live/map/positions
 * Returns recent car location coordinates for 2D track map rendering.
 * Query params:
 *   - sessionKey: target session ID
 *   - window: time window in seconds (default 5, max 10)
 *   - since / date: optional timestamp watermark
 */
router.get('/map/positions', async (req: Request, res: Response) => {
  try {
    const sessionKeyQuery = req.query['sessionKey'];
    const sessionKey = sessionKeyQuery
      ? parseInt(String(sessionKeyQuery), 10)
      : livePollingEngine.getState().sessionKey;

    if (!sessionKey) {
      res.status(400).json({
        error: 'No active live session. Provide ?sessionKey=<id> in query.',
      });
      return;
    }

    const windowQuery = req.query['window'];
    const windowSec = windowQuery ? parseInt(String(windowQuery), 10) : 5;
    const sinceQuery = req.query['since'] || req.query['date'];
    const dateFrom = typeof sinceQuery === 'string' ? sinceQuery : undefined;

    const locations = await getLocationSnapshot(sessionKey, windowSec, dateFrom);
    res.setHeader('Cache-Control', 'public, max-age=1, stale-while-revalidate=1');
    res.json({ sessionKey, windowSeconds: windowSec, locations });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
