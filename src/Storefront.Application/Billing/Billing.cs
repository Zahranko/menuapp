using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Domain.Billing;
using Storefront.Domain.Domains;

namespace Storefront.Application.Billing;

public sealed record PlanDto(string Code, string Name, decimal PriceUsd, bool AllowsCustomDomain)
{
    public static PlanDto From(Plan p) => new(p.Code, p.Name, p.PriceUsd, p.AllowsCustomDomain);
}

/// <summary>The business's plan. <see cref="Status"/> is trialing, active, past_due or canceled.</summary>
public sealed record SubscriptionDto(string PlanCode, string Status, DateTimeOffset? CurrentPeriodEnd, bool AllowsCustomDomain, bool TestMode)
{
    public static string StatusName(SubscriptionStatus s) => s switch
    {
        SubscriptionStatus.Trialing => "trialing",
        SubscriptionStatus.Active => "active",
        SubscriptionStatus.PastDue => "past_due",
        _ => "canceled",
    };
}

internal static class BillingErrors
{
    public static readonly Error NoBusiness = Error.Unauthorized("auth.required", "Log in to continue.");
    public static readonly Error NotFound = Error.NotFound("subscription.notFound", "No plan found for this business.");
    public static readonly Error UnknownPlan = Error.Validation("plan.unknown", "Choose Basic or Pro.", "planCode");
}

public sealed class ListPlansHandler(IBillingRepository billing)
{
    public async Task<IReadOnlyList<PlanDto>> Handle(CancellationToken ct) =>
        (await billing.ListPlansAsync(ct)).Select(PlanDto.From).ToList();
}

public sealed class GetSubscriptionHandler(IBillingRepository billing, ICurrentUser user, IOptions<BillingOptions> options)
{
    public async Task<Result<SubscriptionDto>> Handle(CancellationToken ct)
    {
        if (user.BusinessId is not { } businessId)
        {
            return BillingErrors.NoBusiness;
        }

        var subscription = await billing.GetSubscriptionAsync(businessId, ct);
        if (subscription is null)
        {
            return BillingErrors.NotFound;
        }

        var plan = await billing.GetPlanAsync(subscription.PlanCode, ct);
        return ToDto(subscription, plan, options.Value);
    }

    internal static SubscriptionDto ToDto(Subscription s, Plan? plan, BillingOptions options) =>
        new(s.PlanCode, SubscriptionDto.StatusName(s.Status), s.CurrentPeriodEnd, s.IsLive && plan?.AllowsCustomDomain == true, options.TestMode);
}

public sealed record ChangePlan(string PlanCode);

/// <summary>Result of a plan change: either the new subscription, or a checkout page to open first.</summary>
public sealed record ChangePlanResponse(string? CheckoutUrl, SubscriptionDto Subscription);

/// <summary>
/// Moves the business to another plan through the payment provider. Leaving a plan that allows a custom domain
/// cancels the open domain request and takes the domain offline (the site stays at its usual address).
/// </summary>
public sealed class ChangePlanHandler(
    IBillingRepository billing,
    IDomainRepository domains,
    IPaymentProvider payments,
    ICurrentUser user,
    IUnitOfWork uow,
    IAuditLog audit,
    IClock clock,
    IOptions<BillingOptions> options)
{
    public async Task<Result<ChangePlanResponse>> Handle(ChangePlan cmd, CancellationToken ct)
    {
        if (user.BusinessId is not { } businessId)
        {
            return BillingErrors.NoBusiness;
        }

        var plan = await billing.GetPlanAsync((cmd.PlanCode ?? "").Trim().ToLowerInvariant(), ct);
        if (plan is null)
        {
            return BillingErrors.UnknownPlan;
        }

        var subscription = await billing.GetSubscriptionAsync(businessId, ct);
        if (subscription is null)
        {
            return BillingErrors.NotFound;
        }

        if (subscription.PlanCode == plan.Code && subscription.Status == SubscriptionStatus.Active)
        {
            return new ChangePlanResponse(null, GetSubscriptionHandler.ToDto(subscription, plan, options.Value));
        }

        var change = await payments.ChangePlanAsync(businessId, plan.Code, ct);
        if (change.CheckoutUrl is not null)
        {
            return new ChangePlanResponse(change.CheckoutUrl, GetSubscriptionHandler.ToDto(subscription, await billing.GetPlanAsync(subscription.PlanCode, ct), options.Value));
        }

        var now = clock.UtcNow;
        subscription.ChangePlan(plan.Code);
        subscription.LinkProvider(payments.Name, change.ProviderRef);
        subscription.SetStatus(SubscriptionStatus.Active, change.CurrentPeriodEnd);

        if (!plan.AllowsCustomDomain && await domains.GetOpenRequestAsync(businessId, ct) is { } request)
        {
            await DomainRequestRules.CloseAsync(request, domains, "owner", now, ct);
        }

        audit.Record("plan.changed", "Subscription", subscription.Id.ToString());
        await uow.SaveChangesAsync(ct);
        return new ChangePlanResponse(null, GetSubscriptionHandler.ToDto(subscription, plan, options.Value));
    }
}

internal static class DomainRequestRules
{
    /// <summary>Cancels a request and removes its live mapping, if any.</summary>
    public static async Task CloseAsync(DomainRequest request, IDomainRepository domains, string by, DateTimeOffset now, CancellationToken ct)
    {
        if (request.Status == DomainRequestStatus.Active && await domains.FindActiveAsync(request.Domain.Value, ct) is { } live)
        {
            domains.Remove(live);
        }

        request.Cancel(by, now);
    }
}
