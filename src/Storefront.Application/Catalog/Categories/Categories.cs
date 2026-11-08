using FluentValidation;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Domain.Catalog;
using Storefront.Domain.Common;

namespace Storefront.Application.Catalog.Categories;

public sealed class ListCategoriesHandler(ICatalogRepository catalog)
{
    public async Task<IReadOnlyList<CategoryDto>> Handle(CancellationToken ct)
    {
        var counts = await catalog.CountProductsByCategoryAsync(ct);
        return (await catalog.ListCategoriesAsync(ct)).Select(c => CategoryDto.From(c, counts.GetValueOrDefault(c.Id))).ToList();
    }
}

/// <summary>Create or fully update a category. <see cref="ParentId"/> puts it under a main category; null or absent keeps it at the top level.</summary>
public sealed record SaveCategory(string Name, Guid? ParentId = null);

public sealed class SaveCategoryValidator : AbstractValidator<SaveCategory>
{
    public SaveCategoryValidator() => RuleFor(x => x.Name).Cascade(CascadeMode.Stop)
        .Must(n => !string.IsNullOrWhiteSpace(n)).WithMessage("Enter a category name.")
        .Must(n => n.Trim().Length <= Category.NameMax).WithMessage("Category names can be up to 30 characters.");
}

public sealed class CreateCategoryHandler(IValidator<SaveCategory> validator, ICatalogRepository catalog, ICurrentUser user, IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result<CategoryDto>> Handle(SaveCategory cmd, CancellationToken ct)
    {
        if (await validator.CheckAsync(cmd, ct) is { } invalid)
        {
            return invalid;
        }

        if (user.BusinessId is not { } businessId)
        {
            return CatalogErrors.NoBusiness;
        }

        if (await catalog.CategoryNameExistsAsync(cmd.Name, null, ct))
        {
            return CategoryErrors.Duplicate;
        }

        var (parent, parentError) = await CategoryParents.ResolveAsync(catalog, cmd.ParentId, null, ct);
        if (parentError is not null)
        {
            return parentError;
        }

        var category = Category.Create(businessId, cmd.Name, await catalog.NextCategorySortOrderAsync(ct), clock.UtcNow, parent);
        catalog.Add(category);
        audit.Record("create", nameof(Category), category.Id.ToString());
        await uow.SaveChangesAsync(ct);
        return CategoryDto.From(category, 0);
    }
}

/// <summary>Full update (PUT): name and parent. A missing or null parentId moves the category to the top level.</summary>
public sealed class RenameCategoryHandler(IValidator<SaveCategory> validator, ICatalogRepository catalog, IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result<CategoryDto>> Handle(Guid id, SaveCategory cmd, CancellationToken ct)
    {
        if (await validator.CheckAsync(cmd, ct) is { } invalid)
        {
            return invalid;
        }

        var category = await catalog.GetCategoryAsync(id, ct);
        if (category is null)
        {
            return CatalogErrors.CategoryNotFound;
        }

        if (await catalog.CategoryNameExistsAsync(cmd.Name, id, ct))
        {
            return CategoryErrors.Duplicate;
        }

        var (parent, parentError) = await CategoryParents.ResolveAsync(catalog, cmd.ParentId, category, ct);
        if (parentError is not null)
        {
            return parentError;
        }

        var now = clock.UtcNow;
        category.Rename(cmd.Name, now);
        category.SetParent(parent, now);
        audit.Record("update", nameof(Category), id.ToString());
        await uow.SaveChangesAsync(ct);
        return CategoryDto.From(category, await catalog.CountProductsAsync(id, ct));
    }
}

/// <summary>
/// A category with products can only be deleted after choosing: move them (<see cref="MoveTo"/>) or delete them too.
/// Its sub-categories (and their products) stay and move to the top level.
/// </summary>
public sealed record DeleteCategory(Guid Id, Guid? MoveTo, bool DeleteProducts);

