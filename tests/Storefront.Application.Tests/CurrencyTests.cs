using FluentValidation;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Accounts;
using Storefront.Application.Businesses;
using Storefront.Application.Common;
using Storefront.Domain.Accounts;
using Storefront.Domain.Billing;
using Storefront.Domain.Businesses;
using Storefront.Domain.Catalog;
using Storefront.Domain.Common;
using Storefront.Domain.Sites;
using Storefront.Domain.Templates;

namespace Storefront.Application.Tests;

public class RegisterCurrencyTests
{
    private static Register Command(string? currency = null, string? timeZone = null) =>
        new("Olive Cafe", "owner@example.com", "+441632960000", "Sunrise2026", CurrencyCode: currency, TimeZone: timeZone);

    [Fact]
    public async Task Without_currency_or_time_zone_the_business_gets_US_dollars_and_UTC()
    {
        var world = new World();
        var result = await world.Register(Command());

        Assert.True(result.IsSuccess, result.Error?.Code);
        Assert.Equal("USD", world.Businesses.Added!.CurrencyCode);
        Assert.Equal("UTC", world.Businesses.Added.TimeZone);
        Assert.Equal("USD", result.Value.Business.CurrencyCode);
        Assert.Equal("UTC", result.Value.Business.TimeZone);
    }

    [Fact]
    public async Task The_owner_chooses_the_currency_and_time_zone()
    {
        var world = new World();
        var result = await world.Register(Command("eur", "Europe/Berlin"));

        Assert.True(result.IsSuccess, result.Error?.Code);
        Assert.Equal("EUR", world.Businesses.Added!.CurrencyCode);
        Assert.Equal("Europe/Berlin", world.Businesses.Added.TimeZone);
    }

    [Theory]
    [InlineData("XYZ", null, "currencyCode")]
    [InlineData("KRW", null, "currencyCode")]
    [InlineData(null, "Mars/Olympus", "timeZone")]
    public async Task Unknown_currency_or_time_zone_is_rejected(string? currency, string? timeZone, string field)
    {
        var world = new World();
        var result = await world.Register(Command(currency, timeZone));

        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorType.Validation, result.Error!.Type);
        Assert.True(result.Error.Fields!.ContainsKey(field));
        Assert.Null(world.Businesses.Added);
    }

    [Fact]
    public async Task Currency_error_has_its_own_message()
    {
        var error = await new RegisterValidator().CheckAsync(Command("XYZ"), CancellationToken.None);
        Assert.Equal(["Choose a currency from the list."], error!.Fields!["currencyCode"]);
    }
}

public class UpdateBusinessCurrencyTests
{
    private static UpdateBusiness Command(string? currency) =>
        new("Olive Cafe", null, null, null, null, null, null, currency);

    [Fact]
    public async Task Changing_currency_relabels_every_product_and_rounds_to_the_new_decimals()
    {
        var world = new World("JOD");
        var latte = world.AddProduct(1.255m);
        var tea = world.AddProduct(2m);
        var cake = world.AddProduct(0.5m);

        var result = await world.UpdateBusiness(Command("usd"));

        Assert.True(result.IsSuccess, result.Error?.Code);
        Assert.Equal("USD", result.Value.CurrencyCode);
        Assert.Equal("USD", world.Business.CurrencyCode);
        Assert.Equal(1.26m, latte.Price);
        Assert.Equal(2m, tea.Price);
        Assert.Equal(0.5m, cake.Price);
        Assert.Equal(1, world.Uow.Saves);
    }

    [Fact]
    public async Task Changing_to_yen_rounds_to_whole_numbers()
    {
        var world = new World("USD");
        var latte = world.AddProduct(3.49m);
        var cake = world.AddProduct(4.5m);

        var result = await world.UpdateBusiness(Command("JPY"));

        Assert.True(result.IsSuccess, result.Error?.Code);
        Assert.Equal(3m, latte.Price);
        Assert.Equal(5m, cake.Price);
    }

    [Fact]
    public async Task Same_or_missing_currency_leaves_prices_alone()
    {
        var world = new World("JOD");
        var latte = world.AddProduct(1.255m);

        Assert.True((await world.UpdateBusiness(Command(null))).IsSuccess);
        Assert.True((await world.UpdateBusiness(Command("jod"))).IsSuccess);

        Assert.Equal("JOD", world.Business.CurrencyCode);
        Assert.Equal(1.255m, latte.Price);
        Assert.Equal(0, world.Catalog.ProductLists);
    }

