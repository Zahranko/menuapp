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
        final categories = [for (final c in responses[0].data!) Category.fromJson(c as Map<String, dynamic>)]
          ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
        final order = {for (final (i, c) in categories.indexed) c.id: i};
        final products = [for (final p in responses[1].data!) Product.fromJson(p as Map<String, dynamic>)]
          ..sort((a, b) {
            final byCategory = (order[a.categoryId] ?? 0).compareTo(order[b.categoryId] ?? 0);
            return byCategory != 0 ? byCategory : a.sortOrder.compareTo(b.sortOrder);
          });
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

  Future<Category> createCategory(String name) => _call(() async {
        final response = await _dio.post<Map<String, dynamic>>('/api/v1/categories', data: {'name': name});
        return Category.fromJson(response.data!);
      });

  Future<Category> renameCategory(String id, String name) => _call(() async {
        final response = await _dio.put<Map<String, dynamic>>('/api/v1/categories/$id', data: {'name': name});
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

  Future<Business> updateBusiness({required String name, String? whatsApp, String? address, String? instagram, String? email}) =>
      _call(() async {
        final response = await _dio.put<Map<String, dynamic>>('/api/v1/business', data: {
          'name': name,
          'whatsApp': whatsApp,
          'address': address,
          'instagram': instagram,
          'email': email,
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
