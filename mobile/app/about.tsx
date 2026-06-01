import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';

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
        <Text style={styles.version}>Version 1.0.0 (MVP)</Text>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimer}>
            This app is not affiliated with Instagram or Meta. We do not collect Instagram
            usernames or passwords. Only public profiles are supported.
          </Text>
        </View>

        <Section
          title="Terms of Use"
          body="[Placeholder] By using StoryPeek you agree to use the app only for lawful purposes and to view only publicly available content. Content belongs to its respective owners."
        />
        <Section
          title="Privacy Policy"
          body="[Placeholder] We store a random device identifier for rate limiting and unlock sessions. We do not store Instagram credentials. Analytics and ads may collect data per their providers' policies."
        />
        <Section
          title="Contact"
          body="[Placeholder] support@storypeek.app"
        />
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  disclaimer: { color: colors.text, lineHeight: 20, fontSize: 14 },
  section: { marginBottom: 20 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '600', marginBottom: 8 },
  body: { color: colors.textMuted, lineHeight: 22, fontSize: 14 },
});
