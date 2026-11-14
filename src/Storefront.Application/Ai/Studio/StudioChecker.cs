using Storefront.Application.Abstractions;
using Storefront.Application.Billing;
using Storefront.Application.Common;
using Storefront.Application.Templates;
using Storefront.Domain.Ai;

namespace Storefront.Application.Ai.Studio;

/// <summary>
/// Gets a reference picture from a link the owner sends to the design studio: the picture itself when the link is a picture,
/// or the picture a web page shows when it is shared (its preview image). Only public web addresses are opened, with a size
/// and time limit. Errors: <see cref="StudioErrors.BadLink"/>.
/// </summary>
public interface IReferenceImages
{
    Task<Result<byte[]>> FetchAsync(Uri url, CancellationToken ct);
}

public static class StudioErrors
{
    public static readonly Error NeedsPro = Error.Forbidden("studio.pro", "The design studio is part of the Pro plan. Upgrade to Pro to use it.");

    public static readonly Error NewDesignLimit = Error.LimitReached(
        "studio.limit", $"You've made {StudioChecker.NewDesignsPerMonth} new designs this month. You can still change your design in the chat.");

    public static readonly Error BadLink = Error.Validation(
        "studio.link", "We couldn't open a picture at this link. Try another link, or send a screenshot instead.", "referenceUrl");

    public static readonly Error LinkNeedsStudio = Error.Validation(
        "studio.template", "Links to pictures work with the Studio template. Switch to Studio first.", "referenceUrl");
}

/// <summary>
/// The AI design studio's rules for a Studio site (a template with a "css" field, the style sheet the design agent writes):
/// only a live Pro plan may use it, a whole new design counts against <see cref="NewDesignsPerMonth"/>, and a link the owner
/// sends becomes a reference picture.
/// </summary>
public sealed class StudioChecker(PlanChecker plans, IAiUsageRepository usage, IClock clock, IReferenceImages references, IImageOptimizer optimizer)
{
    public const int NewDesignsPerMonth = 10;
    public const string CssKey = "studio.css";

    /// <summary>True when the template is a Studio template: it has the design agent's style sheet.</summary>
    public static bool IsStudio(TemplateSchema schema) => schema.Fields.Any(f => f.Key == CssKey && f.Type == "css");

    /// <summary>The longest style sheet the template takes.</summary>
    public static int? CssMax(TemplateSchema schema) => schema.Fields.FirstOrDefault(f => f.Key == CssKey)?.Max;

    public Task<bool> IsProAsync(Guid businessId, CancellationToken ct) => plans.IsProAsync(businessId, ct);

    public async Task<int> NewDesignsLeftAsync(Guid businessId, CancellationToken ct) =>
        Math.Max(0, NewDesignsPerMonth - await usage.CountAsync(businessId, AiUsage.StudioPeriodOf(clock.UtcNow), ct));

    public Task CountNewDesignAsync(Guid businessId, CancellationToken ct) =>
        usage.IncrementAsync(businessId, AiUsage.StudioPeriodOf(clock.UtcNow), clock.UtcNow, ct);

    /// <summary>The picture at the link, shrunk and cleaned like an uploaded photo.</summary>
    public async Task<Result<AiImage>> ReferenceAsync(string link, CancellationToken ct)
    {
        if (!Uri.TryCreate(link.Trim(), UriKind.Absolute, out var url) || url.Scheme is not ("https" or "http"))
        {
            return StudioErrors.BadLink;
        }

        var bytes = await references.FetchAsync(url, ct);
        if (!bytes.IsSuccess)
        {
            return bytes.Error!;
        }

        using var stream = new MemoryStream(bytes.Value);
        var image = await AiPhotos.PrepareAsync(optimizer, new AiPhoto(stream, bytes.Value.Length), AiPhotos.DesignSide, ct);
        return image.IsSuccess ? image : StudioErrors.BadLink;
    }
}
