using Storefront.Domain.Catalog;

namespace Storefront.Application.Catalog;

public sealed record CategoryDto(Guid Id, string Name, int SortOrder, int ProductCount)
{
    public static CategoryDto From(Category c, int productCount) => new(c.Id, c.Name, c.SortOrder, productCount);
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
    DateTimeOffset UpdatedAt)
{
    public static ProductDto From(Product p) =>
        new(p.Id, p.CategoryId, p.Name, p.Description, p.Price, p.ImageUrl, p.Label, p.IsAvailable, p.IsFeatured, p.SortOrder, p.UpdatedAt);
}

internal static class CatalogErrors
{
    public static readonly Common.Error CategoryNotFound = Common.Error.NotFound("category.notFound", "Category not found.");
    public static readonly Common.Error ProductNotFound = Common.Error.NotFound("product.notFound", "Product not found.");
    public static readonly Common.Error NoBusiness = Common.Error.Unauthorized("auth.required", "Log in to continue.");
}
