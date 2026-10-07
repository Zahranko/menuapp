import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/core/brand.dart';
import 'package:storefront_app/main.dart';

void main() {
  testWidgets('placeholder home shows the brand name', (tester) async {
    await tester.pumpWidget(const StorefrontApp());
    expect(find.text(Brand.brandName), findsOneWidget);
  });

  test('brand values come from the brand file', () {
    expect(Brand.isConfigured, isTrue, reason: 'run with --dart-define-from-file=../../brand.json');
  });

  test('hexToArgb parses six-digit colors', () {
    expect(hexToArgb('#15291F'), 0xFF15291F);
  });
}
