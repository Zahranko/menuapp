using FluentValidation;
using Storefront.Application.Abstractions;
using Storefront.Application.Catalog.Categories;
using Storefront.Application.Common;
using Storefront.Domain.Businesses;
using Storefront.Domain.Catalog;
using Storefront.Domain.Common;

namespace Storefront.Application.Catalog.Products;

public sealed class ListProductsHandler(ICatalogRepository catalog)
{
    public async Task<IReadOnlyList<ProductDto>> Handle(Guid? categoryId, string? q, CancellationToken ct) =>
        (await catalog.SearchProductsAsync(categoryId, q, ct)).Select(ProductDto.From).ToList();
}

public sealed class GetProductHandler(ICatalogRepository catalog)
{
    public async Task<Result<ProductDto>> Handle(Guid id, CancellationToken ct) =>
        await catalog.GetProductAsync(id, ct) is { } product ? ProductDto.From(product) : CatalogErrors.ProductNotFound;
}

public sealed record SaveProduct(
    Guid CategoryId,
    string Name,
    string? Description,
    decimal? Price,
    string? Label,
    bool IsAvailable = true,
    bool IsFeatured = false,
    string? ImageUrl = null);

public sealed class SaveProductValidator : AbstractValidator<SaveProduct>
{
    public SaveProductValidator()
    {
        RuleFor(x => x.Name).Cascade(CascadeMode.Stop)
            .Must(n => !string.IsNullOrWhiteSpace(n)).WithMessage("Enter a product name.")
            .Must(n => n.Trim().Length <= Product.NameMax).WithMessage("Product names can be up to 60 characters.");
        RuleFor(x => x.Description).MaximumLength(Product.DescriptionMax).WithMessage("Descriptions can be up to 140 characters.");
        RuleFor(x => x.Price).Cascade(CascadeMode.Stop)
            .NotNull().WithMessage("Enter a price.")
            .GreaterThanOrEqualTo(0).WithMessage("Use numbers only, like 3.50.")
            .LessThanOrEqualTo(Product.PriceMax).WithMessage("That price is too high.");
        RuleFor(x => x.Label).Must(ProductLabel.IsValid).WithMessage($"Choose a label: {string.Join(", ", ProductLabel.All)}.");
        RuleFor(x => x.CategoryId).NotEmpty().WithMessage("Choose a category.");
        RuleFor(x => x.ImageUrl).MaximumLength(2048);
    }
}

/// <summary>Shared checks for create and update: the category is this business's, the image was uploaded by it, and the price fits the currency.</summary>
public sealed class ProductInputChecker(ICatalogRepository catalog, IMediaRepository media, IBusinessRepository businesses, ICurrentUser user)
{
    public async Task<(Error? Error, Business? Business)> CheckAsync(SaveProduct cmd, CancellationToken ct)
    {
        var business = user.BusinessId is { } id ? await businesses.GetAsync(id, ct) : null;
        if (business is null)
        {
            return (CatalogErrors.NoBusiness, null);
        }

        if (await catalog.GetCategoryAsync(cmd.CategoryId, ct) is null)
        {
            return (Error.Validation("product.category", "Choose a category.", "categoryId"), business);
        }

        if (decimal.Round(cmd.Price!.Value, Money.DecimalsFor(business.CurrencyCode)) != cmd.Price.Value)
        {
            return (Error.Validation("product.price", "Use numbers only, like 3.50.", "price"), business);
        }

        if (!string.IsNullOrWhiteSpace(cmd.ImageUrl) && !await media.UrlBelongsToBusinessAsync(business.Id, cmd.ImageUrl, ct))
        {
            return (Error.Validation("product.image", "Upload the photo again.", "imageUrl"), business);
        }

        return (null, business);
    }
}

