using Storefront.Domain.Common;
using Storefront.Domain.Templates;

namespace Storefront.Domain.Tests;

public class TemplateTests
{
    private static Template Create(string? tier) => Template.Create("demo", 1, "Demo", "cafe", null, null, "[]", "{}", 1, tier);

    [Theory]
    [InlineData(null, "basic", false)]
    [InlineData("", "basic", false)]
    [InlineData("basic", "basic", false)]
    [InlineData(" PRO ", "pro", true)]
    public void Tier_defaults_to_basic(string? tier, string expected, bool isPro)
    {
        var template = Create(tier);
        Assert.Equal(expected, template.Tier);
        Assert.Equal(isPro, template.IsPro);
    }

    [Fact]
    public void Unknown_tier_is_rejected() =>
        Assert.Equal("template.tier", Assert.Throws<DomainException>(() => Create("gold")).Code);

    [Fact]
    public void Updating_without_a_tier_makes_it_basic_again()
    {
        var template = Create("pro");
        template.Update(1, "Demo", "cafe", null, null, "[]", "{}", 2);
        Assert.False(template.IsPro);
    }
}
