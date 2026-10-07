import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_controller.dart';
import 'catalog_controller.dart';
import 'dashboard_screen.dart';
import 'menu_models.dart';
import 'product_sheet.dart';

/// Stats, search, category filter and the grouped product list with availability switches.
class ProductsTab extends ConsumerStatefulWidget {
  const ProductsTab({super.key});

  @override
  ConsumerState<ProductsTab> createState() => _ProductsTabState();
}

class _ProductsTabState extends ConsumerState<ProductsTab> {
  String? _filter;
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final catalog = ref.watch(catalogProvider);
    return catalog.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => LoadError(error: e, onRetry: () => ref.invalidate(catalogProvider)),
      data: (c) => RefreshIndicator(
        onRefresh: () => ref.read(catalogProvider.notifier).refresh(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
          children: [
            Row(children: [
              _Stat(value: c.products.length, label: t.statProducts),
              const SizedBox(width: 8),
              _Stat(value: c.soldOut, label: t.statSoldOut, warn: c.soldOut > 0),
              const SizedBox(width: 8),
              _Stat(value: c.categories.length, label: t.statCategories),
            ]),
            const SizedBox(height: 12),
            TextField(
              key: const Key('productSearch'),
              decoration: InputDecoration(hintText: t.searchProducts, prefixIcon: const Icon(Icons.search)),
              onChanged: (v) => setState(() => _query = v),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 40,
              child: ListView(scrollDirection: Axis.horizontal, children: [
                _chip(t.filterAll, _filter == null, () => setState(() => _filter = null)),
                for (final cat in c.categories)
                  _chip('${cat.name} · ${c.inCategory(cat.id).length}', _filter == cat.id, () => setState(() => _filter = cat.id)),
              ]),
            ),
            const SizedBox(height: 6),
            ..._groups(t, c),
          ],
        ),
      ),
    );
  }

  Widget _chip(String label, bool on, VoidCallback onTap) => Padding(
        padding: const EdgeInsetsDirectional.only(end: 8),
        child: ChoiceChip(
          label: Text(label),
          selected: on,
          onSelected: (_) => onTap(),
          selectedColor: BrandColors.primary,
          labelStyle: TextStyle(color: on ? Colors.white : BrandColors.ink, fontWeight: FontWeight.w600),
          showCheckmark: false,
        ),
      );

  List<Widget> _groups(AppLocalizations t, Catalog c) {
    if (c.products.isEmpty) return [EmptyNote(title: t.noProductsTitle, body: t.noProductsBody)];
    final q = _query.trim().toLowerCase();
    bool matches(Product p) => q.isEmpty || '${p.name} ${p.description ?? ''}'.toLowerCase().contains(q);
    final groups = [
      for (final cat in c.categories)
        if (_filter == null || _filter == cat.id) (cat, c.inCategory(cat.id).where(matches).toList()),
    ].where((g) => g.$2.isNotEmpty || (q.isEmpty && _filter == g.$1.id)).toList();
    if (groups.isEmpty) return [EmptyNote(title: t.noMatchesTitle, body: t.noMatchesBody)];
    final currency = switch (ref.read(authControllerProvider)) { SignedIn(:final business) => business.currencyCode, _ => 'JOD' };

    return [
      for (final (cat, products) in groups) ...[
        Padding(
          padding: const EdgeInsets.fromLTRB(4, 14, 4, 8),
          child: Row(children: [
            Expanded(child: Text(cat.name, style: TextStyle(fontWeight: FontWeight.w700, color: BrandColors.ink))),
            Text('${products.length}', style: TextStyle(color: BrandColors.muted)),
          ]),
        ),
        if (products.isEmpty)
          Padding(padding: const EdgeInsets.all(12), child: Text(t.noProductsInCategory, style: TextStyle(color: BrandColors.muted)))
        else
          Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: BrandColors.line)),
            child: Column(children: [
              for (final (i, p) in products.indexed) ...[
                if (i > 0) Divider(height: 1, color: BrandColors.line),
                _ProductRow(product: p, currency: currency),
              ],
            ]),
          ),
      ],
    ];
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label, this.warn = false});

  final int value;
  final String label;
  final bool warn;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
          decoration: BoxDecoration(
            color: warn ? BrandColors.highlight.withValues(alpha: 0.1) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: warn ? BrandColors.highlight.withValues(alpha: 0.4) : BrandColors.line),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('$value', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: warn ? BrandColors.highlight : BrandColors.ink)),
            Text(label, style: TextStyle(color: BrandColors.muted, fontSize: 12)),
          ]),
        ),
      );
}

class _ProductRow extends ConsumerWidget {
  const _ProductRow({required this.product, required this.currency});

  final Product product;
  final String currency;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final p = product;
    return InkWell(
      onTap: () => openProductSheet(context, p),
      child: Opacity(
        opacity: p.isAvailable ? 1 : 0.75,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 6, 10),
          child: Row(children: [
            ProductThumb(name: p.name, imageUrl: p.imageUrl),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w700, color: BrandColors.ink)),
                const SizedBox(height: 4),
                Wrap(spacing: 6, runSpacing: 4, crossAxisAlignment: WrapCrossAlignment.center, children: [
                  Text(formatPrice(t, p.price, currency), style: TextStyle(color: BrandColors.muted)),
                  if (p.label != null) Pill(productLabelText(t, p.label!)),
                  if (!p.isAvailable) Pill(t.soldOut, color: BrandColors.highlight.withValues(alpha: 0.15), textColor: BrandColors.highlight),
                ]),
              ]),
            ),
            Switch(
              value: p.isAvailable,
              activeTrackColor: BrandColors.primary,
              onChanged: (v) async {
                try {
                  await ref.read(catalogProvider.notifier).setAvailability(p.id, v);
                  if (context.mounted) showMessage(context, v ? t.availableAgain(p.name) : t.markedSoldOut(p.name));
                } catch (e) {
                  if (context.mounted) showMessage(context, errorText(t, e));
                }
              },
            ),
          ]),
        ),
      ),
    );
  }
}

/// The label as owners read it in their language.
String productLabelText(AppLocalizations t, String label) => switch (label) {
      'Signature' => t.labelSignature,
      'New' => t.labelNew,
      'Best seller' => t.labelBestSeller,
      'Vegan' => t.labelVegan,
      'Spicy' => t.labelSpicy,
      _ => label,
    };
