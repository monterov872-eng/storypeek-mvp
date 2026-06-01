import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../models/story_item.dart';

const Map<String, String> kInstagramMediaHeaders = {
  'User-Agent':
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
};

class StoryMediaTile extends StatefulWidget {
  const StoryMediaTile({super.key, required this.story});

  final StoryItem story;

  @override
  State<StoryMediaTile> createState() => _StoryMediaTileState();
}

class _StoryMediaTileState extends State<StoryMediaTile> {
  VideoPlayerController? _controller;
  bool _videoFailed = false;
  VideoPlayerController? _audioController;
  bool _audioFailed = false;
  bool _audioLoading = false;
  bool _audioPlaying = false;

  @override
  void initState() {
    super.initState();
    if (widget.story.isVideo) {
      _initVideo();
    }
    _initAudio();
  }

  Future<void> _initAudio() async {
    final url = widget.story.audioUrl;
    if (url == null || url.isEmpty) return;

    setState(() {
      _audioLoading = true;
      _audioFailed = false;
    });

    // Use video_player for audio-only streams to avoid extra plugins.
    final controller = VideoPlayerController.networkUrl(
      Uri.parse(url),
      httpHeaders: kInstagramMediaHeaders,
    );
    _audioController = controller;
    try {
      await controller.initialize();
      await controller.setVolume(1.0);
      if (mounted) {
        setState(() => _audioLoading = false);
      }
    } catch (_) {
      await controller.dispose();
      if (!mounted) return;
      _audioController = null;
      setState(() {
        _audioLoading = false;
        _audioFailed = true;
      });
    }
  }

  Future<void> _initVideo() async {
    final controller = VideoPlayerController.networkUrl(
      Uri.parse(widget.story.mediaUrl),
      httpHeaders: kInstagramMediaHeaders,
    );
    _controller = controller;
    try {
      await controller.initialize();
      if (mounted) setState(() {});
    } catch (_) {
      if (mounted) setState(() => _videoFailed = true);
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    _audioController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AspectRatio(
            aspectRatio: 9 / 16,
            child: ColoredBox(
              color: Colors.black,
              child: widget.story.isVideo ? _buildVideo() : _buildImage(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _Badge(label: widget.story.mediaType.toUpperCase()),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '@${widget.story.username}',
                        style: Theme.of(context).textTheme.labelLarge,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                if (_audioController != null && !_audioFailed) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _Badge(label: 'AUDIO'),
                      const SizedBox(width: 8),
                      if (_audioLoading)
                        const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      else
                        FilledButton.tonalIcon(
                          onPressed: () async {
                            final c = _audioController;
                            if (c == null) return;
                            try {
                              if (c.value.isPlaying) {
                                await c.pause();
                              } else {
                                await c.play();
                              }
                              if (!mounted) return;
                              setState(() => _audioPlaying = c.value.isPlaying);
                            } catch (_) {
                              if (!mounted) return;
                              setState(() => _audioFailed = true);
                            }
                          },
                          icon: Icon(_audioPlaying ? Icons.pause : Icons.music_note),
                          label: Text(_audioPlaying ? 'Pause music' : 'Play music'),
                        ),
                      const Spacer(),
                      if (widget.story.audioUrl != null && widget.story.audioUrl!.isNotEmpty)
                        IconButton(
                          tooltip: 'Copy audio URL',
                          onPressed: () {
                            // Intentionally no clipboard dependency; keep viewer stable.
                            debugPrint('[story_audio_url] ${widget.story.audioUrl}');
                          },
                          icon: const Icon(Icons.info_outline),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImage() {
    return Image.network(
      widget.story.mediaUrl,
      headers: kInstagramMediaHeaders,
      fit: BoxFit.cover,
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return const Center(child: CircularProgressIndicator(strokeWidth: 2));
      },
      errorBuilder: (context, error, stackTrace) => _MediaError(
        message: 'Image could not be loaded.',
        onRetry: () => setState(() {}),
      ),
    );
  }

  Widget _buildVideo() {
    if (_videoFailed) {
      return _buildImageFallback();
    }
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) {
      return const Center(child: CircularProgressIndicator(strokeWidth: 2));
    }
    return Stack(
      alignment: Alignment.center,
      children: [
        VideoPlayer(controller),
        Positioned(
          bottom: 12,
          child: FilledButton.icon(
            onPressed: () {
              setState(() {
                if (controller.value.isPlaying) {
                  controller.pause();
                } else {
                  controller.play();
                }
              });
            },
            icon: Icon(controller.value.isPlaying ? Icons.pause : Icons.play_arrow),
            label: Text(controller.value.isPlaying ? 'Pause' : 'Play'),
          ),
        ),
      ],
    );
  }

  Widget _buildImageFallback() {
    final thumb = widget.story.thumbnailUrl;
    if (thumb != null && thumb.isNotEmpty) {
      return Image.network(
        thumb,
        headers: kInstagramMediaHeaders,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => const _MediaError(
          message: 'Video could not be played.',
        ),
      );
    }
    return const _MediaError(message: 'Video could not be played.');
  }
}

class _MediaError extends StatelessWidget {
  const _MediaError({required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.broken_image_outlined, color: Colors.white54, size: 40),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 8),
              TextButton(onPressed: onRetry, child: const Text('Retry')),
            ],
          ],
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}
