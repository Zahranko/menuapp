using System.Text.Json;
using Storefront.Application.Ai;
using Storefront.Application.Templates;

namespace Storefront.Application.Tests;

/// <summary>The shared "Menu layout" options (apps/sites/templates/_kit/menu-settings.json): how the products show.</summary>
public class MenuLayoutTests
{
    private static readonly string[] Keys =
        ["menu.layout", "menu.columns", "menu.photos", "menu.photoShape", "menu.price", "menu.categoryNav", "menu.categoryTitle"];

    /// <summary>Templates whose own menu choices sit in the group too (manifest "menu.own"); they keep their own options.</summary>
    private static readonly Dictionary<string, string> Own = new()
    {
        ["atlas"] = "density",
        ["ember"] = "cards",
        ["linen"] = "columns",
        ["lumen"] = "cards",
        ["maison"] = "carte.style",
        ["zen"] = "photos",
    };

    [Fact]
    public void Every_menu_layout_option_in_the_registry_is_editable_by_the_assistant_and_has_pictures()
    {
        using var registry = JsonDocument.Parse(File.ReadAllText(RegistryPath()));
        var templates = registry.RootElement.GetProperty("templates").EnumerateArray().ToList();
        Assert.NotEmpty(templates);
        foreach (var t in templates)
        {
            var id = t.GetProperty("id").GetString()!;
            var schema = TemplateSchema.Parse(t.GetProperty("schema").GetRawText());
            var menu = schema.Fields.Where(f => f.Group == "Menu layout").ToList();
            var expected = Keys.ToList();
            if (Own.TryGetValue(id, out var own))
            {
                expected.Insert(1, own);
            }

            Assert.Equal(expected, menu.Select(f => f.Key));
            foreach (var field in menu)
            {
                Assert.True(TemplateAiFields.IsEditable(field), $"{id} {field.Key} is not editable");
                if (field.Key == own)
                {
                    continue;
                }

                Assert.Equal("auto", field.Options![0]);
                Assert.Equal(field.Options, field.Previews!.Keys);
            }

            var properties = TemplateAiFields.Schema(menu, schema.Fields)["properties"]!;
            Assert.Contains("compact (Printed menu)", properties["menu.layout"]!["description"]!.GetValue<string>());
            Assert.Contains("large (Big photos)", properties["menu.layout"]!["description"]!.GetValue<string>());
            Assert.Contains("tabs (Tabs)", properties["menu.categoryNav"]!["description"]!.GetValue<string>());
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
