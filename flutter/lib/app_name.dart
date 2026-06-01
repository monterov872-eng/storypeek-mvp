import 'dart:ui' as ui;

/// Official app display name (English default).
const String kAppNameEn = 'SilentView';

/// Spanish display name for localized devices.
const String kAppNameEs = 'Vista Silenciosa';

/// Resolves the in-app title from the device locale.
String localizedAppName([ui.Locale? locale]) {
  final resolved = locale ?? ui.PlatformDispatcher.instance.locale;
  if (resolved.languageCode == 'es') {
    return kAppNameEs;
  }
  return kAppNameEn;
}
