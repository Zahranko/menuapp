import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart' show DateFormat;
import 'package:url_launcher/url_launcher.dart';

import '../../core/api/api_error.dart';
import '../../core/theme.dart';
import '../../core/widgets/form_widgets.dart';
import '../../core/widgets/ui.dart';
import '../../l10n/generated/app_localizations.dart';
import '../auth/auth_controller.dart';
import 'plan_controller.dart';
import 'plan_models.dart';

/// Basic and Pro side by side; tapping the other plan opens the upgrade or downgrade sheet.
class PlanCard extends ConsumerWidget {
  const PlanCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    final link = auth is SignedIn ? auth.business.displayUrl : '';
    return ref.watch(planProvider).when(
          loading: () => SectionCard(title: t.plan, children: const [LinearProgressIndicator()]),
          error: (e, _) => SectionCard(title: t.plan, children: [
            Text(errorText(t, e), style: TextStyle(color: BrandColors.muted)),
            const SizedBox(height: 8),
            LightButton(label: t.tryAgain, onPressed: () => ref.invalidate(planProvider)),
          ]),
          data: (state) {
            final sub = state.subscription;
            return SectionCard(
              title: t.plan,
              subtitle: sub.testMode ? t.testModeNote : (sub.status == 'trialing' && sub.currentPeriodEnd != null ? t.trialUntil(_date(context, sub.currentPeriodEnd!)) : null),
              children: [
                Row(children: [
                  for (final (i, plan) in state.plans.indexed) ...[
                    if (i > 0) const SizedBox(width: 10),
                    Expanded(
                      child: _PlanTile(
                        plan: plan,
                        current: plan.code == sub.planCode,
                        detail: plan.allowsCustomDomain ? t.proDetail : link,
                        onTap: plan.code == sub.planCode ? null : () => openPlanSheet(context, plan, state.domainRequest),
                      ),
                    ),
                  ],
                ]),
              ],
            );
          },
        );
  }
}

String _date(BuildContext context, DateTime d) => DateFormat.MMMd(Localizations.localeOf(context).toLanguageTag()).format(d.toLocal());

class _PlanTile extends StatelessWidget {
  const _PlanTile({required this.plan, required this.current, required this.detail, this.onTap});

  final PlanInfo plan;
  final bool current;
  final String detail;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final name = plan.code == 'pro' ? t.planPro : t.planBasic;
    return Semantics(
      button: onTap != null,
      selected: current,
      child: InkWell(
        key: Key('plan-${plan.code}'),
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: current ? BrandColors.primary : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: current ? BrandColors.primary : BrandColors.line),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(current ? t.planCurrent(name) : name, style: TextStyle(color: current ? BrandColors.accent : BrandColors.muted, fontSize: 12.5, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text.rich(TextSpan(children: [
              TextSpan(text: plan.price, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: current ? Colors.white : BrandColors.ink)),
              TextSpan(text: ' ${t.perMonth}', style: TextStyle(color: current ? Colors.white70 : BrandColors.muted)),
            ])),
            const SizedBox(height: 4),
            Text(detail, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: current ? Colors.white70 : BrandColors.muted)),
          ]),
        ),
      ),
    );
  }
}

/// The upgrade or downgrade confirmation. Downgrading warns that the domain request is cancelled.
Future<void> openPlanSheet(BuildContext context, PlanInfo plan, DomainRequestInfo? domain) async {
  final message = await showFormSheet<String>(context, (_) => _PlanSheet(plan: plan, domain: domain));
  if (message != null && context.mounted) showMessage(context, message);
}

class _PlanSheet extends ConsumerStatefulWidget {
  const _PlanSheet({required this.plan, this.domain});

  final PlanInfo plan;
  final DomainRequestInfo? domain;

  @override
  ConsumerState<_PlanSheet> createState() => _PlanSheetState();
}

class _PlanSheetState extends ConsumerState<_PlanSheet> {
  bool _busy = false;

  Future<void> _confirm() async {
    final t = AppLocalizations.of(context);
    setState(() => _busy = true);
    try {
      final checkout = await ref.read(planProvider.notifier).changePlan(widget.plan.code);
      if (checkout != null) {
        await launchUrl(Uri.parse(checkout), mode: LaunchMode.externalApplication);
        if (mounted) Navigator.pop(context, t.finishPayment);
        return;
      }
      if (mounted) Navigator.pop(context, widget.plan.code == 'pro' ? t.nowOnPro : t.nowOnBasic);
    } catch (e) {
      if (mounted) showMessage(context, errorText(t, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final up = widget.plan.allowsCustomDomain;
    final price = widget.plan.price;
    var body = up ? t.upgradeBody(price) : t.downgradeBody(price);
    if (!up && widget.domain != null) body = '$body ${t.downgradeDomain(widget.domain!.domain)}';
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text(up ? t.upgradeToPro : t.switchToBasic, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: BrandColors.ink)),
      const SizedBox(height: 6),
      Text(body, style: TextStyle(color: BrandColors.muted, height: 1.4)),
      const SizedBox(height: 18),
      FilledButton(
        key: const Key('confirmPlan'),
        style: up ? FilledButton.styleFrom(backgroundColor: BrandColors.accent, foregroundColor: BrandColors.primary) : null,
        onPressed: _busy ? null : _confirm,
        child: _busy ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : Text(up ? t.upgradeFor(price) : t.switchToBasic),
      ),
      const SizedBox(height: 10),
      LightButton(label: t.notNow, onPressed: () => Navigator.pop(context)),
    ]);
  }
}

