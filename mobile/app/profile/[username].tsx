import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { HighlightCircle } from '@/components/HighlightCircle';
import { BannerAdSlot } from '@/components/BannerAdSlot';
import { DisclaimerFooter } from '@/components/DisclaimerFooter';
import { InstagramBlockedBanner } from '@/components/InstagramBlockedBanner';
import {
  api,
  ApiError,
  HighlightSummary,
  Profile,
  StoryItem,
  UnlockStatus,
} from '@/services/api';
import { dataCache } from '@/services/dataCache';
import { getErrorCopy } from '@/services/errorMessages';
import { isBlockedApiError } from '@/services/blockErrors';
import { isInCooldown } from '@/services/instagramCooldown';
import { useInstagramCooldown } from '@/hooks/useInstagramCooldown';
import { useMediaCooldown } from '@/hooks/useMediaCooldown';
import { showUnlockAd } from '@/services/ads';
import { track } from '@/services/analytics';
import { colors } from '@/theme/colors';

function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  return new ApiError({
    code: 'SERVICE_UNAVAILABLE',
    message: e instanceof Error ? e.message : 'Request failed',
  });
}

async function hydrateProfileFromCache(username: string): Promise<{
  profile: Profile;
  unlock: UnlockStatus;
} | null> {
  const cached = await dataCache.getProfile(username);
  if (!cached) return null;
  return cached;
}

