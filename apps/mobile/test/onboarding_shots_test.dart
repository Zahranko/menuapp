// Onboarding pictures (assets/onboarding/products_*.webp and templates_*.webp): renders the real Products and Templates
// screens for the brand-named demo business, in English and Arabic (Cairo, from the Body and Display fonts).
// Skipped unless ONBOARDING_SHOTS names the work folder; scripts/onboarding-shots.sh runs it between the two
// Playwright steps (apps/sites/e2e/onboarding-shots.spec.ts), which supply <dir>/img and turn the PNGs into WebP:
//   flutter test test/onboarding_shots_test.dart --update-goldens --dart-define-from-file=../../brand.json --dart-define=ONBOARDING_SHOTS=<dir>
import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/core/auth/token_store.dart';
import 'package:storefront_app/core/brand.dart';
import 'package:storefront_app/core/l10n/app_language.dart';
import 'package:storefront_app/core/providers.dart';
import 'package:storefront_app/core/router.dart';
import 'package:storefront_app/core/widgets/form_widgets.dart';
import 'package:storefront_app/features/site/site_web_view.dart';
import 'package:storefront_app/main.dart';

import 'fake_api.dart';
import 'fake_backend.dart';

const _dir = String.fromEnvironment('ONBOARDING_SHOTS');

/// The demo business's slug, as the sites' fixtures make it (apps/sites/lib/brand.ts demoSlug).
final _slug = '${Brand.brandShortName.toLowerCase().replaceAll(RegExp('[^a-z0-9]'), '')}menu';

/// The phone, in logical pixels, at 2x. The top 50 are the status bar, which the onboarding draws itself.
const _phone = Size(390, 844);
const _statusBar = 50.0;

Future<void> _loadFonts() async {
  Future<void> family(String name, List<Future<ByteData>> fonts) async {
    final loader = FontLoader(name);
    for (final f in fonts) {
      loader.addFont(f);
    }
    await loader.load();
  }

  Future<ByteData> file(String path) async => ByteData.view(File(path).readAsBytesSync().buffer);
  final sdkFonts = '${Platform.environment['FLUTTER_ROOT']}/bin/cache/artifacts/material_fonts';
  await family('Display', [for (final w in ['SemiBold', 'Bold', 'ExtraBold']) rootBundle.load('assets/fonts/Display-$w.ttf')]);
  await family('Body', [for (final w in ['Regular', 'Medium', 'SemiBold', 'Bold']) rootBundle.load('assets/fonts/Body-$w.ttf')]);
  await family('Roboto', [for (final w in ['Regular', 'Medium', 'Bold']) file('$sdkFonts/Roboto-$w.ttf')]);
  await family('MaterialIcons', [file('$sdkFonts/MaterialIcons-Regular.otf')]);
}

typedef _Item = (String name, double price, String? label, String photo, bool available);

const List<(String, List<_Item>)> _menuEn = [
  ('Coffee', [
    ('Flat white', 3.25, 'Best seller', 'latte', true),
    ('Spanish latte', 3.75, 'Signature', 'spanish', true),
    ('Cardamom cortado', 2.75, 'New', 'cortado', true),
    ('Iced caramel latte', 3.95, null, 'iced', false),
  ]),
  ('Bakery', [
    ('Pistachio croissant', 2.25, 'Best seller', 'croissant', true),
    ("Za'atar croissant", 1.95, null, 'zaatar', true),
    ('Date and tahini cookie', 1.5, null, 'cookie', true),
  ]),
  ('Desserts', [
    ('Kunafa cheesecake', 4.5, 'Signature', 'kunafa', true),
    ('Saffron cake', 4.0, null, 'cake', true),
  ]),
  ('Tea', [
    ('Karak chai', 2.5, null, 'karak', true),
  ]),
];

