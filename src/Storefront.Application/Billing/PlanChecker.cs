using Storefront.Application.Abstractions;
using Storefront.Domain.Billing;
using Storefront.Domain.Templates;

namespace Storefront.Application.Billing;

/// <summary>
/// One place that answers what a business's plan opens. Pro: a live subscription whose plan allows a custom domain
/// (custom domains and Pro templates). Basic templates are closed only to a live Lite plan; Lite templates are open to everyone.
/// With Billing:TestMode every business is moved to Pro, so everything is open there.
/// </summary>
public sealed class PlanChecker(IBillingRepository billing)
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

    public async Task<bool> CanUseTemplateAsync(Guid businessId, Template template, CancellationToken ct)
    {
        switch (template.Tier)
        {
            case TemplateTier.Lite:
                return true;
            case TemplateTier.Pro:
                return await IsProAsync(businessId, ct);
            default:
                var subscription = await billing.GetSubscriptionAsync(businessId, ct);
                return subscription is not { IsLive: true } || Plan.RankOf(subscription.PlanCode) >= TemplateTier.RankOf(TemplateTier.Basic);
        }
    }
}
