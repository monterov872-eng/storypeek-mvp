import type { AppConfig } from '../../../../config.js';
import { isRetryableError, mapHttpStatus, ProviderError } from '../../errors.js';
import { logRequestEvent } from '../../../../utils/requestLog.js';
import { sleep } from '../../../../utils/sleep.js';
import { IgSession } from './session.js';

export interface IgHttpOptions {
  path: string;
  searchParams?: Record<string, string>;
  context: string;
  refererPath?: string;
}

export class IgHttpClient {
  private readonly baseUrl = 'https://www.instagram.com';
  private readonly session: IgSession;
  private readonly userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

  constructor(private readonly config: AppConfig) {
    this.session = new IgSession(config);
  }

  get hasSession(): boolean {
    return this.session.hasSession;
  }

  private async headers(refererPath?: string): Promise<Record<string, string>> {
    await this.session.ensureBootstrap(this.userAgent);
    const headers: Record<string, string> = {
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': this.userAgent,
      'X-IG-App-ID': this.config.INSTAGRAM_APP_ID,
      'X-ASBD-ID': '129477',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: this.baseUrl,
      Referer: `${this.baseUrl}${refererPath ?? '/'}`,
      Cookie: this.session.cookieHeader(),
    };
    const csrf = this.session.csrf();
    if (csrf) headers['X-CSRFToken'] = csrf;
    return headers;
  }

  async getJsonRaw<T>(options: IgHttpOptions): Promise<{
    payload: T;
    rawText: string;
    status: number;
  }> {
    const maxAttempts = 1 + this.config.INSTAGRAM_REQUEST_RETRY_COUNT;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        const delayMs = this.config.INSTAGRAM_REQUEST_RETRY_DELAY_MS * attempt;
        logRequestEvent('instagram_retry', { context: options.context, attempt, delayMs });
        await sleep(delayMs);
      }
      try {
        return await this.getJsonRawOnce<T>(options);
      } catch (err) {
        lastError = err;
        if (attempt >= maxAttempts - 1 || !isRetryableError(err)) break;
      }
    }
    throw lastError;
  }

  async getJson<T>(options: IgHttpOptions): Promise<T> {
    const maxAttempts = 1 + this.config.INSTAGRAM_REQUEST_RETRY_COUNT;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        const delayMs = this.config.INSTAGRAM_REQUEST_RETRY_DELAY_MS * attempt;
        logRequestEvent('instagram_retry', {
          context: options.context,
          attempt,
          delayMs,
        });
        await sleep(delayMs);
      }

      try {
        logRequestEvent('instagram_request', {
          context: options.context,
          attempt: attempt + 1,
        });
        const { payload } = await this.getJsonRawOnce<T>(options);
        return payload;
      } catch (err) {
        lastError = err;
        if (attempt >= maxAttempts - 1 || !isRetryableError(err)) {
          break;
        }
      }
    }

    throw lastError;
  }

  private async getJsonRawOnce<T>(options: IgHttpOptions): Promise<{
    payload: T;
    rawText: string;
    status: number;
  }> {
    const url = new URL(options.path, this.baseUrl);
    if (options.searchParams) {
      for (const [k, v] of Object.entries(options.searchParams)) {
        url.searchParams.set(k, v);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.INSTAGRAM_REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: await this.headers(options.refererPath),
        signal: controller.signal,
      });

      this.session.ingestSetCookie(res);
      const text = await res.text();

      if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
        throw blockedError(options.context, this.session.hasSession);
      }

      let json: T;
      try {
        json = JSON.parse(text) as T;
      } catch {
        throw new ProviderError(
          'SERVICE_UNAVAILABLE',
          'Instagram returned an unexpected response. Try again later.',
          'instagram_block',
        );
      }

      if (!res.ok) {
        throw mapHttpStatus(res.status, options.context);
      }

      return { payload: json, rawText: text, status: res.status };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError(
          'SERVICE_UNAVAILABLE',
          'Request timed out. Check your connection and try again.',
          'timeout',
        );
      }
      throw new ProviderError(
        'SERVICE_UNAVAILABLE',
        'Network error while contacting Instagram.',
        'network',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async getText(path: string, refererPath?: string): Promise<string> {
    const maxAttempts = 1 + this.config.INSTAGRAM_REQUEST_RETRY_COUNT;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        await sleep(this.config.INSTAGRAM_REQUEST_RETRY_DELAY_MS * attempt);
      }
      try {
        return await this.getTextOnce(path, refererPath);
      } catch (err) {
        lastError = err;
        if (attempt >= maxAttempts - 1 || !isRetryableError(err)) break;
      }
    }

    throw lastError;
  }

  private async getTextOnce(path: string, refererPath?: string): Promise<string> {
    const url = new URL(path, this.baseUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.INSTAGRAM_REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        headers: {
          ...(await this.headers(refererPath)),
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });
      this.session.ingestSetCookie(res);
      if (!res.ok) throw mapHttpStatus(res.status, 'html_fetch');
      return await res.text();
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProviderError('SERVICE_UNAVAILABLE', 'Request timed out.', 'timeout');
      }
      throw new ProviderError('SERVICE_UNAVAILABLE', 'Network error.', 'network');
    } finally {
      clearTimeout(timeout);
    }
  }
}

function blockedError(context: string, hasSession: boolean): ProviderError {
  logRequestEvent('instagram_failure', {
    context,
    reason: 'instagram_block',
    hasSession,
  });

  return new ProviderError(
    'RATE_LIMITED',
    'Instagram blocked requests temporarily. Try later.',
    'instagram_block',
  );
}
