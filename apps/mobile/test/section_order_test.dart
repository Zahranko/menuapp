// The shared "Sections" group: the order of the template's sections (a setting of type "order") moves with up and down
// buttons, in English and Arabic, and the editor reads a saved order the way the website does.
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/features/design/design_models.dart';
import 'package:storefront_app/features/design/field_widgets.dart';
import 'package:storefront_app/l10n/generated/app_localizations.dart';

/// A setting of a template, as the registry the API serves has it.
TemplateField _registryField(String template, String key) {
  final registry = jsonDecode(File('../sites/templates/registry.json').readAsStringSync()) as Map<String, dynamic>;
  final t = (registry['templates'] as List).cast<Map<String, dynamic>>().firstWhere((t) => t['id'] == template);
  final field = (t['schema'] as List).cast<Map<String, dynamic>>().firstWhere((f) => f['key'] == key);
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
      body: SingleChildScrollView(
        child: StatefulBuilder(
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
    ),
  ));
  await tester.pump();
  return changes;
}

List<String> _shown(WidgetTester tester, TemplateField field) {
  final rows = find.byWidgetPredicate((w) => w.key is ValueKey<String> && (w.key! as ValueKey<String>).value.startsWith('order-${field.key}-'));
  final keys = tester.widgetList(rows).map((w) => (w.key! as ValueKey<String>).value.substring('order-${field.key}-'.length)).toList();
  // Rows are listed top to bottom.
  final tops = {for (final k in keys) k: tester.getTopLeft(find.byKey(Key('order-${field.key}-$k'))).dy};
  return keys..sort((a, b) => tops[a]!.compareTo(tops[b]!));
}

void main() {
  test('the order field comes from the template schema, with English and Arabic names', () {
    final field = _registryField('souq', 'sections.order');
    expect(field.type, 'order');
    expect(supportedFieldTypes, contains('order'));
    expect(field.options, ['highlights', 'signature', 'menu', 'story', 'gallery', 'reviews', 'visit']);
    expect(field.optionLabels['reviews'], 'Reviews');
    expect(field.optionLabelsAr['reviews'], 'الآراء');
    expect(field.group, 'Sections');
  });

  test('a saved order is read like the website reads it', () {
    const own = ['highlights', 'menu', 'story', 'gallery', 'visit'];
    expect(sectionOrder(own, null), own);
    expect(sectionOrder(own, 'menu'), own);
    expect(sectionOrder(own, ['visit', 'menu']), ['highlights', 'visit', 'menu', 'story', 'gallery']);
    expect(sectionOrder(own, ['story', 'nope', 'story', 3, 'menu']), ['highlights', 'story', 'gallery', 'visit', 'menu']);
    expect(sectionOrder(own, own.reversed.toList()), own.reversed.toList());
  });

  testWidgets('sections move up and down with buttons, and the ends cannot move further', (tester) async {
    final field = _registryField('garden', 'sections.order');
    expect(field.options, ['menu', 'story', 'visit']);
    final changes = await _pump(tester, field, ['menu', 'story', 'visit']);

    expect(find.text('Order of the sections'), findsOneWidget);
    expect(find.text('The opening always stays at the top and the footer at the bottom.'), findsOneWidget);
    expect(_shown(tester, field), ['menu', 'story', 'visit']);
    expect(find.byTooltip('Move Menu up'), findsOneWidget);
    expect(tester.widget<IconButton>(find.widgetWithIcon(IconButton, Icons.arrow_upward_rounded).first).onPressed, isNull);
    expect(tester.widget<IconButton>(find.widgetWithIcon(IconButton, Icons.arrow_downward_rounded).last).onPressed, isNull);

    await tester.tap(find.byTooltip('Move Visit and hours up'));
    await tester.pump();
    expect(changes.last, ['menu', 'visit', 'story']);
    expect(_shown(tester, field), ['menu', 'visit', 'story']);

    await tester.tap(find.byTooltip('Move Menu down'));
    await tester.pump();
    expect(changes.last, ['visit', 'menu', 'story']);
    expect(_shown(tester, field), ['visit', 'menu', 'story']);
    expect(find.bySemanticsLabel('Visit and hours, 1 of 3'), findsOneWidget);
    expect(changes, hasLength(2));
  });

  testWidgets('an order saved before the template gained a section still lists every section', (tester) async {
    final field = _registryField('souq', 'sections.order');
    await _pump(tester, field, ['reviews', 'menu']);
    // Each section the saved order doesn't have comes right after the one before it in the template's order.
    expect(_shown(tester, field), ['highlights', 'signature', 'reviews', 'visit', 'menu', 'story', 'gallery']);
  });

  testWidgets('in Arabic the names, hint and buttons are Arabic', (tester) async {
    final field = _registryField('garden', 'sections.order');
    final changes = await _pump(tester, field, ['menu', 'story', 'visit'], locale: const Locale('ar'));

    expect(find.text('ترتيب الأقسام'), findsOneWidget);
    expect(find.text('قصتنا'), findsOneWidget);
    expect(find.text('تبقى الواجهة دائمًا في الأعلى والتذييل في الأسفل.'), findsOneWidget);
    await tester.tap(find.byTooltip('انقل قصتنا للأعلى'));
    await tester.pump();
    expect(changes.last, ['story', 'menu', 'visit']);
    expect(tester.getTopLeft(find.byKey(const Key('order-sections.order-story'))).dy, lessThan(tester.getTopLeft(find.byKey(const Key('order-sections.order-menu'))).dy));
  });
}
