import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/features/ai/ai_repository.dart';

import 'dashboard_test.dart' show openTab, pumpSignedIn, scrollTo, tapIn;
import 'fake_backend.dart';

/// A 1×1 PNG, so photo thumbnails decode in tests.
final _png = base64Decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');

class _FakePicker implements AiPhotoPicker {
  int asked = 0;

  @override
  Future<AiPhoto?> one({required bool camera}) async {
    asked++;
    return (bytes: _png, name: 'menu.png');
  }

  @override
  Future<List<AiPhoto>> many({required int limit}) async {
    asked++;
    return [for (var i = 0; i < limit; i++) (bytes: _png, name: 'menu$i.png')];
  }
}

Map<String, Object?> _status({bool available = true, int remaining = 7}) =>
    {'available': available, 'remainingThisMonth': remaining, 'monthlyLimit': 30};

/// What `POST /ai/menu` answers: Coffee exists already; Sweets is new; one price was not on the menu.
const _draft = <String, Object?>{
  'currencyCode': 'USD',
  'menuCurrency': 'JOD',
  'remainingThisMonth': 6,
  'categories': [
    {
      'name': 'Coffee',
      'nameAr': 'قهوة',
      'products': [
        {'name': 'Turkish coffee', 'nameAr': 'قهوة تركية', 'description': null, 'price': 1.5},
        {'name': 'Cortado', 'nameAr': null, 'description': 'Small and strong', 'price': 2.25},
      ],
    },
    {
      'name': 'Sweets',
      'nameAr': 'حلويات',
      'products': [
        {'name': 'Knafeh', 'nameAr': 'كنافة', 'description': null, 'price': null},
      ],
    },
  ],
};

