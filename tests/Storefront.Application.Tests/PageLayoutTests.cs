using System.Text.Json;
using Storefront.Application.Ai;
using Storefront.Application.Templates;

namespace Storefront.Application.Tests;

/// <summary>The shared "Page layout" options (apps/sites/templates/_kit/layout-settings.json): header and opening layouts.</summary>
public class PageLayoutTests
{
    private static readonly string[] Keys = ["header.layout", "header.style", "header.sticky", "hero.variant"];

    [Fact]
    public void Every_page_layout_option_in_the_registry_is_editable_by_the_assistant_and_has_pictures()
    {
        using var registry = JsonDocument.Parse(File.ReadAllText(RegistryPath()));
        var templates = registry.RootElement.GetProperty("templates").EnumerateArray().ToList();
        Assert.NotEmpty(templates);
        foreach (var t in templates)
        {
            var id = t.GetProperty("id").GetString();
            var schema = TemplateSchema.Parse(t.GetProperty("schema").GetRawText());
            var layout = schema.Fields.Where(f => f.Group == "Page layout").ToList();
            Assert.True(Keys.All(k => layout.Any(f => f.Key == k)), $"{id} lacks a page layout option");
            foreach (var field in layout)
            {
                Assert.True(TemplateAiFields.IsEditable(field), $"{id} {field.Key} is not editable");
                if (field.Key == "hero.layout")
                {
                    continue;
                }

                Assert.Equal("auto", field.Options![0]);
                Assert.Equal(field.Options, field.Previews!.Keys);
            }

            var properties = TemplateAiFields.Schema(layout, schema.Fields)["properties"]!;
            Assert.Contains("centered (Logo in the middle)", properties["header.layout"]!["description"]!.GetValue<string>());
            Assert.Contains("menu (Menu first)", properties["hero.variant"]!["description"]!.GetValue<string>());
            Assert.Contains("poster (Poster with big type)", properties["hero.variant"]!["description"]!.GetValue<string>());
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
