import 'package:flutter/material.dart';

import '../ui/silent_view_status.dart';

/// Compact inline status (errors and notices) with optional retry.
class ErrorBanner extends StatelessWidget {
  const ErrorBanner({
    super.key,
    required this.status,
    this.onRetry,
  });

  final SilentViewStatus status;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return SilentViewStatusView(
      status: status,
      onRetry: onRetry,
      compact: true,
    );
  }
}
