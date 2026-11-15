import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/providers.dart';
import 'community_models.dart';

/// One design by its share code (null when it is gone).
final communityTemplateProvider = FutureProvider.autoDispose.family<CommunityTemplate?, String>(
  (ref, code) => ref.watch(communityRepositoryProvider).byCode(code),
);

/// The owner's publisher profile; null until they make one.
final myPublisherProvider = FutureProvider.autoDispose<Publisher?>((ref) => ref.watch(communityRepositoryProvider).myPublisher());

/// The owner's shared designs (empty without a publisher profile).
final myCommunityTemplatesProvider = FutureProvider.autoDispose<List<MyCommunityTemplate>>((ref) async {
  final publisher = await ref.watch(myPublisherProvider.future);
  return publisher == null ? const [] : ref.watch(communityRepositoryProvider).mine();
});

/// Opens the phone's share sheet with [text]. Tests replace it.
final shareTextProvider = Provider<Future<void> Function(String text)>((ref) => (text) => SharePlus.instance.share(ShareParams(text: text)));
