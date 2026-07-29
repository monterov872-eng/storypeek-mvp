import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { BannerAdSlot } from '@/components/BannerAdSlot';
import { DisclaimerFooter } from '@/components/DisclaimerFooter';
import { colors } from '@/theme/colors';
import { track } from '@/services/analytics';
import { API_URL } from '@/config/api';
import { api, ApiError } from '@/services/api';
import { dataCache } from '@/services/dataCache';
import { getErrorCopy } from '@/services/errorMessages';

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeUsername, setActiveUsername] = useState<string | null>(null);

  const search = async () => {
    const username = query.trim().replace(/^@/, '');
    if (!username || searching) return;

    setSearching(true);
    setSearchError(null);
    setActiveUsername(username);
    track('search', { username });

    try {
      const res = await api.getProfile(username);
      await dataCache.setProfile(username, res);
      router.push(`/profile/${encodeURIComponent(username)}`);
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError({
        code: 'SERVICE_UNAVAILABLE',
        message: e instanceof Error ? e.message : 'Search failed',
      });
      track('search_failed', { username, code: err.code, reason: err.reason ?? '' });
      setSearchError(getErrorCopy(err).message);
    } finally {
      setSearching(false);
      setActiveUsername(null);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <Screen style={{ paddingBottom: 0 }} edges={['top']}>
        <View style={styles.hero}>
          <Text style={styles.title}>Find public profiles</Text>
          <Text style={styles.subtitle}>Search a username to view public stories and highlights.</Text>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={search}
          editable={!searching}
        />

        <PrimaryButton label="Search" onPress={search} loading={searching} style={styles.cta} />

        {searching && activeUsername ? (
          <View style={styles.searchingRow}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.searchingText}>Searching @{activeUsername}…</Text>
          </View>
        ) : null}

        {searchError ? <Text style={styles.searchError}>{searchError}</Text> : null}

        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>Try public accounts</Text>
          <Text style={styles.hint}>natgeo · nasa · instagram</Text>
          <Text style={styles.apiHint}>API: {API_URL}</Text>
        </View>

        <View style={styles.spacer} />
        <DisclaimerFooter />
      </Screen>
      <BannerAdSlot />
    </>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: 8, marginBottom: 24 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: colors.textMuted, marginTop: 8, fontSize: 15, lineHeight: 22 },
  cta: { marginTop: 16 },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    justifyContent: 'center',
  },
  searchingText: { color: colors.textMuted, fontSize: 14 },
  searchError: { color: colors.danger, marginTop: 12, lineHeight: 20, fontSize: 14 },
  hintCard: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hintTitle: { color: colors.text, fontWeight: '600', marginBottom: 6 },
  hint: { color: colors.textMuted, fontSize: 14 },
  apiHint: { color: colors.textMuted, fontSize: 11, marginTop: 10, opacity: 0.7 },
  spacer: { flex: 1 },
});
