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

    public static Category Create(Guid businessId, string name, int sortOrder, DateTimeOffset now)
    {
        var category = new Category
        {
            BusinessId = businessId,
            Name = Guard.Text(name, "name", 1, NameMax, "category.name"),
            SortOrder = sortOrder,
        };
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

    public void MarkDeleted(DateTimeOffset now) => Raise(new CategoryChanged(BusinessId, Id, ChangeKind.Deleted, now));
}
