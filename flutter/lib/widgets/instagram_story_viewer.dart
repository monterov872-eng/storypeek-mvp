import 'package:flutter/material.dart';

import '../models/story_item.dart';
import '../theme/silent_view_theme.dart';
import 'story_media_player.dart';

/// Instagram-style fullscreen story viewer with progress bars and tap zones.
class InstagramStoryViewer extends StatefulWidget {
  const InstagramStoryViewer({
    super.key,
    required this.stories,
    required this.username,
    this.initialIndex = 0,
    this.title,
  });

  final List<StoryItem> stories;
  final String username;
  final int initialIndex;
  final String? title;

  @override
  State<InstagramStoryViewer> createState() => _InstagramStoryViewerState();
}

class _InstagramStoryViewerState extends State<InstagramStoryViewer>
    with SingleTickerProviderStateMixin {
  static const double _headerTapGuardHeight = 108;

  late int _index;
  late AnimationController _progressController;
  late String _activeStoryId;

  bool _paused = false;
  bool _currentIsVideo = false;
  bool _waitingForMedia = true;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex.clamp(0, widget.stories.length - 1);
    _activeStoryId = widget.stories[_index].id;
    _progressController = AnimationController(vsync: this);
    _progressController.addStatusListener(_onProgressStatus);
  }

  void _onProgressStatus(AnimationStatus status) {
    if (status == AnimationStatus.completed &&
        !_paused &&
        !_currentIsVideo &&
        !_waitingForMedia) {
      _goNext();
    }
  }

  void _resetProgressForNewSegment() {
    _waitingForMedia = true;
    _activeStoryId = widget.stories[_index].id;
    _progressController.stop();
    _progressController.duration = const Duration(seconds: 1);
    _progressController.reset();
  }

  bool get _isActiveStory => widget.stories[_index].id == _activeStoryId;

  void _onSegmentReady(Duration duration, {required bool isVideo}) {
    if (!mounted || !_isActiveStory) return;

    _waitingForMedia = false;
    _currentIsVideo = isVideo;
    _progressController.duration = duration;
    _progressController.reset();

    if (_paused) return;

    if (isVideo) {
      // Video progress is driven by playback position callbacks.
      _progressController.value = 0;
    } else {
      _progressController.forward(from: 0);
    }
  }

  void _onSegmentProgress(double progress) {
    if (!mounted || _paused || !_currentIsVideo || !_isActiveStory) return;
    _progressController.value = progress.clamp(0.0, 1.0);
  }

  void _onSegmentComplete() {
    if (!mounted || _paused || !_isActiveStory) return;
    _goNext();
  }

  void _goNext() {
    if (_index < widget.stories.length - 1) {
      setState(() {
        _index++;
        _resetProgressForNewSegment();
      });
    } else {
      Navigator.of(context).maybePop();
    }
  }

  void _goPrevious() {
    if (_index > 0) {
      setState(() {
        _index--;
        _resetProgressForNewSegment();
      });
    } else {
      _progressController.reset();
      if (!_paused && !_currentIsVideo && !_waitingForMedia) {
        _progressController.forward(from: 0);
      }
    }
  }

  void _togglePause() {
    setState(() => _paused = !_paused);

    if (_paused) {
      _progressController.stop();
      return;
    }

    if (_waitingForMedia) return;

    if (_currentIsVideo) {
      // StoryMediaPlayer resumes the video; progress updates via ticks.
      return;
    }

    _progressController.forward(from: _progressController.value);
  }

  void _exitViewer() {
    Navigator.of(context).maybePop();
  }

  void _onVerticalDragEnd(DragEndDetails details) {
    final velocity = details.primaryVelocity ?? 0;
    if (velocity > 650) {
      _exitViewer();
    }
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final story = widget.stories[_index];

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onVerticalDragEnd: _onVerticalDragEnd,
        behavior: HitTestBehavior.translucent,
        child: Stack(
          fit: StackFit.expand,
          children: [
            StoryMediaPlayer(
              key: ValueKey(story.id),
              story: story,
              paused: _paused,
              onSegmentReady: _onSegmentReady,
              onSegmentProgress: _onSegmentProgress,
              onSegmentComplete: _onSegmentComplete,
            ),
            // Tap zones: left = previous, right = next (below header controls).
            Positioned(
              top: _headerTapGuardHeight,
              left: 0,
              right: 0,
              bottom: 0,
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      behavior: HitTestBehavior.translucent,
                      onTap: _goPrevious,
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      behavior: HitTestBehavior.translucent,
                      onTap: _goNext,
                    ),
                  ),
                ],
              ),
            ),
            SafeArea(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
                    child: _ProgressBars(
                      count: widget.stories.length,
                      index: _index,
                      progress: _progressController,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 12, 8, 0),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: SilentViewColors.neon,
                          child: Text(
                            widget.username.isNotEmpty
                                ? widget.username[0].toUpperCase()
                                : '?',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '@${widget.username}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              if (widget.title != null)
                                Text(
                                  widget.title!,
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 12,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: Icon(
                            _paused ? Icons.play_arrow : Icons.pause,
                            color: Colors.white,
                          ),
                          onPressed: _togglePause,
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white),
                          onPressed: _exitViewer,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProgressBars extends StatelessWidget {
  const _ProgressBars({
    required this.count,
    required this.index,
    required this.progress,
  });

  final int count;
  final int index;
  final AnimationController progress;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(count, (i) {
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: i < count - 1 ? 4 : 0),
            child: AnimatedBuilder(
              animation: progress,
              builder: (context, _) {
                final value = i < index
                    ? 1.0
                    : i == index
                        ? progress.value
                        : 0.0;
                return ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: LinearProgressIndicator(
                    value: value,
                    minHeight: 2.5,
                    backgroundColor: Colors.white24,
                    valueColor: const AlwaysStoppedAnimation(SilentViewColors.neon),
                  ),
                );
              },
            ),
          ),
        );
      }),
    );
  }
}
