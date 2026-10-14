using System.Text.Json;

namespace Storefront.Application.PublicSites;

/// <summary>Everything a public site page needs, in display order. Drafts never appear here unless <see cref="IsPreview"/>.</summary>
public sealed record PublicSiteDto(
    PublicBusinessDto Business,
    string TemplateId,
    JsonElement Settings,
    IReadOnlyList<PublicCategoryDto> Categories,
    DateTimeOffset? PublishedAt,
    bool IsPreview);

public sealed record PublicBusinessDto(
    string Name,
    string Slug,
    string? WhatsApp,
    string? Email,
    string? Address,
    string? Instagram,
    string Locale,
    string CurrencyCode,
    string TimeZone,
    IReadOnlyList<string> CustomDomains,
    string? Phone,
    string? Facebook,
    string? TikTok,
    string? Snapchat);

/// <summary>
/// A category with its products. <see cref="ParentId"/> is the main category it sits under (null for a main category).
/// The list stays flat in display order; a main category with no products of its own is included when a sub-category has products.
/// </summary>
public sealed record PublicCategoryDto(Guid Id, string Name, Guid? ParentId, IReadOnlyList<PublicProductDto> Products);

public sealed record PublicProductDto(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    string? ImageUrl,
    string? Label,
    bool IsAvailable,
    bool IsFeatured);

/// <summary>Cross-tenant reads for the public site (Infrastructure, no tenant filter).</summary>
public interface IPublicSiteReader
{
    Task<PublicSiteDto?> BySlugAsync(string slug, CancellationToken ct);

    Task<PublicSiteDto?> ByHostAsync(string host, CancellationToken ct);

    Task<PublicSiteDto?> DraftAsync(Guid businessId, CancellationToken ct);
}

public sealed class PublicSiteHandler(IPublicSiteReader reader, Abstractions.IPreviewTokens previews, Abstractions.IClock clock)
{
    public Task<PublicSiteDto?> BySlug(string slug, CancellationToken ct) => reader.BySlugAsync(slug, ct);

    public Task<PublicSiteDto?> ByHost(string host, CancellationToken ct) => reader.ByHostAsync(host, ct);

    public async Task<PublicSiteDto?> Preview(string token, CancellationToken ct) =>
        previews.Read(token, clock.UtcNow) is { } businessId ? await reader.DraftAsync(businessId, ct) : null;
}
