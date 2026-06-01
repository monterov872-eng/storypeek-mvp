import type { ApiErrorCode } from '../../types.js';
import type { RequestFailureReason } from '../../utils/requestLog.js';

export class ProviderError extends Error {
  readonly code: ApiErrorCode;
  readonly reason: RequestFailureReason;
  readonly retryAfterSec?: number;

  constructor(
    code: ApiErrorCode,
    message: string,
    reason: RequestFailureReason,
    retryAfterSec?: number,
  ) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.reason = reason;
    this.retryAfterSec = retryAfterSec;
  }
}

export function throwProvider(
  code: ApiErrorCode,
  message: string,
  reason: RequestFailureReason = 'upstream',
): never {
  throw new ProviderError(code, message, reason);
}

export function mapHttpStatus(status: number, context: string): ProviderError {
  if (status === 404) {
    return new ProviderError('ACCOUNT_NOT_FOUND', 'Account not found', 'upstream');
  }
  if (status === 429) {
    return new ProviderError(
      'RATE_LIMITED',
      'Instagram blocked requests temporarily. Try later.',
      'instagram_block',
    );
  }
  if (status === 401 || status === 403) {
    return new ProviderError(
      'RATE_LIMITED',
      'Instagram blocked requests temporarily. Try later.',
      'instagram_block',
    );
  }
  return new ProviderError(
    'SERVICE_UNAVAILABLE',
    `Could not load data (${context}). Try again shortly.`,
    'upstream',
  );
}

export function isRetryableError(err: unknown): boolean {
  if (!(err instanceof ProviderError)) return true;
  return err.reason === 'timeout' || err.reason === 'network';
}