export default function ProfileScreen() {
  const { username: raw } = useLocalSearchParams<{ username: string }>();
  const username = decodeURIComponent(raw ?? '');
  const router = useRouter();
  const blockCooldown = useInstagramCooldown();
  const mediaCooldown = useMediaCooldown(username);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unlock, setUnlock] = useState<UnlockStatus | null>(null);
  const [highlights, setHighlights] = useState<HighlightSummary[]>([]);
  const [highlightsLoaded, setHighlightsLoaded] = useState(false);
  const [unlocking, setUnlocking] = useState<'stories' | 'highlights' | null>(null);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [fetchingStories, setFetchingStories] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [blockedUi, setBlockedUi] = useState(false);

  const storiesInFlight = useRef(false);
  const highlightsInFlight = useRef(false);

  const showBlockedBanner = blockCooldown.active || blockedUi;

  const applyCachedProfile = useCallback(async () => {
    const cached = await hydrateProfileFromCache(username);
    if (!cached) return false;
    setProfile(cached.profile);
    setUnlock(cached.unlock);
    const cachedHighlights = await dataCache.getHighlights(username);
    if (cachedHighlights) {
      setHighlights(cachedHighlights);
      setHighlightsLoaded(true);
    }
    return true;
  }, [username]);

  const handleBlockError = useCallback(
    async (err: ApiError) => {
      if (!isBlockedApiError(err)) return false;
      await blockCooldown.applyBlockFromError(err);
      setBlockedUi(true);
      await applyCachedProfile();
      setInlineError(null);
      return true;
    },
    [applyCachedProfile, blockCooldown],
  );

  const handleApiError = useCallback(
    async (err: ApiError) => {
      if (await handleBlockError(err)) return true;
      if (await mediaCooldown.applyRateLimitFromError(err)) return true;
      return false;
    },
    [handleBlockError, mediaCooldown],
  );

  const goError = useCallback(
    (err: ApiError) => {
      if (isBlockedApiError(err)) return;
      if (profile) return;
      track('profile_load_failed', { username, code: err.code });
      router.replace({
        pathname: '/error',
        params: { code: err.code, reason: err.reason ?? '', username },
      });
    },
    [router, username, profile],
  );

  const load = useCallback(async () => {
    setInlineError(null);

    if (await applyCachedProfile()) {
      setLoading(false);
      await blockCooldown.refresh();
      setBlockedUi(await isInCooldown());
      return;
    }

    if (await isInCooldown()) {
      await blockCooldown.refresh();
      setBlockedUi(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.getProfile(username);
      setProfile(res.profile);
      setUnlock(res.unlock);
      setHighlights([]);
      setHighlightsLoaded(false);
      await dataCache.setProfile(username, res);
      track('profile_load_success', { username });
    } catch (e) {
      const err = toApiError(e);
      if (await handleApiError(err)) return;
      if (err.code === 'RATE_LIMITED' || err.code === 'SERVICE_UNAVAILABLE') {
        if (await handleBlockError(err)) return;
        setInlineError(getErrorCopy(err).message);
        return;
      }
      goError(err);
    } finally {
      setLoading(false);
    }
  }, [username, goError, handleApiError, handleBlockError, applyCachedProfile, blockCooldown]);

  const fetchStories = useCallback(async (): Promise<StoryItem[] | null> => {
    if (storiesInFlight.current || showBlockedBanner || mediaCooldown.active) return null;

    const cached = await dataCache.getStories(username);
    if (cached) return cached;

    storiesInFlight.current = true;
    setFetchingStories(true);
    setInlineError(null);

    try {
      await mediaCooldown.markRequestStarted();
      const res = await api.getStories(username);
      await dataCache.setStories(username, res.stories);
      return res.stories;
    } catch (e) {
      const err = toApiError(e);
      if (await handleApiError(err)) return null;
      setInlineError(getErrorCopy(err).message);
      return null;
    } finally {
      storiesInFlight.current = false;
      setFetchingStories(false);
    }
  }, [username, showBlockedBanner, mediaCooldown, handleApiError]);

  const loadHighlights = useCallback(async () => {
    if (highlightsInFlight.current || !profile || showBlockedBanner || mediaCooldown.active) {
      return;
    }

    const cached = await dataCache.getHighlights(profile.username);
    if (cached) {
      setHighlights(cached);
      setHighlightsLoaded(true);
      return;
    }

    highlightsInFlight.current = true;
    setLoadingHighlights(true);
    setInlineError(null);

    try {
      await mediaCooldown.markRequestStarted();
      const h = await api.getHighlights(profile.username);
      setHighlights(h.highlights);
      setHighlightsLoaded(true);
      await dataCache.setHighlights(profile.username, h.highlights);
    } catch (e) {
      const err = toApiError(e);
      if (await handleApiError(err)) return;
      setInlineError(getErrorCopy(err).message);
    } finally {
      highlightsInFlight.current = false;
      setLoadingHighlights(false);
    }
  }, [profile, showBlockedBanner, mediaCooldown, handleApiError]);

  useEffect(() => {
    void (async () => {
      await blockCooldown.refresh();
      setBlockedUi(await isInCooldown());
      await load();
    })();
  }, [username]);

  useEffect(() => {
    if (!blockCooldown.active) {
      void isInCooldown().then((active) => setBlockedUi(active));
    }
  }, [blockCooldown.remainingSec, blockCooldown.active]);

  const unlockStories = async () => {
    if (!profile || showBlockedBanner || mediaCooldown.active || storiesInFlight.current) return;
    setUnlocking('stories');
    setInlineError(null);
    const ok = await showUnlockAd('stories_unlock');
    if (ok) {
      try {
        await api.unlock(profile.username, 'stories');
        track('story_unlock', { username: profile.username });
        setUnlock((u) => (u ? { ...u, storiesUnlocked: true } : u));
        const stories = await fetchStories();
        if (stories && stories.length > 0) {
          router.push(`/stories/${encodeURIComponent(profile.username)}`);
        } else if (stories && stories.length === 0) {
          setInlineError('No stories available right now.');
        }
      } catch (e) {
        const err = toApiError(e);
        if (await handleApiError(err)) return;
        setInlineError(getErrorCopy(err).message);
      }
    }
    setUnlocking(null);
  };

  const unlockHighlights = async () => {
    if (!profile || showBlockedBanner || mediaCooldown.active) return;
    setUnlocking('highlights');
    setInlineError(null);
    const ok = await showUnlockAd('highlights_unlock');
    if (ok) {
      try {
        await api.unlock(profile.username, 'highlights');
        track('highlight_unlock', { username: profile.username });
        setUnlock((u) => (u ? { ...u, highlightsUnlocked: true } : u));
      } catch (e) {
        const err = toApiError(e);
        if (await handleApiError(err)) return;
        setInlineError(getErrorCopy(err).message);
      }
    }
    setUnlocking(null);
  };

  const openStories = async () => {
    if (!profile || showBlockedBanner || mediaCooldown.active || storiesInFlight.current) return;
    if (!unlock?.storiesUnlocked) {
      await unlockStories();
      return;
    }

    const stories = await fetchStories();
    if (stories && stories.length > 0) {
      router.push(`/stories/${encodeURIComponent(profile.username)}`);
    } else if (stories && stories.length === 0) {
      setInlineError('No stories available right now.');
    }
  };

  const openHighlight = (id: string) => {
    if (showBlockedBanner || mediaCooldown.active) return;
    router.push(`/highlight/${encodeURIComponent(username)}/${encodeURIComponent(id)}`);
  };

  const mediaLocked = showBlockedBanner || mediaCooldown.active;
  const mediaCountdown = showBlockedBanner
    ? blockCooldown.countdownLabel
    : mediaCooldown.countdownLabel;

  const storiesButtonLabel = () => {
    if (showBlockedBanner) return `Blocked · ${blockCooldown.countdownLabel}`;
    if (mediaCooldown.active) return `Wait · ${mediaCooldown.countdownLabel}`;
    if (unlock?.storiesUnlocked) return 'View Stories';
    return 'Watch ad · Unlock Stories';
  };

  const highlightsButtonLabel = () => {
    if (showBlockedBanner) return `Blocked · ${blockCooldown.countdownLabel}`;
    if (mediaCooldown.active) return `Wait · ${mediaCooldown.countdownLabel}`;
    if (loadingHighlights) return 'Loading…';
    return 'Load highlights';
  };

  if (loading && !profile && !showBlockedBanner) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        <Text style={styles.loadingText}>Loading @{username}…</Text>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen edges={['top']}>
        <Text style={styles.searching}>@{username}</Text>
        {showBlockedBanner ? (
          <InstagramBlockedBanner countdownLabel={blockCooldown.countdownLabel} />
        ) : (
          <>
            <Text style={styles.inlineError}>{inlineError ?? 'Could not load profile.'}</Text>
            <PrimaryButton label="Retry" onPress={load} style={{ marginTop: 16 }} />
          </>
        )}
      </Screen>
    );
  }

  return (
    <>
      <Screen edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {showBlockedBanner ? (
            <InstagramBlockedBanner countdownLabel={blockCooldown.countdownLabel} />
          ) : null}

          <View style={styles.card}>
            <Image source={{ uri: profile.profilePictureUrl }} style={styles.avatar} />
            <Text style={styles.username}>@{profile.username}</Text>
            <Text style={styles.fullName}>{profile.fullName}</Text>
            {profile.biography ? <Text style={styles.bio}>{profile.biography}</Text> : null}
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>
                {profile.storyCount > 0 ? profile.storyCount : '—'}
              </Text>
              <Text style={styles.statLabel}>Stories</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile.highlightCount}</Text>
              <Text style={styles.statLabel}>Highlights</Text>
            </View>
          </View>

          <PrimaryButton
            label={storiesButtonLabel()}
            onPress={openStories}
            loading={unlocking === 'stories' || fetchingStories}
            disabled={mediaLocked}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Highlights</Text>
            {unlock?.highlightsUnlocked ? (
              highlightsLoaded && highlights.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hRow}>
                  {highlights.map((h) => (
                    <HighlightCircle
                      key={h.id}
                      title={h.title}
                      coverUrl={h.coverUrl}
                      onPress={() => openHighlight(h.id)}
                      disabled={mediaLocked}
                    />
                  ))}
                </ScrollView>
              ) : (
                <PrimaryButton
                  label={highlightsButtonLabel()}
                  variant="secondary"
                  onPress={loadHighlights}
                  loading={loadingHighlights}
                  disabled={mediaLocked}
                />
              )
            ) : profile.highlightCount > 0 ? (
              <PrimaryButton
                label={
                  showBlockedBanner || mediaCooldown.active
                    ? `Unlock · ${mediaCountdown}`
                    : 'Watch ad · Unlock Highlights'
                }
                variant="secondary"
                onPress={unlockHighlights}
                loading={unlocking === 'highlights'}
                disabled={mediaLocked}
              />
            ) : (
              <Text style={styles.muted}>No highlights on this profile.</Text>
            )}
          </View>

          {inlineError && !showBlockedBanner ? (
            <Text style={styles.inlineError}>{inlineError}</Text>
          ) : null}

          <DisclaimerFooter />
        </ScrollView>
      </Screen>
      <BannerAdSlot />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  searching: { color: colors.textMuted, fontSize: 16, marginBottom: 12 },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surfaceElevated },
  username: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 14 },
  fullName: { color: colors.textMuted, marginTop: 4 },
  bio: { color: colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: 12, marginVertical: 20 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNum: { color: colors.text, fontSize: 22, fontWeight: '700' },
  statLabel: { color: colors.textMuted, marginTop: 4 },
  section: { marginTop: 8 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  hRow: { flexGrow: 0 },
  muted: { color: colors.textMuted, marginTop: 8, fontSize: 13 },
  loadingText: { color: colors.textMuted, textAlign: 'center', marginTop: 12 },
  inlineError: { color: colors.danger, marginTop: 12, lineHeight: 20, fontSize: 14 },
});
