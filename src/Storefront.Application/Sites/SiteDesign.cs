using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Application.Templates;
using Storefront.Domain.Sites;

namespace Storefront.Application.Sites;

public sealed record SiteDto(
    string TemplateId,
    JsonElement DraftSettings,
    string? PublishedTemplateId,
    JsonElement? PublishedSettings,
    DateTimeOffset? PublishedAt,
    bool HasUnpublishedChanges,
    string SiteUrl)
{
    public static SiteDto From(Site site, string siteUrl) => new(
        site.TemplateId,
        Parse(site.DraftSettings),
        site.PublishedTemplateId,
        site.PublishedSettings is null ? null : Parse(site.PublishedSettings),
        site.PublishedAt,
        !site.IsPublished || site.TemplateId != site.PublishedTemplateId || !JsonNode.DeepEquals(JsonNode.Parse(site.DraftSettings), JsonNode.Parse(site.PublishedSettings!)),
        siteUrl);

    private static JsonElement Parse(string json) => JsonDocument.Parse(json).RootElement.Clone();
}

internal static class SiteErrors
{
    public static readonly Error NotFound = Error.NotFound("site.notFound", "Site not found.");
    public static readonly Error TemplateNotFound = Error.Validation("template.notFound", "Choose a template from the gallery.", "templateId");
}

/// <summary>Shared lookups for the site handlers.</summary>
public sealed class SiteContext(ISiteRepository sites, IBusinessRepository businesses, ICurrentUser user, IOptions<BrandOptions> brand)
{
    public async Task<(Site? Site, string SiteUrl)> LoadAsync(CancellationToken ct)
    {
        var site = await sites.GetForCurrentBusinessAsync(ct);
        var business = user.BusinessId is { } id ? await businesses.GetAsync(id, ct) : null;
        return (site, business is null ? "" : $"https://{brand.Value.Domain}/{business.Slug.Value}");
    }
}

public sealed class GetSiteHandler(SiteContext context)
{
    public async Task<Result<SiteDto>> Handle(CancellationToken ct)
    {
        var (site, url) = await context.LoadAsync(ct);
        return site is null ? SiteErrors.NotFound : SiteDto.From(site, url);
    }
}

public sealed record ChangeTemplate(string TemplateId);

/// <summary>Switching template resets the draft to that template's defaults; the live site changes only on publish.</summary>
public sealed class ChangeTemplateHandler(SiteContext context, ITemplateRepository templates, IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result<SiteDto>> Handle(ChangeTemplate cmd, CancellationToken ct)
    {
        var (site, url) = await context.LoadAsync(ct);
        if (site is null)
        {
            return SiteErrors.NotFound;
        }

        var template = string.IsNullOrWhiteSpace(cmd.TemplateId) ? null : await templates.GetAsync(cmd.TemplateId.Trim().ToLowerInvariant(), ct);
        if (template is null || !template.IsActive)
        {
            return SiteErrors.TemplateNotFound;
        }

        site.ChangeTemplate(template.Id, template.DefaultSettings, clock.UtcNow);
        audit.Record("template", nameof(Site), template.Id);
        await uow.SaveChangesAsync(ct);
        return SiteDto.From(site, url);
    }
}

public sealed record SaveDraft(JsonElement Settings);

public sealed class SaveDraftHandler(SiteContext context, ITemplateRepository templates, IMediaRepository media, ICurrentUser user, IUnitOfWork uow, IClock clock)
{
    public async Task<Result<SiteDto>> Handle(SaveDraft cmd, CancellationToken ct)
    {
        var (site, url) = await context.LoadAsync(ct);
        if (site is null || user.BusinessId is not { } businessId)
        {
            return SiteErrors.NotFound;
        }

        if (cmd.Settings.ValueKind != JsonValueKind.Object || JsonNode.Parse(cmd.Settings.GetRawText()) is not JsonObject settings)
        {
            return Error.Validation("site.settings", "Settings must be an object.", "settings");
        }

        var template = await templates.GetAsync(site.TemplateId, ct);
        if (template is null)
        {
            return SiteErrors.TemplateNotFound;
        }

        var defaults = (JsonObject)JsonNode.Parse(template.DefaultSettings)!;
        var (valid, errors) = await TemplateSchema.Parse(template.SettingsSchema)
            .ValidateAsync(settings, defaults, imageUrl => media.UrlBelongsToBusinessAsync(businessId, imageUrl, ct));
        if (valid is null)
        {
            return Error.Validation(errors.ToDictionary(e => $"settings.{e.Key}", e => e.Value));
        }

        site.SaveDraft(valid.ToJsonString(), clock.UtcNow);
        await uow.SaveChangesAsync(ct);
        return SiteDto.From(site, url);
    }
}

public sealed class PublishSiteHandler(SiteContext context, IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result<SiteDto>> Handle(CancellationToken ct)
    {
        var (site, url) = await context.LoadAsync(ct);
        if (site is null)
        {
            return SiteErrors.NotFound;
        }

        site.Publish(clock.UtcNow);
        audit.Record("publish", nameof(Site), site.TemplateId);
        await uow.SaveChangesAsync(ct);
        return SiteDto.From(site, url);
    }
}

public sealed record PreviewLink(string Token, string PreviewUrl, DateTimeOffset ExpiresAt);

public sealed class CreatePreviewTokenHandler(IPreviewTokens tokens, ICurrentUser user, IClock clock, IOptions<BrandOptions> brand)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(30);

    public Result<PreviewLink> Handle()
    {
        if (user.BusinessId is not { } businessId)
        {
            return SiteErrors.NotFound;
        }

        var expires = clock.UtcNow + Lifetime;
        var token = tokens.Create(businessId, expires);
        return new PreviewLink(token, $"https://{brand.Value.Domain}/_preview/{token}", expires);
    }
}
