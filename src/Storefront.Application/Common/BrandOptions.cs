namespace Storefront.Application.Common;

/// <summary>
/// Brand values from brand.json (section "Brand"). The only source of the product's public name,
/// domains, emails, colors and fonts. Environment variables such as Brand__Domain override them.
/// </summary>
public sealed class BrandOptions
{
    public const string SectionName = "Brand";

    public string BrandName { get; set; } = "";
    public string BrandShortName { get; set; } = "";
    public string BrandNameAr { get; set; } = "";
    public string Tagline { get; set; } = "";
    public string Domain { get; set; } = "";
    public string ApiHost { get; set; } = "";
    public string AdminHost { get; set; } = "";
    public string CustomDomainTarget { get; set; } = "";
    public string SupportEmail { get; set; } = "";
    public string NoReplyEmail { get; set; } = "";
    public string AppId { get; set; } = "";
    public string ColorPrimary { get; set; } = "";
    public string ColorPrimary2 { get; set; } = "";
    public string ColorAccent { get; set; } = "";
    public string ColorHighlight { get; set; } = "";
    public string ColorPaper { get; set; } = "";
    public string ColorInk { get; set; } = "";
    public string ColorMuted { get; set; } = "";
    public string ColorLine { get; set; } = "";
    public string FontDisplay { get; set; } = "";
    public string FontBody { get; set; } = "";
    public string FontArabic { get; set; } = "";
}
