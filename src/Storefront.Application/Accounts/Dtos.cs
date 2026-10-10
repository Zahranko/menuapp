using Storefront.Domain.Businesses;

namespace Storefront.Application.Accounts;

public sealed record BusinessDto(
    Guid Id,
    string Name,
    string Slug,
    string SiteUrl,
    string? WhatsApp,
    string? Email,
    string? Address,
    string? Instagram,
    string Locale,
    string CurrencyCode,
    string TimeZone)
{
    public static BusinessDto From(Business b, Common.SiteLinks links) => new(
        b.Id, b.Name, b.Slug.Value, links.Site(b.Slug.Value),
        b.WhatsApp?.Value, b.Email, b.Address, b.Instagram, b.Locale, b.CurrencyCode, b.TimeZone);
}

public sealed record AuthResponse(string AccessToken, DateTimeOffset AccessTokenExpiresAt, string RefreshToken, DateTimeOffset RefreshTokenExpiresAt, BusinessDto Business);

public sealed record MeResponse(Guid UserId, string Email, string? Phone, BusinessDto Business);
