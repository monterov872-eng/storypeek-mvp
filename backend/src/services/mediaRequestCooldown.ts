import { ProviderError } from './instagram/errors.js';
import { logCacheEvent } from '../utils/cacheLog.js';
import { normalizeUsername } from '../utils/username.js';

const MEDIA_GAP_MS = 30_000;
const lastMediaRequest = new Map<string, number>();

function key(deviceId: string, username: string): string {
  return `${deviceId}:${normalizeUsername(username)}:media`;
}

export function assertMediaRequestAllowed(
  deviceId: string,
  username: string,
  kind: 'stories' | 'highlights',
): void {
  const k = key(deviceId, username);
  const now = Date.now();
  const last = lastMediaRequest.get(k) ?? 0;
  const elapsed = now - last;

  if (elapsed < MEDIA_GAP_MS) {
    const waitSec = Math.ceil((MEDIA_GAP_MS - elapsed) / 1000);
    logCacheEvent('story_request_skipped_cooldown', {
      deviceId,
      username: normalizeUsername(username),
      kind,
      waitSec,
    });
    throw new ProviderError(
      'RATE_LIMITED',
      `Please wait ${waitSec} seconds before requesting ${kind} again.`,
      'rate_limit',
      waitSec,
    );
  }

  lastMediaRequest.set(k, now);
}
