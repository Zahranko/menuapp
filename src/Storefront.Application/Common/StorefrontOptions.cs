namespace Storefront.Application.Common;

/// <summary>App settings under the "Storefront" section.</summary>
public sealed class StorefrontOptions
{
    public const string SectionName = "Storefront";

    /// <summary>Path to docs/reserved-slugs.txt. Found automatically in the repo when empty.</summary>
    public string? ReservedSlugsFile { get; set; }

    /// <summary>Path to apps/sites/templates/registry.json. Found automatically in the repo when empty.</summary>
    public string? TemplateRegistryFile { get; set; }

    /// <summary>Runs the development seeder (plans, templates, sample business) at startup.</summary>
    public bool SeedSampleData { get; set; }

    /// <summary>Where owners' sites are served, like https://example.com. Empty means https://{brand domain}.</summary>
    public string? SitesBaseUrl { get; set; }
}
