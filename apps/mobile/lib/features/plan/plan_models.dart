/// A plan (`PlanDto`): Basic or Pro.
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

  bool get isPro => planCode == 'pro';
}

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
