/**
 * Endpoints published on RapidAPI playground (instagram-scraper-stable-api).
 * Verified from https://rapidapi.com/thetechguy32744/api/instagram-scraper-stable-api
 */
export const RAPIDAPI_PLAYGROUND_ENDPOINTS = [
  '/get_ig_user_stories.php',
  '/get_ig_user_highlights.php',
  '/get_ig_user_posts.php',
  '/get_ig_user_reels.php',
  '/get_ig_user_followers.php',
  '/get_ig_user_followers_v2.php',
  '/get_ig_user_about.php',
  '/get_ig_similar_accounts.php',
  '/get_ig_user_tagged_posts.php',
] as const;

/** Highlight story items on Instagram Scraper Stable API. */
export const RAPIDAPI_HIGHLIGHT_STORIES_ENDPOINT = '/get_ig_user_highlight_stories.php';

/** Do not use — wrong or missing on Stable API. */
export const RAPIDAPI_REMOVED_HIGHLIGHT_STORY_PATHS = [
  '/get_highlight_stories.php',
  '/get_ig_highlight_stories.php',
  '/get_ig_user_highlights.php',
] as const;

export const HIGHLIGHT_STORIES_UNAVAILABLE_MESSAGE =
  'Highlight opened, but story items endpoint is not available.';
