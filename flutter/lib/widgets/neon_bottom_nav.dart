import 'package:flutter/material.dart';

import '../theme/silent_view_theme.dart';

class NeonBottomNav extends StatelessWidget {
  const NeonBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: SilentViewColors.black,
        border: Border(top: BorderSide(color: SilentViewColors.border)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            children: [
              _NavItem(
                icon: Icons.home_rounded,
                label: 'Home',
                selected: currentIndex == 0,
                onTap: () => onTap(0),
              ),
              Expanded(
                child: Center(
                  child: _SearchFab(
                    selected: currentIndex == 1,
                    onTap: () => onTap(1),
                  ),
                ),
              ),
              _NavItem(
                icon: Icons.person_outline_rounded,
                label: 'Profile',
                selected: currentIndex == 2,
                onTap: () => onTap(2),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? SilentViewColors.neon : SilentViewColors.muted;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 26),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 11,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchFab extends StatelessWidget {
  const _SearchFab({required this.selected, required this.onTap});

  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        width: 56,
        height: 56,
        transform: Matrix4.translationValues(0, selected ? -10 : -6, 0),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(
            colors: [Color(0xFFB06BFF), SilentViewColors.neon],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: SilentViewColors.neon.withValues(alpha: selected ? 0.55 : 0.35),
              blurRadius: selected ? 28 : 18,
              offset: const Offset(0, 6),
            ),
          ],
          border: Border.all(
            color: SilentViewColors.white.withValues(alpha: selected ? 0.25 : 0.12),
            width: 1.5,
          ),
        ),
        child: const Icon(Icons.search_rounded, color: SilentViewColors.white, size: 28),
      ),
    );
  }
}
