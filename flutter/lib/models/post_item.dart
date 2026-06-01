import 'story_item.dart';

/// Instagram post item (may be a carousel publication).
///
/// Backend returns one "base" post (legacy fields like `mediaUrl`) and, when
/// available, `carouselItems` containing every slide from `carousel_media`.
class PostItem {
  const PostItem({
    required this.id,
    required this.username,
    required this.mediaType,
    required this.mediaUrl,
    this.thumbnailUrl,
    this.takenAt,
    this.carouselItems = const [],
  });

  final String id;
  final String username;
  final String mediaType;
  final String mediaUrl;
  final String? thumbnailUrl;
  final String? takenAt;

  /// All carousel slides. If the post is not a carousel, this list is empty.
  final List<StoryItem> carouselItems;

  List<StoryItem> get slides => carouselItems.isNotEmpty ? carouselItems : <StoryItem>[
        StoryItem(
          id: id,
          username: username,
          mediaType: mediaType,
          mediaUrl: mediaUrl,
          thumbnailUrl: thumbnailUrl,
          takenAt: takenAt,
        ),
      ];

  bool get isCarousel => slides.length > 1;
}

