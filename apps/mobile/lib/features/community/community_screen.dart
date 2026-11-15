import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_error.dart';
import '../../core/providers.dart';
import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/logo_mark.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../design/design_controller.dart';
import '../menu/dashboard_screen.dart';
import '../plan/plan_cards.dart';
import '../plan/plan_controller.dart';
import '../plan/plan_models.dart';
import '../site/site_web_view.dart';
import 'community_controller.dart';
import 'community_models.dart';

/// The community gallery: designs Pro owners shared, most used or newest first, with search. Pasting a design code or
/// share link opens that design.
class CommunityScreen extends ConsumerStatefulWidget {
  const CommunityScreen({super.key});

  @override
  ConsumerState<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends ConsumerState<CommunityScreen> {
  final _search = TextEditingController();
  String _sort = 'popular';
  String _query = '';
  final _items = <CommunityTemplate>[];
  CommunityPage? _last;
  Object? _error;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _load(reset: true);
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load({bool reset = false}) async {
    if (_loading && !reset) return;
    setState(() {
      _loading = true;
      _error = null;
      if (reset) {
        _items.clear();
        _last = null;
      }
    });
    final sort = _sort;
    final query = _query;
    try {
      final page = await ref.read(communityRepositoryProvider).browse(sort: sort, query: query, page: reset ? 1 : (_last?.page ?? 0) + 1);
      // A newer search started while this one ran.
      if (!mounted || sort != _sort || query != _query) return;
      setState(() {
        _items.addAll(page.items);
        _last = page;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _submit(String text) {
    final code = shareCodeIn(text);
    if (code != null) {
      context.push('/community/template?code=$code');
      return;
    }
    _query = text.trim();
    _load(reset: true);
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Scaffold(
      appBar: AuthHeader(onBack: () => context.canPop() ? context.pop() : context.go('/menu'), wordmark: const BrandLockup(size: 20)),
      body: RefreshIndicator(
        onRefresh: () => _load(reset: true),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(Ui.gutter, 18, Ui.gutter, 32),
          children: [
            Text(t.communityTitle, style: Ui.display(context, 32)),
            const SizedBox(height: 10),
            Text(t.communitySub, style: TextStyle(color: BrandColors.muted, fontSize: 15.5, height: 1.45)),
            const SizedBox(height: 16),
            AppCard(
              key: const Key('communityShareYours'),
              onTap: () => context.push('/community/mine'),
              padding: const EdgeInsets.all(16),
              child: Row(children: [
                const IconTile(Icons.ios_share_rounded, size: 40),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(t.communityShareYours, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5, color: BrandColors.ink)),
                    const SizedBox(height: 2),
                    Text(t.communityShareYoursSub, style: TextStyle(color: BrandColors.muted, fontSize: 13.5, height: 1.35)),
                  ]),
                ),
                const ProBadge(),
              ]),
            ),
            const SizedBox(height: 18),
            TextField(
              key: const Key('communitySearch'),
              controller: _search,
              textInputAction: TextInputAction.search,
              onSubmitted: _submit,
              decoration: InputDecoration(
                hintText: t.communitySearchHint,
                prefixIcon: Icon(Icons.search_rounded, color: BrandColors.muted),
                suffixIcon: _query.isEmpty
                    ? null
                    : IconButton(
                        tooltip: MaterialLocalizations.of(context).deleteButtonTooltip,
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () {
                          _search.clear();
                          _submit('');
                        },
                      ),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(spacing: 8, children: [
              for (final (sort, label) in [('popular', t.communityPopular), ('new', t.communityNew)])
                ChoiceChip(
                  key: Key('communitySort-$sort'),
                  label: Text(label),
                  selected: _sort == sort,
                  side: BorderSide(color: _sort == sort ? BrandColors.primary : BrandColors.line),
                  labelStyle: TextStyle(color: _sort == sort ? Colors.white : BrandColors.ink, fontWeight: FontWeight.w600, fontSize: 13.5),
                  onSelected: (_) {
                    if (_sort == sort) return;
                    _sort = sort;
                    _load(reset: true);
                  },
                ),
            ]),
            const SizedBox(height: 16),
            if (_error != null && _items.isEmpty)
              LoadError(error: _error!, onRetry: () => _load(reset: true))
            else if (_items.isEmpty && _loading)
              const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator()))
            else if (_items.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Text(_query.isEmpty ? t.communityEmpty : t.communityEmptySearch(_query), textAlign: TextAlign.center, style: TextStyle(color: BrandColors.muted)),
              )
            else ...[
              for (final item in _items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: CommunityCard(item: item, onTap: () => context.push('/community/template?code=${item.code}')),
                ),
              if (_last?.hasMore ?? false)
                _loading ? const Center(child: CircularProgressIndicator()) : LightButton(label: t.communityLoadMore, onPressed: _load),
            ],
          ],
        ),
      ),
    );
  }
}

