using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Storefront.Application.Ai;
using Storefront.Application.Common;

namespace Storefront.Infrastructure.Ai;

/// <summary>
/// Settings under "Ai:Gemini". Without <see cref="ApiKey"/> the AI helper is switched off (the endpoints answer 503).
/// The key is a secret: set it as the environment variable Ai__Gemini__ApiKey, never in appsettings or the repo.
/// </summary>
public sealed class GeminiOptions
{
    public const string SectionName = "Ai:Gemini";
    public const string DefaultModel = "gemini-3.6-flash";

    public string? ApiKey { get; set; }

    /// <summary>The model id, like "gemini-3.6-flash".</summary>
    public string Model { get; set; } = DefaultModel;

    public string BaseUrl { get; set; } = "https://generativelanguage.googleapis.com";

    /// <summary>How long one answer may take. Reading a long menu takes the longest.</summary>
    public int TimeoutSeconds { get; set; } = 45;

    /// <summary>Room for the answer; a full menu of 300 products needs most of it.</summary>
    public int MaxOutputTokens { get; set; } = 16384;
}

/// <summary>
/// Google Gemini over its REST API (generateContent). Photos go inline as base64; the answer is JSON that follows the
/// request's schema (responseJsonSchema). The key travels in the x-goog-api-key header, never in the URL, and is never logged;
/// neither are photos or the owner's texts. Upstream failures become ai.busy (503) or ai.failed (502).
/// </summary>
internal sealed class GeminiAssistant(HttpClient http, IOptions<GeminiOptions> options, ILogger<GeminiAssistant> logger) : IAiAssistant
{
    public const string KeyHeader = "x-goog-api-key";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public bool IsAvailable => !string.IsNullOrWhiteSpace(options.Value.ApiKey);

    public async Task<Result<JsonNode>> GenerateAsync(AiRequest request, CancellationToken ct)
    {
        var o = options.Value;
        if (string.IsNullOrWhiteSpace(o.ApiKey))
        {
            return AiErrors.Unavailable;
        }

        var model = string.IsNullOrWhiteSpace(o.Model) ? GeminiOptions.DefaultModel : o.Model.Trim();
        using var message = new HttpRequestMessage(HttpMethod.Post, $"{o.BaseUrl.TrimEnd('/')}/v1beta/models/{Uri.EscapeDataString(model)}:generateContent")
        {
            Content = JsonContent.Create(Body(request, o.MaxOutputTokens), options: Json),
        };
        message.Headers.Add(KeyHeader, o.ApiKey.Trim());

        var watch = Stopwatch.StartNew();
        try
        {
            using var response = await http.SendAsync(message, ct);
            if (!response.IsSuccessStatusCode)
            {
                return await RefusedAsync(request.Task, model, response, ct);
            }

            var body = await response.Content.ReadFromJsonAsync<JsonNode>(Json, ct);
            var answer = Answer(body);
            if (answer is null)
            {
                logger.LogWarning("Gemini gave no usable answer for {Task} ({Model}, finish reason {FinishReason})",
                    request.Task, model, First(body?["candidates"])?["finishReason"]?.ToString() ?? body?["promptFeedback"]?["blockReason"]?.ToString() ?? "none");
                return AiErrors.Failed;
            }

            logger.LogInformation("Gemini answered {Task} ({Model}) in {Elapsed} ms", request.Task, model, watch.ElapsedMilliseconds);
            return answer;
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            logger.LogWarning("Gemini timed out on {Task} ({Model}) after {Elapsed} ms", request.Task, model, watch.ElapsedMilliseconds);
            return AiErrors.Failed;
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning("Gemini could not be reached for {Task}: {Reason}", request.Task, ex.HttpRequestError);
            return AiErrors.Failed;
        }
        catch (JsonException)
        {
            logger.LogWarning("Gemini's reply to {Task} was not valid JSON", request.Task);
            return AiErrors.Failed;
        }
    }

