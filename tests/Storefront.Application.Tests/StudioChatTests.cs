using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Ai;
using Storefront.Application.Ai.Chat;
using Storefront.Application.Ai.Studio;
using Storefront.Application.Billing;
using Storefront.Application.Common;
using Storefront.Application.Media;
using Storefront.Domain.Billing;
using Storefront.Domain.Businesses;
using Storefront.Domain.Common;
using Storefront.Domain.Sites;
using Storefront.Domain.Templates;

namespace Storefront.Application.Tests;

/// <summary>The AI design studio: the design chat on a Studio site also writes the style sheet, for Pro only.</summary>
public class StudioChatTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 14, 9, 0, 0, TimeSpan.Zero);

    private const string Schema = """
        [ { "key": "hero.title", "type": "text", "label": "Headline", "max": 80 },
          { "key": "theme", "type": "palette", "label": "Theme", "options": ["light", "night"] },
          { "key": "studio.css", "type": "css", "label": "Design studio style", "max": 20000 } ]
        """;

    private const string Defaults = """{ "hero.title": "Coffee", "theme": "light", "studio.css": "" }""";

    private sealed class Setup
    {
        public required ChatAboutDesignHandler Handler { get; init; }
        public required WriteTextHandlerTests.FakeAssistant Assistant { get; init; }
        public required Usage Usage { get; init; }
        public required References References { get; init; }
    }

    private static Setup Make(string plan = Plan.Pro, string templateId = "studio", string schema = Schema)
    {
        var business = Business.Create(Guid.CreateVersion7(), "Vanilla Café", Slug.FromStorage("vanilla"), Now);
        var template = Template.Create(templateId, 31, "Studio", "Your own design", null, null, schema, Defaults, 1);
        var site = Site.Create(business.Id, templateId, template.DefaultSettings, Now);
        var assistant = new WriteTextHandlerTests.FakeAssistant();
        var usage = new Usage();
        var billing = new Billing(Subscription.Start(business.Id, plan, SubscriptionStatus.Active, "fake", null, null));
        var clock = new Clock();
        var quota = new AiQuotaChecker(
            assistant, usage, billing, new User(business.Id),
            Options.Create(new AiOptions { MonthlyLimit = new(StringComparer.OrdinalIgnoreCase) { ["basic"] = 30, ["pro"] = 100 } }), clock);
        var references = new References();
        var studio = new StudioChecker(new PlanChecker(billing), usage, clock, references, new PassOptimizer());
        var handler = new ChatAboutDesignHandler(
            new ChatAboutDesignValidator(), quota, assistant, new PassOptimizer(),
            WriteTextHandlerTests.Businesses(business), WriteTextHandlerTests.Sites(site), WriteTextHandlerTests.Templates(template), studio);
        return new Setup { Handler = handler, Assistant = assistant, Usage = usage, References = references };
    }

    private static ChatAboutDesign Ask(string text, bool surprise = false, string? link = null) =>
        new([new AiChatMessage(AiChatMessage.Owner, text)], null, null, surprise, link);

    [Fact]
    public async Task The_style_sheet_comes_back_in_the_patch()
    {
        var s = Make();
        s.Assistant.Answer = JsonNode.Parse("""{ "reply": "Done.", "settings": { "theme": "night" }, "css": "[data-section=\"hero\"] h1 { animation: rise .6s ease both }" }""")!;

        var result = await s.Handler.Handle(Ask("Make the title rise in"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("night", result.Value.Settings.GetProperty("theme").GetString());
        Assert.Contains("animation: rise", result.Value.Settings.GetProperty("studio.css").GetString());
        var request = s.Assistant.Requests.Single();
        Assert.NotNull(request.ResponseSchema["properties"]!["css"]);
        Assert.Contains("Studio template of the AI design studio", request.Instructions);
        Assert.Contains("The website has no style sheet yet", request.Input);
    }

    [Fact]
    public async Task An_unsafe_style_sheet_is_left_out()
    {
        var s = Make();
        s.Assistant.Answer = JsonNode.Parse("""{ "reply": "Done.", "settings": { "theme": "night" }, "css": "@import url(https://evil.example/x.css);" }""")!;

        var result = await s.Handler.Handle(Ask("Something new"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.False(result.Value.Settings.TryGetProperty("studio.css", out _));
    }

    [Fact]
    public async Task The_studio_is_for_pro()
    {
        var s = Make(Plan.Basic);
        var result = await s.Handler.Handle(Ask("Hi"), CancellationToken.None);
        Assert.Equal(StudioErrors.NeedsPro, result.Error);
        Assert.Empty(s.Assistant.Requests);
    }

    [Fact]
    public async Task New_designs_are_counted_and_limited()
    {
        var s = Make();
        s.Assistant.Answer = JsonNode.Parse("""{ "reply": "A fresh look.", "settings": { "theme": "night" } }""")!;

        Assert.True((await s.Handler.Handle(Ask("Surprise me", surprise: true), CancellationToken.None)).IsSuccess);
        Assert.Equal(1, s.Usage.Count("S26-11"));

        s.Usage.Set("S26-11", StudioChecker.NewDesignsPerMonth);
        var refused = await s.Handler.Handle(Ask("Surprise me", surprise: true), CancellationToken.None);
        Assert.Equal(StudioErrors.NewDesignLimit, refused.Error);

        // Changes by chat still work after the limit.
        Assert.True((await s.Handler.Handle(Ask("Darker"), CancellationToken.None)).IsSuccess);
    }

    [Fact]
    public async Task A_link_becomes_a_reference_picture()
    {
        var s = Make();
        s.Assistant.Answer = JsonNode.Parse("""{ "reply": "Inspired by your picture.", "settings": { "theme": "night" } }""")!;

        var result = await s.Handler.Handle(Ask("Like this", link: "https://example.com/cafe"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(new Uri("https://example.com/cafe"), s.References.Asked.Single());
        Assert.Single(s.Assistant.Requests.Single().Images);
    }

    [Fact]
    public async Task Links_need_the_studio_and_a_web_address()
    {
        var other = Make(templateId: "souq", schema: """[ { "key": "theme", "type": "palette", "label": "Theme", "options": ["light", "night"] } ]""");
        Assert.Equal(StudioErrors.LinkNeedsStudio, (await other.Handler.Handle(Ask("Like this", link: "https://example.com"), CancellationToken.None)).Error);

        var s = Make();
        var bad = await s.Handler.Handle(Ask("Like this", link: "ftp://example.com/x.png"), CancellationToken.None);
        Assert.False(bad.IsSuccess);
        Assert.Empty(s.References.Asked);
    }

    internal sealed class Usage : IAiUsageRepository
    {
        private readonly Dictionary<string, int> _counts = [];

        public int Count(string period) => _counts.GetValueOrDefault(period);

        public void Set(string period, int count) => _counts[period] = count;

        public Task<int> CountAsync(Guid businessId, string period, CancellationToken ct) => Task.FromResult(Count(period));

        public Task IncrementAsync(Guid businessId, string period, DateTimeOffset now, CancellationToken ct)
        {
            _counts[period] = Count(period) + 1;
            return Task.CompletedTask;
        }
    }

    internal sealed class References : IReferenceImages
    {
        public List<Uri> Asked { get; } = [];

        public Task<Result<byte[]>> FetchAsync(Uri url, CancellationToken ct)
        {
            Asked.Add(url);
            // The first bytes of a PNG, so the upload check knows the type.
            return Task.FromResult<Result<byte[]>>(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0 });
        }
    }

    private sealed class Billing(Subscription subscription) : IBillingRepository
    {
        private readonly Plan[] _plans = [Plan.Create("lite", "Lite", 2m, false), Plan.Create("basic", "Basic", 5m, false), Plan.Create("pro", "Pro", 10m, true)];

        public Task<IReadOnlyList<Plan>> ListPlansAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<Plan>>(_plans);

        public Task<Plan?> GetPlanAsync(string code, CancellationToken ct) => Task.FromResult(_plans.FirstOrDefault(p => p.Code == code));

        public Task<Subscription?> GetSubscriptionAsync(Guid businessId, CancellationToken ct) => Task.FromResult<Subscription?>(subscription);

        public void Add(Plan plan) => throw new NotSupportedException();

        public void Add(Subscription subscription) => throw new NotSupportedException();
    }

    private sealed class Clock : IClock
    {
        public DateTimeOffset UtcNow => Now;
    }

    private sealed class User(Guid businessId) : ICurrentUser
    {
        public Guid? UserId => Guid.Empty;

        public Guid? BusinessId => businessId;

        public bool IsStaff => false;
    }

    private sealed class PassOptimizer : IImageOptimizer
    {
        public Result<OptimizedImage> Optimize(ReadOnlyMemory<byte> image, int maxSide, long maxBytes) => new OptimizedImage(image.ToArray(), "image/jpeg", 1, 1);
    }
}
