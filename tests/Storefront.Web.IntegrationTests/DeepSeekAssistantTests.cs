using System.Collections.Concurrent;
using System.Net;
using System.Text;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Storefront.Application.Ai;
using Storefront.Infrastructure.Ai;

namespace Storefront.Web.IntegrationTests;

/// <summary>The DeepSeek adapter against a recorded HTTP exchange (no network, no database).</summary>
public class DeepSeekAssistantTests
{
    private const string Key = "sk-test-0123456789";

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

    private sealed class Logs : ILogger<DeepSeekAssistant>
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
        "Business name: Demo",
        [new AiImage([1, 2, 3], "image/webp")],
        new JsonObject { ["type"] = "object" },
        0.1);

    private static (DeepSeekAssistant Assistant, Handler Handler, Logs Logs) Create(HttpStatusCode status, string body, string? key = Key)
    {
        var handler = new Handler(status, body);
        var logs = new Logs();
        var options = Options.Create(new DeepSeekOptions { ApiKey = key, Model = "deepseek-flash", BaseUrl = "https://deepseek.test" });
        return (new DeepSeekAssistant(new HttpClient(handler), options, logs), handler, logs);
    }

    private static string Choice(string content, string finish = "stop") =>
        new JsonObject
        {
            ["choices"] = new JsonArray(new JsonObject
            {
                ["message"] = new JsonObject { ["role"] = "assistant", ["content"] = content },
                ["finish_reason"] = finish,
            }),
        }.ToJsonString();

    [Fact]
    public async Task Sends_the_photo_as_a_data_URL_with_the_key_in_a_header_and_reads_the_JSON_answer()
    {
        var (assistant, handler, logs) = Create(HttpStatusCode.OK, Choice("""{"categories": []}"""));

        var result = await assistant.GenerateAsync(Request, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value["categories"]);
        Assert.Equal("https://deepseek.test/chat/completions", handler.Request!.RequestUri!.ToString());
        Assert.Equal("Bearer", handler.Request.Headers.Authorization!.Scheme);
        Assert.Equal(Key, handler.Request.Headers.Authorization.Parameter);

        var body = JsonNode.Parse(handler.Body!)!;
        Assert.Equal("deepseek-flash", body["model"]!.GetValue<string>());
        var system = body["messages"]![0]!;
        Assert.Equal("system", system["role"]!.GetValue<string>());
        Assert.StartsWith("Read the menu", system["content"]!.GetValue<string>());
        Assert.Contains("JSON Schema", system["content"]!.GetValue<string>());
        Assert.Contains("""{"type":"object"}""", system["content"]!.GetValue<string>());
        var user = body["messages"]![1]!;
        Assert.Equal("user", user["role"]!.GetValue<string>());
        var content = user["content"]!.AsArray();
        Assert.Equal("image_url", content[0]!["type"]!.GetValue<string>());
        Assert.Equal("data:image/webp;base64," + Convert.ToBase64String([1, 2, 3]), content[0]!["image_url"]!["url"]!.GetValue<string>());
        Assert.Equal("Business name: Demo", content[1]!["text"]!.GetValue<string>());
        Assert.Equal("json_object", body["response_format"]!["type"]!.GetValue<string>());
        Assert.Equal("disabled", body["thinking"]!["type"]!.GetValue<string>());
        Assert.Equal(0.1, body["temperature"]!.GetValue<double>());
        Assert.All(logs.Lines, l => Assert.DoesNotContain(Key, l));
    }

    [Fact]
    public async Task A_JSON_answer_in_a_code_fence_still_reads() =>
        Assert.True((await Create(HttpStatusCode.OK, Choice("```json\n{\"a\": 1}\n```")).Assistant.GenerateAsync(Request, CancellationToken.None)).IsSuccess);

    [Theory]
    [InlineData(HttpStatusCode.TooManyRequests, "ai.busy")]
    [InlineData(HttpStatusCode.ServiceUnavailable, "ai.busy")]
    [InlineData(HttpStatusCode.BadRequest, "ai.failed")]
    [InlineData(HttpStatusCode.Unauthorized, "ai.failed")]
    [InlineData(HttpStatusCode.PaymentRequired, "ai.failed")]
    [InlineData(HttpStatusCode.InternalServerError, "ai.failed")]
    public async Task Upstream_errors_map_to_busy_or_failed_without_leaking_the_key(HttpStatusCode status, string code)
    {
        var (assistant, _, logs) = Create(status, $$$"""{"error": {"message": "Authentication Fails, your api key: {{{Key}}} is invalid", "type": "authentication_error"} }""");

        var result = await assistant.GenerateAsync(Request, CancellationToken.None);

        Assert.Equal(code, result.Error?.Code);
        Assert.NotEmpty(logs.Lines);
        Assert.All(logs.Lines, l => Assert.DoesNotContain(Key, l));
    }

    [Theory]
    [InlineData("""{"choices": []}""")]
    [InlineData("""{"choices": [{"message": {"content": ""}, "finish_reason": "stop"}]}""")]
    [InlineData("""{"choices": [{"message": {"content": "{\"a\": 1"}, "finish_reason": "length"}]}""")]
    [InlineData("""{"choices": [{"message": {"content": "{}"}, "finish_reason": "content_filter"}]}""")]
    public async Task No_complete_answer_is_a_failure(string body) =>
        Assert.Equal("ai.failed", (await Create(HttpStatusCode.OK, body).Assistant.GenerateAsync(Request, CancellationToken.None)).Error?.Code);

    [Fact]
    public async Task Text_that_is_not_JSON_is_a_failure() =>
        Assert.Equal("ai.failed", (await Create(HttpStatusCode.OK, Choice("Sure! Here is the menu")).Assistant.GenerateAsync(Request, CancellationToken.None)).Error?.Code);

    [Fact]
    public async Task Without_a_key_nothing_is_sent()
    {
        var (assistant, handler, _) = Create(HttpStatusCode.OK, "{}", key: " ");
        Assert.False(assistant.IsAvailable);
        Assert.Equal("ai.unavailable", (await assistant.GenerateAsync(Request, CancellationToken.None)).Error?.Code);
        Assert.Null(handler.Request);
    }
}