const List<(String, List<_Item>)> _menuAr = [
  ('قهوة', [
    ('فلات وايت', 3.25, 'الأكثر طلبًا', 'latte', true),
    ('سبانش لاتيه', 3.75, 'مميز', 'spanish', true),
    ('كورتادو بالهيل', 2.75, 'جديد', 'cortado', true),
    ('آيس لاتيه بالكراميل', 3.95, null, 'iced', false),
  ]),
  ('مخبوزات', [
    ('كرواسون بالفستق', 2.25, 'الأكثر طلبًا', 'croissant', true),
    ('كرواسون بالزعتر', 1.95, null, 'zaatar', true),
    ('كوكيز التمر والطحينة', 1.5, null, 'cookie', true),
  ]),
  ('حلويات', [
    ('تشيز كيك بالكنافة', 4.5, 'مميز', 'kunafa', true),
    ('كيكة الزعفران', 4.0, null, 'cake', true),
  ]),
  ('شاي', [
    ('شاي كرك', 2.5, null, 'karak', true),
  ]),
];

/// The gallery's first cards: the demo business's own template (Souq) first, then the most colorful ones.
const _first = ['souq', 'lumen', 'garden', 'bloom', 'chalkboard', 'maison', 'ember', 'archstory', 'nightmarket', 'zen', 'pizzeria', 'linen'];

late final String _host;

FakeBackend _backendFor(bool ar) {
  final b = FakeBackend(plan: 'pro');
  b.businessData
    ..['name'] = ar && Brand.brandNameAr.isNotEmpty ? Brand.brandNameAr : Brand.brandName
    ..['slug'] = _slug
    ..['siteUrl'] = 'https://${Brand.domain}/$_slug'
    ..['locale'] = ar ? 'ar' : 'en';
  b.categories.clear();
  b.products.clear();
  var n = 0;
  for (final (ci, (cat, items)) in (ar ? _menuAr : _menuEn).indexed) {
    b.categories.add({'id': 'c$ci', 'name': cat, 'sortOrder': ci});
    for (final (name, price, label, photo, available) in items) {
      b.products.add({
        'id': 'p${n++}',
        'categoryId': 'c$ci',
        'name': name,
        'description': null,
        'price': price,
        'imageUrl': '$_host/photos/$photo.png',
        'label': label,
        'isAvailable': available,
        'isFeatured': false,
        'sortOrder': n,
        'updatedAt': '2026-01-01T00:00:00Z',
      });
    }
  }
  final registry = (jsonDecode(File('../sites/templates/registry.json').readAsStringSync())['templates'] as List).cast<Map<String, dynamic>>();
  final ordered = [
    for (final id in _first) registry.firstWhere((t) => t['id'] == id),
    ...registry.where((t) => !_first.contains(t['id'])),
  ];
  FakeBackend.templates
    ..clear()
    ..addAll([
      // 100 cards like the real gallery; past the real templates they reuse their pictures (only the first cards show).
      for (var i = 0; i < 100; i++)
        () {
          final t = ordered[i % ordered.length];
          return <String, Object>{
            'id': i < ordered.length ? t['id'] as String : '${t['id']}-$i',
            'number': i < ordered.length ? (t['number'] as num).toInt() : i + 1,
            'name': t['name'] as String,
            'category': t['category'] as String,
            // Short: dio decodes bodies over 50 KB in an isolate, which never finishes in a widget test.
            if (t['ar'] != null) 'ar': {'name': t['ar']['name'], 'category': t['ar']['category']},
            'thumbnailUrl': '$_host/templates/${t['id']}/thumbnail.png',
            'tier': (t['tier'] ?? 'basic') as String,
            'version': 1,
            'schema': const <Object>[],
            'defaults': const <String, Object>{},
          };
        }(),
    ]);
  return b;
}

void _setHeight(WidgetTester tester, double height) {
  tester.view.physicalSize = Size(_phone.width * 2, height * 2);
}

Future<void> _pumpApp(WidgetTester tester, FakeBackend backend, {required bool ar}) async {
  final tokens = MemoryTokenStore();
  await tokens.save(access: 'a', refresh: 'r');
  tester.platformDispatcher.localesTestValue = [Locale(ar ? 'ar' : 'en')];
  addTearDown(tester.platformDispatcher.clearLocalesTestValue);
  _setHeight(tester, _phone.height);
  tester.view.devicePixelRatio = 2;
  tester.view.padding = const FakeViewPadding(top: _statusBar * 2, bottom: 30 * 2);
  tester.view.viewPadding = const FakeViewPadding(top: _statusBar * 2, bottom: 30 * 2);
  addTearDown(tester.view.reset);
  debugDisableShadows = false;
  await tester.pumpWidget(ProviderScope(
    overrides: [
      tokenStoreProvider.overrideWithValue(tokens),
      languageStoreProvider.overrideWithValue(MemoryLanguageStore(ar ? AppLanguage.ar : AppLanguage.en)),
      httpAdapterProvider.overrideWithValue(FakeApi(backend.handle)),
      webViewBuilderProvider.overrideWithValue((url, reload) => const SizedBox()),
    ],
    child: const StorefrontApp(),
  ));
  await tester.pumpAndSettle();
}

