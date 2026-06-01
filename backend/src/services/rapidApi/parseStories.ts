import type { RapidStoryItem } from './types.js';

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

/** Unwrap common RapidAPI envelopes. */
export function unwrapPayload(payload: unknown, depth = 0): unknown {
  if (depth > 6 || payload == null) return payload;
  const root = asObject(payload);
  if (!root) return payload;

  for (const key of ['result', 'response', 'data', 'body']) {
    const inner = root[key];
    if (inner != null && typeof inner === 'object') {
      return unwrapPayload(inner, depth + 1);
    }
  }

  return payload;
}

function pickUrl(candidates: unknown): string | undefined {
  if (typeof candidates === 'string' && candidates.startsWith('http')) return candidates;
  if (!Array.isArray(candidates)) return undefined;
  for (const entry of candidates) {
    const obj = asObject(entry);
    const url = obj?.url ?? obj?.src;
    if (typeof url === 'string' && url.startsWith('http')) return url;
  }
  return undefined;
}

function pickBestImage(node: JsonObject): string | undefined {
  return (
    pickUrl(asObject(node.image_versions2)?.candidates) ??
    pickUrl(node.image_versions) ??
    (typeof node.display_url === 'string' && node.display_url.startsWith('http')
      ? node.display_url
      : undefined) ??
    (typeof node.image_url === 'string' && node.image_url.startsWith('http')
      ? node.image_url
      : undefined) ??
    (typeof node.thumbnail_url === 'string' && node.thumbnail_url.startsWith('http')
      ? node.thumbnail_url
      : undefined) ??
    (typeof node.thumbnail_src === 'string' && node.thumbnail_src.startsWith('http')
      ? node.thumbnail_src
      : undefined) ??
    (typeof node.src === 'string' && node.src.startsWith('http') ? node.src : undefined)
  );
}

function pickBestVideo(node: JsonObject): string | undefined {
  return (
    pickUrl(node.video_versions) ??
    pickUrl(node.video_url) ??
    (typeof node.video_url === 'string' && node.video_url.startsWith('http')
      ? node.video_url
      : undefined) ??
    (typeof node.playback_url === 'string' && node.playback_url.startsWith('http')
      ? node.playback_url
      : undefined) ??
    pickUrl(asObject(node.video)?.video_versions)
  );
}

function pickAudioUrl(node: JsonObject): string | undefined {
  const direct = node.audio_url ?? node.audioUrl ?? node.progressive_download_url;
  if (typeof direct === 'string' && direct.startsWith('http')) return direct;

  const dash = node.video_dash_manifest;
  if (typeof dash === 'string' && dash.includes('contentType=\"audio\"')) {
    // Best-effort parse of DASH XML for the first audio BaseURL.
    const audioSection = dash.split('contentType=\"audio\"')[1] ?? '';
    const match = audioSection.match(/<BaseURL>(https?:\/\/[^<]+)<\/BaseURL>/i);
    const baseUrl = match?.[1];
    if (baseUrl && baseUrl.startsWith('http')) return baseUrl;
  }

  const musicAsset = asObject(node.music_asset_info);
  const assetUrl =
    musicAsset?.progressive_download_url ??
    musicAsset?.audio_url ??
    asObject(musicAsset?.audio)?.url;
  if (typeof assetUrl === 'string' && assetUrl.startsWith('http')) return assetUrl;

  const clips = asObject(node.clips_music_attribution_info);
  const clipsUrl =
    clips?.audio_url ??
    clips?.progressive_download_url ??
    asObject(clips?.music_asset_info)?.progressive_download_url;
  if (typeof clipsUrl === 'string' && clipsUrl.startsWith('http')) return clipsUrl;

  const sound = asObject(node.sound);
  const soundUrl =
    sound?.audio_url ??
    sound?.progressive_download_url ??
    asObject(sound?.audio)?.url ??
    sound?.url;
  if (typeof soundUrl === 'string' && soundUrl.startsWith('http')) return soundUrl;

  const audio = asObject(node.audio);
  const audioObjUrl = audio?.audio_url ?? audio?.url;
  if (typeof audioObjUrl === 'string' && audioObjUrl.startsWith('http')) return audioObjUrl;

  const music = asObject(node.music);
  const musicUrl = music?.audio_url ?? music?.url;
  if (typeof musicUrl === 'string' && musicUrl.startsWith('http')) return musicUrl;

  return undefined;
}

