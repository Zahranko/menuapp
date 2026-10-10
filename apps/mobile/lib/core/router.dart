import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/auth_controller.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/signup_screen.dart';
import '../features/auth/screens/start_screen.dart';
import '../features/auth/screens/welcome_screen.dart';
import '../features/design/editor_screen.dart';
import '../features/design/templates_screen.dart';
import '../features/menu/dashboard_screen.dart';
import '../features/site/site_screen.dart';
import 'theme.dart';

const _signedOutRoutes = {'/', '/signup', '/login'};
const _signedInRoutes = {'/welcome', '/menu', '/templates', '/design', '/site'};

/// Routes plus the auth redirect: signed-out owners stay on the start, sign-up and log-in screens;
/// new owners see the welcome screen, returning owners land on My menu.
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
        SignedIn(:final justSignedUp) => _signedInRoutes.contains(here) ? null : (justSignedUp ? '/welcome' : '/menu'),
      };
    },
    routes: [
      GoRoute(path: '/loading', builder: (_, _) => const _Loading()),
      GoRoute(path: '/', builder: (_, _) => const StartScreen()),
      GoRoute(path: '/signup', builder: (_, _) => const SignupScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/welcome', builder: (_, _) => const WelcomeScreen()),
      GoRoute(path: '/menu', builder: (_, _) => const DashboardScreen()),
      GoRoute(path: '/templates', builder: (_, _) => const TemplatesScreen()),
      GoRoute(path: '/design', builder: (_, _) => const EditorScreen()),
      GoRoute(path: '/site', builder: (_, _) => const SiteScreen()),
    ],
  );
});

class _Loading extends StatelessWidget {
  const _Loading();

  @override
  Widget build(BuildContext context) => ColoredBox(color: BrandColors.primary);
}
