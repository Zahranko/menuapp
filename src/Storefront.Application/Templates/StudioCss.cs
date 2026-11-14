using System.Text.RegularExpressions;

namespace Storefront.Application.Templates;

/// <summary>
/// Checks the style sheet the AI design studio writes for a Studio site (a template field of type "css") before it is saved.
/// The site cleans and scopes the sheet again when it draws the page (apps/sites/lib/studio-css.ts); this check refuses the
/// sheets that are clearly unsafe so they never reach the database: escapes or "&lt;", @import and other loading at-rules,
/// scripts and old browser tricks, addresses outside the page, and elements pinned over the page.
/// </summary>
public static partial class StudioCss
{
    public const int DefaultMax = 20_000;

    /// <summary>Why the sheet can't be saved, or null when it can. An empty sheet is fine.</summary>
    public static string? Check(string css, int? maxLength)
    {
        var max = maxLength ?? DefaultMax;
        if (css.Length > max)
        {
            return $"Use up to {max} characters.";
        }

        if (css.Contains('\\') || css.Contains('<'))
        {
            return "The style can't use escapes or \"<\".";
        }

        if (LoadingAtRules().IsMatch(css))
        {
            return "The style can't load other files (@import, @font-face, @namespace).";
        }

        if (Scripts().IsMatch(css))
        {
            return "The style can't run code.";
        }

        foreach (Match url in Urls().Matches(css))
        {
            if (!InlinePicture().IsMatch(url.Groups[1].Value.Trim().Trim('"', '\'').Trim()))
            {
                return "The style can only use pictures written into it (data:image/...).";
            }
        }

        if (ImageSet().IsMatch(css))
        {
            return "The style can't load pictures by address.";
        }

        return FixedPosition().IsMatch(css) ? "The style can't pin parts over the page (position: fixed)." : null;
    }

    [GeneratedRegex(@"@(import|font-face|namespace|charset|document|-moz-document)\b", RegexOptions.IgnoreCase)]
    private static partial Regex LoadingAtRules();

    [GeneratedRegex(@"expression\s*\(|javascript:|vbscript:|\bbehavior\s*:|-moz-binding|-ms-behavior", RegexOptions.IgnoreCase)]
    private static partial Regex Scripts();

    [GeneratedRegex(@"url\(\s*([^)]*)\)", RegexOptions.IgnoreCase)]
    private static partial Regex Urls();

    [GeneratedRegex(@"^data:image/(png|jpe?g|gif|webp|svg\+xml)[;,]", RegexOptions.IgnoreCase)]
    private static partial Regex InlinePicture();

    [GeneratedRegex(@"\b(image-set|src)\s*\(", RegexOptions.IgnoreCase)]
    private static partial Regex ImageSet();

    [GeneratedRegex(@"position\s*:\s*fixed", RegexOptions.IgnoreCase)]
    private static partial Regex FixedPosition();
}
