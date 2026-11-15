using System.Text.Json;
using System.Text.Json.Nodes;
using FluentValidation;
using Storefront.Application.Abstractions;
using Storefront.Application.Billing;
using Storefront.Application.Common;
using Storefront.Application.Sites;
using Storefront.Application.Templates;
using Storefront.Domain.Common;
using Storefront.Domain.Community;
using Storefront.Domain.Sites;
using Storefront.Domain.Templates;

namespace Storefront.Application.Community;

/// <summary>A gallery card. <see cref="ShareUrl"/> is the link to send people; <see cref="PreviewUrl"/> shows the design on a sample menu.</summary>
public sealed record CommunityTemplateDto(
    string Code,
    string Name,
    string? Description,
    string BaseTemplateId,
    bool IsPro,
    PublisherDto Publisher,
    IReadOnlyList<string> Colors,
    int Uses,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    string ShareUrl,
    string PreviewUrl);

/// <summary>One template with its design settings, for the share page and its sample preview.</summary>
public sealed record CommunityTemplateDetailDto(CommunityTemplateDto Template, JsonElement Settings);

/// <summary>A template in its publisher's own list: also its id (for changes) and whether the gallery shows it.</summary>
public sealed record MyCommunityTemplateDto(Guid Id, bool IsListed, CommunityTemplateDto Template);

public sealed record CommunityPage(IReadOnlyList<CommunityTemplateDto> Items, int Total, int Page, int PageSize);

public sealed record PublisherPageDto(PublisherDto Publisher, IReadOnlyList<CommunityTemplateDto> Templates);

/// <summary>Builds the DTOs, reading each base template's schema once.</summary>
public sealed class CommunityCards(ITemplateRepository templates, ICommunityRepository community, SiteLinks links)
{
    private readonly Dictionary<string, Template?> _templates = [];

    public async Task<IReadOnlyList<CommunityTemplateDto>> ManyAsync(IReadOnlyList<CommunityTemplate> items, CancellationToken ct)
    {
        var publishers = await community.GetPublishersAsync(items.Select(i => i.PublisherId).Distinct().ToList(), ct);
        var result = new List<CommunityTemplateDto>(items.Count);
        foreach (var item in items)
        {
            if (publishers.TryGetValue(item.PublisherId, out var publisher))
            {
                result.Add(await OneAsync(item, publisher, ct));
            }
        }

        return result;
    }

    public async Task<CommunityTemplateDto> OneAsync(CommunityTemplate item, PublisherProfile publisher, CancellationToken ct)
    {
        var template = await TemplateAsync(item.BaseTemplateId, ct);
        var colors = template is null ? [] : CommunityDesign.Colors(TemplateSchema.Parse(template.SettingsSchema), Design(item));
        return new CommunityTemplateDto(
            item.Code, item.Name, item.Description, item.BaseTemplateId, template?.IsPro ?? false, PublisherDto.From(publisher, links), colors, item.Uses,
            item.CreatedAt, item.UpdatedAt, links.Community(item.Code), links.CommunityPreview(item.Code));
    }

    /// <summary>The design as stored, filtered again to the shared keys of the base template (so nothing personal ever leaves).</summary>
    public async Task<JsonObject> SharedSettingsAsync(CommunityTemplate item, CancellationToken ct) =>
        await TemplateAsync(item.BaseTemplateId, ct) is { } template
            ? CommunityDesign.Extract(TemplateSchema.Parse(template.SettingsSchema), Design(item))
            : [];

    public static JsonObject Design(CommunityTemplate item) => JsonNode.Parse(item.Settings) as JsonObject ?? [];

    private async Task<Template?> TemplateAsync(string id, CancellationToken ct)
    {
        if (!_templates.TryGetValue(id, out var template))
        {
            template = await templates.GetAsync(id, ct);
            _templates[id] = template;
        }

        return template;
    }
}

/// <summary>The public gallery: listed templates, most used first ("popular", default) or newest first ("new").</summary>
public sealed class BrowseCommunityHandler(ICommunityRepository community, CommunityCards cards)
{
    public const int PageSize = 24;

