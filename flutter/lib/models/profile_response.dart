import 'post_item.dart';
import 'story_item.dart';

class ProfileResponse {
  const ProfileResponse({
    required this.username,
    required this.fullName,
    required this.biography,
    required this.profilePictureUrl,
    required this.isPrivate,
    required this.followersCount,
    required this.followingCount,
    required this.postsCount,
    required this.posts,
    this.storyCount = 0,
    this.highlightCount = 0,
  });

  final String username;
  final String fullName;
  final String biography;
  final String profilePictureUrl;
  final bool isPrivate;
  final int followersCount;
  final int followingCount;
  final int postsCount;
  final List<PostItem> posts;
  final int storyCount;
  final int highlightCount;

  factory ProfileResponse.fromJson(Map<String, dynamic> json) {
    final rawPosts = json['posts'];
    final posts = rawPosts is List
        ? rawPosts.whereType<Map<String, dynamic>>().map((p) {
            final slidesRaw = p['carouselItems'];
            final slides = slidesRaw is List
                ? slidesRaw
                    .whereType<Map<String, dynamic>>()
                    .map(StoryItem.fromJson)
                    .where((s) => s.mediaUrl.isNotEmpty)
                    .toList()
                : const <StoryItem>[];

            return PostItem(
              id: p['id']?.toString() ?? '',
              username: p['username']?.toString() ?? '',
              mediaType: p['mediaType']?.toString() ?? 'image',
              mediaUrl: p['mediaUrl']?.toString() ?? '',
              thumbnailUrl: p['thumbnailUrl']?.toString(),
              takenAt: p['takenAt']?.toString(),
              carouselItems: slides,
            );
          }).where((p) => p.mediaUrl.isNotEmpty).toList()
        : <PostItem>[];

    return ProfileResponse(
      username: json['username']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      biography: json['biography']?.toString() ?? '',
      profilePictureUrl: json['profilePictureUrl']?.toString() ?? '',
      isPrivate: json['isPrivate'] == true,
      followersCount: _readInt(json['followersCount']),
      followingCount: _readInt(json['followingCount']),
      postsCount: _readInt(json['postsCount']),
      posts: posts,
      storyCount: _readInt(json['storyCount']),
      highlightCount: _readInt(json['highlightCount']),
    );
  }

  static int _readInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value.replaceAll(',', '')) ?? 0;
    return 0;
  }
}
