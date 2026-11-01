import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/core/auth/token_store.dart';
import 'package:storefront_app/core/brand.dart';
import 'package:storefront_app/core/l10n/app_language.dart';
import 'package:storefront_app/core/providers.dart';
import 'package:storefront_app/core/region.dart';
import 'package:storefront_app/features/auth/screens/signup_screen.dart';
import 'package:storefront_app/main.dart';

import 'fake_api.dart';

Future<FakeApi> pumpApp(WidgetTester tester, FakeResponse Function(String path, Object? body) handle,
    {TokenStore? tokens, LanguageStore? language, Locale? locale, bool settle = true}) async {
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
      languageStoreProvider.overrideWithValue(language ?? MemoryLanguageStore()),
      httpAdapterProvider.overrideWithValue(api),
    ],
    child: const StorefrontApp(),
  ));
  if (settle) await tester.pumpAndSettle();
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
    expect(find.text('List your items and prices in minutes'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);
    expect(find.text('Log in'), findsOneWidget);
  });

  testWidgets('the launch splash shows the brand, then gives way to onboarding', (tester) async {
    await pumpApp(tester, slugFree, settle: false);
    await tester.pump(const Duration(milliseconds: 2400));
    expect(find.text('Your menu, beautifully served.'), findsOneWidget);
    await tester.pumpAndSettle();
    expect(find.text('Your menu, beautifully served.'), findsNothing);
    expect(find.text('Skip'), findsOneWidget);
  });

  testWidgets('onboarding walks through three slides, then Get started opens sign-up', (tester) async {
    await pumpApp(tester, slugFree);
    await tester.tap(find.byKey(const Key('onboardingNext')));
    await tester.pumpAndSettle();
    expect(find.text('Pick one of 100 templates, then make it yours'), findsOneWidget);
    await tester.tap(find.byKey(const Key('onboardingNext')));
    await tester.pumpAndSettle();
    expect(find.text('Share one link. Go custom on Pro.'), findsOneWidget);
    expect(find.text('Get started'), findsOneWidget);
    await tester.tap(find.byKey(const Key('onboardingNext')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('businessName')), findsOneWidget);
  });

  testWidgets('sign up checks every field before calling the API', (tester) async {
    final api = await pumpApp(tester, slugFree);
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.widgetWithText(FilledButton, 'Create account'), 200, scrollable: find.byType(Scrollable).first);
    await tester.pumpAndSettle();
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
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('businessName')), 'Vanilla Menu');
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pumpAndSettle();
    expect(find.text('${Brand.domain}/vanillamenu'), findsOneWidget);
    expect(find.text('Available'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('email')), 'hello@vanillamenu.test');
    await tester.enterText(find.byKey(const Key('phone')), '202 555 0123');
    await tester.enterText(find.byKey(const Key('password')), 'Vanilla2026');
    await tester.scrollUntilVisible(find.widgetWithText(FilledButton, 'Create account'), 200, scrollable: find.byType(Scrollable).first);
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Create account'));
    await tester.pumpAndSettle();

    // A US phone: +1 and US dollars are preselected.
    expect(sent, containsPair('phone', '+12025550123'));
    expect(sent, containsPair('currencyCode', 'USD'));
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
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('businessName')), 'Vanilla Menu');
    await tester.enterText(find.byKey(const Key('email')), 'hello@vanillamenu.test');
    await tester.enterText(find.byKey(const Key('phone')), '791234567');
    await tester.enterText(find.byKey(const Key('password')), 'Vanilla2026');
    await tester.scrollUntilVisible(find.widgetWithText(FilledButton, 'Create account'), 200, scrollable: find.byType(Scrollable).first);
    await tester.pumpAndSettle();
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

  testWidgets('Arabic devices get Arabic, right to left', (tester) async {
    await pumpApp(tester, slugFree, locale: const Locale('ar'));
    await tester.tap(find.text('تخطٍّ'));
    await tester.pumpAndSettle();

    expect(find.text('جهّز نشاطك التجاري'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('جهّز نشاطك التجاري'))), TextDirection.rtl);
  });

  testWidgets('the language button on the start screen switches to Arabic, right to left, and is remembered', (tester) async {
    final language = MemoryLanguageStore();
    await pumpApp(tester, slugFree, language: language);
    expect(find.text('العربية'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('Skip'))), TextDirection.ltr);

    await tester.tap(find.byKey(const Key('languageToggle')));
    await tester.pumpAndSettle();
    expect(find.text('تخطٍّ'), findsOneWidget);
    expect(find.text('English'), findsOneWidget, reason: 'the button now offers English');
    expect(Directionality.of(tester.element(find.text('تخطٍّ'))), TextDirection.rtl);
    expect(language.language, AppLanguage.ar);

    // Start the app again with the same storage: still Arabic.
    await tester.pumpWidget(const SizedBox());
    await pumpApp(tester, slugFree, language: language);
    expect(find.text('تخطٍّ'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('تخطٍّ'))), TextDirection.rtl);

    // And back to English.
    await tester.tap(find.byKey(const Key('languageToggle')));
    await tester.pumpAndSettle();
    expect(find.text('Skip'), findsOneWidget);
    expect(language.language, AppLanguage.en);
  });

  testWidgets('an English choice wins over an Arabic phone', (tester) async {
    await pumpApp(tester, slugFree, language: MemoryLanguageStore(AppLanguage.en), locale: const Locale('ar'));
    expect(find.text('Skip'), findsOneWidget);
  });

  testWidgets('sign-up and log-in have the language button, and sign-up sends the chosen language', (tester) async {
    Object? sent;
    await pumpApp(tester, (path, body) {
      if (path.endsWith('/register')) {
        sent = body;
        return (status: 200, body: authBody());
      }
      return slugFree(path, body);
    });
    await tester.tap(find.text('Log in'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('languageToggle')), findsOneWidget);
    await tester.tap(find.byTooltip(MaterialLocalizations.of(tester.element(find.byType(Scaffold).first)).backButtonTooltip));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('languageToggle')));
    await tester.pumpAndSettle();
    expect(find.text('جهّز نشاطك التجاري'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('businessName')), 'Vanilla Menu');
    await tester.enterText(find.byKey(const Key('email')), 'hello@vanillamenu.test');
    await tester.enterText(find.byKey(const Key('phone')), '079 123 4567');
    await tester.enterText(find.byKey(const Key('password')), 'Vanilla2026');
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pumpAndSettle();
    final create = find.widgetWithText(FilledButton, 'إنشاء حساب');
    await tester.scrollUntilVisible(create, 200, scrollable: find.byType(Scrollable).first);
    await tester.pumpAndSettle();
    await tester.tap(create);
    await tester.pumpAndSettle();
    expect(sent, containsPair('locale', 'ar'));
  });

  testWidgets('every API call says which language the app shows', (tester) async {
    final api = await pumpApp(tester, (path, body) => path.endsWith('/login')
        ? (status: 401, body: {'title': 'No match', 'errors': <String, Object>{}})
        : (status: 404, body: null));
    await tester.tap(find.text('Log in'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('email')), 'hello@vanillamenu.test');
    await tester.enterText(find.byKey(const Key('password')), 'wrong-password');
    await tester.tap(find.widgetWithText(FilledButton, 'Log in'));
    await tester.pumpAndSettle();
    expect(api.requests.last.headers['Accept-Language'], 'en');

    await tester.tap(find.byKey(const Key('languageToggle')));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(FilledButton).first);
    await tester.pumpAndSettle();
    expect(api.requests.last.path, endsWith('/login'));
    expect(api.requests.last.headers['Accept-Language'], 'ar');
  });

  testWidgets('following an Arabic phone, API calls ask for Arabic', (tester) async {
    final api = await pumpApp(tester, (path, body) => (status: 401, body: {'title': 'No match'}), locale: const Locale('ar'));
    await tester.tap(find.text('تسجيل الدخول'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('email')), 'hello@vanillamenu.test');
    await tester.enterText(find.byKey(const Key('password')), 'wrong-password');
    await tester.tap(find.byType(FilledButton).first);
    await tester.pumpAndSettle();
    expect(api.requests.last.headers['Accept-Language'], 'ar');
  });

  testWidgets('sign-up preselects the phone region, and the currency picker searches and sends the choice', (tester) async {
    Map<String, dynamic>? sent;
    await pumpApp(tester, (path, body) {
      if (path.endsWith('/register')) {
        sent = Map<String, dynamic>.from(body as Map);
        return (status: 200, body: authBody(currencyCode: 'EUR'));
      }
      return slugFree(path, body);
    }, locale: const Locale('en', 'JO'));
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    expect(find.text('+962'), findsOneWidget);
    await tester.scrollUntilVisible(find.byKey(const Key('currencyRow')), 200, scrollable: find.byType(Scrollable).first);
    await tester.pumpAndSettle();
    expect(find.text('Jordanian dinar · JOD'), findsOneWidget);
    expect(find.text('Your prices show in this currency. You can change it later in Settings.'), findsOneWidget);

    await tester.tap(find.byKey(const Key('currencyRow')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('currencySearch')), 'eur');
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('currency-JOD')), findsNothing);
    await tester.tap(find.byKey(const Key('currency-EUR')));
    await tester.pumpAndSettle();
    expect(find.text('Euro · EUR'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('businessName')), 'Vanilla Menu');
    await tester.enterText(find.byKey(const Key('email')), 'hello@vanillamenu.test');
    await tester.enterText(find.byKey(const Key('phone')), '079 123 4567');
    await tester.enterText(find.byKey(const Key('password')), 'Vanilla2026');
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.widgetWithText(FilledButton, 'Create account'), 200, scrollable: find.byType(Scrollable).first);
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Create account'));
    await tester.pumpAndSettle();

    expect(sent!['phone'], '+962791234567');
    expect(sent!['currencyCode'], 'EUR');
    expect(sent!['timeZone'], 'Asia/Amman');
  });

  test('the phone region picks the calling code and time zone', () {
    expect(countryCodes.first, '+1');
    expect(countryCodes.toSet().length, countryCodes.length, reason: 'no repeated codes');
    expect(defaultDialCode('AE'), '+971');
    expect(defaultDialCode('CA'), '+1');
    expect(defaultDialCode('ZZ'), '+1');
    expect(deviceCountry(const [Locale('ar'), Locale('ar', 'eg')]), 'EG');
    expect(deviceCountry(const [Locale('en')]), isNull);

    expect(guessTimeZone(country: 'SA', standardOffset: const Duration(hours: 3)), 'Asia/Riyadh');
    expect(guessTimeZone(country: 'US', standardOffset: const Duration(hours: -6)), 'America/Chicago');
    expect(guessTimeZone(country: 'AU', standardOffset: const Duration(hours: 10)), 'Australia/Sydney');
    expect(guessTimeZone(country: null, standardOffset: const Duration(hours: 5, minutes: 30)), 'Asia/Kolkata');
    expect(guessTimeZone(country: 'ZZ', standardOffset: Duration.zero), 'UTC');
    expect(guessTimeZone(country: null, standardOffset: const Duration(hours: 13, minutes: 45)), isNull);
  });
}