    [Fact]
    public async Task Unknown_currency_is_rejected_keyed_by_field()
    {
        var world = new World("JOD");
        var latte = world.AddProduct(1.255m);

        var result = await world.UpdateBusiness(Command("XYZ"));

        Assert.False(result.IsSuccess);
        Assert.Equal(["Choose a currency from the list."], result.Error!.Fields!["currencyCode"]);
        Assert.Equal("JOD", world.Business.CurrencyCode);
        Assert.Equal(1.255m, latte.Price);
        Assert.Equal(0, world.Uow.Saves);
    }
}

/// <summary>In-memory ports for handler tests.</summary>
internal sealed class World
{
    private static readonly DateTimeOffset Now = new(2026, 10, 1, 9, 0, 0, TimeSpan.Zero);

    public World(string? currency = null)
    {
        Business = Business.Create(Guid.CreateVersion7(), "Olive Cafe", Slug.FromStorage("olivecafe"), Now, currencyCode: currency ?? Currencies.Default);
        Businesses.Existing = Business;
        CurrentUser = new FakeCurrentUser(Business.OwnerUserId, Business.Id);
    }

    public Business Business { get; }
    public FakeBusinesses Businesses { get; } = new();
    public FakeCatalog Catalog { get; } = new();
    public FakeUow Uow { get; } = new();
    public FakeClock Clock { get; } = new(Now);
    public FakeCurrentUser CurrentUser { get; }

    private static SiteLinks Links => new(Options.Create(new BrandOptions { Domain = "example.test" }), Options.Create(new StorefrontOptions()));

    public Product AddProduct(decimal price)
    {
        var product = Product.Create(Business.Id, Guid.CreateVersion7(), new ProductDetails("Item", null, price), Business.CurrencyCode, Catalog.Products.Count, Now);
        Catalog.Products.Add(product);
        return product;
    }

    public Task<Result<BusinessDto>> UpdateBusiness(UpdateBusiness cmd) =>
        new UpdateBusinessHandler(new UpdateBusinessValidator(), CurrentUser, Businesses, Catalog, Uow, Clock, Links).Handle(cmd, CancellationToken.None);

    public Task<Result<AuthResponse>> Register(Register cmd)
    {
        Businesses.Existing = null;
        var reserved = new FakeReserved();
        var handler = new RegisterHandler(
            new RegisterValidator(),
            new FakeIdentity(),
            Businesses,
            new FakeTemplates(),
            new FakeSites(),
            new FakeBilling(),
            reserved,
            new SlugAvailabilityHandler(Businesses, reserved),
            new SessionIssuer(new FakeTokens(), new FakeRefreshTokens(), Uow, Clock, Links),
            Uow,
            Clock,
            Options.Create(new BillingOptions()));
        return handler.Handle(cmd, CancellationToken.None);
    }
}

internal sealed class FakeCurrentUser(Guid userId, Guid businessId) : ICurrentUser
{
    public Guid? UserId => userId;
    public Guid? BusinessId => businessId;
    public bool IsStaff => false;
}

internal sealed class FakeClock(DateTimeOffset now) : IClock
{
    public DateTimeOffset UtcNow => now;
}

internal sealed class FakeUow : IUnitOfWork
{
    public int Saves { get; private set; }

    public Task SaveChangesAsync(CancellationToken ct)
    {
        Saves++;
        return Task.CompletedTask;
    }

    public Task<TResult> InTransactionAsync<TResult>(Func<Task<TResult>> work, CancellationToken ct)
        where TResult : Result => work();
}

internal sealed class FakeBusinesses : IBusinessRepository
{
    public Business? Existing { get; set; }
    public Business? Added { get; private set; }

    public Task<Business?> GetAsync(Guid id, CancellationToken ct) => Task.FromResult(Existing?.Id == id ? Existing : Added?.Id == id ? Added : null);

    public Task<Business?> GetByOwnerAsync(Guid ownerUserId, CancellationToken ct) => Task.FromResult<Business?>(null);

    public Task<Business?> FindBySlugAsync(string slug, CancellationToken ct) => Task.FromResult<Business?>(null);

    public Task<bool> SlugExistsAsync(string slug, CancellationToken ct) => Task.FromResult(false);

    public void Add(Business business) => Added = business;
}

internal sealed class FakeCatalog : ICatalogRepository
{
    public List<Product> Products { get; } = [];
    public int ProductLists { get; private set; }

    public Task<IReadOnlyList<Product>> ListProductsAsync(Guid? categoryId, CancellationToken ct)
    {
        ProductLists++;
        return Task.FromResult<IReadOnlyList<Product>>(Products.Where(p => categoryId is null || p.CategoryId == categoryId).ToList());
    }

