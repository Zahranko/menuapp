import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../menu/dashboard_screen.dart';
import 'design_controller.dart';
import 'design_models.dart';

enum _Kind { all, food, shops, services }

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

  Future<void> _choose(TemplateInfo template) async {
    final t = AppLocalizations.of(context);
    final site = ref.read(siteProvider).value;
    if (site?.templateId == template.id) {
      context.push('/design');
      return;
    }
    if (site != null && (site.isPublished || site.hasUnpublishedChanges)) {
      final ok = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(t.replaceDesignTitle(template.name)),
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
      if (mounted) showMessage(context, errorText(t, e));
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final templates = ref.watch(templatesProvider);
    final current = ref.watch(siteProvider).value?.templateId;
    return Scaffold(
      appBar: AppBar(title: Text(t.chooseTemplate)),
      body: templates.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => LoadError(error: e, onRetry: () => ref.invalidate(templatesProvider)),
        data: (all) {
          final shown = [for (final x in all) if (_kind == _Kind.all || _kindOf(x) == _kind) x];
          final labels = {
            _Kind.all: t.filterAllCount(all.length),
            _Kind.food: t.filterFood,
            _Kind.shops: t.filterShops,
            _Kind.services: t.filterServices,
          };
          return CustomScrollView(slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              sliver: SliverToBoxAdapter(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(t.templatesSub(all.length), style: TextStyle(color: BrandColors.muted)),
                  const SizedBox(height: 12),
                  Wrap(spacing: 8, runSpacing: 8, children: [
                    for (final k in _Kind.values)
                      if (k == _Kind.all || all.any((x) => _kindOf(x) == k))
                        ChoiceChip(
                          label: Text(labels[k]!),
                          selected: _kind == k,
                          showCheckmark: false,
                          selectedColor: BrandColors.primary,
                          labelStyle: TextStyle(color: _kind == k ? Colors.white : BrandColors.ink, fontWeight: FontWeight.w600),
                          onSelected: (_) => setState(() => _kind = k),
                        ),
                  ]),
                ]),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              sliver: SliverGrid.builder(
                itemCount: shown.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 16, crossAxisSpacing: 12, childAspectRatio: 0.58),
                itemBuilder: (context, i) => _TemplateCard(
                  template: shown[i],
                  current: shown[i].id == current,
                  busy: _busyId == shown[i].id,
                  onTap: _busyId == null ? () => _choose(shown[i]) : null,
                ),
              ),
            ),
          ]);
        },
      ),
    );
  }
}

class _TemplateCard extends StatelessWidget {
  const _TemplateCard({required this.template, required this.current, required this.busy, this.onTap});

  final TemplateInfo template;
  final bool current;
  final bool busy;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final placeholder = Container(
      color: BrandColors.primary2,
      alignment: Alignment.center,
      child: Text(template.numberLabel, style: TextStyle(color: BrandColors.accent, fontSize: 28, fontWeight: FontWeight.w800)),
    );
    return InkWell(
      key: Key('template-${template.id}'),
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(
          child: Container(
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: current ? BrandColors.accent : BrandColors.line, width: current ? 3 : 1),
            ),
            child: Stack(fit: StackFit.expand, children: [
              template.thumbnail == null
                  ? placeholder
                  : Image.network(template.thumbnail!, fit: BoxFit.cover, alignment: Alignment.topCenter, errorBuilder: (_, _, _) => placeholder),
              PositionedDirectional(top: 8, start: 8, child: Pill(current ? t.inUse : t.ready, color: current ? BrandColors.accent : Colors.white)),
              if (busy) Container(color: Colors.black26, alignment: Alignment.center, child: const CircularProgressIndicator()),
            ]),
          ),
        ),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(child: Text(template.name, style: TextStyle(fontWeight: FontWeight.w700, color: BrandColors.ink))),
          Text(template.numberLabel, style: TextStyle(color: BrandColors.muted, fontSize: 12)),
        ]),
        Text(template.category, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: BrandColors.muted, fontSize: 12)),
      ]),
    );
  }
}
