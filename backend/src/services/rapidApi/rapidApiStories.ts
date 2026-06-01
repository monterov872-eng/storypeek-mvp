import type { AppConfig } from '../../config.js';
import { normalizeUsername } from '../../utils/username.js';
import { parseStoriesMedia } from './parseStories.js';
import { postRapidApi } from './rapidApiClient.js';
import type { RapidStoriesResult } from './types.js';

const STORIES_PATH = '/get_ig_user_stories.php';

function buildStoryRequestBodies(username: string): Record<string, string>[] {
  const clean = username.trim().replace(/^@/, '');
  const normalized = normalizeUsername(clean);
  const profileUrl = `https://www.instagram.com/${clean}/`;

  const variants: Record<string, string>[] = [
    { username_or_url: clean },
    { username_or_url: profileUrl },
    { username_or_url: normalized },
  ];

  const seen = new Set<string>();
  return variants.filter((body) => {
    const key = JSON.stringify(body);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchRapidApiStories(
  username: string,
  config: AppConfig,
): Promise<RapidStoriesResult> {
  const normalized = normalizeUsername(username);
  const bodies = buildStoryRequestBodies(username);

  for (const body of bodies) {
    const { payload, status } = await postRapidApi(config, {
      path: STORIES_PATH,
      kind: 'stories',
      username: normalized,
      body,
    });

    const { stories, meta } = parseStoriesMedia(payload, normalized);

    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: 'rapidapi_stories_parsed',
        username: normalized,
        path: STORIES_PATH,
        status,
        bodyKeys: Object.keys(body),
        storyCount: stories.length,
        parseMeta: meta,
      }),
    );

    if (stories.length > 0) {
      return {
        username: normalized,
        stories,
        provider: 'rapidapi',
        fetchedAt: new Date().toISOString(),
      };
    }
  }

  return {
    username: normalized,
    stories: [],
    provider: 'rapidapi',
    fetchedAt: new Date().toISOString(),
    notice: `No active stories for @${normalized} right now.`,
  };
}
