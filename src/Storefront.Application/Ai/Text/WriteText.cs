using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using FluentValidation;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Domain.Businesses;
using Storefront.Domain.Catalog;

namespace Storefront.Application.Ai.Text;

/// <summary>
/// An optional note ("cosy family café, known for knafeh") and the language to write in ("en" or "ar"; the site's language
/// when empty). With <see cref="IncludeProducts"/>, products without a description get one suggested.
/// </summary>
public sealed record WriteText(string? Note, string? Language = null, bool IncludeProducts = true);

public sealed record ProductDescriptionDto(Guid ProductId, string Description);

/// <summary>Suggested values for the template's text settings, and descriptions for products that have none. Nothing is saved.</summary>
public sealed record TextSuggestionDto(JsonElement Settings, IReadOnlyList<ProductDescriptionDto> ProductDescriptions, int RemainingThisMonth);

public sealed class WriteTextValidator : AbstractValidator<WriteText>
{
    public WriteTextValidator()
    {
        RuleFor(x => x.Note).ValidNote();
        RuleFor(x => x.Language).Must(l => string.IsNullOrEmpty(l) || Business.Locales.Contains(l)).WithMessage("Language must be en or ar.");
    }
}

public sealed class WriteTextHandler(
    IValidator<WriteText> validator,
    AiQuotaChecker quota,
    IAiAssistant assistant,
    IBusinessRepository businesses,
    ISiteRepository sites,
    ITemplateRepository templates,
    ICatalogRepository catalog)
{
    /// <summary>Products sent for descriptions in one go; the rest can be done with another request.</summary>
    public const int MaxProducts = 40;

    /// <summary>Product and category names the model sees for context.</summary>
    private const int ContextNames = 80;

    public async Task<Result<TextSuggestionDto>> Handle(WriteText cmd, CancellationToken ct)
    {
        if (await validator.CheckAsync(cmd, ct) is { } invalid)
        {
            return invalid;
        }

        var (businessId, refused) = await quota.BeginAsync(ct);
        if (refused is not null)
        {
            return refused;
        }

        var loaded = await AiSite.LoadAsync(businessId, businesses, sites, templates, ct);
        if (!loaded.IsSuccess)
        {
            return loaded.Error!;
        }

        var site = loaded.Value;
        var fields = site.Schema.Fields.Where(TemplateAiFields.IsCopy).ToList();
        var categories = await catalog.ListCategoriesAsync(ct);
        var products = await catalog.ListProductsAsync(null, ct);
        var needDescription = cmd.IncludeProducts ? products.Where(p => string.IsNullOrWhiteSpace(p.Description)).Take(MaxProducts).ToList() : [];
        if (fields.Count == 0 && needDescription.Count == 0)
        {
            return AiErrors.Failed;
        }

        // The model sees short references (p1, p2...) instead of ids, so it cannot point at another business's product.
        var refs = needDescription.Select((p, i) => (Ref: $"p{i + 1}", Product: p)).ToDictionary(x => x.Ref, x => x.Product);
        var language = string.IsNullOrEmpty(cmd.Language) ? site.Locale : cmd.Language;
        var answer = await assistant.GenerateAsync(Request(site, fields, categories, products, refs, language, cmd.Note), ct);
        if (!answer.IsSuccess)
        {
            return answer.Error!;
        }

        var patch = await TemplateAiFields.ToPatchAsync(site.Schema, fields, AiText.Field(answer.Value, "settings"), site.Current);
        var descriptions = new List<ProductDescriptionDto>();
        if (AiText.Field(answer.Value, "products") is JsonArray items)
        {
            foreach (var item in items)
            {
                if (AiText.Clean(AiText.Field(item, "ref"), 8) is { } key && refs.TryGetValue(key, out var product)
                    && descriptions.All(d => d.ProductId != product.Id)
                    && AiText.Clean(AiText.Field(item, "description"), Product.DescriptionMax) is { } description)
                {
                    descriptions.Add(new ProductDescriptionDto(product.Id, description));
                }
            }
        }

        if (patch.Count == 0 && descriptions.Count == 0)
        {
            return AiErrors.Failed;
        }

        var remaining = await quota.RecordAsync(businessId, ct);
        return new TextSuggestionDto(JsonDocument.Parse(patch.ToJsonString()).RootElement.Clone(), descriptions, remaining);
    }

    private static AiRequest Request(
        AiSite site,
        IReadOnlyList<Templates.TemplateField> fields,
        IReadOnlyList<Category> categories,
        IReadOnlyList<Product> products,
        IReadOnlyDictionary<string, Product> refs,
        string language,
        string? note)
    {
        var input = new StringBuilder();
        site.Describe(input, language);
        if (!string.IsNullOrWhiteSpace(note))
        {
            input.AppendLine($"Owner's note: {note.Trim()}");
        }

        if (categories.Count > 0)
        {
            input.AppendLine($"Menu categories: {string.Join(", ", categories.Take(ContextNames).Select(c => c.Name))}");
        }

        if (products.Count > 0)
        {
            input.AppendLine($"Some products: {string.Join(", ", products.Take(ContextNames).Select(p => p.Name))}");
        }

        input.AppendLine("Current texts (often still the template's sample texts about another business):");
        foreach (var field in fields)
        {
            input.AppendLine($"- {field.Key}: {site.Current[field.Key]?.ToJsonString() ?? "(empty)"}");
        }

        if (refs.Count > 0)
        {
            input.AppendLine("Products without a description:");
            foreach (var (key, product) in refs)
            {
                input.AppendLine($"- {key}: {product.Name}");
            }
        }

        var properties = new JsonObject { ["settings"] = TemplateAiFields.Schema(fields, site.Schema.Fields) };
        if (refs.Count > 0)
        {
            properties["products"] = new JsonObject
            {
                ["type"] = "array",
                ["maxItems"] = refs.Count,
                ["items"] = new JsonObject
                {
                    ["type"] = "object",
                    ["properties"] = new JsonObject
                    {
                        ["ref"] = new JsonObject { ["type"] = "string", ["enum"] = new JsonArray(refs.Keys.Select(k => (JsonNode)k).ToArray()) },
                        ["description"] = new JsonObject { ["type"] = "string", ["maxLength"] = Product.DescriptionMax },
                    },
                    ["required"] = new JsonArray("ref", "description"),
                },
            };
        }

        var schema = new JsonObject { ["type"] = "object", ["properties"] = properties, ["required"] = new JsonArray("settings") };
        return new AiRequest(AiTask.WriteText, AiPrompts.Text(AiSite.LanguageName(language)), input.ToString(), [], schema, Temperature: 0.7);
    }
}
