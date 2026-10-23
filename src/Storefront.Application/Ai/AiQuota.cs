using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Domain.Ai;
using Storefront.Domain.Billing;

namespace Storefront.Application.Ai;

/// <summary>What the app shows before offering the AI helper: whether it is switched on and how many answers are left this month.</summary>
public sealed record AiStatusDto(bool Available, int RemainingThisMonth, int MonthlyLimit);

/// <summary>
/// The monthly allowance of AI answers per business. Trials and Basic get the Basic allowance; a live (not trialing) Pro plan gets Pro's.
/// Only successful answers are counted (<see cref="RecordAsync"/> after the answer is checked).
/// </summary>
public sealed class AiQuotaChecker(IAiAssistant assistant, IAiUsageRepository usage, IBillingRepository billing, ICurrentUser user, IOptions<AiOptions> options, IClock clock)
{
    public async Task<int> MonthlyLimitAsync(Guid businessId, CancellationToken ct)
    {
        var subscription = await billing.GetSubscriptionAsync(businessId, ct);
        var plan = subscription is { IsLive: true } && subscription.Status != SubscriptionStatus.Trialing ? subscription.PlanCode : Plan.Basic;
        var limits = options.Value.MonthlyLimit;
        if (limits.TryGetValue(plan, out var limit) || limits.TryGetValue(Plan.Basic, out limit))
        {
            return Math.Max(0, limit);
        }

        return plan == Plan.Pro ? AiOptions.DefaultProLimit : AiOptions.DefaultBasicLimit;
    }

    public async Task<int> RemainingAsync(Guid businessId, CancellationToken ct)
    {
        var limit = await MonthlyLimitAsync(businessId, ct);
        var used = await usage.CountAsync(businessId, AiUsage.PeriodOf(clock.UtcNow), ct);
        return Math.Max(0, limit - used);
    }

    /// <summary>The signed-in business when the helper may answer now, or why not: not signed in, switched off, or out of answers this month.</summary>
    public async Task<(Guid BusinessId, Error? Error)> BeginAsync(CancellationToken ct)
    {
        if (user.BusinessId is not { } businessId)
        {
            return (Guid.Empty, AiErrors.NoBusiness);
        }

        if (!assistant.IsAvailable)
        {
            return (businessId, AiErrors.Unavailable);
        }

        return await RemainingAsync(businessId, ct) > 0 ? (businessId, null) : (businessId, AiErrors.LimitReached);
    }

    /// <summary>Counts one answer and returns how many are left this month.</summary>
    public async Task<int> RecordAsync(Guid businessId, CancellationToken ct)
    {
        await usage.IncrementAsync(businessId, AiUsage.PeriodOf(clock.UtcNow), clock.UtcNow, ct);
        return await RemainingAsync(businessId, ct);
    }
}

public sealed class GetAiStatusHandler(IAiAssistant assistant, AiQuotaChecker quota, ICurrentUser user)
{
    public async Task<Result<AiStatusDto>> Handle(CancellationToken ct)
    {
        if (user.BusinessId is not { } businessId)
        {
            return AiErrors.NoBusiness;
        }

        var limit = await quota.MonthlyLimitAsync(businessId, ct);
        return new AiStatusDto(assistant.IsAvailable, assistant.IsAvailable ? await quota.RemainingAsync(businessId, ct) : 0, limit);
    }
}
