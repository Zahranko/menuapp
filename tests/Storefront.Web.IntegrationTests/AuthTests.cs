using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Storefront.Application.Accounts;
using Storefront.Infrastructure.Persistence.Seeding;

namespace Storefront.Web.IntegrationTests;

public partial class AuthTests(StorefrontFactory factory) : IClassFixture<StorefrontFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Register_creates_business_site_and_trial_and_returns_tokens()
    {
        var owner = Api.NewOwner();
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", new { businessName = "Olive & Thyme Kitchen", email = owner.Email, phone = owner.Phone, password = "Sunrise2026" });
        await Api.EnsureSuccess(response);
        var auth = (await response.Content.ReadFromJsonAsync<AuthResponse>(Api.Json))!;

        Assert.False(string.IsNullOrEmpty(auth.AccessToken));
        Assert.False(string.IsNullOrEmpty(auth.RefreshToken));
        Assert.Equal("Olive & Thyme Kitchen", auth.Business.Name);
        Assert.Equal("olivethymekitchen", auth.Business.Slug);
        Assert.EndsWith("/olivethymekitchen", auth.Business.SiteUrl);
        Assert.Equal(owner.Email, auth.Business.Email);
    }

    [Fact]
    public async Task Register_reports_errors_per_field()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", new { businessName = "", email = "nope", phone = "123", password = "short" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await Api.ProblemAsync(response);
        var errors = problem.GetProperty("errors");
        Assert.Equal("Enter your business name.", errors.GetProperty("businessName")[0].GetString());
        Assert.Equal("Check the email format, like name@business.com.", errors.GetProperty("email")[0].GetString());
        Assert.Equal("Enter a full phone number with the country code.", errors.GetProperty("phone")[0].GetString());
        Assert.Equal("Password needs at least 8 characters.", errors.GetProperty("password")[0].GetString());
        Assert.Equal("validation", problem.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Password_needs_a_number_and_a_capital_letter()
    {
        var owner = Api.NewOwner();
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", new { businessName = owner.Name, email = owner.Email, phone = owner.Phone, password = "alllowercase" });
        var errors = (await Api.ProblemAsync(response)).GetProperty("errors");
        Assert.Equal("Add a number to your password.", errors.GetProperty("password")[0].GetString());
    }

    [Fact]
    public async Task Register_rejects_a_taken_link_with_the_prototype_message()
    {
        var owner = Api.NewOwner();
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", new { businessName = "Vanilla Menu", email = owner.Email, phone = owner.Phone, password = "Sunrise2026" });
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var errors = (await Api.ProblemAsync(response)).GetProperty("errors");
        Assert.Equal("That link is taken. Try adding your city, like vanillamenuamman.", errors.GetProperty("businessName")[0].GetString());
    }

    [Fact]
    public async Task Register_rejects_a_duplicate_email_and_phone()
    {
        var first = Api.NewOwner();
        await Api.EnsureSuccess(await _client.PostAsJsonAsync("/api/v1/auth/register", new { businessName = first.Name, email = first.Email, phone = first.Phone, password = "Sunrise2026" }));

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", new { businessName = first.Name + " Two", email = first.Email.ToUpperInvariant(), phone = first.Phone, password = "Sunrise2026" });
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var errors = (await Api.ProblemAsync(response)).GetProperty("errors");
        Assert.True(errors.TryGetProperty("email", out _));
        Assert.True(errors.TryGetProperty("phone", out _));
    }

    [Fact]
    public async Task Register_rejects_reserved_links()
    {
        var owner = Api.NewOwner();
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", new { businessName = "Admin", email = owner.Email, phone = owner.Phone, password = "Sunrise2026" });
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Theory]
    [InlineData("Vanilla Menu", "vanillamenu", false)]
    [InlineData("Brand New Bakery 77", "brandnewbakery77", true)]
    [InlineData("Login", "login", false)]
    [InlineData("مقهى", "", false)]
    public async Task Slug_availability_checks_the_link(string name, string slug, bool available)
    {
        var result = await _client.GetFromJsonAsync<SlugAvailabilityResponse>($"/api/v1/auth/slug-availability?name={Uri.EscapeDataString(name)}", Api.Json);
        Assert.Equal(slug, result!.Slug);
        Assert.Equal(available, result.Available);
        if (!available && slug.Length > 0)
        {
            Assert.NotNull(result.Suggestion);
            Assert.NotEqual(slug, result.Suggestion);
        }
    }

    [Fact]
    public async Task Login_works_with_email_or_phone()
    {
        var owner = Api.NewOwner();
        await Api.EnsureSuccess(await _client.PostAsJsonAsync("/api/v1/auth/register", new { businessName = owner.Name, email = owner.Email, phone = owner.Phone, password = "Sunrise2026" }));

        var byEmail = await _client.PostAsJsonAsync("/api/v1/auth/login", new { login = owner.Email.ToUpperInvariant(), password = "Sunrise2026" });
        await Api.EnsureSuccess(byEmail);

        var spacedPhone = owner.Phone.Insert(4, " ").Insert(7, " ");
        var byPhone = await _client.PostAsJsonAsync("/api/v1/auth/login", new { login = spacedPhone, password = "Sunrise2026" });
        await Api.EnsureSuccess(byPhone);
    }

    [Fact]
    public async Task Sample_owner_can_log_in()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new { login = DevelopmentSeeder.SampleOwnerEmail, password = DevelopmentSeeder.SampleOwnerPassword });
        await Api.EnsureSuccess(response);
        var auth = (await response.Content.ReadFromJsonAsync<AuthResponse>(Api.Json))!;
        Assert.Equal(DevelopmentSeeder.SampleSlug, auth.Business.Slug);
    }

    [Fact]
    public async Task Login_locks_out_after_five_wrong_passwords()
    {
        var owner = Api.NewOwner();
        await Api.EnsureSuccess(await _client.PostAsJsonAsync("/api/v1/auth/register", new { businessName = owner.Name, email = owner.Email, phone = owner.Phone, password = "Sunrise2026" }));

        for (var i = 0; i < 4; i++)
        {
            var wrong = await _client.PostAsJsonAsync("/api/v1/auth/login", new { login = owner.Email, password = "Wrong2026" });
            Assert.Equal("auth.invalid", (await Api.ProblemAsync(wrong)).GetProperty("code").GetString());
        }

        var fifth = await _client.PostAsJsonAsync("/api/v1/auth/login", new { login = owner.Email, password = "Wrong2026" });
        Assert.Equal(HttpStatusCode.Unauthorized, fifth.StatusCode);
        Assert.Equal("auth.locked", (await Api.ProblemAsync(fifth)).GetProperty("code").GetString());

        var correct = await _client.PostAsJsonAsync("/api/v1/auth/login", new { login = owner.Email, password = "Sunrise2026" });
        Assert.Equal("auth.locked", (await Api.ProblemAsync(correct)).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Refresh_rotates_tokens_and_reuse_revokes_the_chain()
    {
        var auth = await Api.RegisterAsync(_client);

        var first = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = auth.RefreshToken });
        await Api.EnsureSuccess(first);
        var rotated = (await first.Content.ReadFromJsonAsync<AuthResponse>(Api.Json))!;
        Assert.NotEqual(auth.RefreshToken, rotated.RefreshToken);

        // The old token is presented again: refused, and the token it was swapped for stops working too.
        var reuse = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = auth.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, reuse.StatusCode);

        var afterReuse = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = rotated.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, afterReuse.StatusCode);
    }

    [Fact]
    public async Task Refresh_rejects_unknown_tokens()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = "not-a-token" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_revokes_the_refresh_token()
    {
        var auth = await Api.RegisterAsync(_client);
        var client = factory.CreateClient().Authorized(auth.AccessToken);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/api/v1/auth/logout", new { refreshToken = auth.RefreshToken })).StatusCode);

        var refresh = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = auth.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, refresh.StatusCode);
    }

    [Fact]
    public async Task Logout_requires_login()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/logout", new { refreshToken = "x" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Forgot_password_always_returns_202_and_emails_only_real_accounts()
    {
        var owner = Api.NewOwner();
        await Api.EnsureSuccess(await _client.PostAsJsonAsync("/api/v1/auth/register", new { businessName = owner.Name, email = owner.Email, phone = owner.Phone, password = "Sunrise2026" }));

        var unknown = await _client.PostAsJsonAsync("/api/v1/auth/forgot-password", new { email = "nobody-here@example.com" });
        Assert.Equal(HttpStatusCode.Accepted, unknown.StatusCode);
        Assert.DoesNotContain(factory.Emails.Sent, m => m.To == "nobody-here@example.com");

        var known = await _client.PostAsJsonAsync("/api/v1/auth/forgot-password", new { email = owner.Email });
        Assert.Equal(HttpStatusCode.Accepted, known.StatusCode);
        Assert.Contains(factory.Emails.Sent, m => m.To == owner.Email);
    }

    [Fact]
    public async Task Reset_password_with_the_emailed_token()
    {
        var owner = Api.NewOwner();
        await Api.EnsureSuccess(await _client.PostAsJsonAsync("/api/v1/auth/register", new { businessName = owner.Name, email = owner.Email, phone = owner.Phone, password = "Sunrise2026" }));
        await _client.PostAsJsonAsync("/api/v1/auth/forgot-password", new { email = owner.Email });

        var mail = factory.Emails.Sent.Last(m => m.To == owner.Email);
        var token = Uri.UnescapeDataString(TokenInLink().Match(mail.Text).Groups[1].Value);

        var bad = await _client.PostAsJsonAsync("/api/v1/auth/reset-password", new { email = owner.Email, token = "wrong", newPassword = "Evening2026" });
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);

        var reset = await _client.PostAsJsonAsync("/api/v1/auth/reset-password", new { email = owner.Email, token, newPassword = "Evening2026" });
        Assert.Equal(HttpStatusCode.NoContent, reset.StatusCode);

        await Api.EnsureSuccess(await _client.PostAsJsonAsync("/api/v1/auth/login", new { login = owner.Email, password = "Evening2026" }));
        var old = await _client.PostAsJsonAsync("/api/v1/auth/login", new { login = owner.Email, password = "Sunrise2026" });
        Assert.Equal(HttpStatusCode.Unauthorized, old.StatusCode);
    }

    [Fact]
    public async Task Reset_password_signs_out_every_device()
    {
        var owner = Api.NewOwner();
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register", new { businessName = owner.Name, email = owner.Email, phone = owner.Phone, password = "Sunrise2026" });
        await Api.EnsureSuccess(register);
        var phone = (await register.Content.ReadFromJsonAsync<AuthResponse>(Api.Json))!;
        var tablet = (await (await _client.PostAsJsonAsync("/api/v1/auth/login", new { login = owner.Email, password = "Sunrise2026" })).Content.ReadFromJsonAsync<AuthResponse>(Api.Json))!;

        await _client.PostAsJsonAsync("/api/v1/auth/forgot-password", new { email = owner.Email });
        var mail = factory.Emails.Sent.Last(m => m.To == owner.Email);
        var token = Uri.UnescapeDataString(TokenInLink().Match(mail.Text).Groups[1].Value);
        Assert.Equal(HttpStatusCode.NoContent, (await _client.PostAsJsonAsync("/api/v1/auth/reset-password", new { email = owner.Email, token, newPassword = "Evening2026" })).StatusCode);

        foreach (var session in new[] { phone, tablet })
        {
            var refresh = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = session.RefreshToken });
            Assert.Equal(HttpStatusCode.Unauthorized, refresh.StatusCode);
        }
    }

    [Fact]
    public async Task Logout_everywhere_revokes_every_refresh_token()
    {
        var owner = Api.NewOwner();
        var register = await _client.PostAsJsonAsync("/api/v1/auth/register", new { businessName = owner.Name, email = owner.Email, phone = owner.Phone, password = "Sunrise2026" });
        var phone = (await register.Content.ReadFromJsonAsync<AuthResponse>(Api.Json))!;
        var tablet = (await (await _client.PostAsJsonAsync("/api/v1/auth/login", new { login = owner.Email, password = "Sunrise2026" })).Content.ReadFromJsonAsync<AuthResponse>(Api.Json))!;

        Assert.Equal(HttpStatusCode.Unauthorized, (await _client.PostAsync("/api/v1/auth/logout-all", null)).StatusCode);
        var client = factory.CreateClient().Authorized(phone.AccessToken);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsync("/api/v1/auth/logout-all", null)).StatusCode);

        foreach (var session in new[] { phone, tablet })
        {
            Assert.Equal(HttpStatusCode.Unauthorized, (await _client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = session.RefreshToken })).StatusCode);
        }
    }

    [Fact]
    public async Task Me_returns_the_owner_and_business()
    {
        var auth = await Api.RegisterAsync(_client);
        var me = await factory.CreateClient().Authorized(auth.AccessToken).GetFromJsonAsync<MeResponse>("/api/v1/me", Api.Json);
        Assert.Equal(auth.Business.Id, me!.Business.Id);
        Assert.Contains("@example.com", me.Email);
    }

    [Fact]
    public async Task Me_requires_a_valid_token()
    {
        Assert.Equal(HttpStatusCode.Unauthorized, (await _client.GetAsync("/api/v1/me")).StatusCode);
        var forged = factory.CreateClient().Authorized("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.bad");
        Assert.Equal(HttpStatusCode.Unauthorized, (await forged.GetAsync("/api/v1/me")).StatusCode);
    }

    [Fact]
    public async Task Malformed_json_returns_problem_details()
    {
        var response = await _client.PostAsync("/api/v1/auth/login", new StringContent("{nope", System.Text.Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("request.invalid", (await Api.ProblemAsync(response)).GetProperty("code").GetString());
    }

    [GeneratedRegex("token=([^\\s&]+)")]
    private static partial Regex TokenInLink();
}
