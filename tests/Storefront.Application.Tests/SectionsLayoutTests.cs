using System.Text.Json;
using System.Text.Json.Nodes;
using Storefront.Application.Ai;
using Storefront.Application.Templates;

namespace Storefront.Application.Tests;

/// <summary>
/// The shared "Sections" options (apps/sites/templates/_kit/sections-settings.json): the order of the sections ("sections.order",
/// a field of type "order") and a layout for each kind of section a template has.
/// </summary>
public class SectionsLayoutTests
{
    private static readonly string[] Layouts = ["highlights.layout", "story.layout", "gallery.layout", "reviews.layout", "visit.layout", "footer.layout"];

    private const string Schema = """
        [
          { "key": "sections.order", "type": "order", "label": "Order of the sections", "group": "Sections", "options": ["menu", "story", "gallery", "reviews", "visit"],
            "optionLabels": { "menu": "Menu", "story": "Our story", "gallery": "Photos", "reviews": "Reviews", "visit": "Visit and hours" } },
          { "key": "reviews.layout", "type": "choice", "label": "Reviews", "group": "Sections", "options": ["auto", "cards", "quote"], "optionLabels": { "quote": "One big quote" } },
          { "key": "gallery.layout", "type": "choice", "label": "Photos", "group": "Sections", "options": ["auto", "grid", "carousel"], "optionLabels": { "carousel": "Slider" } },
          { "key": "reviews.1.quote", "type": "textarea", "label": "Review 1", "max": 220 }
        ]
        """;

    private static readonly TemplateSchema Parsed = TemplateSchema.Parse(Schema);

    private static readonly JsonObject Current = (JsonObject)JsonNode.Parse("""
        { "sections.order": ["menu", "story", "gallery", "reviews", "visit"], "reviews.layout": "auto", "gallery.layout": "auto", "reviews.1.quote": "" }
        """)!;

    private static List<TemplateField> Editable() => Parsed.Fields.Where(TemplateAiFields.IsEditable).ToList();

    private static Task<(JsonObject? Settings, Dictionary<string, string[]> Errors)> Validate(string json) =>
        Parsed.ValidateAsync((JsonObject)JsonNode.Parse(json)!, Current, _ => Task.FromResult(false));

    [Fact]
    public async Task An_order_takes_the_templates_sections_each_once()
    {
        var (ok, none) = await Validate("""{ "sections.order": ["reviews", "menu", "story", "gallery", "visit"] }""");
        Assert.Empty(none);
        Assert.Equal(["reviews", "menu", "story", "gallery", "visit"], ok!["sections.order"]!.AsArray().Select(n => n!.GetValue<string>()));

        // An order saved before the template gained a section stays valid; the site puts the new one in its place.
        var (older, _) = await Validate("""{ "sections.order": ["visit", "menu"] }""");
        Assert.NotNull(older);

        foreach (var bad in new[] { """["menu", "menu"]""", """["menu", "faq"]""", "\"menu\"", """["menu", 3]""", "null" })
        {
            var (_, errors) = await Validate($$"""{ "sections.order": {{bad}} }""");
            Assert.Contains("sections.order", errors.Keys);
        }
    }

    [Fact]
    public void A_broken_order_field_never_reaches_the_editor()
    {
        const string bad = """
            [ { "key": "sections.order", "type": "order", "label": "Order", "options": ["menu", "menu"] },
              { "key": "x.order", "type": "order", "label": "Order", "options": ["menu"] },
              { "key": "y.order", "type": "order", "label": "Order" },
              { "key": "font", "type": "choice", "label": "Font", "options": ["a", "b"] } ]
            """;
        var cleaned = JsonNode.Parse(TemplateSchema.WithValidPreviews(bad, out var problems))!.AsArray();
        Assert.Equal(["font"], cleaned.Select(f => f!["key"]!.GetValue<string>()));
        Assert.Equal(3, problems.Count);
        Assert.Equal(Schema, TemplateSchema.WithValidPreviews(Schema, out var none));
        Assert.Empty(none);
    }

    [Fact]
    public void The_assistant_may_move_sections_and_change_their_layouts_but_not_write_reviews()
    {
        Assert.Equal(["sections.order", "reviews.layout", "gallery.layout"], Editable().Select(f => f.Key));
        var properties = TemplateAiFields.Schema(Editable(), Parsed.Fields)["properties"]!;
        Assert.Equal("array", properties["sections.order"]!["type"]!.GetValue<string>());
        Assert.Equal(["menu", "story", "gallery", "reviews", "visit"], properties["sections.order"]!["items"]!["enum"]!.AsArray().Select(o => o!.GetValue<string>()));
        Assert.Contains("top to bottom", properties["sections.order"]!["description"]!.GetValue<string>());
        Assert.Contains("reviews (Reviews)", properties["sections.order"]!["description"]!.GetValue<string>());
        Assert.Contains("carousel (Slider)", properties["gallery.layout"]!["description"]!.GetValue<string>());
        Assert.Contains("quote (One big quote)", properties["reviews.layout"]!["description"]!.GetValue<string>());
    }

