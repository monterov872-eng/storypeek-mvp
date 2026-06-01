import 'package:flutter/material.dart';

import '../theme/silent_view_theme.dart';

/// Locked-content notice for private Instagram profiles.
class PrivateLockedPanel extends StatelessWidget {
  const PrivateLockedPanel({
    super.key,
    required this.message,
  });

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      decoration: BoxDecoration(
        color: const Color(0xFF14101C),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: SilentViewColors.neon.withValues(alpha: 0.28)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.lock_outline_rounded,
            color: SilentViewColors.neon.withValues(alpha: 0.9),
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: SilentViewColors.white,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
