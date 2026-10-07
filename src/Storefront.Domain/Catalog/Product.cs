using Storefront.Domain.Common;

namespace Storefront.Domain.Catalog;

public sealed class Product : AggregateRoot, ITenantOwned
{
    public const int NameMax = 60;
    public const int DescriptionMax = 140;
    public const decimal PriceMax = 999_999_999m;

    private Product()
    {
    }

    public Guid BusinessId { get; private set; }
    public Guid CategoryId { get; private set; }
    public string Name { get; private set; } = "";
    public string? Description { get; private set; }
    public decimal Price { get; private set; }
    public string? ImageUrl { get; private set; }
    public string? Label { get; private set; }
    /// <summary>False means sold out: still shown, dimmed, with a "Sold out" label.</summary>
    public bool IsAvailable { get; private set; } = true;
    /// <summary>Shown in "Signature picks".</summary>
    public bool IsFeatured { get; private set; }
    public int SortOrder { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public static Product Create(Guid businessId, Guid categoryId, ProductDetails details, string currency, int sortOrder, DateTimeOffset now)
    {
        var product = new Product
        {
            BusinessId = businessId,
            CategoryId = categoryId,
            SortOrder = sortOrder,
            CreatedAt = now,
        };
        product.Apply(details, currency, now);
        product.Raise(new ProductChanged(businessId, product.Id, ChangeKind.Created, now));
        return product;
    }

    public void Update(Guid categoryId, ProductDetails details, string currency, DateTimeOffset now)
    {
        CategoryId = categoryId;
        Apply(details, currency, now);
        Raise(new ProductChanged(BusinessId, Id, ChangeKind.Updated, now));
    }

    public void SetAvailability(bool isAvailable, DateTimeOffset now)
    {
        IsAvailable = isAvailable;
        Touch(now);
    }

    public void SetFeatured(bool isFeatured, DateTimeOffset now)
    {
        IsFeatured = isFeatured;
        Touch(now);
    }

    public void MoveToCategory(Guid categoryId, DateTimeOffset now)
    {
        CategoryId = categoryId;
        Touch(now);
    }

    public void MoveTo(int sortOrder, DateTimeOffset now)
    {
        if (SortOrder == sortOrder)
        {
            return;
        }

        SortOrder = sortOrder;
        Touch(now);
    }

    public void MarkDeleted(DateTimeOffset now) => Raise(new ProductChanged(BusinessId, Id, ChangeKind.Deleted, now));

    private void Apply(ProductDetails details, string currency, DateTimeOffset now)
    {
        if (details.Price < 0 || details.Price > PriceMax)
        {
            throw new DomainException("product.price", "Price must be 0 or more.", "price");
        }

        if (!ProductLabel.IsValid(details.Label))
        {
            throw new DomainException("product.label", $"Label must be one of: {string.Join(", ", ProductLabel.All)}.", "label");
        }

        Name = Guard.Text(details.Name, "name", 1, NameMax, "product.name");
        Description = Guard.OptionalText(details.Description, "description", DescriptionMax, "product.description");
        Price = Money.Round(details.Price, currency);
        Label = details.Label;
        ImageUrl = Guard.OptionalText(details.ImageUrl, "imageUrl", 2048, "product.image");
        IsAvailable = details.IsAvailable;
        IsFeatured = details.IsFeatured;
        UpdatedAt = now;
    }

    private void Touch(DateTimeOffset now)
    {
        UpdatedAt = now;
        Raise(new ProductChanged(BusinessId, Id, ChangeKind.Updated, now));
    }
}

public sealed record ProductDetails(
    string Name,
    string? Description,
    decimal Price,
    string? Label = null,
    bool IsAvailable = true,
    bool IsFeatured = false,
    string? ImageUrl = null);
