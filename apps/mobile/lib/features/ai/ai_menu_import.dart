import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_error.dart';
import '../../core/currency.dart';
import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_controller.dart';
import '../menu/catalog_controller.dart';
import 'ai_models.dart';
import 'ai_repository.dart';
import 'ai_widgets.dart';

/// "Add from a menu photo" on the Products tab. Hidden when the helper's status can't be read; dimmed with a note when it is off.
class AiMenuEntry extends ConsumerWidget {
  const AiMenuEntry({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final status = ref.watch(aiStatusProvider).value;
    if (status == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: AppCard(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          AiActionRow(
            key: const Key('aiMenuFromPhoto'),
            icon: aiIcon,
            title: t.aiMenuFromPhoto,
            subtitle: t.aiMenuFromPhotoSub,
            onTap: status.usable ? () => openMenuFromPhotos(context) : null,
          ),
          const SizedBox(height: 10),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 4), child: AiStatusLine(status: status)),
        ]),
      ),
    );
  }
}

/// Picks up to 3 menu photos, reads them, then opens the review screen. Shows how many items were added.
Future<void> openMenuFromPhotos(BuildContext context) async {
  final draft = await showFormSheet<MenuDraft>(context, (_) => const _MenuPhotosSheet());
  if (draft == null || !context.mounted) return;
  final added = await Navigator.of(context).push<int>(MaterialPageRoute(builder: (_) => MenuReviewScreen(draft: draft)));
  if (added != null && added > 0 && context.mounted) showMessage(context, AppLocalizations.of(context).aiItemsAdded(added));
}

class _MenuPhotosSheet extends ConsumerStatefulWidget {
  const _MenuPhotosSheet();

  @override
  ConsumerState<_MenuPhotosSheet> createState() => _MenuPhotosSheetState();
}

class _MenuPhotosSheetState extends ConsumerState<_MenuPhotosSheet> {
  static const _max = 3;
  final _photos = <AiPhoto>[];
  late bool _arabic = switch (ref.read(authControllerProvider)) { SignedIn(:final business) => business.locale == 'ar', _ => false };
  bool _busy = false;
  String? _error;

  Future<void> _add({required bool camera}) async {
    final picker = ref.read(aiPhotoPickerProvider);
    final room = _max - _photos.length;
    final picked = camera ? [?await picker.one(camera: true)] : await picker.many(limit: room);
    if (mounted) setState(() => _photos.addAll(picked.take(room)));
  }

  Future<void> _read() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final draft = await ref.read(aiRepositoryProvider).menu(_photos, arabic: _arabic);
      if (mounted) Navigator.pop(context, draft);
    } catch (e) {
      if (mounted) setState(() => _error = errorText(AppLocalizations.of(context), e));
    } finally {
      ref.invalidate(aiStatusProvider);
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    if (_busy) return AiWorking(label: t.aiReadingMenu);
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Row(children: [const IconTile(aiIcon), const SizedBox(width: 12), Expanded(child: Text(t.aiMenuFromPhoto, style: Ui.display(context, 24)))]),
      const SizedBox(height: 6),
      Text(t.aiMenuFromPhotoSub, style: TextStyle(color: BrandColors.muted, height: 1.4)),
      const SizedBox(height: 16),
      Text(t.aiMenuPhotos(_photos.length), style: Ui.eyebrow(context)),
      const SizedBox(height: 8),
      Row(children: [
        for (final (i, p) in _photos.indexed)
          Padding(
            padding: const EdgeInsetsDirectional.only(end: 10),
            child: Stack(clipBehavior: Clip.none, children: [
              ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.memory(p.bytes, width: 84, height: 84, fit: BoxFit.cover)),
              PositionedDirectional(
                top: -8,
                end: -8,
                child: IconButton.filled(
                  tooltip: t.aiRemovePhoto,
                  visualDensity: VisualDensity.compact,
                  iconSize: 16,
                  onPressed: () => setState(() => _photos.removeAt(i)),
                  icon: const Icon(Icons.close_rounded),
                ),
              ),
            ]),
          ),
      ]),
      if (_photos.length < _max) ...[
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: LightButton(icon: Icons.photo_camera_outlined, label: t.aiTakePhoto, onPressed: () => _add(camera: true))),
          const SizedBox(width: 10),
          Expanded(child: LightButton(icon: Icons.photo_library_outlined, label: t.aiChoosePhoto, onPressed: () => _add(camera: false))),
        ]),
      ],
      const SizedBox(height: 16),
      AiLanguageChoice(value: _arabic ? 'ar' : 'en', onChanged: (l) => setState(() => _arabic = l == 'ar')),
      if (_error != null) ...[const SizedBox(height: 12), AiNote(_error!, icon: Icons.error_outline_rounded)],
      const SizedBox(height: 18),
      FilledButton.icon(
        key: const Key('aiReadMenu'),
        onPressed: _photos.isEmpty ? null : _read,
        icon: const Icon(aiIcon),
        label: Text(t.aiReadMenu),
      ),
    ]);
  }
}

