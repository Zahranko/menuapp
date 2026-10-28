import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/core/currency.dart';

void main() {
  test('the list matches the server: codes, decimals and no repeats', () {
    const server = 'USD EUR GBP JOD SAR AED QAR KWD BHD OMR EGP LBP IQD SYP MAD TND DZD LYD YER SDG ILS TRY CAD AUD CHF SEK NOK DKK JPY CNY INR PKR MYR IDR NGN ZAR KES BRL MXN';
    expect({for (final c in currencies) c.code}, server.split(' ').toSet());
    expect(currencies.length, server.split(' ').length);
    for (final c in currencies) {
      final expected = 'JOD KWD BHD OMR IQD LYD TND'.contains(c.code) ? 3 : (c.code == 'JPY' ? 0 : 2);
      expect(c.decimals, expected, reason: c.code);
      expect(c.nameEn, isNotEmpty);
      expect(c.nameAr, isNotEmpty);
    }
  });

  test('numbers keep the currency decimals, with a third only when needed', () {
    expect(currencyFor('USD').formatNumber(3.5), '3.50');
    expect(currencyFor('USD').formatNumber(12500), '12,500.00');
    expect(currencyFor('JOD').formatNumber(3.5), '3.50');
    expect(currencyFor('JOD').formatNumber(3.255), '3.255');
    expect(currencyFor('JPY').formatNumber(1200), '1,200');
    expect(currencyFor('JOD').inputText(3.5), '3.500');
    expect(currencyFor('JPY').hint, '0');
  });

  test('price input allows the currency decimals and no more', () {
    expect(currencyFor('USD').acceptsPrice('3.50'), isTrue);
    expect(currencyFor('USD').acceptsPrice('3.505'), isFalse);
    expect(currencyFor('KWD').acceptsPrice('3.505'), isTrue);
    expect(currencyFor('JPY').acceptsPrice('350'), isTrue);
    expect(currencyFor('JPY').acceptsPrice('3.5'), isFalse);
  });

  test('unknown codes still show; the phone region picks a currency, else US dollars', () {
    expect(currencyFor('xyz').code, 'XYZ');
    expect(currencyForCountry('JO'), 'JOD');
    expect(currencyForCountry('de'), 'EUR');
    expect(currencyForCountry('ZZ'), 'USD');
    expect(currencyForCountry(null), 'USD');
  });

  test('search matches codes, signs and names in both languages', () {
    final jod = currencyFor('JOD');
    expect(jod.matches('jod'), isTrue);
    expect(jod.matches('jordan'), isTrue);
    expect(jod.matches('أردني'), isTrue);
    expect(jod.matches('JD'), isTrue);
    expect(jod.matches('euro'), isFalse);
  });
}
