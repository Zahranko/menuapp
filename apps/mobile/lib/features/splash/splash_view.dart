import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/brand.dart';
import '../../core/theme.dart';
import '../../core/widgets/logo_mark.dart';
import '../../l10n/generated/app_localizations.dart';

/// The launch splash. One timeline drives every layer:
///
/// 1. A soft aurora of brand colors breathes in over the brand background (the native launch color).
/// 2. The brand's accent dot falls in, bounces with a squash, and sends out a ripple.
/// 3. The dot springs open into the logo mark's rounded square (a soft paper edge and halo keep it
///    readable on the same green), the k draws itself stroke by stroke, and a fresh accent dot drops
///    into its top-right spot as the final beat, followed by a soft light sweep.
/// 4. The name rises in letter by letter out of a soft blur (Arabic and other joined scripts are
///    wiped in as one word so their letters stay connected), and the accent dot pops in last.
/// 5. The tagline and the domain settle in underneath.
///
/// At progress 1 every layer is at rest, so owners with animations turned off see the final frame.
class SplashView extends StatelessWidget {
  const SplashView({super.key, required this.progress});

  static const duration = Duration(milliseconds: 2400);

  final Animation<double> progress;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final arabic = Localizations.localeOf(context).languageCode == 'ar' && Brand.brandNameAr.isNotEmpty;
    final name = arabic ? Brand.brandNameAr : Brand.brandName;
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Material(
        // The same color as the native launch screen, so there is no flash on the first frame.
        color: BrandColors.primary,
        child: Stack(
          fit: StackFit.expand,
          children: [
            RepaintBoundary(child: CustomPaint(painter: _Aurora(progress))),
            Center(
              child: Transform.translate(
                offset: const Offset(0, -18),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    RepaintBoundary(
                      child: SizedBox.square(dimension: 168, child: CustomPaint(painter: _Mark(progress))),
                    ),
                    // Arabic lines are taller (room for the dots and hamza), so the gaps shrink to keep the same rhythm.
                    SizedBox(height: arabic ? 10 : 18),
                    RepaintBoundary(child: _Name(progress: progress, name: name)),
                    SizedBox(height: arabic ? 4 : 12),
                    _Rise(
                      progress: progress,
                      at: const _Span(1700, 600),
                      lift: 10,
                      child: Text(
                        t.splashTagline,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.66), fontSize: 15, height: arabic ? 1.6 : 1.3, letterSpacing: 0.1)
                            .tracked(context),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 44 + MediaQuery.paddingOf(context).bottom * 0.5,
              child: _Rise(
                progress: progress,
                at: const _Span(1950, 450),
                lift: 6,
                child: Text(
                  Brand.domain,
                  textAlign: TextAlign.center,
                  textDirection: TextDirection.ltr,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.38), fontSize: 12, letterSpacing: 1.2),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A slice of the timeline, in milliseconds from the start of the splash.
class _Span {
  const _Span(this.start, this.length);

  final int start;
  final int length;

  /// Where [progress] (0 to 1 over the whole splash) is inside this slice, 0 to 1, shaped by [curve].
  double of(double progress, [Curve curve = Curves.linear]) {
    final ms = progress * SplashView.duration.inMilliseconds;
    final local = ((ms - start) / length).clamp(0.0, 1.0);
    return curve.transform(local);
  }
}

/// A damped spring from 0 to 1 that overshoots and settles by the end. [bounce] 0 is critically
/// damped, higher values wobble more.
class _Spring extends Curve {
  const _Spring([this.bounce = 0.35]);

  final double bounce;

  @override
  double transformInternal(double t) {
    final zeta = 1 - bounce.clamp(0.0, 0.95);
    const settle = 6.2; // zeta * omega: how fast the wobble dies out over the curve.
    final omega = settle / zeta;
    if (zeta >= 1) return 1 - math.exp(-omega * t) * (1 + omega * t);
    final damped = omega * math.sqrt(1 - zeta * zeta);
    return 1 - math.exp(-zeta * omega * t) * (math.cos(damped * t) + zeta * omega / damped * math.sin(damped * t));
  }
}

const _easeOut = Cubic(0.16, 1, 0.3, 1); // easeOutExpo-like
const _easeInOut = Cubic(0.65, 0, 0.35, 1);

/// Fades a child in while it rises and sharpens out of a slight blur.
class _Rise extends StatelessWidget {
  const _Rise({required this.progress, required this.at, required this.child, this.lift = 12});

  final Animation<double> progress;
  final _Span at;
  final double lift;
  final Widget child;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: progress,
        child: child,
        builder: (context, child) {
          final v = at.of(progress.value, _easeOut);
          if (v <= 0) return Opacity(opacity: 0, child: child);
          return Opacity(
            opacity: v,
            child: Transform.translate(offset: Offset(0, lift * (1 - v)), child: child),
          );
        },
      );
}

/// The brand name: letter by letter for Latin names, one soft wipe for joined scripts like Arabic.
class _Name extends StatelessWidget {
  const _Name({required this.progress, required this.name});

  final Animation<double> progress;
  final String name;

  static const _size = 46.0;
  static final _latin = RegExp(r'^[ -ɏ]+$');

  @override
  Widget build(BuildContext context) {
    final split = _latin.hasMatch(name);
    // Joined scripts are never letter-spaced, and get the font's full line height so the wipe and blur
    // layers, which are only as big as the text box, never cut off dots, hamza or descenders.
    final style = Ui.display(context, _size, color: Colors.white).copyWith(letterSpacing: split ? -1.4 : 0, height: split ? 1.15 : 1.5);
    final letters = split ? name.characters.toList() : [name];
    final stagger = split ? math.min(60, 420 ~/ math.max(1, letters.length)) : 0;
    final textStart = 1100;
    final dotAt = _Span(textStart + stagger * letters.length + (split ? 300 : 520), 620);
    final rtl = Directionality.of(context) == TextDirection.rtl;

    return AnimatedBuilder(
      animation: progress,
      builder: (context, _) {
        final p = progress.value;
        Widget letter(int i) {
          final span = _Span(textStart + i * stagger, split ? 640 : 820);
          final fade = span.of(p, _easeOut);
          final move = span.of(p, const _Spring(0.22));
          final blur = 7 * (1 - span.of(p, Curves.easeOutCubic));
          Widget text = Text(letters[i], style: style);
          if (!split) {
            // One wipe in reading direction with a soft edge, so joined letters stay whole.
            final w = span.of(p, _easeInOut);
            text = ShaderMask(
              blendMode: BlendMode.dstIn,
              shaderCallback: (rect) => LinearGradient(
                begin: rtl ? Alignment.centerRight : Alignment.centerLeft,
                end: rtl ? Alignment.centerLeft : Alignment.centerRight,
                colors: const [Colors.white, Colors.white, Color(0x00FFFFFF)],
                stops: [0, (w * 1.35 - 0.35).clamp(0.0, 1.0), (w * 1.35).clamp(0.0, 1.0) + 0.0001],
              ).createShader(rect),
              child: text,
            );
          }
          if (blur > 0.15) text = ImageFiltered(imageFilter: ui.ImageFilter.blur(sigmaX: blur, sigmaY: blur), child: text);
          return Opacity(
            opacity: fade,
            child: Transform.translate(offset: Offset(0, _size * 0.42 * (1 - move)), child: text),
          );
        }

        final pop = dotAt.of(p, const _Spring(0.5));
        final dot = _size * 0.24;
        return Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            for (var i = 0; i < letters.length; i++) letter(i),
            Padding(
              // The dot sits on the baseline like a full stop; the taller joined-script box puts the baseline higher.
              padding: EdgeInsets.only(bottom: _size * (split ? 0.2 : 0.3), left: split ? 3 : 1, right: split ? 3 : 1),
              child: Transform.translate(
                offset: Offset(0, -_size * 0.5 * (1 - dotAt.of(p, _easeOut))),
                child: Transform.scale(
                  scale: pop.clamp(0.0, 2.0),
                  child: Container(
                    width: dot,
                    height: dot,
                    decoration: BoxDecoration(
                      color: BrandColors.accent,
                      shape: BoxShape.circle,
                      boxShadow: [BoxShadow(color: BrandColors.accent.withValues(alpha: 0.55 * dotAt.of(p)), blurRadius: 14)],
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

/// The background: the brand color with slow, soft pools of light in the brand palette.
class _Aurora extends CustomPainter {
  _Aurora(this.progress) : super(repaint: progress);

  final Animation<double> progress;

  @override
  void paint(Canvas canvas, Size size) {
    final p = progress.value;
    final rect = Offset.zero & size;
    final w = size.width;
    final h = size.height;
    final appear = const _Span(0, 1100).of(p, Curves.easeOutCubic);
    if (appear <= 0) return;
    // A slow drift: the pools glide a little while the splash plays.
    final drift = const _Span(0, 2400).of(p, _easeInOut);

    void pool(Offset center, double radius, Color color, double alpha) {
      final paint = Paint()
        ..shader = RadialGradient(
          colors: [color.withValues(alpha: alpha * appear), color.withValues(alpha: alpha * appear * 0.4), color.withValues(alpha: 0)],
          stops: const [0, 0.45, 1],
        ).createShader(Rect.fromCircle(center: center, radius: radius));
      canvas.drawRect(rect, paint);
    }

    final deep = Color.lerp(BrandColors.primary2, Colors.white, 0.06)!;
    pool(Offset(w * (0.05 + 0.1 * drift), h * (0.12 + 0.05 * drift)), w * 1.05, deep, 0.95);
    pool(Offset(w * (1.05 - 0.12 * drift), h * (0.9 - 0.08 * drift)), w * 0.9, BrandColors.accent, 0.10);
    pool(Offset(w * (-0.1 + 0.12 * drift), h * (0.74 - 0.04 * drift)), w * 0.65, BrandColors.highlight, 0.08);
    pool(Offset(w * 0.5, h * 0.42), w * 0.6, deep, 0.6 * const _Span(400, 1200).of(p, Curves.easeOut));

    // A gentle vignette keeps the eye in the middle.
    canvas.drawRect(
      rect,
      Paint()
        ..shader = RadialGradient(
          radius: 0.9,
          colors: [Colors.transparent, Colors.black.withValues(alpha: 0.32 * appear)],
          stops: const [0.55, 1],
        ).createShader(Rect.fromCenter(center: rect.center, width: math.max(w, h), height: math.max(w, h))),
    );
  }

  @override
  bool shouldRepaint(_Aurora old) => old.progress != progress;
}

/// The logo mark: the falling dot springs open into the brand's rounded square, the k draws itself
/// stroke by stroke, and a fresh dot drops into its top-right spot as the final beat. Brand marks never
/// mirror, so this reads the same in right-to-left.
class _Mark extends CustomPainter {
  _Mark(this.progress) : super(repaint: progress);

  final Animation<double> progress;

  static const _side = 112.0; // the mark's size at rest, inside the 168 canvas
  static const _dot = 11.0;

  @override
  void paint(Canvas canvas, Size size) {
    final p = progress.value;
    final c = size.center(Offset.zero);
    final accent = BrandColors.accent;
    final paper = BrandColors.paper;
    final primary = BrandColors.primary;

    // --- 1. The drop: falls, stretches, squashes on impact, a small second bounce.
    const drop = _Span(40, 620);
    final u = drop.of(p);
    final (height, squash) = _bounce(u, firstHit: 0.56);

    // --- 2. The bloom: a little anticipation, then a jelly spring open into the rounded square.
    final antic = math.sin(math.pi * const _Span(600, 110).of(p));
    final bw = const _Span(650, 700).of(p, const _Spring(0.38));
    final bh = const _Span(690, 700).of(p, const _Spring(0.38));
    final tone = const _Span(660, 340).of(p, Curves.easeOutCubic);
    final float = -4 * const _Span(1500, 900).of(p, _easeInOut);

    // Ripples: one when the dot lands, one as the square opens.
    final impact = const _Span(380, 820).of(p);
    _ripple(canvas, c, 14 + 92 * Curves.easeOutCubic.transform(impact), impact, accent, 0.55);
    final open = const _Span(720, 900).of(p);
    _ripple(canvas, c, 58 + 96 * Curves.easeOutCubic.transform(open), open, Colors.white, 0.18);

    // A warm glow behind the mark.
    final glow = const _Span(420, 900).of(p, Curves.easeOut);
    if (glow > 0) {
      canvas.drawCircle(
        c,
        118,
        Paint()
          ..shader = RadialGradient(
            colors: [accent.withValues(alpha: 0.20 * glow), accent.withValues(alpha: 0.05 * glow), accent.withValues(alpha: 0)],
            stops: const [0, 0.5, 1],
          ).createShader(Rect.fromCircle(center: c, radius: 118)),
      );
    }

    if (bw <= 0) {
      // Still the dot.
      if (u <= 0) return;
      final center = c + Offset(0, -150 * height + float);
      _drawDot(canvas, center, _dot * (1 - 0.14 * antic), squash, math.min(1, u * 5), accent);
      return;
    }

    final w = ui.lerpDouble(_dot * 2, _side, bw)!;
    final h = ui.lerpDouble(_dot * 2, _side, bh)!;
    final rest = _side * LogoMarkShape.radius / LogoMarkShape.box;
    final r = math.min(ui.lerpDouble(_dot, rest, bw.clamp(0.0, 1.0))!, math.min(w, h) / 2);
    final box = Rect.fromCenter(center: c + Offset(0, float), width: math.max(0, w), height: math.max(0, h));
    final rrect = RRect.fromRectAndRadius(box, Radius.circular(r));
    final lift = bw.clamp(0.0, 1.0);

    // A soft halo in paper so the dark square lifts off the dark background, and a shadow under it.
    canvas.drawRRect(
      rrect.inflate(4),
      Paint()
        ..color = paper.withValues(alpha: 0.10 * lift)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 16),
    );
    canvas.drawRRect(
      rrect.shift(Offset(0, 16 * lift)).deflate(6),
      Paint()
        ..color = Colors.black.withValues(alpha: 0.45 * lift)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 18),
    );

    // The square: the accent dot's color gives way to the brand color as it opens.
    canvas.drawRRect(rrect, Paint()..color = Color.lerp(accent, primary, tone)!);
    if (tone > 0) {
      // A gentle top light and a fine paper edge, so the square reads as an object on the same green.
      canvas.drawRRect(
        rrect,
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.white.withValues(alpha: 0.09 * tone), Colors.white.withValues(alpha: 0), Colors.black.withValues(alpha: 0.10 * tone)],
            stops: const [0, 0.5, 1],
          ).createShader(box),
      );
      canvas.drawRRect(
        rrect.deflate(0.6),
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.2
          ..shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [paper.withValues(alpha: 0.42 * tone), paper.withValues(alpha: 0.14 * tone)],
          ).createShader(box),
      );
    }

    // --- 3. The k draws itself in the square's own coordinates (it springs with the square).
    canvas.save();
    canvas.translate(box.left, box.top);
    canvas.scale(box.width / LogoMarkShape.box, box.height / LogoMarkShape.box);
    final ink = LogoMarkShape.letterPaint(paper);
    _stroke(canvas, [LogoMarkShape.stemTop, LogoMarkShape.stemBottom], const _Span(880, 380).of(p, _easeInOut), ink);
    _stroke(canvas, [LogoMarkShape.armTop, LogoMarkShape.armJoin, LogoMarkShape.legBottom], const _Span(1120, 520).of(p, _easeInOut), ink);
    canvas.restore();

    // --- 4. The final beat: a fresh accent dot drops into the top-right spot, squashes and settles.
    final at = Offset(box.left + box.width * LogoMarkShape.dotCenter.dx / LogoMarkShape.box, box.top + box.height * LogoMarkShape.dotCenter.dy / LogoMarkShape.box);
    final dotR = _side * LogoMarkShape.dotRadius / LogoMarkShape.box;
    final land = const _Span(1500, 560).of(p);
    if (land > 0) {
      final (lh, ls) = _bounce(land, firstHit: 0.5);
      final pop = const _Span(1500, 160).of(p, Curves.easeOut);
      _drawDot(canvas, at + Offset(0, -64 * lh), dotR * (0.6 + 0.4 * pop), ls, pop, accent);
    }
    final hit = const _Span(1780, 560).of(p);
    _ripple(canvas, at, dotR + 26 * Curves.easeOutCubic.transform(hit), hit, accent, 0.6);

    // --- 5. A soft light sweep across the finished mark.
    final sweep = const _Span(1860, 480).of(p, _easeInOut);
    if (sweep > 0 && sweep < 1) {
      canvas.save();
      canvas.clipRRect(rrect);
      final x = box.left - 70 + (box.width + 140) * sweep;
      final band = Rect.fromLTWH(x - 36, box.top - 20, 72, box.height + 40);
      canvas.translate(band.center.dx, band.center.dy);
      canvas.rotate(0.35);
      canvas.translate(-band.center.dx, -band.center.dy);
      canvas.drawRect(
        band,
        Paint()
          ..blendMode = BlendMode.plus
          ..shader = LinearGradient(colors: [
            Colors.white.withValues(alpha: 0),
            Colors.white.withValues(alpha: 0.16),
            Colors.white.withValues(alpha: 0),
          ]).createShader(band),
      );
      canvas.restore();
    }

    // --- 6. Two small sparkles as it settles.
    _sparkle(canvas, box.center + Offset(box.width / 2 + 8, -box.height / 2 + 2), 9, const _Span(1820, 440).of(p, const _Spring(0.5)), Colors.white);
    _sparkle(canvas, box.center + Offset(-box.width / 2 - 12, box.height / 2 - 16), 6, const _Span(1940, 440).of(p, const _Spring(0.5)), accent);
  }

  /// A drop with a bounce, over [u] from 0 to 1: the height (1 high, 0 resting) and a squash amount
  /// (negative stretches while falling fast, positive flattens on impact).
  static (double, double) _bounce(double u, {required double firstHit}) {
    final second = firstHit + (1 - firstHit) * 0.68;
    double height;
    var squash = 0.0;
    if (u < firstHit) {
      final f = u / firstHit;
      height = 1 - f * f;
      squash = -0.28 * f * f;
    } else if (u < second) {
      final b = (u - firstHit) / (second - firstHit);
      height = 0.16 * 4 * b * (1 - b);
    } else {
      final b = (u - second) / (1 - second);
      height = 0.035 * 4 * b * (1 - b);
    }
    double pulse(double at, double width) => math.max(0, 1 - (u - at).abs() / width);
    squash += 0.42 * pulse(firstHit + 0.02, 0.09) + 0.16 * pulse(second + 0.01, 0.06);
    return (height, squash);
  }

  static void _drawDot(Canvas canvas, Offset center, double r, double squash, double alpha, Color color) {
    final rect = Rect.fromCenter(center: center + Offset(0, r * squash * 0.5), width: 2 * r * (1 + squash), height: 2 * r * (1 - squash));
    canvas.drawOval(
      rect.inflate(r * 0.55),
      Paint()
        ..color = color.withValues(alpha: 0.25 * alpha)
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, r * 0.7),
    );
    canvas.drawOval(rect, Paint()..color = color.withValues(alpha: alpha));
  }

  /// Draws the first [t] of the polyline through [points], like a pen moving along it.
  static void _stroke(Canvas canvas, List<Offset> points, double t, Paint paint) {
    if (t <= 0) return;
    final path = Path()..moveTo(points.first.dx, points.first.dy);
    for (final point in points.skip(1)) {
      path.lineTo(point.dx, point.dy);
    }
    if (t >= 1) {
      canvas.drawPath(path, paint);
      return;
    }
    final metric = path.computeMetrics().first;
    canvas.drawPath(metric.extractPath(0, math.max(0.01, metric.length * t)), paint);
  }

  void _ripple(Canvas canvas, Offset c, double radius, double t, Color color, double alpha) {
    if (t <= 0 || t >= 1) return;
    canvas.drawCircle(
      c,
      radius,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.6 * (1 - t) + 0.4
        ..color = color.withValues(alpha: alpha * (1 - t) * (1 - t)),
    );
  }

  /// A four-pointed twinkle that springs open, turns a little, and fades back to a soft glint.
  void _sparkle(Canvas canvas, Offset at, double size, double t, Color color) {
    if (t <= 0) return;
    final s = size * t.clamp(0.0, 1.5);
    canvas.save();
    canvas.translate(at.dx, at.dy);
    canvas.rotate(0.6 * (1 - t));
    final path = Path()
      ..moveTo(0, -s)
      ..quadraticBezierTo(0, 0, s, 0)
      ..quadraticBezierTo(0, 0, 0, s)
      ..quadraticBezierTo(0, 0, -s, 0)
      ..quadraticBezierTo(0, 0, 0, -s)
      ..close();
    canvas.drawPath(path, Paint()..color = color.withValues(alpha: math.min(1, t)));
    canvas.restore();
  }

  @override
  bool shouldRepaint(_Mark old) => old.progress != progress;
}
