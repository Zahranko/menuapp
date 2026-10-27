using System.Globalization;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using System.Text.Unicode;

namespace Storefront.Application.Templates;

/// <summary>
/// One editable setting of a template. The editor renders a control per field; the validator checks values against it.
/// <see cref="OptionLabels"/> (English option names) and <see cref="Swatches"/> (a palette option's main color) only describe options;
/// the AI helper reads them to pick fitting values. <see cref="Previews"/> maps a choice's options to small pictures of them
/// (site-relative SVG paths like "/kit/previews/buttons-pill.svg") that the editor shows as picture tiles.
/// </summary>
public sealed record TemplateField(
    string Key,
    string Type,
    string Label,
    string? Group,
    IReadOnlyList<string>? Options,
    IReadOnlyList<string>? Presets,
    int? Max,
    double? Min,
    double? RangeMax,
    double? Step,
    bool Custom = false,
    IReadOnlyDictionary<string, string>? OptionLabels = null,
    IReadOnlyDictionary<string, string>? Swatches = null,
    IReadOnlyDictionary<string, string>? Previews = null);

public sealed partial class TemplateSchema
{
    public const string PresetPrefix = "preset:";
    public static readonly IReadOnlyList<string> Days = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];

    private TemplateSchema(IReadOnlyList<TemplateField> fields) => Fields = fields;

    public IReadOnlyList<TemplateField> Fields { get; }

    public static TemplateSchema Parse(string json)
    {
        var fields = new List<TemplateField>();
        foreach (var f in JsonNode.Parse(json)!.AsArray())
        {
            var type = f!["type"]!.GetValue<string>();
            fields.Add(new TemplateField(
                f["key"]!.GetValue<string>(),
                type,
                f["label"]?.GetValue<string>() ?? f["key"]!.GetValue<string>(),
                f["group"]?.GetValue<string>(),
                f["options"]?.AsArray().Select(o => o!.GetValue<string>()).ToList(),
                f["presets"]?.AsArray().Select(o => o!.GetValue<string>()).ToList(),
                type is "range" ? null : f["max"]?.GetValue<int>(),
                f["min"]?.GetValue<double>(),
                type is "range" ? f["max"]?.GetValue<double>() : null,
                f["step"]?.GetValue<double>(),
                type is "color" && f["custom"]?.GetValue<bool>() == true,
                Strings(f["optionLabels"]),
                Strings(f["swatches"]),
                type is "choice" ? ValidPreviews(f, out _) : null));
        }

        return new TemplateSchema(fields);
    }

    /// <summary>
    /// The schema with every preview picture that can't be shown left out: previews on a field that is not a choice,
    /// for an option the field doesn't have, or that is not a site-relative SVG path. <paramref name="problems"/> names each one.
    /// The registry is checked when it is built (scripts/build-registry.mjs); this keeps a bad entry from reaching the editor.
    /// </summary>
    public static string WithValidPreviews(string json, out List<string> problems)
    {
        problems = [];
        var fields = JsonNode.Parse(json)!.AsArray();
        foreach (var f in fields.OfType<JsonObject>())
        {
            if (f["previews"] is null)
            {
                continue;
            }

            var key = f["key"]?.GetValue<string>() ?? "?";
            if (f["type"]?.GetValue<string>() != "choice")
            {
                problems.Add($"{key}: previews are only for choices");
                f.Remove("previews");
                continue;
            }

            var valid = ValidPreviews(f, out var bad);
            problems.AddRange(bad.Select(b => $"{key}.previews.{b}"));
            if (valid is null)
            {
                f.Remove("previews");
            }
            else if (bad.Count > 0)
            {
                f["previews"] = new JsonObject(valid.Select(p => KeyValuePair.Create(p.Key, (JsonNode?)p.Value)));
            }
        }

        // Unchanged schemas keep their exact text (and their Arabic letters unescaped).
        return problems.Count == 0 ? json : fields.ToJsonString(Readable);
    }

    private static readonly JsonSerializerOptions Readable = new() { Encoder = JavaScriptEncoder.Create(UnicodeRanges.All) };

    /// <summary>A choice's previews whose option exists and whose picture is a site-relative SVG path; null when none.</summary>
    private static Dictionary<string, string>? ValidPreviews(JsonNode field, out List<string> bad)
    {
        bad = [];
        if (field["previews"] is not JsonObject map)
        {
            if (field["previews"] is not null)
            {
                bad.Add("(not an object)");
            }

            return null;
        }

        var options = field["options"] is JsonArray o ? o.Select(x => x?.GetValue<string>()).ToHashSet() : [];
        var valid = new Dictionary<string, string>();
        foreach (var (option, value) in map)
        {
            if (options.Contains(option) && value is JsonValue v && v.TryGetValue<string>(out var path) && PreviewPath().IsMatch(path) && !path.Contains("..", StringComparison.Ordinal))
            {
                valid[option] = path;
            }
            else
            {
                bad.Add(option);
            }
        }

        return valid.Count > 0 ? valid : null;
    }

    private static Dictionary<string, string>? Strings(JsonNode? node) =>
        node is JsonObject map
            ? map.Where(e => e.Value is JsonValue v && v.TryGetValue<string>(out _)).ToDictionary(e => e.Key, e => e.Value!.GetValue<string>())
            : null;

    /// <summary>
    /// Checks <paramref name="settings"/> against the schema and returns the complete settings (defaults filled in for missing keys),
    /// or field errors. <paramref name="isOwnImage"/> tells whether an uploaded image URL belongs to the business.
    /// </summary>
    public async Task<(JsonObject? Settings, Dictionary<string, string[]> Errors)> ValidateAsync(
        JsonObject settings, JsonObject defaults, Func<string, Task<bool>> isOwnImage)
    {
        var errors = new Dictionary<string, string[]>();
        var byKey = Fields.ToDictionary(f => f.Key);
        foreach (var (key, _) in settings)
        {
            if (!byKey.ContainsKey(key))
            {
                errors[key] = ["This template has no such setting."];
            }
        }

        var result = new JsonObject();
        foreach (var field in Fields)
        {
            var value = settings.TryGetPropertyValue(field.Key, out var v) ? v : defaults[field.Key];
            var error = await CheckAsync(field, value, isOwnImage);
            if (error is not null)
            {
                errors[field.Key] = [error];
            }
            else
            {
                result[field.Key] = value?.DeepClone();
            }
        }

        return errors.Count > 0 ? (null, errors) : (result, errors);
    }

    private static async Task<string?> CheckAsync(TemplateField field, JsonNode? value, Func<string, Task<bool>> isOwnImage)
    {
        switch (field.Type)
        {
            case "color" when field.Custom:
                // A color field with "custom": true also takes any color the owner mixes, as #RRGGBB.
                return value is JsonValue colorValue && colorValue.TryGetValue<string>(out var hex) && (field.Options!.Contains(hex) || HexColor().IsMatch(hex))
                    ? null
                    : "Choose a color, like #D9542C.";

            case "choice" or "palette" or "color":
                return value is JsonValue cv && cv.TryGetValue<string>(out var choice) && field.Options!.Contains(choice)
                    ? null
                    : $"Choose one of: {string.Join(", ", field.Options!)}.";

            case "text" or "textarea":
                if (value is null)
                {
                    return null;
                }

                if (value is not JsonValue tv || !tv.TryGetValue<string>(out var text))
                {
                    return "Enter text.";
                }

                return field.Max is { } max && text.Length > max ? $"Use up to {max} characters." : null;

            case "range":
                if (value is not JsonValue rv || !rv.TryGetValue<double>(out var number))
                {
                    return "Choose a value.";
                }

                if (number < (field.Min ?? double.MinValue) || number > (field.RangeMax ?? double.MaxValue))
                {
                    return $"Choose a value from {field.Min} to {field.RangeMax}.";
                }

                if (field.Step is { } step and > 0 && Math.Abs(Math.IEEERemainder(number - (field.Min ?? 0), step)) > 1e-9)
                {
                    return $"Use steps of {step.ToString(CultureInfo.InvariantCulture)}.";
                }

                return null;

            case "toggle":
                return value is JsonValue bv && bv.TryGetValue<bool>(out _) ? null : "Turn this on or off.";

            case "toggles":
                if (value is not JsonArray toggles)
                {
                    return "Choose which ones are on.";
                }

                var names = toggles.Select(t => t is JsonValue jv && jv.TryGetValue<string>(out var s) ? s : null).ToList();
                return names.All(n => n is not null && field.Options!.Contains(n)) && names.Distinct().Count() == names.Count
                    ? null
                    : $"Choose from: {string.Join(", ", field.Options!)}.";

            case "image":
                return await CheckImageAsync(field, value, isOwnImage);

            case "images":
                if (value is not JsonArray images)
                {
                    return "Add photos.";
                }

                if (field.Max is { } maxImages && images.Count > maxImages)
                {
                    return $"Add up to {maxImages} photos.";
                }

                foreach (var image in images)
                {
                    if (await CheckImageAsync(field, image, isOwnImage) is { } imageError)
                    {
                        return imageError;
                    }
                }

                return null;

            case "hours":
                if (value is not JsonObject hours)
                {
                    return "Add your opening hours.";
                }

                foreach (var (day, range) in hours)
                {
                    if (!Days.Contains(day))
                    {
                        return $"Unknown day \"{day}\".";
                    }

                    if (range is null || (range is JsonValue hv && hv.TryGetValue<string>(out var h) && (h.Length == 0 || h == "closed" || HoursRange().IsMatch(h))))
                    {
                        continue;
                    }

                    return "Use times like 08:00-23:00, or closed.";
                }

                return null;

            default:
                return $"Unknown setting type \"{field.Type}\".";
        }
    }

    private static async Task<string?> CheckImageAsync(TemplateField field, JsonNode? value, Func<string, Task<bool>> isOwnImage)
    {
        if (value is null)
        {
            return null;
        }

        if (value is not JsonValue jv || !jv.TryGetValue<string>(out var image))
        {
            return "Choose a photo.";
        }

        if (image.Length == 0)
        {
            return null;
        }

        if (image.StartsWith(PresetPrefix, StringComparison.Ordinal))
        {
            return field.Presets?.Contains(image[PresetPrefix.Length..]) == true ? null : "Choose one of the template's pictures.";
        }

        return await isOwnImage(image) ? null : "Upload the photo again.";
    }

    [GeneratedRegex("^/[A-Za-z0-9][A-Za-z0-9/_.-]*\\.svg$")]
    private static partial Regex PreviewPath();

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$")]
    private static partial Regex HexColor();

    [GeneratedRegex("^([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-4]):[0-5][0-9]$")]
    private static partial Regex HoursRange();
}
