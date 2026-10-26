using System.Text.Json.Nodes;
using Storefront.Application.Common;

namespace Storefront.Application.Ai;

/// <summary>Which helper asks; the fake assistant answers by it, real ones only pass it to their logs.</summary>
public enum AiTask
{
    DesignFromPhoto,
    MenuFromPhotos,
    WriteText,
}

/// <summary>A photo for the model, already shrunk and stripped of camera metadata.</summary>
public sealed record AiImage(byte[] Bytes, string ContentType);

/// <summary>
/// One structured question to a model. <see cref="Instructions"/> are ours; <see cref="Input"/> carries the owner's data and note,
/// which the model must treat as data. <see cref="ResponseSchema"/> is a JSON Schema the answer must follow.
/// </summary>
public sealed record AiRequest(
    AiTask Task,
    string Instructions,
    string Input,
    IReadOnlyList<AiImage> Images,
    JsonObject ResponseSchema,
    double Temperature);

/// <summary>
/// A generative model that answers with JSON (DeepSeek in production, Gemini as the fallback). When no API key is configured the app uses a
/// disabled assistant: <see cref="IsAvailable"/> is false and the AI endpoints answer 503. The answer is untrusted:
/// callers validate and clamp every value before showing it.
/// </summary>
public interface IAiAssistant
{
    bool IsAvailable { get; }

    /// <summary>The model's JSON answer, or <see cref="AiErrors.Unavailable"/>, <see cref="AiErrors.Busy"/> or <see cref="AiErrors.Failed"/>.</summary>
    Task<Result<JsonNode>> GenerateAsync(AiRequest request, CancellationToken ct);
}

/// <summary>App settings under "Ai". Monthly allowances are per plan code; a plan that is not listed gets the Basic allowance.</summary>
public sealed class AiOptions
{
    public const string SectionName = "Ai";
    public const int DefaultBasicLimit = 30;
    public const int DefaultProLimit = 100;

    /// <summary>Successful AI answers per business and calendar month, keyed by plan code ("basic", "pro").</summary>
    public Dictionary<string, int> MonthlyLimit { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public static class AiErrors
{
    public static readonly Error Unavailable = Error.Unavailable("ai.unavailable", "The AI helper isn't switched on yet.");
    public static readonly Error Busy = Error.Unavailable("ai.busy", "The AI helper is busy. Try again in a minute.");
    public static readonly Error Failed = Error.Upstream("ai.failed", "The AI helper couldn't answer this time. Try again.");
    public static readonly Error LimitReached = Error.LimitReached("ai.limit", "You've used all your AI helper requests for this month.");
    public static readonly Error NothingFound = Error.Validation("ai.nothingFound", "We couldn't find any products in these photos. Try a sharper photo.", "files");
    public static readonly Error NoPhoto = Error.Validation("ai.photos", "Add 1 to 3 photos.", "files");
    public static readonly Error NoBusiness = Error.Unauthorized("auth.required", "Log in to continue.");
}
