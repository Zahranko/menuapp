using System.Text.RegularExpressions;

namespace Storefront.Domain.Common;

/// <summary>A registrable host name such as vanillamenu.com, stored lowercase without scheme, path or trailing dot.</summary>
public sealed partial record DomainName
{
    private DomainName(string value) => Value = value;

    public string Value { get; }

    public static DomainName Create(string? input)
    {
        var value = (input ?? "").Trim().ToLowerInvariant();
        if (value.StartsWith("https://", StringComparison.Ordinal)) value = value[8..];
        else if (value.StartsWith("http://", StringComparison.Ordinal)) value = value[7..];
        value = value.TrimEnd('/').TrimEnd('.');

        if (value.Length is 0 or > 253 || !Pattern().IsMatch(value))
        {
            throw new DomainException("domain.invalid", "Enter a domain like vanillamenu.com, without spaces.", "domain");
        }

        return new DomainName(value);
    }

    public override string ToString() => Value;

    [GeneratedRegex("^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$")]
    private static partial Regex Pattern();
}