/// The draft read from the photos: names and prices to correct, a tick per category and product, then "Add N items",
/// which adds them all at once. Pops with the number of products added.
class MenuReviewScreen extends ConsumerStatefulWidget {
  const MenuReviewScreen({super.key, required this.draft});

  final MenuDraft draft;

  @override
  ConsumerState<MenuReviewScreen> createState() => _MenuReviewScreenState();
}

class _MenuReviewScreenState extends ConsumerState<MenuReviewScreen> {
  final _nameErrors = <Object, String>{};
  final _priceErrors = <DraftProduct, String>{};
  bool _busy = false;

  List<DraftCategory> get _categories => widget.draft.categories;

  Currency get _currency => currencyFor(widget.draft.currencyCode.isNotEmpty
      ? widget.draft.currencyCode
      : switch (ref.read(authControllerProvider)) { SignedIn(:final business) => business.currencyCode, _ => defaultCurrencyCode });

  int get _count => _categories.where((c) => c.selected).fold(0, (n, c) => n + c.products.where((p) => p.selected).length);

  /// Each chosen category with its chosen products, in the API's shape.
  List<(DraftCategory, List<DraftProduct>)> get _chosen => [
        for (final c in _categories)
          if (c.selected && c.products.any((p) => p.selected)) (c, [for (final p in c.products) if (p.selected) p]),
      ];

  bool _validate(AppLocalizations t) {
    _nameErrors.clear();
    _priceErrors.clear();
    for (final (c, products) in _chosen) {
      if (c.name.trim().isEmpty) _nameErrors[c] = t.errCategoryName;
      for (final p in products) {
        if (p.name.trim().isEmpty) _nameErrors[p] = t.errProductName;
        if (p.price == null) _priceErrors[p] = t.errPrice;
      }
    }
    setState(() {});
    return _nameErrors.isEmpty && _priceErrors.isEmpty;
  }

  Future<void> _add() async {
    final t = AppLocalizations.of(context);
    if (_count == 0) return;
    if (!_validate(t)) return showMessage(context, t.aiFixHighlighted);
    final chosen = _chosen;
    setState(() => _busy = true);
    try {
      final added = await ref.read(aiRepositoryProvider).importCatalog([
        for (final (c, products) in chosen)
          {
            'name': c.name.trim(),
            'products': [
              for (final p in products) {'name': p.name.trim(), 'description': p.description?.trim(), 'price': p.price},
            ],
          },
      ]);
      await ref.read(catalogProvider.notifier).refresh();
      if (mounted) Navigator.pop(context, added);
    } on ApiError catch (e) {
      if (!mounted) return;
      _showFieldErrors(e, chosen);
      showMessage(context, e.fieldErrors.isEmpty ? errorText(t, e) : t.aiFixHighlighted);
    } catch (e) {
      if (mounted) showMessage(context, errorText(t, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Puts the API's errors ("categories[0].products[2].price") on the matching fields.
  void _showFieldErrors(ApiError e, List<(DraftCategory, List<DraftProduct>)> sent) {
    final pattern = RegExp(r'^categories\[(\d+)\](?:\.products\[(\d+)\])?\.(\w+)$');
    setState(() {
      e.fieldErrors.forEach((key, message) {
        final m = pattern.firstMatch(key);
        if (m == null) return;
        final ci = int.parse(m.group(1)!);
        if (ci >= sent.length) return;
        final (category, products) = sent[ci];
        final pi = m.group(2) == null ? null : int.parse(m.group(2)!);
        final target = pi == null ? category : (pi < products.length ? products[pi] : null);
        if (target == null) return;
        if (m.group(3) == 'price' && target is DraftProduct) {
          _priceErrors[target] = message;
        } else {
          _nameErrors[target] = message;
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final existing = {for (final c in ref.watch(catalogProvider).value?.categories ?? const []) c.name.trim().toLowerCase()};
    final menuCurrency = widget.draft.menuCurrency;
    return Scaffold(
      appBar: AppBar(title: Text(t.aiReviewTitle)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(Ui.gutter, 4, Ui.gutter, 24),
        children: [
          Text(t.aiReviewSub, style: TextStyle(color: BrandColors.muted, height: 1.4)),
          const SizedBox(height: 10),
          AiNote(t.aiCheckBeforeUsing, icon: aiIcon),
          if (menuCurrency != null && menuCurrency != _currency.code) ...[
            const SizedBox(height: 8),
            AiNote(t.aiCurrencyDiffers(menuCurrency, _currency.code), icon: Icons.currency_exchange_rounded),
          ],
          for (final c in _categories)
            _CategoryCard(
              key: ObjectKey(c),
              category: c,
              exists: existing.contains(c.name.trim().toLowerCase()),
              currency: _currency,
              nameErrors: _nameErrors,
              priceErrors: _priceErrors,
              onChanged: () => setState(() {}),
            ),
        ],
      ),
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: BrandColors.hairline))),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
            child: BusyButton(
              key: const Key('aiAddItems'),
              label: t.aiAddItems(_count),
              busyLabel: t.aiAdding,
              busy: _busy,
              onPressed: _add,
            ),
          ),
        ),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({
    super.key,
    required this.category,
    required this.exists,
    required this.currency,
    required this.nameErrors,
    required this.priceErrors,
    required this.onChanged,
  });

  final DraftCategory category;

  /// The business already has a category with this name: the products join it.
  final bool exists;
  final Currency currency;
  final Map<Object, String> nameErrors;
  final Map<DraftProduct, String> priceErrors;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: AppCard(
        padding: const EdgeInsets.fromLTRB(8, 10, 14, 10),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Checkbox(
              value: category.selected,
              semanticLabel: t.aiSelectCategory,
              onChanged: (v) {
                category.selected = v ?? false;
                for (final p in category.products) {
                  p.selected = category.selected;
                }
                onChanged();
              },
            ),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _DraftText(
                  initial: category.name,
                  hint: t.categoryNameHint,
                  error: nameErrors[category],
                  bold: true,
                  onChanged: (v) {
                    category.name = v;
                    nameErrors.remove(category);
                    onChanged();
                  },
                ),
                const SizedBox(height: 4),
                Pill(exists ? t.aiExistingCategory : t.aiNewCategory),
              ]),
            ),
          ]),
          const Divider(height: 18),
          for (final p in category.products)
            _ProductRow(
              key: ObjectKey(p),
              product: p,
              enabled: category.selected,
              currency: currency,
              nameError: nameErrors[p],
              priceError: priceErrors[p],
              onChanged: () {
                nameErrors.remove(p);
                priceErrors.remove(p);
                if (p.selected) category.selected = true;
                onChanged();
              },
            ),
        ]),
      ),
    );
  }
}

