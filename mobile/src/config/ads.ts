import { TestIds } from 'react-native-google-mobile-ads';

/**
 * Single source of truth for AdMob unit IDs.
 *
 * - In development (`__DEV__`) or when `EXPO_PUBLIC_USE_TEST_ADS=1`, Google's
 *   official TEST unit IDs are used. Test ads are always safe to click and
 *   never generate revenue or risk a policy strike.
 * - In production builds, the real unit IDs are read from env vars. If a
 *   production ID is missing, we fall back to the test ID so the app never
 *   crashes or requests a live ad with an empty unit ID.
 *
 * To go live, set these in your EAS build env / `.env`:
 *   EXPO_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-XXXX/XXXX
 *   EXPO_PUBLIC_ADMOB_REWARDED_ID=ca-app-pub-XXXX/XXXX
 *   EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXX/XXXX
 * and ensure EXPO_PUBLIC_USE_TEST_ADS is NOT set to "1".
 */
const forceTestAds = process.env.EXPO_PUBLIC_USE_TEST_ADS === '1';

export const usingTestAds = __DEV__ || forceTestAds;

function resolveUnitId(productionId: string | undefined, testId: string): string {
  if (usingTestAds || !productionId) {
    return testId;
  }
  return productionId;
}

export const adUnitIds = {
  banner: resolveUnitId(process.env.EXPO_PUBLIC_ADMOB_BANNER_ID, TestIds.BANNER),
  rewarded: resolveUnitId(process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID, TestIds.REWARDED),
  interstitial: resolveUnitId(
    process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID,
    TestIds.INTERSTITIAL,
  ),
} as const;
