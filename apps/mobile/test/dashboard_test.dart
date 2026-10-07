import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/core/auth/token_store.dart';
import 'package:storefront_app/core/providers.dart';
import 'package:storefront_app/features/design/editor_screen.dart';
import 'package:storefront_app/features/site/site_web_view.dart';
import 'package:storefront_app/main.dart';

import 'fake_api.dart';
import 'fake_backend.dart';

/// Starts the app with a saved session against [backend]; web views show their address as text.
Future<MemoryTokenStore> pumpSignedIn(WidgetTester tester, FakeBackend backend, {Locale? locale}) async {
  final tokens = MemoryTokenStore();
  await tokens.save(access: 'a', refresh: 'r');
  if (locale != null) {
    tester.platformDispatcher.localesTestValue = [locale];
    addTearDown(tester.platformDispatcher.clearLocalesTestValue);
  }
  tester.view.physicalSize = const Size(1170, 2532);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(ProviderScope(
    overrides: [
      tokenStoreProvider.overrideWithValue(tokens),
      httpAdapterProvider.overrideWithValue(FakeApi(backend.handle)),
      webViewBuilderProvider.overrideWithValue((url, reload) => Center(child: Text('web $url #$reload'))),
    ],
    child: const StorefrontApp(),
  ));
  await tester.pumpAndSettle();
  return tokens;
}

