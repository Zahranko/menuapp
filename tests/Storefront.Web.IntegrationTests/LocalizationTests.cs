using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Storefront.Application.Accounts;
using Storefront.Application.Sites;
using Storefront.Application.Templates;

namespace Storefront.Web.IntegrationTests;

/// <summary>Accept-Language: ar gets Arabic messages with the same codes; anything else stays English.</summary>
public class LocalizationTests(StorefrontFactory factory) : IClassFixture<StorefrontFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<HttpResponseMessage> LoginAsync(string language)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/login")
        {
            Content = JsonContent.Create(new { login = "nobody-" + Guid.NewGuid().ToString("N") + "@example.com", password = "Wrong2026" }),
        };
        request.Headers.AcceptLanguage.ParseAdd(language);
        return await _client.SendAsync(request);
    }

    [Theory]
    [InlineData("ar")]
    [InlineData("ar-JO")]
    [InlineData("ar-JO,ar;q=0.9,en;q=0.8")]
    public async Task Arabic_request_gets_an_Arabic_message_with_the_same_code(string language)
    {
        var response = await LoginAsync(language);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var problem = await Api.ProblemAsync(response);
        Assert.Equal("auth.invalid", problem.GetProperty("code").GetString());
        Assert.Equal("البريد أو الهاتف أو كلمة المرور غير صحيحة. حاول مرة أخرى.", problem.GetProperty("title").GetString());
    }

    [Fact]
    public async Task English_and_missing_language_stay_English()
    {
        var problem = await Api.ProblemAsync(await LoginAsync("en-US"));
        Assert.Equal("auth.invalid", problem.GetProperty("code").GetString());
        Assert.Equal("That email, phone or password doesn't match. Try again.", problem.GetProperty("title").GetString());
    }

    [Fact]
    public async Task Field_errors_are_Arabic_too()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/register")
        {
            Content = JsonContent.Create(new { businessName = "", email = "nope", phone = "123", password = "short" }),
        };
        request.Headers.AcceptLanguage.ParseAdd("ar");
        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await Api.ProblemAsync(response);
        Assert.Equal("validation", problem.GetProperty("code").GetString());
        Assert.Equal("بعض الحقول تحتاج إلى مراجعة.", problem.GetProperty("title").GetString());
        var errors = problem.GetProperty("errors");
        Assert.Equal("أدخل اسم نشاطك.", errors.GetProperty("businessName")[0].GetString());
        Assert.Equal("تحقق من صيغة البريد، مثل name@business.com.", errors.GetProperty("email")[0].GetString());
        Assert.Equal("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.", errors.GetProperty("password")[0].GetString());
    }

    [Fact]
    public async Task Unreadable_body_is_Arabic()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/login")
        {
            Content = new StringContent("{ not json", System.Text.Encoding.UTF8, "application/json"),
        };
        request.Headers.AcceptLanguage.ParseAdd("ar");
        var problem = await Api.ProblemAsync(await _client.SendAsync(request));
        Assert.Equal("request.invalid", problem.GetProperty("code").GetString());
        Assert.Equal("تعذّرت قراءة الطلب.", problem.GetProperty("title").GetString());
    }

    [Fact]
    public async Task Gallery_returns_Arabic_fields_and_the_raw_schema()
    {
        var auth = await Api.RegisterAsync(_client);
        var templates = await _client.Authorized(auth.AccessToken).GetFromJsonAsync<List<TemplateDto>>("/api/v1/templates", Api.Json);
        Assert.All(templates!, t => Assert.Equal(JsonValueKind.Object, t.DefaultsAr.ValueKind));

        // The committed registry carries Arabic for souq (ar block, defaultsAr and labelAr in the schema).
        var souq = Assert.Single(templates!, t => t.Id == "souq");
        Assert.NotNull(souq.Ar);
        Assert.NotEmpty(souq.DefaultsAr.EnumerateObject());
        Assert.Contains(souq.Schema.EnumerateArray(), f => f.TryGetProperty("labelAr", out _));
    }

    [Fact]
    public async Task Arabic_business_starts_with_the_Arabic_template_texts()
    {
        var owner = Api.NewOwner();
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", new { businessName = owner.Name, email = owner.Email, phone = owner.Phone, password = "Sunrise2026", locale = "ar" });
        await Api.EnsureSuccess(response);
        var auth = (await response.Content.ReadFromJsonAsync<AuthResponse>(Api.Json))!;
        var client = factory.CreateClient().Authorized(auth.AccessToken);

        var souq = (await client.GetFromJsonAsync<List<TemplateDto>>("/api/v1/templates", Api.Json))!.Single(t => t.Id == "souq");
        var (key, arabic) = souq.DefaultsAr.EnumerateObject().Select(p => (p.Name, p.Value)).First();

        var site = (await client.GetFromJsonAsync<SiteDto>("/api/v1/site", Api.Json))!;
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(arabic.GetRawText()), JsonNode.Parse(site.DraftSettings.GetProperty(key).GetRawText())));

        await Api.EnsureSuccess(await client.PutAsJsonAsync("/api/v1/site/template", new { templateId = "souq" }));
        site = (await client.GetFromJsonAsync<SiteDto>("/api/v1/site", Api.Json))!;
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(arabic.GetRawText()), JsonNode.Parse(site.DraftSettings.GetProperty(key).GetRawText())));
    }

    [Fact]
    public async Task English_business_starts_with_the_English_defaults()
    {
        var auth = await Api.RegisterAsync(_client);
        var client = factory.CreateClient().Authorized(auth.AccessToken);
        var souq = (await client.GetFromJsonAsync<List<TemplateDto>>("/api/v1/templates", Api.Json))!.Single(t => t.Id == "souq");
        var site = (await client.GetFromJsonAsync<SiteDto>("/api/v1/site", Api.Json))!;
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(souq.Defaults.GetRawText()), JsonNode.Parse(site.DraftSettings.GetRawText())));
    }
}
