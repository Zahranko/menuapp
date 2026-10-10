import '../../core/config.dart';

/// One editable setting of a template (an entry of the template's settings schema).
class TemplateField {
  const TemplateField({
    required this.key,
    required this.type,
    required this.label,
    this.group,
    this.options = const [],
    this.optionLabels = const {},
    this.swatches = const {},
    this.presets = const [],
    this.max,
    this.min,
    this.step,
  });

  factory TemplateField.fromJson(Map<String, dynamic> json) {
    final type = json['type'] as String;
    return TemplateField(
      key: json['key'] as String,
      type: type,
      label: json['label'] as String? ?? json['key'] as String,
      group: json['group'] as String?,
      options: [for (final o in (json['options'] as List?) ?? const []) o.toString()],
      optionLabels: {for (final e in ((json['optionLabels'] as Map?) ?? const {}).entries) e.key.toString(): e.value.toString()},
      swatches: {for (final e in ((json['swatches'] as Map?) ?? const {}).entries) e.key.toString(): e.value.toString()},
      presets: [for (final o in (json['presets'] as List?) ?? const []) o.toString()],
      max: (json['max'] as num?)?.toDouble(),
      min: (json['min'] as num?)?.toDouble(),
      step: (json['step'] as num?)?.toDouble(),
    );
  }

  final String key;

  /// text, textarea, choice, palette, color, image, images, range, toggle, toggles or hours.
  final String type;
  final String label;
  final String? group;
  final List<String> options;
  final Map<String, String> optionLabels;
  final Map<String, String> swatches;
  final List<String> presets;

  /// Text length for text fields, item count for images, upper end for range.
  final double? max;
  final double? min;
  final double? step;

  String optionLabel(String option) => optionLabels[option] ?? option;
}

/// A design from the gallery (`TemplateDto`).
class TemplateInfo {
  const TemplateInfo({
    required this.id,
    required this.number,
    required this.name,
    required this.category,
    this.description,
    this.thumbnailUrl,
    required this.fields,
    required this.defaults,
  });

  factory TemplateInfo.fromJson(Map<String, dynamic> json) => TemplateInfo(
        id: json['id'] as String,
        number: (json['number'] as num).toInt(),
        name: json['name'] as String,
        category: json['category'] as String,
        description: json['description'] as String?,
        thumbnailUrl: json['thumbnailUrl'] as String?,
        fields: [for (final f in (json['schema'] as List?) ?? const []) TemplateField.fromJson(f as Map<String, dynamic>)],
        defaults: Map<String, dynamic>.from((json['defaults'] as Map?) ?? const {}),
      );

  final String id;
  final int number;
  final String name;
  final String category;
  final String? description;
  final String? thumbnailUrl;
  final List<TemplateField> fields;
  final Map<String, dynamic> defaults;

  String get numberLabel => number.toString().padLeft(3, '0');

  String? get thumbnail => thumbnailUrl == null || thumbnailUrl!.isEmpty ? null : AppConfig.asset(thumbnailUrl!);

  /// Service websites (salons, clinics, studios, gyms, home services) rather than menus or shops.
  bool get isService => const ['Salon', 'Dental', 'clinic', 'studio', 'Gym', 'services'].any(category.contains);
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
