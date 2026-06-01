import { getDeviceId } from './device';
import { API_URL } from '@/config/api';
import type { ApiErrorBody, ApiErrorCode, ApiErrorReason } from './errorMessages';
import {
  getBlockedMessage,
  getCooldownRemainingMs,
  isInstagramBlockedError,
} from './instagramCooldown';

export type { ApiErrorCode, ApiErrorReason };

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
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
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
