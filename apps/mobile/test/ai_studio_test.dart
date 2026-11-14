import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/features/ai/ai_design_chat.dart';

void main() {
  test('finds the first web link in a message', () {
    expect(firstLink('Make it like https://example.com/cafe, please!'), 'https://example.com/cafe');
    expect(firstLink('see (http://x.example/a.png)'), 'http://x.example/a.png');
    expect(firstLink('no links here'), isNull);
    expect(firstLink('HTTPS://EXAMPLE.COM/A?b=1&c=2.'), 'HTTPS://EXAMPLE.COM/A?b=1&c=2');
  });
}
