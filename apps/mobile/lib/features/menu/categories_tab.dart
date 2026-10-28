import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import 'catalog_controller.dart';
import 'category_sheet.dart';
import 'dashboard_screen.dart';
import 'menu_models.dart';

/// Categories in the order customers see them, with product counts and up and down arrows.
class CategoriesTab extends ConsumerWidget {
  const CategoriesTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    return ref
        .watch(catalogProvider)
        .when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => LoadError(error: e, onRetry: () => ref.invalidate(catalogProvider)),
          data: (c) => _list(context, ref, t, c),
        );
  }

  Widget _list(BuildContext context, WidgetRef ref, AppLocalizations t, Catalog c) {
    final mains = c.categories.mains;
    final subs = {for (final m in mains) m.id: c.categories.childrenOf(m.id)};
    return RefreshIndicator(
      onRefresh: () => ref.read(catalogProvider.notifier).refresh(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(Ui.gutter, 4, Ui.gutter, 110),
        children: [
          if (c.categories.isEmpty)
            EmptyNote(title: t.noCategoriesTitle, body: t.noCategoriesBody)
          else ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 4, 4, 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.swap_vert_rounded, size: 18, color: BrandColors.muted),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(t.categoriesHint, style: TextStyle(color: BrandColors.muted, height: 1.45, fontSize: 13.5)),
                  ),
                ],
              ),
            ),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  for (final (i, main) in mains.indexed) ...[
                    if (i > 0) const Divider(indent: 72),
                    _CategoryTile(
                      category: main,
                      subCount: subs[main.id]!.length,
                      hidden: main.productCount == 0 && subs[main.id]!.every((s) => s.productCount == 0),
                      onUp: i == 0 ? null : () => _move(context, ref, main.id, -1),
                      onDown: i == mains.length - 1 ? null : () => _move(context, ref, main.id, 1),
                    ),
                    for (final (j, sub) in subs[main.id]!.indexed)
                      _CategoryTile(
                        category: sub,
                        sub: true,
                        lastSub: j == subs[main.id]!.length - 1,
                        hidden: sub.productCount == 0,
                        onUp: j == 0 ? null : () => _move(context, ref, sub.id, -1),
                        onDown: j == subs[main.id]!.length - 1 ? null : () => _move(context, ref, sub.id, 1),
                      ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _move(BuildContext context, WidgetRef ref, String id, int direction) async {
    final t = AppLocalizations.of(context);
    try {
      await ref.read(catalogProvider.notifier).moveCategory(id, direction);
      if (context.mounted) showMessage(context, t.orderUpdated);
    } catch (e) {
      if (context.mounted) showMessage(context, errorText(t, e));
    }
  }
}

/// One category row. A sub-category sits indented under its main category, joined by a thin line.
class _CategoryTile extends StatelessWidget {
  const _CategoryTile({required this.category, required this.hidden, this.subCount = 0, this.sub = false, this.lastSub = false, this.onUp, this.onDown});

  final Category category;
  final bool hidden;
  final int subCount;
  final bool sub;
  final bool lastSub;
  final VoidCallback? onUp;
  final VoidCallback? onDown;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final cat = category;
    final size = sub ? 34.0 : 44.0;
    final count = t.productCount(cat.productCount);
    final row = Padding(
      padding: EdgeInsetsDirectional.fromSTEB(sub ? 56 : 14, sub ? 8 : 12, 8, sub ? 8 : 12),
      child: Row(
        children: [
          Container(
            width: size,
            height: size,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: sub ? BrandColors.canvas : BrandColors.accent.withValues(alpha: 0.22),
              border: sub ? Border.all(color: BrandColors.hairline) : null,
              borderRadius: BorderRadius.circular(sub ? 11 : 14),
            ),
            child: Text(cat.name.isEmpty ? '?' : cat.name.characters.first.toUpperCase(), style: Ui.display(context, sub ? 15 : 18, color: BrandColors.primary)),
          ),
          SizedBox(width: sub ? 12 : 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  cat.name,
                  style: TextStyle(fontWeight: sub ? FontWeight.w600 : FontWeight.w700, fontSize: sub ? 14.5 : 15.5, color: BrandColors.ink),
                ),
                const SizedBox(height: 3),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    Text(
                      subCount > 0 ? '$count · ${t.subCategoryCount(subCount)}' : count,
                      style: TextStyle(color: BrandColors.muted, fontSize: sub ? 13 : null),
                    ),
                    if (hidden) Pill(t.hiddenOnSite, color: BrandColors.highlight.withValues(alpha: 0.15), textColor: BrandColors.highlight),
                  ],
                ),
              ],
            ),
          ),
          _MoveButton(tooltip: t.moveUp(cat.name), icon: Icons.keyboard_arrow_up_rounded, onPressed: onUp),
          const SizedBox(width: 6),
          _MoveButton(tooltip: t.moveDown(cat.name), icon: Icons.keyboard_arrow_down_rounded, onPressed: onDown),
        ],
      ),
    );
    return InkWell(
      key: Key('category-${cat.id}'),
      onTap: () => openCategorySheet(context, cat),
      child: sub
          ? Stack(
              children: [
                row,
                PositionedDirectional(
                  start: 30,
                  top: 0,
                  bottom: 0,
                  width: 20,
                  child: CustomPaint(
                    painter: _Connector(last: lastSub, color: BrandColors.line, rtl: Directionality.of(context) == TextDirection.rtl),
                  ),
                ),
              ],
            )
          : row,
    );
  }
}

/// The thin line from a main category down to each of its sub-categories.
class _Connector extends CustomPainter {
  const _Connector({required this.last, required this.color, required this.rtl});

  final bool last;
  final Color color;
  final bool rtl;

  @override
  void paint(Canvas canvas, Size size) {
    double x(double v) => rtl ? size.width - v : v;
    const x0 = 6.0;
    const r = 8.0;
    final mid = size.height / 2;
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;
    final path = Path()
      ..moveTo(x(x0), 0)
      ..lineTo(x(x0), mid - r)
      ..quadraticBezierTo(x(x0), mid, x(x0 + r), mid)
      ..lineTo(x(size.width), mid);
    if (!last) {
      path
        ..moveTo(x(x0), mid - r)
        ..lineTo(x(x0), size.height);
    }
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_Connector old) => old.last != last || old.color != color || old.rtl != rtl;
}

class _MoveButton extends StatelessWidget {
  const _MoveButton({required this.tooltip, required this.icon, required this.onPressed});

  final String tooltip;
  final IconData icon;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) => IconButton(
    tooltip: tooltip,
    onPressed: onPressed,
    style: IconButton.styleFrom(
      fixedSize: const Size(36, 36),
      minimumSize: const Size(36, 36),
      backgroundColor: BrandColors.canvas,
      disabledBackgroundColor: Colors.transparent,
      foregroundColor: BrandColors.ink,
      disabledForegroundColor: BrandColors.line,
    ),
    icon: Icon(icon, size: 22),
  );
}
