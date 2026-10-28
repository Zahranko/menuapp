import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/features/design/field_widgets.dart';

import 'dashboard_test.dart' show openTab, pumpSignedIn, tapIn;
import 'fake_backend.dart';

/// The design editor with a real template's settings (Souq from the sites registry, without its photo fields: about 70
/// settings in 17 groups). The Looks strip stays first, every group closes and opens from its name, and the "Jump to"
/// row opens a group and scrolls to it.

Map<String, Object?> get _souq => FakeBackend.templates.firstWhere((t) => t['id'] == 'souq');

Map<String, dynamic> _registrySouq() {
  final registry = jsonDecode(File('../sites/templates/registry.json').readAsStringSync()) as Map<String, dynamic>;
  return (registry['templates'] as List).cast<Map<String, dynamic>>().firstWhere((t) => t['id'] == 'souq');
}

Future<void> _openEditor(WidgetTester tester, FakeBackend backend) async {
  await pumpSignedIn(tester, backend);
  await openTab(tester, 'Settings');
  await tester.tap(find.text('Edit design'));
  await tester.pumpAndSettle();
}

/// True when [finder] is on screen inside the settings list (not scrolled away under the preview).
bool _onScreen(WidgetTester tester, Finder finder) {
  final list = tester.getRect(find.byKey(const Key('editorSettings')));
  final rect = tester.getRect(finder);
  return rect.top >= list.top - 1 && rect.top < list.bottom;
}

void main() {
  final saved = <String, Object?>{};
  final originalPicture = previewPicture;
  setUp(() {
    final real = _registrySouq();
    for (final key in ['schema', 'defaults', 'looks']) {
      saved[key] = _souq[key];
      _souq[key] = real[key];
    }
    // Photo fields load pictures from the network, which widget tests don't have.
    _souq['schema'] = [
      for (final f in (real['schema'] as List).cast<Map<String, dynamic>>())
        if (f['type'] != 'image' && f['type'] != 'images') f,
    ];
    previewPicture = (path) => const SizedBox.expand();
  });
  tearDown(() {
    saved.forEach((key, value) => value == null ? _souq.remove(key) : _souq[key] = value);
    previewPicture = originalPicture;
  });

  testWidgets('groups close and open, and Jump to opens a group and scrolls to it', (tester) async {
    final backend = FakeBackend();
    await _openEditor(tester, backend);

    // The looks come first, then the AI helper, then the groups.
    expect(find.byKey(const Key('looksStrip')), findsOneWidget);
    expect(find.byKey(const Key('editorJumpBar')), findsOneWidget);
    expect(tester.getTopLeft(find.byKey(const Key('looksStrip'))).dy, lessThan(tester.getTopLeft(find.byKey(const Key('group-Brand'))).dy));
    expect(find.text('Font style'), findsOneWidget);

    // Close all: only the group names are left, each with its number of settings.
    await tester.tap(find.byKey(const Key('editorToggleAll')));
    await tester.pumpAndSettle();
    expect(find.text('Font style'), findsNothing);
    expect(find.text('Page style'), findsWidgets);
    expect(find.text('9 settings'), findsWidgets);
    expect(find.text('Open all'), findsOneWidget);

    // A group opens from its name, and closes again.
    await tapIn(tester, find.byKey(const Key('group-Fonts & colors')));
    expect(find.text('Font style'), findsOneWidget);
    await tapIn(tester, find.byKey(const Key('group-Fonts & colors')));
    expect(find.text('Font style'), findsNothing);

    // Jump to a group far down: it opens and lands in view.
    final sections = find.byKey(const Key('jump-Sections'));
    await tester.scrollUntilVisible(
      sections,
      150,
      scrollable: find.descendant(of: find.byKey(const Key('editorJumpBar')), matching: find.byType(Scrollable)),
    );
    await tester.pumpAndSettle();
    await tester.tap(sections);
    await tester.pumpAndSettle();
    expect(find.text('Order of the sections'), findsOneWidget);
    expect(_onScreen(tester, find.byKey(const Key('group-Sections'))), isTrue);

    // With a group open the button closes all again, then Open all brings every setting back.
    expect(find.text('Close all'), findsOneWidget);
    await tester.tap(find.byKey(const Key('editorToggleAll')));
    await tester.pumpAndSettle();
    expect(find.text('Order of the sections'), findsNothing);
    await tester.tap(find.byKey(const Key('editorToggleAll')));
    await tester.pumpAndSettle();
    expect(find.text('Close all'), findsOneWidget);
    expect(find.text('Font style'), findsOneWidget);
    expect(find.text('Order of the sections'), findsOneWidget);
  });
}