/// A design in a list: its colors, name, publisher and how often it was used.
class CommunityCard extends StatelessWidget {
  const CommunityCard({super.key, required this.item, this.onTap, this.trailing, this.footer});

  final CommunityTemplate item;
  final VoidCallback? onTap;
  final Widget? trailing;
  final Widget? footer;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return AppCard(
      key: Key('communityCard-${item.code}'),
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(children: [
          ColorSwatches(colors: item.colors, size: 44),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: BrandColors.ink)),
              const SizedBox(height: 2),
              Text(t.communityBy(item.publisher.displayName), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: BrandColors.muted, fontSize: 13.5)),
              const SizedBox(height: 6),
              Row(children: [
                Pill(t.communityUses(item.uses)),
                if (item.isPro) ...[const SizedBox(width: 6), const ProBadge()],
              ]),
            ]),
          ),
          ?trailing,
        ]),
        ?footer,
      ]),
    );
  }
}

/// A design's main colors as overlapping dots inside a rounded tile.
class ColorSwatches extends StatelessWidget {
  const ColorSwatches({super.key, required this.colors, this.size = 44});

  final List<Color> colors;
  final double size;

  @override
  Widget build(BuildContext context) {
    final shown = colors.isEmpty ? [BrandColors.primary, BrandColors.accent] : colors;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: shown.first, borderRadius: BorderRadius.circular(size * 0.3), border: Border.all(color: BrandColors.line)),
      alignment: AlignmentDirectional.bottomEnd,
      padding: const EdgeInsets.all(5),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        for (final c in shown.skip(1))
          Container(
            width: size * 0.32,
            height: size * 0.32,
            margin: const EdgeInsetsDirectional.only(start: 2),
            decoration: BoxDecoration(color: c, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 1.5)),
          ),
      ]),
    );
  }
}

/// One design: a live preview on a sample menu, who made it, its code, Share link and Use this design.
class CommunityTemplateScreen extends ConsumerStatefulWidget {
  const CommunityTemplateScreen({super.key, required this.code});

  final String code;

  @override
  ConsumerState<CommunityTemplateScreen> createState() => _CommunityTemplateScreenState();
}

class _CommunityTemplateScreenState extends ConsumerState<CommunityTemplateScreen> {
  bool _applying = false;

