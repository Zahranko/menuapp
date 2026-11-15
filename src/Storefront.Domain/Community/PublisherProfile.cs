using System.Text.RegularExpressions;
using Storefront.Domain.Common;

namespace Storefront.Domain.Community;

/// <summary>
/// A business's public name in the community templates gallery. Owners make one before they publish a design there.
/// One per business; the username is unique across everyone and appears in links like {domain}/community/u/&lt;username&gt;.
/// </summary>
public sealed partial class PublisherProfile : Entity, ITenantOwned
{
    public const int UsernameMin = 3;
    public const int UsernameMax = 20;
    public const int DisplayNameMax = 40;
    public const int BioMax = 160;

    private PublisherProfile()
    {
    }

    public Guid BusinessId { get; private set; }

    /// <summary>Lowercase letters, digits and "_", 3 to 20 characters, starting with a letter.</summary>
    public string Username { get; private set; } = "";

    public string DisplayName { get; private set; } = "";

    public string? Bio { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public static PublisherProfile Create(Guid businessId, string username, string displayName, string? bio, IReadOnlySet<string> reserved, DateTimeOffset now)
    {
        var profile = new PublisherProfile { BusinessId = businessId, CreatedAt = now };
        profile.Update(username, displayName, bio, reserved, now);
        return profile;
    }

    public void Update(string username, string displayName, string? bio, IReadOnlySet<string> reserved, DateTimeOffset now)
    {
        Username = NormalizeUsername(username, reserved);
        var name = (displayName ?? "").Trim();
        if (name.Length is 0 or > DisplayNameMax)
        {
            throw new DomainException("publisher.displayName", "Use 1 to 40 characters for your name.", "displayName");
        }

        var about = string.IsNullOrWhiteSpace(bio) ? null : bio.Trim();
        if (about is { Length: > BioMax })
        {
            throw new DomainException("publisher.bio", "Use up to 160 characters.", "bio");
        }

        DisplayName = name;
        Bio = about;
        UpdatedAt = now;
    }

    /// <summary>The username in its stored form, or a <see cref="DomainException"/> saying what is wrong with it.</summary>
    public static string NormalizeUsername(string? value, IReadOnlySet<string> reserved)
    {
        var candidate = (value ?? "").Trim().TrimStart('@').ToLowerInvariant();
        if (candidate.Length is < UsernameMin or > UsernameMax || !UsernamePattern().IsMatch(candidate))
        {
            throw new DomainException("publisher.username", "Use 3 to 20 lowercase letters, numbers or _, starting with a letter.", "username");
        }

        if (reserved.Contains(candidate) || reserved.Contains(candidate.Replace("_", "", StringComparison.Ordinal)))
        {
            throw new DomainException("publisher.usernameReserved", "This username is not available.", "username");
        }

        return candidate;
    }

    [GeneratedRegex("^[a-z][a-z0-9_]+$")]
    private static partial Regex UsernamePattern();
}
