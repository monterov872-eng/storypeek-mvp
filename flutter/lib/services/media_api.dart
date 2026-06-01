import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/highlight_item.dart';
import '../models/profile_response.dart';
import '../models/story_item.dart';
import '../ui/silent_view_status.dart';

class MediaApiException implements Exception {
  MediaApiException(this.message, {this.code, this.kind});

  final String message;
  final String? code;
  final SilentViewStatusKind? kind;

  @override
  String toString() => message;
}

class MediaApi {
  static const int _maxAttempts = 2;

  Future<ProfileResponse> fetchProfile(String username) async {
    return _getJson(
      profileUrl(username),
      (body) => ProfileResponse.fromJson(body),
    );
  }

  Future<StoriesResponse> fetchStories(String username) async {
    return _getJson(
      storiesUrl(username),
      (body) => StoriesResponse.fromJson(body),
    );
  }

  Future<HighlightsResponse> fetchHighlights(String username) async {
    return _getJson(
      highlightsUrl(username),
      (body) => HighlightsResponse.fromJson(body),
    );
  }

  Future<HighlightStoriesResponse> fetchHighlightStories(
    String username,
    String highlightId, {
    String? highlightTitle,
    String? reelId,
    String? pk,
    String? id,
    String? shortcode,
    Map<String, dynamic>? highlightJson,
  }) async {
    final url = highlightStoriesUrl(
      username,
      highlightId,
      title: highlightTitle,
      reelId: reelId,
      pk: pk,
      id: id,
      shortcode: shortcode,
      highlightJson: highlightJson,
    );
    return _getJson(url, (body) => HighlightStoriesResponse.fromJson(body));
  }

  Future<T> _getJson<T>(
    String url,
    T Function(Map<String, dynamic> body) parse,
  ) async {
    MediaApiException? lastError;
    for (var attempt = 0; attempt < _maxAttempts; attempt++) {
      try {
        return await _getJsonOnce(url, parse);
      } on MediaApiException catch (e) {
        lastError = e;
        if (!_shouldRetry(e) || attempt == _maxAttempts - 1) rethrow;
        await Future<void>.delayed(const Duration(milliseconds: 900));
      }
    }
    throw lastError ??
        _exception(const SilentViewStatus(SilentViewStatusKind.generic));
  }

  bool _shouldRetry(MediaApiException error) {
    final kind = error.kind;
    return kind == SilentViewStatusKind.networkError ||
        kind == SilentViewStatusKind.networkTimeout ||
        kind == SilentViewStatusKind.serviceUnavailable ||
        kind == SilentViewStatusKind.generic;
  }

  Future<T> _getJsonOnce<T>(
    String url,
    T Function(Map<String, dynamic> body) parse,
  ) async {
    late final http.Response response;
    try {
      response = await http.get(Uri.parse(url)).timeout(kApiTimeout);
    } on TimeoutException {
      throw _exception(const SilentViewStatus(SilentViewStatusKind.networkTimeout));
    } catch (_) {
      throw _exception(const SilentViewStatus(SilentViewStatusKind.networkError));
    }

    if (response.body.trim().isEmpty) {
      throw _exception(const SilentViewStatus(SilentViewStatusKind.emptyResponse));
    }

    Map<String, dynamic> body;
    try {
      body = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      throw _exception(const SilentViewStatus(SilentViewStatusKind.emptyResponse));
    }

    if (response.statusCode >= 400) {
      final error = body['error'];
      if (error is Map<String, dynamic>) {
        final code = error['code']?.toString();
        final raw = error['message']?.toString();
        throw _exception(_statusForError(code, raw), code: code);
      }
      throw _exception(_statusForHttpStatus(response.statusCode));
    }

    return parse(body);
  }

  MediaApiException _exception(SilentViewStatus status, {String? code}) {
    return MediaApiException(
      status.message,
      code: code ?? _codeForKind(status.kind),
      kind: status.kind,
    );
  }

  String? _codeForKind(SilentViewStatusKind kind) {
    switch (kind) {
      case SilentViewStatusKind.userNotFound:
        return 'ACCOUNT_NOT_FOUND';
      case SilentViewStatusKind.privateAccount:
        return 'ACCOUNT_PRIVATE';
      case SilentViewStatusKind.rateLimited:
        return 'RATE_LIMITED';
      case SilentViewStatusKind.serviceUnavailable:
        return 'SERVICE_UNAVAILABLE';
      case SilentViewStatusKind.invalidUsername:
        return 'VALIDATION_ERROR';
      default:
        return null;
    }
  }

  SilentViewStatus _statusForError(String? code, String? rawMessage) {
    return SilentViewStatus.fromApiCode(code) ??
        SilentViewStatus.fromLooseMessage(rawMessage) ??
        const SilentViewStatus(SilentViewStatusKind.generic);
  }

  SilentViewStatus _statusForHttpStatus(int statusCode) {
    if (statusCode == 429) {
      return const SilentViewStatus(SilentViewStatusKind.rateLimited);
    }
    if (statusCode == 403) {
      return const SilentViewStatus(SilentViewStatusKind.privateAccount);
    }
    if (statusCode == 404) {
      return const SilentViewStatus(SilentViewStatusKind.userNotFound);
    }
    if (statusCode >= 500) {
      return const SilentViewStatus(SilentViewStatusKind.serviceUnavailable);
    }
    return const SilentViewStatus(SilentViewStatusKind.networkError);
  }
}
