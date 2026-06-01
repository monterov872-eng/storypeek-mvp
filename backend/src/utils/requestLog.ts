export type RequestFailureReason =
  | 'instagram_block'
  | 'timeout'
  | 'network'
  | 'upstream'
  | 'rate_limit'
  | 'validation';

export function logRequestEvent(
  event: 'instagram_request' | 'instagram_retry' | 'instagram_failure' | 'search_cooldown',
  details: Record<string, string | number | boolean | undefined>,
) {
  const payload = { ts: new Date().toISOString(), event, ...details };
  console.log(JSON.stringify(payload));
}