    public async Task<CommunityPage> Handle(string? sort, string? search, int page, CancellationToken ct)
    {
        page = Math.Clamp(page, 1, 1000);
        var text = string.IsNullOrWhiteSpace(search) ? null : search.Trim()[..Math.Min(search.Trim().Length, CommunityTemplate.NameMax)];
        var (items, total) = await community.BrowseAsync(sort == "new", text, (page - 1) * PageSize, PageSize, ct);
        return new CommunityPage(await cards.ManyAsync(items, ct), total, page, PageSize);
    }
}

/// <summary>One template by its share code, listed or not.</summary>
public sealed class GetCommunityTemplateHandler(ICommunityRepository community, CommunityCards cards)
{
    public async Task<CommunityTemplateDetailDto?> Handle(string code, CancellationToken ct)
    {
        var key = (code ?? "").Trim().ToLowerInvariant();
        if (!CommunityTemplate.LooksLikeCode(key) || await community.FindByCodeAsync(key, ct) is not { } item)
        {
            return null;
        }

        var publishers = await community.GetPublishersAsync([item.PublisherId], ct);
        if (!publishers.TryGetValue(item.PublisherId, out var publisher))
        {
            return null;
        }

        var settings = await cards.SharedSettingsAsync(item, ct);
        return new CommunityTemplateDetailDto(await cards.OneAsync(item, publisher, ct), JsonDocument.Parse(settings.ToJsonString()).RootElement.Clone());
    }
}

/// <summary>A publisher's page: their profile and listed templates.</summary>
public sealed class GetPublisherPageHandler(ICommunityRepository community, CommunityCards cards, SiteLinks links)
{
    public async Task<PublisherPageDto?> Handle(string username, CancellationToken ct)
    {
        var key = (username ?? "").Trim().TrimStart('@').ToLowerInvariant();
        if (key.Length is < PublisherProfile.UsernameMin or > PublisherProfile.UsernameMax || await community.FindPublisherAsync(key, ct) is not { } publisher)
        {
            return null;
        }

        var items = await community.ListByPublisherAsync(publisher.Id, ct);
        return new PublisherPageDto(PublisherDto.From(publisher, links), await cards.ManyAsync(items, ct));
    }
}

public sealed class ListMyCommunityTemplatesHandler(ICommunityRepository community, CommunityCards cards)
{
    public async Task<Result<IReadOnlyList<MyCommunityTemplateDto>>> Handle(CancellationToken ct)
    {
        if (await community.GetMyPublisherAsync(ct) is not { } publisher)
        {
            return CommunityErrors.NoPublisher;
        }

        var result = new List<MyCommunityTemplateDto>();
        foreach (var item in await community.ListMineAsync(ct))
        {
            result.Add(new MyCommunityTemplateDto(item.Id, item.IsListed, await cards.OneAsync(item, publisher, ct)));
        }

        return result;
    }
}

public sealed record ShareCommunityTemplate(string Name, string? Description, bool IsListed = true);

public sealed class ShareCommunityTemplateValidator : AbstractValidator<ShareCommunityTemplate>
{
    public ShareCommunityTemplateValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Give your template a name.")
            .Must(n => n is not null && n.Trim().Length is >= CommunityTemplate.NameMin and <= CommunityTemplate.NameMax)
            .WithMessage("Use 3 to 40 characters for the name.");
        RuleFor(x => x.Description).MaximumLength(CommunityTemplate.DescriptionMax).WithMessage("Use up to 200 characters.");
    }
}

