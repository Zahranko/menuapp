import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/features/site/site_web_view.dart';

void main() {
  test('the www and bare addresses count as the same site', () {
    final page = Uri.parse('https://example.com/demomenu?preview=1');
    expect(isSameSite(Uri.parse('https://www.example.com/demomenu'), page), isTrue);
    expect(isSameSite(Uri.parse('https://example.com/demomenu'), Uri.parse('https://www.example.com/demomenu')), isTrue);
    expect(isSameSite(Uri.parse('https://instagram.com/demomenu'), page), isFalse);
    expect(isSameSite(Uri.parse('https://evil-example.com/'), page), isFalse);
  });
}
