import { track } from './analytics';

export type AdPlacement = 'stories_unlock' | 'highlights_unlock' | 'banner';

/**
 * MVP ad stub. Replace with react-native-google-mobile-ads:
 * - RewardedAd for stories/highlights unlock
 * - BannerAd fixed at screen bottom
 */
export async function showUnlockAd(placement: 'stories_unlock' | 'highlights_unlock'): Promise<boolean> {
  track('ad_impression', { placement });
  await new Promise((r) => setTimeout(r, 800));
  track('ad_completion', { placement });
  return true;
}

export function BannerAdPlaceholder() {
  return null;
}
