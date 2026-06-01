import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_KEY = 'storypeek_device_id';

function randomId(): string {
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const id = randomId();
  await AsyncStorage.setItem(DEVICE_KEY, id);
  return id;
}