public sealed class DeleteCategoryHandler(ICatalogRepository catalog, IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result> Handle(DeleteCategory cmd, CancellationToken ct)
    {
        var category = await catalog.GetCategoryAsync(cmd.Id, ct);
        if (category is null)
        {
            return CatalogErrors.CategoryNotFound;
        }

        var now = clock.UtcNow;
        var products = await catalog.ListProductsAsync(cmd.Id, ct);
        if (products.Count > 0)
        {
            if (cmd.MoveTo is { } targetId)
            {
                var target = targetId == cmd.Id ? null : await catalog.GetCategoryAsync(targetId, ct);
                if (target is null)
                {
                    return Error.Validation("category.moveTo", "Choose another category to move the products to.", "moveTo");
                }

                var next = await catalog.NextProductSortOrderAsync(target.Id, ct);
                foreach (var product in products)
                {
                    product.MoveToCategory(target.Id, now);
                    product.MoveTo(next++, now);
                }
            }
            else if (cmd.DeleteProducts)
            {
                foreach (var product in products)
                {
                    product.MarkDeleted(now);
                    catalog.Remove(product);
                    audit.Record("delete", nameof(Product), product.Id.ToString());
                }
            }
            else
            {
                return Error.Validation("category.hasProducts", $"Choose where its {products.Count} product{(products.Count == 1 ? "" : "s")} go first.", "moveTo");
            }
        }

        foreach (var child in await catalog.ListSubcategoriesAsync(cmd.Id, ct))
        {
            child.SetParent(null, now);
        }

        category.MarkDeleted(now);
        catalog.Remove(category);
        audit.Record("delete", nameof(Category), cmd.Id.ToString());
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}

public sealed record ReorderCategories(IReadOnlyList<Guid> Ids);

public sealed class ReorderCategoriesHandler(ICatalogRepository catalog, IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result<IReadOnlyList<CategoryDto>>> Handle(ReorderCategories cmd, CancellationToken ct)
    {
        var categories = await catalog.ListCategoriesAsync(ct);
        if (!Ordering.IsPermutation(cmd.Ids, categories.Select(c => c.Id)))
        {
            return Ordering.Mismatch;
        }

        var now = clock.UtcNow;
        var byId = categories.ToDictionary(c => c.Id);
        for (var i = 0; i < cmd.Ids.Count; i++)
        {
            byId[cmd.Ids[i]].MoveTo(i, now);
        }

        audit.Record("reorder", nameof(Category), null);
        await uow.SaveChangesAsync(ct);
        var counts = await catalog.CountProductsByCategoryAsync(ct);
        return cmd.Ids.Select(id => CategoryDto.From(byId[id], counts.GetValueOrDefault(id))).ToList();
    }
}

internal static class CategoryErrors
{
    public static readonly Error Duplicate = Error.Conflict("category.duplicate", "You already have a category with that name.", "name");
    public static readonly Error ParentSelf = Error.Validation(CategoryRules.ParentSelf, CategoryRules.ParentSelfMessage, "parentId");
    public static readonly Error ParentNotFound = Error.Validation(CategoryRules.ParentNotFound, CategoryRules.ParentNotFoundMessage, "parentId");
    public static readonly Error ParentNotTopLevel = Error.Validation(CategoryRules.ParentNotTopLevel, CategoryRules.ParentNotTopLevelMessage, "parentId");
    public static readonly Error HasSubcategories = Error.Validation(CategoryRules.HasSubcategories, CategoryRules.HasSubcategoriesMessage, "parentId");
}

/// <summary>Sub-category rules that need the database: the parent exists in this business, is a main category, and the moved category has no sub-categories.</summary>
internal static class CategoryParents
{
    public static async Task<(Category? Parent, Error? Error)> ResolveAsync(ICatalogRepository catalog, Guid? parentId, Category? self, CancellationToken ct)
    {
        if (parentId is not { } id)
        {
            return (null, null);
        }

        if (self is not null && id == self.Id)
        {
            return (null, CategoryErrors.ParentSelf);
        }

        // Tenant-filtered: another business's category is simply not found.
        var parent = await catalog.GetCategoryAsync(id, ct);
        if (parent is null)
        {
            return (null, CategoryErrors.ParentNotFound);
        }

        if (parent.ParentId is not null)
        {
            return (null, CategoryErrors.ParentNotTopLevel);
        }

        if (self is not null && (await catalog.ListSubcategoriesAsync(self.Id, ct)).Count > 0)
        {
            return (null, CategoryErrors.HasSubcategories);
        }

        return (parent, null);
    }
}

internal static class Ordering
{
    public static readonly Error Mismatch = Error.Validation("order.mismatch", "The list must contain each item exactly once. Refresh and try again.", "ids");

    public static bool IsPermutation(IReadOnlyList<Guid>? ids, IEnumerable<Guid> existing)
    {
        if (ids is null)
        {
            return false;
        }

        var set = existing.ToHashSet();
        return ids.Count == set.Count && ids.Distinct().Count() == ids.Count && ids.All(set.Contains);
    }
}
