using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Ai;
using Storefront.Application.Ai.Menu;
using Storefront.Application.Ai.Text;
using Storefront.Application.Common;
using Storefront.Application.Templates;
using Storefront.Domain.Billing;
using Storefront.Domain.Businesses;
using Storefront.Domain.Catalog;
using Storefront.Domain.Common;
using Storefront.Domain.Sites;
using Storefront.Domain.Templates;

namespace Storefront.Application.Tests;

public class TemplateAiFieldsTests
{
    private const string Schema = """
        [
          { "key": "theme", "type": "palette", "label": "Color theme", "options": ["cream", "night"], "swatches": { "cream": "#FBF7EE", "night": "#121714" } },
          { "key": "accent", "type": "color", "label": "Accent color", "options": ["#D9542C", "#2B6B4F"], "custom": true },
          { "key": "stamp", "type": "color", "label": "Stamp color", "options": ["#D9542C", "#2B6B4F"] },
          { "key": "font", "type": "choice", "label": "Font style", "group": "Fonts & colors", "options": ["modern", "elegant"], "optionLabels": { "modern": "Modern" } },
          { "key": "corners", "type": "choice", "label": "Corners", "group": "Brand", "options": ["rounded", "sharp"] },
          { "key": "hero.title", "type": "text", "label": "Headline", "max": 20 },
          { "key": "story.text", "type": "textarea", "label": "Our story", "max": 400 },
          { "key": "story.since", "type": "text", "label": "Open since", "max": 4 },
          { "key": "reviews.1.quote", "type": "textarea", "label": "Review 1", "max": 220 },
          { "key": "order.label", "type": "text", "label": "Button text", "max": 28 },
          { "key": "hero.image", "type": "image", "label": "Hero image", "presets": ["counter"] }
        ]
        """;

    private static readonly TemplateSchema Parsed = TemplateSchema.Parse(Schema);

    private static readonly JsonObject Current = (JsonObject)JsonNode.Parse("""
        { "theme": "cream", "accent": "#D9542C", "stamp": "#D9542C", "font": "modern", "corners": "rounded", "hero.title": "Hi",
          "story.text": "", "story.since": "", "reviews.1.quote": "", "order.label": "", "hero.image": "preset:counter" }
        """)!;

    private static List<TemplateField> Allowed() =>
        Parsed.Fields.Where(f => TemplateAiFields.IsDesign(f) || TemplateAiFields.IsCopy(f)).ToList();

    [Fact]
    public void Design_and_copy_fields_come_from_the_schema_types()
    {
        Assert.Equal(["theme", "accent", "stamp", "font", "hero.title", "story.text"], Allowed().Select(f => f.Key));
    }

    [Fact]
    public void The_response_schema_lists_options_swatches_and_lengths()
    {
        var schema = TemplateAiFields.Schema(Allowed(), Parsed.Fields);
        var properties = schema["properties"]!;
        Assert.Equal(["cream", "night"], properties["theme"]!["enum"]!.AsArray().Select(o => o!.GetValue<string>()));
        Assert.Contains("#121714", properties["theme"]!["description"]!.GetValue<string>());
        Assert.Null(properties["accent"]!["enum"]);
        Assert.Contains("Modern", properties["font"]!["description"]!.GetValue<string>());
        Assert.Equal(20, properties["hero.title"]!["maxLength"]!.GetValue<int>());
    }

    [Fact]
    public async Task The_patch_keeps_valid_values_and_drops_the_rest()
    {
        var proposed = JsonNode.Parse("""
            {
              "theme": "NIGHT",
              "accent": "#1f6feb",
              "stamp": "#123456",
              "font": "comic",
              "corners": "sharp",
              "hero.title": "<h1>Bread</h1> **baked** daily before sunrise",
              "story.text": "Line one\n\n  Line two",
              "story.since": "1999",
              "reviews.1.quote": "Amazing",
              "hero.image": "https://evil.example/x.png",
              "nope": "x",
              "story.text2": 4
            }
            """);

        var patch = await TemplateAiFields.ToPatchAsync(Parsed, Allowed(), proposed, Current);

        Assert.Equal("night", patch["theme"]!.GetValue<string>());
        Assert.Equal("#1F6FEB", patch["accent"]!.GetValue<string>());
        Assert.Equal("Bread baked daily", patch["hero.title"]!.GetValue<string>());
        Assert.Equal("Line one\nLine two", patch["story.text"]!.GetValue<string>());
        Assert.Equal(["theme", "accent", "hero.title", "story.text"], patch.Select(p => p.Key));
    }

