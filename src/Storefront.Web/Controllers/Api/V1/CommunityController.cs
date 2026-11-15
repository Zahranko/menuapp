using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Storefront.Application.Community;
using Storefront.Application.Sites;
using Storefront.Web.Auth;
using Storefront.Web.Configuration;

namespace Storefront.Web.Controllers.Api.V1;

/// <summary>
/// Community templates for owners: the publisher profile, the owner's shared designs, and applying a design to their site.
/// Browsing is public (/api/public/v1/community).
/// </summary>
[Route("api/v1/community")]
[Authorize]
public sealed class CommunityController : ApiController
{
    /// <summary>The owner's publisher profile (404, code publisher.notFound, until they make one).</summary>
    [HttpGet("publisher")]
    [ProducesResponseType<PublisherDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PublisherDto>> Publisher([FromServices] GetMyPublisherHandler handler, CancellationToken ct) =>
        From(await handler.Handle(ct));

    /// <summary>Creates or updates the publisher profile. Making one needs the Pro plan (403, code community.pro). Usernames are unique (409).</summary>
    [HttpPut("publisher")]
    [ProducesResponseType<PublisherDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PublisherDto>> SavePublisher(SavePublisher request, [FromServices] SavePublisherHandler handler, CancellationToken ct) =>
        From(await handler.Handle(request, ct));

    /// <summary>Whether a username is free, for the live check under the field.</summary>
    [HttpGet("username-availability")]
    [EnableRateLimiting(RateLimits.SlugCheck)]
    public async Task<ActionResult<UsernameAvailability>> UsernameAvailability([FromQuery] string? username, [FromServices] UsernameAvailabilityHandler handler, CancellationToken ct)
    {
        var result = await handler.Handle(username, ct);
        return Ok(result.Message is null ? result : result with { Message = ApiLocalization.Text(result.Message) });
    }

    /// <summary>The templates the owner shared, newest first.</summary>
    [HttpGet("templates/mine")]
    [ProducesResponseType<IReadOnlyList<MyCommunityTemplateDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<MyCommunityTemplateDto>>> Mine([FromServices] ListMyCommunityTemplatesHandler handler, CancellationToken ct) =>
        From(await handler.Handle(ct));

    /// <summary>
    /// Shares the design of the owner's current Studio draft (colors, layout and style sheet; never texts, photos or hours).
    /// Needs Pro (403 community.pro) and a publisher profile (404 publisher.notFound); other templates can't be shared (400 community.studio).
    /// </summary>
    [HttpPost("templates")]
    [EnableRateLimiting(RateLimits.Community)]
    [ProducesResponseType<MyCommunityTemplateDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<MyCommunityTemplateDto>> Share(ShareCommunityTemplate request, [FromServices] ShareCommunityTemplateHandler handler, CancellationToken ct) =>
        From(await handler.Handle(request, ct));

    /// <summary>Renames a shared template, shows or hides it in the gallery, or (updateDesign) replaces its design with the current draft.</summary>
    [HttpPut("templates/{id:guid}")]
    [EnableRateLimiting(RateLimits.Community)]
    [ProducesResponseType<MyCommunityTemplateDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MyCommunityTemplateDto>> Update(Guid id, UpdateCommunityTemplate request, [FromServices] UpdateCommunityTemplateHandler handler, CancellationToken ct) =>
        From(await handler.Handle(id, request, ct));

    /// <summary>Removes a shared template. Sites that used it keep their design.</summary>
    [HttpDelete("templates/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(Guid id, [FromServices] DeleteCommunityTemplateHandler handler, CancellationToken ct) =>
        From(await handler.Handle(id, ct));

    /// <summary>
    /// Puts a community design on the owner's draft (the style sheet is checked again). The base template's plan rule applies
    /// (403 template.pro). The live site changes when the owner publishes.
    /// </summary>
    [HttpPost("templates/{code}/apply")]
    [EnableRateLimiting(RateLimits.Community)]
    [ProducesResponseType<SiteDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SiteDto>> Apply(string code, [FromServices] ApplyCommunityTemplateHandler handler, CancellationToken ct) =>
        From(await handler.Handle(code, ct));
}
