import { Request, Response, NextFunction } from 'express';
import { sessionService, SessionPayload } from '../services/session.service';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: SessionPayload;
      sessionId?: string;
    }
  }
}

/**
 * Production Admin Authentication Middleware
 * Enforces:
 * 1. Token presence (Bearer header)
 * 2. Cryptographic signature and expiry verification
 * 3. Session revocation and idle timeout checks
 * 4. Two-Factor Authentication (2FA) verification requirement
 * 5. Role-based authorization ('admin' role requirement)
 */
export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Please log in with administrative credentials.',
      code: 'UNAUTHENTICATED'
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({
      error: 'Malformed authorization token.',
      code: 'UNAUTHENTICATED'
    });
    return;
  }

  const result = sessionService.verifySessionToken(token);

  if (!result.valid || !result.payload) {
    res.status(401).json({
      error: result.error || 'Invalid or expired session.',
      code: result.code || 'INVALID_TOKEN'
    });
    return;
  }

  const payload = result.payload;

  // Enforce 2FA verification: Admin MUST have completed 2FA
  if (!payload.twoFactorVerified) {
    res.status(401).json({
      error: 'Two-factor authentication must be completed before accessing the Admin Portal.',
      code: '2FA_REQUIRED'
    });
    return;
  }

  // Enforce Role-based Authorization: Admin role required
  if (payload.role !== 'admin') {
    res.status(403).json({
      error: 'Access denied: You do not possess administrator permissions.',
      code: 'FORBIDDEN'
    });
    return;
  }

  // Attach verified user payload to request
  req.user = payload;
  req.sessionId = payload.sessionId;
  next();
}

/**
 * Optional authentication middleware (for endpoints that support both public and authenticated views)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const result = sessionService.verifySessionToken(token);
    if (result.valid && result.payload) {
      req.user = result.payload;
      req.sessionId = result.payload.sessionId;
    }
  }
  next();
}
