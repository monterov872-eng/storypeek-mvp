import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/story_item.dart';

class StoriesApiException implements Exception {
  StoriesApiException(this.message, {this.code});

  final String message;
  final String? code;

  @override
  String toString() => message;
}

class StoriesApi {
  Future<StoriesResponse> fetchStories(String username) async {
    final clean = username.trim().replaceFirst(RegExp(r'^@'), '');
    if (clean.isEmpty) {
      throw StoriesApiException('Enter a username.');
    }

    final uri = Uri.parse(storiesUrl(clean));
    final response = await http.get(uri).timeout(const Duration(seconds: 30));

    Map<String, dynamic> body;
    try {
      body = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      throw StoriesApiException('Invalid response from server.');
    }

    if (response.statusCode >= 400) {
      final error = body['error'];
      if (error is Map<String, dynamic>) {
        throw StoriesApiException(
          error['message']?.toString() ?? 'Request failed.',
          code: error['code']?.toString(),
        );
      }
      throw StoriesApiException('Request failed (${response.statusCode}).');
    }

    return StoriesResponse.fromJson(body);
  }
}
