using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Storefront.Application.Community;
using Storefront.Application.Sites;

namespace Storefront.Web.IntegrationTests;

/// <summary>Community templates end to end: profile, share, browse by link and gallery, apply, and the tenant boundaries.</summary>
public class CommunityTests(StorefrontFactory factory) : IClassFixture<StorefrontFactory>
{
    private static int _counter;

    private async Task<HttpClient> OwnerAsync(string plan, string template)
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        var client = factory.CreateClient().Authorized(auth.AccessToken);
        await Api.EnsureSuccess(await client.PostAsJsonAsync("/api/v1/subscription/change", new { planCode = plan }));
        await Api.EnsureSuccess(await client.PutAsJsonAsync("/api/v1/site/template", new { templateId = template }));
        return client;
    }

    private static string NewUsername() => $"maker{DateTime.UtcNow:HHmmss}{Interlocked.Increment(ref _counter)}";

    [Fact]
    public async Task Pro_owner_shares_a_studio_design_and_another_owner_applies_it()
    {
        var publisher = await OwnerAsync("pro", "studio");
        await Api.EnsureSuccess(await publisher.PutAsJsonAsync("/api/v1/site/draft", new
        {
            settings = new Dictionary<string, object> { ["hero.title"] = "Only mine", ["theme"] = "night", ["studio.css"] = "h1 { letter-spacing: .1em }" },
        }));

        Assert.Equal(HttpStatusCode.NotFound, (await publisher.PostAsJsonAsync("/api/v1/community/templates", new { name = "Night" })).StatusCode);
        var username = NewUsername();
        Assert.True((await publisher.GetFromJsonAsync<UsernameAvailability>($"/api/v1/community/username-availability?username={username}", Api.Json))!.Available);
        await Api.EnsureSuccess(await publisher.PutAsJsonAsync("/api/v1/community/publisher", new { username, displayName = "Night maker" }));

        var shared = await publisher.PostAsJsonAsync("/api/v1/community/templates", new { name = "Night shift", description = "Dark and calm" });
        await Api.EnsureSuccess(shared);
        var mine = (await shared.Content.ReadFromJsonAsync<MyCommunityTemplateDto>(Api.Json))!;
        var code = mine.Template.Code;
        Assert.EndsWith($"/community/{code}", mine.Template.ShareUrl);

        var anonymous = factory.CreateClient();
        var detail = await anonymous.GetFromJsonAsync<JsonElement>($"/api/public/v1/community/templates/{code}", Api.Json);
        Assert.Equal("night", detail.GetProperty("settings").GetProperty("theme").GetString());
        Assert.False(detail.GetProperty("settings").TryGetProperty("hero.title", out _));
        var profile = await anonymous.GetFromJsonAsync<PublisherPageDto>($"/api/public/v1/community/publishers/{username}", Api.Json);
        Assert.Contains(profile!.Templates, t => t.Code == code);
        var gallery = await anonymous.GetFromJsonAsync<CommunityPage>("/api/public/v1/community/templates?sort=new&q=Night%20shift", Api.Json);
        Assert.Contains(gallery!.Items, t => t.Code == code);

        var other = await OwnerAsync("pro", "souq");
        var applied = await other.PostAsync($"/api/v1/community/templates/{code}/apply", null);
        await Api.EnsureSuccess(applied);
        var site = (await applied.Content.ReadFromJsonAsync<SiteDto>(Api.Json))!;
        Assert.Equal("studio", site.TemplateId);
        Assert.Equal("night", site.DraftSettings.GetProperty("theme").GetString());
        Assert.NotEqual("Only mine", site.DraftSettings.GetProperty("hero.title").GetString());
        Assert.Equal(1, (await anonymous.GetFromJsonAsync<CommunityTemplateDetailDto>($"/api/public/v1/community/templates/{code}", Api.Json))!.Template.Uses);

        // Another owner can't change or delete it.
        Assert.Equal(HttpStatusCode.NotFound, (await other.DeleteAsync($"/api/v1/community/templates/{mine.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await publisher.DeleteAsync($"/api/v1/community/templates/{mine.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync($"/api/public/v1/community/templates/{code}")).StatusCode);
    }

    [Fact]
    public async Task Basic_owners_cant_publish_and_usernames_are_unique()
    {
        var basic = await OwnerAsync("basic", "souq");
        var refused = await basic.PutAsJsonAsync("/api/v1/community/publisher", new { username = NewUsername(), displayName = "Me" });
        Assert.Equal(HttpStatusCode.Forbidden, refused.StatusCode);
        Assert.Equal("community.pro", (await Api.ProblemAsync(refused)).GetProperty("code").GetString());

        var first = await OwnerAsync("pro", "studio");
        var second = await OwnerAsync("pro", "studio");
        var username = NewUsername();
        await Api.EnsureSuccess(await first.PutAsJsonAsync("/api/v1/community/publisher", new { username, displayName = "First" }));
        var taken = await second.PutAsJsonAsync("/api/v1/community/publisher", new { username = username.ToUpperInvariant(), displayName = "Second" });
        Assert.Equal(HttpStatusCode.Conflict, taken.StatusCode);
    }
}
