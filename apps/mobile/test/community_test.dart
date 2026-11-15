import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/core/router.dart';
import 'package:storefront_app/features/community/community_controller.dart';
import 'package:storefront_app/features/community/community_models.dart';
import 'package:storefront_app/main.dart';

import 'dashboard_test.dart' show pumpSignedIn, tapIn;
import 'fake_backend.dart';

/// The Studio template, as the community tests need it: a design studio style sheet makes a design shareable.
final _studio = <String, Object?>{
  'id': 'studio',
  'number': 31,
  'name': 'Studio',
  'category': 'Your own design',
  'description': 'Designed with the AI helper',
  'thumbnailUrl': '/templates/studio/thumbnail.png',
  'tier': 'pro',
  'version': 1,
  'schema': [
    {'key': 'theme', 'type': 'palette', 'label': 'Theme', 'group': 'Brand', 'options': ['light', 'night']},
    {'key': 'studio.css', 'type': 'css', 'label': 'Design studio style', 'group': 'Design studio', 'max': 20000},
  ],
  'defaults': {'theme': 'light', 'studio.css': ''},
};

FakeBackend _backend({String plan = 'pro', String template = 'souq'}) {
  final backend = FakeBackend(plan: plan)
    ..extraTemplates.add(_studio)
    ..community.add(FakeBackend.communityDesign('nyt2fx7k', 'Night shift', uses: 42));
  if (template == 'studio') {
    backend
      ..templateId = 'studio'
      ..draft = {'theme': 'night', 'studio.css': 'h1 { letter-spacing: .1em }'};
  }
  return backend;
}

Future<void> _go(WidgetTester tester, String path) async {
  ProviderScope.containerOf(tester.element(find.byType(StorefrontApp))).read(routerProvider).push(path);
  await tester.pumpAndSettle();
}

void main() {
  test('finds the share code in a code or a link', () {
    expect(shareCodeIn('NYT2FX7K'), 'nyt2fx7k');
    expect(shareCodeIn(' https://example.test/community/nyt2fx7k '), 'nyt2fx7k');
    expect(shareCodeIn('https://example.test/ar/community/nyt2fx7k?x=1'), 'nyt2fx7k');
    expect(shareCodeIn('https://example.test/community-preview/nyt2fx7k/ar'), 'nyt2fx7k');
    expect(shareCodeIn('night shift'), isNull);
    expect(shareCodeIn('https://example.test/community/u/nightmaker'), isNull);
    expect(shareCodeIn('nyt2fx7o'), isNull);
  });

  testWidgets('the template gallery opens the community, and a design goes on the site as a draft', (tester) async {
    final backend = _backend();
    await pumpSignedIn(tester, backend);
    await _go(tester, '/templates');

    await tapIn(tester, find.byKey(const Key('openCommunity')));
    expect(find.text('Community templates'), findsOneWidget);
    expect(find.text('Night shift'), findsOneWidget);
    expect(find.text('42 uses'), findsOneWidget);

    await tapIn(tester, find.byKey(const Key('communityCard-nyt2fx7k')));
    expect(find.text('web https://example.test/community-preview/nyt2fx7k #0'), findsOneWidget);
    expect(find.text('Design code nyt2fx7k'), findsOneWidget);

    await tapIn(tester, find.byKey(const Key('communityUse')));
    await tapIn(tester, find.byKey(const Key('communityUseConfirm')));
    expect(backend.applied, ['nyt2fx7k']);
    expect(backend.templateId, 'studio');
    expect(backend.publishedAt, isNull);
    // The editor opens on the new draft, with the community card for Studio sites.
    expect(find.byKey(const Key('editorSettings')), findsOneWidget);
  });

  testWidgets('a Basic owner is offered Pro before using a Pro design', (tester) async {
    final backend = _backend(plan: 'basic');
    await pumpSignedIn(tester, backend);
    await _go(tester, '/community/template?code=nyt2fx7k');

    await tapIn(tester, find.byKey(const Key('communityUse')));
    expect(find.text('This template is part of the Pro plan'), findsOneWidget);
    expect(backend.applied, isEmpty);
  });

  testWidgets('pasting a share link in the search opens that design; sharing it uses the link', (tester) async {
    final shared = <String>[];
    await pumpSignedIn(tester, _backend(), overrides: [shareTextProvider.overrideWithValue((text) async => shared.add(text))]);
    await _go(tester, '/community');

    await tester.enterText(find.byKey(const Key('communitySearch')), 'https://example.test/community/nyt2fx7k');
    await tester.testTextInput.receiveAction(TextInputAction.search);
    await tester.pumpAndSettle();
    expect(find.text('Design code nyt2fx7k'), findsOneWidget);

    await tapIn(tester, find.byKey(const Key('communityShareLink')));
    expect(shared, ['Night shift: https://example.test/community/nyt2fx7k']);
  });

  testWidgets('a Pro owner makes a publisher profile, shares the Studio design and deletes it', (tester) async {
    final backend = _backend(template: 'studio');
    await pumpSignedIn(tester, backend);
    await _go(tester, '/community/mine');

    await tester.enterText(find.byKey(const Key('publisherUsername')), 'taken');
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pumpAndSettle();
    expect(find.text('This username is taken. Try another one.'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('publisherUsername')), 'lina_designs');
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pumpAndSettle();
    expect(find.text('@lina_designs is free'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('publisherName')), 'Lina');
    await tapIn(tester, find.byKey(const Key('publisherSave')));
    expect(backend.publisher?['username'], 'lina_designs');
    expect(find.text('My shared designs'), findsOneWidget);

    await tapIn(tester, find.byKey(const Key('communityShareCurrent')));
    await tester.enterText(find.byKey(const Key('communityShareName')), 'Warm night');
    await tapIn(tester, find.byKey(const Key('communityShareSave')));
    expect(find.text('Warm night'), findsOneWidget);
    final mine = backend.community.last;

    await tapIn(tester, find.byKey(Key('communityMenu-${(mine['template'] as Map)['code']}')));
    await tapIn(tester, find.text('Delete').last);
    await tapIn(tester, find.byKey(const Key('communityDeleteConfirm')));
    expect(backend.community.contains(mine), isFalse);
    expect(find.text('Warm night'), findsNothing);
  });

  testWidgets('only Studio designs can be shared', (tester) async {
    final backend = _backend()..publisher = {'username': 'lina', 'displayName': 'Lina', 'bio': null, 'createdAt': '2026-11-15T00:00:00Z', 'url': ''};
    await pumpSignedIn(tester, backend);
    await _go(tester, '/community/mine');
    expect(tester.widget<ButtonStyleButton>(find.byKey(const Key('communityShareCurrent'))).onPressed, isNull);
    expect(find.textContaining('Only Studio designs can be shared'), findsOneWidget);
  });

  testWidgets('Basic owners are offered Pro to share designs', (tester) async {
    await pumpSignedIn(tester, _backend(plan: 'basic'));
    await _go(tester, '/community/mine');
    expect(find.byKey(const Key('communityUpgrade')), findsOneWidget);
    expect(find.byKey(const Key('publisherUsername')), findsNothing);
  });

  testWidgets('the community works in Arabic, right to left, with the Arabic sample', (tester) async {
    await pumpSignedIn(tester, _backend(), locale: const Locale('ar'));
    await _go(tester, '/community/template?code=nyt2fx7k');
    expect(find.text('web https://example.test/community-preview/nyt2fx7k/ar #0'), findsOneWidget);
    expect(find.text('استخدم هذا التصميم'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('Night shift'))), TextDirection.rtl);
  });
}
