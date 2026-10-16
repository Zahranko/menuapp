using Storefront.Application.Abstractions;

namespace Storefront.Application.Billing;

/// <summary>
/// One place that answers "is this business on a live Pro plan?": a live subscription whose plan allows a custom domain.
/// Gates custom domains and Pro templates. With Billing:TestMode every business is moved to Pro, so everything is open there.
/// </summary>
public sealed class ProPlanChecker(IBillingRepository billing)
{
    public async Task<bool> IsProAsync(Guid businessId, CancellationToken ct)
    {
        var subscription = await billing.GetSubscriptionAsync(businessId, ct);
        if (subscription is not { IsLive: true })
        {
            return false;
        }

        var plan = await billing.GetPlanAsync(subscription.PlanCode, ct);
        return plan is { AllowsCustomDomain: true };
    }
}
