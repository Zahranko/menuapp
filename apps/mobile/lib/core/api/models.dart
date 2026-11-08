import '../currency.dart';

/// The owner's business as the API returns it (`BusinessDto`).
class Business {
  const Business({
    required this.id,
    required this.name,
    required this.slug,
    required this.siteUrl,
    this.whatsApp,
    this.email,
    this.address,
    this.instagram,
    this.phone,
    this.facebook,
    this.tikTok,
    this.snapchat,
    this.locale = 'en',
    this.currencyCode = defaultCurrencyCode,
  });

  factory Business.fromJson(Map<String, dynamic> json) => Business(
        id: json['id'] as String,
        name: json['name'] as String,
        slug: json['slug'] as String,
        siteUrl: json['siteUrl'] as String,
        whatsApp: json['whatsApp'] as String?,
        email: json['email'] as String?,
        address: json['address'] as String?,
        instagram: json['instagram'] as String?,
        phone: json['phone'] as String?,
        facebook: json['facebook'] as String?,
        tikTok: json['tikTok'] as String?,
        snapchat: json['snapchat'] as String?,
        locale: json['locale'] as String? ?? 'en',
        currencyCode: json['currencyCode'] as String? ?? defaultCurrencyCode,
      );

  final String id;
  final String name;
  final String slug;
  final String siteUrl;
  final String? whatsApp;
  final String? email;
  final String? address;
  final String? instagram;

  /// The number customers call; the website's "Call us" uses the WhatsApp number when it is empty.
  final String? phone;

  /// Facebook page name (or "profile.php?id=…"), TikTok and Snapchat usernames, as the API stores them.
  final String? facebook;
  final String? tikTok;
  final String? snapchat;
  final String locale;
  final String currencyCode;

  /// The site address without the scheme, as owners read it: "example.com/vanillamenu".
  String get displayUrl => siteUrl.replaceFirst(RegExp(r'^https?://'), '');

  /// Where owners' websites are served (the site link without the slug). Template pictures load from here.
  String get sitesBaseUrl => siteUrl.substring(0, siteUrl.lastIndexOf('/'));
}

/// Tokens and business returned by register, login and refresh (`AuthResponse`).
class AuthResult {
  const AuthResult({required this.accessToken, required this.refreshToken, required this.business});

  factory AuthResult.fromJson(Map<String, dynamic> json) => AuthResult(
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String,
        business: Business.fromJson(json['business'] as Map<String, dynamic>),
      );

  final String accessToken;
  final String refreshToken;
  final Business business;
}

/// Whether the link for a business name is free (`SlugAvailabilityResponse`).
class SlugAvailability {
  const SlugAvailability({required this.slug, required this.available, this.suggestion, this.message});

  factory SlugAvailability.fromJson(Map<String, dynamic> json) => SlugAvailability(
        slug: json['slug'] as String,
        available: json['available'] as bool,
        suggestion: json['suggestion'] as String?,
        message: json['message'] as String?,
      );

  final String slug;
  final bool available;
  final String? suggestion;
  final String? message;
}
