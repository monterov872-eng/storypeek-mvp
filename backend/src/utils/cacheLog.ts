export type CacheLogEvent =
  | 'profile_cache_hit'
  | 'story_cache_hit'
  | 'highlight_cache_hit'
  | 'story_request_skipped_cooldown';

export function logCacheEvent(
  event: CacheLogEvent,
  details: Record<string, string | number | boolean | undefined>,
) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...details }));
}
