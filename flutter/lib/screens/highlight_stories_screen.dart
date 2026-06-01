import 'package:flutter/material.dart';

import '../models/highlight_item.dart';
import '../models/story_item.dart';
import '../services/media_api.dart';
import '../theme/silent_view_theme.dart';
import '../ui/silent_view_status.dart';
import '../widgets/ad_gate_screen.dart';
import '../widgets/instagram_story_viewer.dart';

class HighlightStoriesScreen extends StatefulWidget {
  const HighlightStoriesScreen({
    super.key,
    required this.username,
    required this.highlight,
  });

  final String username;
  final HighlightItem highlight;

  @override
  State<HighlightStoriesScreen> createState() => _HighlightStoriesScreenState();
}

class _HighlightStoriesScreenState extends State<HighlightStoriesScreen> {
  final _api = MediaApi();

  bool _loading = true;
  SilentViewStatus? _error;
  SilentViewStatus? _empty;
  List<StoryItem> _stories = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _empty = null;
    });

    try {
      final highlightJson = widget.highlight.toJson();
      final result = await _api.fetchHighlightStories(
        widget.username,
        widget.highlight.numericId,
        highlightTitle: widget.highlight.title,
        reelId: widget.highlight.reelId,
        pk: widget.highlight.numericId,
        id: widget.highlight.id,
        shortcode: widget.highlight.numericId,
        highlightJson: highlightJson,
      );
      if (!mounted) return;
      setState(() {
        _stories = result.stories;
        if (result.storiesUnavailable || result.stories.isEmpty) {
          _empty = const SilentViewStatus(SilentViewStatusKind.highlightEmpty);
        }
      });
    } on MediaApiException catch (e) {
      if (mounted) {
        setState(() => _error = SilentViewStatus.fromApiException(e));
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _error = const SilentViewStatus(SilentViewStatusKind.networkError),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onAdContinue() {
    if (_stories.isEmpty) {
      Navigator.of(context).pop();
      return;
    }
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        fullscreenDialog: true,
        builder: (_) => InstagramStoryViewer(
          stories: _stories,
          username: widget.username,
          title: widget.highlight.title,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: SilentViewColors.black,
        appBar: AppBar(title: Text(widget.highlight.title)),
        body: const Center(
          child: CircularProgressIndicator(color: SilentViewColors.neon),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: SilentViewColors.black,
        appBar: AppBar(title: Text(widget.highlight.title)),
        body: SilentViewStatusView(
          status: _error!,
          onRetry: _load,
        ),
      );
    }

    if (_empty != null) {
      return Scaffold(
        backgroundColor: SilentViewColors.black,
        appBar: AppBar(title: Text(widget.highlight.title)),
        body: SilentViewStatusView(status: _empty!),
      );
    }

    return HighlightAdGate(onContinue: _onAdContinue);
  }
}