    [Fact]
    public async Task Move_reviews_higher_make_the_gallery_a_slider_and_a_big_quote()
    {
        var patch = await TemplateAiFields.ToPatchAsync(Parsed, Editable(), JsonNode.Parse("""
            { "sections.order": ["menu", "Reviews", "story", "gallery", "visit"], "gallery.layout": "carousel", "reviews.layout": "quote" }
            """), Current);
        Assert.Equal(["menu", "reviews", "story", "gallery", "visit"], patch["sections.order"]!.AsArray().Select(o => o!.GetValue<string>()));
        Assert.Equal("carousel", patch["gallery.layout"]!.GetValue<string>());
        Assert.Equal("quote", patch["reviews.layout"]!.GetValue<string>());
    }

    [Fact]
    public async Task A_short_order_is_completed_and_a_wrong_one_is_dropped()
    {
        // Sections the answer left out follow the ones it named, in the template's order, so every section still shows.
        var patch = await TemplateAiFields.ToPatchAsync(Parsed, Editable(), JsonNode.Parse("""{ "sections.order": ["reviews", "menu"] }"""), Current);
        Assert.Equal(["reviews", "menu", "story", "gallery", "visit"], patch["sections.order"]!.AsArray().Select(o => o!.GetValue<string>()));

        foreach (var bad in new[] { """["menu", "menu"]""", """["menu", "faq"]""", "[]", "\"reviews\"" })
        {
            var dropped = await TemplateAiFields.ToPatchAsync(Parsed, Editable(), JsonNode.Parse($$"""{ "sections.order": {{bad}} }"""), Current);
            Assert.Empty(dropped);
        }
    }

    [Fact]
    public void Every_template_in_the_registry_has_the_sections_group_with_an_order_the_assistant_can_set()
    {
        using var registry = JsonDocument.Parse(File.ReadAllText(RegistryPath()));
        var templates = registry.RootElement.GetProperty("templates").EnumerateArray().ToList();
        Assert.NotEmpty(templates);
        foreach (var t in templates)
        {
            var id = t.GetProperty("id").GetString()!;
            var schemaJson = t.GetProperty("schema").GetRawText();
            Assert.Equal(schemaJson, TemplateSchema.WithValidPreviews(schemaJson, out var problems));
            Assert.Empty(problems);

            var schema = TemplateSchema.Parse(schemaJson);
            var group = schema.Fields.Where(f => f.Group == "Sections").ToList();
            Assert.Equal("sections.order", group[0].Key);
            Assert.Equal("order", group[0].Type);
            Assert.Contains("menu", group[0].Options!);
            Assert.True(TemplateAiFields.IsEditable(group[0]), $"{id} sections.order is not editable");

            var defaults = t.GetProperty("defaults");
            Assert.Equal(group[0].Options, defaults.GetProperty("sections.order").EnumerateArray().Select(e => e.GetString()));

            var layouts = group.Where(f => Layouts.Contains(f.Key)).ToList();
            Assert.Contains(layouts, f => f.Key == "footer.layout");
            Assert.Contains(layouts, f => f.Key == "visit.layout");
            foreach (var field in layouts)
            {
                Assert.True(TemplateAiFields.IsEditable(field), $"{id} {field.Key} is not editable");
                Assert.Equal("auto", field.Options![0]);
                Assert.Equal(field.Options, field.Previews!.Keys);
                Assert.Equal("auto", defaults.GetProperty(field.Key).GetString());
            }

            var properties = TemplateAiFields.Schema(group.Where(TemplateAiFields.IsEditable).ToList(), schema.Fields)["properties"]!;
            Assert.Contains("minimal (One line)", properties["footer.layout"]!["description"]!.GetValue<string>());
            if (properties["gallery.layout"] is { } gallery)
            {
                Assert.Contains("carousel (Slider)", gallery["description"]!.GetValue<string>());
            }

            if (properties["story.layout"] is { } story)
            {
                Assert.Contains("quote (A big quote)", story["description"]!.GetValue<string>());
            }
        }
    }

    private static string RegistryPath()
    {
        for (var dir = new DirectoryInfo(AppContext.BaseDirectory); dir is not null; dir = dir.Parent)
        {
            var path = Path.Combine(dir.FullName, "apps", "sites", "templates", "registry.json");
            if (File.Exists(path))
            {
                return path;
            }
        }

        throw new FileNotFoundException("apps/sites/templates/registry.json not found above the test folder.");
    }
}
