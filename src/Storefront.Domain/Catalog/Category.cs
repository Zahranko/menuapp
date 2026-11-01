using Storefront.Domain.Common;

namespace Storefront.Domain.Catalog;

public sealed class Category : AggregateRoot, ITenantOwned
{
    public const int NameMax = 30;

    private Category()
    {
    }

    public Guid BusinessId { get; private set; }
    public string Name { get; private set; } = "";
    public int SortOrder { get; private set; }
    /// <summary>The main category this one sits under, or null for a main (top-level) category. One level deep only.</summary>
    public Guid? ParentId { get; private set; }

    public static Category Create(Guid businessId, string name, int sortOrder, DateTimeOffset now, Category? parent = null)
    {
        var category = new Category
        {
            BusinessId = businessId,
            Name = Guard.Text(name, "name", 1, NameMax, "category.name"),
            SortOrder = sortOrder,
        };
        category.CheckParent(parent);
        category.ParentId = parent?.Id;
        category.Raise(new CategoryChanged(businessId, category.Id, ChangeKind.Created, now));
        return category;
    }

    public void Rename(string name, DateTimeOffset now)
    {
        Name = Guard.Text(name, "name", 1, NameMax, "category.name");
        Raise(new CategoryChanged(BusinessId, Id, ChangeKind.Updated, now));
    }

    public void MoveTo(int sortOrder, DateTimeOffset now)
    {
        if (SortOrder == sortOrder)
        {
            return;
        }

        SortOrder = sortOrder;
        Raise(new CategoryChanged(BusinessId, Id, ChangeKind.Updated, now));
    }

    /// <summary>
    /// Puts this category under <paramref name="parent"/>, or back at the top level when it is null.
    /// The parent must be another main category of the same business. Whether this category has sub-categories
    /// of its own (which would make a third level) is checked by the caller.
    /// </summary>
    public void SetParent(Category? parent, DateTimeOffset now)
    {
        CheckParent(parent);
        var parentId = parent?.Id;
        if (ParentId == parentId)
        {
            return;
        }

        ParentId = parentId;
        Raise(new CategoryChanged(BusinessId, Id, ChangeKind.Updated, now));
    }

    public void MarkDeleted(DateTimeOffset now) => Raise(new CategoryChanged(BusinessId, Id, ChangeKind.Deleted, now));

    private void CheckParent(Category? parent)
    {
        if (parent is not null)
        {
            if (parent.Id == Id)
            {
                throw new DomainException(CategoryRules.ParentSelf, CategoryRules.ParentSelfMessage, "parentId");
            }

            if (parent.BusinessId != BusinessId)
            {
                throw new DomainException(CategoryRules.ParentNotFound, CategoryRules.ParentNotFoundMessage, "parentId");
            }

            if (parent.ParentId is not null)
            {
                throw new DomainException(CategoryRules.ParentNotTopLevel, CategoryRules.ParentNotTopLevelMessage, "parentId");
            }
        }
    }
}

/// <summary>Stable codes and owner-facing messages for the sub-category rules.</summary>
public static class CategoryRules
{
    public const string ParentSelf = "category.parentSelf";
    public const string ParentSelfMessage = "A category can't go inside itself. Choose another main category.";
    public const string ParentNotFound = "category.parentNotFound";
    public const string ParentNotFoundMessage = "Choose a main category from your list.";
    public const string ParentNotTopLevel = "category.parent";
    public const string ParentNotTopLevelMessage = "Choose a main category, not a sub-category.";
    public const string HasSubcategories = "category.hasSubcategories";
    public const string HasSubcategoriesMessage = "This category has its own sub-categories, so it can't go inside another one. Move them out first.";
}
