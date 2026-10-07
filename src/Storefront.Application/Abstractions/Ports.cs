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
