import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import 'plan_models.dart';

final planProvider = AsyncNotifierProvider<PlanController, PlanState>(PlanController.new);

/// The plan and custom domain cards in Settings.
class PlanController extends AsyncNotifier<PlanState> {
  @override
  Future<PlanState> build() => ref.watch(planRepositoryProvider).load();

  Future<void> _reload() async => state = AsyncData(await ref.read(planRepositoryProvider).load());

  /// Returns a checkout page to open when the provider needs payment first, otherwise null.
  Future<String?> changePlan(String planCode) async {
    final change = await ref.read(planRepositoryProvider).changePlan(planCode);
    await _reload();
    return change.checkoutUrl;
  }

  Future<void> requestDomain(String domain) async {
    await ref.read(planRepositoryProvider).requestDomain(domain);
    await _reload();
  }

  Future<void> cancelDomainRequest() async {
    await ref.read(planRepositoryProvider).cancelDomainRequest();
    await _reload();
  }
}
