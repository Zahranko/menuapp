using Storefront.Application.Abstractions;

namespace Storefront.Infrastructure.Billing;

/// <summary>
/// Stands in until the payment provider is chosen (decisions D5 and D8): every plan change applies at once,
/// for a month, without charging anyone.
/// </summary>
internal sealed class FakePaymentProvider(IClock clock) : IPaymentProvider
{
    public string Name => "fake";

    public Task<PlanChangeResult> ChangePlanAsync(Guid businessId, string planCode, CancellationToken ct) =>
        Task.FromResult(new PlanChangeResult(null, $"fake_{businessId:N}", clock.UtcNow.AddMonths(1)));
}
