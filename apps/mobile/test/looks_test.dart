import 'dart:ui' show Tristate;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/features/design/design_models.dart';

import 'dashboard_test.dart' show openTab, pumpSignedIn, tapIn;
import 'fake_backend.dart';

/// Two looks for the fake Souq template: each sets the font, the accent and the dotted texture together.
final _looks = [
  {
    'id': 'night',
    'label': {'en': 'Night souq', 'ar': 'سوق الليل'},
    'values': {'font': 'elegant', 'accent': '#2B6B4F', 'texture': true, 'not.in.editor': 'x'},
  },
  {
    'id': 'morning',
    'label': {'en': 'Morning', 'ar': 'الصباح'},
    'values': {'font': 'modern', 'accent': '#D9542C', 'texture': false},
  },
];

Map<String, Object?> get _souq => FakeBackend.templates.firstWhere((t) => t['id'] == 'souq');

Future<void> _openEditor(WidgetTester tester, FakeBackend backend, {Locale? locale}) async {
  await pumpSignedIn(tester, backend, locale: locale);
  await openTab(tester, locale?.languageCode == 'ar' ? 'الإعدادات' : 'Settings');
  await tester.tap(find.text(locale?.languageCode == 'ar' ? 'تعديل التصميم' : 'Edit design'));
  await tester.pumpAndSettle();
}

