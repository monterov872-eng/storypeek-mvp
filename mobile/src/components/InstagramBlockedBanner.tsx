import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  countdownLabel: string;
}

export function InstagramBlockedBanner({ countdownLabel }: Props) {
  return (
    <View style={styles.banner}>
      <Text style={styles.title}>
        Instagram temporarily blocked requests. Try again in {countdownLabel}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#3a1212',
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.danger,
    padding: 14,
    marginTop: 0,
    marginHorizontal: -20,
    marginBottom: 12,
  },
  title: { color: '#ffb4b4', fontSize: 14, fontWeight: '600', lineHeight: 20 },
});
