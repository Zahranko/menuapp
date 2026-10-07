namespace Storefront.Infrastructure.Services;

/// <summary>Finds files shared with the Next.js app (reserved slugs, template registry) by walking up from a start folder.</summary>
public static class RepoFiles
{
    public static string? Find(string relativePath, params string?[] startFolders)
    {
        foreach (var start in startFolders.Where(s => !string.IsNullOrEmpty(s)))
        {
            for (var dir = new DirectoryInfo(start!); dir is not null; dir = dir.Parent)
            {
                var candidate = Path.Combine(dir.FullName, relativePath);
                if (File.Exists(candidate))
                {
                    return candidate;
                }
            }
        }

        return null;
    }
}
