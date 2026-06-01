import 'package:flutter/material.dart';

import '../theme/silent_view_theme.dart';
import '../widgets/error_banner.dart';
import '../widgets/glow_button.dart';
import '../widgets/session_scope.dart';
import '../widgets/silent_view_logo.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key, required this.onSuccess});

  final VoidCallback onSuccess;

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    final session = SessionScope.of(context);
    final ok = await session.loadProfile(_controller.text);
    if (!mounted) return;
    if (ok) {
      widget.onSuccess();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: SessionScope.of(context),
      builder: (context, _) {
        final session = SessionScope.of(context);
        final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

        return SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + bottomInset),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight - 48),
                  child: IntrinsicHeight(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 16),
                        const SilentViewLogo(size: 56, compact: true),
                        const SizedBox(height: 32),
                        TextField(
                          controller: _controller,
                          textInputAction: TextInputAction.search,
                          autocorrect: false,
                          style: const TextStyle(
                            color: SilentViewColors.white,
                            fontSize: 17,
                          ),
                          decoration: const InputDecoration(
                            hintText: 'Instagram username',
                            prefixIcon: Icon(
                              Icons.alternate_email,
                              color: SilentViewColors.muted,
                            ),
                          ),
                          onSubmitted: (_) {
                            if (!session.loading) _submit();
                          },
                        ),
                        const SizedBox(height: 20),
                        GlowButton(
                          label: 'View Stories',
                          icon: Icons.play_arrow_rounded,
                          loading: session.loading,
                          onPressed: session.loading ? null : _submit,
                        ),
                        if (session.loadError != null) ...[
                          const SizedBox(height: 20),
                          ErrorBanner(
                            status: session.loadError!,
                            onRetry: session.loading ? null : _submit,
                          ),
                        ],
                        const Spacer(),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
