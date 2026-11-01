import 'package:flutter/widgets.dart';

/// The phone's region (ISO 3166 code, like "JO"), from the first device language that names one; null when none does.
String? deviceCountry([List<Locale>? deviceLocales]) {
  final locales = deviceLocales ?? WidgetsBinding.instance.platformDispatcher.locales;
  for (final l in locales) {
    final c = l.countryCode;
    if (c != null && RegExp(r'^[A-Za-z]{2}$').hasMatch(c)) return c.toUpperCase();
  }
  return null;
}

/// Country calling codes for the phone field, most used first. A code shared by several
/// countries (+1, +7) appears once, under the first country listed for it.
const phoneCountries = <(String, String)>[
  ('US', '+1'), ('CA', '+1'), ('GB', '+44'), ('AE', '+971'), ('SA', '+966'), ('QA', '+974'), ('KW', '+965'), ('BH', '+973'),
  ('OM', '+968'), ('JO', '+962'), ('LB', '+961'), ('IQ', '+964'), ('SY', '+963'), ('PS', '+970'), ('EG', '+20'), ('MA', '+212'),
  ('TN', '+216'), ('DZ', '+213'), ('LY', '+218'), ('YE', '+967'), ('SD', '+249'), ('TR', '+90'), ('IL', '+972'),
  ('DE', '+49'), ('FR', '+33'), ('IT', '+39'), ('ES', '+34'), ('NL', '+31'), ('BE', '+32'), ('AT', '+43'), ('CH', '+41'),
  ('IE', '+353'), ('PT', '+351'), ('GR', '+30'), ('CY', '+357'), ('SE', '+46'), ('NO', '+47'), ('DK', '+45'), ('FI', '+358'),
  ('PL', '+48'), ('RU', '+7'), ('AU', '+61'), ('NZ', '+64'), ('JP', '+81'), ('CN', '+86'), ('IN', '+91'), ('PK', '+92'),
  ('BD', '+880'), ('MY', '+60'), ('ID', '+62'), ('SG', '+65'), ('PH', '+63'), ('NG', '+234'), ('ZA', '+27'), ('KE', '+254'),
  ('BR', '+55'), ('MX', '+52'),
];

/// The calling codes offered, in order and without repeats.
final List<String> countryCodes = [
  for (final (i, (_, code)) in phoneCountries.indexed)
    if (phoneCountries.indexWhere((p) => p.$2 == code) == i) code,
];

/// The calling code to preselect: the phone's region's, else the first on the list.
String defaultDialCode([String? country]) {
  final c = (country ?? deviceCountry())?.toUpperCase();
  for (final (iso, code) in phoneCountries) {
    if (iso == c) return code;
  }
  return countryCodes.first;
}

/// Countries with a single time zone that most of their people live in.
const _countryZone = <String, String>{
  'JO': 'Asia/Amman', 'SA': 'Asia/Riyadh', 'AE': 'Asia/Dubai', 'QA': 'Asia/Qatar', 'KW': 'Asia/Kuwait', 'BH': 'Asia/Bahrain',
  'OM': 'Asia/Muscat', 'EG': 'Africa/Cairo', 'LB': 'Asia/Beirut', 'IQ': 'Asia/Baghdad', 'SY': 'Asia/Damascus', 'PS': 'Asia/Hebron',
  'MA': 'Africa/Casablanca', 'TN': 'Africa/Tunis', 'DZ': 'Africa/Algiers', 'LY': 'Africa/Tripoli', 'YE': 'Asia/Aden',
  'SD': 'Africa/Khartoum', 'IL': 'Asia/Jerusalem', 'TR': 'Europe/Istanbul', 'GB': 'Europe/London', 'IE': 'Europe/Dublin',
  'DE': 'Europe/Berlin', 'FR': 'Europe/Paris', 'IT': 'Europe/Rome', 'ES': 'Europe/Madrid', 'NL': 'Europe/Amsterdam',
  'BE': 'Europe/Brussels', 'AT': 'Europe/Vienna', 'CH': 'Europe/Zurich', 'PT': 'Europe/Lisbon', 'GR': 'Europe/Athens',
  'CY': 'Asia/Nicosia', 'SE': 'Europe/Stockholm', 'NO': 'Europe/Oslo', 'DK': 'Europe/Copenhagen', 'FI': 'Europe/Helsinki',
  'PL': 'Europe/Warsaw', 'JP': 'Asia/Tokyo', 'CN': 'Asia/Shanghai', 'IN': 'Asia/Kolkata', 'PK': 'Asia/Karachi',
  'BD': 'Asia/Dhaka', 'MY': 'Asia/Kuala_Lumpur', 'SG': 'Asia/Singapore', 'PH': 'Asia/Manila', 'NG': 'Africa/Lagos',
  'ZA': 'Africa/Johannesburg', 'KE': 'Africa/Nairobi', 'NZ': 'Pacific/Auckland',
};

