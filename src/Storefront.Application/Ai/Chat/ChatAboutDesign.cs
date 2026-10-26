using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using FluentValidation;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Application.Common.Localization;
using Storefront.Application.Templates;
using Storefront.Domain.Businesses;

namespace Storefront.Application.Ai.Chat;

/// <summary>One message of the editor chat: from the "owner" or from the "assistant" (an earlier answer, sent back for context).</summary>
public sealed record AiChatMessage(string Role, string Text)
{
    public const string Owner = "owner";
    public const string Assistant = "assistant";
}

/// <summary>
/// The conversation so far, oldest first, ending with the owner's new message; the language the texts and the reply are written in
/// ("en" or "ar"; the site's language when empty); and an optional photo sent with the new message (a logo, the shop, the food).
/// </summary>
public sealed record ChatAboutDesign(IReadOnlyList<AiChatMessage> Messages, string? Language = null, AiPhoto? Photo = null)
{
    public const int MaxMessages = 20;
    public const int MaxText = 1000;

    /// <summary>
    /// Reads the "messages" form field: a JSON array of { role, text }. Text that isn't such an array is a validation error;
    /// the validator checks the rest.
    /// </summary>
    public static Result<IReadOnlyList<AiChatMessage>> ParseMessages(string? json)
    {
        var unreadable = Error.Validation("ai.messages", "We couldn't read the conversation. Try again.", "messages");
        if (string.IsNullOrWhiteSpace(json))
        {
            return Error.Validation("ai.message", "Write a message.", "messages");
        }

        try
        {
            if (JsonNode.Parse(json) is not JsonArray items)
            {
                return unreadable;
            }

            var messages = new List<AiChatMessage>();
            foreach (var item in items)
            {
                if (item is not JsonObject o
                    || o["role"] is not JsonValue role || !role.TryGetValue<string>(out var r)
                    || o["text"] is not JsonValue text || !text.TryGetValue<string>(out var t))
                {
                    return unreadable;
                }

                messages.Add(new AiChatMessage(r, t));
            }

            return messages;
        }
        catch (JsonException)
        {
            return unreadable;
        }
    }
}

/// <summary>
/// The assistant's answer: a short <see cref="Reply"/> for the owner and the settings it changed, keyed like the draft (the same
/// format as the design helper's patch; empty when it only answered or asked something). Nothing is saved; the editor merges
/// <see cref="Settings"/> into its draft.
/// </summary>
public sealed record DesignChatAnswerDto(string Reply, JsonElement Settings, int RemainingThisMonth);

public sealed class ChatAboutDesignValidator : AbstractValidator<ChatAboutDesign>
{
    public ChatAboutDesignValidator()
    {
        RuleFor(x => x.Messages)
            .NotEmpty().WithMessage("Write a message.")
            .Must(m => m.Count <= ChatAboutDesign.MaxMessages).WithMessage("Send up to 20 messages.")
            .Must(m => m.All(x => x.Role is AiChatMessage.Owner or AiChatMessage.Assistant)).WithMessage("We couldn't read the conversation. Try again.")
            .Must(m => m.All(x => (x.Text?.Length ?? 0) <= ChatAboutDesign.MaxText)).WithMessage("Keep each message under 1000 characters.")
            .Must(m => m.Count == 0 || (m[^1].Role == AiChatMessage.Owner && !string.IsNullOrWhiteSpace(m[^1].Text))).WithMessage("Write a message.");
        RuleFor(x => x.Language).Must(l => string.IsNullOrEmpty(l) || Business.Locales.Contains(l)).WithMessage("Language must be en or ar.");
    }
}

