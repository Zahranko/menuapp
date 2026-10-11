/// A menu category (`CategoryDto`). Categories without products are hidden on the website.
/// A sub-category has a [parentId]; sub-categories go one level deep, so a parent is always a main category.
class Category {
  const Category({required this.id, required this.name, required this.sortOrder, required this.productCount, this.parentId});

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id'] as String,
        name: json['name'] as String,
        sortOrder: (json['sortOrder'] as num).toInt(),
        productCount: (json['productCount'] as num).toInt(),
        parentId: json['parentId'] as String?,
      );

  final String id;
  final String name;
  final int sortOrder;
  final int productCount;
  final String? parentId;

  bool get isSub => parentId != null;

  Category copyWith({String? name, int? productCount}) =>
      Category(id: id, name: name ?? this.name, sortOrder: sortOrder, productCount: productCount ?? this.productCount, parentId: parentId);
}

/// Reads a flat category list (ordered by sort order) as a tree of main categories and their sub-categories.
extension CategoryTree on List<Category> {
  Category? byId(String? id) => id == null ? null : where((c) => c.id == id).firstOrNull;

  /// The parent of [c], or null for a main category (or one whose parent is gone).
  Category? parentOf(Category c) => byId(c.parentId);

  /// Main categories, plus any whose parent is missing so nothing gets lost.
  List<Category> get mains => [for (final c in this) if (parentOf(c) == null) c];

  List<Category> childrenOf(String id) => [for (final c in this) if (c.parentId == id) c];

  /// Each main category followed by its sub-categories: the order the website shows them.
  List<Category> get inDisplayOrder => [
        for (final m in mains) ...[m, ...childrenOf(m.id)],
      ];

  /// The categories that move together with [c] when it goes up or down: same parent.
  List<Category> siblingsOf(Category c) {
    final parent = parentOf(c);
    return parent == null ? mains : childrenOf(parent.id);
  }
}

/// The labels a product can show, as the API spells them.
const productLabels = ['Signature', 'New', 'Best seller', 'Vegan', 'Spicy'];

/// A product (`ProductDto`). Sold out means [isAvailable] is false; [isFeatured] shows it in Signature picks.
class Product {
  const Product({
    required this.id,
    required this.categoryId,
    required this.name,
    this.description,
    required this.price,
    this.imageUrl,
    this.label,
    this.isAvailable = true,
    this.isFeatured = false,
    this.sortOrder = 0,
  });

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['id'] as String,
        categoryId: json['categoryId'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        price: (json['price'] as num).toDouble(),
        imageUrl: json['imageUrl'] as String?,
        label: json['label'] as String?,
        isAvailable: json['isAvailable'] as bool? ?? true,
        isFeatured: json['isFeatured'] as bool? ?? false,
        sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      );

  final String id;
  final String categoryId;
  final String name;
  final String? description;
  final double price;
  final String? imageUrl;
  final String? label;
  final bool isAvailable;
  final bool isFeatured;
  final int sortOrder;

  Product withAvailability(bool available) => Product(
        id: id,
        categoryId: categoryId,
        name: name,
        description: description,
        price: price,
        imageUrl: imageUrl,
        label: label,
        isAvailable: available,
        isFeatured: isFeatured,
        sortOrder: sortOrder,
      );
}

/// What the product form sends (`SaveProduct`). [price] is the text the owner typed, checked before sending.
class ProductInput {
  const ProductInput({
    required this.categoryId,
    required this.name,
    this.description,
    required this.price,
    this.label,
    this.isAvailable = true,
    this.isFeatured = false,
    this.imageUrl,
  });

  final String categoryId;
  final String name;
  final String? description;
  final String price;
  final String? label;
  final bool isAvailable;
  final bool isFeatured;
  final String? imageUrl;

  Map<String, Object?> toJson() => {
        'categoryId': categoryId,
        'name': name,
        'description': description,
        'price': num.parse(price),
        'label': label,
        'isAvailable': isAvailable,
        'isFeatured': isFeatured,
        'imageUrl': imageUrl,
      };
}

/// Products and categories together, ordered as the website shows them.
class Catalog {
  const Catalog({required this.categories, required this.products});

  final List<Category> categories;
  final List<Product> products;

  int get soldOut => products.where((p) => !p.isAvailable).length;

  List<Product> inCategory(String categoryId) => products.where((p) => p.categoryId == categoryId).toList();

  /// Products in a category and in its sub-categories.
  List<Product> inCategoryAndSubs(String categoryId) {
    final ids = {categoryId, for (final c in categories.childrenOf(categoryId)) c.id};
    return products.where((p) => ids.contains(p.categoryId)).toList();
  }

  /// Sorts [products] by where their category shows on the website, then by their own order.
  static List<Product> sortProducts(List<Category> categories, List<Product> products) {
    final order = {for (final (i, c) in categories.inDisplayOrder.indexed) c.id: i};
    return [...products]..sort((a, b) {
        final byCategory = (order[a.categoryId] ?? 0).compareTo(order[b.categoryId] ?? 0);
        return byCategory != 0 ? byCategory : a.sortOrder.compareTo(b.sortOrder);
      });
  }

  Catalog copyWith({List<Category>? categories, List<Product>? products}) =>
      Catalog(categories: categories ?? this.categories, products: products ?? this.products);
}
