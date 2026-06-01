class StoryItem {
  const StoryItem({
    required this.id,
    required this.username,
    required this.mediaType,
    required this.mediaUrl,
    this.thumbnailUrl,
    this.takenAt,
    this.audioUrl,
    this.durationMs,
  });

  final String id;
  final String username;
  final String mediaType;
  final String mediaUrl;
  final String? thumbnailUrl;
  final String? takenAt;
  final String? audioUrl;
  final int? durationMs;

  bool get isVideo => mediaType.toLowerCase() == 'video';

  factory StoryItem.fromJson(Map<String, dynamic> json) {
    return StoryItem(
      id: json['id']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      mediaType: json['mediaType']?.toString() ?? 'image',
      mediaUrl: json['mediaUrl']?.toString() ?? '',
      thumbnailUrl: json['thumbnailUrl']?.toString(),
      takenAt: json['takenAt']?.toString(),
      audioUrl: json['audioUrl']?.toString(),
      durationMs: _readDurationMs(json['durationMs']),
    );
  }

  static int? _readDurationMs(dynamic value) {
    if (value is int) return value > 0 ? value : null;
    if (value is num) return value.toInt() > 0 ? value.toInt() : null;
    if (value is String) {
      final parsed = int.tryParse(value);
      return parsed != null && parsed > 0 ? parsed : null;
    }
    return null;
  }
}

class StoriesResponse {
  const StoriesResponse({
    required this.username,
    required this.stories,
    required this.provider,
    required this.fetchedAt,
    this.notice,
  });

  final String username;
  final List<StoryItem> stories;
  final String provider;
  final String fetchedAt;
  final String? notice;

  factory StoriesResponse.fromJson(Map<String, dynamic> json) {
    final rawStories = json['stories'];
    final items = rawStories is List
        ? rawStories
            .whereType<Map<String, dynamic>>()
            .map(StoryItem.fromJson)
            .where((s) => s.mediaUrl.isNotEmpty)
            .toList()
        : <StoryItem>[];

    return StoriesResponse(
      username: json['username']?.toString() ?? '',
      stories: items,
      provider: json['provider']?.toString() ?? '',
      fetchedAt: json['fetchedAt']?.toString() ?? '',
      notice: json['notice']?.toString(),
    );
  }
}
