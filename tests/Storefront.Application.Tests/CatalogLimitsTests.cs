using Storefront.Application.Abstractions;
using Storefront.Application.Catalog;
using Storefront.Application.Catalog.Categories;
using Storefront.Application.Catalog.Import;
using Storefront.Application.Catalog.Products;
using Storefront.Domain.Businesses;
using Storefront.Domain.Catalog;
using Storefront.Domain.Common;
using Storefront.Domain.Media;

namespace Storefront.Application.Tests;

/// <summary>A business can't grow its catalog without end: the public site sends every product in one read.</summary>
public sealed class CatalogLimitsTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 26, 9, 0, 0, TimeSpan.Zero);

    private readonly Business business = Business.Create(Guid.CreateVersion7(), "Olive Cafe", Slug.FromStorage("olivecafe"), Now);
    private readonly LimitCatalog catalog = new();
    private readonly FakeUow uow = new();

    [Fact]
    public async Task A_full_business_cannot_add_another_category()
    {
        catalog.Categories = CatalogLimits.MaxCategories;
        var result = await new CreateCategoryHandler(new SaveCategoryValidator(), catalog, User, uow, new NoAudit(), new FakeClock(Now))
            .Handle(new SaveCategory("Desserts"), CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal("catalog.categoryLimit", result.Error!.Code);
        Assert.Equal(0, uow.Saves);
    }

    [Fact]
    public async Task A_full_business_cannot_add_another_product()
    {
        catalog.Products = CatalogLimits.MaxProducts;
        var result = await CreateProduct();

        Assert.False(result.IsSuccess);
        Assert.Equal("catalog.productLimit", result.Error!.Code);
        Assert.Equal(0, uow.Saves);
    }

    [Fact]
    public async Task Below_the_limit_a_product_is_added()
    {
        catalog.Products = CatalogLimits.MaxProducts - 1;
        var result = await CreateProduct();

        Assert.True(result.IsSuccess);
        Assert.Equal(1, uow.Saves);
    }

    [Fact]
    public async Task An_import_that_would_pass_the_limit_is_refused_whole()
    {
        catalog.Products = CatalogLimits.MaxProducts - 1;
        var import = new ImportCatalog([new ImportCategory("Drinks", [new ImportProduct("Tea", null, 1m), new ImportProduct("Coffee", null, 2m)])]);
        var result = await new ImportCatalogHandler(new SaveCategoryValidator(), new SaveProductValidator(), catalog, Businesses, User, uow, new NoAudit(), new FakeClock(Now))
            .Handle(import, CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal("catalog.productLimit", result.Error!.Code);
        Assert.Contains("categories", result.Error.Fields!.Keys);
        Assert.Equal(0, uow.Saves);
    }

    private FakeCurrentUser User => new(business.OwnerUserId, business.Id);

    private FakeBusinesses Businesses => new() { Existing = business };

    private Task<Common.Result<ProductDto>> CreateProduct()
    {
        var checker = new ProductInputChecker(catalog, new NoMedia(), Businesses, User);
        return new CreateProductHandler(new SaveProductValidator(), checker, catalog, uow, new NoAudit(), new FakeClock(Now))
            .Handle(new SaveProduct(catalog.Category.Id, "Tea", null, 1m, null), CancellationToken.None);
    }

    private sealed class LimitCatalog : ICatalogRepository
    {
        public int Categories { get; set; }
        public int Products { get; set; }
        public Category Category { get; } = Category.Create(Guid.CreateVersion7(), "Drinks", 0, Now);

        public Task<(int Categories, int Products)> CountCatalogAsync(CancellationToken ct) => Task.FromResult((Categories, Products));
        public Task<IReadOnlyList<Category>> ListCategoriesAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<Category>>([Category]);
        public Task<Category?> GetCategoryAsync(Guid id, CancellationToken ct) => Task.FromResult<Category?>(id == Category.Id ? Category : null);
        public Task<IReadOnlyList<Category>> ListSubcategoriesAsync(Guid parentId, CancellationToken ct) => Task.FromResult<IReadOnlyList<Category>>([]);
        public Task<bool> CategoryNameExistsAsync(string name, Guid? exceptId, CancellationToken ct) => Task.FromResult(false);
        public Task<IReadOnlyList<Product>> ListProductsAsync(Guid? categoryId, CancellationToken ct) => Task.FromResult<IReadOnlyList<Product>>([]);
        public Task<IReadOnlyList<Product>> SearchProductsAsync(Guid? categoryId, string? text, CancellationToken ct) => Task.FromResult<IReadOnlyList<Product>>([]);
        public Task<IReadOnlyDictionary<Guid, int>> CountProductsByCategoryAsync(CancellationToken ct) => Task.FromResult<IReadOnlyDictionary<Guid, int>>(new Dictionary<Guid, int>());
        public Task<int> NextCategorySortOrderAsync(CancellationToken ct) => Task.FromResult(Categories);
        public Task<int> NextProductSortOrderAsync(Guid categoryId, CancellationToken ct) => Task.FromResult(Products);
        public Task<Product?> GetProductAsync(Guid id, CancellationToken ct) => Task.FromResult<Product?>(null);
        public Task<int> CountProductsAsync(Guid categoryId, CancellationToken ct) => Task.FromResult(0);
        public void Add(Category category) => Categories++;
        public void Add(Product product) => Products++;
        public void Remove(Category category) => Categories--;
        public void Remove(Product product) => Products--;
    }

    private sealed class NoMedia : IMediaRepository
    {
        public Task<MediaAsset?> GetAsync(Guid id, CancellationToken ct) => Task.FromResult<MediaAsset?>(null);
        public Task<bool> UrlBelongsToBusinessAsync(Guid businessId, string url, CancellationToken ct) => Task.FromResult(false);
        public void Add(MediaAsset asset)
        {
        }
    }

    private sealed class NoAudit : IAuditLog
    {
        public void Record(string action, string entityType, string? entityId)
        {
        }
    }
}
