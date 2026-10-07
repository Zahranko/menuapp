using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Net.Http.Headers;
using Storefront.Application.PublicSites;
using Storefront.Web.Auth;

namespace Storefront.Web.Controllers.Api.Public;

/// <summary>Anonymous, cacheable reads for the Next.js app. Only published designs, only categories that have products.</summary>
[ApiController]
[Route("api/public/v1")]
[AllowAnonymous]
[EnableRateLimiting(RateLimits.Public)]
[Produces("application/json")]
public sealed class PublicSitesController(PublicSiteHandler handler) : ControllerBase
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    [HttpGet("sites/by-slug/{slug}")]
    [ProducesResponseType<PublicSiteDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BySlug(string slug, CancellationToken ct) =>
        Cached(await handler.BySlug(slug, ct));

    [HttpGet("sites/by-host/{host}")]
    [ProducesResponseType<PublicSiteDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ByHost(string host, CancellationToken ct) =>
        Cached(await handler.ByHost(host, ct));

    /// <summary>The draft design, for the editor's preview. Never cached.</summary>
    [HttpGet("preview/{token}")]
    [ProducesResponseType<PublicSiteDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Preview(string token, CancellationToken ct)
    {
        var site = await handler.Preview(token, ct);
        Response.Headers.CacheControl = "no-store";
        return site is null ? NotFound() : new JsonResult(site, Json);
    }

    private IActionResult Cached(PublicSiteDto? site)
    {
        if (site is null)
        {
            Response.Headers.CacheControl = "public, max-age=30";
            return NotFound();
        }

        var body = JsonSerializer.SerializeToUtf8Bytes(site, Json);
        var etag = new EntityTagHeaderValue($"\"{Convert.ToHexStringLower(SHA256.HashData(body))[..32]}\"");
        Response.Headers.CacheControl = "public, max-age=60, stale-while-revalidate=300";
        Response.Headers.ETag = etag.ToString();

        if (Request.GetTypedHeaders().IfNoneMatch.Any(tag => tag.Compare(etag, useStrongComparison: false)))
        {
            return StatusCode(StatusCodes.Status304NotModified);
        }

        return File(body, "application/json");
    }
}
