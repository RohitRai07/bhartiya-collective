import { Request, Response, NextFunction } from 'express';

/**
 * Production Security Headers Middleware
 * Protects against MIME sniffing, Clickjacking, and common web attack vectors
 */
export function setSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Hide Express server signature
  res.removeHeader('X-Powered-By');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent framing to mitigate Clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');

  // Cross-Site Scripting protection filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer header privacy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict sensitive browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Strict Transport Security (HSTS) - Enabled in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
}