void main() {
  setUp(() => _souq['looks'] = _looks);
  tearDown(() => _souq.remove('looks'));

  test('looks and signature options are read from the template', () {
    final info = TemplateInfo.fromJson({
      'id': 'ticket',
      'number': 9,
      'name': 'Ticket',
      'category': 'Café',
      'schema': [
        {'key': 'hero.variant', 'type': 'choice', 'label': 'Opening', 'options': ['auto', 'stub', 'poster'], 'signature': ['stub']},
      ],
      'defaults': {'hero.variant': 'auto'},
      'looks': [
        {'id': 'night', 'label': {'en': 'Night shift', 'ar': 'وردية الليل'}, 'values': {'hero.variant': 'stub'}},
        {'id': 'broken'},
      ],
    });
    expect(info.fields.single.signature, ['stub']);
    expect(info.looks.map((l) => l.id), ['night'], reason: 'a look without values is left out');
    expect(info.looks.single.labelAr, 'وردية الليل');
    expect(info.looks.single.values, {'hero.variant': 'stub'});
    expect(TemplateInfo.fromJson({'id': 'x', 'number': 1, 'name': 'X', 'category': 'Y'}).looks, isEmpty);
  });

  testWidgets('a look applies in one tap at the top of the editor, and Undo puts the design back', (tester) async {
    final backend = FakeBackend();
    await _openEditor(tester, backend);

    expect(find.byKey(const Key('looksStrip')), findsOneWidget);
    expect(find.text('Looks'), findsOneWidget);
    expect(find.text('Night souq'), findsOneWidget);
    // The strip comes first, above the AI assistant and the settings.
    expect(tester.getTopLeft(find.byKey(const Key('looksStrip'))).dy, lessThan(tester.getTopLeft(find.text('Font style')).dy));
    // The draft is the template's defaults: that is the Morning look, so it shows as chosen.
    expect(tester.getSemantics(find.byKey(const Key('look-morning'))).flagsCollection.isSelected, Tristate.isTrue);

    await tapIn(tester, find.byKey(const Key('look-night')));
    expect(backend.draft['font'], 'elegant');
    expect(backend.draft['accent'], '#2B6B4F');
    expect(backend.draft['texture'], isTrue);
    expect(backend.draft.containsKey('not.in.editor'), isFalse, reason: 'only settings the editor shows');
    expect(find.text('Night souq is on'), findsOneWidget);
    expect(tester.getSemantics(find.byKey(const Key('look-night'))).flagsCollection.isSelected, Tristate.isTrue);
    expect(backend.publishedAt, isNull, reason: 'the owner still publishes');

    await tapIn(tester, find.byKey(const Key('lookUndo')));
    expect(backend.draft['font'], 'modern');
    expect(backend.draft['accent'], '#D9542C');
    expect(backend.draft['texture'], isFalse);
    expect(find.text('Back to your design'), findsOneWidget);
    expect(find.byKey(const Key('lookUndo')), findsNothing);
  });

  testWidgets('Undo after a look keeps changes the owner made before it', (tester) async {
    final backend = FakeBackend()..draft['accent'] = '#123456';
    await _openEditor(tester, backend);
    await tapIn(tester, find.byKey(const Key('look-night')));
    expect(backend.draft['accent'], '#2B6B4F');
    await tapIn(tester, find.byKey(const Key('lookUndo')));
    expect(backend.draft['accent'], '#123456', reason: 'Undo puts back the owner\'s own color, not the default');
  });

  testWidgets('templates without looks have no strip', (tester) async {
    _souq.remove('looks');
    await _openEditor(tester, FakeBackend());
    expect(find.byKey(const Key('looksStrip')), findsNothing);
  });

  testWidgets('in Arabic the looks have their Arabic names and run right to left', (tester) async {
    final backend = FakeBackend();
    backend.businessData['locale'] = 'ar';
    await _openEditor(tester, backend, locale: const Locale('ar'));

    expect(find.text('الأنماط'), findsOneWidget);
    expect(find.text('سوق الليل'), findsOneWidget);
    final night = tester.getCenter(find.byKey(const Key('look-night')));
    final morning = tester.getCenter(find.byKey(const Key('look-morning')));
    expect(night.dx, greaterThan(morning.dx), reason: 'the first look is on the right');

    await tapIn(tester, find.byKey(const Key('look-night')));
    expect(find.text('تم تطبيق سوق الليل'), findsOneWidget);
    expect(find.text('تراجع'), findsOneWidget);
  });

  testWidgets('"Surprise me" in the AI chat asks for a fresh design and can be undone', (tester) async {
    final backend = FakeBackend()
      ..aiStatus = {'available': true, 'remainingThisMonth': 7, 'monthlyLimit': 30}
      ..aiChat.add({
        'reply': 'I picked the Night souq look with a green accent.',
        'settings': {'font': 'elegant', 'accent': '#2B6B4F'},
        'remainingThisMonth': 6,
      });
    await _openEditor(tester, backend);
    await tapIn(tester, find.byKey(const Key('aiOpenChat')));

    expect(find.text('Surprise me'), findsOneWidget);
    await tester.tap(find.byKey(const Key('aiChatSurprise')));
    await tester.pumpAndSettle();

    final request = backend.aiChatRequests.single;
    expect(request.surprise, isTrue);
    expect(request.messages.single['text'], 'Surprise me');
    expect(backend.draft['font'], 'elegant');
    expect(find.text('Changed 2 settings: Font style, Accent color'), findsOneWidget);

    await tester.tap(find.byKey(const Key('aiChatUndo-1')));
    await tester.pumpAndSettle();
    expect(backend.draft['font'], 'modern');
  });

  testWidgets('a typed message is not a surprise', (tester) async {
    final backend = FakeBackend()
      ..aiStatus = {'available': true, 'remainingThisMonth': 7, 'monthlyLimit': 30}
      ..aiChat.add({'reply': 'Done.', 'settings': {'texture': true}, 'remainingThisMonth': 6});
    await _openEditor(tester, backend);
    await tapIn(tester, find.byKey(const Key('aiOpenChat')));
    await tester.enterText(find.byKey(const Key('aiChatInput')), 'Dots please');
    await tester.tap(find.byKey(const Key('aiChatSend')));
    await tester.pumpAndSettle();
    expect(backend.aiChatRequests.single.surprise, isFalse);
  });

  testWidgets('في العربية: فاجئني', (tester) async {
    final backend = FakeBackend()
      ..aiStatus = {'available': true, 'remainingThisMonth': 7, 'monthlyLimit': 30}
      ..aiChat.add({'reply': 'اخترت نمطًا جديدًا.', 'settings': {'texture': true}, 'remainingThisMonth': 6});
    backend.businessData['locale'] = 'ar';
    await _openEditor(tester, backend, locale: const Locale('ar'));
    await tapIn(tester, find.byKey(const Key('aiOpenChat')));
    await tester.tap(find.text('فاجئني'));
    await tester.pumpAndSettle();
    expect(backend.aiChatRequests.single.surprise, isTrue);
    expect(backend.aiChatRequests.single.messages.single['text'], 'فاجئني');
  });
}
