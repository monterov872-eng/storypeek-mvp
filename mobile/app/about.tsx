import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import {
  disclaimer,
  privacyPolicy,
  PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
  termsOfUse,
} from '@/content/legal';

function Section({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

export default function AboutScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.appName}>StoryPeek</Text>
        <Text style={styles.version}>Version 1.0.0</Text>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimer}>
            This app is not affiliated with Instagram or Meta. We do not collect Instagram
            usernames or passwords. Only public profiles are supported.
          </Text>
        </View>

        <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}>
          <Text style={styles.link}>View privacy policy online</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}>
          <Text style={styles.link}>Contact support</Text>
        </Pressable>

        <Section title="Privacy Policy" body={privacyPolicy} />
        <Section title="Terms of Use" body={termsOfUse} />
        <Section title="Disclaimer" body={disclaimer} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  appName: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 8 },
  version: { color: colors.textMuted, marginTop: 4, marginBottom: 20 },
  disclaimerBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  disclaimer: { color: colors.text, lineHeight: 20, fontSize: 14 },
  link: { color: colors.accent, fontSize: 15, fontWeight: '600', marginBottom: 12 },
  section: { marginBottom: 20, marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '600', marginBottom: 8 },
  body: { color: colors.textMuted, lineHeight: 22, fontSize: 14 },
});
