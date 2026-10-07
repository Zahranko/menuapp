using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Storefront.Domain.Common;

/// <summary>The site address part after the domain: lowercase a-z and 0-9, 3 to 30 characters, not reserved.</summary>
public sealed partial record Slug
{
    public const int MinLength = 3;
    public const int MaxLength = 30;

    private Slug(string value) => Value = value;

    public string Value { get; }

    public static Slug Create(string? value, IReadOnlySet<string> reserved)
    {
        var candidate = (value ?? "").Trim().ToLowerInvariant();
        if (candidate.Length is < MinLength or > MaxLength || !Allowed().IsMatch(candidate))
        {
            throw new DomainException("slug.invalid", "Use 3 to 30 lowercase letters and numbers.", "slug");
        }

        if (reserved.Contains(candidate))
        {
            throw new DomainException("slug.reserved", "This address is not available.", "slug");
        }

        return new Slug(candidate);
    }

    /// <summary>Rebuilds a slug read from storage without checking the reserved list again.</summary>
    public static Slug FromStorage(string value) => new(value);

    /// <summary>"Vanilla Menu" → "vanillamenu". Drops accents and anything that is not a-z or 0-9; may still be too short.</summary>
    public static string FromBusinessName(string name)
    {
        var decomposed = name.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            var lower = char.ToLowerInvariant(c);
            if (lower is >= 'a' and <= 'z' or >= '0' and <= '9')
            {
                builder.Append(lower);
            }
        }

        var slug = builder.ToString();
        return slug.Length > MaxLength ? slug[..MaxLength] : slug;
    }

    public override string ToString() => Value;

    [GeneratedRegex("^[a-z0-9]+$")]
    private static partial Regex Allowed();
}
