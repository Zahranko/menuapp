using Storefront.Application.Abstractions;
using Storefront.Domain.Common;

namespace Storefront.Application.Accounts;

public sealed record SlugAvailabilityResponse(string Slug, bool Available, string? Suggestion, string? Message);

public sealed class SlugAvailabilityHandler(IBusinessRepository businesses, IReservedSlugs reserved)
{
    public async Task<SlugAvailabilityResponse> Handle(string? name, CancellationToken ct)
    {
        var slug = Slug.FromBusinessName(name ?? "");
        var problem = await ProblemAsync(slug, ct);
        if (problem is null)
        {
            return new SlugAvailabilityResponse(slug, true, null, null);
        }

        return new SlugAvailabilityResponse(slug, false, await SuggestAsync(slug, ct), problem);
    }

    /// <summary>Null when the slug can be registered, otherwise the message to show under the business name.</summary>
    public async Task<string?> ProblemAsync(string slug, CancellationToken ct)
    {
        if (slug.Length == 0)
        {
            return "Add at least one English letter or number for your link.";
        }

        if (slug.Length < Slug.MinLength)
        {
            return "Your link needs at least 3 English letters or numbers.";
        }

        if (reserved.All.Contains(slug) || await businesses.SlugExistsAsync(slug, ct))
        {
            return $"That link is taken. Try adding your city, like {Fit(slug, "amman")}.";
        }

        return null;
    }

    private async Task<string?> SuggestAsync(string slug, CancellationToken ct)
    {
        var stem = slug.Length == 0 ? "my" : slug;
        foreach (var suffix in new[] { "menu", "shop" }.Concat(Enumerable.Range(2, 98).Select(i => i.ToString())))
        {
            var candidate = Fit(stem, suffix);
            if (candidate.Length >= Slug.MinLength && !reserved.All.Contains(candidate) && !await businesses.SlugExistsAsync(candidate, ct))
            {
                return candidate;
            }
        }

        return null;
    }

    private static string Fit(string slug, string suffix) =>
        (slug.Length + suffix.Length > Slug.MaxLength ? slug[..(Slug.MaxLength - suffix.Length)] : slug) + suffix;
}
