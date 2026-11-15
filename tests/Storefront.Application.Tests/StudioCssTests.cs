using System.Text.Json.Nodes;
using Storefront.Application.Templates;

namespace Storefront.Application.Tests;

/// <summary>The AI design studio's style sheet: a template field of type "css", checked when the draft is saved.</summary>
public class StudioCssTests
{
    [Theory]
    [InlineData("")]
    [InlineData("[data-section=\"hero\"] h1 { letter-spacing: 2px; animation: rise .6s ease both }")]
    [InlineData("@keyframes rise { from { opacity: 0 } to { opacity: 1 } }")]
    [InlineData("@media (min-width: 700px) { .x { gap: 2rem } }")]
    [InlineData(".a { background: url(\"data:image/svg+xml,%3Csvg%3E%3C/svg%3E\") }")]
    [InlineData(".a { position: sticky; top: 0 }")]
    public void Safe_sheets_pass(string css) => Assert.Null(StudioCss.Check(css, null));

    [Theory]
    [InlineData("@import url(https://evil.example/x.css);")]
    [InlineData("@font-face { font-family: x; src: url(https://evil.example/f.woff) }")]
    [InlineData(".a { background: url(https://evil.example/track.png) }")]
    [InlineData(".a { background-image: image-set('https://evil.example/a.png' 1x) }")]
    [InlineData(".a { width: expression(alert(1)) }")]
    [InlineData(".a { behavior: url(x.htc) }")]
    [InlineData(".a { -moz-binding: url(x) }")]
    [InlineData(".a { position: fixed; inset: 0 }")]
    [InlineData(".a { content: '\\3c' }")]
    [InlineData(".a { color: red } </style><script>alert(1)</script>")]
    public void Unsafe_sheets_are_refused(string css) => Assert.NotNull(StudioCss.Check(css, null));

    [Fact]
    public void Long_sheets_are_refused()
    {
        Assert.NotNull(StudioCss.Check(new string('a', 101), 100));
        Assert.Null(StudioCss.Check(new string('a', 100), 100));
    }

    [Fact]
    public async Task The_schema_checks_css_fields()
    {
        var schema = TemplateSchema.Parse("""[ { "key": "studio.css", "type": "css", "label": "Style", "max": 50 } ]""");
        var defaults = new JsonObject { ["studio.css"] = "" };

        var (ok, okErrors) = await schema.ValidateAsync(new JsonObject { ["studio.css"] = ".a { color: red }" }, defaults, _ => Task.FromResult(false));
        Assert.Empty(okErrors);
        Assert.Equal(".a { color: red }", ok!["studio.css"]!.GetValue<string>());

        var (_, bad) = await schema.ValidateAsync(new JsonObject { ["studio.css"] = "@import url(x.css);" }, defaults, _ => Task.FromResult(false));
        Assert.Contains("studio.css", bad.Keys);

        var (_, notText) = await schema.ValidateAsync(new JsonObject { ["studio.css"] = 5 }, defaults, _ => Task.FromResult(false));
        Assert.Contains("studio.css", notText.Keys);
    }
}
