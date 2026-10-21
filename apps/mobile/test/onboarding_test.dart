import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/core/brand.dart';

import 'widget_test.dart' show pumpApp, slugFree;

Iterable<String> _shownShots(WidgetTester tester) => tester
    .widgetList<Image>(find.byType(Image))
    .map((i) => i.image)
    .whereType<AssetImage>()
    .map((a) => a.assetName)
    .where((n) => n.startsWith('assets/onboarding/'));

void main() {
  test('every onboarding screenshot is bundled in English and Arabic', () async {
    TestWidgetsFlutterBinding.ensureInitialized();
    for (final shot in ['products', 'templates', 'site']) {
      for (final lang in ['en', 'ar']) {
        final data = await rootBundle.load('assets/onboarding/${shot}_$lang.webp');
        expect(data.lengthInBytes, inInclusiveRange(1000, 150 * 1024), reason: '${shot}_$lang.webp');
      }
    }
  });

  testWidgets('the slides show real screenshots in the app language', (tester) async {
    await pumpApp(tester, slugFree);
    expect(_shownShots(tester), contains('assets/onboarding/products_en.webp'));

    await pumpApp(tester, slugFree, locale: const Locale('ar'));
    expect(_shownShots(tester), contains('assets/onboarding/products_ar.webp'));
  });

  testWidgets('with reduced motion the site link is shown whole, without typing', (tester) async {
    tester.platformDispatcher.accessibilityFeaturesTestValue = const FakeAccessibilityFeatures(disableAnimations: true);
    addTearDown(tester.platformDispatcher.clearAccessibilityFeaturesTestValue);
    await pumpApp(tester, slugFree);
    for (var i = 0; i < 2; i++) {
      await tester.tap(find.byKey(const Key('onboardingNext')));
      await tester.pumpAndSettle();
    }
    expect(_shownShots(tester), contains('assets/onboarding/site_en.webp'));
    expect(find.text('${Brand.domain}/${Brand.brandShortName.toLowerCase()}menu', findRichText: true), findsOneWidget);
    await tester.pump(const Duration(seconds: 5));
    // Still the plain link: it does not switch to the custom domain on its own.
    expect(find.text('${Brand.domain}/${Brand.brandShortName.toLowerCase()}menu', findRichText: true), findsOneWidget);
  });
}
