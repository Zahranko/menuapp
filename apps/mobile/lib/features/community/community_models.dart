import 'package:flutter/material.dart';

/// A community template's publisher, as everyone sees them.
class Publisher {
  const Publisher({required this.username, required this.displayName, this.bio, required this.url});

  factory Publisher.fromJson(Map<String, dynamic> json) => Publisher(
        username: json['username'] as String,
        displayName: json['displayName'] as String,
        bio: json['bio'] as String?,
        url: json['url'] as String? ?? '',
      );

  final String username;
  final String displayName;
  final String? bio;

  /// Their page in the website's community gallery.
  final String url;
}

/// A design shared in the community gallery. [code] is the id in its share link; [previewUrl] draws it on a sample menu.
class CommunityTemplate {
  const CommunityTemplate({
    required this.code,
    required this.name,
    this.description,
    required this.baseTemplateId,
    required this.isPro,
    required this.publisher,
    required this.colors,
    required this.uses,
    required this.shareUrl,
    required this.previewUrl,
  });

  factory CommunityTemplate.fromJson(Map<String, dynamic> json) => CommunityTemplate(
        code: json['code'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        baseTemplateId: json['baseTemplateId'] as String? ?? 'studio',
        isPro: json['isPro'] as bool? ?? false,
        publisher: Publisher.fromJson(Map<String, dynamic>.from(json['publisher'] as Map)),
        colors: [for (final c in (json['colors'] as List? ?? const [])) ?parseHexColor(c.toString())],
        uses: (json['uses'] as num?)?.toInt() ?? 0,
        shareUrl: json['shareUrl'] as String? ?? '',
        previewUrl: json['previewUrl'] as String? ?? '',
      );

  final String code;
  final String name;
  final String? description;
  final String baseTemplateId;
  final bool isPro;
  final Publisher publisher;
  final List<Color> colors;
  final int uses;
  final String shareUrl;
  final String previewUrl;

  /// The sample preview in the app's language: Arabic owners see the Arabic sample, right to left.
  String previewFor(String languageCode) => languageCode == 'ar' ? '$previewUrl/ar' : previewUrl;
}

/// One of the owner's own shared designs: its [id] for changes, and whether the gallery lists it.
class MyCommunityTemplate {
  const MyCommunityTemplate({required this.id, required this.isListed, required this.template});

  factory MyCommunityTemplate.fromJson(Map<String, dynamic> json) => MyCommunityTemplate(
        id: json['id'] as String,
        isListed: json['isListed'] as bool? ?? true,
        template: CommunityTemplate.fromJson(Map<String, dynamic>.from(json['template'] as Map)),
      );

  final String id;
  final bool isListed;
  final CommunityTemplate template;
}

class CommunityPage {
  const CommunityPage({required this.items, required this.total, required this.page, required this.pageSize});

  factory CommunityPage.fromJson(Map<String, dynamic> json) => CommunityPage(
        items: [for (final i in json['items'] as List) CommunityTemplate.fromJson(Map<String, dynamic>.from(i as Map))],
        total: (json['total'] as num).toInt(),
        page: (json['page'] as num).toInt(),
        pageSize: (json['pageSize'] as num).toInt(),
      );

  final List<CommunityTemplate> items;
  final int total;
  final int page;
  final int pageSize;

  bool get hasMore => page * pageSize < total;
}

/// Share codes are 8 letters and digits without look-alikes, like the server makes them.
final _code = RegExp(r'^[a-hjkmnp-z2-9]{8}$');

/// The share code in what the owner typed or pasted: a bare code, or a link like https://…/community/k7m2p9xq.
String? shareCodeIn(String text) {
  final trimmed = text.trim().toLowerCase();
  if (_code.hasMatch(trimmed)) return trimmed;
  final uri = Uri.tryParse(trimmed);
  if (uri == null || uri.pathSegments.isEmpty) return null;
  final i = uri.pathSegments.indexWhere((s) => s == 'community' || s == 'community-preview');
  if (i < 0 || i + 1 >= uri.pathSegments.length) return null;
  final candidate = uri.pathSegments[i + 1];
  return _code.hasMatch(candidate) ? candidate : null;
}

Color? parseHexColor(String hex) {
  final m = RegExp(r'^#([0-9a-fA-F]{6})$').firstMatch(hex);
  return m == null ? null : Color(0xFF000000 | int.parse(m.group(1)!, radix: 16));
}
