using Microsoft.EntityFrameworkCore;
using Storefront.Application.Abstractions;
using Storefront.Domain.Billing;
using Storefront.Domain.Businesses;
using Storefront.Domain.Catalog;
using Storefront.Domain.Common;
using Storefront.Domain.Domains;
using Storefront.Domain.Media;
using Storefront.Domain.Sites;
using Storefront.Domain.Templates;

namespace Storefront.Infrastructure.Persistence.Repositories;

internal sealed class BusinessRepository(StorefrontDbContext db) : IBusinessRepository
{
    public Task<Business?> GetAsync(Guid id, CancellationToken ct) => db.Businesses.FirstOrDefaultAsync(b => b.Id == id, ct);

    public Task<Business?> GetByOwnerAsync(Guid ownerUserId, CancellationToken ct) =>
        db.Businesses.FirstOrDefaultAsync(b => b.OwnerUserId == ownerUserId, ct);

    public Task<Business?> FindBySlugAsync(string slug, CancellationToken ct)
    {
        var key = Slug.FromStorage(slug.Trim().ToLowerInvariant());
        return db.Businesses.FirstOrDefaultAsync(b => b.Slug == key, ct);
    }

    public Task<bool> SlugExistsAsync(string slug, CancellationToken ct)
    {
        var key = Slug.FromStorage(slug.Trim().ToLowerInvariant());
        return db.Businesses.AnyAsync(b => b.Slug == key, ct);
    }

    public void Add(Business business) => db.Businesses.Add(business);
}

internal sealed class CatalogRepository(StorefrontDbContext db) : ICatalogRepository
{
    public async Task<IReadOnlyList<Category>> ListCategoriesAsync(CancellationToken ct) =>
        await db.Categories.OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToListAsync(ct);

    public Task<Category?> GetCategoryAsync(Guid id, CancellationToken ct) => db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task<bool> CategoryNameExistsAsync(string name, Guid? exceptId, CancellationToken ct)
    {
        var key = name.Trim().ToLower();
        return db.Categories.AnyAsync(c => EF.Property<string>(c, "NameKey") == key && c.Id != exceptId, ct);
    }

    public async Task<IReadOnlyList<Product>> ListProductsAsync(Guid? categoryId, CancellationToken ct) =>
        await db.Products
            .Where(p => categoryId == null || p.CategoryId == categoryId)
            .OrderBy(p => p.SortOrder).ThenBy(p => p.CreatedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Product>> SearchProductsAsync(Guid? categoryId, string? text, CancellationToken ct)
    {
        var query = db.Products.Where(p => categoryId == null || p.CategoryId == categoryId);
        if (!string.IsNullOrWhiteSpace(text))
        {
            var pattern = $"%{EscapeLike(text.Trim())}%";
            query = query.Where(p => EF.Functions.ILike(p.Name, pattern, "\\") || (p.Description != null && EF.Functions.ILike(p.Description, pattern, "\\")));
        }

        return await query.OrderBy(p => p.SortOrder).ThenBy(p => p.CreatedAt).ToListAsync(ct);
    }

    public async Task<IReadOnlyDictionary<Guid, int>> CountProductsByCategoryAsync(CancellationToken ct) =>
        await db.Products.GroupBy(p => p.CategoryId).Select(g => new { g.Key, Count = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.Count, ct);

    public async Task<int> NextCategorySortOrderAsync(CancellationToken ct) => (await db.Categories.MaxAsync(c => (int?)c.SortOrder, ct) ?? -1) + 1;

    public async Task<int> NextProductSortOrderAsync(Guid categoryId, CancellationToken ct) =>
        (await db.Products.Where(p => p.CategoryId == categoryId).MaxAsync(p => (int?)p.SortOrder, ct) ?? -1) + 1;

    public Task<Product?> GetProductAsync(Guid id, CancellationToken ct) => db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);

    private static string EscapeLike(string value) => value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");

    public Task<int> CountProductsAsync(Guid categoryId, CancellationToken ct) => db.Products.CountAsync(p => p.CategoryId == categoryId, ct);

    public void Add(Category category) => db.Categories.Add(category);

    public void Add(Product product) => db.Products.Add(product);

    public void Remove(Category category) => db.Categories.Remove(category);

    public void Remove(Product product) => db.Products.Remove(product);
}

internal sealed class SiteRepository(StorefrontDbContext db) : ISiteRepository
{
    public Task<Site?> GetForCurrentBusinessAsync(CancellationToken ct) => db.Sites.FirstOrDefaultAsync(ct);

