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
import 'products_tab.dart';

Future<void> openCategorySheet(BuildContext context, Category? category) async {
  final message = await showFormSheet<String>(context, (_) => CategorySheet(category: category));
  if (message != null && context.mounted) showMessage(context, message);
}

/// Add or edit a category and choose whether it shows inside a main category. Deleting one with products asks where they go.
class CategorySheet extends ConsumerStatefulWidget {
  const CategorySheet({super.key, this.category});

  final Category? category;

  @override
  ConsumerState<CategorySheet> createState() => _CategorySheetState();
}

class _CategorySheetState extends ConsumerState<CategorySheet> {
  late final _name = TextEditingController(text: widget.category?.name ?? '');
  late String? _parentId = widget.category?.parentId;
  String? _error;
  String? _parentError;
  bool _busy = false;
  bool _confirmDelete = false;

  /// Where the products go on delete: another category's id, or null to delete them too.
  String? _moveTo;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  List<Category> get _all => ref.read(catalogProvider).value?.categories ?? const <Category>[];

  List<Category> get _others => [
        for (final c in _all)
          if (c.id != widget.category?.id) c,
      ];

  /// Main categories this one can go inside. None when it has sub-categories of its own (one level only).
  List<Category> get _parents => widget.category != null && _all.childrenOf(widget.category!.id).isNotEmpty
      ? const []
      : [
          for (final c in _all.mains)
            if (c.id != widget.category?.id) c,
        ];

  Future<void> _save() async {
    final t = AppLocalizations.of(context);
    final name = _name.text.trim().replaceAll(RegExp(r'\s+'), ' ');
    if (name.isEmpty) return setState(() => _error = t.errCategoryName);
    if (_others.any((c) => c.name.toLowerCase() == name.toLowerCase())) return setState(() => _error = t.errCategoryTaken);
    setState(() => _busy = true);
    try {
      final parentId = _parents.any((c) => c.id == _parentId) ? _parentId : null;
      await ref.read(catalogProvider.notifier).saveCategory(widget.category?.id, name, parentId: parentId);
      if (mounted) Navigator.pop(context, widget.category == null ? t.categoryAdded : t.categoryRenamed);
    } on ApiError catch (e) {
      if (!mounted) return;
      setState(() {
        _parentError = e.field('parentId');
        _error = e.field('name') ?? (_parentError == null ? errorText(t, e) : null);
      });
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
      final moved = count > 0 && _moveTo != null ? categoryLabel(t, _others.firstWhere((c) => c.id == _moveTo), _all) : null;
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
    final all = _all;
    final parents = _parents;
    final hasSubs = category != null && all.childrenOf(category.id).isNotEmpty;
    final deleteBody = switch ((count > 0, hasSubs)) {
      (true, true) => '${t.deleteCategoryChoose} ${t.deleteCategorySubs}',
      (true, false) => t.deleteCategoryChoose,
      (false, true) => t.deleteCategorySubs,
      (false, false) => t.deleteCategoryEmpty,
    };
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text(category == null ? t.newCategory : t.editCategory, style: Ui.display(26)),
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
      if (hasSubs || parents.isNotEmpty) ...[
        const SizedBox(height: 12),
        Text(t.showInside, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5, color: BrandColors.ink)),
        const SizedBox(height: 8),
        if (hasSubs)
          Row(children: [
            Icon(Icons.info_outline_rounded, size: 18, color: BrandColors.muted),
            const SizedBox(width: 8),
            Expanded(child: Text(t.parentLockedHint, key: const Key('parentLocked'), style: TextStyle(color: BrandColors.muted, height: 1.4))),
          ])
        else
          DropdownButtonFormField<String?>(
            key: const Key('categoryParent'),
            initialValue: parents.any((c) => c.id == _parentId) ? _parentId : null,
            isExpanded: true,
            decoration: InputDecoration(errorText: _parentError, errorMaxLines: 3, helperText: t.showInsideHelp, helperMaxLines: 2),
            items: [
              DropdownMenuItem(value: null, child: Text(t.mainCategoryOption)),
              for (final p in parents) DropdownMenuItem(value: p.id, child: Text(p.name, overflow: TextOverflow.ellipsis)),
            ],
            onChanged: _busy
                ? null
                : (v) => setState(() {
                      _parentId = v;
                      _parentError = null;
                    }),
          ),
      ],
      const SizedBox(height: 16),
      if (_confirmDelete)
        ConfirmBox(
          title: t.deleteCategoryTitle(category!.name),
          body: deleteBody,
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
                      for (final o in others) DropdownMenuItem(value: o.id, child: Text(t.moveTo(categoryLabel(t, o, all)), overflow: TextOverflow.ellipsis)),
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
