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
    expect(find.byKey(const Key('aiAssistant')), findsNothing);
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
    expect(find.byKey(const Key('aiAssistant')), findsOneWidget);
    await tapIn(tester, find.byKey(const Key('aiOpenChat')));
    expect(find.byKey(const Key('aiChatInput')), findsNothing, reason: 'the chat does not open while the helper is off');
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

  testWidgets('the design chat changes the draft, shows what changed and can undo it', (tester) async {
    final picker = _FakePicker();
    final backend = FakeBackend()
      ..aiStatus = _status()
      ..aiChat.addAll([
        {
          'reply': 'I made your logo bigger and picked a blue accent.',
          'settings': {'logo.size': 140, 'accent': '#1F6FEB', 'not.in.editor': 'x'},
          'remainingThisMonth': 6,
        },
        {'reply': 'أي ألوان تحب أكثر، الدافئة أم الهادئة؟', 'settings': <String, Object?>{}, 'remainingThisMonth': 5},
      ]);
    await pumpSignedIn(tester, backend, overrides: [aiPhotoPickerProvider.overrideWithValue(picker)]);
    await openTab(tester, 'Settings');
    await tester.tap(find.text('Edit design'));
    await tester.pumpAndSettle();

    // One entry instead of the old two choices.
    expect(find.text('AI design assistant'), findsOneWidget);
    await tapIn(tester, find.byKey(const Key('aiOpenChat')));

    // An empty chat greets the owner and offers ideas to start from.
    expect(find.textContaining('Tell me what to change on your website'), findsOneWidget);
    expect(find.text('Make the logo bigger'), findsOneWidget);
    expect(find.text('Write my texts'), findsOneWidget);
    expect(find.descendant(of: find.byType(BottomSheet), matching: find.text('7 AI uses left this month')), findsOneWidget);

    await tester.enterText(find.byKey(const Key('aiChatInput')), 'Bigger logo and a blue accent please');
    await tester.tap(find.byKey(const Key('aiChatSend')));
    await tester.pumpAndSettle();

    final first = backend.aiChatRequests.single;
    expect(first.messages, [
      {'role': 'owner', 'text': 'Bigger logo and a blue accent please'},
    ]);
    expect(first.language, 'en');
    expect(first.photo, isFalse);
    expect(find.text('I made your logo bigger and picked a blue accent.'), findsOneWidget);
    expect(find.text('Changed 2 settings: Logo size, Accent color'), findsOneWidget);
    // Applied to the draft right away, for the preview; only settings the editor shows.
    expect(backend.draft['logo.size'], 140);
    expect(backend.draft['accent'], '#1F6FEB');
    expect(backend.draft.containsKey('not.in.editor'), isFalse);
    expect(backend.publishedAt, isNull, reason: 'the owner still publishes');

    await tester.tap(find.byKey(const Key('aiChatUndo-1')));
    await tester.pumpAndSettle();
    expect(backend.draft['logo.size'], 100);
    expect(backend.draft['accent'], '#D9542C');
    expect(find.text('Changes undone'), findsOneWidget);

    // Next message in Arabic, with a photo.
    await tester.tap(find.byKey(const Key('aiChatLanguageButton')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('العربية').last);
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('aiChatPhoto')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Choose from photos'));
    await tester.pumpAndSettle();
    expect(picker.asked, 1);
    await tester.tap(find.byKey(const Key('aiChatSend')));
    await tester.pumpAndSettle();

    final second = backend.aiChatRequests.last;
    expect(second.language, 'ar');
    expect(second.photo, isTrue);
    expect(second.messages.map((m) => m['role']), ['owner', 'assistant', 'owner']);
    expect(second.messages[1]['text'], contains('undid'));
    expect(second.messages[2]['text'], 'Use this photo for my design.');
    final reply = find.text('أي ألوان تحب أكثر، الدافئة أم الهادئة؟');
    expect(reply, findsOneWidget);
    expect(tester.widget<Text>(reply).textDirection, TextDirection.rtl);
    expect(find.byKey(const Key('aiChatChanges-3')), findsNothing, reason: 'nothing changed, nothing to undo');

    // Closing keeps the conversation for this editor session.
    await tester.tapAt(const Offset(20, 20));
    await tester.pumpAndSettle();
    expect(find.text('Continue the chat'), findsOneWidget);
    await tapIn(tester, find.byKey(const Key('aiOpenChat')));
    expect(find.text('I made your logo bigger and picked a blue accent.'), findsOneWidget);
  });

  testWidgets('a failed answer explains and gives the message back to send again', (tester) async {
    final backend = FakeBackend()..aiStatus = _status();
    backend.failing.add('POST /api/v1/ai/chat');
    await pumpSignedIn(tester, backend);
    await openTab(tester, 'Settings');
    await tester.tap(find.text('Edit design'));
    await tester.pumpAndSettle();
    await tapIn(tester, find.byKey(const Key('aiOpenChat')));

    await tester.enterText(find.byKey(const Key('aiChatInput')), 'Darker please');
    await tester.tap(find.byKey(const Key('aiChatSend')));
    await tester.pumpAndSettle();

    expect(find.text('Server error'), findsOneWidget);
    expect(tester.widget<TextField>(find.byKey(const Key('aiChatInput'))).controller!.text, 'Darker please');
    expect(find.text('Changed 1 setting'), findsNothing);
  });

  testWidgets('an Arabic owner chats right to left, starting from an idea', (tester) async {
    final backend = FakeBackend()
      ..aiStatus = _status()
      ..aiChat.add({
        'reply': 'كبّرت الشعار.',
        'settings': {'logo.size': 130},
        'remainingThisMonth': 6,
      });
    backend.businessData['locale'] = 'ar';
    await pumpSignedIn(tester, backend, locale: const Locale('ar'));
    await openTab(tester, 'الإعدادات');
    await tester.tap(find.text('تعديل التصميم'));
    await tester.pumpAndSettle();
    await tapIn(tester, find.byKey(const Key('aiOpenChat')));

    expect(find.text('مساعد التصميم الذكي'), findsWidgets);
    await tester.tap(find.text('كبّر الشعار'));
    await tester.pumpAndSettle();

    expect(backend.aiChatRequests.single.language, 'ar');
    expect(backend.aiChatRequests.single.messages.single['text'], 'كبّر الشعار');
    expect(backend.draft['logo.size'], 130);
    expect(find.text('تم تغيير إعداد واحد: حجم الشعار'), findsOneWidget);
    // The owner's message sits on the trailing side: on the left in Arabic.
    final mine = tester.getCenter(find.text('كبّر الشعار'));
    final answer = tester.getCenter(find.text('كبّرت الشعار.'));
    expect(mine.dx, lessThan(answer.dx));
    expect(Directionality.of(tester.element(find.text('كبّرت الشعار.'))), TextDirection.rtl);
  });
}
