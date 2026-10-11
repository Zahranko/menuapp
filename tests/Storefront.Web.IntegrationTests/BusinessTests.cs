using System.Net;
using System.Net.Http.Json;
using Storefront.Application.Accounts;
using Storefront.Application.Catalog;

namespace Storefront.Web.IntegrationTests;

public class BusinessTests(StorefrontFactory factory) : IClassFixture<StorefrontFactory>
{
    [Fact]
    public async Task Owner_reads_and_updates_business_info_without_changing_the_slug()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        var client = factory.CreateClient().Authorized(auth.AccessToken);

        var response = await client.PutAsJsonAsync("/api/v1/business", new
        {
            name = "A Completely New Name",
            whatsApp = "+962 79 123 4567",
            email = "hello@example.com",
            address = "Rainbow Street 21",
            instagram = "@newname",
            locale = "ar",
            timeZone = "Asia/Amman",
        });
        await Api.EnsureSuccess(response);

        var business = await client.GetFromJsonAsync<BusinessDto>("/api/v1/business", Api.Json);
        Assert.Equal("A Completely New Name", business!.Name);
        Assert.Equal(auth.Business.Slug, business.Slug);
        Assert.Equal("+962791234567", business.WhatsApp);
        Assert.Equal("newname", business.Instagram);
        Assert.Equal("ar", business.Locale);
    }

    [Fact]
    public async Task Update_validates_fields()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        var client = factory.CreateClient().Authorized(auth.AccessToken);
        var response = await client.PutAsJsonAsync("/api/v1/business", new { name = "", email = "bad", locale = "fr", whatsApp = "123" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await Api.ProblemAsync(response)).GetProperty("errors");
        Assert.True(errors.TryGetProperty("name", out _));
        Assert.True(errors.TryGetProperty("email", out _));
        Assert.True(errors.TryGetProperty("locale", out _));
    }

    [Fact]
    public async Task Each_owner_only_sees_their_own_business()
    {
        var a = await Api.RegisterAsync(factory.CreateClient());
        var b = await Api.RegisterAsync(factory.CreateClient());

        var asA = factory.CreateClient().Authorized(a.AccessToken);
        await Api.EnsureSuccess(await asA.PutAsJsonAsync("/api/v1/business", new { name = "Renamed by A" }));

        var businessB = await factory.CreateClient().Authorized(b.AccessToken).GetFromJsonAsync<BusinessDto>("/api/v1/business", Api.Json);
        Assert.Equal(b.Business.Id, businessB!.Id);
        Assert.NotEqual("Renamed by A", businessB.Name);
    }

    [Fact]
    public async Task New_businesses_default_to_US_dollars_and_UTC()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        Assert.Equal("USD", auth.Business.CurrencyCode);
        Assert.Equal("UTC", auth.Business.TimeZone);
    }

    [Fact]
    public async Task Owner_picks_the_currency_at_sign_up_and_changing_it_relabels_prices()
    {
        var owner = Api.NewOwner();
        var register = await factory.CreateClient().PostAsJsonAsync("/api/v1/auth/register", new
        {
            businessName = owner.Name,
            email = owner.Email,
            phone = owner.Phone,
            password = "Sunrise2026",
            currencyCode = "JOD",
            timeZone = "Asia/Dubai",
        });
        await Api.EnsureSuccess(register);
        var auth = (await register.Content.ReadFromJsonAsync<AuthResponse>(Api.Json))!;
        Assert.Equal("JOD", auth.Business.CurrencyCode);
        Assert.Equal("Asia/Dubai", auth.Business.TimeZone);

        var client = factory.CreateClient().Authorized(auth.AccessToken);
        var category = await client.PostAsJsonAsync("/api/v1/categories", new { name = "Coffee" });
        await Api.EnsureSuccess(category);
        var categoryId = (await category.Content.ReadFromJsonAsync<CategoryDto>(Api.Json))!.Id;
        var product = await client.PostAsJsonAsync("/api/v1/products", new { categoryId, name = "Latte", price = 1.255m });
        await Api.EnsureSuccess(product);
        var productId = (await product.Content.ReadFromJsonAsync<ProductDto>(Api.Json))!.Id;

        var update = await client.PutAsJsonAsync("/api/v1/business", new { name = owner.Name, currencyCode = "usd" });
        await Api.EnsureSuccess(update);
        Assert.Equal("USD", (await update.Content.ReadFromJsonAsync<BusinessDto>(Api.Json))!.CurrencyCode);
        Assert.Equal(1.26m, (await client.GetFromJsonAsync<ProductDto>($"/api/v1/products/{productId}", Api.Json))!.Price);

        var bad = await client.PutAsJsonAsync("/api/v1/business", new { name = owner.Name, currencyCode = "XYZ" });
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);
        Assert.True((await Api.ProblemAsync(bad)).GetProperty("errors").TryGetProperty("currencyCode", out _));
    }

    [Fact]
    public async Task Business_endpoints_require_login() =>
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateClient().GetAsync("/api/v1/business")).StatusCode);
}
