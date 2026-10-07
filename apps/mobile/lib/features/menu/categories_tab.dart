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
            child: ListView(padding: const EdgeInsets.fromLTRB(16, 4, 16, 96), children: [
              if (c.categories.isEmpty)
                EmptyNote(title: t.noCategoriesTitle, body: t.noCategoriesBody)
              else ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(4, 4, 4, 12),
                  child: Text(t.categoriesHint, style: TextStyle(color: BrandColors.muted, height: 1.4)),
                ),
                Container(
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: BrandColors.line)),
                  child: Column(children: [
                    for (final (i, cat) in c.categories.indexed) ...[
                      if (i > 0) Divider(height: 1, color: BrandColors.line),
                      InkWell(
                        onTap: () => openCategorySheet(context, cat),
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(12, 10, 4, 10),
                          child: Row(children: [
                            Container(
                              width: 42,
                              height: 42,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(color: BrandColors.accent.withValues(alpha: 0.25), borderRadius: BorderRadius.circular(12)),
                              child: Text(cat.name.isEmpty ? '?' : cat.name.characters.first.toUpperCase(),
                                  style: TextStyle(fontWeight: FontWeight.w800, color: BrandColors.ink)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(cat.name, style: TextStyle(fontWeight: FontWeight.w700, color: BrandColors.ink)),
                                const SizedBox(height: 3),
                                Wrap(spacing: 6, children: [
                                  Text(t.productCount(cat.productCount), style: TextStyle(color: BrandColors.muted)),
                                  if (cat.productCount == 0) Pill(t.hiddenOnSite, color: BrandColors.highlight.withValues(alpha: 0.15), textColor: BrandColors.highlight),
                                ]),
                              ]),
                            ),
                            IconButton(
                              tooltip: t.moveUp(cat.name),
                              onPressed: i == 0 ? null : () => _move(context, ref, i, -1),
                              icon: const Icon(Icons.keyboard_arrow_up),
                            ),
                            IconButton(
                              tooltip: t.moveDown(cat.name),
                              onPressed: i == c.categories.length - 1 ? null : () => _move(context, ref, i, 1),
                              icon: const Icon(Icons.keyboard_arrow_down),
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
