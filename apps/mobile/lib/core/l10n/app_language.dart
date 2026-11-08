import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// The app language the owner picked: follow the phone, or always English or Arabic.
enum AppLanguage {
  system,
  en,
  ar;

  /// What MaterialApp.locale gets: null follows the device.
  Locale? get locale => this == system ? null : Locale(name);

  static AppLanguage parse(String? code) => switch (code) {
        'en' => en,
        'ar' => ar,
        _ => system,
      };
}

/// The language the app shows for [choice]: the chosen one, or the first supported device language
/// (the same rule MaterialApp uses), English when the device has neither.
String effectiveLanguageCode(AppLanguage choice, [List<Locale>? deviceLocales]) {
  if (choice != AppLanguage.system) return choice.name;
  final device = deviceLocales ?? WidgetsBinding.instance.platformDispatcher.locales;
  for (final l in device) {
    if (l.languageCode == 'ar' || l.languageCode == 'en') return l.languageCode;
  }
  return 'en';
}

/// Where the language choice lives between launches.
abstract interface class LanguageStore {
  Future<AppLanguage> read();
  Future<void> save(AppLanguage language);
}

/// Keychain on iOS, encrypted shared preferences on Android (the same storage as the session tokens).
class SecureLanguageStore implements LanguageStore {
  SecureLanguageStore([FlutterSecureStorage? storage]) : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;
  static const _key = 'app.language';

  @override
  Future<AppLanguage> read() async => AppLanguage.parse(await _storage.read(key: _key));

  @override
  Future<void> save(AppLanguage language) => language == AppLanguage.system ? _storage.delete(key: _key) : _storage.write(key: _key, value: language.name);
}

/// For tests and previews.
class MemoryLanguageStore implements LanguageStore {
  MemoryLanguageStore([this.language = AppLanguage.system]);

  AppLanguage language;

  @override
  Future<AppLanguage> read() async => language;

  @override
  Future<void> save(AppLanguage language) async => this.language = language;
}

final languageStoreProvider = Provider<LanguageStore>((ref) => SecureLanguageStore());

/// The choice read before the first frame (see main.dart), so the app doesn't start in the wrong language.
/// Null when it wasn't read up front; the controller then reads the store itself.
final savedLanguageProvider = Provider<AppLanguage?>((ref) => null);

/// The owner's language choice. Changing it re-renders the app in that language (and direction) at once.
final appLanguageProvider = NotifierProvider<AppLanguageController, AppLanguage>(AppLanguageController.new);

class AppLanguageController extends Notifier<AppLanguage> {
  bool _chosen = false;

  @override
  AppLanguage build() {
    final saved = ref.read(savedLanguageProvider);
    if (saved != null) return saved;
    _load();
    return AppLanguage.system;
  }

  Future<void> _load() async {
    try {
      final saved = await ref.read(languageStoreProvider).read();
      // A choice made while the store was being read wins.
      if (ref.mounted && !_chosen) state = saved;
    } catch (_) {
      // Unreadable storage: keep following the device.
    }
  }

  Future<void> choose(AppLanguage language) async {
    _chosen = true;
    state = language;
    try {
      await ref.read(languageStoreProvider).save(language);
    } catch (_) {
      // Still applies for this run.
    }
  }

  /// The language the app is showing now, as sent in Accept-Language: "ar" or "en".
  String get languageCode => effectiveLanguageCode(state);
}
