import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_error.dart';
import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import 'catalog_controller.dart';
import 'menu_models.dart';
import 'product_sheet.dart';

Future<void> openCategorySheet(BuildContext context, Category? category) async {
  final message = await showFormSheet<String>(context, (_) => CategorySheet(category: category));
  if (message != null && context.mounted) showMessage(context, message);
}

/// Add or rename a category. Deleting one with products asks where they go.
class CategorySheet extends ConsumerStatefulWidget {
  const CategorySheet({super.key, this.category});

  final Category? category;

  @override
  ConsumerState<CategorySheet> createState() => _CategorySheetState();
}

class _CategorySheetState extends ConsumerState<CategorySheet> {
  late final _name = TextEditingController(text: widget.category?.name ?? '');
  String? _error;
  bool _busy = false;
  bool _confirmDelete = false;

  /// Where the products go on delete: another category's id, or null to delete them too.
  String? _moveTo;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  List<Category> get _others => [
        for (final c in ref.read(catalogProvider).value?.categories ?? const <Category>[])
          if (c.id != widget.category?.id) c,
      ];

  Future<void> _save() async {
    final t = AppLocalizations.of(context);
    final name = _name.text.trim().replaceAll(RegExp(r'\s+'), ' ');
    if (name.isEmpty) return setState(() => _error = t.errCategoryName);
    if (_others.any((c) => c.name.toLowerCase() == name.toLowerCase())) return setState(() => _error = t.errCategoryTaken);
    setState(() => _busy = true);
    try {
      await ref.read(catalogProvider.notifier).saveCategory(widget.category?.id, name);
      if (mounted) Navigator.pop(context, widget.category == null ? t.categoryAdded : t.categoryRenamed);
    } on ApiError catch (e) {
      if (mounted) setState(() => _error = e.field('name') ?? errorText(t, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete() async {
    final t = AppLocalizations.of(context);
    final count = widget.category!.productCount;
    setState(() => _busy = true);
    try {
      await ref.read(catalogProvider.notifier).deleteCategory(widget.category!.id, moveTo: count == 0 ? null : _moveTo);
      final moved = count > 0 && _moveTo != null ? _others.firstWhere((c) => c.id == _moveTo).name : null;
      if (mounted) Navigator.pop(context, moved == null ? t.categoryDeleted : t.categoryDeletedMoved(moved));
    } catch (e) {
      if (mounted) showMessage(context, errorText(t, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final category = widget.category;
    final count = category?.productCount ?? 0;
    final others = _others;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text(category == null ? t.newCategory : t.editCategory, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: BrandColors.ink)),
      const SizedBox(height: 4),
      Text(category == null ? t.newCategorySub : t.productsInCategory(count), style: TextStyle(color: BrandColors.muted)),
      const SizedBox(height: 16),
      LabeledField(
        fieldKey: const Key('categoryName'),
        label: t.categoryName,
        hint: t.categoryNameHint,
        controller: _name,
        error: _error,
        textInputAction: TextInputAction.done,
        onChanged: (_) => setState(() => _error = null),
      ),
      const SizedBox(height: 16),
      if (_confirmDelete)
        ConfirmBox(
          title: t.deleteCategoryTitle(category!.name),
          body: count > 0 ? t.deleteCategoryChoose : t.deleteCategoryEmpty,
          busy: _busy,
          onKeep: () => setState(() => _confirmDelete = false),
          onDelete: _delete,
          child: count == 0
              ? null
              : Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Text(t.whatHappensToProducts(count), style: TextStyle(fontWeight: FontWeight.w600, color: BrandColors.ink)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String?>(
                    initialValue: _moveTo,
                    isExpanded: true,
                    items: [
                      for (final o in others) DropdownMenuItem(value: o.id, child: Text(t.moveTo(o.name))),
                      DropdownMenuItem(value: null, child: Text(t.deleteThemToo)),
                    ],
                    onChanged: (v) => setState(() => _moveTo = v),
                  ),
                ]),
        )
      else ...[
        BusyButton(label: category == null ? t.addCategory : t.saveChanges, busyLabel: t.saving, busy: _busy, onPressed: _save),
        const SizedBox(height: 10),
        category == null
            ? LightButton(label: t.cancel, onPressed: () => Navigator.pop(context))
            : LightButton(
                label: t.deleteCategory,
                danger: true,
                onPressed: () => setState(() {
                  _confirmDelete = true;
                  _moveTo = others.isEmpty ? null : others.first.id;
                }),
              ),
      ],
    ]);
  }
}
