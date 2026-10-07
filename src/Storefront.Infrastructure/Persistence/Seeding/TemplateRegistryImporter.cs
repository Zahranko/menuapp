using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Storefront.Application.Common;
using Storefront.Domain.Templates;
using Storefront.Infrastructure.Services;

namespace Storefront.Infrastructure.Persistence.Seeding;

/// <summary>Upserts the Templates table from apps/sites/templates/registry.json. Templates missing from the file are deactivated.</summary>
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
            var version = manifest.GetProperty("version").GetInt32();
            var schema = manifest.GetProperty("schema").GetRawText();
            var defaults = manifest.GetProperty("defaults").GetRawText();
            seen.Add(id);

            if (existing.TryGetValue(id, out var template))
            {
                template.Update(number, name, category, description, thumbnail, schema, defaults, version);
                template.Activate();
            }
            else
            {
                db.Templates.Add(Template.Create(id, number, name, category, description, thumbnail, schema, defaults, version));
            }
        }

        foreach (var stale in existing.Values.Where(t => !seen.Contains(t.Id)))
        {
            stale.Deactivate();
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Imported {Count} templates from the registry", seen.Count);
        return seen.Count;
    }
}
