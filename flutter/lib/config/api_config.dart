import 'dart:convert';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

/// Resolves the backend base URL for the current platform.
///
/// Override at build/run time for physical devices or production:
/// `flutter run --dart-define=API_BASE_URL=http://192.168.1.10:3001`
/// `flutter build ios --dart-define=API_BASE_URL=https://api.example.com`
String get kApiBaseUrl {
  const override = String.fromEnvironment('API_BASE_URL');
  if (override.isNotEmpty) return override;

  if (kIsWeb) return 'http://localhost:3001';
  if (Platform.isAndroid) return 'http://10.0.2.2:3001';
  if (Platform.isIOS) return 'http://127.0.0.1:3001';
  return 'http://localhost:3001';
}

/// Default HTTP timeout for API calls.
const Duration kApiTimeout = Duration(seconds: 25);

String _cleanUsername(String username) {
  return username.trim().replaceFirst(RegExp(r'^@'), '');
}

String _cleanHighlightId(String highlightId) {
  final trimmed = highlightId.trim();
  if (trimmed.startsWith('highlight:')) {
    return trimmed.replaceFirst('highlight:', '');
  }
  return trimmed.replaceAll(RegExp(r'\D'), '');
}

String profileUrl(String username) {
  final clean = _cleanUsername(username);
  return '$kApiBaseUrl/api/profile/$clean';
}

String storiesUrl(String username) {
  final clean = _cleanUsername(username);
  return '$kApiBaseUrl/api/stories/$clean';
}

String highlightsUrl(String username) {
  final clean = _cleanUsername(username);
  return '$kApiBaseUrl/api/highlights/$clean';
}

String highlightStoriesUrl(
  String username,
  String highlightId, {
  String? title,
  String? reelId,
  String? pk,
  String? id,
  String? shortcode,
  Map<String, dynamic>? highlightJson,
}) {
  final cleanUser = _cleanUsername(username);
  final cleanId = _cleanHighlightId(highlightId);
  final base = '$kApiBaseUrl/api/highlights/$cleanUser/$cleanId/stories';
  final params = <String, String>{};
  if (title != null && title.trim().isNotEmpty) {
    params['title'] = title.trim();
  }
  if (reelId != null && reelId.trim().isNotEmpty) {
    params['reel_id'] = reelId.trim();
  }
  if (pk != null && pk.trim().isNotEmpty) {
    params['pk'] = pk.trim();
  }
  if (id != null && id.trim().isNotEmpty) {
    params['id'] = id.trim();
  }
  if (shortcode != null && shortcode.trim().isNotEmpty) {
    params['shortcode'] = shortcode.trim();
  }
  if (highlightJson != null && highlightJson.isNotEmpty) {
    params['highlight_json'] = jsonEncode(highlightJson);
  }
  if (params.isEmpty) return base;
  final query = params.entries
      .map((e) => '${e.key}=${Uri.encodeQueryComponent(e.value)}')
      .join('&');
  return '$base?$query';
}
