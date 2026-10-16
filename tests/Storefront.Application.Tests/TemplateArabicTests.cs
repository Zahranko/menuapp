using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Billing;
using Storefront.Application.Common;
using Storefront.Application.Sites;
using Storefront.Application.Templates;
using Storefront.Domain.Billing;
using Storefront.Domain.Businesses;
using Storefront.Domain.Common;
using Storefront.Domain.Sites;
using Storefront.Domain.Templates;

namespace Storefront.Application.Tests;

public class TemplateArabicTests
{
    private const string Schema = """
        [
          { "key": "headline", "type": "text", "label": "Headline", "labelAr": "العنوان", "group": "Hero", "groupAr": "الواجهة", "max": 40 },
          { "key": "tagline", "type": "text", "label": "Tagline", "labelAr": "الشعار", "max": 60 },
          { "key": "font", "type": "choice", "label": "Font", "options": ["modern", "elegant"], "optionLabelsAr": { "modern": "عصري", "elegant": "أنيق" } }
        ]
        """;

    private const string Defaults = """{ "headline": "Fresh every morning", "tagline": "Coffee and pastries", "font": "modern" }""";
    private const string DefaultsAr = """{ "headline": "طازج كل صباح" }""";

    private static Template NewTemplate(string id = "souq")
    {
        var template = Template.Create(id, 1, "Souq", "Cafe", "A warm cafe menu.", null, Schema, Defaults, 1);
        template.SetArabic("سوق", "مقهى", "منيو دافئ للمقاهي.", DefaultsAr);
        return template;
    }

    [Fact]
    public void Arabic_defaults_replace_matching_top_level_keys()
    {
        var settings = TemplateDefaults.For(NewTemplate(), "ar");
        Assert.Equal("طازج كل صباح", settings["headline"]!.GetValue<string>());
        Assert.Equal("Coffee and pastries", settings["tagline"]!.GetValue<string>());
        Assert.Equal("modern", settings["font"]!.GetValue<string>());
    }

    [Fact]
    public void English_businesses_get_the_defaults_unchanged() =>
        Assert.Equal(Defaults, TemplateDefaults.JsonFor(NewTemplate(), "en"));

    [Fact]
    public void Arabic_json_keeps_Arabic_letters_readable() =>
        Assert.Contains("طازج كل صباح", TemplateDefaults.JsonFor(NewTemplate(), "ar"));

    [Fact]
    public async Task Arabic_defaults_are_checked_against_the_schema()
    {
        var arabic = new JsonObject { ["headline"] = "طازج كل صباح", ["tagline"] = new string('ن', 61), ["font"] = "comic", ["nope"] = "x" };
        var (valid, errors) = await TemplateDefaults.CheckArabicAsync(Schema, Defaults, arabic);
        Assert.Equal(["headline"], valid.Select(p => p.Key));
        Assert.Equal(["font", "nope", "tagline"], errors.Keys.Order());
    }

