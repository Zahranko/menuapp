namespace Storefront.Domain.Catalog;

/// <summary>
/// The badges a product can show: five fixed ones (sites and the app translate them) and <see cref="Custom"/>,
/// whose text the owner types (<see cref="Product.CustomLabel"/>, and optionally <see cref="Product.CustomLabelAr"/> for Arabic).
/// </summary>
public static class ProductLabel
{
    public const string Signature = "Signature";
    public const string New = "New";
    public const string BestSeller = "Best seller";
    public const string Vegan = "Vegan";
    public const string Spicy = "Spicy";
    public const string Custom = "Custom";

    /// <summary>Longest custom label text, after trimming. Short enough to sit on a badge on a phone.</summary>
    public const int CustomTextMax = 24;

    public static readonly IReadOnlyList<string> All = [Signature, New, BestSeller, Vegan, Spicy, Custom];

    public static bool IsValid(string? label) => label is null || All.Contains(label);

    /// <summary>Trimmed custom text with inner runs of spaces collapsed to one, or null when empty.</summary>
    public static string? NormalizeCustomText(string? text) =>
        string.IsNullOrWhiteSpace(text) ? null : string.Join(' ', text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    /// <summary>Line breaks, tabs and other control characters are not allowed: a badge stays on one line.</summary>
    public static bool HasControlCharacters(string? text) => text is not null && text.Any(char.IsControl);

    /// <summary>True when the custom text (after <see cref="NormalizeCustomText"/>) fits on a badge.</summary>
    public static bool IsValidCustomText(string? text) =>
        !HasControlCharacters(text) && (NormalizeCustomText(text)?.Length ?? 0) <= CustomTextMax;
}
