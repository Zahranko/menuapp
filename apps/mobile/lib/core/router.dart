import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/auth_controller.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/signup_screen.dart';
import '../features/auth/screens/start_screen.dart';
import '../features/auth/screens/welcome_screen.dart';
import 'theme.dart';

const _signedOutRoutes = {'/', '/signup', '/login'};

/// Routes plus the auth redirect: signed-out owners stay on the start, sign-up and log-in screens;
/// signed-in owners go to the welcome screen (the dashboard replaces it in a later session).
final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier(0);
  ref.listen(authControllerProvider, (_, _) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/loading',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final here = state.matchedLocation;
      return switch (auth) {
        AuthLoading() => here == '/loading' ? null : '/loading',
        SignedOut() => _signedOutRoutes.contains(here) ? null : '/',
        SignedIn() => here == '/welcome' ? null : '/welcome',
      };
    },
    routes: [
      GoRoute(path: '/loading', builder: (_, _) => const _Loading()),
      GoRoute(path: '/', builder: (_, _) => const StartScreen()),
      GoRoute(path: '/signup', builder: (_, _) => const SignupScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/welcome', builder: (_, _) => const WelcomeScreen()),
    ],
  );
});

class _Loading extends StatelessWidget {
  const _Loading();

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: BrandColors.primary,
        body: Center(child: CircularProgressIndicator(color: BrandColors.accent)),
      );
}
