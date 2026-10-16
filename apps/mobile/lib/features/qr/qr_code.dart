import 'package:flutter/material.dart';
import 'package:qr/qr.dart';

import '../../core/api/models.dart';
import '../../core/theme.dart';
import '../plan/plan_models.dart';

/// The address the QR code opens: the owner's own domain once it is live, otherwise the site link from the API
/// (`{domain}/<slug>`, built from brand config on the server).
String qrUrlFor(Business business, DomainRequestInfo? request) =>
    request != null && request.status == 'active' && request.domain.trim().isNotEmpty ? 'https://${request.domain.trim()}' : business.siteUrl;

/// The QR code's modules for [data]. With a logo in the middle it uses the highest error correction (about 30% of the
/// code can be covered or damaged), otherwise quartile (25%), which still survives a scuffed print.
class QrMatrix {
  QrMatrix(this.data, {required this.withLogo})
      : errorCorrectLevel = withLogo ? QrErrorCorrectLevel.high : QrErrorCorrectLevel.quartile,
        _image = QrImage(QrCode(payload: QrPayload.fromString(data), errorCorrectLevel: withLogo ? QrErrorCorrectLevel.high : QrErrorCorrectLevel.quartile));

  final String data;
  final bool withLogo;
  final QrErrorCorrectLevel errorCorrectLevel;
  final QrImage _image;

  int get size => _image.moduleCount;

  bool isDark(int row, int col) => _image.isDark(row, col);

  /// Modules to leave white around the code, as scanners expect.
  static const quietZone = 4;

  /// How much of the code's width the middle logo may cover: about 5% of its area, far below what level H repairs.
  static const logoShare = 0.22;
}

/// Dark colors only, so the code keeps strong contrast on white and every phone can read it. The first is the brand's.
List<Color> qrColors() => [
      BrandColors.primary,
      const Color(0xFF111111),
      const Color(0xFF1B2A4A),
      const Color(0xFF1F4D3A),
      const Color(0xFF6B1E2E),
      const Color(0xFF4A3426),
      const Color(0xFF3D2B56),
    ];

/// Contrast of [color] against white (WCAG ratio, 1 to 21).
double contrastOnWhite(Color color) => 1.05 / (color.computeLuminance() + 0.05);

/// Draws a [QrMatrix] on white with its quiet zone, leaving the middle clear for a logo when it has one.
class QrPainter extends CustomPainter {
  QrPainter(this.matrix, {required this.color});

  final QrMatrix matrix;
  final Color color;

  /// The square in the middle kept clear for the logo, in [size] coordinates (null without a logo).
  static Rect? logoRect(QrMatrix matrix, Size size) {
    if (!matrix.withLogo) return null;
    final cells = matrix.size + 2 * QrMatrix.quietZone;
    final cell = size.shortestSide / cells;
    // Odd module count: center the hole on whole modules so no module is half covered.
    var n = (matrix.size * QrMatrix.logoShare).round();
    if (n.isEven) n += 1;
    final start = (matrix.size - n) ~/ 2 + QrMatrix.quietZone;
    return Rect.fromLTWH(start * cell, start * cell, n * cell, n * cell);
  }

  @override
  void paint(Canvas canvas, Size size) {
    final cells = matrix.size + 2 * QrMatrix.quietZone;
    final cell = size.shortestSide / cells;
    canvas.drawRect(Offset.zero & size, Paint()..color = Colors.white);
    final hole = logoRect(matrix, size);
    final paint = Paint()
      ..color = color
      ..isAntiAlias = false;
    final path = Path();
    for (var r = 0; r < matrix.size; r++) {
      for (var c = 0; c < matrix.size; c++) {
        if (!matrix.isDark(r, c)) continue;
        final rect = Rect.fromLTWH((c + QrMatrix.quietZone) * cell, (r + QrMatrix.quietZone) * cell, cell, cell);
        if (hole != null && hole.overlaps(rect.deflate(cell * 0.01))) continue;
        // Slightly larger squares hide the hairline gaps between neighbours when scaled.
        path.addRect(rect.inflate(0.25));
      }
    }
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(QrPainter old) => old.matrix.data != matrix.data || old.matrix.withLogo != matrix.withLogo || old.color != color;
}

/// The QR code at [size], with [logo] in the middle when [withLogo] is on.
class QrView extends StatelessWidget {
  const QrView({super.key, required this.data, required this.color, required this.size, this.withLogo = false, this.logo});

  final String data;
  final Color color;
  final double size;
  final bool withLogo;
  final Widget? logo;

  @override
  Widget build(BuildContext context) {
    final matrix = QrMatrix(data, withLogo: withLogo && logo != null);
    final hole = QrPainter.logoRect(matrix, Size.square(size));
    return Semantics(
      image: true,
      label: data,
      child: SizedBox.square(
        dimension: size,
        child: Stack(children: [
          Positioned.fill(child: CustomPaint(painter: QrPainter(matrix, color: color))),
          if (hole != null)
            Positioned.fromRect(
              rect: hole.deflate(hole.width * 0.06),
              child: ClipRRect(borderRadius: BorderRadius.circular(hole.width * 0.18), child: logo),
            ),
        ]),
      ),
    );
  }
}
