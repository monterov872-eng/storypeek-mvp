import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

/** Replace with AdMob BannerAd in production */
export function BannerAdSlot() {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Ad space</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 50,
    backgroundColor: colors.bannerAd,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: colors.textMuted, fontSize: 12 },
});
