using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Billing;
using Storefront.Application.Common;
using Storefront.Application.Community;
using Storefront.Application.Sites;
using Storefront.Application.Templates;
using Storefront.Domain.Billing;
using Storefront.Domain.Businesses;
using Storefront.Domain.Common;
using Storefront.Domain.Community;
using Storefront.Domain.Media;
using Storefront.Domain.Sites;
using Storefront.Domain.Templates;

namespace Storefront.Application.Tests;

/// <summary>Community templates: what a shared design carries, who may share, and how applying one keeps the owner's own content.</summary>
public class CommunityDesignTests
{
    private static readonly TemplateSchema Schema = TemplateSchema.Parse(CommunityTests.Schema);

    [Fact]
    public void Only_the_design_is_shared_never_texts_photos_or_hours()
    {
        var settings = JsonNode.Parse("""
            { "hero.title": "Lina's Café", "hero.image": "https://cdn.test/me.jpg", "story.image": "preset:beans", "hours": { "mon": "08:00-20:00" },
              "theme": "night", "accent": "#C2410C", "photos": true, "sections": ["story"], "sections.order": ["story", "menu"],
              "studio.css": "h1 { color: red }", "gallery": ["https://cdn.test/a.jpg"] }
            """)!.AsObject();

        var design = CommunityDesign.Extract(Schema, settings);

        Assert.Equal(new[] { "accent", "photos", "sections", "sections.order", "story.image", "studio.css", "theme" }, design.Select(p => p.Key).Order());
        Assert.False(design.ContainsKey("hero.title"));
        Assert.False(design.ContainsKey("hero.image"));
        Assert.False(design.ContainsKey("hours"));
        Assert.False(design.ContainsKey("gallery"));
    }

    [Fact]
    public void Applying_keeps_the_owners_texts_and_ignores_smuggled_keys()
    {
        var mine = JsonNode.Parse("""{ "hero.title": "Sugar Lane", "theme": "light", "studio.css": "" }""")!.AsObject();
        var shared = JsonNode.Parse("""{ "hero.title": "Someone else's café", "theme": "night", "studio.css": "body { margin: 0 }" }""")!.AsObject();

        var merged = CommunityDesign.Apply(Schema, mine, shared);

        Assert.Equal("Sugar Lane", merged["hero.title"]!.GetValue<string>());
        Assert.Equal("night", merged["theme"]!.GetValue<string>());
        Assert.Equal("body { margin: 0 }", merged["studio.css"]!.GetValue<string>());
    }

    [Fact]
    public void Card_colors_come_from_palettes_and_custom_colors()
    {
        var design = JsonNode.Parse("""{ "theme": "night", "accent": "#C2410C" }""")!.AsObject();
        Assert.Equal(["#111111", "#C2410C"], CommunityDesign.Colors(Schema, design));
    }

    [Fact]
    public void Only_templates_with_a_style_sheet_can_be_shared()
    {
        Assert.True(CommunityDesign.CanShare(Schema));
        Assert.False(CommunityDesign.CanShare(TemplateSchema.Parse("""[ { "key": "theme", "type": "palette", "label": "Theme", "options": ["light"] } ]""")));
    }
}

