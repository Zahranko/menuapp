import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart';

/// A currency an owner can price in. The list matches the server's; [decimals] is how many
/// digits prices keep after the point (3 for the Jordanian dinar, 0 for the yen, 2 for most).
class Currency {
  const Currency(this.code, this.decimals, this.symbol, this.nameEn, this.nameAr, {this.symbolAr, this.symbolFirst = false});

  /// ISO 4217 code, like "USD".
  final String code;
  final int decimals;

  /// The short sign shown next to prices in English, like "$" or "JD".
  final String symbol;

  /// The sign in Arabic, when it differs, like "د.أ".
  final String? symbolAr;
  final String nameEn;
  final String nameAr;

  /// Written before the number in English ("$3.50") rather than after it ("3.50 JD").
  final bool symbolFirst;

  bool _arabic(BuildContext context) => Localizations.localeOf(context).languageCode == 'ar';

  /// The currency's name in the app's language.
  String nameFor(BuildContext context) => _arabic(context) ? nameAr : nameEn;

  /// The sign to show next to prices in the app's language.
  String symbolFor(BuildContext context) => _arabic(context) ? (symbolAr ?? symbol) : symbol;

  /// "0.00", "0.000" or "0": what an empty price field shows.
  String get hint => decimals == 0 ? '0' : '0.${'0' * decimals}';

  /// The number as owners type it in the price field: all the currency's decimals.
  String inputText(double price) => price.toStringAsFixed(decimals);

  /// Whether [text] (already trimmed, with "." as the point) is a price this currency can hold.
  bool acceptsPrice(String text) => RegExp(decimals == 0 ? r'^\d+$' : '^\\d+(\\.\\d{1,$decimals})?\$').hasMatch(text);

  /// "1,250.50": grouped thousands and two decimals; a third only when the price needs it
  /// (so 3.5 dinars reads "3.50"), none for the yen. Digits stay Western in both languages.
  String formatNumber(double price) {
    final shown = decimals < 2 ? decimals : 2;
    final pattern = decimals == 0 ? '#,##0' : '#,##0.${'0' * shown}${'#' * (decimals - shown)}';
    return NumberFormat(pattern, 'en').format(price);
  }

  /// Matches the search box against the code, the sign and both names.
  bool matches(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return true;
    return code.toLowerCase().contains(q) ||
        nameEn.toLowerCase().contains(q) ||
        nameAr.contains(q) ||
        symbol.toLowerCase() == q ||
        (symbolAr ?? '') == q;
  }
}

/// What a business prices in when nothing else is known (the server's default too).
const defaultCurrencyCode = 'USD';

