using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using FluentValidation;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Domain.Businesses;
using Storefront.Domain.Catalog;
using Storefront.Domain.Common;

namespace Storefront.Application.Ai.Menu;

/// <summary>
/// 1 to 3 photos of a printed menu, price list or product shelf, an optional note and the language for descriptions
/// ("en" or "ar"; the site's language when empty). Names always come in both languages.
/// </summary>
public sealed record ReadMenu(IReadOnlyList<AiPhoto> Photos, string? Note, string? Language = null);

/// <summary>
/// A draft the owner reviews before anything is saved (then <c>POST /api/v1/catalog/import</c>). Names come in English and
/// Arabic (as printed, or translated); the app shows the one in the site's language. <see cref="Price"/> is in the business
/// currency, rounded to its decimals, or null when the photo shows none.
/// </summary>
public sealed record MenuDraftProduct(string Name, string? NameAr, string? Description, decimal? Price);

public sealed record MenuDraftCategory(string Name, string? NameAr, IReadOnlyList<MenuDraftProduct> Products);

/// <param name="CurrencyCode">The business currency the prices are in.</param>
/// <param name="MenuCurrency">The currency printed on the menu when the model saw one; the app can warn when it differs.</param>
public sealed record MenuDraftDto(string CurrencyCode, string? MenuCurrency, IReadOnlyList<MenuDraftCategory> Categories, int RemainingThisMonth);

public sealed class ReadMenuValidator : AbstractValidator<ReadMenu>
{
    public ReadMenuValidator()
    {
        RuleFor(x => x.Photos).Must(p => p is { Count: >= 1 and <= ReadMenuHandler.MaxPhotos }).WithMessage("Add 1 to 3 photos.").OverridePropertyName("files");
        RuleFor(x => x.Note).ValidNote();
        RuleFor(x => x.Language).Must(l => string.IsNullOrEmpty(l) || Business.Locales.Contains(l)).WithMessage("Language must be en or ar.");
    }
}

public sealed class ReadMenuHandler(IValidator<ReadMenu> validator, AiQuotaChecker quota, IAiAssistant assistant, IImageOptimizer optimizer, IBusinessRepository businesses)
{
    public const int MaxPhotos = 3;
    public const int MaxCategories = 30;
    public const int MaxProducts = 300;

    public async Task<Result<MenuDraftDto>> Handle(ReadMenu cmd, CancellationToken ct)
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

        var business = await businesses.GetAsync(businessId, ct);
        if (business is null)
        {
            return AiErrors.NoBusiness;
        }

        var images = new List<AiImage>();
        foreach (var photo in cmd.Photos)
        {
            var image = await AiPhotos.PrepareAsync(optimizer, photo, AiPhotos.MenuSide, ct);
            if (!image.IsSuccess)
            {
                return image.Error!;
            }

            images.Add(image.Value);
        }

        var input = new StringBuilder();
        input.AppendLine($"Business name: {business.Name}");
        input.AppendLine($"Prices on the website are in {business.CurrencyCode}");
        if (!string.IsNullOrWhiteSpace(cmd.Note))
        {
            input.AppendLine($"Owner's note: {cmd.Note.Trim()}");
        }

        var request = new AiRequest(AiTask.MenuFromPhotos, AiPrompts.Menu(AiSite.LanguageName(string.IsNullOrEmpty(cmd.Language) ? business.Locale : cmd.Language)), input.ToString(), images, Schema(), Temperature: 0.1);
        var answer = await assistant.GenerateAsync(request, ct);
        if (!answer.IsSuccess)
        {
            return answer.Error!;
        }

        var categories = Parse(answer.Value, business.CurrencyCode);
        if (categories.Count == 0)
        {
            return AiErrors.NothingFound;
        }

