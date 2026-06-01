import type { AppConfig } from '../../../../config.js';
import type { StoryItem } from '../../../../types.js';
import { ProviderError, throwProvider } from '../../errors.js';
import { logStoryEvent } from '../../../../utils/storyLog.js';
import { randomDelayMs, sleep } from '../../../../utils/sleep.js';
import type { ResolvedProfile } from '../types.js';
import type { IgHttpClient } from './http.js';
import { parseStoryItems } from './parser.js';

export interface StoryFetchMeta {
  endpoint: string;
  status: number;
  rawPreview: string;
  payloadKeys: string;
  reelKeys: string;
  itemCount: number;
}

type EmptyReason =
  | 'empty_reels_object'
  | 'empty_reels_media_array'
  | 'no_items_in_payload'
  | 'html_login_wall';

function summarizePayload(payload: Record<string, unknown>): {
  payloadKeys: string;
  reelKeys: string;
  itemCount: number;
} {
  const reels = payload.reels as Record<string, unknown> | undefined;
  const reelKeys = reels && typeof reels === 'object' ? Object.keys(reels).join(',') : '';
  let itemCount = 0;

  const stories = parseStoryItems(payload);
  itemCount = stories.length;

  return {
    payloadKeys: Object.keys(payload).join(','),
    reelKeys: reelKeys || '(none)',
    itemCount,
  };
}

function classifyEmptyResponse(
  payload: Record<string, unknown>,
  rawText: string,
  hasSession: boolean,
): { logEvent: 'story_fetch_empty' | 'story_fetch_requires_session'; reason: string } {
  if (rawText.trimStart().startsWith('<')) {
    return {
      logEvent: 'story_fetch_requires_session',
      reason: 'html_login_wall',
    };
  }

  const reels = payload.reels as Record<string, unknown> | undefined;
  const status = payload.status as string | undefined;

  if (status === 'ok' && reels && typeof reels === 'object' && Object.keys(reels).length === 0) {
    if (!hasSession) {
      return {
        logEvent: 'story_fetch_requires_session',
        reason: 'empty_reels_ok_without_session',
      };
    }
    return {
      logEvent: 'story_fetch_empty',
      reason: 'empty_reels_ok_with_session',
    };
  }

  if (Array.isArray(payload.reels_media) && payload.reels_media.length === 0) {
    return {
      logEvent: hasSession ? 'story_fetch_empty' : 'story_fetch_requires_session',
      reason: 'empty_reels_media_array',
    };
  }

  return {
    logEvent: hasSession ? 'story_fetch_empty' : 'story_fetch_requires_session',
    reason: 'no_items_in_payload',
  };
}

const SESSION_MESSAGE =
  'Stories require INSTAGRAM_SESSION_ID in backend/.env. See backend/docs/SESSION_SETUP.md.';

export async function fetchPublicStories(
  http: IgHttpClient,
  resolved: ResolvedProfile,
  config: AppConfig,
): Promise<StoryItem[]> {
  const { userId, profile } = resolved;
  const username = profile.username;
  const refererPath = `/${username}/`;

  const delayMs = randomDelayMs(
    config.INSTAGRAM_STORY_DELAY_MIN_MS,
    config.INSTAGRAM_STORY_DELAY_MAX_MS,
  );
  logStoryEvent('story_fetch_start', {
    username,
    userId,
    hasSession: http.hasSession,
    delayMs,
  });
  await sleep(delayMs);

  const endpoints = [
    {
      name: 'reels_media',
      path: '/api/v1/feed/reels_media/',
      searchParams: { reel_ids: userId },
    },
    {
      name: 'reel_media',
      path: `/api/v1/feed/user/${userId}/reel_media/`,
      searchParams: undefined,
    },
  ];

  let lastMeta: StoryFetchMeta | undefined;

  for (const ep of endpoints) {
    try {
      const { payload, rawText, status } = await http.getJsonRaw<Record<string, unknown>>({
        path: ep.path,
        searchParams: ep.searchParams,
        context: `stories_fetch_${ep.name}`,
        refererPath,
      });

      const summary = summarizePayload(payload);
      lastMeta = {
        endpoint: ep.name,
        status,
        rawPreview: rawText.slice(0, 400),
        ...summary,
      };

      const stories = parseStoryItems(payload, userId);
      if (stories.length > 0) {
        logStoryEvent('story_fetch_success', {
          username,
          userId,
          endpoint: ep.name,
          count: stories.length,
        });
        return stories;
      }

      const empty = classifyEmptyResponse(payload, rawText, http.hasSession);
      logStoryEvent(empty.logEvent, {
        username,
        userId,
        endpoint: ep.name,
        upstreamReason: empty.reason,
        hasSession: http.hasSession,
        payloadKeys: summary.payloadKeys,
        reelKeys: summary.reelKeys,
        rawPreview: rawText.slice(0, 400),
      });

      if (empty.logEvent === 'story_fetch_requires_session') {
        throw new ProviderError('SERVICE_UNAVAILABLE', SESSION_MESSAGE, 'upstream');
      }
    } catch (err) {
      if (err instanceof ProviderError) {
        if (err.message.includes('SESSION_SETUP')) throw err;
        if (err.reason === 'instagram_block') {
          logStoryEvent('story_fetch_blocked', {
            username,
            endpoint: ep.name,
            message: err.message,
          });
          throw new ProviderError(
            'RATE_LIMITED',
            'Instagram blocked requests temporarily. Try later.',
            'instagram_block',
          );
        }
      }

      const message = err instanceof Error ? err.message : 'unknown';
      logStoryEvent('story_fetch_error', {
        username,
        endpoint: ep.name,
        error: message,
        hasSession: http.hasSession,
      });

      if (err instanceof ProviderError && err.reason !== 'network' && err.reason !== 'timeout') {
        throw err;
      }
    }
  }

  if (!http.hasSession) {
    logStoryEvent('story_fetch_requires_session', {
      username,
      userId,
      upstreamReason: 'all_endpoints_empty_without_session',
      lastEndpoint: lastMeta?.endpoint,
      rawPreview: lastMeta?.rawPreview,
    });
    throw new ProviderError('SERVICE_UNAVAILABLE', SESSION_MESSAGE, 'upstream');
  }

  logStoryEvent('story_fetch_empty', {
    username,
    userId,
    upstreamReason: 'no_story_items_after_all_endpoints',
    lastEndpoint: lastMeta?.endpoint,
    payloadKeys: lastMeta?.payloadKeys,
    reelKeys: lastMeta?.reelKeys,
    rawPreview: lastMeta?.rawPreview,
  });

  throwProvider(
    'NO_STORIES',
    'No public stories available right now for this profile.',
    'upstream',
  );
}