/// <summary>
/// The editor's chat assistant. It may set every template setting that can be set from a value (<see cref="TemplateAiFields.IsEditable"/>):
/// colors, themes, fonts, sizes, layouts, switches, sections and texts. Every value is checked with the rules of a saved draft and
/// anything that fails is dropped. Each answer counts once against the monthly allowance.
/// </summary>
public sealed class ChatAboutDesignHandler(
    IValidator<ChatAboutDesign> validator,
    AiQuotaChecker quota,
    IAiAssistant assistant,
    IImageOptimizer optimizer,
    IBusinessRepository businesses,
    ISiteRepository sites,
    ITemplateRepository templates)
{
    public const int ReplyMax = 600;

    public async Task<Result<DesignChatAnswerDto>> Handle(ChatAboutDesign cmd, CancellationToken ct)
    {
        if (await validator.CheckAsync(cmd, ct) is { } invalid)
        {
            return invalid;
        }

        var (businessId, refused) = await quota.BeginAsync(ct);
        if (refused is not null)
        {
            return refused;
        }

        var loaded = await AiSite.LoadAsync(businessId, businesses, sites, templates, ct);
        if (!loaded.IsSuccess)
        {
            return loaded.Error!;
        }

        List<AiImage> images = [];
        if (cmd.Photo is not null)
        {
            var photo = await AiPhotos.PrepareAsync(optimizer, cmd.Photo, AiPhotos.DesignSide, ct);
            if (!photo.IsSuccess)
            {
                return photo.Error!;
            }

            images.Add(photo.Value);
        }

        var site = loaded.Value;
        var fields = site.Schema.Fields.Where(TemplateAiFields.IsEditable).ToList();
        if (fields.Count == 0)
        {
            return AiErrors.Failed;
        }

        var language = string.IsNullOrEmpty(cmd.Language) ? site.Locale : cmd.Language;
        var answer = await assistant.GenerateAsync(Request(site, fields, cmd.Messages, language, images), ct);
        if (!answer.IsSuccess)
        {
            return answer.Error!;
        }

        var patch = await TemplateAiFields.ToPatchAsync(site.Schema, fields, AiText.Field(answer.Value, "settings"), site.Current);
        RemoveUnchanged(patch, site.Current);
        var reply = AiText.Clean(AiText.Field(answer.Value, "reply"), ReplyMax, multiline: true);
        if (reply is null)
        {
            if (patch.Count == 0)
            {
                return AiErrors.Failed;
            }

            reply = Messages.Translate(DoneReply, null, language);
        }

        var remaining = await quota.RecordAsync(businessId, ct);
        return new DesignChatAnswerDto(reply, JsonDocument.Parse(patch.ToJsonString()).RootElement.Clone(), remaining);
    }

    /// <summary>What the owner sees when the model changed settings but wrote no reply.</summary>
    public const string DoneReply = "Done. Have a look at the preview.";

    /// <summary>Values the model repeated without changing are left out, so the editor only reports real changes.</summary>
    private static void RemoveUnchanged(JsonObject patch, JsonObject current)
    {
        foreach (var key in patch.Where(p => JsonNode.DeepEquals(p.Value, current[p.Key]) || SameNumber(p.Value, current[p.Key])).Select(p => p.Key).ToList())
        {
            patch.Remove(key);
        }
    }

    private static bool SameNumber(JsonNode? a, JsonNode? b) =>
        a is JsonValue x && b is JsonValue y && x.TryGetValue<double>(out var m) && y.TryGetValue<double>(out var n) && m.Equals(n);

    private static AiRequest Request(AiSite site, IReadOnlyList<TemplateField> fields, IReadOnlyList<AiChatMessage> messages, string language, IReadOnlyList<AiImage> images)
    {
        var input = new StringBuilder();
        site.Describe(input, language);
        input.AppendLine();
        input.AppendLine("Current settings of the website (key, what it is, current value):");
        foreach (var field in fields)
        {
            var label = string.IsNullOrWhiteSpace(field.Group) ? field.Label : $"{field.Group} / {field.Label}";
            input.AppendLine($"- {field.Key} ({label}): {site.Current[field.Key]?.ToJsonString() ?? "(empty)"}");
        }

        input.AppendLine();
        if (messages.Count > 1)
        {
            input.AppendLine("The conversation so far, oldest first:");
            foreach (var message in messages.Take(messages.Count - 1))
            {
                input.AppendLine($"{(message.Role == AiChatMessage.Owner ? "Owner" : "You")}: {OneLine(message.Text)}");
            }

            input.AppendLine();
        }

        input.AppendLine($"The owner's new message: {OneLine(messages[^1].Text)}");
        if (images.Count > 0)
        {
            input.AppendLine("The owner attached a photo to this message");
        }

        var schema = new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["reply"] = new JsonObject { ["type"] = "string", ["maxLength"] = ReplyMax },
                ["settings"] = TemplateAiFields.Schema(fields, site.Schema.Fields),
            },
            ["required"] = new JsonArray("reply", "settings"),
        };

        return new AiRequest(AiTask.ChatAboutDesign, AiPrompts.Chat(AiSite.LanguageName(language)), input.ToString(), images, schema, Temperature: 0.5);
    }

    private static string OneLine(string? text) => string.Join(' ', (text ?? "").Split((char[])['\r', '\n'], StringSplitOptions.RemoveEmptyEntries)).Trim();
}
