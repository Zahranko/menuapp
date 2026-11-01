import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/features/menu/menu_models.dart';

import 'dashboard_test.dart' show pumpSignedIn, tapIn;
import 'fake_backend.dart';

FakeBackend _withCustomLabel() {
  final backend = FakeBackend();
  backend.products[1]
    ..['label'] = 'Custom'
    ..['customLabel'] = "Chef's choice"
    ..['customLabelAr'] = 'اختيار الشيف';
  return backend;
}

void main() {
  test('only a custom label sends its text, trimmed and on one line', () {
    const custom = ProductInput(categoryId: 'c1', name: 'Latte', price: '3', label: 'Custom', customLabel: "  Chef's   choice ", customLabelAr: ' ');
    expect(custom.toJson()['customLabel'], "Chef's choice");
    expect(custom.toJson()['customLabelAr'], isNull);
    const fixed = ProductInput(categoryId: 'c1', name: 'Latte', price: '3', label: 'New', customLabel: "Chef's choice");
    expect(fixed.toJson()['customLabel'], isNull);
    expect(productLabels, contains('Custom'));
  });

  testWidgets('a custom label needs text, then saves both languages and shows on the list', (tester) async {
    final backend = FakeBackend();
    await pumpSignedIn(tester, backend);
    await tester.tap(find.byKey(const Key('addButton')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('productName')), 'Saffron cake');
    await tester.enterText(find.byKey(const Key('productPrice')), '4.50');

    await tapIn(tester, find.byKey(const Key('label-Custom')));
    expect(find.byKey(const Key('customLabel')), findsOneWidget);
    await tapIn(tester, find.widgetWithText(FilledButton, 'Add product'));
    expect(find.text('Type the label text.'), findsOneWidget);
    expect(backend.requests, isNot(contains('POST /api/v1/products')));

    await tester.enterText(find.byKey(const Key('customLabel')), ' Gluten   free ');
    await tester.enterText(find.byKey(const Key('customLabelAr')), 'خالٍ من الغلوتين');
    await tapIn(tester, find.widgetWithText(FilledButton, 'Add product'));

    final saved = backend.products.last;
    expect((saved['label'], saved['customLabel'], saved['customLabelAr']), ('Custom', 'Gluten free', 'خالٍ من الغلوتين'));
    expect(find.text('Gluten free'), findsOneWidget);
  });

  testWidgets('a custom label can be typed in Arabic only', (tester) async {
    final backend = FakeBackend();
    await pumpSignedIn(tester, backend);
    await tester.tap(find.text('Spanish latte'));
    await tester.pumpAndSettle();
    await tapIn(tester, find.byKey(const Key('label-Custom')));
    await tester.enterText(find.byKey(const Key('customLabelAr')), 'حلال');
    await tapIn(tester, find.widgetWithText(FilledButton, 'Save changes'));

    final saved = backend.products.firstWhere((p) => p['id'] == 'p2');
    expect((saved['label'], saved['customLabel'], saved['customLabelAr']), ('Custom', null, 'حلال'));
    // The English app falls back to the Arabic text rather than showing nothing.
    expect(find.text('حلال'), findsOneWidget);
  });

  testWidgets('labels show in Arabic in the Arabic app, custom ones in their Arabic text', (tester) async {
    await pumpSignedIn(tester, _withCustomLabel(), locale: const Locale('ar'));
    expect(find.text('مميز'), findsOneWidget);
    expect(find.text('اختيار الشيف'), findsOneWidget);
    expect(find.text('Signature'), findsNothing);
    expect(find.text("Chef's choice"), findsNothing);

    await tester.tap(find.text('Spanish latte'));
    await tester.pumpAndSettle();
    for (final label in ['بدون شارة', 'مميز', 'جديد', 'نباتي', 'حار', 'مخصصة']) {
      expect(find.descendant(of: find.byType(ChoiceChip), matching: find.text(label)), findsOneWidget, reason: label);
    }
    expect(tester.widget<TextField>(find.byKey(const Key('customLabelAr'))).controller!.text, 'اختيار الشيف');
  });

  testWidgets('the English app shows the English custom text', (tester) async {
    await pumpSignedIn(tester, _withCustomLabel());
    expect(find.text("Chef's choice"), findsOneWidget);
    expect(find.text('اختيار الشيف'), findsNothing);
  });
}
