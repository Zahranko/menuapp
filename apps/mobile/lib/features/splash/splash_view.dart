import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/brand.dart';
import '../../core/theme.dart';
import '../../l10n/generated/app_localizations.dart';

/// The launch splash. One timeline drives every layer:
///
/// 1. A soft aurora of brand colors breathes in over the brand background (the native launch color).
/// 2. The brand's accent dot falls in, bounces with a squash, and sends out a ripple.
/// 3. The dot blooms on a spring into a paper card: a little storefront with a striped awning that
///    unfurls and menu rows that write themselves, then a light sweep glints across it.
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
    final rtl = Directionality.of(context) == TextDirection.rtl;

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
                      child: SizedBox.square(dimension: 168, child: CustomPaint(painter: _Mark(progress, rtl: rtl))),
                    ),
                    const SizedBox(height: 18),
                    RepaintBoundary(child: _Name(progress: progress, name: name)),
                    const SizedBox(height: 12),
                    _Rise(
                      progress: progress,
                      at: const _Span(1700, 600),
                      lift: 10,
                      child: Text(
                        t.splashTagline,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.66), fontSize: 15, height: 1.3, letterSpacing: 0.1),
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
    final style = Ui.display(_size, color: Colors.white).copyWith(letterSpacing: -1.4, height: 1.15);
    final split = _latin.hasMatch(name);
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
              padding: EdgeInsets.only(bottom: _size * 0.2, left: 3, right: 3),
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

/// The logo mark: the falling dot that blooms into a little storefront menu card.
class _Mark extends CustomPainter {
  _Mark(this.progress, {required this.rtl}) : super(repaint: progress);

  final Animation<double> progress;
  final bool rtl;

  static const _cardW = 100.0;
  static const _cardH = 116.0;
  static const _cardR = 26.0;
  static const _dot = 11.0;

  @override
  void paint(Canvas canvas, Size size) {
    final p = progress.value;
    final c = size.center(Offset.zero);
    final accent = BrandColors.accent;
    final paper = BrandColors.paper;

    // --- 1. The drop: falls, stretches, squashes on impact, a small second bounce.
    const drop = _Span(40, 620);
    final u = drop.of(p);
    double height; // 1 = start (high), 0 = on the ground
    var squash = 0.0;
    if (u < 0.56) {
      final f = u / 0.56;
      height = 1 - f * f;
      squash = -0.28 * f * f; // stretched while falling fast
    } else if (u < 0.86) {
      final b = (u - 0.56) / 0.30;
      height = 0.16 * 4 * b * (1 - b);
    } else {
      final b = (u - 0.86) / 0.14;
      height = 0.035 * 4 * b * (1 - b);
    }
    double pulse(double at, double width) => math.max(0, 1 - (u - at).abs() / width);
    squash += 0.42 * pulse(0.58, 0.09) + 0.16 * pulse(0.87, 0.06);

    // --- 2. The bloom: a little anticipation, then a jelly spring into the card.
    final antic = math.sin(math.pi * const _Span(600, 110).of(p));
    final bw = const _Span(650, 700).of(p, const _Spring(0.38));
    final bh = const _Span(690, 700).of(p, const _Spring(0.38));
    final tone = const _Span(660, 380).of(p, Curves.easeOutCubic);
    final float = -4 * const _Span(1500, 900).of(p, _easeInOut);

    // Ripples: one when the dot lands, one as the card opens.
    final impact = const _Span(380, 820).of(p);
    _ripple(canvas, c, 14 + 92 * Curves.easeOutCubic.transform(impact), impact, accent, 0.55);
    final open = const _Span(720, 900).of(p);
    _ripple(canvas, c, 50 + 100 * Curves.easeOutCubic.transform(open), open, Colors.white, 0.18);

    // A warm glow behind the mark.
    final glow = const _Span(420, 900).of(p, Curves.easeOut);
    if (glow > 0) {
      canvas.drawCircle(
        c,
        110,
        Paint()
          ..shader = RadialGradient(
            colors: [accent.withValues(alpha: 0.22 * glow), accent.withValues(alpha: 0.06 * glow), accent.withValues(alpha: 0)],
            stops: const [0, 0.5, 1],
          ).createShader(Rect.fromCircle(center: c, radius: 110)),
      );
    }

    if (bw <= 0) {
      // Still the dot.
      if (u <= 0) return;
      final center = c + Offset(0, -150 * height + float);
      final r = _dot * (1 - 0.14 * antic);
      final rect = Rect.fromCenter(center: center + Offset(0, r * squash * 0.5), width: 2 * r * (1 + squash), height: 2 * r * (1 - squash));
      canvas.drawOval(rect.inflate(6), Paint()..color = accent.withValues(alpha: 0.25 * math.min(1, u * 4)) ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8));
      canvas.drawOval(rect, Paint()..color = accent.withValues(alpha: math.min(1, u * 5)));
      return;
    }

    final w = ui.lerpDouble(_dot * 2, _cardW, bw)!;
    final h = ui.lerpDouble(_dot * 2, _cardH, bh)!;
    final r = math.min(ui.lerpDouble(_dot, _cardR, bw.clamp(0.0, 1.0))!, math.min(w, h) / 2);
    final card = Rect.fromCenter(center: c + Offset(0, float), width: math.max(0, w), height: math.max(0, h));
    final rrect = RRect.fromRectAndRadius(card, Radius.circular(r));

