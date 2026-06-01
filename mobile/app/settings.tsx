import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { DisclaimerFooter } from '@/components/DisclaimerFooter';
import { colors } from '@/theme/colors';

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <Screen>
      <Text style={styles.heading}>Settings</Text>
      <View style={styles.card}>
        <Row label="About & Legal" onPress={() => router.push('/about')} />
        <Row label="Language" onPress={() => {}} />
      </View>
      <Text style={styles.note}>English (Spanish coming soon)</Text>
      <DisclaimerFooter />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 8, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.text, fontSize: 16 },
  note: { color: colors.textMuted, marginTop: 16, fontSize: 14 },
});
