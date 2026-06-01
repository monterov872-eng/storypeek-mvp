import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StoryItem } from '@/services/api';
import { InstagramBlockedBanner } from '@/components/InstagramBlockedBanner';
import { dataCache } from '@/services/dataCache';
import { isInCooldown } from '@/services/instagramCooldown';
import { useInstagramCooldown } from '@/hooks/useInstagramCooldown';
import { colors } from '@/theme/colors';

const { width, height } = Dimensions.get('window');

export default function StoryViewerScreen() {
  const { username: raw } = useLocalSearchParams<{ username: string }>();
  const username = decodeURIComponent(raw ?? '');
  const router = useRouter();
  const blockCooldown = useInstagramCooldown();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [emptyMsg, setEmptyMsg] = useState<string | null>(null);
  const [showBlock, setShowBlock] = useState(false);

  useEffect(() => {
    (async () => {
      await blockCooldown.refresh();
      if (await isInCooldown()) {
        setShowBlock(true);
        setLoading(false);
        router.replace(`/profile/${encodeURIComponent(username)}`);
        return;
      }

      const cached = await dataCache.getStories(username);
      if (cached && cached.length > 0) {
        setStories(cached);
        setLoading(false);
        return;
      }
      if (cached && cached.length === 0) {
        setEmptyMsg('No stories available right now.');
        setLoading(false);
        return;
      }
      router.replace(`/profile/${encodeURIComponent(username)}`);
    })();
  }, [username, router]);

  const showBlockedBanner = showBlock || blockCooldown.active;
  const current = stories[index];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (showBlockedBanner) {
    return (
      <View style={styles.center}>
        <InstagramBlockedBanner countdownLabel={blockCooldown.countdownLabel} />
      </View>
    );
  }

  if (emptyMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.blocked}>{emptyMsg}</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Back to profile</Text>
        </Pressable>
      </View>
    );
  }

  if (!current) return null;

  const next = () => setIndex((i) => Math.min(i + 1, stories.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  return (
    <View style={styles.container}>
      <Image source={{ uri: current.mediaUrl }} style={styles.media} resizeMode="cover" />

      <View style={styles.progressRow}>
        {stories.map((s, i) => (
          <View key={s.id} style={[styles.progress, i <= index && styles.progressActive]} />
        ))}
      </View>

      <Pressable style={styles.close} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color="#fff" />
      </Pressable>

      <Text style={styles.counter}>
        {index + 1} / {stories.length}
      </Text>

      <View style={styles.tapZones}>
        <Pressable style={styles.tapLeft} onPress={prev} />
        <Pressable style={styles.tapRight} onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  blocked: { color: colors.text, fontSize: 16, textAlign: 'center', lineHeight: 24 },
  backBtn: { marginTop: 24, padding: 12 },
  backText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  media: { width, height },
  progressRow: {
    position: 'absolute',
    top: 52,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
  },
  progress: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  progressActive: { backgroundColor: '#fff' },
  close: { position: 'absolute', top: 48, right: 16, padding: 8 },
  counter: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1 },
});