/// Countries spanning several zones, by standard (winter) offset in minutes.
const _countryZonesByOffset = <String, Map<int, String>>{
  'US': {-600: 'Pacific/Honolulu', -540: 'America/Anchorage', -480: 'America/Los_Angeles', -420: 'America/Denver', -360: 'America/Chicago', -300: 'America/New_York'},
  'CA': {-480: 'America/Vancouver', -420: 'America/Edmonton', -360: 'America/Winnipeg', -300: 'America/Toronto', -240: 'America/Halifax', -210: 'America/St_Johns'},
  'AU': {480: 'Australia/Perth', 570: 'Australia/Adelaide', 600: 'Australia/Sydney'},
  'BR': {-300: 'America/Rio_Branco', -240: 'America/Manaus', -180: 'America/Sao_Paulo', -120: 'America/Noronha'},
  'MX': {-480: 'America/Tijuana', -420: 'America/Hermosillo', -360: 'America/Mexico_City', -300: 'America/Cancun'},
  'ID': {420: 'Asia/Jakarta', 480: 'Asia/Makassar', 540: 'Asia/Jayapura'},
  'RU': {120: 'Europe/Kaliningrad', 180: 'Europe/Moscow', 240: 'Europe/Samara', 300: 'Asia/Yekaterinburg', 420: 'Asia/Novosibirsk', 600: 'Asia/Vladivostok'},
};

/// Anywhere else: a major city on the same standard offset.
const _offsetZone = <int, String>{
  -600: 'Pacific/Honolulu', -540: 'America/Anchorage', -480: 'America/Los_Angeles', -420: 'America/Denver', -360: 'America/Chicago',
  -300: 'America/New_York', -240: 'America/Halifax', -210: 'America/St_Johns', -180: 'America/Sao_Paulo', -60: 'Atlantic/Azores',
  0: 'UTC', 60: 'Europe/Paris', 120: 'Europe/Athens', 180: 'Asia/Riyadh', 210: 'Asia/Tehran', 240: 'Asia/Dubai', 270: 'Asia/Kabul',
  300: 'Asia/Karachi', 330: 'Asia/Kolkata', 345: 'Asia/Kathmandu', 360: 'Asia/Dhaka', 390: 'Asia/Yangon', 420: 'Asia/Bangkok',
  480: 'Asia/Singapore', 540: 'Asia/Tokyo', 570: 'Australia/Darwin', 600: 'Australia/Brisbane', 660: 'Pacific/Noumea', 720: 'Pacific/Auckland',
};

/// The phone's offset outside daylight saving: the smaller of January's and July's, so it is the
/// same all year in both hemispheres.
Duration deviceStandardOffset([DateTime? now]) {
  final year = (now ?? DateTime.now()).year;
  final jan = DateTime(year, 1, 1).timeZoneOffset;
  final jul = DateTime(year, 7, 1).timeZoneOffset;
  return jan < jul ? jan : jul;
}

/// A likely IANA time zone for a new business, from the phone's region and standard offset; null when
/// nothing fits (the server then uses UTC).
String? guessTimeZone({String? country, required Duration standardOffset}) {
  final c = country?.toUpperCase();
  final minutes = standardOffset.inMinutes;
  if (c != null) {
    final single = _countryZone[c];
    if (single != null) return single;
    final byOffset = _countryZonesByOffset[c]?[minutes];
    if (byOffset != null) return byOffset;
  }
  return _offsetZone[minutes];
}

/// [guessTimeZone] for this phone.
String? deviceTimeZone() => guessTimeZone(country: deviceCountry(), standardOffset: deviceStandardOffset());