/// <summary>Checks that the owner may publish (Pro, with a publisher profile) and reads the design of their current draft.</summary>
public sealed class CommunityPublishing(ICommunityRepository community, ISiteRepository sites, ITemplateRepository templates, PlanChecker plans, ICurrentUser user)
{
    public async Task<(PublisherProfile? Publisher, Site? Site, JsonObject? Design, Error? Error)> PrepareAsync(bool needDesign, CancellationToken ct)
    {
        if (user.BusinessId is not { } businessId)
        {
            return (null, null, null, CommunityErrors.NoBusiness);
        }

        if (!await plans.IsProAsync(businessId, ct))
        {
            return (null, null, null, CommunityErrors.PublisherNeedsPro);
        }

        if (await community.GetMyPublisherAsync(ct) is not { } publisher)
        {
            return (null, null, null, CommunityErrors.NoPublisher);
        }

        if (!needDesign)
        {
            return (publisher, null, null, null);
        }

        var site = await sites.GetForCurrentBusinessAsync(ct);
        var template = site is null ? null : await templates.GetAsync(site.TemplateId, ct);
        if (site is null || template is null)
        {
            return (null, null, null, CommunityErrors.NoBusiness);
        }

        var schema = TemplateSchema.Parse(template.SettingsSchema);
        if (!CommunityDesign.CanShare(schema))
        {
            return (null, null, null, CommunityErrors.NotStudio);
        }

        // The draft was checked when it was saved; the shared part is checked again (style sheet included) before it is shared.
        var design = CommunityDesign.Extract(schema, JsonNode.Parse(site.DraftSettings) as JsonObject ?? []);
        var defaults = JsonNode.Parse(template.DefaultSettings) as JsonObject ?? [];
        var (valid, errors) = await schema.ValidateAsync(design, defaults, _ => Task.FromResult(false));
        if (valid is null)
        {
            return (null, null, null, Error.Validation(errors.ToDictionary(e => $"settings.{e.Key}", e => e.Value)));
        }

        return (publisher, site, design, null);
    }
}

/// <summary>Shares the design of the owner's current Studio draft in the community gallery. Pro, with a publisher profile.</summary>
public sealed class ShareCommunityTemplateHandler(
    IValidator<ShareCommunityTemplate> validator, CommunityPublishing publishing, ICommunityRepository community, CommunityCards cards,
    IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result<MyCommunityTemplateDto>> Handle(ShareCommunityTemplate cmd, CancellationToken ct)
    {
        if (await validator.CheckAsync(cmd, ct) is { } invalid)
        {
            return invalid;
        }

        var (publisher, site, design, error) = await publishing.PrepareAsync(needDesign: true, ct);
        if (error is not null)
        {
            return error;
        }

        if ((await community.ListMineAsync(ct)).Count >= CommunityLimits.TemplatesPerPublisher)
        {
            return CommunityErrors.TooMany;
        }

        CommunityTemplate item;
        try
        {
            item = CommunityTemplate.Create(publisher!.BusinessId, publisher.Id, site!.TemplateId, cmd.Name, cmd.Description, design!.ToJsonString(), clock.UtcNow);
            item.SetListed(cmd.IsListed, clock.UtcNow);
        }
        catch (DomainException ex)
        {
            return Error.FromDomain(ex);
        }

        // A clash of random 8-letter codes is unlikely but cheap to rule out.
        while (await community.FindByCodeAsync(item.Code, ct) is not null)
        {
            item = CommunityTemplate.Create(publisher.BusinessId, publisher.Id, site.TemplateId, item.Name, item.Description, item.Settings, clock.UtcNow);
            item.SetListed(cmd.IsListed, clock.UtcNow);
        }

        community.Add(item);
        audit.Record("share", nameof(CommunityTemplate), item.Code);
        await uow.SaveChangesAsync(ct);
        return new MyCommunityTemplateDto(item.Id, item.IsListed, await cards.OneAsync(item, publisher, ct));
    }
}

/// <param name="UpdateDesign">True replaces the shared design with the owner's current Studio draft.</param>
public sealed record UpdateCommunityTemplate(string Name, string? Description, bool IsListed, bool UpdateDesign = false);

public sealed class UpdateCommunityTemplateValidator : AbstractValidator<UpdateCommunityTemplate>
{
    public UpdateCommunityTemplateValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Give your template a name.")
            .Must(n => n is not null && n.Trim().Length is >= CommunityTemplate.NameMin and <= CommunityTemplate.NameMax)
            .WithMessage("Use 3 to 40 characters for the name.");
        RuleFor(x => x.Description).MaximumLength(CommunityTemplate.DescriptionMax).WithMessage("Use up to 200 characters.");
    }
}

