using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Storefront.Application.Abstractions;
using Storefront.Domain.Businesses;
using Storefront.Domain.Catalog;
using Storefront.Domain.Common;
using Storefront.Infrastructure.Identity;
using Storefront.Infrastructure.Outbox;
using Storefront.Infrastructure.Persistence;
using Storefront.Infrastructure.Persistence.Seeding;

namespace Storefront.Web.IntegrationTests;

public sealed class FakeCurrentUser : ICurrentUser
{
    public Guid? UserId { get; set; }
    public Guid? BusinessId { get; set; }
    public bool IsStaff { get; set; }
}

public class PersistenceTests : IAsyncLifetime
{
    private readonly TestDatabase _database = new();
    private readonly FakeCurrentUser _user = new();
    private ServiceProvider _services = null!;

    public async Task InitializeAsync()
    {
        await _database.InitializeAsync();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:Default"] = _database.ConnectionString })
            .Build();
        var services = new ServiceCollection().AddLogging();
        Storefront.Infrastructure.DependencyInjection.AddInfrastructure(services, config);
        services.AddSingleton<ICurrentUser>(_user);
        _services = services.BuildServiceProvider();

        await using var scope = _services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<StorefrontDbContext>().Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        await _services.DisposeAsync();
        await _database.DisposeAsync();
    }

    private async Task<(Guid BusinessId, Guid CategoryId)> CreateBusinessAsync(string slug)
    {
        await using var scope = _services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<StorefrontDbContext>();
        var now = DateTimeOffset.UtcNow;
        var owner = new AppUser { UserName = $"{slug}@example.com", Email = $"{slug}@example.com", NormalizedEmail = $"{slug}@EXAMPLE.COM", CreatedAt = now };
        db.Users.Add(owner);
        var business = Business.Create(owner.Id, slug, Slug.FromStorage(slug), now);
        db.Businesses.Add(business);
        var category = Category.Create(business.Id, "Coffee", 0, now);
        db.Categories.Add(category);
        db.Products.Add(Product.Create(business.Id, category.Id, new ProductDetails($"{slug} latte", null, 3.5m), "JOD", 0, now));
        await db.SaveChangesAsync();
        return (business.Id, category.Id);
    }

    [Fact]
    public async Task Global_query_filter_isolates_businesses()
    {
        var a = await CreateBusinessAsync("businessa");
        var b = await CreateBusinessAsync("businessb");

        _user.BusinessId = a.BusinessId;
        await using (var scope = _services.CreateAsyncScope())
        {
            var catalog = scope.ServiceProvider.GetRequiredService<ICatalogRepository>();
            var products = await catalog.ListProductsAsync(null, CancellationToken.None);
            Assert.Equal("businessa latte", Assert.Single(products).Name);
            Assert.Null(await catalog.GetCategoryAsync(b.CategoryId, CancellationToken.None));
            Assert.Single(await catalog.ListCategoriesAsync(CancellationToken.None));
        }

        _user.BusinessId = b.BusinessId;
        await using (var scope = _services.CreateAsyncScope())
        {
            var catalog = scope.ServiceProvider.GetRequiredService<ICatalogRepository>();
            Assert.Equal("businessb latte", Assert.Single(await catalog.ListProductsAsync(null, CancellationToken.None)).Name);
        }

        _user.BusinessId = null;
        await using (var scope = _services.CreateAsyncScope())
        {
            var catalog = scope.ServiceProvider.GetRequiredService<ICatalogRepository>();
            Assert.Empty(await catalog.ListProductsAsync(null, CancellationToken.None));
        }
    }

    [Fact]
    public async Task Category_names_are_unique_per_business_ignoring_case()
    {
        var a = await CreateBusinessAsync("uniquea");
        var b = await CreateBusinessAsync("uniqueb");

        await using var scope = _services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<StorefrontDbContext>();
        db.Categories.Add(Category.Create(b.BusinessId, "Tea", 1, DateTimeOffset.UtcNow));
        await db.SaveChangesAsync();

        db.Categories.Add(Category.Create(a.BusinessId, "COFFEE", 1, DateTimeOffset.UtcNow));
        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());

        _user.BusinessId = a.BusinessId;
        await using var scope2 = _services.CreateAsyncScope();
        var catalog = scope2.ServiceProvider.GetRequiredService<ICatalogRepository>();
        Assert.True(await catalog.CategoryNameExistsAsync("coffee", null, CancellationToken.None));
        Assert.False(await catalog.CategoryNameExistsAsync("tea", null, CancellationToken.None));
    }

    [Fact]
    public async Task Domain_events_are_written_to_the_outbox_on_save()
    {
        await CreateBusinessAsync("outboxbiz");
        await using var scope = _services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<StorefrontDbContext>();
        var messages = await db.OutboxMessages.Select(m => m.Type).ToListAsync();
        Assert.Contains(nameof(CategoryChanged), messages);
        Assert.Contains(nameof(ProductChanged), messages);
        Assert.All(await db.OutboxMessages.ToListAsync(), m => Assert.Null(m.ProcessedAt));
    }

    [Fact]
    public async Task Prices_keep_three_decimals()
    {
        var a = await CreateBusinessAsync("pricebiz");
        _user.BusinessId = a.BusinessId;
        await using var scope = _services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<StorefrontDbContext>();
        db.Products.Add(Product.Create(a.BusinessId, a.CategoryId, new ProductDetails("Cortado", null, 2.755m), "JOD", 1, DateTimeOffset.UtcNow));
        await db.SaveChangesAsync();

        await using var scope2 = _services.CreateAsyncScope();
        var reloaded = await scope2.ServiceProvider.GetRequiredService<StorefrontDbContext>().Products.SingleAsync(p => p.Name == "Cortado");
        Assert.Equal(2.755m, reloaded.Price);
    }

    [Fact]
    public async Task Seeder_runs_twice_without_duplicating_rows()
    {
        for (var i = 0; i < 2; i++)
        {
            await using var scope = _services.CreateAsyncScope();
            await scope.ServiceProvider.GetRequiredService<DevelopmentSeeder>().SeedAsync(CancellationToken.None);
        }

        await using var check = _services.CreateAsyncScope();
        var db = check.ServiceProvider.GetRequiredService<StorefrontDbContext>();
        Assert.Equal(2, await db.Plans.CountAsync());
        Assert.True(await db.Templates.AnyAsync(t => t.Id == "souq"));
        Assert.Equal(1, await db.Businesses.CountAsync(b => b.Slug == Slug.FromStorage(DevelopmentSeeder.SampleSlug)));
        Assert.Equal(11, await db.Products.IgnoreQueryFilters().CountAsync());
        Assert.Equal(4, await db.Categories.IgnoreQueryFilters().CountAsync());
        Assert.Equal(0, await db.Set<OutboxMessage>().CountAsync());
    }
}