    public Task<IReadOnlyList<Category>> ListCategoriesAsync(CancellationToken ct) => throw new NotSupportedException();
    public Task<Category?> GetCategoryAsync(Guid id, CancellationToken ct) => throw new NotSupportedException();
    public Task<IReadOnlyList<Category>> ListSubcategoriesAsync(Guid parentId, CancellationToken ct) => throw new NotSupportedException();
    public Task<bool> CategoryNameExistsAsync(string name, Guid? exceptId, CancellationToken ct) => throw new NotSupportedException();
    public Task<IReadOnlyList<Product>> SearchProductsAsync(Guid? categoryId, string? text, CancellationToken ct) => throw new NotSupportedException();
    public Task<IReadOnlyDictionary<Guid, int>> CountProductsByCategoryAsync(CancellationToken ct) => throw new NotSupportedException();
    public Task<int> NextCategorySortOrderAsync(CancellationToken ct) => throw new NotSupportedException();
    public Task<int> NextProductSortOrderAsync(Guid categoryId, CancellationToken ct) => throw new NotSupportedException();
    public Task<Product?> GetProductAsync(Guid id, CancellationToken ct) => throw new NotSupportedException();
    public Task<int> CountProductsAsync(Guid categoryId, CancellationToken ct) => throw new NotSupportedException();
    public void Add(Category category) => throw new NotSupportedException();
    public void Add(Product product) => Products.Add(product);
    public void Remove(Category category) => throw new NotSupportedException();
    public void Remove(Product product) => Products.Remove(product);
}

internal sealed class FakeIdentity : IIdentityService
{
    public Task<Result<UserAccount>> CreateUserAsync(string email, string phone, string password, CancellationToken ct) =>
        Task.FromResult(Result<UserAccount>.Success(new UserAccount(Guid.CreateVersion7(), email, phone)));

    public Task<UserAccount?> FindByLoginAsync(string login, CancellationToken ct) => throw new NotSupportedException();
    public Task<UserAccount?> FindByIdAsync(Guid userId, CancellationToken ct) => throw new NotSupportedException();
    public Task<PasswordCheck> CheckPasswordAsync(Guid userId, string password, CancellationToken ct) => throw new NotSupportedException();
    public Task<string> CreatePasswordResetTokenAsync(Guid userId, CancellationToken ct) => throw new NotSupportedException();
    public Task<Result> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken ct) => throw new NotSupportedException();
}

internal sealed class FakeTemplates : ITemplateRepository
{
    private readonly Template _souq = Template.Create(RegisterHandler.DefaultTemplateId, 1, "Souq", "Cafe", null, null, "[]", "{}", 1);

    public Task<IReadOnlyList<Template>> ListAsync(bool activeOnly, CancellationToken ct) => Task.FromResult<IReadOnlyList<Template>>([_souq]);
    public Task<Template?> GetAsync(string id, CancellationToken ct) => Task.FromResult<Template?>(id == _souq.Id ? _souq : null);
    public void Add(Template template) => throw new NotSupportedException();
}

internal sealed class FakeSites : ISiteRepository
{
    public Task<Site?> GetForCurrentBusinessAsync(CancellationToken ct) => throw new NotSupportedException();
    public Task<Site?> GetByBusinessIdAsync(Guid businessId, CancellationToken ct) => throw new NotSupportedException();
    public void Add(Site site)
    {
    }
}

internal sealed class FakeBilling : IBillingRepository
{
    public Task<IReadOnlyList<Plan>> ListPlansAsync(CancellationToken ct) => throw new NotSupportedException();
    public Task<Plan?> GetPlanAsync(string code, CancellationToken ct) => throw new NotSupportedException();
    public Task<Subscription?> GetSubscriptionAsync(Guid businessId, CancellationToken ct) => throw new NotSupportedException();
    public void Add(Plan plan) => throw new NotSupportedException();
    public void Add(Subscription subscription)
    {
    }
}

internal sealed class FakeReserved : IReservedSlugs
{
    public IReadOnlySet<string> All { get; } = new HashSet<string>();
}

internal sealed class FakeTokens : ITokenService
{
    public TimeSpan RefreshTokenLifetime => TimeSpan.FromDays(30);
    public AccessToken CreateAccessToken(Guid userId, Guid businessId, string email) => new("access", DateTimeOffset.UtcNow.AddMinutes(15));
    public string NewRefreshToken() => "refresh";
    public string Hash(string refreshToken) => "hash:" + refreshToken;
}

internal sealed class FakeRefreshTokens : IRefreshTokenRepository
{
    public Task<RefreshToken?> FindByHashAsync(string hash, CancellationToken ct) => throw new NotSupportedException();
    public Task<IReadOnlyList<RefreshToken>> ListForUserAsync(Guid userId, CancellationToken ct) => throw new NotSupportedException();
    public void Add(RefreshToken token)
    {
    }
}
