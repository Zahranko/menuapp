import 'package:url_launcher/url_launcher.dart';

/// Opens a web address from the server outside the app. Only https pages open, so a bad
/// address can't start another app or run script.
Future<bool> openWebPage(String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null || uri.scheme != 'https' || uri.host.isEmpty) return false;
  return launchUrl(uri, mode: LaunchMode.externalApplication);
}
