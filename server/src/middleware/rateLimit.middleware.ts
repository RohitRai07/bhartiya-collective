import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * High-performance sliding-window in-memory Rate Limiter
 * Zero external dependencies, automatic memory cleanup
 */
export function createRateLimiter(options: { windowMs: number; max: number; message: string }) {
  const hits: Map<string, RateLimitRecord> = new Map();

  // Cleanup expired IPs every 2 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, 2 * 60 * 1000).unref?.();

  return (req: Request, res: Response, next: NextFunction): void => {
    // Client IP key
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress) || '127.0.0.1';
    const key = `${req.path}:${clientIp.trim()}`;
    const now = Date.now();

    const record = hits.get(key);

    if (!record || now > record.resetTime) {
      hits.set(key, { count: 1, resetTime: now + options.windowMs });
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', options.max - 1);
      next();
      return;
    }

    if (record.count >= options.max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.status(429).json({
        error: options.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds,
      });
      return;
    }

    record.count++;
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - record.count));
    next();
  };
}

export const loginRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.login.windowMs,
  max: config.rateLimit.login.max,
  message: 'Too many sign-in attempts from this IP address. Please wait 15 minutes before trying again.',
});

export const otpRequestRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.otpRequest.windowMs,
  max: config.rateLimit.otpRequest.max,
  message: 'Too many OTP requests. Please wait a few minutes before requesting another code.',
});

export const otpVerifyRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.otpVerify.windowMs,
  max: config.rateLimit.otpVerify.max,
  message: 'Too many invalid verification attempts. For your security, requests have been temporarily paused.',
});

export const adminApiRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.adminApi.windowMs,
  max: config.rateLimit.adminApi.max,
  message: 'Too many administrative requests. Please slow down.',
});
