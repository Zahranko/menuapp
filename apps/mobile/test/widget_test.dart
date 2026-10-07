import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/core/auth/token_store.dart';
import 'package:storefront_app/core/brand.dart';
import 'package:storefront_app/core/providers.dart';
import 'package:storefront_app/features/auth/screens/signup_screen.dart';
import 'package:storefront_app/main.dart';

import 'fake_api.dart';

Future<FakeApi> pumpApp(WidgetTester tester, FakeResponse Function(String path, Object? body) handle,
    {TokenStore? tokens, Locale? locale}) async {
  final api = FakeApi((r) => handle(r.path, r.data));
  if (locale != null) {
    tester.platformDispatcher.localesTestValue = [locale];
    addTearDown(tester.platformDispatcher.clearLocalesTestValue);
  }
  tester.view.physicalSize = const Size(1170, 2532);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(ProviderScope(
    overrides: [
      tokenStoreProvider.overrideWithValue(tokens ?? MemoryTokenStore()),
      httpAdapterProvider.overrideWithValue(api),
    ],
    child: const StorefrontApp(),
  ));
  await tester.pumpAndSettle();
  return api;
}

FakeResponse slugFree(String path, Object? body) =>
    path.endsWith('slug-availability') ? (status: 200, body: {'slug': 'vanillamenu', 'available': true, 'suggestion': null, 'message': null}) : (status: 404, body: null);

void main() {
  test('brand values come from the brand file', () {
    expect(Brand.isConfigured, isTrue, reason: 'run with --dart-define-from-file=../../brand.json');
  });

  test('password strength follows the prototype', () {
    expect(passwordStrength('abc'), 0);
    expect(passwordStrength('abcdefgh'), 1);
    expect(passwordStrength('abcdefg1'), 2);
    expect(passwordStrength('Abcdefg1'), 3);
    expect(passwordStrength('Abcdefg1!'), 4);
  });

  testWidgets('signed-out owners land on the start screen', (tester) async {
    await pumpApp(tester, slugFree);
    expect(find.text(Brand.brandName), findsOneWidget);
    expect(find.text('Create account'), findsOneWidget);
    expect(find.text('Log in'), findsOneWidget);
  });

  testWidgets('sign up checks every field before calling the API', (tester) async {
    final api = await pumpApp(tester, slugFree);
    await tester.tap(find.text('Create account'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.widgetWithText(FilledButton, 'Create account'));
    await tester.tap(find.widgetWithText(FilledButton, 'Create account'));
    await tester.pumpAndSettle();

    expect(find.text('Enter your business name.'), findsOneWidget);
    expect(find.text('Enter your email.'), findsOneWidget);
    expect(find.text('Enter your phone number.'), findsOneWidget);
    expect(find.text('Password needs at least 8 characters.'), findsOneWidget);
    expect(api.requests.where((r) => r.path.endsWith('/register')), isEmpty);
  });

  testWidgets('sign up creates the account and shows the site link', (tester) async {
    Object? sent;
    await pumpApp(tester, (path, body) {
      if (path.endsWith('/register')) {
        sent = body;
        return (status: 200, body: authBody());
      }
      return slugFree(path, body);
    });
    await tester.tap(find.text('Create account'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('businessName')), 'Vanilla Menu');
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pumpAndSettle();
    expect(find.text('${Brand.domain}/vanillamenu'), findsOneWidget);
    expect(find.text('Available'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('email')), 'hello@vanillamenu.test');
    await tester.enterText(find.byKey(const Key('phone')), '079 123 4567');
    await tester.enterText(find.byKey(const Key('password')), 'Vanilla2026');
    await tester.ensureVisible(find.widgetWithText(FilledButton, 'Create account'));
    await tester.tap(find.widgetWithText(FilledButton, 'Create account'));
    await tester.pumpAndSettle();

    expect(sent, containsPair('phone', '+962791234567'));
    expect(sent, containsPair('businessName', 'Vanilla Menu'));
    expect(find.text('Your table is set, Vanilla Menu.'), findsOneWidget);
    expect(find.text('example.test/vanillamenu'), findsOneWidget);
  });

  testWidgets('sign up shows API field errors under the field', (tester) async {
    await pumpApp(tester, (path, body) {
      if (path.endsWith('/register')) {
        return (status: 409, body: {'title': 'Taken', 'errors': {'email': ['That email already has an account.']}});
      }
      return slugFree(path, body);
    });
    await tester.tap(find.text('Create account'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('businessName')), 'Vanilla Menu');
    await tester.enterText(find.byKey(const Key('email')), 'hello@vanillamenu.test');
    await tester.enterText(find.byKey(const Key('phone')), '791234567');
    await tester.enterText(find.byKey(const Key('password')), 'Vanilla2026');
    await tester.ensureVisible(find.widgetWithText(FilledButton, 'Create account'));
    await tester.tap(find.widgetWithText(FilledButton, 'Create account'));
    await tester.pumpAndSettle();

    expect(find.text('That email already has an account.'), findsOneWidget);
  });

  testWidgets('a wrong password shows the API message', (tester) async {
    await pumpApp(tester, (path, body) => path.endsWith('/login')
        ? (status: 401, body: {'title': "That email, phone or password doesn't match. Try again.", 'errors': <String, Object>{}})
        : (status: 404, body: null));
    await tester.tap(find.text('Log in'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('email')), 'hello@vanillamenu.test');
    await tester.enterText(find.byKey(const Key('password')), 'wrong-password');
    await tester.tap(find.widgetWithText(FilledButton, 'Log in'));
    await tester.pumpAndSettle();

    expect(find.text("That email, phone or password doesn't match. Try again."), findsOneWidget);
  });

  testWidgets('a saved session opens the welcome screen, and log out returns to start', (tester) async {
    final tokens = MemoryTokenStore();
    await tokens.save(access: 'a', refresh: 'r');
    await pumpApp(tester, (path, body) {
      if (path == '/api/v1/me') return (status: 200, body: {'userId': 'u', 'email': 'e', 'phone': null, 'business': business()});
      return (status: 204, body: null);
    }, tokens: tokens);

    expect(find.text('You are logged in. Your menu site is live at the link below.'), findsOneWidget);
    await tester.ensureVisible(find.text('Log out'));
    await tester.tap(find.text('Log out'));
    await tester.pumpAndSettle();

    expect(await tokens.read(), isNull);
    expect(find.text('Create account'), findsOneWidget);
  });

  testWidgets('Arabic devices get Arabic, right to left', (tester) async {
    await pumpApp(tester, slugFree, locale: const Locale('ar'));
    await tester.tap(find.text('إنشاء حساب'));
    await tester.pumpAndSettle();

    expect(find.text('جهّز نشاطك التجاري'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('جهّز نشاطك التجاري'))), TextDirection.rtl);
  });
}
