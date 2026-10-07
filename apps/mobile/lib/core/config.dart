import 'brand.dart';

/// Build-time settings passed with `--dart-define-from-file=config/production.json`.
abstract final class AppConfig {
  static const _apiBaseUrl = String.fromEnvironment('apiBaseUrl');

  /// The API's address. Falls back to the brand's API host when no config file was passed.
  static String get apiBaseUrl {
    final url = _apiBaseUrl.isNotEmpty ? _apiBaseUrl : 'https://${Brand.apiHost}';
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }
}
