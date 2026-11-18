using System.Net.Http.Json;
using System.Text;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Storefront.Application.PublicSites;
using Storefront.Infrastructure.Persistence;
using Storefront.Infrastructure.Persistence.Seeding;

namespace Storefront.Web.IntegrationTests;

/// <summary>Its own database: the test retires a template, which would change the gallery for every other test class.</summary>
public class RetiredTemplatesTests(StorefrontFactory factory) : IClassFixture<StorefrontFactory>
{
    [Fact]
    public async Task Sites_on_a_retired_template_move_to_its_replacement_and_keep_what_it_takes()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        var client = factory.CreateClient().Authorized(auth.AccessToken);
        await Api.EnsureSuccess(await client.PutAsJsonAsync("/api/v1/site/draft", new { settings = new Dictionary<string, object> { ["theme"] = "night", ["accent"] = "#123456", ["hero.title"] = "Night owls welcome" } }));
        await Api.EnsureSuccess(await client.PostAsync("/api/v1/site/publish", null));
        await Api.EnsureSuccess(await client.PutAsJsonAsync("/api/v1/site/draft", new { settings = new Dictionary<string, object> { ["hero.title"] = "Draft headline" } }));

        await using var scope = factory.Services.CreateAsyncScope();
        var importer = scope.ServiceProvider.GetRequiredService<TemplateRegistryImporter>();
        var registry = JsonNode.Parse(await File.ReadAllTextAsync(importer.RegistryPath!))!.AsObject();
        var templates = registry["templates"]!.AsArray();
        templates.Remove(templates.Single(t => (string?)t!["id"] == "souq"));
        registry["retired"] = new JsonArray(new JsonObject { ["id"] = "souq", ["replacedBy"] = "linen" });
        await importer.ImportAsync(new MemoryStream(Encoding.UTF8.GetBytes(registry.ToJsonString())), CancellationToken.None);

        var db = scope.ServiceProvider.GetRequiredService<StorefrontDbContext>();
        var site = await db.Sites.IgnoreQueryFilters().AsNoTracking().SingleAsync(s => s.BusinessId == auth.Business.Id);
        Assert.Equal("linen", site.TemplateId);
        Assert.Equal("linen", site.PublishedTemplateId);
        Assert.NotNull(site.PublishedAt);
        Assert.Contains("Draft headline", site.DraftSettings);
        Assert.False((await db.Templates.SingleAsync(t => t.Id == "souq")).IsActive);

        var live = await factory.CreateClient().GetFromJsonAsync<PublicSiteDto>($"/api/public/v1/sites/by-slug/{auth.Business.Slug}", Api.Json);
        Assert.Equal("linen", live!.TemplateId);
        Assert.Equal("Night owls welcome", live.Settings.GetProperty("hero.title").GetString()); // linen has a headline
        Assert.Equal("#123456", live.Settings.GetProperty("accent").GetString()); // and an accent color
        Assert.Equal("linen", live.Settings.GetProperty("theme").GetString()); // but no "night" theme: its default
        Assert.False(live.Settings.TryGetProperty("hero.variant", out var variant) && variant.GetString() == "stall"); // a Souq-only option is gone
    }
}
