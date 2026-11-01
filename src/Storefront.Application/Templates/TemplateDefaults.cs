using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Unicode;
using Storefront.Application.Common.Localization;
using Storefront.Domain.Templates;

namespace Storefront.Application.Templates;

/// <summary>The settings a site starts with when it gets a template.</summary>
public static class TemplateDefaults
{
    /// <summary>
    /// The template's defaults; for an Arabic business, the Arabic defaults replace matching top-level keys
    /// (headlines, taglines and other texts), so the owner starts with Arabic copy. English businesses get the defaults as they are.
    /// </summary>
    public static JsonObject For(Template template, string? locale)
    {
        var defaults = JsonNode.Parse(template.DefaultSettings) as JsonObject ?? [];
        if (!Messages.IsArabic(locale) || JsonNode.Parse(template.DefaultSettingsAr) is not JsonObject arabic)
        {
            return defaults;
        }

        foreach (var (key, value) in arabic)
        {
            defaults[key] = value?.DeepClone();
        }

        return defaults;
    }

    /// <summary>
    /// Checks a registry's Arabic defaults against the template schema, the same rules a saved draft follows.
    /// Returns the keys that pass and the errors of the ones that do not (unknown keys, wrong types, too long).
    /// Uploaded images are never valid here: defaults may only point at the template's own pictures.
    /// </summary>
    public static async Task<(JsonObject Valid, Dictionary<string, string[]> Errors)> CheckArabicAsync(string schema, string defaults, JsonObject arabic)
    {
        var (_, errors) = await TemplateSchema.Parse(schema)
            .ValidateAsync(arabic, JsonNode.Parse(defaults) as JsonObject ?? [], _ => Task.FromResult(false));
        var own = errors.Where(e => arabic.ContainsKey(e.Key)).ToDictionary(e => e.Key, e => e.Value);
        var valid = new JsonObject();
        foreach (var (key, value) in arabic)
        {
            if (!own.ContainsKey(key))
            {
                valid[key] = value?.DeepClone();
            }
        }

        return (valid, own);
    }

    /// <summary>As JSON. English businesses get the stored defaults unchanged.</summary>
    public static string JsonFor(Template template, string? locale) =>
        Messages.IsArabic(locale) ? For(template, locale).ToJsonString(Readable) : template.DefaultSettings;

    /// <summary>Keeps Arabic letters as they are instead of \u escapes (HTML-sensitive characters are still escaped).</summary>
    private static readonly JsonSerializerOptions Readable = new() { Encoder = JavaScriptEncoder.Create(UnicodeRanges.All) };
}
