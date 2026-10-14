// Renders Arabic screens with the real brand fonts and saves them as PNGs, for reviewing type changes.
// Skipped unless SCREENSHOT_DIR is set:
//   SCREENSHOT_DIR=/some/dir flutter test test/screenshots_test.dart --dart-define-from-file=../../brand.json
import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/core/auth/token_store.dart';
import 'package:storefront_app/core/l10n/app_language.dart';
import 'package:storefront_app/core/providers.dart';
import 'package:storefront_app/features/site/site_web_view.dart';
import 'package:storefront_app/main.dart';

import 'fake_api.dart';
import 'fake_backend.dart';
import 'widget_test.dart' show slugFree;

final _dir = Platform.environment['SCREENSHOT_DIR'];
const _boundary = Key('screenshotBoundary');

/// The fonts from pubspec.yaml plus Material icons; tests use a blank test font otherwise.
Future<void> _loadFonts() async {
  final manifest = await rootBundle.loadStructuredData<List<dynamic>>('FontManifest.json', (s) async => jsonDecode(s) as List<dynamic>);
  for (final family in manifest.cast<Map<String, dynamic>>()) {
    final loader = FontLoader(family['family'] as String);
    for (final font in (family['fonts'] as List).cast<Map<String, dynamic>>()) {
      loader.addFont(rootBundle.load(font['asset'] as String));
    }
    await loader.load();
  }
}

Future<void> _pump(WidgetTester tester, {required bool signedIn, FakeBackend? backend, Locale locale = const Locale('ar')}) async {
  tester.platformDispatcher.localesTestValue = [locale];
  addTearDown(tester.platformDispatcher.clearLocalesTestValue);
  tester.view.physicalSize = const Size(780, 1688);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  final tokens = MemoryTokenStore();
  if (signedIn) await tokens.save(access: 'a', refresh: 'r');
  await tester.pumpWidget(RepaintBoundary(
    key: _boundary,
    child: ProviderScope(
      overrides: [
        tokenStoreProvider.overrideWithValue(tokens),
        languageStoreProvider.overrideWithValue(MemoryLanguageStore()),
        httpAdapterProvider.overrideWithValue(backend != null ? FakeApi(backend.handle) : FakeApi((r) => slugFree(r.path, r.data))),
        webViewBuilderProvider.overrideWithValue((url, reload) => const SizedBox.shrink()),
      ],
      child: const StorefrontApp(),
    ),
  ));
}

Future<void> _precacheImages(WidgetTester tester) async {
  for (final e in find.byType(Image).evaluate().toList()) {
    await tester.runAsync(() => precacheImage((e.widget as Image).image, e));
  }
  await tester.pump();
}

Future<void> _save(WidgetTester tester, String name) async {
  final boundary = tester.renderObject<RenderRepaintBoundary>(find.byKey(_boundary));
  await tester.runAsync(() async {
    final image = await boundary.toImage(pixelRatio: 2);
    final png = await image.toByteData(format: ui.ImageByteFormat.png);
    File('$_dir/$name.png')
      ..createSync(recursive: true)
      ..writeAsBytesSync(png!.buffer.asUint8List());
  });
}

FakeBackend _arabicMenu() {
  final b = FakeBackend();
  b.businessData['name'] = 'فانيلا';
  final names = {'c1': 'قهوة', 'c2': 'مخبوزات', 'c3': 'حلويات'};
  for (final c in b.categories) {
    c['name'] = names[c['id']];
  }
  final products = {'p1': 'لاتيه فانيلا', 'p2': 'سبانش لاتيه', 'p3': 'كرواسون فستق'};
  for (final p in b.products) {
    p['name'] = products[p['id']];
    if (p['label'] != null) p['label'] = 'مميز';
  }
  return b;
}

/// A screenshot test with real shadows, as on a phone (tests draw them as solid outlines by default).
void _shot(String description, Future<void> Function(WidgetTester tester) body) => testWidgets(description, (tester) async {
      debugDisableShadows = false;
      try {
        await body(tester);
      } finally {
        debugDisableShadows = true;
      }
    }, skip: _dir == null);

