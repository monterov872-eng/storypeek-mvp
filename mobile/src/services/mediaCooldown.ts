import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatCountdown } from './instagramCooldown';

const PREFIX = 'storypeek_media_cd:';
export const MEDIA_COOLDOWN_MS = 30_000;

function key(username: string): string {
  return `${PREFIX}${username.trim().toLowerCase()}`;
}

export async function getMediaCooldownUntil(username: string): Promise<number> {
  const raw = await AsyncStorage.getItem(key(username));
  const until = raw ? Number(raw) : 0;
  if (!until || until <= Date.now()) {
    await AsyncStorage.removeItem(key(username));
    return 0;
  }
  return until;
}

export async function getMediaCooldownRemainingMs(username: string): Promise<number> {
  const until = await getMediaCooldownUntil(username);
  return Math.max(0, until - Date.now());
}

export async function isMediaInCooldown(username: string): Promise<boolean> {
  return (await getMediaCooldownRemainingMs(username)) > 0;
}

export async function startMediaCooldown(
  username: string,
  durationMs = MEDIA_COOLDOWN_MS,
): Promise<number> {
  const until = Date.now() + durationMs;
  await AsyncStorage.setItem(key(username), String(until));
  return until;
}

export async function startMediaCooldownFromRetryAfter(
  username: string,
  retryAfterSec?: number,
): Promise<number> {
  const ms =
    retryAfterSec && retryAfterSec > 0 ? retryAfterSec * 1000 : MEDIA_COOLDOWN_MS;
  return startMediaCooldown(username, ms);
}

export function formatMediaCooldownLabel(totalSeconds: number): string {
  return formatCountdown(totalSeconds);
}