    [Fact]
    public async Task Anything_but_an_object_gives_an_empty_patch()
    {
        Assert.Empty(await TemplateAiFields.ToPatchAsync(Parsed, Allowed(), JsonNode.Parse("[1, 2]"), Current));
        Assert.Empty(await TemplateAiFields.ToPatchAsync(Parsed, Allowed(), null, Current));
    }
}

public class MenuDraftTests
{
    [Fact]
    public void Categories_merge_and_bad_values_are_dropped()
    {
        var answer = JsonNode.Parse("""
            {
              "categories": [
                { "name": "Hot drinks", "nameAr": "مشروبات ساخنة", "products": [
                  { "name": "Turkish coffee", "nameAr": "قهوة تركية", "price": 1.2345 },
                  { "name": "Tea", "price": -1 },
                  { "name": "  ", "price": 2 },
                  { "nameAr": "سحلب", "price": "2.5" }
                ] },
                { "name": "HOT DRINKS", "products": [ { "name": "<b>Mocha</b>", "description": "Rich `chocolate`", "price": 1e12 } ] },
                { "name": "Nothing here", "products": [] },
                { "products": [ { "name": "Orphan", "price": 1 } ] },
                "not an object"
              ]
            }
            """);

        var category = Assert.Single(MenuDraftParse(answer, "JOD"));
        Assert.Equal("Hot drinks", category.Name);
        Assert.Equal("مشروبات ساخنة", category.NameAr);
        Assert.Equal(["Turkish coffee", "Tea", "سحلب", "Mocha"], category.Products.Select(p => p.Name));
        Assert.Equal([1.235m, null, 2.5m, null], category.Products.Select(p => p.Price));
        Assert.Null(category.Products[2].NameAr);
        Assert.Equal("Rich chocolate", category.Products[3].Description);
    }

    [Fact]
    public void Names_are_cut_to_the_catalog_limits_and_counts_are_capped()
    {
        var products = new JsonArray(Enumerable.Range(0, 400).Select(i => (JsonNode)new JsonObject { ["name"] = new string('x', 100) + i, ["price"] = 3.5 }).ToArray());
        var categories = new JsonArray(Enumerable.Range(0, 40).Select(i => (JsonNode)new JsonObject { ["name"] = $"Category {i}", ["products"] = products.DeepClone() }).ToArray());

        var parsed = MenuDraftParse(new JsonObject { ["categories"] = categories }, "JPY");

        Assert.Equal(ReadMenuHandler.MaxProducts, parsed.Sum(c => c.Products.Count));
        Assert.All(parsed.SelectMany(c => c.Products), p => Assert.True(p.Name.Length <= Product.NameMax));
        Assert.Equal(4m, parsed[0].Products[0].Price);
    }

    private static IReadOnlyList<MenuDraftCategory> MenuDraftParse(JsonNode? answer, string currency) => ReadMenuHandler.Parse(answer, currency);
}

