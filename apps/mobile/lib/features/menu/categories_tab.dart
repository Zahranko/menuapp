import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import 'catalog_controller.dart';
import 'category_sheet.dart';
import 'dashboard_screen.dart';

/// Categories in the order customers see them, with product counts and up and down arrows.
class CategoriesTab extends ConsumerWidget {
  const CategoriesTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    return ref.watch(catalogProvider).when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => LoadError(error: e, onRetry: () => ref.invalidate(catalogProvider)),
          data: (c) => RefreshIndicator(
            onRefresh: () => ref.read(catalogProvider.notifier).refresh(),
            child: ListView(padding: const EdgeInsets.fromLTRB(Ui.gutter, 4, Ui.gutter, 110), children: [
              if (c.categories.isEmpty)
                EmptyNote(title: t.noCategoriesTitle, body: t.noCategoriesBody)
              else ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(4, 4, 4, 14),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Icon(Icons.swap_vert_rounded, size: 18, color: BrandColors.muted),
                    const SizedBox(width: 8),
                    Expanded(child: Text(t.categoriesHint, style: TextStyle(color: BrandColors.muted, height: 1.45, fontSize: 13.5))),
                  ]),
                ),
                AppCard(
                  padding: EdgeInsets.zero,
                  child: Column(children: [
                    for (final (i, cat) in c.categories.indexed) ...[
                      if (i > 0) const Divider(indent: 72),
                      InkWell(
                        onTap: () => openCategorySheet(context, cat),
                        child: Padding(
                          padding: const EdgeInsetsDirectional.fromSTEB(14, 12, 8, 12),
                          child: Row(children: [
                            Container(
                              width: 44,
                              height: 44,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(color: BrandColors.accent.withValues(alpha: 0.22), borderRadius: BorderRadius.circular(14)),
                              child: Text(cat.name.isEmpty ? '?' : cat.name.characters.first.toUpperCase(),
                                  style: Ui.display(18, color: BrandColors.primary)),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(cat.name, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5, color: BrandColors.ink)),
                                const SizedBox(height: 3),
                                Wrap(spacing: 6, children: [
                                  Text(t.productCount(cat.productCount), style: TextStyle(color: BrandColors.muted)),
                                  if (cat.productCount == 0) Pill(t.hiddenOnSite, color: BrandColors.highlight.withValues(alpha: 0.15), textColor: BrandColors.highlight),
                                ]),
                              ]),
                            ),
                            _MoveButton(
                              tooltip: t.moveUp(cat.name),
                              icon: Icons.keyboard_arrow_up_rounded,
                              onPressed: i == 0 ? null : () => _move(context, ref, i, -1),
                            ),
                            const SizedBox(width: 6),
                            _MoveButton(
                              tooltip: t.moveDown(cat.name),
                              icon: Icons.keyboard_arrow_down_rounded,
                              onPressed: i == c.categories.length - 1 ? null : () => _move(context, ref, i, 1),
                            ),
                          ]),
                        ),
                      ),
                    ],
                  ]),
                ),
              ],
            ]),
          ),
        );
  }

  Future<void> _move(BuildContext context, WidgetRef ref, int index, int direction) async {
    final t = AppLocalizations.of(context);
    try {
      await ref.read(catalogProvider.notifier).moveCategory(index, direction);
      if (context.mounted) showMessage(context, t.orderUpdated);
    } catch (e) {
      if (context.mounted) showMessage(context, errorText(t, e));
    }
  }
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
