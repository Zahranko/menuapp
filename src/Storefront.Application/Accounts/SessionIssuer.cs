using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Domain.Accounts;
using Storefront.Domain.Businesses;

namespace Storefront.Application.Accounts;

/// <summary>Creates an access token and a new refresh token for a device.</summary>
public sealed class SessionIssuer(ITokenService tokens, IRefreshTokenRepository refreshTokens, IUnitOfWork uow, IClock clock, IOptions<BrandOptions> brand)
{
    public async Task<AuthResponse> IssueAsync(UserAccount user, Business business, string? deviceName, CancellationToken ct, RefreshToken? replacing = null)
    {
        var now = clock.UtcNow;
        var raw = tokens.NewRefreshToken();
        var refresh = RefreshToken.Issue(user.Id, tokens.Hash(raw), deviceName ?? replacing?.DeviceName, now, tokens.RefreshTokenLifetime);
        refreshTokens.Add(refresh);
        replacing?.Revoke(now, refresh.Id);
        await uow.SaveChangesAsync(ct);

        var access = tokens.CreateAccessToken(user.Id, business.Id, user.Email);
        return new AuthResponse(access.Token, access.ExpiresAt, raw, refresh.ExpiresAt, BusinessDto.From(business, brand.Value.Domain));
    }
}
