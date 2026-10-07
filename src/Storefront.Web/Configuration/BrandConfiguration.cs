using System.Text.Json;
using Storefront.Application.Common;

namespace Storefront.Web.Configuration;

public static class BrandConfiguration
{
    /// <summary>
    /// Loads the flat brand.json under the "Brand" section as the lowest-priority configuration source,
    /// so appsettings and environment variables (Brand__Domain, ...) override it.
    /// Looks for BRAND_FILE, then brand.json in the content root and its parent folders.
    /// </summary>
    public static IConfigurationBuilder AddBrandFile(this IConfigurationManager configuration, string contentRoot)
    {
        var path = Environment.GetEnvironmentVariable("BRAND_FILE") ?? FindUpwards(contentRoot, "brand.json");
        if (path is null || !File.Exists(path))
        {
            return configuration;
        }

        using var doc = JsonDocument.Parse(File.ReadAllText(path));
        var values = new Dictionary<string, string?>();
        foreach (var property in doc.RootElement.EnumerateObject())
        {
            values[$"{BrandOptions.SectionName}:{property.Name}"] = property.Value.ToString();
        }

        var builder = (IConfigurationBuilder)configuration;
        var source = new Microsoft.Extensions.Configuration.Memory.MemoryConfigurationSource { InitialData = values };
        builder.Sources.Insert(0, source);
        return configuration;
    }

    private static string? FindUpwards(string start, string fileName)
    {
        for (var dir = new DirectoryInfo(start); dir is not null; dir = dir.Parent)
        {
            var candidate = Path.Combine(dir.FullName, fileName);
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        return null;
    }
}
