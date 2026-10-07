using Storefront.Domain.Common;

namespace Storefront.Domain.Billing;

public enum SubscriptionStatus
{
    Trialing,
    Active,
    PastDue,
    Canceled,
}

public sealed class Subscription : AggregateRoot, ITenantOwned
{
    private Subscription()
    {
    }

    public Guid BusinessId { get; private set; }
    public string PlanCode { get; private set; } = Plan.Basic;
    public SubscriptionStatus Status { get; private set; }
    public string Provider { get; private set; } = "";
    public string? ProviderRef { get; private set; }
    public DateTimeOffset? CurrentPeriodEnd { get; private set; }

    public bool IsLive => Status is SubscriptionStatus.Trialing or SubscriptionStatus.Active or SubscriptionStatus.PastDue;

    public static Subscription Start(Guid businessId, string planCode, SubscriptionStatus status, string provider, string? providerRef, DateTimeOffset? currentPeriodEnd) => new()
    {
        BusinessId = businessId,
        PlanCode = planCode,
        Status = status,
        Provider = provider,
        ProviderRef = providerRef,
        CurrentPeriodEnd = currentPeriodEnd,
    };

    public void ChangePlan(string planCode) => PlanCode = planCode;

    public void SetStatus(SubscriptionStatus status, DateTimeOffset? currentPeriodEnd)
    {
        Status = status;
        CurrentPeriodEnd = currentPeriodEnd;
    }

    public void LinkProvider(string provider, string? providerRef)
    {
        Provider = provider;
        ProviderRef = providerRef;
    }
}
