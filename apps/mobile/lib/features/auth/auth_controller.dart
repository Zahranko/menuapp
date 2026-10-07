import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_error.dart';
import '../../core/api/models.dart';
import '../../core/providers.dart';

/// Where the session stands. [justSignedUp] picks the welcome copy for a new account.
sealed class AuthState {
  const AuthState();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class SignedOut extends AuthState {
  const SignedOut();
}

class SignedIn extends AuthState {
  const SignedIn(this.business, {this.justSignedUp = false});

  final Business business;
  final bool justSignedUp;
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(AuthController.new);

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    Future.microtask(_restore);
    return const AuthLoading();
  }

  Future<void> _restore() async {
    try {
      final business = await ref.read(authRepositoryProvider).restore();
      state = business == null ? const SignedOut() : SignedIn(business);
    } on ApiError {
      // Expired session, or no network at launch: show the log-in screen either way.
      state = const SignedOut();
    }
  }

  Future<void> register({
    required String businessName,
    required String email,
    required String phone,
    required String password,
    required String locale,
  }) async {
    final business = await ref.read(authRepositoryProvider).register(
          businessName: businessName,
          email: email,
          phone: phone,
          password: password,
          locale: locale,
        );
    state = SignedIn(business, justSignedUp: true);
  }

  Future<void> logIn({required String login, required String password}) async {
    final business = await ref.read(authRepositoryProvider).logIn(login: login, password: password);
    state = SignedIn(business);
  }

  Future<void> logOut() async {
    await ref.read(authRepositoryProvider).logOut();
    state = const SignedOut();
  }

  void sessionExpired() => state = const SignedOut();
}
