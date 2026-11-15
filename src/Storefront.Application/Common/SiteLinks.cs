using Microsoft.Extensions.Options;

namespace Storefront.Application.Common;

/// <summary>
/// Public addresses of owners' sites. They live at the brand domain unless Storefront:SitesBaseUrl points
/// somewhere else (for example a test host before the brand domain is set up).
/// </summary>
public sealed class SiteLinks(IOptions<BrandOptions> brand, IOptions<StorefrontOptions> options)
{
    public string BaseUrl => string.IsNullOrWhiteSpace(options.Value.SitesBaseUrl)
        ? $"https://{brand.Value.Domain}"
        : options.Value.SitesBaseUrl.TrimEnd('/');

    public string Site(string slug) => $"{BaseUrl}/{slug}";

    public string Preview(string token) => $"{BaseUrl}/_preview/{token}";

    /// <summary>A community template's share page.</summary>
    public string Community(string code) => $"{BaseUrl}/community/{code}";

    /// <summary>A community template drawn on a sample menu, for the app's preview.</summary>
    public string CommunityPreview(string code) => $"{BaseUrl}/community/{code}/preview";

    /// <summary>A publisher's page in the community gallery.</summary>
    public string Publisher(string username) => $"{BaseUrl}/community/u/{username}";
}
