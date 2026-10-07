using Storefront.Domain.Common;
using Storefront.Domain.Domains;

namespace Storefront.Domain.Tests;

public class DomainRequestTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 9, 0, 0, TimeSpan.Zero);

    private static DomainRequest NewRequest() => DomainRequest.Create(Guid.CreateVersion7(), DomainName.Create("vanillamenu.com"), Now);

    [Fact]
    public void Happy_path_ends_active_and_raises_DomainActivated()
    {
        var request = NewRequest();
        request.SendDnsInstructions("staff@example.com", "Sent CNAME steps", Now);
        request.StartVerifying(Now);
        request.Activate(Now.AddHours(1));

        Assert.Equal(DomainRequestStatus.Active, request.Status);
        Assert.Equal(Now.AddHours(1), request.ActivatedAt);
        var e = Assert.IsType<DomainActivated>(Assert.Single(request.DomainEvents));
        Assert.Equal("vanillamenu.com", e.Domain);
    }

    [Fact]
    public void Failed_verification_goes_back_to_awaiting_dns()
    {
        var request = NewRequest();
        request.SendDnsInstructions("staff@example.com", null, Now);
        request.StartVerifying(Now);
        request.VerificationFailed("CNAME not found", Now);
        Assert.Equal(DomainRequestStatus.AwaitingDns, request.Status);
        Assert.Equal("CNAME not found", request.StaffNote);
    }

    [Fact]
    public void Cannot_activate_without_verifying()
    {
        var request = NewRequest();
        var ex = Assert.Throws<DomainException>(() => request.Activate(Now));
        Assert.Equal("domainRequest.transition", ex.Code);
    }

    [Fact]
    public void Rejected_and_cancelled_are_final()
    {
        var rejected = NewRequest();
        rejected.Reject("staff@example.com", "Not your domain", Now);
        Assert.Throws<DomainException>(() => rejected.SendDnsInstructions("staff@example.com", null, Now));
        Assert.False(rejected.IsOpen);

        var cancelled = NewRequest();
        cancelled.Cancel(null, Now);
        Assert.Throws<DomainException>(() => cancelled.Cancel(null, Now));
    }

    [Fact]
    public void Cancelling_an_active_domain_raises_DomainDeactivated()
    {
        var request = NewRequest();
        request.SendDnsInstructions("staff@example.com", null, Now);
        request.StartVerifying(Now);
        request.Activate(Now);
        request.ClearDomainEvents();
        request.Cancel("owner", Now);
        Assert.IsType<DomainDeactivated>(Assert.Single(request.DomainEvents));
    }

    [Theory]
    [InlineData(DomainRequestStatus.Requested, DomainRequestStatus.Active, false)]
    [InlineData(DomainRequestStatus.Requested, DomainRequestStatus.AwaitingDns, true)]
    [InlineData(DomainRequestStatus.Requested, DomainRequestStatus.Verifying, false)]
    public void CanMoveTo_follows_the_transition_table(DomainRequestStatus from, DomainRequestStatus to, bool allowed)
    {
        Assert.Equal(DomainRequestStatus.Requested, from);
        Assert.Equal(allowed, NewRequest().CanMoveTo(to));
    }
}
