using Storefront.Application.Common;

namespace Storefront.Application.Abstractions;

public sealed record UserAccount(Guid Id, string Email, string? Phone);

public enum PasswordCheck
{
    Ok,
    Wrong,
    LockedOut,
}

/// <summary>User accounts and passwords (ASP.NET Core Identity in Infrastructure).</summary>
public interface IIdentityService
{
    /// <summary>Fails with field errors for a taken email or phone, or a weak password.</summary>
    Task<Result<UserAccount>> CreateUserAsync(string email, string phone, string password, CancellationToken ct);

    /// <summary>Finds a user by email (contains "@") or by phone number in E.164 form.</summary>
    Task<UserAccount?> FindByLoginAsync(string login, CancellationToken ct);

    Task<UserAccount?> FindByIdAsync(Guid userId, CancellationToken ct);

    /// <summary>Counts failures and locks the account after too many.</summary>
    Task<PasswordCheck> CheckPasswordAsync(Guid userId, string password, CancellationToken ct);

    Task<string> CreatePasswordResetTokenAsync(Guid userId, CancellationToken ct);

    Task<Result> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken ct);
}

public sealed record AccessToken(string Token, DateTimeOffset ExpiresAt);

public sealed record NewRefreshToken(string Token, string Hash, DateTimeOffset ExpiresAt);

public interface ITokenService
{
    AccessToken CreateAccessToken(Guid userId, Guid businessId, string email);

    TimeSpan RefreshTokenLifetime { get; }

    /// <summary>A random token for the client; only its hash is stored.</summary>
    string NewRefreshToken();

    string Hash(string refreshToken);
}

public interface IRefreshTokenRepository
{
    Task<Domain.Accounts.RefreshToken?> FindByHashAsync(string hash, CancellationToken ct);

    Task<IReadOnlyList<Domain.Accounts.RefreshToken>> ListForUserAsync(Guid userId, CancellationToken ct);

    void Add(Domain.Accounts.RefreshToken token);
}

/// <summary>Ends every session of one user, for example after a password reset.</summary>
public static class RefreshTokenRepositoryExtensions
{
    public static async Task<int> RevokeAllAsync(this IRefreshTokenRepository refreshTokens, Guid userId, DateTimeOffset now, CancellationToken ct)
    {
        var active = (await refreshTokens.ListForUserAsync(userId, ct)).Where(t => t.IsActive(now)).ToList();
        foreach (var token in active)
        {
            token.Revoke(now);
        }

        return active.Count;
    }
}

public sealed record EmailMessage(string To, string Subject, string Text, string Html);

public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken ct);
}
