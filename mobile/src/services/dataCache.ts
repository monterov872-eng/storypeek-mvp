import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HighlightSummary, Profile, StoryItem, UnlockStatus } from './api';

const PREFIX = 'storypeek_cache:';

export const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;
export const MEDIA_CACHE_TTL_MS = 2 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

function cacheKey(suffix: string): string {
  return `${PREFIX}${suffix}`;
}

async function readEntry<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (entry.expiresAt <= Date.now()) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }
}

async function writeEntry<T>(key: string, data: T, ttlMs: number): Promise<void> {
  const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
  await AsyncStorage.setItem(key, JSON.stringify(entry));
}

function normalize(username: string): string {
  return username.trim().toLowerCase();
}

export type ProfileCachePayload = { profile: Profile; unlock: UnlockStatus };

export const dataCache = {
  async getProfile(username: string): Promise<ProfileCachePayload | null> {
    return readEntry<ProfileCachePayload>(cacheKey(`profile:${normalize(username)}`));
  },

  async setProfile(username: string, payload: ProfileCachePayload): Promise<void> {
    await writeEntry(cacheKey(`profile:${normalize(username)}`), payload, PROFILE_CACHE_TTL_MS);
  },

  async getStories(username: string): Promise<StoryItem[] | null> {
    return readEntry<StoryItem[]>(cacheKey(`stories:${normalize(username)}`));
  },

  async setStories(username: string, stories: StoryItem[]): Promise<void> {
    await writeEntry(cacheKey(`stories:${normalize(username)}`), stories, MEDIA_CACHE_TTL_MS);
  },

  async getHighlights(username: string): Promise<HighlightSummary[] | null> {
    return readEntry<HighlightSummary[]>(cacheKey(`highlights:${normalize(username)}`));
  },

  async setHighlights(username: string, highlights: HighlightSummary[]): Promise<void> {
    await writeEntry(
      cacheKey(`highlights:${normalize(username)}`),
      highlights,
      MEDIA_CACHE_TTL_MS,
    );
  },
};
