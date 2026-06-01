import { useCallback, useEffect, useState } from 'react';
import {
  formatCountdown,
  getBlockedMessage,
  getCooldownRemainingMs,
  isInCooldown,
  startCooldownFromApiError,
} from '@/services/instagramCooldown';
import { isBlockedApiError } from '@/services/blockErrors';
import { ApiError } from '@/services/api';

export function useInstagramCooldown() {
  const [remainingSec, setRemainingSec] = useState(0);

  const refresh = useCallback(async () => {
    const ms = await getCooldownRemainingMs();
    setRemainingSec(Math.ceil(ms / 1000));
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  const active = remainingSec > 0;

  const applyBlockFromError = useCallback(async (err: ApiError) => {
    if (!isBlockedApiError(err)) return false;
    const until = await startCooldownFromApiError(err.retryAfter);
    setRemainingSec(Math.max(1, Math.ceil((until - Date.now()) / 1000)));
    return true;
  }, []);

  return {
    active,
    remainingSec,
    countdownLabel: formatCountdown(remainingSec),
    blockedMessage: getBlockedMessage(),
    refresh,
    applyBlockFromError,
    isInCooldown,
  };
}
