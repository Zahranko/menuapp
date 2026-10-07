using System.Text.Json;
using Storefront.Application.Abstractions;
using Storefront.Domain.Templates;

namespace Storefront.Application.Templates;

public sealed record TemplateDto(string Id, int Number, string Name, string Category, string? Description, string? ThumbnailUrl, int Version, JsonElement Schema, JsonElement Defaults)
{
    public static TemplateDto From(Template t) => new(
        t.Id, t.Number, t.Name, t.Category, t.Description, t.ThumbnailUrl, t.Version,
        JsonDocument.Parse(t.SettingsSchema).RootElement.Clone(),
        JsonDocument.Parse(t.DefaultSettings).RootElement.Clone());
}

public sealed class ListTemplatesHandler(ITemplateRepository templates)
{
    public async Task<IReadOnlyList<TemplateDto>> Handle(CancellationToken ct) =>
        (await templates.ListAsync(activeOnly: true, ct)).Select(TemplateDto.From).ToList();
}