Future<void> _settle(WidgetTester tester) async {
  for (var i = 0; i < 20; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}

Future<void> _go(WidgetTester tester, String path) async {
  ProviderScope.containerOf(tester.element(find.byType(StorefrontApp))).read(routerProvider).go(path);
  await _settle(tester);
}

/// Loads every picture before the screens ask for it, so they find it in the image cache.
Future<void> _preload(WidgetTester tester) async {
  final urls = [
    for (final f in Directory('$_dir/img/photos').listSync()) '$_host/photos/${f.uri.pathSegments.last}',
    for (final f in Directory('$_dir/img/templates').listSync()) '$_host/templates/${f.uri.pathSegments.where((s) => s.isNotEmpty).last}/thumbnail.png',
  ];
  await tester.runAsync(() => Future.wait([
        for (final u in urls)
          () {
            final done = Completer<void>();
            NetworkImage(u).resolve(ImageConfiguration.empty).addListener(ImageStreamListener(
                  (_, _) => done.isCompleted ? null : done.complete(),
                  onError: (e, _) => done.isCompleted ? null : done.completeError(e),
                ));
            return done.future;
          }(),
      ]));
}

final _bars = <String, List<double>>{};

/// Makes the screen taller by [extra] (the part the finish step cuts out), then saves it and the bar to cut.
Future<void> _shot(WidgetTester tester, String name, Finder bar, double Function(Rect bar) extra) async {
  _setHeight(tester, _phone.height + extra(tester.getRect(bar)));
  await _settle(tester);
  final r = tester.getRect(bar);
  _bars['$name-bar'] = [r.left, r.top, r.right, r.bottom];
  await expectLater(find.byType(StorefrontApp), matchesGoldenFile(Uri.file('$_dir/$name.png')));
  // Back to the test default before the test ends, or flutter_test reports a changed debug variable.
  debugDisableShadows = true;
}

void main() {
  HttpServer? server;
  setUpAll(() async {
    if (_dir.isEmpty) return;
    HttpOverrides.global = null;
    await _loadFonts();
    // Serves <dir>/img (product photos and template thumbnails from the Playwright step) to the screens.
    server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    _host = 'http://127.0.0.1:${server!.port}';
    server!.listen((request) async {
      final file = File('$_dir/img${request.uri.path}');
      if (file.existsSync()) {
        request.response.headers.contentType = ContentType('image', 'png');
        await request.response.addStream(file.openRead());
      } else {
        request.response.statusCode = 404;
      }
      await request.response.close();
    });
  });
  tearDownAll(() async {
    if (_dir.isEmpty) return;
    await server?.close(force: true);
    File('$_dir/rects.json').writeAsStringSync(jsonEncode(_bars));
  });

  for (final ar in [false, true]) {
    final lang = ar ? 'ar' : 'en';
    testWidgets('products $lang', skip: _dir.isEmpty, (tester) async {
      HttpOverrides.global = null;
      await _preload(tester);
      await _pumpApp(tester, _backendFor(ar), ar: ar);
      await _go(tester, '/menu');
      // The site link bar goes: the picture shows the products right under the header.
      final bar = find.ancestor(of: find.text('${Brand.domain}/$_slug'), matching: find.byType(Container)).first;
      await _shot(tester, 'products-$lang', bar, (r) => r.height);
    });
    testWidgets('templates $lang', skip: _dir.isEmpty, (tester) async {
      HttpOverrides.global = null;
      await _preload(tester);
      await _pumpApp(tester, _backendFor(ar), ar: ar);
      await _go(tester, '/templates');
      // The back button header goes; its status bar space stays.
      await _shot(tester, 'templates-$lang', find.byType(AuthHeader), (r) => r.bottom - _statusBar);
    });
  }
}
