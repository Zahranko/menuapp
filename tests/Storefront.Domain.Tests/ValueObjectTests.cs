using Storefront.Domain.Common;

namespace Storefront.Domain.Tests;

public class SlugTests
{
    private static readonly HashSet<string> Reserved = ["admin", "api", "sufrlike"];

    [Theory]
    [InlineData("Vanilla Menu", "vanillamenu")]
    [InlineData("  Café Olé 22 ", "cafeole22")]
    [InlineData("Al-Reem's Bakery!", "alreemsbakery")]
    [InlineData("مطعم", "")]
    public void FromBusinessName_keeps_only_lowercase_letters_and_digits(string name, string expected) =>
        Assert.Equal(expected, Slug.FromBusinessName(name));

    [Fact]
    public void FromBusinessName_truncates_to_30_characters() =>
        Assert.Equal(30, Slug.FromBusinessName(new string('a', 50)).Length);

    [Theory]
    [InlineData("vanillamenu")]
    [InlineData("abc")]
    [InlineData("a23456789012345678901234567890")]
    public void Create_accepts_valid_slugs(string value) => Assert.Equal(value, Slug.Create(value, Reserved).Value);

    [Fact]
    public void Create_lowercases_input() => Assert.Equal("vanilla", Slug.Create("Vanilla", Reserved).Value);

    [Theory]
    [InlineData("ab")]
    [InlineData("a234567890123456789012345678901")]
    [InlineData("has space")]
    [InlineData("dash-ed")]
    [InlineData("")]
    [InlineData(null)]
    public void Create_rejects_invalid_slugs(string? value)
    {
        var ex = Assert.Throws<DomainException>(() => Slug.Create(value, Reserved));
        Assert.Equal("slug.invalid", ex.Code);
        Assert.Equal("slug", ex.Field);
    }

    [Theory]
    [InlineData("admin")]
    [InlineData("API")]
    public void Create_rejects_reserved_slugs(string value) =>
        Assert.Equal("slug.reserved", Assert.Throws<DomainException>(() => Slug.Create(value, Reserved)).Code);
}

public class MoneyTests
{
    [Theory]
    [InlineData(3.5, "JOD", 3.500)]
    [InlineData(1.23456, "JOD", 1.235)]
    [InlineData(1.0005, "JOD", 1.001)]
    [InlineData(1.005, "USD", 1.01)]
    [InlineData(1.004, "USD", 1.00)]
    [InlineData(1234.5, "JPY", 1235)]
    public void Rounds_to_currency_decimals(decimal amount, string currency, decimal expected) =>
        Assert.Equal(expected, new Money(amount, currency).Amount);

    [Fact]
    public void Normalizes_currency_code() => Assert.Equal("JOD", new Money(1, " jod ").Currency);

    [Fact]
    public void Formats_with_currency_decimals() => Assert.Equal("3.500 JOD", new Money(3.5m, "JOD").ToString());

    [Theory]
    [InlineData("")]
    [InlineData("JD")]
    [InlineData("DOLLAR")]
    public void Rejects_invalid_currency(string currency) => Assert.Throws<DomainException>(() => new Money(1, currency));
}

public class DomainNameTests
{
    [Theory]
    [InlineData("vanillamenu.com", "vanillamenu.com")]
    [InlineData("  VanillaMenu.COM ", "vanillamenu.com")]
    [InlineData("https://www.vanillamenu.com/", "www.vanillamenu.com")]
    [InlineData("menu.vanilla-cafe.jo", "menu.vanilla-cafe.jo")]
    public void Accepts_and_normalizes(string input, string expected) => Assert.Equal(expected, DomainName.Create(input).Value);

    [Theory]
    [InlineData("vanillamenu")]
    [InlineData("vanilla menu.com")]
    [InlineData("-bad.com")]
    [InlineData("")]
    public void Rejects_invalid(string input) => Assert.Throws<DomainException>(() => DomainName.Create(input));
}

public class PhoneNumberTests
{
    [Theory]
    [InlineData("+962 79 000 0000", "+962790000000")]
    [InlineData("00962-79-000-0000", "+962790000000")]
    [InlineData("+1 (415) 555-0100", "+14155550100")]
    public void Normalizes_to_E164(string input, string expected) => Assert.Equal(expected, PhoneNumber.Create(input).Value);

    [Theory]
    [InlineData("0790000000")]
    [InlineData("+0123456789")]
    [InlineData("+12")]
    [InlineData("phone")]
    public void Rejects_numbers_without_country_code(string input) => Assert.Throws<DomainException>(() => PhoneNumber.Create(input));
}
