import type { AppConfig } from '../config.js';
import { createInstagramProvider } from './instagram/factory.js';
import { fetchRapidApiPosts } from './rapidApi/rapidApiPosts.js';
import type { RapidProfileResult } from './rapidApi/types.js';

/**
 * Profile stats + avatar from Instagram web profile lookup;
 * feed posts from RapidAPI (paginated slice).
 */
export async function fetchApiProfile(
  username: string,
  config: AppConfig,
): Promise<RapidProfileResult> {
  const provider = createInstagramProvider(config);
  const profile = await provider.getProfile(username);

  let postsResult: Awaited<ReturnType<typeof fetchRapidApiPosts>> = {
    username: profile.username,
    posts: [],
    provider: 'rapidapi',
    fetchedAt: new Date().toISOString(),
  };
  try {
    if (!profile.isPrivate) {
      postsResult = await fetchRapidApiPosts(username, config);
    }
  } catch (err) {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event: 'rapidapi_posts_failed',
        username: profile.username,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }

  const hint = postsResult.userHint;
  let profilePictureUrl =
    profile.profilePictureUrl || hint?.profilePictureUrl || '';
  if (!profilePictureUrl && postsResult.posts.length > 0) {
    const thumb = postsResult.posts[0]?.thumbnailUrl ?? postsResult.posts[0]?.mediaUrl;
    if (thumb) profilePictureUrl = thumb;
  }

  const fullName = profile.fullName || hint?.fullName || '';

  return {
    username: profile.username,
    fullName,
    biography: profile.biography,
    profilePictureUrl,
    isPrivate: profile.isPrivate,
    followersCount: profile.followersCount,
    followingCount: profile.followingCount,
    postsCount: profile.postsCount,
    storyCount: profile.storyCount,
    highlightCount: profile.highlightCount,
    posts: profile.isPrivate ? [] : postsResult.posts,
    provider: `instagram-${config.INSTAGRAM_PROVIDER}+rapidapi`,
    fetchedAt: new Date().toISOString(),
  };
}
