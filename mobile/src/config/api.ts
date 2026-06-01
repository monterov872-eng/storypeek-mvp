import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Android emulator maps host machine localhost to 10.0.2.2 */
const DEV_DEFAULT =
  Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  DEV_DEFAULT;
