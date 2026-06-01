import { StyleSheet, Text } from 'react-native';
import { colors } from '@/theme/colors';

export function DisclaimerFooter() {
  return (
    <Text style={styles.text}>This app is not affiliated with Instagram or Meta.</Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 12,
    marginBottom: 8,
  },
});
