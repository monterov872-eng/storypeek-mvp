import type { ApiErrorBody, ApiErrorCode, ApiErrorReason } from './errorMessages';
import { getErrorCopy } from './errorMessages';
import { isInstagramBlockedError } from './instagramCooldown';

export function isBlockedApiError(err: ApiErrorBody & { retryAfter?: number }): boolean {
  if (isInstagramBlockedError(err.code, err.reason, err.message)) return true;
  const copy = getErrorCopy(err);
  return copy.title === 'Instagram blocked';
}

export function isBlockedErrorParams(
  code?: string,
  reason?: ApiErrorReason,
  message?: string,
): boolean {
  const errorCode = (code as ApiErrorCode) ?? 'SERVICE_UNAVAILABLE';
  if (isInstagramBlockedError(errorCode, reason, message)) return true;
  const copy = getErrorCopy({ code: errorCode, reason, message: message ?? '' });
  return copy.title === 'Instagram blocked';
}
