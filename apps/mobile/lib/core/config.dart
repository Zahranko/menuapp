import 'brand.dart';

/// Build-time settings passed with `--dart-define-from-file=config/production.json`.
abstract final class AppConfig {
  static const _apiBaseUrl = String.fromEnvironment('apiBaseUrl');

  /// The API's address. Falls back to the brand's API host when no config file was passed.
  static String get apiBaseUrl {
    final url = _apiBaseUrl.isNotEmpty ? _apiBaseUrl : 'https://${Brand.apiHost}';
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  static const _assetsBaseUrl = String.fromEnvironment('assetsBaseUrl');

  /// Where template thumbnails and preset pictures load from (paths like /templates/souq/thumbnail.png).
  /// The API serves them; a build can point elsewhere with `assetsBaseUrl`.
  static String get assetsBaseUrl {
    final url = _assetsBaseUrl.isNotEmpty ? _assetsBaseUrl : apiBaseUrl;
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  /// Turns a template asset path into a full address; full addresses pass through.
  static String asset(String path) => path.startsWith('http') ? path : '$assetsBaseUrl${path.startsWith('/') ? '' : '/'}$path';
}
