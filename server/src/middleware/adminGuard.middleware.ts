import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

/**
 * Production Admin Portal Availability Guard
 * 
 * When the Admin Portal is temporarily disabled for public hosting,
 * blocks access to admin API and authentication endpoints.
 * 
 * To re-enable the Admin Portal:
 * Set ENABLE_ADMIN_PORTAL=true in server/.env or toggle config.adminPortalEnabled = true.
 */
export function checkAdminPortalEnabled(req: Request, res: Response, next: NextFunction): void {
  if (!config.adminPortalEnabled) {
    res.status(503).json({
      error: 'The Admin Portal and administrative APIs are temporarily disabled for maintenance and security.',
      code: 'ADMIN_PORTAL_DISABLED'
    });
    return;
  }
  next();
}
