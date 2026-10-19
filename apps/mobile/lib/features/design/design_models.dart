import 'package:flutter/widgets.dart';

import '../../core/config.dart';

/// True when the app shows Arabic, so templates show their Arabic texts (when the API sent them).
bool _arabic(BuildContext context) => Localizations.localeOf(context).languageCode == 'ar';

Map<String, String> _strings(Object? json) => {for (final e in ((json as Map?) ?? const {}).entries) e.key.toString(): e.value.toString()};

String? _text(Object? value) => value is String && value.trim().isNotEmpty ? value : null;

/// One editable setting of a template (an entry of the template's settings schema).
class TemplateField {
  const TemplateField({
    required this.key,
    required this.type,
    required this.label,
    this.group,
    this.labelAr,
    this.groupAr,
    this.options = const [],
    this.optionLabels = const {},
    this.optionLabelsAr = const {},
    this.swatches = const {},
    this.presets = const [],
    this.max,
    this.min,
    this.step,
    this.unit,
    this.custom = false,
  });

  factory TemplateField.fromJson(Map<String, dynamic> json) {
    final type = json['type'] as String;
    return TemplateField(
      key: json['key'] as String,
      type: type,
      label: json['label'] as String? ?? json['key'] as String,
      group: json['group'] as String?,
      labelAr: _text(json['labelAr']),
      groupAr: _text(json['groupAr']),
      options: [for (final o in (json['options'] as List?) ?? const []) o.toString()],
      optionLabels: _strings(json['optionLabels']),
      optionLabelsAr: _strings(json['optionLabelsAr']),
      swatches: {for (final e in ((json['swatches'] as Map?) ?? const {}).entries) e.key.toString(): e.value.toString()},
      presets: [for (final o in (json['presets'] as List?) ?? const []) o.toString()],
      max: (json['max'] as num?)?.toDouble(),
      min: (json['min'] as num?)?.toDouble(),
      step: (json['step'] as num?)?.toDouble(),
      unit: _text(json['unit']),
      custom: json['custom'] == true,
    );
  }

  final String key;

  /// text, textarea, choice, palette, color, image, images, range, toggle, toggles or hours.
  final String type;
  final String label;
  final String? group;

  /// Arabic label and group header; null when the template has none (the English one shows instead).
  final String? labelAr;
  final String? groupAr;
  final List<String> options;
  final Map<String, String> optionLabels;

  /// Arabic option labels, keyed like [optionLabels].
  final Map<String, String> optionLabelsAr;
  final Map<String, String> swatches;
  final List<String> presets;

  /// Text length for text fields, item count for images, upper end for range.
  final double? max;
  final double? min;
  final double? step;

  /// Shown after a range's value, for example "%" for the logo size; null for a plain number.
  final String? unit;

  /// A color field that also takes the owner's own color (any #RRGGBB), not only its [options].
  final bool custom;

  String optionLabel(String option) => optionLabels[option] ?? option;

  /// The label in the app's language.
  String labelFor(BuildContext context) => (_arabic(context) ? labelAr : null) ?? label;

  /// The group header in the app's language; null when the field has no group.
  String? groupFor(BuildContext context) => group == null ? null : (_arabic(context) ? groupAr : null) ?? group;

  /// An option's label in the app's language.
  String optionLabelFor(BuildContext context, String option) => (_arabic(context) ? optionLabelsAr[option] : null) ?? optionLabel(option);
}

/// A template's Arabic name, category and description (`TemplateDto.ar`).
typedef TemplateTexts = ({String? name, String? category, String? description});

/// A design from the gallery (`TemplateDto`).
class TemplateInfo {
  const TemplateInfo({
    required this.id,
    required this.number,
    required this.name,
    required this.category,
    this.description,
    this.thumbnailUrl,
    this.tier = 'basic',
    this.ar,
    required this.fields,
    required this.defaults,
    this.defaultsAr = const {},
  });

