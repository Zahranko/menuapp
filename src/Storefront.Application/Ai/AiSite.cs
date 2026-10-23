using System.Text;
using System.Text.Json.Nodes;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Application.Common.Localization;
using Storefront.Application.Templates;
using Storefront.Domain.Businesses;
using Storefront.Domain.Templates;

namespace Storefront.Application.Ai;

/// <summary>
/// The business, its current template and the settings the editor starts from (template defaults in the site's language,
/// then the saved draft): what the design and text helpers write for.
/// </summary>
public sealed record AiSite(Business Business, Template Template, TemplateSchema Schema, JsonObject Current)
{
    public string Locale => Business.Locale;

    /// <summary>The language name the model writes in.</summary>
    public static string LanguageName(string? locale) => Messages.IsArabic(locale) ? "Arabic" : "English";

    /// <summary>What the model knows about the business: name, kind (the template's category) and the site's language.</summary>
    public void Describe(StringBuilder input, string language)
    {
        input.AppendLine($"Business name: {Business.Name}");
        input.AppendLine($"Kind of business (from the chosen template): {Template.Category}");
        input.AppendLine($"Website language: {LanguageName(language)}");
    }

    public static async Task<Result<AiSite>> LoadAsync(
        Guid businessId, IBusinessRepository businesses, ISiteRepository sites, ITemplateRepository templates, CancellationToken ct)
    {
        var business = await businesses.GetAsync(businessId, ct);
        var site = await sites.GetForCurrentBusinessAsync(ct);
        if (business is null || site is null)
        {
            return Error.NotFound("site.notFound", "Site not found.");
        }

        var template = await templates.GetAsync(site.TemplateId, ct);
        if (template is null)
        {
            return Error.Validation("template.notFound", "Choose a template from the gallery.", "templateId");
        }

        var current = TemplateDefaults.For(template, business.Locale);
        if (JsonNode.Parse(site.DraftSettings) is JsonObject draft)
        {
            foreach (var (key, value) in draft)
            {
                current[key] = value?.DeepClone();
            }
        }

        return new AiSite(business, template, TemplateSchema.Parse(template.SettingsSchema), current);
    }
}
