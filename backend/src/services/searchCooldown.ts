import { ProviderError } from './instagram/errors.js';
import { logRequestEvent } from '../utils/requestLog.js';
import { normalizeUsername } from '../utils/username.js';

const lastLookup = new Map<string, number>();

export function assertProfileSearchAllowed(
  deviceId: string,
  username: string,
  cooldownMs: number,
): void {
  const key = `${deviceId}:${normalizeUsername(username)}`;
  const now = Date.now();
  const last = lastLookup.get(key) ?? 0;
  const elapsed = now - last;

  if (elapsed < cooldownMs) {
    const waitSec = Math.ceil((cooldownMs - elapsed) / 1000);
    logRequestEvent('search_cooldown', { deviceId, username, waitSec });
    throw new ProviderError(
      'RATE_LIMITED',
      `Please wait ${waitSec} seconds before searching @${normalizeUsername(username)} again.`,
      'rate_limit',
    );
  }

  lastLookup.set(key, now);
}