public class CommunityTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 15, 9, 0, 0, TimeSpan.Zero);

    internal const string Schema = """
        [ { "key": "hero.title", "type": "text", "label": "Headline", "max": 80 },
          { "key": "hero.image", "type": "image", "label": "Photo", "presets": ["beans"] },
          { "key": "story.image", "type": "image", "label": "Story photo", "presets": ["beans"] },
          { "key": "gallery", "type": "images", "label": "Gallery", "max": 6 },
          { "key": "hours", "type": "hours", "label": "Hours" },
          { "key": "theme", "type": "palette", "label": "Theme", "options": ["light", "night"], "swatches": { "light": "#FFFFFF", "night": "#111111" } },
          { "key": "accent", "type": "color", "label": "Accent", "custom": true, "options": ["#2F6FEB"] },
          { "key": "photos", "type": "toggle", "label": "Photos" },
          { "key": "sections", "type": "toggles", "label": "Sections", "options": ["story", "visit"] },
          { "key": "sections.order", "type": "order", "label": "Order", "options": ["menu", "story"] },
          { "key": "studio.css", "type": "css", "label": "Design studio style", "max": 20000 } ]
        """;

    private const string Defaults = """
        { "hero.title": "Coffee", "hero.image": "", "story.image": "", "gallery": [], "hours": {}, "theme": "light", "accent": "#2F6FEB",
          "photos": true, "sections": ["story"], "sections.order": ["menu", "story"], "studio.css": "" }
        """;

    private static readonly IReservedSlugs Reserved = new ReservedList();

    /// <summary>Two businesses sharing one in-memory store; <see cref="As"/> switches who is signed in.</summary>
    private sealed class World
    {
        public Template Studio { get; } = Template.Create("studio", 31, "Studio", "Your own design", null, null, Schema, Defaults, 1, TemplateTier.Pro);
        public Template Souq { get; } = Template.Create("souq", 1, "Souq", "Café", null, null, """[ { "key": "theme", "type": "palette", "label": "Theme", "options": ["light"] } ]""", """{ "theme": "light" }""", 1);
        public Dictionary<Guid, Business> Businesses { get; } = [];
        public Dictionary<Guid, Site> Sites { get; } = [];
        public Dictionary<Guid, string> Plans { get; } = [];
        public Store Community { get; } = new();
        public User User { get; } = new();

        public Guid AddBusiness(string name, string plan, string templateId)
        {
            var business = Business.Create(Guid.CreateVersion7(), name, Slug.FromStorage(Slug.FromBusinessName(name)), Now);
            Businesses[business.Id] = business;
            var template = templateId == "studio" ? Studio : Souq;
            Sites[business.Id] = Site.Create(business.Id, templateId, template.DefaultSettings, Now);
            Plans[business.Id] = plan;
            return business.Id;
        }

        public World As(Guid businessId)
        {
            User.Current = businessId;
            Community.Current = businessId;
            return this;
        }

        private PlanChecker PlanChecker => new(new BillingFake(this));

        private SiteLinks Links => new(Options.Create(new BrandOptions { Domain = "brand.test" }), Options.Create(new StorefrontOptions()));

        private CommunityCards Cards => new(new TemplatesFake(this), Community, Links);

        private CommunityPublishing Publishing => new(Community, new SitesFake(this), new TemplatesFake(this), PlanChecker, User);

        public SavePublisherHandler SavePublisher => new(new SavePublisherValidator(), Community, Reserved, PlanChecker, User, new Uow(), new Audit(), new Clock(), Links);

        public ShareCommunityTemplateHandler Share => new(new ShareCommunityTemplateValidator(), Publishing, Community, Cards, new Uow(), new Audit(), new Clock());

        public BrowseCommunityHandler Browse => new(Community, Cards);

        public GetCommunityTemplateHandler Get => new(Community, Cards);

        public ApplyCommunityTemplateHandler Apply => new(
            Community, Cards, new SiteContext(new SitesFake(this), new BusinessesFake(this), User, Links), new TemplatesFake(this), new MediaFake(),
            PlanChecker, User, new Uow(), new Audit(), new Clock());
    }

    private static async Task<(World World, Guid Publisher, Guid Other, string Code)> SharedAsync(string otherPlan = Plan.Pro, bool listed = true)
    {
        var world = new World();
        var publisher = world.AddBusiness("Lina Cafe", Plan.Pro, "studio");
        var other = world.AddBusiness("Sugar Lane", otherPlan, "souq");
        world.Sites[publisher].SaveDraft("""
            { "hero.title": "Lina's", "hero.image": "", "story.image": "preset:beans", "gallery": [], "hours": { "mon": "08:00-20:00" }, "theme": "night",
              "accent": "#C2410C", "photos": false, "sections": ["visit"], "sections.order": ["story", "menu"], "studio.css": "h1 { letter-spacing: .1em }" }
            """, Now);

        world.As(publisher);
        Assert.True((await world.SavePublisher.Handle(new SavePublisher("@Lina_Designs", "Lina", "Cafés in warm colors"), default)).IsSuccess);
        var shared = await world.Share.Handle(new ShareCommunityTemplate("Warm night", "Dark and cozy", listed), default);
        Assert.True(shared.IsSuccess, shared.Error?.Message);
        return (world, publisher, other, shared.Value.Template.Code);
    }

    [Fact]
    public async Task A_pro_owner_with_a_profile_shares_the_design_of_their_studio_draft()
    {
        var (world, _, _, code) = await SharedAsync();

        var page = await world.Browse.Handle(null, null, 1, default);
        var card = Assert.Single(page.Items);
        Assert.Equal(code, card.Code);
        Assert.Equal("lina_designs", card.Publisher.Username);
        Assert.Equal($"https://brand.test/community/{code}", card.ShareUrl);
        Assert.Equal("https://brand.test/community/u/lina_designs", card.Publisher.Url);
        Assert.Equal(["#111111", "#C2410C"], card.Colors);
        Assert.True(card.IsPro);

        var detail = (await world.Get.Handle(code.ToUpperInvariant(), default))!;
        Assert.Equal("night", detail.Settings.GetProperty("theme").GetString());
        Assert.Equal("preset:beans", detail.Settings.GetProperty("story.image").GetString());
        Assert.False(detail.Settings.TryGetProperty("hero.title", out _));
        Assert.False(detail.Settings.TryGetProperty("hours", out _));
    }

    [Fact]
    public async Task Basic_owners_cant_make_a_publisher_profile_or_share()
    {
        var world = new World();
        var basic = world.AddBusiness("Plain Cafe", Plan.Basic, "studio");
        world.As(basic);

        var profile = await world.SavePublisher.Handle(new SavePublisher("plaincafe", "Plain", null), default);
        Assert.Equal("community.pro", profile.Error?.Code);
        Assert.Equal("community.pro", (await world.Share.Handle(new ShareCommunityTemplate("My look", null), default)).Error?.Code);
    }

    [Fact]
    public async Task Sharing_needs_a_profile_and_a_studio_site()
    {
        var world = new World();
        var pro = world.AddBusiness("Pro Cafe", Plan.Pro, "souq");
        world.As(pro);
        Assert.Equal("publisher.notFound", (await world.Share.Handle(new ShareCommunityTemplate("My look", null), default)).Error?.Code);

        await world.SavePublisher.Handle(new SavePublisher("procafe", "Pro", null), default);
        Assert.Equal("community.studio", (await world.Share.Handle(new ShareCommunityTemplate("My look", null), default)).Error?.Code);
    }

    [Theory]
    [InlineData("ab", "publisher.username")]
    [InlineData("1abc", "publisher.username")]
    [InlineData("has space", "publisher.username")]
    [InlineData("admin", "publisher.usernameReserved")]
    [InlineData("lina_designs", "publisher.usernameTaken")]
    public async Task Usernames_are_checked_and_unique(string username, string code)
    {
        var (world, _, other, _) = await SharedAsync();
        world.As(other);
        Assert.Equal(code, (await world.SavePublisher.Handle(new SavePublisher(username, "Sugar", null), default)).Error?.Code);
    }

    [Fact]
    public async Task Applying_keeps_the_owners_texts_and_counts_a_use()
    {
        var (world, _, other, code) = await SharedAsync();
        world.Sites[other].ChangeTemplate("studio", """{ "hero.title": "Sugar Lane", "theme": "light", "hours": { "fri": "closed" } }""", Now);
        world.As(other);

        var result = await world.Apply.Handle(code, default);

        Assert.True(result.IsSuccess, result.Error?.Message);
        var draft = JsonNode.Parse(world.Sites[other].DraftSettings)!;
        Assert.Equal("Sugar Lane", draft["hero.title"]!.GetValue<string>());
        Assert.Equal("closed", draft["hours"]!["fri"]!.GetValue<string>());
        Assert.Equal("night", draft["theme"]!.GetValue<string>());
        Assert.Equal("h1 { letter-spacing: .1em }", draft["studio.css"]!.GetValue<string>());
        Assert.Null(world.Sites[other].PublishedAt);
        Assert.Equal(1, world.Community.Templates.Single().Uses);
    }

    [Fact]
    public async Task Applying_from_another_template_moves_the_site_to_studio()
    {
        var (world, _, other, code) = await SharedAsync();
        world.As(other);

        Assert.True((await world.Apply.Handle(code, default)).IsSuccess);
        Assert.Equal("studio", world.Sites[other].TemplateId);
        Assert.Equal("Coffee", JsonNode.Parse(world.Sites[other].DraftSettings)!["hero.title"]!.GetValue<string>());
    }

    [Fact]
    public async Task Applying_follows_the_base_templates_plan()
    {
        var (world, _, other, code) = await SharedAsync(otherPlan: Plan.Basic);
        world.As(other);
        Assert.Equal("template.pro", (await world.Apply.Handle(code, default)).Error?.Code);
        Assert.Equal("souq", world.Sites[other].TemplateId);
    }

    [Fact]
    public async Task An_unsafe_style_sheet_in_a_stored_design_is_refused_on_apply()
    {
        var (world, _, other, code) = await SharedAsync();
        var item = world.Community.Templates.Single();
        item.SetDesign("studio", """{ "theme": "night", "studio.css": "@import url(https://evil.test/x.css);" }""", Now);
        world.As(other);

        var result = await world.Apply.Handle(code, default);

        Assert.False(result.IsSuccess);
        Assert.True(result.Error!.Fields!.ContainsKey("settings.studio.css"));
        Assert.Equal("souq", world.Sites[other].TemplateId);
    }

    [Fact]
    public async Task Unlisted_templates_stay_out_of_the_gallery_but_open_by_link()
    {
        var (world, _, other, code) = await SharedAsync(listed: false);
        Assert.Empty((await world.Browse.Handle("new", null, 1, default)).Items);
        Assert.NotNull(await world.Get.Handle(code, default));
        world.As(other);
        Assert.True((await world.Apply.Handle(code, default)).IsSuccess);
    }

    [Theory]
    [InlineData("")]
    [InlineData("short")]
    [InlineData("ABCDEFGH1")]
    [InlineData("0000000o")]
    public async Task Made_up_codes_are_not_found(string code)
    {
        var (world, _, other, _) = await SharedAsync();
        Assert.Null(await world.Get.Handle(code, default));
        world.As(other);
        Assert.Equal("community.notFound", (await world.Apply.Handle(code, default)).Error?.Code);
    }

    [Fact]
    public void Share_codes_are_eight_easy_characters()
    {
        var codes = Enumerable.Range(0, 200).Select(_ => CommunityTemplate.NewCode()).ToList();
        Assert.All(codes, c => Assert.True(CommunityTemplate.LooksLikeCode(c), c));
        Assert.True(codes.Distinct().Count() > 190);
    }

    internal sealed class Store : ICommunityRepository
    {
        public List<PublisherProfile> Publishers { get; } = [];
        public List<CommunityTemplate> Templates { get; } = [];
        public Guid? Current { get; set; }

        public Task<PublisherProfile?> GetMyPublisherAsync(CancellationToken ct) => Task.FromResult(Publishers.FirstOrDefault(p => p.BusinessId == Current));

        public Task<PublisherProfile?> FindPublisherAsync(string username, CancellationToken ct) => Task.FromResult(Publishers.FirstOrDefault(p => p.Username == username));

        public Task<bool> UsernameTakenAsync(string username, Guid? exceptId, CancellationToken ct) => Task.FromResult(Publishers.Any(p => p.Username == username && p.Id != exceptId));

        public Task<IReadOnlyDictionary<Guid, PublisherProfile>> GetPublishersAsync(IReadOnlyCollection<Guid> ids, CancellationToken ct) =>
            Task.FromResult<IReadOnlyDictionary<Guid, PublisherProfile>>(Publishers.Where(p => ids.Contains(p.Id)).ToDictionary(p => p.Id));

        public Task<IReadOnlyList<CommunityTemplate>> ListMineAsync(CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<CommunityTemplate>>(Templates.Where(t => t.BusinessId == Current).ToList());

        public Task<CommunityTemplate?> GetMineAsync(Guid id, CancellationToken ct) => Task.FromResult(Templates.FirstOrDefault(t => t.Id == id && t.BusinessId == Current));

        public Task<CommunityTemplate?> FindByCodeAsync(string code, CancellationToken ct) => Task.FromResult(Templates.FirstOrDefault(t => t.Code == code));

        public Task<(IReadOnlyList<CommunityTemplate> Items, int Total)> BrowseAsync(bool newestFirst, string? search, int skip, int take, CancellationToken ct)
        {
            var listed = Templates.Where(t => t.IsListed && (search is null || t.Name.Contains(search, StringComparison.OrdinalIgnoreCase))).ToList();
            return Task.FromResult<(IReadOnlyList<CommunityTemplate>, int)>((listed.Skip(skip).Take(take).ToList(), listed.Count));
        }

        public Task<IReadOnlyList<CommunityTemplate>> ListByPublisherAsync(Guid publisherId, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<CommunityTemplate>>(Templates.Where(t => t.PublisherId == publisherId && t.IsListed).ToList());

        public void Add(PublisherProfile profile) => Publishers.Add(profile);

        public void Add(CommunityTemplate template) => Templates.Add(template);

        public void Remove(CommunityTemplate template) => Templates.Remove(template);
    }

    private sealed class ReservedList : IReservedSlugs
    {
        public IReadOnlySet<string> All { get; } = new HashSet<string> { "admin", "support" };
    }

    internal sealed class User : ICurrentUser
    {
        public Guid? Current { get; set; }

        public Guid? UserId => Guid.Empty;

        public Guid? BusinessId => Current;

        public bool IsStaff => false;
    }

    private sealed class BillingFake(World world) : IBillingRepository
    {
        private readonly Plan[] _plans = [Plan.Create("lite", "Lite", 2m, false), Plan.Create("basic", "Basic", 5m, false), Plan.Create("pro", "Pro", 10m, true)];

        public Task<IReadOnlyList<Plan>> ListPlansAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<Plan>>(_plans);

        public Task<Plan?> GetPlanAsync(string code, CancellationToken ct) => Task.FromResult(_plans.FirstOrDefault(p => p.Code == code));

        public Task<Subscription?> GetSubscriptionAsync(Guid businessId, CancellationToken ct) =>
            Task.FromResult<Subscription?>(Subscription.Start(businessId, world.Plans[businessId], SubscriptionStatus.Active, "fake", null, null));

        public void Add(Plan plan) => throw new NotSupportedException();

        public void Add(Subscription subscription) => throw new NotSupportedException();
    }

    private sealed class SitesFake(World world) : ISiteRepository
    {
        public Task<Site?> GetForCurrentBusinessAsync(CancellationToken ct) =>
            Task.FromResult(world.User.Current is { } id ? world.Sites.GetValueOrDefault(id) : null);

        public Task<Site?> GetByBusinessIdAsync(Guid businessId, CancellationToken ct) => Task.FromResult(world.Sites.GetValueOrDefault(businessId));

        public void Add(Site site) => throw new NotSupportedException();
    }

    private sealed class BusinessesFake(World world) : IBusinessRepository
    {
        public Task<Business?> GetAsync(Guid id, CancellationToken ct) => Task.FromResult(world.Businesses.GetValueOrDefault(id));

        public Task<Business?> GetByOwnerAsync(Guid ownerUserId, CancellationToken ct) => throw new NotSupportedException();

        public Task<Business?> FindBySlugAsync(string slug, CancellationToken ct) => throw new NotSupportedException();

        public Task<bool> SlugExistsAsync(string slug, CancellationToken ct) => throw new NotSupportedException();

        public void Add(Business business) => throw new NotSupportedException();
    }

    private sealed class TemplatesFake(World world) : ITemplateRepository
    {
        public Task<IReadOnlyList<Template>> ListAsync(bool activeOnly, CancellationToken ct) => Task.FromResult<IReadOnlyList<Template>>([world.Souq, world.Studio]);

        public Task<Template?> GetAsync(string id, CancellationToken ct) => Task.FromResult(id switch { "studio" => world.Studio, "souq" => world.Souq, _ => null });

        public void Add(Template template) => throw new NotSupportedException();
    }

    private sealed class MediaFake : IMediaRepository
    {
        public Task<MediaAsset?> GetAsync(Guid id, CancellationToken ct) => Task.FromResult<MediaAsset?>(null);

        public Task<bool> UrlBelongsToBusinessAsync(Guid businessId, string url, CancellationToken ct) => Task.FromResult(false);

        public void Add(MediaAsset asset) => throw new NotSupportedException();
    }

    private sealed class Uow : IUnitOfWork
    {
        public Task SaveChangesAsync(CancellationToken ct) => Task.CompletedTask;

        public Task<TResult> InTransactionAsync<TResult>(Func<Task<TResult>> work, CancellationToken ct)
            where TResult : Result => work();
    }

    private sealed class Audit : IAuditLog
    {
        public void Record(string action, string entityType, string? entityId)
        {
        }
    }

    private sealed class Clock : IClock
    {
        public DateTimeOffset UtcNow => Now;
    }
}
