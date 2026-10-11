import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/core/auth/token_store.dart';
import 'package:storefront_app/core/l10n/app_language.dart';
import 'package:storefront_app/core/providers.dart';
import 'package:storefront_app/features/design/design_models.dart';
import 'package:storefront_app/features/design/editor_screen.dart';
import 'package:storefront_app/features/site/site_web_view.dart';
import 'package:storefront_app/main.dart';

import 'fake_api.dart';
import 'fake_backend.dart';

/// Starts the app with a saved session against [backend]; web views show their address as text.
Future<MemoryTokenStore> pumpSignedIn(WidgetTester tester, FakeBackend backend, {Locale? locale, LanguageStore? language}) async {
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
      languageStoreProvider.overrideWithValue(language ?? MemoryLanguageStore()),
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
    expect(find.text(r'$3.50'), findsOneWidget);
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
    expect(find.text('Use numbers only, like 3.50, with up to 2 digits after the point.'), findsOneWidget);

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

  testWidgets('a sub-category is added inside a main category and shows nested under it', (tester) async {
    final backend = FakeBackend();
    await pumpSignedIn(tester, backend);
    await openTab(tester, 'Categories');

    await tester.tap(find.byKey(const Key('addButton')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('categoryName')), 'Hot drinks');
    await tapIn(tester, find.byKey(const Key('categoryParent')));
    await tester.tap(find.text('Coffee').last);
    await tester.pumpAndSettle();
    await tapIn(tester, find.widgetWithText(FilledButton, 'Add category'));

    final created = backend.categories.last;
    expect(created['name'], 'Hot drinks');
    expect(created['parentId'], 'c1');
    expect(find.text('2 products · 1 sub-category'), findsOneWidget);
    // Indented under Coffee, right after it.
    final sub = find.byKey(Key('category-${created['id']}'));
    expect(tester.getTopLeft(find.descendant(of: sub, matching: find.text('Hot drinks'))).dx, greaterThan(tester.getTopLeft(find.text('Coffee')).dx));
    expect(tester.getTopLeft(sub).dy, lessThan(tester.getTopLeft(find.text('Bakery')).dy));

    // A main category with sub-categories can't go inside another one.
    await tester.tap(find.text('Coffee'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('parentLocked')), findsOneWidget);
    expect(find.byKey(const Key('categoryParent')), findsNothing);
  });

  testWidgets('a sub-category can become a main category again', (tester) async {
    final backend = FakeBackend()..categories.add({'id': 'c9', 'name': 'Hot drinks', 'parentId': 'c1', 'sortOrder': 3});
    await pumpSignedIn(tester, backend);
    await openTab(tester, 'Categories');
    await tester.tap(find.text('Hot drinks'));
    await tester.pumpAndSettle();
    await tapIn(tester, find.byKey(const Key('categoryParent')));
    await tester.tap(find.text('None · main category').last);
    await tester.pumpAndSettle();
    await tapIn(tester, find.widgetWithText(FilledButton, 'Save changes'));
    expect(backend.categories.firstWhere((c) => c['id'] == 'c9')['parentId'], isNull);
    expect(backend.requests, contains('PUT /api/v1/categories/c9'));
  });

  testWidgets('products in a sub-category are grouped as Parent › Child and moved there from the product sheet', (tester) async {
    final backend = FakeBackend()..categories.add({'id': 'c9', 'name': 'Hot drinks', 'parentId': 'c1', 'sortOrder': 3});
    await pumpSignedIn(tester, backend);
    // Empty sub-categories have no group yet.
    expect(find.text('Coffee › Hot drinks'), findsNothing);

    await tester.tap(find.text('Spanish latte'));
    await tester.pumpAndSettle();
    await tapIn(tester, find.byKey(const Key('productCategory')));
    await tester.tap(find.text('Hot drinks').last);
    await tester.pumpAndSettle();
    expect(find.descendant(of: find.byKey(const Key('productCategory')), matching: find.text('Coffee › Hot drinks')), findsOneWidget);
    await tapIn(tester, find.widgetWithText(FilledButton, 'Save changes'));
    expect(backend.products.firstWhere((p) => p['id'] == 'p2')['categoryId'], 'c9');

    expect(find.text('Coffee › Hot drinks'), findsOneWidget);
    // Filtering by the main category also shows its sub-category.
    await tester.tap(find.text('Coffee · 2'));
    await tester.pumpAndSettle();
    expect(find.text('Spanish latte'), findsOneWidget);
    expect(find.text('Pistachio croissant'), findsNothing);
  });

  testWidgets('moving a sub-category only swaps it with its siblings', (tester) async {
    final backend = FakeBackend()
      ..categories.addAll([
        {'id': 'c8', 'name': 'Hot drinks', 'parentId': 'c1', 'sortOrder': 3},
        {'id': 'c9', 'name': 'Iced drinks', 'parentId': 'c1', 'sortOrder': 4},
      ]);
    await pumpSignedIn(tester, backend);
    await openTab(tester, 'Categories');
    expect(tester.widget<IconButton>(find.widgetWithIcon(IconButton, Icons.keyboard_arrow_up_rounded).at(1)).onPressed, isNull,
        reason: 'the first sub-category cannot go up');
    await tester.tap(find.byTooltip('Move Iced drinks up'));
    await tester.pumpAndSettle();
    expect(backend.categories.map((c) => c['name']), ['Coffee', 'Iced drinks', 'Hot drinks', 'Bakery', 'Desserts']);
  });

  testWidgets('on Basic, a Pro template shows its badge and asks to upgrade instead of calling the API', (tester) async {
    final backend = FakeBackend(plan: 'basic', testMode: false);
    await pumpSignedIn(tester, backend);
    await openTab(tester, 'Settings');
    await tester.tap(find.text('Change template'));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('proBadge-noir')), findsOneWidget);
    expect(find.byKey(const Key('proBadge-souq')), findsNothing);
    expect(find.text('Templates marked Pro come with the Pro plan.'), findsOneWidget);
    await tester.tap(find.byKey(const Key('templateFilter-pro')));
    await tester.pumpAndSettle();
    expect(find.text('Souq'), findsNothing);

    await tester.tap(find.byKey(const Key('template-noir')));
    await tester.pumpAndSettle();
    expect(find.text('This template is part of the Pro plan'), findsOneWidget);
    expect(backend.requests, isNot(contains('PUT /api/v1/site/template')));

    // Upgrading carries on with the choice.
    await tapIn(tester, find.byKey(const Key('proTemplateUpgrade')));
    await tapIn(tester, find.byKey(const Key('confirmPlan')));
    expect(backend.plan, 'pro');
    expect(find.text('Use Noir?'), findsOneWidget);
    await tester.tap(find.text('Use template'));
    await tester.pumpAndSettle();
    expect(backend.templateId, 'noir');
  });

  testWidgets('publishing a Pro template on Basic explains the Pro plan', (tester) async {
    final backend = FakeBackend(plan: 'basic', testMode: false)
      ..templateId = 'noir'
      ..draft = {'hero.title': 'An evening to remember.'};
    await pumpSignedIn(tester, backend);
    await openTab(tester, 'Settings');
    await tester.tap(find.text('Edit design'));
    await tester.pumpAndSettle();
    await tapIn(tester, find.widgetWithText(FilledButton, 'Publish'));
    expect(backend.publishedAt, isNull);
    expect(find.text('This template is part of the Pro plan'), findsOneWidget);
    expect(find.textContaining('Upgrade to Pro to use Noir'), findsOneWidget);
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
    expect(find.text('Skip'), findsOneWidget);
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
    expect(find.text('Template 017 / 100'), findsOneWidget);
  });

  testWidgets('the editor saves changes after a pause, skips unknown settings and publishes', (tester) async {
    final backend = FakeBackend();
    await pumpSignedIn(tester, backend);
    await openTab(tester, 'Settings');
    await tester.tap(find.text('Edit design'));
    await tester.pumpAndSettle();

    expect(find.text('Template 001 / 100'), findsOneWidget);
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

  testWidgets('in Arabic, sub-categories are indented from the right', (tester) async {
    final backend = FakeBackend()..categories.add({'id': 'c9', 'name': 'Hot drinks', 'parentId': 'c1', 'sortOrder': 3});
    await pumpSignedIn(tester, backend, locale: const Locale('ar'));
    await openTab(tester, 'الأصناف');
    expect(tester.getTopRight(find.text('Hot drinks')).dx, lessThan(tester.getTopRight(find.text('Coffee')).dx));
  });

  testWidgets('Arabic owners get My menu in Arabic, right to left', (tester) async {
    await pumpSignedIn(tester, FakeBackend(currencyCode: 'JOD'), locale: const Locale('ar'));
    expect(find.text('عرض الموقع'), findsOneWidget);
    expect(find.text('3.50 د.أ'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('عرض الموقع'))), TextDirection.rtl);
  });

  testWidgets('Settings switches the app language at once and remembers it', (tester) async {
    final language = MemoryLanguageStore();
    final backend = FakeBackend();
    await pumpSignedIn(tester, backend, language: language);
    await openTab(tester, 'Settings');
    await scrollTo(tester, find.byKey(const Key('appLanguage')));
    expect(find.text('Same as phone'), findsOneWidget);
    await tapIn(tester, find.byKey(const Key('appLanguage')));
    expect(find.text('App language'), findsWidgets);
    await tester.tap(find.byKey(const Key('language-ar')));
    await tester.pumpAndSettle();

    expect(language.language, AppLanguage.ar);
    expect(find.descendant(of: find.byType(NavigationBar), matching: find.text('الإعدادات')), findsOneWidget);
    expect(Directionality.of(tester.element(find.byType(NavigationBar))), TextDirection.rtl);
    expect(find.text('العربية'), findsOneWidget, reason: 'the row shows the choice');

    // The sheet checks the current choice; going back to the phone's language shows English again.
    await tapIn(tester, find.byKey(const Key('appLanguage')));
    expect(find.descendant(of: find.byKey(const Key('language-ar')), matching: find.byIcon(Icons.check_rounded)), findsOneWidget);
    await tester.tap(find.byKey(const Key('language-system')));
    await tester.pumpAndSettle();
    expect(language.language, AppLanguage.system);
    expect(find.descendant(of: find.byType(NavigationBar), matching: find.text('Settings')), findsOneWidget);
  });

  testWidgets('in Arabic the gallery shows Arabic template names, falling back to English', (tester) async {
    await pumpSignedIn(tester, FakeBackend(), language: MemoryLanguageStore(AppLanguage.ar));
    await openTab(tester, 'الإعدادات');
    await tester.tap(find.text('تغيير القالب'));
    await tester.pumpAndSettle();
    expect(find.text('سوق'), findsOneWidget);
    expect(find.text('مقهى'), findsOneWidget);
    expect(find.text('Souq'), findsNothing);
    // Atelier has no Arabic texts yet.
    expect(find.text('Atelier'), findsOneWidget);
  });

  testWidgets('in English the gallery shows English template names', (tester) async {
    await pumpSignedIn(tester, FakeBackend());
    await openTab(tester, 'Settings');
    await tester.tap(find.text('Change template'));
    await tester.pumpAndSettle();
    expect(find.text('Souq'), findsOneWidget);
    expect(find.text('Café'), findsOneWidget);
    expect(find.text('سوق'), findsNothing);
  });

  testWidgets('in Arabic the editor shows Arabic labels, groups and options', (tester) async {
    await pumpSignedIn(tester, FakeBackend(), language: MemoryLanguageStore(AppLanguage.ar));
    await openTab(tester, 'الإعدادات');
    await tester.tap(find.text('تعديل التصميم'));
    await tester.pumpAndSettle();

    expect(find.text('سوق'), findsOneWidget);
    expect(find.text('الهوية'), findsOneWidget);
    expect(find.text('نمط الخط'), findsOneWidget);
    expect(find.text('أنيق'), findsOneWidget);
    expect(find.text('خلفية منقطة'), findsOneWidget);
    expect(find.text('Font style'), findsNothing);
    expect(find.text('Brand'), findsNothing);
    // A setting without Arabic texts keeps its English label.
    await scrollTo(tester, find.text('Headline'));
    expect(find.text('Hero header'), findsOneWidget);
  });

  testWidgets('in English the editor shows English labels, groups and options', (tester) async {
    await pumpSignedIn(tester, FakeBackend());
    await openTab(tester, 'Settings');
    await tester.tap(find.text('Edit design'));
    await tester.pumpAndSettle();

    expect(find.text('Brand'), findsOneWidget);
    expect(find.text('Font style'), findsOneWidget);
    expect(find.text('Elegant'), findsOneWidget);
    expect(find.text('نمط الخط'), findsNothing);
  });

  test('templates parse Arabic texts, and missing ones fall back to English', () {
    final souq = TemplateInfo.fromJson(Map<String, dynamic>.from(FakeBackend.templates[0]));
    expect(souq.ar?.name, 'سوق');
    expect(souq.fields.first.optionLabelsAr['elegant'], 'أنيق');
    expect(souq.defaultsFor('ar')['hero.title'], 'قهوة تستحق المشوار.');
    expect(souq.defaultsFor('ar')['font'], 'modern');
    expect(souq.defaultsFor('en')['hero.title'], 'Coffee worth crossing the city for.');
    final atelier = TemplateInfo.fromJson(Map<String, dynamic>.from(FakeBackend.templates[1]));
    expect(atelier.ar, isNull);
    expect(atelier.defaultsFor('ar'), atelier.defaults);
  });

  group('currency', () {
    testWidgets('prices show in the business currency with its decimals', (tester) async {
      await pumpSignedIn(tester, FakeBackend(currencyCode: 'JOD'));
      expect(find.text('3.50 JD'), findsOneWidget);
      expect(find.text('3.75 JD'), findsOneWidget);

      // The price field takes the dinar's three decimals and shows its sign.
      await tester.tap(find.text('Vanilla latte'));
      await tester.pumpAndSettle();
      expect(find.descendant(of: find.byKey(const Key('productPrice')), matching: find.text('3.500')), findsOneWidget);
      expect(find.descendant(of: find.byKey(const Key('productPrice')), matching: find.text('JD')), findsOneWidget);
      await tester.enterText(find.byKey(const Key('productPrice')), '3.2555');
      await tapIn(tester, find.widgetWithText(FilledButton, 'Save changes'));
      expect(find.text('Use numbers only, like 3.50, with up to 3 digits after the point.'), findsOneWidget);
      await tester.enterText(find.byKey(const Key('productPrice')), '3.255');
      await tapIn(tester, find.widgetWithText(FilledButton, 'Save changes'));
      expect(find.text('3.255 JD'), findsOneWidget);
    });

    testWidgets('a whole-number currency takes whole prices only', (tester) async {
      final backend = FakeBackend(currencyCode: 'JPY');
      backend.products.first['price'] = 1200;
      await pumpSignedIn(tester, backend);
      expect(find.text('¥1,200'), findsOneWidget);
      await tester.tap(find.text('Vanilla latte'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byKey(const Key('productPrice')), '1200.5');
      await tapIn(tester, find.widgetWithText(FilledButton, 'Save changes'));
      expect(find.text('Use whole numbers only, like 350.'), findsOneWidget);
    });

    testWidgets('Settings changes the currency after confirming that prices keep their numbers', (tester) async {
      final backend = FakeBackend();
      await pumpSignedIn(tester, backend);
      await openTab(tester, 'Settings');
      await scrollTo(tester, find.byKey(const Key('currencyRow')));
      expect(find.text('US dollar · USD'), findsOneWidget);

      await tapIn(tester, find.byKey(const Key('currencyRow')));
      expect(find.text('Choose your currency'), findsOneWidget);
      expect(find.descendant(of: find.byKey(const Key('currency-USD')), matching: find.byIcon(Icons.check_rounded)), findsOneWidget);
      await tester.enterText(find.byKey(const Key('currencySearch')), 'dinar');
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('currency-USD')), findsNothing);
      await tester.tap(find.byKey(const Key('currency-JOD')));
      await tester.pumpAndSettle();

      expect(find.text('Switch to Jordanian dinar?'), findsOneWidget);
      expect(find.text(r'Your prices keep their numbers and only the currency changes: for example, $3.50 becomes 3.50 JD. Nothing is converted.'), findsOneWidget);
      // Cancelling saves nothing.
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();
      expect(backend.requests, isNot(contains('PUT /api/v1/business')));
      expect(find.text('US dollar · USD'), findsOneWidget);

      await tapIn(tester, find.byKey(const Key('currencyRow')));
      await tester.enterText(find.byKey(const Key('currencySearch')), 'jod');
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('currency-JOD')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('confirmCurrency')));
      await tester.pumpAndSettle();

      expect(backend.businessData['currencyCode'], 'JOD');
      expect(backend.businessData['name'], 'Vanilla Menu', reason: 'the rest of the business info stays as saved');
      expect(find.text('Currency changed · live on your website'), findsOneWidget);
      expect(find.text('Jordanian dinar · JOD'), findsOneWidget);

      await openTab(tester, 'Products');
      expect(find.text('3.50 JD'), findsOneWidget);
    });

    testWidgets('with no products, Settings changes the currency without asking', (tester) async {
      final backend = FakeBackend(withMenu: false);
      await pumpSignedIn(tester, backend);
      await openTab(tester, 'Settings');
      await scrollTo(tester, find.byKey(const Key('currencyRow')));
      await tapIn(tester, find.byKey(const Key('currencyRow')));
      await tester.enterText(find.byKey(const Key('currencySearch')), 'nothing like this');
      await tester.pumpAndSettle();
      expect(find.text('No currency matches that search.'), findsOneWidget);
      await tester.enterText(find.byKey(const Key('currencySearch')), '€');
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('currency-EUR')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('confirmCurrency')), findsNothing);
      expect(backend.businessData['currencyCode'], 'EUR');
      expect(find.text('Euro · EUR'), findsOneWidget);
    });

    testWidgets('in Arabic the currency list shows Arabic names, right to left', (tester) async {
      await pumpSignedIn(tester, FakeBackend(currencyCode: 'SAR'), locale: const Locale('ar'));
      await openTab(tester, 'الإعدادات');
      await scrollTo(tester, find.byKey(const Key('currencyRow')));
      expect(find.text('ريال سعودي · SAR'), findsOneWidget);
      await tapIn(tester, find.byKey(const Key('currencyRow')));
      expect(find.text('اختر عملتك'), findsOneWidget);
      await tester.enterText(find.byKey(const Key('currencySearch')), 'دينار');
      await tester.pumpAndSettle();
      expect(find.text('دينار أردني'), findsOneWidget);
      expect(find.byKey(const Key('currency-USD')), findsNothing);
      expect(Directionality.of(tester.element(find.text('دينار أردني'))), TextDirection.rtl);
    });
  });
}
