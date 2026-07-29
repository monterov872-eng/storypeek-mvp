import { Platform } from 'react-native';
import Constants from 'expo-constants';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/** Production API (Render). Used for store builds when EXPO_PUBLIC_API_URL is unset. */
export const PRODUCTION_API_URL = 'https://storypeek-mvp.onrender.com';

/** Local dev default when EXPO_PUBLIC_API_URL is not set. */
function devDefaultUrl(): string {
  // Android emulator cannot use localhost — it maps the host PC to 10.0.2.2.
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:3001'
    : 'http://localhost:3001';
}

/**
 * Resolve the API base URL:
 * - EXPO_PUBLIC_API_URL (from .env or EAS build env) always wins when set.
 * - In development, falls back to local emulator/simulator defaults.
 * - In production builds, uses EXPO_PUBLIC_API_URL from EAS (HTTPS Render URL).
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return stripTrailingSlash(fromEnv);

  if (__DEV__) {
    return devDefaultUrl();
  }

  const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (fromExtra) return stripTrailingSlash(fromExtra);

  return PRODUCTION_API_URL;
}

export const API_URL = resolveApiUrl();
