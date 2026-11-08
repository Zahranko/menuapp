// Choices with picture previews (the shared "Page style" group) show picture tiles; plain choices keep their chips.
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/core/config.dart';
import 'package:storefront_app/features/design/design_models.dart';
import 'package:storefront_app/features/design/field_widgets.dart';
import 'package:storefront_app/l10n/generated/app_localizations.dart';

/// The "Buttons" option of the Souq template, as the registry the API serves has it.
TemplateField _registryField(String key) {
  final registry = jsonDecode(File('../sites/templates/registry.json').readAsStringSync()) as Map<String, dynamic>;
  final souq = (registry['templates'] as List).cast<Map<String, dynamic>>().firstWhere((t) => t['id'] == 'souq');
  final field = (souq['schema'] as List).cast<Map<String, dynamic>>().firstWhere((f) => f['key'] == key);
  return TemplateField.fromJson(field);
}

Future<List<Object?>> _pump(WidgetTester tester, TemplateField field, Object? value, {Locale locale = const Locale('en')}) async {
  final changes = <Object?>[];
  await tester.pumpWidget(MaterialApp(
    locale: locale,
    supportedLocales: AppLocalizations.supportedLocales,
    localizationsDelegates: const [
      AppLocalizations.delegate,
      GlobalMaterialLocalizations.delegate,
      GlobalWidgetsLocalizations.delegate,
      GlobalCupertinoLocalizations.delegate,
    ],
    home: Scaffold(
      body: StatefulBuilder(
        builder: (context, setState) => SettingField(
          field: field,
          value: value,
          onChanged: (v) => setState(() {
            changes.add(v);
            value = v;
          }),
        ),
      ),
    ),
  ));
  await tester.pump();
  return changes;
}

void main() {
  final original = previewPicture;
  setUp(() => previewPicture = (path) => SizedBox.expand(key: Key('picture $path')));
  tearDown(() => previewPicture = original);

  test('previews are read from the template schema', () {
    final field = _registryField('style.buttons');
    expect(field.previews.keys, field.options);
    expect(field.previews['pill'], '/kit/previews/buttons-pill.svg');
    expect(TemplateField.fromJson({'key': 'font', 'type': 'choice', 'options': ['a']}).previews, isEmpty);
  });

  testWidgets('a choice with previews shows a picture tile per option, named under it', (tester) async {
    final field = _registryField('style.buttons');
    final changes = await _pump(tester, field, 'auto');

    expect(find.byType(ChoiceChip), findsNothing);
    for (final o in field.options) {
      expect(find.byKey(Key('setting-${field.key}-$o')), findsOneWidget);
      expect(find.byKey(Key('picture ${field.previews[o]}')), findsOneWidget);
    }
    expect(find.text('Template default'), findsOneWidget);
    expect(find.text('Pill'), findsOneWidget);
    expect(tester.getSemantics(find.byKey(const Key('setting-style.buttons-auto'))), isSemantics(label: 'Template default', isButton: true, isSelected: true, hasTapAction: true));

    await tester.tap(find.byKey(const Key('setting-style.buttons-pill')));
    await tester.pump();
    expect(changes, ['pill']);
    expect(tester.getSemantics(find.byKey(const Key('setting-style.buttons-pill'))), isSemantics(label: 'Pill', isButton: true, isSelected: true, hasTapAction: true));
    expect(tester.getSemantics(find.byKey(const Key('setting-style.buttons-auto'))), isSemantics(label: 'Template default', isButton: true, isSelected: false, hasTapAction: true));
  });

  testWidgets('in Arabic the tiles carry the Arabic names and run right to left', (tester) async {
    final field = _registryField('style.photos');
    await _pump(tester, field, 'auto', locale: const Locale('ar'));

    expect(find.text(field.optionLabelsAr['auto']!), findsOneWidget);
    expect(find.text(field.labelAr!), findsOneWidget);
    final first = tester.getCenter(find.byKey(const Key('setting-style.photos-auto')));
    final second = tester.getCenter(find.byKey(const Key('setting-style.photos-rounded')));
    expect(first.dx, greaterThan(second.dx));
    expect(tester.takeException(), isNull);
  });

  testWidgets('plain choices keep their chips', (tester) async {
    const field = TemplateField(key: 'font', type: 'choice', label: 'Font', options: ['modern', 'elegant'], optionLabels: {'modern': 'Modern', 'elegant': 'Elegant'});
    final changes = await _pump(tester, field, 'modern');
    expect(find.byType(ChoiceChip), findsNWidgets(2));
    await tester.tap(find.text('Elegant'));
    expect(changes, ['elegant']);
  });

  test('pictures load from the asset address, like template thumbnails', () {
    final field = _registryField('style.dividers');
    for (final o in field.options) {
      final picture = original(field.previews[o]!) as SvgPicture;
      expect((picture.bytesLoader as SvgNetworkLoader).url, AppConfig.asset(field.previews[o]!));
    }
    expect(AppConfig.asset(field.previews['wave']!), allOf(startsWith('http'), endsWith('/kit/previews/dividers-wave.svg')));
  });
}
