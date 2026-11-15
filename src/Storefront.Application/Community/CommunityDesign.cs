using System.Text.Json.Nodes;
using Storefront.Application.Templates;

namespace Storefront.Application.Community;

/// <summary>
/// What part of a site's settings travels with a community template: the design (colors, fonts, layout choices, which
/// sections show and in what order, and the AI style sheet). The publisher's texts, uploaded photos and opening hours stay
/// with them; a template picture ("preset:...") is not personal, so it travels too.
/// </summary>
public static class CommunityDesign
{
    /// <summary>The setting types that are shared: the look types plus the section order and toggles and the style sheet.</summary>
    public static readonly IReadOnlySet<string> SharedTypes = new HashSet<string>(TemplateSchema.LookTypes) { "toggles", "order", "css" };

    /// <summary>A template can host community designs when it has a style sheet setting (the Studio template).</summary>
    public static bool CanShare(TemplateSchema schema) => schema.Fields.Any(f => f.Type == "css");

    /// <summary>The shareable part of <paramref name="settings"/>.</summary>
    public static JsonObject Extract(TemplateSchema schema, JsonObject settings)
    {
        var design = new JsonObject();
        foreach (var field in schema.Fields)
        {
            if (!settings.TryGetPropertyValue(field.Key, out var value) || value is null)
            {
                continue;
            }

            if (SharedTypes.Contains(field.Type)
                || (field.Type == "image" && value is JsonValue v && v.TryGetValue<string>(out var image) && image.StartsWith(TemplateSchema.PresetPrefix, StringComparison.Ordinal)))
            {
                design[field.Key] = value.DeepClone();
            }
        }

        return design;
    }

    /// <summary><paramref name="baseSettings"/> with the shared design laid over it. Keys the design should not carry are ignored.</summary>
    public static JsonObject Apply(TemplateSchema schema, JsonObject baseSettings, JsonObject design)
    {
        var result = (JsonObject)baseSettings.DeepClone();
        foreach (var (key, value) in Extract(schema, design))
        {
            result[key] = value?.DeepClone();
        }

        return result;
    }

    /// <summary>
    /// Up to three colors that sum up the design, for gallery cards: custom colors as they are, palettes by their main color.
    /// </summary>
    public static IReadOnlyList<string> Colors(TemplateSchema schema, JsonObject design)
    {
        var colors = new List<string>();
        foreach (var field in schema.Fields.Where(f => f.Type is "palette" or "color"))
        {
            if (design[field.Key] is not JsonValue v || !v.TryGetValue<string>(out var value))
            {
                continue;
            }

            var color = value.StartsWith('#') ? value : field.Swatches?.GetValueOrDefault(value);
            if (color is not null && !colors.Contains(color, StringComparer.OrdinalIgnoreCase))
            {
                colors.Add(color);
            }

            if (colors.Count == 3)
            {
                break;
            }
        }

        return colors;
    }
}
