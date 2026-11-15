using FluentValidation;
using Storefront.Application.Abstractions;
using Storefront.Application.Billing;
using Storefront.Application.Common;
using Storefront.Domain.Common;
using Storefront.Domain.Community;

namespace Storefront.Application.Community;

/// <summary>A publisher as everyone sees them. <see cref="Url"/> is their page in the community gallery.</summary>
public sealed record PublisherDto(string Username, string DisplayName, string? Bio, DateTimeOffset CreatedAt, string Url)
{
    public static PublisherDto From(PublisherProfile p, SiteLinks links) => new(p.Username, p.DisplayName, p.Bio, p.CreatedAt, links.Publisher(p.Username));
}

public sealed record SavePublisher(string Username, string DisplayName, string? Bio);

public sealed class SavePublisherValidator : AbstractValidator<SavePublisher>
{
    public SavePublisherValidator()
    {
        RuleFor(x => x.Username).NotEmpty().WithMessage("Choose a username.");
        RuleFor(x => x.DisplayName).NotEmpty().WithMessage("Enter the name people will see.")
            .MaximumLength(PublisherProfile.DisplayNameMax).WithMessage("Use 1 to 40 characters for your name.");
        RuleFor(x => x.Bio).MaximumLength(PublisherProfile.BioMax).WithMessage("Use up to 160 characters.");
    }
}

public sealed record UsernameAvailability(string Username, bool Available, string? Message);

internal static class CommunityErrors
{
    public static readonly Error NoBusiness = Error.NotFound("site.notFound", "Site not found.");
    public static readonly Error PublisherNeedsPro = Error.Forbidden("community.pro", "Publishing community templates is part of the Pro plan. Upgrade to Pro to share your designs.");
    public static readonly Error NoPublisher = Error.NotFound("publisher.notFound", "Create your publisher profile first.");
    public static readonly Error UsernameTaken = Error.Conflict("publisher.usernameTaken", "This username is taken. Try another one.", "username");
    public static readonly Error NotFound = Error.NotFound("community.notFound", "This community template is gone.");
    public static readonly Error NotStudio = Error.Validation("community.studio", "Only designs made in the Studio template can be shared. Switch to Studio first.");
    public static readonly Error TooMany = Error.Conflict("community.limit", "You can share up to 30 templates. Delete one to share a new one.");
}

public static class CommunityLimits
{
    public const int TemplatesPerPublisher = 30;
}

public sealed class GetMyPublisherHandler(ICommunityRepository community, SiteLinks links)
{
    public async Task<Result<PublisherDto>> Handle(CancellationToken ct) =>
        await community.GetMyPublisherAsync(ct) is { } profile ? PublisherDto.From(profile, links) : CommunityErrors.NoPublisher;
}

/// <summary>Creates the owner's publisher profile, or updates it (a new username frees the old one). Pro only.</summary>
public sealed class SavePublisherHandler(
    IValidator<SavePublisher> validator, ICommunityRepository community, IReservedSlugs reserved, PlanChecker plans,
    ICurrentUser user, IUnitOfWork uow, IAuditLog audit, IClock clock, SiteLinks links)
{
    public async Task<Result<PublisherDto>> Handle(SavePublisher cmd, CancellationToken ct)
    {
        if (await validator.CheckAsync(cmd, ct) is { } invalid)
        {
            return invalid;
        }

        if (user.BusinessId is not { } businessId)
        {
            return CommunityErrors.NoBusiness;
        }

        var profile = await community.GetMyPublisherAsync(ct);
        if (profile is null && !await plans.IsProAsync(businessId, ct))
        {
            return CommunityErrors.PublisherNeedsPro;
        }

        try
        {
            var username = PublisherProfile.NormalizeUsername(cmd.Username, reserved.All);
            if (await community.UsernameTakenAsync(username, profile?.Id, ct))
            {
                return CommunityErrors.UsernameTaken;
            }

            if (profile is null)
            {
                profile = PublisherProfile.Create(businessId, username, cmd.DisplayName, cmd.Bio, reserved.All, clock.UtcNow);
                community.Add(profile);
                audit.Record("create", nameof(PublisherProfile), profile.Id.ToString());
            }
            else
            {
                profile.Update(username, cmd.DisplayName, cmd.Bio, reserved.All, clock.UtcNow);
                audit.Record("update", nameof(PublisherProfile), profile.Id.ToString());
            }
        }
        catch (DomainException ex)
        {
            return Error.FromDomain(ex);
        }

        await uow.SaveChangesAsync(ct);
        return PublisherDto.From(profile, links);
    }
}

/// <summary>Live check while the owner types a username.</summary>
public sealed class UsernameAvailabilityHandler(ICommunityRepository community, IReservedSlugs reserved)
{
    public async Task<UsernameAvailability> Handle(string? username, CancellationToken ct)
    {
        string normalized;
        try
        {
            normalized = PublisherProfile.NormalizeUsername(username, reserved.All);
        }
        catch (DomainException ex)
        {
            return new UsernameAvailability((username ?? "").Trim().ToLowerInvariant(), false, ex.Message);
        }

        var mine = await community.GetMyPublisherAsync(ct);
        return await community.UsernameTakenAsync(normalized, mine?.Id, ct)
            ? new UsernameAvailability(normalized, false, CommunityErrors.UsernameTaken.Message)
            : new UsernameAvailability(normalized, true, null);
    }
}
