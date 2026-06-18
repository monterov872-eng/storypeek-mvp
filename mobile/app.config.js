// Dynamic Expo config layered on top of app.json.
//
// app.json holds the static base config. This file overrides only the values
// that should differ between development and a production store build:
//   - versionCode: explicit integer required by Google Play.
//   - usesCleartextTraffic: allowed in dev/preview (so a local HTTP backend or
//     the Android emulator works), but DISABLED for production builds so all
//     network traffic must use HTTPS. This backs the Play Data Safety
//     "encrypted in transit" declaration.
//
// EAS sets EAS_BUILD_PROFILE during cloud builds (see eas.json profiles).
const isProduction = process.env.EAS_BUILD_PROFILE === 'production';

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    versionCode: 1,
    usesCleartextTraffic: !isProduction,
  },
});
