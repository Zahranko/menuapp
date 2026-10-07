namespace Storefront.Application.Abstractions;

/// <summary>docs/reserved-slugs.txt plus the brand's short name.</summary>
public interface IReservedSlugs
{
    IReadOnlySet<string> All { get; }
}
