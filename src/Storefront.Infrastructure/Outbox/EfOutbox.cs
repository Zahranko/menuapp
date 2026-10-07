using System.Text.Json;
using Storefront.Application.Abstractions;
using Storefront.Infrastructure.Persistence;

namespace Storefront.Infrastructure.Outbox;

internal sealed class EfOutbox(StorefrontDbContext db, IClock clock) : IOutbox
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public void Enqueue(string type, object payload) => db.OutboxMessages.Add(new OutboxMessage
    {
        Type = type,
        Payload = JsonSerializer.Serialize(payload, payload.GetType(), Json),
        OccurredAt = clock.UtcNow,
    });
}
