import { TestIds } from 'react-native-google-mobile-ads';

/**
 * Single source of truth for AdMob unit IDs.
 *
 * - In development (`__DEV__`) or when `EXPO_PUBLIC_USE_TEST_ADS=1`, Google's
 *   official TEST unit IDs are used. Test ads are safe to click, never generate
 *   revenue, and avoid the invalid-traffic policy strikes that would result
 *   from tapping your own live ad units. They are NEVER used in production.
 * - In production builds, the real StoryPeek unit IDs below are used. An
 *   `EXPO_PUBLIC_ADMOB_*` env var may override the default at build time.
 */
const PRODUCTION_AD_UNIT_IDS = {
  banner: 'ca-app-pub-9571654377470287/5137928567',
  rewarded: 'ca-app-pub-9571654377470287/6144878151',
} as const;

const forceTestAds = process.env.EXPO_PUBLIC_USE_TEST_ADS === '1';

export const usingTestAds = __DEV__ || forceTestAds;

function resolveUnitId(
  envOverride: string | undefined,
  productionId: string,
  testId: string,
): string {
  if (usingTestAds) return testId;
  return envOverride || productionId;
}

export const adUnitIds = {
  banner: resolveUnitId(
    process.env.EXPO_PUBLIC_ADMOB_BANNER_ID,
    PRODUCTION_AD_UNIT_IDS.banner,
    TestIds.BANNER,
  ),
  rewarded: resolveUnitId(
    process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID,
    PRODUCTION_AD_UNIT_IDS.rewarded,
    TestIds.REWARDED,
  ),
} as const;
