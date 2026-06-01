import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'storypeek_instagram_cooldown_until';
export const INSTAGRAM_COOLDOWN_MS = 10 * 60 * 1000;

const BLOCKED_PREFIX = 'Instagram temporarily blocked requests';

export function isInstagramBlockedError(
  code: string,
  reason?: string,
  message?: string,
): boolean {
  if (reason === 'instagram_block') return true;
  if (message?.includes('Instagram blocked')) return true;
  if (message?.includes('Instagram may be limiting')) return true;
  if (message?.includes(BLOCKED_PREFIX)) return true;
  if (message?.includes('Instagram temporarily blocked')) return true;
  return code === 'RATE_LIMITED' && reason !== 'rate_limit' && reason !== 'validation';
}

export function getBlockedMessage(): string {
  return BLOCKED_PREFIX;
}

export async function getCooldownUntil(): Promise<number> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const until = raw ? Number(raw) : 0;
  if (!until || until <= Date.now()) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return 0;
  }
  return until;
}

export async function getCooldownRemainingMs(): Promise<number> {
  const until = await getCooldownUntil();
  return Math.max(0, until - Date.now());
}

export async function isInCooldown(): Promise<boolean> {
  return (await getCooldownRemainingMs()) > 0;
}

export async function startCooldown(durationMs = INSTAGRAM_COOLDOWN_MS): Promise<number> {
  const until = Date.now() + durationMs;
  await AsyncStorage.setItem(STORAGE_KEY, String(until));
  return until;
}

export async function startCooldownFromApiError(retryAfterSec?: number): Promise<number> {
  const ms =
    retryAfterSec && retryAfterSec > 0 ? retryAfterSec * 1000 : INSTAGRAM_COOLDOWN_MS;
  return startCooldown(ms);
}

export async function clearCooldown(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
