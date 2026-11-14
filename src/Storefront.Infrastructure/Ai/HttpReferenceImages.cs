using System.Net;
using System.Net.Http.Headers;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Storefront.Application.Ai.Studio;
using Storefront.Application.Common;

namespace Storefront.Infrastructure.Ai;

/// <summary>
/// Opens a link the owner sends to the AI design studio and returns a reference picture: the picture itself, or for a web page
/// its preview picture (og:image or twitter:image, what apps show when the page is shared). Only public internet addresses
/// are reached: every connection is checked when it is made (<see cref="ConnectPublicOnlyAsync"/>), redirects are followed by
/// hand (3 at most) and checked the same way, pictures may be 5 MB and pages 512 KB, and the whole fetch has a time limit.
/// </summary>
public sealed partial class HttpReferenceImages(HttpClient http, ILogger<HttpReferenceImages> logger) : IReferenceImages
{
    public const int MaxImageBytes = 5 * 1024 * 1024;
    public const int MaxPageBytes = 512 * 1024;
    private const int MaxRedirects = 3;

    public async Task<Result<byte[]>> FetchAsync(Uri url, CancellationToken ct)
    {
        try
        {
            using var response = await GetAsync(url, ct);
            if (response is null)
            {
                return StudioErrors.BadLink;
            }

            if (IsImage(response))
            {
                return await ReadAsync(response, MaxImageBytes, truncate: false, ct) is { } picture ? picture : StudioErrors.BadLink;
            }

            if (!IsPage(response) || await ReadAsync(response, MaxPageBytes, truncate: true, ct) is not { } page
                || PreviewImage(Encoding.UTF8.GetString(page), response.RequestMessage?.RequestUri ?? url) is not { } preview)
            {
                return StudioErrors.BadLink;
            }

            using var image = await GetAsync(preview, ct);
            return image is not null && IsImage(image) && await ReadAsync(image, MaxImageBytes, truncate: false, ct) is { } bytes
                ? bytes
                : StudioErrors.BadLink;
        }
        catch (Exception e) when (e is HttpRequestException or TaskCanceledException or IOException or SocketException or UriFormatException)
        {
            logger.LogInformation("A studio reference link could not be opened: {Error}", e.GetType().Name);
            return StudioErrors.BadLink;
        }
    }

    /// <summary>The response for the address, following redirects by hand; null for an error status or too many redirects.</summary>
    private async Task<HttpResponseMessage?> GetAsync(Uri url, CancellationToken ct)
    {
        for (var hop = 0; hop <= MaxRedirects; hop++)
        {
            if (url.Scheme is not ("https" or "http"))
            {
                return null;
            }

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Accept.ParseAdd("image/*,text/html;q=0.9");
            var response = await http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
            if ((int)response.StatusCode is >= 300 and < 400 && response.Headers.Location is { } next)
            {
                url = next.IsAbsoluteUri ? next : new Uri(url, next);
                response.Dispose();
                continue;
            }

            if (!response.IsSuccessStatusCode)
            {
                response.Dispose();
                return null;
            }

            return response;
        }

        return null;
    }

    private static bool IsImage(HttpResponseMessage response) =>
        response.Content.Headers.ContentType?.MediaType?.StartsWith("image/", StringComparison.OrdinalIgnoreCase) == true;

    private static bool IsPage(HttpResponseMessage response) =>
        response.Content.Headers.ContentType?.MediaType is { } type
        && (type.Equals("text/html", StringComparison.OrdinalIgnoreCase) || type.Equals("application/xhtml+xml", StringComparison.OrdinalIgnoreCase));

    /// <summary>The body, up to <paramref name="max"/> bytes: longer bodies are cut (pages) or refused (pictures, null).</summary>
    private static async Task<byte[]?> ReadAsync(HttpResponseMessage response, int max, bool truncate, CancellationToken ct)
    {
        if (!truncate && response.Content.Headers.ContentLength > max)
        {
            return null;
        }

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var buffer = new MemoryStream();
        var chunk = new byte[81920];
        int read;
        while ((read = await stream.ReadAsync(chunk, ct)) > 0)
        {
            if (buffer.Length + read > max)
            {
                if (!truncate)
                {
                    return null;
                }

                buffer.Write(chunk, 0, (int)(max - buffer.Length));
                break;
            }

            buffer.Write(chunk, 0, read);
        }

        return buffer.ToArray();
    }

