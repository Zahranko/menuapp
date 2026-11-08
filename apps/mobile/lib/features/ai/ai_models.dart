/// Whether the AI helper is switched on and how many answers are left this month (`AiStatusDto`).
class AiStatus {
  const AiStatus({required this.available, required this.remaining, required this.monthlyLimit});

  factory AiStatus.fromJson(Map<String, dynamic> json) => AiStatus(
        available: json['available'] == true,
        remaining: (json['remainingThisMonth'] as num?)?.toInt() ?? 0,
        monthlyLimit: (json['monthlyLimit'] as num?)?.toInt() ?? 0,
      );

  final bool available;
  final int remaining;
  final int monthlyLimit;

  /// Switched on and with answers left this month.
  bool get usable => available && remaining > 0;
}

/// One answer of the editor's chat assistant (`DesignChatAnswerDto`): a short reply, and the settings it changed (empty when it
/// only answered or asked something). Nothing is saved until the editor merges [settings] into its draft.
class DesignChatAnswer {
  const DesignChatAnswer({required this.reply, required this.settings, required this.remaining});

  factory DesignChatAnswer.fromJson(Map<String, dynamic> json) => DesignChatAnswer(
        reply: json['reply'] as String? ?? '',
        settings: Map<String, dynamic>.from((json['settings'] as Map?) ?? const {}),
        remaining: (json['remainingThisMonth'] as num?)?.toInt() ?? 0,
      );

  final String reply;
  final Map<String, dynamic> settings;
  final int remaining;
}

/// A product read from a menu photo, as the owner edits it on the review screen.
class DraftProduct {
  DraftProduct({required this.name, this.description, this.price, this.selected = true});

  /// [arabic] picks the Arabic name when the menu had one (or the model translated it), for an Arabic website.
  factory DraftProduct.fromJson(Map<String, dynamic> json, {required bool arabic}) => DraftProduct(
        name: _pick(json, arabic),
        description: json['description'] as String?,
        price: (json['price'] as num?)?.toDouble(),
      );

  String name;
  String? description;
  double? price;
  bool selected;
}

/// A category read from a menu photo, with its products.
class DraftCategory {
  DraftCategory({required this.name, required this.products, this.selected = true});

  factory DraftCategory.fromJson(Map<String, dynamic> json, {required bool arabic}) => DraftCategory(
        name: _pick(json, arabic),
        products: [for (final p in (json['products'] as List?) ?? const []) DraftProduct.fromJson(p as Map<String, dynamic>, arabic: arabic)],
      );

  String name;
  final List<DraftProduct> products;
  bool selected;
}

/// What the AI read from menu photos (`MenuDraftDto`): prices are in [currencyCode]; [menuCurrency] is what the menu showed.
class MenuDraft {
  const MenuDraft({required this.currencyCode, this.menuCurrency, required this.categories, required this.remaining});

  factory MenuDraft.fromJson(Map<String, dynamic> json, {required bool arabic}) => MenuDraft(
        currencyCode: json['currencyCode'] as String? ?? '',
        menuCurrency: json['menuCurrency'] as String?,
        categories: [for (final c in (json['categories'] as List?) ?? const []) DraftCategory.fromJson(c as Map<String, dynamic>, arabic: arabic)],
        remaining: (json['remainingThisMonth'] as num?)?.toInt() ?? 0,
      );

  final String currencyCode;
  final String? menuCurrency;
  final List<DraftCategory> categories;
  final int remaining;
}

String _pick(Map<String, dynamic> json, bool arabic) {
  final ar = json['nameAr'] as String?;
  return (arabic && ar != null && ar.trim().isNotEmpty ? ar : json['name'] as String?) ?? '';
}
