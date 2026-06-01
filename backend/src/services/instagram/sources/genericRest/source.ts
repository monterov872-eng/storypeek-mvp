import type { AppConfig } from '../../../../config.js';
import type { HighlightDetail, HighlightSummary, StoryItem } from '../../../../types.js';
import { mapHttpStatus, ProviderError, throwProvider } from '../../errors.js';
import type { InstagramDataSource, ResolvedProfile } from '../types.js';
import { normalizeUsername } from '../../../../utils/username.js';

/**
 * Adapter for a third-party REST API (recommended for production maintainability).
 *
 * Expected contract (you control the vendor or a small proxy service):
 *
 * GET  {BASE}/users/{username}/profile     → { profile, userId }
 * GET  {BASE}/users/{username}/stories     → { stories: StoryItem[] }
 * GET  {BASE}/users/{username}/highlights  → { highlights: HighlightSummary[] }
 * GET  {BASE}/users/{username}/highlights/{id} → { highlight: HighlightDetail }
 *
 * Map any vendor response to this shape in a thin proxy if needed.
 */
export class GenericRestInstagramSource implements InstagramDataSource {
  readonly name = 'generic-rest';
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly authHeader: string;

  constructor(config: AppConfig) {
    if (!config.INSTAGRAM_REST_BASE_URL || !config.INSTAGRAM_REST_API_KEY) {
      throw new Error(
        'Generic REST provider requires INSTAGRAM_REST_BASE_URL and INSTAGRAM_REST_API_KEY',
      );
    }
    this.baseUrl = config.INSTAGRAM_REST_BASE_URL.replace(/\/$/, '');
    this.apiKey = config.INSTAGRAM_REST_API_KEY;
    this.authHeader = config.INSTAGRAM_REST_AUTH_HEADER;
  }

  private async request<T>(path: string, context: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          Accept: 'application/json',
          [this.authHeader]: this.apiKey,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const code = (body as { error?: { code?: string } })?.error?.code;
        if (code === 'ACCOUNT_PRIVATE') {
          throw new ProviderError('ACCOUNT_PRIVATE', 'This account is private', 'upstream');
        }
        if (code === 'ACCOUNT_NOT_FOUND') {
          throw new ProviderError('ACCOUNT_NOT_FOUND', 'Account not found', 'upstream');
        }
        if (code === 'NO_STORIES') {
          throw new ProviderError('NO_STORIES', 'No public stories available', 'upstream');
        }
        throw mapHttpStatus(res.status, context);
      }

      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError('SERVICE_UNAVAILABLE', `${context}: request failed`, 'network');
    } finally {
      clearTimeout(timeout);
    }
  }

  async resolveProfile(username: string): Promise<ResolvedProfile> {
    const u = normalizeUsername(username);
    const data = await this.request<{ profile: ResolvedProfile['profile']; userId: string }>(
      `/users/${encodeURIComponent(u)}/profile`,
      'rest_profile',
    );

    return { userId: data.userId, profile: data.profile };
  }

  async fetchStories(resolved: ResolvedProfile): Promise<StoryItem[]> {
    const data = await this.request<{ stories: StoryItem[] }>(
      `/users/${encodeURIComponent(resolved.profile.username)}/stories`,
      'rest_stories',
    );
    if (!data.stories?.length) {
      throwProvider('NO_STORIES', 'No public stories available');
    }
    return data.stories;
  }

  async fetchHighlights(resolved: ResolvedProfile): Promise<HighlightSummary[]> {
    const data = await this.request<{ highlights: HighlightSummary[] }>(
      `/users/${encodeURIComponent(resolved.profile.username)}/highlights`,
      'rest_highlights',
    );
    return data.highlights ?? [];
  }

  async fetchHighlight(
    resolved: ResolvedProfile,
    highlightId: string,
  ): Promise<HighlightDetail> {
    const data = await this.request<{ highlight: HighlightDetail }>(
      `/users/${encodeURIComponent(resolved.profile.username)}/highlights/${encodeURIComponent(highlightId)}`,
      'rest_highlight',
    );
    if (!data.highlight) {
      throwProvider('ACCOUNT_NOT_FOUND', 'Highlight not found');
    }
    return data.highlight;
  }
}
