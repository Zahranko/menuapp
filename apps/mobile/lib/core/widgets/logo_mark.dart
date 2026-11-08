import 'package:flutter/material.dart';

import '../theme.dart';
import 'ui.dart';

/// The logo mark's drawing, in the 100 x 100 box of brand/favicon.svg: a rounded square in the
/// primary color, a "k" in paper drawn with round strokes, and the accent dot at the top right.
/// The splash animates the same geometry, so both stay in step with the brand file.
abstract final class LogoMarkShape {
  static const box = 100.0;
  static const radius = 26.0;
  static const stroke = 11.0;
  static const dotCenter = Offset(74, 30);
  static const dotRadius = 9.0;

  /// The stem of the k, top to bottom.
  static const stemTop = Offset(38, 28);
  static const stemBottom = Offset(38, 72);

  /// The arm and leg of the k: from the top right, in to the stem, out to the bottom right.
  static const armTop = Offset(64, 28);
  static const armJoin = Offset(42, 50);
  static const legBottom = Offset(66, 72);

  static Path letter() => Path()
    ..moveTo(stemTop.dx, stemTop.dy)
    ..lineTo(stemBottom.dx, stemBottom.dy)
    ..moveTo(armTop.dx, armTop.dy)
    ..lineTo(armJoin.dx, armJoin.dy)
    ..lineTo(legBottom.dx, legBottom.dy);

  static Paint letterPaint(Color color) => Paint()
    ..color = color
    ..style = PaintingStyle.stroke
    ..strokeWidth = stroke
    ..strokeCap = StrokeCap.round
    ..strokeJoin = StrokeJoin.round;
}

/// The logo mark at any size. Brand marks never mirror, so it reads the same in right-to-left.
/// [onDark] adds a soft light edge so the primary-colored square still reads on a primary background.
class LogoMark extends StatelessWidget {
  const LogoMark({super.key, this.size = 32, this.onDark = false});

  final double size;
  final bool onDark;

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
        child: SizedBox.square(
          dimension: size,
          child: CustomPaint(
            painter: LogoMarkPainter(
              background: BrandColors.primary,
              letter: BrandColors.paper,
              dot: BrandColors.accent,
              edge: onDark ? BrandColors.paper.withValues(alpha: 0.16) : null,
            ),
          ),
        ),
      );
}

class LogoMarkPainter extends CustomPainter {
  const LogoMarkPainter({required this.background, required this.letter, required this.dot, this.edge});

  final Color background;
  final Color letter;
  final Color dot;

  /// A hairline around the square, for dark backgrounds.
  final Color? edge;

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.shortestSide / LogoMarkShape.box;
    canvas.scale(s);
    final square = RRect.fromRectAndRadius(
      const Rect.fromLTWH(0, 0, LogoMarkShape.box, LogoMarkShape.box),
      const Radius.circular(LogoMarkShape.radius),
    );
    canvas.drawRRect(square, Paint()..color = background);
    if (edge != null) {
      canvas.drawRRect(
        square.deflate(0.75 / s),
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5 / s
          ..color = edge!,
      );
    }
    canvas.drawPath(LogoMarkShape.letter(), LogoMarkShape.letterPaint(letter));
    canvas.drawCircle(LogoMarkShape.dotCenter, LogoMarkShape.dotRadius, Paint()..color = dot);
  }

  @override
  bool shouldRepaint(LogoMarkPainter old) =>
      old.background != background || old.letter != letter || old.dot != dot || old.edge != edge;
}

/// The mark followed by the [Wordmark], for headers that show the brand. The row follows the reading
/// direction, so in right-to-left the mark leads on the right.
class BrandLockup extends StatelessWidget {
  const BrandLockup({super.key, this.size = 22, this.onDark = false});

  /// The wordmark's font size; the mark is sized to sit with it.
  final double size;
  final bool onDark;

  @override
  Widget build(BuildContext context) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          LogoMark(size: size * 1.5, onDark: onDark),
          SizedBox(width: size * 0.45),
          Wordmark(size: size, onDark: onDark),
        ],
      );
}