    // Soft shadow under the card.
    final lift = bw.clamp(0.0, 1.0);
    canvas.drawRRect(
      rrect.shift(Offset(0, 16 * lift)).deflate(6),
      Paint()
        ..color = Colors.black.withValues(alpha: 0.42 * lift)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 18),
    );
    canvas.drawRRect(rrect, Paint()..color = Color.lerp(accent, paper, tone)!);
    if (tone > 0) {
      // A soft top light and a crisp inner edge make the card feel like a real object.
      canvas.drawRRect(
        rrect,
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.white.withValues(alpha: 0.35 * tone), Colors.white.withValues(alpha: 0), BrandColors.ink.withValues(alpha: 0.05 * tone)],
            stops: const [0, 0.55, 1],
          ).createShader(card),
      );
    }

    canvas.save();
    canvas.clipRRect(rrect);
    canvas.translate(card.left, card.top);
    if (rtl) {
      canvas.translate(card.width, 0);
      canvas.scale(-1, 1);
    }
    _storefront(canvas, card.size, p);
    canvas.restore();
    if (tone > 0) {
      canvas.drawRRect(
        rrect.deflate(0.5),
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1
          ..color = Colors.white.withValues(alpha: 0.45 * tone),
      );
    }

    // --- 3. A light sweep across the card.
    final sweep = const _Span(1420, 620).of(p, _easeInOut);
    if (sweep > 0 && sweep < 1) {
      canvas.save();
      canvas.clipRRect(rrect);
      final x = card.left - 70 + (card.width + 140) * sweep;
      final band = Rect.fromLTWH(x - 40, card.top - 20, 80, card.height + 40);
      canvas.translate(band.center.dx, band.center.dy);
      canvas.rotate(0.35);
      canvas.translate(-band.center.dx, -band.center.dy);
      canvas.drawRect(
        band,
        Paint()
          ..shader = LinearGradient(colors: [
            Colors.white.withValues(alpha: 0),
            Colors.white.withValues(alpha: 0.65),
            Colors.white.withValues(alpha: 0),
          ]).createShader(band),
      );
      canvas.restore();
    }

    // --- 4. Two small sparkles as it settles.
    final sx = rtl ? -1.0 : 1.0;
    _sparkle(canvas, card.center + Offset(sx * (card.width / 2 + 4), -card.height / 2 - 2), 10, const _Span(1620, 520).of(p, const _Spring(0.5)), Colors.white);
    _sparkle(canvas, card.center + Offset(-sx * (card.width / 2 + 12), card.height / 2 - 18), 6, const _Span(1760, 520).of(p, const _Spring(0.5)), accent);
  }

  /// The awning and menu rows inside the card, drawn in card coordinates (mirrored for right-to-left).
  void _storefront(Canvas canvas, Size card, double p) {
    final w = card.width;
    final scale = w / _cardW;
    canvas.scale(scale, card.height / _cardH);

    // Awning: stripes unfurl down from the top, with a scalloped edge.
    final unfurl = const _Span(880, 620).of(p, const _Spring(0.3));
    if (unfurl > 0) {
      const stripes = 5;
      const sw = _cardW / stripes;
      final depth = 30 * unfurl;
      for (var i = 0; i < stripes; i++) {
        final color = i.isEven ? BrandColors.highlight : BrandColors.accent;
        final paint = Paint()..color = color;
        final x = i * sw;
        canvas.drawRect(Rect.fromLTWH(x, 0, sw + 0.5, depth), paint);
        canvas.drawArc(Rect.fromLTWH(x, depth - sw / 2, sw, sw), 0, math.pi, true, paint);
      }
      // A soft shade under the scallops.
      canvas.drawRect(
        Rect.fromLTWH(0, depth + sw / 2 - 1, _cardW, 6),
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [BrandColors.ink.withValues(alpha: 0.10 * unfurl), BrandColors.ink.withValues(alpha: 0)],
          ).createShader(Rect.fromLTWH(0, depth + sw / 2 - 1, _cardW, 6)),
      );
    }

    // Menu rows write themselves one after another: a bullet, a name, a price.
    final ink = BrandColors.ink;
    const rows = [(y: 62.0, len: 36.0), (y: 78.0, len: 28.0), (y: 94.0, len: 40.0)];
    for (var i = 0; i < rows.length; i++) {
      final row = rows[i];
      final v = _Span(1080 + i * 95, 460).of(p, _easeOut);
      if (v <= 0) continue;
      final bullet = _Span(1080 + i * 95, 360).of(p, const _Spring(0.5));
      canvas.drawCircle(Offset(16, row.y), 3.2 * bullet.clamp(0.0, 1.4), Paint()..color = BrandColors.primary);
      canvas.drawRRect(
        RRect.fromRectAndRadius(Rect.fromLTWH(25, row.y - 2.5, row.len * v, 5), const Radius.circular(3)),
        Paint()..color = ink.withValues(alpha: 0.20),
      );
      final price = _Span(1200 + i * 95, 380).of(p, _easeOut);
      if (price > 0) {
        canvas.drawRRect(
          RRect.fromRectAndRadius(Rect.fromLTWH(_cardW - 14 - 12 * price, row.y - 2.5, 12 * price, 5), const Radius.circular(3)),
          Paint()..color = BrandColors.primary2.withValues(alpha: 0.75 * price),
        );
      }
    }
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
  bool shouldRepaint(_Mark old) => old.progress != progress || old.rtl != rtl;
}
