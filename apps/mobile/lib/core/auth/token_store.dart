import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Where the session tokens live between app launches.
abstract interface class TokenStore {
  Future<({String access, String refresh})?> read();
  Future<void> save({required String access, required String refresh});
  Future<void> clear();
}

/// Keychain on iOS, encrypted shared preferences on Android.
class SecureTokenStore implements TokenStore {
  SecureTokenStore([FlutterSecureStorage? storage]) : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;
  static const _accessKey = 'auth.access';
  static const _refreshKey = 'auth.refresh';

  @override
  Future<({String access, String refresh})?> read() async {
    final access = await _storage.read(key: _accessKey);
    final refresh = await _storage.read(key: _refreshKey);
    if (access == null || refresh == null) return null;
    return (access: access, refresh: refresh);
  }

  @override
  Future<void> save({required String access, required String refresh}) async {
    await _storage.write(key: _accessKey, value: access);
    await _storage.write(key: _refreshKey, value: refresh);
  }

  @override
  Future<void> clear() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }
}

/// For tests and previews.
class MemoryTokenStore implements TokenStore {
  ({String access, String refresh})? _tokens;

  @override
  Future<({String access, String refresh})?> read() async => _tokens;

  @override
  Future<void> save({required String access, required String refresh}) async => _tokens = (access: access, refresh: refresh);

  @override
  Future<void> clear() async => _tokens = null;
}
