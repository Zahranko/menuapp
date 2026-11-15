using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Storefront.Application.Community;
using Storefront.Web.Auth;

namespace Storefront.Web.Controllers.Api.Public;

/// <summary>The community templates gallery, open to everyone (the website's gallery and share pages, and the app).</summary>
[ApiController]
[Route("api/public/v1/community")]
[AllowAnonymous]
[EnableRateLimiting(RateLimits.Public)]
[Produces("application/json")]
public sealed class PublicCommunityController : ControllerBase
{
    /// <summary>Listed templates, 24 a page: sort "popular" (most used, default) or "new"; q matches the name.</summary>
    [HttpGet("templates")]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
    [ProducesResponseType<CommunityPage>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CommunityPage>> Browse(
        [FromQuery] string? sort, [FromQuery] string? q, [FromQuery] int page, [FromServices] BrowseCommunityHandler handler, CancellationToken ct) =>
        Ok(await handler.Handle(sort, q, page <= 0 ? 1 : page, ct));

    /// <summary>One template by its share code, with its design settings (also unlisted ones: the link is the invitation).</summary>
    [HttpGet("templates/{code}")]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
    [ProducesResponseType<CommunityTemplateDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CommunityTemplateDetailDto>> Get(string code, [FromServices] GetCommunityTemplateHandler handler, CancellationToken ct) =>
        await handler.Handle(code, ct) is { } template ? Ok(template) : NotFound();

    /// <summary>A publisher and their listed templates.</summary>
    [HttpGet("publishers/{username}")]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
    [ProducesResponseType<PublisherPageDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PublisherPageDto>> Publisher(string username, [FromServices] GetPublisherPageHandler handler, CancellationToken ct) =>
        await handler.Handle(username, ct) is { } page ? Ok(page) : NotFound();
}
