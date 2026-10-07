import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/auth_controller.dart';
import '../features/auth/auth_repository.dart';
import 'api/api_client.dart';
import 'auth/token_store.dart';
import 'config.dart';

final tokenStoreProvider = Provider<TokenStore>((ref) => SecureTokenStore());

/// Tests replace this to answer API calls without a server.
final httpAdapterProvider = Provider<HttpClientAdapter?>((ref) => null);

final dioProvider = Provider<Dio>((ref) => createApiClient(
      baseUrl: AppConfig.apiBaseUrl,
      tokens: ref.watch(tokenStoreProvider),
      adapter: ref.watch(httpAdapterProvider),
      // A refresh that fails means the session is over everywhere in the app.
      onSignedOut: () => ref.read(authControllerProvider.notifier).sessionExpired(),
    ));

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(dioProvider), ref.watch(tokenStoreProvider)),
);
