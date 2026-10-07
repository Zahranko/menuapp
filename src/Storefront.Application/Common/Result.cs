using Storefront.Domain.Common;

namespace Storefront.Application.Common;

public enum ErrorType
{
    Validation,
    NotFound,
    Conflict,
    Unauthorized,
    Forbidden,
}

/// <summary>An expected failure. <see cref="Code"/> is stable for clients; <see cref="Fields"/> maps input names to messages.</summary>
public sealed record Error(string Code, string Message, ErrorType Type, IReadOnlyDictionary<string, string[]>? Fields = null)
{
    public static Error Validation(string code, string message, string? field = null) =>
        new(code, message, ErrorType.Validation, field is null ? null : new Dictionary<string, string[]> { [field] = [message] });

    public static Error Validation(IReadOnlyDictionary<string, string[]> fields) =>
        new("validation", "Some fields need attention.", ErrorType.Validation, fields);

    public static Error NotFound(string code, string message) => new(code, message, ErrorType.NotFound);

    public static Error Conflict(string code, string message, string? field = null) =>
        new(code, message, ErrorType.Conflict, field is null ? null : new Dictionary<string, string[]> { [field] = [message] });

    public static Error Unauthorized(string code, string message) => new(code, message, ErrorType.Unauthorized);

    public static Error Forbidden(string code, string message) => new(code, message, ErrorType.Forbidden);

    public static Error FromDomain(DomainException ex) => Validation(ex.Code, ex.Message, ex.Field);
}

public class Result
{
    protected Result(Error? error) => Error = error;

    public Error? Error { get; }

    public bool IsSuccess => Error is null;

    public static Result Success() => new(null);

    public static Result Failure(Error error) => new(error);

    public static implicit operator Result(Error error) => Failure(error);
}

public sealed class Result<T> : Result
{
    private readonly T? _value;

    private Result(T value) : base(null) => _value = value;

    private Result(Error error) : base(error)
    {
    }

    public T Value => IsSuccess ? _value! : throw new InvalidOperationException($"Result failed: {Error!.Code}");

    public static Result<T> Success(T value) => new(value);

    public static new Result<T> Failure(Error error) => new(error);

    public static implicit operator Result<T>(T value) => Success(value);

    public static implicit operator Result<T>(Error error) => Failure(error);
}
