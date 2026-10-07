import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:storefront_app/core/api/api_client.dart';
import 'package:storefront_app/core/api/api_error.dart';
import 'package:storefront_app/core/auth/token_store.dart';

import 'fake_api.dart';

void main() {
  group('token refresh', () {
    test('a 401 refreshes once and retries with the new token', () async {
      final tokens = MemoryTokenStore();
      await tokens.save(access: 'old', refresh: 'refresh-old');
      var signedOut = false;
      final api = FakeApi((r) {
        if (r.path == '/api/v1/auth/refresh') {
          expect(r.data, {'refreshToken': 'refresh-old'});
          return (status: 200, body: authBody(access: 'new', refresh: 'refresh-new'));
        }
        return r.headers['Authorization'] == 'Bearer new' ? (status: 200, body: {'ok': true}) : (status: 401, body: {'title': 'Unauthorized'});
      });
      final dio = createApiClient(baseUrl: 'https://api.test', tokens: tokens, adapter: api, onSignedOut: () => signedOut = true);

      final response = await dio.get<Map<String, dynamic>>('/api/v1/me');

      expect(response.data, {'ok': true});
      expect(api.requests.map((r) => r.path), ['/api/v1/me', '/api/v1/auth/refresh', '/api/v1/me']);
      expect(await tokens.read(), (access: 'new', refresh: 'refresh-new'));
      expect(signedOut, isFalse);
    });

    test('a failed refresh clears the tokens and signs out', () async {
      final tokens = MemoryTokenStore();
      await tokens.save(access: 'old', refresh: 'refresh-old');
      var signedOut = false;
      final api = FakeApi((r) => (status: 401, body: {'title': 'Unauthorized'}));
      final dio = createApiClient(baseUrl: 'https://api.test', tokens: tokens, adapter: api, onSignedOut: () => signedOut = true);

      await expectLater(dio.get<void>('/api/v1/me'), throwsA(isA<DioException>()));

      expect(await tokens.read(), isNull);
      expect(signedOut, isTrue);
      expect(api.requests.map((r) => r.path), ['/api/v1/me', '/api/v1/auth/refresh']);
    });

    test('parallel 401s share one refresh', () async {
      final tokens = MemoryTokenStore();
      await tokens.save(access: 'old', refresh: 'refresh-old');
      var refreshes = 0;
      final api = FakeApi((r) {
        if (r.path == '/api/v1/auth/refresh') {
          refreshes++;
          return (status: 200, body: authBody(access: 'new', refresh: 'refresh-new'));
        }
        return r.headers['Authorization'] == 'Bearer new' ? (status: 200, body: {'ok': true}) : (status: 401, body: null);
      });
      final dio = createApiClient(baseUrl: 'https://api.test', tokens: tokens, adapter: api, onSignedOut: () {});

      await Future.wait([dio.get<void>('/api/v1/me'), dio.get<void>('/api/v1/business')]);

      expect(refreshes, 1);
    });

    test('log-in calls never carry a token or trigger a refresh', () async {
      final tokens = MemoryTokenStore();
      await tokens.save(access: 'old', refresh: 'refresh-old');
      final api = FakeApi((r) => (status: 401, body: {'title': 'Wrong email, phone or password.'}));
      final dio = createApiClient(baseUrl: 'https://api.test', tokens: tokens, adapter: api, onSignedOut: () {});

      await expectLater(dio.post<void>('/api/v1/auth/login', data: {}), throwsA(isA<DioException>()));

      expect(api.requests.single.headers['Authorization'], isNull);
      expect(await tokens.read(), isNotNull);
    });
  });

  group('ApiError', () {
    test('reads field errors from ProblemDetails, ignoring case', () async {
      final api = FakeApi((r) => (status: 400, body: {
            'title': 'One or more validation errors occurred.',
            'errors': {
              'Email': ['That email already has an account.'],
              'phone': ['Use the full number with country code.'],
            },
          }));
      final dio = createApiClient(baseUrl: 'https://api.test', tokens: MemoryTokenStore(), adapter: api, onSignedOut: () {});

      try {
        await dio.post<void>('/api/v1/auth/register', data: {});
        fail('should throw');
      } catch (e) {
        final error = ApiError.from(e);
        expect(error.status, 400);
        expect(error.field('email'), 'That email already has an account.');
        expect(error.field('Phone'), 'Use the full number with country code.');
        expect(error.isNetwork, isFalse);
      }
    });

    test('no response is a network error', () {
      final error = ApiError.from(DioException(requestOptions: RequestOptions(path: '/'), type: DioExceptionType.connectionError));
      expect(error.isNetwork, isTrue);
    });
  });
}