/// Scrolls [finder] into view, then taps it.
Future<void> tapIn(WidgetTester tester, Finder finder) async {
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

/// Scrolls the visible list until [finder] is built (lists build lazily).
Future<void> scrollTo(WidgetTester tester, Finder finder) =>
    tester.scrollUntilVisible(finder, 300, scrollable: find.byType(Scrollable).hitTestable().first);

Future<void> openTab(WidgetTester tester, String label) async {
  await tester.tap(find.descendant(of: find.byType(NavigationBar), matching: find.text(label)));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('a saved session opens My menu with stats and products grouped by category', (tester) async {
    await pumpSignedIn(tester, FakeBackend());

    expect(find.text('Vanilla Menu'), findsOneWidget);
    expect(find.text('example.test/vanillamenu'), findsOneWidget);
    expect(find.text('Vanilla latte'), findsOneWidget);
    expect(find.text('3.50 JD'), findsOneWidget);
    expect(find.text('Signature'), findsOneWidget);
    // One product is sold out: it shows in the stats and on its row.
    expect(find.text('Sold out'), findsNWidgets(2));
    // Desserts has no products, so it has no group in the list.
    expect(find.text('Bakery'), findsOneWidget);
  });

  testWidgets('search narrows the list and says when nothing matches', (tester) async {
    await pumpSignedIn(tester, FakeBackend());
    await tester.enterText(find.byKey(const Key('productSearch')), 'spanish');
    await tester.pumpAndSettle();
    expect(find.text('Spanish latte'), findsOneWidget);
    expect(find.text('Vanilla latte'), findsNothing);

    await tester.enterText(find.byKey(const Key('productSearch')), 'pizza');
    await tester.pumpAndSettle();
    expect(find.text('No matches'), findsOneWidget);
  });

  testWidgets('adding a product checks name and price first, then saves it', (tester) async {
    final backend = FakeBackend();
    await pumpSignedIn(tester, backend);
    await tester.tap(find.byKey(const Key('addButton')));
    await tester.pumpAndSettle();

    await tapIn(tester, find.widgetWithText(FilledButton, 'Add product'));
    expect(find.text('Enter a product name.'), findsOneWidget);
    expect(find.text('Enter a price.'), findsOneWidget);
    expect(backend.requests, isNot(contains('POST /api/v1/products')));

    await tester.enterText(find.byKey(const Key('productName')), 'Saffron cake');
    await tester.enterText(find.byKey(const Key('productPrice')), '4,5x');
    await tapIn(tester, find.widgetWithText(FilledButton, 'Add product'));
    expect(find.text('Use numbers only, like 3.50.'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('productPrice')), '4,50');
    await tapIn(tester, find.widgetWithText(FilledButton, 'Add product'));

    expect(backend.products.last['name'], 'Saffron cake');
    expect(backend.products.last['price'], 4.5);
    expect(find.text('Added · live on your website'), findsOneWidget);
    expect(find.text('Saffron cake'), findsOneWidget);
  });

  testWidgets('editing a product can delete it after confirming', (tester) async {
    final backend = FakeBackend();
    await pumpSignedIn(tester, backend);
    await tester.tap(find.text('Spanish latte'));
    await tester.pumpAndSettle();
    await tapIn(tester, find.text('Delete product'));
    expect(find.text('Delete Spanish latte?'), findsOneWidget);

    await tapIn(tester, find.byKey(const Key('confirmDelete')));
    expect(backend.products.any((p) => p['name'] == 'Spanish latte'), isFalse);
    expect(find.text('Product deleted'), findsOneWidget);
  });

  testWidgets('a failed availability change is put back', (tester) async {
    final backend = FakeBackend()..failing.add('PATCH /api/v1/products/p1/availability');
    await pumpSignedIn(tester, backend);
    final toggle = find.descendant(of: find.ancestor(of: find.text('Vanilla latte'), matching: find.byType(Row)).first, matching: find.byType(Switch));
    expect(tester.widget<Switch>(toggle).value, isTrue);

    await tester.tap(toggle);
    await tester.pumpAndSettle();
    expect(tester.widget<Switch>(toggle).value, isTrue);
    expect(find.text('Server error'), findsOneWidget);
  });

  testWidgets('categories: duplicate names are refused, and deleting moves products', (tester) async {
    final backend = FakeBackend();
    await pumpSignedIn(tester, backend);
    await openTab(tester, 'Categories');
    expect(find.text('Hidden on site'), findsOneWidget);

    await tester.tap(find.byKey(const Key('addButton')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('categoryName')), 'coffee');
    await tapIn(tester, find.widgetWithText(FilledButton, 'Add category'));
    expect(find.text('You already have a category with that name.'), findsOneWidget);
    Navigator.of(tester.element(find.byKey(const Key('categoryName')))).pop();
    await tester.pumpAndSettle();

    await tester.tap(find.text('Coffee'));
    await tester.pumpAndSettle();
    await tapIn(tester, find.text('Delete category'));
    expect(find.text('What happens to its 2 products?'), findsOneWidget);
    await tapIn(tester, find.byKey(const Key('confirmDelete')));

    expect(backend.categories.map((c) => c['name']), ['Bakery', 'Desserts']);
    expect(backend.products.where((p) => p['categoryId'] == 'c2').length, 3);
    expect(find.text('Deleted · products moved to Bakery'), findsOneWidget);
  });

  testWidgets('moving a category saves the new order', (tester) async {
    final backend = FakeBackend();
    await pumpSignedIn(tester, backend);
    await openTab(tester, 'Categories');
    await tester.tap(find.byTooltip('Move Desserts up'));
    await tester.pumpAndSettle();
    expect(backend.categories.map((c) => c['name']), ['Coffee', 'Desserts', 'Bakery']);
  });

  testWidgets('Settings shows the Pro test plan and requests, then cancels, a domain', (tester) async {
    final backend = FakeBackend();
    await pumpSignedIn(tester, backend);
    await openTab(tester, 'Settings');
    await scrollTo(tester, find.text('Pro · current'));
    expect(find.text('Pro · current'), findsOneWidget);
    expect(find.text('Test account: every feature is unlocked and nothing is charged.'), findsOneWidget);

    await scrollTo(tester, find.byKey(const Key('domainField')));
    await tester.enterText(find.byKey(const Key('domainField')), 'not a domain');
    await tapIn(tester, find.text('Send request to support'));
    expect(find.text('Enter a domain like vanillamenu.com, without spaces.'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('domainField')), 'https://VanillaMenu.com/');
    await tapIn(tester, find.text('Send request to support'));
    expect(backend.domainRequest?['domain'], 'vanillamenu.com');
    expect(find.text('Support emails you DNS steps (within 24 hours)'), findsOneWidget);

    await tapIn(tester, find.text('Cancel request'));
    expect(backend.domainRequest, isNull);
  });

  testWidgets('on Basic the domain is locked until upgrading to Pro', (tester) async {
    final backend = FakeBackend(plan: 'basic', testMode: false);
    await pumpSignedIn(tester, backend);
    await openTab(tester, 'Settings');
    await scrollTo(tester, find.text('Basic · current'));
    expect(find.text('Basic · current'), findsOneWidget);
    expect(find.byKey(const Key('domainField')), findsNothing);

    await scrollTo(tester, find.widgetWithText(FilledButton, 'Upgrade to Pro'));
    await tapIn(tester, find.widgetWithText(FilledButton, 'Upgrade to Pro'));
    await tapIn(tester, find.byKey(const Key('confirmPlan')));

    expect(backend.plan, 'pro');
    expect(find.text("You're on Pro"), findsOneWidget);
    await scrollTo(tester, find.byKey(const Key('domainField')));
    expect(find.byKey(const Key('domainField')), findsOneWidget);
  });

  testWidgets('log out from Settings returns to the start screen', (tester) async {
    final tokens = await pumpSignedIn(tester, FakeBackend());
    await openTab(tester, 'Settings');
    await scrollTo(tester, find.text('Log out'));
    await tapIn(tester, find.text('Log out'));
    expect(await tokens.read(), isNull);
    expect(find.text('Create account'), findsOneWidget);
  });

  testWidgets('choosing another template asks first, then opens the editor', (tester) async {
    final backend = FakeBackend()..publishedAt = DateTime.utc(2026);
    await pumpSignedIn(tester, backend);
    await openTab(tester, 'Settings');
    await tester.tap(find.text('Change template'));
    await tester.pumpAndSettle();
    expect(find.text('In use'), findsOneWidget);

    await tester.tap(find.text('Services'));
    await tester.pumpAndSettle();
    expect(find.text('Souq'), findsNothing);
    await tester.tap(find.byKey(const Key('template-atelier')));
    await tester.pumpAndSettle();
    expect(find.text('Use Atelier?'), findsOneWidget);
    await tester.tap(find.text('Use template'));
    await tester.pumpAndSettle();

    expect(backend.templateId, 'atelier');
    expect(find.text('017 Atelier'), findsOneWidget);
  });

  testWidgets('the editor saves changes after a pause, skips unknown settings and publishes', (tester) async {
    final backend = FakeBackend();
    await pumpSignedIn(tester, backend);
    await openTab(tester, 'Settings');
    await tester.tap(find.text('Edit design'));
    await tester.pumpAndSettle();

    expect(find.text('001 Souq'), findsOneWidget);
    expect(find.text('Future setting'), findsNothing);
    expect(find.textContaining('web https://example.test/_preview/t'), findsOneWidget);

    await tester.tap(find.text('Elegant'));
    await tester.enterText(find.byKey(const Key('setting-hero.title')), 'Best coffee in town');
    await tester.pump(const Duration(milliseconds: 300));
    expect(backend.drafts, isEmpty);
    await tester.pump(EditorScreen.saveDelay);
    await tester.pumpAndSettle();
    expect(backend.drafts.length, 1);
    expect(backend.draft['font'], 'elegant');
    expect(backend.draft['hero.title'], 'Best coffee in town');
    expect(find.textContaining('#2'), findsOneWidget, reason: 'the preview reloads after the save');

    await tapIn(tester, find.widgetWithText(FilledButton, 'Publish'));
    expect(backend.publishedAt, isNotNull);
    expect(find.text('Your site is live'), findsOneWidget);
  });

  testWidgets('Arabic owners get My menu in Arabic, right to left', (tester) async {
    await pumpSignedIn(tester, FakeBackend(), locale: const Locale('ar'));
    expect(find.text('عرض الموقع'), findsOneWidget);
    expect(find.text('3.50 د.أ'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('عرض الموقع'))), TextDirection.rtl);
  });
}
