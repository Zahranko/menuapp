using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Storefront.Application.PublicSites;
using Storefront.Domain.Businesses;
using Storefront.Domain.Common;
using Storefront.Infrastructure.Persistence;

namespace Storefront.Infrastructure.PublicSites;

internal sealed class PublicSiteReader(StorefrontDbContext db) : IPublicSiteReader
{
    public async Task<PublicSiteDto?> BySlugAsync(string slug, CancellationToken ct)
    {
        var value = (slug ?? "").Trim().ToLowerInvariant();
        if (value.Length is < Slug.MinLength or > Slug.MaxLength)
        {
            return null;
        }

        var key = Slug.FromStorage(value);
        var business = await db.Businesses.AsNoTracking().FirstOrDefaultAsync(b => b.Slug == key, ct);
        return business is null ? null : await BuildAsync(business, draft: false, ct);
    }

    public async Task<PublicSiteDto?> ByHostAsync(string host, CancellationToken ct)
    {
        var domain = (host ?? "").Trim().ToLowerInvariant().Split(':')[0];
        var mapping = await db.CustomDomains.AsNoTracking().FirstOrDefaultAsync(d => d.Domain == domain, ct);
        if (mapping is null && domain.StartsWith("www.", StringComparison.Ordinal))
        {
            var bare = domain[4..];
            mapping = await db.CustomDomains.AsNoTracking().FirstOrDefaultAsync(d => d.Domain == bare, ct);
        }

        var business = mapping is null ? null : await db.Businesses.AsNoTracking().FirstOrDefaultAsync(b => b.Id == mapping.BusinessId, ct);
        return business is null ? null : await BuildAsync(business, draft: false, ct);
    }

    public async Task<PublicSiteDto?> DraftAsync(Guid businessId, CancellationToken ct)
    {
        var business = await db.Businesses.AsNoTracking().FirstOrDefaultAsync(b => b.Id == businessId, ct);
        return business is null ? null : await BuildAsync(business, draft: true, ct);
    }

    private async Task<PublicSiteDto?> BuildAsync(Business business, bool draft, CancellationToken ct)
    {
        var site = await db.Sites.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(s => s.BusinessId == business.Id, ct);
        if (site is null || (!draft && site.PublishedSettings is null))
        {
            return null;
        }

        var categories = await db.Categories.IgnoreQueryFilters().AsNoTracking()
            .Where(c => c.BusinessId == business.Id).OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToListAsync(ct);
        var products = await db.Products.IgnoreQueryFilters().AsNoTracking()
            .Where(p => p.BusinessId == business.Id).OrderBy(p => p.SortOrder).ThenBy(p => p.CreatedAt).ToListAsync(ct);
        var domains = await db.CustomDomains.AsNoTracking().Where(d => d.BusinessId == business.Id).Select(d => d.Domain).ToListAsync(ct);

        var byCategory = products.ToLookup(p => p.CategoryId);
        var visible = categories
            .Where(c => byCategory[c.Id].Any())
            .Select(c => new PublicCategoryDto(c.Id, c.Name, byCategory[c.Id]
                .Select(p => new PublicProductDto(p.Id, p.Name, p.Description, p.Price, p.ImageUrl, p.Label, p.IsAvailable, p.IsFeatured))
                .ToList()))
            .ToList();

        var settingsJson = draft ? site.DraftSettings : site.PublishedSettings!;
        return new PublicSiteDto(
            new PublicBusinessDto(business.Name, business.Slug.Value, business.WhatsApp?.Value, business.Email, business.Address, business.Instagram,
                business.Locale, business.CurrencyCode, business.TimeZone, domains),
            draft ? site.TemplateId : site.PublishedTemplateId ?? site.TemplateId,
            JsonDocument.Parse(settingsJson).RootElement.Clone(),
            visible,
            site.PublishedAt,
            draft);
    }
}
