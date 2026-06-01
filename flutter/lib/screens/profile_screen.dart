import 'package:flutter/material.dart';

import '../models/highlight_item.dart';
import '../models/post_item.dart';
import '../state/session_controller.dart';
import '../theme/silent_view_theme.dart';
import '../ui/silent_view_status.dart';
import '../widgets/error_banner.dart';
import '../widgets/glow_button.dart';
import '../widgets/highlight_circle.dart';
import '../widgets/private_locked_panel.dart';
import '../widgets/session_scope.dart';
import '../widgets/story_media_tile.dart';
import '../widgets/ad_gate_screen.dart';
import 'highlight_stories_screen.dart';
import 'post_viewer_screen.dart';
import 'story_viewer_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: SessionScope.of(context),
      builder: (context, _) {
        final session = SessionScope.of(context);
        final profile = session.currentProfile;

        if (session.loading) {
          return const Center(
            child: CircularProgressIndicator(color: SilentViewColors.neon),
          );
        }

        if (profile == null) {
          if (session.loadError != null) {
            final retryUsername = session.lastRequestedUsername;
            return SilentViewStatusView(
              status: session.loadError!,
              onRetry: retryUsername == null
                  ? null
                  : () => session.loadProfile(retryUsername),
            );
          }
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.person_outline_rounded,
                    size: 56,
                    color: SilentViewColors.neon.withValues(alpha: 0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Search for a profile',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Use Search to find stories and highlights',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          );
        }

        return SafeArea(
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Column(
                    children: [
                      _ProfileAvatar(
                        username: profile.username,
                        imageUrl: profile.profilePictureUrl,
                      ),
                      const SizedBox(height: 14),
                      Text(
                        '@${profile.username}',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      if (profile.isPrivate) ...[
                        const SizedBox(height: 8),
                        const _PrivateBadge(),
                      ],
                      if (profile.fullName.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          profile.fullName,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: SilentViewColors.white,
                              ),
                        ),
                      ],
                      if (profile.biography.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          profile.biography,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                      const SizedBox(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          Flexible(
                            child: _Stat(
                              value: _formatCount(profile.postsCount),
                              label: 'Posts',
                            ),
                          ),
                          Flexible(
                            child: _Stat(
                              value: _formatCount(profile.followersCount),
                              label: 'Followers',
                            ),
                          ),
                          Flexible(
                            child: _Stat(
                              value: _formatCount(profile.followingCount),
                              label: 'Following',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(
                            child: GlowButton(
                              label: profile.isPrivate ? 'Stories locked' : 'Watch Stories',
                              icon: profile.isPrivate
                                  ? Icons.lock_outline
                                  : Icons.play_circle_outline,
                              onPressed: profile.isPrivate || profile.stories.isEmpty
                                  ? null
                                  : () => _openStories(context, profile),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: profile.isPrivate || profile.highlights.isEmpty
                                  ? null
                                  : () => _scrollToHighlights(context),
                              style: OutlinedButton.styleFrom(
                                minimumSize: const Size(0, 54),
                                side: const BorderSide(color: SilentViewColors.neon),
                                foregroundColor: SilentViewColors.neon,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              child: Text(
                                profile.isPrivate ? 'Highlights locked' : 'View Highlights',
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (profile.isPrivate) ...[
                        const SizedBox(height: 16),
                        const PrivateLockedPanel(
                          message:
                              'Stories, highlights, and posts are only visible to approved followers.',
                        ),
                      ],
                      if (session.loadError != null) ...[
                        const SizedBox(height: 16),
                        ErrorBanner(
                          status: session.loadError!,
                          onRetry: () => session.loadProfile(profile.username),
                        ),
                      ],
                      if (!profile.isPrivate && profile.storiesError != null) ...[
                        const SizedBox(height: 12),
                        ErrorBanner(
                          status: profile.storiesError!,
                          onRetry: () => session.loadProfile(profile.username),
                        ),
                      ] else if (!profile.isPrivate &&
                          profile.stories.isEmpty &&
                          profile.storiesEmpty != null) ...[
                        const SizedBox(height: 12),
                        ErrorBanner(status: profile.storiesEmpty!),
                      ],
                      if (!profile.isPrivate && profile.highlightsError != null) ...[
                        const SizedBox(height: 12),
                        ErrorBanner(
                          status: profile.highlightsError!,
                          onRetry: () => session.loadProfile(profile.username),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
                  child: Text('Highlights', style: Theme.of(context).textTheme.titleMedium),
                ),
              ),
              if (profile.isPrivate)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
                    child: PrivateLockedPanel(
                      message: 'Highlights are hidden on private accounts.',
                    ),
                  ),
                )
              else if (profile.highlights.isNotEmpty)
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 100,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: profile.highlights.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(width: 14),
                      itemBuilder: (context, index) {
                        final h = profile.highlights[index];
                        return HighlightCircle(
                          highlight: h,
                          onTap: () => _openHighlight(context, profile.username, h),
                        );
                      },
                    ),
                  ),
                )
              else if (profile.highlightsError == null)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                    child: SilentViewStatusView(
                      status: const SilentViewStatus(SilentViewStatusKind.noHighlights),
                      compact: true,
                    ),
                  ),
                ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
                  child: Text('Posts', style: Theme.of(context).textTheme.titleMedium),
                ),
              ),
              if (profile.isPrivate)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(20, 8, 20, 24),
                    child: PrivateLockedPanel(
                      message: 'Posts are hidden on private accounts.',
                    ),
                  ),
                )
              else if (profile.posts.isEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                    child: SilentViewStatusView(
                      status: const SilentViewStatus(SilentViewStatusKind.noPosts),
                      compact: true,
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(2, 0, 2, 24),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 2,
                      mainAxisSpacing: 2,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final post = profile.posts[index];
                        final thumb = post.thumbnailUrl ?? post.mediaUrl;
                        return GestureDetector(
                          onTap: () => _openPost(context, post),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.network(
                                thumb,
                                headers: kInstagramMediaHeaders,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    const ColoredBox(
                                  color: SilentViewColors.card,
                                  child: Icon(
                                    Icons.image_outlined,
                                    color: SilentViewColors.muted,
                                  ),
                                ),
                              ),
                              if (post.mediaType.toLowerCase() == 'video')
                                const Positioned(
                                  top: 6,
                                  right: 6,
                                  child: Icon(
                                    Icons.play_arrow_rounded,
                                    color: Colors.white,
                                    size: 18,
                                  ),
                                ),
                            ],
                          ),
                        );
                      },
                      childCount: profile.posts.length,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  void _scrollToHighlights(BuildContext context) {
    final controller = PrimaryScrollController.maybeOf(context);
    controller?.animateTo(
      320,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
    );
  }

  void _openStories(BuildContext context, ProfileSnapshot profile) {
    if (profile.stories.isEmpty || profile.isPrivate) return;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        fullscreenDialog: true,
        builder: (gateContext) => StoryAdGate(
          onContinue: () {
            Navigator.of(gateContext).pushReplacement(
              MaterialPageRoute<void>(
                builder: (_) => StoryViewerScreen(
                  stories: profile.stories,
                  username: profile.username,
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  void _openPost(BuildContext context, PostItem post) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        fullscreenDialog: true,
        builder: (_) => PostViewerScreen(post: post),
      ),
    );
  }

  void _openHighlight(BuildContext context, String username, HighlightItem highlight) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => HighlightStoriesScreen(
          username: username,
          highlight: highlight,
        ),
      ),
    );
  }

  String _formatCount(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toString();
  }
}

