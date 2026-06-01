import 'package:flutter/material.dart';

import '../models/post_item.dart';
import '../models/story_item.dart';
import '../theme/silent_view_theme.dart';
import '../widgets/story_media_player.dart';

/// Fullscreen viewer for Instagram feed posts.
///
/// Supports carousel posts (multi-image/video publications) via horizontal
/// swipe. Pagination indicator is shown in an Instagram-like "1/6" style.
class PostViewerScreen extends StatefulWidget {
  const PostViewerScreen({super.key, required this.post});

  final PostItem post;

  @override
  State<PostViewerScreen> createState() => _PostViewerScreenState();
}

class _PostViewerScreenState extends State<PostViewerScreen> {
  late final PageController _pageController;
  late List<StoryItem> _slides;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _slides = widget.post.slides;
    _pageController = PageController(initialPage: 0);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_slides.isEmpty) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: Icon(Icons.broken_image_outlined)),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          PageView.builder(
            controller: _pageController,
            itemCount: _slides.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (context, i) {
              final story = _slides[i];
              return StoryMediaPlayer(
                key: ValueKey(story.id),
                story: story,
                fit: BoxFit.contain, // Preserve aspect ratio for each slide.
                paused: i != _index, // Avoid multiple videos playing at once.
              );
            },
          ),
          SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                    const Spacer(),
                    _CarouselPagerIndicator(
                      index: _index,
                      count: _slides.length,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CarouselPagerIndicator extends StatelessWidget {
  const _CarouselPagerIndicator({
    required this.index,
    required this.count,
  });

  final int index;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '${index + 1} / $count',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 6),
        SizedBox(
          width: 64,
          height: 10,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(count, (i) {
              final selected = i == index;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                margin: const EdgeInsets.symmetric(horizontal: 2),
                width: selected ? 18 : 8,
                height: 6,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(3),
                  color: selected
                      ? SilentViewColors.neon
                      : Colors.white.withValues(alpha: 0.25),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}
