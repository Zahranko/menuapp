using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using SkiaSharp;
using Storefront.Application.Ai;
using Storefront.Application.Ai.Design;
using Storefront.Application.Ai.Menu;
using Storefront.Application.Ai.Text;
using Storefront.Application.Catalog;
using Storefront.Application.Catalog.Import;
using Storefront.Infrastructure.Ai;

namespace Storefront.Web.IntegrationTests;

/// <summary>No AI key configured: the helper is off everywhere.</summary>
public class AiDisabledTests(StorefrontFactory factory) : IClassFixture<StorefrontFactory>
{
    [Fact]
    public async Task Status_says_unavailable_and_every_helper_answers_503()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        var client = factory.CreateClient().Authorized(auth.AccessToken);

        var status = await client.GetFromJsonAsync<AiStatusDto>("/api/v1/ai/status", Api.Json);
        Assert.False(status!.Available);
        Assert.Equal(0, status.RemainingThisMonth);

        var text = await client.PostAsJsonAsync("/api/v1/ai/text", new { note = "Family café" });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, text.StatusCode);
        var problem = await Api.ProblemAsync(text);
        Assert.Equal("ai.unavailable", problem.GetProperty("code").GetString());
        Assert.Equal("The AI helper isn't switched on yet.", problem.GetProperty("title").GetString());

        var design = await client.PostAsync("/api/v1/ai/design", AiFactory.Photos("file", 1));
        Assert.Equal(HttpStatusCode.ServiceUnavailable, design.StatusCode);
        var menu = await client.PostAsync("/api/v1/ai/menu", AiFactory.Photos("files", 2));
        Assert.Equal(HttpStatusCode.ServiceUnavailable, menu.StatusCode);
    }

    [Fact]
    public async Task The_refusal_speaks_Arabic()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        var client = factory.CreateClient().Authorized(auth.AccessToken);
        client.DefaultRequestHeaders.AcceptLanguage.Add(new StringWithQualityHeaderValue("ar"));

        var response = await client.PostAsJsonAsync("/api/v1/ai/text", new { });
        Assert.Equal("المساعد الذكي غير مفعّل بعد.", (await Api.ProblemAsync(response)).GetProperty("title").GetString());
    }

    [Fact]
    public async Task Helpers_need_login() =>
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateClient().GetAsync("/api/v1/ai/status")).StatusCode);
}

/// <summary>The fake model answers, and every business gets 2 answers a month.</summary>
public class AiFactory : StorefrontFactory
{
    internal FakeAiAssistant Fake { get; } = new();

    protected override IDictionary<string, string?> ExtraSettings => new Dictionary<string, string?>
    {
        ["Ai:MonthlyLimit:basic"] = "2",
        ["Ai:MonthlyLimit:pro"] = "2",
    };

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureTestServices(services => services.AddSingleton<IAiAssistant>(Fake));
    }

    /// <summary>A form with <paramref name="count"/> small JPEG photos under <paramref name="field"/>.</summary>
    public static MultipartFormDataContent Photos(string field, int count, string? note = null)
    {
        var form = new MultipartFormDataContent();
        for (var i = 0; i < count; i++)
        {
            var content = new ByteArrayContent(ImageOptimizerTests.Photo(320, 240, SKEncodedImageFormat.Jpeg));
            content.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
            form.Add(content, field, $"photo{i}.jpg");
        }

        if (note is not null)
        {
            form.Add(new StringContent(note), "note");
        }

        return form;
    }
}

public class AiTests(AiFactory factory) : IClassFixture<AiFactory>
{
    private async Task<HttpClient> OwnerAsync()
    {
        var auth = await Api.RegisterAsync(factory.CreateClient());
        return factory.CreateClient().Authorized(auth.AccessToken);
    }

    private static async Task<T> ReadAsync<T>(HttpResponseMessage response)
    {
        await Api.EnsureSuccess(response);
        return (await response.Content.ReadFromJsonAsync<T>(Api.Json))!;
    }

