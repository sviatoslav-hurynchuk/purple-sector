import { Router, Request, Response, NextFunction } from 'express';
import { cache } from '../services/cache';
import { warmCache } from '../services/jolpica';

const router: Router = Router();

function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const adminKey = process.env.ADMIN_CACHE_KEY;

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
 * DELETE /api/admin/cache
 * Clears single key, pattern, or entire cache.
 * Query params: ?key=f1:next-race OR ?pattern=f1:schedule:*
 * Headers required: x-admin-token: <token> OR Authorization: Bearer <token>
 */
router.delete('/cache', adminAuth, async (req: Request, res: Response) => {
  try {
    const rawKey = req.query['key'];
    const rawPattern = req.query['pattern'];

    if (rawKey !== undefined && (typeof rawKey !== 'string' || rawKey.trim() === '')) {
      res.status(400).json({ error: 'Invalid key parameter. Must be a non-empty string.' });
      return;
    }

    if (rawPattern !== undefined && (typeof rawPattern !== 'string' || rawPattern.trim() === '')) {
      res.status(400).json({ error: 'Invalid pattern parameter. Must be a non-empty string.' });
      return;
    }

    const key = typeof rawKey === 'string' && rawKey.trim() !== '' ? rawKey.trim() : undefined;
    const pattern = typeof rawPattern === 'string' && rawPattern.trim() !== '' ? rawPattern.trim() : undefined;

    if (key && pattern) {
      res.status(400).json({ error: 'Cannot specify both key and pattern parameters.' });
      return;
    }

    if (key) {
      await cache.del(key);
      res.json({ success: true, message: `Deleted key: ${key}`, deletedKey: key });
      return;
    }

    const deletedCount = await cache.flush(pattern);
    res.json({
      success: true,
      message: `Cleared ${deletedCount} key(s)`,
      deletedCount,
      pattern: pattern ?? 'f1:*',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/admin/cache/warm
 * Triggers asynchronous cache warming for core endpoints.
 * Headers required: x-admin-token: <token> OR Authorization: Bearer <token>
 */
router.post('/cache/warm', adminAuth, (_req: Request, res: Response) => {
  warmCache().catch((err) => console.warn('[Admin] Manual cache warming failed:', err));
  res.json({ success: true, message: 'Cache warming triggered in background' });
});

export default router;
