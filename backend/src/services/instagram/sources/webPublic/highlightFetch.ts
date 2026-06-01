import type { StoryItem } from '../../../../types.js';
import { ProviderError } from '../../errors.js';
import type { ResolvedProfile } from '../types.js';
import type { IgHttpClient } from './http.js';
import { parseStoryItems } from './parser.js';

export interface HighlightFetchAttemptLog {
  endpoint: string;
  url: string;
  status: number;
  preview: string;
  parsedCount: number;
  reelId: string;
}

const PREVIEW_LEN = 500;

function preview(text: string): string {
  return text.length <= PREVIEW_LEN ? text : `${text.slice(0, PREVIEW_LEN)}…`;
}

function buildUrl(path: string, searchParams?: Record<string, string>): string {
  const base = `https://www.instagram.com${path}`;
  if (!searchParams || Object.keys(searchParams).length === 0) return base;
  return `${base}?${new URLSearchParams(searchParams).toString()}`;
}

/**
 * Fetch highlight story items via Instagram web API (reels_media).
 * This is the reliable path — RapidAPI Stable API has no highlight-items endpoint.
 */
export async function fetchHighlightReelsMedia(
  http: IgHttpClient,
  resolved: ResolvedProfile,
  reelId: string,
  fallbackTitle?: string,
): Promise<{ items: StoryItem[]; logs: HighlightFetchAttemptLog[] }> {
  const normalizedReelId = reelId.startsWith('highlight:')
    ? reelId
    : `highlight:${reelId.replace(/\D/g, '')}`;
  const numericId = normalizedReelId.replace(/^highlight:/, '');
  const refererPath = `/${resolved.profile.username}/`;
  const logs: HighlightFetchAttemptLog[] = [];

  const attempts: { endpoint: string; searchParams: Record<string, string> }[] = [
    { endpoint: 'reels_media', searchParams: { reel_ids: normalizedReelId } },
    { endpoint: 'reels_media_numeric', searchParams: { reel_ids: numericId } },
    {
      endpoint: 'reels_media_bracket',
      searchParams: { reel_ids: JSON.stringify([normalizedReelId]) },
    },
  ];

  for (const attempt of attempts) {
    const path = '/api/v1/feed/reels_media/';
    const url = buildUrl(path, attempt.searchParams);

    try {
      const { payload, rawText, status } = await http.getJsonRaw<Record<string, unknown>>({
        path,
        searchParams: attempt.searchParams,
        context: `highlight_items_${attempt.endpoint}`,
        refererPath,
      });

      const stories = parseStoryItems(payload, normalizedReelId);
      const log: HighlightFetchAttemptLog = {
        endpoint: attempt.endpoint,
        url,
        status,
        preview: preview(rawText),
        parsedCount: stories.length,
        reelId: normalizedReelId,
      };
      logs.push(log);

      console.log(
        JSON.stringify({
          ts: new Date().toISOString(),
          event: 'highlight_endpoint_test',
          ...log,
        }),
      );

      if (stories.length > 0) {
        return { items: stories, logs };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status =
        err instanceof ProviderError && err.reason === 'instagram_block' ? 429 : 0;
      const log: HighlightFetchAttemptLog = {
        endpoint: attempt.endpoint,
        url,
        status,
        preview: preview(message),
        parsedCount: 0,
        reelId: normalizedReelId,
      };
      logs.push(log);
      console.log(
        JSON.stringify({
          ts: new Date().toISOString(),
          event: 'highlight_endpoint_test',
          error: message,
          ...log,
        }),
      );
    }
  }

  return { items: [], logs };
}
