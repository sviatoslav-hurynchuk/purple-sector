import { Router, Request, Response } from 'express';
import { cache } from '../services/cache';
import {
  getRaceSessionData,
  getOpenF1Sessions,
  getOpenF1Drivers,
  getOpenF1Stints,
  getOpenF1Weather,
  getOpenF1RaceControlEvents,
  resolveSessionKey,
} from '../services/openf1';
import { getAudioTranscript } from '../services/transcription';

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

    const swrKey = `f1:swr:openf1:race:${season}:${round}`;
    const result = await cache.swr(
      swrKey,
      () => getRaceSessionData(season, round),
      { softTtlSeconds: 60, hardTtlSeconds: 86400, shouldCache: (data) => Boolean(data?.isComplete) }
    );

    if (!result.data) {
      res.status(404).json({
        error: `OpenF1 session data not available for season ${season}, round ${round}.`,
      });
      return;
    }

    res.setHeader('X-Cache-Status', result.status);
    setCacheHeaders(res, 86400);
    res.json(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

router.get('/race/:season/:round', handleRaceSession);
router.get('/session/:season/:round', handleRaceSession);

/**
 * GET /api/openf1/radio/transcript
 * Returns speech-to-text transcript for an official FIA team radio MP3 URL.
 */
router.get('/radio/transcript', async (req: Request, res: Response) => {
  try {
    const url = req.query.url;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "url" query parameter' });
      return;
    }
    const driverNumber = req.query.driverNumber ? parseInt(String(req.query.driverNumber), 10) : undefined;
    const result = await getAudioTranscript(url, driverNumber);
    if (result.transcript) {
      setCacheHeaders(res, 86400 * 30); // 30 days cache header for successful transcripts
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    res.json({ url, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

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

    const isCurrent = yNum === new Date().getFullYear();
    const swrKey = `f1:swr:openf1:sessions:${yNum}`;
    const result = await cache.swr(
      swrKey,
      () => getOpenF1Sessions(yNum),
      { softTtlSeconds: isCurrent ? 300 : 86400, hardTtlSeconds: isCurrent ? 21600 : 604800 }
    );

    res.setHeader('X-Cache-Status', result.status);
    setCacheHeaders(res, isCurrent ? 21600 : 86400); // 6h vs 24h
    res.json({ year: yNum, sessions: result.data });
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

    const swrKey = `f1:swr:openf1:drivers:${sKey}`;
    const result = await cache.swr(
      swrKey,
      () => getOpenF1Drivers(sKey),
      { softTtlSeconds: 300, hardTtlSeconds: 86400 }
    );

    res.setHeader('X-Cache-Status', result.status);
    setCacheHeaders(res, 86400);
    res.json({ sessionKey: sKey, drivers: result.data });
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

    const swrKey = `f1:swr:openf1:stints:${sKey}`;
    const result = await cache.swr(
      swrKey,
      () => getOpenF1Stints(sKey),
      { softTtlSeconds: 300, hardTtlSeconds: 86400 }
    );

    res.setHeader('X-Cache-Status', result.status);
    setCacheHeaders(res, 86400);
    res.json({ sessionKey: sKey, stints: result.data });
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

    const swrKey = `f1:swr:openf1:weather:${sKey}`;
    const result = await cache.swr(
      swrKey,
      () => getOpenF1Weather(sKey),
      { softTtlSeconds: 120, hardTtlSeconds: 86400 }
    );

    res.setHeader('X-Cache-Status', result.status);
    setCacheHeaders(res, 86400);
    res.json({ sessionKey: sKey, weather: result.data });
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

    const swrKey = `f1:swr:openf1:race_control:${sKey}`;
    const result = await cache.swr(
      swrKey,
      () => getOpenF1RaceControlEvents(sKey),
      { softTtlSeconds: 120, hardTtlSeconds: 86400 }
    );

    res.setHeader('X-Cache-Status', result.status);
    setCacheHeaders(res, 86400);
    res.json({ sessionKey: sKey, events: result.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/openf1/audio-proxy
 * Proxies and streams external Formula 1 team radio audio files with proper CORS headers.
 * Allows Web Audio API GainNode amplification (up to 200%) in frontend browsers without CORS silencing.
 */
router.get('/audio-proxy', async (req: Request, res: Response) => {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      res.status(400).json({ error: 'Invalid URL' });
      return;
    }

    // Security check: only proxy official Formula 1 timing audio CDN over HTTPS
    const host = parsed.hostname;
    const isAllowedHost = host === 'formula1.com' || host.endsWith('.formula1.com');
    if (parsed.protocol !== 'https:' || !isAllowedHost) {
      res.status(403).json({ error: 'Origin not allowed for audio proxying' });
      return;
    }

    const upstream = await fetch(parsed.href, { redirect: 'manual' });
    if (!upstream.ok || !upstream.body) {
      res.status(upstream.status).json({ error: 'Failed to fetch upstream audio stream' });
      return;
    }

    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    const length = upstream.headers.get('content-length');
    if (length) res.setHeader('Content-Length', length);

    const { Readable } = await import('stream');
    Readable.fromWeb(upstream.body as import('stream/web').ReadableStream).pipe(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audio proxy error';
    res.status(500).json({ error: message });
  }
});

export default router;