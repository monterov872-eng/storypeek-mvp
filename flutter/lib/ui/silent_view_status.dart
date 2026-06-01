import 'package:flutter/material.dart';

import '../services/media_api.dart';
import '../theme/silent_view_theme.dart';
import '../widgets/glow_button.dart';

/// User-facing empty and error states for SilentView (no technical copy).
enum SilentViewStatusKind {
  enterUsername,
  userNotFound,
  privateAccount,
  noActiveStories,
  noHighlights,
  noPosts,
  networkError,
  rateLimited,
  serviceUnavailable,
  highlightEmpty,
  invalidUsername,
  networkTimeout,
  emptyResponse,
  generic,
}

class SilentViewStatus {
  const SilentViewStatus(this.kind);

  final SilentViewStatusKind kind;

  String get title {
    switch (kind) {
      case SilentViewStatusKind.enterUsername:
        return 'Enter a username';
      case SilentViewStatusKind.userNotFound:
        return 'User not found';
      case SilentViewStatusKind.privateAccount:
        return 'Private account';
      case SilentViewStatusKind.noActiveStories:
        return 'No active stories';
      case SilentViewStatusKind.noHighlights:
        return 'No highlights';
      case SilentViewStatusKind.noPosts:
        return 'No posts';
      case SilentViewStatusKind.networkError:
        return 'Connection problem';
      case SilentViewStatusKind.rateLimited:
        return 'Slow down a moment';
      case SilentViewStatusKind.serviceUnavailable:
        return 'Temporarily unavailable';
      case SilentViewStatusKind.highlightEmpty:
        return 'Nothing in this highlight';
      case SilentViewStatusKind.invalidUsername:
        return 'Invalid username';
      case SilentViewStatusKind.networkTimeout:
        return 'Request timed out';
      case SilentViewStatusKind.emptyResponse:
        return 'No data received';
      case SilentViewStatusKind.generic:
        return 'Something went wrong';
    }
  }

  String get message {
    switch (kind) {
      case SilentViewStatusKind.enterUsername:
        return 'Type an Instagram username to view stories and highlights.';
      case SilentViewStatusKind.userNotFound:
        return 'We could not find that account. Check the spelling and try again.';
      case SilentViewStatusKind.privateAccount:
        return 'This account is private. Stories and highlights are not available.';
      case SilentViewStatusKind.noActiveStories:
        return 'There are no active stories right now. Check back later.';
      case SilentViewStatusKind.noHighlights:
        return 'This profile has no highlights to show.';
      case SilentViewStatusKind.noPosts:
        return 'No posts are available to preview right now.';
      case SilentViewStatusKind.networkError:
        return 'Check your internet connection and try again.';
      case SilentViewStatusKind.rateLimited:
        return 'You have made too many requests. Please wait a minute and try again.';
      case SilentViewStatusKind.serviceUnavailable:
        return 'SilentView could not reach Instagram right now. Try again in a few minutes.';
      case SilentViewStatusKind.highlightEmpty:
        return 'This highlight does not have any viewable stories.';
      case SilentViewStatusKind.invalidUsername:
        return 'Usernames can only use letters, numbers, dots, and underscores.';
      case SilentViewStatusKind.networkTimeout:
        return 'The server took too long to respond. Check your connection and try again.';
      case SilentViewStatusKind.emptyResponse:
        return 'Nothing came back from the server. Please try again.';
      case SilentViewStatusKind.generic:
        return 'Please try again in a moment.';
    }
  }

  IconData get icon {
    switch (kind) {
      case SilentViewStatusKind.enterUsername:
        return Icons.alternate_email_rounded;
      case SilentViewStatusKind.userNotFound:
        return Icons.person_off_outlined;
      case SilentViewStatusKind.privateAccount:
        return Icons.lock_outline_rounded;
      case SilentViewStatusKind.noActiveStories:
        return Icons.auto_stories_outlined;
      case SilentViewStatusKind.noHighlights:
        return Icons.highlight_outlined;
      case SilentViewStatusKind.noPosts:
        return Icons.grid_on_outlined;
      case SilentViewStatusKind.networkError:
        return Icons.wifi_off_rounded;
      case SilentViewStatusKind.rateLimited:
        return Icons.hourglass_top_rounded;
      case SilentViewStatusKind.serviceUnavailable:
        return Icons.cloud_off_outlined;
      case SilentViewStatusKind.highlightEmpty:
        return Icons.collections_bookmark_outlined;
      case SilentViewStatusKind.invalidUsername:
        return Icons.error_outline_rounded;
      case SilentViewStatusKind.networkTimeout:
        return Icons.timer_off_outlined;
      case SilentViewStatusKind.emptyResponse:
        return Icons.inbox_outlined;
      case SilentViewStatusKind.generic:
        return Icons.info_outline_rounded;
    }
  }

  bool get showRetry {
    switch (kind) {
      case SilentViewStatusKind.networkError:
      case SilentViewStatusKind.networkTimeout:
      case SilentViewStatusKind.rateLimited:
      case SilentViewStatusKind.serviceUnavailable:
      case SilentViewStatusKind.generic:
      case SilentViewStatusKind.userNotFound:
      case SilentViewStatusKind.privateAccount:
      case SilentViewStatusKind.highlightEmpty:
        return true;
      default:
        return false;
    }
  }

