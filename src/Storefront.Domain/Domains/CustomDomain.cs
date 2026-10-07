namespace Storefront.Domain.Domains;

/// <summary>An active custom domain mapping. Read by the TLS ask endpoint and the Next.js host lookup.</summary>
public sealed class CustomDomain
{
    private CustomDomain()
    {
    }

    public string Domain { get; private set; } = "";
    public Guid BusinessId { get; private set; }
    public DateTimeOffset ActivatedAt { get; private set; }

    public static CustomDomain Create(string domain, Guid businessId, DateTimeOffset now) =>
        new() { Domain = domain, BusinessId = businessId, ActivatedAt = now };
}
