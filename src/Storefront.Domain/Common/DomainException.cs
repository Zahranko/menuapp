namespace Storefront.Domain.Common;

/// <summary>A broken business rule. <see cref="Code"/> is stable and machine-readable; <see cref="Field"/> names the input at fault.</summary>
public sealed class DomainException(string code, string message, string? field = null) : Exception(message)
{
    public string Code { get; } = code;
    public string? Field { get; } = field;
}

internal static class Guard
{
    public static string Text(string? value, string field, int min, int max, string code)
    {
        var trimmed = (value ?? "").Trim();
        if (trimmed.Length < min || trimmed.Length > max)
        {
            var message = min > 0
                ? $"{field} must be {min} to {max} characters."
                : $"{field} can be at most {max} characters.";
            throw new DomainException(code, message, field);
        }

        return trimmed;
    }

    public static string? OptionalText(string? value, string field, int max, string code)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrEmpty(trimmed))
        {
            return null;
        }

        return Text(trimmed, field, 0, max, code);
    }
}
