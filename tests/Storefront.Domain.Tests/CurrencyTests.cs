using Storefront.Domain.Businesses;
using Storefront.Domain.Catalog;
using Storefront.Domain.Common;

namespace Storefront.Domain.Tests;

public class CurrencyTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 1, 9, 0, 0, TimeSpan.Zero);

    private static Business NewBusiness(string? currency = null, string? timeZone = null) =>
        currency is null && timeZone is null
            ? Business.Create(Guid.CreateVersion7(), "Olive Cafe", Slug.FromStorage("olivecafe"), Now)
            : Business.Create(Guid.CreateVersion7(), "Olive Cafe", Slug.FromStorage("olivecafe"), Now,
                currencyCode: currency ?? Currencies.Default, timeZone: timeZone ?? Business.DefaultTimeZone);

    [Fact]
    public void Lists_the_supported_currencies_once_each()
    {
        Assert.Equal(39, Currencies.All.Count);
        Assert.Equal(Currencies.All.Count, Currencies.All.Distinct().Count());
        Assert.All(Currencies.All, c => Assert.Matches("^[A-Z]{3}$", c));
        Assert.Equal("USD", Currencies.All[0]);
        Assert.Contains("JOD", Currencies.All);
        Assert.Contains("MXN", Currencies.All);
    }

    [Theory]
    [InlineData("JOD", 3)]
    [InlineData("KWD", 3)]
    [InlineData("BHD", 3)]
    [InlineData("OMR", 3)]
    [InlineData("IQD", 3)]
    [InlineData("LYD", 3)]
    [InlineData("TND", 3)]
    [InlineData("JPY", 0)]
    [InlineData("USD", 2)]
    [InlineData("EUR", 2)]
    [InlineData("SAR", 2)]
    [InlineData("IDR", 2)]
    [InlineData("KRW", 0)]
    [InlineData("XYZ", 2)]
    public void Knows_each_currency_decimals(string code, int decimals) => Assert.Equal(decimals, Currencies.DecimalsFor(code));

    [Theory]
    [InlineData("USD", true)]
    [InlineData(" eur ", true)]
    [InlineData("jod", true)]
    [InlineData("KRW", false)]
    [InlineData("XYZ", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void Tells_supported_codes(string? code, bool supported) => Assert.Equal(supported, Currencies.IsSupported(code));

    [Fact]
    public void New_businesses_default_to_US_dollars_and_UTC()
    {
        var business = NewBusiness();
        Assert.Equal("USD", business.CurrencyCode);
        Assert.Equal("UTC", business.TimeZone);
    }

    [Fact]
    public void A_business_can_be_created_in_any_supported_currency_and_time_zone()
    {
        var business = NewBusiness("sar", "Asia/Riyadh");
        Assert.Equal("SAR", business.CurrencyCode);
        Assert.Equal("Asia/Riyadh", business.TimeZone);
    }

    [Theory]
    [InlineData("eur", "EUR")]
    [InlineData(" GBP ", "GBP")]
    [InlineData("JPY", "JPY")]
    public void SetCurrency_accepts_listed_codes(string input, string stored)
    {
        var business = NewBusiness();
        business.SetCurrency(input);
        Assert.Equal(stored, business.CurrencyCode);
    }

    [Theory]
    [InlineData("KRW")]
    [InlineData("XYZ")]
    [InlineData("US")]
    [InlineData("")]
    public void SetCurrency_rejects_other_codes(string code)
    {
        var business = NewBusiness();
        var ex = Assert.Throws<DomainException>(() => business.SetCurrency(code));
        Assert.Equal("business.currency", ex.Code);
        Assert.Equal("currencyCode", ex.Field);
        Assert.Equal("USD", business.CurrencyCode);
    }

    [Theory]
    [InlineData("Mars/Olympus")]
    [InlineData("")]
    public void SetTimeZone_rejects_unknown_zones(string zone)
    {
        var ex = Assert.Throws<DomainException>(() => NewBusiness().SetTimeZone(zone));
        Assert.Equal("business.timezone", ex.Code);
        Assert.Equal("timeZone", ex.Field);
    }

    [Theory]
    [InlineData(1.255, "USD", 1.26)]
    [InlineData(2.5, "JPY", 3)]
    [InlineData(3.49, "JPY", 3)]
    [InlineData(1.25, "KWD", 1.25)]
    public void Changing_currency_keeps_the_number_and_rounds_away_from_zero(decimal price, string currency, decimal expected)
    {
        var product = Product.Create(Guid.CreateVersion7(), Guid.CreateVersion7(), new ProductDetails("Latte", null, price), "JOD", 0, Now);
        product.ClearDomainEvents();

        product.ChangeCurrency(currency, Now.AddHours(1));

        Assert.Equal(expected, product.Price);
        Assert.Empty(product.DomainEvents);
    }
}
