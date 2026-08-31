import { Router, Request, Response } from 'express';
import {
  getRaceSessionData,
  getOpenF1Sessions,
  getOpenF1Drivers,
  getOpenF1Stints,
  getOpenF1Weather,
  getOpenF1RaceControlEvents,
  resolveSessionKey,
} from '../services/openf1';

const router: Router = Router();

function setCacheHeaders(res: Response, maxAgeSeconds: number): void {
  res.setHeader(
    'Cache-Control',
    `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=60`
  );
}

/**
 * GET /api/openf1/race/:season/:round
 * (Also available as GET /api/openf1/session/:season/:round)
 * Returns complete race session dataset (tyre stints, race control messages,
 * weather snapshots, detailed lap splits, pit stops, and team radio clips)
 * for a completed Grand Prix (2023+).
 */
const handleRaceSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { season, round } = req.params;
    const year = parseInt(season, 10);

    if (isNaN(year) || year < 2023) {
      res.status(404).json({
        error: `OpenF1 telemetry is only available for 2023+ seasons (requested season: ${season}).`,
      });
      return;
    }

    const data = await getRaceSessionData(season, round);

    if (!data) {
      res.status(404).json({
        error: `OpenF1 session data not available for season ${season}, round ${round}.`,
      });
      return;
    }

    // Historical race data is immutable — cache aggressively
    setCacheHeaders(res, 86400);
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

router.get('/race/:season/:round', handleRaceSession);
router.get('/session/:season/:round', handleRaceSession);


/**
 * GET /api/openf1/sessions/:year
 * Returns all OpenF1 sessions recorded for a given calendar year.
 */
router.get('/sessions/:year', async (req: Request, res: Response) => {
  try {
    const { year } = req.params;
    const yNum = parseInt(year, 10);

    if (isNaN(yNum) || yNum < 2023) {
      res.status(404).json({ error: `OpenF1 sessions are only available from 2023 onwards.` });
      return;
    }

    const sessions = await getOpenF1Sessions(yNum);
    const isCurrent = yNum === new Date().getFullYear();
    setCacheHeaders(res, isCurrent ? 21600 : 86400); // 6h vs 24h
    res.json({ year: yNum, sessions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/openf1/drivers/:sessionKey
 * Returns driver roster with telemetry tags and team colours for a specific session.
 */
router.get('/drivers/:sessionKey', async (req: Request, res: Response) => {
  try {
    const { sessionKey } = req.params;
    const sKey = parseInt(sessionKey, 10);

    if (isNaN(sKey)) {
      res.status(400).json({ error: `Invalid sessionKey: ${sessionKey}` });
      return;
    }

    const drivers = await getOpenF1Drivers(sKey);
    setCacheHeaders(res, 86400);
    res.json({ sessionKey: sKey, drivers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/openf1/stints/:sessionKey
 * Returns tyre stint logs for a specific session.
 */
router.get('/stints/:sessionKey', async (req: Request, res: Response) => {
  try {
    const { sessionKey } = req.params;
    const sKey = parseInt(sessionKey, 10);

    if (isNaN(sKey)) {
      res.status(400).json({ error: `Invalid sessionKey: ${sessionKey}` });
      return;
    }

    const stints = await getOpenF1Stints(sKey);
    setCacheHeaders(res, 86400);
    res.json({ sessionKey: sKey, stints });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/openf1/weather/:sessionKey
 * Returns weather readings over time for a specific session.
 */
router.get('/weather/:sessionKey', async (req: Request, res: Response) => {
  try {
    const { sessionKey } = req.params;
    const sKey = parseInt(sessionKey, 10);

    if (isNaN(sKey)) {
      res.status(400).json({ error: `Invalid sessionKey: ${sessionKey}` });
      return;
    }

    const weather = await getOpenF1Weather(sKey);
    setCacheHeaders(res, 86400);
    res.json({ sessionKey: sKey, weather });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/openf1/race_control/:sessionKey
 * Returns FIA Race Control broadcast logs for a specific session.
 */
router.get('/race_control/:sessionKey', async (req: Request, res: Response) => {
  try {
    const { sessionKey } = req.params;
    const sKey = parseInt(sessionKey, 10);

    if (isNaN(sKey)) {
      res.status(400).json({ error: `Invalid sessionKey: ${sessionKey}` });
      return;
    }

    const events = await getOpenF1RaceControlEvents(sKey);
    setCacheHeaders(res, 86400);
    res.json({ sessionKey: sKey, events });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
