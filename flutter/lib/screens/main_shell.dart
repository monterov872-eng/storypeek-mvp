import 'package:flutter/material.dart';

import '../widgets/neon_bottom_nav.dart';
import '../widgets/session_scope.dart';
import 'home_screen.dart';
import 'profile_screen.dart';
import 'search_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  void _goTo(int index) {
    setState(() => _index = index);
  }

  void _goToProfile() => _goTo(2);

  @override
  Widget build(BuildContext context) {
    final session = SessionScope.of(context);

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: IndexedStack(
        index: _index,
        children: [
            HomeScreen(
              onSearchTap: () => _goTo(1),
              onProfileTap: (username) async {
                final ok = await session.loadProfile(username);
                if (mounted && ok) _goToProfile();
              },
            ),
            SearchScreen(onSuccess: _goToProfile),
            const ProfileScreen(),
          ],
      ),
      bottomNavigationBar: NeonBottomNav(
        currentIndex: _index,
        onTap: _goTo,
      ),
    );
  }
}
