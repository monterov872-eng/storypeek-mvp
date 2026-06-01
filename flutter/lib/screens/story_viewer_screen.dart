import 'package:flutter/material.dart';

import '../models/story_item.dart';
import '../widgets/instagram_story_viewer.dart';

class StoryViewerScreen extends StatelessWidget {
  const StoryViewerScreen({
    super.key,
    required this.stories,
    required this.username,
    this.initialIndex = 0,
  });

  final List<StoryItem> stories;
  final String username;
  final int initialIndex;

  @override
  Widget build(BuildContext context) {
    return InstagramStoryViewer(
      stories: stories,
      username: username,
      initialIndex: initialIndex,
    );
  }
}
