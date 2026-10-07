using System.Net;
using System.Net.Http.Json;

namespace Storefront.Web.IntegrationTests;

public sealed class LowLimitFactory : StorefrontFactory
{
    protected override IDictionary<string, string?> ExtraSettings => new Dictionary<string, string?> { ["RateLimits:AuthPerMinute"] = "3" };
}

public class RateLimitTests(LowLimitFactory factory) : IClassFixture<LowLimitFactory>
{
    [Fact]
    public async Task Auth_endpoints_are_rate_limited()
    {
        var client = factory.CreateClient();
        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < 5; i++)
        {
            statuses.Add((await client.PostAsJsonAsync("/api/v1/auth/login", new { login = "x@example.com", password = "Wrong2026" })).StatusCode);
        }

        Assert.Contains(HttpStatusCode.TooManyRequests, statuses);
    }

    [Fact]
    public async Task Rejections_say_when_to_retry()
    {
        var client = factory.CreateClient();
        HttpResponseMessage response;
        do
        {
            response = await client.PostAsJsonAsync("/api/v1/auth/login", new { login = "y@example.com", password = "Wrong2026" });
        }
        while (response.StatusCode != HttpStatusCode.TooManyRequests);

        Assert.True(int.Parse(response.Headers.GetValues("Retry-After").Single()) is > 0 and <= 60);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }
}

public sealed class LowOwnerLimitFactory : StorefrontFactory
{
    protected override IDictionary<string, string?> ExtraSettings => new Dictionary<string, string?> { ["RateLimits:OwnerPerMinute"] = "3" };
}

public class OwnerRateLimitTests(LowOwnerLimitFactory factory) : IClassFixture<LowOwnerLimitFactory>
{
    [Fact]
    public async Task Each_owner_has_their_own_limit()
    {
        var first = await Api.RegisterAsync(factory.CreateClient());
        var second = await Api.RegisterAsync(factory.CreateClient());
        var client = factory.CreateClient().Authorized(first.AccessToken);
        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < 5; i++)
        {
            statuses.Add((await client.GetAsync("/api/v1/me")).StatusCode);
        }

        Assert.Contains(HttpStatusCode.TooManyRequests, statuses);
        Assert.Equal(HttpStatusCode.OK, (await factory.CreateClient().Authorized(second.AccessToken).GetAsync("/api/v1/me")).StatusCode);
    }
}
