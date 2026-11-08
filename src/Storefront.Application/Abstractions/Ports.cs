namespace Storefront.Application.Abstractions;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}

/// <summary>The signed-in owner. <see cref="BusinessId"/> comes from the token's "biz" claim, never from the request body.</summary>
public interface ICurrentUser
{
    Guid? UserId { get; }

    Guid? BusinessId { get; }

    bool IsStaff { get; }
}

public interface IUnitOfWork
{
    Task SaveChangesAsync(CancellationToken ct);

    /// <summary>Runs <paramref name="work"/> in a database transaction, committed only when the result succeeds.</summary>
    Task<TResult> InTransactionAsync<TResult>(Func<Task<TResult>> work, CancellationToken ct)
        where TResult : Common.Result;
}

/// <summary>Queues a message that a background dispatcher delivers after the transaction commits.</summary>
public interface IOutbox
{
    void Enqueue(string type, object payload);
}

/// <summary>Records who changed what, for support.</summary>
public interface IAuditLog
{
    void Record(string action, string entityType, string? entityId);
}

public sealed record StoredFile(string Key, string Url);

public sealed record OptimizedImage(byte[] Bytes, string ContentType, int Width, int Height);

/// <summary>Turns an uploaded photo into a web-ready one: upright, no larger than a set size, compressed, without camera metadata.</summary>
public interface IImageOptimizer
{
    Common.Result<OptimizedImage> Optimize(ReadOnlyMemory<byte> image, int maxSide, long maxBytes);
}

/// <summary>Public file storage (S3-compatible in production, local disk in development).</summary>
public interface IFileStorage
{
    Task<StoredFile> SaveAsync(string key, Stream content, string contentType, CancellationToken ct);
}

/// <summary>Tells the Next.js app to drop cached pages for these cache tags (for example "site:vanillamenu").</summary>
public interface ISiteRevalidator
{
    Task RevalidateAsync(IReadOnlyCollection<string> tags, CancellationToken ct);
}

/// <summary>Signed, short-lived tokens that let the editor preview a draft site.</summary>
public interface IPreviewTokens
{
    string Create(Guid businessId, DateTimeOffset expiresAt);

    /// <summary>The business id, or null when the token is forged or expired.</summary>
    Guid? Read(string token, DateTimeOffset now);
}

/// <summary>What happened when a plan change was sent to the payment provider.</summary>
/// <param name="CheckoutUrl">Set when the owner must pay on the provider's page first; the change applies from its webhook.</param>
public sealed record PlanChangeResult(string? CheckoutUrl, string? ProviderRef, DateTimeOffset? CurrentPeriodEnd);

/// <summary>
/// The payment provider (decisions D5 and D8 are open). Infrastructure has a fake that applies changes at once.
/// A real adapter also needs a webhook endpoint that updates the subscription.
/// </summary>
public interface IPaymentProvider
{
    string Name { get; }

    Task<PlanChangeResult> ChangePlanAsync(Guid businessId, string planCode, CancellationToken ct);
}
