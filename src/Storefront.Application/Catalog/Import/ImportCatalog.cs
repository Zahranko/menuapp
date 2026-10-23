using FluentValidation;
using Storefront.Application.Abstractions;
using Storefront.Application.Catalog.Categories;
using Storefront.Application.Catalog.Products;
using Storefront.Application.Common;
using Storefront.Domain.Catalog;
using Storefront.Domain.Common;

namespace Storefront.Application.Catalog.Import;

/// <summary>
/// Many categories and products at once, as the owner reviewed them (from a menu photo, for example).
/// A category whose name the business already has (ignoring case) gets the products added to it; other names become new main categories.
/// </summary>
public sealed record ImportCatalog(IReadOnlyList<ImportCategory>? Categories);

public sealed record ImportCategory(string Name, IReadOnlyList<ImportProduct>? Products);

/// <summary>Prices are in the business currency and rounded to its decimals.</summary>
public sealed record ImportProduct(string Name, string? Description, decimal? Price);

public sealed record ImportResultDto(int CategoriesCreated, int ProductsCreated);

public sealed class ImportCatalogHandler(
    IValidator<SaveCategory> categoryValidator,
    IValidator<SaveProduct> productValidator,
    ICatalogRepository catalog,
    IBusinessRepository businesses,
    ICurrentUser user,
    IUnitOfWork uow,
    IAuditLog audit,
    IClock clock)
{
    public const int MaxCategories = 30;
    public const int MaxProducts = 300;

    public async Task<Result<ImportResultDto>> Handle(ImportCatalog cmd, CancellationToken ct)
    {
        var business = user.BusinessId is { } id ? await businesses.GetAsync(id, ct) : null;
        if (business is null)
        {
            return CatalogErrors.NoBusiness;
        }

        var categories = cmd.Categories ?? [];
        var total = categories.Sum(c => c.Products?.Count ?? 0);
        if (total == 0)
        {
            return Error.Validation("import.empty", "Choose at least one product to add.", "categories");
        }

        if (categories.Count > MaxCategories || total > MaxProducts)
        {
            return Error.Validation("import.tooMany", "Add up to 30 categories and 300 products at a time.", "categories");
        }

        if (await CheckAsync(categories, ct) is { } invalid)
        {
            return invalid;
        }

        try
        {
            return await uow.InTransactionAsync(() => SaveAsync(business.Id, business.CurrencyCode, categories, ct), ct);
        }
        catch (DomainException ex)
        {
            return Error.FromDomain(ex);
        }
    }

    /// <summary>The same rules as adding one category or product, with errors keyed like "categories[0].products[2].price".</summary>
    private async Task<Error?> CheckAsync(IReadOnlyList<ImportCategory> categories, CancellationToken ct)
    {
        var errors = new Dictionary<string, string[]>();
        for (var i = 0; i < categories.Count; i++)
        {
            var category = categories[i];
            Collect(errors, $"categories[{i}]", await categoryValidator.CheckAsync(new SaveCategory(category.Name ?? ""), ct));
            var products = category.Products ?? [];
            for (var j = 0; j < products.Count; j++)
            {
                var p = products[j];
                // The category is created on save; any id stands in for it here.
                var product = new SaveProduct(Guid.CreateVersion7(), p.Name ?? "", p.Description, p.Price, Label: null);
                Collect(errors, $"categories[{i}].products[{j}]", await productValidator.CheckAsync(product, ct));
            }
        }

        return errors.Count == 0 ? null : Error.Validation(errors);
    }

    private static void Collect(Dictionary<string, string[]> errors, string prefix, Error? error)
    {
        foreach (var (field, messages) in error?.Fields ?? new Dictionary<string, string[]>())
        {
            errors[$"{prefix}.{field}"] = messages;
        }
    }

    private async Task<Result<ImportResultDto>> SaveAsync(Guid businessId, string currency, IReadOnlyList<ImportCategory> categories, CancellationToken ct)
    {
        var now = clock.UtcNow;
        var byName = (await catalog.ListCategoriesAsync(ct)).GroupBy(c => Key(c.Name)).ToDictionary(g => g.Key, g => g.First());
        var nextSort = new Dictionary<Guid, int>();
        var nextCategorySort = await catalog.NextCategorySortOrderAsync(ct);
        var created = (Categories: 0, Products: 0);

        foreach (var item in categories)
        {
            var products = item.Products ?? [];
            if (products.Count == 0)
            {
                continue;
            }

            if (!byName.TryGetValue(Key(item.Name), out var category))
            {
                category = Category.Create(businessId, item.Name, nextCategorySort++, now);
                catalog.Add(category);
                audit.Record("create", nameof(Category), category.Id.ToString());
                byName[Key(item.Name)] = category;
                nextSort[category.Id] = 0;
                created.Categories++;
            }
            else if (!nextSort.ContainsKey(category.Id))
            {
                nextSort[category.Id] = await catalog.NextProductSortOrderAsync(category.Id, ct);
            }

            foreach (var p in products)
            {
                var product = Product.Create(businessId, category.Id, new ProductDetails(p.Name, p.Description, p.Price!.Value), currency, nextSort[category.Id]++, now);
                catalog.Add(product);
                created.Products++;
            }
        }

        audit.Record("import", nameof(Product), created.Products.ToString(System.Globalization.CultureInfo.InvariantCulture));
        await uow.SaveChangesAsync(ct);
        return new ImportResultDto(created.Categories, created.Products);
    }

    private static string Key(string name) => name.Trim().ToLowerInvariant();
}
