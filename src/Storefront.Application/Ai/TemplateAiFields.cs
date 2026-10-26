using System.Globalization;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Storefront.Application.Templates;

namespace Storefront.Application.Ai;

/// <summary>
/// Turns a template's settings schema into what the model may fill, and its answer back into a safe settings patch.
/// Works from the field types (text, textarea, color, palette, choice, range, toggle, toggles), so fields added to templates later are covered
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

    /// <summary>
    /// Everything the chat assistant may set from a value: texts (<see cref="IsCopy"/>), colors, themes and choices, sizes and
    /// other ranges, switches and lists of switches (like which sections show). Left out: images and photo lists (the owner
    /// uploads those), opening hours, and facts only the owner knows: reviews, years, contact details, places, links, the
    /// order button's text and action, and which social accounts show.
    /// </summary>
    public static bool IsEditable(TemplateField field) => field.Type switch
    {
        "text" or "textarea" => IsCopy(field),
        _ when FactKeys().IsMatch(field.Key) => false,
        "color" or "palette" or "choice" or "toggles" => field.Options is { Count: > 0 },
        "range" => field.Min is not null && field.RangeMax is not null && field.RangeMax >= field.Min,
        "toggle" => true,
        _ => false,
    };

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

        if (field.Type == "range")
        {
            var step = field.Step is > 0 ? $" in steps of {Number(field.Step.Value)}" : "";
            return new JsonObject
            {
                ["type"] = "number",
                ["minimum"] = field.Min,
                ["maximum"] = field.RangeMax,
                ["description"] = $"{field.Label}: a number from {Number(field.Min ?? 0)} to {Number(field.RangeMax ?? 0)}{step}",
            };
        }

        if (field.Type == "toggle")
        {
            return new JsonObject { ["type"] = "boolean", ["description"] = $"{field.Label}: true for on, false for off" };
        }

        var options = field.Options ?? [];
        var described = string.Join(", ", options.Select(o => Describe(field, o)));
        if (field.Type == "toggles")
        {
            return new JsonObject
            {
                ["type"] = "array",
                ["items"] = new JsonObject { ["type"] = "string", ["enum"] = new JsonArray(options.Select(o => (JsonNode)o).ToArray()) },
                ["uniqueItems"] = true,
                ["description"] = $"{field.Label}: the complete list of the ones that are on (any left out are off); options: {described}",
            };
        }

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

    private static string Number(double value) => value.ToString(CultureInfo.InvariantCulture);

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
            if (allowed.TryGetValue(key, out var field) && Value(field, node) is { } value)
            {
                patch[key] = value;
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

    /// <summary>One proposed value in the form the draft stores it, or null when it can't be used.</summary>
    private static JsonNode? Value(TemplateField field, JsonNode? node)
    {
        switch (field.Type)
        {
            case "range":
                return Range(field, node);
            case "toggle":
                return Switch(node) is { } on ? JsonValue.Create(on) : null;
            case "toggles":
                return Toggles(field, node);
        }

        if (node is not JsonValue value || !value.TryGetValue<string>(out var text))
        {
            return null;
        }

        if (field.Type is "text" or "textarea")
        {
            return AiText.Clean(text, field.Max ?? 400, multiline: field.Type == "textarea") is { } clean ? JsonValue.Create(clean) : null;
        }

        if (field is { Type: "color", Custom: true } && HexColor().IsMatch(text.Trim()))
        {
            return JsonValue.Create(text.Trim().ToUpper(CultureInfo.InvariantCulture));
        }

        return Option(field, text) is { } option ? JsonValue.Create(option) : null;
    }

    /// <summary>Options are matched exactly first, then ignoring case ("Night" for "night").</summary>
    private static string? Option(TemplateField field, string text) =>
        field.Options?.FirstOrDefault(o => o == text.Trim())
        ?? field.Options?.FirstOrDefault(o => string.Equals(o, text.Trim(), StringComparison.OrdinalIgnoreCase));

    /// <summary>A number (or a number written as text), kept inside the range and moved to the nearest step.</summary>
    private static JsonValue? Range(TemplateField field, JsonNode? node)
    {
        if (node is not JsonValue value)
        {
            return null;
        }

        double number;
        if (value.TryGetValue<double>(out var d))
        {
            number = d;
        }
        else if (value.TryGetValue<string>(out var s) && double.TryParse(s.Trim().TrimEnd('%'), NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed))
        {
            number = parsed;
        }
        else
        {
            return null;
        }

        if (!double.IsFinite(number) || field.Min is not { } min || field.RangeMax is not { } max)
        {
            return null;
        }

        number = Math.Clamp(number, min, max);
        if (field.Step is { } step and > 0)
        {
            number = Math.Min(max, min + (Math.Round((number - min) / step, MidpointRounding.AwayFromZero) * step));
            number = Math.Round(number, 6);
        }

        return JsonValue.Create(number);
    }

    private static bool? Switch(JsonNode? node)
    {
        if (node is not JsonValue value)
        {
            return null;
        }

        if (value.TryGetValue<bool>(out var on))
        {
            return on;
        }

        return value.TryGetValue<string>(out var text) ? text.Trim().ToLowerInvariant() switch { "true" or "on" => true, "false" or "off" => false, _ => null } : null;
    }

    /// <summary>The options that are on, in the template's order. One unknown option drops the whole list, so nothing turns off by mistake.</summary>
    private static JsonArray? Toggles(TemplateField field, JsonNode? node)
    {
        if (node is not JsonArray items || field.Options is not { } options)
        {
            return null;
        }

        var on = new HashSet<string>();
        foreach (var item in items)
        {
            if (item is not JsonValue value || !value.TryGetValue<string>(out var text) || Option(field, text) is not { } option)
            {
                return null;
            }

            on.Add(option);
        }

        return new JsonArray(options.Where(on.Contains).Select(o => (JsonNode)JsonValue.Create(o)).ToArray());
    }

    [GeneratedRegex("colou?r|theme|background|palette|tone|tint|font", RegexOptions.IgnoreCase)]
    private static partial Regex LookWords();

    [GeneratedRegex(@"^reviews?\.|\.since$|^order\.(label|action)$|^social\.|^(location|areas)$|phone|email|address|whatsapp|instagram|url|link", RegexOptions.IgnoreCase)]
    private static partial Regex FactKeys();

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$")]
    private static partial Regex HexColor();
}
