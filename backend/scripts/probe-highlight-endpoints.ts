/**
 * Probe RapidAPI endpoints for highlight media items.
 *
 *   npx tsx scripts/probe-highlight-endpoints.ts jenifer.nty
 */
import 'dotenv/config';
import { loadConfig } from '../src/config.js';
import { fetchRapidApiHighlights } from '../src/services/rapidApi/rapidApiHighlights.js';
import { resolveHighlightApiCredentials } from '../src/services/rapidApi/rapidHighlightClient.js';
import { RAPIDAPI_HOST } from '../src/services/rapidApi/rapidApiClient.js';
import { countCdnMediaUrls, parseHighlightStoriesMedia } from '../src/services/rapidApi/parseHighlightStories.js';
import { collectHighlightIdCandidates, resolveHighlightIdBundle } from '../src/services/rapidApi/highlightIds.js';

const username = process.argv[2] ?? 'jenifer.nty';

const CANDIDATE_PATHS = [
  '/get_ig_user_stories.php',
  '/get_ig_user_highlights.php',
  '/get_ig_user_reels.php',
  '/highlights',
  '/highlight',
  '/highlight/stories',
  '/highlights/stories',
  '/story',
  '/stories',
  '/reels',
  '/reel',
  '/mediaByShortcode',
  '/media',
  '/links',
  '/userInfo',
  '/user',
  '/user/info',
];

function preview(text: string, max = 500): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

async function postProbe(
  host: string,
  apiKey: string,
  path: string,
  body: Record<string, string>,
): Promise<{ status: number; text: string; payload: unknown }> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`https://${host}${normalizedPath}`, {
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
    /* raw text */
  }
  return { status: res.status, text, payload };
}

async function main() {
  const config = loadConfig();
  const apiKey = config.RAPID_API_KEY?.trim();
  if (!apiKey) {
    console.error('RAPID_API_KEY missing in backend/.env');
    process.exit(1);
  }

  const hosts = new Set<string>([RAPIDAPI_HOST]);
  const creds = resolveHighlightApiCredentials(config);
  if (creds?.host) hosts.add(creds.host);
  if (config.RAPID_HIGHLIGHT_API_HOST?.trim()) {
    hosts.add(config.RAPID_HIGHLIGHT_API_HOST.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''));
  }

  console.log('Username:', username);
  console.log('Hosts:', [...hosts].join(', '));

  const hl = await fetchRapidApiHighlights(username, config);
  if (!hl.highlights[0]) {
    console.error('No highlights to probe');
    process.exit(1);
  }

  const highlight = hl.highlights[0];
  const bundle = resolveHighlightIdBundle(highlight.id.replace(/^highlight:/, ''), {
    highlightReelId: highlight.id,
    pk: highlight.id.replace(/^highlight:/, ''),
    id: highlight.id,
  });
  const candidates = collectHighlightIdCandidates(bundle);
  const primaryId = candidates[0] ?? highlight.id;
  const numeric = primaryId.replace(/^highlight:/, '');

  const bodies: Record<string, string>[] = [
    { username_or_url: username, highlight_id_or_url: highlight.id },
    { username_or_url: username, highlight_id: numeric },
    { username_or_url: username, reel_id: numeric },
    { username_or_url: username, id: highlight.id },
  ];

  const winners: { host: string; path: string; body: Record<string, string>; stories: number; cdn: number }[] =
    [];

  for (const host of hosts) {
    console.log('\n======== HOST:', host, '========');
    for (const path of CANDIDATE_PATHS) {
      for (const body of bodies) {
        try {
          const { status, text, payload } = await postProbe(host, apiKey, path, body);
          const cdn = countCdnMediaUrls(payload);
          const { stories } = parseHighlightStoriesMedia(payload, username);
          console.log(
            JSON.stringify({
              endpoint: path,
              host,
              status,
              preview: preview(text),
              cdnUrlCount: cdn,
              parsedStories: stories.length,
              bodyKeys: Object.keys(body),
            }),
          );
          if (status === 200 && (stories.length > 0 || cdn > 2)) {
            winners.push({ host, path, body, stories: stories.length, cdn });
          }
        } catch (err) {
          console.log(
            JSON.stringify({
              endpoint: path,
              host,
              error: err instanceof Error ? err.message : String(err),
            }),
          );
        }
      }
    }
  }

  console.log('\n======== WINNERS (RapidAPI) ========');
  if (winners.length === 0) {
    console.log(
      'No RapidAPI endpoint returned highlight media. Use Instagram web reels_media with INSTAGRAM_SESSION_ID.',
    );
  } else {
    for (const w of winners) {
      console.log(w);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
