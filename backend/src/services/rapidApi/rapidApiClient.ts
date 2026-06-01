import type { AppConfig } from '../../config.js';
import { RapidApiError } from './errors.js';

export const RAPIDAPI_HOST = 'instagram-scraper-stable-api.p.rapidapi.com';

export type RapidApiKind = 'stories' | 'highlights' | 'highlight_stories' | 'posts' | 'profile';

export interface RapidApiPostOptions {
  path: string;
  body: Record<string, string>;
  kind: RapidApiKind;
  username?: string;
  highlightId?: string;
}

export interface RapidApiPostResult {
  payload: unknown;
  status: number;
}

export function logRapidApiRequest(
  kind: RapidApiKind,
  meta: { path: string; username?: string; highlightId?: string },
): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'rapidapi_request',
      kind,
      path: meta.path,
      username: meta.username,
      highlightId: meta.highlightId,
    }),
  );
}

export function logRapidApiRawResponse(
  kind: RapidApiKind,
  meta: { username?: string; highlightId?: string; path: string; status: number },
  raw: unknown,
): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'rapidapi_raw_response',
      kind,
      path: meta.path,
      username: meta.username,
      highlightId: meta.highlightId,
      status: meta.status,
      raw,
    }),
  );
}

export async function postRapidApi(
  config: AppConfig,
  options: RapidApiPostOptions,
): Promise<RapidApiPostResult> {
  const apiKey = config.RAPID_API_KEY?.trim();
  if (!apiKey) {
    throw new RapidApiError(
      'SERVICE_UNAVAILABLE',
      'RapidAPI is not configured. Set RAPID_API_KEY in backend/.env.',
      'upstream',
    );
  }

  const body = new URLSearchParams(options.body);
  const timeoutMs = config.RAPID_API_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  logRapidApiRequest(options.kind, {
    path: options.path,
    username: options.username,
    highlightId: options.highlightId,
  });

  let response: Response;
  try {
    response = await fetch(`https://${RAPIDAPI_HOST}${options.path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': apiKey,
      },
      body: body.toString(),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new RapidApiError(
        'SERVICE_UNAVAILABLE',
        'RapidAPI request timed out.',
        'timeout',
      );
    }
    throw new RapidApiError(
      'SERVICE_UNAVAILABLE',
      'Could not reach RapidAPI.',
      'network',
    );
  } finally {
    clearTimeout(timer);
  }

  const rawText = await response.text();
  let payload: unknown;
  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new RapidApiError(
      'SERVICE_UNAVAILABLE',
      'RapidAPI returned an invalid response.',
      'upstream',
      undefined,
      response.status,
    );
  }

  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'rapidapi_response',
      kind: options.kind,
      path: options.path,
      username: options.username,
      highlightId: options.highlightId,
      status: response.status,
      body: payload,
      bodyTextLength: rawText.length,
    }),
  );

  logRapidApiRawResponse(options.kind, {
    username: options.username,
    highlightId: options.highlightId,
    path: options.path,
    status: response.status,
  }, payload);

  if (response.status === 429) {
    throw new RapidApiError(
      'RATE_LIMITED',
      'RapidAPI rate limit reached. Try again later.',
      'rate_limit',
      undefined,
      response.status,
    );
  }

  if (!response.ok) {
    const message =
      extractMessage(payload) ??
      `RapidAPI request failed with status ${response.status}.`;
    throw new RapidApiError(
      response.status === 404 ? 'ACCOUNT_NOT_FOUND' : 'SERVICE_UNAVAILABLE',
      message,
      'upstream',
      undefined,
      response.status,
    );
  }

  return { payload, status: response.status };
}

export function isRapidApiEndpointMissing(err: unknown): boolean {
  if (!(err instanceof RapidApiError)) return false;
  if (err.statusCode !== 404) return false;
  return /does not exist/i.test(err.message);
}

function extractMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const obj = payload as Record<string, unknown>;
  for (const key of ['message', 'error', 'detail', 'status']) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}
