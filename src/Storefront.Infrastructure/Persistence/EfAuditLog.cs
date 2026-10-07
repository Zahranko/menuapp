using Storefront.Application.Abstractions;

namespace Storefront.Infrastructure.Persistence;

internal sealed class EfAuditLog(StorefrontDbContext db, ICurrentUser user, IClock clock) : IAuditLog
{
    public void Record(string action, string entityType, string? entityId) => db.AuditLog.Add(new AuditEntry
    {
        BusinessId = user.BusinessId,
        UserId = user.UserId,
        Action = action,
        EntityType = entityType,
        EntityId = entityId,
        At = clock.UtcNow,
    });
}
