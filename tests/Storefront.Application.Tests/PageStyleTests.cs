using System.Text.Json;
using System.Text.Json.Nodes;
using Storefront.Application.Ai;
using Storefront.Application.Templates;
using Storefront.Domain.Templates;

namespace Storefront.Application.Tests;

/// <summary>The shared "Page style" options (apps/sites/templates/_kit/style-settings.json) and the picture previews of choices.</summary>
public class PageStyleTests
{
    private const string Schema = """
        [
          { "key": "style.buttons", "type": "choice", "label": "Buttons", "group": "Page style", "groupAr": "شكل الصفحة",
            "options": ["auto", "pill", "square"], "optionLabels": { "auto": "Template default", "pill": "Pill" },
            "previews": { "auto": "/kit/previews/auto.svg", "pill": "/kit/previews/buttons-pill.svg", "square": "/kit/previews/buttons-square.svg" } },
          { "key": "font", "type": "choice", "label": "Font", "options": ["modern"] }
        ]
        """;

    [Fact]
    public void Previews_are_read_with_the_choice()
    {
        var fields = TemplateSchema.Parse(Schema).Fields;
        Assert.Equal("/kit/previews/buttons-pill.svg", fields[0].Previews!["pill"]);
        Assert.Equal(3, fields[0].Previews!.Count);
        Assert.Null(fields[1].Previews);
    }

    [Fact]
    public void Previews_that_cannot_be_shown_are_left_out()
    {
        const string bad = """
            [
              { "key": "a", "type": "choice", "label": "A", "options": ["x", "y", "z", "w"],
                "previews": { "x": "/kit/previews/x.svg", "y": "https://evil.test/y.svg", "z": "/../secret.svg", "nope": "/kit/n.svg", "w": 3 } },
              { "key": "b", "type": "text", "label": "B", "previews": { "x": "/kit/previews/x.svg" } },
              { "key": "c", "type": "choice", "label": "C", "options": ["x"], "previews": { "x": "//evil.test/x.svg" } }
            ]
            """;
        var fields = TemplateSchema.Parse(bad).Fields;
        Assert.Equal(["x"], fields[0].Previews!.Keys);
        Assert.Null(fields[1].Previews);
        Assert.Null(fields[2].Previews);

        var cleaned = JsonNode.Parse(TemplateSchema.WithValidPreviews(bad, out var problems))!.AsArray();
        Assert.Equal(["x"], cleaned[0]!["previews"]!.AsObject().Select(p => p.Key));
        Assert.Null(cleaned[1]!["previews"]);
        Assert.Null(cleaned[2]!["previews"]);
        Assert.Equal(6, problems.Count);
    }

    [Fact]
    public void A_schema_with_good_previews_is_kept_exactly_as_written()
    {
        Assert.Equal(Schema, TemplateSchema.WithValidPreviews(Schema, out var problems));
        Assert.Empty(problems);
    }

    [Fact]
    public void The_template_list_passes_previews_and_Arabic_labels_through()
    {
        var template = Template.Create("souq", 1, "Souq", "Café", null, null, Schema, """{ "style.buttons": "auto", "font": "modern" }""", 1);
        var field = TemplateDto.From(template).Schema[0];
        Assert.Equal("/kit/previews/buttons-square.svg", field.GetProperty("previews").GetProperty("square").GetString());
        Assert.Equal("شكل الصفحة", field.GetProperty("groupAr").GetString());
    }

    [Fact]
    public async Task Page_style_values_are_validated_like_any_choice()
    {
        var schema = TemplateSchema.Parse(Schema);
        var defaults = (JsonObject)JsonNode.Parse("""{ "style.buttons": "auto", "font": "modern" }""")!;
        var (ok, none) = await schema.ValidateAsync((JsonObject)JsonNode.Parse("""{ "style.buttons": "pill" }""")!, defaults, _ => Task.FromResult(false));
        Assert.Empty(none);
        Assert.Equal("pill", ok!["style.buttons"]!.GetValue<string>());
        var (_, errors) = await schema.ValidateAsync((JsonObject)JsonNode.Parse("""{ "style.buttons": "wobbly" }""")!, defaults, _ => Task.FromResult(false));
        Assert.Contains("style.buttons", errors.Keys);
    }

    [Fact]
    public void Every_page_style_option_in_the_registry_is_editable_by_the_assistant_and_has_pictures()
    {
        using var registry = JsonDocument.Parse(File.ReadAllText(RegistryPath()));
        var templates = registry.RootElement.GetProperty("templates").EnumerateArray().ToList();
        Assert.NotEmpty(templates);
        foreach (var t in templates)
        {
            var id = t.GetProperty("id").GetString();
            var schemaJson = t.GetProperty("schema").GetRawText();
            var schema = TemplateSchema.Parse(schemaJson);
            var style = schema.Fields.Where(f => f.Group == "Page style").ToList();
            Assert.True(style.Count >= 8, $"{id} has {style.Count} page style options");
            foreach (var field in style)
            {
                Assert.True(field.Key.StartsWith("style.", StringComparison.Ordinal), $"{id} {field.Key}");
                Assert.True(TemplateAiFields.IsEditable(field), $"{id} {field.Key} is not editable");
                Assert.Equal("auto", field.Options![0]);
                Assert.Equal(field.Options, field.Previews!.Keys);
            }

            // The registry's previews are all valid, so the importer stores the schema as it is.
            Assert.Equal(schemaJson, TemplateSchema.WithValidPreviews(schemaJson, out var problems));
            Assert.Empty(problems);

            var properties = TemplateAiFields.Schema(style, schema.Fields)["properties"]!;
            Assert.Contains("pill (Pill)", properties["style.buttons"]!["description"]!.GetValue<string>());
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
