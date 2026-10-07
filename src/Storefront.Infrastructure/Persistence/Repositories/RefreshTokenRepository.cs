using Microsoft.EntityFrameworkCore;
using Storefront.Application.Abstractions;
using Storefront.Domain.Accounts;

namespace Storefront.Infrastructure.Persistence.Repositories;

internal sealed class RefreshTokenRepository(StorefrontDbContext db) : IRefreshTokenRepository
{
    public Task<RefreshToken?> FindByHashAsync(string hash, CancellationToken ct) => db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

    public async Task<IReadOnlyList<RefreshToken>> ListForUserAsync(Guid userId, CancellationToken ct) =>
        await db.RefreshTokens.Where(t => t.UserId == userId).ToListAsync(ct);

    public void Add(RefreshToken token) => db.RefreshTokens.Add(token);
}
