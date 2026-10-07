namespace Storefront.Domain.Common;

public enum ChangeKind
{
    Created,
    Updated,
    Deleted,
}

public sealed record ProductChanged(Guid BusinessId, Guid ProductId, ChangeKind Kind, DateTimeOffset OccurredAt) : IDomainEvent;

public sealed record CategoryChanged(Guid BusinessId, Guid CategoryId, ChangeKind Kind, DateTimeOffset OccurredAt) : IDomainEvent;

public sealed record BusinessChanged(Guid BusinessId, DateTimeOffset OccurredAt) : IDomainEvent;

public sealed record SitePublished(Guid BusinessId, Guid SiteId, string TemplateId, DateTimeOffset OccurredAt) : IDomainEvent;

public sealed record DomainActivated(Guid BusinessId, string Domain, DateTimeOffset OccurredAt) : IDomainEvent;

public sealed record DomainDeactivated(Guid BusinessId, string Domain, DateTimeOffset OccurredAt) : IDomainEvent;
