// Dynamic Expo config layered on top of app.json.
//
// app.json holds the static base config. This file overrides only the values
// that should differ between development and a production store build:
//   - versionCode: explicit integer required by Google Play.
//   - usesCleartextTraffic: allowed in dev/preview via expo-build-properties
//     (local HTTP backend / Android emulator), disabled for production (HTTPS only).
//   - extra.apiUrl: production API URL from EXPO_PUBLIC_API_URL (Render HTTPS).
//
// EAS sets EAS_BUILD_PROFILE during cloud builds (see eas.json profiles).
const isProduction = process.env.EAS_BUILD_PROFILE === 'production';
const PRODUCTION_API_URL = 'https://storypeek-mvp.onrender.com';

module.exports = ({ config }) => {
  const plugins = [...(config.plugins ?? [])];
  const buildPropsIndex = plugins.findIndex(
    (plugin) =>
      plugin === 'expo-build-properties' ||
      (Array.isArray(plugin) && plugin[0] === 'expo-build-properties'),
  );
  const buildPropsPlugin = [
    'expo-build-properties',
    {
      android: {
        usesCleartextTraffic: !isProduction,
      },
    },
  ];

  if (buildPropsIndex >= 0) {
    plugins[buildPropsIndex] = buildPropsPlugin;
  } else {
    plugins.push(buildPropsPlugin);
  }

  return {
    ...config,
    plugins,
    extra: {
      ...config.extra,
      eas: {
        projectId: '3a54ab2c-5f01-40c7-8a92-6e5335bba298',
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL || (isProduction ? PRODUCTION_API_URL : undefined),
    },
    android: {
      ...config.android,
      versionCode: 1,
    },
  };
};
