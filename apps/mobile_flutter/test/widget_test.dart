import 'package:flutter_test/flutter_test.dart';
import 'package:yohpal_live_mobile/main.dart';

void main() {
  testWidgets('App loads and displays', (WidgetTester tester) async {
    await tester.pumpWidget(const YohPalLiveApp());
    expect(find.text('Loading your feed...'), findsOneWidget);
  });
}
