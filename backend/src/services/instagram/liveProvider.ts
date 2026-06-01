import type { AppConfig } from '../../config.js';
import type { HighlightDetail, HighlightSummary, Profile, StoryItem } from '../../types.js';
import { logCacheEvent } from '../../utils/cacheLog.js';
import { assertMediaRequestAllowed } from '../mediaRequestCooldown.js';
import { TtlCache } from './cache.js';
import type { InstagramProvider, MediaRequestOptions } from './provider.js';
import { ProviderError } from './errors.js';
import type { InstagramDataSource, ResolvedProfile } from './sources/types.js';
import { normalizeUsername } from '../../utils/username.js';

export class LiveInstagramProvider implements InstagramProvider {
  private readonly profileCache: TtlCache<ResolvedProfile>;
  private readonly storiesCache: TtlCache<StoryItem[]>;
  private readonly highlightsCache: TtlCache<HighlightSummary[]>;
  private readonly highlightDetailCache: TtlCache<HighlightDetail>;

  constructor(
    private readonly source: InstagramDataSource,
    config: AppConfig,
  ) {
    this.profileCache = new TtlCache<ResolvedProfile>(config.INSTAGRAM_PROFILE_CACHE_TTL_MS);
    this.storiesCache = new TtlCache<StoryItem[]>(config.INSTAGRAM_MEDIA_CACHE_TTL_MS);
    this.highlightsCache = new TtlCache<HighlightSummary[]>(config.INSTAGRAM_MEDIA_CACHE_TTL_MS);
    this.highlightDetailCache = new TtlCache<HighlightDetail>(config.INSTAGRAM_MEDIA_CACHE_TTL_MS);
  }

  private profileKey(username: string): string {
    return `${this.source.name}:profile:${normalizeUsername(username)}`;
  }

  private mediaKey(username: string, suffix: string): string {
    return `${this.source.name}:${suffix}:${normalizeUsername(username)}`;
  }

  private async resolve(username: string): Promise<ResolvedProfile> {
    const key = this.profileKey(username);
    const cached = this.profileCache.get(key);
    if (cached) {
      logCacheEvent('profile_cache_hit', { username: normalizeUsername(username) });
      return cached;
    }

    const resolved = await this.source.resolveProfile(username);
    this.profileCache.set(key, resolved);
    return resolved;
  }

  async getProfile(username: string): Promise<Profile> {
    const { profile } = await this.resolve(username);
    return profile;
  }

  async getStories(username: string, options?: MediaRequestOptions): Promise<StoryItem[]> {
    const key = this.mediaKey(username, 'stories');
    const cached = this.storiesCache.get(key);
    if (cached) {
      logCacheEvent('story_cache_hit', { username: normalizeUsername(username) });
      return cached;
    }

    if (options?.deviceId) {
      assertMediaRequestAllowed(options.deviceId, username, 'stories');
    }

    const resolved = await this.resolve(username);
    if (resolved.profile.isPrivate) {
      throw new ProviderError(
        'ACCOUNT_PRIVATE',
        'This account is private',
        'upstream',
      );
    }
    const stories = await this.source.fetchStories(resolved);
    this.storiesCache.set(key, stories);
    return stories;
  }

  async getHighlights(username: string, options?: MediaRequestOptions): Promise<HighlightSummary[]> {
    const key = this.mediaKey(username, 'highlights');
    const cached = this.highlightsCache.get(key);
    if (cached) {
      logCacheEvent('highlight_cache_hit', { username: normalizeUsername(username) });
      return cached;
    }

    if (options?.deviceId) {
      assertMediaRequestAllowed(options.deviceId, username, 'highlights');
    }

    const resolved = await this.resolve(username);
    if (resolved.profile.isPrivate) {
      throw new ProviderError(
        'ACCOUNT_PRIVATE',
        'This account is private',
        'upstream',
      );
    }
    const highlights = await this.source.fetchHighlights(resolved);
    this.highlightsCache.set(key, highlights);
    return highlights;
  }

  async getHighlight(
    username: string,
    highlightId: string,
    options?: MediaRequestOptions,
  ): Promise<HighlightDetail> {
    const key = `${this.mediaKey(username, 'highlight')}:${highlightId}`;
    const cached = this.highlightDetailCache.get(key);
    if (cached) return cached;

    if (options?.deviceId) {
      assertMediaRequestAllowed(options.deviceId, username, 'highlights');
    }

    const resolved = await this.resolve(username);
    const detail = await this.source.fetchHighlight(resolved, highlightId);
    this.highlightDetailCache.set(key, detail);
    return detail;
  }
}
