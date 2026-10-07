using System.Text.RegularExpressions;

namespace Storefront.Domain.Common;

/// <summary>A phone number in E.164 form, for example +962790000000.</summary>
public sealed partial record PhoneNumber
{
    private PhoneNumber(string value) => Value = value;

    public string Value { get; }

    public static PhoneNumber Create(string? input, string field = "phone")
    {
        var digits = Separators().Replace((input ?? "").Trim(), "");
        if (digits.StartsWith("00", StringComparison.Ordinal))
        {
            digits = "+" + digits[2..];
        }

        if (!E164().IsMatch(digits))
        {
            throw new DomainException("phone.invalid", "Enter the number with its country code, like +962 79 000 0000.", field);
        }

        return new PhoneNumber(digits);
    }

    public override string ToString() => Value;

    [GeneratedRegex("[\\s\\-().]")]
    private static partial Regex Separators();

    [GeneratedRegex("^\\+[1-9][0-9]{6,14}$")]
    private static partial Regex E164();
}