    private static JsonObject Body(AiRequest request, int maxOutputTokens)
    {
        var parts = new JsonArray();
        foreach (var image in request.Images)
        {
            parts.Add(new JsonObject
            {
                ["inline_data"] = new JsonObject { ["mime_type"] = image.ContentType, ["data"] = Convert.ToBase64String(image.Bytes) },
            });
        }

        parts.Add(new JsonObject { ["text"] = request.Input });
        return new JsonObject
        {
            ["system_instruction"] = new JsonObject { ["parts"] = new JsonArray(new JsonObject { ["text"] = request.Instructions }) },
            ["contents"] = new JsonArray(new JsonObject { ["role"] = "user", ["parts"] = parts }),
            ["generationConfig"] = new JsonObject
            {
                ["temperature"] = request.Temperature,
                ["maxOutputTokens"] = Math.Clamp(maxOutputTokens, 1024, 65536),
                ["responseMimeType"] = "application/json",
                ["responseJsonSchema"] = request.ResponseSchema.DeepClone(),
            },
        };
    }

    /// <summary>The JSON in the first candidate's text parts, or null when there is none (blocked, cut off or empty).</summary>
    private static JsonNode? Answer(JsonNode? body)
    {
        if (First(body?["candidates"])?["content"]?["parts"] is not JsonArray parts)
        {
            return null;
        }

        var text = new StringBuilder();
        foreach (var part in parts)
        {
            // Thought summaries (when a model returns them) are not the answer.
            if (part?["thought"]?.GetValueKind() == JsonValueKind.True)
            {
                continue;
            }

            if (part?["text"] is JsonValue value && value.TryGetValue<string>(out var chunk))
            {
                text.Append(chunk);
            }
        }

        var json = text.ToString().Trim();
        // Models sometimes wrap JSON in a Markdown code fence even when asked for JSON only.
        if (json.StartsWith("```", StringComparison.Ordinal))
        {
            json = json[(json.IndexOf('\n') + 1)..];
            json = json.EndsWith("```", StringComparison.Ordinal) ? json[..^3] : json;
        }

        return json.Length == 0 ? null : JsonNode.Parse(json);
    }

    /// <summary>The first item of an array, or null (indexing a JSON array past its end throws).</summary>
    private static JsonNode? First(JsonNode? node) => node is JsonArray { Count: > 0 } array ? array[0] : null;

    private async Task<Result<JsonNode>> RefusedAsync(AiTask task, string model, HttpResponseMessage response, CancellationToken ct)
    {
        // Google's error status (like RESOURCE_EXHAUSTED or INVALID_ARGUMENT) says what went wrong without repeating the key.
        string? status = null;
        try
        {
            status = (await response.Content.ReadFromJsonAsync<JsonNode>(Json, ct))?["error"]?["status"]?.ToString();
        }
        catch (JsonException)
        {
        }

        if (response.StatusCode is HttpStatusCode.TooManyRequests or HttpStatusCode.ServiceUnavailable)
        {
            logger.LogWarning("Gemini is busy for {Task} ({Model}): {Status} {GoogleStatus}", task, model, (int)response.StatusCode, status);
            return AiErrors.Busy;
        }

        // 400, 401, 403 and 404 mean a wrong key, model id or request: something to fix in the settings, not the owner's fault.
        logger.LogError("Gemini refused {Task} ({Model}): {Status} {GoogleStatus}", task, model, (int)response.StatusCode, status);
        return AiErrors.Failed;
    }
}

/// <summary>Used when no Gemini key is configured: the helper is off and every call answers ai.unavailable (503).</summary>
internal sealed class DisabledAiAssistant : IAiAssistant
{
    public bool IsAvailable => false;

    public Task<Result<JsonNode>> GenerateAsync(AiRequest request, CancellationToken ct) => Task.FromResult<Result<JsonNode>>(AiErrors.Unavailable);
}
