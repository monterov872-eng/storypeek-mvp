import 'package:flutter/material.dart';

import '../services/ad_service.dart';
import '../theme/silent_view_theme.dart';

/// Brief gate shown while an interstitial loads; skips automatically if ad fails.
class AdGateScreen extends StatefulWidget {
  const AdGateScreen({
    super.key,
    required this.onContinue,
    required this.showAd,
    this.message = 'Preparing your content…',
  });

  final VoidCallback onContinue;
  final Future<void> Function(Future<void> Function() onDone) showAd;
  final String message;

  @override
  State<AdGateScreen> createState() => _AdGateScreenState();
}

class _AdGateScreenState extends State<AdGateScreen> {
  bool _continued = false;

  @override
  void initState() {
    super.initState();
    _run();
  }

  Future<void> _run() async {
    await Future<void>.delayed(const Duration(milliseconds: 350));
    if (!mounted || _continued) return;

    await widget.showAd(() async {
      if (!mounted || _continued) return;
      _continue();
    });

    if (!mounted || _continued) return;
    _continue();
  }

  void _continue() {
    if (_continued) return;
    _continued = true;
    widget.onContinue();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: SilentViewColors.black,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              const Center(
                child: CircularProgressIndicator(color: SilentViewColors.neon),
              ),
              const SizedBox(height: 24),
              Text(
                widget.message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const Spacer(),
              TextButton(
                onPressed: _continue,
                child: const Text('Continue without ad'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Convenience wrapper for story entry ads.
class StoryAdGate extends StatelessWidget {
  const StoryAdGate({super.key, required this.onContinue});

  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return AdGateScreen(
      message: 'Opening stories…',
      showAd: AdService.instance.showAdBeforeStories,
      onContinue: onContinue,
    );
  }
}

/// Convenience wrapper for highlight entry ads.
class HighlightAdGate extends StatelessWidget {
  const HighlightAdGate({super.key, required this.onContinue});

  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return AdGateScreen(
      message: 'Opening highlight…',
      showAd: AdService.instance.showAdBeforeHighlight,
      onContinue: onContinue,
    );
  }
}
