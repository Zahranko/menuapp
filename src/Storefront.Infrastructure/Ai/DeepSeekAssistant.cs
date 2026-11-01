using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Storefront.Application.Ai;
using Storefront.Application.Common;

namespace Storefront.Infrastructure.Ai;

/// <summary>
/// Settings under "Ai:DeepSeek". With <see cref="ApiKey"/> set, DeepSeek answers the AI helper.
/// The key is a secret: set it as the environment variable Ai__DeepSeek__ApiKey, never in appsettings or the repo.
/// </summary>
public sealed class DeepSeekOptions
{
    public const string SectionName = "Ai:DeepSeek";
    public const string DefaultModel = "deepseek-flash";

    public string? ApiKey { get; set; }

    /// <summary>The model id. It must accept photos ("deepseek-flash" does; "deepseek-v4-pro" doesn't).</summary>
    public string Model { get; set; } = DefaultModel;

    public string BaseUrl { get; set; } = "https://api.deepseek.com";

    /// <summary>How long one answer may take. Reading a long menu takes the longest.</summary>
    public int TimeoutSeconds { get; set; } = 60;

    /// <summary>Room for the answer; a full menu of 300 products needs most of it.</summary>
    public int MaxOutputTokens { get; set; } = 16384;
}

/// <summary>
/// DeepSeek over its OpenAI-compatible Chat Completions API. Photos go inline as base64 data URLs in the user message
/// (DeepSeek refuses images anywhere else). JSON mode has no schema option, so the schema goes into the instructions and
/// callers validate the answer as they already do. Thinking is switched off: these are short structured answers and the
/// owner is waiting. The key travels in the Authorization header and is never logged; neither are photos or the owner's
/// texts. Upstream failures become ai.busy (503) or ai.failed (502).
/// </summary>
internal sealed class DeepSeekAssistant(HttpClient http, IOptions<DeepSeekOptions> options, ILogger<DeepSeekAssistant> logger) : IAiAssistant
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public bool IsAvailable => !string.IsNullOrWhiteSpace(options.Value.ApiKey);

    public async Task<Result<JsonNode>> GenerateAsync(AiRequest request, CancellationToken ct)
    {
        var o = options.Value;
        if (string.IsNullOrWhiteSpace(o.ApiKey))
        {
            return AiErrors.Unavailable;
        }

        var model = string.IsNullOrWhiteSpace(o.Model) ? DeepSeekOptions.DefaultModel : o.Model.Trim();
        using var message = new HttpRequestMessage(HttpMethod.Post, $"{o.BaseUrl.TrimEnd('/')}/chat/completions")
        {
            Content = JsonContent.Create(Body(request, model, o.MaxOutputTokens), options: Json),
        };
        message.Headers.Authorization = new("Bearer", o.ApiKey.Trim());

        var watch = Stopwatch.StartNew();
        try
        {
            using var response = await http.SendAsync(message, ct);
            if (!response.IsSuccessStatusCode)
            {
                return await RefusedAsync(request.Task, model, response, ct);
            }

            var body = await response.Content.ReadFromJsonAsync<JsonNode>(Json, ct);
            var choice = body?["choices"] is JsonArray { Count: > 0 } choices ? choices[0] : null;
            var finish = choice?["finish_reason"]?.ToString();
            var answer = finish == "stop" ? AiJson.Parse(choice?["message"]?["content"]?.ToString()) : null;
            if (answer is null)
            {
                // "length" means the answer was cut off; "content_filter" means it was blocked.
                logger.LogWarning("DeepSeek gave no usable answer for {Task} ({Model}, finish reason {FinishReason})", request.Task, model, finish ?? "none");
                return AiErrors.Failed;
            }

            logger.LogInformation("DeepSeek answered {Task} ({Model}) in {Elapsed} ms", request.Task, model, watch.ElapsedMilliseconds);
            return answer;
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            logger.LogWarning("DeepSeek timed out on {Task} ({Model}) after {Elapsed} ms", request.Task, model, watch.ElapsedMilliseconds);
            return AiErrors.Failed;
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning("DeepSeek could not be reached for {Task}: {Reason}", request.Task, ex.HttpRequestError);
            return AiErrors.Failed;
        }
        catch (JsonException)
        {
            logger.LogWarning("DeepSeek's reply to {Task} was not valid JSON", request.Task);
            return AiErrors.Failed;
        }
    }

    private static JsonObject Body(AiRequest request, string model, int maxOutputTokens)
    {
        var content = new JsonArray();
        foreach (var image in request.Images)
        {
            content.Add(new JsonObject
            {
                ["type"] = "image_url",
                ["image_url"] = new JsonObject { ["url"] = $"data:{image.ContentType};base64,{Convert.ToBase64String(image.Bytes)}" },
            });
        }

        content.Add(new JsonObject { ["type"] = "text", ["text"] = request.Input });
        var instructions = $"{request.Instructions}\n\nAnswer with one JSON object only, no other text. It must follow this JSON Schema:\n{request.ResponseSchema.ToJsonString()}";
        return new JsonObject
        {
            ["model"] = model,
            ["messages"] = new JsonArray(
                new JsonObject { ["role"] = "system", ["content"] = instructions },
                new JsonObject { ["role"] = "user", ["content"] = content }),
            ["response_format"] = new JsonObject { ["type"] = "json_object" },
            ["thinking"] = new JsonObject { ["type"] = "disabled" },
            ["temperature"] = request.Temperature,
            ["max_tokens"] = Math.Clamp(maxOutputTokens, 1024, 65536),
            ["stream"] = false,
        };
    }

    private async Task<Result<JsonNode>> RefusedAsync(AiTask task, string model, HttpResponseMessage response, CancellationToken ct)
    {
        // The error type (like invalid_request_error) says what went wrong without repeating the key.
        string? type = null;
        try
        {
            type = (await response.Content.ReadFromJsonAsync<JsonNode>(Json, ct))?["error"]?["type"]?.ToString();
        }
        catch (JsonException)
        {
        }

        if (response.StatusCode is HttpStatusCode.TooManyRequests or HttpStatusCode.ServiceUnavailable)
        {
            logger.LogWarning("DeepSeek is busy for {Task} ({Model}): {Status} {ErrorType}", task, model, (int)response.StatusCode, type);
            return AiErrors.Busy;
        }

        // 400, 401, 402 (no balance left on the account), 403 and 404 are something to fix in the settings or the account.
        logger.LogError("DeepSeek refused {Task} ({Model}): {Status} {ErrorType}", task, model, (int)response.StatusCode, type);
        return AiErrors.Failed;
    }
}
