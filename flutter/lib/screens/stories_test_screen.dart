import 'package:flutter/material.dart';

import '../models/highlight_item.dart';
import '../models/story_item.dart';
import '../services/media_api.dart';
import '../widgets/highlight_circle.dart';
import '../widgets/story_media_tile.dart';
import 'highlight_stories_screen.dart';

class StoriesTestScreen extends StatefulWidget {
  const StoriesTestScreen({super.key});

  @override
  State<StoriesTestScreen> createState() => _StoriesTestScreenState();
}

class _StoriesTestScreenState extends State<StoriesTestScreen> {
  final _usernameController = TextEditingController(text: 'jenifer.nty');
  final _api = MediaApi();

  bool _loading = false;
  bool _loaded = false;
  String? _error;
  String? _storiesError;
  String? _storiesNotice;
  String? _highlightsError;
  StoriesResponse? _storiesResponse;
  HighlightsResponse? _highlightsResponse;

  @override
  void dispose() {
    _usernameController.dispose();
    super.dispose();
  }

  Future<void> _loadMedia() async {
    FocusScope.of(context).unfocus();
    final username = _usernameController.text;

    setState(() {
      _loading = true;
      _loaded = false;
      _error = null;
      _storiesError = null;
      _storiesNotice = null;
      _highlightsError = null;
      _storiesResponse = null;
      _highlightsResponse = null;
    });

    StoriesResponse? stories;
    HighlightsResponse? highlights;
    String? storiesError;
    String? highlightsError;

    try {
      stories = await _api.fetchStories(username);
    } on MediaApiException catch (e) {
      storiesError = e.message;
    } catch (_) {
      storiesError = 'Could not load active stories. Check your connection and try again.';
    }

    try {
      highlights = await _api.fetchHighlights(username);
    } on MediaApiException catch (e) {
      highlightsError = e.message;
    } catch (_) {
      highlightsError = 'Could not load highlights. Check your connection and try again.';
    }

    if (!mounted) return;
    setState(() {
      _storiesResponse = stories;
      _highlightsResponse = highlights;
      _storiesError = storiesError;
      _storiesNotice =
          stories != null && stories.stories.isEmpty ? stories.notice : null;
      _highlightsError = highlightsError;
      _error = stories == null && highlights == null
          ? [storiesError, highlightsError].whereType<String>().join('\n')
          : null;
      _loaded = true;
      _loading = false;
    });
  }

  void _openHighlight(HighlightItem highlight) {
    debugPrint('[highlight_tap] full object: ${highlight.toJson()}');
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (context) => HighlightStoriesScreen(
          username: _storiesResponse?.username ??
              _highlightsResponse?.username ??
              _usernameController.text.trim().replaceFirst(RegExp(r'^@'), ''),
          highlight: highlight,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final stories = _storiesResponse?.stories ?? const <StoryItem>[];
    final highlights = _highlightsResponse?.highlights ?? const <HighlightItem>[];
    final username = _storiesResponse?.username ??
        _highlightsResponse?.username ??
        _usernameController.text.trim().replaceFirst(RegExp(r'^@'), '');
    final hasResults = _loaded;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Stories & Highlights'),
        centerTitle: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Text(
                  'Fetch active stories and highlights via the backend (RapidAPI key stays on server).',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: TextField(
                  controller: _usernameController,
                  textInputAction: TextInputAction.search,
                  autocorrect: false,
                  decoration: const InputDecoration(
                    labelText: 'Instagram username',
                    hintText: 'instagram, jenifer.nty, iluv_liss.23',
                    prefixIcon: Icon(Icons.alternate_email),
                    border: OutlineInputBorder(),
                  ),
                  onSubmitted: (_) => _loading ? null : _loadMedia(),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: FilledButton.icon(
                  onPressed: _loading ? null : _loadMedia,
                  icon: const Icon(Icons.download_rounded),
                  label: const Text('Load Stories & Highlights'),
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                  ),
                ),
              ),
              if (_loading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
                  child: Center(child: CircularProgressIndicator()),
                ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                  child: _ErrorBanner(message: _error!),
                ),
              if (!_loading && hasResults && username.isNotEmpty) ...[
                if (_storiesError != null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: _ErrorBanner(message: 'Active stories: $_storiesError'),
                  ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                  child: Text(
                    'Active Stories',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                if (_storiesError == null && _storiesNotice != null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                    child: _InfoBanner(message: _storiesNotice!),
                  ),
                if (_storiesError == null && stories.isEmpty && _storiesNotice == null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                    child: Text(
                      'No active stories for @$username.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                  ),
                if (_storiesError == null && stories.isNotEmpty)
                  ...stories.map(
                    (story) => Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      child: StoryMediaTile(story: story),
                    ),
                  ),
                if (_highlightsError != null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    child: _ErrorBanner(message: 'Highlights: $_highlightsError'),
                  ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                  child: Text(
                    'Highlights / Destacadas',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                if (_highlightsError == null && highlights.isEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                    child: Text(
                      'No highlights for @$username.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                  ),
                if (_highlightsError == null && highlights.isNotEmpty)
                  SizedBox(
                    height: 110,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                      itemCount: highlights.length,
                      separatorBuilder: (context, index) => const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        final highlight = highlights[index];
                        return HighlightCircle(
                          highlight: highlight,
                          onTap: () => _openHighlight(highlight),
                        );
                      },
                    ),
                  ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).colorScheme.error.withValues(alpha: 0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.error_outline, color: Theme.of(context).colorScheme.error),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onErrorContainer,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoBanner extends StatelessWidget {
  const _InfoBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.secondaryContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.info_outline,
            color: Theme.of(context).colorScheme.onSecondaryContainer,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSecondaryContainer,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
