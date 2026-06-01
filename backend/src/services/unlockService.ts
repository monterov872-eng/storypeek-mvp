type UnlockType = 'stories' | 'highlights';

interface UnlockRecord {
  storiesUntil?: number;
  highlightsUntil?: number;
}

const UNLOCK_TTL_MS = 12 * 60 * 1000; // 12 minutes (within 10–15 min requirement)
const store = new Map<string, UnlockRecord>();

function key(deviceId: string, username: string): string {
  return `${deviceId}:${username.toLowerCase()}`;
}

export function grantUnlock(
  deviceId: string,
  username: string,
  type: UnlockType,
): { expiresAt: string } {
  const k = key(deviceId, username);
  const record = store.get(k) ?? {};
  const until = Date.now() + UNLOCK_TTL_MS;

  if (type === 'stories') record.storiesUntil = until;
  else record.highlightsUntil = until;

  store.set(k, record);
  return { expiresAt: new Date(until).toISOString() };
}

export function hasUnlock(deviceId: string, username: string, type: UnlockType): boolean {
  const record = store.get(key(deviceId, username));
  if (!record) return false;
  const until = type === 'stories' ? record.storiesUntil : record.highlightsUntil;
  return typeof until === 'number' && until > Date.now();
}

export function getUnlockStatus(deviceId: string, username: string) {
  const record = store.get(key(deviceId, username)) ?? {};
  const now = Date.now();
  return {
    storiesUnlocked: (record.storiesUntil ?? 0) > now,
    highlightsUnlocked: (record.highlightsUntil ?? 0) > now,
    storiesExpiresAt: record.storiesUntil ? new Date(record.storiesUntil).toISOString() : null,
    highlightsExpiresAt: record.highlightsUntil
      ? new Date(record.highlightsUntil).toISOString()
      : null,
  };
}