void main() {
  setUpAll(() async {
    if (_dir != null) await _loadFonts();
  });

  _shot('Arabic splash, mid-animation and final frame', (tester) async {
    await _pump(tester, signedIn: false);
    await tester.pump(const Duration(milliseconds: 1500));
    await _save(tester, 'splash-ar-mid');
    await tester.pump(const Duration(milliseconds: 900));
    await _save(tester, 'splash-ar-final');
    await tester.pumpAndSettle();
  });

  _shot('Arabic onboarding', (tester) async {
    await _pump(tester, signedIn: false);
    await tester.pumpAndSettle();
    await _precacheImages(tester);
    await tester.pumpAndSettle();
    await _save(tester, 'onboarding-ar');
  });

  _shot('Arabic dashboard', (tester) async {
    await _pump(tester, signedIn: true, backend: _arabicMenu());
    await tester.pumpAndSettle();
    await _save(tester, 'dashboard-ar');
  });

  // The shared site options in the design editor (fonts and colors, footer, social media, order button).
  Future<void> openEditor(WidgetTester tester, Locale locale) async {
    final backend = locale.languageCode == 'ar' ? _arabicMenu() : FakeBackend();
    backend.businessData['instagram'] = 'vanillamenu';
    backend.businessData['whatsApp'] = '+15555550123';
    await _pump(tester, signedIn: true, backend: backend, locale: locale);
    await tester.pumpAndSettle();
    await tester.tap(find.descendant(of: find.byType(NavigationBar), matching: find.text(locale.languageCode == 'ar' ? 'الإعدادات' : 'Settings')));
    await tester.pumpAndSettle();
    await tester.tap(find.text(locale.languageCode == 'ar' ? 'تعديل التصميم' : 'Edit design'));
    await tester.pumpAndSettle();
  }

  Future<void> scrollToTop(WidgetTester tester, Finder finder) async {
    await tester.scrollUntilVisible(finder, 300, scrollable: find.byType(Scrollable).hitTestable().first);
    await tester.pumpAndSettle();
    // Put the found widget near the top of the list.
    await tester.drag(find.byType(Scrollable).hitTestable().first, Offset(0, -(tester.getTopLeft(finder).dy - 400)));
    await tester.pumpAndSettle();
  }

  for (final locale in const [Locale('en'), Locale('ar')]) {
    final lang = locale.languageCode;
    _shot('$lang editor: social media and order button', (tester) async {
      await openEditor(tester, locale);
      await scrollToTop(tester, find.text(lang == 'ar' ? 'حسابات التواصل الاجتماعي' : 'Social media'));
      await _save(tester, 'editor-social-$lang');
      await scrollToTop(tester, find.text(lang == 'ar' ? 'زر الطلب' : 'Order button'));
      await _save(tester, 'editor-order-button-$lang');
    });
  }

  _shot('editor: fonts and the custom color picker', (tester) async {
    await openEditor(tester, const Locale('en'));
    await scrollToTop(tester, find.text('Fonts & colors'));
    await _save(tester, 'editor-fonts-en');
    await tester.scrollUntilVisible(find.byKey(const Key('setting-accent-custom')), -300, scrollable: find.byType(Scrollable).hitTestable().first);
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('setting-accent-custom')));
    await tester.pumpAndSettle();
    await _save(tester, 'editor-custom-color-en');
  });

  _shot('Arabic business info with social accounts', (tester) async {
    await _pump(tester, signedIn: true, backend: _arabicMenu()..businessData['facebook'] = 'vanillamenu', locale: const Locale('ar'));
    await tester.pumpAndSettle();
    await tester.tap(find.descendant(of: find.byType(NavigationBar), matching: find.text('الإعدادات')));
    await tester.pumpAndSettle();
    await scrollToTop(tester, find.text('حسابات التواصل والاتصال'));
    await _save(tester, 'settings-social-ar');
  });
}

