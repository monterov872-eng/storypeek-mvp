import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  title: string;
  coverUrl: string;
  onPress: () => void;
  disabled?: boolean;
}

export function HighlightCircle({ title, coverUrl, onPress, disabled }: Props) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.wrap, disabled && styles.disabled]}>
      <View style={styles.ring}>
        <Image source={{ uri: coverUrl }} style={styles.image} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 76, alignItems: 'center' },
  disabled: { opacity: 0.45 },
  ring: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  image: { width: '100%', height: '100%', borderRadius: 30 },
  title: { marginTop: 6, color: colors.textMuted, fontSize: 12, maxWidth: 72 },
});
