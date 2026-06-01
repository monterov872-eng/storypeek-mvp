import { extractFromItem, unwrapPayload } from './parseStories.js';
import type { RapidPostItem, RapidStoryItem } from './types.js';

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

export interface PostsUserHint {
  username?: string;
  fullName?: string;
  profilePictureUrl?: string;
}

export function parseRapidApiPosts(
  payload: unknown,
  username: string,
): { posts: RapidPostItem[]; user?: PostsUserHint } {
  const root = asObject(unwrapPayload(payload));
  if (!root) return { posts: [] };

  const rawPosts = root.posts;
  if (!Array.isArray(rawPosts)) return { posts: [] };

  const posts: RapidPostItem[] = [];
  let userHint: PostsUserHint | undefined;

  for (const entry of rawPosts) {
    const wrapper = asObject(entry);
    const node = asObject(wrapper?.node) ?? wrapper;
    if (!node) continue;

    if (!userHint) {
      const user = asObject(node.user);
      if (user) {
        const pic =
          user.profile_pic_url_hd ??
          user.profile_pic_url ??
          asObject(user.hd_profile_pic_url_info)?.url;
        userHint = {
          username: typeof user.username === 'string' ? user.username : undefined,
          fullName: typeof user.full_name === 'string' ? user.full_name : undefined,
          profilePictureUrl: typeof pic === 'string' && pic.startsWith('http') ? pic : undefined,
        };
      }
    }

    const parsed = extractFromItem(node, username);
    if (!parsed) continue;
    const carouselItems = extractCarouselItems(node, username);

    posts.push({
      id: parsed.id,
      username: parsed.username,
      mediaType: parsed.mediaType,
      mediaUrl: parsed.mediaUrl,
      thumbnailUrl: parsed.thumbnailUrl,
      takenAt: parsed.takenAt,
      carouselItems: carouselItems.length > 1 ? carouselItems : undefined,
    });
  }

  return { posts, user: userHint };
}

function extractCarouselItems(node: JsonObject, username: string): RapidStoryItem[] {
  const carouselMedia = node.carousel_media ?? node.carouselMedia ?? node.carousel;
  if (!carouselMedia) return [];

  const candidates: unknown[] = [];

  const pushCandidate = (v: unknown): void => {
    if (v == null) return;
    // Some responses include { items: [...] } wrappers; unwrap them if present.
    if (Array.isArray((v as any).items)) {
      candidates.push(...(v as any).items);
      return;
    }
    candidates.push(v);
  };

  if (Array.isArray(carouselMedia)) {
    for (const entry of carouselMedia) pushCandidate(entry);
  } else if (typeof carouselMedia === 'object') {
    const cm = carouselMedia as JsonObject;
    if (Array.isArray(cm['items'])) {
      candidates.push(...(cm['items'] as unknown[]));
    } else {
      candidates.push(cm);
    }
  }

  const out: RapidStoryItem[] = [];
  const seenIds = new Set<string>();

  for (const c of candidates) {
    if (c == null) continue;
    const obj = asObject(c) ?? (c as JsonObject);
    const parsed = extractFromItem(obj, username);
    if (!parsed) continue;
    if (parsed.id && !seenIds.has(parsed.id)) {
      seenIds.add(parsed.id);
      out.push(parsed);
    }
  }

  return out;
}
