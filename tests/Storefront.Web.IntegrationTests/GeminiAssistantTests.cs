using System.Collections.Concurrent;
using System.Net;
using System.Text;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Storefront.Application.Ai;
using Storefront.Infrastructure.Ai;

namespace Storefront.Web.IntegrationTests;

/// <summary>The Gemini adapter against a recorded HTTP exchange (no network, no database).</summary>
public class GeminiAssistantTests
{
    private const string Key = "test-key-0123456789";

    private sealed class Handler(HttpStatusCode status, string body) : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }
        public string? Body { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Request = request;
            Body = await request.Content!.ReadAsStringAsync(ct);
            return new HttpResponseMessage(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") };
        }
    }

    private sealed class Logs : ILogger<GeminiAssistant>
    {
        public ConcurrentQueue<string> Lines { get; } = new();

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) =>
            Lines.Enqueue(formatter(state, exception));
    }

    private static readonly AiRequest Request = new(
        AiTask.MenuFromPhotos,
        "Read the menu",
        "Business name: Vanilla",
        [new AiImage([1, 2, 3], "image/webp")],
        new JsonObject { ["type"] = "object" },
        0.1);

    private static (GeminiAssistant Assistant, Handler Handler, Logs Logs) Create(HttpStatusCode status, string body, string? key = Key)
    {
        var handler = new Handler(status, body);
        var logs = new Logs();
        var options = Options.Create(new GeminiOptions { ApiKey = key, Model = "gemini-3.6-flash", BaseUrl = "https://gemini.test" });
        return (new GeminiAssistant(new HttpClient(handler), options, logs), handler, logs);
    }

    private static string Candidate(string text) =>
        new JsonObject { ["candidates"] = new JsonArray(new JsonObject { ["content"] = new JsonObject { ["parts"] = new JsonArray(new JsonObject { ["text"] = text }) } }) }.ToJsonString();

    [Fact]
    public async Task Sends_the_photo_inline_with_the_key_in_a_header_and_reads_the_JSON_answer()
    {
        var (assistant, handler, logs) = Create(HttpStatusCode.OK, Candidate("""{"categories": []}"""));

        var result = await assistant.GenerateAsync(Request, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value["categories"]);
        Assert.Equal("https://gemini.test/v1beta/models/gemini-3.6-flash:generateContent", handler.Request!.RequestUri!.ToString());
        Assert.Equal(Key, Assert.Single(handler.Request.Headers.GetValues(GeminiAssistant.KeyHeader)));
        Assert.DoesNotContain(Key, handler.Request.RequestUri.ToString());

        var body = JsonNode.Parse(handler.Body!)!;
        Assert.Equal("Read the menu", body["system_instruction"]!["parts"]![0]!["text"]!.GetValue<string>());
        var parts = body["contents"]![0]!["parts"]!.AsArray();
        Assert.Equal("image/webp", parts[0]!["inline_data"]!["mime_type"]!.GetValue<string>());
        Assert.Equal(Convert.ToBase64String([1, 2, 3]), parts[0]!["inline_data"]!["data"]!.GetValue<string>());
        Assert.Equal("Business name: Vanilla", parts[1]!["text"]!.GetValue<string>());
        var config = body["generationConfig"]!;
        Assert.Equal("application/json", config["responseMimeType"]!.GetValue<string>());
        Assert.Equal("object", config["responseJsonSchema"]!["type"]!.GetValue<string>());
        Assert.Equal(0.1, config["temperature"]!.GetValue<double>());
        Assert.All(logs.Lines, l => Assert.DoesNotContain(Key, l));
    }

    [Fact]
    public async Task A_JSON_answer_in_a_code_fence_still_reads() =>
        Assert.True((await Create(HttpStatusCode.OK, Candidate("```json\n{\"a\": 1}\n```")).Assistant.GenerateAsync(Request, CancellationToken.None)).IsSuccess);

    [Theory]
    [InlineData(HttpStatusCode.TooManyRequests, "ai.busy")]
    [InlineData(HttpStatusCode.ServiceUnavailable, "ai.busy")]
    [InlineData(HttpStatusCode.BadRequest, "ai.failed")]
    [InlineData(HttpStatusCode.Forbidden, "ai.failed")]
    [InlineData(HttpStatusCode.InternalServerError, "ai.failed")]
    public async Task Upstream_errors_map_to_busy_or_failed_without_leaking_the_key(HttpStatusCode status, string code)
    {
        var (assistant, _, logs) = Create(status, $$$"""{"error": {"code": {{{(int)status}}}, "message": "API key {{{Key}}} not valid", "status": "INVALID_ARGUMENT"} }""");

        var result = await assistant.GenerateAsync(Request, CancellationToken.None);

        Assert.Equal(code, result.Error?.Code);
        Assert.NotEmpty(logs.Lines);
        Assert.All(logs.Lines, l => Assert.DoesNotContain(Key, l));
    }

    [Theory]
    [InlineData("""{"candidates": []}""")]
    [InlineData("""{"promptFeedback": {"blockReason": "SAFETY"}}""")]
    public async Task No_answer_is_a_failure(string body) =>
        Assert.Equal("ai.failed", (await Create(HttpStatusCode.OK, body).Assistant.GenerateAsync(Request, CancellationToken.None)).Error?.Code);

    [Fact]
    public async Task Text_that_is_not_JSON_is_a_failure() =>
        Assert.Equal("ai.failed", (await Create(HttpStatusCode.OK, Candidate("Sure! Here is the menu")).Assistant.GenerateAsync(Request, CancellationToken.None)).Error?.Code);

    [Fact]
    public async Task Without_a_key_nothing_is_sent()
    {
        var (assistant, handler, _) = Create(HttpStatusCode.OK, "{}", key: " ");
        Assert.False(assistant.IsAvailable);
        Assert.Equal("ai.unavailable", (await assistant.GenerateAsync(Request, CancellationToken.None)).Error?.Code);
        Assert.Null(handler.Request);
    }
}
