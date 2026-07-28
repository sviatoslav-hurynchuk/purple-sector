import { Router, Request, Response, NextFunction } from 'express';
import { cache } from '../services/cache';
import { warmCache } from '../services/jolpica';

const router: Router = Router();

const ADMIN_TOKEN = process.env.ADMIN_CACHE_KEY ?? 'secret-admin-key';

function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const token =
    req.headers['x-admin-token'] ||
    req.query['token'] ||
    req.headers.authorization?.replace('Bearer ', '');

  if (!token || token !== ADMIN_TOKEN) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing admin token' });
    return;
  }

  next();
}

/**
 * DELETE /api/admin/cache
 * Clears single key, pattern, or entire cache.
 * Query params: ?key=f1:next-race OR ?pattern=f1:schedule:*
 */
router.delete('/cache', adminAuth, async (req: Request, res: Response) => {
  try {
    const key = req.query['key'] as string | undefined;
    const pattern = req.query['pattern'] as string | undefined;

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
 */
router.post('/cache/warm', adminAuth, (_req: Request, res: Response) => {
  warmCache().catch((err) => console.warn('[Admin] Manual cache warming failed:', err));
  res.json({ success: true, message: 'Cache warming triggered in background' });
});

export default router;
