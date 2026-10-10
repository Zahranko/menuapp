using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Storefront.Application.Catalog;
using Storefront.Application.Media;
using Storefront.Domain.Media;
using Storefront.Infrastructure.Persistence;

namespace Storefront.Web.IntegrationTests;

public class CatalogTests(StorefrontFactory factory) : IClassFixture<StorefrontFactory>
{
    private async Task<(HttpClient Client, Guid BusinessId)> OwnerAsync()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        return (factory.CreateClient().Authorized(auth.AccessToken), auth.Business.Id);
    }

    private static async Task<CategoryDto> CreateCategory(HttpClient client, string name)
    {
        var response = await client.PostAsJsonAsync("/api/v1/categories", new { name });
        await Api.EnsureSuccess(response);
        return (await response.Content.ReadFromJsonAsync<CategoryDto>(Api.Json))!;
    }

    private static async Task<ProductDto> CreateProduct(HttpClient client, Guid categoryId, string name, decimal price = 3.5m, string? description = null)
    {
        var response = await client.PostAsJsonAsync("/api/v1/products", new { categoryId, name, price, description, label = "New", isAvailable = true, isFeatured = false });
        await Api.EnsureSuccess(response);
        return (await response.Content.ReadFromJsonAsync<ProductDto>(Api.Json))!;
    }

    [Fact]
    public async Task Categories_create_list_rename_and_count_products()
    {
        var (client, _) = await OwnerAsync();
        var coffee = await CreateCategory(client, "Coffee");
        var tea = await CreateCategory(client, "Tea");
        await CreateProduct(client, coffee.Id, "Latte");
        await CreateProduct(client, coffee.Id, "Mocha");

        var renamed = await client.PutAsJsonAsync($"/api/v1/categories/{tea.Id}", new { name = "Teas" });
        await Api.EnsureSuccess(renamed);

        var list = await client.GetFromJsonAsync<List<CategoryDto>>("/api/v1/categories", Api.Json);
        Assert.Equal(["Coffee", "Teas"], list!.Select(c => c.Name));
        Assert.Equal([2, 0], list.Select(c => c.ProductCount));
    }

    [Fact]
    public async Task Category_names_must_be_unique_ignoring_case()
    {
        var (client, _) = await OwnerAsync();
        await CreateCategory(client, "Coffee");
        var response = await client.PostAsJsonAsync("/api/v1/categories", new { name = " coffee " });
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("You already have a category with that name.", (await Api.ProblemAsync(response)).GetProperty("errors").GetProperty("name")[0].GetString());

        var empty = await client.PostAsJsonAsync("/api/v1/categories", new { name = "" });
        Assert.Equal("Enter a category name.", (await Api.ProblemAsync(empty)).GetProperty("errors").GetProperty("name")[0].GetString());
    }

    [Fact]
    public async Task Deleting_a_category_with_products_requires_a_choice()
    {
        var (client, _) = await OwnerAsync();
        var coffee = await CreateCategory(client, "Coffee");
        var drinks = await CreateCategory(client, "Drinks");
        await CreateProduct(client, drinks.Id, "Water");
        var latte = await CreateProduct(client, coffee.Id, "Latte");
        await CreateProduct(client, coffee.Id, "Mocha");

        var noChoice = await client.DeleteAsync($"/api/v1/categories/{coffee.Id}");
        Assert.Equal(HttpStatusCode.BadRequest, noChoice.StatusCode);
        Assert.Equal("category.hasProducts", (await Api.ProblemAsync(noChoice)).GetProperty("code").GetString());

        var moved = await client.DeleteAsync($"/api/v1/categories/{coffee.Id}?moveTo={drinks.Id}");
        Assert.Equal(HttpStatusCode.NoContent, moved.StatusCode);

        var products = await client.GetFromJsonAsync<List<ProductDto>>($"/api/v1/products?categoryId={drinks.Id}", Api.Json);
        Assert.Equal(["Water", "Latte", "Mocha"], products!.Select(p => p.Name));
        Assert.Equal([0, 1, 2], products.Select(p => p.SortOrder));
        Assert.Contains(products, p => p.Id == latte.Id);
    }

    [Fact]
    public async Task Deleting_a_category_can_delete_its_products()
    {
        var (client, _) = await OwnerAsync();
        var bakery = await CreateCategory(client, "Bakery");
        await CreateProduct(client, bakery.Id, "Croissant");

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/v1/categories/{bakery.Id}?deleteProducts=true")).StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<List<ProductDto>>("/api/v1/products", Api.Json))!);
        Assert.Empty((await client.GetFromJsonAsync<List<CategoryDto>>("/api/v1/categories", Api.Json))!);
    }

    [Fact]
    public async Task Moving_products_to_the_same_category_is_rejected()
    {
        var (client, _) = await OwnerAsync();
        var coffee = await CreateCategory(client, "Coffee");
        await CreateProduct(client, coffee.Id, "Latte");
        var response = await client.DeleteAsync($"/api/v1/categories/{coffee.Id}?moveTo={coffee.Id}");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Categories_and_products_can_be_reordered()
    {
        var (client, _) = await OwnerAsync();
        var a = await CreateCategory(client, "A");
        var b = await CreateCategory(client, "B");
        var c = await CreateCategory(client, "C");
        await Api.EnsureSuccess(await client.PutAsJsonAsync("/api/v1/categories/order", new[] { c.Id, a.Id, b.Id }));
        Assert.Equal(["C", "A", "B"], (await client.GetFromJsonAsync<List<CategoryDto>>("/api/v1/categories", Api.Json))!.Select(x => x.Name));

        var bad = await client.PutAsJsonAsync("/api/v1/categories/order", new[] { c.Id, a.Id });
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);

        var p1 = await CreateProduct(client, a.Id, "One");
        var p2 = await CreateProduct(client, a.Id, "Two");
        await Api.EnsureSuccess(await client.PutAsJsonAsync("/api/v1/products/order", new { categoryId = a.Id, ids = new[] { p2.Id, p1.Id } }));
        Assert.Equal(["Two", "One"], (await client.GetFromJsonAsync<List<ProductDto>>($"/api/v1/products?categoryId={a.Id}", Api.Json))!.Select(x => x.Name));
    }

    [Fact]
    public async Task Products_crud_search_and_availability()
    {
        var (client, _) = await OwnerAsync();
        var coffee = await CreateCategory(client, "Coffee");
        var latte = await CreateProduct(client, coffee.Id, "Vanilla latte", 3.5m, "Madagascar vanilla");
        await CreateProduct(client, coffee.Id, "Cortado", 2.75m, "A pinch of cardamom");

        Assert.Equal("Vanilla latte", (await client.GetFromJsonAsync<ProductDto>($"/api/v1/products/{latte.Id}", Api.Json))!.Name);
        Assert.Equal(["Cortado"], (await client.GetFromJsonAsync<List<ProductDto>>("/api/v1/products?q=CARDAMOM", Api.Json))!.Select(p => p.Name));
        Assert.Empty((await client.GetFromJsonAsync<List<ProductDto>>("/api/v1/products?q=100%25", Api.Json))!);

        var update = await client.PutAsJsonAsync($"/api/v1/products/{latte.Id}", new { categoryId = coffee.Id, name = "Vanilla latte", price = 3.755m, label = "Signature", isFeatured = true, isAvailable = true });
        await Api.EnsureSuccess(update);
        var updated = (await update.Content.ReadFromJsonAsync<ProductDto>(Api.Json))!;
        Assert.Equal(3.755m, updated.Price);
        Assert.True(updated.IsFeatured);

        var soldOut = await client.PatchAsJsonAsync($"/api/v1/products/{latte.Id}/availability", new { isAvailable = false });
        Assert.False((await soldOut.Content.ReadFromJsonAsync<ProductDto>(Api.Json))!.IsAvailable);

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/v1/products/{latte.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/v1/products/{latte.Id}")).StatusCode);
    }

    [Fact]
    public async Task Product_validation_uses_the_prototype_copy()
    {
        var (client, _) = await OwnerAsync();
        var coffee = await CreateCategory(client, "Coffee");

        var missing = await client.PostAsJsonAsync("/api/v1/products", new { categoryId = coffee.Id, name = "", price = (decimal?)null });
        var errors = (await Api.ProblemAsync(missing)).GetProperty("errors");
        Assert.Equal("Enter a product name.", errors.GetProperty("name")[0].GetString());
        Assert.Equal("Enter a price.", errors.GetProperty("price")[0].GetString());

        var tooPrecise = await client.PostAsJsonAsync("/api/v1/products", new { categoryId = coffee.Id, name = "Latte", price = 3.5555m });
        Assert.Equal("Use numbers only, like 3.50.", (await Api.ProblemAsync(tooPrecise)).GetProperty("errors").GetProperty("price")[0].GetString());

        var badLabel = await client.PostAsJsonAsync("/api/v1/products", new { categoryId = coffee.Id, name = "Latte", price = 3m, label = "Hot" });
        Assert.True((await Api.ProblemAsync(badLabel)).GetProperty("errors").TryGetProperty("label", out _));
    }

    [Fact]
    public async Task Owners_cannot_see_or_use_each_others_catalog()
    {
        var (a, _) = await OwnerAsync();
        var (b, _) = await OwnerAsync();
        var aCoffee = await CreateCategory(a, "Coffee");
        var aLatte = await CreateProduct(a, aCoffee.Id, "Latte");

        Assert.Empty((await b.GetFromJsonAsync<List<CategoryDto>>("/api/v1/categories", Api.Json))!);
        Assert.Empty((await b.GetFromJsonAsync<List<ProductDto>>("/api/v1/products", Api.Json))!);
        Assert.Equal(HttpStatusCode.NotFound, (await b.GetAsync($"/api/v1/products/{aLatte.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await b.DeleteAsync($"/api/v1/products/{aLatte.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await b.PutAsJsonAsync($"/api/v1/categories/{aCoffee.Id}", new { name = "Mine" })).StatusCode);

        // B cannot file a product under A's category.
        var steal = await b.PostAsJsonAsync("/api/v1/products", new { categoryId = aCoffee.Id, name = "Sneaky", price = 1m });
        Assert.Equal(HttpStatusCode.BadRequest, steal.StatusCode);
    }

    [Fact]
    public async Task Changes_write_outbox_rows_and_audit_entries_in_the_same_save()
    {
        var (client, businessId) = await OwnerAsync();
        var coffee = await CreateCategory(client, "Coffee");
        var latte = await CreateProduct(client, coffee.Id, "Latte");

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<StorefrontDbContext>();
        var outbox = (await db.OutboxMessages.ToListAsync()).Where(m => m.Payload.Contains(latte.Id.ToString())).ToList();
        Assert.Single(outbox);
        Assert.Equal("ProductChanged", outbox[0].Type);

        var audit = await db.AuditLog.Where(a => a.BusinessId == businessId).Select(a => a.Action + ":" + a.EntityType).ToListAsync();
        Assert.Contains("create:Category", audit);
        Assert.Contains("create:Product", audit);
    }

    [Fact]
    public async Task Image_upload_checks_type_and_size_then_stores_a_compressed_copy()
    {
        var (client, _) = await OwnerAsync();
        var photo = ImageOptimizerTests.Photo(3000, 2000);

        // Stored shrunk and compressed to WebP, whatever was uploaded.
        var ok = await client.PostAsync("/api/v1/media", Upload(photo, "photo.jpg", "image/jpeg"));
        Assert.Equal(HttpStatusCode.Created, ok.StatusCode);
        var media = (await ok.Content.ReadFromJsonAsync<MediaDto>(Api.Json))!;
        Assert.Equal("image/webp", media.ContentType);
        Assert.EndsWith(".webp", media.Url);
        Assert.True(media.SizeBytes <= MediaAsset.MaxBytes && media.SizeBytes < photo.Length);
        Assert.StartsWith("http://localhost/media/", media.Url);

        var broken = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13, 1, 2, 3 };
        var unreadable = await client.PostAsync("/api/v1/media", Upload(broken, "photo.png", "image/png"));
        Assert.Equal("media.type", (await Api.ProblemAsync(unreadable)).GetProperty("code").GetString());

        var fake = await client.PostAsync("/api/v1/media", Upload("not an image at all"u8.ToArray(), "photo.jpg", "image/jpeg"));
        Assert.Equal("media.type", (await Api.ProblemAsync(fake)).GetProperty("code").GetString());

        var big = new byte[5 * 1024 * 1024 + 10];
        new byte[] { 0xFF, 0xD8, 0xFF }.CopyTo(big, 0);
        var tooBig = await client.PostAsync("/api/v1/media", Upload(big, "big.jpg", "image/jpeg"));
        Assert.Equal(HttpStatusCode.BadRequest, tooBig.StatusCode);

        // The uploaded URL can be used on a product; a URL from elsewhere cannot.
        var coffee = await CreateCategory(client, "Coffee");
        await Api.EnsureSuccess(await client.PostAsJsonAsync("/api/v1/products", new { categoryId = coffee.Id, name = "Latte", price = 3m, imageUrl = media.Url }));
        var foreign = await client.PostAsJsonAsync("/api/v1/products", new { categoryId = coffee.Id, name = "Mocha", price = 3m, imageUrl = "https://example.com/x.png" });
        Assert.Equal(HttpStatusCode.BadRequest, foreign.StatusCode);
    }

    [Fact]
    public async Task Catalog_requires_login() =>
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateClient().GetAsync("/api/v1/products")).StatusCode);

    private static MultipartFormDataContent Upload(byte[] bytes, string fileName, string contentType)
    {
        var content = new ByteArrayContent(bytes);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
        return new MultipartFormDataContent { { content, "file", fileName } };
    }
}
