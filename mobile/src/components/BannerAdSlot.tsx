import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { colors } from '@/theme/colors';
import { adUnitIds } from '@/config/ads';

/** Anchored adaptive AdMob banner pinned at the bottom of a screen. */
export function BannerAdSlot() {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <View style={styles.banner}>
      <BannerAd
        unitId={adUnitIds.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.bannerAd,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