    public Task<Site?> GetByBusinessIdAsync(Guid businessId, CancellationToken ct) =>
        db.Sites.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.BusinessId == businessId, ct);

    public void Add(Site site) => db.Sites.Add(site);
}

internal sealed class TemplateRepository(StorefrontDbContext db) : ITemplateRepository
{
    public async Task<IReadOnlyList<Template>> ListAsync(bool activeOnly, CancellationToken ct) =>
        await db.Templates.Where(t => !activeOnly || t.IsActive).OrderBy(t => t.Number).ToListAsync(ct);

    public Task<Template?> GetAsync(string id, CancellationToken ct) => db.Templates.FirstOrDefaultAsync(t => t.Id == id, ct);

    public void Add(Template template) => db.Templates.Add(template);
}

internal sealed class BillingRepository(StorefrontDbContext db) : IBillingRepository
{
    public async Task<IReadOnlyList<Plan>> ListPlansAsync(CancellationToken ct) => await db.Plans.OrderBy(p => p.PriceUsd).ToListAsync(ct);

    public Task<Plan?> GetPlanAsync(string code, CancellationToken ct) => db.Plans.FirstOrDefaultAsync(p => p.Code == code, ct);

    public Task<Subscription?> GetSubscriptionAsync(Guid businessId, CancellationToken ct) =>
        db.Subscriptions.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.BusinessId == businessId, ct);

    public void Add(Plan plan) => db.Plans.Add(plan);

    public void Add(Subscription subscription) => db.Subscriptions.Add(subscription);
}

internal sealed class DomainRepository(StorefrontDbContext db) : IDomainRepository
{
    private static readonly DomainRequestStatus[] Closed = [DomainRequestStatus.Rejected, DomainRequestStatus.Cancelled];

    public Task<DomainRequest?> GetRequestAsync(Guid id, CancellationToken ct) =>
        db.DomainRequests.IgnoreQueryFilters().FirstOrDefaultAsync(r => r.Id == id, ct);

    public Task<DomainRequest?> GetOpenRequestAsync(Guid businessId, CancellationToken ct) =>
        db.DomainRequests.IgnoreQueryFilters()
            .Where(r => r.BusinessId == businessId && !Closed.Contains(r.Status))
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync(ct);

    public Task<CustomDomain?> FindActiveAsync(string domain, CancellationToken ct)
    {
        var key = domain.Trim().ToLowerInvariant();
        return db.CustomDomains.FirstOrDefaultAsync(d => d.Domain == key, ct);
    }

    public async Task<bool> DomainTakenAsync(string domain, Guid exceptBusinessId, CancellationToken ct)
    {
        var name = DomainName.Create(domain);
        return await db.CustomDomains.AnyAsync(d => d.Domain == name.Value && d.BusinessId != exceptBusinessId, ct)
            || await db.DomainRequests.IgnoreQueryFilters().AnyAsync(r => r.Domain == name && r.BusinessId != exceptBusinessId && !Closed.Contains(r.Status), ct);
    }

    public void Add(DomainRequest request) => db.DomainRequests.Add(request);

    public void Add(CustomDomain domain) => db.CustomDomains.Add(domain);

    public void Remove(CustomDomain domain) => db.CustomDomains.Remove(domain);
}

internal sealed class MediaRepository(StorefrontDbContext db) : IMediaRepository
{
    public Task<MediaAsset?> GetAsync(Guid id, CancellationToken ct) => db.MediaAssets.FirstOrDefaultAsync(m => m.Id == id, ct);

    public Task<bool> UrlBelongsToBusinessAsync(Guid businessId, string url, CancellationToken ct) =>
        db.MediaAssets.IgnoreQueryFilters().AnyAsync(m => m.BusinessId == businessId && m.Url == url, ct);

    public void Add(MediaAsset asset) => db.MediaAssets.Add(asset);
}
