import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import 'design_models.dart';

/// The template gallery, loaded once per session.
final templatesProvider = FutureProvider<List<TemplateInfo>>((ref) => ref.watch(designRepositoryProvider).templates());

final siteProvider = AsyncNotifierProvider<SiteController, SiteInfo>(SiteController.new);

/// The owner's site design: chosen template, draft settings and whether it is published.
class SiteController extends AsyncNotifier<SiteInfo> {
  @override
  Future<SiteInfo> build() => ref.watch(designRepositoryProvider).site();

  Future<void> chooseTemplate(String templateId) async =>
      state = AsyncData(await ref.read(designRepositoryProvider).chooseTemplate(templateId));

  Future<void> saveDraft(Map<String, dynamic> settings) async =>
      state = AsyncData(await ref.read(designRepositoryProvider).saveDraft(settings));

  Future<void> publish() async => state = AsyncData(await ref.read(designRepositoryProvider).publish());
}
