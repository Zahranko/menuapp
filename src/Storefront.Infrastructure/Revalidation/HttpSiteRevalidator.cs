using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;

namespace Storefront.Infrastructure.Revalidation;

/// <summary>Settings under "Revalidation". Url is the Next.js endpoint (for example https://{domain}/api/revalidate).</summary>
public sealed class RevalidationOptions
{
    public const string SectionName = "Revalidation";

    public string? Url { get; set; }
    public string? Secret { get; set; }
}

/// <summary>POSTs {"tags":[...]} with header X-Storefront-Signature: hex HMAC-SHA256 of the exact body, keyed with the shared secret.</summary>
internal sealed class HttpSiteRevalidator(HttpClient http, IOptions<RevalidationOptions> options, ILogger<HttpSiteRevalidator> logger) : ISiteRevalidator
{
    public const string SignatureHeader = "X-Storefront-Signature";

    public async Task RevalidateAsync(IReadOnlyCollection<string> tags, CancellationToken ct)
    {
        var o = options.Value;
        if (string.IsNullOrWhiteSpace(o.Url))
        {
            logger.LogDebug("Revalidation URL not set; skipped tags {Tags}", tags);
            return;
        }

        var body = JsonSerializer.Serialize(new { tags });
        using var request = new HttpRequestMessage(HttpMethod.Post, o.Url)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };
        request.Headers.Add(SignatureHeader, Sign(body, o.Secret ?? ""));
        using var response = await http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
    }

    public static string Sign(string body, string secret) =>
        Convert.ToHexStringLower(HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(body)));
}