void main() {
  testWidgets('without the helper on the server, its entries stay hidden', (tester) async {
    await pumpSignedIn(tester, FakeBackend());
    expect(find.byKey(const Key('aiMenuFromPhoto')), findsNothing);

    await openTab(tester, 'Settings');
    await tester.tap(find.text('Edit design'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('aiDesignHelper')), findsNothing);
  });

  testWidgets('when the helper is switched off, its entries are dimmed with a friendly note', (tester) async {
    final picker = _FakePicker();
    final backend = FakeBackend()..aiStatus = _status(available: false, remaining: 0);
    await pumpSignedIn(tester, backend, overrides: [aiPhotoPickerProvider.overrideWithValue(picker)]);

    expect(find.text('Add from a menu photo'), findsOneWidget);
    expect(find.text("The AI helper isn't switched on yet. You can still change everything yourself."), findsOneWidget);
    await tester.tap(find.byKey(const Key('aiMenuFromPhoto')));
    await tester.pumpAndSettle();
    expect(find.text('Read my menu'), findsNothing, reason: 'nothing opens while the helper is off');

    await openTab(tester, 'Settings');
    await tester.tap(find.text('Edit design'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('aiDesignHelper')), findsOneWidget);
    await tapIn(tester, find.byKey(const Key('aiWriteText')));
    expect(find.text('Suggest'), findsNothing);
    expect(picker.asked, 0);
  });

  testWidgets('used up this month says so and opens nothing', (tester) async {
    await pumpSignedIn(tester, FakeBackend()..aiStatus = _status(remaining: 0));
    expect(find.text("You've used all your AI helper requests for this month. More arrive on the 1st."), findsOneWidget);
    await tester.tap(find.byKey(const Key('aiMenuFromPhoto')));
    await tester.pumpAndSettle();
    expect(find.text('Read my menu'), findsNothing);
  });

  testWidgets('a menu photo becomes a draft to check, and the chosen items are added in one go', (tester) async {
    final backend = FakeBackend()
      ..aiStatus = _status()
      ..aiMenu = _draft;
    await pumpSignedIn(tester, backend, overrides: [aiPhotoPickerProvider.overrideWithValue(_FakePicker())]);
    expect(find.text('7 AI uses left this month'), findsOneWidget);

    await tester.tap(find.byKey(const Key('aiMenuFromPhoto')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Choose from photos'));
    await tester.pumpAndSettle();
    expect(find.text('3 of 3 photos'), findsOneWidget);
    await tester.tap(find.byTooltip('Remove photo').first);
    await tester.pumpAndSettle();
    expect(find.text('2 of 3 photos'), findsOneWidget);
    await tester.tap(find.byKey(const Key('aiReadMenu')));
    await tester.pumpAndSettle();

    // The review screen: names and prices to check, existing and new categories marked.
    expect(find.text('Check your menu'), findsOneWidget);
    expect(find.text('Adds to your category'), findsOneWidget);
    expect(find.text('New category'), findsOneWidget);
    expect(find.textContaining('The menu shows prices in JOD'), findsOneWidget);
    expect(find.text('Add 3 items'), findsOneWidget);

    // Skip the cortado, then try to add: the knafeh has no price yet.
    await tapIn(tester, find.bySemanticsLabel('Add this item').at(1));
    expect(find.text('Add 2 items'), findsOneWidget);
    await tester.tap(find.byKey(const Key('aiAddItems')));
    await tester.pumpAndSettle();
    expect(find.text('Enter a price.'), findsOneWidget);
    expect(backend.imports, isEmpty);

    await scrollTo(tester, find.text('Knafeh'));
    final knafehPrice = find.descendant(of: find.ancestor(of: find.text('Knafeh'), matching: find.byType(Row)).first, matching: find.byType(TextField)).last;
    await tester.enterText(knafehPrice, '3.5');
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('aiAddItems')));
    await tester.pumpAndSettle();

    expect(backend.imports.single['categories'], [
      {
        'name': 'Coffee',
        'products': [
          {'name': 'Turkish coffee', 'description': null, 'price': 1.5},
        ],
      },
      {
        'name': 'Sweets',
        'products': [
          {'name': 'Knafeh', 'description': null, 'price': 3.5},
        ],
      },
    ]);
    // Back on My menu, with the new items in the list.
    expect(find.text('2 items added to your menu.'), findsOneWidget);
    expect(find.text('Turkish coffee'), findsOneWidget);
    await scrollTo(tester, find.text('Knafeh'));
    expect(find.text('Knafeh'), findsOneWidget);
  });

  testWidgets('an Arabic website gets the Arabic names, right to left', (tester) async {
    final backend = FakeBackend()
      ..aiStatus = _status()
      ..aiMenu = _draft;
    backend.businessData['locale'] = 'ar';
    await pumpSignedIn(tester, backend, locale: const Locale('ar'), overrides: [aiPhotoPickerProvider.overrideWithValue(_FakePicker())]);

    await tester.tap(find.byKey(const Key('aiMenuFromPhoto')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('التقط صورة'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('aiReadMenu')));
    await tester.pumpAndSettle();

    expect(find.text('راجع قائمتك'), findsOneWidget);
    expect(find.text('قهوة تركية'), findsOneWidget);
    // No Arabic name came back for the cortado: the printed one stays.
    expect(find.text('Cortado'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('راجع قائمتك'))), TextDirection.rtl);
  });

  testWidgets('Write my text suggests texts that apply to the draft for the preview', (tester) async {
    final backend = FakeBackend()
      ..aiStatus = _status()
      ..aiText = {
        'settings': {'hero.title': 'Knafeh worth the trip', 'not.in.editor': 'x'},
        'productDescriptions': <Object>[],
        'remainingThisMonth': 6,
      };
    await pumpSignedIn(tester, backend);
    await openTab(tester, 'Settings');
    await tester.tap(find.text('Edit design'));
    await tester.pumpAndSettle();

    await tapIn(tester, find.byKey(const Key('aiWriteText')));
    await tester.enterText(find.byKey(const Key('aiNote')), 'Known for knafeh');
    // Starts on the site's language; the owner can ask for Arabic texts instead.
    expect(tester.widget<SegmentedButton<String>>(find.byKey(const Key('aiLanguage'))).selected, {'en'});
    await tester.tap(find.text('العربية'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('aiSuggest')));
    await tester.pumpAndSettle();

    expect(backend.aiTextRequests.single['language'], 'ar');
    expect(find.text('Knafeh worth the trip'), findsOneWidget);
    expect(find.text('Apply 1 suggestion'), findsOneWidget);
    await tester.tap(find.byKey(const Key('aiApply')));
    await tester.pumpAndSettle();

    expect(backend.draft['hero.title'], 'Knafeh worth the trip');
    expect(backend.draft.containsKey('not.in.editor'), isFalse);
    expect(find.text('Added to your design. Check the preview, then publish.'), findsOneWidget);
    expect(backend.publishedAt, isNull, reason: 'the owner still publishes');
  });
}
