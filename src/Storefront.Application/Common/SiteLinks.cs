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
}
