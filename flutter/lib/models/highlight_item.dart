import 'story_item.dart';

class HighlightItem {
  const HighlightItem({
    required this.id,
    required this.title,
    required this.coverUrl,
    required this.username,
  });

  final String id;
  final String title;
  final String coverUrl;
  final String username;

  /// Numeric reel id used by highlight-stories APIs (from `highlight:123…`).
  String get numericId {
    if (id.startsWith('highlight:')) {
      return id.substring('highlight:'.length);
    }
    return id.replaceAll(RegExp(r'\D'), '');
  }

  /// Canonical reel id for upstream highlight-stories requests.
  String get reelId =>
      id.startsWith('highlight:') ? id : (numericId.isNotEmpty ? 'highlight:$numericId' : id);

  Map<String, dynamic> toJson() => {
        'id': id,
        'reelId': reelId,
        'numericId': numericId,
        'title': title,
        'coverUrl': coverUrl,
        'username': username,
      };

  factory HighlightItem.fromJson(Map<String, dynamic> json) {
    return HighlightItem(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Highlight',
      coverUrl: json['coverUrl']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
    );
  }
}

class HighlightsResponse {
  const HighlightsResponse({
    required this.username,
    required this.highlights,
    required this.provider,
    required this.fetchedAt,
  });

  final String username;
  final List<HighlightItem> highlights;
  final String provider;
  final String fetchedAt;

  factory HighlightsResponse.fromJson(Map<String, dynamic> json) {
    final raw = json['highlights'];
    final items = raw is List
        ? raw
            .whereType<Map<String, dynamic>>()
            .map(HighlightItem.fromJson)
            .where((h) => h.id.isNotEmpty)
            .toList()
        : <HighlightItem>[];

    return HighlightsResponse(
      username: json['username']?.toString() ?? '',
      highlights: items,
      provider: json['provider']?.toString() ?? '',
      fetchedAt: json['fetchedAt']?.toString() ?? '',
    );
  }
}

class HighlightStoriesResponse {
  const HighlightStoriesResponse({
    required this.username,
    required this.highlightId,
    required this.title,
    required this.stories,
    required this.provider,
    required this.fetchedAt,
    this.storiesUnavailable = false,
    this.notice,
  });

  final String username;
  final String highlightId;
  final String title;
  final List<StoryItem> stories;
  final String provider;
  final String fetchedAt;
  final bool storiesUnavailable;
  final String? notice;

  factory HighlightStoriesResponse.fromJson(Map<String, dynamic> json) {
    final rawStories = json['stories'];
    final items = rawStories is List
        ? rawStories
            .whereType<Map<String, dynamic>>()
            .map(StoryItem.fromJson)
            .where((s) => s.mediaUrl.isNotEmpty)
            .toList()
        : <StoryItem>[];

    return HighlightStoriesResponse(
      username: json['username']?.toString() ?? '',
      highlightId: json['highlightId']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Highlight',
      stories: items,
      provider: json['provider']?.toString() ?? '',
      fetchedAt: json['fetchedAt']?.toString() ?? '',
      storiesUnavailable: json['storiesUnavailable'] == true,
      notice: json['notice']?.toString(),
    );
  }
}
