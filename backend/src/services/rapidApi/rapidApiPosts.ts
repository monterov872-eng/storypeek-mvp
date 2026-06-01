import type { AppConfig } from '../../config.js';
import { normalizeUsername } from '../../utils/username.js';
import { parseRapidApiPosts } from './parsePosts.js';
import { postRapidApi } from './rapidApiClient.js';
import type { RapidPostsResult } from './types.js';

const POSTS_PATH = '/get_ig_user_posts.php';

function buildPostRequestBodies(username: string): Record<string, string>[] {
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

export async function fetchRapidApiPosts(
  username: string,
  config: AppConfig,
): Promise<RapidPostsResult> {
  const normalized = normalizeUsername(username);
  const bodies = buildPostRequestBodies(username);

  for (const body of bodies) {
    const { payload, status } = await postRapidApi(config, {
      path: POSTS_PATH,
      kind: 'posts',
      username: normalized,
      body,
    });

    const { posts, user } = parseRapidApiPosts(payload, normalized);

    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: 'rapidapi_posts_parsed',
        username: normalized,
        path: POSTS_PATH,
        status,
        bodyKeys: Object.keys(body),
        postCount: posts.length,
      }),
    );

    if (posts.length > 0) {
      return {
        username: normalized,
        posts,
        userHint: user,
        provider: 'rapidapi',
        fetchedAt: new Date().toISOString(),
      };
    }
  }

  return {
    username: normalized,
    posts: [],
    provider: 'rapidapi',
    fetchedAt: new Date().toISOString(),
  };
}
