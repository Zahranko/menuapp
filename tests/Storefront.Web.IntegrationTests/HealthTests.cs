using System.Net;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Storefront.Application.Common;

namespace Storefront.Web.IntegrationTests;

public class HealthTests(StorefrontFactory factory) : IClassFixture<StorefrontFactory>
{
    [Fact]
    public async Task Health_endpoint_returns_ok()
    {
        var response = await factory.CreateClient().GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task OpenApi_document_is_served()
    {
        var response = await factory.CreateClient().GetAsync("/openapi/v1.json");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public void Brand_options_are_loaded_from_brand_file()
    {
        var brand = factory.Services.GetRequiredService<IOptions<BrandOptions>>().Value;
        Assert.False(string.IsNullOrWhiteSpace(brand.BrandName));
        Assert.False(string.IsNullOrWhiteSpace(brand.Domain));
    }
}
