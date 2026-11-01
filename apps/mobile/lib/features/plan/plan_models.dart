/// A plan (`PlanDto`): Lite, Basic or Pro.
class PlanInfo {
  const PlanInfo({required this.code, required this.name, required this.priceUsd, required this.allowsCustomDomain});

  factory PlanInfo.fromJson(Map<String, dynamic> json) => PlanInfo(
        code: json['code'] as String,
        name: json['name'] as String,
        priceUsd: (json['priceUsd'] as num).toDouble(),
        allowsCustomDomain: json['allowsCustomDomain'] as bool? ?? false,
      );

  final String code;
  final String name;
  final double priceUsd;
  final bool allowsCustomDomain;

  /// Lite 0, Basic 1, Pro 2; an unknown code counts as Basic.
  int get rank => planRank(code);

  String get price => priceUsd == priceUsd.roundToDouble() ? '\$${priceUsd.toStringAsFixed(0)}' : '\$${priceUsd.toStringAsFixed(2)}';
}

/// The business's subscription (`SubscriptionDto`). [testMode] is true on test servers where every account is Pro.
class SubscriptionInfo {
  const SubscriptionInfo({required this.planCode, required this.status, this.currentPeriodEnd, required this.allowsCustomDomain, this.testMode = false});

  factory SubscriptionInfo.fromJson(Map<String, dynamic> json) => SubscriptionInfo(
        planCode: json['planCode'] as String,
        status: json['status'] as String,
        currentPeriodEnd: json['currentPeriodEnd'] == null ? null : DateTime.parse(json['currentPeriodEnd'] as String),
        allowsCustomDomain: json['allowsCustomDomain'] as bool? ?? false,
        testMode: json['testMode'] as bool? ?? false,
      );

  final String planCode;

  /// trialing, active, past_due or canceled.
  final String status;
  final DateTime? currentPeriodEnd;
  final bool allowsCustomDomain;
  final bool testMode;

  /// Pro features (custom domain, Pro templates) are unlocked.
  bool get isPro => planCode == 'pro' || allowsCustomDomain;

  /// What the plan opens: Lite 0, Basic 1 (also trials), Pro 2. A canceled plan counts as Basic, as on the server.
  int get rank => isPro ? 2 : (status == 'canceled' ? 1 : planRank(planCode));

  /// Whether a template of [tier] ("lite", "basic" or "pro") can be chosen and published.
  bool opens(String tier) => planRank(tier) <= rank;
}

/// Lite 0, Basic 1, Pro 2, for plan codes and template tiers alike.
int planRank(String code) => switch (code) {
      'lite' => 0,
      'pro' => 2,
      _ => 1,
    };

/// A custom domain request (`DomainRequestDto`).
class DomainRequestInfo {
  const DomainRequestInfo({required this.domain, required this.status, required this.createdAt, this.staffNote, this.dnsTarget = ''});

  factory DomainRequestInfo.fromJson(Map<String, dynamic> json) => DomainRequestInfo(
        domain: json['domain'] as String,
        status: json['status'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        staffNote: json['staffNote'] as String?,
        dnsTarget: json['dnsTarget'] as String? ?? '',
      );

  final String domain;

  /// requested, awaiting_dns, verifying, active, rejected or cancelled.
  final String status;
  final DateTime createdAt;
  final String? staffNote;
  final String dnsTarget;

  /// How far along the four steps of the prototype it is: 1 sent, 2 support emails DNS steps, 3 you add the record, 4 live.
  int get step => switch (status) {
        'requested' => 2,
        'awaiting_dns' || 'verifying' => 3,
        'active' => 5,
        _ => 1,
      };
}

/// Everything the plan and domain cards show.
class PlanState {
  const PlanState({required this.plans, required this.subscription, this.domainRequest});

  final List<PlanInfo> plans;
  final SubscriptionInfo subscription;
  final DomainRequestInfo? domainRequest;
}
