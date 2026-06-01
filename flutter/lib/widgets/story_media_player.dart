import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../models/story_item.dart';
import '../theme/silent_view_theme.dart';
import 'story_media_tile.dart';

/// Full-bleed story media without card chrome (for immersive viewers).
class StoryMediaPlayer extends StatefulWidget {
  const StoryMediaPlayer({
    super.key,
    required this.story,
    this.fit = BoxFit.cover,
    this.paused = false,
    this.onSegmentReady,
    this.onSegmentProgress,
    this.onSegmentComplete,
  });

  final StoryItem story;
  final BoxFit fit;
  final bool paused;
  final void Function(Duration duration, {required bool isVideo})? onSegmentReady;
  final void Function(double progress)? onSegmentProgress;
  final VoidCallback? onSegmentComplete;

  @override
  State<StoryMediaPlayer> createState() => _StoryMediaPlayerState();
}

class _StoryMediaPlayerState extends State<StoryMediaPlayer> {
  static const Duration imageDisplayDuration = Duration(seconds: 5);
  static const Duration _endTolerance = Duration(milliseconds: 250);

  VideoPlayerController? _videoController;
  VideoPlayerController? _audioController;

  bool _videoFailed = false;
  bool _audioPlaying = false;
  bool _segmentReadySent = false;
  bool _segmentCompleted = false;

  @override
  void initState() {
    super.initState();
    if (widget.story.isVideo) {
      _initVideo();
    } else {
      _startImageSegment();
    }
    _initAudio();
  }

  @override
  void didUpdateWidget(StoryMediaPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (oldWidget.story.id != widget.story.id) {
      _resetSegment();
      if (widget.story.isVideo) {
        _initVideo();
      } else {
        _startImageSegment();
      }
      _initAudio();
    } else if (oldWidget.paused != widget.paused) {
      _applyPausedState();
    }
  }

  void _resetSegment() {
    _segmentReadySent = false;
    _segmentCompleted = false;
    _videoController?.removeListener(_onVideoTick);
    _disposeControllers();
    _videoFailed = false;
  }

  void _disposeControllers() {
    _videoController?.dispose();
    _videoController = null;
    _audioController?.dispose();
    _audioController = null;
  }

  Duration _metadataDuration() {
    final ms = widget.story.durationMs;
    if (ms != null && ms > 0) {
      return Duration(milliseconds: ms);
    }
    return const Duration(seconds: 15);
  }

  Duration _effectiveVideoDuration(VideoPlayerValue value) {
    final reported = value.duration;
    final meta = _metadataDuration();

    if (reported.inMilliseconds <= 0) return meta;
    if (meta.inMilliseconds > reported.inMilliseconds + 500) return meta;
    return reported;
  }

  void _notifyReady(Duration duration, {required bool isVideo}) {
    if (!mounted || _segmentReadySent) return;
    _segmentReadySent = true;
    widget.onSegmentReady?.call(duration, isVideo: isVideo);
  }

  void _completeSegment() {
    if (!mounted || _segmentCompleted || widget.paused) return;
    _segmentCompleted = true;
    widget.onSegmentProgress?.call(1.0);
    widget.onSegmentComplete?.call();
  }

