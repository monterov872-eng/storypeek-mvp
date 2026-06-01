import 'package:flutter/material.dart';

import '../../theme/silent_view_theme.dart';

class LegalDocumentScreen extends StatelessWidget {
  const LegalDocumentScreen({
    super.key,
    required this.title,
    required this.body,
  });

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SilentViewColors.black,
      appBar: AppBar(title: Text(title)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          child: Text(
            body,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: SilentViewColors.white,
                  height: 1.55,
                ),
          ),
        ),
      ),
    );
  }
}
