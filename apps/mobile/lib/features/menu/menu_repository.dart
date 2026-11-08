import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../../core/api/api_error.dart';
import '../../core/api/models.dart';
import 'menu_models.dart';

/// Products, categories, photos and business info. Every method throws [ApiError] on failure.
class MenuRepository {
  MenuRepository(this._dio);

  final Dio _dio;

  Future<Catalog> load() => _call(() async {
        final responses = await Future.wait([
          _dio.get<List<dynamic>>('/api/v1/categories'),
          _dio.get<List<dynamic>>('/api/v1/products'),
        ]);
        final flat = [for (final c in responses[0].data!) Category.fromJson(c as Map<String, dynamic>)]..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
        final categories = flat.inDisplayOrder;
        final products = Catalog.sortProducts(categories, [for (final p in responses[1].data!) Product.fromJson(p as Map<String, dynamic>)]);
        return Catalog(categories: categories, products: products);
      });

  Future<Product> createProduct(ProductInput input) => _call(() async {
        final response = await _dio.post<Map<String, dynamic>>('/api/v1/products', data: input.toJson());
        return Product.fromJson(response.data!);
      });

  Future<Product> updateProduct(String id, ProductInput input) => _call(() async {
        final response = await _dio.put<Map<String, dynamic>>('/api/v1/products/$id', data: input.toJson());
        return Product.fromJson(response.data!);
      });

  Future<void> deleteProduct(String id) => _call(() => _dio.delete<void>('/api/v1/products/$id'));

  Future<void> setAvailability(String id, bool available) =>
      _call(() => _dio.patch<void>('/api/v1/products/$id/availability', data: {'isAvailable': available}));

  /// Adds a category; with [parentId] it is a sub-category inside that main category.
  Future<Category> createCategory(String name, {String? parentId}) => _call(() async {
        final response = await _dio.post<Map<String, dynamic>>('/api/v1/categories', data: {'name': name, 'parentId': parentId});
        return Category.fromJson(response.data!);
      });

  /// Renames a category and sets where it shows: inside [parentId], or as a main category when null.
  Future<Category> updateCategory(String id, String name, {String? parentId}) => _call(() async {
        final response = await _dio.put<Map<String, dynamic>>('/api/v1/categories/$id', data: {'name': name, 'parentId': parentId});
        return Category.fromJson(response.data!);
      });

  /// Deletes a category; its products move to [moveTo], or are deleted when [moveTo] is null.
  Future<void> deleteCategory(String id, {String? moveTo}) => _call(() => _dio.delete<void>(
        '/api/v1/categories/$id',
        queryParameters: moveTo == null ? {'deleteProducts': true} : {'moveTo': moveTo},
      ));

  Future<void> reorderCategories(List<String> ids) => _call(() => _dio.put<void>('/api/v1/categories/order', data: ids));

  /// Uploads a photo and returns its public address.
  Future<String> uploadImage(Uint8List bytes, String fileName) => _call(() async {
        final form = FormData.fromMap({'file': MultipartFile.fromBytes(bytes, filename: fileName, contentType: _contentType(fileName))});
        final response = await _dio.post<Map<String, dynamic>>('/api/v1/media', data: form);
        return response.data!['url'] as String;
      });

  /// Saves business info. [currencyCode], when given, changes what prices show in: their numbers stay the same.
  /// Every field is sent (a full update): pass the saved value for anything that should stay as it is.
  Future<Business> updateBusiness({
    required String name,
    String? whatsApp,
    String? address,
    String? instagram,
    String? email,
    String? currencyCode,
    String? phone,
    String? facebook,
    String? tikTok,
    String? snapchat,
  }) =>
      _call(() async {
        final response = await _dio.put<Map<String, dynamic>>('/api/v1/business', data: {
          'name': name,
          'whatsApp': whatsApp,
          'address': address,
          'instagram': instagram,
          'phone': phone,
          'facebook': facebook,
          'tikTok': tikTok,
          'snapchat': snapchat,
          'email': email,
          'currencyCode': ?currencyCode,
        });
        return Business.fromJson(response.data!);
      });

  static DioMediaType _contentType(String name) {
    final lower = name.toLowerCase();
    if (lower.endsWith('.png')) return DioMediaType('image', 'png');
    if (lower.endsWith('.webp')) return DioMediaType('image', 'webp');
    return DioMediaType('image', 'jpeg');
  }

  static Future<T> _call<T>(Future<T> Function() run) async {
    try {
      return await run();
    } catch (e) {
      throw ApiError.from(e);
    }
  }
}
