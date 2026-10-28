using System.Text.Json;
using System.Text.Json.Nodes;
using Storefront.Application.Templates;
using Storefront.Domain.Templates;

namespace Storefront.Application.Tests;

/// <summary>Template looks (registry "looks") as the importer keeps them, and what the editor reads.</summary>
public class TemplateLooksTests
{
    private const string Schema = """
        [ { "key": "theme", "type": "palette", "label": "Theme", "options": ["cream", "night"] },
          { "key": "accent", "type": "color", "label": "Accent", "options": ["#D9542C"], "custom": true },
          { "key": "hero.variant", "type": "choice", "label": "Opening", "options": ["auto", "stub", "poster"], "signature": ["stub"] },
          { "key": "shade", "type": "range", "label": "Shade", "min": 0, "max": 90, "step": 5 },
          { "key": "dots", "type": "toggle", "label": "Dots" },
          { "key": "hero.title", "type": "text", "label": "Headline", "max": 40 },
          { "key": "sections", "type": "toggles", "label": "Sections", "options": ["story", "gallery"] } ]
        """;

    private static async Task<(JsonArray Looks, List<string> Problems)> Check(string looks)
    {
        var problems = new List<string>();
        var json = await TemplateSchema.Parse(Schema).ValidLooksAsync(JsonNode.Parse(looks), problems);
        return ((JsonArray)JsonNode.Parse(json)!, problems);
    }

    private static string Look(string id, string values, string en = "Night", string ar = "ليل") =>
        $$"""{ "id": "{{id}}", "label": { "en": "{{en}}", "ar": "{{ar}}" }, "values": {{values}} }""";

    [Fact]
    public async Task Good_looks_are_kept_as_they_are()
    {
        var (looks, problems) = await Check($$"""[ {{Look("night", """{ "theme": "night", "accent": "#1F6FEB", "hero.variant": "stub", "shade": 40, "dots": true }""")}} ]""");
        Assert.Empty(problems);
        var look = Assert.Single(looks)!;
        Assert.Equal("night", look["id"]!.GetValue<string>());
        Assert.Equal("ليل", look["label"]!["ar"]!.GetValue<string>());
        Assert.Equal(["theme", "accent", "hero.variant", "shade", "dots"], look["values"]!.AsObject().Select(v => v.Key));
    }

    [Fact]
    public async Task Unknown_settings_texts_lists_and_refused_values_are_left_out()
    {
        var (looks, problems) = await Check($$"""[ {{Look("night", """{ "theme": "neon", "nope": 1, "hero.title": "Hi", "sections": ["story"], "shade": 42, "hero.variant": "poster" }""")}} ]""");
        Assert.Equal("""{"hero.variant":"poster"}""", looks.Single()!["values"]!.ToJsonString());
        Assert.Equal(5, problems.Count);
        Assert.Contains(problems, p => p.StartsWith("looks.night.hero.title: not a design setting", StringComparison.Ordinal));
        Assert.Contains(problems, p => p.StartsWith("looks.night.theme:", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Looks_need_an_id_names_values_and_at_most_six()
    {
        var many = string.Join(", ", Enumerable.Range(1, 7).Select(n => Look($"look{n}", """{ "theme": "night" }""")));
        var (looks, problems) = await Check($$"""
            [ {{Look("Night-1", """{ "theme": "night" }""")}}, {{Look("empty", """{ "theme": "neon" }""")}},
              {{Look("noar", """{ "theme": "night" }""", ar: "")}}, {{Look("long", """{ "theme": "night" }""", en: "A name far too long for a tile")}},
              {{many}}, {{Look("look1", """{ "theme": "cream" }""")}} ]
            """);
        Assert.Equal(["look1", "look2", "look3", "look4", "look5", "look6"], looks.Select(l => l!["id"]!.GetValue<string>()));
        Assert.Contains(problems, p => p.StartsWith("looks.Night-1:", StringComparison.Ordinal));
        Assert.Contains(problems, p => p == "looks.empty: no values left");
        Assert.Contains(problems, p => p.StartsWith("looks.noar:", StringComparison.Ordinal));
        Assert.Contains(problems, p => p.StartsWith("looks.long:", StringComparison.Ordinal));
        Assert.Contains(problems, p => p.StartsWith("looks.look7: a template has up to 6", StringComparison.Ordinal));
        Assert.Contains(problems, p => p.StartsWith("looks.look1: needs a new id", StringComparison.Ordinal));
    }

    [Fact]
    public async Task No_looks_or_not_a_list_means_none()
    {
        var problems = new List<string>();
        Assert.Equal("[]", await TemplateSchema.Parse(Schema).ValidLooksAsync(null, problems));
        Assert.Equal("[]", await TemplateSchema.Parse(Schema).ValidLooksAsync(JsonNode.Parse("{}"), problems));
        Assert.Equal(["looks: not a list"], problems);
    }

    [Fact]
    public void The_editor_gets_the_looks_with_the_template()
    {
        var template = Template.Create("ticket", 1, "Ticket", "Café", null, null, Schema, """{ "theme": "cream" }""", 1);
        Assert.Equal(JsonValueKind.Array, TemplateDto.From(template).Looks.ValueKind);
        Assert.Equal(0, TemplateDto.From(template).Looks.GetArrayLength());

        template.SetLooks($$"""[ {{Look("night", """{ "theme": "night" }""")}} ]""");
        var looks = TemplateDto.From(template).Looks;
        Assert.Equal("night", looks[0].GetProperty("values").GetProperty("theme").GetString());
        Assert.Equal("Night", TemplateSchema.ParseLooks(template.Looks).Single().Label);

        template.SetLooks(null);
        Assert.Equal("[]", template.Looks);
    }

    [Fact]
    public async Task Every_look_in_the_registry_passes_the_importer()
    {
        using var registry = JsonDocument.Parse(await File.ReadAllTextAsync(RegistryPath()));
        var count = 0;
        foreach (var manifest in registry.RootElement.GetProperty("templates").EnumerateArray())
        {
            var id = manifest.GetProperty("id").GetString();
            var looks = JsonNode.Parse(manifest.GetProperty("looks").GetRawText());
            var problems = new List<string>();
            var kept = (JsonArray)JsonNode.Parse(await TemplateSchema.Parse(manifest.GetProperty("schema").GetRawText()).ValidLooksAsync(looks, problems))!;
            Assert.True(problems.Count == 0, $"{id}: {string.Join("; ", problems)}");
            Assert.True(JsonNode.DeepEquals(looks, kept), $"{id}: the importer kept every look as it is");
            Assert.InRange(kept.Count, 4, 6);
            var signature = TemplateSchema.Parse(manifest.GetProperty("schema").GetRawText()).Fields.Where(f => f.Signature is not null).SelectMany(f => f.Signature!).ToList();
            Assert.InRange(signature.Count, 1, 3);
            count++;
        }

        Assert.Equal(29, count);
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
