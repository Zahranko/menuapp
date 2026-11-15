import 'package:dio/dio.dart';

import '../../core/api/api_error.dart';
import '../design/design_models.dart';
import 'community_models.dart';

/// Community templates: the public gallery, the owner's publisher profile and shared designs, and applying a design.
/// Every method throws [ApiError] on failure.
class CommunityRepository {
  CommunityRepository(this._dio);

  final Dio _dio;

  Future<CommunityPage> browse({String sort = 'popular', String query = '', int page = 1}) => _call(() async {
        final response = await _dio.get<Map<String, dynamic>>('/api/public/v1/community/templates', queryParameters: {
          'sort': sort,
          'page': page,
          if (query.trim().isNotEmpty) 'q': query.trim(),
        });
        return CommunityPage.fromJson(response.data!);
      });

  /// One design by its share code; null when there is none.
  Future<CommunityTemplate?> byCode(String code) => _call(() async {
        try {
          final response = await _dio.get<Map<String, dynamic>>('/api/public/v1/community/templates/${Uri.encodeComponent(code)}');
          return CommunityTemplate.fromJson(Map<String, dynamic>.from(response.data!['template'] as Map));
        } on DioException catch (e) {
          if (e.response?.statusCode == 404) return null;
          rethrow;
        }
      });

  /// The owner's publisher profile, or null before they make one.
  Future<Publisher?> myPublisher() => _call(() async {
        try {
          return Publisher.fromJson((await _dio.get<Map<String, dynamic>>('/api/v1/community/publisher')).data!);
        } on DioException catch (e) {
          if (e.response?.statusCode == 404) return null;
          rethrow;
        }
      });

  Future<Publisher> savePublisher({required String username, required String displayName, String? bio}) => _call(() async => Publisher.fromJson(
      (await _dio.put<Map<String, dynamic>>('/api/v1/community/publisher', data: {'username': username, 'displayName': displayName, 'bio': bio})).data!));

  /// Whether [username] is free, with the reason when it is not.
  Future<({bool available, String? message})> usernameAvailability(String username) => _call(() async {
        final data = (await _dio.get<Map<String, dynamic>>('/api/v1/community/username-availability', queryParameters: {'username': username})).data!;
        return (available: data['available'] as bool? ?? false, message: data['message'] as String?);
      });

  Future<List<MyCommunityTemplate>> mine() => _call(() async => [
        for (final t in (await _dio.get<List<dynamic>>('/api/v1/community/templates/mine')).data!) MyCommunityTemplate.fromJson(Map<String, dynamic>.from(t as Map)),
      ]);

  /// Shares the design of the owner's current Studio draft.
  Future<MyCommunityTemplate> share({required String name, String? description, bool listed = true}) => _call(() async => MyCommunityTemplate.fromJson(
      (await _dio.post<Map<String, dynamic>>('/api/v1/community/templates', data: {'name': name, 'description': description, 'isListed': listed})).data!));

  Future<MyCommunityTemplate> update(MyCommunityTemplate item, {String? name, String? description, bool? listed, bool updateDesign = false}) => _call(() async =>
      MyCommunityTemplate.fromJson((await _dio.put<Map<String, dynamic>>('/api/v1/community/templates/${item.id}', data: {
        'name': name ?? item.template.name,
        'description': description ?? item.template.description,
        'isListed': listed ?? item.isListed,
        'updateDesign': updateDesign,
      }))
          .data!));

  Future<void> delete(MyCommunityTemplate item) => _call(() => _dio.delete<void>('/api/v1/community/templates/${item.id}'));

  /// Puts the design on the owner's draft; the live site changes on publish.
  Future<SiteInfo> apply(String code) =>
      _call(() async => SiteInfo.fromJson((await _dio.post<Map<String, dynamic>>('/api/v1/community/templates/${Uri.encodeComponent(code)}/apply')).data!));

  static Future<T> _call<T>(Future<T> Function() run) async {
    try {
      return await run();
    } catch (e) {
      throw ApiError.from(e);
    }
  }
}
