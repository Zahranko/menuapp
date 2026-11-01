using Storefront.Application.Accounts;
using Storefront.Application.Catalog.Products;
using Storefront.Application.Common;

namespace Storefront.Application.Tests;

public class ValidatorTests
{
    [Theory]
    [InlineData("Sunrise2026", true)]
    [InlineData("sunrise2026", false)]
    [InlineData("Sunrise", false)]
    [InlineData("Sun2", false)]
    public async Task Register_requires_a_strong_password(string password, bool valid)
    {
        var error = await new RegisterValidator().CheckAsync(new Register("Vanilla Menu", "owner@example.com", "+962790000000", password), CancellationToken.None);
        Assert.Equal(valid, error is null);
        if (!valid)
        {
            Assert.True(error!.Fields!.ContainsKey("password"));
        }
    }

    [Fact]
    public async Task Register_keys_errors_by_camel_case_field()
    {
        var error = await new RegisterValidator().CheckAsync(new Register("", "", "", ""), CancellationToken.None);
        Assert.Equal(["businessName", "email", "password", "phone"], error!.Fields!.Keys.Order());
    }

    [Theory]
    [InlineData("Custom", "Chef's choice", null, null)]
    [InlineData("Custom", null, "اختيار الشيف", null)]
    [InlineData("Custom", " ", null, "Type the label text.")]
    [InlineData("Custom", "1234567890123456789012345", null, "Labels can be up to 24 characters.")]
    [InlineData("Custom", "Two\nlines", null, "Keep the label on one line.")]
    [InlineData("New", null, null, null)]
    [InlineData("Hot", null, null, "Choose a label: Signature, New, Best seller, Vegan, Spicy, Custom.")]
    public async Task Product_custom_label_is_checked(string label, string? text, string? textAr, string? message)
    {
        var cmd = new SaveProduct(Guid.CreateVersion7(), "Latte", null, 1, label, CustomLabel: text, CustomLabelAr: textAr);
        var error = await new SaveProductValidator().CheckAsync(cmd, CancellationToken.None);
        Assert.Equal(message, error?.Fields!.Values.SelectMany(v => v).Single());
    }

    [Fact]
    public async Task Long_Arabic_custom_label_is_keyed_by_its_field()
    {
        var cmd = new SaveProduct(Guid.CreateVersion7(), "Latte", null, 1, "Custom", CustomLabel: "Halal", CustomLabelAr: new string('ح', 25));
        var error = await new SaveProductValidator().CheckAsync(cmd, CancellationToken.None);
        Assert.Equal(["customLabelAr"], error!.Fields!.Keys);
    }

    [Fact]
    public async Task Login_needs_both_fields()
    {
        var error = await new LoginValidator().CheckAsync(new LogIn("", ""), CancellationToken.None);
        Assert.Equal("Enter your email or phone number.", error!.Fields!["login"][0]);
        Assert.Equal("Enter your password.", error.Fields["password"][0]);
    }
}
