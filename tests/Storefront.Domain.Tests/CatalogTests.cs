using Storefront.Domain.Catalog;
using Storefront.Domain.Common;

namespace Storefront.Domain.Tests;

public class CatalogTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 9, 0, 0, TimeSpan.Zero);
    private static readonly Guid Biz = Guid.CreateVersion7();

    [Fact]
    public void Category_name_must_be_1_to_30_characters()
    {
        Assert.Throws<DomainException>(() => Category.Create(Biz, " ", 0, Now));
        Assert.Throws<DomainException>(() => Category.Create(Biz, new string('x', 31), 0, Now));
        Assert.Equal("Coffee", Category.Create(Biz, "  Coffee ", 0, Now).Name);
    }

    [Fact]
    public void Creating_a_category_records_an_event()
    {
        var category = Category.Create(Biz, "Tea", 0, Now);
        var e = Assert.IsType<CategoryChanged>(Assert.Single(category.DomainEvents));
        Assert.Equal(ChangeKind.Created, e.Kind);
    }

    [Fact]
    public void Product_price_is_rounded_to_currency()
    {
        var product = Product.Create(Biz, Guid.CreateVersion7(), new ProductDetails("Latte", null, 3.4567m), "JOD", 0, Now);
        Assert.Equal(3.457m, product.Price);
    }

    [Theory]
    [InlineData("", null, 1, null)]
    [InlineData("Latte", null, -1, null)]
    [InlineData("Latte", null, 1, "Hot")]
    public void Product_rejects_invalid_details(string name, string? description, decimal price, string? label) =>
        Assert.Throws<DomainException>(() => Product.Create(Biz, Guid.CreateVersion7(), new ProductDetails(name, description, price, label), "JOD", 0, Now));

    [Fact]
    public void Product_limits_name_and_description()
    {
        Assert.Throws<DomainException>(() => Product.Create(Biz, Guid.CreateVersion7(), new ProductDetails(new string('n', 61), null, 1), "JOD", 0, Now));
        Assert.Throws<DomainException>(() => Product.Create(Biz, Guid.CreateVersion7(), new ProductDetails("Latte", new string('d', 141), 1), "JOD", 0, Now));
    }

    [Theory]
    [InlineData("Signature")]
    [InlineData("New")]
    [InlineData("Best seller")]
    [InlineData("Vegan")]
    [InlineData("Spicy")]
    [InlineData(null)]
    public void Product_accepts_fixed_labels(string? label) =>
        Assert.Equal(label, Product.Create(Biz, Guid.CreateVersion7(), new ProductDetails("Latte", null, 1, label), "JOD", 0, Now).Label);

    [Fact]
    public void Marking_sold_out_records_a_change()
    {
        var product = Product.Create(Biz, Guid.CreateVersion7(), new ProductDetails("Latte", null, 1), "JOD", 0, Now);
        product.ClearDomainEvents();
        product.SetAvailability(false, Now.AddMinutes(1));
        Assert.False(product.IsAvailable);
        Assert.Equal(Now.AddMinutes(1), product.UpdatedAt);
        Assert.Single(product.DomainEvents);
    }
}