    /// <summary>The page's preview picture (og:image, then twitter:image), as an absolute address; null when it has none.</summary>
    public static Uri? PreviewImage(string html, Uri page)
    {
        string? twitter = null;
        foreach (Match tag in MetaTags().Matches(html))
        {
            string? name = null;
            string? content = null;
            foreach (Match attribute in Attributes().Matches(tag.Value))
            {
                var value = attribute.Groups[3].Success ? attribute.Groups[3].Value : attribute.Groups[4].Value;
                switch (attribute.Groups[1].Value.ToLowerInvariant())
                {
                    case "property" or "name":
                        name = value.Trim().ToLowerInvariant();
                        break;
                    case "content":
                        content = WebUtility.HtmlDecode(value).Trim();
                        break;
                }
            }

            if (string.IsNullOrEmpty(content))
            {
                continue;
            }

            if (name is "og:image" or "og:image:url" or "og:image:secure_url")
            {
                return Resolve(content, page);
            }

            if (name is "twitter:image" or "twitter:image:src")
            {
                twitter ??= content;
            }
        }

        return twitter is null ? null : Resolve(twitter, page);
    }

    private static Uri? Resolve(string address, Uri page) =>
        Uri.TryCreate(page, address, out var url) && url.Scheme is "https" or "http" ? url : null;

    /// <summary>
    /// Connects only to public internet addresses, checked at the moment of connecting (so a name that later points somewhere
    /// else can't reach the server's own network): no loopback, private, link-local, shared, multicast or reserved addresses.
    /// </summary>
    public static async ValueTask<Stream> ConnectPublicOnlyAsync(SocketsHttpConnectionContext context, CancellationToken ct)
    {
        var addresses = await Dns.GetHostAddressesAsync(context.DnsEndPoint.Host, ct);
        if (addresses.Length == 0 || !addresses.All(IsPublic))
        {
            throw new HttpRequestException("The link does not point to a public internet address.");
        }

        var socket = new Socket(SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
        try
        {
            await socket.ConnectAsync(new IPEndPoint(addresses[0], context.DnsEndPoint.Port), ct);
            return new NetworkStream(socket, ownsSocket: true);
        }
        catch
        {
            socket.Dispose();
            throw;
        }
    }

    /// <summary>True for an address on the public internet.</summary>
    public static bool IsPublic(IPAddress address)
    {
        if (address.IsIPv4MappedToIPv6)
        {
            address = address.MapToIPv4();
        }

        if (IPAddress.IsLoopback(address) || address.Equals(IPAddress.Any) || address.Equals(IPAddress.IPv6Any) || address.Equals(IPAddress.None))
        {
            return false;
        }

        if (address.AddressFamily == AddressFamily.InterNetworkV6)
        {
            var first = address.GetAddressBytes()[0];
            return !(address.IsIPv6LinkLocal || address.IsIPv6SiteLocal || address.IsIPv6Multicast || address.IsIPv6Teredo || (first & 0xFE) == 0xFC);
        }

        var b = address.GetAddressBytes();
        return !(b[0] == 0 || b[0] == 10 || b[0] == 127 || b[0] >= 224
            || (b[0] == 100 && b[1] >= 64 && b[1] <= 127)
            || (b[0] == 169 && b[1] == 254)
            || (b[0] == 172 && b[1] >= 16 && b[1] <= 31)
            || (b[0] == 192 && b[1] == 0 && b[2] == 0)
            || (b[0] == 192 && b[1] == 168)
            || (b[0] == 198 && b[1] >= 18 && b[1] <= 19));
    }

    [GeneratedRegex(@"<meta\b[^>]*>", RegexOptions.IgnoreCase)]
    private static partial Regex MetaTags();

    [GeneratedRegex("""([a-zA-Z][\w:-]*)\s*=\s*("([^"]*)"|'([^']*)')""")]
    private static partial Regex Attributes();
}
