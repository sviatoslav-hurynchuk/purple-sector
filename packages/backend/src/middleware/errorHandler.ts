import { Request, Response, NextFunction } from 'express';

/**
 * Global error handling middleware.
 * Should be registered last in Express middleware chain.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[ErrorHandler]', err.message);

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
}
