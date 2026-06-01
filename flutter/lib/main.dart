import 'package:flutter/material.dart';

import 'app_name.dart';
import 'screens/main_shell.dart';
import 'services/ad_service.dart';
import 'state/session_controller.dart';
import 'theme/silent_view_theme.dart';
import 'widgets/session_scope.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AdService.instance.initialize();
  runApp(const SilentViewApp());
}

class SilentViewApp extends StatefulWidget {
  const SilentViewApp({super.key});

  @override
  State<SilentViewApp> createState() => _SilentViewAppState();
}

class _SilentViewAppState extends State<SilentViewApp> {
  late final SessionController _session;

  @override
  void initState() {
    super.initState();
    _session = SessionController();
  }

  @override
  void dispose() {
    _session.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SessionScope(
      controller: _session,
      child: MaterialApp(
        title: localizedAppName(),
        debugShowCheckedModeBanner: false,
        theme: SilentViewTheme.dark(),
        home: const MainShell(),
      ),
    );
  }
}