        var menuCurrency = AiText.Clean(AiText.Field(answer.Value, "currency"), 3)?.ToUpperInvariant();
        var remaining = await quota.RecordAsync(businessId, ct);
        return new MenuDraftDto(business.CurrencyCode, menuCurrency is { Length: 3 } && menuCurrency.All(char.IsAsciiLetterUpper) ? menuCurrency : null, categories, remaining);
    }

    /// <summary>
    /// The model's categories and products, cleaned: names cut to the catalog's limits, prices 0 or more in the business
    /// currency, empty entries dropped, categories with the same name merged, at most 30 categories and 300 products.
    /// </summary>
    public static IReadOnlyList<MenuDraftCategory> Parse(JsonNode? answer, string currencyCode)
    {
        var merged = new List<(string Key, string Name, string? NameAr, List<MenuDraftProduct> Products)>();
        var total = 0;
        if (AiText.Field(answer, "categories") is not JsonArray categories)
        {
            return [];
        }

        foreach (var node in categories)
        {
            var name = AiText.Clean(AiText.Field(node, "name"), Category.NameMax);
            var nameAr = AiText.Clean(AiText.Field(node, "nameAr"), Category.NameMax);
            if ((name ?? nameAr) is not { } shown || AiText.Field(node, "products") is not JsonArray items)
            {
                continue;
            }

            var key = shown.ToLowerInvariant();
            var index = merged.FindIndex(c => c.Key == key);
            if (index < 0)
            {
                if (merged.Count == MaxCategories)
                {
                    continue;
                }

                merged.Add((key, shown, name is null ? null : nameAr, []));
                index = merged.Count - 1;
            }

            foreach (var item in items)
            {
                if (total == MaxProducts)
                {
                    break;
                }

                var productName = AiText.Clean(AiText.Field(item, "name"), Product.NameMax);
                var productNameAr = AiText.Clean(AiText.Field(item, "nameAr"), Product.NameMax);
                if ((productName ?? productNameAr) is not { } productShown)
                {
                    continue;
                }

                merged[index].Products.Add(new MenuDraftProduct(
                    productShown,
                    productName is null ? null : productNameAr,
                    AiText.Clean(AiText.Field(item, "description"), Product.DescriptionMax),
                    Price(AiText.Field(item, "price"), currencyCode)));
                total++;
            }
        }

        return merged.Where(c => c.Products.Count > 0).Select(c => new MenuDraftCategory(c.Name, c.NameAr, c.Products)).ToList();
    }

    /// <summary>A price of 0 or more (a number, or text like "3.50"), rounded to the currency's decimals; null for anything else.</summary>
    private static decimal? Price(JsonNode? node, string currencyCode)
    {
        decimal? value = node switch
        {
            JsonValue v when v.GetValueKind() == JsonValueKind.Number && v.TryGetValue<decimal>(out var number) => number,
            JsonValue v when v.TryGetValue<double>(out var real) && double.IsFinite(real) && Math.Abs(real) < 1e15 => (decimal)real,
            JsonValue v when v.TryGetValue<string>(out var text)
                && decimal.TryParse(text.Trim().Replace(",", ".", StringComparison.Ordinal), NumberStyles.Number, CultureInfo.InvariantCulture, out var parsed) => parsed,
            _ => null,
        };

        return value is { } price and >= 0 and <= Product.PriceMax ? Money.Round(price, currencyCode) : null;
    }

    private static JsonObject Schema()
    {
        static JsonObject Text(int max, string description) =>
            new() { ["type"] = "string", ["maxLength"] = max, ["description"] = description };

        var product = new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["name"] = Text(Product.NameMax, "English name"),
                ["nameAr"] = Text(Product.NameMax, "Arabic name"),
                ["description"] = Text(Product.DescriptionMax, "Only what the menu says about it, in the website's language"),
                ["price"] = new JsonObject { ["type"] = "number", ["minimum"] = 0, ["description"] = "Printed price, as a number" },
            },
            ["required"] = new JsonArray("name", "nameAr"),
        };
        var category = new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["name"] = Text(Category.NameMax, "English name"),
                ["nameAr"] = Text(Category.NameMax, "Arabic name"),
                ["products"] = new JsonObject { ["type"] = "array", ["items"] = product, ["maxItems"] = MaxProducts },
            },
            ["required"] = new JsonArray("name", "nameAr", "products"),
        };
        return new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["currency"] = Text(3, "ISO code of the currency printed on the menu"),
                ["categories"] = new JsonObject { ["type"] = "array", ["items"] = category, ["maxItems"] = MaxCategories },
            },
            ["required"] = new JsonArray("categories"),
        };
    }
}
