// Screenshots of the product label chips (with a custom label) and the QR code screen and poster, in English and
// Arabic, with the real brand fonts. Skipped unless SCREENSHOT_DIR is set:
//   SCREENSHOT_DIR=/some/dir flutter test test/labels_qr_screenshots_test.dart --dart-define-from-file=../../brand.json
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
import 'package:storefront_app/features/qr/image_export.dart';
import 'package:storefront_app/features/site/site_web_view.dart';
import 'package:storefront_app/main.dart';

import 'fake_api.dart';
import 'fake_backend.dart';
import 'qr_test.dart' show FakeExporter, finishExport;

final _dir = Platform.environment['SCREENSHOT_DIR'];
const _boundary = Key('screenshotBoundary');

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

Future<FakeExporter> _pump(WidgetTester tester, FakeBackend backend, Locale locale) async {
  final exporter = FakeExporter();
  tester.platformDispatcher.localesTestValue = [locale];
  addTearDown(tester.platformDispatcher.clearLocalesTestValue);
  tester.view.physicalSize = const Size(780, 1688);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  final tokens = MemoryTokenStore();
  await tokens.save(access: 'a', refresh: 'r');
  await tester.pumpWidget(RepaintBoundary(
    key: _boundary,
    child: ProviderScope(
      overrides: [
        tokenStoreProvider.overrideWithValue(tokens),
        languageStoreProvider.overrideWithValue(MemoryLanguageStore()),
        httpAdapterProvider.overrideWithValue(FakeApi(backend.handle)),
        webViewBuilderProvider.overrideWithValue((url, reload) => const SizedBox.shrink()),
        imageExporterProvider.overrideWithValue(exporter),
      ],
      child: const StorefrontApp(),
    ),
  ));
  await tester.pumpAndSettle();
  return exporter;
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

FakeBackend _backend(String lang) {
  final b = FakeBackend();
  if (lang == 'ar') {
    b.businessData['name'] = 'فانيلا';
    b.businessData['locale'] = 'ar';
  }
  b.products[1]
    ..['label'] = 'Custom'
    ..['customLabel'] = "Chef's choice"
    ..['customLabelAr'] = 'اختيار الشيف';
  b.products[2]['label'] = 'New';
  return b;
}

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

  for (final lang in ['en', 'ar']) {
    _shot('$lang product list and editor with a custom label', (tester) async {
      await _pump(tester, _backend(lang), Locale(lang));
      await _save(tester, 'mobile-products-$lang');
      await tester.tap(find.text('Spanish latte'));
      await tester.pumpAndSettle();
      final chips = find.byKey(const Key('label-Custom'));
      await tester.scrollUntilVisible(chips, 300, scrollable: find.byType(Scrollable).hitTestable().first);
      await tester.drag(find.byType(Scrollable).hitTestable().first, Offset(0, -(tester.getTopLeft(chips).dy - 360)));
      await tester.pumpAndSettle();
      await _save(tester, 'mobile-editor-custom-label-$lang');
    });

    _shot('$lang QR screen and poster', (tester) async {
      final exporter = await _pump(tester, _backend(lang), Locale(lang));
      await tester.tap(find.byKey(const Key('qrButton')));
      await tester.pumpAndSettle();
      await _save(tester, 'mobile-qr-$lang');
      await tester.tap(find.byKey(const Key('qrColor3')));
      await tester.pumpAndSettle();
      await tester.scrollUntilVisible(find.byKey(const Key('poster-save')), 300, scrollable: find.byType(Scrollable).hitTestable().first);
      await tester.pumpAndSettle();
      await _save(tester, 'mobile-qr-poster-section-$lang');
      await tester.tap(find.byKey(const Key('poster-save')));
      await finishExport(tester);
      await tester.tap(find.byKey(const Key('qr-save')), warnIfMissed: false);
      File('$_dir/poster-$lang.png').writeAsBytesSync(exporter.saved.first.$2);
    });
  }
}
