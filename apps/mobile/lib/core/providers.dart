import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/auth_controller.dart';
import '../features/auth/auth_repository.dart';
import '../features/design/design_repository.dart';
import '../features/menu/menu_repository.dart';
import '../features/plan/plan_repository.dart';
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

final menuRepositoryProvider = Provider<MenuRepository>((ref) => MenuRepository(ref.watch(dioProvider)));

final designRepositoryProvider = Provider<DesignRepository>((ref) => DesignRepository(ref.watch(dioProvider)));

final planRepositoryProvider = Provider<PlanRepository>((ref) => PlanRepository(ref.watch(dioProvider)));
