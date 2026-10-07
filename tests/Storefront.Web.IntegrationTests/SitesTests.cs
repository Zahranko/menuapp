using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Storefront.Application.Catalog;
using Storefront.Application.PublicSites;
using Storefront.Application.Sites;
using Storefront.Application.Templates;
using Storefront.Domain.Domains;
using Storefront.Infrastructure.Persistence;

namespace Storefront.Web.IntegrationTests;

public class SitesTests(StorefrontFactory factory) : IClassFixture<StorefrontFactory>
{
    private async Task<(HttpClient Client, string Slug, Guid BusinessId)> OwnerWithMenuAsync()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        var client = factory.CreateClient().Authorized(auth.AccessToken);
        var coffee = (await (await client.PostAsJsonAsync("/api/v1/categories", new { name = "Coffee" })).Content.ReadFromJsonAsync<CategoryDto>(Api.Json))!;
        await client.PostAsJsonAsync("/api/v1/categories", new { name = "Empty one" });
        await client.PostAsJsonAsync("/api/v1/products", new { categoryId = coffee.Id, name = "Latte", price = 3.5m, isFeatured = true });
        await client.PostAsJsonAsync("/api/v1/products", new { categoryId = coffee.Id, name = "Mocha", price = 3.95m, isAvailable = false });
        return (client, auth.Business.Slug, auth.Business.Id);
    }

    [Fact]
    public async Task Template_gallery_is_public()
    {
        var templates = await factory.CreateClient().GetFromJsonAsync<List<TemplateDto>>("/api/v1/templates", Api.Json);
        var souq = Assert.Single(templates!, t => t.Id == "souq");
        Assert.Equal(1, souq.Number);
        Assert.Equal(JsonValueKind.Array, souq.Schema.ValueKind);
        Assert.Equal("modern", souq.Defaults.GetProperty("font").GetString());
    }

    [Fact]
    public async Task New_site_starts_with_template_defaults_and_unpublished()
    {
        var (client, slug, _) = await OwnerWithMenuAsync();
        var site = await client.GetFromJsonAsync<SiteDto>("/api/v1/site", Api.Json);
        Assert.Equal("souq", site!.TemplateId);
        Assert.Null(site.PublishedAt);
        Assert.True(site.HasUnpublishedChanges);
        Assert.EndsWith($"/{slug}", site.SiteUrl);

        Assert.Equal(HttpStatusCode.NotFound, (await factory.CreateClient().GetAsync($"/api/public/v1/sites/by-slug/{slug}")).StatusCode);
    }

    [Fact]
    public async Task Draft_is_validated_against_the_template_schema()
    {
        var (client, _, _) = await OwnerWithMenuAsync();
        var response = await client.PutAsJsonAsync("/api/v1/site/draft", new
        {
            settings = new Dictionary<string, object?>
            {
                ["font"] = "comic",
                ["hero.title"] = new string('x', 61),
                ["hero.shade"] = 57,
                ["hero.image"] = "https://example.com/not-mine.jpg",
                ["story.image"] = "preset:nope",
                ["sections"] = new[] { "story", "story" },
                ["hours"] = new Dictionary<string, string> { ["mon"] = "8am-late" },
                ["madeUp"] = true,
            },
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await Api.ProblemAsync(response)).GetProperty("errors");
        foreach (var key in new[] { "font", "hero.title", "hero.shade", "hero.image", "story.image", "sections", "hours", "madeUp" })
        {
            Assert.True(errors.TryGetProperty($"settings.{key}", out _), $"expected an error for {key}");
        }
    }

    [Fact]
    public async Task Publish_makes_the_draft_live_and_queues_a_refresh()
    {
        var (client, slug, businessId) = await OwnerWithMenuAsync();
        var draft = await client.PutAsJsonAsync("/api/v1/site/draft", new { settings = new { font = "elegant", theme = "night", hero_title = "x" } });
        Assert.Equal(HttpStatusCode.BadRequest, draft.StatusCode); // hero_title is not a setting

        await Api.EnsureSuccess(await client.PutAsJsonAsync("/api/v1/site/draft", new { settings = new Dictionary<string, object> { ["font"] = "elegant", ["theme"] = "night", ["hero.title"] = "Night owls welcome" } }));
        var published = await client.PostAsync("/api/v1/site/publish", null);
        await Api.EnsureSuccess(published);
        var site = (await published.Content.ReadFromJsonAsync<SiteDto>(Api.Json))!;
        Assert.False(site.HasUnpublishedChanges);

        var publicSite = await factory.CreateClient().GetFromJsonAsync<PublicSiteDto>($"/api/public/v1/sites/by-slug/{slug.ToUpperInvariant()}", Api.Json);
        Assert.Equal("souq", publicSite!.TemplateId);
        Assert.Equal("elegant", publicSite.Settings.GetProperty("font").GetString());
        Assert.Equal("Night owls welcome", publicSite.Settings.GetProperty("hero.title").GetString());
        Assert.Equal("full", publicSite.Settings.GetProperty("hero.layout").GetString());
        Assert.False(publicSite.IsPreview);

        await using var scope = factory.Services.CreateAsyncScope();
        var outbox = await scope.ServiceProvider.GetRequiredService<StorefrontDbContext>().OutboxMessages.Where(m => m.Type == "SitePublished").ToListAsync();
        Assert.Contains(outbox, m => m.Payload.Contains(businessId.ToString()));
    }

    [Fact]
    public async Task Public_site_hides_empty_categories_and_keeps_sold_out_items()
    {
        var (client, slug, _) = await OwnerWithMenuAsync();
        await client.PostAsync("/api/v1/site/publish", null);
        var site = await factory.CreateClient().GetFromJsonAsync<PublicSiteDto>($"/api/public/v1/sites/by-slug/{slug}", Api.Json);
        var category = Assert.Single(site!.Categories);
        Assert.Equal("Coffee", category.Name);
        Assert.Equal(["Latte", "Mocha"], category.Products.Select(p => p.Name));
        Assert.False(category.Products[1].IsAvailable);
        Assert.True(category.Products[0].IsFeatured);
    }

    [Fact]
    public async Task Drafts_stay_private_until_published()
    {
        var (client, slug, _) = await OwnerWithMenuAsync();
        await client.PostAsync("/api/v1/site/publish", null);
        await Api.EnsureSuccess(await client.PutAsJsonAsync("/api/v1/site/draft", new { settings = new Dictionary<string, object> { ["hero.title"] = "Secret draft" } }));

        var live = await factory.CreateClient().GetFromJsonAsync<PublicSiteDto>($"/api/public/v1/sites/by-slug/{slug}", Api.Json);
        Assert.NotEqual("Secret draft", live!.Settings.GetProperty("hero.title").GetString());
        Assert.True((await client.GetFromJsonAsync<SiteDto>("/api/v1/site", Api.Json))!.HasUnpublishedChanges);
    }

    [Fact]
    public async Task Preview_token_shows_the_draft_and_rejects_tampering()
    {
        var (client, _, _) = await OwnerWithMenuAsync();
        await Api.EnsureSuccess(await client.PutAsJsonAsync("/api/v1/site/draft", new { settings = new Dictionary<string, object> { ["hero.title"] = "Draft headline" } }));
        var link = (await (await client.PostAsync("/api/v1/site/preview-token", null)).Content.ReadFromJsonAsync<PreviewLink>(Api.Json))!;
        Assert.Contains($"/_preview/{link.Token}", link.PreviewUrl);
        Assert.True(link.ExpiresAt > DateTimeOffset.UtcNow.AddMinutes(29));

        var response = await factory.CreateClient().GetAsync($"/api/public/v1/preview/{link.Token}");
        Assert.Equal("no-store", response.Headers.CacheControl!.ToString());
        var preview = (await response.Content.ReadFromJsonAsync<PublicSiteDto>(Api.Json))!;
        Assert.True(preview.IsPreview);
        Assert.Equal("Draft headline", preview.Settings.GetProperty("hero.title").GetString());

        var tampered = link.Token[..^2] + (link.Token[^2..] == "AA" ? "BB" : "AA");
        Assert.Equal(HttpStatusCode.NotFound, (await factory.CreateClient().GetAsync($"/api/public/v1/preview/{tampered}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await factory.CreateClient().GetAsync("/api/public/v1/preview/garbage")).StatusCode);
    }

    [Fact]
    public async Task Public_reads_send_cache_headers_and_honor_etags()
    {
        var (client, slug, _) = await OwnerWithMenuAsync();
        await client.PostAsync("/api/v1/site/publish", null);
        var anonymous = factory.CreateClient();

        var first = await anonymous.GetAsync($"/api/public/v1/sites/by-slug/{slug}");
        Assert.Contains("max-age=60", first.Headers.CacheControl!.ToString());
        var etag = first.Headers.ETag!;

        var request = new HttpRequestMessage(HttpMethod.Get, $"/api/public/v1/sites/by-slug/{slug}");
        request.Headers.IfNoneMatch.Add(etag);
        Assert.Equal(HttpStatusCode.NotModified, (await anonymous.SendAsync(request)).StatusCode);

        // A content change gives a new ETag.
        var products = await client.GetFromJsonAsync<List<ProductDto>>("/api/v1/products", Api.Json);
        await client.PatchAsJsonAsync($"/api/v1/products/{products![0].Id}/availability", new { isAvailable = false });
        var second = await anonymous.GetAsync($"/api/public/v1/sites/by-slug/{slug}");
        Assert.NotEqual(etag.Tag, second.Headers.ETag!.Tag);
    }

    [Fact]
    public async Task Unknown_sites_return_404()
    {
        var anonymous = factory.CreateClient();
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync("/api/public/v1/sites/by-slug/nobodyhere123")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync("/api/public/v1/sites/by-slug/x")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync("/api/public/v1/sites/by-host/unknown.example.com")).StatusCode);
    }

    [Fact]
    public async Task By_host_resolves_active_custom_domains_with_or_without_www()
    {
        var (client, slug, businessId) = await OwnerWithMenuAsync();
        await client.PostAsync("/api/v1/site/publish", null);
        var domain = $"{slug}.example.com";
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<StorefrontDbContext>();
            db.CustomDomains.Add(CustomDomain.Create(domain, businessId, DateTimeOffset.UtcNow));
            await db.SaveChangesAsync();
        }

        var site = await factory.CreateClient().GetFromJsonAsync<PublicSiteDto>($"/api/public/v1/sites/by-host/{domain.ToUpperInvariant()}", Api.Json);
        Assert.Equal(slug, site!.Business.Slug);
        Assert.Contains(domain, site.Business.CustomDomains);
        var www = await factory.CreateClient().GetFromJsonAsync<PublicSiteDto>($"/api/public/v1/sites/by-host/www.{domain}", Api.Json);
        Assert.Equal(slug, www!.Business.Slug);
    }

    [Fact]
    public async Task Changing_to_an_unknown_template_is_rejected()
    {
        var (client, _, _) = await OwnerWithMenuAsync();
        var response = await client.PutAsJsonAsync("/api/v1/site/template", new { templateId = "doesnotexist" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await Api.EnsureSuccess(await client.PutAsJsonAsync("/api/v1/site/template", new { templateId = "SOUQ" }));
    }

    [Fact]
    public async Task Site_endpoints_require_login()
    {
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateClient().GetAsync("/api/v1/site")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateClient().PostAsync("/api/v1/site/publish", null)).StatusCode);
    }
}
