import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError, StoryItem } from '@/services/api';
import { isBlockedApiError } from '@/services/blockErrors';
import { isInCooldown } from '@/services/instagramCooldown';
import { useInstagramCooldown } from '@/hooks/useInstagramCooldown';
import { colors } from '@/theme/colors';

const { width, height } = Dimensions.get('window');

export default function HighlightViewerScreen() {
  const { username: rawUser, id: rawId } = useLocalSearchParams<{ username: string; id: string }>();
  const username = decodeURIComponent(rawUser ?? '');
  const id = decodeURIComponent(rawId ?? '');
  const router = useRouter();
  const blockCooldown = useInstagramCooldown();
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<StoryItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await blockCooldown.refresh();
      if (await isInCooldown()) {
        router.replace(`/profile/${encodeURIComponent(username)}`);
        return;
      }

      try {
        const res = await api.getHighlight(username, id);
        setTitle(res.highlight.title);
        setItems(res.highlight.items);
      } catch (e) {
        const err =
          e instanceof ApiError
            ? e
            : new ApiError({ code: 'SERVICE_UNAVAILABLE', message: 'Failed' });
        if (isBlockedApiError(err)) {
          await blockCooldown.applyBlockFromError(err);
          router.replace(`/profile/${encodeURIComponent(username)}`);
          return;
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [username, id, router, blockCooldown]);

  const current = items[index];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.center}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Back to profile</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: current.mediaUrl }} style={styles.media} resizeMode="cover" />
      <Pressable style={styles.close} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color="#fff" />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.counter}>
        {index + 1} / {items.length}
      </Text>
      <View style={styles.tapZones}>
        <Pressable style={styles.flex} onPress={() => setIndex((i) => Math.max(0, i - 1))} />
        <Pressable
          style={styles.flex}
          onPress={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  backBtn: { padding: 12 },
  backText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  media: { width, height },
  close: { position: 'absolute', top: 48, right: 16, padding: 8 },
  title: { position: 'absolute', top: 52, left: 16, color: '#fff', fontSize: 16, fontWeight: '600' },
  counter: { position: 'absolute', bottom: 48, alignSelf: 'center', color: 'rgba(255,255,255,0.8)' },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  flex: { flex: 1 },
});
