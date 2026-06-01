import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class LocalHistory {
  static const _searchesKey = 'recent_searches';
  static const _viewedKey = 'recently_viewed';
  static const _maxItems = 12;

  Future<List<String>> getRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    return _decodeList(prefs.getString(_searchesKey));
  }

  Future<List<String>> getRecentlyViewed() async {
    final prefs = await SharedPreferences.getInstance();
    return _decodeList(prefs.getString(_viewedKey));
  }

  Future<void> addSearch(String username) async {
    final prefs = await SharedPreferences.getInstance();
    final list = _decodeList(prefs.getString(_searchesKey));
    list.remove(username);
    list.insert(0, username);
    await prefs.setString(_searchesKey, jsonEncode(list.take(_maxItems).toList()));
  }

  Future<void> addViewed(String username) async {
    final prefs = await SharedPreferences.getInstance();
    final list = _decodeList(prefs.getString(_viewedKey));
    list.remove(username);
    list.insert(0, username);
    await prefs.setString(_viewedKey, jsonEncode(list.take(_maxItems).toList()));
  }

  List<String> _decodeList(String? raw) {
    if (raw == null || raw.isEmpty) return [];
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) return [];
      return decoded.map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
    } catch (_) {
      return [];
    }
  }
}
