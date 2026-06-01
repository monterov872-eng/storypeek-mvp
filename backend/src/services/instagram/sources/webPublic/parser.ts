import type { HighlightDetail, HighlightSummary, Profile, StoryItem } from '../../../../types.js';
import { throwProvider } from '../../errors.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyRecord = Record<string, any>;

function pickImageUrl(node: AnyRecord | undefined): string {
  if (!node) return '';
  const candidates =
    node.image_versions2?.candidates ??
    node.display_resources ??
    node.candidates ??
    [];
  if (Array.isArray(candidates) && candidates.length > 0) {
    return candidates[0]?.url ?? candidates[candidates.length - 1]?.url ?? '';
  }
  return node.display_url ?? node.thumbnail_src ?? node.url ?? '';
}

function pickVideoUrl(node: AnyRecord): string {
  const versions = node.video_versions ?? [];
  if (Array.isArray(versions) && versions.length > 0) {
    return versions[0]?.url ?? '';
  }
  return '';
}

import { normalizeUsername } from '../../../../utils/username.js';

export { normalizeUsername };

export function parseWebProfile(payload: AnyRecord, username: string): {
  userId: string;
  profile: Profile;
} {
  const user = payload?.data?.user;
  if (!user) {
    throwProvider('ACCOUNT_NOT_FOUND', 'Account not found');
  }

  const isPrivate = Boolean(user.is_private);

  const userId = String(user.id ?? user.pk ?? '');
  if (!userId) {
    throwProvider('SERVICE_UNAVAILABLE', 'Could not resolve profile id');
  }

  const storyCount = countStories(user);
  const highlightCount = Number(user.highlight_reel_count ?? user.edge_highlight_reels?.count ?? 0);
  const followersCount = readCount(
    user.edge_followed_by?.count ?? user.follower_count ?? user.followers,
  );
  const followingCount = readCount(user.edge_follow?.count ?? user.following_count ?? user.following);
  const postsCount = readCount(
    user.edge_owner_to_timeline_media?.count ?? user.media_count ?? user.post_count,
  );

  const profile: Profile = {
    username: user.username ?? username,
    fullName: user.full_name ?? '',
    biography: user.biography ?? '',
    profilePictureUrl:
      user.profile_pic_url_hd ??
      user.profile_pic_url ??
      user.hd_profile_pic_url_info?.url ??
      '',
    isPrivate,
    storyCount,
    highlightCount,
    followersCount,
    followingCount,
    postsCount,
  };

  return { userId, profile };
}

/**
 * Hint only — real story list loads after unlock.
 * Instagram often omits has_public_story; 0 means unknown, not "no stories".
 */
function readCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.trunc(value));
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, ''));
    if (Number.isFinite(parsed)) return Math.max(0, Math.trunc(parsed));
  }
  return 0;
}

function countStories(user: AnyRecord): number {
  if (typeof user.has_public_story === 'boolean') {
    return user.has_public_story ? 1 : 0;
  }
  return 0;
}

export function parseStoryItems(payload: AnyRecord, reelKey?: string): StoryItem[] {
  if (Array.isArray(payload?.reels_media)) {
    for (const reel of payload.reels_media) {
      const items = reel?.items;
      if (Array.isArray(items) && items.length > 0) {
        return items.map(mapStoryItem).filter((s: StoryItem) => s.mediaUrl);
      }
    }
  }

  if (Array.isArray(payload?.items) && payload.items.length > 0) {
    return payload.items.map(mapStoryItem).filter((s: StoryItem) => s.mediaUrl);
  }

  const reel = payload?.reel ?? payload?.user?.reel;
  if (Array.isArray(reel?.items) && reel.items.length > 0) {
    return reel.items.map(mapStoryItem).filter((s: StoryItem) => s.mediaUrl);
  }

  const reels = payload?.reels;

  if (Array.isArray(reels)) {
    for (const reel of reels) {
      const items = reel?.items;
      if (Array.isArray(items) && items.length > 0) {
        return items.map(mapStoryItem).filter((s: StoryItem) => s.mediaUrl);
      }
    }
  }

  if (reels && typeof reels === 'object' && !Array.isArray(reels)) {
    const keys = reelKey
      ? [reelKey, reelKey.replace(/^highlight:/, ''), `highlight:${reelKey.replace(/^highlight:/, '')}`]
      : Object.keys(reels);

    for (const key of keys) {
      const items = reels[key]?.items;
      if (Array.isArray(items) && items.length > 0) {
        return items.map(mapStoryItem).filter((s: StoryItem) => s.mediaUrl);
      }
    }

    const first = Object.values(reels)[0] as AnyRecord | undefined;
    if (Array.isArray(first?.items) && first.items.length > 0) {
      return first.items.map(mapStoryItem).filter((s: StoryItem) => s.mediaUrl);
    }
  }

  if (Array.isArray(payload?.items) && payload.items.length > 0) {
    return payload.items.map(mapStoryItem).filter((s: StoryItem) => s.mediaUrl);
  }

  return [];
}

function mapStoryItem(item: AnyRecord): StoryItem {
  const mediaType = item.media_type === 2 || item.video_versions?.length ? 'video' : 'image';
  const mediaUrl =
    mediaType === 'video'
      ? pickVideoUrl(item) || pickImageUrl(item)
      : pickImageUrl(item) || pickVideoUrl(item);

  return {
    id: String(item.id ?? item.pk ?? ''),
    mediaUrl,
    mediaType,
    takenAt: new Date((item.taken_at ?? item.taken_at_timestamp ?? 0) * 1000).toISOString(),
    durationMs: item.video_duration ? Math.round(item.video_duration * 1000) : undefined,
  };
}

export function parseHighlightTray(payload: AnyRecord): HighlightSummary[] {
  const tray: AnyRecord[] = payload?.tray ?? payload?.data?.tray ?? [];
  if (!Array.isArray(tray)) return [];

  return tray.map((h) => {
    const id = String(h.id ?? h.reel_id ?? '');
    const cover =
      pickImageUrl(h.cover_media) ||
      h.cover_media?.cropped_image_version?.url ||
      h.cover_media_cropped_thumbnail?.url ||
      '';

    return {
      id: id.startsWith('highlight:') ? id : `highlight:${id}`,
      title: h.title ?? 'Highlight',
      coverUrl: cover,
      itemCount: Number(h.media_count ?? h.item_count ?? 0),
    };
  });
}

export function parseHighlightDetail(
  payload: AnyRecord,
  highlightId: string,
  fallbackTitle?: string,
): HighlightDetail {
  const normalizedId = highlightId.startsWith('highlight:')
    ? highlightId
    : `highlight:${highlightId}`;

  const items = parseStoryItems(payload, normalizedId);
  if (items.length === 0) {
    throwProvider('ACCOUNT_NOT_FOUND', 'Highlight not found or empty');
  }

  return buildHighlightDetail(
    normalizedId,
    fallbackTitle ?? 'Highlight',
    items[0]?.mediaUrl ?? '',
    items,
  );
}

function buildHighlightDetail(
  id: string,
  title: string,
  coverUrl: string,
  items: StoryItem[],
): HighlightDetail {
  return {
    id,
    title,
    coverUrl: coverUrl || items[0]?.mediaUrl || '',
    itemCount: items.length,
    items,
  };
}
