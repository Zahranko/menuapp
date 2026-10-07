using FluentValidation;
using FluentValidation.Results;

namespace Storefront.Application.Common;

public static class ValidationExtensions
{
    /// <summary>Runs the validator and turns failures into a field-keyed validation error.</summary>
    public static async Task<Error?> CheckAsync<T>(this IValidator<T> validator, T instance, CancellationToken ct)
    {
        var result = await validator.ValidateAsync(instance, ct);
        return result.IsValid ? null : ToError(result);
    }

    public static Error ToError(ValidationResult result) => Error.Validation(
        result.Errors
            .GroupBy(e => Camel(e.PropertyName))
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).Distinct().ToArray()));

    private static string Camel(string name) => string.IsNullOrEmpty(name) ? name : char.ToLowerInvariant(name[0]) + name[1..];
}

public static class Rules
{
    public const string EmailPattern = @"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$";

    /// <summary>At least 8 characters with a number and a capital letter (the prototype's hint).</summary>
    public static IRuleBuilderOptions<T, string> StrongPassword<T>(this IRuleBuilder<T, string> rule) => rule
        .NotEmpty().WithMessage("Enter your password.")
        .MinimumLength(8).WithMessage("Password needs at least 8 characters.")
        .Matches("[0-9]").WithMessage("Add a number to your password.")
        .Matches("[A-Z]").WithMessage("Add a capital letter to your password.")
        .MaximumLength(128).WithMessage("Password can be at most 128 characters.");

    public static IRuleBuilderOptions<T, string> ValidEmail<T>(this IRuleBuilder<T, string> rule) => rule
        .NotEmpty().WithMessage("Enter your email.")
        .MaximumLength(254).WithMessage("Check the email format, like name@business.com.")
        .Matches(EmailPattern).WithMessage("Check the email format, like name@business.com.");
}