/// <summary>Renames a shared template, shows or hides it in the gallery, or updates its design from the current draft.</summary>
public sealed class UpdateCommunityTemplateHandler(
    IValidator<UpdateCommunityTemplate> validator, CommunityPublishing publishing, ICommunityRepository community, CommunityCards cards,
    IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result<MyCommunityTemplateDto>> Handle(Guid id, UpdateCommunityTemplate cmd, CancellationToken ct)
    {
        if (await validator.CheckAsync(cmd, ct) is { } invalid)
        {
            return invalid;
        }

        var (publisher, site, design, error) = await publishing.PrepareAsync(cmd.UpdateDesign, ct);
        if (error is not null)
        {
            return error;
        }

        if (await community.GetMineAsync(id, ct) is not { } item)
        {
            return CommunityErrors.NotFound;
        }

        try
        {
            item.Rename(cmd.Name, cmd.Description, clock.UtcNow);
            item.SetListed(cmd.IsListed, clock.UtcNow);
            if (cmd.UpdateDesign)
            {
                item.SetDesign(site!.TemplateId, design!.ToJsonString(), clock.UtcNow);
            }
        }
        catch (DomainException ex)
        {
            return Error.FromDomain(ex);
        }

        audit.Record("update", nameof(CommunityTemplate), item.Code);
        await uow.SaveChangesAsync(ct);
        return new MyCommunityTemplateDto(item.Id, item.IsListed, await cards.OneAsync(item, publisher!, ct));
    }
}

/// <summary>Removes a shared template. Sites that applied it keep their design; its share link stops working.</summary>
public sealed class DeleteCommunityTemplateHandler(ICommunityRepository community, IUnitOfWork uow, IAuditLog audit)
{
    public async Task<Result> Handle(Guid id, CancellationToken ct)
    {
        if (await community.GetMineAsync(id, ct) is not { } item)
        {
            return CommunityErrors.NotFound;
        }

        community.Remove(item);
        audit.Record("delete", nameof(CommunityTemplate), item.Code);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}

/// <summary>
/// Puts a community design on the owner's draft. The site moves to the design's base template when it is on another one
/// (its texts start from that template's defaults); the owner's own texts, photos and hours stay when it is already there.
/// The result is checked against the template's schema like any draft, so the style sheet is checked again (StudioCss) and
/// the template's plan rule applies. The live site changes when the owner publishes.
/// </summary>
public sealed class ApplyCommunityTemplateHandler(
    ICommunityRepository community, CommunityCards cards, SiteContext context, ITemplateRepository templates, IMediaRepository media,
    PlanChecker plans, ICurrentUser user, IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result<SiteDto>> Handle(string code, CancellationToken ct)
    {
        var key = (code ?? "").Trim().ToLowerInvariant();
        if (!CommunityTemplate.LooksLikeCode(key) || await community.FindByCodeAsync(key, ct) is not { } item)
        {
            return CommunityErrors.NotFound;
        }

        var (site, url, locale) = await context.LoadWithLocaleAsync(ct);
        if (site is null || user.BusinessId is not { } businessId)
        {
            return CommunityErrors.NoBusiness;
        }

        var template = await templates.GetAsync(item.BaseTemplateId, ct);
        if (template is null || !template.IsActive)
        {
            return CommunityErrors.NotFound;
        }

        if (await SiteErrors.PlanBlocksAsync(template, plans, user, ct) is { } blocked)
        {
            return blocked;
        }

        var schema = TemplateSchema.Parse(template.SettingsSchema);
        var defaults = TemplateDefaults.For(template, locale);
        var start = site.TemplateId == template.Id ? JsonNode.Parse(site.DraftSettings) as JsonObject ?? defaults : defaults;
        var merged = CommunityDesign.Apply(schema, start, await cards.SharedSettingsAsync(item, ct));
        var (valid, errors) = await schema.ValidateAsync(merged, defaults, image => media.UrlBelongsToBusinessAsync(businessId, image, ct));
        if (valid is null)
        {
            return Error.Validation(errors.ToDictionary(e => $"settings.{e.Key}", e => e.Value));
        }

        if (site.TemplateId == template.Id)
        {
            site.SaveDraft(valid.ToJsonString(), clock.UtcNow);
        }
        else
        {
            site.ChangeTemplate(template.Id, valid.ToJsonString(), clock.UtcNow);
        }

        if (item.BusinessId != businessId)
        {
            item.CountUse();
        }

        audit.Record("apply", nameof(CommunityTemplate), item.Code);
        await uow.SaveChangesAsync(ct);
        return SiteDto.From(site, url);
    }
}
