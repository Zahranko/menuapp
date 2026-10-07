namespace Storefront.Domain.Catalog;

/// <summary>The fixed list of badges a product can show.</summary>
public static class ProductLabel
{
    public const string Signature = "Signature";
    public const string New = "New";
    public const string BestSeller = "Best seller";
    public const string Vegan = "Vegan";
    public const string Spicy = "Spicy";

    public static readonly IReadOnlyList<string> All = [Signature, New, BestSeller, Vegan, Spicy];

    public static bool IsValid(string? label) => label is null || All.Contains(label);
}
