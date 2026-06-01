import type { AppConfig } from '../../config.js';
import type { StoryItem } from '../../types.js';
import { WebPublicInstagramSource } from '../instagram/sources/webPublic/source.js';
import { IgHttpClient } from '../instagram/sources/webPublic/http.js';
import { fetchHighlightReelsMedia } from '../instagram/sources/webPublic/highlightFetch.js';
import { normalizeUsername } from '../../utils/username.js';
import { buildHighlightStoryRequestBodies } from './highlightStoryBodies.js';
import {
  collectHighlightIdCandidates,
  resolveHighlightIdBundle,
  type HighlightIdBundle,
} from './highlightIds.js';
import { parseStoriesMedia } from './parseStories.js';
import { postRapidApi, RAPIDAPI_HOST } from './rapidApiClient.js';
import type { RapidHighlightStoriesResult, RapidStoryItem } from './types.js';

/** Instagram Scraper Stable API — user highlight story items. */
export const HIGHLIGHT_STORIES_PATH = '/get_highlights_stories.php';

export interface HighlightStoriesRequestContext {
  highlightTitle?: string;
  highlightReelId?: string;
  pk?: string;
  shortcode?: string;
  id?: string;
  reel_id?: string;
  highlightObject?: Record<string, unknown>;
}

const PREVIEW_LEN = 500;

function preview(text: string): string {
  return text.length <= PREVIEW_LEN ? text : `${text.slice(0, PREVIEW_LEN)}…`;
}

function mapWebStory(item: StoryItem, username: string): RapidStoryItem {
  return {
    id: item.id,
    username,
    mediaType: item.mediaType,
    mediaUrl: item.mediaUrl,
    takenAt: item.takenAt,
  };
}

export function logHighlightTap(
  username: string,
  bundle: HighlightIdBundle,
  options?: HighlightStoriesRequestContext,
): void {
  const highlightObject = options?.highlightObject ?? bundle.highlightObject;
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'highlight_tap',
      username: normalizeUsername(username),
      highlightObject,
      highlightId: bundle.id ?? bundle.reelId,
      reelId: bundle.reelId,
      numericId: bundle.numericId,
      pk: bundle.pk,
      shortcode: bundle.shortcode,
      highlightUrl: bundle.highlightUrl,
      idCandidates: collectHighlightIdCandidates(bundle),
    }),
  );
}

function logHighlightRequest(
  host: string,
  path: string,
  body: Record<string, string>,
  bundle: HighlightIdBundle,
): void {
  const bodyEncoded = new URLSearchParams(body).toString();
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'highlight_stories_request',
      host,
      path,
      url: `https://${host}${path}`,
      method: 'POST',
      body,
      bodyEncoded,
      reelId: bundle.reelId,
      numericId: bundle.numericId,
    }),
  );
}

function logHighlightResponse(
  host: string,
  path: string,
  body: Record<string, string>,
  status: number,
  payload: unknown,
  storyCount: number,
): void {
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'highlight_stories_response',
      host,
      path,
      status,
      requestBody: body,
      responseBody: payload,
      body,
      preview: preview(raw),
      parsedStoryCount: storyCount,
    }),
  );
}

function highlightStoriesPath(config: AppConfig): string {
  const configured = config.RAPID_HIGHLIGHT_STORIES_PATH?.trim();
  if (!configured) return HIGHLIGHT_STORIES_PATH;
  return configured.startsWith('/') ? configured : `/${configured}`;
}

/**
 * RapidAPI highlight items — POST get_highlights_stories.php (same auth as active stories).
 */
