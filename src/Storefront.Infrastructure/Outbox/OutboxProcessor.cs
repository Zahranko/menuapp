using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Storefront.Application.Abstractions;
using Storefront.Domain.Common;
using Storefront.Infrastructure.Persistence;

namespace Storefront.Infrastructure.Outbox;

/// <summary>
/// Delivers outbox messages. Every content change (products, categories, business info, publish, domains) becomes one
/// revalidation per business with the tag "site:&lt;slug&gt;". Failures retry with exponential backoff and never block requests.
/// </summary>
public sealed class OutboxProcessor(StorefrontDbContext db, ISiteRevalidator revalidator, IClock clock, ILogger<OutboxProcessor> logger)
{
    public const int MaxAttempts = 10;
    public const int BatchSize = 200;

    public static readonly IReadOnlySet<string> ContentChangeTypes = new HashSet<string>
    {
        nameof(ProductChanged), nameof(CategoryChanged), nameof(BusinessChanged), nameof(SitePublished), nameof(DomainActivated), nameof(DomainDeactivated),
    };

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    /// <summary>Processes one batch. Returns how many messages were handled (delivered or scheduled for retry).</summary>
    public async Task<int> ProcessBatchAsync(CancellationToken ct)
    {
        var now = clock.UtcNow;
        var batch = await db.OutboxMessages
            .Where(m => m.ProcessedAt == null && m.Attempts < MaxAttempts && (m.NextAttemptAt == null || m.NextAttemptAt <= now))
            .OrderBy(m => m.OccurredAt)
            .Take(BatchSize)
            .ToListAsync(ct);
        if (batch.Count == 0)
        {
            return 0;
        }

        foreach (var other in batch.Where(m => !ContentChangeTypes.Contains(m.Type)))
        {
            other.ProcessedAt = now;
        }

        var byBusiness = batch.Where(m => ContentChangeTypes.Contains(m.Type)).GroupBy(BusinessIdOf);
        foreach (var group in byBusiness)
        {
            var messages = group.ToList();
            try
            {
                var tags = await TagsAsync(group.Key, messages, ct);
                if (tags.Count > 0)
                {
                    await revalidator.RevalidateAsync(tags, ct);
                }

                foreach (var message in messages)
                {
                    message.ProcessedAt = now;
                    message.LastError = null;
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Revalidation failed for business {BusinessId}; will retry", group.Key);
                foreach (var message in messages)
                {
                    message.Attempts++;
                    message.LastError = ex.Message.Length > 2000 ? ex.Message[..2000] : ex.Message;
                    message.NextAttemptAt = now + Backoff(message.Attempts);
                }
            }
        }

        await db.SaveChangesAsync(ct);
        return batch.Count;
    }

    public static TimeSpan Backoff(int attempts) => TimeSpan.FromSeconds(Math.Min(3600, 5 * Math.Pow(2, attempts - 1)));

    private static Guid BusinessIdOf(OutboxMessage message)
    {
        using var doc = JsonDocument.Parse(message.Payload);
        return doc.RootElement.TryGetProperty("businessId", out var id) && id.TryGetGuid(out var guid) ? guid : Guid.Empty;
    }

    private async Task<List<string>> TagsAsync(Guid businessId, List<OutboxMessage> messages, CancellationToken ct)
    {
        var tags = new List<string>();
        var slug = await db.Businesses.Where(b => b.Id == businessId).Select(b => b.Slug).FirstOrDefaultAsync(ct);
        if (slug is not null)
        {
            tags.Add($"site:{slug.Value}");
        }

        foreach (var message in messages.Where(m => m.Type is nameof(DomainActivated) or nameof(DomainDeactivated)))
        {
            var domain = JsonSerializer.Deserialize<DomainActivated>(message.Payload, Json)?.Domain;
            if (!string.IsNullOrEmpty(domain))
            {
                tags.Add($"host:{domain}");
            }
        }

        return tags.Distinct().ToList();
    }
}
