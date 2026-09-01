import { Router, Request, Response, NextFunction } from 'express';
import { livePollingEngine } from '../services/live-polling';
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
 */
router.get('/state', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json(livePollingEngine.getState());
});

/**
 * GET /api/live/stream
 * Server-Sent Events (SSE) stream for real-time live timing & dashboard updates.
 */
router.get('/stream', (req: Request, res: Response) => {
  // SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on Nginx/Render proxies
  res.flushHeaders?.();

  // Send initial full state immediately upon connection
  const initialState = livePollingEngine.getState();
  res.write(`event: state\ndata: ${JSON.stringify(initialState)}\n\n`);

  // Event handlers
  const handleState = (state: LiveSessionState) => {
    res.write(`event: state\ndata: ${JSON.stringify(state)}\n\n`);
  };

  const handleRaceControl = (events: RaceEvent[]) => {
    res.write(`event: raceControl\ndata: ${JSON.stringify(events)}\n\n`);
  };

  const handleWeather = (weather: WeatherSnapshot | null) => {
    res.write(`event: weather\ndata: ${JSON.stringify(weather)}\n\n`);
  };

  // Subscribe to LivePollingEngine events
  livePollingEngine.on('state', handleState);
  livePollingEngine.on('raceControl', handleRaceControl);
  livePollingEngine.on('weather', handleWeather);

  // Keepalive heartbeat ping every 15 seconds
  const heartbeatInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 15000);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    livePollingEngine.off('state', handleState);
    livePollingEngine.off('raceControl', handleRaceControl);
    livePollingEngine.off('weather', handleWeather);
    res.end();
  });
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

export default router;
