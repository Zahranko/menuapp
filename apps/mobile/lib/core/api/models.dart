/// The owner's business as the API returns it (`BusinessDto`).
class Business {
  const Business({required this.id, required this.name, required this.slug, required this.siteUrl});

  factory Business.fromJson(Map<String, dynamic> json) => Business(
        id: json['id'] as String,
        name: json['name'] as String,
        slug: json['slug'] as String,
        siteUrl: json['siteUrl'] as String,
      );

  final String id;
  final String name;
  final String slug;
  final String siteUrl;
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
