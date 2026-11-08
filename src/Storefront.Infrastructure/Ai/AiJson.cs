using System.Text.Json;
using System.Text.Json.Nodes;

namespace Storefront.Infrastructure.Ai;

/// <summary>Reads a model's text answer as JSON.</summary>
internal static class AiJson
{
    /// <summary>The JSON in <paramref name="text"/>, or null when it is empty. Throws <see cref="JsonException"/> when it is not JSON.</summary>
    public static JsonNode? Parse(string? text)
    {
        var json = text?.Trim() ?? "";
        // Models sometimes wrap JSON in a Markdown code fence even when asked for JSON only.
        if (json.StartsWith("```", StringComparison.Ordinal))
        {
            json = json[(json.IndexOf('\n') + 1)..];
            json = json.EndsWith("```", StringComparison.Ordinal) ? json[..^3] : json;
        }

        return json.Length == 0 ? null : JsonNode.Parse(json);
    }
}
