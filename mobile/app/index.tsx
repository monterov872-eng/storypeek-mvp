import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { DisclaimerFooter } from '@/components/DisclaimerFooter';

export default function SplashRoute() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/home'), 1400);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <LinearGradient colors={['#0A0A0F', '#14102A', '#0A0A0F']} style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.logo}>Silent View</Text>
        <Text style={styles.tagline}>Public stories. No login.</Text>
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      </View>
      <DisclaimerFooter />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', padding: 24, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { color: colors.text, fontSize: 36, fontWeight: '700', letterSpacing: -0.5 },
  tagline: { color: colors.textMuted, marginTop: 8, fontSize: 15 },
  loader: { marginTop: 28 },
});
