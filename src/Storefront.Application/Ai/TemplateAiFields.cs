using System.Globalization;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Storefront.Application.Templates;

namespace Storefront.Application.Ai;

/// <summary>
/// Turns a template's settings schema into what the model may fill, and its answer back into a safe settings patch.
/// Works from the field types (text, textarea, color, palette, choice), so fields added to templates later are covered
/// without code changes. The patch is checked with the same rules a saved draft follows; anything that fails is dropped.
/// </summary>
public static partial class TemplateAiFields
{
    /// <summary>
    /// Fields that set the look: every color and palette field, and choices about colors, themes, backgrounds or fonts.
    /// </summary>
    public static bool IsDesign(TemplateField field) =>
        field.Type is "color" or "palette"
        || (field.Type == "choice" && field.Options is { Count: > 0 } && LookWords().IsMatch($"{field.Key} {field.Label} {field.Group}"));

    /// <summary>
    /// Texts the helper may write. Reviews, years, contact details, places and the order button are left alone:
    /// they are facts only the owner knows, and made-up reviews would mislead customers.
    /// </summary>
    public static bool IsCopy(TemplateField field) =>
        field.Type is "text" or "textarea" && field.Max is null or > 0 && !FactKeys().IsMatch(field.Key);

    /// <summary>A text field for the Arabic version of another field (like "hero.titleAr"); the helper writes it in Arabic.</summary>
    public static bool IsArabicTwin(TemplateField field, IReadOnlyCollection<TemplateField> all) =>
        field.Key.EndsWith("Ar", StringComparison.Ordinal) && all.Any(f => f.Key == field.Key[..^2]);

    /// <summary>A JSON Schema object with one optional property per field.</summary>
    public static JsonObject Schema(IReadOnlyList<TemplateField> fields, IReadOnlyCollection<TemplateField> all)
    {
        var properties = new JsonObject();
        foreach (var field in fields)
        {
            properties[field.Key] = Property(field, all);
        }

        return new JsonObject { ["type"] = "object", ["properties"] = properties };
    }

    private static JsonObject Property(TemplateField field, IReadOnlyCollection<TemplateField> all)
    {
        if (field.Type is "text" or "textarea")
        {
            var max = field.Max ?? 400;
            var language = IsArabicTwin(field, all) ? ", in Arabic" : "";
            return new JsonObject
            {
                ["type"] = "string",
                ["maxLength"] = max,
                ["description"] = $"{field.Label} (up to {max} characters{language})",
            };
        }

        var options = field.Options ?? [];
        var described = string.Join(", ", options.Select(o => Describe(field, o)));
        if (field.Type == "color" && field.Custom)
        {
            return new JsonObject
            {
                ["type"] = "string",
                ["description"] = $"{field.Label}: a color as #RRGGBB, or one of: {described}",
            };
        }

        return new JsonObject
        {
            ["type"] = "string",
            ["enum"] = new JsonArray(options.Select(o => (JsonNode)o).ToArray()),
            ["description"] = $"{field.Label}; options: {described}",
        };
    }

    private static string Describe(TemplateField field, string option)
    {
        var label = field.OptionLabels?.GetValueOrDefault(option);
        var swatch = field.Swatches?.GetValueOrDefault(option);
        var details = string.Join(", ", new[] { label, swatch }.Where(d => !string.IsNullOrWhiteSpace(d) && d != option));
        return details.Length == 0 ? option : $"{option} ({details})";
    }

    /// <summary>
    /// The model's proposed values for <paramref name="fields"/>, cleaned and checked against the schema. Unknown keys,
    /// wrong types, options the template doesn't have and texts that are empty are dropped; long texts are cut to fit.
    /// </summary>
    public static async Task<JsonObject> ToPatchAsync(TemplateSchema schema, IReadOnlyList<TemplateField> fields, JsonNode? proposed, JsonObject current)
    {
        var patch = new JsonObject();
        if (proposed is not JsonObject values)
        {
            return patch;
        }

        var allowed = fields.ToDictionary(f => f.Key);
        foreach (var (key, node) in values)
        {
            if (!allowed.TryGetValue(key, out var field) || node is not JsonValue value || !value.TryGetValue<string>(out var text))
            {
                continue;
            }

            if (field.Type is "text" or "textarea")
            {
                if (AiText.Clean(text, field.Max ?? 400, multiline: field.Type == "textarea") is { } clean)
                {
                    patch[key] = clean;
                }
            }
            else if (field is { Type: "color", Custom: true } && HexColor().IsMatch(text.Trim()))
            {
                patch[key] = text.Trim().ToUpper(CultureInfo.InvariantCulture);
            }
            else
            {
                // Options are matched exactly first, then ignoring case ("Night" for "night").
                var option = field.Options?.FirstOrDefault(o => o == text.Trim())
                    ?? field.Options?.FirstOrDefault(o => string.Equals(o, text.Trim(), StringComparison.OrdinalIgnoreCase));
                if (option is not null)
                {
                    patch[key] = option;
                }
            }
        }

        // The draft's own rules decide; a value that fails them is dropped, never sent to the editor.
        var (_, errors) = await schema.ValidateAsync(patch, current, _ => Task.FromResult(false));
        foreach (var key in errors.Keys.Where(patch.ContainsKey).ToList())
        {
            patch.Remove(key);
        }

        return patch;
    }

    [GeneratedRegex("colou?r|theme|background|palette|tone|tint|font", RegexOptions.IgnoreCase)]
    private static partial Regex LookWords();

    [GeneratedRegex(@"^reviews?\.|\.since$|^order\.label$|^(location|areas)$|phone|email|address|whatsapp|instagram|url|link", RegexOptions.IgnoreCase)]
    private static partial Regex FactKeys();

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$")]
    private static partial Regex HexColor();
}
