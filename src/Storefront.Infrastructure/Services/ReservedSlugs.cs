using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;

namespace Storefront.Infrastructure.Services;

/// <summary>docs/reserved-slugs.txt (path from Storefront:ReservedSlugsFile, or found from the app folder) plus the brand's short name.</summary>
internal sealed class ReservedSlugs : IReservedSlugs
{
    public ReservedSlugs(IOptions<BrandOptions> brand, IOptions<StorefrontOptions> options)
    {
        var path = options.Value.ReservedSlugsFile
            ?? RepoFiles.Find(Path.Combine("docs", "reserved-slugs.txt"), AppContext.BaseDirectory, Directory.GetCurrentDirectory());
        var slugs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (path is not null && File.Exists(path))
        {
            foreach (var line in File.ReadAllLines(path))
            {
                var value = line.Trim();
                if (value.Length > 0 && !value.StartsWith('#'))
                {
                    slugs.Add(value.ToLowerInvariant());
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(brand.Value.BrandShortName))
        {
            slugs.Add(brand.Value.BrandShortName.ToLowerInvariant());
        }

        All = slugs;
    }

    public IReadOnlySet<string> All { get; }
}