function logAudioFields(node: JsonObject, storyId: string): void {
  const audio = asObject(node.audio);
  const music = asObject(node.music);
  const musicAsset = asObject(node.music_asset_info);
  const clips = asObject(node.clips_music_attribution_info);
  const sound = asObject(node.sound);
  const musicStickers = node.story_music_stickers;

  const summarize = (value: unknown) => {
    if (value == null) return undefined;
    if (typeof value === 'string') return value.slice(0, 180);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return { type: 'array', length: value.length };
    if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).slice(0, 30);
    return String(value);
  };

  const fields = {
    audio: summarize(audio),
    music: summarize(music),
    music_asset_info: summarize(musicAsset),
    clips_music_attribution_info: summarize(clips),
    sound: summarize(sound),
    story_music_stickers: summarize(musicStickers),
    audio_url: summarize(node.audio_url ?? node.audioUrl),
  };

  if (
    fields.audio ||
    fields.music ||
    fields.music_asset_info ||
    fields.clips_music_attribution_info ||
    fields.sound ||
    fields.story_music_stickers ||
    fields.audio_url
  ) {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: 'story_audio_fields',
        storyId,
        fields,
      }),
    );
  }
}

function isVideoMedia(node: JsonObject, hasVideoUrl: boolean): boolean {
  if (hasVideoUrl) return true;
  const type = node.media_type ?? node.mediaType;
  if (type === 2 || type === '2' || type === 'video' || type === 'VIDEO') return true;
  const media = asObject(node.media);
  if (media?.media_type === 2 || media?.media_type === 'VIDEO') return true;
  return Boolean(node.video_versions || node.video_duration);
}

export function extractFromItem(item: JsonObject, username: string): RapidStoryItem | null {
  const media = asObject(item.media) ?? item;
  const node = asObject(item.node) ?? media;

  const id = String(
    node.id ?? node.pk ?? node.story_id ?? media.id ?? media.pk ?? item.id ?? '',
  ).trim();
  if (!id || id.startsWith('highlight:')) return null;

  const videoUrl = pickBestVideo(node) ?? pickBestVideo(media);
  const imageUrl = pickBestImage(node) ?? pickBestImage(media);
  const mediaUrl = videoUrl ?? imageUrl;
  if (!mediaUrl) return null;

  const mediaType: 'image' | 'video' = isVideoMedia(node, Boolean(videoUrl)) ? 'video' : 'image';
  const thumb = pickBestImage(node) ?? pickBestImage(media);

  const takenAtRaw =
    node.taken_at ??
    node.taken_at_timestamp ??
    media.taken_at ??
    media.taken_at_timestamp ??
    item.timestamp;
  let takenAt: string | undefined;
  if (typeof takenAtRaw === 'number') {
    takenAt = new Date(
      takenAtRaw > 1_000_000_000_000 ? takenAtRaw : takenAtRaw * 1000,
    ).toISOString();
  } else if (typeof takenAtRaw === 'string') {
    takenAt = takenAtRaw;
  }

  const audioUrl = pickAudioUrl(node) ?? pickAudioUrl(media);
  logAudioFields(node, id);
  const durationMs = pickDurationMs(node, media);

  return {
    id,
    username,
    mediaType,
    mediaUrl,
    thumbnailUrl: thumb,
    takenAt,
    audioUrl,
    durationMs,
  };
}

function pickDurationMs(node: JsonObject, media: JsonObject): number | undefined {
  const raw =
    node.video_duration ??
    media.video_duration ??
    node.duration ??
    media.duration ??
    (asObject(asObject(node.clips_metadata)?.original_sound_info) as JsonObject | null)
      ?.duration_in_ms;

  if (typeof raw !== 'number' || raw <= 0 || !Number.isFinite(raw)) {
    return undefined;
  }
  // Instagram story video_duration is usually seconds; clamp to sane range.
  if (raw < 1000) {
    return Math.round(raw * 1000);
  }
  return Math.round(raw);
}

function hasStoryMediaFields(node: JsonObject): boolean {
  if (
    node.video_versions ||
    node.image_versions2 ||
    node.image_versions ||
    node.display_url ||
    node.video_url ||
    node.playback_url
  ) {
    return true;
  }
  const media = asObject(node.media);
  return Boolean(
    media &&
      (media.video_versions ||
        media.image_versions2 ||
        media.display_url ||
        media.video_url),
  );
}

function pushItemArray(arrays: JsonObject[][], candidate: unknown): void {
  if (!Array.isArray(candidate)) return;
  const objects = candidate.map(asObject).filter((v): v is JsonObject => v != null);
  if (objects.length > 0) arrays.push(objects);
}

function collectReelItemArrays(root: JsonObject): JsonObject[][] {
  const arrays: JsonObject[][] = [];

  const reelsMedia = root.reels_media;
  if (Array.isArray(reelsMedia)) {
    for (const reel of reelsMedia) {
      const reelObj = asObject(reel);
      if (reelObj) pushItemArray(arrays, reelObj.items);
    }
  } else {
    const reelsMediaObj = asObject(reelsMedia);
    pushItemArray(arrays, reelsMediaObj?.items);
  }

  const reels = root.reels;
  if (Array.isArray(reels)) {
    for (const reel of reels) {
      const reelObj = asObject(reel);
      if (reelObj) pushItemArray(arrays, reelObj.items);
    }
  } else if (reels && typeof reels === 'object') {
    for (const value of Object.values(reels as Record<string, unknown>)) {
      const reelObj = asObject(value);
      if (reelObj) pushItemArray(arrays, reelObj.items);
    }
  }

  return arrays;
}

