import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '@/theme/colors';
import { track } from '@/services/analytics';
import { initializeAds } from '@/services/ads';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    track('app_open');
    void initializeAds();
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ title: 'Silent View' }} />
        <Stack.Screen name="profile/[username]" options={{ title: 'Profile' }} />
        <Stack.Screen name="stories/[username]" options={{ title: 'Stories', presentation: 'fullScreenModal' }} />
        <Stack.Screen
          name="highlight/[username]/[id]"
          options={{ title: 'Highlight', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="about" options={{ title: 'About & Legal' }} />
        <Stack.Screen name="error" options={{ title: 'Error', presentation: 'modal' }} />
      </Stack>
    </>
  );
}
