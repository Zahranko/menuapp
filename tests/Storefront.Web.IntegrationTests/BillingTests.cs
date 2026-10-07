using System.Net;
using System.Net.Http.Json;
using Storefront.Application.Accounts;
using Storefront.Application.Billing;
using Storefront.Application.Domains;

namespace Storefront.Web.IntegrationTests;

public class BillingTests(StorefrontFactory factory) : IClassFixture<StorefrontFactory>
{
    [Fact]
    public async Task Plans_are_listed_without_login()
    {
        var plans = await factory.CreateClient().GetFromJsonAsync<List<PlanDto>>("/api/v1/plans", Api.Json);
        Assert.Equal(["basic", "pro"], plans!.Select(p => p.Code));
        Assert.True(plans[1].AllowsCustomDomain);
    }

    [Fact]
    public async Task New_owner_starts_on_a_basic_trial_and_cannot_request_a_domain()
    {
        var client = await OwnerAsync();
        var subscription = await client.GetFromJsonAsync<SubscriptionDto>("/api/v1/subscription", Api.Json);
        Assert.Equal("basic", subscription!.PlanCode);
        Assert.Equal("trialing", subscription.Status);
        Assert.False(subscription.AllowsCustomDomain);

        var response = await client.PostAsJsonAsync("/api/v1/domain-request", new { domain = "vanilla-test.com" });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Pro_owner_requests_and_cancels_a_domain()
    {
        var client = await OwnerAsync();
        await Api.EnsureSuccess(await client.PostAsJsonAsync("/api/v1/subscription/change", new { planCode = "pro" }));

        Assert.Equal(HttpStatusCode.NoContent, (await client.GetAsync("/api/v1/domain-request")).StatusCode);

        var domain = $"cafe{Guid.NewGuid():N}"[..20] + ".com";
        var created = await client.PostAsJsonAsync("/api/v1/domain-request", new { domain = $"https://www.{domain.ToUpperInvariant()}/" });
        await Api.EnsureSuccess(created);
        var request = await created.Content.ReadFromJsonAsync<DomainRequestDto>(Api.Json);
        Assert.Equal(domain, request!.Domain);
        Assert.Equal("requested", request.Status);

        var again = await client.PostAsJsonAsync("/api/v1/domain-request", new { domain = "another-one.com" });
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync("/api/v1/domain-request")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.GetAsync("/api/v1/domain-request")).StatusCode);
    }

    [Fact]
    public async Task Downgrading_cancels_the_domain_request()
    {
        var client = await OwnerAsync();
        await Api.EnsureSuccess(await client.PostAsJsonAsync("/api/v1/subscription/change", new { planCode = "pro" }));
        await Api.EnsureSuccess(await client.PostAsJsonAsync("/api/v1/domain-request", new { domain = $"d{Guid.NewGuid():N}"[..16] + ".net" }));

        var response = await client.PostAsJsonAsync("/api/v1/subscription/change", new { planCode = "basic" });
        await Api.EnsureSuccess(response);
        var change = await response.Content.ReadFromJsonAsync<ChangePlanResponse>(Api.Json);
        Assert.Equal("basic", change!.Subscription.PlanCode);
        Assert.Equal("active", change.Subscription.Status);
        Assert.Equal(HttpStatusCode.NoContent, (await client.GetAsync("/api/v1/domain-request")).StatusCode);
    }

    [Fact]
    public async Task The_brand_domain_cannot_be_requested()
    {
        var client = await OwnerAsync();
        await Api.EnsureSuccess(await client.PostAsJsonAsync("/api/v1/subscription/change", new { planCode = "pro" }));
        var me = await client.GetFromJsonAsync<MeResponse>("/api/v1/me", Api.Json);
        var brandHost = new Uri(me!.Business.SiteUrl).Host;

        var response = await client.PostAsJsonAsync("/api/v1/domain-request", new { domain = $"shop.{brandHost}" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Unknown_plan_is_rejected()
    {
        var client = await OwnerAsync();
        var response = await client.PostAsJsonAsync("/api/v1/subscription/change", new { planCode = "gold" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task<HttpClient> OwnerAsync()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        return factory.CreateClient().Authorized(auth.AccessToken);
    }
}

public sealed class TestModeFactory : StorefrontFactory
{
    protected override IDictionary<string, string?> ExtraSettings => new Dictionary<string, string?>
    {
        ["Billing:TestMode"] = "true",
        ["Storefront:SitesBaseUrl"] = "https://sites.example.net/",
    };
}

public class BillingTestModeTests(TestModeFactory factory) : IClassFixture<TestModeFactory>
{
    [Fact]
    public async Task Test_mode_signs_owners_up_on_an_active_pro_plan()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        var client = factory.CreateClient().Authorized(auth.AccessToken);

        var subscription = await client.GetFromJsonAsync<SubscriptionDto>("/api/v1/subscription", Api.Json);
        Assert.Equal("pro", subscription!.PlanCode);
        Assert.Equal("active", subscription.Status);
        Assert.True(subscription.AllowsCustomDomain);
        Assert.True(subscription.TestMode);
    }

    [Fact]
    public async Task Sites_base_url_sets_the_site_link()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        Assert.Equal($"https://sites.example.net/{auth.Business.Slug}", auth.Business.SiteUrl);
    }
}