  static SilentViewStatus? fromApiCode(String? code) {
    switch (code) {
      case 'ACCOUNT_NOT_FOUND':
        return const SilentViewStatus(SilentViewStatusKind.userNotFound);
      case 'ACCOUNT_PRIVATE':
        return const SilentViewStatus(SilentViewStatusKind.privateAccount);
      case 'RATE_LIMITED':
        return const SilentViewStatus(SilentViewStatusKind.rateLimited);
      case 'SERVICE_UNAVAILABLE':
        return const SilentViewStatus(SilentViewStatusKind.serviceUnavailable);
      case 'VALIDATION_ERROR':
        return const SilentViewStatus(SilentViewStatusKind.invalidUsername);
      default:
        return null;
    }
  }

  static SilentViewStatus fromApiException(MediaApiException error) {
    if (error.kind != null) {
      return SilentViewStatus(error.kind!);
    }
    return fromApiCode(error.code) ??
        fromLooseMessage(error.message) ??
        const SilentViewStatus(SilentViewStatusKind.generic);
  }

  static SilentViewStatus fromException(Object error) {
    if (error is MediaApiException) return fromApiException(error);
    return const SilentViewStatus(SilentViewStatusKind.networkError);
  }

  /// Best status when every request failed (search screen).
  static SilentViewStatus pickPrimary(Iterable<SilentViewStatus?> candidates) {
    const priority = [
      SilentViewStatusKind.privateAccount,
      SilentViewStatusKind.userNotFound,
      SilentViewStatusKind.rateLimited,
      SilentViewStatusKind.invalidUsername,
      SilentViewStatusKind.networkTimeout,
      SilentViewStatusKind.networkError,
      SilentViewStatusKind.serviceUnavailable,
      SilentViewStatusKind.generic,
    ];
    final list = candidates.whereType<SilentViewStatus>().toList();
    if (list.isEmpty) {
      return const SilentViewStatus(SilentViewStatusKind.generic);
    }
    for (final kind in priority) {
      final match = list.where((s) => s.kind == kind);
      if (match.isNotEmpty) return match.first;
    }
    return list.first;
  }

  static SilentViewStatus? fromLooseMessage(String? text) {
    if (text == null || text.trim().isEmpty) return null;
    final lower = text.toLowerCase();
    if (lower.contains('private')) {
      return const SilentViewStatus(SilentViewStatusKind.privateAccount);
    }
    if (lower.contains('not found') || lower.contains('no user')) {
      return const SilentViewStatus(SilentViewStatusKind.userNotFound);
    }
    if (lower.contains('rate') || lower.contains('too many')) {
      return const SilentViewStatus(SilentViewStatusKind.rateLimited);
    }
    if (lower.contains('timeout') || lower.contains('timed out')) {
      return const SilentViewStatus(SilentViewStatusKind.networkTimeout);
    }
    if (lower.contains('connection') ||
        lower.contains('network') ||
        lower.contains('internet')) {
      return const SilentViewStatus(SilentViewStatusKind.networkError);
    }
    if (lower.contains('no active stor') || lower.contains('no stories')) {
      return const SilentViewStatus(SilentViewStatusKind.noActiveStories);
    }
    if (lower.contains('no highlight')) {
      return const SilentViewStatus(SilentViewStatusKind.noHighlights);
    }
    if (looksTechnical(text)) return null;
    return null;
  }

  static bool looksTechnical(String text) {
    final lower = text.toLowerCase();
    if (RegExp(r'\b[45]\d{2}\b').hasMatch(text)) return true;
    if (lower.contains('http')) return true;
    if (lower.contains('exception')) return true;
    if (lower.contains('json')) return true;
    if (lower.contains('upstream')) return true;
    if (lower.contains('rapidapi')) return true;
    if (lower.contains('failed:')) return true;
    if (text.contains('{') || text.contains('}')) return true;
    return false;
  }
}

/// Centered full-page or section empty/error panel.
class SilentViewStatusView extends StatelessWidget {
  const SilentViewStatusView({
    super.key,
    required this.status,
    this.onRetry,
    this.compact = false,
  });

  final SilentViewStatus status;
  final VoidCallback? onRetry;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return _SilentViewStatusBanner(
        status: status,
        onRetry: status.showRetry ? onRetry : null,
      );
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _StatusIcon(icon: status.icon),
            const SizedBox(height: 20),
            Text(
              status.title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 10),
            Text(
              status.message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (status.showRetry && onRetry != null) ...[
              const SizedBox(height: 24),
              GlowButton(
                label: 'Try again',
                icon: Icons.refresh_rounded,
                onPressed: onRetry,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SilentViewStatusBanner extends StatelessWidget {
  const _SilentViewStatusBanner({
    required this.status,
    this.onRetry,
  });

  final SilentViewStatus status;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF14101C),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: SilentViewColors.neon.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(status.icon, color: SilentViewColors.neon, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      status.title,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            color: SilentViewColors.white,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      status.message,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Try again'),
                style: TextButton.styleFrom(foregroundColor: SilentViewColors.neon),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatusIcon extends StatelessWidget {
  const _StatusIcon({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: SilentViewColors.neon.withValues(alpha: 0.12),
        border: Border.all(color: SilentViewColors.neon.withValues(alpha: 0.4)),
        boxShadow: [
          BoxShadow(
            color: SilentViewColors.neon.withValues(alpha: 0.2),
            blurRadius: 24,
          ),
        ],
      ),
      child: Icon(icon, color: SilentViewColors.neon, size: 34),
    );
  }
}
