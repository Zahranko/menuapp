using System.Security.Cryptography;
using Storefront.Domain.Common;

namespace Storefront.Domain.Community;

/// <summary>
/// A design a Pro owner shared in the community templates gallery: the design settings of their Studio site
/// (colors, layout choices and the AI style sheet), never their texts, photos or hours. Anyone can browse it and,
/// when their plan allows the base template, apply it to their own site. <see cref="Code"/> is the share link's id.
/// </summary>
public sealed class CommunityTemplate : Entity, ITenantOwned
{
    public const int NameMin = 3;
    public const int NameMax = 40;
    public const int DescriptionMax = 200;
    public const int CodeLength = 8;

    /// <summary>No 0/o, 1/l/i, so a code read aloud or typed from a screenshot comes out right.</summary>
    private const string CodeAlphabet = "abcdefghjkmnpqrstuvwxyz23456789";

    private CommunityTemplate()
    {
    }

    /// <summary>The publishing business. Tenant-filtered for the owner's own list; the gallery reads across businesses.</summary>
    public Guid BusinessId { get; private set; }

    public Guid PublisherId { get; private set; }

    public string Code { get; private set; } = "";

    /// <summary>The template the design is for (a template with a "css" setting, like Studio).</summary>
    public string BaseTemplateId { get; private set; } = "";

    public string Name { get; private set; } = "";

    public string? Description { get; private set; }

    /// <summary>JSON object of the shared design settings, checked against the base template's schema.</summary>
    public string Settings { get; private set; } = "{}";

    /// <summary>How many other businesses applied it.</summary>
    public int Uses { get; private set; }

    public bool IsListed { get; private set; } = true;

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public static CommunityTemplate Create(Guid businessId, Guid publisherId, string baseTemplateId, string name, string? description, string settings, DateTimeOffset now)
    {
        var template = new CommunityTemplate
        {
            BusinessId = businessId,
            PublisherId = publisherId,
            Code = NewCode(),
            CreatedAt = now,
        };
        template.Rename(name, description, now);
        template.SetDesign(baseTemplateId, settings, now);
        return template;
    }

    public void Rename(string name, string? description, DateTimeOffset now)
    {
        var trimmed = (name ?? "").Trim();
        if (trimmed.Length is < NameMin or > NameMax)
        {
            throw new DomainException("community.name", "Use 3 to 40 characters for the name.", "name");
        }

        var about = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        if (about is { Length: > DescriptionMax })
        {
            throw new DomainException("community.description", "Use up to 200 characters.", "description");
        }

        Name = trimmed;
        Description = about;
        UpdatedAt = now;
    }

    /// <summary>Replaces the shared design (the publisher updated it from their site).</summary>
    public void SetDesign(string baseTemplateId, string settings, DateTimeOffset now)
    {
        BaseTemplateId = baseTemplateId;
        Settings = settings;
        UpdatedAt = now;
    }

    public void SetListed(bool listed, DateTimeOffset now)
    {
        IsListed = listed;
        UpdatedAt = now;
    }

    public void CountUse() => Uses++;

    /// <summary>A new random share code, like "k7m2p9xq".</summary>
    public static string NewCode() => RandomNumberGenerator.GetString(CodeAlphabet, CodeLength);

    /// <summary>True when <paramref name="code"/> could be a share code (so made-up ones never reach the database).</summary>
    public static bool LooksLikeCode(string? code) =>
        code is { Length: CodeLength } && code.All(c => CodeAlphabet.Contains(c, StringComparison.Ordinal));
}
