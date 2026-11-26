using Storefront.Domain.Catalog;

namespace Storefront.Application.Catalog;

/// <summary>A category. <see cref="ParentId"/> is the main category it sits under, or null for a main category (one level deep).</summary>
public sealed record CategoryDto(Guid Id, string Name, Guid? ParentId, int SortOrder, int ProductCount)
{
    public static CategoryDto From(Category c, int productCount) => new(c.Id, c.Name, c.ParentId, c.SortOrder, productCount);
}

public sealed record ProductDto(
    Guid Id,
    Guid CategoryId,
    string Name,
    string? Description,
    decimal Price,
    string? ImageUrl,
    string? Label,
    bool IsAvailable,
    bool IsFeatured,
    int SortOrder,
    DateTimeOffset UpdatedAt,
    string? CustomLabel,
    string? CustomLabelAr)
{
    public static ProductDto From(Product p) =>
        new(p.Id, p.CategoryId, p.Name, p.Description, p.Price, p.ImageUrl, p.Label, p.IsAvailable, p.IsFeatured, p.SortOrder, p.UpdatedAt,
            p.CustomLabel, p.CustomLabelAr);
}

/// <summary>
/// The most a business can have. Far above any café or shop menu, but it keeps the public site (one JSON read with
/// every product) small and fast, and stops a script from filling the database through a leaked token.
/// </summary>
public static class CatalogLimits
{
    public const int MaxCategories = 200;
    public const int MaxProducts = 2000;

    public static Common.Error TooManyCategories(string field) =>
        Common.Error.Validation("catalog.categoryLimit", "You can have up to 200 categories. Delete some first.", field);

    public static Common.Error TooManyProducts(string field) =>
        Common.Error.Validation("catalog.productLimit", "You can have up to 2000 products. Delete some first.", field);
}

internal static class CatalogErrors
{
    public static readonly Common.Error CategoryNotFound = Common.Error.NotFound("category.notFound", "Category not found.");
    public static readonly Common.Error ProductNotFound = Common.Error.NotFound("product.notFound", "Product not found.");
    public static readonly Common.Error NoBusiness = Common.Error.Unauthorized("auth.required", "Log in to continue.");
}
