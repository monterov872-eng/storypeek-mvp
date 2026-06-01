import 'package:flutter/material.dart';

import '../models/story_item.dart';
import 'story_media_tile.dart';

/// Horizontal paged viewer for highlight story items.
class HighlightStoryViewer extends StatefulWidget {
  const HighlightStoryViewer({
    super.key,
    required this.stories,
    required this.viewportHeight,
  });

  final List<StoryItem> stories;
  final double viewportHeight;

  @override
  State<HighlightStoryViewer> createState() => _HighlightStoryViewerState();
}

class _HighlightStoryViewerState extends State<HighlightStoryViewer> {
  late final PageController _pageController;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.stories.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
          child: Row(
            children: [
              Text(
                '${_index + 1} / ${widget.stories.length}',
                style: Theme.of(context).textTheme.labelLarge,
              ),
              const Spacer(),
              Text(
                widget.stories[_index].isVideo ? 'Video' : 'Image',
                style: Theme.of(context).textTheme.labelMedium,
              ),
              const SizedBox(width: 8),
              Text(
                'Swipe →',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: widget.viewportHeight,
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.stories.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: StoryMediaTile(story: widget.stories[index]),
              );
            },
          ),
        ),
      ],
    );
  }
}
