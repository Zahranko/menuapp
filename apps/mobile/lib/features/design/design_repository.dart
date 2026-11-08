import 'package:dio/dio.dart';

import '../../core/api/api_error.dart';
import 'design_models.dart';

/// Templates and the owner's site design. Every method throws [ApiError] on failure.
class DesignRepository {
  DesignRepository(this._dio);

  final Dio _dio;

  Future<List<TemplateInfo>> templates() => _call(() async {
        final response = await _dio.get<List<dynamic>>('/api/v1/templates');
        return [for (final t in response.data!) TemplateInfo.fromJson(t as Map<String, dynamic>)]..sort((a, b) => a.number.compareTo(b.number));
      });

  Future<SiteInfo> site() => _call(() async => SiteInfo.fromJson((await _dio.get<Map<String, dynamic>>('/api/v1/site')).data!));

  /// Switches template; the draft resets to the template's defaults. The live site changes on publish.
  Future<SiteInfo> chooseTemplate(String templateId) => _call(() async =>
      SiteInfo.fromJson((await _dio.put<Map<String, dynamic>>('/api/v1/site/template', data: {'templateId': templateId})).data!));

  Future<SiteInfo> saveDraft(Map<String, dynamic> settings) => _call(() async =>
      SiteInfo.fromJson((await _dio.put<Map<String, dynamic>>('/api/v1/site/draft', data: {'settings': settings})).data!));

  Future<SiteInfo> publish() => _call(() async => SiteInfo.fromJson((await _dio.post<Map<String, dynamic>>('/api/v1/site/publish')).data!));

  /// An address that shows the draft for 30 minutes.
  Future<String> previewUrl() => _call(() async =>
      (await _dio.post<Map<String, dynamic>>('/api/v1/site/preview-token')).data!['previewUrl'] as String);

  static Future<T> _call<T>(Future<T> Function() run) async {
    try {
      return await run();
    } catch (e) {
      throw ApiError.from(e);
    }
  }
}
