using Storefront.Application.Accounts;
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

    [Fact]
    public async Task Login_needs_both_fields()
    {
        var error = await new LoginValidator().CheckAsync(new LogIn("", ""), CancellationToken.None);
        Assert.Equal("Enter your email or phone number.", error!.Fields!["login"][0]);
        Assert.Equal("Enter your password.", error.Fields["password"][0]);
    }
}
