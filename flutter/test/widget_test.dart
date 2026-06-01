import 'package:flutter_test/flutter_test.dart';
import 'package:silentview/main.dart';

void main() {
  testWidgets('Home screen renders SilentView branding', (tester) async {
    await tester.pumpWidget(const SilentViewApp());
    await tester.pumpAndSettle();

    expect(find.text('Watch stories privately'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
  });
}
