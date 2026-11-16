using System.Text.Json.Nodes;
using Storefront.Application.Templates;
using Storefront.Domain.Sites;
using Storefront.Domain.Templates;

namespace Storefront.Application.Tests;

public class RetiredTemplateTests
{
    private const string Schema = """
        [
          { "key": "headline", "type": "text", "label": "Headline", "max": 20 },
          { "key": "tagline", "type": "text", "label": "Tagline", "max": 60 },
          { "key": "theme", "type": "choice", "label": "Theme", "options": ["linen", "ink"] }
        ]
        """;

    private static Template Next()
    {
        var template = Template.Create("linen", 2, "Linen", "Restaurant", null, null, Schema, """{ "headline": "Our menu", "tagline": "Home cooking", "theme": "linen" }""", 1);
        template.SetArabic(null, null, null, """{ "tagline": "طبخ بيتي" }""");
        return template;
    }

    [Fact]
    public async Task Carries_over_what_the_new_template_takes_and_defaults_the_rest()
    {
        var old = """{ "headline": "Bait Sitti", "theme": "night", "tablecloth": "red" }""";
        var settings = JsonNode.Parse(await TemplateDefaults.CarryOverAsync(Next(), old, "en"))!.AsObject();

        Assert.Equal("Bait Sitti", settings["headline"]!.GetValue<string>()); // the same key: kept
        Assert.Equal("linen", settings["theme"]!.GetValue<string>()); // an option the new template lacks: its default
        Assert.Equal("Home cooking", settings["tagline"]!.GetValue<string>()); // missing: the default
        Assert.False(settings.ContainsKey("tablecloth")); // a setting only the old template had: dropped
    }

    [Fact]
    public async Task Too_long_texts_fall_back_and_arabic_businesses_get_arabic_defaults()
    {
        var old = """{ "headline": "A headline far too long for this template" }""";
        var settings = JsonNode.Parse(await TemplateDefaults.CarryOverAsync(Next(), old, "ar"))!.AsObject();

        Assert.Equal("Our menu", settings["headline"]!.GetValue<string>());
        Assert.Equal("طبخ بيتي", settings["tagline"]!.GetValue<string>());
    }

    [Fact]
    public void Moving_keeps_the_publish_date_and_only_touches_what_used_the_retired_template()
    {
        var now = DateTimeOffset.UtcNow;
        var site = Site.Create(Guid.CreateVersion7(), "bistro", "{}", now);
        site.Publish(now);
        site.ChangeTemplate("souq", """{ "a": 1 }""", now); // the owner was trying another template in the draft

        site.MoveToTemplate("bistro", "linen", "{ \"draft\": 1 }", "{ \"live\": 1 }", now.AddDays(1));

        Assert.Equal("souq", site.TemplateId);
        Assert.Equal("""{ "a": 1 }""", site.DraftSettings);
        Assert.Equal("linen", site.PublishedTemplateId);
        Assert.Equal("{ \"live\": 1 }", site.PublishedSettings);
        Assert.Equal(now, site.PublishedAt);
    }
}
