using System.Net;
using System.Net.Http.Json;
using Storefront.Application.Accounts;

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
    public async Task Business_endpoints_require_login() =>
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateClient().GetAsync("/api/v1/business")).StatusCode);
}
