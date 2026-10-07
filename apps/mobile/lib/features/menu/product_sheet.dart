import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_error.dart';
import '../../core/providers.dart';
import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_controller.dart';
import 'catalog_controller.dart';
import 'category_sheet.dart';
import 'menu_models.dart';
import 'products_tab.dart';

/// Opens the add or edit product sheet. With no categories yet, asks for one first.
Future<void> openProductSheet(BuildContext context, Product? product) async {
  final container = ProviderScope.containerOf(context);
  final catalog = container.read(catalogProvider).value;
  if (catalog == null) return;
  final t = AppLocalizations.of(context);
  if (catalog.categories.isEmpty) {
    showMessage(context, t.addCategoryFirst);
    await openCategorySheet(context, null);
    return;
  }
  final message = await showFormSheet<String>(context, (_) => ProductSheet(product: product, categories: catalog.categories));
  if (message != null && context.mounted) showMessage(context, message);
}

/// Photo, name, description, price, category, label, availability and Signature picks. Validates like the API.
class ProductSheet extends ConsumerStatefulWidget {
  const ProductSheet({super.key, this.product, required this.categories});

  final Product? product;
  final List<Category> categories;

  @override
  ConsumerState<ProductSheet> createState() => _ProductSheetState();
}

class _ProductSheetState extends ConsumerState<ProductSheet> {
  late final _name = TextEditingController(text: widget.product?.name ?? '');
  late final _description = TextEditingController(text: widget.product?.description ?? '');
  late final _price = TextEditingController(text: widget.product == null ? '' : widget.product!.price.toStringAsFixed(2));
  late String _categoryId = widget.product?.categoryId ?? widget.categories.first.id;
  late String? _label = widget.product?.label;
  late bool _available = widget.product?.isAvailable ?? true;
  late bool _featured = widget.product?.isFeatured ?? false;
  late String? _imageUrl = widget.product?.imageUrl;
  Map<String, String> _errors = {};
  bool _busy = false;
  bool _uploading = false;
  bool _confirmDelete = false;

