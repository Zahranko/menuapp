import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;
import 'package:qr/qr.dart' show QrErrorCorrectLevel;
import 'package:storefront_app/core/api/models.dart';
import 'package:storefront_app/core/auth/token_store.dart';
import 'package:storefront_app/core/brand.dart';
import 'package:storefront_app/core/l10n/app_language.dart';
import 'package:storefront_app/core/providers.dart';
import 'package:storefront_app/features/plan/plan_models.dart';
import 'package:storefront_app/features/qr/image_export.dart';
import 'package:storefront_app/features/qr/qr_code.dart';
import 'package:storefront_app/features/qr/qr_screen.dart';
import 'package:storefront_app/features/site/site_web_view.dart';
import 'package:storefront_app/main.dart';
import 'package:zxing2/qrcode.dart';

import 'fake_api.dart';
import 'fake_backend.dart';

/// Reads a QR code from RGBA pixels with a pure-Dart decoder (a port of ZXing), as a phone camera app would.
String decodeRgba(Uint8List rgba, int width, int height) {
  final pixels = Int32List(width * height);
  for (var i = 0; i < pixels.length; i++) {
    final o = i * 4;
    pixels[i] = (rgba[o + 3] << 24) | (rgba[o] << 16) | (rgba[o + 1] << 8) | rgba[o + 2];
  }
  return QRCodeReader().decode(BinaryBitmap(HybridBinarizer(RGBLuminanceSource(width, height, pixels)))).text;
}

String decodePng(Uint8List png) {
  final image = img.decodePng(png)!.convert(numChannels: 4);
  return decodeRgba(image.getBytes(order: img.ChannelOrder.rgba), image.width, image.height);
}

const _boundary = Key('boundary');

/// Draws [child] and returns what a scanner reads from it.
Future<String> scan(WidgetTester tester, Widget child) async {
  await tester.pumpWidget(Directionality(
    textDirection: TextDirection.ltr,
    child: Center(child: RepaintBoundary(key: _boundary, child: child)),
  ));
  final boundary = tester.renderObject<RenderRepaintBoundary>(find.byKey(_boundary));
  return (await tester.runAsync(() async {
    final image = await boundary.toImage(pixelRatio: 2);
    final data = await image.toByteData(format: ui.ImageByteFormat.rawRgba);
    return decodeRgba(data!.buffer.asUint8List(), image.width, image.height);
  }))!;
}

/// A dark square standing in for a logo: the worst case for the covered middle.
const _logo = ColoredBox(color: Color(0xFF000000));

class FakeExporter implements ImageExporter {
  final saved = <(String, Uint8List)>[];
  final shared = <(String, Uint8List, String)>[];

  @override
  Future<void> save(Uint8List png, String name) async => saved.add((name, png));

  @override
  Future<void> share(Uint8List png, String name, {required String text, Rect? origin}) async => shared.add((name, png, text));
}

Future<FakeExporter> pumpQrScreen(WidgetTester tester, FakeBackend backend, {Locale locale = const Locale('en')}) async {
  final exporter = FakeExporter();
  final tokens = MemoryTokenStore();
  await tokens.save(access: 'a', refresh: 'r');
  tester.platformDispatcher.localesTestValue = [locale];
  addTearDown(tester.platformDispatcher.clearLocalesTestValue);
  tester.view.physicalSize = const Size(1170, 2532);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(ProviderScope(
    overrides: [
      tokenStoreProvider.overrideWithValue(tokens),
      languageStoreProvider.overrideWithValue(MemoryLanguageStore()),
      httpAdapterProvider.overrideWithValue(FakeApi(backend.handle)),
      webViewBuilderProvider.overrideWithValue((url, reload) => Text('web $url')),
      imageExporterProvider.overrideWithValue(exporter),
    ],
    child: const StorefrontApp(),
  ));
  await tester.pumpAndSettle();
  await tester.tap(find.byKey(const Key('qrButton')));
  await tester.pumpAndSettle();
  return exporter;
}

/// Lets a picture export (which renders off the fake clock) finish.
Future<void> finishExport(WidgetTester tester) async {
  for (var i = 0; i < 5; i++) {
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 200)));
    await tester.pump();
  }
}

