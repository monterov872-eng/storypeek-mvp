import type { RapidHighlightItem } from './types.js';

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function pickUrl(candidates: unknown): string | undefined {
  if (typeof candidates === 'string' && candidates.startsWith('http')) return candidates;
  if (!Array.isArray(candidates)) return undefined;
  for (const entry of candidates) {
    const obj = asObject(entry);
    const url = obj?.url;
    if (typeof url === 'string' && url.startsWith('http')) return url;
  }
  return undefined;
}

function pickCoverUrl(node: JsonObject): string {
  const cover = asObject(node.cover_media);
  const cropped = asObject(cover?.cropped_image_version);
  const full = asObject(cover?.full_image_version);
  const croppedThumb = asObject(node.cover_media_cropped_thumbnail);

  const candidates = [
    cropped?.url,
    full?.url,
    cover?.thumbnail_src,
    cover?.url,
    croppedThumb?.url,
    node.cover_url,
    node.thumbnail_url,
    node.display_url,
    node.thumbnail_src,
    pickUrl(cover?.candidates),
  ];

  for (const url of candidates) {
    if (typeof url === 'string' && url.startsWith('http')) return url;
  }

  return '';
}

function normalizeHighlightId(raw: unknown): string | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  if (text.startsWith('highlight:')) return text;
  if (/^\d+$/.test(text)) return `highlight:${text}`;
  return null;
}

function looksLikeHighlight(node: JsonObject): boolean {
  const id = normalizeHighlightId(node.id ?? node.pk ?? node.reel_id ?? node.highlight_id);
  if (!id) return false;

  const typename = String(node.__typename ?? node.type ?? '').toLowerCase();
  if (typename.includes('highlight') || typename.includes('reeldict')) return true;

  if (typeof node.title === 'string' && node.title.trim()) return true;
  if (node.cover_media != null || node.cover_media_cropped_thumbnail != null) return true;
  if (node.reel_type === 'highlight_reel') return true;

  return id.startsWith('highlight:');
}

function parseHighlightNode(node: JsonObject, username: string): RapidHighlightItem | null {
  const id = normalizeHighlightId(node.id ?? node.pk ?? node.reel_id ?? node.highlight_id);
  if (!id) return null;

  const title = String(node.title ?? node.name ?? 'Highlight').trim() || 'Highlight';
  const coverUrl = pickCoverUrl(node);
  const user = asObject(node.user) ?? asObject(node.owner);
  const ownerUsername =
    typeof user?.username === 'string' && user.username.trim()
      ? user.username.trim()
      : username;

  return { id, title, coverUrl, username: ownerUsername };
}

function tryParseEntry(entry: unknown, username: string): RapidHighlightItem | null {
  const wrapper = asObject(entry);
  if (!wrapper) return null;

  const node = asObject(wrapper.node) ?? wrapper;
  if (!node || !looksLikeHighlight(node)) return null;
  return parseHighlightNode(node, username);
}

/** Collect known highlight list containers before deep walk. */
function collectHighlightArrays(payload: unknown): unknown[][] {
  const arrays: unknown[][] = [];
  const seen = new Set<unknown>();

  const push = (value: unknown) => {
    if (!Array.isArray(value) || value.length === 0 || seen.has(value)) return;
    seen.add(value);
    arrays.push(value);
  };

  if (Array.isArray(payload)) {
    push(payload);
    return arrays;
  }

  const root = asObject(payload);
  if (!root) return arrays;

  push(root.items);
  push(root.highlights);
  push(root.tray);
  push(root.reels);
  push(root.data);

  const data = asObject(root.data);
  push(data?.items);
  push(data?.highlights);
  push(data?.tray);
  push(asObject(data?.data)?.items);
  push(asObject(data?.data)?.highlights);

  const user = asObject(root.user) ?? asObject(data?.user);
  const edge = asObject(user?.edge_highlight_reels);
  push(edge?.edges);
  push(user?.highlight_reels);

  return arrays;
}

function deepWalkHighlights(
  payload: unknown,
  username: string,
  seenIds: Set<string>,
  out: RapidHighlightItem[],
  depth = 0,
): void {
  if (depth > 14 || payload == null) return;

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const parsed = tryParseEntry(entry, username);
      if (parsed && !seenIds.has(parsed.id)) {
        seenIds.add(parsed.id);
        out.push(parsed);
        continue;
      }
      deepWalkHighlights(entry, username, seenIds, out, depth + 1);
    }
    return;
  }

  const obj = asObject(payload);
  if (!obj) return;

  if (looksLikeHighlight(obj)) {
    const parsed = parseHighlightNode(obj, username);
    if (parsed && !seenIds.has(parsed.id)) {
      seenIds.add(parsed.id);
      out.push(parsed);
    }
  }

  if (Array.isArray(obj.edges)) {
    for (const edge of obj.edges) {
      const edgeObj = asObject(edge);
      if (edgeObj?.node) deepWalkHighlights(edgeObj.node, username, seenIds, out, depth + 1);
    }
  }

  for (const value of Object.values(obj)) {
    if (value === obj.edges) continue;
    deepWalkHighlights(value, username, seenIds, out, depth + 1);
  }
}

export interface ParseHighlightsMeta {
  arrayBuckets: number;
  parsedCount: number;
  topLevelKeys: string[];
}

export function parseRapidApiHighlights(
  payload: unknown,
  username: string,
): RapidHighlightItem[] {
  const result = parseRapidApiHighlightsWithMeta(payload, username);
  return result.highlights;
}

export function parseRapidApiHighlightsWithMeta(
  payload: unknown,
  username: string,
): { highlights: RapidHighlightItem[]; meta: ParseHighlightsMeta } {
  const seenIds = new Set<string>();
  const highlights: RapidHighlightItem[] = [];

  for (const group of collectHighlightArrays(payload)) {
    for (const entry of group) {
      const parsed = tryParseEntry(entry, username);
      if (!parsed || seenIds.has(parsed.id)) continue;
      seenIds.add(parsed.id);
      highlights.push(parsed);
    }
  }

  if (highlights.length === 0) {
    deepWalkHighlights(payload, username, seenIds, highlights);
  }

  const root = asObject(payload);
  return {
    highlights,
    meta: {
      arrayBuckets: collectHighlightArrays(payload).length,
      parsedCount: highlights.length,
      topLevelKeys: root ? Object.keys(root).slice(0, 20) : [],
    },
  };
}