  bool get _editing => widget.product != null;

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    _price.dispose();
    super.dispose();
  }

  /// Checks the name and price the same way the API does, so most mistakes show without a round trip.
  static Map<String, String> validate(AppLocalizations t, String name, String price) {
    final errors = <String, String>{};
    if (name.trim().isEmpty) errors['name'] = t.errProductName;
    final p = price.trim().replaceAll(',', '.');
    if (p.isEmpty) {
      errors['price'] = t.errPrice;
    } else if (!RegExp(r'^\d+(\.\d{1,3})?$').hasMatch(p)) {
      errors['price'] = t.errPriceFormat;
    }
    return errors;
  }

  Future<void> _pickPhoto() async {
    final t = AppLocalizations.of(context);
    final photo = await pickPhoto();
    if (photo == null) return;
    setState(() => _uploading = true);
    try {
      final url = await ref.read(menuRepositoryProvider).uploadImage(photo.bytes, photo.name);
      if (mounted) setState(() => _imageUrl = url);
    } catch (e) {
      if (mounted) showMessage(context, errorText(t, e));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _save() async {
    final t = AppLocalizations.of(context);
    final errors = validate(t, _name.text, _price.text);
    setState(() => _errors = errors);
    if (errors.isNotEmpty) return;
    setState(() => _busy = true);
    try {
      await ref.read(catalogProvider.notifier).saveProduct(
            widget.product?.id,
            ProductInput(
              categoryId: _categoryId,
              name: _name.text.trim(),
              description: _description.text.trim().isEmpty ? null : _description.text.trim(),
              price: _price.text.trim().replaceAll(',', '.'),
              label: _label,
              isAvailable: _available,
              isFeatured: _featured,
              imageUrl: _imageUrl,
            ),
          );
      if (mounted) Navigator.pop(context, _editing ? t.savedLive : t.addedLive);
    } on ApiError catch (e) {
      if (!mounted) return;
      setState(() => _errors = {
            if (e.field('name') != null) 'name': e.field('name')!,
            if (e.field('price') != null) 'price': e.field('price')!,
          });
      if (_errors.isEmpty) showMessage(context, errorText(t, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete() async {
    final t = AppLocalizations.of(context);
    setState(() => _busy = true);
    try {
      await ref.read(catalogProvider.notifier).deleteProduct(widget.product!.id);
      if (mounted) Navigator.pop(context, t.productDeleted);
    } catch (e) {
      if (mounted) showMessage(context, errorText(t, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    final currency = auth is SignedIn && auth.business.currencyCode != 'JOD' ? auth.business.currencyCode : t.currencyJod;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text(_editing ? t.editProduct : t.newProduct, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: BrandColors.ink)),
      const SizedBox(height: 4),
      Text(_editing ? t.editProductSub : t.newProductSub, style: TextStyle(color: BrandColors.muted)),
      const SizedBox(height: 16),
      Row(children: [
        ProductThumb(name: _name.text, imageUrl: _imageUrl, size: 72, radius: 16),
        const SizedBox(width: 12),
        Expanded(
          child: Wrap(spacing: 8, runSpacing: 8, children: [
            LightButton(
              label: _uploading ? t.uploading : (_imageUrl == null ? t.uploadPhoto : t.changePhoto),
              icon: Icons.photo_outlined,
              onPressed: _uploading ? null : _pickPhoto,
            ),
            if (_imageUrl != null) LightButton(label: t.remove, onPressed: () => setState(() => _imageUrl = null)),
          ]),
        ),
      ]),
      const SizedBox(height: 14),
      LabeledField(fieldKey: const Key('productName'), label: t.productName, hint: t.productNameHint, controller: _name, error: _errors['name'],
          onChanged: (_) => setState(() => _errors.remove('name'))),
      const SizedBox(height: 12),
      Text(t.descriptionOptional, style: TextStyle(fontWeight: FontWeight.w600, color: BrandColors.ink)),
      const SizedBox(height: 6),
      TextField(controller: _description, maxLines: 2, maxLength: 140, decoration: InputDecoration(hintText: t.descriptionHint)),
      const SizedBox(height: 4),
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(
          child: LabeledField(
            fieldKey: const Key('productPrice'),
            label: t.price,
            hint: '0.00',
            controller: _price,
            error: _errors['price'],
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            suffix: Padding(padding: const EdgeInsets.all(14), child: Text(currency, style: TextStyle(color: BrandColors.muted))),
            onChanged: (_) => setState(() => _errors.remove('price')),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text(t.category, style: TextStyle(fontWeight: FontWeight.w600, color: BrandColors.ink)),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              initialValue: _categoryId,
              isExpanded: true,
              items: [for (final c in widget.categories) DropdownMenuItem(value: c.id, child: Text(c.name, overflow: TextOverflow.ellipsis))],
              onChanged: (v) => setState(() => _categoryId = v ?? _categoryId),
            ),
          ]),
        ),
      ]),
      const SizedBox(height: 12),
      Text(t.label, style: TextStyle(fontWeight: FontWeight.w600, color: BrandColors.ink)),
      const SizedBox(height: 6),
      DropdownButtonFormField<String?>(
        initialValue: _label,
        items: [
          DropdownMenuItem(value: null, child: Text(t.noLabel)),
          for (final l in productLabels) DropdownMenuItem(value: l, child: Text(productLabelText(t, l))),
        ],
        onChanged: (v) => setState(() => _label = v),
      ),
      const SizedBox(height: 8),
      SwitchListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(t.available, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(t.availableHelp),
        value: _available,
        activeTrackColor: BrandColors.primary,
        onChanged: (v) => setState(() => _available = v),
      ),
      SwitchListTile(
        contentPadding: EdgeInsets.zero,
        title: Text(t.featureSignature, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(t.featureSignatureHelp),
        value: _featured,
        activeTrackColor: BrandColors.primary,
        onChanged: (v) => setState(() => _featured = v),
      ),
      const SizedBox(height: 12),
      if (_confirmDelete)
        ConfirmBox(
          title: t.deleteProductTitle(widget.product!.name),
          body: t.deleteProductBody,
          busy: _busy,
          onKeep: () => setState(() => _confirmDelete = false),
          onDelete: _delete,
        )
      else ...[
        BusyButton(label: _editing ? t.saveChanges : t.addProduct, busyLabel: t.saving, busy: _busy || _uploading, onPressed: _save),
        const SizedBox(height: 10),
        _editing
            ? LightButton(label: t.deleteProduct, danger: true, onPressed: () => setState(() => _confirmDelete = true))
            : LightButton(label: t.cancel, onPressed: () => Navigator.pop(context)),
      ],
    ]);
  }
}

/// The inline "Delete …?" step with Keep it and Delete, shared by the product and category sheets.
class ConfirmBox extends StatelessWidget {
  const ConfirmBox({super.key, required this.title, required this.body, required this.busy, required this.onKeep, required this.onDelete, this.child});

  final String title;
  final String body;
  final bool busy;
  final VoidCallback onKeep;
  final VoidCallback onDelete;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: BrandColors.highlight.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: BrandColors.highlight.withValues(alpha: 0.35)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(title, style: TextStyle(fontWeight: FontWeight.w800, color: BrandColors.ink, fontSize: 16)),
        if (child != null) ...[const SizedBox(height: 10), child!],
        const SizedBox(height: 6),
        Text(body, style: TextStyle(color: BrandColors.muted)),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: LightButton(label: t.keepIt, onPressed: busy ? null : onKeep)),
          const SizedBox(width: 10),
          Expanded(
            child: FilledButton(
              key: const Key('confirmDelete'),
              style: FilledButton.styleFrom(backgroundColor: BrandColors.highlight, minimumSize: const Size(0, 46)),
              onPressed: busy ? null : onDelete,
              child: Text(t.delete),
            ),
          ),
        ]),
      ]),
    );
  }
}