/// Locked on Basic; on Pro a request form, then the four progress steps.
class DomainCard extends ConsumerStatefulWidget {
  const DomainCard({super.key});

  @override
  ConsumerState<DomainCard> createState() => _DomainCardState();
}

class _DomainCardState extends ConsumerState<DomainCard> {
  final _domain = TextEditingController();
  String? _error;
  bool _busy = false;

  @override
  void dispose() {
    _domain.dispose();
    super.dispose();
  }

  /// "https://www.Example.com/menu" becomes "www.example.com"; returns null when it isn't a domain.
  static String? normalize(String input) {
    final v = input.trim().toLowerCase().replaceFirst(RegExp(r'^https?://'), '').replaceFirst(RegExp(r'/.*$'), '');
    return RegExp(r'^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$').hasMatch(v) ? v : null;
  }

  Future<void> _send() async {
    final t = AppLocalizations.of(context);
    final value = normalize(_domain.text);
    if (value == null) return setState(() => _error = _domain.text.trim().isEmpty ? t.errDomainEmpty : t.errDomainFormat);
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(planProvider.notifier).requestDomain(value);
      _domain.clear();
      if (mounted) showMessage(context, t.domainRequestSent);
    } on ApiError catch (e) {
      if (mounted) setState(() => _error = e.field('domain') ?? errorText(t, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _cancel() async {
    final t = AppLocalizations.of(context);
    setState(() => _busy = true);
    try {
      await ref.read(planProvider.notifier).cancelDomainRequest();
      if (mounted) showMessage(context, t.domainRequestCancelled);
    } catch (e) {
      if (mounted) showMessage(context, errorText(t, e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final state = ref.watch(planProvider).value;
    if (state == null) return const SizedBox.shrink();
    final pro = state.subscription.allowsCustomDomain;
    final request = state.domainRequest;
    final auth = ref.watch(authControllerProvider);
    final example = '${auth is SignedIn ? auth.business.slug : 'yourname'}.com';

    if (!pro) {
      final proPlan = state.plans.where((p) => p.allowsCustomDomain).firstOrNull;
      return SectionCard(title: t.customDomain, badge: Pill(t.planPro), subtitle: t.domainLocked(example), children: [
        if (proPlan != null)
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: BrandColors.accent, foregroundColor: BrandColors.primary),
            onPressed: () => openPlanSheet(context, proPlan, null),
            child: Text(t.upgradeToPro),
          ),
      ]);
    }

    if (request == null) {
      return SectionCard(title: t.customDomain, subtitle: t.domainEnterBody, children: [
        LabeledField(
          fieldKey: const Key('domainField'),
          label: t.yourDomain,
          hint: example,
          controller: _domain,
          error: _error,
          keyboardType: TextInputType.url,
          textInputAction: TextInputAction.done,
          onChanged: (_) => setState(() => _error = null),
        ),
        const SizedBox(height: 12),
        BusyButton(label: t.sendToSupport, busyLabel: t.sending, busy: _busy, onPressed: _send),
      ]);
    }

    final steps = [t.domainStep1, t.domainStep2, t.domainStep3, t.domainStep4(request.domain)];
    return SectionCard(
      title: t.customDomain,
      subtitle: t.domainRequested(request.domain, _date(context, request.createdAt)),
      children: [
        for (final (i, step) in steps.indexed)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 5),
            child: Row(children: [
              CircleAvatar(
                radius: 12,
                backgroundColor: i + 1 < request.step ? BrandColors.primary : (i + 1 == request.step ? BrandColors.accent : BrandColors.line),
                child: i + 1 < request.step
                    ? const Icon(Icons.check, size: 14, color: Colors.white)
                    : Text('${i + 1}', style: TextStyle(fontSize: 12, color: BrandColors.ink, fontWeight: FontWeight.w700)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(step,
                    style: TextStyle(color: i + 1 <= request.step ? BrandColors.ink : BrandColors.muted, fontWeight: i + 1 == request.step ? FontWeight.w700 : FontWeight.w400)),
              ),
            ]),
          ),
        if (request.status == 'awaiting_dns' && request.dnsTarget.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(t.dnsHint(request.dnsTarget), style: TextStyle(color: BrandColors.muted)),
        ],
        if (request.staffNote != null && request.staffNote!.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(request.staffNote!, style: TextStyle(color: BrandColors.muted, fontStyle: FontStyle.italic)),
        ],
        const SizedBox(height: 12),
        LightButton(label: t.cancelRequest, danger: true, onPressed: _busy ? null : _cancel),
      ],
    );
  }
}
