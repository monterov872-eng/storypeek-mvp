import { getDeviceId } from './device';
import { API_URL } from '@/config/api';
import type { ApiErrorBody, ApiErrorCode, ApiErrorReason } from './errorMessages';
import {
  getBlockedMessage,
  getCooldownRemainingMs,
  isInstagramBlockedError,
} from './instagramCooldown';

/** Client-side fetch timeout (ms). Backend may take up to ~12s for Instagram. */
export const REQUEST_TIMEOUT_MS = 20_000;

export type { ApiErrorCode, ApiErrorReason };

function isNetworkFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  if (error.name === 'AbortError') return false;
  const msg = error.message.toLowerCase();
  return (
    error.name === 'TypeError' ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('network error')
  );
}

function toRequestError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError({
      code: 'SERVICE_UNAVAILABLE',
      message: 'The server took too long to respond.',
      reason: 'timeout',
    });
  }
  if (isNetworkFailure(error)) {
    return new ApiError({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Could not reach the server. Make sure the API is running.',
      reason: 'network',
    });
  }
  return new ApiError({
    code: 'SERVICE_UNAVAILABLE',
    message: error instanceof Error ? error.message : 'Request failed',
  });
}

export interface Profile {
  username: string;
  fullName: string;
  biography: string;
  profilePictureUrl: string;
  isPrivate: boolean;
  storyCount: number;
  highlightCount: number;
}

export interface StoryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  takenAt: string;
}

export interface HighlightSummary {
  id: string;
  title: string;
  coverUrl: string;
  itemCount: number;
}

export interface UnlockStatus {
  storiesUnlocked: boolean;
  highlightsUnlocked: boolean;
  storiesExpiresAt: string | null;
  highlightsExpiresAt: string | null;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly reason?: ApiErrorReason;
  readonly retryAfter?: number;

  constructor(body: ApiErrorBody & { retryAfter?: number }) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code;
    this.reason = body.reason;
    this.retryAfter = body.retryAfter;
  }
}

async function assertNotInLocalCooldown(): Promise<void> {
  const remaining = await getCooldownRemainingMs();
  if (remaining > 0) {
    throw new ApiError({
      code: 'RATE_LIMITED',
      message: getBlockedMessage(),
      reason: 'instagram_block',
      retryAfter: Math.ceil(remaining / 1000),
    });
  }
}

class ApiClient {
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    await assertNotInLocalCooldown();

    const deviceId = await getDeviceId();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_URL}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
          ...(init?.headers ?? {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const body = data?.error as (ApiErrorBody & { retryAfter?: number }) | undefined;
        throw new ApiError({
          code: body?.code ?? 'SERVICE_UNAVAILABLE',
          message: body?.message ?? 'Request failed',
          reason: body?.reason,
          retryAfter: body?.retryAfter,
        });
      }
      return data as T;
    } catch (error) {
      throw toRequestError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  getProfile(username: string) {
    return this.request<{ profile: Profile; unlock: UnlockStatus }>(
      `/v1/profile/${encodeURIComponent(username)}`,
    );
  }

  async getStories(username: string) {
    return this.request<{ stories: StoryItem[] }>(
      `/v1/profile/${encodeURIComponent(username)}/stories`,
    );
  }

  async getHighlights(username: string) {
    return this.request<{ highlights: HighlightSummary[] }>(
      `/v1/profile/${encodeURIComponent(username)}/highlights`,
    );
  }

  async getHighlight(username: string, highlightId: string) {
    return this.request<{ highlight: HighlightSummary & { items: StoryItem[] } }>(
      `/v1/profile/${encodeURIComponent(username)}/highlights/${encodeURIComponent(highlightId)}`,
    );
  }

  unlock(username: string, type: 'stories' | 'highlights') {
    return this.request<{ ok: boolean; expiresAt: string }>('/v1/unlock', {
      method: 'POST',
      body: JSON.stringify({ username, type }),
    });
  }
}

export const api = new ApiClient();