void main() {
  final siteUrl = 'https://${Brand.domain}/vanillamenu';
  // The fake API's site link (its own test domain, never the brand's).
  const fakeSiteUrl = 'https://example.test/vanillamenu';

  test('the code opens the site link, or the own domain once it is live', () {
    final business = Business.fromJson({'id': 'b1', 'name': 'Vanilla Menu', 'slug': 'vanillamenu', 'siteUrl': siteUrl});
    DomainRequestInfo request(String status) => DomainRequestInfo(domain: 'menu.vanilla.test', status: status, createdAt: DateTime(2026));
    expect(qrUrlFor(business, null), siteUrl);
    expect(qrUrlFor(business, request('verifying')), siteUrl);
    expect(qrUrlFor(business, request('active')), 'https://menu.vanilla.test');
  });

  test('every code color is dark enough to scan on white', () {
    for (final c in qrColors()) {
      expect(contrastOnWhite(c), greaterThanOrEqualTo(7), reason: '$c');
    }
  });

  test('a logo switches to the highest error correction', () {
    expect(QrMatrix(siteUrl, withLogo: true).errorCorrectLevel, QrErrorCorrectLevel.high);
    expect(QrMatrix(siteUrl, withLogo: false).errorCorrectLevel, QrErrorCorrectLevel.quartile);
  });

  testWidgets('the drawn code decodes to the site address', (tester) async {
    expect(await scan(tester, QrView(data: siteUrl, color: qrColors().first, size: 240)), siteUrl);
  });

  testWidgets('it still decodes with a logo covering the middle, in every color', (tester) async {
    for (final color in qrColors()) {
      expect(await scan(tester, QrView(data: siteUrl, color: color, size: 240, withLogo: true, logo: _logo)), siteUrl);
    }
  });

  testWidgets('a long address with a logo still decodes', (tester) async {
    final long = 'https://${Brand.domain}/${'a' * 30}';
    final own = 'https://the-golden-spoon-family-restaurant-old-town.example.test';
    for (final url in [long, own]) {
      expect(await scan(tester, QrView(data: url, color: qrColors()[1], size: 240, withLogo: true, logo: _logo)), url);
    }
  });

  testWidgets('the QR screen opens from My menu, saves and shares a code that decodes to the site', (tester) async {
    final exporter = await pumpQrScreen(tester, FakeBackend());
    expect(find.text('Your QR code'), findsOneWidget);
    expect(find.text('example.test/vanillamenu'), findsWidgets);

    await tester.tap(find.byKey(const Key('qrColor2')));
    await tester.pump();
    await tester.tap(find.byKey(const Key('qr-save')));
    await finishExport(tester);
    expect(exporter.saved.single.$1, 'qr');
    expect(img.decodePng(exporter.saved.single.$2)!.width, QrScreen.cardWidth);
    expect(decodePng(exporter.saved.single.$2), fakeSiteUrl);
    expect(find.text('Saved to your photos'), findsOneWidget);

    await tester.tap(find.byKey(const Key('qr-share')));
    await finishExport(tester);
    expect(exporter.shared.single.$3, 'See our menu: $fakeSiteUrl');
  });

  testWidgets('the poster is A-paper sized and its code decodes', (tester) async {
    final exporter = await pumpQrScreen(tester, FakeBackend());
    await tester.ensureVisible(find.byKey(const Key('poster-save')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('poster-save')));
    await finishExport(tester);
    final poster = img.decodePng(exporter.saved.single.$2)!;
    expect(poster.width, QrScreen.posterWidth);
    expect(poster.height / poster.width, closeTo(1.4142, 0.01));
    expect(decodePng(exporter.saved.single.$2), fakeSiteUrl);
    // Both languages, the website's first.
    expect(find.text('Scan for our menu'), findsOneWidget);
    expect(find.text('امسح الرمز لتصفح قائمتنا'), findsOneWidget);
  });

  testWidgets('the live own domain is what the code opens', (tester) async {
    final backend = FakeBackend()
      ..domainRequest = {'domain': 'menu.vanilla.test', 'status': 'active', 'createdAt': '2026-01-01T00:00:00Z', 'staffNote': null, 'dnsTarget': ''};
    final exporter = await pumpQrScreen(tester, backend);
    expect(find.text('menu.vanilla.test'), findsWidgets);
    await tester.tap(find.byKey(const Key('qr-save')));
    await finishExport(tester);
    expect(decodePng(exporter.saved.single.$2), 'https://menu.vanilla.test');
  });

  testWidgets('the QR screen and poster read in Arabic', (tester) async {
    final backend = FakeBackend()..businessData['locale'] = 'ar';
    await pumpQrScreen(tester, backend, locale: const Locale('ar'));
    expect(find.text('رمز QR لموقعك'), findsOneWidget);
    expect(find.text('حفظ الصورة'), findsWidgets);
    expect(find.text('امسح الرمز لتصفح قائمتنا'), findsOneWidget);
    expect(find.text('Scan for our menu'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Settings has a way to the QR code too', (tester) async {
    final backend = FakeBackend();
    await pumpQrScreen(tester, backend);
    await tester.pageBack();
    await tester.pumpAndSettle();
    await tester.tap(find.descendant(of: find.byType(NavigationBar), matching: find.text('Settings')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('settingsQr')));
    await tester.pumpAndSettle();
    expect(find.byType(QrScreen), findsOneWidget);
  });
}
