/// Brand values passed at build time with `--dart-define-from-file=../../brand.json`.
/// Never write the brand name, domain or colors anywhere else in the app.
abstract final class Brand {
  static const brandName = String.fromEnvironment('brandName');
  static const brandNameAr = String.fromEnvironment('brandNameAr');
  static const brandShortName = String.fromEnvironment('brandShortName');
  static const tagline = String.fromEnvironment('tagline');
  static const domain = String.fromEnvironment('domain');
  static const apiHost = String.fromEnvironment('apiHost');
  static const supportEmail = String.fromEnvironment('supportEmail');
  static const appId = String.fromEnvironment('appId');

  static const colorPrimary = String.fromEnvironment('colorPrimary', defaultValue: '#15291F');
  static const colorPrimary2 = String.fromEnvironment('colorPrimary2', defaultValue: '#1F3A2E');
  static const colorAccent = String.fromEnvironment('colorAccent', defaultValue: '#F2B22E');
  static const colorHighlight = String.fromEnvironment('colorHighlight', defaultValue: '#D9542C');
  static const colorPaper = String.fromEnvironment('colorPaper', defaultValue: '#F1EFE3');
  static const colorInk = String.fromEnvironment('colorInk', defaultValue: '#18201B');
  static const colorMuted = String.fromEnvironment('colorMuted', defaultValue: '#5E6A61');
  static const colorLine = String.fromEnvironment('colorLine', defaultValue: '#DAD8C9');

  static const fontDisplay = String.fromEnvironment('fontDisplay');
  static const fontBody = String.fromEnvironment('fontBody');
  static const fontArabic = String.fromEnvironment('fontArabic');

  /// True when the app was started without the brand file, which would show empty names.
  static bool get isConfigured => brandName.isNotEmpty && domain.isNotEmpty;
}

/// Parses `#RRGGBB` into an ARGB int for `Color(...)`.
int hexToArgb(String hex) {
  final value = hex.replaceFirst('#', '');
  return int.parse(value.length == 6 ? 'FF$value' : value, radix: 16);
}