public sealed class CreateProductHandler(IValidator<SaveProduct> validator, ProductInputChecker checker, ICatalogRepository catalog, IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result<ProductDto>> Handle(SaveProduct cmd, CancellationToken ct)
    {
        if (await validator.CheckAsync(cmd, ct) is { } invalid)
        {
            return invalid;
        }

        var (error, business) = await checker.CheckAsync(cmd, ct);
        if (error is not null)
        {
            return error;
        }

        try
        {
            var product = Product.Create(business!.Id, cmd.CategoryId, Details(cmd), business.CurrencyCode,
                await catalog.NextProductSortOrderAsync(cmd.CategoryId, ct), clock.UtcNow);
            catalog.Add(product);
            audit.Record("create", nameof(Product), product.Id.ToString());
            await uow.SaveChangesAsync(ct);
            return ProductDto.From(product);
        }
        catch (DomainException ex)
        {
            return Error.FromDomain(ex);
        }
    }

    internal static ProductDetails Details(SaveProduct cmd) =>
        new(cmd.Name, cmd.Description, cmd.Price!.Value, cmd.Label, cmd.IsAvailable, cmd.IsFeatured, string.IsNullOrWhiteSpace(cmd.ImageUrl) ? null : cmd.ImageUrl);
}

public sealed class UpdateProductHandler(IValidator<SaveProduct> validator, ProductInputChecker checker, ICatalogRepository catalog, IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result<ProductDto>> Handle(Guid id, SaveProduct cmd, CancellationToken ct)
    {
        if (await validator.CheckAsync(cmd, ct) is { } invalid)
        {
            return invalid;
        }

        var product = await catalog.GetProductAsync(id, ct);
        if (product is null)
        {
            return CatalogErrors.ProductNotFound;
        }

        var (error, business) = await checker.CheckAsync(cmd, ct);
        if (error is not null)
        {
            return error;
        }

        try
        {
            var movedCategory = product.CategoryId != cmd.CategoryId;
            product.Update(cmd.CategoryId, CreateProductHandler.Details(cmd), business!.CurrencyCode, clock.UtcNow);
            if (movedCategory)
            {
                product.MoveTo(await catalog.NextProductSortOrderAsync(cmd.CategoryId, ct), clock.UtcNow);
            }

            audit.Record("update", nameof(Product), id.ToString());
            await uow.SaveChangesAsync(ct);
            return ProductDto.From(product);
        }
        catch (DomainException ex)
        {
            return Error.FromDomain(ex);
        }
    }
}

public sealed class DeleteProductHandler(ICatalogRepository catalog, IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result> Handle(Guid id, CancellationToken ct)
    {
        var product = await catalog.GetProductAsync(id, ct);
        if (product is null)
        {
            return CatalogErrors.ProductNotFound;
        }

        product.MarkDeleted(clock.UtcNow);
        catalog.Remove(product);
        audit.Record("delete", nameof(Product), id.ToString());
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}

public sealed record SetAvailability(bool IsAvailable);

public sealed class SetAvailabilityHandler(ICatalogRepository catalog, IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result<ProductDto>> Handle(Guid id, SetAvailability cmd, CancellationToken ct)
    {
        var product = await catalog.GetProductAsync(id, ct);
        if (product is null)
        {
            return CatalogErrors.ProductNotFound;
        }

        product.SetAvailability(cmd.IsAvailable, clock.UtcNow);
        audit.Record(cmd.IsAvailable ? "available" : "sold-out", nameof(Product), id.ToString());
        await uow.SaveChangesAsync(ct);
        return ProductDto.From(product);
    }
}

public sealed record ReorderProducts(Guid CategoryId, IReadOnlyList<Guid> Ids);

public sealed class ReorderProductsHandler(ICatalogRepository catalog, IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result<IReadOnlyList<ProductDto>>> Handle(ReorderProducts cmd, CancellationToken ct)
    {
        if (await catalog.GetCategoryAsync(cmd.CategoryId, ct) is null)
        {
            return CatalogErrors.CategoryNotFound;
        }

        var products = await catalog.ListProductsAsync(cmd.CategoryId, ct);
        if (!Ordering.IsPermutation(cmd.Ids, products.Select(p => p.Id)))
        {
            return Ordering.Mismatch;
        }

        var now = clock.UtcNow;
        var byId = products.ToDictionary(p => p.Id);
        for (var i = 0; i < cmd.Ids.Count; i++)
        {
            byId[cmd.Ids[i]].MoveTo(i, now);
        }

        audit.Record("reorder", nameof(Product), cmd.CategoryId.ToString());
        await uow.SaveChangesAsync(ct);
        return cmd.Ids.Select(id => ProductDto.From(byId[id])).ToList();
    }
}