    [Fact]
    public void Dto_carries_the_Arabic_texts_and_the_raw_schema()
    {
        var dto = TemplateDto.From(NewTemplate());
        Assert.Equal(new TemplateArabicDto("سوق", "مقهى", "منيو دافئ للمقاهي."), dto.Ar);
        Assert.Equal("طازج كل صباح", dto.DefaultsAr.GetProperty("headline").GetString());

        var first = dto.Schema[0];
        Assert.Equal("العنوان", first.GetProperty("labelAr").GetString());
        Assert.Equal("الواجهة", first.GetProperty("groupAr").GetString());
        Assert.Equal("أنيق", dto.Schema[2].GetProperty("optionLabelsAr").GetProperty("elegant").GetString());
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(Schema), JsonNode.Parse(dto.Schema.GetRawText())));
    }

    [Fact]
    public void Dto_without_Arabic_has_null_ar_and_empty_defaults()
    {
        var dto = TemplateDto.From(Template.Create("plain", 2, "Plain", "Shop", null, null, Schema, Defaults, 1));
        Assert.Null(dto.Ar);
        Assert.Equal(JsonValueKind.Object, dto.DefaultsAr.ValueKind);
        Assert.Empty(dto.DefaultsAr.EnumerateObject());
    }

    [Theory]
    [InlineData("ar", "طازج كل صباح")]
    [InlineData("en", "Fresh every morning")]
    public async Task Choosing_a_template_starts_from_defaults_in_the_business_language(string locale, string headline)
    {
        var business = Business.Create(Guid.CreateVersion7(), "Olive Cafe", Slug.Create("olivecafe", new HashSet<string>()), DateTimeOffset.UtcNow, locale);
        var site = Site.Create(business.Id, "other", "{}", DateTimeOffset.UtcNow);
        var user = new FakeUser(business.Id);
        var links = new SiteLinks(Options.Create(new BrandOptions()), Options.Create(new StorefrontOptions()));
        var handler = new ChangeTemplateHandler(
            new SiteContext(new FakeSites(site), new FakeBusinesses(business), user, links),
            new FakeTemplates(NewTemplate()),
            new ProPlanChecker(new FakeBilling()),
            user,
            new FakeUnitOfWork(),
            new FakeAudit(),
            new FakeClock());

        var result = await handler.Handle(new ChangeTemplate("souq"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("souq", site.TemplateId);
        var draft = JsonNode.Parse(site.DraftSettings)!;
        Assert.Equal(headline, draft["headline"]!.GetValue<string>());
        Assert.Equal("Coffee and pastries", draft["tagline"]!.GetValue<string>());
        if (locale == "en")
        {
            Assert.Equal(Defaults, site.DraftSettings);
        }
    }

    private sealed class FakeUser(Guid businessId) : ICurrentUser
    {
        public Guid? UserId => Guid.Empty;
        public Guid? BusinessId => businessId;
        public bool IsStaff => false;
    }

    private sealed class FakeSites(Site site) : ISiteRepository
    {
        public Task<Site?> GetForCurrentBusinessAsync(CancellationToken ct) => Task.FromResult<Site?>(site);
        public Task<Site?> GetByBusinessIdAsync(Guid businessId, CancellationToken ct) => Task.FromResult<Site?>(site);
        public void Add(Site s) => throw new NotSupportedException();
    }

    private sealed class FakeBusinesses(Business business) : IBusinessRepository
    {
        public Task<Business?> GetAsync(Guid id, CancellationToken ct) => Task.FromResult<Business?>(id == business.Id ? business : null);
        public Task<Business?> GetByOwnerAsync(Guid ownerUserId, CancellationToken ct) => Task.FromResult<Business?>(business);
        public Task<Business?> FindBySlugAsync(string slug, CancellationToken ct) => Task.FromResult<Business?>(business);
        public Task<bool> SlugExistsAsync(string slug, CancellationToken ct) => Task.FromResult(false);
        public void Add(Business b) => throw new NotSupportedException();
    }

    private sealed class FakeTemplates(Template template) : ITemplateRepository
    {
        public Task<IReadOnlyList<Template>> ListAsync(bool activeOnly, CancellationToken ct) => Task.FromResult<IReadOnlyList<Template>>([template]);
        public Task<Template?> GetAsync(string id, CancellationToken ct) => Task.FromResult<Template?>(id == template.Id ? template : null);
        public void Add(Template t) => throw new NotSupportedException();
    }

    private sealed class FakeBilling : IBillingRepository
    {
        public Task<IReadOnlyList<Plan>> ListPlansAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<Plan>>([]);
        public Task<Plan?> GetPlanAsync(string code, CancellationToken ct) => Task.FromResult<Plan?>(null);
        public Task<Subscription?> GetSubscriptionAsync(Guid businessId, CancellationToken ct) => Task.FromResult<Subscription?>(null);
        public void Add(Plan plan) => throw new NotSupportedException();
        public void Add(Subscription subscription) => throw new NotSupportedException();
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        public Task SaveChangesAsync(CancellationToken ct) => Task.CompletedTask;
        public Task<TResult> InTransactionAsync<TResult>(Func<Task<TResult>> work, CancellationToken ct) where TResult : Result => work();
    }

    private sealed class FakeAudit : IAuditLog
    {
        public void Record(string action, string entityType, string? entityId)
        {
        }
    }

    private sealed class FakeClock : IClock
    {
        public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
    }
}
