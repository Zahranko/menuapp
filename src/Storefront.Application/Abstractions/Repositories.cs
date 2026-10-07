using Storefront.Domain.Billing;
using Storefront.Domain.Businesses;
using Storefront.Domain.Catalog;
using Storefront.Domain.Domains;
using Storefront.Domain.Media;
using Storefront.Domain.Sites;
using Storefront.Domain.Templates;

namespace Storefront.Application.Abstractions;

public interface IBusinessRepository
{
    Task<Business?> GetAsync(Guid id, CancellationToken ct);

    Task<Business?> GetByOwnerAsync(Guid ownerUserId, CancellationToken ct);

    /// <summary>Across all businesses (public reads, slug checks). Case-insensitive.</summary>
    Task<Business?> FindBySlugAsync(string slug, CancellationToken ct);

    Task<bool> SlugExistsAsync(string slug, CancellationToken ct);

    void Add(Business business);
}

/// <summary>Categories and products of the current business (tenant-filtered).</summary>
public interface ICatalogRepository
{
    Task<IReadOnlyList<Category>> ListCategoriesAsync(CancellationToken ct);

    Task<Category?> GetCategoryAsync(Guid id, CancellationToken ct);

    Task<bool> CategoryNameExistsAsync(string name, Guid? exceptId, CancellationToken ct);

    Task<IReadOnlyList<Product>> ListProductsAsync(Guid? categoryId, CancellationToken ct);

    /// <summary>Filters by category and by text in the name or description (case-insensitive).</summary>
    Task<IReadOnlyList<Product>> SearchProductsAsync(Guid? categoryId, string? text, CancellationToken ct);

    Task<IReadOnlyDictionary<Guid, int>> CountProductsByCategoryAsync(CancellationToken ct);

    Task<int> NextCategorySortOrderAsync(CancellationToken ct);

    Task<int> NextProductSortOrderAsync(Guid categoryId, CancellationToken ct);

    Task<Product?> GetProductAsync(Guid id, CancellationToken ct);

    Task<int> CountProductsAsync(Guid categoryId, CancellationToken ct);

    void Add(Category category);

    void Add(Product product);

    void Remove(Category category);

    void Remove(Product product);
}

public interface ISiteRepository
{
    Task<Site?> GetForCurrentBusinessAsync(CancellationToken ct);

    Task<Site?> GetByBusinessIdAsync(Guid businessId, CancellationToken ct);

    void Add(Site site);
}

public interface ITemplateRepository
{
    Task<IReadOnlyList<Template>> ListAsync(bool activeOnly, CancellationToken ct);

    Task<Template?> GetAsync(string id, CancellationToken ct);

    void Add(Template template);
}

public interface IBillingRepository
{
    Task<IReadOnlyList<Plan>> ListPlansAsync(CancellationToken ct);

    Task<Plan?> GetPlanAsync(string code, CancellationToken ct);

    Task<Subscription?> GetSubscriptionAsync(Guid businessId, CancellationToken ct);

    void Add(Plan plan);

    void Add(Subscription subscription);
}

public interface IDomainRepository
{
    Task<DomainRequest?> GetRequestAsync(Guid id, CancellationToken ct);

    Task<DomainRequest?> GetOpenRequestAsync(Guid businessId, CancellationToken ct);

    Task<CustomDomain?> FindActiveAsync(string domain, CancellationToken ct);

    Task<bool> DomainTakenAsync(string domain, Guid exceptBusinessId, CancellationToken ct);

    void Add(DomainRequest request);

    void Add(CustomDomain domain);

    void Remove(CustomDomain domain);
}

public interface IMediaRepository
{
    Task<MediaAsset?> GetAsync(Guid id, CancellationToken ct);

    Task<bool> UrlBelongsToBusinessAsync(Guid businessId, string url, CancellationToken ct);

    void Add(MediaAsset asset);
}