    [Fact]
    public async Task Design_from_a_photo_returns_a_checked_patch_and_saves_nothing()
    {
        var client = await OwnerAsync();
        var before = await client.GetStringAsync("/api/v1/site");

        var suggestion = await ReadAsync<DesignSuggestionDto>(await client.PostAsync("/api/v1/ai/design", AiFactory.Photos("file", 1, "Green shop sign")));

        var settings = suggestion.Settings;
        Assert.Equal("#2B6B4F", settings.GetProperty("accent").GetString());
        Assert.Equal("night", settings.GetProperty("theme").GetString());
        Assert.Equal("Fresh from the oven, every morning", settings.GetProperty("hero.title").GetString());
        // An option the template doesn't have, a made-up review and an unknown setting are dropped.
        Assert.False(settings.TryGetProperty("font", out _));
        Assert.False(settings.TryGetProperty("reviews.1.quote", out _));
        Assert.False(settings.TryGetProperty("no.such.setting", out _));
        Assert.Equal("Deep green from your sign, on a dark theme", suggestion.Summary);
        Assert.Equal(1, suggestion.RemainingThisMonth);
        Assert.Equal(before, await client.GetStringAsync("/api/v1/site"));

        // The photo went to the model re-encoded, and the note as data.
        var request = factory.Fake.Requests.Last(r => r.Task == AiTask.DesignFromPhoto);
        Assert.Equal("image/webp", Assert.Single(request.Images).ContentType);
        Assert.Contains("Green shop sign", request.Input);
        Assert.True(request.ResponseSchema["properties"]!["settings"]!["properties"]!.AsObject().ContainsKey("accent"));
    }

