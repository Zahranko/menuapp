import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_controller.dart';
import 'splash_view.dart';

export 'splash_view.dart' show SplashView;

/// Plays the brand splash over the app on launch, then fades it away once the animation has run
/// and the saved session has been checked. The router keeps working underneath.
class SplashGate extends ConsumerStatefulWidget {
  const SplashGate({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<SplashGate> createState() => _SplashGateState();
}

class _SplashGateState extends ConsumerState<SplashGate> with TickerProviderStateMixin {
  late final _intro = AnimationController(vsync: this, duration: SplashView.duration)..addStatusListener((_) => _maybeLeave());
  late final _exit = AnimationController(vsync: this, duration: const Duration(milliseconds: 420))
    ..addStatusListener((s) {
      if (s == AnimationStatus.completed) setState(() => _gone = true);
    });
  bool _gone = false;
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    // Owners who turned animations off get straight in.
    if (MediaQuery.maybeDisableAnimationsOf(context) ?? false) {
      _intro.value = 1;
    } else {
      _intro.forward();
    }
  }

  void _maybeLeave() {
    if (!_intro.isCompleted || _exit.isAnimating || _exit.isCompleted) return;
    if (ref.read(authControllerProvider) is AuthLoading) return;
    _exit.forward();
  }

  @override
  void dispose() {
    _intro.dispose();
    _exit.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authControllerProvider, (_, _) => _maybeLeave());
    if (_gone) return widget.child;
    return Stack(
      children: [
        widget.child,
        Positioned.fill(
          child: AnimatedBuilder(
            animation: _exit,
            builder: (context, child) => IgnorePointer(
              ignoring: _exit.value > 0.5,
              child: Opacity(
                opacity: 1 - Curves.easeIn.transform(_exit.value),
                child: Transform.scale(scale: 1 + 0.06 * Curves.easeIn.transform(_exit.value), child: child),
              ),
            ),
            child: SplashView(progress: _intro),
          ),
        ),
      ],
    );
  }
}
