import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_error.dart';
import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../menu/dashboard_screen.dart';
import '../plan/plan_cards.dart';
import '../plan/plan_controller.dart';
import 'design_controller.dart';
import 'design_models.dart';

enum _Kind { all, food, shops, services, pro }

bool _inKind(TemplateInfo t, _Kind kind) => switch (kind) {
      _Kind.all => true,
      _Kind.pro => t.isPro,
      _ => _kindOf(t) == kind,
    };

_Kind _kindOf(TemplateInfo t) {
  if (t.isService) return _Kind.services;
  if (t.category.contains('Shop') || t.category.contains('store')) return _Kind.shops;
  return _Kind.food;
}

/// The template gallery: filter chips and a two-column grid. Choosing one opens the editor.
class TemplatesScreen extends ConsumerStatefulWidget {
  const TemplatesScreen({super.key});

  @override
  ConsumerState<TemplatesScreen> createState() => _TemplatesScreenState();
}

class _TemplatesScreenState extends ConsumerState<TemplatesScreen> {
  _Kind _kind = _Kind.all;
  String? _busyId;

  /// False only when the plan is known and is not Pro; while it loads, the API decides.
  bool get _hasPro => ref.read(planProvider).value?.subscription.isPro ?? true;

  Future<void> _choose(TemplateInfo template) async {
    final t = AppLocalizations.of(context);
    final site = ref.read(siteProvider).value;
    if (site?.templateId == template.id) {
      context.push('/design');
      return;
    }
    if (template.isPro && !_hasPro) {
      // Don't ask the API: explain the Pro plan, and carry on if the owner upgrades.
      if (!await openProTemplateSheet(context, template.nameFor(context)) || !mounted) return;
    }
    if (site != null && (site.isPublished || site.hasUnpublishedChanges)) {
      final ok = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(t.replaceDesignTitle(template.nameFor(context))),
          content: Text(t.replaceDesignBody),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t.cancel)),
            FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
              onPressed: () => Navigator.pop(context, true),
              child: Text(t.useTemplate),
            ),
          ],
        ),
      );
      if (ok != true || !mounted) return;
    }
    setState(() => _busyId = template.id);
    try {
      await ref.read(siteProvider.notifier).chooseTemplate(template.id);
      if (mounted) context.push('/design');
    } catch (e) {
      if (!mounted) return;
      if (e is ApiError && e.code == 'template.pro') {
        // The plan changed since it loaded: reload it and explain.
        ref.invalidate(planProvider);
        setState(() => _busyId = null);
        await openProTemplateSheet(context, template.nameFor(context));
      } else {
        showMessage(context, errorText(t, e));
      }
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final templates = ref.watch(templatesProvider);
    final current = ref.watch(siteProvider).value?.templateId;
    final locked = ref.watch(planProvider).value?.subscription.isPro == false;
    return Scaffold(
      appBar: AuthHeader(onBack: () => context.canPop() ? context.pop() : context.go('/menu'), wordmark: const Wordmark(size: 20)),
      body: templates.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => LoadError(error: e, onRetry: () => ref.invalidate(templatesProvider)),
        data: (all) {
          final shown = [
            for (final x in all)
              if (_inKind(x, _kind)) x,
          ];
          final labels = {_Kind.all: t.filterAllCount(all.length), _Kind.food: t.filterFood, _Kind.shops: t.filterShops, _Kind.services: t.filterServices, _Kind.pro: t.planPro};
          return CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(Ui.gutter, 18, Ui.gutter, 8),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t.chooseTemplate, style: Ui.display(32)),
                      const SizedBox(height: 10),
                      Text(t.templatesSub(all.length), style: TextStyle(color: BrandColors.muted, fontSize: 15.5, height: 1.45)),
                      if (locked && all.any((x) => x.isPro)) ...[
                        const SizedBox(height: 10),
                        Row(children: [
                          Icon(Icons.workspace_premium_outlined, size: 18, color: BrandColors.muted),
                          const SizedBox(width: 8),
                          Expanded(child: Text(t.proTemplatesHint, style: TextStyle(color: BrandColors.muted, fontSize: 13.5, height: 1.4))),
                        ]),
                      ],
                      const SizedBox(height: 18),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (final k in _Kind.values)
                            if (k == _Kind.all || all.any((x) => _inKind(x, k)))
                              ChoiceChip(
                                key: Key('templateFilter-${k.name}'),
                                avatar: k == _Kind.pro
                                    ? Icon(Icons.workspace_premium_rounded, size: 16, color: _kind == k ? BrandColors.accent : BrandColors.primary)
                                    : null,
                                label: Text(labels[k]!),
                                selected: _kind == k,
                                side: BorderSide(color: _kind == k ? BrandColors.primary : BrandColors.line),
                                labelStyle: TextStyle(color: _kind == k ? Colors.white : BrandColors.ink, fontWeight: FontWeight.w600, fontSize: 13.5),
                                onSelected: (_) => setState(() => _kind = k),
                              ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(Ui.gutter, 12, Ui.gutter, 32),
                sliver: SliverGrid.builder(
                  itemCount: shown.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 20,
                    crossAxisSpacing: 14,
                    childAspectRatio: 0.56,
                  ),
                  itemBuilder: (context, i) => _TemplateCard(
                    template: shown[i],
                    current: shown[i].id == current,
                    locked: locked && shown[i].isPro,
                    busy: _busyId == shown[i].id,
                    onTap: _busyId == null ? () => _choose(shown[i]) : null,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _TemplateCard extends StatelessWidget {
  const _TemplateCard({required this.template, required this.current, required this.busy, this.locked = false, this.onTap});

  final TemplateInfo template;
  final bool current;
  final bool busy;

  /// A Pro template while the business is on Basic: tapping it explains the Pro plan.
  final bool locked;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final placeholder = DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [BrandColors.primary2, BrandColors.primary]),
      ),
      child: Center(
        child: Text(template.numberLabel, style: Ui.display(30, color: BrandColors.accent)),
      ),
    );
    return GestureDetector(
      key: Key('template-${template.id}'),
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(Ui.radius),
                boxShadow: Ui.shadow,
                border: Border.all(color: current ? BrandColors.accent : Colors.white, width: current ? 3 : 4),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(Ui.radius - 3),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    template.thumbnail == null
                        ? placeholder
                        : Image.network(template.thumbnail!, fit: BoxFit.cover, alignment: Alignment.topCenter, errorBuilder: (_, _, _) => placeholder),
                    PositionedDirectional(
                      top: 8,
                      start: 8,
                      child: Pill(current ? t.inUse : t.ready, color: current ? BrandColors.accent : Colors.white.withValues(alpha: 0.92)),
                    ),
                    if (template.isPro) PositionedDirectional(top: 8, end: 8, child: ProBadge(key: Key('proBadge-${template.id}'))),
                    if (locked)
                      PositionedDirectional(
                        bottom: 8,
                        end: 8,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.92), shape: BoxShape.circle),
                          child: Icon(Icons.lock_outline_rounded, size: 16, color: BrandColors.primary),
                        ),
                      ),
                    if (busy)
                      Container(
                        color: Colors.black26,
                        alignment: Alignment.center,
                        child: const CircularProgressIndicator(color: Colors.white),
                      ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Text(
                  template.nameFor(context),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: BrandColors.ink),
                ),
              ),
              Text(
                template.numberLabel,
                style: TextStyle(color: BrandColors.muted, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 1),
          Text(
            template.categoryFor(context),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: BrandColors.muted, fontSize: 12.5),
          ),
        ],
      ),
    );
  }
}