class _ProfileAvatar extends StatelessWidget {
  const _ProfileAvatar({required this.username, required this.imageUrl});

  final String username;
  final String imageUrl;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 96,
      height: 96,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          colors: [Color(0xFFB06BFF), SilentViewColors.neon],
        ),
        boxShadow: [
          BoxShadow(
            color: SilentViewColors.neon.withValues(alpha: 0.35),
            blurRadius: 20,
          ),
        ],
      ),
      padding: const EdgeInsets.all(3),
      child: ClipOval(
        child: imageUrl.isNotEmpty
            ? Image.network(
                imageUrl,
                headers: kInstagramMediaHeaders,
                fit: BoxFit.cover,
                        errorBuilder:
                            (context, error, stackTrace) =>
                                _LetterFallback(username: username),
              )
            : _LetterFallback(username: username),
      ),
    );
  }
}

class _LetterFallback extends StatelessWidget {
  const _LetterFallback({required this.username});

  final String username;

  @override
  Widget build(BuildContext context) {
    final letter = username.isNotEmpty ? username[0].toUpperCase() : '?';
    return ColoredBox(
      color: SilentViewColors.black,
      child: Center(
        child: Text(
          letter,
          style: const TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.w700,
            color: SilentViewColors.white,
          ),
        ),
      ),
    );
  }
}

class _PrivateBadge extends StatelessWidget {
  const _PrivateBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: SilentViewColors.neon.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: SilentViewColors.neon.withValues(alpha: 0.45)),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.lock_outline_rounded, size: 14, color: SilentViewColors.neon),
          SizedBox(width: 6),
          Text(
            'Private account',
            style: TextStyle(
              color: SilentViewColors.neon,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(value, style: Theme.of(context).textTheme.titleMedium),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ],
    );
  }
}
