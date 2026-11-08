using Storefront.Domain.Businesses;
using Storefront.Domain.Common;

namespace Storefront.Domain.Tests;

public class SocialAccountsTests
{
    [Theory]
    [InlineData("vanillamenu", "vanillamenu")]
    [InlineData("@vanilla.menu", "vanilla.menu")]
    [InlineData("https://www.instagram.com/vanilla_menu/?hl=en", "vanilla_menu")]
    [InlineData("instagram.com/vanillamenu", "vanillamenu")]
    public void Instagram_keeps_the_username(string input, string expected) => Assert.Equal(expected, SocialAccounts.Instagram(input));

    [Theory]
    [InlineData("vanillamenu", "vanillamenu")]
    [InlineData("https://www.facebook.com/Vanilla.Menu-Cafe/", "Vanilla.Menu-Cafe")]
    [InlineData("fb.com/vanillamenu", "vanillamenu")]
    [InlineData("https://m.facebook.com/profile.php?id=100089123456789", "profile.php?id=100089123456789")]
    public void Facebook_keeps_the_page_name(string input, string expected) => Assert.Equal(expected, SocialAccounts.Facebook(input));

    [Theory]
    [InlineData("@vanilla.menu", "vanilla.menu")]
    [InlineData("https://www.tiktok.com/@vanillamenu?lang=en", "vanillamenu")]
    public void TikTok_keeps_the_username(string input, string expected) => Assert.Equal(expected, SocialAccounts.TikTok(input));

    [Theory]
    [InlineData("vanilla-menu", "vanilla-menu")]
    [InlineData("https://www.snapchat.com/add/vanillamenu", "vanillamenu")]
    public void Snapchat_keeps_the_username(string input, string expected) => Assert.Equal(expected, SocialAccounts.Snapchat(input));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Empty_clears_the_account(string? input)
    {
        Assert.Null(SocialAccounts.Instagram(input));
        Assert.Null(SocialAccounts.Facebook(input));
        Assert.Null(SocialAccounts.TikTok(input));
        Assert.Null(SocialAccounts.Snapchat(input));
    }

    [Fact]
    public void Rejects_other_sites_and_bad_names()
    {
        Assert.Throws<DomainException>(() => SocialAccounts.Instagram("https://evil.example.com/vanillamenu"));
        Assert.Throws<DomainException>(() => SocialAccounts.Facebook("https://instagram.com/vanillamenu"));
        Assert.Throws<DomainException>(() => SocialAccounts.TikTok("vanilla menu"));
        Assert.Throws<DomainException>(() => SocialAccounts.Snapchat("1abc"));
        Assert.Throws<DomainException>(() => SocialAccounts.Snapchat("averyveryverylongname"));
        Assert.False(SocialAccounts.IsValid(SocialAccounts.TikTok, "<script>"));
        Assert.True(SocialAccounts.IsValid(SocialAccounts.TikTok, null));
    }

    [Fact]
    public void Business_stores_the_accounts_as_usernames()
    {
        var business = Business.Create(Guid.NewGuid(), "Vanilla", Slug.Create("vanilla", new HashSet<string>()), DateTimeOffset.UtcNow);
        business.UpdateContactAccounts(PhoneNumber.Create("+962 6 555 0100"), "facebook.com/vanillamenu", "@vanillamenu", "snapchat.com/add/vanillamenu", DateTimeOffset.UtcNow);
        Assert.Equal("+96265550100", business.Phone!.Value);
        Assert.Equal("vanillamenu", business.Facebook);
        Assert.Equal("vanillamenu", business.TikTok);
        Assert.Equal("vanillamenu", business.Snapchat);

        business.UpdateContactAccounts(null, null, "", null, DateTimeOffset.UtcNow);
        Assert.Null(business.Phone);
        Assert.Null(business.TikTok);
    }
}
