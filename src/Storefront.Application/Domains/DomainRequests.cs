using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Billing;
using Storefront.Application.Common;
using Storefront.Domain.Common;
using Storefront.Domain.Domains;

namespace Storefront.Application.Domains;

/// <summary>
/// A custom domain request. <see cref="Status"/> is requested, awaiting_dns, verifying, active, rejected or cancelled.
/// <see cref="DnsTarget"/> is the host the owner's www record must point to.
/// </summary>
public sealed record DomainRequestDto(Guid Id, string Domain, string Status, string? StaffNote, string DnsTarget, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, DateTimeOffset? ActivatedAt)
{
    public static DomainRequestDto From(DomainRequest r, string dnsTarget) =>
        new(r.Id, r.Domain.Value, StatusName(r.Status), r.StaffNote, dnsTarget, r.CreatedAt, r.UpdatedAt, r.ActivatedAt);

    public static string StatusName(DomainRequestStatus s) => s switch
    {
        DomainRequestStatus.Requested => "requested",
        DomainRequestStatus.AwaitingDns => "awaiting_dns",
        DomainRequestStatus.Verifying => "verifying",
        DomainRequestStatus.Active => "active",
        DomainRequestStatus.Rejected => "rejected",
        _ => "cancelled",
    };
}

internal static class DomainErrors
{
    public static readonly Error NoBusiness = Error.Unauthorized("auth.required", "Log in to continue.");
    public static readonly Error NotFound = Error.NotFound("domainRequest.notFound", "There is no domain request.");
    public static readonly Error NeedsPro = Error.Forbidden("plan.proRequired", "Your own domain is part of the Pro plan. Upgrade to Pro first.");
    public static readonly Error AlreadyOpen = Error.Conflict("domainRequest.open", "You already have a domain request. Cancel it to ask for another domain.", "domain");
    public static readonly Error Taken = Error.Conflict("domain.taken", "Another business already uses this domain.", "domain");
    public static readonly Error Ours = Error.Validation("domain.reserved", "Use a domain you own, like vanillamenu.com.", "domain");
}

public sealed class GetDomainRequestHandler(IDomainRepository domains, ICurrentUser user, IOptions<BrandOptions> brand)
{
    /// <summary>The open request, or null when there is none.</summary>
    public async Task<Result<DomainRequestDto?>> Handle(CancellationToken ct)
    {
        if (user.BusinessId is not { } businessId)
        {
            return DomainErrors.NoBusiness;
        }

        var request = await domains.GetOpenRequestAsync(businessId, ct);
        return Result<DomainRequestDto?>.Success(request is null ? null : DomainRequestDto.From(request, brand.Value.CustomDomainTarget));
    }
}

public sealed record RequestDomain(string Domain);

/// <summary>Pro owners ask for their own domain; support sends the DNS steps (see the back office).</summary>
public sealed class RequestDomainHandler(
    IDomainRepository domains,
    IBillingRepository billing,
    IBusinessRepository businesses,
    IEmailSender email,
    ICurrentUser user,
    IUnitOfWork uow,
    IAuditLog audit,
    IClock clock,
    IOptions<BrandOptions> brand)
{
    public async Task<Result<DomainRequestDto?>> Handle(RequestDomain cmd, CancellationToken ct)
    {
        if (user.BusinessId is not { } businessId || await businesses.GetAsync(businessId, ct) is not { } business)
        {
            return DomainErrors.NoBusiness;
        }

        var subscription = await billing.GetSubscriptionAsync(businessId, ct);
        var plan = subscription is null ? null : await billing.GetPlanAsync(subscription.PlanCode, ct);
        if (subscription is not { IsLive: true } || plan is not { AllowsCustomDomain: true })
        {
            return DomainErrors.NeedsPro;
        }

        DomainName domain;
        try
        {
            domain = DomainName.Create(cmd.Domain);
        }
        catch (DomainException ex)
        {
            return Error.FromDomain(ex);
        }

        if (domain.Value.StartsWith("www.", StringComparison.Ordinal))
        {
            domain = DomainName.Create(domain.Value[4..]);
        }

        var b = brand.Value;
        if (IsSameOrSub(domain.Value, b.Domain) || IsSameOrSub(domain.Value, b.CustomDomainTarget) || IsSameOrSub(domain.Value, b.ApiHost))
        {
            return DomainErrors.Ours;
        }

        if (await domains.GetOpenRequestAsync(businessId, ct) is not null)
        {
            return DomainErrors.AlreadyOpen;
        }

        if (await domains.DomainTakenAsync(domain.Value, businessId, ct))
        {
            return DomainErrors.Taken;
        }

        var request = DomainRequest.Create(businessId, domain, clock.UtcNow);
        domains.Add(request);
        audit.Record("domainRequest.created", "DomainRequest", request.Id.ToString());
        await uow.SaveChangesAsync(ct);

        await NotifyAsync(business.Name, business.Email, domain.Value, b, ct);
        return DomainRequestDto.From(request, b.CustomDomainTarget);
    }

    private static bool IsSameOrSub(string domain, string ours) =>
        !string.IsNullOrWhiteSpace(ours) && (domain == ours || domain.EndsWith("." + ours, StringComparison.Ordinal));

    private async Task NotifyAsync(string businessName, string? ownerEmail, string domain, BrandOptions b, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(b.SupportEmail))
        {
            await email.SendAsync(new EmailMessage(
                b.SupportEmail,
                $"Domain request: {domain}",
                $"{businessName} asked to use {domain}. Send the DNS steps from the back office.",
                $"<p>{System.Net.WebUtility.HtmlEncode(businessName)} asked to use <b>{System.Net.WebUtility.HtmlEncode(domain)}</b>. Send the DNS steps from the back office.</p>"), ct);
        }

        if (!string.IsNullOrWhiteSpace(ownerEmail))
        {
            await email.SendAsync(new EmailMessage(
                ownerEmail,
                $"We got your request for {domain}",
                $"Thanks! Our team will email you the DNS steps for {domain} soon.",
                $"<p>Thanks! Our team will email you the DNS steps for <b>{System.Net.WebUtility.HtmlEncode(domain)}</b> soon.</p>"), ct);
        }
    }
}

/// <summary>Cancels the open request. An active domain goes offline and the site stays at its usual address.</summary>
public sealed class CancelDomainRequestHandler(IDomainRepository domains, ICurrentUser user, IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result> Handle(CancellationToken ct)
    {
        if (user.BusinessId is not { } businessId)
        {
            return DomainErrors.NoBusiness;
        }

        if (await domains.GetOpenRequestAsync(businessId, ct) is not { } request)
        {
            return DomainErrors.NotFound;
        }

        await DomainRequestRules.CloseAsync(request, domains, "owner", clock.UtcNow, ct);
        audit.Record("domainRequest.cancelled", "DomainRequest", request.Id.ToString());
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
