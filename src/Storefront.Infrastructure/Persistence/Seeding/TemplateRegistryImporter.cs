using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Unicode;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Storefront.Application.Common;
using Storefront.Application.Templates;
using Storefront.Domain.Templates;
using Storefront.Infrastructure.Services;

namespace Storefront.Infrastructure.Persistence.Seeding;

/// <summary>
/// Upserts the Templates table from apps/sites/templates/registry.json. Templates missing from the file are deactivated.
/// The optional "ar" block (name, category, description) and "defaultsAr" object carry each template's Arabic.
/// </summary>
public sealed class TemplateRegistryImporter(StorefrontDbContext db, IOptions<StorefrontOptions> options, ILogger<TemplateRegistryImporter> logger)
{
    public string? RegistryPath => options.Value.TemplateRegistryFile
        ?? RepoFiles.Find(Path.Combine("apps", "sites", "templates", "registry.json"), AppContext.BaseDirectory, Directory.GetCurrentDirectory());

    public async Task<int> ImportAsync(CancellationToken ct)
    {
        var path = RegistryPath;
        if (path is null || !File.Exists(path))
        {
            logger.LogWarning("Template registry not found; templates were not imported");
            return 0;
        }

        await using var stream = File.OpenRead(path);
        return await ImportAsync(stream, ct);
    }

    public async Task<int> ImportAsync(Stream registry, CancellationToken ct)
    {
        using var doc = await JsonDocument.ParseAsync(registry, cancellationToken: ct);
        var existing = await db.Templates.ToDictionaryAsync(t => t.Id, ct);
        var seen = new HashSet<string>();

        foreach (var manifest in doc.RootElement.GetProperty("templates").EnumerateArray())
        {
            var id = manifest.GetProperty("id").GetString()!;
            var number = manifest.GetProperty("number").GetInt32();
            var name = manifest.GetProperty("name").GetString()!;
            var category = manifest.GetProperty("category").GetString()!;
            var thumbnail = manifest.TryGetProperty("thumbnail", out var t) ? t.GetString() : null;
            var description = manifest.TryGetProperty("description", out var d) ? d.GetString() : null;
            var tier = manifest.TryGetProperty("tier", out var tr) && tr.ValueKind == JsonValueKind.String ? tr.GetString() : null;
            var version = manifest.GetProperty("version").GetInt32();
            var schema = manifest.GetProperty("schema").GetRawText();
            var defaults = manifest.GetProperty("defaults").GetRawText();
            var ar = manifest.TryGetProperty("ar", out var a) && a.ValueKind == JsonValueKind.Object ? a : (JsonElement?)null;
            var defaultsAr = await ArabicDefaultsAsync(id, manifest, schema, defaults);
            seen.Add(id);

            if (!existing.TryGetValue(id, out var template))
            {
                template = Template.Create(id, number, name, category, description, thumbnail, schema, defaults, version, tier);
                db.Templates.Add(template);
            }
            else
            {
                template.Update(number, name, category, description, thumbnail, schema, defaults, version, tier);
                template.Activate();
            }

            template.SetArabic(Text(ar, "name"), Text(ar, "category"), Text(ar, "description"), defaultsAr);
        }

        foreach (var stale in existing.Values.Where(t => !seen.Contains(t.Id)))
        {
            stale.Deactivate();
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Imported {Count} templates from the registry", seen.Count);
        return seen.Count;
    }

    private static string? Text(JsonElement? block, string name) =>
        block is { } b && b.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    /// <summary>
    /// The optional "defaultsAr" object, checked against the schema like a saved draft. A key that fails is left out
    /// (Arabic businesses then get the English default for it) and logged, so one bad translation never stops the import.
    /// </summary>
    private async Task<string> ArabicDefaultsAsync(string id, JsonElement manifest, string schema, string defaults)
    {
        if (!manifest.TryGetProperty("defaultsAr", out var element) || element.ValueKind == JsonValueKind.Null)
        {
            return "{}";
        }

        if (JsonNode.Parse(element.GetRawText()) is not JsonObject arabic)
        {
            logger.LogWarning("Template {Template}: defaultsAr is not an object and was ignored", id);
            return "{}";
        }

        var (valid, errors) = await TemplateDefaults.CheckArabicAsync(schema, defaults, arabic);
        foreach (var (key, messages) in errors)
        {
            logger.LogWarning("Template {Template}: defaultsAr.{Key} was ignored: {Problem}", id, key, string.Join(" ", messages));
        }

        return valid.ToJsonString(Readable);
    }

    private static readonly JsonSerializerOptions Readable = new() { Encoder = JavaScriptEncoder.Create(UnicodeRanges.All) };
}
