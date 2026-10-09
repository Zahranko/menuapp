import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/brand.dart';
import '../../core/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_controller.dart';

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

/// The splash itself, after the prototype: a plate draws itself, three menu cards fan out of it,
/// the name rises letter by letter, then the tagline and a loading bar.
class SplashView extends StatelessWidget {
  const SplashView({super.key, required this.progress});

  static const duration = Duration(milliseconds: 2700);

  final Animation<double> progress;

  /// A step of the timeline, from [startMs] for [ms] milliseconds.
  Animation<double> _at(int startMs, int ms, [Curve curve = Curves.linear]) {
    final total = duration.inMilliseconds;
    return CurvedAnimation(
      parent: progress,
      curve: Interval(startMs / total, math.min(1, (startMs + ms) / total), curve: curve),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final arabic = Localizations.localeOf(context).languageCode == 'ar' && Brand.brandNameAr.isNotEmpty;
    const spring = Cubic(0.2, 1.3, 0.4, 1);
    const rise = Cubic(0.2, 0.9, 0.3, 1.15);
    final cloth = _at(100, 1100);
    final rim = _at(150, 850, const Cubic(0.6, 0, 0.3, 1));
    final inner = _at(420, 750, Curves.easeOut);
    final cards = [for (var i = 0; i < 3; i++) _at(900 + i * 90, 600, spring)];
    final name = arabic ? Brand.brandNameAr : Brand.brandName;
    // Arabic letters join, so the Arabic name rises as one word.
    final pieces = arabic ? [name] : name.split('');
    final letters = [for (var i = 0; i <= pieces.length; i++) _at(1250 + i * 60, 480, rise)];
    final second = _at(1850, 450);
    final tagline = _at(1950, 500, Curves.easeOut);
    final loader = _at(2050, 200);
    final fill = _at(2150, 550, Curves.easeInOut);
    final foot = _at(2150, 450);
    final soft = Colors.white.withValues(alpha: 0.7);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Material(
        color: BrandColors.primary,
        child: AnimatedBuilder(
          animation: progress,
          builder: (context, _) => Stack(
            alignment: Alignment.center,
            children: [
              Positioned.fill(
                child: Opacity(
                  opacity: cloth.value,
                  child: const CustomPaint(painter: _Cloth()),
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 220,
                    height: 200,
                    child: Stack(
                      alignment: Alignment.center,
                      clipBehavior: Clip.none,
                      children: [
                        CustomPaint(
                          size: const Size(150, 150),
                          painter: _Plate(rim: rim.value, inner: inner.value),
                        ),
                        // Left and right first, the middle card lands on top.
                        _MenuCard(progress: cards[0].value, shift: const Offset(-62, 6), turns: -14, head: BrandColors.accent),
                        _MenuCard(progress: cards[2].value, shift: const Offset(62, 6), turns: 14, head: Color.lerp(BrandColors.primary2, Colors.white, 0.1)!),
                        _MenuCard(progress: cards[1].value, shift: const Offset(0, -6), turns: 0, head: BrandColors.highlight),
                      ],
                    ),
                  ),
                  const SizedBox(height: 26),
                  ClipRect(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        for (var i = 0; i < pieces.length; i++)
                          FractionalTranslation(
                            translation: Offset(0, 1.05 * (1 - letters[i].value)),
                            child: Text(pieces[i], style: Ui.display(46, color: Colors.white).copyWith(letterSpacing: -1.5, height: 1.2)),
                          ),
                        FractionalTranslation(
                          translation: Offset(0, 1.05 * (1 - letters.last.value)),
                          child: Text('.', style: Ui.display(46, color: BrandColors.accent).copyWith(height: 1.2)),
                        ),
                      ],
                    ),
                  ),
                  Opacity(
                    opacity: second.value,
                    child: Text(
                      arabic ? Brand.brandName : Brand.brandNameAr,
                      style: TextStyle(color: Color.lerp(BrandColors.accent, Colors.white, 0.3), fontSize: 17, fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Opacity(
                    opacity: tagline.value,
                    child: Transform.translate(
                      offset: Offset(0, 6 * (1 - tagline.value)),
                      child: Text(t.splashTagline, style: TextStyle(color: soft, fontSize: 14.5)),
                    ),
                  ),
                ],
              ),
              Positioned(
                bottom: 96,
                child: Opacity(
                  opacity: loader.value,
                  child: Container(
                    width: 110,
                    height: 3,
                    alignment: AlignmentDirectional.centerStart,
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(3)),
                    child: FractionallySizedBox(
                      widthFactor: fill.value,
                      child: Container(
                        decoration: BoxDecoration(color: BrandColors.accent, borderRadius: BorderRadius.circular(3)),
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: 48,
                child: Opacity(
                  opacity: foot.value,
                  child: Text(Brand.domain, style: TextStyle(color: Colors.white.withValues(alpha: 0.45), fontSize: 12, letterSpacing: 0.4)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A small menu card that pops out of the plate to its place in the fan.
class _MenuCard extends StatelessWidget {
  const _MenuCard({required this.progress, required this.shift, required this.turns, required this.head});

  final double progress;
  final Offset shift;
  final double turns;
  final Color head;

  @override
  Widget build(BuildContext context) {
    final p = progress;
    if (p <= 0) return const SizedBox.shrink();
    final line = BrandColors.ink.withValues(alpha: 0.13);
    Widget bar({double? width, double height = 5, Color? color, double radius = 3}) => Container(
      width: width,
      height: height,
      decoration: BoxDecoration(color: color ?? line, borderRadius: BorderRadius.circular(radius)),
    );
    return Opacity(
      opacity: p.clamp(0, 1),
      child: Transform.translate(
        offset: shift * p,
        child: Transform.rotate(
          angle: turns * math.pi / 180 * p,
          child: Transform.scale(
            scale: 0.4 + 0.6 * p,
            child: Container(
              width: 64,
              height: 88,
              padding: const EdgeInsets.fromLTRB(8, 9, 8, 9),
              decoration: BoxDecoration(
                color: BrandColors.paper,
                borderRadius: BorderRadius.circular(10),
                boxShadow: const [BoxShadow(color: Color(0x88000000), blurRadius: 24, offset: Offset(0, 12), spreadRadius: -8)],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  bar(height: 22, color: head, radius: 5),
                  const SizedBox(height: 5),
                  bar(),
                  const SizedBox(height: 5),
                  bar(width: 28),
                  const SizedBox(height: 5),
                  bar(),
                  const SizedBox(height: 5),
                  bar(width: 28),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The plate: an accent rim and a faint inner ring, each drawn from the top.
class _Plate extends CustomPainter {
  const _Plate({required this.rim, required this.inner});

  final double rim;
  final double inner;

  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    void ring(double radius, double t, Color color, double width) {
      if (t <= 0) return;
      final paint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeWidth = width
        ..color = color;
      canvas.drawArc(Rect.fromCircle(center: c, radius: radius), -math.pi / 2, 2 * math.pi * t, false, paint);
    }

    ring(70, rim, BrandColors.accent, 3);
    ring(48, inner, Colors.white.withValues(alpha: 0.19), 1.5);
  }

  @override
  bool shouldRepaint(_Plate old) => old.rim != rim || old.inner != inner;
}

/// A faint tablecloth grid behind everything.
class _Cloth extends CustomPainter {
  const _Cloth();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.03)
      ..strokeWidth = 1;
    for (var x = 0.0; x < size.width; x += 32) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (var y = 0.0; y < size.height; y += 32) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(_Cloth old) => false;
}
