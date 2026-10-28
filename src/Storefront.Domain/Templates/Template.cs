using Storefront.Domain.Common;

namespace Storefront.Domain.Templates;

/// <summary>A site design. Rows mirror apps/sites/templates/registry.json, which the Next.js app builds from manifests.</summary>
public sealed class Template
{
    private Template()
    {
    }

    public string Id { get; private set; } = "";
    public int Number { get; private set; }
    public string Name { get; private set; } = "";
    public string Category { get; private set; } = "";
    public string? Description { get; private set; }
    public string? ThumbnailUrl { get; private set; }
    /// <summary>JSON array of typed fields the editor renders controls from.</summary>
    public string SettingsSchema { get; private set; } = "[]";
    /// <summary>JSON object of the settings a new site starts with.</summary>
    public string DefaultSettings { get; private set; } = "{}";
    /// <summary>Arabic gallery name, category and description from the registry's "ar" block; null when the template has none.</summary>
    public string? NameAr { get; private set; }
    public string? CategoryAr { get; private set; }
    public string? DescriptionAr { get; private set; }
    /// <summary>JSON object of Arabic text values that replace top-level keys of <see cref="DefaultSettings"/> for Arabic businesses.</summary>
    public string DefaultSettingsAr { get; private set; } = "{}";
    /// <summary>
    /// JSON array of the template's named looks: <c>[{ "id", "label": { "en", "ar" }, "values": { settingKey: value } }]</c>.
    /// Each look sets several design settings at once; the importer keeps only values the schema accepts.
    /// </summary>
    public string Looks { get; private set; } = "[]";
    public int Version { get; private set; }
    public bool IsActive { get; private set; } = true;
    /// <summary><see cref="TemplateTier.Basic"/> (every plan) or <see cref="TemplateTier.Pro"/> (Pro plan only).</summary>
    public string Tier { get; private set; } = TemplateTier.Basic;

    public bool IsPro => Tier == TemplateTier.Pro;

    public static Template Create(string id, int number, string name, string category, string? description, string? thumbnailUrl, string settingsSchema, string defaultSettings, int version, string? tier = null)
    {
        var template = new Template { Id = Guard.Text(id, "id", 1, 40, "template.id").ToLowerInvariant() };
        template.Update(number, name, category, description, thumbnailUrl, settingsSchema, defaultSettings, version, tier);
        return template;
    }

    public void Update(int number, string name, string category, string? description, string? thumbnailUrl, string settingsSchema, string defaultSettings, int version, string? tier = null)
    {
        if (number is < 1 or > 999)
        {
            throw new DomainException("template.number", "Template number must be 1 to 999.", "number");
        }

        Number = number;
        Name = Guard.Text(name, "name", 1, 60, "template.name");
        Category = Guard.Text(category, "category", 1, 40, "template.category");
        Description = description is { Length: > 300 } ? description[..300] : description;
        ThumbnailUrl = thumbnailUrl;
        SettingsSchema = settingsSchema;
        DefaultSettings = defaultSettings;
        Version = version;
        Tier = TemplateTier.Normalize(tier);
    }

    /// <summary>Sets the Arabic texts. Missing values mean the template has no Arabic yet (English is shown).</summary>
    public void SetArabic(string? name, string? category, string? description, string? defaultSettings)
    {
        NameAr = Guard.OptionalText(name, "nameAr", 60, "template.name");
        CategoryAr = Guard.OptionalText(category, "categoryAr", 40, "template.category");
        var trimmed = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        DescriptionAr = trimmed is { Length: > 300 } ? trimmed[..300] : trimmed;
        DefaultSettingsAr = string.IsNullOrWhiteSpace(defaultSettings) ? "{}" : defaultSettings;
    }

    /// <summary>Sets the looks (a JSON array checked against the schema by the importer); missing means none.</summary>
    public void SetLooks(string? looks) => Looks = string.IsNullOrWhiteSpace(looks) ? "[]" : looks;

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;
}

public static class TemplateTier
{
    public const string Basic = "basic";
    public const string Pro = "pro";
    public const int MaxLength = 10;

    /// <summary>Missing means basic; anything other than basic or pro is a broken manifest.</summary>
    public static string Normalize(string? tier)
    {
        var value = (tier ?? "").Trim().ToLowerInvariant();
        return value switch
        {
            "" or Basic => Basic,
            Pro => Pro,
            _ => throw new DomainException("template.tier", "Template tier must be basic or pro.", "tier"),
        };
    }
}
