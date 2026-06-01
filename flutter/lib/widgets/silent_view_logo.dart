import 'package:flutter/material.dart';

import '../app_name.dart';
import '../theme/silent_view_theme.dart';

class SilentViewLogo extends StatelessWidget {
  const SilentViewLogo({
    super.key,
    this.size = 72,
    this.showTitle = true,
    this.compact = false,
  });

  final double size;
  final bool showTitle;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(size * 0.24),
            boxShadow: [
              BoxShadow(
                color: SilentViewColors.neon.withValues(alpha: 0.35),
                blurRadius: 28,
                spreadRadius: -6,
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(size * 0.24),
            child: Image.asset(
              'assets/app_icon.png',
              fit: BoxFit.cover,
            ),
          ),
        ),
        if (showTitle) ...[
          SizedBox(height: compact ? 12 : 16),
          Text(
            localizedAppName(),
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontSize: compact ? 22 : 28,
                ),
          ),
        ],
      ],
    );
  }
}