  factory TemplateInfo.fromJson(Map<String, dynamic> json) => TemplateInfo(
        id: json['id'] as String,
        number: (json['number'] as num).toInt(),
        name: json['name'] as String,
        category: json['category'] as String,
        description: json['description'] as String?,
        thumbnailUrl: json['thumbnailUrl'] as String?,
        tier: json['tier'] as String? ?? 'basic',
        ar: switch (json['ar']) {
          final Map<String, dynamic> ar => (name: _text(ar['name']), category: _text(ar['category']), description: _text(ar['description'])),
          _ => null,
        },
        fields: [for (final f in (json['schema'] as List?) ?? const []) TemplateField.fromJson(f as Map<String, dynamic>)],
        defaults: Map<String, dynamic>.from((json['defaults'] as Map?) ?? const {}),
        defaultsAr: Map<String, dynamic>.from((json['defaultsAr'] as Map?) ?? const {}),
      );

  final String id;
  final int number;
  final String name;
  final String category;
  final String? description;
  final String? thumbnailUrl;

  /// basic or pro. Pro templates need the Pro plan.
  final String tier;

  /// Arabic texts; null (or a null entry) when the template has none, and the English one shows instead.
  final TemplateTexts? ar;
  final List<TemplateField> fields;
  final Map<String, dynamic> defaults;

  /// The starting settings of an Arabic site, over [defaults] (headlines and other texts in Arabic).
  final Map<String, dynamic> defaultsAr;

  /// The name in the app's language.
  String nameFor(BuildContext context) => (_arabic(context) ? ar?.name : null) ?? name;

  /// The category in the app's language.
  String categoryFor(BuildContext context) => (_arabic(context) ? ar?.category : null) ?? category;

  /// The description in the app's language.
  String? descriptionFor(BuildContext context) => (_arabic(context) ? ar?.description : null) ?? description;

  /// The starting settings for a site in [siteLocale] (the business's language, not the app's).
  Map<String, dynamic> defaultsFor(String siteLocale) => siteLocale == 'ar' ? {...defaults, ...defaultsAr} : Map.of(defaults);

  bool get isPro => tier == 'pro';

  String get numberLabel => number.toString().padLeft(3, '0');

  String? get thumbnail => thumbnailUrl == null || thumbnailUrl!.isEmpty ? null : AppConfig.asset(thumbnailUrl!);

  /// Service websites (salons, clinics, studios, gyms, home services) rather than menus or shops.
  bool get isService => const ['Salon', 'Dental', 'clinic', 'studio', 'Gym', 'services'].any(category.contains);

  /// Clothing and fashion stores (their own filter, ahead of the other shops).
  bool get isFashion => const ['Clothing', 'Fashion', 'Streetwear'].any(category.contains);
}

/// The owner's site design (`SiteDto`). The draft is what the editor changes; publishing makes it live.
class SiteInfo {
  const SiteInfo({
    required this.templateId,
    required this.draft,
    this.publishedTemplateId,
    this.publishedAt,
    required this.hasUnpublishedChanges,
    required this.siteUrl,
  });

  factory SiteInfo.fromJson(Map<String, dynamic> json) => SiteInfo(
        templateId: json['templateId'] as String,
        draft: Map<String, dynamic>.from((json['draftSettings'] as Map?) ?? const {}),
        publishedTemplateId: json['publishedTemplateId'] as String?,
        publishedAt: json['publishedAt'] == null ? null : DateTime.parse(json['publishedAt'] as String),
        hasUnpublishedChanges: json['hasUnpublishedChanges'] as bool? ?? false,
        siteUrl: json['siteUrl'] as String? ?? '',
      );

  final String templateId;
  final Map<String, dynamic> draft;
  final String? publishedTemplateId;
  final DateTime? publishedAt;
  final bool hasUnpublishedChanges;
  final String siteUrl;

  bool get isPublished => publishedAt != null;
}

/// A preset picture value is stored as `preset:<name>`; anything else is an uploaded photo's address.
const presetPrefix = 'preset:';

String presetAsset(String name) => AppConfig.asset('/presets/$name.svg');
