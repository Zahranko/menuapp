using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using FluentValidation;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Domain.Businesses;

namespace Storefront.Application.Ai.Design;

/// <summary>
/// One photo (shop front, logo, food, packaging or the inside of the shop), an optional note and the language to write the
/// texts in ("en" or "ar"; the site's language when empty).
/// </summary>
public sealed record SuggestDesign(AiPhoto Photo, string? Note, string? Language = null);

/// <summary>
/// Settings for the current template, keyed like the draft: colors, theme and font choices, and texts in the site's language.
/// Nothing is saved; the editor merges <see cref="Settings"/> into its draft and the owner publishes as usual.
/// </summary>
public sealed record DesignSuggestionDto(JsonElement Settings, string? Summary, int RemainingThisMonth);

public sealed class SuggestDesignValidator : AbstractValidator<SuggestDesign>
{
    public SuggestDesignValidator()
    {
        RuleFor(x => x.Note).ValidNote();
        RuleFor(x => x.Language).Must(l => string.IsNullOrEmpty(l) || Business.Locales.Contains(l)).WithMessage("Language must be en or ar.");
    }
}

public sealed class SuggestDesignHandler(
    IValidator<SuggestDesign> validator,
    AiQuotaChecker quota,
    IAiAssistant assistant,
    IImageOptimizer optimizer,
    IBusinessRepository businesses,
    ISiteRepository sites,
    ITemplateRepository templates)
{
    public const int SummaryMax = 200;

    public async Task<Result<DesignSuggestionDto>> Handle(SuggestDesign cmd, CancellationToken ct)
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

        var photo = await AiPhotos.PrepareAsync(optimizer, cmd.Photo, AiPhotos.DesignSide, ct);
        if (!photo.IsSuccess)
        {
            return photo.Error!;
        }

        var site = loaded.Value;
        var all = site.Schema.Fields;
        var fields = all.Where(f => TemplateAiFields.IsDesign(f) || TemplateAiFields.IsCopy(f)).ToList();
        if (fields.Count == 0)
        {
            return AiErrors.Failed;
        }

        var answer = await assistant.GenerateAsync(Request(site, fields, cmd.Note, string.IsNullOrEmpty(cmd.Language) ? site.Locale : cmd.Language, photo.Value), ct);
        if (!answer.IsSuccess)
        {
            return answer.Error!;
        }

        var patch = await TemplateAiFields.ToPatchAsync(site.Schema, fields, AiText.Field(answer.Value, "settings"), site.Current);
        if (patch.Count == 0)
        {
            return AiErrors.Failed;
        }

        var remaining = await quota.RecordAsync(businessId, ct);
        return new DesignSuggestionDto(
            JsonDocument.Parse(patch.ToJsonString()).RootElement.Clone(),
            AiText.Clean(AiText.Field(answer.Value, "summary"), SummaryMax),
            remaining);
    }

    private static AiRequest Request(AiSite site, IReadOnlyList<Templates.TemplateField> fields, string? note, string language, AiImage photo)
    {
        var input = new StringBuilder();
        site.Describe(input, language);
        if (!string.IsNullOrWhiteSpace(note))
        {
            input.AppendLine($"Owner's note: {note.Trim()}");
        }

        input.AppendLine("Current texts (often still the template's sample texts about another business):");
        foreach (var field in fields.Where(TemplateAiFields.IsCopy))
        {
            input.AppendLine($"- {field.Key}: {site.Current[field.Key]?.ToJsonString() ?? "(empty)"}");
        }

        var schema = new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["summary"] = new JsonObject { ["type"] = "string", ["maxLength"] = SummaryMax },
                ["settings"] = TemplateAiFields.Schema(fields, site.Schema.Fields),
            },
            ["required"] = new JsonArray("settings"),
        };

        return new AiRequest(AiTask.DesignFromPhoto, AiPrompts.Design(AiSite.LanguageName(language)), input.ToString(), [photo], schema, Temperature: 0.4);
    }
}