/// Every currency the server accepts, the most used by owners first.
const currencies = <Currency>[
  Currency('USD', 2, r'$', 'US dollar', 'دولار أمريكي', symbolFirst: true),
  Currency('EUR', 2, '€', 'Euro', 'يورو', symbolFirst: true),
  Currency('GBP', 2, '£', 'British pound', 'جنيه إسترليني', symbolFirst: true),
  Currency('SAR', 2, 'SAR', 'Saudi riyal', 'ريال سعودي', symbolAr: 'ر.س'),
  Currency('AED', 2, 'AED', 'UAE dirham', 'درهم إماراتي', symbolAr: 'د.إ'),
  Currency('QAR', 2, 'QAR', 'Qatari riyal', 'ريال قطري', symbolAr: 'ر.ق'),
  Currency('KWD', 3, 'KD', 'Kuwaiti dinar', 'دينار كويتي', symbolAr: 'د.ك'),
  Currency('BHD', 3, 'BD', 'Bahraini dinar', 'دينار بحريني', symbolAr: 'د.ب'),
  Currency('OMR', 3, 'OMR', 'Omani rial', 'ريال عماني', symbolAr: 'ر.ع'),
  Currency('JOD', 3, 'JD', 'Jordanian dinar', 'دينار أردني', symbolAr: 'د.أ'),
  Currency('EGP', 2, 'EGP', 'Egyptian pound', 'جنيه مصري', symbolAr: 'ج.م'),
  Currency('LBP', 2, 'LBP', 'Lebanese pound', 'ليرة لبنانية', symbolAr: 'ل.ل'),
  Currency('IQD', 3, 'IQD', 'Iraqi dinar', 'دينار عراقي', symbolAr: 'د.ع'),
  Currency('SYP', 2, 'SYP', 'Syrian pound', 'ليرة سورية', symbolAr: 'ل.س'),
  Currency('MAD', 2, 'MAD', 'Moroccan dirham', 'درهم مغربي', symbolAr: 'د.م'),
  Currency('TND', 3, 'TND', 'Tunisian dinar', 'دينار تونسي', symbolAr: 'د.ت'),
  Currency('DZD', 2, 'DZD', 'Algerian dinar', 'دينار جزائري', symbolAr: 'د.ج'),
  Currency('LYD', 3, 'LYD', 'Libyan dinar', 'دينار ليبي', symbolAr: 'د.ل'),
  Currency('YER', 2, 'YER', 'Yemeni rial', 'ريال يمني', symbolAr: 'ر.ي'),
  Currency('SDG', 2, 'SDG', 'Sudanese pound', 'جنيه سوداني', symbolAr: 'ج.س'),
  Currency('ILS', 2, '₪', 'Israeli shekel', 'شيكل', symbolFirst: true),
  Currency('TRY', 2, '₺', 'Turkish lira', 'ليرة تركية', symbolFirst: true),
  Currency('CAD', 2, r'CA$', 'Canadian dollar', 'دولار كندي', symbolFirst: true),
  Currency('AUD', 2, r'A$', 'Australian dollar', 'دولار أسترالي', symbolFirst: true),
  Currency('CHF', 2, 'CHF', 'Swiss franc', 'فرنك سويسري'),
  Currency('SEK', 2, 'kr', 'Swedish krona', 'كرونة سويدية'),
  Currency('NOK', 2, 'kr', 'Norwegian krone', 'كرونة نرويجية'),
  Currency('DKK', 2, 'kr', 'Danish krone', 'كرونة دنماركية'),
  Currency('JPY', 0, '¥', 'Japanese yen', 'ين ياباني', symbolFirst: true),
  Currency('CNY', 2, 'CN¥', 'Chinese yuan', 'يوان صيني', symbolFirst: true),
  Currency('INR', 2, '₹', 'Indian rupee', 'روبية هندية', symbolFirst: true),
  Currency('PKR', 2, 'Rs', 'Pakistani rupee', 'روبية باكستانية', symbolFirst: true),
  Currency('MYR', 2, 'RM', 'Malaysian ringgit', 'رينغيت ماليزي', symbolFirst: true),
  Currency('IDR', 2, 'Rp', 'Indonesian rupiah', 'روبية إندونيسية', symbolFirst: true),
  Currency('NGN', 2, '₦', 'Nigerian naira', 'نايرا نيجيرية', symbolFirst: true),
  Currency('ZAR', 2, 'R', 'South African rand', 'راند جنوب أفريقي', symbolFirst: true),
  Currency('KES', 2, 'KSh', 'Kenyan shilling', 'شلن كيني', symbolFirst: true),
  Currency('BRL', 2, r'R$', 'Brazilian real', 'ريال برازيلي', symbolFirst: true),
  Currency('MXN', 2, r'MX$', 'Mexican peso', 'بيزو مكسيكي', symbolFirst: true),
];

/// The currency for [code]. A code the app doesn't know yet still shows, as itself with two decimals.
Currency currencyFor(String code) {
  final upper = code.toUpperCase();
  for (final c in currencies) {
    if (c.code == upper) return c;
  }
  return Currency(upper, 2, upper, upper, upper);
}

/// Countries mapped to the currency their shops price in, for the ones on the list.
const _countryCurrency = <String, String>{
  'US': 'USD', 'PR': 'USD', 'EC': 'USD', 'SV': 'USD', 'PA': 'USD',
  'AT': 'EUR', 'BE': 'EUR', 'CY': 'EUR', 'DE': 'EUR', 'EE': 'EUR', 'ES': 'EUR', 'FI': 'EUR', 'FR': 'EUR', 'GR': 'EUR', 'HR': 'EUR',
  'IE': 'EUR', 'IT': 'EUR', 'LT': 'EUR', 'LU': 'EUR', 'LV': 'EUR', 'MT': 'EUR', 'NL': 'EUR', 'PT': 'EUR', 'SI': 'EUR', 'SK': 'EUR',
  'AD': 'EUR', 'MC': 'EUR', 'SM': 'EUR', 'VA': 'EUR', 'ME': 'EUR', 'XK': 'EUR',
  'GB': 'GBP', 'JO': 'JOD', 'SA': 'SAR', 'AE': 'AED', 'QA': 'QAR', 'KW': 'KWD', 'BH': 'BHD', 'OM': 'OMR', 'EG': 'EGP', 'LB': 'LBP',
  'IQ': 'IQD', 'SY': 'SYP', 'MA': 'MAD', 'TN': 'TND', 'DZ': 'DZD', 'LY': 'LYD', 'YE': 'YER', 'SD': 'SDG', 'IL': 'ILS', 'PS': 'ILS',
  'TR': 'TRY', 'CA': 'CAD', 'AU': 'AUD', 'CH': 'CHF', 'LI': 'CHF', 'SE': 'SEK', 'NO': 'NOK', 'DK': 'DKK', 'JP': 'JPY', 'CN': 'CNY',
  'IN': 'INR', 'PK': 'PKR', 'MY': 'MYR', 'ID': 'IDR', 'NG': 'NGN', 'ZA': 'ZAR', 'KE': 'KES', 'BR': 'BRL', 'MX': 'MXN',
};

/// The currency most shops in [country] (ISO 3166 code, like "JO") price in, or USD.
String currencyForCountry(String? country) => _countryCurrency[country?.toUpperCase()] ?? defaultCurrencyCode;
