using Storefront.Application.Abstractions;
using Storefront.Application.Billing;
using Storefront.Domain.Billing;

namespace Storefront.Application.Tests;

public class ProPlanCheckerTests
{
    private static readonly Guid Biz = Guid.CreateVersion7();

    [Theory]
    [InlineData("pro", SubscriptionStatus.Active, true)]
    [InlineData("pro", SubscriptionStatus.Trialing, true)]
    [InlineData("pro", SubscriptionStatus.PastDue, true)]
    [InlineData("pro", SubscriptionStatus.Canceled, false)]
    [InlineData("basic", SubscriptionStatus.Active, false)]
    public async Task Pro_means_a_live_subscription_on_a_plan_with_custom_domains(string planCode, SubscriptionStatus status, bool expected)
    {
        var billing = new FakeBilling(Subscription.Start(Biz, planCode, status, "fake", null, null));
        Assert.Equal(expected, await new ProPlanChecker(billing).IsProAsync(Biz, CancellationToken.None));
    }

    [Fact]
    public async Task No_subscription_is_not_pro() =>
        Assert.False(await new ProPlanChecker(new FakeBilling(null)).IsProAsync(Biz, CancellationToken.None));

    private sealed class FakeBilling(Subscription? subscription) : IBillingRepository
    {
        private readonly Plan[] _plans = [Plan.Create("basic", "Basic", 5m, false), Plan.Create("pro", "Pro", 10m, true)];

        public Task<IReadOnlyList<Plan>> ListPlansAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<Plan>>(_plans);

        public Task<Plan?> GetPlanAsync(string code, CancellationToken ct) => Task.FromResult(_plans.FirstOrDefault(p => p.Code == code));

        public Task<Subscription?> GetSubscriptionAsync(Guid businessId, CancellationToken ct) =>
            Task.FromResult(subscription?.BusinessId == businessId ? subscription : null);

        public void Add(Plan plan) => throw new NotSupportedException();

        public void Add(Subscription subscription) => throw new NotSupportedException();
    }
}
