// Dynamic Expo config layered on top of app.json.
//
// app.json holds the static base config. This file overrides only the values
// that should differ between development and a production store build:
//   - versionCode: explicit integer required by Google Play.
//   - usesCleartextTraffic: allowed in dev/preview (so a local HTTP backend or
//     the Android emulator works), but DISABLED for production builds so all
//     network traffic must use HTTPS. This backs the Play Data Safety
//     "encrypted in transit" declaration.
//   - extra.apiUrl: production API URL from EXPO_PUBLIC_API_URL (Render HTTPS).
//
// EAS sets EAS_BUILD_PROFILE during cloud builds (see eas.json profiles).
const isProduction = process.env.EAS_BUILD_PROFILE === 'production';
const PRODUCTION_API_URL = 'https://storypeek-mvp.onrender.com';

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL || (isProduction ? PRODUCTION_API_URL : undefined),
  },
  android: {
    ...config.android,
    versionCode: 1,
    usesCleartextTraffic: !isProduction,
  },
});
