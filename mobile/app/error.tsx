import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ApiErrorCode, ApiErrorReason } from '@/services/api';
import { getErrorCopy } from '@/services/errorMessages';
import {
  isBlockedErrorParams,
} from '@/services/blockErrors';
import { track } from '@/services/analytics';
import { colors } from '@/theme/colors';
import { useEffect } from 'react';

export default function ErrorScreen() {
  const { code, reason, username } = useLocalSearchParams<{
    code?: string;
    reason?: string;
    username?: string;
  }>();
  const router = useRouter();

  const errorCode = (code as ApiErrorCode) ?? 'SERVICE_UNAVAILABLE';
  const errorReason = reason as ApiErrorReason | undefined;

  const copy = getErrorCopy({
    code: errorCode,
    reason: errorReason,
    message: '',
  });

  const isBlocked = isBlockedErrorParams(code, errorReason);

  useEffect(() => {
    if (isBlocked) {
      if (username) {
        router.replace(`/profile/${encodeURIComponent(username)}`);
      } else {
        router.replace('/home');
      }
      return;
    }
    track('error', { code: code ?? 'unknown', username: username ?? '' });
  }, [code, username, isBlocked, router]);

  if (isBlocked) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.message}>Returning to profile…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.center}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.message}>{copy.message}</Text>
        {username ? <Text style={styles.user}>@{username}</Text> : null}
        <PrimaryButton label="Go back" onPress={() => router.back()} style={styles.btn} />
        <PrimaryButton
          label="Search again"
          variant="secondary"
          onPress={() => router.replace('/home')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', paddingBottom: 40 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: 12 },
  message: { color: colors.textMuted, fontSize: 16, lineHeight: 24 },
  user: { color: colors.accent, marginTop: 12, fontSize: 15 },
  btn: { marginTop: 28 },
});
