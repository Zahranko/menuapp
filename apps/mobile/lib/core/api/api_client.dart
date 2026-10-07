import 'dart:async';

import 'package:dio/dio.dart';

import '../auth/token_store.dart';

/// Builds the app's HTTP client: JSON, the bearer token on every call, and one silent token refresh
/// when the API answers 401. When the refresh fails too, the tokens are cleared and [onSignedOut] runs.
Dio createApiClient({
  required String baseUrl,
  required TokenStore tokens,
  required void Function() onSignedOut,
  HttpClientAdapter? adapter,
}) {
  BaseOptions options() => BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        contentType: Headers.jsonContentType,
        responseType: ResponseType.json,
      );

  final dio = Dio(options());
  // Refreshes and retries go through a client without the interceptor, so they can't loop or queue behind it.
  final bare = Dio(options());
  if (adapter != null) {
    dio.httpClientAdapter = adapter;
    bare.httpClientAdapter = adapter;
  }
  dio.interceptors.add(AuthInterceptor(refreshClient: bare, tokens: tokens, onSignedOut: onSignedOut));
  return dio;
}

/// Queued, so parallel 401s wait for one refresh instead of each spending the refresh token
/// (the API revokes the whole chain when a refresh token is used twice).
class AuthInterceptor extends QueuedInterceptor {
  AuthInterceptor({required this.refreshClient, required this.tokens, required this.onSignedOut});

  /// Same settings, no interceptors: used for the refresh call and the one retry.
  final Dio refreshClient;
  final TokenStore tokens;
  final void Function() onSignedOut;

  static const _retried = 'auth.retried';

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final saved = await tokens.read();
    if (saved != null && !_isAuthCall(options.path)) {
      options.headers['Authorization'] = 'Bearer ${saved.access}';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final request = err.requestOptions;
    if (err.response?.statusCode != 401 || _isAuthCall(request.path) || request.extra[_retried] == true) {
      return handler.next(err);
    }

    final saved = await tokens.read();
    if (saved == null) return handler.next(err);

    // Another queued request may have refreshed already while this one waited.
    final sent = request.headers['Authorization'];
    if (sent != null && sent != 'Bearer ${saved.access}') {
      return _retry(request, saved.access, handler, err);
    }

    try {
      final response = await refreshClient.post<Map<String, dynamic>>('/api/v1/auth/refresh', data: {'refreshToken': saved.refresh});
      final body = response.data!;
      final access = body['accessToken'] as String;
      await tokens.save(access: access, refresh: body['refreshToken'] as String);
      await _retry(request, access, handler, err);
      return;
    } on DioException {
      await tokens.clear();
      onSignedOut();
      return handler.next(err);
    }
  }

  Future<void> _retry(RequestOptions request, String access, ErrorInterceptorHandler handler, DioException original) async {
    request.headers['Authorization'] = 'Bearer $access';
    request.extra[_retried] = true;
    try {
      // Through the client without interceptors: a retry that fails again must not queue behind this handler.
      handler.resolve(await refreshClient.fetch<dynamic>(request));
    } on DioException catch (e) {
      handler.next(e);
    }
  }

  static bool _isAuthCall(String path) =>
      path.contains('/auth/login') ||
      path.contains('/auth/register') ||
      path.contains('/auth/refresh') ||
      path.contains('/auth/forgot-password') ||
      path.contains('/auth/slug-availability');
}
