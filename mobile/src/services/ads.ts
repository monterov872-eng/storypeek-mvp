import mobileAds, {
  AdEventType,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import { adUnitIds } from '@/config/ads';
import { track } from './analytics';

export type AdPlacement = 'stories_unlock' | 'highlights_unlock' | 'banner';

let initPromise: Promise<void> | null = null;

// --- Rewarded ad lifecycle -------------------------------------------------

let rewarded: RewardedAd | null = null;
let rewardedLoaded = false;
let rewardedLoading = false;
let unsubscribers: (() => void)[] = [];

function clearListeners() {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
}

/** Create and load a fresh rewarded ad (no-op if one is already loading/ready). */
export function preloadRewarded(): void {
  if (rewardedLoading || rewardedLoaded) return;

  rewardedLoading = true;
  clearListeners();

  const ad = RewardedAd.createForAdRequest(adUnitIds.rewarded, {
    requestNonPersonalizedAdsOnly: true,
  });

  unsubscribers.push(
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedLoaded = true;
      rewardedLoading = false;
    }),
  );
  unsubscribers.push(
    ad.addAdEventListener(AdEventType.ERROR, () => {
      rewardedLoaded = false;
      rewardedLoading = false;
      rewarded = null;
    }),
  );

  rewarded = ad;
  ad.load();
}

// --- SDK initialization ----------------------------------------------------

/**
 * Initialize the Google Mobile Ads SDK exactly once. Safe to call on every
 * app launch; subsequent calls return the same in-flight/resolved promise.
 */
export function initializeAds(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = mobileAds()
    .setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.PG,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    })
    .then(() => mobileAds().initialize())
    .then(() => {
      if (__DEV__) console.log('[ads] Mobile Ads SDK initialized');
      preloadRewarded();
    })
    .catch((e) => {
      if (__DEV__) console.warn('[ads] initialization failed', e);
      // Reset so a later launch can retry initialization.
      initPromise = null;
    });

  return initPromise;
}

// --- Public API ------------------------------------------------------------

/**
 * Show a rewarded ad before unlocking stories/highlights.
 *
 * Resolves `true` when the unlock should proceed:
 *  - the user watched the ad and earned the reward, OR
 *  - no ad could be shown (offline / no fill / load error) — we fall back to
 *    granting access so the core feature is never permanently blocked.
 *
 * Resolves `false` only when an ad WAS shown but the user dismissed it before
 * earning the reward.
 */
export function showUnlockAd(
  placement: 'stories_unlock' | 'highlights_unlock',
): Promise<boolean> {
  track('ad_impression', { placement });

  const ad = rewarded;
  if (!ad || !rewardedLoaded) {
    // Nothing ready to show — keep the app usable and preload for next time.
    preloadRewarded();
    track('ad_completion', { placement, fallback: true });
    return Promise.resolve(true);
  }

  return new Promise<boolean>((resolve) => {
    let earned = false;
    let settled = false;
    const localSubs: (() => void)[] = [];

    const finish = (granted: boolean) => {
      if (settled) return;
      settled = true;
      localSubs.forEach((u) => u());
      // This ad instance is spent; reset and queue the next one.
      rewarded = null;
      rewardedLoaded = false;
      preloadRewarded();
      resolve(granted);
    };

    localSubs.push(
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
        track('ad_completion', { placement });
      }),
    );
    localSubs.push(
      ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned)),
    );
    localSubs.push(
      // If showing fails, fall back to granting rather than blocking.
      ad.addAdEventListener(AdEventType.ERROR, () => finish(true)),
    );

    ad.show().catch(() => finish(true));
  });
}
