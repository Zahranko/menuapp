import 'package:dio/dio.dart';

import '../../core/api/api_error.dart';
import 'plan_models.dart';

/// What a plan change returned: a page to pay on first, or the new subscription.
class PlanChange {
  const PlanChange({this.checkoutUrl, required this.subscription});

  final String? checkoutUrl;
  final SubscriptionInfo subscription;
}

/// Plans, the subscription and the custom domain request. Every method throws [ApiError] on failure.
class PlanRepository {
  PlanRepository(this._dio);

  final Dio _dio;

  Future<PlanState> load() => _call(() async {
        final responses = await Future.wait([
          _dio.get<dynamic>('/api/v1/plans'),
          _dio.get<dynamic>('/api/v1/subscription'),
          _dio.get<dynamic>('/api/v1/domain-request'),
        ]);
        final domain = responses[2].data;
        return PlanState(
          plans: [for (final p in responses[0].data as List) PlanInfo.fromJson(p as Map<String, dynamic>)],
          subscription: SubscriptionInfo.fromJson(responses[1].data as Map<String, dynamic>),
          domainRequest: domain is Map<String, dynamic> ? DomainRequestInfo.fromJson(domain) : null,
        );
      });

  Future<PlanChange> changePlan(String planCode) => _call(() async {
        final response = await _dio.post<Map<String, dynamic>>('/api/v1/subscription/change', data: {'planCode': planCode});
        return PlanChange(
          checkoutUrl: response.data!['checkoutUrl'] as String?,
          subscription: SubscriptionInfo.fromJson(response.data!['subscription'] as Map<String, dynamic>),
        );
      });

  Future<DomainRequestInfo> requestDomain(String domain) => _call(() async =>
      DomainRequestInfo.fromJson((await _dio.post<Map<String, dynamic>>('/api/v1/domain-request', data: {'domain': domain})).data!));

  Future<void> cancelDomainRequest() => _call(() => _dio.delete<void>('/api/v1/domain-request'));

  static Future<T> _call<T>(Future<T> Function() run) async {
    try {
      return await run();
    } catch (e) {
      throw ApiError.from(e);
    }
  }
}