function collectItemArrays(payload: unknown): JsonObject[][] {
  const arrays: JsonObject[][] = [];
  const unwrapped = unwrapPayload(payload);
  const root = asObject(unwrapped);
  if (!root) return arrays;

  pushItemArray(arrays, root.items);
  pushItemArray(arrays, root.stories);
  pushItemArray(arrays, root.medias);
  pushItemArray(arrays, root.item_list);
  pushItemArray(arrays, asObject(root.reel)?.items);
  pushItemArray(arrays, asObject(asObject(root.user)?.reel)?.items);

  const data = asObject(root.data);
  pushItemArray(arrays, data?.items);
  pushItemArray(arrays, data?.stories);
  pushItemArray(arrays, asObject(data?.reel)?.items);
  pushItemArray(arrays, asObject(asObject(data?.data)?.reel)?.items);
  pushItemArray(arrays, asObject(asObject(data?.data)?.data)?.items);

  arrays.push(...collectReelItemArrays(root));
  if (data) arrays.push(...collectReelItemArrays(data));

  if (Array.isArray(root.edges)) {
    const edgeItems: JsonObject[] = [];
    for (const edge of root.edges) {
      const edgeObj = asObject(edge);
      const node = asObject(edgeObj?.node);
      if (node) edgeItems.push(node);
    }
    if (edgeItems.length > 0) arrays.push(edgeItems);
  }

  return arrays;
}

function deepWalkStoryMedia(
  payload: unknown,
  username: string,
  seenIds: Set<string>,
  out: RapidStoryItem[],
  depth = 0,
): void {
  if (depth > 20 || payload == null) return;

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      deepWalkStoryMedia(entry, username, seenIds, out, depth + 1);
    }
    return;
  }

  const obj = asObject(payload);
  if (!obj) return;

  if (hasStoryMediaFields(obj)) {
    const parsed = extractFromItem(obj, username);
    if (parsed && !seenIds.has(parsed.id)) {
      seenIds.add(parsed.id);
      out.push(parsed);
    }
  }

  if (Array.isArray(obj.carousel_media)) {
    for (const slide of obj.carousel_media) {
      const slideObj = asObject(slide);
      if (!slideObj) continue;
      const parsed = extractFromItem(slideObj, username);
      if (parsed && !seenIds.has(parsed.id)) {
        seenIds.add(parsed.id);
        out.push(parsed);
      }
    }
  }

  if (Array.isArray(obj.edges)) {
    for (const edge of obj.edges) {
      const edgeObj = asObject(edge);
      if (edgeObj?.node) {
        deepWalkStoryMedia(edgeObj.node, username, seenIds, out, depth + 1);
      }
    }
  }

  for (const value of Object.values(obj)) {
    deepWalkStoryMedia(value, username, seenIds, out, depth + 1);
  }
}

export interface ParseStoriesMeta {
  primaryCount: number;
  deepWalkCount: number;
  total: number;
  arrayBuckets: number;
}

function parsePrimary(payload: unknown, username: string): RapidStoryItem[] {
  const seen = new Set<string>();
  const stories: RapidStoryItem[] = [];

  for (const group of collectItemArrays(payload)) {
    for (const item of group) {
      const parsed = extractFromItem(item, username);
      if (!parsed || seen.has(parsed.id)) continue;
      seen.add(parsed.id);
      stories.push(parsed);
    }
  }

  if (stories.length > 0) return stories;

  const root = asObject(unwrapPayload(payload));
  const fallback = root ? extractFromItem(root, username) : null;
  if (fallback) stories.push(fallback);

  return stories;
}

/** Parse active or highlight story media from any RapidAPI JSON shape. */
export function parseStoriesMedia(
  payload: unknown,
  username: string,
): { stories: RapidStoryItem[]; meta: ParseStoriesMeta } {
  const primary = parsePrimary(payload, username);
  const arrayBuckets = collectItemArrays(payload).length;

  if (primary.length > 0) {
    return {
      stories: primary,
      meta: {
        primaryCount: primary.length,
        deepWalkCount: 0,
        total: primary.length,
        arrayBuckets,
      },
    };
  }

  const seenIds = new Set<string>();
  const deep: RapidStoryItem[] = [];
  deepWalkStoryMedia(unwrapPayload(payload), username, seenIds, deep);

  return {
    stories: deep,
    meta: {
      primaryCount: 0,
      deepWalkCount: deep.length,
      total: deep.length,
      arrayBuckets,
    },
  };
}

/** @deprecated Use parseStoriesMedia */
export function parseRapidApiStories(payload: unknown, username: string): RapidStoryItem[] {
  return parseStoriesMedia(payload, username).stories;
}
