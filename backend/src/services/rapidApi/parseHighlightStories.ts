import { extractFromItem, parseStoriesMedia, unwrapPayload } from './parseStories.js';
import type { RapidStoryItem } from './types.js';

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function pushObjects(arrays: JsonObject[][], value: unknown): void {
  if (!Array.isArray(value)) return;
  const objects = value.map(asObject).filter((v): v is JsonObject => v != null);
  if (objects.length > 0) arrays.push(objects);
}

/** Highlight-specific array collectors (items, stories, data, reels, tray, …). */
function collectHighlightMediaArrays(payload: unknown): JsonObject[][] {
  const arrays: JsonObject[][] = [];
  const root = asObject(unwrapPayload(payload));
  if (!root) return arrays;

  pushObjects(arrays, root.items);
  pushObjects(arrays, root.stories);
  pushObjects(arrays, root.medias);
  pushObjects(arrays, root.media);
  pushObjects(arrays, root.item_list);
  pushObjects(arrays, root.tray);

  const data = asObject(root.data);
  pushObjects(arrays, data?.items);
  pushObjects(arrays, data?.stories);
  pushObjects(arrays, data?.tray);
  pushObjects(arrays, data?.media);
  pushObjects(arrays, asObject(data?.data)?.items);
  pushObjects(arrays, asObject(data?.reel)?.items);

  const reel = asObject(root.reel);
  pushObjects(arrays, reel?.items);
  pushObjects(arrays, reel?.media);

  const reels = root.reels;
  if (Array.isArray(reels)) {
    for (const entry of reels) {
      const reelObj = asObject(entry);
      pushObjects(arrays, reelObj?.items);
      pushObjects(arrays, reelObj?.media);
    }
  } else if (reels && typeof reels === 'object') {
    for (const value of Object.values(reels as Record<string, unknown>)) {
      const reelObj = asObject(value);
      pushObjects(arrays, reelObj?.items);
    }
  }

  const reelsMedia = root.reels_media;
  if (Array.isArray(reelsMedia)) {
    for (const entry of reelsMedia) {
      const reelObj = asObject(entry);
      pushObjects(arrays, reelObj?.items);
    }
  }

  if (Array.isArray(root.edges)) {
    const nodes: JsonObject[] = [];
    for (const edge of root.edges) {
      const edgeObj = asObject(edge);
      const node = asObject(edgeObj?.node);
      if (node) nodes.push(node);
    }
    if (nodes.length > 0) arrays.push(nodes);
  }

  return arrays;
}

const CDN_MEDIA_RE =
  /https?:\/\/[^"'\s]*cdninstagram\.com[^"'\s]*/gi;

/** True when URL looks like story/highlight media (not tiny profile avatar). */
function isLikelyStoryMediaUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (!lower.includes('cdninstagram.com')) return false;
  if (lower.includes('s150x150') || lower.includes('s320x320')) return false;
  if (
    lower.includes('/v/t') ||
    lower.includes('/o1/v/') ||
    lower.includes('/e15/') ||
    lower.includes('.mp4') ||
    lower.includes('video') ||
    lower.includes('_n.jpg') ||
    lower.includes('_n.webp')
  ) {
    return true;
  }
  return url.length > 120;
}

