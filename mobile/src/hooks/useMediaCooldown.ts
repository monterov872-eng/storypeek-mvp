import { useCallback, useEffect, useState } from 'react';
import {
  formatMediaCooldownLabel,
  getMediaCooldownRemainingMs,
  startMediaCooldown,
  startMediaCooldownFromRetryAfter,
} from '@/services/mediaCooldown';
import { ApiError } from '@/services/api';

export function useMediaCooldown(username: string) {
  const [remainingSec, setRemainingSec] = useState(0);

  const refresh = useCallback(async () => {
    if (!username) {
      setRemainingSec(0);
      return;
    }
    const ms = await getMediaCooldownRemainingMs(username);
    setRemainingSec(Math.ceil(ms / 1000));
  }, [username]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  const active = remainingSec > 0;

  const markRequestStarted = useCallback(async () => {
    await startMediaCooldown(username);
    await refresh();
  }, [username, refresh]);

  const applyRateLimitFromError = useCallback(
    async (err: ApiError) => {
      if (err.code === 'RATE_LIMITED' && err.reason === 'rate_limit') {
        await startMediaCooldownFromRetryAfter(username, err.retryAfter);
        await refresh();
        return true;
      }
      return false;
    },
    [username, refresh],
  );

  return {
    active,
    remainingSec,
    countdownLabel: formatMediaCooldownLabel(remainingSec),
    refresh,
    markRequestStarted,
    applyRateLimitFromError,
  };
}