  void _startImageSegment() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _segmentReadySent) return;
      _notifyReady(imageDisplayDuration, isVideo: false);
      widget.onSegmentProgress?.call(0);
    });
  }

  Future<void> _initVideo() async {
    final controller = VideoPlayerController.networkUrl(
      Uri.parse(widget.story.mediaUrl),
      httpHeaders: kInstagramMediaHeaders,
    );
    _videoController = controller;

    try {
      await controller.initialize();
      await controller.setLooping(false);
      await controller.setPlaybackSpeed(1.0);
      await controller.setVolume(1.0);
      controller.addListener(_onVideoTick);

      if (!mounted) return;

      final duration = _effectiveVideoDuration(controller.value);
      _notifyReady(duration, isVideo: true);

      if (!widget.paused) {
        await controller.play();
        await _syncAudioPlayback();
      }
      setState(() {});
    } catch (_) {
      if (mounted) setState(() => _videoFailed = true);
    }
  }

  void _onVideoTick() {
    final controller = _videoController;
    if (controller == null ||
        !controller.value.isInitialized ||
        _segmentCompleted ||
        widget.paused) {
      return;
    }

    final duration = _effectiveVideoDuration(controller.value);
    final position = controller.value.position;

    if (duration.inMilliseconds > 0) {
      final progress =
          (position.inMilliseconds / duration.inMilliseconds).clamp(0.0, 1.0);
      widget.onSegmentProgress?.call(progress);

      // Duration can become available after playback starts.
      if (!_segmentReadySent) {
        _notifyReady(duration, isVideo: true);
      }
    }

    final atEnd = controller.value.isCompleted ||
        (duration.inMilliseconds > 0 &&
            position >= duration - _endTolerance);

    if (atEnd) {
      _completeSegment();
    }
  }

  Future<void> _initAudio() async {
    final url = widget.story.audioUrl;
    if (url == null || url.isEmpty) return;

    final controller = VideoPlayerController.networkUrl(
      Uri.parse(url),
      httpHeaders: kInstagramMediaHeaders,
    );
    _audioController = controller;

    try {
      await controller.initialize();
      await controller.setLooping(false);
      await controller.setVolume(1.0);
      await controller.setPlaybackSpeed(1.0);
      if (!mounted) return;
      await _syncAudioPlayback();
      if (mounted) setState(() {});
    } catch (_) {
      await controller.dispose();
      _audioController = null;
    }
  }

  Future<void> _syncAudioPlayback() async {
    final audio = _audioController;
    if (audio == null || !audio.value.isInitialized) return;

    if (widget.paused) {
      await audio.pause();
      return;
    }

    if (widget.story.isVideo) {
      final video = _videoController;
      if (video != null && video.value.isInitialized && !video.value.isCompleted) {
        await audio.play();
      }
    } else {
      await audio.play();
    }
  }

  void _applyPausedState() {
    final video = _videoController;
    final audio = _audioController;

    if (widget.paused) {
      video?.pause();
      audio?.pause();
      return;
    }

    if (widget.story.isVideo) {
      if (video != null && video.value.isInitialized && !video.value.isCompleted) {
        video.play();
      }
      _syncAudioPlayback();
    } else {
      _syncAudioPlayback();
    }
  }

  @override
  void dispose() {
    _videoController?.removeListener(_onVideoTick);
    _disposeControllers();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        ColoredBox(
          color: Colors.black,
          child: widget.story.isVideo ? _buildVideo() : _buildImage(),
        ),
        if (_audioController != null)
          Positioned(
            right: 12,
            bottom: 12,
            child: IconButton.filled(
              style: IconButton.styleFrom(
                backgroundColor: Colors.black54,
              ),
              onPressed: _toggleAudio,
              icon: Icon(
                _audioPlaying ? Icons.volume_up : Icons.volume_off,
                color: Colors.white,
              ),
            ),
          ),
      ],
    );
  }

  Future<void> _toggleAudio() async {
    final c = _audioController;
    if (c == null) return;
    if (c.value.isPlaying) {
      await c.pause();
    } else {
      await c.play();
    }
    if (mounted) setState(() => _audioPlaying = c.value.isPlaying);
  }

  Widget _buildImage() {
    return Image.network(
      widget.story.mediaUrl,
      headers: kInstagramMediaHeaders,
      fit: widget.fit,
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return const Center(
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: SilentViewColors.neon,
          ),
        );
      },
      errorBuilder: (context, error, stackTrace) => const Center(
        child: Icon(
          Icons.broken_image_outlined,
          color: Colors.white38,
          size: 48,
        ),
      ),
    );
  }

  Widget _buildVideo() {
    if (_videoFailed) return _buildThumbFallback();
    final c = _videoController;
    if (c == null || !c.value.isInitialized) {
      return const Center(
        child: CircularProgressIndicator(strokeWidth: 2, color: SilentViewColors.neon),
      );
    }
    return FittedBox(
      fit: widget.fit,
      child: SizedBox(
        width: c.value.size.width,
        height: c.value.size.height,
        child: VideoPlayer(c),
      ),
    );
  }

  Widget _buildThumbFallback() {
    final thumb = widget.story.thumbnailUrl;
    if (thumb != null && thumb.isNotEmpty) {
      return Image.network(thumb, headers: kInstagramMediaHeaders, fit: widget.fit);
    }
    return const Center(
      child: Icon(Icons.videocam_off_outlined, color: Colors.white38, size: 48),
    );
  }
}
