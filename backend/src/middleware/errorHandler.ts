import type { NextFunction, Request, Response } from 'express';
import type { ApiErrorCode } from '../types.js';
import { ProviderError } from '../services/instagram/errors.js';
import { RapidApiError } from '../services/rapidApi/errors.js';
import type { RequestFailureReason } from '../utils/requestLog.js';
import { logRequestEvent } from '../utils/requestLog.js';
import { startInstagramCooldown } from '../services/instagramCooldown.js';

const CODE_TO_STATUS: Record<string, number> = {
  ACCOUNT_NOT_FOUND: 404,
  ACCOUNT_PRIVATE: 403,
  NO_STORIES: 404,
  UNLOCK_REQUIRED: 402,
  SERVICE_UNAVAILABLE: 503,
  RATE_LIMITED: 429,
  VALIDATION_ERROR: 400,
};

export function apiError(
  res: Response,
  code: ApiErrorCode,
  message: string,
  reason?: RequestFailureReason,
  status?: number,
  retryAfterSec?: number,
) {
  const body: Record<string, unknown> = { code, message, reason };
  if (retryAfterSec != null) body.retryAfter = retryAfterSec;
  return res.status(status ?? CODE_TO_STATUS[code] ?? 500).json({ error: body });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ProviderError) {
    if (err.reason === 'instagram_block' && req.deviceId) {
      startInstagramCooldown(req.deviceId);
    }
    logRequestEvent('instagram_failure', {
      code: err.code,
      reason: err.reason,
      message: err.message,
    });
    return apiError(
      res,
      err.code,
      err.message,
      err.reason,
      undefined,
      err.retryAfterSec,
    );
  }

  if (err instanceof RapidApiError) {
    logRequestEvent('instagram_failure', {
      code: err.code,
      reason: err.reason ?? 'upstream',
      message: err.message,
    });
    return apiError(
      res,
      err.code,
      err.message,
      err.reason,
      err.statusCode,
      err.retryAfterSec,
    );
  }

  const e = err as Error & { code?: ApiErrorCode; reason?: RequestFailureReason };
  if (e.code && CODE_TO_STATUS[e.code]) {
    return apiError(res, e.code, e.message, e.reason);
  }

  console.error(err);
  return apiError(
    res,
    'SERVICE_UNAVAILABLE',
    'Something went wrong. Please try again.',
    'upstream',
  );
}
