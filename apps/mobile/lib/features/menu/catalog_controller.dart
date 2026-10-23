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

  /// Adds or updates a category. [parentId] puts it inside a main category; null makes it a main category.
  Future<void> saveCategory(String? id, String name, {String? parentId}) async {
    if (id == null) {
      await _repo.createCategory(name, parentId: parentId);
    } else {
      await _repo.updateCategory(id, name, parentId: parentId);
    }
    await refresh();
  }

  Future<void> deleteCategory(String id, {String? moveTo}) async {
    await _repo.deleteCategory(id, moveTo: moveTo);
    await refresh();
  }

  /// Moves a category one place up (-1) or down (+1) among the categories with the same parent, optimistically.
  Future<void> moveCategory(String id, int direction) async {
    final before = state.value;
    if (before == null) return;
    final cat = before.categories.byId(id);
    if (cat == null) return;
    final siblings = before.categories.siblingsOf(cat);
    final at = siblings.indexOf(cat);
    final target = at + direction;
    if (target < 0 || target >= siblings.length) return;
    // Swap the two siblings in the flat list; everything else keeps its place.
    final categories = [...before.categories];
    final a = categories.indexOf(cat);
    final b = categories.indexOf(siblings[target]);
    categories[a] = siblings[target];
    categories[b] = cat;
    final ordered = categories.inDisplayOrder;
    state = AsyncData(Catalog(categories: ordered, products: Catalog.sortProducts(ordered, before.products)));
    try {
      await _repo.reorderCategories([for (final c in ordered) c.id]);
    } catch (_) {
      state = AsyncData(before);
      rethrow;
    }
  }
}
