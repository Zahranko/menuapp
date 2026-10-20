using System.Text;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using FluentValidation;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Application.Media;

namespace Storefront.Application.Ai;

/// <summary>An uploaded photo as the controller hands it over.</summary>
public sealed record AiPhoto(Stream Content, long Length);

/// <summary>The owner's optional note for the helper ("cosy family café, known for knafeh").</summary>
public static class AiNote
{
    public const int Max = 300;

    public static IRuleBuilderOptions<T, string?> ValidNote<T>(this IRuleBuilder<T, string?> rule) =>
        rule.MaximumLength(Max).WithMessage("Keep the note under 300 characters.");
}

internal static class AiPhotos
{
    /// <summary>Photos for the design helper: enough to see colors and style.</summary>
    public const int DesignSide = 1280;

    /// <summary>Menu photos stay larger so small print stays readable.</summary>
    public const int MenuSide = 2048;

    /// <summary>
    /// Checks the photo like an upload (type by its first bytes, 5 MB at most), then shrinks and re-encodes it, which also
    /// drops camera metadata such as the location before anything leaves the server.
    /// </summary>
    public static async Task<Result<AiImage>> PrepareAsync(IImageOptimizer optimizer, AiPhoto photo, int maxSide, CancellationToken ct)
    {
        var read = await PhotoUpload.ReadAsync(photo.Content, photo.Length, ct);
        if (!read.IsSuccess)
        {
            return read.Error!;
        }

        var optimized = optimizer.Optimize(read.Value, maxSide, 2 * 1024 * 1024);
        return optimized.IsSuccess ? new AiImage(optimized.Value.Bytes, optimized.Value.ContentType) : optimized.Error!;
    }
}

/// <summary>Cleans text a model wrote before it reaches an owner: no markup, no control characters, trimmed to a length.</summary>
internal static partial class AiText
{
    /// <summary>A property of a JSON object, or null when the node is not an object (model answers are untrusted).</summary>
    public static JsonNode? Field(JsonNode? node, string name) => node is JsonObject o ? o[name] : null;

    /// <summary>The text of <paramref name="node"/> when it is a string, cleaned and cut to <paramref name="max"/> characters; null when empty.</summary>
    public static string? Clean(JsonNode? node, int max, bool multiline = false) =>
        node is JsonValue value && value.TryGetValue<string>(out var text) ? Clean(text, max, multiline) : null;

    public static string? Clean(string? text, int max, bool multiline = false)
    {
        if (string.IsNullOrWhiteSpace(text) || max <= 0)
        {
            return null;
        }

        text = Tags().Replace(text, " ");
        text = Markdown().Replace(text, "");
        var sb = new StringBuilder(text.Length);
        foreach (var c in text.Normalize(NormalizationForm.FormC))
        {
            if (c == '\n' && multiline)
            {
                sb.Append('\n');
            }
            else if (char.IsControl(c) || c is '\u2028' or '\u2029')
            {
                sb.Append(' ');
            }
            else
            {
                sb.Append(c);
            }
        }

        var cleaned = Spaces().Replace(sb.ToString(), " ");
        cleaned = string.Join('\n', cleaned.Split('\n').Select(l => l.Trim()).Where(l => l.Length > 0)).Trim();
        if (cleaned.Length > max)
        {
            // Cut at a word break when one is near, and never inside a surrogate pair.
            var cut = cleaned.LastIndexOf(' ', max - 1);
            var end = cut >= max * 2 / 3 ? cut : max;
            if (end > 0 && char.IsHighSurrogate(cleaned[end - 1]))
            {
                end--;
            }

            cleaned = cleaned[..end].TrimEnd(' ', ',', ';', ':', '-');
        }

        return cleaned.Length == 0 ? null : cleaned;
    }

    [GeneratedRegex("<[^>]*>")]
    private static partial Regex Tags();

    [GeneratedRegex(@"(\*\*|__|`+|^#+\s*)", RegexOptions.Multiline)]
    private static partial Regex Markdown();

    [GeneratedRegex(@"[ \t ]+")]
    private static partial Regex Spaces();
}
