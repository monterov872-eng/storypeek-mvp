import { ProviderError } from '../services/instagram/errors.js';
import { RapidApiError } from '../services/rapidApi/errors.js';

export function logHighlightsFailure(
  username: string,
  phase: 'profile_preview' | 'list' | 'detail',
  err: unknown,
  extra?: Record<string, string | number | boolean | undefined>,
) {
  let code: string | undefined;
  let reason: string | undefined;
  let message: string;
  let httpStatus: number | undefined;

  if (err instanceof ProviderError) {
    code = err.code;
    reason = err.reason;
    message = err.message;
  } else if (err instanceof RapidApiError) {
    code = err.code;
    reason = err.reason;
    message = err.message;
    httpStatus = err.statusCode;
  } else if (err instanceof Error) {
    message = err.message;
  } else {
    message = String(err);
  }

  console.warn(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'highlights_request_failed',
      username,
      phase,
      code,
      reason,
      httpStatus,
      message,
      ...extra,
    }),
  );
}