public class WriteTextHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 20, 9, 0, 0, TimeSpan.Zero);

    private const string Schema = """
        [ { "key": "hero.title", "type": "text", "label": "Headline", "max": 40 }, { "key": "accent", "type": "color", "label": "Accent", "options": ["#D9542C"] } ]
        """;

    private sealed class Fixture
    {
        public readonly Business Business = Business.Create(Guid.CreateVersion7(), "Vanilla Café", Slug.FromStorage("vanilla"), Now);
        public readonly FakeAssistant Assistant = new();
        public readonly FakeUsage Usage = new();
        public readonly List<Product> Products = [];

        public WriteTextHandler Handler(string plan = Plan.Basic, SubscriptionStatus status = SubscriptionStatus.Active)
        {
            var template = Template.Create("souq", 1, "Souq", "Café", null, null, Schema, """{ "hero.title": "Coffee", "accent": "#D9542C" }""", 1);
            var site = Site.Create(Business.Id, "souq", template.DefaultSettings, Now);
            var user = new FakeUser(Business.Id);
            var billing = new FakeBilling(Subscription.Start(Business.Id, plan, status, "fake", null, null));
            var options = Options.Create(new AiOptions { MonthlyLimit = new(StringComparer.OrdinalIgnoreCase) { ["basic"] = 2, ["pro"] = 5 } });
            var quota = new AiQuotaChecker(Assistant, Usage, billing, user, options, new FixedClock());
            return new WriteTextHandler(new WriteTextValidator(), quota, Assistant, new FakeBusinesses(Business), new FakeSites(site), new FakeTemplates(template), new FakeCatalog(Products));
        }
    }

    [Fact]
    public async Task A_good_answer_is_checked_and_counted_once()
    {
        var f = new Fixture();
        var latte = Product.Create(f.Business.Id, Guid.CreateVersion7(), new ProductDetails("Latte", null, 3), "USD", 0, Now);
        f.Products.Add(latte);
        f.Assistant.Answer = JsonNode.Parse("""
            { "settings": { "hero.title": "Your corner for slow coffee", "accent": "#000000" },
              "products": [ { "ref": "p1", "description": "Espresso and silky milk" }, { "ref": "p1", "description": "Twice" }, { "ref": "p7", "description": "Not real" } ] }
            """)!;

        var result = await f.Handler().Handle(new WriteText("Slow coffee", "en"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Your corner for slow coffee", result.Value.Settings.GetProperty("hero.title").GetString());
        Assert.False(result.Value.Settings.TryGetProperty("accent", out _));
        Assert.Equal([(latte.Id, "Espresso and silky milk")], result.Value.ProductDescriptions.Select(d => (d.ProductId, d.Description)));
        Assert.Equal(1, f.Usage.Count);
        Assert.Equal(1, result.Value.RemainingThisMonth);
        Assert.Contains("English", f.Assistant.Requests.Single().Instructions);
    }

    [Fact]
    public async Task An_unusable_or_failed_answer_is_free()
    {
        var f = new Fixture();
        f.Assistant.Answer = JsonNode.Parse("""{ "settings": { "accent": "#000000" } }""")!;
        Assert.Equal("ai.failed", (await f.Handler().Handle(new WriteText(null), CancellationToken.None)).Error?.Code);

        f.Assistant.Answer = AiErrors.Busy;
        Assert.Equal("ai.busy", (await f.Handler().Handle(new WriteText(null), CancellationToken.None)).Error?.Code);
        Assert.Equal(0, f.Usage.Count);
    }

    [Fact]
    public async Task The_monthly_allowance_follows_the_plan_and_trials_get_Basic()
    {
        var f = new Fixture();
        f.Usage.Count = 2;
        Assert.Equal("ai.limit", (await f.Handler().Handle(new WriteText(null), CancellationToken.None)).Error?.Code);
        Assert.Equal("ai.limit", (await f.Handler(Plan.Pro, SubscriptionStatus.Trialing).Handle(new WriteText(null), CancellationToken.None)).Error?.Code);
        Assert.True((await f.Handler(Plan.Pro).Handle(new WriteText(null), CancellationToken.None)).IsSuccess);
    }

    [Fact]
    public async Task Switched_off_means_503_without_asking_the_model()
    {
        var f = new Fixture();
        f.Assistant.Available = false;
        Assert.Equal("ai.unavailable", (await f.Handler().Handle(new WriteText(null), CancellationToken.None)).Error?.Code);
        Assert.Empty(f.Assistant.Requests);
    }

    [Fact]
    public async Task Notes_and_languages_are_validated()
    {
        var f = new Fixture();
        var result = await f.Handler().Handle(new WriteText(new string('a', 301), "fr"), CancellationToken.None);
        Assert.Equal(["note", "language"], result.Error!.Fields!.Keys);
    }

    internal sealed class FakeAssistant : IAiAssistant
    {
        public bool Available { get; set; } = true;

        public Result<JsonNode> Answer { get; set; } = JsonNode.Parse("""{ "settings": { "hero.title": "Fresh" } }""")!;

        public List<AiRequest> Requests { get; } = [];

        public bool IsAvailable => Available;

        public Task<Result<JsonNode>> GenerateAsync(AiRequest request, CancellationToken ct)
        {
            Requests.Add(request);
            return Task.FromResult(Answer);
        }
    }

    internal sealed class FakeUsage : IAiUsageRepository
    {
        public int Count { get; set; }

        public Task<int> CountAsync(Guid businessId, string period, CancellationToken ct) => Task.FromResult(period == "2026-10" ? Count : 0);

        public Task IncrementAsync(Guid businessId, string period, DateTimeOffset now, CancellationToken ct)
        {
            Count++;
            return Task.CompletedTask;
        }
    }

    private sealed class FixedClock : IClock
    {
        public DateTimeOffset UtcNow => Now;
    }

    private sealed class FakeUser(Guid businessId) : ICurrentUser
    {
        public Guid? UserId => Guid.Empty;

        public Guid? BusinessId => businessId;

        public bool IsStaff => false;
    }

    private sealed class FakeBilling(Subscription subscription) : IBillingRepository
    {
        public Task<IReadOnlyList<Plan>> ListPlansAsync(CancellationToken ct) => throw new NotSupportedException();

        public Task<Plan?> GetPlanAsync(string code, CancellationToken ct) => throw new NotSupportedException();

        public Task<Subscription?> GetSubscriptionAsync(Guid businessId, CancellationToken ct) => Task.FromResult<Subscription?>(subscription);

        public void Add(Plan plan) => throw new NotSupportedException();

        public void Add(Subscription subscription) => throw new NotSupportedException();
    }

    private sealed class FakeBusinesses(Business business) : IBusinessRepository
    {
        public Task<Business?> GetAsync(Guid id, CancellationToken ct) => Task.FromResult<Business?>(id == business.Id ? business : null);

        public Task<Business?> GetByOwnerAsync(Guid ownerUserId, CancellationToken ct) => throw new NotSupportedException();

        public Task<Business?> FindBySlugAsync(string slug, CancellationToken ct) => throw new NotSupportedException();

        public Task<bool> SlugExistsAsync(string slug, CancellationToken ct) => throw new NotSupportedException();

        public void Add(Business business) => throw new NotSupportedException();
    }

    private sealed class FakeSites(Site site) : ISiteRepository
    {
        public Task<Site?> GetForCurrentBusinessAsync(CancellationToken ct) => Task.FromResult<Site?>(site);

        public Task<Site?> GetByBusinessIdAsync(Guid businessId, CancellationToken ct) => throw new NotSupportedException();

        public void Add(Site site) => throw new NotSupportedException();
    }

    private sealed class FakeTemplates(Template template) : ITemplateRepository
    {
        public Task<IReadOnlyList<Template>> ListAsync(bool activeOnly, CancellationToken ct) => throw new NotSupportedException();

        public Task<Template?> GetAsync(string id, CancellationToken ct) => Task.FromResult<Template?>(id == template.Id ? template : null);

        public void Add(Template template) => throw new NotSupportedException();
    }

    private sealed class FakeCatalog(List<Product> products) : ICatalogRepository
    {
        public Task<IReadOnlyList<Category>> ListCategoriesAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<Category>>([]);

        public Task<IReadOnlyList<Product>> ListProductsAsync(Guid? categoryId, CancellationToken ct) => Task.FromResult<IReadOnlyList<Product>>(products);

        public Task<Category?> GetCategoryAsync(Guid id, CancellationToken ct) => throw new NotSupportedException();

        public Task<IReadOnlyList<Category>> ListSubcategoriesAsync(Guid parentId, CancellationToken ct) => throw new NotSupportedException();

        public Task<bool> CategoryNameExistsAsync(string name, Guid? exceptId, CancellationToken ct) => throw new NotSupportedException();

        public Task<IReadOnlyList<Product>> SearchProductsAsync(Guid? categoryId, string? text, CancellationToken ct) => throw new NotSupportedException();

        public Task<IReadOnlyDictionary<Guid, int>> CountProductsByCategoryAsync(CancellationToken ct) => throw new NotSupportedException();

        public Task<int> NextCategorySortOrderAsync(CancellationToken ct) => throw new NotSupportedException();

        public Task<int> NextProductSortOrderAsync(Guid categoryId, CancellationToken ct) => throw new NotSupportedException();

        public Task<Product?> GetProductAsync(Guid id, CancellationToken ct) => throw new NotSupportedException();

        public Task<int> CountProductsAsync(Guid categoryId, CancellationToken ct) => throw new NotSupportedException();

        public void Add(Category category) => throw new NotSupportedException();

        public void Add(Product product) => throw new NotSupportedException();

        public void Remove(Category category) => throw new NotSupportedException();

        public void Remove(Product product) => throw new NotSupportedException();
    }
}
