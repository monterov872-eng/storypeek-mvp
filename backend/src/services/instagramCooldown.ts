import { ProviderError } from './instagram/errors.js';

const COOLDOWN_MS = 10 * 60 * 1000;
const untilByDevice = new Map<string, number>();

export function startInstagramCooldown(deviceId: string): void {
  untilByDevice.set(deviceId, Date.now() + COOLDOWN_MS);
}

export function getInstagramCooldownRemainingMs(deviceId: string): number {
  const until = untilByDevice.get(deviceId) ?? 0;
  const remaining = until - Date.now();
  if (remaining <= 0) {
    untilByDevice.delete(deviceId);
    return 0;
  }
  return remaining;
}

export function assertInstagramNotInCooldown(deviceId: string): void {
  const remainingMs = getInstagramCooldownRemainingMs(deviceId);
  if (remainingMs <= 0) return;

  const retryAfterSec = Math.ceil(remainingMs / 1000);
  throw new ProviderError(
    'RATE_LIMITED',
    'Instagram blocked requests temporarily. Try later.',
    'instagram_block',
    retryAfterSec,
  );
}