  Future<void> _use(CommunityTemplate item) async {
    final t = AppLocalizations.of(context);
    SubscriptionInfo? subscription;
    try {
      subscription = (await ref.read(planProvider.future)).subscription;
    } catch (_) {
      // Unknown plan: the API decides.
    }
    if (!mounted) return;
    final tier = item.isPro ? 'pro' : 'basic';
    if (subscription != null && !subscription.opens(tier)) {
      if (!await openTemplatePlanSheet(context, item.name, tier) || !mounted) return;
    }
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(t.communityUseTitle(item.name)),
        content: Text(t.communityUseBody),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t.cancel)),
          FilledButton(
            key: const Key('communityUseConfirm'),
            style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
            onPressed: () => Navigator.pop(context, true),
            child: Text(t.communityUseDesign),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() => _applying = true);
    try {
      final site = await ref.read(communityRepositoryProvider).apply(item.code);
      ref.read(siteProvider.notifier).replace(site);
      if (!mounted) return;
      showMessage(context, t.communityApplied);
      context.push('/design');
    } catch (e) {
      if (!mounted) return;
      if (e is ApiError && (e.code == 'template.pro' || e.code == 'template.basic')) {
        ref.invalidate(planProvider);
        await openTemplatePlanSheet(context, item.name, e.code == 'template.pro' ? 'pro' : 'basic');
      } else {
        showMessage(context, errorText(t, e));
      }
    } finally {
      if (mounted) setState(() => _applying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final template = ref.watch(communityTemplateProvider(widget.code));
    final language = Localizations.localeOf(context).languageCode;
    return Scaffold(
      appBar: AuthHeader(onBack: () => context.canPop() ? context.pop() : context.go('/community'), wordmark: const BrandLockup(size: 20)),
      body: template.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => LoadError(error: e, onRetry: () => ref.invalidate(communityTemplateProvider(widget.code))),
        data: (item) => item == null
            ? Padding(padding: const EdgeInsets.all(Ui.gutter), child: EmptyNote(title: t.communityGone, body: t.communityGoneBody))
            : ListView(
                padding: const EdgeInsets.fromLTRB(Ui.gutter, 12, Ui.gutter, 24),
                children: [
                  Text(item.name, style: Ui.display(context, 30)),
                  const SizedBox(height: 6),
                  Text(t.communityBy(item.publisher.displayName), style: TextStyle(color: BrandColors.muted, fontSize: 15)),
                  if (item.description != null) ...[
                    const SizedBox(height: 10),
                    Text(item.description!, style: TextStyle(color: BrandColors.ink, fontSize: 15, height: 1.45)),
                  ],
                  const SizedBox(height: 10),
                  Wrap(spacing: 8, runSpacing: 8, crossAxisAlignment: WrapCrossAlignment.center, children: [
                    ColorSwatches(colors: item.colors, size: 30),
                    Pill(t.communityUses(item.uses)),
                    if (item.isPro) const ProBadge(),
                    Text(t.communityCode(item.code), style: TextStyle(color: BrandColors.muted, fontSize: 12.5, fontWeight: FontWeight.w600)),
                  ]),
                  const SizedBox(height: 16),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(Ui.radius),
                    child: Container(
                      height: 480,
                      decoration: BoxDecoration(border: Border.all(color: BrandColors.line), borderRadius: BorderRadius.circular(Ui.radius)),
                      child: ref.watch(webViewBuilderProvider)(item.previewFor(language), 0),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(t.communityPreviewNote, style: TextStyle(color: BrandColors.muted, fontSize: 13, height: 1.4)),
                ],
              ),
      ),
      bottomNavigationBar: template.value == null
          ? null
          : DecoratedBox(
              decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: BrandColors.hairline))),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
                  child: Row(children: [
                    SizedBox(
                      width: 56,
                      height: 48,
                      child: Tooltip(
                        message: t.communityShare,
                        child: OutlinedButton(
                          key: const Key('communityShareLink'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: BrandColors.ink,
                            backgroundColor: Colors.white,
                            side: BorderSide(color: BrandColors.line),
                            padding: EdgeInsets.zero,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          onPressed: () => ref.read(shareTextProvider)(t.communityShareText(template.value!.name, template.value!.shareUrl)),
                          child: Icon(Icons.ios_share_rounded, size: 20, semanticLabel: t.communityShare),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: BusyButton(
                        key: const Key('communityUse'),
                        label: t.communityUseDesign,
                        busyLabel: t.communityUseDesign,
                        busy: _applying,
                        onPressed: () => _use(template.value!),
                      ),
                    ),
                  ]),
                ),
              ),
            ),
    );
  }
}
