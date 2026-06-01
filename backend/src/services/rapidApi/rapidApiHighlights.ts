import type { AppConfig } from '../../config.js';
import type { HighlightSummary } from '../../types.js';
import { WebPublicInstagramSource } from '../instagram/sources/webPublic/source.js';
import { normalizeUsername } from '../../utils/username.js';
import {
  parseRapidApiHighlights,
  parseRapidApiHighlightsWithMeta,
} from './parseHighlights.js';
import { RapidApiError } from './errors.js';
import { postRapidApi } from './rapidApiClient.js';
import type { RapidHighlightItem, RapidHighlightsResult } from './types.js';

const DEFAULT_HIGHLIGHTS_PATH = '/get_ig_user_highlights.php';

function highlightsPath(config: AppConfig): string {
  const configured = config.RAPID_API_HIGHLIGHTS_PATH?.trim();
  const path = configured || DEFAULT_HIGHLIGHTS_PATH;
  return path.startsWith('/') ? path : `/${path}`;
}

function sanitizeUsername(username: string): string {
  return username.trim().replace(/^@/, '');
}

function buildRequestBodies(username: string): Record<string, string>[] {
  const clean = sanitizeUsername(username);
  const normalized = normalizeUsername(clean);
  const bodies: Record<string, string>[] = [
    { username_or_url: clean },
    { username_or_url: `https://www.instagram.com/${clean}/` },
  ];
  if (normalized !== clean) {
    bodies.push({ username_or_url: normalized });
  }
  return bodies;
}

function logHighlightsParse(
  username: string,
  path: string,
  meta: { arrayBuckets: number; parsedCount: number; topLevelKeys: string[] },
  bodyKeys: string[],
): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'rapidapi_highlights_parsed',
      username,
      path,
      parsedCount: meta.parsedCount,
      arrayBuckets: meta.arrayBuckets,
      topLevelKeys: meta.topLevelKeys,
      bodyKeys,
    }),
  );
}

function mapWebHighlight(item: HighlightSummary, username: string): RapidHighlightItem {
  return {
    id: item.id,
    title: item.title,
    coverUrl: item.coverUrl,
    username,
  };
}

async function fetchWebHighlightsFallback(
  username: string,
  config: AppConfig,
): Promise<RapidHighlightItem[]> {
  if (!config.INSTAGRAM_SESSION_ID?.trim()) return [];

  try {
    const source = new WebPublicInstagramSource(config);
    const resolved = await source.resolveProfile(username);
    const highlights = await source.fetchHighlights(resolved);
    return highlights.map((h) => mapWebHighlight(h, resolved.profile.username));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: 'rapidapi_highlights_web_fallback_failed',
        username: normalizeUsername(username),
        message,
      }),
    );
    return [];
  }
}

export async function fetchRapidApiHighlights(
  username: string,
  config: AppConfig,
): Promise<RapidHighlightsResult> {
  const normalized = normalizeUsername(username);
  const path = highlightsPath(config);
  const bodies = buildRequestBodies(username);

  let lastPayload: unknown = {};
  let lastMeta = { arrayBuckets: 0, parsedCount: 0, topLevelKeys: [] as string[] };
  let highlights: RapidHighlightItem[] = [];

  let rapidApiFailed = false;

  for (const body of bodies) {
    try {
      const { payload } = await postRapidApi(config, {
        path,
        kind: 'highlights',
        username: normalized,
        body,
      });

      const parsed = parseRapidApiHighlightsWithMeta(payload, normalized);
      lastPayload = payload;
      lastMeta = parsed.meta;
      logHighlightsParse(normalized, path, parsed.meta, Object.keys(body));

      if (parsed.highlights.length > 0) {
        highlights = parsed.highlights;
        break;
      }
    } catch (err) {
      if (err instanceof RapidApiError) {
        rapidApiFailed = true;
        if (err.code === 'RATE_LIMITED') break;
      }
      throw err;
    }
  }

  if (highlights.length === 0) {
    highlights = parseRapidApiHighlights(lastPayload, normalized);
    if (highlights.length === 0 || rapidApiFailed) {
      const fallback = await fetchWebHighlightsFallback(username, config);
      if (fallback.length > 0) {
        console.log(
          JSON.stringify({
            ts: new Date().toISOString(),
            event: 'rapidapi_highlights_web_fallback_used',
            username: normalized,
            count: fallback.length,
          }),
        );
        highlights = fallback;
      }
    }
  }

  if (highlights.length === 0 && rapidApiFailed) {
    throw new RapidApiError(
      'RATE_LIMITED',
      'RapidAPI rate limit reached. Upgrade your plan or try again later.',
      'rate_limit',
    );
  }

  if (highlights.length === 0 && lastMeta.topLevelKeys.length > 0) {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: 'rapidapi_highlights_empty',
        username: normalized,
        path,
        topLevelKeys: lastMeta.topLevelKeys,
        arrayBuckets: lastMeta.arrayBuckets,
      }),
    );
  }

  return {
    username: normalized,
    highlights,
    provider: 'rapidapi',
    fetchedAt: new Date().toISOString(),
  };
}
