using System.Net;
using System.Net.Http.Json;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Storefront.Web.IntegrationTests;

public class SecurityTests(StorefrontFactory factory) : IClassFixture<StorefrontFactory>
{
    [Fact]
    public async Task Api_responses_carry_security_headers()
    {
        var response = await factory.CreateClient().GetAsync("/api/v1/templates");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").Single());
        Assert.Equal("no-referrer", response.Headers.GetValues("Referrer-Policy").Single());
        Assert.Equal("default-src 'none'; frame-ancestors 'none'", response.Headers.GetValues("Content-Security-Policy").Single());
        Assert.False(response.Headers.Contains("Server"));
    }

    [Fact]
    public async Task Owner_responses_are_never_cached()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        var response = await factory.CreateClient().Authorized(auth.AccessToken).GetAsync("/api/v1/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.CacheControl?.NoStore);
    }

    [Fact]
    public async Task Unsigned_tokens_are_rejected()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        var payload = auth.AccessToken.Split('.')[1];
        var header = Base64UrlEncoder.Encode(Encoding.UTF8.GetBytes("""{"alg":"none","typ":"JWT"}"""));

        var response = await factory.CreateClient().Authorized($"{header}.{payload}.").GetAsync("/api/v1/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Tampered_tokens_are_rejected()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        var parts = auth.AccessToken.Split('.');
        var other = Base64UrlEncoder.Encode(Base64UrlEncoder.DecodeBytes(parts[1]).Reverse().ToArray());

        var response = await factory.CreateClient().Authorized($"{parts[0]}.{other}.{parts[2]}").GetAsync("/api/v1/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}

public sealed class HttpsOnlyFactory : StorefrontFactory
{
    protected override IDictionary<string, string?> ExtraSettings => new Dictionary<string, string?> { ["Security:RequireHttps"] = "true" };
}

public class HttpsTests(HttpsOnlyFactory factory) : IClassFixture<HttpsOnlyFactory>
{
    [Fact]
    public async Task Plain_http_get_is_redirected_to_https()
    {
        var client = factory.CreateClient(new() { AllowAutoRedirect = false, BaseAddress = new Uri("http://api.example.test") });
        var response = await client.GetAsync("/api/v1/templates?x=1");

        Assert.Equal(HttpStatusCode.PermanentRedirect, response.StatusCode);
        Assert.Equal("https://api.example.test/api/v1/templates?x=1", response.Headers.Location!.ToString());
    }

    [Fact]
    public async Task Plain_http_post_is_refused_not_redirected()
    {
        var client = factory.CreateClient(new() { AllowAutoRedirect = false, BaseAddress = new Uri("http://api.example.test") });
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { login = "x@example.com", password = "Wrong2026" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Null(response.Headers.Location);
    }

    [Fact]
    public async Task Health_check_works_over_plain_http()
    {
        var client = factory.CreateClient(new() { AllowAutoRedirect = false, BaseAddress = new Uri("http://localhost") });
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health")).StatusCode);
    }

    [Fact]
    public async Task Https_responses_send_hsts()
    {
        var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        var response = await client.GetAsync("/api/v1/templates");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.StartsWith("max-age=31536000", response.Headers.GetValues("Strict-Transport-Security").Single());
    }
}
