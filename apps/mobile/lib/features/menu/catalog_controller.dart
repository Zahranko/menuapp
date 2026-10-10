import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import 'menu_models.dart';
import 'menu_repository.dart';

final catalogProvider = AsyncNotifierProvider<CatalogController, Catalog>(CatalogController.new);

/// The owner's products and categories. Changes are saved to the API, which puts them live on the website.
class CatalogController extends AsyncNotifier<Catalog> {
  MenuRepository get _repo => ref.read(menuRepositoryProvider);

  @override
  Future<Catalog> build() => ref.watch(menuRepositoryProvider).load();

  Future<void> refresh() async {
    final fresh = await _repo.load();
    state = AsyncData(fresh);
  }

  Future<void> saveProduct(String? id, ProductInput input) async {
    if (id == null) {
      await _repo.createProduct(input);
    } else {
      await _repo.updateProduct(id, input);
    }
    await refresh();
  }

  Future<void> deleteProduct(String id) async {
    await _repo.deleteProduct(id);
    await refresh();
  }

  /// Shows the change at once and puts it back if the save fails (the error is rethrown).
  Future<void> setAvailability(String id, bool available) async {
    final before = state.value;
    if (before == null) return;
    state = AsyncData(before.copyWith(products: [
      for (final p in before.products) p.id == id ? p.withAvailability(available) : p,
    ]));
    try {
      await _repo.setAvailability(id, available);
    } catch (_) {
      state = AsyncData(before);
      rethrow;
    }
  }

  Future<void> saveCategory(String? id, String name) async {
    if (id == null) {
      await _repo.createCategory(name);
    } else {
      await _repo.renameCategory(id, name);
    }
    await refresh();
  }

  Future<void> deleteCategory(String id, {String? moveTo}) async {
    await _repo.deleteCategory(id, moveTo: moveTo);
    await refresh();
  }

  /// Moves a category one place up (-1) or down (+1), optimistically.
  Future<void> moveCategory(int index, int direction) async {
    final before = state.value;
    if (before == null) return;
    final target = index + direction;
    if (target < 0 || target >= before.categories.length) return;
    final categories = [...before.categories];
    final moved = categories.removeAt(index);
    categories.insert(target, moved);
    final order = {for (final (i, c) in categories.indexed) c.id: i};
    final products = [...before.products]..sort((a, b) => (order[a.categoryId] ?? 0).compareTo(order[b.categoryId] ?? 0));
    state = AsyncData(Catalog(categories: categories, products: products));
    try {
      await _repo.reorderCategories([for (final c in categories) c.id]);
    } catch (_) {
      state = AsyncData(before);
      rethrow;
    }
  }
}
