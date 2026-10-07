using Storefront.Domain.Common;

namespace Storefront.Domain.Sites;

/// <summary>A business's design: the chosen template and its settings. Products and categories live in the catalog.</summary>
public sealed class Site : AggregateRoot, ITenantOwned
{
    private Site()
    {
    }

    public Guid BusinessId { get; private set; }
    public string TemplateId { get; private set; } = "";
    public string DraftSettings { get; private set; } = "{}";
    public string? PublishedSettings { get; private set; }
    public string? PublishedTemplateId { get; private set; }
    public DateTimeOffset? PublishedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public bool IsPublished => PublishedAt is not null;

    public static Site Create(Guid businessId, string templateId, string defaultSettings, DateTimeOffset now) => new()
    {
        BusinessId = businessId,
        TemplateId = templateId,
        DraftSettings = defaultSettings,
        UpdatedAt = now,
    };

    /// <summary>Switching template resets the draft to that template's defaults. The live site is unchanged until publish.</summary>
    public void ChangeTemplate(string templateId, string defaultSettings, DateTimeOffset now)
    {
        TemplateId = templateId;
        DraftSettings = defaultSettings;
        UpdatedAt = now;
    }

    public void SaveDraft(string settings, DateTimeOffset now)
    {
        DraftSettings = settings;
        UpdatedAt = now;
    }

    public void Publish(DateTimeOffset now)
    {
        PublishedSettings = DraftSettings;
        PublishedTemplateId = TemplateId;
        PublishedAt = now;
        UpdatedAt = now;
        Raise(new SitePublished(BusinessId, Id, TemplateId, now));
    }
}