function harvestCdnUrls(payload: unknown, username: string): RapidStoryItem[] {
  const text = JSON.stringify(payload ?? {});
  const matches = text.match(CDN_MEDIA_RE) ?? [];
  const seenUrls = new Set<string>();
  const stories: RapidStoryItem[] = [];

  for (const rawUrl of matches) {
    const url = rawUrl.replace(/\\u0026/g, '&').replace(/\\\//g, '/');
    if (!isLikelyStoryMediaUrl(url) || seenUrls.has(url)) continue;
    seenUrls.add(url);

    const isVideo =
      url.includes('.mp4') ||
      url.includes('video') ||
      url.includes('/o1/v/') ||
      /\.mp4\?/i.test(url);

    stories.push({
      id: `media_${seenUrls.size}`,
      username,
      mediaType: isVideo ? 'video' : 'image',
      mediaUrl: url,
      thumbnailUrl: isVideo ? undefined : url,
    });
  }

  return stories;
}

function deepWalkHighlightMedia(
  payload: unknown,
  username: string,
  seenIds: Set<string>,
  seenUrls: Set<string>,
  out: RapidStoryItem[],
  depth = 0,
): void {
  if (depth > 24 || payload == null) return;

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      deepWalkHighlightMedia(entry, username, seenIds, seenUrls, out, depth + 1);
    }
    return;
  }

  const obj = asObject(payload);
  if (!obj) return;

  const parsed = extractFromItem(obj, username);
  if (parsed?.mediaUrl && !seenUrls.has(parsed.mediaUrl)) {
    const key = parsed.id || parsed.mediaUrl;
    if (!seenIds.has(key)) {
      seenIds.add(key);
      seenUrls.add(parsed.mediaUrl);
      out.push(parsed);
    }
  }

  if (Array.isArray(obj.carousel_media)) {
    for (const slide of obj.carousel_media) {
      deepWalkHighlightMedia(slide, username, seenIds, seenUrls, out, depth + 1);
    }
  }

  if (Array.isArray(obj.edges)) {
    for (const edge of obj.edges) {
      const edgeObj = asObject(edge);
      if (edgeObj?.node) {
        deepWalkHighlightMedia(edgeObj.node, username, seenIds, seenUrls, out, depth + 1);
      }
    }
  }

  for (const key of [
    'items',
    'stories',
    'data',
    'reels',
    'tray',
    'reel',
    'reels_media',
    'media',
    'medias',
  ]) {
    if (obj[key] != null) {
      deepWalkHighlightMedia(obj[key], username, seenIds, seenUrls, out, depth + 1);
    }
  }

  for (const value of Object.values(obj)) {
    deepWalkHighlightMedia(value, username, seenIds, seenUrls, out, depth + 1);
  }
}

export interface ParseHighlightStoriesMeta {
  primaryCount: number;
  bucketCount: number;
  deepWalkCount: number;
  harvestedUrlCount: number;
  total: number;
  arrayBuckets: number;
}

export function countCdnMediaUrls(payload: unknown): number {
  const text = JSON.stringify(payload ?? {});
  const matches = text.match(CDN_MEDIA_RE) ?? [];
  return matches.filter(isLikelyStoryMediaUrl).length;
}

/** Parse highlight story media — recursive + CDN URL harvest fallback. */
export function parseHighlightStoriesMedia(
  payload: unknown,
  username: string,
): { stories: RapidStoryItem[]; meta: ParseHighlightStoriesMeta } {
  const unwrapped = unwrapPayload(payload);

  const shared = parseStoriesMedia(unwrapped, username);
  if (shared.stories.length > 0) {
    return {
      stories: shared.stories,
      meta: {
        primaryCount: shared.meta.primaryCount,
        bucketCount: 0,
        deepWalkCount: shared.meta.deepWalkCount,
        harvestedUrlCount: 0,
        total: shared.stories.length,
        arrayBuckets: shared.meta.arrayBuckets,
      },
    };
  }

  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const bucketStories: RapidStoryItem[] = [];

  for (const group of collectHighlightMediaArrays(unwrapped)) {
    for (const item of group) {
      const parsed = extractFromItem(item, username);
      if (!parsed?.mediaUrl || seenUrls.has(parsed.mediaUrl)) continue;
      const key = parsed.id || parsed.mediaUrl;
      if (seenIds.has(key)) continue;
      seenIds.add(key);
      seenUrls.add(parsed.mediaUrl);
      bucketStories.push(parsed);
    }
  }

  if (bucketStories.length > 0) {
    return {
      stories: bucketStories,
      meta: {
        primaryCount: 0,
        bucketCount: bucketStories.length,
        deepWalkCount: 0,
        harvestedUrlCount: 0,
        total: bucketStories.length,
        arrayBuckets: collectHighlightMediaArrays(unwrapped).length,
      },
    };
  }

  const deep: RapidStoryItem[] = [];
  deepWalkHighlightMedia(unwrapped, username, seenIds, seenUrls, deep);

  if (deep.length > 0) {
    return {
      stories: deep,
      meta: {
        primaryCount: 0,
        bucketCount: 0,
        deepWalkCount: deep.length,
        harvestedUrlCount: 0,
        total: deep.length,
        arrayBuckets: collectHighlightMediaArrays(unwrapped).length,
      },
    };
  }

  const harvested = harvestCdnUrls(unwrapped, username);

  return {
    stories: harvested,
    meta: {
      primaryCount: 0,
      bucketCount: 0,
      deepWalkCount: 0,
      harvestedUrlCount: harvested.length,
      total: harvested.length,
      arrayBuckets: collectHighlightMediaArrays(unwrapped).length,
    },
  };
}
