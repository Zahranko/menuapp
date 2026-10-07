using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Domain.Accounts;

namespace Storefront.Application.Accounts;

public sealed record RefreshSession(string RefreshToken);

public sealed class RefreshHandler(
    IRefreshTokenRepository refreshTokens,
    ITokenService tokens,
    IIdentityService identity,
    IBusinessRepository businesses,
    SessionIssuer sessions,
    IUnitOfWork uow,
    IClock clock)
{
    public static readonly Error Invalid = Error.Unauthorized("auth.refresh", "Your session has ended. Log in again.");

    public async Task<Result<AuthResponse>> Handle(RefreshSession cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.RefreshToken))
        {
            return Invalid;
        }

        var token = await refreshTokens.FindByHashAsync(tokens.Hash(cmd.RefreshToken), ct);
        if (token is null)
        {
            return Invalid;
        }

        var now = clock.UtcNow;
        if (token.RevokedAt is not null)
        {
            // A rotated token came back: someone else has a copy. End every session that grew from it.
            await RevokeChainAsync(token, now, ct);
            return Invalid;
        }

        if (!token.IsActive(now))
        {
            return Invalid;
        }

        var user = await identity.FindByIdAsync(token.UserId, ct);
        var business = user is null ? null : await businesses.GetByOwnerAsync(user.Id, ct);
        if (user is null || business is null)
        {
            return Invalid;
        }

        return await sessions.IssueAsync(user, business, null, ct, replacing: token);
    }

    private async Task RevokeChainAsync(RefreshToken reused, DateTimeOffset now, CancellationToken ct)
    {
        var byId = (await refreshTokens.ListForUserAsync(reused.UserId, ct)).ToDictionary(t => t.Id);
        var next = reused.ReplacedById;
        while (next is { } id && byId.TryGetValue(id, out var descendant))
        {
            descendant.Revoke(now);
            next = descendant.ReplacedById;
        }

        await uow.SaveChangesAsync(ct);
    }
}

public sealed record Logout(string RefreshToken);

public sealed class LogoutHandler(IRefreshTokenRepository refreshTokens, ITokenService tokens, IUnitOfWork uow, IClock clock, ICurrentUser currentUser)
{
    public async Task Handle(Logout cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.RefreshToken))
        {
            return;
        }

        var token = await refreshTokens.FindByHashAsync(tokens.Hash(cmd.RefreshToken), ct);
        if (token is not null && token.UserId == currentUser.UserId)
        {
            token.Revoke(clock.UtcNow);
            await uow.SaveChangesAsync(ct);
        }
    }
}
