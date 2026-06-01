import 'package:flutter/material.dart';

import '../theme/silent_view_theme.dart';
import '../widgets/session_scope.dart';
import '../widgets/silent_view_logo.dart';
import 'legal/legal_menu_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({
    super.key,
    required this.onSearchTap,
    required this.onProfileTap,
  });

  final VoidCallback onSearchTap;
  final Future<void> Function(String username) onProfileTap;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: SessionScope.of(context),
      builder: (context, _) {
        final session = SessionScope.of(context);
        final searches = session.recentSearches;
        final viewed = session.recentlyViewed;

        return SafeArea(
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 32, 24, 8),
                  child: Column(
                    children: [
                      const SilentViewLogo(),
                      const SizedBox(height: 10),
                      Text(
                        'Watch stories privately',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ),
              if (searches.isNotEmpty)
                _SectionHeader(title: 'Recent searches'),
              if (searches.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final username = searches[index];
                        return _HistoryTile(
                          icon: Icons.search_rounded,
                          title: '@$username',
                          onTap: () => onProfileTap(username),
                        );
                      },
                      childCount: searches.length,
                    ),
                  ),
                ),
              if (viewed.isNotEmpty)
                _SectionHeader(title: 'Recently viewed'),
              if (viewed.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final username = viewed[index];
                        return _HistoryTile(
                          icon: Icons.visibility_outlined,
                          title: '@$username',
                          subtitle: 'Tap to open profile',
                          onTap: () => onProfileTap(username),
                        );
                      },
                      childCount: viewed.length,
                    ),
                  ),
                ),
              if (searches.isEmpty && viewed.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.explore_outlined,
                            size: 48,
                            color: SilentViewColors.neon.withValues(alpha: 0.6),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Search for someone to get started',
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 20),
                          TextButton(
                            onPressed: onSearchTap,
                            child: const Text('Go to Search'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const LegalMenuScreen(),
                        ),
                      );
                    },
                    icon: const Icon(Icons.gavel_outlined, size: 18),
                    label: const Text('Legal & privacy'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: SilentViewColors.muted,
                      side: const BorderSide(color: SilentViewColors.border),
                      minimumSize: const Size.fromHeight(48),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 0),
        child: Text(title, style: Theme.of(context).textTheme.titleMedium),
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({
    required this.icon,
    required this.title,
    required this.onTap,
    this.subtitle,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: SilentViewColors.card,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Icon(icon, color: SilentViewColors.neon, size: 22),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: Theme.of(context).textTheme.labelLarge),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(subtitle!, style: Theme.of(context).textTheme.bodyMedium),
                      ],
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: SilentViewColors.muted),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
