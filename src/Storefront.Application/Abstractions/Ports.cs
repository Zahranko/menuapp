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
