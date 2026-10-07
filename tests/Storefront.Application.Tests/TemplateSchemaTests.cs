using System.Text.Json.Nodes;
using Storefront.Application.Templates;

namespace Storefront.Application.Tests;

public class TemplateSchemaTests
{
    private const string Schema = """
        [
          { "key": "font", "type": "choice", "label": "Font", "options": ["modern", "elegant"] },
          { "key": "accent", "type": "color", "label": "Accent", "options": ["#D9542C", "#F2B22E"] },
          { "key": "title", "type": "text", "label": "Title", "max": 10 },
          { "key": "shade", "type": "range", "label": "Shade", "min": 0, "max": 90, "step": 5 },
          { "key": "dots", "type": "toggle", "label": "Dots" },
          { "key": "sections", "type": "toggles", "label": "Sections", "options": ["story", "gallery"] },
          { "key": "hero", "type": "image", "label": "Hero", "presets": ["counter"] },
          { "key": "gallery", "type": "images", "label": "Gallery", "max": 2 },
          { "key": "hours", "type": "hours", "label": "Hours" }
        ]
        """;

    private static readonly JsonObject Defaults = (JsonObject)JsonNode.Parse("""
        { "font": "modern", "accent": "#D9542C", "title": "Hi", "shade": 50, "dots": false, "sections": ["story"],
          "hero": "preset:counter", "gallery": [], "hours": { "mon": "08:00-23:00" } }
        """)!;

    private static Task<(JsonObject? Settings, Dictionary<string, string[]> Errors)> Validate(string json, params string[] ownImages) =>
        TemplateSchema.Parse(Schema).ValidateAsync((JsonObject)JsonNode.Parse(json)!, Defaults, url => Task.FromResult(ownImages.Contains(url)));

    [Fact]
    public async Task Missing_keys_take_defaults()
    {
        var (settings, errors) = await Validate("""{ "font": "elegant" }""");
        Assert.Empty(errors);
        Assert.Equal("elegant", settings!["font"]!.GetValue<string>());
        Assert.Equal(50, settings["shade"]!.GetValue<int>());
        Assert.Equal(9, settings.Count);
    }

    [Fact]
    public async Task Accepts_valid_values_including_own_uploads()
    {
        var (_, errors) = await Validate("""
            { "accent": "#F2B22E", "title": "0123456789", "shade": 90, "dots": true, "sections": ["gallery", "story"],
              "hero": "https://cdn.test/me.jpg", "gallery": ["https://cdn.test/me.jpg"],
              "hours": { "fri": "13:00-24:00", "sat": "closed", "sun": "" } }
            """, "https://cdn.test/me.jpg");
        Assert.Empty(errors);
    }

    [Theory]
    [InlineData("""{ "font": "comic" }""", "font")]
    [InlineData("""{ "accent": "#000000" }""", "accent")]
    [InlineData("""{ "title": "01234567890" }""", "title")]
    [InlineData("""{ "shade": 52 }""", "shade")]
    [InlineData("""{ "shade": 95 }""", "shade")]
    [InlineData("""{ "dots": "yes" }""", "dots")]
    [InlineData("""{ "sections": ["menu"] }""", "sections")]
    [InlineData("""{ "hero": "https://elsewhere.test/x.jpg" }""", "hero")]
    [InlineData("""{ "hero": "preset:arches" }""", "hero")]
    [InlineData("""{ "gallery": ["preset:counter"] }""", "gallery")]
    [InlineData("""{ "hours": { "mon": "9-5" } }""", "hours")]
    [InlineData("""{ "hours": { "someday": "08:00-09:00" } }""", "hours")]
    [InlineData("""{ "unknown": 1 }""", "unknown")]
    public async Task Rejects_invalid_values(string json, string key)
    {
        var (settings, errors) = await Validate(json);
        Assert.Null(settings);
        Assert.True(errors.ContainsKey(key), string.Join(", ", errors.Keys));
    }
}
