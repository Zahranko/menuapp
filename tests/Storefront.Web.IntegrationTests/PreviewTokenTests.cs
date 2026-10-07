using Microsoft.Extensions.Options;
using Storefront.Infrastructure.Identity;

namespace Storefront.Web.IntegrationTests;

public class PreviewTokenTests
{
    private static readonly PreviewTokens Tokens = new(Options.Create(new AuthOptions { SigningKey = "preview-token-tests-key-0123456789abcdef" }));

    [Fact]
    public void Valid_until_expiry()
    {
        var business = Guid.CreateVersion7();
        var now = DateTimeOffset.UtcNow;
        var token = Tokens.Create(business, now.AddMinutes(30));
        Assert.Equal(business, Tokens.Read(token, now));
        Assert.Equal(business, Tokens.Read(token, now.AddMinutes(29)));
        Assert.Null(Tokens.Read(token, now.AddMinutes(30)));
    }

    [Fact]
    public void Tokens_signed_with_another_key_are_rejected()
    {
        var other = new PreviewTokens(Options.Create(new AuthOptions { SigningKey = "a-different-signing-key-0123456789abcdef" }));
        var token = other.Create(Guid.CreateVersion7(), DateTimeOffset.UtcNow.AddMinutes(30));
        Assert.Null(Tokens.Read(token, DateTimeOffset.UtcNow));
    }
}
