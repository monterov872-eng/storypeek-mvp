import type { AppConfig } from '../../config.js';
import { normalizeUsername } from '../../utils/username.js';
import { RAPIDAPI_HOST } from './rapidApiClient.js';
import { resolveHighlightApiCredentials } from './rapidHighlightClient.js';
import { countCdnMediaUrls, parseHighlightStoriesMedia } from './parseHighlightStories.js';
import type { HighlightIdBundle } from './highlightIds.js';

const PREVIEW_LEN = 500;

import { HIGHLIGHT_STORIES_PATH } from './rapidHighlightStories.js';

/** Highlight story items on Stable API. */
export const HIGHLIGHT_MEDIA_PROBE_PATHS = [HIGHLIGHT_STORIES_PATH] as const;

/** Removed — wrong or missing on Stable API. */
export const REMOVED_HIGHLIGHT_PATHS = [
  '/get_highlight_stories.php',
  '/get_ig_highlight_stories.php',
  '/get_ig_user_highlight_stories.php',
];

export interface HighlightEndpointProbeResult {
  host: string;
  path: string;
  url: string;
  status: number;
  preview: string;
  parsedStories: number;
  cdnUrlCount: number;
  body: Record<string, string>;
}

function preview(text: string): string {
  return text.length <= PREVIEW_LEN ? text : `${text.slice(0, PREVIEW_LEN)}…`;
}

export function logHighlightEndpointProbe(result: HighlightEndpointProbeResult): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'highlight_endpoint_test',
      endpoint: result.path,
      host: result.host,
      url: result.url,
      status: result.status,
      preview: result.preview,
      parsedStories: result.parsedStories,
      cdnUrlCount: result.cdnUrlCount,
      bodyKeys: Object.keys(result.body),
    }),
  );
}

export function resolveProbeHosts(config: AppConfig): string[] {
  const hosts = new Set<string>([RAPIDAPI_HOST]);
  const creds = resolveHighlightApiCredentials(config);
  if (creds?.host) hosts.add(creds.host);
  return [...hosts];
}

export async function probeRapidHighlightMediaEndpoint(
  host: string,
  apiKey: string,
  path: string,
  body: Record<string, string>,
  username: string,
): Promise<HighlightEndpointProbeResult> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `https://${host}${normalizedPath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-rapidapi-host': host,
      'x-rapidapi-key': apiKey,
    },
    body: new URLSearchParams(body).toString(),
  });

  const text = await res.text();
  let payload: unknown = text;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    /* keep text */
  }

  const normalized = normalizeUsername(username);
  const { stories } = parseHighlightStoriesMedia(payload, normalized);
  const cdnUrlCount = countCdnMediaUrls(payload);

  const result: HighlightEndpointProbeResult = {
    host,
    path: normalizedPath,
    url,
    status: res.status,
    preview: preview(text),
    parsedStories: stories.length,
    cdnUrlCount,
    body,
  };

  logHighlightEndpointProbe(result);
  return result;
}

/** Best-effort RapidAPI probe (Stable API has no dedicated highlight-items route). */
export async function tryRapidApiHighlightMediaProbe(
  config: AppConfig,
  username: string,
  bundle: HighlightIdBundle,
  request: (
    path: string,
    body: Record<string, string>,
  ) => Promise<{ payload: unknown; status: number; host: string }>,
): Promise<{ stories: ReturnType<typeof parseHighlightStoriesMedia>['stories']; path: string; host: string } | null> {
  const normalized = normalizeUsername(username);
  const numeric = bundle.numericId || bundle.reelId.replace(/^highlight:/, '');
  const bodies: Record<string, string>[] = [
    { username_or_url: normalized, highlight_id_or_url: bundle.reelId },
    { username_or_url: normalized, highlight_id: numeric, reel_id: numeric },
  ];

  const configured = config.RAPID_HIGHLIGHT_STORIES_PATH?.trim();
  const paths = configured
    ? [configured, ...HIGHLIGHT_MEDIA_PROBE_PATHS]
    : [...HIGHLIGHT_MEDIA_PROBE_PATHS];

  for (const path of paths) {
    if (REMOVED_HIGHLIGHT_PATHS.includes(path as (typeof REMOVED_HIGHLIGHT_PATHS)[number])) {
      continue;
    }
    for (const body of bodies) {
      try {
        const { payload, status, host } = await request(path, body);
        if (status === 404) continue;

        const { stories, meta } = parseHighlightStoriesMedia(payload, normalized);
        logHighlightEndpointProbe({
          host,
          path,
          url: `https://${host}${path}`,
          status,
          preview: preview(JSON.stringify(payload)),
          parsedStories: stories.length,
          cdnUrlCount: countCdnMediaUrls(payload),
          body,
        });

        if (stories.length > 0) {
          console.log(
            JSON.stringify({
              ts: new Date().toISOString(),
              event: 'highlight_stories_rapid_winner',
              host,
              path,
              storyCount: stories.length,
              parseMeta: meta,
            }),
          );
          return { stories, path, host };
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}
