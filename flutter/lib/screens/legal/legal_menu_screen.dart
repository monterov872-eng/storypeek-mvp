import 'package:flutter/material.dart';

import '../../content/legal_text.dart';
import '../../theme/silent_view_theme.dart';
import 'legal_document_screen.dart';

class LegalMenuScreen extends StatelessWidget {
  const LegalMenuScreen({super.key});

  void _open(BuildContext context, String title, String body) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => LegalDocumentScreen(title: title, body: body),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SilentViewColors.black,
      appBar: AppBar(title: const Text('Legal & privacy')),
      body: SafeArea(
        child: ListView(
          children: [
            _LegalTile(
              icon: Icons.privacy_tip_outlined,
              title: 'Privacy Policy',
              onTap: () => _open(context, 'Privacy Policy', LegalText.privacyPolicy),
            ),
            _LegalTile(
              icon: Icons.description_outlined,
              title: 'Terms of Use',
              onTap: () => _open(context, 'Terms of Use', LegalText.termsOfUse),
            ),
            _LegalTile(
              icon: Icons.info_outline_rounded,
              title: 'Disclaimer',
              onTap: () => _open(context, 'Disclaimer', LegalText.disclaimer),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'SilentView is not affiliated with Instagram or Meta.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LegalTile extends StatelessWidget {
  const _LegalTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: SilentViewColors.neon),
      title: Text(title, style: const TextStyle(color: SilentViewColors.white)),
      trailing: const Icon(Icons.chevron_right, color: SilentViewColors.muted),
      onTap: onTap,
    );
  }
}
