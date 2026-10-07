namespace Storefront.Domain.Common;

public abstract class Entity
{
    public Guid Id { get; protected init; } = Guid.CreateVersion7();
}

/// <summary>An entity that records domain events. They are written to the outbox when the unit of work saves.</summary>
public abstract class AggregateRoot : Entity
{
    private readonly List<IDomainEvent> _events = [];

    public IReadOnlyList<IDomainEvent> DomainEvents => _events;

    protected void Raise(IDomainEvent domainEvent) => _events.Add(domainEvent);

    public void ClearDomainEvents() => _events.Clear();
}

/// <summary>Owned by one business. EF global query filters scope these to the current business.</summary>
public interface ITenantOwned
{
    Guid BusinessId { get; }
}

public interface IDomainEvent
{
    DateTimeOffset OccurredAt { get; }
}
