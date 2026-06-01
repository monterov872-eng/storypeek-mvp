import type { AppConfig } from '../../config.js';
import { RapidApiError } from './errors.js';
import { RAPIDAPI_HOST } from './rapidApiClient.js';

export type RapidHighlightKind = 'highlights' | 'highlight_stories';

export interface RapidHighlightPostOptions {
  path: string;
  body: Record<string, string>;
  kind: RapidHighlightKind;
  username?: string;
  highlightId?: string;
}

export interface RapidHighlightPostResult {
  payload: unknown;
  status: number;
  host: string;
}

export interface ResolvedHighlightApiCredentials {
  apiKey: string;
  host: string;
}

/** Uses RAPID_HIGHLIGHT_* when set; falls back to main RapidAPI key + stable host. */
export function resolveHighlightApiCredentials(
  config: AppConfig,
): ResolvedHighlightApiCredentials | null {
  const apiKey =
    config.RAPID_HIGHLIGHT_API_KEY?.trim() || config.RAPID_API_KEY?.trim();
  if (!apiKey) return null;
  const host =
    config.RAPID_HIGHLIGHT_API_HOST?.trim() || RAPIDAPI_HOST;
  return { apiKey, host };
}

export function isRapidHighlightApiConfigured(config: AppConfig): boolean {
  return resolveHighlightApiCredentials(config) != null;
}

function normalizeHost(host: string): string {
  return host.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export function logRapidHighlightRequest(
  kind: RapidHighlightKind,
  meta: {
    host: string;
    path: string;
    username?: string;
    highlightId?: string;
    body?: Record<string, string>;
  },
): void {
  const bodyEncoded = meta.body ? new URLSearchParams(meta.body).toString() : '';
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'rapid_highlight_request',
      kind,
      method: 'POST',
      host: meta.host,
      path: meta.path,
      url: `https://${meta.host}${meta.path}`,
      body: meta.body,
      bodyEncoded,
      username: meta.username,
      highlightId: meta.highlightId,
    }),
  );
}

export function logRapidHighlightRawResponse(
  kind: RapidHighlightKind,
  meta: { host: string; path: string; username?: string; highlightId?: string; status: number },
  raw: unknown,
): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'rapid_highlight_raw_response',
      kind,
      host: meta.host,
      path: meta.path,
      username: meta.username,
      highlightId: meta.highlightId,
      status: meta.status,
      raw,
    }),
  );
}

export async function postRapidHighlightApi(
  config: AppConfig,
  options: RapidHighlightPostOptions,
): Promise<RapidHighlightPostResult> {
  const credentials = resolveHighlightApiCredentials(config);
  if (!credentials) {
    throw new RapidApiError(
      'SERVICE_UNAVAILABLE',
      'Highlight stories API is not configured. Set RAPID_API_KEY or RAPID_HIGHLIGHT_API_KEY in backend/.env.',
      'upstream',
    );
  }

  const normalizedHost = normalizeHost(credentials.host);
  const apiKey = credentials.apiKey;
  const path = normalizePath(options.path);
  const body = new URLSearchParams(options.body);
  const timeoutMs = config.RAPID_API_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  logRapidHighlightRequest(options.kind, {
    host: normalizedHost,
    path,
    username: options.username,
    highlightId: options.highlightId,
    body: options.body,
  });

  let response: Response;
  try {
    response = await fetch(`https://${normalizedHost}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-rapidapi-host': normalizedHost,
        'x-rapidapi-key': apiKey,
      },
      body: body.toString(),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new RapidApiError(
        'SERVICE_UNAVAILABLE',
        'Highlight stories API request timed out.',
        'timeout',
      );
    }
    throw new RapidApiError(
      'SERVICE_UNAVAILABLE',
      'Could not reach the highlight stories API.',
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
      'Highlight stories API returned an invalid response.',
      'upstream',
      undefined,
      response.status,
    );
  }

  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'rapid_highlight_response',
      kind: options.kind,
      host: normalizedHost,
      path,
      username: options.username,
      highlightId: options.highlightId,
      status: response.status,
      body: payload,
      bodyTextLength: rawText.length,
    }),
  );

  logRapidHighlightRawResponse(
    options.kind,
    {
      host: normalizedHost,
      path,
      username: options.username,
      highlightId: options.highlightId,
      status: response.status,
    },
    payload,
  );

  if (response.status === 429) {
    throw new RapidApiError(
      'RATE_LIMITED',
      'Highlight stories API rate limit reached. Try again later.',
      'rate_limit',
      undefined,
      response.status,
    );
  }

  if (!response.ok) {
    const message =
      extractMessage(payload) ??
      `Highlight stories API request failed with status ${response.status}.`;
    throw new RapidApiError(
      response.status === 404 ? 'ACCOUNT_NOT_FOUND' : 'SERVICE_UNAVAILABLE',
      message,
      'upstream',
      undefined,
      response.status,
    );
  }

  return { payload, status: response.status, host: normalizedHost };
}

export function isRapidHighlightEndpointMissing(err: unknown): boolean {
  if (!(err instanceof RapidApiError)) return false;
  if (err.statusCode !== 404) return false;
  return /does not exist/i.test(err.message);
}

export function isRapidHighlightNotSubscribed(err: unknown): boolean {
  if (!(err instanceof RapidApiError)) return false;
  if (err.statusCode !== 403) return false;
  return /not subscribed/i.test(err.message);
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
