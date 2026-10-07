using Storefront.Domain.Common;

namespace Storefront.Domain.Domains;

public enum DomainRequestStatus
{
    Requested,
    AwaitingDns,
    Verifying,
    Active,
    Rejected,
    Cancelled,
}

/// <summary>A Pro owner's request for their own domain, handled by support staff.</summary>
public sealed class DomainRequest : AggregateRoot, ITenantOwned
{
    private static readonly Dictionary<DomainRequestStatus, DomainRequestStatus[]> Allowed = new()
    {
        [DomainRequestStatus.Requested] = [DomainRequestStatus.AwaitingDns, DomainRequestStatus.Rejected, DomainRequestStatus.Cancelled],
        [DomainRequestStatus.AwaitingDns] = [DomainRequestStatus.Verifying, DomainRequestStatus.Rejected, DomainRequestStatus.Cancelled],
        [DomainRequestStatus.Verifying] = [DomainRequestStatus.Active, DomainRequestStatus.AwaitingDns, DomainRequestStatus.Cancelled],
        [DomainRequestStatus.Active] = [DomainRequestStatus.Cancelled],
        [DomainRequestStatus.Rejected] = [],
        [DomainRequestStatus.Cancelled] = [],
    };

    private DomainRequest()
    {
    }

    public Guid BusinessId { get; private set; }
    public DomainName Domain { get; private set; } = null!;
    public DomainRequestStatus Status { get; private set; }
    public string? StaffNote { get; private set; }
    public string? HandledBy { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public DateTimeOffset? ActivatedAt { get; private set; }

    public bool IsOpen => Status is not (DomainRequestStatus.Rejected or DomainRequestStatus.Cancelled);

    public static DomainRequest Create(Guid businessId, DomainName domain, DateTimeOffset now) => new()
    {
        BusinessId = businessId,
        Domain = domain,
        Status = DomainRequestStatus.Requested,
        CreatedAt = now,
        UpdatedAt = now,
    };

    public bool CanMoveTo(DomainRequestStatus next) => Allowed[Status].Contains(next);

    public void SendDnsInstructions(string staff, string? note, DateTimeOffset now) => MoveTo(DomainRequestStatus.AwaitingDns, staff, note, now);

    public void StartVerifying(DateTimeOffset now) => MoveTo(DomainRequestStatus.Verifying, HandledBy, StaffNote, now);

    public void VerificationFailed(string? note, DateTimeOffset now) => MoveTo(DomainRequestStatus.AwaitingDns, HandledBy, note, now);

    public void Activate(DateTimeOffset now)
    {
        MoveTo(DomainRequestStatus.Active, HandledBy, StaffNote, now);
        ActivatedAt = now;
        Raise(new DomainActivated(BusinessId, Domain.Value, now));
    }

    public void Reject(string staff, string note, DateTimeOffset now) => MoveTo(DomainRequestStatus.Rejected, staff, note, now);

    public void Cancel(string? by, DateTimeOffset now)
    {
        var wasActive = Status == DomainRequestStatus.Active;
        MoveTo(DomainRequestStatus.Cancelled, by ?? HandledBy, StaffNote, now);
        if (wasActive)
        {
            Raise(new DomainDeactivated(BusinessId, Domain.Value, now));
        }
    }

    private void MoveTo(DomainRequestStatus next, string? staff, string? note, DateTimeOffset now)
    {
        if (!CanMoveTo(next))
        {
            throw new DomainException("domainRequest.transition", $"A request that is {Status} cannot become {next}.", "status");
        }

        Status = next;
        HandledBy = staff;
        StaffNote = note;
        UpdatedAt = now;
    }
}
