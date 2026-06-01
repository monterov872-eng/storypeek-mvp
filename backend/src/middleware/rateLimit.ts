import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/** Global cap per IP (all routes). */
export const ipRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests from this connection. Please wait a minute.',
      reason: 'rate_limit',
    },
  },
});

/** Per-device cap for API routes. */
export const deviceRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.deviceId ?? req.ip ?? 'unknown',
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests from this device. Please slow down.',
      reason: 'rate_limit',
    },
  },
});

/** Stricter cap for profile searches per device. */
export const profileSearchRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => `profile:${req.deviceId ?? req.ip}`,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many profile searches. Wait a moment and try again.',
      reason: 'rate_limit',
    },
  },
});