    [Fact]
    public async Task Design_writes_in_the_chosen_language()
    {
        var client = await OwnerAsync();
        using var form = AiFactory.Photos("file", 1);
        form.Add(new StringContent("ar"), "language");

        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync("/api/v1/ai/design", form)).StatusCode);

        var request = factory.Fake.Requests.Last(r => r.Task == AiTask.DesignFromPhoto);
        Assert.Contains("in Arabic", request.Instructions);
        Assert.Contains("Website language: Arabic", request.Input);
    }

    [Fact]
    public async Task Design_refuses_an_unknown_language()
    {
        var client = await OwnerAsync();
        using var form = AiFactory.Photos("file", 1);
        form.Add(new StringContent("fr"), "language");
        var response = await client.PostAsync("/api/v1/ai/design", form);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Design_refuses_files_that_are_not_photos()
    {
        var client = await OwnerAsync();
        using var form = new MultipartFormDataContent { { new ByteArrayContent("not an image"u8.ToArray()), "file", "photo.jpg" } };
        var response = await client.PostAsync("/api/v1/ai/design", form);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("media.type", (await Api.ProblemAsync(response)).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Menu_from_photos_returns_a_clean_draft()
    {
        var client = await OwnerAsync();
        var draft = await ReadAsync<MenuDraftDto>(await client.PostAsync("/api/v1/ai/menu", AiFactory.Photos("files", 2)));

        var drinks = Assert.Single(draft.Categories);
        Assert.Equal("Hot drinks", drinks.Name);
        Assert.Equal("مشروبات ساخنة", drinks.NameAr);
        Assert.Equal(["Turkish coffee", "Tea", "Sahlab"], drinks.Products.Select(p => p.Name));
        Assert.Equal(1.5m, drinks.Products[0].Price);
        Assert.Null(drinks.Products[1].Price);
        Assert.Equal(2.25m, drinks.Products[2].Price);
        Assert.Equal("With nuts", drinks.Products[2].Description);
        Assert.Equal("JOD", draft.MenuCurrency);
        Assert.Equal(2, factory.Fake.Requests.Last(r => r.Task == AiTask.MenuFromPhotos).Images.Count);
    }

    [Fact]
    public async Task Menu_needs_one_to_three_photos()
    {
        var client = await OwnerAsync();
        var none = await client.PostAsync("/api/v1/ai/menu", new MultipartFormDataContent { { new StringContent("x"), "note" } });
        Assert.Equal(HttpStatusCode.BadRequest, none.StatusCode);
        var four = await client.PostAsync("/api/v1/ai/menu", AiFactory.Photos("files", 4));
        Assert.Equal(HttpStatusCode.BadRequest, four.StatusCode);
        Assert.Equal("Add 1 to 3 photos.", (await Api.ProblemAsync(four)).GetProperty("errors").GetProperty("files")[0].GetString());
    }

    [Fact]
    public async Task Write_text_fills_texts_and_describes_only_this_business_products()
    {
        var client = await OwnerAsync();
        var category = await ReadAsync<CategoryDto>(await client.PostAsJsonAsync("/api/v1/categories", new { name = "Coffee" }));
        var latte = await ReadAsync<ProductDto>(await client.PostAsJsonAsync("/api/v1/products", new { categoryId = category.Id, name = "Latte", price = 3.5m }));

        var suggestion = await ReadAsync<TextSuggestionDto>(await client.PostAsJsonAsync("/api/v1/ai/text", new { note = "Known for knafeh", language = "en" }));

        Assert.Equal("Knafeh worth the trip", suggestion.Settings.GetProperty("hero.title").GetString());
        Assert.False(suggestion.Settings.TryGetProperty("story.since", out _));
        var description = Assert.Single(suggestion.ProductDescriptions);
        Assert.Equal(latte.Id, description.ProductId);
        Assert.Contains("- p1: Latte", factory.Fake.Requests.Last(r => r.Task == AiTask.WriteText).Input);
        Assert.Null((await ReadAsync<ProductDto>(await client.GetAsync($"/api/v1/products/{latte.Id}"))).Description);
    }

    [Fact]
    public async Task Only_successful_answers_count_and_the_month_runs_out()
    {
        var client = await OwnerAsync();
        Assert.Equal(new AiStatusDto(true, 2, 2), await client.GetFromJsonAsync<AiStatusDto>("/api/v1/ai/status", Api.Json));

        factory.Fake.Answer = _ => AiErrors.Busy;
        try
        {
            var busy = await client.PostAsJsonAsync("/api/v1/ai/text", new { });
            Assert.Equal(HttpStatusCode.ServiceUnavailable, busy.StatusCode);
            Assert.Equal("ai.busy", (await Api.ProblemAsync(busy)).GetProperty("code").GetString());
            factory.Fake.Answer = _ => JsonNode.Parse("""{"settings": {"no.such.setting": "x"}}""")!;
            var useless = await client.PostAsJsonAsync("/api/v1/ai/text", new { includeProducts = false });
            Assert.Equal(HttpStatusCode.BadGateway, useless.StatusCode);
        }
        finally
        {
            factory.Fake.Answer = null;
        }

        Assert.Equal(2, (await client.GetFromJsonAsync<AiStatusDto>("/api/v1/ai/status", Api.Json))!.RemainingThisMonth);
        await Api.EnsureSuccess(await client.PostAsJsonAsync("/api/v1/ai/text", new { }));
        await Api.EnsureSuccess(await client.PostAsync("/api/v1/ai/menu", AiFactory.Photos("files", 1)));

        var third = await client.PostAsJsonAsync("/api/v1/ai/text", new { });
        Assert.Equal(HttpStatusCode.TooManyRequests, third.StatusCode);
        Assert.Equal("ai.limit", (await Api.ProblemAsync(third)).GetProperty("code").GetString());
        Assert.Equal(0, (await client.GetFromJsonAsync<AiStatusDto>("/api/v1/ai/status", Api.Json))!.RemainingThisMonth);

        // Another business has its own allowance.
        var other = await OwnerAsync();
        Assert.Equal(2, (await other.GetFromJsonAsync<AiStatusDto>("/api/v1/ai/status", Api.Json))!.RemainingThisMonth);
    }

    [Fact]
    public async Task Import_adds_reviewed_items_in_one_go_for_this_business_only()
    {
        var client = await OwnerAsync();
        var coffee = await ReadAsync<CategoryDto>(await client.PostAsJsonAsync("/api/v1/categories", new { name = "Coffee" }));

        var result = await ReadAsync<ImportResultDto>(await client.PostAsJsonAsync("/api/v1/catalog/import", new
        {
            categories = new object[]
            {
                new { name = "coffee", products = new[] { new { name = "Turkish coffee", description = (string?)null, price = 1.5m } } },
                new { name = "Desserts", products = new[] { new { name = "Knafeh", description = (string?)"With cheese", price = 3m }, new { name = "Basbousa", description = (string?)null, price = 2m } } },
            },
        }));

        Assert.Equal(new ImportResultDto(1, 3), result);
        var categories = await client.GetFromJsonAsync<List<CategoryDto>>("/api/v1/categories", Api.Json) ?? [];
        Assert.Equal(["Coffee", "Desserts"], categories.Select(c => c.Name));
        Assert.Equal([1, 2], categories.Select(c => c.ProductCount));
        Assert.Contains((await client.GetFromJsonAsync<List<ProductDto>>($"/api/v1/products?categoryId={coffee.Id}", Api.Json))!, p => p.Name == "Turkish coffee");

        var other = await OwnerAsync();
        Assert.Empty((await other.GetFromJsonAsync<List<CategoryDto>>("/api/v1/categories", Api.Json))!);
    }

    [Fact]
    public async Task Import_is_all_or_nothing_with_field_errors()
    {
        var client = await OwnerAsync();
        var response = await client.PostAsJsonAsync("/api/v1/catalog/import", new
        {
            categories = new[]
            {
                new { name = "Drinks", products = new object[] { new { name = "Tea", price = 1m }, new { name = "Juice", price = (decimal?)null } } },
            },
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Enter a price.", (await Api.ProblemAsync(response)).GetProperty("errors").GetProperty("categories[0].products[1].price")[0].GetString());
        Assert.Empty((await client.GetFromJsonAsync<List<CategoryDto>>("/api/v1/categories", Api.Json))!);

        var empty = await client.PostAsJsonAsync("/api/v1/catalog/import", new { categories = Array.Empty<object>() });
        Assert.Equal("import.empty", (await Api.ProblemAsync(empty)).GetProperty("code").GetString());
    }
}
