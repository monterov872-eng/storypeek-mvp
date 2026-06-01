import type { ApiErrorCode } from '../../types.js';
import type { RequestFailureReason } from '../../utils/requestLog.js';

export class RapidApiError extends Error {
  readonly code: ApiErrorCode;
  readonly reason?: RequestFailureReason;
  readonly retryAfterSec?: number;
  readonly statusCode?: number;

  constructor(
    code: ApiErrorCode,
    message: string,
    reason?: RequestFailureReason,
    retryAfterSec?: number,
    statusCode?: number,
  ) {
    super(message);
    this.name = 'RapidApiError';
    this.code = code;
    this.reason = reason;
    this.retryAfterSec = retryAfterSec;
    this.statusCode = statusCode;
  }
}
