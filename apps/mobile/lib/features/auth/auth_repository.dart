import 'dart:io' show Platform;

import 'package:dio/dio.dart';

import '../../core/api/api_error.dart';
import '../../core/api/models.dart';
import '../../core/auth/token_store.dart';

/// The auth endpoints under /api/v1/auth. Every method throws [ApiError] on failure.
class AuthRepository {
  AuthRepository(this._dio, this._tokens);

  final Dio _dio;
  final TokenStore _tokens;

  static String get _device {
    try {
      return Platform.isIOS ? 'iPhone' : Platform.isAndroid ? 'Android' : Platform.operatingSystem;
    } catch (_) {
      return 'App';
    }
  }

  Future<Business> register({
    required String businessName,
    required String email,
    required String phone,
    required String password,
    required String locale,
  }) =>
      _signIn('/api/v1/auth/register', {
        'businessName': businessName,
        'email': email,
        'phone': phone,
        'password': password,
        'deviceName': _device,
        'locale': locale,
      });

  Future<Business> logIn({required String login, required String password}) =>
      _signIn('/api/v1/auth/login', {'login': login, 'password': password, 'deviceName': _device});

  Future<SlugAvailability> slugAvailability(String businessName) => _call(() async {
        final response = await _dio.get<Map<String, dynamic>>('/api/v1/auth/slug-availability', queryParameters: {'name': businessName});
        return SlugAvailability.fromJson(response.data!);
      });

  Future<void> forgotPassword(String email) => _call(() => _dio.post<void>('/api/v1/auth/forgot-password', data: {'email': email}));

  /// The signed-in owner's business, or null when there is no saved session.
  Future<Business?> restore() async {
    if (await _tokens.read() == null) return null;
    return _call(() async {
      final response = await _dio.get<Map<String, dynamic>>('/api/v1/me');
      return Business.fromJson(response.data!['business'] as Map<String, dynamic>);
    });
  }

  /// Ends this device's session on the server (best effort) and forgets the tokens.
  Future<void> logOut() async {
    final saved = await _tokens.read();
    if (saved != null) {
      try {
        await _dio.post<void>('/api/v1/auth/logout', data: {'refreshToken': saved.refresh});
      } on DioException {
        // Offline or already expired: the local sign-out below is what matters.
      }
    }
    await _tokens.clear();
  }

  Future<Business> _signIn(String path, Map<String, dynamic> body) => _call(() async {
        final response = await _dio.post<Map<String, dynamic>>(path, data: body);
        final result = AuthResult.fromJson(response.data!);
        await _tokens.save(access: result.accessToken, refresh: result.refreshToken);
        return result.business;
      });

  static Future<T> _call<T>(Future<T> Function() run) async {
    try {
      return await run();
    } catch (e) {
      throw ApiError.from(e);
    }
  }
}
