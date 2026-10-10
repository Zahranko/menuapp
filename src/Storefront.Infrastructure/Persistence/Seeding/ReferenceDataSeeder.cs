using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Storefront.Application.Common;
using Storefront.Domain.Billing;

namespace Storefront.Infrastructure.Persistence.Seeding;

/// <summary>
/// Data every environment needs: the two plans. With Billing:TestMode on, it also moves every business to an
/// active Pro plan so test accounts can use every feature. Safe to run any number of times.
/// </summary>
public sealed class ReferenceDataSeeder(StorefrontDbContext db, IOptions<BillingOptions> billing, ILogger<ReferenceDataSeeder> logger)
{
    public async Task SeedAsync(CancellationToken ct)
    {
        await SeedPlansAsync(ct);
        if (billing.Value.TestMode)
        {
            await GrantProAsync(ct);
        }
    }

    private async Task SeedPlansAsync(CancellationToken ct)
    {
        var plans = await db.Plans.ToDictionaryAsync(p => p.Code, ct);
        Upsert(Plan.Basic, "Basic", 5m, false);
        Upsert(Plan.Pro, "Pro", 10m, true);
        await db.SaveChangesAsync(ct);

        void Upsert(string code, string name, decimal price, bool customDomain)
        {
            if (plans.TryGetValue(code, out var plan))
            {
                plan.Update(name, price, customDomain);
            }
            else
            {
                db.Plans.Add(Plan.Create(code, name, price, customDomain));
            }
        }
    }

    private async Task GrantProAsync(CancellationToken ct)
    {
        var subscriptions = await db.Subscriptions.IgnoreQueryFilters()
            .Where(s => s.PlanCode != Plan.Pro || s.Status != SubscriptionStatus.Active)
            .ToListAsync(ct);
        foreach (var subscription in subscriptions)
        {
            subscription.ChangePlan(Plan.Pro);
            subscription.LinkProvider("test", null);
            subscription.SetStatus(SubscriptionStatus.Active, null);
        }

        await db.SaveChangesAsync(ct);
        if (subscriptions.Count > 0)
        {
            logger.LogInformation("Billing test mode: moved {Count} businesses to an active Pro plan", subscriptions.Count);
        }
    }
}
