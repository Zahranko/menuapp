using System.Net;
using Storefront.Infrastructure.Ai;

namespace Storefront.Web.IntegrationTests;

/// <summary>The AI design studio's reference links: which addresses may be opened, and a web page's preview picture.</summary>
public class ReferenceImagesTests
{
    [Theory]
    [InlineData("8.8.8.8", true)]
    [InlineData("1.1.1.1", true)]
    [InlineData("2606:4700:4700::1111", true)]
    [InlineData("127.0.0.1", false)]
    [InlineData("10.1.2.3", false)]
    [InlineData("172.20.0.1", false)]
    [InlineData("192.168.1.10", false)]
    [InlineData("169.254.169.254", false)]
    [InlineData("100.64.0.1", false)]
    [InlineData("0.0.0.0", false)]
    [InlineData("224.0.0.1", false)]
    [InlineData("::1", false)]
    [InlineData("fe80::1", false)]
    [InlineData("fd00::1", false)]
    [InlineData("::ffff:127.0.0.1", false)]
    public void Only_public_addresses_are_opened(string address, bool open) =>
        Assert.Equal(open, HttpReferenceImages.IsPublic(IPAddress.Parse(address)));

    [Fact]
    public void A_page_gives_its_preview_picture()
    {
        var page = new Uri("https://cafe.example/menu/");
        Assert.Equal(
            new Uri("https://cafe.example/img/share.jpg"),
            HttpReferenceImages.PreviewImage("""<head><meta content="/img/share.jpg" property="og:image"><meta name="twitter:image" content="https://x.example/t.png"></head>""", page));
        Assert.Equal(
            new Uri("https://x.example/t.png?a=1&b=2"),
            HttpReferenceImages.PreviewImage("""<meta name='twitter:image' content='https://x.example/t.png?a=1&amp;b=2'>""", page));
        Assert.Null(HttpReferenceImages.PreviewImage("<p>No pictures</p>", page));
        Assert.Null(HttpReferenceImages.PreviewImage("""<meta property="og:image" content="javascript:alert(1)">""", page));
    }
}
