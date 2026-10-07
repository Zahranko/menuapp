namespace Storefront.Infrastructure.Persistence;

public sealed class AuditEntry
{
    public Guid Id { get; init; } = Guid.CreateVersion7();
    public Guid? BusinessId { get; init; }
    public Guid? UserId { get; init; }
    public required string Action { get; init; }
    public required string EntityType { get; init; }
    public string? EntityId { get; init; }
    public DateTimeOffset At { get; init; }
}
