using System.Text.RegularExpressions;
using Storefront.Domain.Common;

namespace Storefront.Domain.Businesses;

/// <summary>
/// The business's social media accounts as owners type them: a username (with or without @) or a link to the profile.
/// Each one is stored as the bare username (Facebook: the page name, or "profile.php?id=…" for a page without one),
/// and the public site builds the link (instagram.com/name, facebook.com/name, tiktok.com/@name, snapchat.com/add/name).
/// </summary>
public static partial class SocialAccounts
{
    public const int InstagramMax = 30;
    public const int FacebookMax = 100;
    public const int TikTokMax = 24;
    public const int SnapchatMax = 15;

    public const string InstagramMessage = "Enter your Instagram username, like vanillamenu.";
    public const string FacebookMessage = "Enter your Facebook page name or link, like facebook.com/vanillamenu.";
    public const string TikTokMessage = "Enter your TikTok username, like @vanillamenu.";
    public const string SnapchatMessage = "Enter your Snapchat username, like vanillamenu.";

    /// <summary>The Instagram username, or null when empty. Throws when it is not a valid username or profile link.</summary>
    public static string? Instagram(string? input) =>
        Normalize(input, ["instagram.com", "instagr.am"], "", InstagramName(), "business.instagram", InstagramMessage, "instagram");

    public static string? Facebook(string? input)
    {
        var value = (input ?? "").Trim();
        if (value.Length == 0)
        {
            return null;
        }

        // A page without a username has a numeric profile link; keep it as it is.
        var profile = FacebookProfile().Match(value);
        if (profile.Success)
        {
            return $"profile.php?id={profile.Groups[1].Value}";
        }

        return Normalize(value, ["facebook.com", "fb.com", "fb.me"], "", FacebookName(), "business.facebook", FacebookMessage, "facebook");
    }

    public static string? TikTok(string? input) =>
        Normalize(input, ["tiktok.com"], "", TikTokName(), "business.tiktok", TikTokMessage, "tikTok");

    public static string? Snapchat(string? input) =>
        Normalize(input, ["snapchat.com"], "add/", SnapchatName(), "business.snapchat", SnapchatMessage, "snapchat");

    /// <summary>True when <paramref name="normalize"/> accepts the input (empty counts as valid).</summary>
    public static bool IsValid(Func<string?, string?> normalize, string? input)
    {
        try
        {
            normalize(input);
            return true;
        }
        catch (DomainException)
        {
            return false;
        }
    }

    /// <summary>
    /// Strips a profile link down to its username: "https://www.tiktok.com/@name?lang=en" → "name". A leading @ is dropped too.
    /// <paramref name="pathPrefix"/> is a path segment before the username in links (Snapchat's "add/"), optional.
    /// </summary>
    private static string? Normalize(string? input, string[] hosts, string pathPrefix, Regex name, string code, string message, string field)
    {
        var value = (input ?? "").Trim();
        if (value.Length == 0)
        {
            return null;
        }

        var link = Link().Match(value);
        if (link.Success)
        {
            var host = link.Groups["host"].Value.ToLowerInvariant();
            if (!hosts.Any(h => host == h || host.EndsWith("." + h, StringComparison.Ordinal)))
            {
                throw new DomainException(code, message, field);
            }

            value = link.Groups["path"].Value;
            if (pathPrefix.Length > 0 && value.StartsWith(pathPrefix, StringComparison.OrdinalIgnoreCase))
            {
                value = value[pathPrefix.Length..];
            }

            value = value.Split('/', '?', '#')[0];
        }

        value = value.TrimStart('@');
        if (!name.IsMatch(value))
        {
            throw new DomainException(code, message, field);
        }

        return value;
    }

    [GeneratedRegex(@"^(?:https?://)?(?<host>(?:[a-z0-9-]+\.)*(?:instagram\.com|instagr\.am|facebook\.com|fb\.com|fb\.me|tiktok\.com|snapchat\.com|[a-z0-9-]+\.[a-z]{2,}))/(?<path>.*)$", RegexOptions.IgnoreCase)]
    private static partial Regex Link();

    [GeneratedRegex(@"^(?:https?://)?(?:[a-z0-9-]+\.)*(?:facebook\.com|fb\.com)/profile\.php\?(?:.*&)?id=([0-9]{5,20})(?:[&#].*)?$", RegexOptions.IgnoreCase)]
    private static partial Regex FacebookProfile();

    [GeneratedRegex("^[A-Za-z0-9._]{1,30}$")]
    private static partial Regex InstagramName();

    [GeneratedRegex("^[A-Za-z0-9.-]{2,100}$")]
    private static partial Regex FacebookName();

    [GeneratedRegex("^[A-Za-z0-9._]{2,24}$")]
    private static partial Regex TikTokName();

    [GeneratedRegex("^[A-Za-z][A-Za-z0-9._-]{2,14}$")]
    private static partial Regex SnapchatName();
}
