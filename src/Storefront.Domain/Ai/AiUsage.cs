using Storefront.Domain.Common;

namespace Storefront.Domain.Ai;

/// <summary>
/// How many AI helper answers a business got in one calendar month (UTC). One row per business and month;
/// only answers that reached the owner count, so failed or refused calls are free.
/// </summary>
public sealed class AiUsage : Entity, ITenantOwned
{
    private AiUsage()
    {
    }

    public Guid BusinessId { get; private set; }

    /// <summary>The month as "yyyy-MM", like "2026-10".</summary>
    public string Period { get; private set; } = "";

    public int Count { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    /// <summary>The first answer of a month.</summary>
    public static AiUsage Start(Guid businessId, string period, DateTimeOffset now) =>
        new() { BusinessId = businessId, Period = period, Count = 1, UpdatedAt = now };

    /// <summary>The month of <paramref name="now"/> in UTC, as stored in <see cref="Period"/>.</summary>
    public static string PeriodOf(DateTimeOffset now)
    {
        var utc = now.ToUniversalTime();
        return $"{utc.Year:D4}-{utc.Month:D2}";
    }
}
