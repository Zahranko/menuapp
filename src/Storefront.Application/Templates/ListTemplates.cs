using System.Text.Json;
using Storefront.Application.Abstractions;
using Storefront.Domain.Templates;

namespace Storefront.Application.Templates;

/// <summary>
/// A gallery template. <see cref="Tier"/> is "basic" (every plan) or "pro" (Pro plan only).
/// <see cref="Ar"/> holds the Arabic gallery texts (null when the template has no Arabic name); <see cref="DefaultsAr"/> holds Arabic
/// text values that replace top-level keys of <see cref="Defaults"/> for Arabic businesses ({} when none).
/// Schema fields may carry labelAr, groupAr and optionLabelsAr; the schema is returned exactly as the registry has it.
/// </summary>
public sealed record TemplateDto(
    string Id,
    int Number,
    string Name,
    string Category,
    string? Description,
    string? ThumbnailUrl,
    int Version,
    string Tier,
    JsonElement Schema,
    JsonElement Defaults,
    TemplateArabicDto? Ar,
    JsonElement DefaultsAr)
{
    public static TemplateDto From(Template t) => new(
        t.Id, t.Number, t.Name, t.Category, t.Description, t.ThumbnailUrl, t.Version, t.Tier,
        JsonDocument.Parse(t.SettingsSchema).RootElement.Clone(),
        JsonDocument.Parse(t.DefaultSettings).RootElement.Clone(),
        t.NameAr is null ? null : new TemplateArabicDto(t.NameAr, t.CategoryAr ?? t.Category, t.DescriptionAr ?? t.Description ?? ""),
        JsonDocument.Parse(t.DefaultSettingsAr).RootElement.Clone());
}

/// <summary>Arabic gallery texts of a template (present when the registry gives an Arabic name). A missing category or description falls back to the English one.</summary>
public sealed record TemplateArabicDto(string Name, string Category, string Description);

public sealed class ListTemplatesHandler(ITemplateRepository templates)
{
    public async Task<IReadOnlyList<TemplateDto>> Handle(CancellationToken ct) =>
        (await templates.ListAsync(activeOnly: true, ct)).Select(TemplateDto.From).ToList();
}
