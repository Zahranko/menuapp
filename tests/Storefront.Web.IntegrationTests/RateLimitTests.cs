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
}