class _ProductRow extends StatelessWidget {
  const _ProductRow({
    super.key,
    required this.product,
    required this.enabled,
    required this.currency,
    required this.onChanged,
    this.nameError,
    this.priceError,
  });

  final DraftProduct product;
  final bool enabled;
  final Currency currency;
  final String? nameError;
  final String? priceError;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Checkbox(
          value: product.selected && enabled,
          semanticLabel: t.aiSelectItem,
          onChanged: (v) {
            product.selected = v ?? false;
            onChanged();
          },
        ),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _DraftText(
              initial: product.name,
              hint: t.productNameHint,
              error: nameError,
              onChanged: (v) {
                product.name = v;
                onChanged();
              },
            ),
            if (product.description != null && product.description!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(product.description!, style: TextStyle(color: BrandColors.muted, fontSize: 12.5, height: 1.3)),
              ),
          ]),
        ),
        const SizedBox(width: 10),
        SizedBox(
          width: 96,
          child: _DraftText(
            initial: product.price == null ? '' : currency.inputText(product.price!),
            hint: currency.hint,
            error: priceError,
            number: true,
            onChanged: (v) {
              final text = v.trim().replaceAll(',', '.');
              product.price = currency.acceptsPrice(text) ? double.parse(text) : null;
              onChanged();
            },
          ),
        ),
      ]),
    );
  }
}

/// A compact text field that keeps its own controller and reports every change.
class _DraftText extends StatefulWidget {
  const _DraftText({required this.initial, required this.onChanged, this.hint, this.error, this.bold = false, this.number = false});

  final String initial;
  final ValueChanged<String> onChanged;
  final String? hint;
  final String? error;
  final bool bold;
  final bool number;

  @override
  State<_DraftText> createState() => _DraftTextState();
}

class _DraftTextState extends State<_DraftText> {
  late final _controller = TextEditingController(text: widget.initial);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => TextField(
        controller: _controller,
        onChanged: widget.onChanged,
        keyboardType: widget.number ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
        textDirection: widget.number ? TextDirection.ltr : null,
        style: TextStyle(fontWeight: widget.bold ? FontWeight.w700 : FontWeight.w500, color: BrandColors.ink),
        decoration: InputDecoration(isDense: true, hintText: widget.hint, errorText: widget.error, errorMaxLines: 2),
      );
}