async function fetchRapidHighlightStories(
  username: string,
  bundle: HighlightIdBundle,
  config: AppConfig,
  fallbackTitle?: string,
): Promise<RapidHighlightStoriesResult | null> {
  if (!config.RAPID_API_KEY?.trim()) return null;

  const normalized = normalizeUsername(username);
  const bodies = buildHighlightStoryRequestBodies(username, bundle);
  const normalizedPath = highlightStoriesPath(config);

  for (const body of bodies) {
      logHighlightRequest(RAPIDAPI_HOST, normalizedPath, body, bundle);
      try {
        const { payload, status } = await postRapidApi(config, {
          path: normalizedPath,
          kind: 'highlight_stories',
          username: normalized,
          highlightId: bundle.reelId,
          body,
        });

        const { stories, meta } = parseStoriesMedia(payload, normalized);
        logHighlightResponse(RAPIDAPI_HOST, normalizedPath, body, status, payload, stories.length);

        if (stories.length > 0) {
          console.log(
            JSON.stringify({
              ts: new Date().toISOString(),
              event: 'highlight_stories_rapid_success',
              path: normalizedPath,
              storyCount: stories.length,
              parseMeta: meta,
            }),
          );
          return {
            username: normalized,
            highlightId: bundle.reelId,
            title: fallbackTitle ?? 'Highlight',
            stories,
            provider: 'rapidapi',
            fetchedAt: new Date().toISOString(),
            storiesUnavailable: false,
          };
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(
          JSON.stringify({
            ts: new Date().toISOString(),
            event: 'highlight_stories_rapid_error',
            host: RAPIDAPI_HOST,
            path: normalizedPath,
            body,
            message,
          }),
        );
      }
  }

  return null;
}

/**
 * Instagram web reels_media — fallback when RapidAPI returns no items.
 */
async function fetchWebHighlightStories(
  username: string,
  bundle: HighlightIdBundle,
  config: AppConfig,
  fallbackTitle?: string,
): Promise<RapidHighlightStoriesResult | null> {
  const normalized = normalizeUsername(username);
  const http = new IgHttpClient(config);

  try {
    const source = new WebPublicInstagramSource(config);
    const resolved = await source.resolveProfile(username);

    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: 'highlight_stories_web_start',
        username: normalized,
        reelId: bundle.reelId,
        numericId: bundle.numericId,
        hasSession: http.hasSession,
        userId: resolved.userId,
      }),
    );

    const { items, logs } = await fetchHighlightReelsMedia(http, resolved, bundle.reelId);

    for (const attempt of logs) {
      console.log(
        JSON.stringify({
          ts: new Date().toISOString(),
          event: 'highlight_stories_web_attempt',
          ...attempt,
        }),
      );
    }

    if (items.length === 0) return null;

    return {
      username: normalized,
      highlightId: bundle.reelId,
      title: fallbackTitle ?? 'Highlight',
      stories: items.map((item) => mapWebStory(item, normalized)),
      provider: 'instagram-web',
      fetchedAt: new Date().toISOString(),
      storiesUnavailable: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: 'highlight_stories_web_failed',
        username: normalized,
        reelId: bundle.reelId,
        message,
      }),
    );
    return null;
  }
}

function buildUnavailableResult(
  username: string,
  bundle: HighlightIdBundle,
  title?: string,
): RapidHighlightStoriesResult {
  return {
    username: normalizeUsername(username),
    highlightId: bundle.reelId,
    title: title ?? 'Highlight',
    stories: [],
    provider: 'rapidapi',
    fetchedAt: new Date().toISOString(),
    storiesUnavailable: true,
    notice:
      'Could not load highlight stories for this highlight. Try another highlight or reload.',
  };
}

export async function fetchRapidApiHighlightStories(
  username: string,
  highlightId: string,
  config: AppConfig,
  options?: HighlightStoriesRequestContext,
): Promise<RapidHighlightStoriesResult> {
  const bundle = resolveHighlightIdBundle(highlightId, options);
  logHighlightTap(username, bundle, options);

  const rapidResult = await fetchRapidHighlightStories(
    username,
    bundle,
    config,
    options?.highlightTitle,
  );
  if (rapidResult && rapidResult.stories.length > 0) {
    return rapidResult;
  }

  return buildUnavailableResult(username, bundle, options?.highlightTitle);
}
